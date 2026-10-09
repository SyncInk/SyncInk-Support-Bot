import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { isSafeOutboundUrl, validateCsrfOrigin, redactSensitive } from "@/lib/security";
import { rateLimiter, getClientIp } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const DEFAULT_BACKEND = "https://syncink-ticket.onrender.com";
const TICKET_BACKEND_URL = (process.env.TICKET_BOT_API_URL || DEFAULT_BACKEND).replace(/\/+$/, "");

async function proxyRequest(request: Request, { params }: { params: { route: string[] } }) {
  // 1. CSRF Protection for mutating proxy requests (Item 3)
  if (!validateCsrfOrigin(request)) {
    return NextResponse.json({ error: "Invalid request origin (CSRF validation failed)" }, { status: 403 });
  }

  // 2. Rate limiting proxy requests: 60 requests per minute per IP (Item 6)
  const clientIp = getClientIp(request);
  const rateLimit = rateLimiter.check(`tickets_proxy_${clientIp}`, 60, 60 * 1000);
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: "Too many ticket requests. Please slow down." }, { status: 429 });
  }

  const path = (params.route || []).map((seg) => encodeURIComponent(seg)).join("/");
  const url = new URL(request.url);
  const targetUrl = `${TICKET_BACKEND_URL}/api/${path}${url.search}`;

  // 3. SSRF Protection: Ensure target is safe outbound URL (Item 16)
  if (!isSafeOutboundUrl(targetUrl)) {
    return NextResponse.json(
      { error: "Target URL failed SSRF security inspection." },
      { status: 400 }
    );
  }

  const user = await getCurrentUser();

  const headers: Record<string, string> = {
    Accept: "application/json",
  };

  const incomingCookie = request.headers.get("cookie");
  if (incomingCookie) {
    headers["Cookie"] = incomingCookie;
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader) {
    headers["Authorization"] = authHeader;
  }

  const sessionIdHeader = request.headers.get("x-session-id") || request.headers.get("x-token");
  if (sessionIdHeader) {
    headers["x-session-id"] = sessionIdHeader;
    headers["x-token"] = sessionIdHeader;
  }

  if (user) {
    headers["x-syncink-user-id"] = user.id;
    headers["x-syncink-username"] = user.username;
    headers["x-syncink-is-owner"] = String(Boolean(user.isOwner));
    headers["x-syncink-is-admin"] = String(Boolean(user.isAdmin));
    if (user.guildId) {
      headers["x-syncink-guild-id"] = user.guildId;
    }
  }

  let body: BodyInit | undefined = undefined;
  if (request.method !== "GET" && request.method !== "HEAD") {
    try {
      const contentType = request.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        headers["Content-Type"] = "application/json";
        body = JSON.stringify(await request.json());
      } else {
        body = await request.text();
      }
    } catch {
      // Body may be empty
    }
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const backendRes = await fetch(targetUrl, {
      method: request.method,
      headers,
      body,
      signal: controller.signal,
      cache: "no-store",
      redirect: "manual",
    });

    clearTimeout(timeoutId);

    const resHeaders = new Headers();
    const resContentType = backendRes.headers.get("content-type") || "";
    if (resContentType) {
      resHeaders.set("Content-Type", resContentType);
    }

    const setCookieHeader = backendRes.headers.get("set-cookie");
    if (setCookieHeader) {
      resHeaders.set("Set-Cookie", setCookieHeader);
    }

    // Forward redirects safely
    if (backendRes.status >= 300 && backendRes.status < 400) {
      const location = backendRes.headers.get("location");
      if (location && (location.includes("/dashboard/tickets") || location.includes("syncink.site/dashboard"))) {
        return NextResponse.json(
          { error: "Endpoint not found on ticket backend." },
          { status: 404, headers: resHeaders }
        );
      }
      if (location) {
        resHeaders.set("Location", location);
        return new NextResponse(null, { status: backendRes.status, headers: resHeaders });
      }
    }

    if (resContentType.includes("application/json")) {
      const data = await backendRes.json();
      return NextResponse.json(data, { status: backendRes.status, headers: resHeaders });
    }

    if (resContentType.includes("text/html")) {
      return NextResponse.json(
        { error: "Ticket backend returned non-JSON response.", status: backendRes.status },
        { status: backendRes.status >= 400 ? backendRes.status : 404, headers: resHeaders }
      );
    }

    const text = await backendRes.text();
    return new NextResponse(text, {
      status: backendRes.status,
      headers: resHeaders,
    });
  } catch (err: any) {
    // Keep internal URLs and stack traces out of logs and client responses (Item 8 & 19)
    console.error("[TICKETS PROXY ERROR]:", redactSensitive(err.message || "Failed to forward request"));
    return NextResponse.json(
      {
        error: "Ticket Bot backend is currently waking up or unreachable.",
      },
      { status: 502 }
    );
  }
}

export async function GET(request: Request, ctx: { params: { route: string[] } }) {
  return proxyRequest(request, ctx);
}

export async function POST(request: Request, ctx: { params: { route: string[] } }) {
  return proxyRequest(request, ctx);
}

export async function PUT(request: Request, ctx: { params: { route: string[] } }) {
  return proxyRequest(request, ctx);
}

export async function PATCH(request: Request, ctx: { params: { route: string[] } }) {
  return proxyRequest(request, ctx);
}

export async function DELETE(request: Request, ctx: { params: { route: string[] } }) {
  return proxyRequest(request, ctx);
}
