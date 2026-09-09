import { NextResponse } from "next/server";
import { checkRequestAuth } from "@/lib/auth";
import { query } from "@/lib/db";

export async function POST(request: Request) {
  if (!checkRequestAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      spamLimit,
      mentionLimit,
      raidLimit,
      nukeLimit,
      guildId: reqGuildId
    } = body;

    const guildId = reqGuildId || process.env.DEFAULT_GUILD_ID || "1520461877073674392";

    const s = Math.max(1, parseInt(spamLimit || "5", 10));
    const m = Math.max(1, parseInt(mentionLimit || "5", 10));
    const r = Math.max(1, parseInt(raidLimit || "5", 10));
    const n = Math.max(1, parseInt(nukeLimit || "3", 10));

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
    console.error("Threshold API Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update thresholds" },
      { status: 500 }
    );
  }
}
