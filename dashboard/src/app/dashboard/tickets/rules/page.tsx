"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  LucideIcon,
  Shield,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Bot,
  Sparkles,
  ExternalLink,
  Search,
  MessageSquare,
  Lock,
  ArrowRight,
  UserCheck,
  Ban,
  FileWarning,
  Share2,
  Copy,
  Check,
  Ticket,
  Clock,
  Settings,
  Scale,
  X
} from "lucide-react";
import { TicketMarketingFrame } from "@/components/TicketMarketingFrame";

const SUPPORT_URL = "https://discord.gg/rB6gNZaK9u";

interface TicketRule {
  id: string;
  number: string;
  title: string;
  category: "creation" | "conduct" | "antispam" | "security" | "staff" | "appeals";
  badge: string;
  badgeColor: string;
  icon: LucideIcon;
  channel: string;
  channelLink?: string;
  description: string;
  details: string[];
  severity: string;
}

const TICKET_RULES: TicketRule[] = [
  {
    id: "rule-1",
    number: "Rule 1",
    title: "Legitimate Purpose Required for Ticket Creation",
    category: "creation",
    badge: "Mandatory Purpose",
    badgeColor: "bg-blue-950/60 text-blue-400 border-blue-800/50",
    icon: Ticket,
    channel: "# 🎟️・create-ticket",
    channelLink: "https://discord.gg/rB6gNZaK9u",
    description:
      "Support tickets must only be opened for genuine questions, legitimate technical issues, user reports, server billing inquiries, or official appeals. Opening empty, test, or frivolous tickets wastes staff time and restricts system availability.",
    details: [
      "Select the category dropdown that strictly reflects your inquiry (General Request, Bug Report, User Report, Staff Abuse, etc.).",
      "Explain your issue thoroughly in the initial message including relevant screenshots, IDs, or error codes.",
      "Opening 'test tickets' without explicit administrator approval triggers an automated system warning."
    ],
    severity: "Immediate Closure -> Automated Warning"
  },
  {
    id: "rule-2",
    number: "Rule 2",
    title: "Professional Conduct & Respect Toward Support Staff",
    category: "conduct",
    badge: "Staff Protection",
    badgeColor: "bg-red-950/60 text-rose-400 border-red-800/50",
    icon: UserCheck,
    channel: "All Ticket Channels",
    description:
      "Treat all community support agents, moderators, and developers with mutual dignity and professionalism. Abuse, insults, toxic hostility, or aggressive demands inside ticket threads will not be tolerated.",
    details: [
      "Strictly prohibited: Harassment, vulgar language, personal threats, derogatory slurs, or condescending behavior toward staff.",
      "Staff members are real people assisting multiple community members concurrently; maintain patience while your issue is reviewed.",
      "Any hostile outburst inside a ticket will result in immediate ticket termination and punitive moderation."
    ],
    severity: "Ticket Closure -> Timeout -> Server Ban"
  },
  {
    id: "rule-3",
    number: "Rule 3",
    title: "One Active Ticket Per Inquiry / No Duplicates",
    category: "creation",
    badge: "Queue Integrity",
    badgeColor: "bg-amber-950/60 text-amber-400 border-amber-800/50",
    icon: Clock,
    channel: "Platform-Wide",
    description:
      "Users may not open multiple simultaneous tickets regarding the same question or incident. Duplicate tickets clutter operational queues and delay support for other members.",
    details: [
      "Wait for an assigned support agent to respond before opening another ticket or requesting status updates.",
      "If you forgot to mention additional information, send it as a follow-up message within your existing open ticket channel.",
      "Rapidly creating and closing tickets to cycle ticket channel names is flagged by the anti-abuse engine."
    ],
    severity: "Duplicate Merge -> Cooldown Throttle"
  },
  {
    id: "rule-4",
    number: "Rule 4",
    title: "Zero Tolerance for Ticket Spam & Flooding",
    category: "antispam",
    badge: "Anti-Spam Shield",
    badgeColor: "bg-orange-950/60 text-orange-400 border-orange-800/50",
    icon: Flame,
    channel: "All Server Channels",
    description:
      "Automated spamming, bot command flooding, repetitive copy-pasta text, or mass attachment dumping inside ticket channels triggers immediate anti-raid quarantines.",
    details: [
      "Prohibited: Rapid repeated messages, large attachment bombarding, unsolicited mass mentions (@everyone, @here, or role pings).",
      "Do not spam bot commands inside ticket channels; use the bot's interactive buttons and selectors as designed.",
      "Using third-party macro tools or user-bots to generate mass tickets results in an instant network-wide blacklist."
    ],
    severity: "Instant Ticket Lockout -> Blacklist"
  },
  {
    id: "rule-5",
    number: "Rule 5",
    title: "Confidentiality & Sensitive Data Safeguards",
    category: "security",
    badge: "Privacy First",
    badgeColor: "bg-emerald-950/60 text-emerald-400 border-emerald-800/50",
    icon: Lock,
    channel: "Private Ticket Threads",
    description:
      "Never disclose Discord account passwords, two-factor authentication recovery codes, or sensitive financial information inside any ticket channel.",
    details: [
      "SyncInk staff personnel will NEVER ask you for your Discord password, token, or private banking details.",
      "All messages, images, and attachments sent inside tickets are logged in encrypted HTML transcripts accessible exclusively by authorized server leadership.",
      "Do not post sensitive personal information (PII) belonging to third parties or doxxing material."
    ],
    severity: "Immediate Purge -> Security Ban"
  },
  {
    id: "rule-6",
    number: "Rule 6",
    title: "No Circumventing Ticket Blacklists or Bans",
    category: "security",
    badge: "Anti-Evasion",
    badgeColor: "bg-purple-950/60 text-purple-400 border-purple-800/50",
    icon: Ban,
    channel: "All Guild Channels",
    description:
      "Attempting to bypass a ticket cooldown, staff timeout, or ticket system blacklist using alternate Discord accounts (alts) is strictly forbidden.",
    details: [
      "If you are placed on a ticket cooldown or restricted role, you must wait out the sanction duration.",
      "Using secondary accounts to re-open closed inquiries or harass staff members results in permanent bans across all associated accounts.",
      "Server owners maintain the right to revoke ticket creation permissions at their discretion."
    ],
    severity: "Permanent Ban across All Alt Accounts"
  },
  {
    id: "rule-7",
    number: "Rule 7",
    title: "Ticket Staff Integrity & Claiming Ethics",
    category: "staff",
    badge: "Staff Standards",
    badgeColor: "bg-cyan-950/60 text-cyan-400 border-cyan-800/50",
    icon: Shield,
    channel: "Staff Operations",
    description:
      "Designated moderators and support agents must handle user tickets in accordance with official ethical standards and prompt response protocols.",
    details: [
      "Claiming Tickets: Only claim a ticket if you are actively prepared to assist the user through resolution.",
      "Transcript Integrity: Do not delete, tamper with, or conceal ticket transcripts stored in the web dashboard.",
      "Closure Notices: Always provide a clear closing reason before executing the close button or command.",
      "Escalation: Inquiries involving staff abuse must be escalated to Server Owners and never resolved by the accused party."
    ],
    severity: "Demotion -> Revocation of Dashboard Access"
  },
  {
    id: "rule-8",
    number: "Rule 8",
    title: "Appeals, Disputes & Escalation Framework",
    category: "appeals",
    badge: "Fair Due Process",
    badgeColor: "bg-indigo-950/60 text-indigo-400 border-indigo-800/50",
    icon: Scale,
    channel: "# 🎟️・create-ticket",
    channelLink: "https://discord.gg/rB6gNZaK9u",
    description:
      "If you believe your ticket was closed improperly, or wish to dispute a ticket blacklist or staff moderation decision, follow the official appeal process.",
    details: [
      "Do NOT debate, complain, or escalate arguments in public community chat channels (#general or #support-chat).",
      "Open a single appeal ticket under the 'Staff Abuse' or 'Owner Contact' category with verifiable proof (screenshots, message links).",
      "Appeals submitted with falsehoods or fabricated evidence will be permanently denied with prejudice."
    ],
    severity: "Formal Review by Server Leadership"
  }
];

