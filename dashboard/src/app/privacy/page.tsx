"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Headphones, Ticket, Lock, CheckCircle2, Database, EyeOff, Trash2 } from "lucide-react";
import { PublicNavbar } from "@/components/PublicNavbar";
import { PublicFooter } from "@/components/PublicFooter";

const BOTS = [
  {
    id: "support",
    name: "SyncInk Support Bot",
    icon: Shield,
    color: "text-brand-crimson",
    bgLight: "bg-brand-red/10",
    border: "border-brand-red/30",
    bgActive: "bg-brand-red/20",
    lastUpdated: "October 2026",
    sections: [
      {
        title: "1. Data Collection & Security",
        content: "The SyncInk Support Bot automatically collects server telemetry, user violation counts, and quarantine status strictly for the purpose of maintaining server security and defending against raid attacks."
      },
      {
        title: "2. Information We Monitor",
        content: "To perform its security duties, the Support Bot temporarily buffers:",
        points: [
          "Chat messages (for spam and NSFW detection) which are discarded immediately after analysis.",
          "Account creation dates and join velocities (to trigger anti-raid dampeners).",
          "Automod infraction logs and warning histories."
        ]
      },
      {
        title: "3. No Third-Party Selling",
        content: "We never sell your data, distribute personal information to third-party advertisers, or use your warning history for any purpose other than maintaining the safety of the official Support Server."
      },
      {
        title: "4. Data Deletion",
        content: "If you leave the Support Server, your warning points decay over time. Permanent bans are retained indefinitely in our security database to prevent evasion."
      }
    ]
  },
  {
    id: "ticket",
    name: "SyncInk Ticket Bot",
    icon: Ticket,
    color: "text-brand-purple",
    bgLight: "bg-purple-500/10",
    border: "border-purple-500/30",
    bgActive: "bg-purple-500/20",
    lastUpdated: "October 2026",
    sections: [
      {
        title: "1. Ticket Data & Transcripts",
        content: "The Ticket Bot is designed to securely manage private support inquiries. When a ticket is closed, the bot generates a secure HTML transcript of the conversation."
      },
      {
        title: "2. Encryption & Storage",
        content: "All transcripts are stored using AES-256 encryption. Only authorized server staff members with specific role permissions can decrypt and view these logs via the dashboard."
      },
      {
        title: "3. Data Retention",
        content: "We retain ticket data for server administrators to reference. However, server owners may configure automatic deletion policies to purge transcripts older than 30, 60, or 90 days."
      },
      {
        title: "4. Personal Identifiable Information (PII)",
        content: "We strongly advise against sharing passwords, credit cards, or sensitive PII in tickets. SyncInk is not responsible for data exposure caused by compromised server staff accounts."
      }
    ]
  },
  {
    id: "voice",
    name: "SyncInk Voice Bot",
    icon: Headphones,
    color: "text-cyan-400",
    bgLight: "bg-cyan-500/10",
    border: "border-cyan-500/30",
    bgActive: "bg-cyan-500/20",
    lastUpdated: "July 2026",
    sections: [
      {
        title: "1. Voice Channel Monitoring",
        content: "The Voice Bot does NOT record, listen to, or store any audio transmitted in the dynamic voice channels. It strictly manages the creation and deletion of the channels themselves."
      },
      {
        title: "2. Metadata Collection",
        content: "To function, the bot requires access to:",
        points: [
          "Voice state updates (when you join/leave a channel).",
          "Your Discord User ID (to assign you as the room owner).",
          "Channel configurations (names, limits, bitrates)."
        ]
      },
      {
        title: "3. Temporary Data",
        content: "Once all users leave a temporary voice channel, the channel is deleted by the bot, and all associated tracking data for that specific session is immediately purged from our active memory."
      },
      {
        title: "4. User Privacy",
        content: "Your custom room names and settings are saved to your profile so they persist across sessions. You may request deletion of your Voice Bot profile data at any time in our Support Server."
      }
    ]
  }
];

