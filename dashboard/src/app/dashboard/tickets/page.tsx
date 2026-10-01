"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  PanelsTopLeft,
  MessageSquareMore,
  ArrowRightLeft,
  ClipboardList,
  FileText,
  ChartColumnBig,
  ScrollText,
  Shield,
  Activity,
  ChevronRight,
  ExternalLink,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  User,
  Plus,
  Trash2,
  Sliders,
  Send,
  Lock,
  Layers,
  Sparkles,
} from "lucide-react";
import { PublicNavbar } from "@/components/PublicNavbar";

// Ticket Category Definition
interface TicketCategory {
  id: string;
  name: string;
  emojiTag: string;
  description: string;
  claimRole: string;
  priority: "HIGH" | "MEDIUM" | "LOW";
  modalEnabled: boolean;
}

export default function TicketDashboardPage() {
  const [activeTab, setActiveTab] = useState<
    "overview" | "panels" | "categories" | "transcripts" | "logs" | "analytics"
  >("overview");

  const [refreshing, setRefreshing] = useState(false);
  const [panelChannel, setPanelChannel] = useState("#support-tickets");
  const [panelTitle, setPanelTitle] = useState("SyncInk Official Support Hub");
  const [panelDescription, setPanelDescription] = useState(
    "Need assistance with SyncInk products, security, or server issues? Select a department below to create a private support thread."
  );
  const [transcriptSearch, setTranscriptSearch] = useState("");

  // Categories with the actual custom emojis requested
  const [categories, setCategories] = useState<TicketCategory[]>([
    {
      id: "staffabuse",
      name: "Staff Abuse",
      emojiTag: "<:staffabuse:1553532862945562754>",
      description: "Reports of abusive behavior or rule violations by staff members.",
      claimRole: "Management / Server Owner",
      priority: "HIGH",
      modalEnabled: true,
    },
    {
      id: "productsupport",
      name: "Product Support",
      emojiTag: "<:SyncProductSupport:1553532855278116956>",
      description: "Assistance with SyncInk bots, setup, configuration, or subscriptions.",
      claimRole: "Support Specialist",
      priority: "MEDIUM",
      modalEnabled: true,
    },
    {
      id: "bugreport",
      name: "Bug Report",
      emojiTag: "<:bugreport:1553532860408012850>",
      description: "Submit reproducible bugs or glitches found within SyncInk services.",
      claimRole: "Development Team",
      priority: "HIGH",
      modalEnabled: true,
    },
    {
      id: "accsvr",
      name: "Account & Server",
      emojiTag: "<:accsvr:1553532858058936424>",
      description: "Assistance with member permissions, roles, verification, or server sync.",
      claimRole: "Moderator",
      priority: "MEDIUM",
      modalEnabled: true,
    },
    {
      id: "partnership",
      name: "Partnership / Business",
      emojiTag: "<:SyncPartnership:1553532869950046340>",
      description: "Cross-server promotions, sponsorships, and business inquiries.",
      claimRole: "Outreach & Admin",
      priority: "LOW",
      modalEnabled: true,
    },
    {
      id: "others",
      name: "Other Inquiries",
      emojiTag: "<:others:1553533697364598814>",
      description: "General questions and miscellaneous community assistance.",
      claimRole: "General Support",
      priority: "LOW",
      modalEnabled: false,
    },
  ]);

  const mockTranscripts = [
    {
      id: "ticket-1049",
      user: "AlexG#0001",
      category: "Product Support",
      claimedBy: "StaffBot / Moderator",
      closedAt: "12 minutes ago",
      duration: "14m 20s",
      messages: 24,
    },
    {
      id: "ticket-1048",
      user: "CryptoNova",
      category: "Bug Report",
      claimedBy: "SyncInk Dev",
      closedAt: "1 hour ago",
      duration: "8m 05s",
      messages: 18,
    },
    {
      id: "ticket-1047",
      user: "Vortex99",
      category: "Account & Server",
      claimedBy: "Moderator",
      closedAt: "3 hours ago",
      duration: "21m 45s",
      messages: 32,
    },
    {
      id: "ticket-1046",
      user: "NightOwl",
      category: "Staff Abuse",
      claimedBy: "Server Owner",
      closedAt: "5 hours ago",
      duration: "45m 12s",
      messages: 56,
    },
  ];

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  };

  const filteredTranscripts = mockTranscripts.filter(
    (t) =>
      t.id.toLowerCase().includes(transcriptSearch.toLowerCase()) ||
      t.user.toLowerCase().includes(transcriptSearch.toLowerCase()) ||
      t.category.toLowerCase().includes(transcriptSearch.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#060812] text-slate-100 flex flex-col font-sans selection:bg-brand-purple selection:text-white">
      <PublicNavbar />

      {/* Top Breadcrumb & Live Sync Header */}
      <div className="border-b border-white/[0.08] bg-[#0c101c]/80 backdrop-blur-xl sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="text-xs font-semibold text-slate-400 hover:text-white transition-colors"
            >
              &larr; Bot Console Hub
            </Link>
            <span className="text-slate-600">/</span>
            <div className="flex items-center gap-2">
              <img
                src="/ticket-logo.png"
                alt="Ticket Bot"
                className="w-5 h-5 rounded-md object-contain"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = "none";
                }}
              />
              <span className="font-extrabold text-white text-sm">
                SyncInk Ticket Bot Dashboard
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 uppercase tracking-wider">
                Dedicated
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Real-Time Bot Sync: Connected</span>
            </div>

            <button
              onClick={handleRefresh}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-all"
              title="Refresh Ticket State"
            >
              <RefreshCw
                className={`w-4 h-4 ${refreshing ? "animate-spin text-purple-400" : ""}`}
              />
            </button>

            <a
              href="https://syncink-ticket-bot.up.railway.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition-all shadow-[0_0_15px_rgba(147,51,234,0.35)] flex items-center gap-1.5"
            >
              <span>Sync with Railway Web Panel</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Dashboard Navigation Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex gap-1 overflow-x-auto scrollbar-none py-1 border-t border-white/[0.04]">
          {[
            { id: "overview", label: "Overview", icon: LayoutDashboard },
            { id: "panels", label: "Ticket Panels", icon: PanelsTopLeft },
            { id: "categories", label: "Categories & Emojis", icon: MessageSquareMore },
            { id: "transcripts", label: "Transcripts Archive", icon: FileText },
            { id: "logs", label: "Real-Time Logs", icon: ClipboardList },
            { id: "analytics", label: "Analytics", icon: ChartColumnBig },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                  isActive
                    ? "bg-purple-600/20 text-white border border-purple-500/40 shadow-[0_0_12px_rgba(147,51,234,0.2)]"
                    : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]"
                }`}
              >
                <Icon
                  className={`w-3.5 h-3.5 ${
                    isActive ? "text-purple-400" : "text-slate-500"
                  }`}
                />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* OVERVIEW TAB */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Quick Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-[#0e121f] border border-white/10 shadow-lg">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Total Tickets Handled
                </span>
                <div className="text-3xl font-black text-white mt-1">25,482</div>
                <div className="text-xs text-emerald-400 font-semibold mt-1 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>99.4% resolution rate</span>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-[#0e121f] border border-white/10 shadow-lg">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Open Private Threads
                </span>
                <div className="text-3xl font-black text-purple-400 mt-1">12</div>
                <div className="text-xs text-slate-400 mt-1">Currently active</div>
              </div>

              <div className="p-5 rounded-2xl bg-[#0e121f] border border-white/10 shadow-lg">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Average First Response
                </span>
                <div className="text-3xl font-black text-accent-cyan mt-1">1m 48s</div>
                <div className="text-xs text-slate-400 mt-1">Velocity across staff</div>
              </div>

              <div className="p-5 rounded-2xl bg-[#0e121f] border border-white/10 shadow-lg">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Transcripts Archived
                </span>
                <div className="text-3xl font-black text-amber-400 mt-1">100%</div>
                <div className="text-xs text-slate-400 mt-1">Encrypted HTML logs</div>
              </div>
            </div>

            {/* Architecture Banner */}
            <div className="p-6 rounded-2xl bg-gradient-to-r from-purple-950/40 via-[#0e121f] to-[#120e24] border border-purple-500/30 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center shrink-0 text-purple-400">
                  <Lock className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Private Threads Operating Mode
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 max-w-xl mt-1 leading-relaxed">
                    Zero public channel pollution. When a user opens a ticket, SyncInk Ticket Bot creates an encrypted private thread directly inside your designated support channel, accessible only to the author and assigned staff.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3 py-1.5 rounded-xl bg-purple-600/20 border border-purple-500/40 text-purple-300 text-xs font-bold">
                  Auto-Claim: ON
                </span>
                <span className="px-3 py-1.5 rounded-xl bg-purple-600/20 border border-purple-500/40 text-purple-300 text-xs font-bold">
                  Mentions: ON
                </span>
              </div>
            </div>

            {/* Live Ticket Categories Grid */}
            <div className="rounded-2xl bg-[#0e121f] border border-white/10 overflow-hidden shadow-lg">
              <div className="p-5 border-b border-white/[0.08] flex items-center justify-between">
                <div>
                  <h4 className="text-base font-bold text-white">
                    Configured Ticket Categories ({categories.length})
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Emoji mappings, modal prompts, and auto-assignment roles.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab("categories")}
                  className="text-xs font-bold text-purple-400 hover:text-purple-300 transition-colors"
                >
                  Manage All &rarr;
                </button>
              </div>

              <div className="divide-y divide-white/[0.06]">
                {categories.map((cat) => (
                  <div
                    key={cat.id}
                    className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="px-2.5 py-1.5 rounded-xl bg-white/5 border border-white/10 font-mono text-xs font-bold text-purple-300">
                        {cat.emojiTag}
                      </div>
                      <div>
                        <div className="font-bold text-white text-sm">{cat.name}</div>
                        <div className="text-xs text-slate-400 mt-0.5">
                          {cat.description}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-400">
                        Assigned:{" "}
                        <strong className="text-slate-200">{cat.claimRole}</strong>
                      </span>
                      <span
                        className={`px-2 py-0.5 text-[10px] font-bold rounded-md uppercase tracking-wider ${
                          cat.priority === "HIGH"
                            ? "bg-red-500/15 text-red-400 border border-red-500/30"
                            : "bg-blue-500/15 text-blue-400 border border-blue-500/30"
                        }`}
                      >
                        {cat.priority}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TICKET PANELS TAB */}
        {activeTab === "panels" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="p-6 rounded-2xl bg-[#0e121f] border border-white/10 shadow-lg space-y-5">
              <div className="border-b border-white/[0.08] pb-4">
                <h3 className="text-base font-bold text-white">
                  Deploy Interactive Ticket Panel
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Configure the message embed and buttons that will appear in your ticket channel.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                  Target Channel
                </label>
                <input
                  type="text"
                  value={panelChannel}
                  onChange={(e) => setPanelChannel(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-sm focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                  Embed Title
                </label>
                <input
                  type="text"
                  value={panelTitle}
                  onChange={(e) => setPanelTitle(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-sm focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                  Embed Description
                </label>
                <textarea
                  rows={3}
                  value={panelDescription}
                  onChange={(e) => setPanelDescription(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-sm focus:outline-none focus:border-purple-500 resize-y"
                />
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => alert(`Panel deployed to ${panelChannel}!`)}
                  className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm shadow-[0_0_20px_rgba(147,51,234,0.4)] transition-all flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  <span>Send Panel to Discord Channel</span>
                </button>
              </div>
            </div>

            {/* Live Discord Embed Preview */}
            <div className="p-6 rounded-2xl bg-[#0e121f] border border-white/10 shadow-lg space-y-4">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Live Discord Embed Preview
              </div>

              <div className="p-4 rounded-xl bg-[#2b2d31] border-l-4 border-purple-500 space-y-3 font-sans">
                <div className="font-bold text-white text-base">{panelTitle}</div>
                <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {panelDescription}
                </div>

                <div className="pt-2 space-y-2">
                  <div className="text-xs font-bold text-slate-400">Select Department:</div>
                  <div className="grid grid-cols-2 gap-2">
                    {categories.map((c) => (
                      <div
                        key={c.id}
                        className="px-3 py-2 rounded-lg bg-[#313338] hover:bg-[#383a40] text-slate-200 text-xs font-medium border border-white/5 flex items-center gap-2 cursor-pointer transition-colors"
                      >
                        <span className="font-mono text-purple-400 text-[10px]">
                          {c.id}
                        </span>
                        <span className="truncate">{c.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CATEGORIES TAB */}
        {activeTab === "categories" && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl bg-[#0e121f] border border-white/10 shadow-lg">
              <div>
                <h3 className="text-base font-bold text-white">
                  Ticket Category Customization
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Configure custom server emojis and interactive question modals.
                </p>
              </div>

              <a
                href="https://syncink-ticket-bot.up.railway.app/categories"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-2"
              >
                <span>Edit on Railway Panel</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className="p-5 rounded-2xl bg-[#0e121f] border border-white/10 shadow-lg space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-purple-300 font-bold">
                      {cat.emojiTag}
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                        cat.priority === "HIGH"
                          ? "bg-red-500/15 text-red-400 border border-red-500/30"
                          : "bg-blue-500/15 text-blue-400 border border-blue-500/30"
                      }`}
                    >
                      {cat.priority} Priority
                    </span>
                  </div>

                  <div>
                    <h4 className="font-bold text-white text-base">{cat.name}</h4>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      {cat.description}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-xs text-slate-400">
                    <span>
                      Staff Handler: <strong className="text-slate-200">{cat.claimRole}</strong>
                    </span>
                    <span className="text-emerald-400 font-semibold">
                      {cat.modalEnabled ? "Modal Questionnaire: ON" : "Direct Open"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TRANSCRIPTS TAB */}
        {activeTab === "transcripts" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-5 rounded-2xl bg-[#0e121f] border border-white/10 shadow-lg">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search transcripts by User, Ticket ID, or Category..."
                  value={transcriptSearch}
                  onChange={(e) => setTranscriptSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="text-xs text-slate-400 font-medium">
                Showing {filteredTranscripts.length} archived tickets
              </div>
            </div>

            <div className="rounded-2xl bg-[#0e121f] border border-white/10 overflow-hidden shadow-lg">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-white/[0.02] border-b border-white/[0.08] text-slate-400 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="py-3.5 px-4">Ticket</th>
                      <th className="py-3.5 px-4">Author</th>
                      <th className="py-3.5 px-4">Category</th>
                      <th className="py-3.5 px-4">Claimed By</th>
                      <th className="py-3.5 px-4">Duration</th>
                      <th className="py-3.5 px-4">Messages</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {filteredTranscripts.map((t) => (
                      <tr key={t.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-purple-400">
                          {t.id}
                        </td>
                        <td className="py-3 px-4 font-medium text-white">{t.user}</td>
                        <td className="py-3 px-4 text-slate-300">{t.category}</td>
                        <td className="py-3 px-4 text-slate-400">{t.claimedBy}</td>
                        <td className="py-3 px-4 font-mono text-slate-400">{t.duration}</td>
                        <td className="py-3 px-4 font-mono text-slate-300">{t.messages}</td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() =>
                              alert(
                                `Transcript for ${t.id} is securely stored in MongoDB and available via encrypted HTML download.`
                              )
                            }
                            className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-purple-300 font-bold text-[11px] border border-white/10 transition-all"
                          >
                            View HTML
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* LOGS TAB */}
        {activeTab === "logs" && (
          <div className="p-6 rounded-2xl bg-[#0e121f] border border-white/10 shadow-lg space-y-4">
            <h3 className="text-base font-bold text-white">Live Event Audit Feed</h3>
            <p className="text-xs text-slate-400">
              Live lifecycle events emitted by SyncInk Ticket Bot over WebSocket.
            </p>

            <div className="space-y-2.5 font-mono text-xs">
              <div className="p-3 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between">
                <span className="text-emerald-400">[TICKET_OPEN] AlexG#0001 created private thread #ticket-1049</span>
                <span className="text-slate-500 text-[11px]">12m ago</span>
              </div>
              <div className="p-3 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between">
                <span className="text-purple-400">[AUTO_CLAIM] StaffBot automatically assigned to #ticket-1049</span>
                <span className="text-slate-500 text-[11px]">11m ago</span>
              </div>
              <div className="p-3 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between">
                <span className="text-amber-400">[TICKET_CLOSE] #ticket-1048 closed by SyncInk Dev (HTML Generated)</span>
                <span className="text-slate-500 text-[11px]">1h ago</span>
              </div>
              <div className="p-3 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between">
                <span className="text-blue-400">[CATEGORY_TRANSFER] #ticket-1046 transferred to Management</span>
                <span className="text-slate-500 text-[11px]">5h ago</span>
              </div>
            </div>
          </div>
        )}

        {/* ANALYTICS TAB */}
        {activeTab === "analytics" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-[#0e121f] border border-white/10 shadow-lg space-y-2">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Peak Hour</div>
              <div className="text-2xl font-black text-white">18:00 - 22:00 UTC</div>
              <p className="text-xs text-slate-400">Highest ticket creation velocity.</p>
            </div>
            <div className="p-6 rounded-2xl bg-[#0e121f] border border-white/10 shadow-lg space-y-2">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Fastest Handler</div>
              <div className="text-2xl font-black text-purple-400">StaffBot</div>
              <p className="text-xs text-slate-400">Avg resolution time: 4m 12s.</p>
            </div>
            <div className="p-6 rounded-2xl bg-[#0e121f] border border-white/10 shadow-lg space-y-2">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Retention Status</div>
              <div className="text-2xl font-black text-emerald-400">100% Retained</div>
              <p className="text-xs text-slate-400">0 transcripts lost or deleted.</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
