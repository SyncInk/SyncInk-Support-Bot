"use client";

import React from "react";
import { FileText, ShieldAlert, Scale, RefreshCw, MessageSquare, ExternalLink } from "lucide-react";
import { TicketMarketingFrame } from "@/components/TicketMarketingFrame";

const SUPPORT_URL = "https://discord.gg/rB6gNZaK9u";

const termsSections = [
  {
    id: "acceptance",
    icon: Scale,
    title: "Acceptance of Terms",
    badge: "Agreement",
    takeaway: "Using SyncInk Ticket or accessing the dashboard implies full agreement with these terms.",
    body: "By inviting SyncInk Ticket to your Discord server or using the web dashboard, you enter into a binding agreement to adhere to these Terms of Service, all applicable laws, and the official Discord Developer Terms of Service and Community Guidelines."
  },
  {
    id: "conduct",
    icon: ShieldAlert,
    title: "Responsible Use & Conduct Rules",
    badge: "Fair Use",
    takeaway: "Zero tolerance for automated spamming, harassment, or infrastructure abuse.",
    body: "You agree to use SyncInk Ticket exclusively for legitimate customer service, community moderation, and support operations. You must not attempt to reverse engineer backend APIs, flood tickets through unauthorized automation, bypass rate limits, or use the service to facilitate illegal activities."
  },
  {
    id: "availability",
    icon: RefreshCw,
    title: "Service Availability & SLA",
    badge: "99.9% Target",
    takeaway: "We maintain high availability but scheduled maintenance may occasionally occur.",
    body: "We strive to provide continuous 24/7 reliability across all bot clusters and web dashboard endpoints. However, temporary interruptions may occur due to scheduled infrastructure upgrades, Discord Gateway API outages, or cloud provider maintenance events."
  },
  {
    id: "termination",
    icon: ShieldAlert,
    title: "Suspension & Termination of Access",
    badge: "Policy Enforcement",
    takeaway: "Abusive servers or malicious actors will be blocked from dashboard and bot services.",
    body: "SyncInk reserves the right to suspend or terminate bot operation and dashboard access for any server or user found violating Discord Community Guidelines, engaging in API exploitation, or utilizing the bot to harass community members."
  },
  {
    id: "modifications",
    icon: FileText,
    title: "Modifications to Terms",
    badge: "Updated Periodically",
    takeaway: "Notice of material updates is communicated through official channels.",
    body: "We may periodically update these Terms to reflect technical improvements or legal requirements. Continued use of the bot or dashboard following any revisions constitutes full acceptance of the updated terms."
  },
  {
    id: "contact",
    icon: MessageSquare,
    title: "Support & Inquiries",
    badge: "Direct Assistance",
    takeaway: "Our community support team is always available in the official Discord server.",
    body: "If you have any questions regarding these Terms or need clarification regarding commercial use in large enterprise Discord communities, please reach out to us via our official Discord Support Server."
  }
];

export default function DedicatedTermsPage() {
  return (
    <TicketMarketingFrame
      active="terms"
      eyebrow="Legal & Terms"
      title="SyncInk Ticket Terms of Service"
      description="Clear, sensible guidelines governing the responsible use of the SyncInk Ticket bot, backend APIs, and web management dashboard."
      actions={[
        { label: "Open Dashboard", to: "/dashboard/tickets", tone: "primary" },
        { label: "Discord Support Server", href: SUPPORT_URL, external: true, tone: "secondary" }
      ]}
    >
      {/* Quick Jump Pills */}
      <div className="mk-filter-pills" style={{ justifyContent: "center", marginBottom: "24px" }}>
        {termsSections.map((sec) => (
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
              <FileText size={20} style={{ color: "var(--accent)" }} />
              <span style={{ fontSize: "14px", color: "#fff", fontWeight: 600 }}>SyncInk Service Agreement</span>
            </div>
            <span className="mk-legal-updated" style={{ margin: 0 }}>Effective Date: October 2026</span>
          </div>

          {termsSections.map((section, index) => {
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

                <p style={{ fontSize: "13px", color: "var(--text-soft)", lineHeight: 1.7, margin: 0 }}>
                  {section.body}
                </p>
              </div>
            );
          })}

          {/* Questions Card */}
          <div className="mk-support-cta" style={{ borderRadius: "18px", marginTop: "24px" }}>
            <h3 style={{ margin: "0 0 8px", fontSize: "16px", color: "#fff" }}>Have questions regarding these terms?</h3>
            <p style={{ fontSize: "13px", color: "var(--text-soft)", marginBottom: "16px", lineHeight: 1.6 }}>
              Our team is available on Discord to address any policy or licensing inquiries for your server.
            </p>
            <a
              href={SUPPORT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mk-action mk-action-primary"
              style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}
            >
              <MessageSquare size={16} /> Contact Legal Support on Discord
            </a>
          </div>
        </div>
      </section>
    </TicketMarketingFrame>
  );
}
