"use client";

import React from "react";
import { Shield, Lock, Eye, Database, Trash2, CheckCircle2, MessageSquare, ExternalLink } from "lucide-react";
import { TicketMarketingFrame } from "@/components/TicketMarketingFrame";

const SUPPORT_URL = "https://discord.gg/rB6gNZaK9u";

const privacySections = [
  {
    id: "collect",
    icon: Database,
    title: "Information We Collect",
    badge: "Limited Scope",
    takeaway: "We only store data strictly necessary for ticket workflows and user authentication.",
    body: [
      "Account Identification: When authenticating via Discord OAuth2, we receive your Discord User ID, username, global display name, and avatar hash to verify your identity and server permissions.",
      "Server & Role Configurations: We store Guild IDs, channel destination mappings, category names, hex embed preferences, and staff role IDs configured by administrators.",
      "Ticket Records & Transcripts: Upon ticket creation, we log the ticket ID, creator ID, channel ID, and timestamps. When closed, full HTML transcripts of messages, attachments, and staff interactions are encrypted and archived for server audit purposes."
    ]
  },
  {
    id: "usage",
    icon: Eye,
    title: "How Your Information Is Used",
    badge: "Zero Ad Selling",
    takeaway: "Your data is never sold, monetized, or shared with third-party advertisers.",
    body: [
      "To provide core automated ticket management, category routing, and staff notification pings.",
      "To render live transcripts and historical statistics inside the private authorized server web dashboard.",
      "To enforce role-based access tiers so only designated administrators and support agents can view confidential support tickets."
    ]
  },
  {
    id: "security",
    icon: Lock,
    title: "Data Storage & Security Standards",
    badge: "Encrypted & Restricted",
    takeaway: "Enterprise-grade MongoDB clusters with restricted VPC access.",
    body: [
      "Database Security: All records are maintained in isolated database clusters protected with multi-layered authentication, IP whitelisting, and encryption at rest.",
      "Access Control: Web dashboard sessions are secured with signed HTTP-only cookies and cryptographic Discord OAuth2 verification.",
      "Transcript Confidentiality: Transcripts are accessible only by authorized staff members of the originating Discord server."
    ]
  },
  {
    id: "removal",
    icon: Trash2,
    title: "Data Retention & Deletion Rights",
    badge: "User Controlled",
    takeaway: "Complete deletion of all server tickets and configs upon request.",
    body: [
      "Bot Removal: If SyncInk Ticket is removed or kicked from your Discord server, your ticket data can be automatically queued for deletion.",
      "Manual Purge Requests: Server owners can request immediate, permanent deletion of all stored transcripts, activity logs, and configurations by opening a support ticket in our official Discord server."
    ]
  }
];

export default function DedicatedPrivacyPage() {
  return (
    <TicketMarketingFrame
      active="privacy"
      eyebrow="Legal & Privacy"
      title="SyncInk Ticket Privacy Policy"
      description="We believe in total transparency. Here is a clear breakdown of the exact data we collect, how it is safeguarded, and how you retain complete control over your server records."
      actions={[
        { label: "Open Dashboard", to: "/dashboard/tickets", tone: "primary" },
        { label: "Discord Support Server", href: SUPPORT_URL, external: true, tone: "secondary" }
      ]}
    >
      {/* Quick Navigation Anchor Pills */}
      <div className="mk-filter-pills" style={{ justifyContent: "center", marginBottom: "24px" }}>
        {privacySections.map((sec) => (
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

      <section className="mk-panel">
        <div className="mk-legal-copy">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "12px",
              borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
              paddingBottom: "16px"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <Shield size={20} style={{ color: "var(--accent)" }} />
              <span style={{ fontSize: "14px", color: "#fff", fontWeight: 600 }}>SyncInk Privacy Commitment</span>
            </div>
            <span className="mk-legal-updated" style={{ margin: 0 }}>Effective Date: October 2026</span>
          </div>

          {privacySections.map((section, index) => {
            const Icon = section.icon;
            return (
              <div key={section.id} id={section.id} className="mk-legal-section" style={{ scrollMarginTop: "100px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px", marginBottom: "12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div className="mk-card-icon" style={{ width: "34px", height: "34px", marginBottom: 0, borderRadius: "10px" }}>
                      <Icon size={16} />
                    </div>
                    <h2 style={{ fontSize: "17px", color: "#fff", margin: 0 }}>
                      {index + 1}. {section.title}
                    </h2>
                  </div>
                  <span className="mk-command-badge">{section.badge}</span>
                </div>

                {/* Summary Takeaway Callout */}
                <div
                  style={{
                    padding: "10px 14px",
                    borderRadius: "12px",
                    background: "rgba(139, 76, 255, 0.08)",
                    border: "1px solid rgba(139, 76, 255, 0.2)",
                    fontSize: "12.5px",
                    color: "#e2d9f3",
                    marginBottom: "14px"
                  }}
                >
                  <strong style={{ color: "var(--accent)" }}>Key Takeaway: </strong>
                  {section.takeaway}
                </div>

                {section.body.map((paragraph, pIdx) => (
                  <p key={pIdx} style={{ fontSize: "13px", color: "var(--text-soft)", lineHeight: 1.7, marginBottom: "10px" }}>
                    {paragraph}
                  </p>
                ))}
              </div>
            );
          })}

          {/* Direct Data Removal Request Box */}
          <div className="mk-support-cta" style={{ borderRadius: "18px", marginTop: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
              <Trash2 size={20} style={{ color: "#ef4444" }} />
              <h3 style={{ margin: 0, fontSize: "16px", color: "#fff" }}>Request Server Data Purge</h3>
            </div>
            <p style={{ fontSize: "13px", color: "var(--text-soft)", marginBottom: "16px", lineHeight: 1.6 }}>
              Need to permanently purge all transcripts, interaction logs, and server settings for your Discord community? Server owners can trigger an immediate, verified purge through our support team.
            </p>
            <a
              href={SUPPORT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mk-action mk-action-secondary"
              style={{ display: "inline-flex", alignItems: "center", gap: "8px", borderColor: "rgba(239, 68, 68, 0.3)" }}
            >
              <ExternalLink size={16} /> Open Data Removal Ticket on Discord
            </a>
          </div>
        </div>
      </section>
    </TicketMarketingFrame>
  );
}
