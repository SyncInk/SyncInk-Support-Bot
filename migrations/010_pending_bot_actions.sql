-- 010_pending_bot_actions.sql
-- Queue for real-time actions dispatched from Web Dashboard to Discord Bot

CREATE TABLE IF NOT EXISTS pending_bot_actions (
    id SERIAL PRIMARY KEY,
    guild_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    action VARCHAR(50) NOT NULL, -- 'JAIL', 'UNJAIL', 'KICK', 'BAN', 'UNBAN', 'TIMEOUT'
    mod_id BIGINT,
    reason TEXT,
    duration_mins INT,
    status VARCHAR(20) DEFAULT 'PENDING', -- 'PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_pending_bot_actions_status
ON pending_bot_actions (status, created_at ASC);
