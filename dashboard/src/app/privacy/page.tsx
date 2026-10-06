"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Shield,
  Ticket,
  Headphones,
  Lock,
  ExternalLink,
  ChevronRight,
  CheckCircle2,
  FileText,
  HelpCircle,
  BookOpen,
  Activity,
  ArrowRight,
  Database,
  EyeOff,
  Trash2,
  Layers,
} from "lucide-react";
import { PublicNavbar } from "@/components/PublicNavbar";
import { PublicFooter } from "@/components/PublicFooter";

export default function UnifiedPrivacyPage() {
  return (
    <div className="min-h-screen bg-[#060812] text-slate-100 flex flex-col font-sans selection:bg-brand-purple selection:text-white">
      <PublicNavbar />

      {/* Header Banner */}
      <section className="relative overflow-hidden pt-16 sm:pt-20 pb-12 border-b border-white/[0.08] bg-gradient-to-b from-[#0f1322] via-[#090c17] to-[#060812]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-4 shadow-sm">
            <Lock className="h-3.5 w-3.5" />
            <span>Platform Privacy & Compliance</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Privacy Policy Hub
          </h1>
          <p className="mt-4 text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Every SyncInk service maintains its own dedicated, transparent data governance policy. Select your target service below to view its official policy.
          </p>
        </div>
      </section>

      {/* Main Content Layout */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 flex-1 w-full flex flex-col lg:flex-row gap-8 lg:gap-10">
        
        {/* Sidebar Service Selector */}
        <aside className="lg:w-80 flex-shrink-0">
          <div className="sticky top-24 space-y-4">
            <div className="pl-1">
              <span className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">
                Select Service Policy
              </span>
            </div>

            <div className="flex flex-col gap-3">
              {/* Option 1: Support Bot (Current Page) */}
              <div
                className="relative flex items-center justify-between p-4 rounded-2xl bg-white/[0.04] border border-brand-red/40 shadow-lg text-left"
              >
                <div className="flex items-center gap-3.5">
                  <div className="p-2.5 rounded-xl bg-brand-red/20 text-brand-crimson">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-sm text-white">SyncInk Support Bot</div>
                    <div className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      Active On This Page
                    </div>
                  </div>
                </div>
              </div>

              {/* Option 2: Ticket Bot (Direct Redirect Link) */}
              <Link
                href="/dashboard/tickets/privacy"
                className="group relative flex items-center justify-between p-4 rounded-2xl bg-[#0c101d] border border-white/10 hover:border-blue-500/50 hover:bg-[#11172a] transition-all duration-200 text-left"
              >
                <div className="flex items-center gap-3.5">
                  <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 group-hover:bg-blue-500/20 transition-colors">
                    <Ticket className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-sm text-slate-200 group-hover:text-white transition-colors">
                      SyncInk Ticket Bot
                    </div>
                    <div className="text-[11px] text-slate-400 group-hover:text-blue-300 transition-colors">
                      Dedicated Ticket Policy
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs text-blue-400 font-semibold px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20 group-hover:bg-blue-500/20 transition-all">
                  <span>Open</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </div>
              </Link>

              {/* Option 3: Voice Bot (Direct Redirect Link) */}
              <Link
                href="/dashboard/voice/privacy"
                className="group relative flex items-center justify-between p-4 rounded-2xl bg-[#0a141b] border border-white/10 hover:border-cyan-500/50 hover:bg-[#0e1d27] transition-all duration-200 text-left"
              >
                <div className="flex items-center gap-3.5">
                  <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 group-hover:bg-cyan-500/20 transition-colors">
                    <Headphones className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-sm text-slate-200 group-hover:text-white transition-colors">
                      SyncInk Voice Bot
                    </div>
                    <div className="text-[11px] text-slate-400 group-hover:text-cyan-300 transition-colors">
                      Dedicated Voice Policy
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs text-cyan-400 font-semibold px-2.5 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/20 group-hover:bg-cyan-500/20 transition-all">
                  <span>Open</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </div>
              </Link>
            </div>

            {/* Quick Helper Box */}
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2 mt-4 text-xs text-slate-400 leading-relaxed">
              <div className="font-semibold text-slate-300 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Dedicated Endpoints
              </div>
              <p>
                Each bot operates on an isolated architecture with its own audited privacy practices. Clicking any bot above directs you to its official documentation.
              </p>
            </div>
          </div>
        </aside>

        {/* Content Pane */}
        <div className="flex-1 min-w-0 space-y-10">
          
          {/* Main Card: Support Bot Official Privacy Policy */}
          <div className="bg-[#0b0e18] border border-white/10 rounded-[2rem] p-6 sm:p-10 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-brand-red/10 rounded-full blur-[100px] pointer-events-none" />

            <div className="relative z-10">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/[0.08] pb-6 mb-8 gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-brand-red/20 border border-brand-red/30 flex items-center justify-center text-brand-crimson shrink-0">
                      <Shield className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-2xl sm:text-3xl font-black text-white">
                        SyncInk Support Bot Privacy Policy
                      </h2>
                      <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                        Official Data Protection Directive for the SyncInk Support Server
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <span className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-brand-red/15 text-brand-crimson border border-brand-red/30">
                    Updated October 2026
                  </span>
                </div>
              </div>

              {/* Policy Body Clauses */}
              <div className="space-y-8 text-slate-300 leading-relaxed">
                <section className="space-y-3">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <span className="text-brand-crimson font-mono">§ 1.</span>
                    Scope of Security & Operational Telemetry
                  </h3>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    The SyncInk Support Bot operates exclusively within the official SyncInk Support Server (Server ID: <code className="text-blue-300 bg-white/5 px-1.5 py-0.5 rounded font-mono text-xs">1520461877073674392</code>). Its sole purpose is server security, velocity join dampening, spam interception, and automod defense.
                  </p>
                </section>

                <section className="space-y-3">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <span className="text-brand-crimson font-mono">§ 2.</span>
                    Information We Process & Ephemeral Buffering
                  </h3>
                  <p className="text-sm text-slate-300">
                    To maintain 24/7 raid defense and keep the community secure, the bot processes the following data:
                  </p>
                  <ul className="space-y-2 text-sm text-slate-300 pl-1">
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span><strong>Real-Time Message Analysis:</strong> Messages are analyzed in memory for spam velocity, unauthorized advertisements, and NSFW material. Content is discarded immediately after scan.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span><strong>Join Velocity & Account Age:</strong> Account creation timestamps and join intervals are monitored to calculate risk factors and trigger panic shields during mass raid events.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span><strong>Infraction Logs:</strong> Warning tallies, timeout durations, and quarantine events are stored securely in our PostgreSQL database for staff moderation records.</span>
                    </li>
                  </ul>
                </section>

                <section className="space-y-3">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <span className="text-brand-crimson font-mono">§ 3.</span>
                    Zero Data Selling & Third-Party Disclosure
                  </h3>
                  <p className="text-sm text-slate-300">
                    We maintain a strict zero-monetization policy regarding user data. We do not sell, rent, monetize, or trade telemetry to external marketing agencies or data brokers under any circumstances.
                  </p>
                </section>

                <section className="space-y-3">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <span className="text-brand-crimson font-mono">§ 4.</span>
                    Data Retention & Decay Rights
                  </h3>
                  <p className="text-sm text-slate-300">
                    Warning points decay over configured timeframes. Members who leave the Support Server have their non-critical activity metrics purged automatically. Security audit logs of malicious raid attacks are preserved indefinitely to safeguard infrastructure.
                  </p>
                </section>
              </div>
            </div>
          </div>

          {/* Dedicated Directory Section for All Other Bots */}
          <div className="space-y-6">
            <div>
              <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Ecosystem Bot Legal & Resource Directories
              </h3>
              <p className="text-sm text-slate-400 mt-1">
                Access the official privacy policies, terms, guides, and status dashboards for our other ecosystem bots:
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Card 1: Ticket Bot Complete Directory */}
              <div className="p-6 sm:p-7 rounded-3xl bg-gradient-to-b from-[#0f1222] to-[#090b14] border border-blue-500/25 shadow-xl space-y-5 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-300">
                        <Ticket className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-white text-base">SyncInk Ticket Bot</h4>
                        <span className="text-xs text-blue-400 font-semibold">Enterprise Support</span>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-300 border border-blue-500/30">
                      5 Pages Live
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    Review Ticket Bot's specialized privacy standards regarding encrypted private threads, transcript storage, and staff access.
                  </p>
                </div>

                <div className="space-y-2 pt-2 border-t border-white/[0.06]">
                  {/* Primary Link: Privacy Policy */}
                  <Link
                    href="/dashboard/tickets/privacy"
                    className="flex items-center justify-between p-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm transition-all shadow-[0_0_15px_rgba(88,101,242,0.35)]"
                  >
                    <span className="flex items-center gap-2">
                      <Lock className="w-4 h-4" />
                      Official Privacy Policy
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>

                  {/* Secondary Resource Links */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <Link
                      href="/dashboard/tickets/terms"
                      className="flex items-center gap-1.5 p-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-200 transition-colors"
                    >
                      <FileText className="w-3.5 h-3.5 text-blue-400" />
                      <span>Terms of Service</span>
                    </Link>
                    <Link
                      href="/dashboard/tickets/faq"
                      className="flex items-center gap-1.5 p-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-200 transition-colors"
                    >
                      <HelpCircle className="w-3.5 h-3.5 text-blue-400" />
                      <span>FAQ Page</span>
                    </Link>
                    <Link
                      href="/dashboard/tickets/guides"
                      className="flex items-center gap-1.5 p-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-200 transition-colors"
                    >
                      <BookOpen className="w-3.5 h-3.5 text-blue-400" />
                      <span>Setup Guides</span>
                    </Link>
                    <Link
                      href="/dashboard/tickets/status"
                      className="flex items-center gap-1.5 p-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-200 transition-colors"
                    >
                      <Activity className="w-3.5 h-3.5 text-emerald-400" />
                      <span>System Status</span>
                    </Link>
                  </div>
                </div>
              </div>

              {/* Card 2: Voice Bot Complete Directory */}
              <div className="p-6 sm:p-7 rounded-3xl bg-gradient-to-b from-[#09151c] to-[#060c11] border border-cyan-500/25 shadow-xl space-y-5 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-300">
                        <Headphones className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-white text-base">SyncInk Voice Bot</h4>
                        <span className="text-xs text-cyan-400 font-semibold">Dynamic Audio Hub</span>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                      5 Pages Live
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    Review Voice Bot's zero-audio-recording guarantee, temporary room session cleanup, and user ownership metadata policies.
                  </p>
                </div>

                <div className="space-y-2 pt-2 border-t border-white/[0.06]">
                  {/* Primary Link: Privacy Policy */}
                  <Link
                    href="/dashboard/voice/privacy"
                    className="flex items-center justify-between p-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs sm:text-sm transition-all shadow-[0_0_15px_rgba(6,182,212,0.35)]"
                  >
                    <span className="flex items-center gap-2">
                      <Lock className="w-4 h-4" />
                      Official Privacy Policy
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>

                  {/* Secondary Resource Links */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <Link
                      href="/dashboard/voice/terms"
                      className="flex items-center gap-1.5 p-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-200 transition-colors"
                    >
                      <FileText className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Terms of Service</span>
                    </Link>
                    <Link
                      href="/dashboard/voice/faq"
                      className="flex items-center gap-1.5 p-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-200 transition-colors"
                    >
                      <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
                      <span>FAQ Page</span>
                    </Link>
                    <Link
                      href="/dashboard/voice/guide"
                      className="flex items-center gap-1.5 p-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-200 transition-colors"
                    >
                      <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Setup Guide</span>
                    </Link>
                    <Link
                      href="/dashboard/voice/status"
                      className="flex items-center gap-1.5 p-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-200 transition-colors"
                    >
                      <Activity className="w-3.5 h-3.5 text-emerald-400" />
                      <span>System Status</span>
                    </Link>
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
