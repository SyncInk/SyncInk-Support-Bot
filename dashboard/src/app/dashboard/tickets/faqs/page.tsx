"use client";

import React, { useState } from "react";
import { ChevronDown, Search, HelpCircle, MessageSquare, Shield, CheckCircle2 } from "lucide-react";
import { TicketMarketingFrame } from "@/components/TicketMarketingFrame";

const SUPPORT_URL = "https://discord.gg/rB6gNZaK9u";

const FAQS = [
  {
    category: "setup",
    question: "How do I set up SyncInk Ticket for the first time?",
    answer: "Invite the bot with Administrator permissions to your Discord server. Open the web dashboard, sign in with Discord, select your server, configure your desired ticket categories, and click 'Deploy Ticket Panel' in the Ticket Panels tab to post the interactive panel to your support channel."
  },
  {
    category: "permissions",
    question: "What Discord permissions does the bot require?",
    answer: "The bot requires 'Manage Channels' (to create and archive private ticket rooms), 'Manage Roles / Overwrite Permissions' (to let ticket creators and support agents view the channels), 'Send Messages', 'Embed Links', and 'Attach Files' (for transcripts and log embeds)."
  },
  {
    category: "transcripts",
    question: "How do transcripts work, and why might they fail to appear?",
    answer: "Whenever a ticket is closed, SyncInk generates an encrypted transcript with timestamps, user avatars, and attached images. Transcripts are sent to your configured Transcript Channel and uploaded to the dashboard. If they do not appear, ensure the bot has permission to send messages and embed links in your designated transcripts channel."
  },
  {
    category: "customization",
    question: "Can I customize ticket categories, emojis, and roles?",
    answer: "Yes! You can add unlimited ticket categories, choose custom Discord emojis for dropdown choices, customize embed colors, and assign specific staff roles to each category so only designated team members receive pings."
  },
  {
    category: "dashboard",
    question: "Who is allowed to access and manage the web dashboard?",
    answer: "Dashboard access is strictly governed by Discord server permissions and tier mappings. By default, the Server Owner and members with Administrator privileges can configure all settings. Staff and Moderator roles can access ticket history and activity feeds without modifying sensitive configurations."
  },
  {
    category: "setup",
    question: "What happens if the bot restarts or my host goes offline?",
    answer: "All tickets, active sessions, configuration settings, and transcripts are permanently backed up in MongoDB. When the bot restarts or re-establishes its Discord WebSocket connection, all tickets resume automatically without data loss."
  },
  {
    category: "customization",
    question: "Can I customize the bot appearance and embed color?",
    answer: "Yes. In the 'Bot Profile' and 'Ticket Panels' tabs, you can customize the bot nickname for your specific server, set custom hex embed colors, change the header image, and tailor the greeting message."
  },
  {
    category: "transcripts",
    question: "Can community members view their closed ticket transcripts?",
    answer: "Yes! When a ticket is closed, the bot posts a direct 'View Online Transcript' link embed or can message the ticket creator with the transcript link."
  }
];

