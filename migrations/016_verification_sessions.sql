-- 016_verification_sessions.sql
-- Persistent and Single-Use Web Verification Sessions for Discord Support Server

CREATE TABLE IF NOT EXISTS verification_sessions (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(128) UNIQUE NOT NULL,
    session_token_hash VARCHAR(128) UNIQUE NOT NULL,
    user_id VARCHAR(64) NOT NULL,
    guild_id VARCHAR(64) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING', -- PENDING, COMPLETED, EXPIRED, FAILED
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
