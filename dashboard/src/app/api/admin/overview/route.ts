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
    // 1. Applications counts
    let appStats = { total: 0, pending: 0, underReview: 0, accepted: 0, rejected: 0 };
    try {
      const rows = await query<any>(
        `SELECT status, COUNT(*)::int as count
         FROM member_applications
         GROUP BY status`
      );
      if (rows) {
        let total = 0;
        rows.forEach((r) => {
          total += r.count;
          if (r.status === "PENDING") appStats.pending = r.count;
          else if (r.status === "UNDER_REVIEW") appStats.underReview = r.count;
          else if (r.status === "ACCEPTED") appStats.accepted = r.count;
          else if (r.status === "REJECTED") appStats.rejected = r.count;
        });
        appStats.total = total;
      }
    } catch (err) {
      // Table might be initializing
    }

    // 2. Administrators count
    let adminCount = 1; // At least primary owner
    try {
      const countRes = await query<any>("SELECT COUNT(*)::int as count FROM admin_roles");
      if (countRes && countRes[0]) {
        adminCount = Math.max(countRes[0].count, 1);
      }
    } catch (err) {}

    // 3. Recent Audit Logs
    let recentAudits: any[] = [];
    try {
      recentAudits =
        (await query<any>(
          "SELECT * FROM admin_audit_logs ORDER BY created_at DESC LIMIT 8"
        )) || [];
    } catch (err) {}

    // 4. Ecosystem Services
    const services = [
      { name: "SyncInk Support Bot", status: "ONLINE", version: "v2.4.0", type: "Security & Moderation" },
      { name: "SyncInk Ticket Bot", status: "ONLINE", version: "v2.3.0", type: "Private Threads & Transcripts" },
      { name: "SyncInk Voice Bot", status: "ONLINE", version: "v2.2.0", type: "Dynamic Voice Generators" },
      { name: "SyncInk Web Platform", status: "ONLINE", version: "v2.4.0", type: "Edge API & Next.js" },
    ];

    return NextResponse.json({
      success: true,
      ownerId: user.id,
      appStats,
      adminCount,
      recentAudits,
      services,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to load overview" }, { status: 500 });
  }
}
