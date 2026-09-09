import { NextResponse } from "next/server";
import { checkRequestAuth, checkRequestAdminAuth, getCurrentUser } from "@/lib/auth";
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
    console.error("AutoMod GET Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch automod configuration" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
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

    if (!pattern || !pattern.trim()) {
      return NextResponse.json(
        { error: "Pattern / Keyword is required" },
        { status: 400 }
      );
    }

    const cleanPattern = pattern.trim();
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
    console.error("AutoMod POST Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to add blacklist pattern" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  if (!checkRequestAdminAuth(request)) {
    return NextResponse.json(
      { error: "Access Denied: Only Server Owner & Administrators can delete blacklist patterns." },
      { status: 403 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const resetUser = searchParams.get("resetUser");
    const guildId = await resolveGuildId(searchParams.get("guildId"));

    if (resetUser) {
      await query(
        "DELETE FROM automod_violations WHERE guild_id = $1 AND user_id = $2",
        [guildId, resetUser]
      );
      return NextResponse.json({
        success: true,
        message: `Strikes reset for user ${resetUser}.`,
      });
    }

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    await query("DELETE FROM automod_blacklist WHERE id = $1", [parseInt(id, 10)]);

    return NextResponse.json({
      success: true,
      message: "Blacklist pattern deleted.",
    });
  } catch (error: any) {
    console.error("AutoMod DELETE Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete pattern" },
      { status: 500 }
    );
  }
}
