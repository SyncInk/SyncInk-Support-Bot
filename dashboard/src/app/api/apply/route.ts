import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { rateLimiter, getClientIp } from "@/lib/rate-limit";
import {
  validateCsrfOrigin,
  MAX_FILE_SIZE_BYTES,
  ALLOWED_MIME_TYPES,
  validateMagicBytes,
  sanitizeFileName,
  redactSensitive,
} from "@/lib/security";

export const dynamic = "force-dynamic";

// Webhook URLs (securely held server-side, never delivered to the client)
const STAFF_WEBHOOK =
  process.env.STAFF_APPLICATION_WEBHOOK ||
  "https://discord.com/api/webhooks/1542537431318798346/602rGCCXSDuJ40HdguRv__vSyZv1ZxRiS4OqvbwOzamPxa-8Qinzn57SZcpSkGrHsLul";

const DEV_WEBHOOK =
  process.env.DEV_APPLICATION_WEBHOOK ||
  "https://discord.com/api/webhooks/1542537924766335036/o3C7rHB-HEP7utGCbFfHPeoVGnzK_sGnvy3cKCCfdWy4GhtYAmERopWpHRHP1B-k5eMh";

function cleanString(str: any, maxLen = 2000): string {
  if (typeof str !== "string") return "";
  return str.trim().slice(0, maxLen);
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

    // Target webhook and payload construction
    const userAvatarUrl = user.avatar
      ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`
      : `https://cdn.discordapp.com/embed/avatars/${parseInt(user.id) % 5}.png`;

    let webhookUrl = "";
    let payload: any = {};

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

      webhookUrl = STAFF_WEBHOOK;
      payload = {
        content: "<@&1520854378192572546>",
        username: "SyncInk Staff Applications",
        avatar_url: "https://syncink.github.io/syncink-portfolio/SyncInk%20Server%20Logo.png",
        embeds: [
          {
            title: "🛡️ New Staff Application Submitted",
            color: 9133302, // Purple
            author: {
              name: `${user.global_name || user.username} (@${user.username})`,
              icon_url: userAvatarUrl,
            },
            fields: [
              {
                name: "👤 Discord User",
                value: `<@${user.id}>\n**ID:** \`${user.id}\`\n**User:** \`${user.username}\``,
                inline: true,
              },
              { name: "🎂 Age", value: `\`${age}\``, inline: true },
              { name: "🌍 Region / Country", value: `\`${timezone}\``, inline: true },
              { name: "⏰ Availability", value: `\`${availability}\``, inline: true },
              { name: "❓ Why Join?", value: `>>> ${reason}`, inline: false },
              { name: "📜 Moderation Experience", value: `>>> ${exp}`, inline: false },
              { name: "🚨 Scenario 1: Spam / Filter Bypass", value: `>>> ${scen1}`, inline: false },
              { name: "🔥 Scenario 2: Escalating Argument", value: `>>> ${scen2}`, inline: false },
              { name: "⚖️ Scenario 3: Abuse Accusation", value: `>>> ${scen3}`, inline: false },
            ],
            footer: {
              text: "SyncInk Enterprise Platform (syncink.site) • Verified OAuth Application",
              icon_url: "https://files.catbox.moe/74l9su.png",
            },
            timestamp: new Date().toISOString(),
          },
        ],
      };
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

      webhookUrl = DEV_WEBHOOK;
      payload = {
        content: "<@&1520854378192572546>",
        username: "SyncInk Developer Applications",
        avatar_url: "https://syncink.github.io/syncink-portfolio/SyncInk%20Server%20Logo.png",
        embeds: [
          {
            title: "💻 New Developer Application Submitted",
            color: 5793266, // Emerald
            author: {
              name: `${user.global_name || user.username} (@${user.username})`,
              icon_url: userAvatarUrl,
            },
            fields: [
              {
                name: "👤 Discord User",
                value: `<@${user.id}>\n**ID:** \`${user.id}\`\n**User:** \`${user.username}\``,
                inline: true,
              },
              { name: "🎂 Age", value: `\`${age}\``, inline: true },
              { name: "🌍 Region / Country", value: `\`${timezone}\``, inline: true },
              { name: "🛠️ Languages & Frameworks", value: `>>> ${langs}`, inline: false },
              { name: "🔗 Portfolio / GitHub", value: `>>> ${portfolio}`, inline: false },
              { name: "🤖 Bot Experience", value: `>>> ${bot_exp}`, inline: false },
              { name: "🧠 Complex Architecture Implemented", value: `>>> ${complex}`, inline: false },
            ],
            footer: {
              text: "SyncInk Enterprise Platform (syncink.site) • Verified OAuth Application",
              icon_url: "https://files.catbox.moe/74l9su.png",
            },
            timestamp: new Date().toISOString(),
          },
        ],
      };
    }

    // 6. Dispatch to Discord Webhook
    if (attachmentFile && attachmentBuffer) {
      if (attachmentFile.type.startsWith("image/")) {
        payload.embeds[0].image = { url: `attachment://${cleanFileName}` };
      }

      const outFormData = new FormData();
      outFormData.append("payload_json", JSON.stringify(payload));
      outFormData.append("file[0]", attachmentFile, cleanFileName);

      const discordRes = await fetch(webhookUrl, {
        method: "POST",
        body: outFormData,
      });

      if (!discordRes.ok) {
        const errText = await discordRes.text();
        console.error("Discord webhook dispatch error:", redactSensitive(errText));
        return NextResponse.json({ error: "Failed to dispatch application to Discord. Please try again later." }, { status: 502 });
      }
    } else {
      const discordRes = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!discordRes.ok) {
        const errText = await discordRes.text();
        console.error("Discord webhook dispatch error:", redactSensitive(errText));
        return NextResponse.json({ error: "Failed to dispatch application to Discord. Please try again later." }, { status: 502 });
      }
    }

    return NextResponse.json({
      success: true,
      message: "Application submitted successfully! Our management team will review your application soon.",
    });
  } catch (error: any) {
    console.error("Application submission handler error:", redactSensitive(error.message || ""));
    return NextResponse.json({ error: "An unexpected error occurred processing your application." }, { status: 500 });
  }
}
