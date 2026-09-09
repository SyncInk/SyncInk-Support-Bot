import { NextResponse } from "next/server";
import { checkRequestAuth, checkRequestAdminAuth, getCurrentUser } from "@/lib/auth";
import { query, queryOne } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!checkRequestAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await getCurrentUser();
    const { searchParams } = new URL(request.url);
    
    // Dynamic guild ID fallback - query database if not in query or session
    let guildId = searchParams.get("guildId") || user?.guildId;
    if (!guildId) {
      const existing = await queryOne<{ guild_id: string }>(
        "SELECT guild_id FROM guild_settings ORDER BY guild_id LIMIT 1"
      ).catch(() => null);
      guildId = existing?.guild_id ? String(existing.guild_id) : process.env.DEFAULT_GUILD_ID || "1520457643842342912";
    }

    let settings = await queryOne(
      `SELECT 
        guild_id,
        log_channel_id,
        log_channel_moderation,
        log_channel_message,
        log_channel_member,
        log_channel_role,
        log_channel_channel,
        log_channel_voice,
        log_channel_verification,
        log_channel_server,
        log_channel_appeals,
        welcome_channel_id,
        suggestion_channel_id,
        jail_channel_id,
        jail_role_id,
        autorole_id,
        verification_role_id,
        unverified_role_id,
        quarantine_role_id,
        welcome_message,
        dm_welcome,
        auto_delete_welcome
      FROM guild_settings 
      WHERE guild_id = $1`,
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

    return NextResponse.json({
      guildId,
      channels: {
        log_channel_id: settings?.log_channel_id?.toString() || "",
        log_channel_moderation: settings?.log_channel_moderation?.toString() || settings?.log_channel_id?.toString() || "",
        log_channel_message: settings?.log_channel_message?.toString() || "",
        log_channel_member: settings?.log_channel_member?.toString() || "",
        log_channel_role: settings?.log_channel_role?.toString() || "",
        log_channel_channel: settings?.log_channel_channel?.toString() || "",
        log_channel_voice: settings?.log_channel_voice?.toString() || "",
        log_channel_verification: settings?.log_channel_verification?.toString() || "",
        log_channel_server: settings?.log_channel_server?.toString() || "",
        log_channel_appeals: settings?.log_channel_appeals?.toString() || "",
        welcome_channel_id: settings?.welcome_channel_id?.toString() || "",
        suggestion_channel_id: settings?.suggestion_channel_id?.toString() || "",
        jail_channel_id: settings?.jail_channel_id?.toString() || "",
      },
      roles: {
        jail_role_id: settings?.jail_role_id?.toString() || "",
        autorole_id: settings?.autorole_id?.toString() || "",
        verification_role_id: settings?.verification_role_id?.toString() || "",
        unverified_role_id: settings?.unverified_role_id?.toString() || "",
        quarantine_role_id: settings?.quarantine_role_id?.toString() || "",
      },
      welcome: {
        welcome_message: settings?.welcome_message || "",
        dm_welcome: Boolean(settings?.dm_welcome),
        auto_delete_welcome: Boolean(settings?.auto_delete_welcome),
      },
    });
  } catch (error: any) {
    console.error("Channels API Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch channel configuration" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  if (!checkRequestAdminAuth(request)) {
    return NextResponse.json(
      { error: "Access Denied: Only Server Owner & Administrators can modify channel routing." },
      { status: 403 }
    );
  }

  try {
    const user = await getCurrentUser();
    const body = await request.json();
    const { channels, roles, welcome, guildId: reqGuildId } = body;
    
    let guildId = reqGuildId || user?.guildId;
    if (!guildId) {
      const existing = await queryOne<{ guild_id: string }>(
        "SELECT guild_id FROM guild_settings ORDER BY guild_id LIMIT 1"
      ).catch(() => null);
      guildId = existing?.guild_id ? String(existing.guild_id) : process.env.DEFAULT_GUILD_ID || "1520457643842342912";
    }

    // Helper to sanitize discord mentions (<#1234...>) to pure BigInt string or null
    const cleanSnowflake = (val: any): string | null => {
      if (!val) return null;
      const digits = String(val).replace(/[^0-9]/g, "");
      return digits.length > 5 ? digits : null;
    };

    const cGeneral = cleanSnowflake(channels?.log_channel_id);
    const cMod = cleanSnowflake(channels?.log_channel_moderation) || cGeneral;
    const cMsg = cleanSnowflake(channels?.log_channel_message);
    const cMem = cleanSnowflake(channels?.log_channel_member);
    const cRole = cleanSnowflake(channels?.log_channel_role);
    const cChan = cleanSnowflake(channels?.log_channel_channel);
    const cVoice = cleanSnowflake(channels?.log_channel_voice);
    const cVerif = cleanSnowflake(channels?.log_channel_verification);
    const cServer = cleanSnowflake(channels?.log_channel_server);
    const cAppeals = cleanSnowflake(channels?.log_channel_appeals);
    const cWelcome = cleanSnowflake(channels?.welcome_channel_id);
    const cSuggest = cleanSnowflake(channels?.suggestion_channel_id);
    const cJail = cleanSnowflake(channels?.jail_channel_id);

    const rJail = cleanSnowflake(roles?.jail_role_id);
    const rAuto = cleanSnowflake(roles?.autorole_id);
    const rVerif = cleanSnowflake(roles?.verification_role_id);
    const rUnverif = cleanSnowflake(roles?.unverified_role_id);
    const rQuar = cleanSnowflake(roles?.quarantine_role_id);

    const welcomeMsg = welcome?.welcome_message ? String(welcome.welcome_message).trim() : null;
    const dmWelcome = Boolean(welcome?.dm_welcome);
    const autoDeleteWelcome = Boolean(welcome?.auto_delete_welcome);

    await query(
      `INSERT INTO guild_settings (
        guild_id,
        log_channel_id,
        log_channel_moderation,
        log_channel_message,
        log_channel_member,
        log_channel_role,
        log_channel_channel,
        log_channel_voice,
        log_channel_verification,
        log_channel_server,
        log_channel_appeals,
        welcome_channel_id,
        suggestion_channel_id,
        jail_channel_id,
        jail_role_id,
        autorole_id,
        verification_role_id,
        unverified_role_id,
        quarantine_role_id,
        welcome_message,
        dm_welcome,
        auto_delete_welcome
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22
      )
      ON CONFLICT (guild_id) DO UPDATE SET
        log_channel_id = COALESCE(EXCLUDED.log_channel_id, guild_settings.log_channel_id),
        log_channel_moderation = EXCLUDED.log_channel_moderation,
        log_channel_message = EXCLUDED.log_channel_message,
        log_channel_member = EXCLUDED.log_channel_member,
        log_channel_role = EXCLUDED.log_channel_role,
        log_channel_channel = EXCLUDED.log_channel_channel,
        log_channel_voice = EXCLUDED.log_channel_voice,
        log_channel_verification = EXCLUDED.log_channel_verification,
        log_channel_server = EXCLUDED.log_channel_server,
        log_channel_appeals = EXCLUDED.log_channel_appeals,
        welcome_channel_id = EXCLUDED.welcome_channel_id,
        suggestion_channel_id = EXCLUDED.suggestion_channel_id,
        jail_channel_id = EXCLUDED.jail_channel_id,
        jail_role_id = EXCLUDED.jail_role_id,
        autorole_id = EXCLUDED.autorole_id,
        verification_role_id = EXCLUDED.verification_role_id,
        unverified_role_id = EXCLUDED.unverified_role_id,
        quarantine_role_id = EXCLUDED.quarantine_role_id,
        welcome_message = EXCLUDED.welcome_message,
        dm_welcome = EXCLUDED.dm_welcome,
        auto_delete_welcome = EXCLUDED.auto_delete_welcome`,
      [
        guildId,
        cGeneral,
        cMod,
        cMsg,
        cMem,
        cRole,
        cChan,
        cVoice,
        cVerif,
        cServer,
        cAppeals,
        cWelcome,
        cSuggest,
        cJail,
        rJail,
        rAuto,
        rVerif,
        rUnverif,
        rQuar,
        welcomeMsg,
        dmWelcome,
        autoDeleteWelcome,
      ]
    );

    // Also log incident in forensics
    await query(
      `INSERT INTO security_incidents (guild_id, user_id, module, action_taken, severity, risk_score, details)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        guildId,
        user?.id === "admin" ? 0 : (user?.id || 0),
        "Channel Routing",
        "ROUTING SAVED",
        "LOW",
        0,
        "Log channel destinations and roles updated via Web Dashboard."
      ]
    ).catch(() => {});

    return NextResponse.json({
      success: true,
      message: "Channel & role destinations saved successfully. Synced to bot.",
    });
  } catch (error: any) {
    console.error("Channels Save Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to save channel routing" },
      { status: 500 }
    );
  }
}
