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
  const rateLimit = rateLimiter.check(`automod_get_${clientIp}`, 60, 60 * 1000);
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

    // 1. Fetch Blacklist items
    const blacklist = await query(
      `SELECT id, guild_id, pattern, match_type, points, COALESCE(severity, 'MEDIUM') as severity
       FROM automod_blacklist
       WHERE guild_id = $1
       ORDER BY id DESC`,
      [guildId]
    ).catch(async () => {
      await query(`
        CREATE TABLE IF NOT EXISTS automod_blacklist (
          id SERIAL PRIMARY KEY,
          guild_id BIGINT NOT NULL,
          pattern TEXT NOT NULL,
          match_type VARCHAR(20) NOT NULL,
          points INT NOT NULL DEFAULT 1,
          severity VARCHAR(20) DEFAULT 'MEDIUM',
          UNIQUE(guild_id, pattern)
        );
      `);
      return [];
    });

    // 2. Fetch Recent 24h Violations
    const violations = await query(
      `SELECT id, guild_id, user_id, reason, detection_type, created_at
       FROM automod_violations
       WHERE guild_id = $1 AND created_at >= NOW() - INTERVAL '24 HOURS'
       ORDER BY created_at DESC
       LIMIT 50`,
      [guildId]
    ).catch(async () => {
      await query(`
        CREATE TABLE IF NOT EXISTS automod_violations (
          id SERIAL PRIMARY KEY,
          guild_id BIGINT NOT NULL,
          user_id BIGINT NOT NULL,
          reason TEXT NOT NULL,
          detection_type VARCHAR(50) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      return [];
    });

    return NextResponse.json({
      blacklist: blacklist || [],
      violations: violations || [],
    });
  } catch (error: any) {
    console.error("AutoMod GET Error:", redactSensitive(error.message || ""));
    return NextResponse.json(
      { error: "Failed to fetch automod configuration" },
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
  const rateLimit = rateLimiter.check(`automod_post_${clientIp}`, 30, 60 * 1000);
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: "Too many requests. Please slow down." }, { status: 429 });
  }

  // 3. Admin Authorization (Item 13)
  if (!checkRequestAdminAuth(request)) {
    return NextResponse.json(
      { error: "Access Denied: Only Server Owner & Administrators can add blacklist patterns." },
      { status: 403 }
    );
  }

  try {
    const user = await getCurrentUser();
    const body = await request.json();
    const { pattern, matchType = "contains", points = 1, severity = "MEDIUM", guildId: reqGuildId } = body;
    const guildId = await resolveGuildId(reqGuildId || user?.guildId);

    // 4. BOLA Check (Item 5 & 14)
    if (!verifyUserGuildAccess(user, guildId)) {
      return NextResponse.json({ error: "Access Denied: You do not have permissions for this server." }, { status: 403 });
    }

    if (!pattern || !pattern.trim()) {
      return NextResponse.json(
        { error: "Pattern / Keyword is required" },
        { status: 400 }
      );
    }

    const cleanPattern = pattern.slice(0, 500).trim();
    const validMatchTypes = ["contains", "exact", "regex", "wildcard", "invite", "link"];
    const type = validMatchTypes.includes(matchType?.toLowerCase()) ? matchType.toLowerCase() : "contains";
    const pts = Math.min(10, Math.max(1, parseInt(points || "1", 10)));
    const validSeverities = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
    const sev = validSeverities.includes(severity?.toUpperCase()) ? severity.toUpperCase() : "MEDIUM";

    await query(
      `INSERT INTO automod_blacklist (guild_id, pattern, match_type, points, severity)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (guild_id, pattern) DO UPDATE SET
         match_type = EXCLUDED.match_type,
         points = EXCLUDED.points,
         severity = EXCLUDED.severity`,
      [guildId, cleanPattern, type, pts, sev]
    );

    return NextResponse.json({
      success: true,
      message: `Pattern "${cleanPattern}" added to AutoMod blacklist.`,
    });
  } catch (error: any) {
    console.error("AutoMod POST Error:", redactSensitive(error.message || ""));
    return NextResponse.json(
      { error: "Failed to add blacklist pattern" },
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
      { error: "Access Denied: Only Server Owner & Administrators can delete blacklist patterns." },
      { status: 403 }
    );
  }

  try {
    const user = await getCurrentUser();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const resetUser = searchParams.get("resetUser");
    const guildId = await resolveGuildId(searchParams.get("guildId") || user?.guildId);

    // 3. BOLA Check (Item 5 & 14)
    if (!verifyUserGuildAccess(user, guildId)) {
      return NextResponse.json({ error: "Access Denied: You do not have permissions for this server." }, { status: 403 });
    }

    if (resetUser) {
      const cleanResetUser = String(resetUser).replace(/[^0-9]/g, "");
      await query(
        "DELETE FROM automod_violations WHERE guild_id = $1 AND user_id = $2",
        [guildId, cleanResetUser]
      );
      return NextResponse.json({
        success: true,
        message: `Strikes reset for user ${cleanResetUser}.`,
      });
    }

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    // Tenant-scoped deletion (Item 5 & 14)
    await query("DELETE FROM automod_blacklist WHERE id = $1 AND guild_id = $2", [parseInt(id, 10), guildId]);

    return NextResponse.json({
      success: true,
      message: "Blacklist pattern deleted.",
    });
  } catch (error: any) {
    console.error("AutoMod DELETE Error:", redactSensitive(error.message || ""));
    return NextResponse.json(
      { error: "Failed to delete pattern" },
      { status: 500 }
    );
  }
}
