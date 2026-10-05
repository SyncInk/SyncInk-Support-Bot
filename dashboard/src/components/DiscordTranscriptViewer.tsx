"use client";

import React, { useState, useMemo } from "react";
import {
  FileText,
  Download,
  Share2,
  Search,
  X,
  ExternalLink,
  Check,
  Calendar,
  User,
  Clock,
  ShieldCheck,
  Bot,
  Image as ImageIcon,
  Paperclip,
  ZoomIn
} from "lucide-react";

export interface TranscriptMessage {
  authorId?: string;
  authorTag: string;
  authorAvatar?: string;
  content: string;
  timestamp: number;
  attachments?: string[];
  isBot?: boolean;
}

export interface TranscriptTicket {
  ticketId: string;
  guildId?: string;
  channelId?: string;
  creatorId?: string;
  creator?: { displayName?: string; username?: string; avatarUrl?: string; avatar?: string };
  claimer?: { displayName?: string; username?: string; avatarUrl?: string };
  category?: { value?: string; label?: string; emoji?: string; emojiTag?: string };
  status?: string;
  createdAt?: number;
  closedAt?: number;
  messages?: TranscriptMessage[];
  transcriptMessageUrl?: string;
}

interface DiscordTranscriptViewerProps {
  ticket: TranscriptTicket | null;
  loading?: boolean;
  error?: string | null;
  onClose?: () => void;
  standalone?: boolean;
}

// Markdown and Discord Tokenizer
function renderFormattedContent(text: string) {
  if (!text) return null;

  // Split by code blocks first
  const parts = text.split(/(```[\s\S]*?```)/g);

  return parts.map((part, index) => {
    if (part.startsWith("```") && part.endsWith("```")) {
      const codeContent = part.slice(3, -3).replace(/^[a-z0-9]+\n/i, "");
      return (
        <pre
          key={index}
          className="my-2 p-3 rounded-lg bg-[#1e1f22] border border-white/[0.08] text-xs font-mono text-emerald-400 overflow-x-auto whitespace-pre-wrap selection:bg-purple-900"
        >
          <code>{codeContent}</code>
        </pre>
      );
    }

    // Tokenize inline styles: bold, inline code, emojis, mentions
    const inlineTokens = [];
    const pattern = /<a?:([a-zA-Z0-9_]+):(\d+)>|`([^`]+)`|\*\*([^*]+)\*\*|__([^_]+)__|~~([^~]+)~~|<@!?(\d+)>|<#(\d+)>/g;
    let lastIndex = 0;
    let match;

    while ((match = pattern.exec(part)) !== null) {
      if (match.index > lastIndex) {
        inlineTokens.push({ type: "text", value: part.slice(lastIndex, match.index) });
      }

      if (match[1] && match[2]) {
        inlineTokens.push({ type: "emoji", name: match[1], id: match[2] });
      } else if (match[3]) {
        inlineTokens.push({ type: "code", value: match[3] });
      } else if (match[4]) {
        inlineTokens.push({ type: "bold", value: match[4] });
      } else if (match[5]) {
        inlineTokens.push({ type: "underline", value: match[5] });
      } else if (match[6]) {
        inlineTokens.push({ type: "strike", value: match[6] });
      } else if (match[7]) {
        inlineTokens.push({ type: "mention", value: `@user-${match[7].slice(-4)}` });
      } else if (match[8]) {
        inlineTokens.push({ type: "channel", value: `#channel-${match[8].slice(-4)}` });
      }

      lastIndex = pattern.lastIndex;
    }

    if (lastIndex < part.length) {
      inlineTokens.push({ type: "text", value: part.slice(lastIndex) });
    }

    return (
      <span key={index}>
        {inlineTokens.map((token, tIdx) => {
          const tKey = `${index}-${tIdx}`;
          if (token.type === "emoji") {
            return (
              <img
                key={tKey}
                src={`https://cdn.discordapp.com/emojis/${token.id}.png?size=48&quality=lossless`}
                alt={`:${token.name}:`}
                className="inline-block w-5 h-5 align-middle mx-0.5 object-contain"
                loading="lazy"
              />
            );
          }
          if (token.type === "code") {
            return (
              <code
                key={tKey}
                className="px-1.5 py-0.5 rounded bg-[#1e1f22] text-[#e0e2e5] font-mono text-xs border border-white/[0.06]"
              >
                {token.value}
              </code>
            );
          }
          if (token.type === "bold") {
            return <strong key={tKey} className="font-bold text-white">{token.value}</strong>;
          }
          if (token.type === "underline") {
            return <u key={tKey}>{token.value}</u>;
          }
          if (token.type === "strike") {
            return <s key={tKey} className="text-slate-400">{token.value}</s>;
          }
          if (token.type === "mention") {
            return (
              <span
                key={tKey}
                className="inline-flex items-center px-1.5 py-0.5 rounded bg-[#5865f2]/20 text-[#c9cdfb] font-medium text-xs border border-[#5865f2]/30"
              >
                {token.value}
              </span>
            );
          }
          if (token.type === "channel") {
            return (
              <span
                key={tKey}
                className="inline-flex items-center px-1.5 py-0.5 rounded bg-white/[0.08] text-purple-300 font-medium text-xs"
              >
                {token.value}
              </span>
            );
          }
          return <React.Fragment key={tKey}>{token.value}</React.Fragment>;
        })}
      </span>
    );
  });
}

