import { NextResponse } from "next/server";
import { checkRequestAuth, checkRequestAdminAuth, getCurrentUser } from "@/lib/auth";
import { query } from "@/lib/db";

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
    );

    return NextResponse.json({ jailedUsers });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch quarantine roster" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!checkRequestAdminAuth(request)) {
    return NextResponse.json({ error: "Access Denied: Only Server Owner & Administrators can unjail users." }, { status: 403 });
  }

  try {
    const user = await getCurrentUser();
    const body = await request.json();
    const { userId, guildId: reqGuildId } = body;
    const guildId =
      reqGuildId ||
      user?.guildId ||
      process.env.DEFAULT_GUILD_ID ||
      "1520461877073674392";

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    await query(
      "DELETE FROM automod_jails WHERE guild_id = $1 AND user_id = $2",
      [guildId, userId]
    );

    // Also log incident
    await query(
      `INSERT INTO security_incidents (guild_id, user_id, module, action_taken, severity, risk_score, details)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        guildId,
        userId,
        "Quarantine & Isolation",
        "RELEASED VIA DASHBOARD",
        "LOW",
        0,
        "Quarantine penalty lifted by administrator via Web Dashboard."
      ]
    );

    return NextResponse.json({
      success: true,
      message: `User ${userId} released from quarantine.`
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to release user" }, { status: 500 });
  }
}
