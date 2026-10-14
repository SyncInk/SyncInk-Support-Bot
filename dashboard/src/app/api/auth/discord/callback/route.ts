import { NextResponse } from "next/server";
import { createDiscordSessionToken, DISCORD_COOKIE_NAME } from "@/lib/auth";
import { query } from "@/lib/db";
import { verifySignedToken, redactSensitive } from "@/lib/security";
import { rateLimiter, getClientIp } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const rawState = url.searchParams.get("state");
  const baseUrl = "https://syncink.site";
  const redirectUri = `${baseUrl}/api/auth/discord/callback`;

  // 1. Rate limiting on OAuth callback to prevent code brute-forcing (Item 6)
  const clientIp = getClientIp(request);
  const rateLimit = rateLimiter.check(`oauth_callback_${clientIp}`, 10, 5 * 60 * 1000);
  if (!rateLimit.allowed) {
    return NextResponse.redirect(`${baseUrl}/login?error=Too+many+login+attempts.+Please+wait+a+few+minutes.`);
  }

  if (!code) {
    return NextResponse.redirect(`${baseUrl}/login?error=No+authorization+code+provided`);
  }

  // 2. Validate OAuth state parameter to prevent CSRF & Open Redirects (Item 3 & 16)
  let targetPath = "/dashboard";
  if (rawState) {
    const verifiedState = verifySignedToken<{ redirect?: string; exp?: number }>(rawState);
    if (verifiedState && verifiedState.redirect) {
      const p = verifiedState.redirect;
      if (p.startsWith("/") && !p.startsWith("//") && !p.includes(":")) {
        targetPath = p;
      }
    } else if (rawState.startsWith("/") && !rawState.startsWith("//") && !rawState.includes(":")) {
      // Backwards compatibility for pre-existing flows
      targetPath = rawState;
    }
  }

  // 3. Keep API secrets server-side (Item 8)
  const clientId = (process.env.DISCORD_CLIENT_ID || "").trim();
  const clientSecret = (process.env.DISCORD_CLIENT_SECRET || "").trim();
  const targetGuildId = (process.env.DEFAULT_GUILD_ID || "1520457643842342912").trim();
  const authorizedIds = process.env.AUTHORIZED_DISCORD_IDS
    ? process.env.AUTHORIZED_DISCORD_IDS.split(",").map((s) => s.trim())
    : [];

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(
      `${baseUrl}/login?error=Discord+OAuth+is+missing+Client+ID+or+Client+Secret+in+Vercel+settings`
    );
  }

  try {
    // 4. Exchange code for OAuth2 access token
    const tokenRes = await fetch("https://discord.com/api/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      console.error("Discord Token Exchange Failed:", redactSensitive(errText));
      return NextResponse.redirect(`${baseUrl}/login?error=Failed+to+exchange+Discord+token`);
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    // 5. Fetch authenticated Discord user info
    const userRes = await fetch("https://discord.com/api/users/@me", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!userRes.ok) {
      return NextResponse.redirect(`${baseUrl}/login?error=Failed+to+fetch+Discord+user+profile`);
    }

    const discordUser = await userRes.json();

    // 6. Fetch user's guilds to check membership in SyncInk Support
    let targetGuild: { id: string; name: string; owner?: boolean; permissions?: string } | null = null;
    const guildsRes = await fetch("https://discord.com/api/users/@me/guilds", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (guildsRes.ok) {
      const guilds: Array<{ id: string; name: string; owner: boolean; permissions: string }> =
        await guildsRes.json();
      targetGuild = guilds.find((g) => String(g.id) === targetGuildId) || null;
    }

    // 7. Fetch user's member object in the target guild for real role resolution
    let memberData: any = null;
    try {
      const memberRes = await fetch(
        `https://discord.com/api/v10/users/@me/guilds/${targetGuildId}/member`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (memberRes.ok) {
        memberData = await memberRes.json();
      }
    } catch {
      // Ignore user token member fetch failure
    }

    // Fallback: If guilds.members.read not available, fetch via Bot Token if configured
    if (!memberData) {
      const botToken = (process.env.DISCORD_BOT_TOKEN || process.env.DISCORD_TOKEN || "").trim();
      if (botToken) {
        try {
          const botMemberRes = await fetch(
            `https://discord.com/api/v10/guilds/${targetGuildId}/members/${discordUser.id}`,
            { headers: { Authorization: `Bot ${botToken}` } }
          );
          if (botMemberRes.ok) {
            memberData = await botMemberRes.json();
          }
        } catch {
          // Ignore bot member fetch error
        }
      }
    }

    const memberRoles: string[] = Array.isArray(memberData?.roles)
      ? memberData.roles.map(String)
      : [];
    const premiumSince = memberData?.premium_since || null;

    // 8. Strict Role Hierarchy & Permission Evaluation
    const perms = targetGuild ? BigInt(targetGuild.permissions || "0") : BigInt(0);
    const hasAdminPerm = (perms & BigInt(0x8)) === BigInt(0x8);
    const hasManageGuild = (perms & BigInt(0x20)) === BigInt(0x20);
    const hasStaffPerms =
      (perms & BigInt(0x2000)) === BigInt(0x2000) || // MANAGE_MESSAGES
      (perms & BigInt(0x10000000000)) === BigInt(0x10000000000) || // MODERATE_MEMBERS
      (perms & BigInt(0x2)) === BigInt(0x2) || // KICK_MEMBERS
      (perms & BigInt(0x4)) === BigInt(0x4); // BAN_MEMBERS

    const isPrimaryOwner =
      discordUser.id === "930306512864280607" || authorizedIds.includes(discordUser.id);

    let isOwner = false;
    let isAdmin = false;
    let isStaff = false;
    let isBooster = false;
    let roleType: "owner" | "admin" | "staff" | "developer" | "booster" | "partner" | "verified" | "member" = "member";
    let roleLabel = "Server Member";
    let roleIcon = "👤";

    // Booster role check
    if (memberRoles.includes("1558584451724738640") || Boolean(premiumSince)) {
      isBooster = true;
    }

    // Role Hierarchy Resolution (Highest to Lowest):
    // 1. Server Owner (👑)
    if (
      isPrimaryOwner ||
      (targetGuild && targetGuild.owner === true) ||
      memberRoles.includes("1520856232460550194")
    ) {
      isOwner = true;
      isAdmin = true;
      isStaff = true;
      roleType = "owner";
      roleLabel = "Server Owner";
      roleIcon = "👑";
    }
    // 2. Administrator (💼)
    else if (
      memberRoles.includes("1520854378192572546") ||
      hasAdminPerm ||
      hasManageGuild
    ) {
      isAdmin = true;
      isStaff = true;
      roleType = "admin";
      roleLabel = "Administrator";
      roleIcon = "💼";
    }
    // 3. Staff (🛡️)
    else if (
      memberRoles.includes("1520466655321522486") ||
      hasStaffPerms
    ) {
      isStaff = true;
      roleType = "staff";
      roleLabel = "Staff";
      roleIcon = "🛡️";
    }
    // 4. Developer (💻)
    else if (memberRoles.includes("1531882215795855511")) {
      roleType = "developer";
      roleLabel = "Developer";
      roleIcon = "💻";
    }
    // 5. Server Booster (🚀)
    else if (isBooster) {
      roleType = "booster";
      roleLabel = "Server Booster";
      roleIcon = "🚀";
    }
    // 6. Partner (🤝)
    else if (memberRoles.includes("1551337053185114242")) {
      roleType = "partner";
      roleLabel = "Partner";
      roleIcon = "🤝";
    }
    // 7. Verified Member (✅)
    else if (memberRoles.includes("1520871574088056952")) {
      roleType = "verified";
      roleLabel = "Verified Member";
      roleIcon = "✅";
    }
    // 8. Server Member / Guest (👤)
    else {
      roleType = "member";
      roleLabel = targetGuild ? "Server Member" : "Guest";
      roleIcon = "👤";
    }

    const finalGuildId = targetGuild ? targetGuild.id : targetGuildId;
    const finalGuildName = targetGuild ? targetGuild.name : "SyncInk Support";

    // 9. Cryptographically signed session cookie (Item 7 & 12)
    const sessionToken = createDiscordSessionToken({
      id: discordUser.id,
      username: discordUser.username,
      global_name: discordUser.global_name || discordUser.username,
      avatar: discordUser.avatar,
      isOwner,
      isAdmin,
      isStaff,
      isBooster,
      roleType,
      roleIcon,
      role: roleLabel,
      roles: memberRoles,
      guildId: finalGuildId,
      guildName: finalGuildName,
    });

    const response = NextResponse.redirect(`${baseUrl}${targetPath}`);
    response.cookies.set({
      name: DISCORD_COOKIE_NAME,
      value: sessionToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return response;
  } catch (error: any) {
    console.error("Discord OAuth Error:", redactSensitive(error.message || ""));
    return NextResponse.redirect(`${baseUrl}/login?error=OAuth+Authentication+error`);
  }
}
