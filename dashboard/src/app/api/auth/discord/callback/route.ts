import { NextResponse } from "next/server";
import { createDiscordSessionToken, DISCORD_COOKIE_NAME } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const host = request.headers.get("x-forwarded-host") || url.host;
  const proto = request.headers.get("x-forwarded-proto") || url.protocol.replace(":", "");
  const baseUrl = process.env.NEXTAUTH_URL || `${proto}://${host}`;
  const redirectUri = `${baseUrl}/api/auth/discord/callback`;

  if (!code) {
    return NextResponse.redirect(`${baseUrl}/login?error=No+authorization+code+provided`);
  }

  const clientId = process.env.DISCORD_CLIENT_ID;
  const clientSecret = process.env.DISCORD_CLIENT_SECRET;
  const targetGuildId = process.env.DEFAULT_GUILD_ID || "1520461877073674392";
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
      return NextResponse.redirect(`${baseUrl}/login?error=Failed+to+exchange+Discord+token`);
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

    // 3. Permission & Role Verification:
    // A) If user is explicitly in AUTHORIZED_DISCORD_IDS, grant immediately!
    let isAuthorized = authorizedIds.includes(discordUser.id);

    // B) Check user's Discord guilds for Server Ownership or Administrator permission
    if (!isAuthorized) {
      const guildsRes = await fetch("https://discord.com/api/users/@me/guilds", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (guildsRes.ok) {
        const guilds: Array<{ id: string; owner: boolean; permissions: string }> =
          await guildsRes.json();
        const targetGuild = guilds.find((g) => g.id === targetGuildId);

        if (targetGuild) {
          // If user owns the server, or has Administrator permission (0x8)
          const perms = BigInt(targetGuild.permissions || "0");
          const isAdmin = (perms & BigInt(0x8)) === BigInt(0x8);
          if (targetGuild.owner || isAdmin) {
            isAuthorized = true;
          }
        }
      }
    }

    // C) Fallback: If no explicit restriction is set in env and user was found
    if (!isAuthorized && authorizedIds.length === 0) {
      // Allow access if no whitelist is configured, or check owner ID
      isAuthorized = true;
    }

    if (!isAuthorized) {
      return NextResponse.redirect(
        `${baseUrl}/login?error=Access+Denied:+Account+@${encodeURIComponent(
          discordUser.username
        )}+is+not+an+authorized+administrator+or+server+owner.`
      );
    }

    // 4. Create Discord session cookie
    const sessionToken = createDiscordSessionToken({
      id: discordUser.id,
      username: discordUser.username,
      global_name: discordUser.global_name || discordUser.username,
      avatar: discordUser.avatar,
      isOwner: true,
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
