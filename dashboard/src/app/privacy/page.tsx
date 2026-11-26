"use client";

import React from "react";
import Link from "next/link";
import { motion, MotionConfig } from "framer-motion";
import { transition } from "@/lib/motion-tokens";
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
    <MotionConfig reducedMotion="user">
    <div className="min-h-screen bg-[#060812] text-slate-100 flex flex-col font-sans overflow-x-hidden selection:bg-brand-blue selection:text-white">
      <PublicNavbar />

      {/* Header Banner */}
      <section className="pt-14 sm:pt-16 pb-10 border-b border-white/[0.08]">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={transition.enter}
          className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#0c0f18] border border-white/[0.08] text-emerald-400 font-mono text-[11px] mb-4">
            <Lock className="h-3.5 w-3.5" />
            <span>Platform privacy &amp; compliance</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-semibold text-white tracking-tight">
            Privacy Policy Hub
          </h1>
          <p className="mt-3 text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Every SyncInk service maintains its own transparent data governance policy. Select your target service below to view its official documentation.
          </p>
        </motion.div>
      </section>

      {/* Main Content Layout */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 flex-1 w-full flex flex-col lg:flex-row gap-8">
        
        {/* Sidebar Service Selector */}
        <aside className="lg:w-80 flex-shrink-0">
          <div className="lg:sticky lg:top-24 space-y-3">
            <div className="pl-1">
              <span className="text-xs font-mono text-slate-400">
                Select service policy
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-2.5">
              {/* Option 1: Support Bot (Current Page) */}
              <div
                className="relative flex items-center justify-between p-3.5 rounded-xl bg-[#0c0f18] border border-white/[0.16] text-left"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2 rounded-lg bg-white/[0.05] text-slate-200 shrink-0">
                    <Shield className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-medium text-sm text-white truncate">SyncInk Support Bot</div>
                    <div className="text-[11px] text-emerald-400 font-medium flex items-center gap-1.5 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                      <span className="truncate">Active page</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Option 2: Ticket Bot (Direct Redirect Link) */}
              <Link
                href="/dashboard/tickets/privacy"
                className="group relative flex items-center justify-between p-3.5 rounded-xl bg-[#0c0f18] border border-white/[0.08] hover:border-white/[0.16] transition-colors text-left touch-manipulation"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2 rounded-lg bg-white/[0.04] text-blue-400 shrink-0">
                    <Ticket className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-medium text-sm text-slate-200 group-hover:text-white transition-colors truncate">
                      Ticket Bot
                    </div>
                    <div className="text-[11px] text-slate-400 truncate">
                      Ticket policy
                    </div>
                  </div>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-white shrink-0" />
              </Link>

              {/* Option 3: Voice Bot (Direct Redirect Link) */}
              <Link
                href="/dashboard/voice/privacy"
                className="group relative flex items-center justify-between p-3.5 rounded-xl bg-[#0c0f18] border border-white/[0.08] hover:border-white/[0.16] transition-colors text-left touch-manipulation"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2 rounded-lg bg-white/[0.04] text-cyan-400 shrink-0">
                    <Headphones className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-medium text-sm text-slate-200 group-hover:text-white transition-colors truncate">
                      Voice Bot
                    </div>
                    <div className="text-[11px] text-slate-400 truncate">
                      Voice policy
                    </div>
                  </div>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-white shrink-0" />
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
          <div className="bg-[#0c0f18] border border-white/[0.08] rounded-xl p-5 sm:p-8">
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/[0.08] pb-5 mb-7 gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-slate-300 shrink-0">
                      <Shield className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-xl sm:text-2xl font-semibold text-white">
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
                    The SyncInk Support Bot operates exclusively within the official SyncInk Support Server (Server ID: <code className="text-blue-300 bg-white/5 px-1.5 py-0.5 rounded font-mono text-xs">1520457643842342912</code>). Its sole purpose is server security, velocity join dampening, spam interception, and automod defense.
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
              <h3 className="text-lg sm:text-xl font-semibold text-white tracking-tight">
                Ecosystem Bot Legal & Resource Directories
              </h3>
              <p className="text-sm text-slate-400 mt-1">
                Access the official privacy policies, terms, guides, and status dashboards for our other ecosystem bots:
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              
              {/* Card 1: Ticket Bot Complete Directory */}
              <div className="p-5 sm:p-6 rounded-xl bg-[#0c0f18] border border-white/[0.08] space-y-5 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-blue-400">
                        <Ticket className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-white text-sm">SyncInk Ticket Bot</h4>
                        <span className="text-xs text-slate-400">Enterprise support</span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded font-mono text-[10px] bg-white/[0.04] text-slate-300 border border-white/[0.08]">
                      5 pages
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                    Review Ticket Bot&apos;s privacy standards regarding encrypted private threads, transcript storage, and staff access.
                  </p>
                </div>

                <div className="space-y-2 pt-2 border-t border-white/[0.06]">
                  {/* Primary Link: Privacy Policy */}
                  <Link
                    href="/dashboard/tickets/privacy"
                    className="flex items-center justify-between h-10 px-3.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs sm:text-sm transition-colors touch-manipulation"
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
              <div className="p-5 sm:p-6 rounded-xl bg-[#0c0f18] border border-white/[0.08] space-y-5 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-cyan-400">
                        <Headphones className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-white text-sm">SyncInk Voice Bot</h4>
                        <span className="text-xs text-slate-400">Dynamic audio hub</span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded font-mono text-[10px] bg-white/[0.04] text-slate-300 border border-white/[0.08]">
                      5 pages
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                    Review Voice Bot&apos;s zero-audio-recording guarantee, temporary room session cleanup, and user ownership metadata policies.
                  </p>
                </div>

                <div className="space-y-2 pt-2 border-t border-white/[0.06]">
                  {/* Primary Link: Privacy Policy */}
                  <Link
                    href="/dashboard/voice/privacy"
                    className="flex items-center justify-between h-10 px-3.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs sm:text-sm transition-colors touch-manipulation"
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
    </MotionConfig>
  );
}
