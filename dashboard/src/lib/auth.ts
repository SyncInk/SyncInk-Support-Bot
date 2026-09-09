import { cookies } from "next/headers";

const AUTH_COOKIE_NAME = "syncink_admin_session";
const DISCORD_COOKIE_NAME = "syncink_discord_session";

export interface DiscordUser {
  id: string;
  username: string;
  global_name?: string | null;
  avatar?: string | null;
  isOwner?: boolean;
}

export function getAdminKey(): string {
  return process.env.ADMIN_ACCESS_KEY || "syncink_admin_default_pass";
}

export function isValidKey(key: string): boolean {
  if (!key) return false;
  return key.trim() === getAdminKey().trim();
}

export function createSessionToken(): string {
  return Buffer.from(getAdminKey()).toString("base64");
}

export function createDiscordSessionToken(user: DiscordUser): string {
  return Buffer.from(JSON.stringify(user)).toString("base64url");
}

export function parseDiscordSession(token: string): DiscordUser | null {
  try {
    const jsonStr = Buffer.from(token, "base64url").toString("utf-8");
    return JSON.parse(jsonStr);
  } catch {
    return null;
  }
}

export async function getCurrentUser(): Promise<DiscordUser | null> {
  const cookieStore = cookies();
  const discordToken = cookieStore.get(DISCORD_COOKIE_NAME)?.value;
  if (discordToken) {
    const user = parseDiscordSession(discordToken);
    if (user) return user;
  }

  const adminToken = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  if (adminToken && adminToken === createSessionToken()) {
    return {
      id: "admin",
      username: "Server Administrator",
      global_name: "Admin Passkey",
      isOwner: true,
    };
  }

  return null;
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

  // 2. Check cookies
  const cookieHeader = request.headers.get("cookie") || "";

  // Check Discord OAuth cookie
  const discordMatch = cookieHeader.match(new RegExp(`${DISCORD_COOKIE_NAME}=([^;]+)`));
  if (discordMatch) {
    const user = parseDiscordSession(discordMatch[1]);
    if (user && user.id) {
      return true;
    }
  }

  // Check Admin passkey cookie
  const adminMatch = cookieHeader.match(new RegExp(`${AUTH_COOKIE_NAME}=([^;]+)`));
  if (adminMatch) {
    const expected = createSessionToken();
    if (adminMatch[1] === expected) {
      return true;
    }
  }

  return false;
}

export { AUTH_COOKIE_NAME, DISCORD_COOKIE_NAME };
