import { NextResponse } from "next/server";
import { checkRequestAuth, checkRequestAdminAuth, getCurrentUser } from "@/lib/auth";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!checkRequestAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await getCurrentUser();
    const { searchParams } = new URL(request.url);
    const guildId =
      searchParams.get("guildId") ||
      user?.guildId ||
      process.env.DEFAULT_GUILD_ID ||
      "1520461877073674392";

    const jailedUsers = await query(
      `SELECT id, guild_id, user_id, mod_id, reason, jailed_at, release_at, case_id
       FROM automod_jails 
       WHERE guild_id = $1 
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
    return NextResponse.json({ error: error.message || "Failed to fetch quarantine roster" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!checkRequestAdminAuth(request)) {
    return NextResponse.json({ error: "Access Denied: Only Server Owner & Administrators can modify quarantine." }, { status: 403 });
  }

  try {
    const user = await getCurrentUser();
    const body = await request.json();
    const { userId, action = "unjail", reason, durationMins, guildId: reqGuildId } = body;
    const guildId =
      reqGuildId ||
      user?.guildId ||
      process.env.DEFAULT_GUILD_ID ||
      "1520461877073674392";

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    const cleanUserId = String(userId).replace(/[<@!>]/g, "").trim();

    if (action === "jail") {
      const cleanReason = String(reason || "Quarantined via Web Dashboard").trim();
      const modId = user?.id === "admin" ? 0 : (user?.id || 0);
      const mins = durationMins ? parseInt(durationMins, 10) : null;
      const releaseAt = mins ? new Date(Date.now() + mins * 60000).toISOString() : null;

      await query(
        `INSERT INTO automod_jails (guild_id, user_id, mod_id, reason, release_at)
         VALUES ($1, $2, $3, $4, $5)`,
        [guildId, cleanUserId, modId, cleanReason, releaseAt]
      );

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
        message: `User ${cleanUserId} placed into quarantine isolation.`
      });
    }

    // Default: UNJAIL
    await query(
      "DELETE FROM automod_jails WHERE guild_id = $1 AND user_id = $2",
      [guildId, cleanUserId]
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
      message: `User ${cleanUserId} released from quarantine.`
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to process quarantine request" }, { status: 500 });
  }
}
