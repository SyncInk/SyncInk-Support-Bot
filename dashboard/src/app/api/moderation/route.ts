import { NextResponse } from "next/server";
import { checkRequestAuth, checkRequestAdminAuth, getCurrentUser, verifyUserGuildAccess } from "@/lib/auth";
import { query, queryOne, resolveGuildId } from "@/lib/db";
import { validateCsrfOrigin, redactSensitive } from "@/lib/security";
import { rateLimiter, getClientIp } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!checkRequestAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const clientIp = getClientIp(request);
  const rateLimit = rateLimiter.check(`mod_get_${clientIp}`, 60, 60 * 1000);
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

    const actionFilter = searchParams.get("action");
    const searchQuery = searchParams.get("search")?.trim() || "";
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50", 10)));

    let sql = `
      SELECT case_id, guild_id, user_id, mod_id, action, reason, created_at
      FROM mod_cases
      WHERE guild_id = $1
    `;
    const params: any[] = [guildId];

    if (actionFilter && actionFilter !== "ALL") {
      params.push(actionFilter.toUpperCase());
      sql += ` AND UPPER(action) = $${params.length}`;
    }

    if (searchQuery) {
      params.push(`%${searchQuery.slice(0, 100)}%`);
      sql += ` AND (user_id::text LIKE $${params.length} OR mod_id::text LIKE $${params.length} OR reason ILIKE $${params.length})`;
    }

    sql += ` ORDER BY created_at DESC LIMIT $${params.length + 1}`;
    params.push(limit);

    const cases = await query(sql, params).catch(async (err) => {
      console.warn("mod_cases query error, creating table if not exists:", redactSensitive(err.message || ""));
      await query(`
        CREATE TABLE IF NOT EXISTS mod_cases (
          case_id SERIAL PRIMARY KEY,
          guild_id BIGINT NOT NULL,
          user_id BIGINT NOT NULL,
          mod_id BIGINT NOT NULL,
          action VARCHAR(50) NOT NULL,
          reason TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      return [];
    });

    const totalCountRes = await queryOne(
      "SELECT COUNT(*) as count FROM mod_cases WHERE guild_id = $1",
      [guildId]
    ).catch(() => ({ count: "0" }));

    return NextResponse.json(
      {
        cases: cases || [],
        total: parseInt(totalCountRes?.count || "0", 10),
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
          "Pragma": "no-cache",
        },
      }
    );
  } catch (error: any) {
    console.error("Moderation API Error:", redactSensitive(error.message || ""));
    return NextResponse.json(
      { error: "Failed to query moderation cases" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  // 1. CSRF Protection (Item 3)
  if (!validateCsrfOrigin(request)) {
    return NextResponse.json({ error: "Invalid request origin (CSRF validation failed)" }, { status: 403 });
  }

  // 2. Rate Limiting (Item 6)
  const clientIp = getClientIp(request);
  const rateLimit = rateLimiter.check(`mod_post_${clientIp}`, 30, 60 * 1000);
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: "Too many moderation requests. Please slow down." }, { status: 429 });
  }

  // 3. Admin Authorization (Item 13)
  if (!checkRequestAdminAuth(request)) {
    return NextResponse.json(
      { error: "Access Denied: Only Server Owner & Administrators can issue moderation actions." },
      { status: 403 }
    );
  }

  try {
    const user = await getCurrentUser();
    const body = await request.json();
    const { userId, action, reason, durationMins, guildId: reqGuildId } = body;
    const guildId = await resolveGuildId(reqGuildId || user?.guildId);

    // 4. BOLA Check (Item 5 & 14)
    if (!verifyUserGuildAccess(user, guildId)) {
      return NextResponse.json({ error: "Access Denied: You do not have permissions for this server." }, { status: 403 });
    }

    if (!userId || !action) {
      return NextResponse.json(
        { error: "User ID and action type are required" },
        { status: 400 }
      );
    }

    const cleanUserId = String(userId).replace(/[^0-9]/g, "").trim();
    if (!cleanUserId || cleanUserId.length < 5) {
      return NextResponse.json({ error: "Invalid Discord User ID format." }, { status: 400 });
    }

    const allowedActions = ["BAN", "UNBAN", "KICK", "WARN", "TIMEOUT", "UNTIMEOUT", "MUTE", "UNMUTE"];
    const cleanAction = String(action).toUpperCase().trim();
    if (!allowedActions.includes(cleanAction)) {
      return NextResponse.json({ error: `Invalid moderation action: ${cleanAction}` }, { status: 400 });
    }

    const cleanReason = String(reason || "Action applied via Web Dashboard").slice(0, 500).trim();
    const modId = user?.id === "admin" ? 0 : (user?.id || 0);
    const parsedMins = durationMins ? Math.min(43200, Math.max(1, parseInt(durationMins, 10))) : null;

    const result = await queryOne(
      `INSERT INTO mod_cases (guild_id, user_id, mod_id, action, reason)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING case_id, created_at`,
      [guildId, cleanUserId, modId, cleanAction, cleanReason]
    );

    // Queue action for live Discord bot execution
    await query(`
      CREATE TABLE IF NOT EXISTS pending_bot_actions (
        id SERIAL PRIMARY KEY,
        guild_id BIGINT NOT NULL,
        user_id BIGINT NOT NULL,
        action VARCHAR(50) NOT NULL,
        mod_id BIGINT,
        reason TEXT,
        duration_mins INT,
        status VARCHAR(20) DEFAULT 'PENDING',
        error_message TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        processed_at TIMESTAMP
      );
    `).catch(() => {});

    await query(
      `INSERT INTO pending_bot_actions (guild_id, user_id, action, mod_id, reason, duration_mins)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [guildId, cleanUserId, cleanAction, modId, cleanReason, parsedMins]
    );

    // Forensic incident logging
    await query(
      `INSERT INTO security_incidents (guild_id, user_id, module, action_taken, severity, risk_score, details)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        guildId,
        cleanUserId,
        "Moderation Dispatch",
        cleanAction,
        ["BAN", "KICK"].includes(cleanAction) ? "HIGH" : "MEDIUM",
        ["BAN"].includes(cleanAction) ? 80 : 40,
        `Case #${result?.case_id || "?"}: ${cleanReason} (by ${user?.username || "Admin"})`,
      ]
    );

    return NextResponse.json({
      success: true,
      caseId: result?.case_id,
      message: `Successfully executed moderation case for ${cleanUserId} (${cleanAction}). Bot is applying action in Discord.`,
    });
  } catch (error: any) {
    console.error("Moderation POST Error:", redactSensitive(error.message || ""));
    return NextResponse.json(
      { error: "Failed to record moderation action" },
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
      { error: "Access Denied: Only Server Owner & Administrators can remove moderation cases." },
      { status: 403 }
    );
  }

  try {
    const user = await getCurrentUser();
    const { searchParams } = new URL(request.url);
    const caseId = searchParams.get("caseId");
    const guildId = await resolveGuildId(searchParams.get("guildId") || user?.guildId);

    // 3. BOLA Check (Item 5 & 14)
    if (!verifyUserGuildAccess(user, guildId)) {
      return NextResponse.json({ error: "Access Denied: You do not have permissions for this server." }, { status: 403 });
    }

    if (!caseId) {
      return NextResponse.json({ error: "caseId is required" }, { status: 400 });
    }

    // Tenant-scoped deletion (prevents IDOR where admin from Guild A deletes Guild B's cases)
    await query(
      "DELETE FROM mod_cases WHERE case_id = $1 AND guild_id = $2",
      [parseInt(caseId, 10), guildId]
    );

    return NextResponse.json({
      success: true,
      message: `Case #${caseId} successfully removed.`,
    });
  } catch (error: any) {
    console.error("Moderation DELETE Error:", redactSensitive(error.message || ""));
    return NextResponse.json(
      { error: "Failed to delete case" },
      { status: 500 }
    );
  }
}
