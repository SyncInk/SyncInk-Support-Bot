import { NextResponse } from "next/server";
import { checkRequestAuth, getCurrentUser, verifyUserGuildAccess } from "@/lib/auth";
import { query, queryOne, resolveGuildId } from "@/lib/db";
import { rateLimiter, getClientIp } from "@/lib/rate-limit";
import { redactSensitive } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!checkRequestAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rate limiting (Item 6)
  const clientIp = getClientIp(request);
  const rateLimit = rateLimiter.check(`sec_get_${clientIp}`, 60, 60 * 1000);
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: "Too many requests. Please slow down." }, { status: 429 });
  }

  try {
    const user = await getCurrentUser();
    const { searchParams } = new URL(request.url);
    const guildId = await resolveGuildId(searchParams.get("guildId") || user?.guildId);

    // BOLA Check: Verify user has rights to view this guild (Item 5 & 13)
    if (!verifyUserGuildAccess(user, guildId)) {
      return NextResponse.json({ error: "Access Denied: You do not have permission to view this server's security telemetry." }, { status: 403 });
    }

    // 1. Fetch guild settings (Row-Level Security - Item 14)
    let settings = await queryOne(
      "SELECT * FROM guild_settings WHERE guild_id = $1",
      [guildId]
    );

    if (!settings) {
      await query(
        "INSERT INTO guild_settings (guild_id) VALUES ($1) ON CONFLICT DO NOTHING",
        [guildId]
      );
      settings = await queryOne(
        "SELECT * FROM guild_settings WHERE guild_id = $1",
        [guildId]
      );
    }

    // 2. Fetch counts with fallbacks
    const [
      jailRes,
      whitelistRes,
      incidentRes,
      modRes,
      suggestRes,
      blacklistRes,
      violationsRes
    ] = await Promise.all([
      queryOne("SELECT COUNT(*) as count FROM automod_jails WHERE guild_id = $1", [guildId]).catch(() => ({ count: "0" })),
      queryOne("SELECT COUNT(*) as count FROM security_whitelist WHERE guild_id = $1", [guildId]).catch(() => ({ count: "0" })),
      queryOne("SELECT COUNT(*) as count FROM security_incidents WHERE guild_id = $1", [guildId]).catch(() => ({ count: "0" })),
      queryOne("SELECT COUNT(*) as count FROM mod_cases WHERE guild_id = $1", [guildId]).catch(() => ({ count: "0" })),
      queryOne("SELECT COUNT(*) as count FROM feature_requests WHERE guild_id = $1", [guildId]).catch(() => ({ count: "0" })),
      queryOne("SELECT COUNT(*) as count FROM automod_blacklist WHERE guild_id = $1", [guildId]).catch(() => ({ count: "0" })),
      queryOne("SELECT COUNT(*) as count FROM automod_violations WHERE guild_id = $1 AND created_at >= NOW() - INTERVAL '24 HOURS'", [guildId]).catch(() => ({ count: "0" })),
    ]);

    const jailedCount = parseInt(jailRes?.count || "0", 10);
    const whitelistCount = parseInt(whitelistRes?.count || "0", 10);
    const incidentCount = parseInt(incidentRes?.count || "0", 10);
    const modCasesCount = parseInt(modRes?.count || "0", 10);
    const suggestionsCount = parseInt(suggestRes?.count || "0", 10);
    const blacklistCount = parseInt(blacklistRes?.count || "0", 10);
    const violationsCount = parseInt(violationsRes?.count || "0", 10);

    // 3. Fetch recent 30 security incidents
    const incidents = await query(
      `SELECT id, user_id, module, action_taken, severity, risk_score, details, created_at 
       FROM security_incidents 
       WHERE guild_id = $1 
       ORDER BY created_at DESC 
       LIMIT 30`,
      [guildId]
    ).catch(() => []);

    return NextResponse.json({
      guildId,
      settings: settings || {},
      raidState: settings?.anti_raid_state || "NORMAL",
      stats: {
        jailedCount,
        whitelistCount,
        incidentCount,
        modCasesCount,
        suggestionsCount,
        blacklistCount,
        violationsCount,
      },
      incidents: incidents || [],
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Security API Error:", redactSensitive(error.message || ""));
    return NextResponse.json(
      { error: "Failed to query security state" },
      { status: 500 }
    );
  }
}
