import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { query, queryOne } from "@/lib/db";
import { validateCsrfOrigin, redactSensitive, sanitizeInputText } from "@/lib/security";
import { rateLimiter, getClientIp } from "@/lib/rate-limit";
import { ensureReportsTables, isStaffOrAdmin } from "@/lib/reports";
import {
  sendSystemWebhookUpdate,
  createDiscordReportThread,
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

    const report = await queryOne(
      "SELECT * FROM data_loss_reports WHERE id = $1",
      [reportId]
    );

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    // Security check: User must be creator or staff
    const staff = isStaffOrAdmin(user);
    if (!staff && String(report.user_id) !== String(user.id)) {
      return NextResponse.json(
        { error: "Access Denied: You do not have permission to view this report." },
        { status: 403 }
      );
    }

    return NextResponse.json({ report, isStaff: staff });
  } catch (error: any) {
    console.error("Report GET Error:", redactSensitive(error.message || ""));
    return NextResponse.json({ error: "Failed to fetch report" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  if (!validateCsrfOrigin(request)) {
    return NextResponse.json({ error: "CSRF verification failed" }, { status: 403 });
  }

  try {
    const user = await getCurrentUser();
    if (!user || !isStaffOrAdmin(user)) {
      return NextResponse.json(
        { error: "Access Denied: Only Administrators and Support Staff can update report status." },
        { status: 403 }
      );
    }

    const reportId = parseInt(params.id, 10);
    if (isNaN(reportId)) {
      return NextResponse.json({ error: "Invalid report ID" }, { status: 400 });
    }

    const body = await request.json();
    const { status, priority, admin_notes, attachments_allowed } = body;

    const validStatuses = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"];
    const validPriorities = ["LOW", "NORMAL", "HIGH", "CRITICAL"];

    const updates: string[] = [];
    const values: any[] = [];

    if (status && validStatuses.includes(String(status).toUpperCase())) {
      values.push(String(status).toUpperCase());
      updates.push(`status = $${values.length}`);
    }

    if (priority && validPriorities.includes(String(priority).toUpperCase())) {
      values.push(String(priority).toUpperCase());
      updates.push(`priority = $${values.length}`);
    }

    if (typeof admin_notes === "string") {
      values.push(sanitizeInputText(admin_notes, 2000));
      updates.push(`admin_notes = $${values.length}`);
    }

    if (typeof attachments_allowed === "boolean") {
      values.push(attachments_allowed);
      updates.push(`attachments_allowed = $${values.length}`);
    }

    // Set assigned staff
    values.push(String(user.id));
    updates.push(`assigned_staff_id = $${values.length}`);

    values.push(user.global_name || user.username || "SyncInk Staff");
    updates.push(`assigned_staff_name = $${values.length}`);

    updates.push(`updated_at = CURRENT_TIMESTAMP`);

    values.push(reportId);
    const sql = `UPDATE data_loss_reports SET ${updates.join(", ")} WHERE id = $${values.length} RETURNING *`;

    const updated = await queryOne(sql, values);
    if (!updated) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    // Ensure Discord thread exists
    let threadId = updated.discord_thread_id;
    if (!threadId) {
      threadId = await createDiscordReportThread(updated).catch(() => null);
    }

    // Handle attachment permission toggle notification
    if (typeof attachments_allowed === "boolean") {
      const permissionText = attachments_allowed
        ? `🔓 ${user.global_name || user.username} granted permission to upload screenshots & file attachments.`
        : `🔒 ${user.global_name || user.username} locked file attachment uploads for this case.`;

      await query(
        `INSERT INTO report_chat_messages (
          report_id, sender_id, sender_name, sender_avatar, sender_role, message, is_staff_reply, message_type
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          reportId,
          String(user.id),
          user.global_name || user.username || "System",
          user.avatar || null,
          user.id === "930306512864280607" || user.isOwner ? "OWNER" : "ADMIN",
          permissionText,
          true,
          "SYSTEM",
        ]
      ).catch(() => {});

      if (threadId) {
        sendSystemWebhookUpdate({
          threadId,
          title: attachments_allowed
            ? "🔓 Attachment Permission Granted"
            : "🔒 Attachment Permission Restricted",
          description: permissionText,
          color: attachments_allowed ? 0x10b981 : 0xef4444,
        }).catch(() => {});
      }
    }

    // Log status change message in chat thread & mirror to Discord
    if (status) {
      const statusText = `Status updated to [${String(status).toUpperCase()}] by ${user.global_name || user.username}.`;

      await query(
        `INSERT INTO report_chat_messages (
          report_id, sender_id, sender_name, sender_avatar, sender_role, message, is_staff_reply, message_type
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          reportId,
          String(user.id),
          user.global_name || user.username || "System",
          user.avatar || null,
          user.id === "930306512864280607" || user.isOwner ? "OWNER" : "ADMIN",
          statusText,
          true,
          "SYSTEM",
        ]
      ).catch(() => {});

      if (threadId) {
        const statusColor =
          status === "RESOLVED" ? 0x10b981 : status === "CLOSED" ? 0x6b7280 : 0x3b82f6;

        sendSystemWebhookUpdate({
          threadId,
          title: `⚡ Report Status Updated — [${String(status).toUpperCase()}]`,
          description: `Case **#${updated.report_code}** marked as **${String(status).toUpperCase()}** by <@${user.id}>.`,
          color: statusColor,
        }).catch(() => {});
      }
    }

    return NextResponse.json({
      success: true,
      message: `Report #${updated.report_code} updated successfully.`,
      report: updated,
    });
  } catch (error: any) {
    console.error("Report PATCH Error:", redactSensitive(error.message || ""));
    return NextResponse.json({ error: "Failed to update report" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  if (!validateCsrfOrigin(request)) {
    return NextResponse.json({ error: "CSRF verification failed" }, { status: 403 });
  }

  try {
    const user = await getCurrentUser();
    if (!user || !isStaffOrAdmin(user)) {
      return NextResponse.json(
        { error: "Access Denied: Only Administrators can remove reports." },
        { status: 403 }
      );
    }

    const reportId = parseInt(params.id, 10);
    if (isNaN(reportId)) {
      return NextResponse.json({ error: "Invalid report ID" }, { status: 400 });
    }

    await query("DELETE FROM data_loss_reports WHERE id = $1", [reportId]);
    return NextResponse.json({ success: true, message: "Report deleted." });
  } catch (error: any) {
    console.error("Report DELETE Error:", redactSensitive(error.message || ""));
    return NextResponse.json({ error: "Failed to delete report" }, { status: 500 });
  }
}
