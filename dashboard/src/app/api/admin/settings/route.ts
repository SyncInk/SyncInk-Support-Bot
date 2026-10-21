import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { isOwner, logAdminAudit } from "@/lib/permissions";
import { query } from "@/lib/db";
import { validateCsrfOrigin, sanitizeInputText } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || !isOwner(user)) {
    return NextResponse.json({ error: "Access Denied. Owner authorization required." }, { status: 403 });
  }

  try {
    const rows =
      (await query<any>(
        "SELECT key, value, description, updated_by, updated_at FROM app_settings ORDER BY key ASC"
      )) || [];

    const settingsMap: Record<string, string> = {
      recruitment_enabled: "true",
      staff_apply_channel: "1538896833852481556",
      developer_apply_channel: "1538896901007736872",
      support_server_invite: "https://discord.gg/PmxfJwmQuB",
      telemetry_mode: "LIVE",
    };

    rows.forEach((r) => {
      settingsMap[r.key] = r.value;
    });

    return NextResponse.json({ success: true, settings: settingsMap, raw: rows });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to load settings" }, { status: 500 });
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
    const settings = body.settings || {};

    const ALLOWED_KEYS = [
      "recruitment_enabled",
      "staff_apply_channel",
      "developer_apply_channel",
      "support_server_invite",
      "telemetry_mode",
    ];

    for (const key of Object.keys(settings)) {
      if (ALLOWED_KEYS.includes(key)) {
        const val = sanitizeInputText(String(settings[key]), 500);
        await query(
          `INSERT INTO app_settings (key, value, updated_by, updated_at)
           VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
           ON CONFLICT (key) DO UPDATE SET
             value = EXCLUDED.value,
             updated_by = EXCLUDED.updated_by,
             updated_at = CURRENT_TIMESTAMP`,
          [key, val, user.id]
        );
      }
    }

    // Write audit log
    await logAdminAudit({
      actor: user,
      action: "SETTINGS_UPDATED",
      details: settings,
    });

    return NextResponse.json({ success: true, message: "Settings saved successfully." });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to save settings" }, { status: 500 });
  }
}
