"use client";

import React from "react";
import Link from "next/link";
import {
  LucideIcon,
  Scale,
  ShieldAlert,
  RefreshCw,
  FileText,
  AlertTriangle,
  Ban,
  Bot,
  Sparkles,
  ExternalLink,
  Lock,
  MessageSquare,
  ShieldCheck,
  SlidersHorizontal,
  CheckCircle2,
  FileWarning
} from "lucide-react";
import { TicketMarketingFrame } from "@/components/TicketMarketingFrame";

const SUPPORT_URL = "https://discord.gg/rB6gNZaK9u";

interface TermSection {
  id: string;
  number: string;
  icon: LucideIcon;
  title: string;
  badge: string;
  badgeColor: string;
  takeaway: string;
  description: string;
  points?: string[];
}

const TERMS_SECTIONS: TermSection[] = [
  {
    id: "acceptance",
    number: "1",
    icon: Scale,
    title: "Acceptance of Terms & Binding Agreement",
    badge: "Legally Binding",
    badgeColor: "bg-blue-950/60 text-blue-400 border-blue-800/50",
    takeaway: "Using SyncInk Ticket or accessing the dashboard implies full agreement with these Terms of Service.",
    description:
      "By adding SyncInk Ticket to any Discord server, accessing the web management dashboard at syncink.site, or interacting with bot ticket channels, you acknowledge and agree to be bound by these Terms of Service, our Privacy Policy, and Discord's Terms of Service and Community Guidelines.",
    points: [
      "If you do not agree to these terms, you must remove the bot from your server and cease accessing the dashboard.",
      "Server owners are responsible for ensuring their community moderators and members comply with these terms.",
      "These terms govern both the automated Discord bot application and the companion web management console."
    ]
  },
  {
    id: "services",
    number: "2",
    icon: Bot,
    title: "Service Scope & Ticket Management Infrastructure",
    badge: "Enterprise Features",
    badgeColor: "bg-purple-950/60 text-purple-400 border-purple-800/50",
    takeaway: "Autonomous ticket routing, interactive embed panels, role access controls, and HTML transcripts.",
    description:
      "SyncInk Ticket provides autonomous customer support and moderation infrastructure for Discord communities, including:",
    points: [
      "Custom Ticket Panels: Dynamic select-menu and button-driven embed panels for automated channel creation.",
      "Role-Based Access Tiers: Strict permission controls allowing specific server roles to claim, manage, and audit tickets.",
      "Encrypted Transcripts: Comprehensive archival of closed support tickets for dispute audits and record-keeping.",
      "Web Management Console: Real-time configuration dashboard with role management, analytics, and category controls."
    ]
  },
  {
    id: "conduct",
    number: "3",
    icon: ShieldAlert,
    title: "Acceptable Use & Strictly Prohibited Activities",
    badge: "Zero Abuse Tolerance",
    badgeColor: "bg-red-950/60 text-rose-400 border-red-800/50",
    takeaway: "No automated spamming, ticket flooding, staff harassment, or bot exploitation.",
    description:
      "Users agree to maintain high standards of digital integrity across all SyncInk Ticket services. You expressly agree NOT to:",
    points: [
      "Spam or Flood: Deploy automated user-bots, macros, or scripts to flood ticket queues or create rapid ghost tickets.",
      "Harass Staff: Direct abusive, vulgar, threatening, hateful, or discriminatory remarks toward community support agents.",
      "Circumvent Quarantines: Utilize alternate accounts (alts) to bypass active ticket blacklists or guild mutes.",
      "Exploit Infrastructure: Attempt to reverse-engineer API endpoints, inject malicious code, or trigger Denial of Service attacks.",
      "Distribute Illegal Content: Post, upload, or link any NSFW, adult, malicious, phishing, or infringing media within tickets."
    ]
  },
  {
    id: "ratelimits",
    number: "4",
    icon: SlidersHorizontal,
    title: "Rate Limits & Operational Throttle Thresholds",
    badge: "Resource Defense",
    badgeColor: "bg-amber-950/60 text-amber-400 border-amber-800/50",
    takeaway: "Anti-flood safeguards automatically throttle rapid ticket generation and bot command abuse.",
    description:
      "To safeguard shared cloud resources and Discord Gateway quotas, automated rate limits are enforced platform-wide:",
    points: [
      "Ticket Creation Limits: Users are subject to a global cooldown between ticket creations to prevent channel spam.",
      "Concurrent Ticket Caps: Communities may enforce limits on simultaneous open tickets per individual user.",
      "Command Throttling: Rapid button clicking or selector spam triggers a progressive in-memory cooldown."
    ]
  },
  {
    id: "ip",
    number: "5",
    icon: Sparkles,
    title: "Intellectual Property & Proprietary Rights",
    badge: "Protected Assets",
    badgeColor: "bg-cyan-950/60 text-cyan-400 border-cyan-800/50",
    takeaway: "All bot algorithms, branding, dashboard designs, and transcripts viewer styles remain proprietary to SyncInk.",
    description:
      "All visual assets, logotypes, codebases, custom panel rendering algorithms, transcript viewers, and dashboard interfaces are the exclusive intellectual property of SyncInk Network.",
    points: [
      "Users are granted a limited, revocable license to utilize the bot and dashboard solely for their Discord community.",
      "Redistribution, unauthorized mirroring, or white-labeling of SyncInk assets without written consent is forbidden."
    ]
  },
  {
    id: "sla",
    number: "6",
    icon: RefreshCw,
    title: "Service Availability & Maintenance SLA",
    badge: "99.9% Target Uptime",
    badgeColor: "bg-emerald-950/60 text-emerald-400 border-emerald-800/50",
    takeaway: "We target continuous 24/7 reliability, with scheduled maintenance communicated in advance.",
    description:
      "We strive to deliver round-the-clock availability across all bot shards, databases, and dashboard web nodes:",
    points: [
      "Target Availability: We target 99.9% uptime, excluding scheduled infrastructure upgrades or Discord API outages.",
      "Status Transparency: Live service status, shard latency, and incident reports are publicly visible at /dashboard/tickets/status.",
      "Maintenance Windows: Essential database re-indexing or bot deployments are performed during low-traffic periods."
    ]
  },
  {
    id: "termination",
    number: "7",
    icon: Ban,
    title: "Suspension, Blacklisting & Termination of Service",
    badge: "Policy Enforcement",
    badgeColor: "bg-rose-950/60 text-rose-400 border-rose-800/50",
    takeaway: "Malicious servers or abusive users may be permanently blocked from bot usage without liability.",
    description:
      "SyncInk reserves the explicit right to suspend or permanently revoke bot functionality or dashboard access for:",
    points: [
      "Any server or individual discovered conducting raids, token attacks, or ticket flooding against other communities.",
      "Servers engaging in illegal activities, unauthorized financial transactions, or hate group operations.",
      "Violations of Discord Developer Policy that threaten the bot's application status on Discord."
    ]
  },
  {
    id: "liability",
    number: "8",
    icon: AlertTriangle,
    title: "Disclaimers & Limitation of Liability",
    badge: "Standard As-Is Clause",
    badgeColor: "bg-slate-800 text-slate-300 border-slate-700",
    takeaway: "SyncInk services are provided 'as-is' without warranties of uninterrupted service.",
    description:
      "SyncInk Ticket services and the web dashboard are provided on an 'AS-IS' and 'AS-AVAILABLE' basis without warranties of any kind:",
    points: [
      "We are not liable for lost messages or transcript gaps caused by external Discord Gateway API failures.",
      "Under no circumstances shall SyncInk or its developers be held liable for indirect, incidental, or consequential damages."
    ]
  },
  {
    id: "appeals",
    number: "9",
    icon: MessageSquare,
    title: "Inquiries, Appeals & Legal Contact",
    badge: "Direct Assistance",
    badgeColor: "bg-indigo-950/60 text-indigo-400 border-indigo-800/50",
    takeaway: "Our community management and support team is accessible 24/7 via the official Discord server.",
    description:
      "If you have questions regarding these Terms of Service, wish to appeal a bot blacklist, or require enterprise terms for high-volume Discord servers, please contact us via our official support channels.",
    points: [
      "Appeals: Submit an appeal ticket under 'Owner Contact' in our Discord Support Server.",
      "General Questions: Connect with staff members in # 💬・support-chat on Discord."
    ]
  }
];

