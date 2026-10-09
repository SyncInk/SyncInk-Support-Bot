import { NextResponse } from "next/server";
import { checkRequestAuth, checkRequestAdminAuth, getCurrentUser, verifyUserGuildAccess } from "@/lib/auth";
import { query, resolveGuildId } from "@/lib/db";
import { validateCsrfOrigin, redactSensitive } from "@/lib/security";
import { rateLimiter, getClientIp } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

async function ensureActionQueueTable() {
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
}

export async function GET(request: Request) {
  if (!checkRequestAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rate Limiting (Item 6)
  const clientIp = getClientIp(request);
  const rateLimit = rateLimiter.check(`sec_quar_get_${clientIp}`, 60, 60 * 1000);
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

    const jailedUsers = await query(
      `SELECT id, guild_id, user_id, mod_id, reason, jailed_at, release_at, case_id
       FROM automod_jails 
       WHERE guild_id = $1 AND (release_at IS NULL OR release_at > CURRENT_TIMESTAMP)
       ORDER BY jailed_at DESC`,
      [guildId]
    ).catch(async () => {
      await query(`
        CREATE TABLE IF NOT EXISTS automod_jails (
          id SERIAL PRIMARY KEY,
          guild_id BIGINT NOT NULL,
          user_id BIGINT NOT NULL,
          mod_id BIGINT,
          reason TEXT,
          previous_roles TEXT,
          jailed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          release_at TIMESTAMP,
          case_id INT
        );
      `);
      return [];
    });

    return NextResponse.json({ jailedUsers: jailedUsers || [] });
  } catch (error: any) {
    console.error("Quarantine GET Error:", redactSensitive(error.message || ""));
    return NextResponse.json({ error: "Failed to fetch quarantine roster" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  // 1. CSRF Protection (Item 3)
  if (!validateCsrfOrigin(request)) {
    return NextResponse.json({ error: "Invalid request origin (CSRF validation failed)" }, { status: 403 });
  }

  // 2. Rate Limiting (Item 6)
  const clientIp = getClientIp(request);
  const rateLimit = rateLimiter.check(`sec_quar_post_${clientIp}`, 30, 60 * 1000);
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: "Too many quarantine actions. Please slow down." }, { status: 429 });
  }

  // 3. Admin Authorization (Item 13)
  if (!checkRequestAdminAuth(request)) {
    return NextResponse.json({ error: "Access Denied: Only Server Owner & Administrators can modify quarantine." }, { status: 403 });
  }

  try {
    const user = await getCurrentUser();
    const body = await request.json();
    const { userId, action = "unjail", reason, durationMins, guildId: reqGuildId } = body;
    const guildId = await resolveGuildId(reqGuildId || user?.guildId);

    // 4. BOLA Check (Item 5 & 14)
    if (!verifyUserGuildAccess(user, guildId)) {
      return NextResponse.json({ error: "Access Denied: You do not have permissions for this server." }, { status: 403 });
    }

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    // Sanitize snowflake to pure digits
    const cleanUserId = String(userId).replace(/[^0-9]/g, "").trim();
    if (!cleanUserId || cleanUserId.length < 5) {
      return NextResponse.json({ error: "Invalid Discord User ID." }, { status: 400 });
    }

    await ensureActionQueueTable();

    if (action === "jail") {
      const cleanReason = String(reason || "Quarantined via Web Dashboard").slice(0, 500).trim();
      const modId = user?.id === "admin" ? 0 : (user?.id || 0);
      const mins = durationMins ? Math.min(43200, Math.max(1, parseInt(durationMins, 10))) : null;
      const releaseAt = mins ? new Date(Date.now() + mins * 60000).toISOString() : null;

      // 1. Check existing record in automod_jails
      const existing = await query(
        "SELECT id FROM automod_jails WHERE guild_id = $1 AND user_id = $2",
        [guildId, cleanUserId]
      ).catch(() => []);

      if (existing && existing.length > 0) {
        await query(
          `UPDATE automod_jails 
           SET mod_id = $1, reason = $2, release_at = $3, jailed_at = CURRENT_TIMESTAMP
           WHERE guild_id = $4 AND user_id = $5`,
          [modId, cleanReason, releaseAt, guildId, cleanUserId]
        );
      } else {
        await query(
          `INSERT INTO automod_jails (guild_id, user_id, mod_id, reason, release_at)
           VALUES ($1, $2, $3, $4, $5)`,
          [guildId, cleanUserId, modId, cleanReason, releaseAt]
        );
      }

      // 2. Queue real-time Discord action for the bot
      await query(
        `INSERT INTO pending_bot_actions (guild_id, user_id, action, mod_id, reason, duration_mins)
         VALUES ($1, $2, 'JAIL', $3, $4, $5)`,
        [guildId, cleanUserId, modId, cleanReason, mins]
      );

      // 3. Log forensic incident
      await query(
        `INSERT INTO security_incidents (guild_id, user_id, module, action_taken, severity, risk_score, details)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          guildId,
          cleanUserId,
          "Quarantine & Isolation",
          "MANUAL JAIL",
          "HIGH",
          70,
          `Quarantined by ${user?.username || "Admin"}: ${cleanReason}`
        ]
      );

      return NextResponse.json({
        success: true,
        message: `User ${cleanUserId} placed into quarantine isolation. Bot is syncing roles in Discord.`
      });
    }

    // Default: UNJAIL
    const modId = user?.id === "admin" ? 0 : (user?.id || 0);

    // 1. Mark automod_jails as expiring immediately
    await query(
      `UPDATE automod_jails 
       SET release_at = CURRENT_TIMESTAMP - INTERVAL '1 second', reason = 'Unjailed via Web Dashboard'
       WHERE guild_id = $1 AND user_id = $2`,
      [guildId, cleanUserId]
    );

    // 2. Queue real-time Discord action for the bot
    await query(
      `INSERT INTO pending_bot_actions (guild_id, user_id, action, mod_id, reason)
       VALUES ($1, $2, 'UNJAIL', $3, $4)`,
      [guildId, cleanUserId, modId, "Unjailed via Web Dashboard"]
    );

    await query(
      `INSERT INTO security_incidents (guild_id, user_id, module, action_taken, severity, risk_score, details)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        guildId,
        cleanUserId,
        "Quarantine & Isolation",
        "RELEASED VIA DASHBOARD",
        "LOW",
        0,
        "Quarantine penalty lifted by administrator via Web Dashboard."
      ]
    );

    return NextResponse.json({
      success: true,
      message: `User ${cleanUserId} unjail command queued. Bot is restoring Discord roles.`
    });
  } catch (error: any) {
    console.error("Quarantine POST Error:", redactSensitive(error.message || ""));
    return NextResponse.json({ error: "Failed to process quarantine request" }, { status: 500 });
  }
}
