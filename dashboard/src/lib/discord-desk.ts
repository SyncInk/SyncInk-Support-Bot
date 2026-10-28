import { query, queryOne } from "@/lib/db";
import { redactSensitive } from "@/lib/security";

export const SUPPORT_GUILD_ID = "1520457643842342912";
export const REPORT_CHANNEL_ID = "1541796896199417906";
export const SUPPORT_MANAGER_ROLE_ID = "1520854378192572546";
const FALLBACK_WEBHOOK_URL =
  "https://discord.com/api/webhooks/1542150781170360332/WifYse9LfJqDrEBYaMEDXhY2WT2an5mG5BWX1pw1WFIEhR2O5sc05c4HmGIofzuO6P1D";

function getBotToken(): string {
  return (
    process.env.DISCORD_BOT_TOKEN ||
    process.env.DISCORD_TOKEN ||
    ""
  ).trim();
}

/**
 * Resolves or caches the webhook URL on channel 1541796896199417906
 */
export async function getDeskWebhookUrl(): Promise<string> {
  const token = getBotToken();
  if (!token) return FALLBACK_WEBHOOK_URL;

  try {
    const res = await fetch(
      `https://discord.com/api/v10/channels/${REPORT_CHANNEL_ID}/webhooks`,
      {
        headers: { Authorization: `Bot ${token}` },
        cache: "no-store",
      }
    );

    if (res.ok) {
      const webhooks = await res.json();
      if (Array.isArray(webhooks) && webhooks.length > 0) {
        const found = webhooks.find((w: any) => w.token) || webhooks[0];
        if (found?.token && found?.id) {
          return `https://discord.com/api/webhooks/${found.id}/${found.token}`;
        }
      }
    }
  } catch (err: any) {
    console.warn("Could not fetch webhooks from Discord API:", redactSensitive(err?.message || ""));
  }

  return FALLBACK_WEBHOOK_URL;
}

/**
 * Resolves a full user avatar URL given an ID and avatar hash
 */
export function getDiscordAvatarUrl(userId: string, avatarHash?: string | null): string {
  if (!avatarHash) {
    const idx = Math.abs(parseInt(userId || "0", 10) % 5);
    return `https://cdn.discordapp.com/embed/avatars/${idx}.png`;
  }
  if (avatarHash.startsWith("http")) return avatarHash;
  const isGif = avatarHash.startsWith("a_");
  const ext = isGif ? "gif" : "png";
  return `https://cdn.discordapp.com/avatars/${userId}/${avatarHash}.${ext}?size=256`;
}

/**
 * Creates a dedicated Discord thread on channel 1541796896199417906
 * and posts the detailed incident overview embed with custom emojis.
 */
