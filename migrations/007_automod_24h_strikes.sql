-- 007_automod_24h_strikes.sql
-- Create table for tracking rolling 24-hour progressive violations without deleting historical logs

CREATE TABLE IF NOT EXISTS automod_violations (
    id SERIAL PRIMARY KEY,
    guild_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    reason TEXT NOT NULL,
    detection_type VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_automod_violations_window 
ON automod_violations (guild_id, user_id, created_at);
