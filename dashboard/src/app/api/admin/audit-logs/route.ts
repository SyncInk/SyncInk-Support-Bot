import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { isOwner } from "@/lib/permissions";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || !isOwner(user)) {
    return NextResponse.json({ error: "Access Denied. Owner authorization required." }, { status: 403 });
  }

  try {
    const logs =
      (await query<any>(
        "SELECT id, actor_id, actor_name, action, target_id, target_name, details, ip_address, created_at FROM admin_audit_logs ORDER BY created_at DESC LIMIT 60"
      )) || [];

    return NextResponse.json({ success: true, logs });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to load audit logs" }, { status: 500 });
  }
}
