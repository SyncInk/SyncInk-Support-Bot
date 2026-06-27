from database import db
from services.cache_service import CacheService

class FeatureService:
    """Service layer for evaluating feature flags."""
    
    @staticmethod
    async def is_enabled(flag_name: str, guild_id: int = None) -> bool:
        """
        Checks if a feature is enabled.
        If a guild overrides the flag, the guild setting takes precedence.
        Otherwise, falls back to the global flag.
        """
        cache_key = f"flag_{flag_name}_{guild_id}"
        cached = await CacheService.get(cache_key)
        if cached is not None:
            return cached
            
        # Check guild specific first
        if guild_id:
            guild_flag = await db.fetchrow("SELECT is_enabled FROM guild_feature_flags WHERE guild_id = $1 AND flag_name = $2", guild_id, flag_name)
            if guild_flag:
                await CacheService.set(cache_key, guild_flag['is_enabled'])
                return guild_flag['is_enabled']
                
        # Check global flag
        global_flag = await db.fetchrow("SELECT is_enabled FROM feature_flags WHERE flag_name = $1", flag_name)
        result = global_flag['is_enabled'] if global_flag else False
        
        await CacheService.set(cache_key, result)
        return result
