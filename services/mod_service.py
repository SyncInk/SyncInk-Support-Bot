from database import db
from typing import List, Dict, Any

class ModService:
    """Service layer for moderation actions."""
    
    @staticmethod
    async def log_case(guild_id: int, user_id: int, mod_id: int, action: str, reason: str) -> int:
        """Logs a moderation case to the database and returns the new case_id."""
        query = """
            INSERT INTO mod_cases (guild_id, user_id, mod_id, action, reason) 
            VALUES ($1, $2, $3, $4, $5) 
            RETURNING case_id;
        """
        result = await db.fetchrow(query, guild_id, user_id, mod_id, action, reason)
        return result['case_id']
        
    @staticmethod
    async def get_user_cases(guild_id: int, user_id: int) -> List[Dict[str, Any]]:
        """Fetches all moderation cases for a specific user in a guild."""
        records = await db.fetch("SELECT * FROM mod_cases WHERE guild_id = $1 AND user_id = $2 ORDER BY created_at DESC", guild_id, user_id)
        return [dict(r) for r in records]
