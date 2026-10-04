"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  LucideIcon,
  ShieldCheck,
  Lock,
  Database,
  EyeOff,
  UserCheck,
  FileCheck,
  ExternalLink,
  Trash2,
  Server,
  HardDrive,
  Layers,
  Clock,
  CheckCircle2,
  MessageSquare,
  Shield,
  FileText,
  AlertTriangle,
  Scale
} from "lucide-react";
import { TicketMarketingFrame } from "@/components/TicketMarketingFrame";

const SUPPORT_URL = "https://discord.gg/rB6gNZaK9u";

interface PrivacySection {
  id: string;
  number: string;
  icon: LucideIcon;
  title: string;
  badge: string;
  badgeColor: string;
  takeaway: string;
  description: string;
  points?: string[];
  subsections?: { title: string; desc: string }[];
}

const PRIVACY_SECTIONS: PrivacySection[] = [
  {
    id: "overview",
    number: "1",
    icon: ShieldCheck,
    title: "Privacy Commitment & Platform Overview",
    badge: "Zero Data Monetization",
    badgeColor: "bg-emerald-950/60 text-emerald-400 border-emerald-800/50",
    takeaway: "SyncInk Ticket never sells user data, tracks off-platform activity, or monitors private Discord direct messages.",
    description:
      "SyncInk Ticket is an enterprise Discord ticket routing and server support management infrastructure. We are deeply committed to transparency, minimal data retention, and strict guild isolation. This Privacy Policy outlines what information is collected when inviting SyncInk Ticket to your Discord guild, accessing the web dashboard at syncink.site, or interacting with support channels.",
    points: [
      "We operate under a strict 'least-privilege' principle: only data directly required to operate support tickets is handled.",
      "Your server data is never packaged, sold, or shared with third-party advertisers or behavioral tracking networks.",
      "Transcripts and configuration states remain strictly isolated to the Discord server in which they were created."
    ]
  },
  {
    id: "collection",
    number: "2",
    icon: Database,
    title: "Information We Collect & Process",
    badge: "Strictly Limited Scope",
    badgeColor: "bg-blue-950/60 text-blue-400 border-blue-800/50",
    takeaway: "Only basic Discord identifiers and staff configuration mappings are stored to execute support features.",
    description:
      "To execute automated ticketing, staff notifications, and web management, we collect only the minimal metadata provided via the official Discord Gateway and OAuth2 interfaces:",
    points: [
      "Discord Identification: User IDs, usernames, global display names, and avatar hashes when authenticating through Discord OAuth2 to verify your permissions.",
      "Guild Configuration: Discord Guild (Server) IDs, server names, configured ticket category channels, staff role IDs, log channel IDs, and custom panel embed preferences.",
      "Operational Ticket Records: Ticket serial IDs, creator user IDs, channel IDs, ticket status (open, claimed, closed), claiming staff ID, and creation/closure timestamps.",
      "What We NEVER Collect: We never collect passwords, payment card numbers, physical street addresses, private phone numbers, or off-platform biometric data."
    ]
  },
  {
    id: "transcripts",
    number: "3",
    icon: FileText,
    title: "Ticket Transcripts, Chat Logs & Attachments",
    badge: "Encrypted HTML Archives",
    badgeColor: "bg-purple-950/60 text-purple-400 border-purple-800/50",
    takeaway: "Ticket chat messages are recorded exclusively inside the designated ticket channel and archived solely for guild audit records.",
    description:
      "When a user creates a support ticket, all messages, embed notices, and file attachment links sent within that specific temporary ticket channel are recorded to generate an official HTML transcript upon ticket closure:",
    points: [
      "Audit Integrity: Transcripts exist so server owners and staff can verify resolutions, reference past support history, and investigate user appeals.",
      "Guild Isolation: Transcripts belonging to Server A can NEVER be accessed, searched, or viewed by administrators or members of Server B.",
      "Role-Based Access: Web dashboard access to view ticket transcripts is strictly enforced by Discord role hierarchy (Owner, Developer, Admin, Moderator, Staff)."
    ]
  },
  {
    id: "security",
    number: "4",
    icon: Lock,
    title: "Data Storage & Cryptographic Security Architecture",
    badge: "Enterprise Encryption",
    badgeColor: "bg-cyan-950/60 text-cyan-400 border-cyan-800/50",
    takeaway: "Enterprise MongoDB clusters with TLS 1.3 transit encryption and AES-256 rest encryption.",
    description:
      "We implement comprehensive physical, electronic, and procedural safeguards to protect all server data from unauthorized access, leakage, or loss:",
    points: [
      "Data in Transit: All communication between Discord Gateway, the bot clusters, backend APIs, and the web browser is encrypted using TLS 1.3.",
      "Data at Rest: Database volumes and transcript archives are stored on encrypted cloud partitions utilizing AES-256 encryption standards.",
      "Dashboard Authentication: Browser sessions are secured using cryptographically signed HTTP-only cookies with SameSite strict protection to prevent XSS and CSRF attacks."
    ]
  },
  {
    id: "infrastructure",
    number: "5",
    icon: EyeOff,
    title: "Third-Party Infrastructure & Service Providers",
    badge: "Vetted Partners Only",
    badgeColor: "bg-indigo-950/60 text-indigo-400 border-indigo-800/50",
    takeaway: "SyncInk relies exclusively on premier cloud and API providers governed by enterprise privacy standards.",
    description:
      "To ensure 99.9% uptime and high-speed global delivery, SyncInk Ticket utilizes vetted technical infrastructure:",
    points: [
      "Discord Inc.: Platform through which the bot operates, subject to Discord's Developer Terms and Privacy Policy.",
      "MongoDB Inc. (MongoDB Atlas): Secure cloud database clusters providing isolated, replica-set database storage.",
      "Vercel Inc.: Secure serverless edge compute platform hosting the web dashboard and public legal documentation.",
      "Cloudflare Inc.: Edge DDoS protection, SSL termination, and caching layers to guarantee fast response times."
    ]
  },
  {
    id: "retention",
    number: "6",
    icon: Clock,
    title: "Data Retention Lifecycles & Purge Protocols",
    badge: "User-Controlled Lifecycle",
    badgeColor: "bg-amber-950/60 text-amber-400 border-amber-800/50",
    takeaway: "Server owners can purge transcripts and configurations at any time upon verified request.",
    description:
      "Data retention is calibrated to balance ongoing moderation accountability with privacy best practices:",
    points: [
      "Active Tickets: Maintained in live memory and database until ticket closure is confirmed.",
      "Historical Transcripts: Retained in encrypted storage to facilitate server audits, staff reviews, and dispute resolutions.",
      "Bot Removal: If SyncInk Ticket is removed or kicked from your Discord server, server records can be scheduled for complete automated deletion.",
      "Immediate Manual Purge: Server owners may request complete, irreversible deletion of all transcripts and guild records at any time."
    ]
  },
  {
    id: "rights",
    number: "7",
    icon: UserCheck,
    title: "User Rights & GDPR / CCPA Compliance",
    badge: "Global Compliance",
    badgeColor: "bg-rose-950/60 text-rose-400 border-rose-800/50",
    takeaway: "Full compliance with user data access, correction, portability, and erasure rights.",
    description:
      "Regardless of geographic location, SyncInk extends comprehensive data protection rights to all users:",
    points: [
      "Right to Access: You may request a complete export of the data points and transcripts associated with your Discord User ID.",
      "Right to Erasure (Right to be Forgotten): You may request the permanent removal of your personal data from our systems.",
      "Submitting Inquiries: To submit a GDPR/CCPA request or data inquiry, open an official support ticket in our Discord community."
    ]
  },
  {
    id: "updates",
    number: "8",
    icon: FileCheck,
    title: "Updates to this Privacy Policy",
    badge: "Transparent Notices",
    badgeColor: "bg-slate-800 text-slate-300 border-slate-700",
    takeaway: "Significant policy changes are published with advance notice in our official Discord updates channel.",
    description:
      "We may periodically revise this Privacy Policy to reflect technical enhancements, architectural updates, or regulatory obligations. Material adjustments will be highlighted in the official SyncInk Discord server in # 📢・updates."
  }
];

