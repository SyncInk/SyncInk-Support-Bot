import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

const TICKET_BACKEND_URL = (
  process.env.TICKET_BOT_API_URL || "https://syncink-ticket.onrender.com"
).replace(/\/+$/, "");

async function proxyRequest(request: Request, { params }: { params: { route: string[] } }) {
  const path = (params.route || []).join("/");
  const url = new URL(request.url);
  const targetUrl = `${TICKET_BACKEND_URL}/api/${path}${url.search}`;

  const user = await getCurrentUser();

  const headers: Record<string, string> = {
    Accept: "application/json",
  };

  const incomingCookie = request.headers.get("cookie");
  if (incomingCookie) {
    headers["Cookie"] = incomingCookie;
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

    // Forward Set-Cookie headers properly to fix third-party cookie issues
    const setCookieHeader = backendRes.headers.get("set-cookie");
    if (setCookieHeader) {
      // Sometimes multiple cookies are comma-separated, but fetch API combines them. 
      // For connect.sid it's usually just one.
      resHeaders.set("Set-Cookie", setCookieHeader);
    }

    // Forward redirects (e.g. for OAuth login/callback)
    if (backendRes.status >= 300 && backendRes.status < 400) {
      const location = backendRes.headers.get("location");
      if (location) {
        resHeaders.set("Location", location);
        return new NextResponse(null, { status: backendRes.status, headers: resHeaders });
      }
    }

    if (resContentType.includes("application/json")) {
      const data = await backendRes.json();
      return NextResponse.json(data, { status: backendRes.status, headers: resHeaders });
    }

    const text = await backendRes.text();
    return new NextResponse(text, {
      status: backendRes.status,
      headers: resHeaders,
    });
  } catch (err: any) {
    console.error(`[TICKETS PROXY ERROR] Failed to forward request to ${targetUrl}:`, err.message);
    return NextResponse.json(
      {
        error: "Ticket Bot backend is currently waking up or unreachable.",
        details: err.message,
        targetUrl,
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