export async function createDiscordReportThread(report: any): Promise<string | null> {
  const token = getBotToken();
  if (!token) {
    console.warn("DISCORD_TOKEN missing; skipping Discord thread creation.");
    return null;
  }

  try {
    const safeTitle = (report.title || "Incident Report").replace(/[\r\n]+/g, " ").slice(0, 35);
    const safeUser = (report.username || "Member").slice(0, 20);
    const threadName = `🧵 ${report.report_code} • ${safeUser} • ${safeTitle}`;

    // 1. Create Public Thread on the channel
    const createRes = await fetch(
      `https://discord.com/api/v10/channels/${REPORT_CHANNEL_ID}/threads`,
      {
        method: "POST",
        headers: {
          Authorization: `Bot ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: threadName,
          auto_archive_duration: 1440, // 24 hours
          type: 11, // GUILD_PUBLIC_THREAD
          reason: `SyncInk Data Loss & Recovery Report #${report.report_code}`,
        }),
      }
    );

    if (!createRes.ok) {
      const errJson = await createRes.json().catch(() => ({}));
      console.error(
        `Failed to create Discord thread for #${report.report_code}:`,
        createRes.status,
        errJson
      );
      return null;
    }

    const threadData = await createRes.json();
    const threadId = String(threadData.id);

    // Save thread ID to database immediately
    await query(
      "UPDATE data_loss_reports SET discord_thread_id = $1 WHERE id = $2",
      [threadId, report.id]
    ).catch(() => {});

    // 2. Post the rich Overview Embed to the newly created thread
    const avatarUrl = getDiscordAvatarUrl(report.user_id, report.avatar);
    const priorityColor =
      report.priority === "CRITICAL"
        ? 0xef4444 // Red
        : report.priority === "HIGH"
        ? 0xf59e0b // Amber
        : 0x3b82f6; // Blue

    const overviewEmbed = {
      title: `<a:syncwarning:1520914584012328961> Data Loss & Recovery Report — #${report.report_code}`,
      description: `**Subject:** ${report.title || "No Subject Provided"}`,
      color: priorityColor,
      fields: [
        {
          name: "<:staff:1562591917295009802> Submitter",
          value: `<@${report.user_id}> (\`${report.username}\` • \`${report.user_id}\`)`,
          inline: true,
        },
        {
          name: "<a:region:1562591209543966831> Target Server",
          value: `**${report.guild_name || "Discord Guild"}**\n\`${report.guild_id}\``,
          inline: true,
        },
        {
          name: "<:developer:1562591562754424872> Affected Bot",
          value: `\`${report.bot_target || "SyncInk Ticket Bot"}\``,
          inline: true,
        },
        {
          name: "<:argument:1562587869762158762> Category",
          value: `\`${String(report.category || "DATA_LOSS").replace(/_/g, " ")}\``,
          inline: true,
        },
        {
          name: "⚡ Priority",
          value: `\`${report.priority || "HIGH"}\``,
          inline: true,
        },
        {
          name: "📅 Incident Date / Time",
          value: report.incident_date ? `\`${report.incident_date}\`` : "Not specified",
          inline: true,
        },
        {
          name: "<:admin:1562590696337047744> Affected Channels",
          value: report.affected_channels ? `\`${report.affected_channels}\`` : "None noted",
          inline: false,
        },
        {
          name: "🔗 Transcripts & Evidence Links",
          value: report.evidence_links ? report.evidence_links : "None provided",
          inline: false,
        },
        {
          name: "<:experience:1562588852324143125> Incident Description",
          value: `\`\`\`\n${(report.description || "No description provided.").slice(0, 1000)}\n\`\`\``,
          inline: false,
        },
      ],
      footer: {
        text: "SyncInk Support Platform • Two-Way Live Mirror Active",
        icon_url: "https://syncink.site/syncink-main-logo.png",
      },
      timestamp: new Date().toISOString(),
    };

    // Post to thread using Bot token with Support Manager ping
    await fetch(`https://discord.com/api/v10/channels/${threadId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bot ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        content: `🚨 **New Recovery Ticket Dispatched** — <@&${SUPPORT_MANAGER_ROLE_ID}>`,
        embeds: [overviewEmbed],
      }),
    });

    return threadId;
  } catch (err: any) {
    console.error("Error in createDiscordReportThread:", redactSensitive(err?.message || ""));
    return null;
  }
}

/**
 * Sends a message via Ditto Webhook into a Discord Thread,
 * replicating the exact profile (name & avatar) of the sender.
 */
export async function sendDittoWebhookMessage({
  threadId,
  senderId,
  senderName,
  senderAvatar,
  message,
  role = "USER",
  attachmentUrl,
  attachmentName,
}: {
  threadId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string | null;
  message: string;
  role?: string;
  attachmentUrl?: string | null;
  attachmentName?: string | null;
}): Promise<string | null> {
  try {
    const webhookUrl = await getDeskWebhookUrl();
    const avatarUrl = getDiscordAvatarUrl(senderId, senderAvatar);

    // Profile Display Name with subtle official badge
    let displayName = senderName || "Discord Member";
    if (role === "OWNER") {
      displayName = `👑 ${senderName} [Owner]`;
    } else if (role === "ADMIN") {
      displayName = `🛡️ ${senderName} [Admin]`;
    } else if (role === "STAFF") {
      displayName = `✨ ${senderName} [Staff]`;
    }

    // Format content with attachment if present
    let content = message || "";
    if (attachmentUrl) {
      const isImg = /\.(png|jpe?g|gif|webp)(\?.*)?$/i.test(attachmentUrl);
      if (isImg && !content.includes(attachmentUrl)) {
        content = content ? `${content}\n${attachmentUrl}` : attachmentUrl;
      } else if (!content.includes(attachmentUrl)) {
        content = content
          ? `${content}\n\n📎 **Attachment:** [${attachmentName || "Download File"}](${attachmentUrl})`
          : `📎 **Attachment:** [${attachmentName || "Download File"}](${attachmentUrl})`;
      }
    }

    if (!content.trim()) {
      content = "*(Sent an attachment)*";
    }

    const payload: any = {
      content: content.slice(0, 2000),
      username: displayName.slice(0, 80),
      avatar_url: avatarUrl,
    };

    const res = await fetch(`${webhookUrl}?thread_id=${threadId}&wait=true`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const msg = await res.json();
      return String(msg.id || "");
    } else {
      const err = await res.text().catch(() => "");
      console.warn("Webhook dispatch failed:", res.status, err);
      return null;
    }
  } catch (err: any) {
    console.error("Error in sendDittoWebhookMessage:", redactSensitive(err?.message || ""));
    return null;
  }
}

/**
 * Posts a clean system notification into the Discord thread
 */
export async function sendSystemWebhookUpdate({
  threadId,
  title,
  description,
  color = 0x3b82f6,
}: {
  threadId: string;
  title: string;
  description: string;
  color?: number;
}): Promise<void> {
  try {
    const webhookUrl = await getDeskWebhookUrl();
    await fetch(`${webhookUrl}?thread_id=${threadId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "SyncInk System Notice",
        avatar_url: "https://syncink.site/syncink-main-logo.png",
        embeds: [
          {
            title,
            description,
            color,
            footer: { text: "SyncInk Desk Protocol" },
            timestamp: new Date().toISOString(),
          },
        ],
      }),
    });
  } catch {}
}

