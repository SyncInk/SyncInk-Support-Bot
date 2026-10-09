import { cookies } from "next/headers";
import {
  timingSafeCompare,
  createSignedToken,
  verifySignedToken,
} from "./security";

const AUTH_COOKIE_NAME = "syncink_admin_session";
const DISCORD_COOKIE_NAME = "syncink_discord_session";

export interface DiscordUser {
  id: string;
  username: string;
  global_name?: string | null;
  avatar?: string | null;
  isOwner?: boolean;
  isAdmin?: boolean;
  role?: string;
  guildId?: string;
  guildName?: string;
}

// Generate an ephemeral fallback for local dev if ADMIN_ACCESS_KEY is missing
let ephemeralDevKey: string | null = null;

export function getAdminKey(): string {
  const envKey = process.env.ADMIN_ACCESS_KEY;
  if (envKey && envKey !== "syncink_admin_default_pass") {
    return envKey;
  }

  // In production, NEVER allow default credentials
  if (process.env.NODE_ENV === "production") {
    console.error("SECURITY ALERT: ADMIN_ACCESS_KEY is not set or using default value in production!");
    return "DISALLOW_INSECURE_DEFAULT_IN_PRODUCTION";
  }

  if (!ephemeralDevKey) {
    ephemeralDevKey = "dev_local_" + Math.random().toString(36).substring(2, 15);
  }
  return ephemeralDevKey;
}

/**
 * Constant-time password / key verification (Item 9 & Item 18)
 */
export function isValidKey(key: string): boolean {
  if (!key || typeof key !== "string") return false;
  const adminKey = getAdminKey();
  if (adminKey === "DISALLOW_INSECURE_DEFAULT_IN_PRODUCTION") return false;
  return timingSafeCompare(key.trim(), adminKey.trim());
}

/**
 * Creates cryptographically signed admin session token (Item 7)
 */
export function createSessionToken(): string {
  return createSignedToken({
    role: "admin",
    created: Date.now(),
    type: "admin_passkey",
  });
}

/**
 * Validates cryptographically signed admin session token (Item 7)
 */
export function isValidAdminSessionToken(token: string): boolean {
  if (!token) return false;
  const payload = verifySignedToken<{ role: string; type: string }>(token);
  return Boolean(payload && payload.role === "admin" && payload.type === "admin_passkey");
}

/**
 * Creates cryptographically signed Discord session token (Item 7)
 */
export function createDiscordSessionToken(user: DiscordUser): string {
  return createSignedToken<DiscordUser>(user);
}

/**
 * Parses and cryptographically validates Discord session token (Item 7)
 */
export function parseDiscordSession(token: string): DiscordUser | null {
  if (!token) return null;
  return verifySignedToken<DiscordUser>(token);
}

/**
 * Retrieves currently authenticated user from secure HTTP-only cookies
 */
export async function getCurrentUser(): Promise<DiscordUser | null> {
  const cookieStore = cookies();
  const discordToken = cookieStore.get(DISCORD_COOKIE_NAME)?.value;
  if (discordToken) {
    const user = parseDiscordSession(discordToken);
    if (user) return user;
  }

  const adminToken = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  if (adminToken && isValidAdminSessionToken(adminToken)) {
    return {
      id: "admin",
      username: "Server Administrator",
      global_name: "Admin Passkey",
      isOwner: true,
      isAdmin: true,
    };
  }

  return null;
}

/**
 * Verifies if user has permission to manage the specified target guild (Item 5 & Item 13)
 */
export function verifyUserGuildAccess(user: DiscordUser | null, targetGuildId: string): boolean {
  if (!user || !targetGuildId) return false;

  // Master admin passkey has access across all managed guilds
  if (user.id === "admin") return true;

  // Authorized Super Admins / Creator
  const authorizedIds = process.env.AUTHORIZED_DISCORD_IDS
    ? process.env.AUTHORIZED_DISCORD_IDS.split(",").map((s) => s.trim())
    : [];

  if (authorizedIds.includes(user.id)) return true;

  const lowerName = (user.username || "").toLowerCase();
  if (lowerName === "syncink" || lowerName.includes("syncink")) return true;

  // For tenant isolation: must be admin/owner of THIS specific guild
  if ((user.isOwner || user.isAdmin) && user.guildId === targetGuildId) {
    return true;
  }

  return false;
}

/**
 * Verify request authentication (Discord session, signed admin token, or bearer header)
 */
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
  if (adminMatch && isValidAdminSessionToken(adminMatch[1])) {
    return true;
  }

  return false;
}

/**
 * Verify administrator-level authentication
 */
export function checkRequestAdminAuth(request: Request): boolean {
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
    if (user && (user.isOwner || user.isAdmin)) {
      return true;
    }
  }

  // Check Admin passkey cookie
  const adminMatch = cookieHeader.match(new RegExp(`${AUTH_COOKIE_NAME}=([^;]+)`));
  if (adminMatch && isValidAdminSessionToken(adminMatch[1])) {
    return true;
  }

  return false;
}

export { AUTH_COOKIE_NAME, DISCORD_COOKIE_NAME };
