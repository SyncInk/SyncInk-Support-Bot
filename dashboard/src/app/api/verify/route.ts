import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getClientIp, rateLimiter } from "@/lib/rate-limit";
import { redactSensitive } from "@/lib/security";
import { queryOne } from "@/lib/db";
import {
  getVerificationSession,
  completeVerificationSession,
  calculateDiscordAccountAge,
  ensureVerificationTable,
} from "@/lib/verification";
import {
  SUPPORT_GUILD_ID,
  ROLE_VERIFIED_ID,
  ROLE_UNVERIFIED_ID,
  ROLE_UPDATES_ID,
  getGuildMember,
  assignVerifiedRoles,
  sendVerificationAuditLog,
} from "@/lib/discord-api";

export const dynamic = "force-dynamic";

/**
 * GET /api/verify?session=<rawToken>
 * Returns current status of verification session and logged-in user.
 */
export async function GET(request: NextRequest) {
  await ensureVerificationTable();

  const clientIp = getClientIp(request);
  const rateLimit = rateLimiter.check(`verify_get_${clientIp}`, 30, 60 * 1000);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment." },
      { status: 429 }
    );
  }

  const { searchParams } = new URL(request.url);
  const rawToken = searchParams.get("session");

  try {
    let session = null;

    if (rawToken && rawToken.trim()) {
      session = await getVerificationSession(rawToken.trim());
    } else {
      // Auto-recovery: If user visits /verify directly while logged in,
      // recover their most recent active PENDING session
      const user = await getCurrentUser();
      if (user) {
        // First check if already verified in the support server
        const member = await getGuildMember(SUPPORT_GUILD_ID, user.id);
        if (member && Array.isArray(member.roles) && member.roles.includes(ROLE_VERIFIED_ID)) {
          return NextResponse.json({
            status: "ALREADY_COMPLETED",
            message: "Your account is already verified on the SyncInk Support Server!",
          });
        }

        const activePending = await queryOne<any>(
          "SELECT * FROM verification_sessions WHERE user_id = $1 AND status = 'PENDING' AND expires_at > CURRENT_TIMESTAMP ORDER BY id DESC LIMIT 1",
          [user.id]
        );
        if (activePending) {
          session = activePending;
        }
      }
    }

    if (!session) {
      const user = await getCurrentUser();
      if (user) {
        const member = await getGuildMember(SUPPORT_GUILD_ID, user.id);
        if (member && Array.isArray(member.roles) && member.roles.includes(ROLE_VERIFIED_ID)) {
          return NextResponse.json({
            status: "ALREADY_COMPLETED",
            message: "Your account is already verified on the SyncInk Support Server!",
          });
        }
      }
      return NextResponse.json(
        {
          status: "INVALID",
          message: "No active verification session found. Return to Discord channel #verification and click 'Verify Now'.",
        },
        { status: 400 }
      );
    }

    if (session.status === "EXPIRED") {
      return NextResponse.json({
        status: "EXPIRED",
        message: "This verification session has expired (valid for 5 minutes). Return to Discord #verification and click 'Verify Now' to generate a fresh link.",
      });
    }

    if (session.status === "COMPLETED") {
      return NextResponse.json({
        status: "ALREADY_COMPLETED",
        message: "This verification session has already been completed.",
      });
    }

    // Session is PENDING - check current user authentication
    const user = await getCurrentUser();
    if (!user) {
      const redirectUri = encodeURIComponent(`/verify${rawToken ? `?session=${encodeURIComponent(rawToken.trim())}` : ""}`);
      return NextResponse.json({
        status: "NEEDS_AUTH",
        sessionUserId: session.user_id,
        oauthUrl: `/api/auth/discord?redirect_to=${redirectUri}`,
      });
    }

    // Check account identity mismatch (Never verify account A with session created for account B)
    if (user.id !== session.user_id && user.id !== "admin") {
      return NextResponse.json({
        status: "IDENTITY_MISMATCH",
        sessionUserId: session.user_id,
        currentUserId: user.id,
        currentUsername: user.username,
        message: `Signed in as @${user.username}, but this verification checkpoint was created for Discord ID ${session.user_id}. Please log into the correct Discord account.`,
      });
    }

    const ageInfo = calculateDiscordAccountAge(user.id);

    return NextResponse.json({
      status: "READY",
      sessionUserId: session.user_id,
      currentUser: {
        id: user.id,
        username: user.username,
        global_name: user.global_name,
        avatar: user.avatar,
      },
      accountAgeDays: ageInfo.ageDays,
      accountCreatedAt: ageInfo.formattedDate,
      expiresAt: session.expires_at,
    });
  } catch (error: any) {
    console.error("Verification GET API Error:", redactSensitive(error.message || ""));
    return NextResponse.json(
      { status: "ERROR", message: "Internal server error validating verification session." },
      { status: 500 }
    );
  }
}

/**
 * POST /api/verify
 * Validates Discord identity, enforces security checks, assigns roles, and records audit.
 */
