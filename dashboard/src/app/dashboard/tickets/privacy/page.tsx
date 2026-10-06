"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Shield,
  ShieldCheck,
  Lock,
  Database,
  Trash2,
  ExternalLink,
  ChevronRight,
  FileText,
  UserCheck,
  EyeOff,
  Server,
  RefreshCw,
  Scale,
  CheckCircle2,
  Copy,
  Check
} from "lucide-react";
import { TicketMarketingFrame } from "@/components/TicketMarketingFrame";

const SUPPORT_URL = "https://discord.gg/rB6gNZaK9u";

interface PrivacySection {
  id: string;
  number: string;
  badge: string;
  title: string;
  takeaway: string;
  points: { subtitle: string; desc: string }[];
}

const PRIVACY_SECTIONS: PrivacySection[] = [
  {
    id: "scope",
    number: "01",
    badge: "Scope & Definitions",
    title: "Scope, Governance & Legal Parties",
    takeaway: "Applies to all users, server owners, and staff interacting with the SyncInk Ticket Bot and Web Console.",
    points: [
      {
        subtitle: "Covered Services",
        desc: "This Privacy Policy governs the processing of technical telemetry, account identifiers, and customer service communication processed by SyncInk Ticket Bot and the SyncInk Web Dashboard (accessible at syncink.site/dashboard/tickets)."
      },
      {
        subtitle: "Roles & Responsibilities",
        desc: "SyncInk acts as a Data Processor on behalf of Discord server administrators (the Data Controllers) who deploy our ticketing workflows to facilitate customer support and moderation."
      },
      {
        subtitle: "Discord Platform Binding",
        desc: "SyncInk complies strictly with the Discord Developer Terms of Service and Discord Developer Policy. Personal user activity within Discord is additionally subject to Discord's official Privacy Policy."
      }
    ]
  },
  {
    id: "data-collected",
    number: "02",
    badge: "Data Telemetry",
    title: "Information We Collect & Process",
    takeaway: "We collect strictly necessary operational data required to create, assign, manage, and archive support tickets.",
    points: [
      {
        subtitle: "Discord Identity Telemetry",
        desc: "When authenticating through Discord OAuth2 or opening a ticket, we store your Discord User Snowflake ID, username, discriminator, global display name, and avatar hash to verify your identity and server permissions."
      },
      {
        subtitle: "Guild Configurations & Permissions",
        desc: "We record Guild Snowflake IDs, configured channel IDs, assigned staff/moderator role IDs, dropdown category schemas, and administrator dashboard preferences."
      },
      {
        subtitle: "Ticket Transcripts & Message Logs",
        desc: "For each ticket created, we store the channel ID, creator ID, claimer ID, timestamps, and message contents (including text and attachment URLs). When closed, a complete encrypted transcript is compiled for server audit records."
      },
      {
        subtitle: "Automated Interaction Telemetry",
        desc: "We log button clicks, select menu interactions, and claiming timestamps strictly to provide server analytics and activity feed auditing."
      }
    ]
  },
  {
    id: "purpose",
    number: "03",
    badge: "Legitimate Purpose",
    title: "Purpose of Processing & No-Sale Guarantee",
    takeaway: "Your data is NEVER sold, rented, monetized, or shared with third-party advertisers.",
    points: [
      {
        subtitle: "Core Functional Delivery",
        desc: "All stored data is utilized exclusively to route support requests, send role notifications, generate encrypted transcripts, and populate administrative metrics."
      },
      {
        subtitle: "Strict Zero-Monetization Policy",
        desc: "SyncInk has never sold and will never sell personal user information, chat content, or behavioral analytics to third parties, data brokers, or advertising networks."
      },
      {
        subtitle: "Security & Abuse Defense",
        desc: "Audit logs and interaction rates are examined automatically to defend servers against ticket flooding, raid attacks, and malicious bot exploitations."
      }
    ]
  },
  {
    id: "storage-security",
    number: "04",
    badge: "Encryption & Security",
    title: "Storage Standards, Infrastructure & Encryption",
    takeaway: "Enterprise-grade database encryption in transit and at rest with strict role-based access controls.",
    points: [
      {
        subtitle: "Encryption Protocols",
        desc: "All communications between the Discord Gateway, backend APIs, and web dashboards are encrypted using modern TLS 1.3 / HTTPS. Ticket transcripts and database records are safeguarded with AES-256 encryption at rest."
      },
      {
        subtitle: "Hosting & Isolation",
        desc: "Database clusters are hosted within secured MongoDB enterprise cloud infrastructure with isolated VPC networking, IP whitelisting, and multi-factor administrative authentication."
      },
      {
        subtitle: "Access Segmentation",
        desc: "Transcript records are strictly scoped to the originating Discord server. Server staff members cannot access or view tickets belonging to external guilds."
      }
    ]
  },
  {
    id: "retention-deletion",
    number: "05",
    badge: "Retention & Purging",
    title: "Data Retention & Right to Be Forgotten",
    takeaway: "Server owners can configure retention windows or request permanent data purges at any time.",
    points: [
      {
        subtitle: "Configurable Retention",
        desc: "By default, tickets and transcripts remain accessible to server staff for compliance records. Server owners may configure automatic purging or request manual transcript deletion."
      },
      {
        subtitle: "Guild Removal Cleanup",
        desc: "If the SyncInk Ticket Bot is kicked or removed from a Discord server, telemetry collection halts immediately and records can be flagged for automated decommissioning."
      },
      {
        subtitle: "Right to Erasure (GDPR / CCPA)",
        desc: "Any user or server owner may exercise their legal right to data erasure by requesting a permanent deletion of their account records or guild transcripts through our official support server."
      }
    ]
  },
  {
    id: "subprocessors",
    number: "06",
    badge: "Sub-processors",
    title: "Trusted Sub-processors & Infrastructure Partners",
    takeaway: "We work exclusively with audited enterprise cloud infrastructure providers.",
    points: [
      {
        subtitle: "Discord, Inc.",
        desc: "Provides the underlying bot application API, WebSocket gateway, and OAuth2 authentication layer."
      },
      {
        subtitle: "MongoDB Atlas",
        desc: "Provides SOC-2 compliant managed database clusters with high availability and automated encrypted backups."
      },
      {
        subtitle: "Cloudflare & Vercel",
        desc: "Provides global CDN caching, DDoS mitigation, edge security firewalls, and dashboard frontend hosting."
      }
    ]
  },
  {
    id: "user-rights",
    number: "07",
    badge: "User Rights",
    title: "Your Rights & Data Subject Requests",
    takeaway: "Full transparency: export your data, request corrections, or restrict processing.",
    points: [
      {
        subtitle: "Access & Portability",
        desc: "Server administrators and ticket creators can download transcripts directly in raw .TXT or interactive .HTML formats from the dashboard."
      },
      {
        subtitle: "Rectification",
        desc: "Server configurations, category labels, and mapped staff roles can be updated instantly via the dashboard interface."
      },
      {
        subtitle: "Lodge an Inquiry",
        desc: "For data inquiries, compliance audits, or legal questions, join our official Discord Support Server at https://discord.gg/rB6gNZaK9u."
      }
    ]
  }
];

