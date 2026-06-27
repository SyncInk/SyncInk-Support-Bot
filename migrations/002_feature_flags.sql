-- 002_feature_flags.sql
-- Add feature flags table for global and per-guild toggles

CREATE TABLE IF NOT EXISTS feature_flags (
    flag_name VARCHAR(50) PRIMARY KEY,
    is_enabled BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS guild_feature_flags (
    guild_id BIGINT,
    flag_name VARCHAR(50),
    is_enabled BOOLEAN DEFAULT TRUE,
    PRIMARY KEY (guild_id, flag_name)
);

-- Insert some default global flags
INSERT INTO feature_flags (flag_name, is_enabled) VALUES
('suggestions_module', TRUE),
('moderation_module', TRUE),
('verification_module', TRUE)
ON CONFLICT DO NOTHING;