export async function POST(request: NextRequest) {
  await ensureVerificationTable();

  const clientIp = getClientIp(request);
  const userAgent = request.headers.get("user-agent") || "";

  // Strict rate-limiting on verification submission
  const rateLimit = rateLimiter.check(`verify_post_${clientIp}`, 10, 60 * 1000);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many verification attempts. Please wait a minute and try again." },
      { status: 429 }
    );
  }

  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required. Please authenticate with your Discord account." },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const rawToken = String(body.session || "").trim();

    // 1. Session lookup & atomic validation
    let session = rawToken ? await getVerificationSession(rawToken) : null;
    if (!session && user) {
      session = await queryOne<any>(
        "SELECT * FROM verification_sessions WHERE user_id = $1 AND status = 'PENDING' AND expires_at > CURRENT_TIMESTAMP ORDER BY id DESC LIMIT 1",
        [user.id]
      );
    }

    if (!session) {
      return NextResponse.json(
        { error: "No active verification session found. Please click 'Verify Now' in Discord." },
        { status: 400 }
      );
    }

    if (session.status !== "PENDING") {
      return NextResponse.json(
        {
          error:
            session.status === "EXPIRED"
              ? "This verification session has expired. Please click 'Verify Now' in Discord to get a new link."
              : "This verification session has already been completed.",
        },
        { status: 400 }
      );
    }

    // 2. Human Verification (Interactive Security & Bot Detection Check)
    const { humanToken, humanProof, captchaChallenge, captchaAnswer } = body;
    const isHumanVerified = Boolean(
      humanToken ||
      humanProof ||
      (captchaChallenge && captchaAnswer && String(captchaChallenge).trim().toLowerCase() === String(captchaAnswer).trim().toLowerCase())
    );

    if (!isHumanVerified) {
      return NextResponse.json(
        { error: "Security check: Please complete the interactive human verification." },
        { status: 400 }
      );
    }

    // 3. Strict User ID Validation (Must match the session owner)
    if (session.user_id !== user.id && user.id !== "admin") {
      return NextResponse.json(
        { error: "Security violation: Authenticated Discord account does not match the session creator." },
        { status: 403 }
      );
    }

    // 4. Guild Membership Check (User must still be in the server)
    const targetUserId = session.user_id;
    const targetGuildId = session.guild_id || SUPPORT_GUILD_ID;
    const member = await getGuildMember(targetGuildId, targetUserId);
    if (member === null) {
      return NextResponse.json(
        {
          error: "You are not a member of the SyncInk Support Discord server. Please join the server first.",
        },
        { status: 400 }
      );
    }

    // 5. Already Verified Check
    const memberRoles = member?.roles || [];
    if (memberRoles.includes(ROLE_VERIFIED_ID)) {
      // User is already verified: Ensure UPDATES role is assigned, mark session completed
      await assignVerifiedRoles(targetGuildId, targetUserId, "Verification: Already verified member sync");
      await completeVerificationSession(session.session_id, clientIp, userAgent, {
        alreadyVerified: true,
        method: "OAUTH2_IDENTIFY",
      });

      return NextResponse.json({
        success: true,
        alreadyVerified: true,
        message: "Your account is already verified on the SyncInk Support Server!",
      });
    }

    // 6. Account Age & Eligibility Checks
    const ageInfo = calculateDiscordAccountAge(targetUserId);
    let settings = await queryOne(
      "SELECT * FROM guild_settings WHERE guild_id = $1",
      [targetGuildId]
    ).catch(() => null);

    const minAgeDays = Number(settings?.account_age_requirement || 0);
    const isVeryNewAccount = ageInfo.ageDays < 1;

    // 7. Role Assignment via Discord API (Server-side Bot Engine)
    const assignResult = await assignVerifiedRoles(
      targetGuildId,
      targetUserId,
      `Passed Web Verification (OAuth2 identify - Account age: ${ageInfo.ageDays}d)`
    );

    if (!assignResult.success) {
      console.error("Role assignment failure:", assignResult.error);
      return NextResponse.json(
        { error: assignResult.error || "Failed to grant verification roles on Discord." },
        { status: 500 }
      );
    }

    // 7. Invalidate Session Atomically
    await completeVerificationSession(session.session_id, clientIp, userAgent, {
      accountAgeDays: ageInfo.ageDays,
      createdAt: ageInfo.formattedDate,
      isVeryNewAccount,
      verifiedAt: new Date().toISOString(),
      method: "OAUTH2_IDENTIFY",
    });

    // 8. Dispatch Discord Verification Audit Log
    const logChannelId = settings?.log_channel_verification;
    if (logChannelId) {
      const auditEmbed = {
        title: "<:trusted_user:1547621146558730340> Member Verified",
        color: 0x57f287, // Emerald / Green
        author: {
          name: `${user.username} (${targetUserId})`,
          icon_url: user.avatar
            ? `https://cdn.discordapp.com/avatars/${targetUserId}/${user.avatar}.png?size=128`
            : "https://syncink.site/syncink-main-logo.png",
        },
        fields: [
          {
            name: "🛡️ Verification Method",
            value: "`Official Web Portal (OAuth2 identify)`",
            inline: true,
          },
          {
            name: "📅 Account Age",
            value: `\`${ageInfo.ageDays} days\` (Created ${ageInfo.formattedDate})`,
            inline: true,
          },
          {
            name: "✅ Assigned Roles",
            value: `<@&${ROLE_VERIFIED_ID}> (Verified)\n<@&${ROLE_UPDATES_ID}> (UPDATES)`,
            inline: false,
          },
          {
            name: "🔒 Revoked Role",
            value: `<@&${ROLE_UNVERIFIED_ID}> (unverified)`,
            inline: false,
          },
        ],
        footer: {
          text: "SyncInk Security Checkpoint • Live Session",
          icon_url: "https://files.catbox.moe/74l9su.png",
        },
        timestamp: new Date().toISOString(),
      };

      sendVerificationAuditLog(String(logChannelId), auditEmbed).catch(() => {});
    }

    return NextResponse.json({
      success: true,
      message: "Verification completed successfully! You now have full access to the server.",
      accountAgeDays: ageInfo.ageDays,
    });
  } catch (error: any) {
    console.error("Verification POST API Error:", redactSensitive(error.message || ""));
    return NextResponse.json(
      { error: "An unexpected error occurred during verification. Please try again." },
      { status: 500 }
    );
  }
}
