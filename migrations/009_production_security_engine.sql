-- 009_production_security_engine.sql
-- Production Security and Anti-Nuke Engine Migration

-- 1. Extend guild_settings with security modules & thresholds
ALTER TABLE guild_settings
ADD COLUMN IF NOT EXISTS anti_nuke_enabled BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS anti_nuke_threshold INT DEFAULT 3,
ADD COLUMN IF NOT EXISTS anti_nuke_window_seconds INT DEFAULT 10,
ADD COLUMN IF NOT EXISTS anti_raid_enabled BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS anti_raid_threshold INT DEFAULT 5,
ADD COLUMN IF NOT EXISTS anti_raid_window_seconds INT DEFAULT 10,
ADD COLUMN IF NOT EXISTS anti_raid_state VARCHAR(20) DEFAULT 'NORMAL',
ADD COLUMN IF NOT EXISTS anti_phishing_enabled BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS mention_guard_enabled BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS content_filter_enabled BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS mass_bot_protection_enabled BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS ghost_ping_detection_enabled BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS quarantine_role_id BIGINT,
ADD COLUMN IF NOT EXISTS lockdown_channels TEXT DEFAULT '[]';

-- 2. Security Whitelist Table (Users, Roles, Channels, Domains)
CREATE TABLE IF NOT EXISTS security_whitelist (
    id SERIAL PRIMARY KEY,
    guild_id BIGINT NOT NULL,
    entity_type VARCHAR(20) NOT NULL,
    entity_id_or_val TEXT NOT NULL,
    added_by BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(guild_id, entity_type, entity_id_or_val)
);

CREATE INDEX IF NOT EXISTS idx_security_whitelist_lookup
ON security_whitelist (guild_id, entity_type);

-- 3. Security Incidents Table (Audit & Forensic Logging)
CREATE TABLE IF NOT EXISTS security_incidents (
    id SERIAL PRIMARY KEY,
    guild_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    module VARCHAR(50) NOT NULL,
    action_taken VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
    risk_score INT DEFAULT 0,
    details TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_security_incidents_guild
ON security_incidents (guild_id, created_at DESC);

-- 4. Extend automod_blacklist with severity
ALTER TABLE automod_blacklist
ADD COLUMN IF NOT EXISTS severity VARCHAR(20) DEFAULT 'MEDIUM';
