import { NextResponse } from "next/server";
import { checkRequestAuth } from "@/lib/auth";
import { query, queryOne } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!checkRequestAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const guildId = searchParams.get("guildId") || process.env.DEFAULT_GUILD_ID || "1520461877073674392";

    // 1. Fetch guild settings
    let settings = await queryOne(
      "SELECT * FROM guild_settings WHERE guild_id = $1",
      [guildId]
    );

    if (!settings) {
      // Ensure row exists
      await query(
        "INSERT INTO guild_settings (guild_id) VALUES ($1) ON CONFLICT DO NOTHING",
        [guildId]
      );
      settings = await queryOne(
        "SELECT * FROM guild_settings WHERE guild_id = $1",
        [guildId]
      );
    }

    // 2. Fetch counts
    const jailCountRes = await queryOne(
      "SELECT COUNT(*) as count FROM automod_jails WHERE guild_id = $1",
      [guildId]
    );
    const jailedCount = parseInt(jailCountRes?.count || "0", 10);

    const whitelistCountRes = await queryOne(
      "SELECT COUNT(*) as count FROM security_whitelist WHERE guild_id = $1",
      [guildId]
    );
    const whitelistCount = parseInt(whitelistCountRes?.count || "0", 10);

    const incidentCountRes = await queryOne(
      "SELECT COUNT(*) as count FROM security_incidents WHERE guild_id = $1",
      [guildId]
    );
    const incidentCount = parseInt(incidentCountRes?.count || "0", 10);

    // 3. Fetch recent 20 security incidents
    const incidents = await query(
      `SELECT id, user_id, module, action_taken, severity, risk_score, details, created_at 
       FROM security_incidents 
       WHERE guild_id = $1 
       ORDER BY created_at DESC 
       LIMIT 20`,
      [guildId]
    );

    return NextResponse.json({
      guildId,
      settings: settings || {},
      raidState: settings?.anti_raid_state || "NORMAL",
      stats: {
        jailedCount,
        whitelistCount,
        incidentCount,
      },
      incidents,
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