/**
 * Safety reconciliation: Finds any active reports (OPEN or IN_PROGRESS)
 * that have not had a Discord thread created yet, creates the thread,
 * and replays their existing messages via the ditto webhook.
 */
export async function reconcileExistingOpenReports(): Promise<{ reconciled: number }> {
  try {
    const unthreaded = await query(
      "SELECT * FROM data_loss_reports WHERE discord_thread_id IS NULL AND UPPER(status) IN ('OPEN', 'IN_PROGRESS') ORDER BY id ASC"
    );

    let count = 0;
    for (const report of unthreaded || []) {
      const threadId = await createDiscordReportThread(report);
      if (threadId) {
        count++;

        // Fetch past messages and replay them via ditto webhook
        const messages = await query(
          "SELECT * FROM report_chat_messages WHERE report_id = $1 ORDER BY created_at ASC",
          [report.id]
        );

        for (const msg of messages || []) {
          // Avoid re-mirroring if already has a discord message ID
          if (msg.discord_message_id) continue;

          const discordMsgId = await sendDittoWebhookMessage({
            threadId,
            senderId: msg.sender_id,
            senderName: msg.sender_name,
            senderAvatar: msg.sender_avatar,
            message: msg.message,
            role: msg.sender_role,
            attachmentUrl: msg.attachment_url,
            attachmentName: msg.attachment_name,
          });

          if (discordMsgId) {
            await query(
              "UPDATE report_chat_messages SET discord_message_id = $1 WHERE id = $2",
              [discordMsgId, msg.id]
            ).catch(() => {});
          }
        }
      }
    }

    return { reconciled: count };
  } catch (err: any) {
    console.error("Error reconciling unthreaded reports:", redactSensitive(err?.message || ""));
    return { reconciled: 0 };
  }
}
