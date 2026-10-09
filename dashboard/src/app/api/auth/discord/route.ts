import { NextResponse } from "next/server";
import crypto from "crypto";
import { createSignedToken } from "@/lib/security";

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

  const url = new URL(request.url);
  const baseUrl = "https://syncink.site";
  const redirectUri = `${baseUrl}/api/auth/discord/callback`;

  // Validate redirectTo to prevent open redirects
  const rawRedirectTo = url.searchParams.get("redirect_to") || "/dashboard";
  const safeRedirectTo =
    rawRedirectTo.startsWith("/") && !rawRedirectTo.startsWith("//") && !rawRedirectTo.includes(":")
      ? rawRedirectTo
      : "/dashboard";

  // Create cryptographically signed state token with nonce and expiry (OAuth CSRF protection - Item 3 & 7)
  const statePayload = {
    redirect: safeRedirectTo,
    nonce: crypto.randomBytes(16).toString("hex"),
    exp: Date.now() + 15 * 60 * 1000, // 15 minutes validity
  };
  const stateToken = createSignedToken(statePayload);

  const discordAuthUrl =
    `https://discord.com/oauth2/authorize?` +
    new URLSearchParams({
      client_id: clientId,
      response_type: "code",
      redirect_uri: redirectUri,
      scope: "identify guilds",
      prompt: "consent",
      state: stateToken,
    }).toString();

  return NextResponse.redirect(discordAuthUrl);
}
