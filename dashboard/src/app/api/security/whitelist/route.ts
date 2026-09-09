import { NextResponse } from "next/server";
import { checkRequestAuth, checkRequestAdminAuth, getCurrentUser } from "@/lib/auth";
import { query, resolveGuildId } from "@/lib/db";

export async function GET(request: Request) {
  if (!checkRequestAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await getCurrentUser();
    const { searchParams } = new URL(request.url);
    const guildId = await resolveGuildId(searchParams.get("guildId") || user?.guildId);

    const entries = await query(
      `SELECT id, guild_id, entity_type, entity_id_or_val, added_by, created_at 
       FROM security_whitelist 
       WHERE guild_id = $1 
       ORDER BY created_at DESC`,
      [guildId]
    );

    return NextResponse.json({ entries });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch whitelist" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!checkRequestAdminAuth(request)) {
    return NextResponse.json({ error: "Access Denied: Only Server Owner & Administrators can add whitelist items." }, { status: 403 });
  }

  try {
    const user = await getCurrentUser();
    const body = await request.json();
    const { type, value, guildId: reqGuildId } = body;
    const guildId = await resolveGuildId(reqGuildId || user?.guildId);

    if (!type || !value) {
      return NextResponse.json({ error: "Type and value are required" }, { status: 400 });
    }

    const cleanType = String(type).toLowerCase().trim();
    const cleanValue = String(value).toLowerCase().replace(/[<@!&#>]/g, "").trim();

    if (!["user", "role", "channel", "domain"].includes(cleanType)) {
      return NextResponse.json({ error: "Type must be 'user', 'role', 'channel', or 'domain'" }, { status: 400 });
    }

    await query(
      `INSERT INTO security_whitelist (guild_id, entity_type, entity_id_or_val, added_by)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (guild_id, entity_type, entity_id_or_val) DO NOTHING`,
      [guildId, cleanType, cleanValue, 0]
    );

    return NextResponse.json({
      success: true,
      message: `Added [${cleanType.toUpperCase()}] ${cleanValue} to whitelist.`
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to add whitelist item" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  if (!checkRequestAdminAuth(request)) {
    return NextResponse.json({ error: "Access Denied: Only Server Owner & Administrators can delete whitelist items." }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Whitelist entry ID is required" }, { status: 400 });
    }

    await query("DELETE FROM security_whitelist WHERE id = $1", [parseInt(id, 10)]);

    return NextResponse.json({ success: true, message: "Whitelist entry removed." });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to delete whitelist item" }, { status: 500 });
  }
}