export default function DedicatedTermsPage() {
  return (
    <TicketMarketingFrame
      active="terms"
      eyebrow="Terms & Compliance"
      title="SyncInk Ticket Terms of Service"
      description="Clear, sensible guidelines governing the responsible use of the SyncInk Ticket bot, backend APIs, and web management dashboard."
      actions={[
        { label: "Open Ticket Dashboard", to: "/dashboard/tickets", tone: "primary" },
        { label: "Discord Support Server", href: SUPPORT_URL, external: true, tone: "secondary" }
      ]}
    >
      {/* Quick Navigation Anchor Pills */}
      <div className="mk-filter-pills" style={{ justifyContent: "center", marginBottom: "28px" }}>
        {TERMS_SECTIONS.map((sec) => (
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
        {/* Header Badge Bar */}
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
            <Scale size={22} style={{ color: "#818cf8" }} />
            <div>
              <h2 style={{ fontSize: "15px", color: "#fff", fontWeight: 700, margin: 0 }}>
                Service Agreement & Operational Terms
              </h2>
              <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                Public Document &bull; No Discord Login Required &bull; Version 2.4
              </span>
            </div>
          </div>
          <span style={{ fontSize: "11px", fontWeight: 700, color: "#818cf8", background: "rgba(129, 140, 248, 0.12)", border: "1px solid rgba(129, 140, 248, 0.3)", padding: "4px 10px", borderRadius: "20px" }}>
            Last Updated: October 2026
          </span>
        </div>

        {/* Section Cards */}
        {TERMS_SECTIONS.map((sec) => {
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
                      Clause {sec.number}
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

        {/* Support & Legal Inquiries Card */}
        <section className="mk-panel" style={{ marginTop: "20px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: "16px", flexWrap: "wrap" }}>
            <div style={{ width: "46px", height: "46px", borderRadius: "14px", background: "rgba(139, 76, 255, 0.12)", border: "1px solid rgba(139, 76, 255, 0.3)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--accent)", flexShrink: 0 }}>
              <MessageSquare size={24} />
            </div>
            <div style={{ flex: 1, minWidth: "260px" }}>
              <h3 style={{ fontSize: "16px", color: "#fff", margin: "0 0 6px 0", fontWeight: 700 }}>
                Questions Regarding These Terms or Commercial Deployment?
              </h3>
              <p style={{ fontSize: "13px", color: "var(--text-soft)", lineHeight: 1.6, margin: "0 0 16px 0" }}>
                Have questions about our acceptable use guidelines, data processing agreements, or multi-server community deployments? Our team is available 24/7 in the official Discord Support Server.
              </p>
              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                <a
                  href={SUPPORT_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="action-button tone-primary"
                  style={{ textDecoration: "none", padding: "10px 18px", fontSize: "13px" }}
                >
                  <MessageSquare size={16} /> Contact Support on Discord
                </a>
                <Link
                  href="/dashboard/tickets/privacy"
                  className="action-button tone-secondary"
                  style={{ textDecoration: "none", padding: "10px 18px", fontSize: "13px" }}
                >
                  <Lock size={16} /> View Privacy Policy
                </Link>
                <Link
                  href="/dashboard/tickets/rules"
                  className="action-button tone-secondary"
                  style={{ textDecoration: "none", padding: "10px 18px", fontSize: "13px" }}
                >
                  <ShieldCheck size={16} /> View Ticket Rules
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </TicketMarketingFrame>
  );
}
