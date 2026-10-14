import { NextResponse } from "next/server";
import { checkRequestStaffAuth, getCurrentUser, verifyUserGuildAccess } from "@/lib/auth";
import { query, queryOne, resolveGuildId } from "@/lib/db";
import { rateLimiter, getClientIp } from "@/lib/rate-limit";
import { redactSensitive } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  // 1. Staff, Manager & Owner Authorization
  if (!checkRequestStaffAuth(request)) {
    return NextResponse.json(
      { error: "Access Denied: Staff or Administrator permissions required to inspect member intelligence." },
      { status: 403 }
    );
  }

  // 2. Rate Limiting
  const clientIp = getClientIp(request);
  const rateLimit = rateLimiter.check(`members_get_${clientIp}`, 60, 60 * 1000);
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: "Too many requests. Please slow down." }, { status: 429 });
  }

  try {
    const user = await getCurrentUser();
    const { searchParams } = new URL(request.url);
    const guildId = await resolveGuildId(searchParams.get("guildId") || user?.guildId);

    // BOLA Check
    if (!verifyUserGuildAccess(user, guildId)) {
      return NextResponse.json({ error: "Access Denied: You do not have permissions for this server." }, { status: 403 });
    }

    const botToken = (process.env.DISCORD_BOT_TOKEN || process.env.DISCORD_TOKEN || "").trim();
    const targetUserId = searchParams.get("userId")?.trim();

    // -------------------------------------------------------------
    // Case A: Specific Member Deep Profile & Infraction Timeline
    // -------------------------------------------------------------
    if (targetUserId) {
      const cleanUserId = targetUserId.replace(/[^0-9]/g, "").trim();
      if (!cleanUserId || cleanUserId.length < 5) {
        return NextResponse.json({ error: "Invalid Discord User ID." }, { status: 400 });
      }

      // 1. Fetch Discord Member Object
      let memberObj: any = null;
      let userObj: any = null;

      if (botToken) {
        try {
          const dRes = await fetch(
            `https://discord.com/api/v10/guilds/${guildId}/members/${cleanUserId}`,
            { headers: { Authorization: `Bot ${botToken}` } }
          );
          if (dRes.ok) {
            memberObj = await dRes.json();
            userObj = memberObj.user;
          } else {
            // Member might have left; fetch public user profile
            const uRes = await fetch(
              `https://discord.com/api/v10/users/${cleanUserId}`,
              { headers: { Authorization: `Bot ${botToken}` } }
            );
            if (uRes.ok) {
              userObj = await uRes.json();
            }
          }
        } catch {
          // Ignore fetch error
        }
      }

      // 2. Query PostgreSQL Infraction Statistics
      const statsRow = await queryOne<{
        warnings: string;
        timeouts: string;
        jails: string;
        bans: string;
        kicks: string;
        total: string;
      }>(
        `SELECT 
          COUNT(*) FILTER (WHERE UPPER(action) LIKE '%WARN%') as warnings,
          COUNT(*) FILTER (WHERE UPPER(action) LIKE '%TIMEOUT%' OR UPPER(action) LIKE '%MUTE%') as timeouts,
          COUNT(*) FILTER (WHERE UPPER(action) LIKE '%JAIL%' AND UPPER(action) NOT LIKE '%UNJAIL%') as jails,
          COUNT(*) FILTER (WHERE UPPER(action) LIKE '%BAN%' AND UPPER(action) NOT LIKE '%UNBAN%') as bans,
          COUNT(*) FILTER (WHERE UPPER(action) LIKE '%KICK%') as kicks,
          COUNT(*) as total
        FROM mod_cases
        WHERE guild_id = $1 AND user_id = $2`,
        [guildId, cleanUserId]
      ).catch(() => null);

      // 3. Query PostgreSQL Mod Cases History
      const cases = await query(
        `SELECT case_id, user_id, mod_id, action, reason, created_at
         FROM mod_cases
         WHERE guild_id = $1 AND user_id = $2
         ORDER BY created_at DESC
         LIMIT 50`,
        [guildId, cleanUserId]
      ).catch(() => []);

      // 4. Query Active Jail Record
      const activeJail = await queryOne(
        `SELECT id, reason, jailed_at, release_at, mod_id
         FROM automod_jails
         WHERE guild_id = $1 AND user_id = $2 AND (release_at IS NULL OR release_at > CURRENT_TIMESTAMP)
         ORDER BY jailed_at DESC LIMIT 1`,
        [guildId, cleanUserId]
      ).catch(() => null);

      const roles = Array.isArray(memberObj?.roles) ? memberObj.roles.map(String) : [];
      const isVerified = roles.includes("1520871574088056952");
      const isBooster = roles.includes("1558584451724738640") || Boolean(memberObj?.premium_since);
      const timeoutUntil = memberObj?.communication_disabled_until || null;
      const isTimedOut = timeoutUntil ? new Date(timeoutUntil) > new Date() : false;

      return NextResponse.json({
        member: {
          id: cleanUserId,
          username: userObj?.username || `User_${cleanUserId.slice(-4)}`,
          global_name: userObj?.global_name || memberObj?.nick || null,
          avatar: userObj?.avatar || null,
          joined_at: memberObj?.joined_at || null,
          roles,
          isVerified,
          isBooster,
          isTimedOut,
          timeoutUntil,
          isJailed: Boolean(activeJail),
          activeJail,
        },
        infractions: {
          warnings: parseInt(statsRow?.warnings || "0", 10),
          timeouts: parseInt(statsRow?.timeouts || "0", 10),
          jails: parseInt(statsRow?.jails || "0", 10),
          bans: parseInt(statsRow?.bans || "0", 10),
          kicks: parseInt(statsRow?.kicks || "0", 10),
          total: parseInt(statsRow?.total || "0", 10),
        },
        cases: cases || [],
      });
    }

    // -------------------------------------------------------------
    // Case B: Member Roster with Aggregated Infractions & Status
    // -------------------------------------------------------------
    let discordMembers: any[] = [];
    if (botToken) {
      try {
        const mRes = await fetch(
          `https://discord.com/api/v10/guilds/${guildId}/members?limit=100`,
          { headers: { Authorization: `Bot ${botToken}` } }
        );
        if (mRes.ok) {
          discordMembers = await mRes.json();
        }
      } catch {
        // Ignore fetch error
      }
    }

    // Query aggregated stats for all members in this guild
    const aggregatedStats = await query<{
      user_id: string;
      warnings: string;
      timeouts: string;
      jails: string;
      total: string;
    }>(
      `SELECT 
        user_id,
        COUNT(*) FILTER (WHERE UPPER(action) LIKE '%WARN%') as warnings,
        COUNT(*) FILTER (WHERE UPPER(action) LIKE '%TIMEOUT%' OR UPPER(action) LIKE '%MUTE%') as timeouts,
        COUNT(*) FILTER (WHERE UPPER(action) LIKE '%JAIL%' AND UPPER(action) NOT LIKE '%UNJAIL%') as jails,
        COUNT(*) as total
      FROM mod_cases
      WHERE guild_id = $1
      GROUP BY user_id`,
      [guildId]
    ).catch(() => []);

    const statsMap = new Map<string, { warnings: number; timeouts: number; jails: number; total: number }>();
    aggregatedStats.forEach((r) => {
      statsMap.set(String(r.user_id), {
        warnings: parseInt(r.warnings || "0", 10),
        timeouts: parseInt(r.timeouts || "0", 10),
        jails: parseInt(r.jails || "0", 10),
        total: parseInt(r.total || "0", 10),
      });
    });

    // Query active jails
    const activeJails = await query<{ user_id: string }>(
      `SELECT user_id FROM automod_jails 
       WHERE guild_id = $1 AND (release_at IS NULL OR release_at > CURRENT_TIMESTAMP)`,
      [guildId]
    ).catch(() => []);
    const jailedSet = new Set(activeJails.map((j) => String(j.user_id)));

    // Merge members list with infraction data
    const membersList = discordMembers.map((m) => {
      const u = m.user || {};
      const uid = String(u.id);
      const roles = Array.isArray(m.roles) ? m.roles.map(String) : [];
      const userStats = statsMap.get(uid) || { warnings: 0, timeouts: 0, jails: 0, total: 0 };
      const timeoutUntil = m.communication_disabled_until || null;
      const isTimedOut = timeoutUntil ? new Date(timeoutUntil) > new Date() : false;

      return {
        id: uid,
        username: u.username || `User_${uid.slice(-4)}`,
        global_name: u.global_name || m.nick || null,
        avatar: u.avatar || null,
        joined_at: m.joined_at || null,
        roles,
        isVerified: roles.includes("1520871574088056952"),
        isBooster: roles.includes("1558584451724738640") || Boolean(m.premium_since),
        isStaff: roles.includes("1520466655321522486"),
        isAdmin: roles.includes("1520854378192572546"),
        isDeveloper: roles.includes("1531882215795855511"),
        isOwner: uid === "930306512864280607" || roles.includes("1520856232460550194"),
        isTimedOut,
        timeoutUntil,
        isJailed: jailedSet.has(uid),
        infractions: userStats,
      };
    });

    return NextResponse.json({
      guildId,
      members: membersList,
      totalCount: membersList.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Members API Error:", redactSensitive(error.message || ""));
    return NextResponse.json({ error: "Failed to fetch member intelligence data." }, { status: 500 });
  }
}
