"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Shield,
  MessageSquare,
  Radio,
  ExternalLink,
  ChevronRight,
  Activity,
  Layers,
  Sparkles,
  Lock,
  CheckCircle2,
  Users,
  Settings,
  ArrowRight,
  Zap,
} from "lucide-react";
import { PublicNavbar } from "@/components/PublicNavbar";
import { PublicFooter } from "@/components/PublicFooter";

export default function MasterDashboardHub() {
  const [securityStats, setSecurityStats] = useState({
    jailedCount: 0,
    whitelistCount: 0,
    incidentCount: 0,
    modCasesCount: 0,
    violationsCount: 0,
  });
  const [raidState, setRaidState] = useState("NORMAL");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await fetch("/api/security");
        if (res.ok) {
          const data = await res.json();
          if (data.stats) {
            setSecurityStats({
              jailedCount: data.stats.jailedCount || 0,
              whitelistCount: data.stats.whitelistCount || 0,
              incidentCount: data.stats.incidentCount || 0,
              modCasesCount: data.stats.modCasesCount || 0,
              violationsCount: data.stats.violationsCount || 0,
            });
          }
          if (data.raidState) {
            setRaidState(data.raidState);
          }
        }
      } catch (e) {
        console.error("Telemetry fetch error:", e);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  return (
    <div className="min-h-screen bg-[#060812] text-slate-100 flex flex-col font-sans selection:bg-brand-purple selection:text-white">
      <PublicNavbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 space-y-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-white/[0.08]">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-purple/10 border border-brand-purple/30 text-brand-lilac text-xs font-bold uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Unified Bot Management Platform</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Bot Command Centers
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-xl">
              Each SyncInk bot operates with its own dedicated, synchronized dashboard. Select a bot below to open its specialized console.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>All 3 Dedicated Consoles Online</span>
            </div>
          </div>
        </div>

        {/* 3 Distinct Bot Dashboard Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* CARD 1: TICKET BOT DASHBOARD */}
          <div className="p-7 rounded-3xl bg-gradient-to-b from-[#120d24] to-[#0c0a18] border border-purple-500/30 shadow-2xl relative overflow-hidden flex flex-col justify-between group hover:border-purple-500/60 transition-all duration-300">
            <div className="absolute top-0 right-0 w-48 h-48 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />

            <div>
              <div className="flex items-center justify-between mb-5">
                <div className="w-14 h-14 rounded-2xl bg-purple-600/20 border-2 border-purple-500/40 flex items-center justify-center p-2 shadow-[0_0_20px_rgba(147,51,234,0.35)]">
                  <img
                    src="/ticket-logo.png"
                    alt="Ticket Bot"
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = "none";
                    }}
                  />
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  Dedicated Console
                </span>
              </div>

              <h2 className="text-2xl font-black text-white group-hover:text-purple-300 transition-colors">
                SyncInk Ticket Bot
              </h2>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                Full copy of the dedicated Ticket Dashboard from <code>D:\syncink ticket bot</code>. Configure private threads, custom emojis, panels, and encrypted transcripts.
              </p>

              {/* Live Feature Highlights */}
              <div className="mt-5 space-y-2 text-xs">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-black/40 border border-white/5">
                  <span className="text-slate-400">Operating Mode</span>
                  <span className="font-bold text-purple-400">Private Threads (No Spam)</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-black/40 border border-white/5">
                  <span className="text-slate-400">Configured Categories</span>
                  <span className="font-bold text-white">6 Active Departments</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-black/40 border border-white/5">
                  <span className="text-slate-400">Auto-Transcripts</span>
                  <span className="font-bold text-emerald-400">100% Retained HTML</span>
                </div>
              </div>
            </div>

            <div className="mt-8 space-y-2.5">
              <Link
                href="/dashboard/tickets"
                className="w-full py-3 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs sm:text-sm transition-all shadow-[0_0_20px_rgba(147,51,234,0.4)] flex items-center justify-center gap-2"
              >
                <span>Launch Ticket Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="https://syncink-ticket-bot.up.railway.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold transition-all border border-white/10 flex items-center justify-center gap-1.5"
              >
                <span>Sync with Railway Host</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* CARD 2: VOICE BOT DASHBOARD */}
          <div className="p-7 rounded-3xl bg-gradient-to-b from-[#0c1322] to-[#090d16] border border-cyan-500/30 shadow-2xl relative overflow-hidden flex flex-col justify-between group hover:border-cyan-500/60 transition-all duration-300">
            <div className="absolute top-0 right-0 w-48 h-48 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />

            <div>
              <div className="flex items-center justify-between mb-5">
                <div className="w-14 h-14 rounded-2xl bg-cyan-600/20 border-2 border-cyan-500/40 flex items-center justify-center p-2 shadow-[0_0_20px_rgba(6,182,212,0.35)]">
                  <img
                    src="/voice-logo.png"
                    alt="Voice Bot"
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = "none";
                    }}
                  />
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  Dedicated Console
                </span>
              </div>

              <h2 className="text-2xl font-black text-white group-hover:text-cyan-300 transition-colors">
                SyncInk Voice Bot
              </h2>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                Full copy of the dedicated Voice Dashboard from <code>D:\SyncInk Voice</code>. Manage Join-to-Create hubs, custom naming templates, bitrate tuning, and auto-purge rules.
              </p>

              {/* Live Feature Highlights */}
              <div className="mt-5 space-y-2 text-xs">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-black/40 border border-white/5">
                  <span className="text-slate-400">Generator Engine</span>
                  <span className="font-bold text-cyan-400">Dynamic Join-to-Create</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-black/40 border border-white/5">
                  <span className="text-slate-400">Audio Bitrate</span>
                  <span className="font-bold text-white">Up to 384 kbps Lossless</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-black/40 border border-white/5">
                  <span className="text-slate-400">Ghost Prevention</span>
                  <span className="font-bold text-emerald-400">Auto-Purge Empty Rooms</span>
                </div>
              </div>
            </div>

            <div className="mt-8 space-y-2.5">
              <Link
                href="/dashboard/voice"
                className="w-full py-3 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs sm:text-sm transition-all shadow-[0_0_20px_rgba(6,182,212,0.4)] flex items-center justify-center gap-2"
              >
                <span>Launch Voice Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="https://syncink-voice-dashboard.up.railway.app"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold transition-all border border-white/10 flex items-center justify-center gap-1.5"
              >
                <span>Sync with Railway Host</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* CARD 3: SUPPORT SERVER SECURITY DASHBOARD */}
          <div className="p-7 rounded-3xl bg-gradient-to-b from-[#180d12] to-[#0d070a] border border-brand-red/30 shadow-2xl relative overflow-hidden flex flex-col justify-between group hover:border-brand-red/60 transition-all duration-300">
            <div className="absolute top-0 right-0 w-48 h-48 bg-brand-red/15 rounded-full blur-3xl pointer-events-none" />

            <div>
              <div className="flex items-center justify-between mb-5">
                <div className="w-14 h-14 rounded-2xl bg-brand-red/20 border-2 border-brand-red/40 flex items-center justify-center p-2 shadow-[0_0_20px_rgba(231,76,60,0.35)]">
                  <img
                    src="/syncink-s-purple.jpg"
                    alt="SyncInk Shield"
                    className="w-full h-full object-cover rounded-xl"
                  />
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-brand-red/20 text-brand-crimson border border-brand-red/30">
                  Internal Server Shield
                </span>
              </div>

              <h2 className="text-2xl font-black text-white group-hover:text-red-300 transition-colors">
                Support Server Security
              </h2>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                Non-invitable security & automod bot dedicated strictly to keeping the official SyncInk Support Server safe with real-time raid velocity dampeners and auto-quarantine.
              </p>

              {/* Live Feature Highlights */}
              <div className="mt-5 space-y-2 text-xs">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-black/40 border border-white/5">
                  <span className="text-slate-400">Raid State</span>
                  <span
                    className={`font-bold ${
                      raidState === "NORMAL" ? "text-emerald-400" : "text-red-400"
                    }`}
                  >
                    {raidState}
                  </span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-black/40 border border-white/5">
                  <span className="text-slate-400">Quarantine Inmates</span>
                  <span className="font-bold text-white">
                    {loading ? "..." : `${securityStats.jailedCount} isolated`}
                  </span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-black/40 border border-white/5">
                  <span className="text-slate-400">AutoMod Violations</span>
                  <span className="font-bold text-amber-400">
                    {loading ? "..." : `${securityStats.violationsCount} strikes recorded`}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-8 space-y-2.5">
              <Link
                href="/dashboard/security"
                className="w-full py-3 px-4 rounded-xl bg-brand-red hover:bg-brand-crimson text-white font-bold text-xs sm:text-sm transition-all shadow-[0_0_20px_rgba(231,76,60,0.4)] flex items-center justify-center gap-2"
              >
                <span>Launch Security Console</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <div className="w-full py-2.5 px-4 rounded-xl bg-white/5 text-slate-400 text-xs font-semibold text-center border border-white/5">
                Official SyncInk Support Server (1520461877073674392)
              </div>
            </div>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