export default function TicketRulesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [copiedRuleId, setCopiedRuleId] = useState<string | null>(null);

  const handleCopyLink = (ruleId: string) => {
    if (typeof window !== "undefined") {
      const url = `${window.location.origin}/dashboard/tickets/rules#${ruleId}`;
      navigator.clipboard.writeText(url);
      setCopiedRuleId(ruleId);
      setTimeout(() => setCopiedRuleId(null), 2000);
    }
  };

  const filteredRules = TICKET_RULES.filter((rule) => {
    const matchesSearch =
      searchQuery.trim() === "" ||
      rule.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rule.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rule.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rule.details.some((d) => d.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory =
      selectedCategory === "all" || rule.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <TicketMarketingFrame
      active="rules"
      eyebrow="Official Rules & Compliance"
      title="SyncInk Ticket Bot Rules & Guidelines"
      description="Clear, enforceable operating standards designed to ensure rapid response times, respectful communication, and complete audit integrity across every support thread."
      actions={[
        { label: "Open Ticket Dashboard", to: "/dashboard/tickets", tone: "primary" },
        { label: "Discord Support Server", href: SUPPORT_URL, external: true, tone: "secondary" }
      ]}
    >
      {/* Search & Real-time Filter Bar */}
      <div style={{ maxWidth: "800px", margin: "0 auto 28px" }}>
        <div
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            background: "rgba(14, 18, 29, 0.95)",
            border: "1px solid rgba(139, 76, 255, 0.25)",
            borderRadius: "16px",
            padding: "4px 14px",
            boxShadow: "0 10px 30px rgba(0,0,0,0.5)"
          }}
        >
          <Search size={18} style={{ color: "var(--accent)", flexShrink: 0, marginRight: "10px" }} />
          <input
            type="text"
            placeholder="Search ticket rules by keyword (e.g., spam, staff, blacklist, privacy)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              background: "transparent",
              border: "none",
              outline: "none",
              color: "#fff",
              fontSize: "14px",
              padding: "10px 0"
            }}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              style={{
                background: "rgba(255,255,255,0.08)",
                border: "none",
                borderRadius: "50%",
                width: "24px",
                height: "24px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--text-muted)",
                cursor: "pointer"
              }}
              title="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="mk-filter-pills" style={{ justifyContent: "center", marginBottom: "28px" }}>
        {[
          { id: "all", label: "All Rules" },
          { id: "creation", label: "Ticket Creation" },
          { id: "conduct", label: "Member Conduct" },
          { id: "antispam", label: "Anti-Spam & Limits" },
          { id: "security", label: "Security & Privacy" },
          { id: "staff", label: "Staff Protocol" },
          { id: "appeals", label: "Appeals & Disputes" }
        ].map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setSelectedCategory(cat.id)}
            className={`mk-filter-pill ${selectedCategory === cat.id ? "active" : ""}`}
            style={{ cursor: "pointer", border: "none" }}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Rules Grid */}
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px", paddingBottom: "12px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <BookOpen size={20} style={{ color: "var(--accent)" }} />
            <h2 style={{ fontSize: "18px", color: "white", fontWeight: 700, margin: 0 }}>
              Operating Protocols & Conduct Rules
            </h2>
          </div>
          <span style={{ fontSize: "12px", color: "var(--text-muted)", fontFamily: "monospace" }}>
            Showing {filteredRules.length} of {TICKET_RULES.length} Rules
          </span>
        </div>

        {filteredRules.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 20px", background: "rgba(14, 18, 29, 0.6)", borderRadius: "18px", border: "1px solid rgba(255,255,255,0.08)" }}>
            <FileWarning size={36} style={{ color: "var(--accent)", margin: "0 auto 12px" }} />
            <h3 style={{ fontSize: "16px", color: "white", marginBottom: "6px" }}>No matching rules found</h3>
            <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>
              No rules matched "{searchQuery}". Try a different keyword or reset filters.
            </p>
          </div>
        ) : (
          filteredRules.map((rule) => {
            const Icon = rule.icon;
            return (
              <div
                key={rule.id}
                id={rule.id}
                style={{
                  background: "#0e121d",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  borderRadius: "20px",
                  padding: "24px",
                  scrollMarginTop: "120px",
                  boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
                  transition: "all 0.3s ease"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px", marginBottom: "14px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div
                      style={{
                        width: "38px",
                        height: "38px",
                        borderRadius: "12px",
                        background: "rgba(139, 76, 255, 0.12)",
                        border: "1px solid rgba(139, 76, 255, 0.25)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "var(--accent)"
                      }}
                    >
                      <Icon size={18} />
                    </div>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                        <span style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em", color: "white", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", padding: "2px 8px", borderRadius: "6px", fontFamily: "monospace" }}>
                          {rule.number}
                        </span>
                        <h3 style={{ fontSize: "17px", fontWeight: 700, color: "white", margin: 0 }}>
                          {rule.title}
                        </h3>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${rule.badgeColor}`}>
                      {rule.badge}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyLink(rule.id)}
                      title="Copy link to this rule"
                      style={{
                        background: "rgba(255,255,255,0.06)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: "8px",
                        padding: "6px",
                        color: copiedRuleId === rule.id ? "#34d399" : "var(--text-muted)",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                      }}
                    >
                      {copiedRuleId === rule.id ? <Check size={14} /> : <Share2 size={14} />}
                    </button>
                  </div>
                </div>

                <p style={{ fontSize: "13.5px", color: "#cbd5e1", lineHeight: 1.6, marginBottom: "16px" }}>
                  {rule.description}
                </p>

                {/* Sub details bullet points */}
                <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "14px", display: "flex", flexDirection: "column", gap: "8px" }}>
                  {rule.details.map((detail, idx) => (
                    <div key={idx} style={{ display: "flex", alignItems: "flex-start", gap: "8px", fontSize: "12.5px", color: "var(--text-soft)", lineHeight: 1.5 }}>
                      <span style={{ color: "var(--accent)", fontWeight: 700, marginTop: "1px" }}>&bull;</span>
                      <span>{detail}</span>
                    </div>
                  ))}
                </div>

                {/* Footer metadata */}
                <div style={{ borderTop: "1px solid rgba(255,255,255,0.04)", paddingTop: "14px", marginTop: "14px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px", fontSize: "11.5px", color: "var(--text-muted)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ fontWeight: 600, color: "var(--text-soft)" }}>Target Scope:</span>
                    {rule.channelLink ? (
                      <a
                        href={rule.channelLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: "#818cf8", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "4px" }}
                      >
                        {rule.channel} <ExternalLink size={11} />
                      </a>
                    ) : (
                      <span>{rule.channel}</span>
                    )}
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ fontWeight: 600, color: "var(--text-soft)" }}>Enforcement:</span>
                    <span style={{ color: "#fb7185", fontWeight: 600 }}>{rule.severity}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Escalation & Dispute Notice Banner */}
      <section className="mk-panel" style={{ marginTop: "40px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: "16px", flexWrap: "wrap" }}>
          <div style={{ width: "46px", height: "46px", borderRadius: "14px", background: "rgba(139, 76, 255, 0.12)", border: "1px solid rgba(139, 76, 255, 0.3)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--accent)", flexShrink: 0 }}>
            <Scale size={24} />
          </div>
          <div style={{ flex: 1, minWidth: "260px" }}>
            <h3 style={{ fontSize: "16px", color: "#fff", margin: "0 0 6px 0", fontWeight: 700 }}>
              Need to Report Staff Abuse or File a Ticket Dispute?
            </h3>
            <p style={{ fontSize: "13px", color: "var(--text-soft)", lineHeight: 1.6, margin: "0 0 16px 0" }}>
              SyncInk is dedicated to fair, impartial customer support. If you experienced misconduct by a staff member, or were unfairly blacklisted from opening tickets, join our official Discord server and open an Owner-Escalation ticket.
            </p>
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <a
                href={SUPPORT_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="action-button tone-primary"
                style={{ textDecoration: "none", padding: "10px 18px", fontSize: "13px" }}
              >
                <MessageSquare size={16} /> Open Discord Escalation
              </a>
              <Link
                href="/dashboard/tickets/privacy"
                className="action-button tone-secondary"
                style={{ textDecoration: "none", padding: "10px 18px", fontSize: "13px" }}
              >
                <Lock size={16} /> View Privacy Policy
              </Link>
              <Link
                href="/dashboard/tickets/terms"
                className="action-button tone-secondary"
                style={{ textDecoration: "none", padding: "10px 18px", fontSize: "13px" }}
              >
                <Scale size={16} /> View Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </section>
    </TicketMarketingFrame>
  );
}
