"""Utility for cleanly restarting the current exo process.

Spawns a replacement process and exits the current one. The OS reclaims
all GPU/Metal memory when the old process exits, and the new process
takes over the port after a brief delay.
"""

import os
import subprocess
import sys
import threading

from loguru import logger

_restart_scheduled = False
_restart_lock = threading.Lock()


def schedule_restart(delay: float = 1.0) -> bool:
    """Schedule a process restart after *delay* seconds.

    Returns True if a restart was scheduled, False if one is already pending.
    The restart spawns a new exo process, waits briefly for it to start,
    then hard-exits the current process. If spawning the replacement fails,
    the current process is left running.
    """
    global _restart_scheduled
    with _restart_lock:
        if _restart_scheduled:
            return False
        _restart_scheduled = True

    def _do_restart() -> None:
        import time

        time.sleep(delay)
        try:
            subprocess.Popen(
                [sys.executable, *sys.argv],
                start_new_session=True,
            )
        except Exception as exc:
            # If we can't spawn the replacement, don't kill the current process
            global _restart_scheduled
            logger.error(f"Failed to spawn replacement process: {exc}")
            with _restart_lock:
                _restart_scheduled = False
            return
        time.sleep(0.5)
        os._exit(0)

    threading.Thread(target=_do_restart, daemon=True).start()
    return True
