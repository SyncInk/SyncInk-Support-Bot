import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const clientId = (process.env.DISCORD_CLIENT_ID || "").trim();

  if (!clientId) {
    return NextResponse.json(
      {
        error:
          "DISCORD_CLIENT_ID environment variable is not configured. Please add DISCORD_CLIENT_ID and DISCORD_CLIENT_SECRET to Vercel.",
      },
      { status: 500 }
    );
  }

  // Derive base URL from request or environment
  const url = new URL(request.url);
  const host = request.headers.get("x-forwarded-host") || url.host;
  const proto = request.headers.get("x-forwarded-proto") || url.protocol.replace(":", "");
  const rawBaseUrl = process.env.NEXTAUTH_URL || `${proto}://${host}`;
  const baseUrl = rawBaseUrl.replace(/\/+$/, "");

  const redirectUri = `${baseUrl}/api/auth/discord/callback`;

  const discordAuthUrl =
    `https://discord.com/oauth2/authorize?` +
    new URLSearchParams({
      client_id: clientId,
      response_type: "code",
      redirect_uri: redirectUri,
      scope: "identify guilds",
      prompt: "consent",
    }).toString();

  return NextResponse.redirect(discordAuthUrl);
}