export default function DedicatedPrivacyPage() {
  return (
    <TicketMarketingFrame
      active="privacy"
      eyebrow="Data Protection & Privacy"
      title="SyncInk Ticket Privacy Policy"
      description="We believe in total transparency. Here is a clear, comprehensive breakdown of what data is processed, how transcripts are protected, and how server owners retain complete control."
      actions={[
        { label: "Open Ticket Dashboard", to: "/dashboard/tickets", tone: "primary" },
        { label: "Discord Support Server", href: SUPPORT_URL, external: true, tone: "secondary" }
      ]}
    >
      {/* Quick Navigation Anchor Pills */}
      <div className="mk-filter-pills" style={{ justifyContent: "center", marginBottom: "28px" }}>
        {PRIVACY_SECTIONS.map((sec) => (
          <a
            key={sec.id}
            href={`#${sec.id}`}
            className="mk-filter-pill"
            style={{ textDecoration: "none" }}
          >
            {sec.title}
          </a>
        ))}
      </div>

      {/* Main Content Sections */}
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        {/* Policy Header Badge Bar */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px",
            padding: "16px 20px",
            background: "rgba(14, 18, 29, 0.8)",
            borderRadius: "16px",
            border: "1px solid rgba(255, 255, 255, 0.08)"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <ShieldCheck size={22} style={{ color: "#34d399" }} />
            <div>
              <h2 style={{ fontSize: "15px", color: "#fff", fontWeight: 700, margin: 0 }}>
                Privacy Architecture & Telemetry Standards
              </h2>
              <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                Public Document &bull; No Discord Login Required &bull; Version 2.4
              </span>
            </div>
          </div>
          <span style={{ fontSize: "11px", fontWeight: 700, color: "#34d399", background: "rgba(16, 185, 129, 0.12)", border: "1px solid rgba(16, 185, 129, 0.3)", padding: "4px 10px", borderRadius: "20px" }}>
            Last Updated: October 2026
          </span>
        </div>

        {/* Section Cards */}
        {PRIVACY_SECTIONS.map((sec) => {
          const Icon = sec.icon;
          return (
            <div
              key={sec.id}
              id={sec.id}
              style={{
                background: "#0e121d",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                borderRadius: "20px",
                padding: "26px",
                scrollMarginTop: "120px",
                boxShadow: "0 10px 30px rgba(0,0,0,0.3)"
              }}
            >
              {/* Card Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px", marginBottom: "14px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "12px",
                      background: "rgba(139, 76, 255, 0.12)",
                      border: "1px solid rgba(139, 76, 255, 0.25)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "var(--accent)"
                    }}
                  >
                    <Icon size={20} />
                  </div>
                  <div>
                    <span style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--accent)", fontFamily: "monospace" }}>
                      Section {sec.number}
                    </span>
                    <h3 style={{ fontSize: "18px", fontWeight: 700, color: "white", margin: "2px 0 0 0" }}>
                      {sec.title}
                    </h3>
                  </div>
                </div>

                <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${sec.badgeColor}`}>
                  {sec.badge}
                </span>
              </div>

              {/* Summary Takeaway Callout */}
              <div
                style={{
                  padding: "12px 16px",
                  borderRadius: "12px",
                  background: "rgba(139, 76, 255, 0.07)",
                  border: "1px solid rgba(139, 76, 255, 0.2)",
                  fontSize: "13px",
                  color: "#e2d9f3",
                  marginBottom: "16px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px"
                }}
              >
                <strong style={{ color: "var(--accent)", whiteSpace: "nowrap" }}>Key Takeaway:</strong>
                <span>{sec.takeaway}</span>
              </div>

              <p style={{ fontSize: "13.5px", color: "#cbd5e1", lineHeight: 1.7, marginBottom: "14px" }}>
                {sec.description}
              </p>

              {sec.points && (
                <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "14px", display: "flex", flexDirection: "column", gap: "10px" }}>
                  {sec.points.map((pt, idx) => (
                    <div key={idx} style={{ display: "flex", alignItems: "flex-start", gap: "10px", fontSize: "12.5px", color: "var(--text-soft)", lineHeight: 1.6 }}>
                      <CheckCircle2 size={15} style={{ color: "var(--accent)", flexShrink: 0, marginTop: "2px" }} />
                      <span>{pt}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {/* Data Removal & Purge Request Box */}
        <section className="mk-panel" style={{ marginTop: "20px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: "16px", flexWrap: "wrap" }}>
            <div style={{ width: "46px", height: "46px", borderRadius: "14px", background: "rgba(239, 68, 68, 0.12)", border: "1px solid rgba(239, 68, 68, 0.3)", display: "flex", alignItems: "center", justifyContent: "center", color: "#ef4444", flexShrink: 0 }}>
              <Trash2 size={24} />
            </div>
            <div style={{ flex: 1, minWidth: "260px" }}>
              <h3 style={{ fontSize: "16px", color: "#fff", margin: "0 0 6px 0", fontWeight: 700 }}>
                Request Server Data Purge or Transcript Erasure
              </h3>
              <p style={{ fontSize: "13px", color: "var(--text-soft)", lineHeight: 1.6, margin: "0 0 16px 0" }}>
                Need to permanently purge all transcripts, interaction logs, and category settings for your Discord server? Server owners can trigger an immediate, verified purge through our official support team.
              </p>
              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                <a
                  href={SUPPORT_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="action-button tone-primary"
                  style={{ textDecoration: "none", padding: "10px 18px", fontSize: "13px", borderColor: "rgba(239, 68, 68, 0.3)" }}
                >
                  <ExternalLink size={16} /> Open Data Removal Ticket on Discord
                </a>
                <Link
                  href="/dashboard/tickets/terms"
                  className="action-button tone-secondary"
                  style={{ textDecoration: "none", padding: "10px 18px", fontSize: "13px" }}
                >
                  <Scale size={16} /> View Terms of Service
                </Link>
                <Link
                  href="/dashboard/tickets/rules"
                  className="action-button tone-secondary"
                  style={{ textDecoration: "none", padding: "10px 18px", fontSize: "13px" }}
                >
                  <Shield size={16} /> View Ticket Rules
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </TicketMarketingFrame>
  );
}
