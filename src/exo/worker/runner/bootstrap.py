import gc
import os
import resource
import signal
import sys

import loguru

from exo.shared.types.events import Event, RunnerStatusUpdated
from exo.shared.types.tasks import Task, TaskId
from exo.shared.types.worker.instances import BoundInstance
from exo.shared.types.worker.runners import RunnerFailed
from exo.utils.channels import ClosedResourceError, MpReceiver, MpSender

logger: "loguru.Logger" = loguru.logger

# Set by signal handler so the layer-by-layer loading loop can bail early.
shutdown_requested: bool = False


def _release_metal_resources() -> None:
    """Best-effort release of Metal/MLX resources before process exit.

    Clears the MLX buffer cache and runs garbage collection so that Metal
    wired memory is returned to the OS instead of leaking when the runner
    subprocess is terminated mid-load.
    """
    try:
        import mlx.core as mx

        mx.clear_cache()
    except Exception:
        pass
    gc.collect()


def _metal_cleanup_signal_handler(signum: int, _frame: object) -> None:
    """Handle SIGTERM/SIGINT by cleaning up Metal resources, then exiting."""
    global shutdown_requested
    shutdown_requested = True
    logger.info(f"Runner received signal {signum}, releasing Metal resources")
    _release_metal_resources()
    sys.exit(128 + signum)


def entrypoint(
    bound_instance: BoundInstance,
    event_sender: MpSender[Event],
    task_receiver: MpReceiver[Task],
    cancel_receiver: MpReceiver[TaskId],
    _logger: "loguru.Logger",
) -> None:
    global logger
    logger = _logger

    # Install signal handlers so that SIGTERM/SIGINT from the supervisor
    # triggers Metal cleanup instead of an abrupt death that leaks wired RAM.
    signal.signal(signal.SIGTERM, _metal_cleanup_signal_handler)
    signal.signal(signal.SIGINT, _metal_cleanup_signal_handler)

    soft, hard = resource.getrlimit(resource.RLIMIT_NOFILE)
    resource.setrlimit(resource.RLIMIT_NOFILE, (min(max(soft, 2048), hard), hard))

    fast_synch_override = os.environ.get("EXO_FAST_SYNCH")
    if fast_synch_override != "off":
        os.environ["MLX_METAL_FAST_SYNCH"] = "1"
    else:
        os.environ["MLX_METAL_FAST_SYNCH"] = "0"

    logger.info(f"Fast synch flag: {os.environ['MLX_METAL_FAST_SYNCH']}")

    # Import main after setting global logger - this lets us just import logger from this module
    try:
        if bound_instance.is_image_model:
            from exo.worker.runner.image_models.runner import Runner as ImageRunner

            runner = ImageRunner(
                bound_instance, event_sender, task_receiver, cancel_receiver
            )
            runner.main()
        elif bound_instance.is_embedding_model:
            from exo.worker.runner.embeddings.runner import Runner as EmbeddingRunner

            runner = EmbeddingRunner(
                bound_instance, event_sender, task_receiver, cancel_receiver
            )
            runner.main()
        else:
            from exo.worker.engines.mlx.patches import apply_mlx_patches
            from exo.worker.runner.llm_inference.runner import Runner

            apply_mlx_patches()

            runner = Runner(
                bound_instance, event_sender, task_receiver, cancel_receiver
            )
            runner.main()

    except ClosedResourceError:
        logger.warning("Runner communication closed unexpectedly")
    except SystemExit:
        # Raised by our signal handler — Metal cleanup already done.
        logger.info("Runner exiting after signal cleanup")
    except Exception as e:
        logger.opt(exception=e).warning(
            f"Runner {bound_instance.bound_runner_id} crashed with critical exception {e}"
        )
        event_sender.send(
            RunnerStatusUpdated(
                runner_id=bound_instance.bound_runner_id,
                runner_status=RunnerFailed(error_message=str(e)),
            )
        )
    finally:
        # Safety net: release Metal resources on any exit path, even if the
        # signal handler didn't fire (e.g. parent was SIGKILL'd and we got
        # a broken pipe, or an unexpected exception during load).
        _release_metal_resources()
        try:
            event_sender.close()
            task_receiver.close()
        finally:
            event_sender.join()
            task_receiver.join()
            logger.info("bye from the runner")
