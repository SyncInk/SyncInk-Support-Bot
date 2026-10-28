import { query } from "@/lib/db";
import { redactSensitive } from "@/lib/security";

let tablesInitialized = false;

export interface ReportItem {
  id: number;
  report_code: string;
  user_id: string;
  username: string;
  global_name: string | null;
  avatar: string | null;
  guild_id: string;
  guild_name: string | null;
  bot_target: string;
  category: string;
  title: string;
  incident_date: string | null;
  affected_channels: string | null;
  description: string;
  evidence_links: string | null;
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
  priority: "LOW" | "NORMAL" | "HIGH" | "CRITICAL";
  assigned_staff_id: string | null;
  assigned_staff_name: string | null;
  admin_notes: string | null;
  discord_thread_id?: string | null;
  attachments_allowed?: boolean;
  created_at: string;
  updated_at: string;
  message_count?: number;
  last_message_at?: string;
}

export interface ChatMessage {
  id: number;
  report_id: number;
  sender_id: string;
  sender_name: string;
  sender_avatar: string | null;
  sender_role: "OWNER" | "ADMIN" | "STAFF" | "USER";
  message: string;
  is_staff_reply: boolean;
  attachment_url?: string | null;
  attachment_name?: string | null;
  attachment_type?: string | null;
  attachment_size?: number | null;
  discord_message_id?: string | null;
  message_type?: string;
  created_at: string;
}

export async function ensureReportsTables() {
  if (tablesInitialized) return;

  try {
    await query(`
      CREATE TABLE IF NOT EXISTS data_loss_reports (
        id SERIAL PRIMARY KEY,
        report_code VARCHAR(32) NOT NULL UNIQUE,
        user_id VARCHAR(64) NOT NULL,
        username VARCHAR(255) NOT NULL,
        global_name VARCHAR(255),
        avatar VARCHAR(255),
        guild_id VARCHAR(64) NOT NULL,
        guild_name VARCHAR(255),
        bot_target VARCHAR(100) NOT NULL,
        category VARCHAR(64) NOT NULL,
        title VARCHAR(255) NOT NULL,
        incident_date VARCHAR(100),
        affected_channels TEXT,
        description TEXT NOT NULL,
        evidence_links TEXT,
        status VARCHAR(50) DEFAULT 'OPEN',
        priority VARCHAR(50) DEFAULT 'HIGH',
        assigned_staff_id VARCHAR(64),
        assigned_staff_name VARCHAR(255),
        admin_notes TEXT,
        discord_thread_id VARCHAR(64),
        attachments_allowed BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      ALTER TABLE data_loss_reports ADD COLUMN IF NOT EXISTS discord_thread_id VARCHAR(64);
      ALTER TABLE data_loss_reports ADD COLUMN IF NOT EXISTS attachments_allowed BOOLEAN DEFAULT FALSE;

      CREATE INDEX IF NOT EXISTS idx_data_loss_reports_user
      ON data_loss_reports (user_id, created_at DESC);

      CREATE INDEX IF NOT EXISTS idx_data_loss_reports_guild
      ON data_loss_reports (guild_id, created_at DESC);

      CREATE INDEX IF NOT EXISTS idx_data_loss_reports_status
      ON data_loss_reports (status, created_at DESC);

      CREATE INDEX IF NOT EXISTS idx_data_loss_reports_thread
      ON data_loss_reports (discord_thread_id);

      CREATE TABLE IF NOT EXISTS report_chat_messages (
        id SERIAL PRIMARY KEY,
        report_id INT NOT NULL REFERENCES data_loss_reports(id) ON DELETE CASCADE,
        sender_id VARCHAR(64) NOT NULL,
        sender_name VARCHAR(255) NOT NULL,
        sender_avatar VARCHAR(255),
        sender_role VARCHAR(50) NOT NULL,
        message TEXT NOT NULL,
        is_staff_reply BOOLEAN DEFAULT FALSE,
        attachment_url TEXT,
        attachment_name VARCHAR(255),
        attachment_type VARCHAR(64),
        attachment_size INT,
        discord_message_id VARCHAR(64),
        message_type VARCHAR(32) DEFAULT 'CHAT',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      ALTER TABLE report_chat_messages ADD COLUMN IF NOT EXISTS attachment_url TEXT;
      ALTER TABLE report_chat_messages ADD COLUMN IF NOT EXISTS attachment_name VARCHAR(255);
      ALTER TABLE report_chat_messages ADD COLUMN IF NOT EXISTS attachment_type VARCHAR(64);
      ALTER TABLE report_chat_messages ADD COLUMN IF NOT EXISTS attachment_size INT;
      ALTER TABLE report_chat_messages ADD COLUMN IF NOT EXISTS discord_message_id VARCHAR(64);
      ALTER TABLE report_chat_messages ADD COLUMN IF NOT EXISTS message_type VARCHAR(32) DEFAULT 'CHAT';

      CREATE INDEX IF NOT EXISTS idx_report_chat_messages_report
      ON report_chat_messages (report_id, created_at ASC);

      CREATE INDEX IF NOT EXISTS idx_report_chat_messages_discord_msg
      ON report_chat_messages (discord_message_id);
    `);
    tablesInitialized = true;
  } catch (err: any) {
    console.warn("Reports table setup warning:", redactSensitive(err?.message || ""));
  }
}

export function isStaffOrAdmin(user: any): boolean {
  if (!user) return false;
  return Boolean(
    user.isOwner ||
    user.isAdmin ||
    user.isStaff ||
    user.id === "admin" ||
    user.id === "930306512864280607"
  );
}
