import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { query, queryOne } from "@/lib/db";
import { validateCsrfOrigin, redactSensitive, sanitizeInputText } from "@/lib/security";
import { rateLimiter, getClientIp } from "@/lib/rate-limit";
import { ensureReportsTables, isStaffOrAdmin } from "@/lib/reports";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required to view reports." },
        { status: 401 }
      );
    }

    const clientIp = getClientIp(request);
    const rateLimit = rateLimiter.check(`reports_get_${clientIp}`, 60, 60 * 1000);
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: "Too many requests. Please slow down." }, { status: 429 });
    }

    await ensureReportsTables();

    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get("status");
    const categoryFilter = searchParams.get("category");
    const searchQuery = searchParams.get("search")?.trim() || "";
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50", 10)));

    const staffMode = isStaffOrAdmin(user);

    let sql = `
      SELECT r.*,
             (SELECT COUNT(*) FROM report_chat_messages m WHERE m.report_id = r.id) as message_count,
             (SELECT m.created_at FROM report_chat_messages m WHERE m.report_id = r.id ORDER BY m.created_at DESC LIMIT 1) as last_message_at
      FROM data_loss_reports r
      WHERE 1=1
    `;
    const params: any[] = [];

    // Access control: Non-staff can only see their own reports
    if (!staffMode) {
      params.push(String(user.id));
      sql += ` AND r.user_id = $${params.length}`;
    }

    if (statusFilter && statusFilter !== "ALL") {
      params.push(statusFilter.toUpperCase());
      sql += ` AND UPPER(r.status) = $${params.length}`;
    }

    if (categoryFilter && categoryFilter !== "ALL") {
      params.push(categoryFilter.toUpperCase());
      sql += ` AND UPPER(r.category) = $${params.length}`;
    }

    if (searchQuery) {
      params.push(`%${searchQuery.slice(0, 100)}%`);
      sql += ` AND (
        r.report_code ILIKE $${params.length} OR
        r.title ILIKE $${params.length} OR
        r.username ILIKE $${params.length} OR
        r.guild_id ILIKE $${params.length} OR
        r.user_id ILIKE $${params.length}
      )`;
    }

    sql += ` ORDER BY r.updated_at DESC LIMIT $${params.length + 1}`;
    params.push(limit);

    const reports = await query(sql, params).catch(() => []);

    // Summary statistics
    let statsSql = `
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE UPPER(status) = 'OPEN') as open,
        COUNT(*) FILTER (WHERE UPPER(status) = 'IN_PROGRESS') as in_progress,
        COUNT(*) FILTER (WHERE UPPER(status) = 'RESOLVED') as resolved,
        COUNT(*) FILTER (WHERE UPPER(status) = 'CLOSED') as closed
      FROM data_loss_reports
    `;
    const statsParams: any[] = [];
    if (!staffMode) {
      statsParams.push(String(user.id));
      statsSql += ` WHERE user_id = $1`;
    }

    const stats = await queryOne<{
      total: string;
      open: string;
      in_progress: string;
      resolved: string;
      closed: string;
    }>(statsSql, statsParams).catch(() => ({
      total: "0",
      open: "0",
      in_progress: "0",
      resolved: "0",
      closed: "0",
    }));

    return NextResponse.json({
      reports: reports || [],
      isStaff: staffMode,
      stats: {
        total: parseInt(stats?.total || "0", 10),
        open: parseInt(stats?.open || "0", 10),
        in_progress: parseInt(stats?.in_progress || "0", 10),
        resolved: parseInt(stats?.resolved || "0", 10),
        closed: parseInt(stats?.closed || "0", 10),
      },
    });
  } catch (error: any) {
    console.error("Reports GET Error:", redactSensitive(error.message || ""));
    return NextResponse.json({ error: "Failed to fetch reports." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!validateCsrfOrigin(request)) {
    return NextResponse.json(
      { error: "Invalid request origin (CSRF validation failed)." },
      { status: 403 }
    );
  }

  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "You must be signed in with Discord to submit an incident or recovery report." },
        { status: 401 }
      );
    }

    const clientIp = getClientIp(request);
    const rateLimit = rateLimiter.check(`report_create_${clientIp}`, 5, 15 * 60 * 1000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Submission rate limit reached. Please wait before submitting another report." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const {
      guild_id,
      guild_name,
      bot_target,
      category,
      title,
      incident_date,
      affected_channels,
      description,
      evidence_links,
      priority,
    } = body;

    // Validation
    const cleanGuildId = String(guild_id || "").trim();
    if (!cleanGuildId || !/^\d{17,20}$/.test(cleanGuildId)) {
      return NextResponse.json(
        { error: "Please enter a valid Discord Server (Guild) ID (17-20 digits)." },
        { status: 400 }
      );
    }

    const cleanTitle = sanitizeInputText(title || "", 200);
    if (!cleanTitle || cleanTitle.length < 4) {
      return NextResponse.json(
        { error: "Please provide a descriptive subject/title (at least 4 characters)." },
        { status: 400 }
      );
    }

    const cleanDescription = sanitizeInputText(description || "", 3000);
    if (!cleanDescription || cleanDescription.length < 15) {
      return NextResponse.json(
        { error: "Please provide detailed incident notes (at least 15 characters)." },
        { status: 400 }
      );
    }

    const validCategories = ["DATA_LOSS", "TRANSCRIPT_RECOVERY", "BOT_OUTAGE", "OTHER"];
    const cleanCategory = validCategories.includes(String(category).toUpperCase())
      ? String(category).toUpperCase()
      : "DATA_LOSS";

    const cleanBot = sanitizeInputText(bot_target || "SyncInk Ticket Bot", 100);
    const cleanGuildName = guild_name ? sanitizeInputText(guild_name, 200) : "Discord Server";
    const cleanIncidentDate = incident_date ? sanitizeInputText(incident_date, 100) : "Recent";
    const cleanChannels = affected_channels ? sanitizeInputText(affected_channels, 500) : null;
    const cleanEvidence = evidence_links ? sanitizeInputText(evidence_links, 1000) : null;

    const validPriorities = ["LOW", "NORMAL", "HIGH", "CRITICAL"];
    const cleanPriority = validPriorities.includes(String(priority).toUpperCase())
      ? String(priority).toUpperCase()
      : "HIGH";

    await ensureReportsTables();

    // Generate unique Report Code
    const randomCode = `REC-${Math.floor(10000 + Math.random() * 90000)}`;

    const newReport = await queryOne(
      `INSERT INTO data_loss_reports (
        report_code, user_id, username, global_name, avatar,
        guild_id, guild_name, bot_target, category, title,
        incident_date, affected_channels, description, evidence_links,
        status, priority
      ) VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8, $9, $10,
        $11, $12, $13, $14,
        'OPEN', $15
      ) RETURNING *`,
      [
        randomCode,
        String(user.id),
        user.username || "Discord Member",
        user.global_name || null,
        user.avatar || null,
        cleanGuildId,
        cleanGuildName,
        cleanBot,
        cleanCategory,
        cleanTitle,
        cleanIncidentDate,
        cleanChannels,
        cleanDescription,
        cleanEvidence,
        cleanPriority,
      ]
    );

    if (!newReport) {
      throw new Error("Failed to create report record.");
    }

    // Automatically insert the initial message into chat thread
    const userRole = isStaffOrAdmin(user)
      ? user.id === "930306512864280607" || user.isOwner ? "OWNER" : "ADMIN"
      : "USER";

    await query(
      `INSERT INTO report_chat_messages (
        report_id, sender_id, sender_name, sender_avatar, sender_role, message, is_staff_reply
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        newReport.id,
        String(user.id),
        user.global_name || user.username || "Discord Member",
        user.avatar || null,
        userRole,
        cleanDescription,
        false,
      ]
    );

    return NextResponse.json({
      success: true,
      message: `Data loss recovery report #${randomCode} submitted successfully. An administrator will review your case.`,
      report: newReport,
    });
  } catch (error: any) {
    console.error("Report Creation Error:", redactSensitive(error.message || ""));
    return NextResponse.json({ error: "Failed to submit recovery report." }, { status: 500 });
  }
}
