import { NextResponse } from "next/server";
import { checkRequestAuth, checkRequestAdminAuth, getCurrentUser, verifyUserGuildAccess } from "@/lib/auth";
import { query, resolveGuildId } from "@/lib/db";
import { validateCsrfOrigin, redactSensitive } from "@/lib/security";
import { rateLimiter, getClientIp } from "@/lib/rate-limit";

export async function GET(request: Request) {
  if (!checkRequestAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const clientIp = getClientIp(request);
  const rateLimit = rateLimiter.check(`sec_wl_get_${clientIp}`, 60, 60 * 1000);
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: "Too many requests. Please slow down." }, { status: 429 });
  }

  try {
    const user = await getCurrentUser();
    const { searchParams } = new URL(request.url);
    const guildId = await resolveGuildId(searchParams.get("guildId") || user?.guildId);

    // BOLA Check (Item 5 & 14)
    if (!verifyUserGuildAccess(user, guildId)) {
      return NextResponse.json({ error: "Access Denied: You do not have permissions for this server." }, { status: 403 });
    }

    const entries = await query(
      `SELECT id, guild_id, entity_type, entity_id_or_val, added_by, created_at 
       FROM security_whitelist 
       WHERE guild_id = $1 
       ORDER BY created_at DESC`,
      [guildId]
    );

    return NextResponse.json({ entries: entries || [] });
  } catch (error: any) {
    console.error("Whitelist GET Error:", redactSensitive(error.message || ""));
    return NextResponse.json({ error: "Failed to fetch whitelist" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  // 1. CSRF Protection (Item 3)
  if (!validateCsrfOrigin(request)) {
    return NextResponse.json({ error: "Invalid request origin (CSRF validation failed)" }, { status: 403 });
  }

  // 2. Rate Limiting (Item 6)
  const clientIp = getClientIp(request);
  const rateLimit = rateLimiter.check(`sec_wl_post_${clientIp}`, 30, 60 * 1000);
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: "Too many requests. Please slow down." }, { status: 429 });
  }

  // 3. Admin Authorization (Item 13)
  if (!checkRequestAdminAuth(request)) {
    return NextResponse.json({ error: "Access Denied: Only Server Owner & Administrators can add whitelist items." }, { status: 403 });
  }

  try {
    const user = await getCurrentUser();
    const body = await request.json();
    const { type, value, guildId: reqGuildId } = body;
    const guildId = await resolveGuildId(reqGuildId || user?.guildId);

    // 4. BOLA Check (Item 5 & 14)
    if (!verifyUserGuildAccess(user, guildId)) {
      return NextResponse.json({ error: "Access Denied: You do not have permissions for this server." }, { status: 403 });
    }

    if (!type || !value) {
      return NextResponse.json({ error: "Type and value are required" }, { status: 400 });
    }

    const cleanType = String(type).toLowerCase().trim();
    const cleanValue = String(value).toLowerCase().replace(/[<@!&#>]/g, "").slice(0, 255).trim();

    if (!["user", "role", "channel", "domain"].includes(cleanType)) {
      return NextResponse.json({ error: "Type must be 'user', 'role', 'channel', or 'domain'" }, { status: 400 });
    }

    await query(
      `INSERT INTO security_whitelist (guild_id, entity_type, entity_id_or_val, added_by)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (guild_id, entity_type, entity_id_or_val) DO NOTHING`,
      [guildId, cleanType, cleanValue, user?.id === "admin" ? 0 : (user?.id || 0)]
    );

    return NextResponse.json({
      success: true,
      message: `Added [${cleanType.toUpperCase()}] ${cleanValue} to whitelist.`
    });
  } catch (error: any) {
    console.error("Whitelist POST Error:", redactSensitive(error.message || ""));
    return NextResponse.json({ error: "Failed to add whitelist item" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  // 1. CSRF Protection (Item 3)
  if (!validateCsrfOrigin(request)) {
    return NextResponse.json({ error: "Invalid request origin (CSRF validation failed)" }, { status: 403 });
  }

  // 2. Admin Authorization (Item 13)
  if (!checkRequestAdminAuth(request)) {
    return NextResponse.json({ error: "Access Denied: Only Server Owner & Administrators can delete whitelist items." }, { status: 403 });
  }

  try {
    const user = await getCurrentUser();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const guildId = await resolveGuildId(searchParams.get("guildId") || user?.guildId);

    // 3. BOLA Check (Item 5 & 14)
    if (!verifyUserGuildAccess(user, guildId)) {
      return NextResponse.json({ error: "Access Denied: You do not have permissions for this server." }, { status: 403 });
    }

    if (!id) {
      return NextResponse.json({ error: "Whitelist entry ID is required" }, { status: 400 });
    }

    // Tenant-isolated deletion (guarantees Guild A cannot delete Guild B's whitelist entry)
    await query(
      "DELETE FROM security_whitelist WHERE id = $1 AND guild_id = $2",
      [parseInt(id, 10), guildId]
    );

    return NextResponse.json({ success: true, message: "Whitelist entry removed." });
  } catch (error: any) {
    console.error("Whitelist DELETE Error:", redactSensitive(error.message || ""));
    return NextResponse.json({ error: "Failed to delete whitelist item" }, { status: 500 });
  }
}
