import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { query, queryOne } from "@/lib/db";
import { validateCsrfOrigin, redactSensitive, sanitizeInputText } from "@/lib/security";
import { rateLimiter, getClientIp } from "@/lib/rate-limit";
import { ensureReportsTables, isStaffOrAdmin } from "@/lib/reports";
import {
  createDiscordReportThread,
  sendDittoWebhookMessage,
} from "@/lib/discord-desk";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await ensureReportsTables();

    const reportId = parseInt(params.id, 10);
    if (isNaN(reportId)) {
      return NextResponse.json({ error: "Invalid report ID" }, { status: 400 });
    }

    // Verify report exists and user has access
    const report = await queryOne(
      "SELECT id, user_id, status FROM data_loss_reports WHERE id = $1",
      [reportId]
    );

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    const staff = isStaffOrAdmin(user);
    if (!staff && String(report.user_id) !== String(user.id)) {
      return NextResponse.json(
        { error: "Access Denied: You cannot view messages for this report." },
        { status: 403 }
      );
    }

    const messages = await query(
      `SELECT id, report_id, sender_id, sender_name, sender_avatar, sender_role, message, is_staff_reply,
              attachment_url, attachment_name, attachment_type, attachment_size, discord_message_id, message_type, created_at
       FROM report_chat_messages
       WHERE report_id = $1
       ORDER BY created_at ASC`,
      [reportId]
    );

    return NextResponse.json({ messages: messages || [] });
  } catch (error: any) {
    console.error("Report Messages GET Error:", redactSensitive(error.message || ""));
    return NextResponse.json({ error: "Failed to fetch chat messages" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  if (!validateCsrfOrigin(request)) {
    return NextResponse.json({ error: "CSRF verification failed" }, { status: 403 });
  }

  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Sign in with Discord to send a message." },
        { status: 401 }
      );
    }

    const clientIp = getClientIp(request);
    const rateLimit = rateLimiter.check(`report_msg_${clientIp}`, 30, 60 * 1000);
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: "Message rate limit reached. Please wait." }, { status: 429 });
    }

    const reportId = parseInt(params.id, 10);
    if (isNaN(reportId)) {
      return NextResponse.json({ error: "Invalid report ID" }, { status: 400 });
    }

    const report = await queryOne(
      "SELECT * FROM data_loss_reports WHERE id = $1",
      [reportId]
    );

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    const staff = isStaffOrAdmin(user);
    if (!staff && String(report.user_id) !== String(user.id)) {
      return NextResponse.json(
        { error: "Access Denied: You cannot participate in this recovery chat." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const rawMessage = body.message || "";
    const cleanMessage = sanitizeInputText(rawMessage, 2000);
    const attachmentUrl = body.attachment_url ? String(body.attachment_url).trim() : null;
    const attachmentName = body.attachment_name ? sanitizeInputText(String(body.attachment_name), 255) : null;
    const attachmentType = body.attachment_type ? sanitizeInputText(String(body.attachment_type), 64) : null;
    const attachmentSize = typeof body.attachment_size === "number" ? Math.round(body.attachment_size) : null;

    // Security Check: Non-staff users must have permission from admin to attach files
    if (attachmentUrl && !staff && !report.attachments_allowed) {
      return NextResponse.json(
        { error: "Attachment permissions are currently locked for this report. Please ask support staff to enable attachment uploads." },
        { status: 403 }
      );
    }

    if ((!cleanMessage || cleanMessage.trim().length === 0) && !attachmentUrl) {
      return NextResponse.json({ error: "Message or attachment is required." }, { status: 400 });
    }

    let role: "OWNER" | "ADMIN" | "STAFF" | "USER" = "USER";
    if (user.id === "930306512864280607" || user.isOwner) {
      role = "OWNER";
    } else if (user.isAdmin) {
      role = "ADMIN";
    } else if (user.isStaff) {
      role = "STAFF";
    }

    const isStaffReply = staff;

    const newMessage = await queryOne(
      `INSERT INTO report_chat_messages (
        report_id, sender_id, sender_name, sender_avatar, sender_role, message, is_staff_reply,
        attachment_url, attachment_name, attachment_type, attachment_size, message_type
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'CHAT')
      RETURNING id, report_id, sender_id, sender_name, sender_avatar, sender_role, message, is_staff_reply,
                attachment_url, attachment_name, attachment_type, attachment_size, discord_message_id, message_type, created_at`,
      [
        reportId,
        String(user.id),
        user.global_name || user.username || "Member",
        user.avatar || null,
        role,
        cleanMessage || (attachmentUrl ? "(Sent an attachment)" : ""),
        isStaffReply,
        attachmentUrl,
        attachmentName,
        attachmentType,
        attachmentSize,
      ]
    );

    // Update report timestamp & assigned staff if first staff response
    if (isStaffReply && !report.assigned_staff_name) {
      await query(
        `UPDATE data_loss_reports
         SET updated_at = CURRENT_TIMESTAMP,
             assigned_staff_id = $1,
             assigned_staff_name = $2,
             status = CASE WHEN status = 'OPEN' THEN 'IN_PROGRESS' ELSE status END
         WHERE id = $3`,
        [String(user.id), user.global_name || user.username || "SyncInk Staff", reportId]
      );
    } else {
      await query(
        `UPDATE data_loss_reports SET updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
        [reportId]
      );
    }

    // Mirror to Discord thread via Ditto Webhook
    try {
      let threadId = report.discord_thread_id;
      if (!threadId) {
        threadId = await createDiscordReportThread(report);
      }

      if (threadId) {
        const discordMsgId = await sendDittoWebhookMessage({
          threadId,
          senderId: String(user.id),
          senderName: user.global_name || user.username || "Member",
          senderAvatar: user.avatar || null,
          message: cleanMessage,
          role,
          attachmentUrl,
          attachmentName,
        });

        if (discordMsgId && newMessage?.id) {
          await query(
            "UPDATE report_chat_messages SET discord_message_id = $1 WHERE id = $2",
            [discordMsgId, newMessage.id]
          ).catch(() => {});
          newMessage.discord_message_id = discordMsgId;
        }
      }
    } catch (dErr: any) {
      console.warn("Discord thread message mirror error:", redactSensitive(dErr?.message || ""));
    }

    return NextResponse.json({ success: true, message: newMessage });
  } catch (error: any) {
    console.error("Report Messages POST Error:", redactSensitive(error.message || ""));
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
