import { NextResponse } from "next/server";
import { createDiscordSessionToken, DISCORD_COOKIE_NAME } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const host = request.headers.get("x-forwarded-host") || url.host;
  const proto = request.headers.get("x-forwarded-proto") || url.protocol.replace(":", "");
  let baseUrl = `${proto}://${host}`;

  const envUrl = process.env.NEXTAUTH_URL;
  if (
    envUrl &&
    !envUrl.includes("your-dashboard") &&
    !envUrl.includes("your-project") &&
    !envUrl.includes("example.com")
  ) {
    baseUrl = envUrl.replace(/\/+$/, "");
  }

  const redirectUri = `${baseUrl}/api/auth/discord/callback`;

  if (!code) {
    return NextResponse.redirect(`${baseUrl}/login?error=No+authorization+code+provided`);
  }

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
    // 1. Exchange code for OAuth2 access token
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
      console.error("Discord Token Exchange Failed:", errText);
      let detail = "Failed to exchange Discord token";
      try {
        const parsed = JSON.parse(errText);
        if (parsed.error_description) {
          detail = `Discord: ${parsed.error_description}`;
        } else if (parsed.error === "invalid_client") {
          detail = "Invalid Client Secret or Client ID. Ensure DISCORD_CLIENT_SECRET in Vercel matches the OAuth2 Client Secret (not bot token).";
        } else if (parsed.error) {
          detail = `Discord OAuth error: ${parsed.error}`;
        }
      } catch {
        detail = `Discord token exchange failed: ${errText.slice(0, 100)}`;
      }
      return NextResponse.redirect(`${baseUrl}/login?error=${encodeURIComponent(detail)}`);
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    // 2. Fetch authenticated Discord user info
    const userRes = await fetch("https://discord.com/api/users/@me", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!userRes.ok) {
      return NextResponse.redirect(`${baseUrl}/login?error=Failed+to+fetch+Discord+user+profile`);
    }

    const discordUser = await userRes.json();

    // 3. Permission & Accurate Role Detection:
    let isOwner = false;
    let isAdmin = false;
    let isMember = false;
    let isAuthorized = authorizedIds.includes(discordUser.id);

    // Fetch user's Discord guilds
    const guildsRes = await fetch("https://discord.com/api/users/@me/guilds", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (guildsRes.ok) {
      const guilds: Array<{ id: string; owner: boolean; permissions: string }> =
        await guildsRes.json();
      const targetGuild = guilds.find((g) => g.id === targetGuildId);

      if (targetGuild) {
        isMember = true;
        isOwner = Boolean(targetGuild.owner);
        const perms = BigInt(targetGuild.permissions || "0");
        const hasAdminPerm = (perms & BigInt(0x8)) === BigInt(0x8);
        const hasManageGuild = (perms & BigInt(0x20)) === BigInt(0x20);
        isAdmin = isOwner || hasAdminPerm || hasManageGuild;
      }
    }

    if (authorizedIds.includes(discordUser.id)) {
      isAdmin = true;
      isAuthorized = true;
    }

    // Determine actual role title accurately
    let roleLabel = "Server Member";
    if (isOwner) {
      roleLabel = "Server Owner";
    } else if (isAdmin) {
      roleLabel = "Server Admin";
    } else if (isAuthorized) {
      roleLabel = "Authorized Operator";
    } else {
      roleLabel = "Server Member";
    }

    // Check authorization: If AUTHORIZED_DISCORD_IDS is set, only allow those users or owner/admins
    if (authorizedIds.length > 0 && !isAuthorized && !isAdmin && !isOwner) {
      return NextResponse.redirect(
        `${baseUrl}/login?error=Access+Denied:+Account+@${encodeURIComponent(
          discordUser.username
        )}+is+not+authorized+on+this+dashboard.`
      );
    }

    // 4. Create Discord session cookie with accurate role info
    const sessionToken = createDiscordSessionToken({
      id: discordUser.id,
      username: discordUser.username,
      global_name: discordUser.global_name || discordUser.username,
      avatar: discordUser.avatar,
      isOwner,
      isAdmin,
      role: roleLabel,
    });

    const response = NextResponse.redirect(`${baseUrl}/`);
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
    console.error("Discord OAuth Error:", error);
    return NextResponse.redirect(
      `${baseUrl}/login?error=${encodeURIComponent(error.message || "OAuth Authentication error")}`
    );
  }
}
