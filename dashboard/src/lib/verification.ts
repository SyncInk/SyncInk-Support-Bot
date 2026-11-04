// Secure Verification Session Manager for SyncInk
// Handles session generation, cryptographic token hashing, expiration, and database state.

import crypto from "crypto";
import { query, queryOne } from "./db";

let tableEnsured = false;

export interface VerificationSession {
  id: number;
  session_id: string;
  session_token_hash: string;
  user_id: string;
  guild_id: string;
  status: "PENDING" | "COMPLETED" | "EXPIRED" | "FAILED";
  ip_address?: string | null;
  user_agent?: string | null;
  created_at: string;
  expires_at: string;
  completed_at?: string | null;
  result_details?: any;
}

/**
 * Ensures the verification_sessions table and indexes exist in PostgreSQL.
 */
export async function ensureVerificationTable(): Promise<void> {
  if (tableEnsured) return;

  try {
    await query(`
      CREATE TABLE IF NOT EXISTS verification_sessions (
        id SERIAL PRIMARY KEY,
        session_id VARCHAR(128) UNIQUE NOT NULL,
        session_token_hash VARCHAR(128) UNIQUE NOT NULL,
        user_id VARCHAR(64) NOT NULL,
        guild_id VARCHAR(64) NOT NULL,
        status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
        ip_address VARCHAR(128),
        user_agent TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        completed_at TIMESTAMP WITH TIME ZONE,
        result_details JSONB DEFAULT '{}'::jsonb
      );

      CREATE INDEX IF NOT EXISTS idx_verification_sessions_token ON verification_sessions(session_token_hash);
      CREATE INDEX IF NOT EXISTS idx_verification_sessions_user_guild ON verification_sessions(user_id, guild_id);
      CREATE INDEX IF NOT EXISTS idx_verification_sessions_status_exp ON verification_sessions(status, expires_at);
    `);
    tableEnsured = true;
  } catch (err) {
    console.warn("Notice: ensureVerificationTable transient check:", err);
  }
}

/**
 * Computes SHA-256 hash of a session token for storage and lookup.
 */
export function hashSessionToken(token: string): string {
  return crypto.createHash("sha256").update(token.trim()).digest("hex");
}

/**
 * Calculates account creation date and age in days from a Discord Snowflake ID.
 * Discord epoch is 1420070400000 (2015-01-01).
 */
export function calculateDiscordAccountAge(userId: string): {
  createdAt: Date;
  ageDays: number;
  formattedDate: string;
} {
  try {
    const snowflake = BigInt(userId);
    const timestampMs = Number((snowflake >> BigInt(22)) + BigInt("1420070400000"));
    const createdAt = new Date(timestampMs);
    const now = Date.now();
    const ageDays = Math.max(0, (now - timestampMs) / (1000 * 60 * 60 * 24));

    return {
      createdAt,
      ageDays: Math.round(ageDays * 10) / 10,
      formattedDate: createdAt.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
    };
  } catch {
    const fallback = new Date();
    return { createdAt: fallback, ageDays: 999, formattedDate: "Unknown" };
  }
}

/**
 * Creates a brand new secure verification session (called via API or bot bridge).
 * Generates a high-entropy URL-safe token. Expiration is strictly 5 minutes.
 */
export async function createVerificationSession(
  userId: string,
  guildId: string
): Promise<{ rawToken: string; session: VerificationSession }> {
  await ensureVerificationTable();

  // Invalidate any existing pending sessions for this user in this guild
  await query(
    `UPDATE verification_sessions 
     SET status = 'EXPIRED' 
     WHERE user_id = $1 AND guild_id = $2 AND status = 'PENDING'`,
    [userId, guildId]
  ).catch(() => {});

  const rawToken = crypto.randomBytes(32).toString("base64url");
  const tokenHash = hashSessionToken(rawToken);
  const sessionId = crypto.randomBytes(16).toString("hex");

  // Expires in 5 minutes
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

  const rows = await query<VerificationSession>(
    `INSERT INTO verification_sessions 
     (session_id, session_token_hash, user_id, guild_id, status, expires_at)
     VALUES ($1, $2, $3, $4, 'PENDING', $5)
     RETURNING *`,
    [sessionId, tokenHash, userId, guildId, expiresAt.toISOString()]
  );

  return { rawToken, session: rows[0] };
}

/**
 * Looks up and validates a verification session by token.
 */
export async function getVerificationSession(
  rawToken: string
): Promise<VerificationSession | null> {
  if (!rawToken || !rawToken.trim()) return null;
  await ensureVerificationTable();

  const tokenHash = hashSessionToken(rawToken);

  const session = await queryOne<VerificationSession>(
    `SELECT * FROM verification_sessions WHERE session_token_hash = $1 LIMIT 1`,
    [tokenHash]
  );

  if (!session) return null;

  // Auto-expire if past expiry
  if (session.status === "PENDING" && new Date(session.expires_at).getTime() < Date.now()) {
    await query(
      `UPDATE verification_sessions SET status = 'EXPIRED' WHERE id = $1`,
      [session.id]
    ).catch(() => {});
    session.status = "EXPIRED";
  }

  return session;
}

/**
 * Atomically marks the session as COMPLETED to prevent replay attacks and duplicate runs.
 */
export async function completeVerificationSession(
  sessionId: string,
  ipAddress?: string,
  userAgent?: string,
  resultDetails?: any
): Promise<boolean> {
  await ensureVerificationTable();

  const res = await query(
    `UPDATE verification_sessions
     SET status = 'COMPLETED',
         completed_at = CURRENT_TIMESTAMP,
         ip_address = COALESCE($2, ip_address),
         user_agent = COALESCE($3, user_agent),
         result_details = $4
     WHERE session_id = $1 AND status = 'PENDING'`,
    [sessionId, ipAddress || null, userAgent || null, JSON.stringify(resultDetails || {})]
  );

  return res.length > 0;
}
