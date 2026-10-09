import { NextResponse } from "next/server";
import { checkRequestAdminAuth, getCurrentUser, verifyUserGuildAccess } from "@/lib/auth";
import { query, resolveGuildId } from "@/lib/db";
import { redactSensitive } from "@/lib/security";
import { rateLimiter, getClientIp } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

/**
 * Sanitize CSV cell values to prevent CSV formula injection (Item 2)
 */
function sanitizeCsvCell(value: any): string {
  if (value === null || value === undefined) return '""';
  let str = String(value);
  // Neutralize formula triggers
  if (/^[=+\-@\t\r]/.test(str)) {
    str = "'" + str;
  }
  return `"${str.replace(/"/g, '""')}"`;
}

export async function GET(request: Request) {
  // 1. Admin Authorization (Item 13)
  if (!checkRequestAdminAuth(request)) {
    return NextResponse.json({ error: "Access Denied: Admin privileges required." }, { status: 403 });
  }

  // 2. Rate Limiting (Item 6)
  const clientIp = getClientIp(request);
  const rateLimit = rateLimiter.check(`sec_export_${clientIp}`, 10, 60 * 1000);
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: "Too many export requests. Please wait a minute." }, { status: 429 });
  }

  try {
    const user = await getCurrentUser();
    const { searchParams } = new URL(request.url);
    const guildId = await resolveGuildId(searchParams.get("guildId") || user?.guildId);

    // 3. BOLA Check (Item 5 & 14)
    if (!verifyUserGuildAccess(user, guildId)) {
      return NextResponse.json({ error: "Access Denied: You do not have permissions for this server." }, { status: 403 });
    }

    const format = searchParams.get("format") || "csv";
    const type = searchParams.get("type") || "incidents";

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

      // Safe CSV export with formula injection protection
      const headers = "Case ID,User ID,Moderator ID,Action,Reason,Created At\n";
      const csvLines = rows
        .map((r) =>
          [
            sanitizeCsvCell(r.case_id),
            sanitizeCsvCell(r.user_id),
            sanitizeCsvCell(r.mod_id),
            sanitizeCsvCell(r.action),
            sanitizeCsvCell(r.reason),
            sanitizeCsvCell(r.created_at),
          ].join(",")
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

    const headers = "ID,User ID,Module,Action Taken,Severity,Risk Score,Details,Timestamp\n";
    const csvLines = rows
      .map((r) =>
        [
          sanitizeCsvCell(r.id),
          sanitizeCsvCell(r.user_id),
          sanitizeCsvCell(r.module),
          sanitizeCsvCell(r.action_taken),
          sanitizeCsvCell(r.severity),
          sanitizeCsvCell(r.risk_score),
          sanitizeCsvCell(r.details),
          sanitizeCsvCell(r.created_at),
        ].join(",")
      )
      .join("\n");

    return new NextResponse(headers + csvLines, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="syncink-security-incidents-${guildId}.csv"`,
      },
    });
  } catch (error: any) {
    console.error("Export API Error:", redactSensitive(error.message || ""));
    return NextResponse.json(
      { error: "Failed to export records" },
      { status: 500 }
    );
  }
}
