from database import db
from typing import Optional, Dict, Any
from services.cache_service import CacheService

class SettingsService:
    """Service layer for guild configuration. Can be used by Bot and Dashboard."""
    
    @staticmethod
    async def get_guild_settings(guild_id: int) -> Dict[str, Any]:
        """Fetches settings for a guild, returning a dictionary. Uses cache."""
        cache_key = f"guild_settings_{guild_id}"
        cached = await CacheService.get(cache_key)
        if cached:
            return cached
            
        record = await db.fetchrow("SELECT * FROM guild_settings WHERE guild_id = $1", guild_id)
        if not record:
            # Insert default row
            await db.execute("INSERT INTO guild_settings (guild_id) VALUES ($1) ON CONFLICT DO NOTHING", guild_id)
            record = await db.fetchrow("SELECT * FROM guild_settings WHERE guild_id = $1", guild_id)
            
        settings_dict = dict(record) if record else {}
        await CacheService.set(cache_key, settings_dict)
        return settings_dict

    @staticmethod
    async def update_setting(guild_id: int, key: str, value: Any) -> bool:
        """Updates a specific setting for a guild and invalidates the cache."""
        allowed_keys = [
            "welcome_channel_id", "log_channel_id", "autorole_id", 
            "verification_enabled", "verification_role_id", "unverified_role_id",
            "verification_channel_id", "require_verification", "account_age_requirement",
            "anti_raid", "anti_spam", "welcome_message", "dm_welcome", "auto_delete_welcome",
            "log_channel_message", "log_channel_member", "log_channel_moderation",
            "log_channel_role", "log_channel_channel", "log_channel_voice",
            "log_channel_verification", "log_channel_server", "log_channel_appeals",
            "automod_enabled", "automod_log_channel_id", "jail_role_id",
            "jail_channel_id", "appeal_channel_id", "emergency_mode",
            "point_decay_rate", "point_decay_hours", "spam_threshold", "mention_threshold"
        ]
        if key not in allowed_keys:
            raise ValueError(f"Invalid setting key: {key}")
            
        await db.execute(
            f"INSERT INTO guild_settings (guild_id, {key}) VALUES ($1, $2) "
            f"ON CONFLICT (guild_id) DO UPDATE SET {key} = $2;",
            guild_id, value
        )
        
        # Invalidate cache
        await CacheService.delete(f"guild_settings_{guild_id}")
        return True
