class SyncInkException(Exception):
    """Base exception for all custom SyncInk exceptions."""
    pass

class DatabaseError(SyncInkException):
    """Raised when a database operation fails."""
    pass

class ConfigurationError(SyncInkException):
    """Raised when there is a missing or invalid configuration on startup."""
    pass

class UserFacingError(SyncInkException):
    """Raised when an operation fails and the user should be notified with a friendly message."""
    def __init__(self, message: str):
        super().__init__(message)
        self.message = message
