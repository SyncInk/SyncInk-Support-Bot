import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Public informational & marketing pages under /dashboard
const PUBLIC_DASHBOARD_ROUTES = new Set([
  "/dashboard/tickets/faq",
  "/dashboard/tickets/faqs",
  "/dashboard/tickets/guides",
  "/dashboard/tickets/privacy",
  "/dashboard/tickets/servers",
  "/dashboard/tickets/status",
  "/dashboard/tickets/terms",
]);

const TRUSTED_ORIGINS = new Set([
  "https://syncink.site",
  "https://www.syncink.site",
]);

function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return true;
  if (TRUSTED_ORIGINS.has(origin)) return true;
  if (process.env.NODE_ENV !== "production") {
    if (
      origin.startsWith("http://localhost:") ||
      origin.startsWith("http://127.0.0.1:")
    ) {
      return true;
    }
  }
  return false;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const origin = request.headers.get("origin");

  // ==========================================
  // 1. CORS Preflight & Security for /api routes
  // ==========================================
  if (pathname.startsWith("/api/")) {
    const isAllowed = isAllowedOrigin(origin);
    const allowOrigin = isAllowed && origin ? origin : "https://syncink.site";

    // Handle OPTIONS Preflight
    if (request.method === "OPTIONS") {
      return new NextResponse(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": allowOrigin,
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
          "Access-Control-Allow-Headers":
            "Content-Type, Authorization, x-session-id, x-token, x-requested-with",
          "Access-Control-Allow-Credentials": "true",
          "Access-Control-Max-Age": "86400",
          "X-Content-Type-Options": "nosniff",
          "X-Frame-Options": "SAMEORIGIN",
          "Referrer-Policy": "strict-origin-when-cross-origin",
        },
      });
    }

    const response = NextResponse.next();
    response.headers.set("Access-Control-Allow-Origin", allowOrigin);
    response.headers.set("Access-Control-Allow-Credentials", "true");
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("X-Frame-Options", "SAMEORIGIN");
    response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains; preload"
    );
    return response;
  }

  // ==========================================
  // 2. Authentication Protection for /dashboard
  // ==========================================
  if (pathname.startsWith("/dashboard")) {
    // Allow public documentation / guides under /dashboard
    if (PUBLIC_DASHBOARD_ROUTES.has(pathname)) {
      return NextResponse.next();
    }

    const discordSession = request.cookies.get("syncink_discord_session")?.value;
    const adminSession = request.cookies.get("syncink_admin_session")?.value;

    const hasValidTokenFormat = (token?: string) => {
      if (!token || typeof token !== "string") return false;
      const parts = token.split(".");
      return parts.length === 2 && parts[0].length > 5 && parts[1].length > 5;
    };

    const isAuthenticated =
      hasValidTokenFormat(discordSession) || hasValidTokenFormat(adminSession);

    // If unauthenticated, redirect to login page server-side immediately
    if (!isAuthenticated) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // ==========================================
  // 3. Security Headers for all responses
  // ==========================================
  const response = NextResponse.next();
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "SAMEORIGIN");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains; preload"
  );
  return response;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/api/:path*",
  ],
};
