import os
import asyncpg
from utils.logger import log

class MigrationManager:
    def __init__(self, pool: asyncpg.Pool):
        self.pool = pool
        self.migrations_dir = os.path.join(os.path.dirname(__file__), "migrations")

    async def init_migration_table(self):
        query = """
        CREATE TABLE IF NOT EXISTS schema_migrations (
            version INTEGER PRIMARY KEY,
            applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """
        async with self.pool.acquire() as conn:
            await conn.execute(query)

    async def get_current_version(self) -> int:
        query = "SELECT MAX(version) FROM schema_migrations;"
        async with self.pool.acquire() as conn:
            val = await conn.fetchval(query)
            return val if val is not None else 0

    async def run_migrations(self):
        """Runs all pending SQL migrations found in the migrations directory."""
        if not os.path.exists(self.migrations_dir):
            os.makedirs(self.migrations_dir)
            log.warning("Migrations directory did not exist. Created empty directory.")
            return

        await self.init_migration_table()
        current_version = await self.get_current_version()
        
        # Get all migration files, sorted by version number
        files = [f for f in os.listdir(self.migrations_dir) if f.endswith(".sql")]
        files.sort(key=lambda x: int(x.split("_")[0]))

        async with self.pool.acquire() as conn:
            for file in files:
                version = int(file.split("_")[0])
                if version > current_version:
                    log.info(f"Applying migration: {file}")
                    with open(os.path.join(self.migrations_dir, file), "r") as f:
                        sql = f.read()
                        
                    async with conn.transaction():
                        await conn.execute(sql)
                        await conn.execute("INSERT INTO schema_migrations (version) VALUES ($1)", version)
                        
                    log.info(f"Migration {version} applied successfully.")

        log.info("Database migrations are up to date.")