export default function UnifiedPrivacyPage() {
  const [activeTab, setActiveTab] = useState(BOTS[0].id);
  const activeBot = BOTS.find(b => b.id === activeTab)!;

  return (
    <div className="min-h-screen bg-[#080a0f] text-slate-100 flex flex-col selection:bg-brand-purple selection:text-white">
      <PublicNavbar />

      {/* Header Banner */}
      <section className="relative overflow-hidden pt-16 pb-12 border-b border-white/[0.08] bg-gradient-to-b from-[#111624] via-[#0b0e15] to-[#080a0f]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-800/50 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-4">
            <Lock className="h-3.5 w-3.5" />
            Unified Data Privacy
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Privacy Policy Hub
          </h1>
          <p className="mt-4 text-sm text-slate-400 max-w-2xl mx-auto">
            Select a SyncInk ecosystem bot below to understand exactly how it handles your data, transcripts, and personal information.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-1 w-full flex flex-col lg:flex-row gap-8">
        
        {/* Sidebar Tabs */}
        <div className="lg:w-80 flex-shrink-0">
          <div className="sticky top-24 space-y-3">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-2 mb-4">Select a Service</h2>
            <div className="flex flex-col gap-3">
              {BOTS.map((bot) => {
                const isActive = activeTab === bot.id;
                const Icon = bot.icon;
                return (
                  <button
                    key={bot.id}
                    onClick={() => setActiveTab(bot.id)}
                    className={`relative flex items-center gap-4 w-full p-4 rounded-2xl text-left transition-all duration-300 ${
                      isActive 
                        ? `bg-white/[0.04] border ${bot.border} shadow-lg` 
                        : 'border border-transparent hover:bg-white/[0.02] text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeTabIndicatorPrivacy"
                        className={`absolute inset-0 rounded-2xl border ${bot.border} bg-gradient-to-r from-transparent to-white/[0.01]`}
                        initial={false}
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      />
                    )}
                    <div className={`relative z-10 p-2.5 rounded-xl ${isActive ? bot.bgActive : 'bg-white/5'} ${isActive ? bot.color : 'text-slate-400'}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className={`relative z-10 font-bold text-[15px] ${isActive ? 'text-white' : ''}`}>
                      {bot.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Dynamic Content Area */}
        <div className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="bg-[#0e121d] border border-white/[0.08] rounded-[2rem] p-6 sm:p-10 shadow-2xl relative overflow-hidden"
            >
              {/* Background Glow */}
              <div className={`absolute top-0 right-0 w-72 h-72 rounded-full blur-[120px] pointer-events-none opacity-30 ${activeBot.bgLight}`} />

              <div className="relative z-10">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/[0.06] pb-6 mb-8 gap-4">
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-3">
                      <activeBot.icon className={`w-7 h-7 sm:w-8 sm:h-8 ${activeBot.color}`} />
                      {activeBot.name} Privacy
                    </h2>
                    <p className="text-sm text-slate-400 mt-2">
                      Full transparency on how we process and protect your data.
                    </p>
                  </div>
                  <span className={`self-start sm:self-auto px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${activeBot.border} ${activeBot.bgLight} ${activeBot.color}`}>
                    Updated {activeBot.lastUpdated}
                  </span>
                </div>

                <div className="space-y-10">
                  {activeBot.sections.map((sec, idx) => (
                    <div key={idx} className="space-y-3">
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <span className={activeBot.color}>§</span> {sec.title}
                      </h3>
                      <p className="text-sm text-slate-300 leading-relaxed">
                        {sec.content}
                      </p>
                      {sec.points && (
                        <div className="mt-3 space-y-2.5 pl-2">
                          {sec.points.map((pt, pIdx) => (
                            <div key={pIdx} className="flex items-start gap-2.5 text-sm text-slate-400">
                              <CheckCircle2 className={`w-4 h-4 shrink-0 mt-0.5 ${activeBot.color}`} />
                              <span className="leading-relaxed">{pt}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Callout to Dedicated Ticket Privacy Policy & Support Server */}
                <div className="mt-10 p-5 sm:p-6 rounded-2xl bg-purple-950/30 border border-purple-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h4 className="text-sm sm:text-base font-bold text-white">SyncInk Ticket Bot Dedicated Policy</h4>
                    <p className="text-xs text-slate-300 mt-1">Review complete ticket transcripts storage, GDPR/CCPA rights, and data purge instructions.</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                    <Link href="/dashboard/tickets/privacy" className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white transition-all">
                      Ticket Privacy Policy
                    </Link>
                    <a href="https://discord.gg/rB6gNZaK9u" target="_blank" rel="noopener noreferrer" className="px-3.5 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-xs font-semibold text-slate-200 border border-white/10 transition-all">
                      Support Server
                    </a>
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

      </main>
      <PublicFooter />
    </div>
  );
}
