import { NextResponse } from "next/server";
import { checkRequestAdminAuth } from "@/lib/auth";
import { query, queryOne } from "@/lib/db";

export async function POST(request: Request) {
  if (!checkRequestAdminAuth(request)) {
    return NextResponse.json({ error: "Access Denied: Only Server Owner & Administrators can modify security controls." }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { module, value, guildId: reqGuildId } = body;
    const guildId = reqGuildId || process.env.DEFAULT_GUILD_ID || "1520461877073674392";

    // 1. Emergency Lockdown Toggle
    if (module === "emergency_lockdown") {
      const current = await queryOne(
        "SELECT anti_raid_state FROM guild_settings WHERE guild_id = $1",
        [guildId]
      );
      const currentState = current?.anti_raid_state || "NORMAL";
      const newState = currentState === "LOCKDOWN" ? "NORMAL" : "LOCKDOWN";

      await query(
        "UPDATE guild_settings SET anti_raid_state = $1 WHERE guild_id = $2",
        [newState, guildId]
      );

      // Log incident into security_incidents
      await query(
        `INSERT INTO security_incidents (guild_id, user_id, module, action_taken, severity, risk_score, details)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          guildId,
          0,
          "Emergency Lockdown",
          newState === "LOCKDOWN" ? "LOCKDOWN ACTIVATED" : "LOCKDOWN LIFTED",
          newState === "LOCKDOWN" ? "CRITICAL" : "LOW",
          100,
          `Triggered from Web Dashboard by Administrator`
        ]
      );

      return NextResponse.json({
        success: true,
        module: "emergency_lockdown",
        newState,
        message: newState === "LOCKDOWN" ? "Emergency Lockdown Activated!" : "Lockdown Lifted. Returned to NORMAL."
      });
    }

    // 2. Standard Module Toggles
    const allowedModules = [
      "anti_nuke_enabled",
      "anti_raid_enabled",
      "automod_enabled",
      "anti_phishing_enabled",
      "mention_guard_enabled",
      "content_filter_enabled",
      "mass_bot_protection_enabled",
      "ghost_ping_detection_enabled",
      "verification_enabled"
    ];

    if (!allowedModules.includes(module)) {
      return NextResponse.json({ error: `Invalid module name: ${module}` }, { status: 400 });
    }

    const boolVal = Boolean(value);
    await query(
      `INSERT INTO guild_settings (guild_id, ${module}) VALUES ($1, $2)
       ON CONFLICT (guild_id) DO UPDATE SET ${module} = $2`,
      [guildId, boolVal]
    );

    return NextResponse.json({
      success: true,
      module,
      value: boolVal,
      message: `Updated ${module} to ${boolVal ? "ENABLED" : "DISABLED"}`
    });
  } catch (error: any) {
    console.error("Toggle API Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update module state" },
      { status: 500 }
    );
  }
}
