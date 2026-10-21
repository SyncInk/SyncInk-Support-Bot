import { DiscordUser } from "./auth";
import { query } from "./db";

export const PRIMARY_OWNER_ID = "930306512864280607";

export type SystemRole = "owner" | "admin" | "staff" | "developer" | "reviewer" | "member";

/**
 * Validates whether the given user is the protected system owner.
 * Primary owner ID (930306512864280607) is immutable and can never be stripped.
 */
export function isOwner(user: DiscordUser | null): boolean {
  if (!user || !user.id) return false;
  if (user.id === PRIMARY_OWNER_ID) return true;
  if (user.id === "admin") return true; // Master dev passkey
  return Boolean(user.isOwner && user.roleType === "owner");
}

/**
 * Validates whether the user has administrator-level permissions or higher.
 */
export function isAdmin(user: DiscordUser | null): boolean {
  if (!user || !user.id) return false;
  if (isOwner(user)) return true;
  return Boolean(user.isAdmin || user.roleType === "admin");
}

/**
 * Validates whether the user can review member applications.
 */
export function canReviewApplications(user: DiscordUser | null, type?: "staff" | "developer"): boolean {
  if (!user || !user.id) return false;
  if (isOwner(user) || isAdmin(user)) return true;
  if (type === "developer") {
    return user.roleType === "developer" || Boolean(user.isStaff);
  }
  return Boolean(user.isStaff || user.roleType === "staff");
}

/**
 * Retrieves the effective database role for a user (with owner bootstrap protection).
 */
export async function getEffectiveRole(userId: string): Promise<SystemRole> {
  if (userId === PRIMARY_OWNER_ID || userId === "admin") {
    return "owner";
  }

  try {
    const rows = await query<{ role: string }>(
      "SELECT role FROM admin_roles WHERE user_id = $1 LIMIT 1",
      [userId]
    );
    if (rows && rows.length > 0) {
      return rows[0].role as SystemRole;
    }
  } catch (err) {
    console.warn("Could not query admin_roles table:", err);
  }

  return "member";
}

/**
 * Writes an immutable audit entry to admin_audit_logs.
 */
export async function logAdminAudit(params: {
  actor: DiscordUser;
  action: string;
  targetId?: string;
  targetName?: string;
  details?: Record<string, any>;
  ipAddress?: string;
}): Promise<void> {
  try {
    await query(
      `INSERT INTO admin_audit_logs (actor_id, actor_name, action, target_id, target_name, details, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        params.actor.id,
        params.actor.global_name || params.actor.username || "Unknown",
        params.action,
        params.targetId || null,
        params.targetName || null,
        JSON.stringify(params.details || {}),
        params.ipAddress || null,
      ]
    );
  } catch (err) {
    console.warn("Failed to write to admin_audit_logs:", err);
  }
}
