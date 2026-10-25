import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { query, queryOne } from "@/lib/db";
import { validateCsrfOrigin, redactSensitive, sanitizeInputText } from "@/lib/security";
import { rateLimiter, getClientIp } from "@/lib/rate-limit";
import { ensureReportsTables, isStaffOrAdmin } from "@/lib/reports";

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
      `SELECT id, report_id, sender_id, sender_name, sender_avatar, sender_role, message, is_staff_reply, created_at
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
      "SELECT id, user_id, status, assigned_staff_name FROM data_loss_reports WHERE id = $1",
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
    const cleanMessage = sanitizeInputText(body.message || "", 2000);
    if (!cleanMessage || cleanMessage.trim().length === 0) {
      return NextResponse.json({ error: "Message cannot be empty." }, { status: 400 });
    }

    let role = "USER";
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
        report_id, sender_id, sender_name, sender_avatar, sender_role, message, is_staff_reply
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, report_id, sender_id, sender_name, sender_avatar, sender_role, message, is_staff_reply, created_at`,
      [
        reportId,
        String(user.id),
        user.global_name || user.username || "Member",
        user.avatar || null,
        role,
        cleanMessage,
        isStaffReply,
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

    return NextResponse.json({ success: true, message: newMessage });
  } catch (error: any) {
    console.error("Report Messages POST Error:", redactSensitive(error.message || ""));
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
