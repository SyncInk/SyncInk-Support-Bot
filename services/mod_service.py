from database import db
from typing import List, Dict, Any, Optional

class ModService:
    """Service layer for moderation actions and persistent case logs."""
    
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
        records = await db.fetch(
            "SELECT * FROM mod_cases WHERE guild_id = $1 AND user_id = $2 ORDER BY created_at DESC", 
            guild_id, user_id
        )
        return [dict(r) for r in records]

    @staticmethod
    async def get_recent_cases(guild_id: int, limit: int = 15) -> List[Dict[str, Any]]:
        """Fetches the most recent moderation cases across the server."""
        records = await db.fetch(
            "SELECT * FROM mod_cases WHERE guild_id = $1 ORDER BY created_at DESC LIMIT $2", 
            guild_id, limit
        )
        return [dict(r) for r in records]

    @staticmethod
    async def get_case(guild_id: int, case_id: int) -> Optional[Dict[str, Any]]:
        """Fetches a single moderation case by case_id."""
        record = await db.fetchrow(
            "SELECT * FROM mod_cases WHERE guild_id = $1 AND case_id = $2", 
            guild_id, case_id
        )
        return dict(record) if record else None

    @staticmethod
    async def count_user_cases(guild_id: int, user_id: int) -> Dict[str, int]:
        """Returns counts of moderation actions grouped by action type for a specific member."""
        records = await db.fetch(
            "SELECT action, COUNT(*) as cnt FROM mod_cases WHERE guild_id = $1 AND user_id = $2 GROUP BY action",
            guild_id, user_id
        )
        counts = {"WARN": 0, "TIMEOUT": 0, "JAIL": 0, "KICK": 0, "BAN": 0, "UNBAN": 0, "UNJAIL": 0}
        for r in records:
            act = r['action'].upper()
            counts[act] = int(r['cnt'])
        return counts
