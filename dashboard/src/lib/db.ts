import { Pool } from "pg";

declare global {
  var _pgPool: Pool | undefined;
}

function createPool(): Pool {
  let connectionString = process.env.DATABASE_URL || "";
  if (!connectionString) {
    console.warn("DATABASE_URL is not set. Dashboard database operations will fail.");
  }

  // Automatic optimization: Supabase port 5432 is Session Mode (limited to 15 concurrent clients).
  // Port 6543 with pgbouncer=true is Transaction Mode (unlimited concurrent serverless clients).
  // If the user provided the 5432 pooler URL, automatically route through the 6543 transaction pooler.
  if (connectionString.includes("pooler.supabase.com:5432")) {
    connectionString = connectionString.replace("pooler.supabase.com:5432", "pooler.supabase.com:6543");
    if (!connectionString.includes("pgbouncer=true")) {
      connectionString += (connectionString.includes("?") ? "&" : "?") + "pgbouncer=true";
    }
  }

  const isLocal =
    connectionString.includes("localhost") ||
    connectionString.includes("127.0.0.1") ||
    connectionString.includes("sslmode=disable");

  return new Pool({
    connectionString,
    ssl: isLocal ? false : { rejectUnauthorized: false },
    // In serverless environments (Vercel), each lambda only processes 1 request at a time.
    // Keeping max at 2 and idleTimeout low ensures connections are returned to the pooler immediately.
    max: 2,
    idleTimeoutMillis: 1500,
    connectionTimeoutMillis: 6000,
  });
}

export const pool = global._pgPool || createPool();
if (process.env.NODE_ENV !== "production") {
  global._pgPool = pool;
}

export async function query<T = any>(text: string, params: any[] = []): Promise<T[]> {
  try {
    const res = await pool.query(text, params);
    return res.rows;
  } catch (err: any) {
    // Graceful retry once in case of transient pooler burst
    if (
      err.message?.includes("EMAXCONN") ||
      err.message?.includes("max clients") ||
      err.code === "53300"
    ) {
      await new Promise((resolve) => setTimeout(resolve, 350));
      const retryRes = await pool.query(text, params);
      return retryRes.rows;
    }
    throw err;
  }
}

export async function queryOne<T = any>(text: string, params: any[] = []): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows.length > 0 ? rows[0] : null;
}
