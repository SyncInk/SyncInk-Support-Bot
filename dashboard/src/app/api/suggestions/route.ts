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

    const statusFilter = searchParams.get("status");

    let sql = `
      SELECT id, guild_id, user_id, channel_id, message_id, title, content, upvotes, downvotes, status, created_at
      FROM feature_requests
      WHERE guild_id = $1
    `;
    const params: any[] = [guildId];

    if (statusFilter && statusFilter !== "ALL") {
      params.push(statusFilter.toUpperCase());
      sql += ` AND UPPER(status) = $${params.length}`;
    }

    sql += " ORDER BY created_at DESC LIMIT 100";

    const suggestions = await query(sql, params).catch(async () => {
      await query(`
        CREATE TABLE IF NOT EXISTS feature_requests (
          id SERIAL PRIMARY KEY,
          guild_id BIGINT NOT NULL,
          user_id BIGINT NOT NULL,
          channel_id BIGINT NOT NULL,
          message_id BIGINT,
          title VARCHAR(255),
          content TEXT NOT NULL,
          upvotes INT DEFAULT 0,
          downvotes INT DEFAULT 0,
          status VARCHAR(50) DEFAULT 'PENDING',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      return [];
    });

    return NextResponse.json({
      suggestions: suggestions || [],
    });
  } catch (error: any) {
    console.error("Suggestions GET Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch suggestions" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  if (!checkRequestAdminAuth(request)) {
    return NextResponse.json(
      { error: "Access Denied: Only Server Owner & Administrators can update suggestion status." },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json({ error: "id and status are required" }, { status: 400 });
    }

    const validStatuses = ["PENDING", "APPROVED", "IN PROGRESS", "IMPLEMENTED", "REJECTED"];
    const cleanStatus = status.toUpperCase().trim();

    if (!validStatuses.includes(cleanStatus)) {
      return NextResponse.json({ error: `Invalid status: ${status}` }, { status: 400 });
    }

    await query(
      "UPDATE feature_requests SET status = $1 WHERE id = $2",
      [cleanStatus, parseInt(id, 10)]
    );

    return NextResponse.json({
      success: true,
      status: cleanStatus,
      message: `Suggestion #${id} updated to ${cleanStatus}.`,
    });
  } catch (error: any) {
    console.error("Suggestions PATCH Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update suggestion status" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  if (!checkRequestAdminAuth(request)) {
    return NextResponse.json(
      { error: "Access Denied: Only Server Owner & Administrators can delete suggestions." },
      { status: 403 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    await query("DELETE FROM feature_requests WHERE id = $1", [parseInt(id, 10)]);

    return NextResponse.json({
      success: true,
      message: `Suggestion #${id} deleted.`,
    });
  } catch (error: any) {
    console.error("Suggestions DELETE Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete suggestion" },
      { status: 500 }
    );
  }
}
