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
      {/* Search Bar matching /rules */}
      <div className="max-w-2xl mx-auto relative mb-6">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search questions by topic (e.g. transcripts, permissions, setup, categories)..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-[#121622] border border-white/10 rounded-xl pl-10 pr-10 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/60 focus:ring-1 focus:ring-purple-500/60 transition-all"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch("")}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
          >
            Clear
          </button>
        )}
      </div>

      {/* Category Filters and Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-3 mb-6">
        <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
          {[
            { id: "all", label: `All Topics (${FAQS.length})` },
            { id: "setup", label: "Setup & Config" },
            { id: "permissions", label: "Permissions" },
            { id: "transcripts", label: "Transcripts" },
            { id: "customization", label: "Customization" },
            { id: "dashboard", label: "Dashboard Access" }
          ].map((tab) => {
            const isActive = categoryFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 border ${
                  isActive
                    ? "bg-purple-600/15 text-white border-purple-500/30 shadow-[0_0_12px_rgba(139,76,255,0.15)]"
                    : "text-slate-300 hover:text-white hover:bg-white/[0.05] border-transparent"
                }`}
                onClick={() => setCategoryFilter(tab.id)}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400 self-end sm:self-auto">
          <button type="button" onClick={expandAll} className="hover:text-purple-400 transition-colors">
            Expand All
          </button>
          <span>•</span>
          <button type="button" onClick={collapseAll} className="hover:text-slate-200 transition-colors">
            Collapse All
          </button>
        </div>
      </div>

      {/* FAQ Accordion List */}
      <div className="space-y-3">
        {filteredFaqs.length === 0 ? (
          <div className="rounded-2xl border border-white/[0.08] bg-[#0e121d] p-10 text-center">
            <HelpCircle className="h-8 w-8 text-slate-500 mx-auto mb-3" />
            <h3 className="text-base font-bold text-white mb-1.5">No questions match your search</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Try searching with different keywords or ask our team in the official support server.
            </p>
          </div>
        ) : (
          filteredFaqs.map((faq, index) => {
            const isOpen = openIndices.includes(index);
            return (
              <div
                key={faq.question}
                className="group rounded-2xl border border-white/[0.08] bg-[#0e121d] hover:border-purple-500/30 transition-all overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => toggleIndex(index)}
                  className="w-full px-5 py-4 text-left flex justify-between items-center gap-4 text-white text-sm font-bold group-hover:text-purple-300 transition-colors"
                >
                  <span>{faq.question}</span>
                  <ChevronDown
                    className={`h-4 w-4 text-purple-400 shrink-0 transition-transform duration-200 ${
                      isOpen ? "rotate-180" : "rotate-0"
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 pt-3 border-t border-white/[0.06] text-xs sm:text-sm text-slate-300 leading-relaxed">
                    <p>{faq.answer}</p>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Still Have Questions Box */}
      <div className="p-6 rounded-2xl bg-[#0e121d] border border-white/[0.08] hover:border-purple-500/30 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 mt-8">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-purple-300 font-bold text-sm sm:text-base">
            <MessageSquare className="w-5 h-5 text-purple-400" />
            <span>Still Have Questions?</span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
            Can’t find the answer you’re looking for? Our community support agents and developers are active on Discord.
          </p>
        </div>
        <a
          href={SUPPORT_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs sm:text-sm font-bold text-white transition-all shrink-0 shadow-lg shadow-purple-950/50 border border-purple-400/40"
        >
          <span>Ask on Discord Support Server</span>
          <MessageSquare className="w-4 h-4" />
        </a>
      </div>
    </TicketMarketingFrame>
  );
}
