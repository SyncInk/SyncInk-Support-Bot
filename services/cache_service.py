import time
from typing import Any, Optional, Dict, Tuple
from utils.logger import log

class CacheService:
    """
    Abstracted caching layer with TTL support. 
    Uses an in-memory dictionary with timestamp expiration.
    Can be seamlessly swapped to Redis in the future by updating this class.
    """
    _cache: Dict[str, Tuple[Any, Optional[float]]] = {}

    @classmethod
    async def get(cls, key: str) -> Optional[Any]:
        if key not in cls._cache:
            return None
        val, expire_at = cls._cache[key]
        if expire_at is not None and time.time() > expire_at:
            del cls._cache[key]
            return None
        return val

    @classmethod
    async def set(cls, key: str, value: Any, expire_seconds: int = 10):
        expire_at = time.time() + expire_seconds if expire_seconds > 0 else None
        cls._cache[key] = (value, expire_at)

    @classmethod
    async def delete(cls, key: str):
        if key in cls._cache:
            del cls._cache[key]

    @classmethod
    async def clear(cls):
        cls._cache.clear()
        log.info("Central cache cleared.")
