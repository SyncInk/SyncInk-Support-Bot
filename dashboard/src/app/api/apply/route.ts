import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { rateLimiter, getClientIp } from "@/lib/rate-limit";
import { query, resolveGuildId } from "@/lib/db";
import {
  validateCsrfOrigin,
  MAX_FILE_SIZE_BYTES,
  ALLOWED_MIME_TYPES,
  validateMagicBytes,
  sanitizeFileName,
  sanitizeInputText,
  redactSensitive,
} from "@/lib/security";

export const dynamic = "force-dynamic";



function cleanString(str: any, maxLen = 2000): string {
  if (typeof str !== "string") return "";
  return sanitizeInputText(str, maxLen);
}

export async function POST(request: Request) {
  // 1. CSRF Protection (Item 3)
  if (!validateCsrfOrigin(request)) {
    return NextResponse.json({ error: "Invalid request origin (CSRF validation failed)" }, { status: 403 });
  }

  try {
    // 2. Authenticate user from Discord OAuth session cookie
    const user = await getCurrentUser();
    if (!user || !user.id || user.id === "admin") {
      return NextResponse.json(
        {
          error: "Authentication required. Please sign in with your Discord account to submit an application.",
        },
        { status: 401 }
      );
    }

    // 3. Sliding-window rate limit: 3 applications per hour per user/IP (Item 6)
    const clientIp = getClientIp(request);
    const rateLimit = rateLimiter.check(`apply_${user.id}_${clientIp}`, 3, 60 * 60 * 1000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: "You have submitted too many applications recently. Please wait before submitting again.",
        },
        { status: 429 }
      );
    }

    // 4. Parse Request Content (supports both multipart FormData and JSON)
    const contentType = request.headers.get("content-type") || "";
    let appType = "";
    let age = 0;
    let timezone = "";
    let availability = "";
    let reason = "";
    let exp = "";
    let scen1 = "";
    let scen2 = "";
    let scen3 = "";
    let langs = "";
    let portfolio = "";
    let bot_exp = "";
    let complex = "";
    let attachmentFile: File | null = null;
    let attachmentBuffer: Buffer | null = null;
    let cleanFileName = "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      appType = cleanString(formData.get("appType"));
      age = parseInt(String(formData.get("age") || "0"), 10);
      timezone = cleanString(formData.get("timezone"), 100);
      availability = cleanString(formData.get("availability"), 50);
      reason = cleanString(formData.get("reason"), 1500);
      exp = cleanString(formData.get("exp"), 1500);
      scen1 = cleanString(formData.get("scen1"), 1500);
      scen2 = cleanString(formData.get("scen2"), 1500);
      scen3 = cleanString(formData.get("scen3"), 1500);
      langs = cleanString(formData.get("langs"), 250);
      portfolio = cleanString(formData.get("portfolio"), 300);
      bot_exp = cleanString(formData.get("bot_exp"), 1500);
      complex = cleanString(formData.get("complex"), 1500);

      const file = formData.get("attachment");
      if (file && typeof file === "object" && "arrayBuffer" in file && (file as File).size > 0) {
        attachmentFile = file as File;

        // ==========================================
        // 5. FILE UPLOAD VALIDATION (Item 4)
        // ==========================================
        // A. File Size Validation
        if (attachmentFile.size > MAX_FILE_SIZE_BYTES) {
          return NextResponse.json(
            { error: "Uploaded attachment exceeds the maximum allowed size of 8 MB." },
            { status: 400 }
          );
        }

        // B. MIME Type Validation
        const rawMime = (attachmentFile.type || "").toLowerCase();
        if (!ALLOWED_MIME_TYPES.has(rawMime)) {
          return NextResponse.json(
            { error: "Invalid file type. Only PNG, JPEG, WebP, GIF, and PDF documents are allowed." },
            { status: 400 }
          );
        }

        // C. Magic Byte Inspection
        const arrayBuf = await attachmentFile.arrayBuffer();
        attachmentBuffer = Buffer.from(arrayBuf);
        if (!validateMagicBytes(attachmentBuffer)) {
          return NextResponse.json(
            { error: "File verification failed. The uploaded file content does not match its claimed format." },
            { status: 400 }
          );
        }

        // D. Filename Sanitization
        cleanFileName = sanitizeFileName(attachmentFile.name);
      }
    } else {
      const body = await request.json();
      appType = cleanString(body.appType);
      age = parseInt(String(body.age || "0"), 10);
      timezone = cleanString(body.timezone, 100);
      availability = cleanString(body.availability, 50);
      reason = cleanString(body.reason, 1500);
      exp = cleanString(body.exp, 1500);
      scen1 = cleanString(body.scen1, 1500);
      scen2 = cleanString(body.scen2, 1500);
      scen3 = cleanString(body.scen3, 1500);
      langs = cleanString(body.langs, 250);
      portfolio = cleanString(body.portfolio, 300);
      bot_exp = cleanString(body.bot_exp, 1500);
      complex = cleanString(body.complex, 1500);
    }

    if (!appType || (appType !== "staff" && appType !== "developer")) {
      return NextResponse.json({ error: "Invalid application type specified." }, { status: 400 });
    }

    // Common validations
    if (isNaN(age) || age < 13 || age > 99) {
      return NextResponse.json({ error: "Age must be between 13 and 99." }, { status: 400 });
    }
    if (timezone.length < 2) {
      return NextResponse.json({ error: "Please enter your country/region." }, { status: 400 });
    }



    if (appType === "staff") {
      if (!availability) {
        return NextResponse.json({ error: "Please select your weekly availability." }, { status: 400 });
      }
      if (reason.length < 15) {
        return NextResponse.json({ error: "Motivation statement must be at least 15 characters." }, { status: 400 });
      }
      if (exp.length < 15) {
        return NextResponse.json({ error: "Experience statement must be at least 15 characters." }, { status: 400 });
      }
      if (scen1.length < 15 || scen2.length < 15 || scen3.length < 15) {
        return NextResponse.json({ error: "All scenario answers must be at least 15 characters." }, { status: 400 });
      }
    } else {
      // Developer validation
      if (langs.length < 2) {
        return NextResponse.json({ error: "Please list your primary programming languages/frameworks." }, { status: 400 });
      }
      if (portfolio.length < 5) {
        return NextResponse.json({ error: "Please provide a valid GitHub or Portfolio URL." }, { status: 400 });
      }
      if (bot_exp.length < 15) {
        return NextResponse.json({ error: "Bot development experience must be at least 15 characters." }, { status: 400 });
      }
      if (complex.length < 15) {
        return NextResponse.json({ error: "Complex feature description must be at least 15 characters." }, { status: 400 });
      }
    }

    // 6. Save Application to Database for Admin Panel Inspection
    const targetGuildId = await resolveGuildId(user.guildId);
    let applicationId: number | null = null;
    try {
      const insertRes = await query<{ id: number }>(
        `INSERT INTO member_applications (
          guild_id, user_id, username, global_name, avatar, app_type, age, timezone, availability,
          reason, experience, scenario_1, scenario_2, scenario_3, languages, portfolio,
          bot_experience, complex_features, attachment_name, attachment_size, status
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, 'PENDING'
        ) RETURNING id`,
        [
          targetGuildId,
          user.id,
          user.username,
          user.global_name || null,
          user.avatar || null,
          appType,
          age,
          timezone,
          availability || null,
          reason || null,
          exp || null,
          scen1 || null,
          scen2 || null,
          scen3 || null,
          langs || null,
          portfolio || null,
          bot_exp || null,
          complex || null,
          cleanFileName || null,
          attachmentBuffer ? attachmentBuffer.length : null,
        ]
      );
      if (insertRes && insertRes[0]) {
        applicationId = insertRes[0].id;
      }
    } catch (dbErr: any) {
      console.warn("Could not insert member application into database:", redactSensitive(dbErr.message || ""));
      await query(`
        CREATE TABLE IF NOT EXISTS member_applications (
          id SERIAL PRIMARY KEY,
          guild_id BIGINT NOT NULL,
          user_id BIGINT NOT NULL,
          username VARCHAR(255) NOT NULL,
          global_name VARCHAR(255),
          avatar VARCHAR(255),
          app_type VARCHAR(50) NOT NULL,
          age INT NOT NULL,
          timezone VARCHAR(100),
          availability VARCHAR(100),
          reason TEXT,
          experience TEXT,
          scenario_1 TEXT,
          scenario_2 TEXT,
          scenario_3 TEXT,
          languages VARCHAR(255),
          portfolio VARCHAR(500),
          bot_experience TEXT,
          complex_features TEXT,
          attachment_name VARCHAR(255),
          attachment_size INT,
          status VARCHAR(50) DEFAULT 'PENDING',
          reviewer_id BIGINT,
          reviewer_name VARCHAR(255),
          reviewer_notes TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          reviewed_at TIMESTAMP
        );
      `).catch(() => {});
    }

    // 7. Enqueue Durable Notification Job for Discord Bot Delivery (No Incoming Webhooks)
    if (applicationId) {
      try {
        await query(
          `INSERT INTO pending_bot_actions (guild_id, user_id, action, reason, status)
           VALUES ($1, $2, 'NOTIFY_APPLICATION', $3, 'PENDING')`,
          [targetGuildId, user.id, String(applicationId)]
        );
      } catch (queueErr: any) {
        console.warn("Could not enqueue pending_bot_action notification:", redactSensitive(queueErr.message || ""));
      }
    }

    return NextResponse.json({
      success: true,
      message: `Application #${applicationId || "submitted"} received successfully! Our management team will review your application soon in the administrator command panel.`,
      applicationId,
    });
  } catch (error: any) {
    console.error("Application submission handler error:", redactSensitive(error.message || ""));
    return NextResponse.json({ error: "An unexpected error occurred processing your application." }, { status: 500 });
  }
}
