import { NextResponse } from "next/server";
import { getCurrentUser, AUTH_COOKIE_NAME, DISCORD_COOKIE_NAME } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ authenticated: false, user: null });
  }
  return NextResponse.json({ authenticated: true, user });
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    if (body.action === "logout") {
      const response = NextResponse.json({ success: true, message: "Logged out successfully" });
      response.cookies.delete(AUTH_COOKIE_NAME);
      response.cookies.delete(DISCORD_COOKIE_NAME);
      return response;
    }
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: "Logout failed" }, { status: 500 });
  }
}
