import asyncpg
import asyncio
import os
from typing import Any, List, Optional
from utils.logger import log
from utils.exceptions import DatabaseError

class DatabaseManager:
    def __init__(self):
        self.pool: Optional[asyncpg.Pool] = None
        self._lock: Optional[asyncio.Lock] = None

    def is_connected(self) -> bool:
        """Checks whether the database connection pool is open and healthy."""
        return (
            self.pool is not None and 
            not getattr(self.pool, '_closed', False) and 
            not getattr(self.pool, '_closing', False)
        )

    async def ensure_connected(self):
        """Ensures the pool is active; self-heals by reconnecting if disconnected or closed."""
        if self.is_connected():
            return

        if self._lock is None:
            self._lock = asyncio.Lock()

        async with self._lock:
            if not self.is_connected():
                log.warning("Database connection pool is closed or uninitialized. Self-healing / reconnecting...")
                await self.connect()

    async def connect(self):
        """Initializes the connection pool."""
        dsn = os.getenv("DATABASE_URL")
        if not dsn:
            raise DatabaseError("DATABASE_URL environment variable is not set.")
        
        # Smart SSL Handling: Disable for local Termux DBs, Require for cloud providers (Railway)
        ssl_ctx = "require"
        if "127.0.0.1" in dsn or "localhost" in dsn or "sslmode=disable" in dsn.lower():
            ssl_ctx = False
            
        try:
            # If old pool is lingering, cleanly close it first
            if self.pool and not getattr(self.pool, '_closed', False):
                try:
                    await self.pool.close()
                except Exception:
                    pass

            pool_kwargs = {"dsn": dsn, "command_timeout": 60, "ssl": ssl_ctx}
            if "6543" in dsn or "pgbouncer" in dsn.lower():
                pool_kwargs["statement_cache_size"] = 0
            self.pool = await asyncpg.create_pool(**pool_kwargs)
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
        """Fetch multiple rows with automatic self-healing reconnect."""
        await self.ensure_connected()
        try:
            async with self.pool.acquire() as conn:
                return await conn.fetch(query, *args)
        except Exception as e:
            if "closed" in str(e).lower() or "connection" in str(e).lower():
                log.warning(f"DB connection lost during fetch ({e}). Self-healing reconnect and retrying...")
                await self.connect()
                async with self.pool.acquire() as conn:
                    return await conn.fetch(query, *args)
            log.error(f"DB Fetch Error: {e} | Query: {query}")
            raise DatabaseError(str(e))

    async def fetchrow(self, query: str, *args) -> Optional[asyncpg.Record]:
        """Fetch a single row with automatic self-healing reconnect."""
        await self.ensure_connected()
        try:
            async with self.pool.acquire() as conn:
                return await conn.fetchrow(query, *args)
        except Exception as e:
            if "closed" in str(e).lower() or "connection" in str(e).lower():
                log.warning(f"DB connection lost during fetchrow ({e}). Self-healing reconnect and retrying...")
                await self.connect()
                async with self.pool.acquire() as conn:
                    return await conn.fetchrow(query, *args)
            log.error(f"DB FetchRow Error: {e} | Query: {query}")
            raise DatabaseError(str(e))

    async def execute(self, query: str, *args) -> str:
        """Execute a query without returning rows with automatic self-healing reconnect."""
        await self.ensure_connected()
        try:
            async with self.pool.acquire() as conn:
                return await conn.execute(query, *args)
        except Exception as e:
            if "closed" in str(e).lower() or "connection" in str(e).lower():
                log.warning(f"DB connection lost during execute ({e}). Self-healing reconnect and retrying...")
                await self.connect()
                async with self.pool.acquire() as conn:
                    return await conn.execute(query, *args)
            log.error(f"DB Execute Error: {e} | Query: {query}")
            raise DatabaseError(str(e))

    async def close(self):
        """Closes the connection pool."""
        if self.pool:
            try:
                await self.pool.close()
            except Exception:
                pass
            self.pool = None
            log.info("Database connection closed.")

# Singleton instance for global access
db = DatabaseManager()
