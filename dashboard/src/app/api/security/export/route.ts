import { NextResponse } from "next/server";
import { checkRequestAdminAuth, getCurrentUser } from "@/lib/auth";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!checkRequestAdminAuth(request)) {
    return NextResponse.json({ error: "Access Denied: Admin privileges required." }, { status: 403 });
  }

  try {
    const user = await getCurrentUser();
    const { searchParams } = new URL(request.url);
    const guildId =
      searchParams.get("guildId") ||
      user?.guildId ||
      process.env.DEFAULT_GUILD_ID ||
      "1520461877073674392";

    const format = searchParams.get("format") || "csv";
    const type = searchParams.get("type") || "incidents"; // "incidents" or "cases"

    if (type === "cases") {
      const rows = await query(
        `SELECT case_id, user_id, mod_id, action, reason, created_at
         FROM mod_cases
         WHERE guild_id = $1
         ORDER BY created_at DESC`,
        [guildId]
      );

      if (format === "json") {
        return new NextResponse(JSON.stringify(rows, null, 2), {
          headers: {
            "Content-Type": "application/json",
            "Content-Disposition": `attachment; filename="syncink-mod-cases-${guildId}.json"`,
          },
        });
      }

      // CSV format
      const headers = "Case ID,User ID,Moderator ID,Action,Reason,Created At\n";
      const csvLines = rows
        .map(
          (r) =>
            `"${r.case_id}","${r.user_id}","${r.mod_id}","${r.action}","${(r.reason || "").replace(/"/g, '""')}","${r.created_at}"`
        )
        .join("\n");

      return new NextResponse(headers + csvLines, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="syncink-mod-cases-${guildId}.csv"`,
        },
      });
    }

    // Default: Incidents
    const rows = await query(
      `SELECT id, user_id, module, action_taken, severity, risk_score, details, created_at
       FROM security_incidents
       WHERE guild_id = $1
       ORDER BY created_at DESC`,
      [guildId]
    );

    if (format === "json") {
      return new NextResponse(JSON.stringify(rows, null, 2), {
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition": `attachment; filename="syncink-security-incidents-${guildId}.json"`,
        },
      });
    }

    // CSV format
    const headers = "ID,User ID,Module,Action Taken,Severity,Risk Score,Details,Timestamp\n";
    const csvLines = rows
      .map(
        (r) =>
          `"${r.id}","${r.user_id}","${r.module}","${r.action_taken}","${r.severity}","${r.risk_score}","${(r.details || "").replace(/"/g, '""')}","${r.created_at}"`
      )
      .join("\n");

    return new NextResponse(headers + csvLines, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="syncink-security-incidents-${guildId}.csv"`,
      },
    });
  } catch (error: any) {
    console.error("Export API Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to export records" },
      { status: 500 }
    );
  }
}
