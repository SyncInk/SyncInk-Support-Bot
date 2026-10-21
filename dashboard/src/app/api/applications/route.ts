import { NextResponse } from "next/server";
import {
  checkRequestStaffAuth,
  checkRequestAdminAuth,
  getCurrentUser,
  verifyUserGuildAccess,
} from "@/lib/auth";
import { query, queryOne, resolveGuildId } from "@/lib/db";
import { validateCsrfOrigin, redactSensitive, sanitizeInputText } from "@/lib/security";
import { rateLimiter, getClientIp } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

async function ensureApplicationsTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS member_applications (
      id SERIAL PRIMARY KEY,
      guild_id BIGINT NOT NULL,
      user_id BIGINT NOT NULL,
      username VARCHAR(255) NOT NULL,
      global_name VARCHAR(255),
      avatar VARCHAR(255),
      app_type VARCHAR(50) NOT NULL,
      age INT NOT NULL,
      timezone VARCHAR(100),
      availability VARCHAR(100),
      reason TEXT,
      experience TEXT,
      scenario_1 TEXT,
      scenario_2 TEXT,
      scenario_3 TEXT,
      languages VARCHAR(255),
      portfolio VARCHAR(500),
      bot_experience TEXT,
      complex_features TEXT,
      attachment_name VARCHAR(255),
      attachment_size INT,
      status VARCHAR(50) DEFAULT 'PENDING',
      reviewer_id BIGINT,
      reviewer_name VARCHAR(255),
      reviewer_notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      reviewed_at TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_member_applications_guild
    ON member_applications (guild_id, created_at DESC);

    CREATE INDEX IF NOT EXISTS idx_member_applications_status
    ON member_applications (guild_id, status);
  `).catch(() => {});
}

export async function GET(request: Request) {
  // 1. Staff & Admin Authorization
  if (!checkRequestStaffAuth(request)) {
    return NextResponse.json(
      { error: "Access Denied: Staff or Administrator permissions required to inspect member applications." },
      { status: 403 }
    );
  }

  // 2. Rate Limiting: 60 requests per minute per IP
  const clientIp = getClientIp(request);
  const rateLimit = rateLimiter.check(`apps_get_${clientIp}`, 60, 60 * 1000);
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: "Too many requests. Please slow down." }, { status: 429 });
  }

  try {
    const user = await getCurrentUser();
    const { searchParams } = new URL(request.url);
    const guildId = await resolveGuildId(searchParams.get("guildId") || user?.guildId);

    // 3. BOLA Check
    if (!verifyUserGuildAccess(user, guildId)) {
      return NextResponse.json(
        { error: "Access Denied: You do not have permissions for this server." },
        { status: 403 }
      );
    }

    const typeFilter = searchParams.get("type"); // 'staff' | 'developer' | 'ALL'
    const statusFilter = searchParams.get("status"); // 'PENDING' | 'UNDER_REVIEW' | 'ACCEPTED' | 'REJECTED' | 'ALL'
    const searchQuery = searchParams.get("search")?.trim() || "";
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50", 10)));

    let sql = `
      SELECT id, guild_id, user_id, username, global_name, avatar, app_type, age, timezone, availability,
             reason, experience, scenario_1, scenario_2, scenario_3, languages, portfolio,
             bot_experience, complex_features, attachment_name, attachment_size, status,
             reviewer_id, reviewer_name, reviewer_notes, created_at, reviewed_at
      FROM member_applications
      WHERE guild_id = $1
    `;
    const params: any[] = [guildId];

    if (typeFilter && typeFilter !== "ALL") {
      params.push(typeFilter.toLowerCase());
      sql += ` AND LOWER(app_type) = $${params.length}`;
    }

    if (statusFilter && statusFilter !== "ALL") {
      params.push(statusFilter.toUpperCase());
      sql += ` AND UPPER(status) = $${params.length}`;
    }

    if (searchQuery) {
      params.push(`%${searchQuery.slice(0, 100)}%`);
      sql += ` AND (
        username ILIKE $${params.length} OR
        global_name ILIKE $${params.length} OR
        user_id::text LIKE $${params.length} OR
        reason ILIKE $${params.length} OR
        portfolio ILIKE $${params.length}
      )`;
    }

    sql += ` ORDER BY created_at DESC LIMIT $${params.length + 1}`;
    params.push(limit);

    let applications = await query(sql, params).catch(async (err) => {
      console.warn("member_applications query error, ensuring table:", redactSensitive(err.message || ""));
      await ensureApplicationsTable();
      return [];
    });

    // Compute stats
    const stats = await queryOne<{
      total: string;
      pending: string;
      under_review: string;
      accepted: string;
      rejected: string;
    }>(
      `SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE UPPER(status) = 'PENDING') as pending,
        COUNT(*) FILTER (WHERE UPPER(status) = 'UNDER_REVIEW') as under_review,
        COUNT(*) FILTER (WHERE UPPER(status) = 'ACCEPTED') as accepted,
        COUNT(*) FILTER (WHERE UPPER(status) = 'REJECTED') as rejected
       FROM member_applications
       WHERE guild_id = $1`,
      [guildId]
    ).catch(() => ({
      total: "0",
      pending: "0",
      under_review: "0",
      accepted: "0",
      rejected: "0",
    }));

    return NextResponse.json({
      applications: applications || [],
      stats: {
        total: parseInt(stats?.total || "0", 10),
        pending: parseInt(stats?.pending || "0", 10),
        under_review: parseInt(stats?.under_review || "0", 10),
        accepted: parseInt(stats?.accepted || "0", 10),
        rejected: parseInt(stats?.rejected || "0", 10),
      },
    });
  } catch (error: any) {
    console.error("Applications GET Error:", redactSensitive(error.message || ""));
    return NextResponse.json({ error: "Failed to fetch applications" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  // 1. CSRF Protection
  if (!validateCsrfOrigin(request)) {
    return NextResponse.json({ error: "Invalid request origin (CSRF validation failed)" }, { status: 403 });
  }

  // 2. Admin & Owner Authorization
  if (!checkRequestAdminAuth(request)) {
    return NextResponse.json(
      { error: "Access Denied: Only Administrators & Server Owners can update application status." },
      { status: 403 }
    );
  }

  // 3. Rate Limiting: 30 updates per minute per IP
  const clientIp = getClientIp(request);
  const rateLimit = rateLimiter.check(`apps_patch_${clientIp}`, 30, 60 * 1000);
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: "Too many requests. Please slow down." }, { status: 429 });
  }

  try {
    const user = await getCurrentUser();
    const body = await request.json();
    const { id, status, notes, guildId: reqGuildId } = body;

    if (!id) {
      return NextResponse.json({ error: "Application ID is required." }, { status: 400 });
    }

    const validStatuses = ["PENDING", "UNDER_REVIEW", "ACCEPTED", "REJECTED"];
    const newStatus = String(status || "").toUpperCase().trim();
    if (!validStatuses.includes(newStatus)) {
      return NextResponse.json({ error: "Invalid application status." }, { status: 400 });
    }

    const guildId = await resolveGuildId(reqGuildId || user?.guildId);
    if (!verifyUserGuildAccess(user, guildId)) {
      return NextResponse.json({ error: "Access Denied: You do not have permissions for this server." }, { status: 403 });
    }

    const cleanNotes = notes ? sanitizeInputText(String(notes), 2000) : null;

    await ensureApplicationsTable();

    const updated = await queryOne(
      `UPDATE member_applications
       SET status = $1,
           reviewer_id = $2,
           reviewer_name = $3,
           reviewer_notes = $4,
           reviewed_at = CURRENT_TIMESTAMP
       WHERE id = $5 AND guild_id = $6
       RETURNING id, status, reviewer_name, reviewer_notes, reviewed_at`,
      [
        newStatus,
        user?.id === "admin" ? null : user?.id || null,
        user?.global_name || user?.username || "Server Administrator",
        cleanNotes,
        id,
        guildId,
      ]
    );

    if (!updated) {
      return NextResponse.json({ error: "Application not found or guild mismatch." }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: `Application #${id} status updated to ${newStatus}.`,
      application: updated,
    });
  } catch (error: any) {
    console.error("Applications PATCH Error:", redactSensitive(error.message || ""));
    return NextResponse.json({ error: "Failed to update application status." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  // 1. CSRF Protection
  if (!validateCsrfOrigin(request)) {
    return NextResponse.json({ error: "Invalid request origin (CSRF validation failed)" }, { status: 403 });
  }

  // 2. Admin & Owner Authorization
  if (!checkRequestAdminAuth(request)) {
    return NextResponse.json(
      { error: "Access Denied: Only Administrators & Server Owners can delete applications." },
      { status: 403 }
    );
  }

  // 3. Rate Limiting: 20 per minute per IP
  const clientIp = getClientIp(request);
  const rateLimit = rateLimiter.check(`apps_del_${clientIp}`, 20, 60 * 1000);
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: "Too many delete requests. Please slow down." }, { status: 429 });
  }

  try {
    const user = await getCurrentUser();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const guildId = await resolveGuildId(searchParams.get("guildId") || user?.guildId);

    if (!id) {
      return NextResponse.json({ error: "Application ID is required." }, { status: 400 });
    }

    if (!verifyUserGuildAccess(user, guildId)) {
      return NextResponse.json({ error: "Access Denied: You do not have permissions for this server." }, { status: 403 });
    }

    await ensureApplicationsTable();

    const res = await query(
      "DELETE FROM member_applications WHERE id = $1 AND guild_id = $2 RETURNING id",
      [id, guildId]
    );

    if (!res || res.length === 0) {
      return NextResponse.json({ error: "Application not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: `Application #${id} deleted.` });
  } catch (error: any) {
    console.error("Applications DELETE Error:", redactSensitive(error.message || ""));
    return NextResponse.json({ error: "Failed to delete application." }, { status: 500 });
  }
}
