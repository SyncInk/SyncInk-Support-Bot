-- 004_logging_categories.sql
-- Expand guild_settings to support robust, separate logging channels

ALTER TABLE guild_settings 
ADD COLUMN IF NOT EXISTS log_channel_message BIGINT,
ADD COLUMN IF NOT EXISTS log_channel_member BIGINT,
ADD COLUMN IF NOT EXISTS log_channel_moderation BIGINT,
ADD COLUMN IF NOT EXISTS log_channel_role BIGINT,
ADD COLUMN IF NOT EXISTS log_channel_channel BIGINT,
ADD COLUMN IF NOT EXISTS log_channel_voice BIGINT,
ADD COLUMN IF NOT EXISTS log_channel_verification BIGINT,
ADD COLUMN IF NOT EXISTS log_channel_server BIGINT;
