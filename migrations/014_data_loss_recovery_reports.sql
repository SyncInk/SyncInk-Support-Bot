-- 014_data_loss_recovery_reports.sql
-- Storage for Data Loss Recovery Reports and Real-Time Chat Inquiries

CREATE TABLE IF NOT EXISTS data_loss_reports (
    id SERIAL PRIMARY KEY,
    report_code VARCHAR(32) NOT NULL UNIQUE,
    user_id VARCHAR(64) NOT NULL,
    username VARCHAR(255) NOT NULL,
    global_name VARCHAR(255),
    avatar VARCHAR(255),
    guild_id VARCHAR(64) NOT NULL,
    guild_name VARCHAR(255),
    bot_target VARCHAR(100) NOT NULL, -- 'SyncInk Ticket Bot', 'SyncInk Voice Bot', 'SyncInk Support Bot', 'Other'
    category VARCHAR(64) NOT NULL,    -- 'DATA_LOSS', 'TRANSCRIPT_RECOVERY', 'BOT_OUTAGE', 'OTHER'
    title VARCHAR(255) NOT NULL,
    incident_date VARCHAR(100),
    affected_channels TEXT,
    description TEXT NOT NULL,
    evidence_links TEXT,
    status VARCHAR(50) DEFAULT 'OPEN',     -- 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'
    priority VARCHAR(50) DEFAULT 'HIGH',   -- 'LOW', 'NORMAL', 'HIGH', 'CRITICAL'
    assigned_staff_id VARCHAR(64),
    assigned_staff_name VARCHAR(255),
    admin_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_data_loss_reports_user
ON data_loss_reports (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_data_loss_reports_guild
ON data_loss_reports (guild_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_data_loss_reports_status
ON data_loss_reports (status, created_at DESC);

CREATE TABLE IF NOT EXISTS report_chat_messages (
    id SERIAL PRIMARY KEY,
    report_id INT NOT NULL REFERENCES data_loss_reports(id) ON DELETE CASCADE,
    sender_id VARCHAR(64) NOT NULL,
    sender_name VARCHAR(255) NOT NULL,
    sender_avatar VARCHAR(255),
    sender_role VARCHAR(50) NOT NULL, -- 'OWNER', 'ADMIN', 'STAFF', 'USER'
    message TEXT NOT NULL,
    is_staff_reply BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_report_chat_messages_report
ON report_chat_messages (report_id, created_at ASC);
