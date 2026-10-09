import { NextResponse } from "next/server";
import { checkRequestAuth, checkRequestAdminAuth, getCurrentUser, verifyUserGuildAccess } from "@/lib/auth";
import { query, resolveGuildId } from "@/lib/db";
import { validateCsrfOrigin, redactSensitive } from "@/lib/security";
import { rateLimiter, getClientIp } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!checkRequestAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const clientIp = getClientIp(request);
  const rateLimit = rateLimiter.check(`sugg_get_${clientIp}`, 60, 60 * 1000);
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: "Too many requests. Please slow down." }, { status: 429 });
  }

  try {
    const user = await getCurrentUser();
    const { searchParams } = new URL(request.url);
    const guildId = await resolveGuildId(searchParams.get("guildId") || user?.guildId);

    // BOLA Check (Item 5 & 14)
    if (!verifyUserGuildAccess(user, guildId)) {
      return NextResponse.json({ error: "Access Denied: You do not have permissions for this server." }, { status: 403 });
    }

    const statusFilter = searchParams.get("status");

    let sql = `
      SELECT id, guild_id, user_id, channel_id, message_id, title, content, upvotes, downvotes, status, created_at
      FROM feature_requests
      WHERE guild_id = $1
    `;
    const params: any[] = [guildId];

    if (statusFilter && statusFilter !== "ALL") {
      params.push(statusFilter.toUpperCase());
      sql += ` AND UPPER(status) = $${params.length}`;
    }

    sql += " ORDER BY created_at DESC LIMIT 100";

    const suggestions = await query(sql, params).catch(async () => {
      await query(`
        CREATE TABLE IF NOT EXISTS feature_requests (
          id SERIAL PRIMARY KEY,
          guild_id BIGINT NOT NULL,
          user_id BIGINT NOT NULL,
          channel_id BIGINT NOT NULL,
          message_id BIGINT,
          title VARCHAR(255),
          content TEXT NOT NULL,
          upvotes INT DEFAULT 0,
          downvotes INT DEFAULT 0,
          status VARCHAR(50) DEFAULT 'PENDING',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      return [];
    });

    return NextResponse.json({
      suggestions: suggestions || [],
    });
  } catch (error: any) {
    console.error("Suggestions GET Error:", redactSensitive(error.message || ""));
    return NextResponse.json(
      { error: "Failed to fetch suggestions" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  // 1. CSRF Protection (Item 3)
  if (!validateCsrfOrigin(request)) {
    return NextResponse.json({ error: "Invalid request origin (CSRF validation failed)" }, { status: 403 });
  }

  // 2. Rate Limiting (Item 6)
  const clientIp = getClientIp(request);
  const rateLimit = rateLimiter.check(`sugg_patch_${clientIp}`, 30, 60 * 1000);
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: "Too many requests. Please slow down." }, { status: 429 });
  }

  // 3. Admin Authorization (Item 13)
  if (!checkRequestAdminAuth(request)) {
    return NextResponse.json(
      { error: "Access Denied: Only Server Owner & Administrators can update suggestion status." },
      { status: 403 }
    );
  }

  try {
    const user = await getCurrentUser();
    const body = await request.json();
    const { id, status, guildId: reqGuildId } = body;
    const guildId = await resolveGuildId(reqGuildId || user?.guildId);

    // 4. BOLA Check (Item 5 & 14)
    if (!verifyUserGuildAccess(user, guildId)) {
      return NextResponse.json({ error: "Access Denied: You do not have permissions for this server." }, { status: 403 });
    }

    if (!id || !status) {
      return NextResponse.json({ error: "id and status are required" }, { status: 400 });
    }

    const validStatuses = ["PENDING", "APPROVED", "IN PROGRESS", "IMPLEMENTED", "REJECTED"];
    const cleanStatus = status.toUpperCase().trim();

    if (!validStatuses.includes(cleanStatus)) {
      return NextResponse.json({ error: `Invalid status: ${status}` }, { status: 400 });
    }

    // Tenant-isolated update
    await query(
      "UPDATE feature_requests SET status = $1 WHERE id = $2 AND guild_id = $3",
      [cleanStatus, parseInt(id, 10), guildId]
    );

    return NextResponse.json({
      success: true,
      status: cleanStatus,
      message: `Suggestion #${id} updated to ${cleanStatus}.`,
    });
  } catch (error: any) {
    console.error("Suggestions PATCH Error:", redactSensitive(error.message || ""));
    return NextResponse.json(
      { error: "Failed to update suggestion status" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  // 1. CSRF Protection (Item 3)
  if (!validateCsrfOrigin(request)) {
    return NextResponse.json({ error: "Invalid request origin (CSRF validation failed)" }, { status: 403 });
  }

  // 2. Admin Authorization (Item 13)
  if (!checkRequestAdminAuth(request)) {
    return NextResponse.json(
      { error: "Access Denied: Only Server Owner & Administrators can delete suggestions." },
      { status: 403 }
    );
  }

  try {
    const user = await getCurrentUser();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const guildId = await resolveGuildId(searchParams.get("guildId") || user?.guildId);

    // 3. BOLA Check (Item 5 & 14)
    if (!verifyUserGuildAccess(user, guildId)) {
      return NextResponse.json({ error: "Access Denied: You do not have permissions for this server." }, { status: 403 });
    }

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    // Tenant-isolated deletion
    await query(
      "DELETE FROM feature_requests WHERE id = $1 AND guild_id = $2",
      [parseInt(id, 10), guildId]
    );

    return NextResponse.json({
      success: true,
      message: `Suggestion #${id} deleted.`,
    });
  } catch (error: any) {
    console.error("Suggestions DELETE Error:", redactSensitive(error.message || ""));
    return NextResponse.json(
      { error: "Failed to delete suggestion" },
      { status: 500 }
    );
  }
}
