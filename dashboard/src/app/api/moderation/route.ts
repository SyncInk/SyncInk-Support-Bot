import { NextResponse } from "next/server";
import { checkRequestAuth, checkRequestAdminAuth, getCurrentUser } from "@/lib/auth";
import { query, queryOne } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!checkRequestAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await getCurrentUser();
    const { searchParams } = new URL(request.url);
    const guildId =
      searchParams.get("guildId") ||
      user?.guildId ||
      process.env.DEFAULT_GUILD_ID ||
      "1520461877073674392";

    const actionFilter = searchParams.get("action");
    const searchQuery = searchParams.get("search")?.trim() || "";
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50", 10)));

    let sql = `
      SELECT case_id, guild_id, user_id, mod_id, action, reason, created_at
      FROM mod_cases
      WHERE guild_id = $1
    `;
    const params: any[] = [guildId];

    if (actionFilter && actionFilter !== "ALL") {
      params.push(actionFilter.toUpperCase());
      sql += ` AND UPPER(action) = $${params.length}`;
    }

    if (searchQuery) {
      params.push(`%${searchQuery}%`);
      sql += ` AND (user_id::text LIKE $${params.length} OR mod_id::text LIKE $${params.length} OR reason ILIKE $${params.length})`;
    }

    sql += ` ORDER BY created_at DESC LIMIT $${params.length + 1}`;
    params.push(limit);

    const cases = await query(sql, params).catch(async (err) => {
      console.warn("mod_cases query error, creating table if not exists:", err);
      await query(`
        CREATE TABLE IF NOT EXISTS mod_cases (
          case_id SERIAL PRIMARY KEY,
          guild_id BIGINT NOT NULL,
          user_id BIGINT NOT NULL,
          mod_id BIGINT NOT NULL,
          action VARCHAR(50) NOT NULL,
          reason TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      return [];
    });

    const totalCountRes = await queryOne(
      "SELECT COUNT(*) as count FROM mod_cases WHERE guild_id = $1",
      [guildId]
    ).catch(() => ({ count: "0" }));

    return NextResponse.json({
      cases: cases || [],
      total: parseInt(totalCountRes?.count || "0", 10),
    });
  } catch (error: any) {
    console.error("Moderation API Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to query moderation cases" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  if (!checkRequestAdminAuth(request)) {
    return NextResponse.json(
      { error: "Access Denied: Only Server Owner & Administrators can issue moderation actions." },
      { status: 403 }
    );
  }

  try {
    const user = await getCurrentUser();
    const body = await request.json();
    const { userId, action, reason, guildId: reqGuildId } = body;
    const guildId =
      reqGuildId ||
      user?.guildId ||
      process.env.DEFAULT_GUILD_ID ||
      "1520461877073674392";

    if (!userId || !action) {
      return NextResponse.json(
        { error: "User ID and action type are required" },
        { status: 400 }
      );
    }

    const cleanUserId = String(userId).replace(/[<@!>]/g, "").trim();
    const cleanAction = String(action).toUpperCase().trim();
    const cleanReason = String(reason || "Action applied via Web Dashboard").trim();
    const modId = user?.id === "admin" ? 0 : (user?.id || 0);

    const result = await queryOne(
      `INSERT INTO mod_cases (guild_id, user_id, mod_id, action, reason)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING case_id, created_at`,
      [guildId, cleanUserId, modId, cleanAction, cleanReason]
    );

    // Also log incident in forensics
    await query(
      `INSERT INTO security_incidents (guild_id, user_id, module, action_taken, severity, risk_score, details)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        guildId,
        cleanUserId,
        "Moderation Dispatch",
        cleanAction,
        ["BAN", "KICK"].includes(cleanAction) ? "HIGH" : "MEDIUM",
        ["BAN"].includes(cleanAction) ? 80 : 40,
        `Case #${result?.case_id || "?"}: ${cleanReason} (by ${user?.username || "Admin"})`,
      ]
    );

    return NextResponse.json({
      success: true,
      caseId: result?.case_id,
      message: `Successfully logged moderation case for ${cleanUserId} (${cleanAction}).`,
    });
  } catch (error: any) {
    console.error("Moderation Post Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to record moderation action" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  if (!checkRequestAdminAuth(request)) {
    return NextResponse.json(
      { error: "Access Denied: Only Server Owner & Administrators can remove moderation cases." },
      { status: 403 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const caseId = searchParams.get("caseId");

    if (!caseId) {
      return NextResponse.json({ error: "caseId is required" }, { status: 400 });
    }

    await query("DELETE FROM mod_cases WHERE case_id = $1", [parseInt(caseId, 10)]);

    return NextResponse.json({
      success: true,
      message: `Case #${caseId} successfully removed.`,
    });
  } catch (error: any) {
    console.error("Moderation Delete Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete case" },
      { status: 500 }
    );
  }
}
