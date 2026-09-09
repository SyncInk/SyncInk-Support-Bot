import { cookies } from "next/headers";

const AUTH_COOKIE_NAME = "syncink_admin_session";

export function getAdminKey(): string {
  return process.env.ADMIN_ACCESS_KEY || "syncink_admin_default_pass";
}

export function isValidKey(key: string): boolean {
  if (!key) return false;
  return key.trim() === getAdminKey().trim();
}

export async function isAuthenticated(): Promise<boolean> {
  const cookieStore = cookies();
  const sessionToken = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  if (!sessionToken) return false;
  return sessionToken === Buffer.from(getAdminKey()).toString("base64");
}

export function checkRequestAuth(request: Request): boolean {
  // 1. Check Authorization header
  const authHeader = request.headers.get("Authorization");
  if (authHeader) {
    const token = authHeader.replace(/^Bearer\s+/i, "").trim();
    if (isValidKey(token)) {
      return true;
    }
  }

  // 2. Check cookie header
  const cookieHeader = request.headers.get("cookie") || "";
  const match = cookieHeader.match(new RegExp(`${AUTH_COOKIE_NAME}=([^;]+)`));
  if (match) {
    const expected = Buffer.from(getAdminKey()).toString("base64");
    if (match[1] === expected) {
      return true;
    }
  }

  return false;
}

export function createSessionToken(): string {
  return Buffer.from(getAdminKey()).toString("base64");
}

export { AUTH_COOKIE_NAME };
