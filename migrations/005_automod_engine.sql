-- 005_automod_engine.sql
-- Massive Automod Engine Schema

-- Extending Guild Settings for Automod & Jail
ALTER TABLE guild_settings 
ADD COLUMN IF NOT EXISTS automod_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS automod_log_channel_id BIGINT,
ADD COLUMN IF NOT EXISTS jail_role_id BIGINT,
ADD COLUMN IF NOT EXISTS jail_channel_id BIGINT,
ADD COLUMN IF NOT EXISTS appeal_channel_id BIGINT,
ADD COLUMN IF NOT EXISTS emergency_mode BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS point_decay_rate INT DEFAULT 1,
ADD COLUMN IF NOT EXISTS point_decay_hours INT DEFAULT 24,
ADD COLUMN IF NOT EXISTS spam_threshold INT DEFAULT 5,
ADD COLUMN IF NOT EXISTS mention_threshold INT DEFAULT 5;

-- Progressive Punishments Mapping
CREATE TABLE IF NOT EXISTS automod_punishments (
    id SERIAL PRIMARY KEY,
    guild_id BIGINT NOT NULL,
    points INT NOT NULL,
    action VARCHAR(50) NOT NULL, -- delete, warn, timeout, jail, kick, ban
    duration_mins INT, -- for timeout and timed jail
    UNIQUE (guild_id, points)
);

-- Configurable Blacklist
CREATE TABLE IF NOT EXISTS automod_blacklist (
    id SERIAL PRIMARY KEY,
    guild_id BIGINT NOT NULL,
    pattern TEXT NOT NULL,
    match_type VARCHAR(20) NOT NULL, -- exact, contains, regex, wildcard, invite, link
    points INT NOT NULL,
    UNIQUE(guild_id, pattern)
);

-- User Scoring System
CREATE TABLE IF NOT EXISTS automod_scores (
    guild_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    points INT DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (guild_id, user_id)
);

-- Jail Snapshots
CREATE TABLE IF NOT EXISTS automod_jails (
    id SERIAL PRIMARY KEY,
    guild_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    mod_id BIGINT,
    reason TEXT,
    previous_roles TEXT, -- Comma-separated list of role IDs to restore
    jailed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    release_at TIMESTAMP, -- NULL if permanent
    case_id INT
);

-- Ignored Entities
CREATE TABLE IF NOT EXISTS automod_ignored (
    id SERIAL PRIMARY KEY,
    guild_id BIGINT NOT NULL,
    entity_id BIGINT NOT NULL,
    entity_type VARCHAR(20) NOT NULL, -- user, role, channel, category
    UNIQUE(guild_id, entity_id, entity_type)
);
