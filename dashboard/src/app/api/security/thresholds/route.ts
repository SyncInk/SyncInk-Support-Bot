import { NextResponse } from "next/server";
import { checkRequestAdminAuth, getCurrentUser, verifyUserGuildAccess } from "@/lib/auth";
import { query, resolveGuildId } from "@/lib/db";
import { validateCsrfOrigin, redactSensitive } from "@/lib/security";
import { rateLimiter, getClientIp } from "@/lib/rate-limit";

export async function POST(request: Request) {
  // 1. CSRF Protection (Item 3)
  if (!validateCsrfOrigin(request)) {
    return NextResponse.json({ error: "Invalid request origin (CSRF validation failed)" }, { status: 403 });
  }

  // 2. Rate Limiting (Item 6)
  const clientIp = getClientIp(request);
  const rateLimit = rateLimiter.check(`sec_thresh_${clientIp}`, 30, 60 * 1000);
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: "Too many threshold updates. Please slow down." }, { status: 429 });
  }

  // 3. Admin Authorization (Item 13)
  if (!checkRequestAdminAuth(request)) {
    return NextResponse.json({ error: "Access Denied: Only Server Owner & Administrators can modify thresholds." }, { status: 403 });
  }

  try {
    const user = await getCurrentUser();
    const body = await request.json();
    const {
      spamLimit,
      mentionLimit,
      raidLimit,
      nukeLimit,
      guildId: reqGuildId
    } = body;

    const guildId = await resolveGuildId(reqGuildId || user?.guildId);

    // 4. BOLA Check: Verify user manages this guild (Item 5 & 14)
    if (!verifyUserGuildAccess(user, guildId)) {
      return NextResponse.json({ error: "Access Denied: You do not have permissions for this server." }, { status: 403 });
    }

    const s = Math.min(100, Math.max(1, parseInt(spamLimit || "5", 10)));
    const m = Math.min(100, Math.max(1, parseInt(mentionLimit || "5", 10)));
    const r = Math.min(100, Math.max(1, parseInt(raidLimit || "5", 10)));
    const n = Math.min(100, Math.max(1, parseInt(nukeLimit || "3", 10)));

    await query(
      `INSERT INTO guild_settings (guild_id, spam_threshold, mention_threshold, anti_raid_threshold, anti_nuke_threshold)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (guild_id) DO UPDATE SET 
         spam_threshold = $2,
         mention_threshold = $3,
         anti_raid_threshold = $4,
         anti_nuke_threshold = $5`,
      [guildId, s, m, r, n]
    );

    return NextResponse.json({
      success: true,
      thresholds: {
        spam_threshold: s,
        mention_threshold: m,
        anti_raid_threshold: r,
        anti_nuke_threshold: n
      },
      message: "Security thresholds successfully updated."
    });
  } catch (error: any) {
    console.error("Threshold API Error:", redactSensitive(error.message || ""));
    return NextResponse.json(
      { error: "Failed to update thresholds" },
      { status: 500 }
    );
  }
}
