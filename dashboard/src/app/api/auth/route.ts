import { NextResponse } from "next/server";
import { isValidKey, createSessionToken, AUTH_COOKIE_NAME, DISCORD_COOKIE_NAME } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { key } = body;

    if (!isValidKey(key)) {
      return NextResponse.json({ error: "Invalid administrator access key" }, { status: 401 });
    }

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
    return NextResponse.json({ error: error.message || "Failed to process login" }, { status: 500 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true, message: "Logged out" });
  response.cookies.delete(AUTH_COOKIE_NAME);
  response.cookies.delete(DISCORD_COOKIE_NAME);
  return response;
}
