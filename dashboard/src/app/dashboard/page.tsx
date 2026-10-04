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
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-red/10 border border-brand-red/30 text-brand-crimson text-xs font-bold uppercase tracking-wider mb-2">
              <Shield className="w-3.5 h-3.5" />
              <span>Internal Defense System</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Security Console
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-xl">
              Real-time monitoring and automod control panel for the official SyncInk Support Server.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Security Engine Online</span>
            </div>
          </div>
        </div>

        {/* 3 Distinct Bot Dashboard Cards */}
        <div className="flex justify-center max-w-7xl mx-auto px-4 w-full">
          {/* CARD 1: SUPPORT SERVER SECURITY DASHBOARD */}
          <div className="w-full max-w-2xl p-8 rounded-[2rem] bg-gradient-to-b from-[#180d12] to-[#0d070a] border border-brand-red/30 shadow-[0_20px_60px_-15px_rgba(231,76,60,0.2)] relative overflow-hidden flex flex-col justify-between group hover:border-brand-red/60 hover:shadow-[0_20px_60px_-15px_rgba(231,76,60,0.4)] transition-all duration-500 hover:-translate-y-1">
            <div className="absolute top-0 right-0 w-48 h-48 bg-brand-red/15 rounded-full blur-3xl pointer-events-none group-hover:bg-brand-red/25 transition-all duration-500" />

            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="w-16 h-16 rounded-full bg-brand-red/10 border-2 border-brand-red/40 flex items-center justify-center p-1 shadow-[0_0_25px_rgba(231,76,60,0.4)] overflow-hidden">
                  <img
                    src="/syncink-s-purple.jpg"
                    alt="SyncInk Shield"
                    className="w-full h-full object-cover rounded-full"
                  />
                </div>
                <span className="px-3 py-1.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-brand-red/20 text-brand-crimson border border-brand-red/30 shadow-sm">
                  Internal Server Shield
                </span>
              </div>

              <h2 className="text-3xl font-black text-white group-hover:text-red-300 transition-colors">
                Support Security
              </h2>
              <p className="text-sm text-slate-300 mt-3 leading-relaxed">
                Non-invitable security & automod bot dedicated strictly to keeping the official SyncInk Support Server safe with real-time raid velocity dampeners and auto-quarantine.
              </p>

              {/* Live Feature Highlights */}
              <div className="mt-6 space-y-2.5 text-sm">
                <div className="flex items-center justify-between p-3 rounded-2xl bg-black/40 border border-white/5 shadow-inner">
                  <span className="text-slate-400 font-medium">Raid State</span>
                  <span
                    className={`font-bold ${
                      raidState === "NORMAL" ? "text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]" : "text-red-400 animate-pulse"
                    }`}
                  >
                    {raidState}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-2xl bg-black/40 border border-white/5 shadow-inner">
                  <span className="text-slate-400 font-medium">Quarantine Inmates</span>
                  <span className="font-bold text-white">
                    {loading ? "..." : `${securityStats.jailedCount} isolated`}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-2xl bg-black/40 border border-white/5 shadow-inner">
                  <span className="text-slate-400 font-medium">AutoMod Violations</span>
                  <span className="font-bold text-amber-400">
                    {loading ? "..." : `${securityStats.violationsCount} strikes`}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-8 space-y-3">
              <Link
                href="/dashboard/security"
                className="w-full py-3.5 px-4 rounded-2xl bg-brand-red hover:bg-brand-crimson text-white font-bold text-sm transition-all shadow-[0_0_20px_rgba(231,76,60,0.4)] hover:shadow-[0_0_30px_rgba(231,76,60,0.6)] flex items-center justify-center gap-2 transform hover:scale-[1.02]"
              >
                <span>Launch Console</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <div className="w-full py-3 px-4 rounded-2xl bg-white/5 text-slate-400 text-xs font-semibold text-center border border-white/5">
                Official SyncInk Support Server
              </div>
            </div>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}

