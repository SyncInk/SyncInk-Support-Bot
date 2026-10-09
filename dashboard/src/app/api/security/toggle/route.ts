import { NextResponse } from "next/server";
import { checkRequestAdminAuth, getCurrentUser, verifyUserGuildAccess } from "@/lib/auth";
import { query, queryOne, resolveGuildId } from "@/lib/db";
import { validateCsrfOrigin, redactSensitive } from "@/lib/security";
import { rateLimiter, getClientIp } from "@/lib/rate-limit";

export async function POST(request: Request) {
  // 1. CSRF Protection (Item 3)
  if (!validateCsrfOrigin(request)) {
    return NextResponse.json({ error: "Invalid request origin (CSRF validation failed)" }, { status: 403 });
  }

  // 2. Rate Limiting: 30 requests per minute per IP (Item 6)
  const clientIp = getClientIp(request);
  const rateLimit = rateLimiter.check(`sec_toggle_${clientIp}`, 30, 60 * 1000);
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: "Too many security configuration changes. Please slow down." }, { status: 429 });
  }

  // 3. Admin Authorization (Item 13)
  if (!checkRequestAdminAuth(request)) {
    return NextResponse.json({ error: "Access Denied: Only Server Owner & Administrators can modify security controls." }, { status: 403 });
  }

  try {
    const user = await getCurrentUser();
    const body = await request.json();
    const { module, value, guildId: reqGuildId } = body;
    const guildId = await resolveGuildId(reqGuildId || user?.guildId);

    // 4. BOLA Protection: Verify user owns/administers this target guild (Item 5 & 14)
    if (!verifyUserGuildAccess(user, guildId)) {
      return NextResponse.json({ error: "Access Denied: You do not have permissions to modify this server's configuration." }, { status: 403 });
    }

    // 5. Emergency Lockdown Toggle & Step-Up / Owner Guard (Item 10)
    if (module === "emergency_lockdown") {
      // Step-up verification: require server ownership or master admin
      if (!user?.isOwner && user?.id !== "admin") {
        return NextResponse.json(
          { error: "Step-up authorization failed: Only Server Owner can toggle Emergency Lockdown." },
          { status: 403 }
        );
      }

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
          user?.id === "admin" ? 0 : (user?.id || 0),
          "Emergency Lockdown",
          newState === "LOCKDOWN" ? "LOCKDOWN ACTIVATED" : "LOCKDOWN LIFTED",
          newState === "LOCKDOWN" ? "CRITICAL" : "LOW",
          100,
          `Triggered from Web Dashboard by ${user?.username || "Administrator"}`
        ]
      );

      return NextResponse.json({
        success: true,
        module: "emergency_lockdown",
        newState,
        message: newState === "LOCKDOWN" ? "Emergency Lockdown Activated!" : "Lockdown Lifted. Returned to NORMAL."
      });
    }

    // 6. Whitelisted Module Toggles (SQL injection prevention - Item 1)
    const allowedModules: Record<string, string> = {
      anti_nuke_enabled: "anti_nuke_enabled",
      anti_raid_enabled: "anti_raid_enabled",
      automod_enabled: "automod_enabled",
      anti_phishing_enabled: "anti_phishing_enabled",
      mention_guard_enabled: "mention_guard_enabled",
      content_filter_enabled: "content_filter_enabled",
      mass_bot_protection_enabled: "mass_bot_protection_enabled",
      ghost_ping_detection_enabled: "ghost_ping_detection_enabled",
      verification_enabled: "verification_enabled"
    };

    const targetColumn = allowedModules[module];
    if (!targetColumn) {
      return NextResponse.json({ error: `Invalid module name: ${module}` }, { status: 400 });
    }

    const boolVal = Boolean(value);
    await query(
      `INSERT INTO guild_settings (guild_id, ${targetColumn}) VALUES ($1, $2)
       ON CONFLICT (guild_id) DO UPDATE SET ${targetColumn} = $2`,
      [guildId, boolVal]
    );

    return NextResponse.json({
      success: true,
      module: targetColumn,
      value: boolVal,
      message: `Updated ${targetColumn} to ${boolVal ? "ENABLED" : "DISABLED"}`
    });
  } catch (error: any) {
    console.error("Toggle API Error:", redactSensitive(error.message || ""));
    return NextResponse.json(
      { error: "Failed to update module state" },
      { status: 500 }
    );
  }
}
