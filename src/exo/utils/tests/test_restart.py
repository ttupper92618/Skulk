# pyright: reportUnusedFunction=false, reportAny=false, reportPrivateUsage=false
"""Tests for exo.utils.restart — process restart scheduling."""

from unittest.mock import MagicMock, patch

from exo.utils import restart


def _reset_restart_state() -> None:
    """Reset the module-level restart guard between tests."""
    with restart._restart_lock:
        restart._restart_scheduled = False


def test_schedule_restart_spawns_process_and_exits() -> None:
    """schedule_restart should Popen a new process and call os._exit."""
    _reset_restart_state()

    with (
        patch.object(restart.subprocess, "Popen") as mock_popen,
        patch.object(restart.os, "_exit") as mock_exit,
        patch.object(restart.threading, "Thread") as mock_thread_cls,
    ):
        # Capture the target function so we can run it synchronously
        mock_thread = MagicMock()
        mock_thread_cls.return_value = mock_thread

        result = restart.schedule_restart(delay=0)
        assert result is True
        mock_thread.start.assert_called_once()

        # Extract and run the restart function directly (skip the sleep)
        target_fn = mock_thread_cls.call_args[1]["target"]
        with patch("time.sleep"):
            target_fn()

        mock_popen.assert_called_once()
        mock_exit.assert_called_once_with(0)


def test_schedule_restart_idempotent() -> None:
    """Calling schedule_restart twice should return False the second time."""
    _reset_restart_state()

    with patch.object(restart.threading, "Thread") as mock_thread_cls:
        mock_thread = MagicMock()
        mock_thread_cls.return_value = mock_thread

        assert restart.schedule_restart(delay=0) is True
        assert restart.schedule_restart(delay=0) is False
        # Only one thread should have been created
        assert mock_thread_cls.call_count == 1


def test_schedule_restart_recovers_on_popen_failure() -> None:
    """If Popen fails, os._exit should NOT be called and the guard should reset."""
    _reset_restart_state()

    with (
        patch.object(
            restart.subprocess, "Popen", side_effect=OSError("spawn failed")
        ) as mock_popen,
        patch.object(restart.os, "_exit") as mock_exit,
        patch.object(restart.threading, "Thread") as mock_thread_cls,
    ):
        mock_thread = MagicMock()
        mock_thread_cls.return_value = mock_thread

        restart.schedule_restart(delay=0)

        # Run the target function
        target_fn = mock_thread_cls.call_args[1]["target"]
        with patch("time.sleep"):
            target_fn()

        mock_popen.assert_called_once()
        mock_exit.assert_not_called()

        # Guard should be reset so we can schedule again
        assert not restart._restart_scheduled
