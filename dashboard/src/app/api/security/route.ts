import { NextResponse } from "next/server";
import { checkRequestAuth, getCurrentUser } from "@/lib/auth";
import { query, queryOne, resolveGuildId } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!checkRequestAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await getCurrentUser();
    const { searchParams } = new URL(request.url);
    const guildId = await resolveGuildId(searchParams.get("guildId") || user?.guildId);

    // 1. Fetch guild settings
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
    console.error("Security API Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to query security state" },
      { status: 500 }
    );
  }
}
