import time
from typing import Dict, Any

class MetricsTracker:
    """In-memory tracker for platform statistics."""
    
    def __init__(self):
        self.commands_executed = 0
        self.errors_raised = 0
        self.suggestions_submitted = 0
        self.moderation_actions = 0
        self._command_times = []
        
    def record_command(self, execution_time_ms: float):
        self.commands_executed += 1
        self._command_times.append(execution_time_ms)
        # Keep last 100 times to prevent memory leak
        if len(self._command_times) > 100:
            self._command_times.pop(0)
            
    def record_error(self):
        self.errors_raised += 1
        
    def record_suggestion(self):
        self.suggestions_submitted += 1
        
    def record_moderation(self):
        self.moderation_actions += 1
        
    @property
    def avg_command_time(self) -> float:
        if not self._command_times:
            return 0.0
        return sum(self._command_times) / len(self._command_times)

metrics = MetricsTracker()
