import { NextResponse } from "next/server";
import { isValidKey, createSessionToken, AUTH_COOKIE_NAME, DISCORD_COOKIE_NAME } from "@/lib/auth";
import { rateLimiter, getClientIp } from "@/lib/rate-limit";
import { validateCsrfOrigin } from "@/lib/security";

export async function POST(request: Request) {
  // 1. CSRF Protection (Item 3)
  if (!validateCsrfOrigin(request)) {
    return NextResponse.json({ error: "Invalid request origin (CSRF validation failed)" }, { status: 403 });
  }

  // 2. Rate Limiting: 5 attempts per 15 minutes per IP (Item 6)
  const clientIp = getClientIp(request);
  const rateLimit = rateLimiter.check(`admin_login_${clientIp}`, 5, 15 * 60 * 1000);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        error: `Too many login attempts. Please wait ${Math.ceil(rateLimit.resetMs / 60000)} minutes before trying again.`,
      },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const { key } = body;

    // 3. Timing-safe key validation & Default credential protection (Item 9 & 18)
    if (!isValidKey(key)) {
      return NextResponse.json({ error: "Invalid administrator access key" }, { status: 401 });
    }

    // 4. Secure signed session token (Item 7 & 12)
    const token = createSessionToken();
    const response = NextResponse.json({ success: true, message: "Authenticated successfully" });

    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return response;
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to process login request" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  // CSRF Protection
  if (!validateCsrfOrigin(request)) {
    return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
  }

  const response = NextResponse.json({ success: true, message: "Logged out" });
  response.cookies.delete(AUTH_COOKIE_NAME);
  response.cookies.delete(DISCORD_COOKIE_NAME);
  return response;
}
