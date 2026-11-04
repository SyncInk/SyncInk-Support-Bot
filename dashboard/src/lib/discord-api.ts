// Discord REST API Client for SyncInk Verification & Support Bot
// Centralizes all bot token calls and ensures the mandatory User-Agent header
// is sent to avoid Cloudflare 40333 ("internal network error") blocks.

import { redactSensitive } from "./security";

export const DISCORD_API_BASE = "https://discord.com/api/v10";
export const DISCORD_USER_AGENT = "DiscordBot (https://syncink.site, 1.0.0)";

export const SUPPORT_GUILD_ID = (process.env.SUPPORT_GUILD_ID || process.env.DEFAULT_GUILD_ID || "1520457643842342912").trim();
export const ROLE_VERIFIED_ID = "1520871574088056952";
export const ROLE_UNVERIFIED_ID = "1520870810775060592";
export const ROLE_UPDATES_ID = "1547084124983132240";
export const VERIFICATION_CHANNEL_ID = "1520748219100041348";

export function getBotToken(): string {
  return (
    process.env.DISCORD_BOT_TOKEN ||
    process.env.DISCORD_TOKEN ||
    ""
  ).trim();
}

export function getDiscordAuthHeaders(customToken?: string): HeadersInit {
  const token = customToken || getBotToken();
  return {
    Authorization: `Bot ${token}`,
    "User-Agent": DISCORD_USER_AGENT,
    "Content-Type": "application/json",
  };
}

export interface DiscordGuildData {
  id: string;
  name: string;
  icon: string | null;
  approximate_member_count?: number;
  approximate_presence_count?: number;
  premium_tier?: number;
  premium_subscription_count?: number;
}

export interface DiscordMemberData {
  user: {
    id: string;
    username: string;
    discriminator: string;
    avatar: string | null;
    global_name?: string | null;
  };
  roles: string[];
  joined_at: string;
  premium_since?: string | null;
  pending?: boolean;
}

/**
 * Fetches guild information including live approximate member and presence counts.
 */
export async function getGuildDetails(guildId: string = SUPPORT_GUILD_ID): Promise<DiscordGuildData | null> {
  const token = getBotToken();
  if (!token) return null;

  try {
    const res = await fetch(`${DISCORD_API_BASE}/guilds/${guildId}?with_counts=true`, {
      headers: getDiscordAuthHeaders(token),
      next: { revalidate: 15 },
    });

    if (!res.ok) {
      console.warn(`getGuildDetails failed: ${res.status} ${res.statusText}`);
      return null;
    }

    return (await res.json()) as DiscordGuildData;
  } catch (err: any) {
    console.error("Error fetching guild details:", redactSensitive(err?.message || ""));
    return null;
  }
}

/**
 * Fetches a member of the guild using Bot token.
 */
export async function getGuildMember(
  guildId: string = SUPPORT_GUILD_ID,
  userId: string
): Promise<DiscordMemberData | null> {
  const token = getBotToken();
  if (!token || !userId) return null;

  try {
    const res = await fetch(`${DISCORD_API_BASE}/guilds/${guildId}/members/${userId}`, {
      headers: getDiscordAuthHeaders(token),
      cache: "no-store",
    });

    if (res.status === 404) {
      return null; // Not in guild
    }

    if (!res.ok) {
      console.warn(`getGuildMember failed: ${res.status} ${res.statusText}`);
      return null;
    }

    return (await res.json()) as DiscordMemberData;
  } catch (err: any) {
    console.error("Error fetching guild member:", redactSensitive(err?.message || ""));
    return null;
  }
}

/**
 * Atomically performs role assignment for verified member:
 * 1. Adds Verified role (1520871574088056952)
 * 2. Adds UPDATES role (1547084124983132240)
 * 3. Removes Unverified role (1520870810775060592)
 */
export async function assignVerifiedRoles(
  guildId: string = SUPPORT_GUILD_ID,
  userId: string,
  auditReason: string = "Passed Web Verification Checkpoint"
): Promise<{ success: boolean; error?: string }> {
  const token = getBotToken();
  if (!token) {
    return { success: false, error: "Bot token not configured on server." };
  }

  const headers = {
    ...getDiscordAuthHeaders(token),
    "X-Audit-Log-Reason": auditReason,
  };

  try {
    // 1. Add Verified role
    const addVerifiedRes = await fetch(
      `${DISCORD_API_BASE}/guilds/${guildId}/members/${userId}/roles/${ROLE_VERIFIED_ID}`,
      { method: "PUT", headers }
    );
    if (!addVerifiedRes.ok && addVerifiedRes.status !== 204) {
      const err = await addVerifiedRes.text();
      return { success: false, error: `Failed to add Verified role: ${err}` };
    }

    // 2. Add UPDATES role
    const addUpdatesRes = await fetch(
      `${DISCORD_API_BASE}/guilds/${guildId}/members/${userId}/roles/${ROLE_UPDATES_ID}`,
      { method: "PUT", headers }
    );
    if (!addUpdatesRes.ok && addUpdatesRes.status !== 204) {
      console.warn(`Notice: Could not assign updates role to ${userId}: status ${addUpdatesRes.status}`);
    }

    // 3. Remove Unverified role
    const removeUnverifiedRes = await fetch(
      `${DISCORD_API_BASE}/guilds/${guildId}/members/${userId}/roles/${ROLE_UNVERIFIED_ID}`,
      { method: "DELETE", headers }
    );
    if (!removeUnverifiedRes.ok && removeUnverifiedRes.status !== 204 && removeUnverifiedRes.status !== 404) {
      console.warn(`Notice: Could not remove unverified role from ${userId}: status ${removeUnverifiedRes.status}`);
    }

    return { success: true };
  } catch (err: any) {
    console.error("Error assigning verified roles:", redactSensitive(err?.message || ""));
    return { success: false, error: err?.message || "Network error communicating with Discord." };
  }
}

/**
 * Sends a structured audit embed to the configured verification logging channel.
 */
export async function sendVerificationAuditLog(
  channelId: string,
  embed: any
): Promise<boolean> {
  const token = getBotToken();
  if (!token || !channelId) return false;

  try {
    const res = await fetch(`${DISCORD_API_BASE}/channels/${channelId}/messages`, {
      method: "POST",
      headers: getDiscordAuthHeaders(token),
      body: JSON.stringify({ embeds: [embed] }),
    });

    return res.ok;
  } catch (err: any) {
    console.warn("Could not dispatch verification audit log:", redactSensitive(err?.message || ""));
    return false;
  }
}
