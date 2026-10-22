import { NextResponse } from "next/server";
import { checkRequestAuth, getCurrentUser, verifyUserGuildAccess } from "@/lib/auth";
import { query, queryOne, resolveGuildId } from "@/lib/db";
import { rateLimiter, getClientIp } from "@/lib/rate-limit";
import { redactSensitive } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!checkRequestAuth(request)) {
    // Return public safe metrics for official support server
    const clientIp = getClientIp(request);
    const rateLimit = rateLimiter.check(`sec_pub_${clientIp}`, 60, 60 * 1000);
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    try {
      const officialGuildId = "1520457643842342912";
      const settings = await queryOne(
        "SELECT raid_state FROM guild_settings WHERE guild_id = $1",
        [officialGuildId]
      ).catch(() => null);

      const [jailRes, incidentRes, modRes] = await Promise.all([
        queryOne("SELECT COUNT(*) as count FROM automod_jails WHERE guild_id = $1", [officialGuildId]).catch(() => ({ count: "0" })),
        queryOne("SELECT COUNT(*) as count FROM security_incidents WHERE guild_id = $1", [officialGuildId]).catch(() => ({ count: "0" })),
        queryOne("SELECT COUNT(*) as count FROM mod_cases WHERE guild_id = $1", [officialGuildId]).catch(() => ({ count: "0" })),
      ]);

      return NextResponse.json({
        raidState: settings?.raid_state || "NORMAL",
        stats: {
          jailedCount: parseInt(jailRes?.count || "0", 10),
          incidentCount: parseInt(incidentRes?.count || "0", 10),
          modCasesCount: parseInt(modRes?.count || "0", 10),
        },
      });
    } catch {
      return NextResponse.json({
        raidState: "NORMAL",
        stats: {
          jailedCount: 0,
          incidentCount: 0,
          modCasesCount: 0,
        },
      });
    }
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

    const isStaffOrAdmin = Boolean(
      user?.isStaff ||
      user?.isAdmin ||
      user?.isOwner ||
      user?.id === "admin" ||
      user?.id === "930306512864280607"
    );

    // 3. Fetch recent 30 security incidents (only visible to Staff and Admins)
    let incidents: any[] = [];
    if (isStaffOrAdmin) {
      incidents = await query(
        `SELECT id, user_id, module, action_taken, severity, risk_score, details, created_at 
         FROM security_incidents 
         WHERE guild_id = $1 
         ORDER BY created_at DESC 
         LIMIT 30`,
        [guildId]
      ).catch(() => []);
    }

    // Sanitize settings for normal members to prevent exposure of internal limits
    let safeSettings = settings || {};
    if (!isStaffOrAdmin) {
      safeSettings = {
        anti_raid_state: settings?.anti_raid_state || "NORMAL",
        anti_nuke_enabled: Boolean(settings?.anti_nuke_enabled),
        anti_raid_enabled: Boolean(settings?.anti_raid_enabled),
        automod_enabled: Boolean(settings?.automod_enabled),
        anti_phishing_enabled: Boolean(settings?.anti_phishing_enabled),
        mention_guard_enabled: Boolean(settings?.mention_guard_enabled),
        content_filter_enabled: Boolean(settings?.content_filter_enabled),
        mass_bot_protection_enabled: Boolean(settings?.mass_bot_protection_enabled),
        ghost_ping_detection_enabled: Boolean(settings?.ghost_ping_detection_enabled),
        verification_enabled: Boolean(settings?.verification_enabled),
      };
    }

    // 4. Live Server Profile & Community Statistics
    let guildStats: {
      name: string;
      icon: string | null;
      approximate_member_count: number;
      approximate_presence_count: number;
      premium_subscription_count: number;
      premium_tier: number;
    } = {
      name: "SyncInk Support",
      icon: null,
      approximate_member_count: 0,
      approximate_presence_count: 0,
      premium_subscription_count: 0,
      premium_tier: 0,
    };

    const botToken = (process.env.DISCORD_BOT_TOKEN || process.env.DISCORD_TOKEN || "").trim();
    if (botToken) {
      try {
        const gRes = await fetch(
          `https://discord.com/api/v10/guilds/${guildId}?with_counts=true`,
          { headers: { Authorization: `Bot ${botToken}` } }
        );
        if (gRes.ok) {
          const gData = await gRes.json();
          guildStats = {
            name: gData.name || "SyncInk Support",
            icon: gData.icon || null,
            approximate_member_count: gData.approximate_member_count || 0,
            approximate_presence_count: gData.approximate_presence_count || 0,
            premium_subscription_count: gData.premium_subscription_count || 0,
            premium_tier: gData.premium_tier || 0,
          };
        }
      } catch {
        // Keep defaults
      }
    }

    return NextResponse.json({
      guildId,
      server: guildStats,
      settings: safeSettings,
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
      incidents,
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
