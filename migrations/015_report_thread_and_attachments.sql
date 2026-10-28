-- 015_report_thread_and_attachments.sql
-- Add Discord thread ID, attachment permissions, and attachment metadata to recovery reports

ALTER TABLE data_loss_reports 
ADD COLUMN IF NOT EXISTS discord_thread_id VARCHAR(64);

ALTER TABLE data_loss_reports 
ADD COLUMN IF NOT EXISTS attachments_allowed BOOLEAN DEFAULT FALSE;

ALTER TABLE report_chat_messages 
ADD COLUMN IF NOT EXISTS attachment_url TEXT;

ALTER TABLE report_chat_messages 
ADD COLUMN IF NOT EXISTS attachment_name VARCHAR(255);

ALTER TABLE report_chat_messages 
ADD COLUMN IF NOT EXISTS attachment_type VARCHAR(64);

ALTER TABLE report_chat_messages 
ADD COLUMN IF NOT EXISTS attachment_size INT;

ALTER TABLE report_chat_messages 
ADD COLUMN IF NOT EXISTS discord_message_id VARCHAR(64);

ALTER TABLE report_chat_messages 
ADD COLUMN IF NOT EXISTS message_type VARCHAR(32) DEFAULT 'CHAT';

CREATE INDEX IF NOT EXISTS idx_data_loss_reports_thread
ON data_loss_reports (discord_thread_id);

CREATE INDEX IF NOT EXISTS idx_report_chat_messages_discord_msg
ON report_chat_messages (discord_message_id);