function isImageUrl(url: string): boolean {
  if (!url) return false;
  const clean = url.split("?")[0].toLowerCase();
  return (
    clean.endsWith(".png") ||
    clean.endsWith(".jpg") ||
    clean.endsWith(".jpeg") ||
    clean.endsWith(".gif") ||
    clean.endsWith(".webp") ||
    clean.includes("cdn.discordapp.com/attachments") ||
    clean.includes("media.discordapp.net/attachments")
  );
}

function escapeHtml(str: string): string {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function exportTranscriptTxt(ticket: TranscriptTicket) {
  const header = [
    `=============================================================`,
    `               SYNCINK TICKET DISCORD TRANSCRIPT             `,
    `=============================================================`,
    `Ticket ID   : ${ticket.ticketId}`,
    `Category    : ${ticket.category?.label || ticket.category?.value || "Support"}`,
    `Creator     : ${ticket.creator?.displayName || ticket.creator?.username || ticket.creatorId || "Unknown"}`,
    `Status      : ${ticket.status || "closed"}`,
    `Created At  : ${ticket.createdAt ? new Date(ticket.createdAt).toLocaleString() : "Unknown"}`,
    `Closed At   : ${ticket.closedAt ? new Date(ticket.closedAt).toLocaleString() : "Unknown"}`,
    `Messages    : ${(ticket.messages || []).length}`,
    `=============================================================\n\n`
  ].join("\n");

  const body = (ticket.messages || [])
    .map((msg) => {
      const timeStr = new Date(msg.timestamp).toLocaleString();
      const attachmentsStr =
        msg.attachments && msg.attachments.length > 0
          ? `\n  [Attachments]:\n  ` + msg.attachments.join("\n  ")
          : "";
      return `[${timeStr}] ${msg.authorTag}:\n${msg.content}${attachmentsStr}\n`;
    })
    .join("\n");

  const blob = new Blob([header + body], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `transcript-${ticket.ticketId}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportTranscriptHtml(ticket: TranscriptTicket) {
  const messagesList = ticket.messages || [];
  const messagesHtml = messagesList
    .map((m) => {
      const time = new Date(m.timestamp).toLocaleString();
      const author = escapeHtml(m.authorTag || "User");
      const avatar = m.authorAvatar || "https://cdn.discordapp.com/embed/avatars/0.png";
      const content = escapeHtml(m.content || "");
      const attachmentsHtml = (m.attachments || [])
        .map((att) => {
          if (isImageUrl(att)) {
            return `<div style="margin-top:8px;"><a href="${att}" target="_blank" rel="noreferrer"><img src="${att}" style="max-height:280px; max-width:100%; border-radius:8px; border:1px solid rgba(255,255,255,0.1);" /></a></div>`;
          }
          return `<div style="margin-top:8px;"><a href="${att}" target="_blank" rel="noreferrer" style="display:inline-flex; align-items:center; gap:6px; padding:6px 12px; background:#2b2d31; border-radius:6px; color:#5865f2; text-decoration:none; font-size:12px;">📎 Download Attachment</a></div>`;
        })
        .join("");

      return `
        <div style="display:flex; gap:14px; padding:8px 12px; border-radius:8px; margin-bottom:8px; transition:background 0.2s;">
          <img src="${avatar}" alt="" style="width:40px; height:40px; border-radius:50%; object-fit:cover; flex-shrink:0;" />
          <div style="flex:1; min-width:0;">
            <div style="display:flex; align-items:baseline; gap:8px; margin-bottom:4px;">
              <span style="font-weight:600; color:#f2f3f5; font-size:14px;">${author}</span>
              <span style="font-size:11px; color:#949ba4;">${time}</span>
            </div>
            <div style="font-size:13.5px; line-height:1.45; color:#dbdee1; white-space:pre-wrap; word-break:break-word;">${content}</div>
            ${attachmentsHtml}
          </div>
        </div>
      `;
    })
    .join("");

  const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ticket #${ticket.ticketId} Transcript - SyncInk Support</title>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 24px;
      background: #111214;
      color: #dbdee1;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    }
    .wrapper {
      max-width: 900px;
      margin: 0 auto;
      background: #313338;
      border-radius: 16px;
      overflow: hidden;
      border: 1px solid rgba(255,255,255,0.08);
      box-shadow: 0 20px 60px rgba(0,0,0,0.5);
    }
    .banner {
      padding: 24px;
      background: #2b2d31;
      border-bottom: 1px solid rgba(255,255,255,0.06);
    }
    .badge {
      display: inline-block;
      padding: 3px 8px;
      border-radius: 99px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      background: rgba(139, 76, 255, 0.2);
      color: #c5b1ff;
      border: 1px solid rgba(139, 76, 255, 0.4);
      margin-bottom: 8px;
    }
    .meta-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 12px;
      margin-top: 14px;
      padding-top: 14px;
      border-top: 1px solid rgba(255,255,255,0.06);
      font-size: 12px;
      color: #949ba4;
    }
    .meta-grid strong {
      color: #f2f3f5;
    }
    .chat-body {
      padding: 24px;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="banner">
      <div class="badge">Official Discord Ticket Transcript</div>
      <h1 style="margin:0; font-size:22px; font-weight:800; color:#fff;">Ticket #${ticket.ticketId}</h1>
      <p style="margin:4px 0 0; font-size:13px; color:#949ba4;">
        ${ticket.category?.label || "General Support"} &bull; Archived from SyncInk Discord Infrastructure
      </p>
      <div class="meta-grid">
        <div>Creator: <strong>${escapeHtml(ticket.creator?.displayName || ticket.creatorId || "Unknown")}</strong></div>
        <div>Created: <strong>${ticket.createdAt ? new Date(ticket.createdAt).toLocaleString() : "Unknown"}</strong></div>
        <div>Closed: <strong>${ticket.closedAt ? new Date(ticket.closedAt).toLocaleString() : "Recently"}</strong></div>
        <div>Total Messages: <strong>${messagesList.length}</strong></div>
      </div>
    </div>
    <div class="chat-body">
      ${messagesHtml || '<div style="text-align:center; padding:40px; color:#949ba4;">No recorded messages in this transcript.</div>'}
    </div>
  </div>
</body>
</html>`;

  const blob = new Blob([fullHtml], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `transcript-${ticket.ticketId}.html`;
  a.click();
  URL.revokeObjectURL(url);
}

export function DiscordTranscriptViewer({
  ticket,
  loading = false,
  error = null,
  onClose,
  standalone = false
}: DiscordTranscriptViewerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedLink, setCopiedLink] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  const messages = ticket?.messages || [];

  const filteredMessages = useMemo(() => {
    if (!searchQuery.trim()) return messages;
    const q = searchQuery.toLowerCase();
    return messages.filter(
      (m) =>
        m.content?.toLowerCase().includes(q) ||
        m.authorTag?.toLowerCase().includes(q) ||
        (m.attachments && m.attachments.some((a) => a.toLowerCase().includes(q)))
    );
  }, [messages, searchQuery]);

  const handleCopyLink = () => {
    if (!ticket?.ticketId || typeof window === "undefined") return;
    const link = `${window.location.origin}/dashboard/tickets/transcripts/${ticket.ticketId}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    });
  };

  const containerRef = React.useRef<HTMLDivElement>(null);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  // Auto-scroll to latest messages when new chat items arrive
  React.useEffect(() => {
    if (messages.length > 0 && containerRef.current) {
      const isAtBottom =
        containerRef.current.scrollHeight - containerRef.current.scrollTop <=
        containerRef.current.clientHeight + 200;
      if (isAtBottom) {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, [messages.length]);

  return (
    <div className={`flex flex-col bg-[#1e1f22] text-slate-100 rounded-2xl border border-white/[0.08] shadow-2xl overflow-hidden ${standalone ? "w-full" : "max-h-[92vh] sm:max-h-[85vh] w-full"}`}>
      {/* Top Banner / Navigation */}
      <div className="bg-[#2b2d31] p-3 sm:p-5 border-b border-white/[0.06] flex flex-wrap items-center justify-between gap-2.5 sm:gap-3">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
            <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-lg font-bold text-white tracking-tight truncate">
                {ticket?.ticketId ? `Ticket #${ticket.ticketId}` : "Discord Transcript"}
              </h2>
              <span
                className={`px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                  ticket?.status === "open"
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    : "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                }`}
              >
                {ticket?.status || "closed"}
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5 truncate">
              Category: <span className="text-slate-200 font-medium">{ticket?.category?.label || ticket?.category?.value || "Support"}</span>
              {ticket?.closedAt && ` • Closed on ${new Date(ticket.closedAt).toLocaleDateString()}`}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 ml-auto">
          {ticket && (
            <>
              <button
                type="button"
                onClick={handleCopyLink}
                className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-xs font-semibold text-slate-300 hover:text-white transition-all border border-white/[0.08]"
                title="Copy direct link to this transcript"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5 text-purple-400" />}
                <span className="hidden md:inline">{copiedLink ? "Copied Link!" : "Share"}</span>
              </button>

              <button
                type="button"
                onClick={() => exportTranscriptTxt(ticket)}
                className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-xs font-semibold text-slate-300 hover:text-white transition-all border border-white/[0.08]"
                title="Download raw .txt file"
              >
                <Download className="w-3.5 h-3.5 text-purple-400" />
                <span className="hidden sm:inline">.TXT</span>
              </button>

              <button
                type="button"
                onClick={() => exportTranscriptHtml(ticket)}
                className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-xs font-semibold text-white transition-all shadow-md shadow-purple-900/30 border border-purple-400/30"
                title="Download interactive HTML chat transcript"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export<span className="hidden sm:inline"> .HTML</span></span>
              </button>

              {!standalone && (
                <a
                  href={`/dashboard/tickets/transcripts/${ticket.ticketId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-slate-400 hover:text-white transition-all border border-white/[0.08]"
                  title="Open in standalone tab"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </>
          )}

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-slate-400 hover:text-white transition-all border border-white/[0.08]"
              title="Close viewer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Ticket Details Sub-bar */}
      {ticket && (
        <div className="bg-[#232428] px-4 sm:px-5 py-2.5 border-b border-white/[0.04] flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex flex-wrap items-center gap-4">
            <span className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-purple-400" />
              Creator:{" "}
              <strong className="text-white font-medium">
                {ticket.creator?.displayName || ticket.creator?.username || ticket.creatorId || "Unknown"}
              </strong>
            </span>
            {ticket.createdAt && (
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-purple-400" />
                Opened:{" "}
                <span className="text-slate-300">
                  {new Date(ticket.createdAt).toLocaleDateString()} {new Date(ticket.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-purple-400" />
              Messages: <strong className="text-white font-medium">{messages.length}</strong>
            </span>
          </div>

          {/* Search inside transcript */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search chat messages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-7 py-1 text-xs bg-[#111214] text-white rounded-lg border border-white/[0.08] focus:border-purple-500 focus:outline-none placeholder:text-slate-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Chat Messages Body */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto bg-[#313338] p-3 sm:p-6 space-y-3 sm:space-y-4 min-h-[320px] max-h-[70vh] sm:max-h-[65vh] select-text"
      >
        {loading ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-semibold text-slate-400">Loading Discord ticket transcript #{ticket?.ticketId}...</p>
          </div>
        ) : error ? (
          <div className="py-16 text-center space-y-3 px-4">
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mx-auto">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-white">Transcript Notice</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">{error}</p>
          </div>
        ) : filteredMessages.length === 0 ? (
          <div className="py-20 text-center text-slate-500 text-xs">
            {searchQuery ? `No messages found matching "${searchQuery}".` : "No individual chat messages recorded for this ticket."}
          </div>
        ) : (
          filteredMessages.map((msg, index) => {
            const authorTag = msg.authorTag || "User";
            const displayName = authorTag.split("#")[0];
            const isBot = msg.isBot || authorTag.toLowerCase().includes("ticket") || authorTag.toLowerCase().includes("bot");
            const isCreator = ticket?.creatorId && msg.authorId === ticket.creatorId;
            const isStaff = ticket?.claimer && msg.authorId === (ticket.claimer as any)?.id;

            return (
              <div
                key={index}
                className="group flex items-start gap-2.5 sm:gap-3.5 p-1.5 sm:p-2 rounded-xl hover:bg-black/15 transition-colors relative"
              >
                {/* Author Avatar */}
                <img
                  src={msg.authorAvatar || "https://cdn.discordapp.com/embed/avatars/0.png"}
                  alt={displayName}
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover shrink-0 mt-0.5 border border-white/[0.06] bg-[#2b2d31]"
                  loading="lazy"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "https://cdn.discordapp.com/embed/avatars/0.png";
                  }}
                />

                {/* Message Content */}
                <div className="flex-1 min-w-0 space-y-1 overflow-hidden">
                  <div className="flex flex-wrap items-baseline gap-1.5 sm:gap-2">
                    <span className="font-bold text-xs sm:text-sm text-white hover:underline cursor-pointer">
                      {displayName}
                    </span>

                    {/* Role Badges */}
                    {isBot && (
                      <span className="px-1.5 py-0.2 rounded bg-[#5865f2] text-white text-[9px] font-extrabold tracking-wide uppercase">
                        APP
                      </span>
                    )}
                    {isCreator && (
                      <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[9px] font-bold uppercase">
                        Creator
                      </span>
                    )}
                    {isStaff && (
                      <span className="px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[9px] font-bold uppercase">
                        Staff
                      </span>
                    )}

                    <span className="text-[10.5px] sm:text-[11px] text-slate-400 font-sans">
                      {new Date(msg.timestamp).toLocaleString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </span>
                  </div>

                  {/* Formatted Text */}
                  <div className="text-[13px] sm:text-[13.5px] leading-relaxed text-[#dbdee1] break-words whitespace-pre-wrap font-sans overflow-hidden">
                    {renderFormattedContent(msg.content)}
                  </div>

                  {/* Attachments Section */}
                  {msg.attachments && msg.attachments.length > 0 && (
                    <div className="pt-2 flex flex-wrap gap-2.5">
                      {msg.attachments.map((att, attIdx) => {
                        const isImg = isImageUrl(att);
                        if (isImg) {
                          return (
                            <div
                              key={attIdx}
                              onClick={() => setLightboxImage(att)}
                              className="group/img relative rounded-xl overflow-hidden border border-white/10 bg-[#1e1f22] cursor-pointer max-w-sm hover:border-purple-500/50 transition-all shadow-md"
                            >
                              <img
                                src={att}
                                alt="Attachment"
                                className="max-h-64 object-cover rounded-xl transition-transform duration-300 group-hover/img:scale-[1.02]"
                                loading="lazy"
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white">
                                <ZoomIn className="w-5 h-5 text-white" />
                                <span className="text-xs font-semibold">Click to expand</span>
                              </div>
                            </div>
                          );
                        }

                        // Non-image file attachment
                        const filename = att.split("/").pop() || "Attachment";
                        return (
                          <a
                            key={attIdx}
                            href={att}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-[#2b2d31] hover:bg-[#35373c] text-xs text-purple-300 border border-white/10 transition-all shadow"
                          >
                            <Paperclip className="w-4 h-4 text-purple-400" />
                            <span className="font-semibold truncate max-w-xs">{filename}</span>
                            <Download className="w-3.5 h-3.5 text-slate-400 ml-1" />
                          </a>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Image Lightbox Modal */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-8 animate-fadeIn"
          onClick={() => setLightboxImage(null)}
        >
          <div className="relative max-w-5xl max-h-[90vh] flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
            <div className="absolute -top-12 right-0 flex items-center gap-3">
              <a
                href={lightboxImage}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition-all"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open Original</span>
              </a>
              <button
                type="button"
                onClick={() => setLightboxImage(null)}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <img
              src={lightboxImage}
              alt="Enlarged attachment"
              className="max-h-[82vh] max-w-full rounded-2xl object-contain shadow-2xl border border-white/10"
            />
          </div>
        </div>
      )}
    </div>
  );
}
