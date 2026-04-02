"""Utility for cleanly restarting the current exo process.

Uses os.execv to replace the current process image with a fresh one.
This guarantees the old process releases its port before the new one
binds, and the OS reclaims all GPU/Metal memory.
"""

import os
import sys
import threading

from loguru import logger

_restart_scheduled = False
_restart_lock = threading.Lock()


def schedule_restart(delay: float = 1.0) -> bool:
    """Schedule a process restart after *delay* seconds.

    Returns True if a restart was scheduled, False if one is already pending.
    After the delay, replaces the current process via os.execv. If execv
    fails, the current process is left running and the guard is reset.
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
            # Replace the current process image. This never returns on
            # success — the OS releases the port and all GPU memory as
            # part of the exec, then the new process binds fresh.
            os.execv(sys.executable, [sys.executable, *sys.argv])
        except Exception as exc:
            # If we can't exec the replacement, keep the current process alive
            global _restart_scheduled
            logger.error(f"Failed to exec replacement process: {exc}")
            with _restart_lock:
                _restart_scheduled = False

    threading.Thread(target=_do_restart, daemon=True).start()
    return True