export default function DedicatedFaqsPage() {
  const [openIndices, setOpenIndices] = useState<number[]>([0]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const toggleIndex = (index: number) => {
    if (openIndices.includes(index)) {
      setOpenIndices(openIndices.filter((i) => i !== index));
    } else {
      setOpenIndices([...openIndices, index]);
    }
  };

  const expandAll = () => {
    setOpenIndices(FAQS.map((_, i) => i));
  };

  const collapseAll = () => {
    setOpenIndices([]);
  };

  const filteredFaqs = FAQS.filter((faq) => {
    const matchesCategory = categoryFilter === "all" || faq.category === categoryFilter;
    const matchesSearch =
      faq.question.toLowerCase().includes(search.toLowerCase()) ||
      faq.answer.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <TicketMarketingFrame
      active="faqs"
      eyebrow="Frequently Asked Questions"
      title="Everything you need to know"
      description="Quick, accurate answers to the questions Discord server owners, community managers, and support agents ask most about SyncInk Ticket."
      actions={[
        { label: "Open Dashboard", to: "/dashboard/tickets", tone: "primary" },
        { label: "Discord Support Server", href: SUPPORT_URL, external: true, tone: "secondary" }
      ]}
    >
      {/* Search Bar */}
      <div className="mk-search-bar" style={{ marginBottom: "20px" }}>
        <Search size={18} style={{ color: "var(--accent)", flexShrink: 0 }} />
        <input
          type="text"
          placeholder="Search questions by topic (e.g. transcripts, permissions, setup, categories)..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch("")}
            style={{ background: "none", border: "none", color: "rgba(255,255,255,0.5)", cursor: "pointer", fontSize: 12 }}
          >
            Clear
          </button>
        )}
      </div>

      {/* Category Filters and Controls */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 20 }}>
        <div className="mk-filter-pills" style={{ marginBottom: 0 }}>
          {[
            { id: "all", label: `All Topics (${FAQS.length})` },
            { id: "setup", label: "Setup & Config" },
            { id: "permissions", label: "Permissions" },
            { id: "transcripts", label: "Transcripts" },
            { id: "customization", label: "Customization" },
            { id: "dashboard", label: "Dashboard Access" }
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`mk-filter-pill ${categoryFilter === tab.id ? "active" : ""}`}
              onClick={() => setCategoryFilter(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button type="button" onClick={expandAll} className="mk-text-btn" style={{ background: "none", border: "none", color: "var(--accent)", cursor: "pointer", fontSize: 12 }}>
            Expand All
          </button>
          <span style={{ color: "rgba(255,255,255,0.2)" }}>•</span>
          <button type="button" onClick={collapseAll} className="mk-text-btn" style={{ background: "none", border: "none", color: "rgba(255,255,255,0.6)", cursor: "pointer", fontSize: 12 }}>
            Collapse All
          </button>
        </div>
      </div>

      {/* FAQ Accordion List */}
      <div className="mk-faq-list" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {filteredFaqs.length === 0 ? (
          <div className="mk-panel" style={{ textAlign: "center", padding: "40px 20px" }}>
            <HelpCircle size={32} style={{ color: "var(--text-muted)", margin: "0 auto 12px" }} />
            <h3 style={{ fontSize: "16px", color: "#fff", marginBottom: 6 }}>No questions match your search</h3>
            <p style={{ fontSize: "13px", color: "var(--text-soft)", margin: 0 }}>
              Try searching with different keywords or ask our team in the official support server.
            </p>
          </div>
        ) : (
          filteredFaqs.map((faq, index) => {
            const isOpen = openIndices.includes(index);
            return (
              <div
                key={faq.question}
                className={`mk-faq-item ${isOpen ? "open" : ""}`}
                style={{
                  background: "rgba(10, 12, 22, 0.7)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  borderRadius: "16px",
                  overflow: "hidden",
                  transition: "all 0.2s"
                }}
              >
                <button
                  type="button"
                  className="mk-faq-question"
                  onClick={() => toggleIndex(index)}
                  style={{
                    width: "100%",
                    padding: "18px 22px",
                    background: "transparent",
                    border: "none",
                    color: "white",
                    fontSize: "15px",
                    fontWeight: 600,
                    textAlign: "left",
                    cursor: "pointer",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "16px"
                  }}
                >
                  <span>{faq.question}</span>
                  <ChevronDown
                    size={18}
                    style={{
                      color: "var(--accent)",
                      flexShrink: 0,
                      transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                      transition: "transform 0.2s ease"
                    }}
                  />
                </button>
                {isOpen && (
                  <div
                    className="mk-faq-answer"
                    style={{
                      padding: "0 22px 20px",
                      color: "var(--text-soft)",
                      fontSize: "13.5px",
                      lineHeight: 1.7,
                      borderTop: "1px solid rgba(255, 255, 255, 0.05)",
                      paddingTop: "14px"
                    }}
                  >
                    <p style={{ margin: 0 }}>{faq.answer}</p>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Still Have Questions Box */}
      <div className="mk-support-cta" style={{ borderRadius: "18px", marginTop: "32px" }}>
        <h3 style={{ margin: "0 0 8px", fontSize: "16px", color: "#fff" }}>Still have questions?</h3>
        <p style={{ fontSize: "13px", color: "var(--text-soft)", marginBottom: "16px", lineHeight: 1.6 }}>
          Can’t find the answer you’re looking for? Our community support agents and developers are active 24/7 on Discord.
        </p>
        <a
          href={SUPPORT_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mk-action mk-action-primary"
          style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}
        >
          <MessageSquare size={16} /> Ask on Discord Support Server
        </a>
      </div>
    </TicketMarketingFrame>
  );
}
