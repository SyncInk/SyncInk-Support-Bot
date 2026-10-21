import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { isOwner, PRIMARY_OWNER_ID, logAdminAudit, SystemRole } from "@/lib/permissions";
import { query } from "@/lib/db";
import { validateCsrfOrigin, sanitizeInputText } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || !isOwner(user)) {
    return NextResponse.json({ error: "Access Denied. Owner authorization required." }, { status: 403 });
  }

  try {
    const roles =
      (await query<any>(
        "SELECT id, user_id::text, username, role, granted_by::text, granted_by_name, notes, created_at, updated_at FROM admin_roles ORDER BY created_at DESC"
      )) || [];

    // Ensure primary owner is always present
    const hasOwner = roles.some((r) => r.user_id === PRIMARY_OWNER_ID);
    if (!hasOwner) {
      roles.unshift({
        id: 0,
        user_id: PRIMARY_OWNER_ID,
        username: "SyncInk Owner",
        role: "owner",
        granted_by: PRIMARY_OWNER_ID,
        granted_by_name: "System Bootstrap",
        notes: "Protected Master Server Owner",
        created_at: new Date().toISOString(),
      });
    }

    return NextResponse.json({ success: true, roles });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch roles" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!validateCsrfOrigin(request)) {
    return NextResponse.json({ error: "CSRF verification failed" }, { status: 403 });
  }

  const user = await getCurrentUser();
  if (!user || !isOwner(user)) {
    return NextResponse.json({ error: "Access Denied. Owner authorization required." }, { status: 403 });
  }

  try {
    const body = await request.json();
    const targetUserId = sanitizeInputText(body.userId || "", 30).trim();
    const targetUsername = sanitizeInputText(body.username || "", 100).trim();
    const role = sanitizeInputText(body.role || "", 30).toLowerCase().trim() as SystemRole;
    const notes = sanitizeInputText(body.notes || "", 500).trim();

    if (!targetUserId || !/^\d{17,20}$/.test(targetUserId)) {
      return NextResponse.json({ error: "Valid Discord Snowflake User ID (17-20 digits) is required." }, { status: 400 });
    }

    const ALLOWED_ROLES = ["owner", "admin", "staff", "developer", "reviewer"];
    if (!ALLOWED_ROLES.includes(role)) {
      return NextResponse.json({ error: `Invalid role. Allowed roles: ${ALLOWED_ROLES.join(", ")}` }, { status: 400 });
    }

    // Owner protection: Only primary owner ID 930306512864280607 can assign 'owner' role
    if (role === "owner" && user.id !== PRIMARY_OWNER_ID && user.id !== "admin") {
      return NextResponse.json({ error: "Only the primary system owner can assign owner privileges." }, { status: 403 });
    }

    await query(
      `INSERT INTO admin_roles (user_id, username, role, granted_by, granted_by_name, notes)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (user_id) DO UPDATE SET
         username = EXCLUDED.username,
         role = EXCLUDED.role,
         granted_by = EXCLUDED.granted_by,
         granted_by_name = EXCLUDED.granted_by_name,
         notes = EXCLUDED.notes,
         updated_at = CURRENT_TIMESTAMP`,
      [
        targetUserId,
        targetUsername || `User ${targetUserId}`,
        role,
        user.id === "admin" ? PRIMARY_OWNER_ID : user.id,
        user.global_name || user.username || "Owner",
        notes || null,
      ]
    );

    // Write audit log
    await logAdminAudit({
      actor: user,
      action: "ROLE_ASSIGNED",
      targetId: targetUserId,
      targetName: targetUsername,
      details: { role, notes },
    });

    return NextResponse.json({
      success: true,
      message: `Role '${role}' assigned to user ${targetUsername || targetUserId}.`,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to assign role" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  if (!validateCsrfOrigin(request)) {
    return NextResponse.json({ error: "CSRF verification failed" }, { status: 403 });
  }

  const user = await getCurrentUser();
  if (!user || !isOwner(user)) {
    return NextResponse.json({ error: "Access Denied. Owner authorization required." }, { status: 403 });
  }

  try {
    const url = new URL(request.url);
    const targetUserId = url.searchParams.get("userId");

    if (!targetUserId) {
      return NextResponse.json({ error: "User ID is required." }, { status: 400 });
    }

    // IMMUTABLE OWNER RULE: Primary owner cannot be revoked!
    if (targetUserId === PRIMARY_OWNER_ID) {
      return NextResponse.json(
        { error: "Access denied. The primary server owner account is protected and cannot be revoked or removed." },
        { status: 400 }
      );
    }

    await query("DELETE FROM admin_roles WHERE user_id = $1", [targetUserId]);

    // Write audit log
    await logAdminAudit({
      actor: user,
      action: "ROLE_REVOKED",
      targetId: targetUserId,
      details: { revokedBy: user.id },
    });

    return NextResponse.json({
      success: true,
      message: `Permissions for user ${targetUserId} have been revoked.`,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to revoke role" }, { status: 500 });
  }
}