export default function DedicatedPrivacyPage() {
  const [copiedLink, setCopiedLink] = useState(false);

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  return (
    <TicketMarketingFrame
      active="privacy"
      eyebrow="Legal & Compliance"
      title="Privacy Policy & Data Protection"
      description="Official legal disclosures detailing how SyncInk Ticket Bot collects, encrypts, processes, and protects your server telemetry and ticket communications."
      actions={[
        {
          label: "Ticket Console",
          href: "/dashboard/tickets",
          tone: "primary"
        },
        {
          label: "Terms of Service",
          href: "/dashboard/tickets/terms",
          tone: "secondary"
        },
        {
          label: "Support Server",
          href: SUPPORT_URL,
          external: true,
          tone: "secondary"
        }
      ]}
    >
      <div className="space-y-8">
        {/* Compliance Highlights Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {[
            { label: "GDPR Compliant", desc: "User data rights protected", icon: ShieldCheck, color: "text-emerald-400" },
            { label: "AES-256 Storage", desc: "Encrypted at rest", icon: Lock, color: "text-purple-400" },
            { label: "Zero Ad Sales", desc: "Data is never monetized", icon: EyeOff, color: "text-cyan-400" },
            { label: "TLS 1.3 In Transit", desc: "End-to-end transport", icon: Server, color: "text-pink-400" }
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="p-3.5 sm:p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-md flex flex-col gap-1.5"
              >
                <div className="flex items-center gap-2">
                  <Icon className={`w-4 h-4 ${item.color}`} />
                  <span className="text-xs sm:text-sm font-bold text-white tracking-tight">{item.label}</span>
                </div>
                <span className="text-[11px] text-slate-400">{item.desc}</span>
              </div>
            );
          })}
        </div>

        {/* Quick Navigation Anchor Pills */}
        <div className="flex flex-wrap items-center gap-2 p-3 sm:p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-2">Jump to Section:</span>
          {PRIVACY_SECTIONS.map((sec) => (
            <a
              key={sec.id}
              href={`#${sec.id}`}
              className="px-3 py-1 rounded-full text-xs font-semibold bg-white/[0.05] hover:bg-purple-600/30 hover:border-purple-500/40 border border-white/[0.08] text-slate-300 hover:text-white transition-all"
            >
              {sec.number}. {sec.badge}
            </a>
          ))}
          <button
            type="button"
            onClick={handleCopyLink}
            className="ml-auto inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-600/20 text-purple-300 border border-purple-500/30 hover:bg-purple-600/30 transition-all"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedLink ? "Link Copied!" : "Share Policy"}</span>
          </button>
        </div>

        {/* Detailed Legal Sections */}
        <div className="space-y-6">
          {PRIVACY_SECTIONS.map((sec) => (
            <section
              key={sec.id}
              id={sec.id}
              className="scroll-mt-28 p-5 sm:p-7 rounded-2xl bg-white/[0.025] border border-white/[0.08] hover:border-purple-500/30 transition-all relative overflow-hidden"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-lg bg-purple-500/15 border border-purple-500/30 text-purple-400 font-mono text-xs font-bold flex items-center justify-center">
                    {sec.number}
                  </span>
                  <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                    {sec.title}
                  </h2>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white/[0.06] text-purple-300 border border-purple-500/20">
                  {sec.badge}
                </span>
              </div>

              {/* Takeaway Highlight Box */}
              <div className="p-3 sm:p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/25 text-xs text-purple-200 mb-5 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white font-semibold">Summary: </strong>
                  {sec.takeaway}
                </div>
              </div>

              {/* Detailed Points */}
              <div className="space-y-4">
                {sec.points.map((pt, pIdx) => (
                  <div key={pIdx} className="pl-3.5 border-l-2 border-purple-500/30 space-y-1">
                    <h3 className="text-sm font-semibold text-white">
                      {pt.subtitle}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                      {pt.desc}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* Server Data Purge Request Box */}
        <div className="p-5 sm:p-7 rounded-2xl bg-red-950/20 border border-red-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-red-400 font-bold text-sm sm:text-base">
              <Trash2 className="w-5 h-5 text-red-400" />
              <span>Request Full Server Data Purge</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Need to permanently purge all transcripts, interaction metrics, and bot configurations stored for your Discord server? Verified server owners can initiate a total data erasure request in our official support server.
            </p>
          </div>
          <a
            href={SUPPORT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-xs sm:text-sm font-bold text-white transition-all shrink-0 shadow-lg shadow-red-950/50 border border-red-400/40"
          >
            <span>Open Purge Ticket</span>
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>

        {/* Footer Navigation Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-6 border-t border-white/[0.08] text-xs text-slate-400">
          <div>
            Last updated: <span className="text-slate-200 font-medium">October 2026</span> • Version 2.4 (Enterprise)
          </div>
          <div className="flex items-center gap-4">
            <Link href="/dashboard/tickets/terms" className="hover:text-white transition-colors">
              Terms of Service
            </Link>
            <Link href="/dashboard/tickets/faq" className="hover:text-white transition-colors">
              FAQ
            </Link>
            <Link href="/rules" className="hover:text-white transition-colors">
              Rules
            </Link>
            <a href={SUPPORT_URL} target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300 transition-colors">
              Discord Support Server
            </a>
          </div>
        </div>
      </div>
    </TicketMarketingFrame>
  );
}
