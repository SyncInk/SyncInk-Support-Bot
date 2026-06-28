-- 003_advanced_security.sql
-- Add new columns for advanced security checkpoints and welcome flows

ALTER TABLE guild_settings 
ADD COLUMN IF NOT EXISTS unverified_role_id BIGINT,
ADD COLUMN IF NOT EXISTS verification_channel_id BIGINT,
ADD COLUMN IF NOT EXISTS require_verification BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS account_age_requirement INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS anti_raid BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS anti_spam BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS welcome_message TEXT,
ADD COLUMN IF NOT EXISTS dm_welcome BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS auto_delete_welcome BOOLEAN DEFAULT FALSE;
