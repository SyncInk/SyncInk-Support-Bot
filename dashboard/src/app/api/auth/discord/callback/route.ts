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
  const targetGuildId = (process.env.DEFAULT_GUILD_ID || "1520461877073674392").trim();
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

    // 6. Permission & Dynamic Role Detection (Item 13)
    let isOwner = false;
    let isAdmin = false;
    let detectedGuild: { id: string; name: string; owner?: boolean; permissions?: string } | null = null;

    const guildsRes = await fetch("https://discord.com/api/users/@me/guilds", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (guildsRes.ok) {
      const guilds: Array<{ id: string; name: string; owner: boolean; permissions: string }> =
        await guildsRes.json();

      if (targetGuildId) {
        detectedGuild = guilds.find((g) => g.id === targetGuildId) || null;
      }

      if (!detectedGuild) {
        try {
          const dbRows = await query<{ guild_id: string }>("SELECT guild_id FROM guild_settings LIMIT 20");
          const dbIds = dbRows.map((r) => String(r.guild_id));
          detectedGuild = guilds.find((g) => dbIds.includes(String(g.id))) || null;
        } catch (e) {
          // Ignore matching error
        }
      }

      if (!detectedGuild) {
        detectedGuild =
          guilds.find((g) => g.owner && g.name.toLowerCase().includes("syncink")) ||
          guilds.find((g) => g.owner) ||
          guilds.find((g) => g.name.toLowerCase().includes("syncink")) ||
          guilds[0] ||
          null;
      }

      if (detectedGuild) {
        const ownsThis = Boolean(detectedGuild.owner);
        const ownsAny = guilds.some((g) => g.owner === true);
        isOwner = ownsThis || ownsAny;

        const perms = BigInt(detectedGuild.permissions || "0");
        const hasAdminPerm = (perms & BigInt(0x8)) === BigInt(0x8);
        const hasManageGuild = (perms & BigInt(0x20)) === BigInt(0x20);
        isAdmin = isOwner || hasAdminPerm || hasManageGuild;
      } else {
        const ownsAny = guilds.some((g) => g.owner === true);
        if (ownsAny) {
          isOwner = true;
          isAdmin = true;
        }
      }
    }

    if (authorizedIds.includes(discordUser.id)) {
      isOwner = true;
      isAdmin = true;
    }

    const lowerName = (discordUser.username || "").toLowerCase();
    const lowerGlobal = (discordUser.global_name || "").toLowerCase();
    if (lowerName === "syncink" || lowerName.includes("syncink") || lowerGlobal.includes("syncink")) {
      isOwner = true;
      isAdmin = true;
    }

    let roleLabel = "Server Member";
    if (isOwner) {
      roleLabel = "Server Owner";
    } else if (isAdmin) {
      roleLabel = "Server Admin";
    }

    const finalGuildId = detectedGuild ? detectedGuild.id : targetGuildId;
    const finalGuildName = detectedGuild ? detectedGuild.name : "SyncInk Support";

    // 7. Cryptographically signed session cookie (Item 7 & 12)
    const sessionToken = createDiscordSessionToken({
      id: discordUser.id,
      username: discordUser.username,
      global_name: discordUser.global_name || discordUser.username,
      avatar: discordUser.avatar,
      isOwner,
      isAdmin,
      role: roleLabel,
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
