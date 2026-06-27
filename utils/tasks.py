import asyncio
import traceback
from typing import Callable, Dict, Any
from utils.logger import log

class TaskManager:
    """Manages background tasks with automatic recovery and monitoring."""
    
    def __init__(self):
        self._tasks: Dict[str, asyncio.Task] = {}
        self._status: Dict[str, Dict[str, Any]] = {}

    def start(self, name: str, coro: Callable, interval: int = 60):
        """Starts a background loop that executes `coro` every `interval` seconds."""
        if name in self._tasks and not self._tasks[name].done():
            log.warning(f"Task {name} is already running.")
            return

        self._status[name] = {"runs": 0, "errors": 0, "last_run": None, "status": "running"}
        
        async def _loop():
            while True:
                try:
                    await coro()
                    self._status[name]["runs"] += 1
                    self._status[name]["status"] = "running"
                except asyncio.CancelledError:
                    self._status[name]["status"] = "cancelled"
                    break
                except Exception as e:
                    self._status[name]["errors"] += 1
                    self._status[name]["status"] = "error"
                    log.error(f"Background task {name} failed: {e}")
                    traceback.print_exc()
                    
                await asyncio.sleep(interval)

        self._tasks[name] = asyncio.create_task(_loop(), name=name)
        log.info(f"Started background task: {name}")

    def cancel_all(self):
        """Cancels all managed tasks gracefully."""
        for name, task in self._tasks.items():
            task.cancel()
            log.info(f"Cancelled task: {name}")

    def get_status(self) -> Dict[str, Dict[str, Any]]:
        return self._status

task_manager = TaskManager()
