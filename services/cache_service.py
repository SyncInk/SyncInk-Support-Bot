from typing import Any, Optional, Dict
from utils.logger import log

class CacheService:
    """
    Abstracted caching layer. 
    Currently uses an in-memory dictionary.
    Can be seamlessly swapped to Redis in the future by updating this class.
    """
    _cache: Dict[str, Any] = {}

    @classmethod
    async def get(cls, key: str) -> Optional[Any]:
        return cls._cache.get(key)

    @classmethod
    async def set(cls, key: str, value: Any, expire_seconds: int = 3600):
        # Memory cache ignores expiration for this MVP, but interface supports it.
        cls._cache[key] = value

    @classmethod
    async def delete(cls, key: str):
        if key in cls._cache:
            del cls._cache[key]

    @classmethod
    async def clear(cls):
        cls._cache.clear()
        log.info("Central cache cleared.")
