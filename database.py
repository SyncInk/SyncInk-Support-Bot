import asyncpg
import os
from typing import Any, List, Optional
from utils.logger import log
from utils.exceptions import DatabaseError

class DatabaseManager:
    def __init__(self):
        self.pool: Optional[asyncpg.Pool] = None

    async def connect(self):
        """Initializes the connection pool."""
        dsn = os.getenv("DATABASE_URL")
        if not dsn:
            raise DatabaseError("DATABASE_URL environment variable is not set.")
        
        try:
            self.pool = await asyncpg.create_pool(dsn=dsn, command_timeout=60)
            log.info("Successfully connected to the PostgreSQL database.")
            
            # Run migrations
            from migrations import MigrationManager
            migration_manager = MigrationManager(self.pool)
            await migration_manager.run_migrations()
            
        except Exception as e:
            log.error(f"Failed to connect to the database: {e}")
            raise DatabaseError(f"Database connection failed: {e}")

    # Migration logic is now handled by MigrationManager

    async def fetch(self, query: str, *args) -> List[asyncpg.Record]:
        """Fetch multiple rows."""
        if not self.pool:
            raise DatabaseError("Database pool is not initialized.")
        try:
            async with self.pool.acquire() as conn:
                return await conn.fetch(query, *args)
        except Exception as e:
            log.error(f"DB Fetch Error: {e} | Query: {query}")
            raise DatabaseError(str(e))

    async def fetchrow(self, query: str, *args) -> Optional[asyncpg.Record]:
        """Fetch a single row."""
        if not self.pool:
            raise DatabaseError("Database pool is not initialized.")
        try:
            async with self.pool.acquire() as conn:
                return await conn.fetchrow(query, *args)
        except Exception as e:
            log.error(f"DB FetchRow Error: {e} | Query: {query}")
            raise DatabaseError(str(e))

    async def execute(self, query: str, *args) -> str:
        """Execute a query without returning rows (INSERT, UPDATE, DELETE)."""
        if not self.pool:
            raise DatabaseError("Database pool is not initialized.")
        try:
            async with self.pool.acquire() as conn:
                return await conn.execute(query, *args)
        except Exception as e:
            log.error(f"DB Execute Error: {e} | Query: {query}")
            raise DatabaseError(str(e))

    async def close(self):
        """Closes the connection pool."""
        if self.pool:
            await self.pool.close()
            log.info("Database connection closed.")

# Singleton instance for global access
db = DatabaseManager()
