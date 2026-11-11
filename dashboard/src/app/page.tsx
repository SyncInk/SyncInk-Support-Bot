"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare,
  Radio,
  Shield,
  ChevronRight,
  ExternalLink,
  Lock,
  ArrowRight,
  Activity,
  CheckCircle2,
  Zap,
  Sliders,
  Layers,
  FileCheck,
  ChevronDown,
  HelpCircle,
  Users,
  Headphones,
  Sparkles,
  Clock,
  FileText,
} from "lucide-react";
import { PublicNavbar } from "@/components/PublicNavbar";
import { PublicFooter } from "@/components/PublicFooter";
import { LivePulseBadge } from "@/components/MotionWrapper";
import { transition } from "@/lib/motion-tokens";

/* ═══════════════════════════════════════════════════════════════════════
   FAQ DATA
   ═══════════════════════════════════════════════════════════════════════ */
const FAQ_ITEMS = [
  {
    q: "How do I invite and set up SyncInk Ticket Bot?",
    a: "Click 'Invite Bot' on the Ticket Bot card above to authorize it with your Discord server. Once invited, run the /setup command in your designated admin channel to generate your interactive ticket panel.",
  },
  {
    q: "How does the Dynamic Voice generator work?",
    a: "SyncInk Voice Bot creates an automated master generator hub. Whenever a member connects to the hub, the bot instantly spawns a dedicated temporary voice channel with full owner controls (/voice lock, /voice limit) and auto-deletes it when empty.",
  },
  {
    q: "When will SyncInk Radio and Audia AI be publicly available?",
    a: "SyncInk Radio and its embedded Audia AI intelligence engine are currently undergoing active pre-release development and closed testing on our official Discord server. We are fine-tuning our 10-point recommendation architecture, taste profiles, and high-bitrate streaming infrastructure before opening public invitations.",
  },
  {
    q: "Why is the Support & Security Bot non-invitable?",
    a: "The Support & Security Bot is custom-engineered specifically to protect the official SyncInk Support Server, running low-latency velocity raid dampeners, quarantine isolation, and automated database sync.",
  },
  {
    q: "How can I apply for the SyncInk Staff or Developer team?",
    a: "Sign in with your Discord account and navigate to our Apply portal (/apply). Your submission is dispatched directly into our management review system.",
  },
];

/* ═══════════════════════════════════════════════════════════════════════
   BOT FEATURE ITEM (reusable)
   ═══════════════════════════════════════════════════════════════════════ */
function FeatureItem({
  icon: Icon,
  title,
  description,
  accentClass = "text-blue-400 bg-blue-500/10",
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  accentClass?: string;
}) {
  const [iconBg, iconColor] = accentClass.split(" ");
  return (
    <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.12] transition-colors space-y-2">
      <div className="flex items-center gap-2.5">
        <div className={`w-8 h-8 rounded-lg ${iconBg} flex items-center justify-center shrink-0`}>
          <Icon className={`w-4 h-4 ${iconColor}`} />
        </div>
        <span className="font-semibold text-sm text-white">{title}</span>
      </div>
      <p className="text-xs text-slate-400 leading-relaxed pl-[42px]">{description}</p>
    </div>
  );
}

/* ─── Studio Audio SVG Symbols for SyncInk Radio & Audia AI ─────────── */
function AutoPlayWaveSymbol({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12h3l2-5 3 10 3-12 3 9 2-4h3" />
      <polygon points="17 8 21 12 17 16" fill="currentColor" stroke="none" />
    </svg>
  );
}

function ParametricTasteSymbol({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" y1="21" x2="4" y2="14" />
      <line x1="4" y1="10" x2="4" y2="3" />
      <line x1="12" y1="21" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12" y2="3" />
      <line x1="20" y1="21" x2="20" y2="16" />
      <line x1="20" y1="12" x2="20" y2="3" />
      <circle cx="4" cy="12" r="2" fill="currentColor" />
      <circle cx="12" cy="10" r="2" fill="currentColor" />
      <circle cx="20" cy="14" r="2" fill="currentColor" />
    </svg>
  );
}

function AcousticIsolationSymbol({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="M8 12h2l1.5-3 2.5 6 1.5-3h1.5" />
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   HOMEPAGE
   ═══════════════════════════════════════════════════════════════════════ */
export default function HomePage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const [securityData, setSecurityData] = useState<{
    raidState: string;
    jailedCount: number;
    incidentCount: number;
    modCasesCount: number;
  }>({
    raidState: "NORMAL",
    jailedCount: 0,
    incidentCount: 0,
    modCasesCount: 0,
  });

  // Ensure the page always starts at the top on initial load (unless arriving via hash)
  useEffect(() => {
    if (typeof window !== "undefined" && !window.location.hash) {
      window.scrollTo(0, 0);
    }
  }, []);

  // Real-time live status updates (polls every 8s)
  useEffect(() => {
    let mounted = true;
    async function fetchMonitoring() {
      try {
        const res = await fetch("/api/security");
        if (res.ok && mounted) {
          const data = await res.json();
          setSecurityData({
            raidState: data.raidState || "NORMAL",
            jailedCount: data.stats?.jailedCount || 0,
            incidentCount: data.stats?.incidentCount || 0,
            modCasesCount: data.stats?.modCasesCount || 0,
          });
        }
      } catch {
        // Fallback remains operational
      }
    }

    fetchMonitoring();
    const interval = setInterval(fetchMonitoring, 8000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#060812] text-slate-100 flex flex-col font-sans selection:bg-brand-blue selection:text-white relative overflow-x-hidden">
      <PublicNavbar />

      <main className="flex-1">
        {/* ═════════════════════════════════════════════════════════════
           HERO — Clear hierarchy, immediate visibility, reliable render
           ═════════════════════════════════════════════════════════════ */}
        <section className="pt-20 sm:pt-28 pb-16 sm:pb-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
          <div className="text-center">
            <h1 className="text-3xl sm:text-5xl lg:text-[3.5rem] font-black text-white tracking-tight leading-[1.12] max-w-3xl mx-auto mb-5">
              Discord Infrastructure
              <br className="hidden sm:block" />
              <span className="text-blue-400"> Built for Performance</span>
            </h1>

            <p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto leading-relaxed mb-8">
              Private-thread ticket systems, dynamic temporary voice channels,
              intelligent 24/7 AI radio streaming, and a dedicated support server security shield — engineered for
              high-velocity communities.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <a
                href="#bots"
                className="h-11 px-6 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-colors flex items-center gap-2 active:scale-[0.98]"
              >
                <span>Explore Bots</span>
                <ChevronRight className="w-4 h-4" />
              </a>

              <Link
                href="/dashboard"
                className="h-11 px-6 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-slate-200 font-semibold text-sm transition-colors border border-white/[0.08] flex items-center gap-2 active:scale-[0.98]"
              >
                <Layers className="w-4 h-4 text-slate-400" />
                <span>Console</span>
              </Link>
            </div>
          </div>
        </section>

        {/* ═════════════════════════════════════════════════════════════
           SYSTEM & SHIELD STATUS (Live real-time polling)
           ═════════════════════════════════════════════════════════════ */}
        <section className="px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto mb-20">
          <div className="p-5 sm:p-6 rounded-2xl bg-surface border border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-5 border-b border-white/[0.06]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                  <Activity className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm sm:text-base">Support Server Status</h3>
                  <p className="text-xs text-slate-400">Live operational health &amp; defense status from active bot instances</p>
                </div>
              </div>
              <LivePulseBadge label={securityData.raidState === "NORMAL" ? "Operational" : "Threat Detected"} />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-5">
              {/* Raid State */}
              <div className="text-center p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                <div className={`text-lg sm:text-2xl font-black ${
                  securityData.raidState === "NORMAL"
                    ? "text-emerald-400"
                    : "text-red-400"
                }`}>
                  {securityData.raidState === "NORMAL" ? "SECURE" : securityData.raidState}
                </div>
                <div className="text-[11px] text-slate-400 font-medium mt-1 uppercase tracking-wider">Threat Level</div>
              </div>

              {/* Mod Cases */}
              <div className="text-center p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                <div className="text-lg sm:text-2xl font-black text-white">
                  {securityData.modCasesCount.toLocaleString()}
                </div>
                <div className="text-[11px] text-slate-400 font-medium mt-1 uppercase tracking-wider">Mod Cases</div>
              </div>

              {/* Quarantined */}
              <div className="text-center p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                <div className="text-lg sm:text-2xl font-black text-white">
                  {securityData.jailedCount.toLocaleString()}
                </div>
                <div className="text-[11px] text-slate-400 font-medium mt-1 uppercase tracking-wider">Quarantined</div>
              </div>

              {/* Incidents */}
              <div className="text-center p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                <div className="text-lg sm:text-2xl font-black text-white">
                  {securityData.incidentCount.toLocaleString()}
                </div>
                <div className="text-[11px] text-slate-400 font-medium mt-1 uppercase tracking-wider">Incidents</div>
              </div>
            </div>
          </div>
        </section>

        {/* ═════════════════════════════════════════════════════════════
           BOT SHOWCASE — Each bot has distinct visual treatment
           ═════════════════════════════════════════════════════════════ */}
        <section id="bots" className="px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-12 pb-20">
          <div className="text-center mb-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-2">Bot Suite</p>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Four bots. One ecosystem.
            </h2>
          </div>

          {/* ─── BOT 1: TICKET BOT ─────────────────────────────────── */}
          <div className="rounded-2xl bg-surface border border-white/[0.06] hover:border-blue-500/30 transition-all duration-200 overflow-hidden">
            <div className="p-6 sm:p-8 lg:p-10">
              {/* Header row */}
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pb-6 border-b border-white/[0.06]">
                <div className="flex items-start sm:items-center gap-4">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0 overflow-hidden">
                    <img
                      src="/ticket-logo.png"
                      alt="SyncInk Ticket Bot"
                      className="w-10 h-10 sm:w-12 sm:h-12 object-contain rounded-xl"
                      onError={(e) => { (e.target as HTMLElement).style.display = "none"; }}
                    />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/15">
                        Support Tickets
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-white/[0.04] text-slate-300 border border-white/[0.06]">
                        Private Threads
                      </span>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-black text-white">SyncInk Ticket Bot</h3>
                    <p className="text-sm text-slate-300 mt-1 max-w-lg leading-relaxed">
                      Private-thread ticket isolation, intelligent claim system, automated transcripts, and role-based access — one seamless workflow.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
                  <a
                    href="https://discord.com/oauth2/authorize?client_id=1513075101992747158&permissions=361046068240&integration_type=0&scope=bot+applications.commands"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 lg:flex-initial justify-center h-10 px-5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors flex items-center gap-2 active:scale-[0.98]"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Invite Bot</span>
                  </a>
                  <Link
                    href="/dashboard/tickets"
                    className="flex-1 lg:flex-initial justify-center h-10 px-5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 font-semibold text-xs transition-colors border border-white/[0.06] flex items-center gap-2 active:scale-[0.98]"
                  >
                    <span>Dashboard</span>
                  </Link>
                </div>
              </div>

              {/* Category tags */}
              <div className="pt-5 pb-4">
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-3">Customizable Categories</p>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { name: "General Request", id: "1513336781263732836" },
                    { name: "User Report", id: "1513336966681460856" },
                    { name: "Bug Report", id: "1513337174148513892" },
                    { name: "Staff Abuse", id: "1513337285024677899" },
                    { name: "Other Support", id: "1513337572078911488" },
                    { name: "Owner Contact", id: "1513337741105037332" },
                  ].map((cat) => (
                    <div
                      key={cat.id}
                      className="flex items-center gap-1.5 px-2.5 py-1 bg-white/[0.03] border border-white/[0.06] rounded-lg text-xs text-slate-300"
                    >
                      <img
                        src={`https://cdn.discordapp.com/emojis/${cat.id}.png`}
                        className="w-4 h-4 object-contain select-none"
                        alt=""
                      />
                      <span>{cat.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Feature grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-4 border-t border-white/[0.04]">
                <FeatureItem
                  icon={Lock}
                  title="Private Threads Engine"
                  description="Avoids channel limits. Only the ticket creator and assigned moderators can view and participate."
                  accentClass="bg-blue-500/10 text-blue-400"
                />
                <FeatureItem
                  icon={Zap}
                  title="Auto-Claim & Mentions"
                  description="Staff are automatically assigned when replying or mentioned inside any ticket thread."
                  accentClass="bg-blue-500/10 text-blue-400"
                />
                <FeatureItem
                  icon={FileCheck}
                  title="Encrypted Transcripts"
                  description="Full message logs, screenshots, and timestamps archived in our secure viewer."
                  accentClass="bg-blue-500/10 text-blue-400"
                />
              </div>
            </div>
          </div>

          {/* ─── BOT 2: VOICE BOT ──────────────────────────────────── */}
          <div className="rounded-2xl bg-surface border border-white/[0.06] hover:border-cyan-500/30 transition-all duration-200 overflow-hidden">
            <div className="p-6 sm:p-8 lg:p-10">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pb-6 border-b border-white/[0.06]">
                <div className="flex items-start sm:items-center gap-4">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0 overflow-hidden">
                    <img
                      src="/voice-logo.png"
                      alt="SyncInk Voice Bot"
                      className="w-10 h-10 sm:w-12 sm:h-12 object-contain rounded-xl"
                      onError={(e) => { (e.target as HTMLElement).style.display = "none"; }}
                    />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-cyan-500/10 text-cyan-400 border border-cyan-500/15">
                        Voice Channels
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-white/[0.04] text-slate-300 border border-white/[0.06]">
                        Auto-Generator
                      </span>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-black text-white">SyncInk Voice Bot</h3>
                    <p className="text-sm text-slate-300 mt-1 max-w-lg leading-relaxed">
                      Dynamic temporary voice channel manager. Users click a generator hub to create a room with custom naming, user limits, and instant cleanup when empty.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
                  <a
                    href="https://discord.com/oauth2/authorize?client_id=1516578887109181520&permissions=285220880&integration_type=0&scope=bot+applications.commands"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 lg:flex-initial justify-center h-10 px-5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition-colors flex items-center gap-2 active:scale-[0.98]"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Invite Bot</span>
                  </a>
                  <Link
                    href="/dashboard"
                    className="flex-1 lg:flex-initial justify-center h-10 px-5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 font-semibold text-xs transition-colors border border-white/[0.06] flex items-center gap-2 active:scale-[0.98]"
                  >
                    <span>Dashboard</span>
                  </Link>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-6">
                <FeatureItem
                  icon={Radio}
                  title="Join-to-Create Hubs"
                  description="Click a master hub to spawn a private temporary voice room with customizable naming schemes."
                  accentClass="bg-cyan-500/10 text-cyan-400"
                />
                <FeatureItem
                  icon={Sliders}
                  title="Owner Controls"
                  description="Creators can lock, ghost-hide, limit users, or kick members with slash commands and panels."
                  accentClass="bg-cyan-500/10 text-cyan-400"
                />
                <FeatureItem
                  icon={CheckCircle2}
                  title="Automatic Cleanup"
                  description="Channels are deleted within 1.5 seconds when the last user leaves, keeping server channels tidy."
                  accentClass="bg-cyan-500/10 text-cyan-400"
                />
              </div>
            </div>
          </div>

          {/* ─── BOT 3: SYNCINK RADIO (POWERED BY AUDIA AI) ────────────────── */}
          <div className="rounded-2xl bg-surface border border-white/[0.06] hover:border-purple-500/30 transition-all duration-200 overflow-hidden relative">
            {/* Subtle purple gradient ambient accent in top-right */}
            <div className="absolute -top-24 -right-24 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

            <div className="p-6 sm:p-8 lg:p-10 relative z-10">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pb-6 border-b border-white/[0.06]">
                <div className="flex items-start sm:items-center gap-4">
                  <div className="relative group/avatar shrink-0">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[#0b0816] border-2 border-purple-500/40 p-1 flex items-center justify-center shrink-0 overflow-hidden shadow-[0_0_30px_rgba(168,85,247,0.35)] ring-1 ring-purple-400/20 group-hover/avatar:border-purple-400/60 transition-all duration-300">
                      <img
                        src="/radio-logo.png"
                        alt="SyncInk Radio Official Logo"
                        className="w-full h-full object-contain rounded-xl select-none"
                      />
                    </div>
                    {/* Live Opus Audio Stream Indicator with SVG Equalizer Bars */}
                    <div className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-md bg-purple-950/95 border border-purple-400/40 backdrop-blur-md flex items-center gap-1 shadow-md">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-[9px] font-mono font-bold text-purple-200">OPUS</span>
                    </div>
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-500/15 text-purple-300 border border-purple-500/30 flex items-center gap-1.5 shadow-sm shadow-purple-950/40">
                        <Sparkles className="w-3 h-3 text-purple-400" />
                        Powered by Audia AI
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1.5">
                        <Clock className="w-3 h-3 text-amber-400 animate-pulse" />
                        Coming Soon
                      </span>
                      {/* Studio Lossless Audio SVG Indicator */}
                      <span className="hidden sm:inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-500/10 text-purple-300 border border-purple-500/25 items-center gap-1.5">
                        <svg className="w-3.5 h-3 text-purple-400" viewBox="0 0 16 12" fill="currentColor">
                          <rect x="0" y="4" width="2" height="5" rx="1" className="animate-pulse" />
                          <rect x="3.5" y="1" width="2" height="11" rx="1" style={{ animation: "pulse 1.1s ease-in-out infinite 0.2s" }} />
                          <rect x="7" y="0" width="2" height="12" rx="1" style={{ animation: "pulse 0.85s ease-in-out infinite 0.4s" }} />
                          <rect x="10.5" y="2" width="2" height="9" rx="1" style={{ animation: "pulse 1.3s ease-in-out infinite 0.1s" }} />
                          <rect x="14" y="5" width="2" height="4" rx="1" className="animate-pulse" />
                        </svg>
                        48kHz Lossless Opus
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">SyncInk Radio</h3>
                      <span className="text-slate-600 hidden sm:inline">•</span>
                      <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-black/50 border border-purple-500/30 shadow-inner">
                        <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Engine:</span>
                        <img
                          src="/audia-ai-logo.png"
                          alt="Audia AI"
                          className="h-3.5 sm:h-4 object-contain brightness-110"
                        />
                      </div>
                    </div>
                    <p className="text-sm text-slate-300 mt-1 max-w-xl leading-relaxed">
                      Next-generation 24/7 high-fidelity music streaming bot for Discord, powered natively by{" "}
                      <span className="text-white font-semibold">Audia AI</span>. Seamlessly learns personal listener taste vectors, executes continuous AutoPlay, and enforces strict zero-bleed acoustic and language isolation.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
                  <div className="flex-1 lg:flex-initial justify-center h-10 px-4 rounded-lg bg-purple-500/15 border border-purple-500/30 text-purple-300 font-semibold text-xs flex items-center gap-2 select-none">
                    <Clock className="w-3.5 h-3.5 text-purple-400" />
                    <span>Coming Soon</span>
                  </div>
                  <Link
                    href="/audia"
                    className="flex-1 lg:flex-initial justify-center h-10 px-4 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition-colors flex items-center gap-2 active:scale-[0.98] shadow-md shadow-purple-900/30"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Audia AI Spec</span>
                  </Link>
                  <Link
                    href="/updates"
                    className="flex-1 lg:flex-initial justify-center h-10 px-4 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 font-semibold text-xs transition-colors border border-white/[0.06] flex items-center gap-2 active:scale-[0.98]"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                    <span>Changelog</span>
                  </Link>
                  <a
                    href="https://discord.gg/PmxfJwmQuB"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hidden sm:inline-flex h-10 px-3.5 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] text-xs text-slate-400 hover:text-white items-center gap-1.5 transition-colors"
                    title="Test pre-release on official server"
                  >
                    <span>Beta Discord</span>
                    <ExternalLink className="w-3 h-3 text-slate-500" />
                  </a>
                </div>
              </div>

              {/* Audia AI Embedded Engine Rack with Live Studio Telemetry */}
              <div className="my-6 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#140b22]/90 via-[#0d0918]/90 to-[#120a24]/90 border border-purple-500/25 relative overflow-hidden shadow-lg">
                <div className="absolute top-0 right-1/4 w-60 h-20 bg-purple-500/10 blur-2xl pointer-events-none" />

                <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-xl bg-purple-500/15 border border-purple-500/30 p-2 flex items-center justify-center shrink-0">
                      <img
                        src="/audia-ai-logo.png"
                        alt="Audia AI Engine Logo"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-white">Audia AI Engine</span>
                        <span className="text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                          v1.0 Core
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Deep learning taste vectorization • 6-stage recommendation cycle • Zero-bleed filter
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 self-stretch md:self-auto justify-between md:justify-end border-t md:border-t-0 pt-3 md:pt-0 border-white/[0.06]">
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <span className="text-[11px] text-slate-400">Commands:</span>
                      <code className="text-purple-300 font-bold bg-black/60 px-2 py-0.5 rounded-md border border-purple-500/30 text-[11px]">/audia</code>
                      <code className="text-slate-400 bg-black/40 px-1.5 py-0.5 rounded-md border border-white/10 text-[11px]">/dj</code>
                    </div>
                    <Link
                      href="/audia"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-purple-300 hover:text-white transition-colors bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 px-2.5 py-1 rounded-lg"
                    >
                      <span>Engine Architecture</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>

                {/* Real-Time Studio Telemetry Metrics with Custom SVG Symbols */}
                <div className="mt-4 pt-3.5 border-t border-white/[0.06] grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-black/30 border border-white/[0.04]">
                    <svg className="w-3.5 h-3.5 text-purple-400 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                      <rect x="2" y="9" width="3" height="6" rx="1.5" />
                      <rect x="8" y="4" width="3" height="16" rx="1.5" />
                      <rect x="14" y="7" width="3" height="10" rx="1.5" />
                      <rect x="20" y="10" width="3" height="4" rx="1.5" />
                    </svg>
                    <div>
                      <div className="text-[10px] text-slate-500 uppercase font-mono">Audio Format</div>
                      <div className="font-semibold text-slate-200">Opus 48kHz Stereo</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 p-2 rounded-lg bg-black/30 border border-white/[0.04]">
                    <svg className="w-3.5 h-3.5 text-fuchsia-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                      <path d="M18.178 8c5.096 0 5.096 8 0 8-5.095 0-7.26-8-12.355-8-5.096 0-5.096 8 0 8 5.095 0 7.26-8 12.355-8z" />
                    </svg>
                    <div>
                      <div className="text-[10px] text-slate-500 uppercase font-mono">AutoPlay</div>
                      <div className="font-semibold text-slate-200">Continuous AI Loop</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 p-2 rounded-lg bg-black/30 border border-white/[0.04]">
                    <svg className="w-3.5 h-3.5 text-indigo-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <line x1="4" y1="21" x2="4" y2="14" />
                      <line x1="4" y1="10" x2="4" y2="3" />
                      <line x1="12" y1="21" x2="12" y2="12" />
                      <line x1="12" y1="8" x2="12" y2="3" />
                      <line x1="20" y1="21" x2="20" y2="16" />
                      <line x1="20" y1="12" x2="20" y2="3" />
                      <circle cx="4" cy="12" r="2" fill="currentColor" />
                      <circle cx="12" cy="10" r="2" fill="currentColor" />
                      <circle cx="20" cy="14" r="2" fill="currentColor" />
                    </svg>
                    <div>
                      <div className="text-[10px] text-slate-500 uppercase font-mono">Personal Taste</div>
                      <div className="font-semibold text-slate-200">Mathematical Vectors</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 p-2 rounded-lg bg-black/30 border border-white/[0.04]">
                    <svg className="w-3.5 h-3.5 text-emerald-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                      <path d="M9 12l2 2 4-4" />
                    </svg>
                    <div>
                      <div className="text-[10px] text-slate-500 uppercase font-mono">Language Lock</div>
                      <div className="font-semibold text-emerald-300">Strict Zero-Bleed</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Genre / Mood Showcase */}
              <div className="pt-1 pb-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Curated Moods &amp; AutoPlay Genres (Strict Language Isolation)
                  </p>
                  <Link
                    href="/audia#sec-05"
                    className="text-[11px] text-purple-400 hover:text-purple-300 font-medium transition-colors"
                  >
                    View Signal Processing →
                  </Link>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { name: "Romantic & Soulful", id: "1568327378504130600" },
                    { name: "Lo-Fi & Chill", id: "1568327227983007864" },
                    { name: "Energetic & High BPM", id: "1568327456434430093" },
                    { name: "Punjabi Pop & Urban", id: "1568327108533551144" },
                    { name: "Hip-Hop & Rap", id: "1568327544279662663" },
                    { name: "Indie Acoustic", id: "1568327695639650464" },
                    { name: "EDM & Dance", id: "1568327771501895762" },
                    { name: "K-Pop", id: "1568327830981583039" },
                  ].map((genre) => (
                    <div
                      key={genre.id}
                      className="flex items-center gap-1.5 px-2.5 py-1 bg-white/[0.03] border border-white/[0.06] hover:border-purple-500/30 rounded-lg text-xs text-slate-300 transition-colors"
                    >
                      <img
                        src={`https://cdn.discordapp.com/emojis/${genre.id}.png`}
                        className="w-4 h-4 object-contain select-none"
                        alt=""
                      />
                      <span>{genre.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Feature grid with Studio SVG Symbols */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-4 border-t border-white/[0.04]">
                <FeatureItem
                  icon={AutoPlayWaveSymbol}
                  title="Audia AI AutoPlay"
                  description="Six-stage recommendation pipeline continuously analyzes track completions, skips, and vibes to queue the next song automatically."
                  accentClass="bg-purple-500/10 text-purple-400"
                />
                <FeatureItem
                  icon={ParametricTasteSymbol}
                  title="Parametric Taste Modeling"
                  description="Builds structured mathematical preference weights from your play history and explicit like/dislike ratings."
                  accentClass="bg-purple-500/10 text-purple-400"
                />
                <FeatureItem
                  icon={AcousticIsolationSymbol}
                  title="Acoustic & Language Isolation"
                  description="Multi-attribute classifier eliminates repetitive loops and guarantees strict zero-bleed language boundaries."
                  accentClass="bg-purple-500/10 text-purple-400"
                />
              </div>
            </div>
          </div>

          {/* ─── BOT 4: SUPPORT & SECURITY BOT ─────────────────────── */}
          <div className="rounded-2xl bg-surface border border-white/[0.06] hover:border-indigo-500/30 transition-all duration-200 overflow-hidden">
            <div className="p-6 sm:p-8 lg:p-10">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pb-6 border-b border-white/[0.06]">
                <div className="flex items-start sm:items-center gap-4">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0 overflow-hidden">
                    <img
                      src="/syncink-main-logo.png"
                      alt="SyncInk Support Bot"
                      className="w-10 h-10 sm:w-12 sm:h-12 object-contain rounded-xl"
                    />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/15">
                        Internal Only
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/15">
                        Active Defense
                      </span>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-black text-white">Support &amp; Security Bot</h3>
                    <p className="text-sm text-slate-300 mt-1 max-w-lg leading-relaxed">
                      Dedicated defense shield protecting the official SyncInk Support Server 24/7.
                      Raid dampening, quarantine isolation, and synchronized moderation logs.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
                  <Link
                    href="/dashboard/security"
                    className="flex-1 lg:flex-initial justify-center h-10 px-5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors flex items-center gap-2 active:scale-[0.98]"
                  >
                    <Shield className="w-3.5 h-3.5" />
                    <span>Security Console</span>
                  </Link>
                  <span className="hidden sm:inline-flex h-10 px-4 rounded-lg bg-white/[0.03] border border-white/[0.06] text-[11px] font-mono text-slate-400 items-center">
                    ID: 1520457643842342912
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-6">
                <FeatureItem
                  icon={Shield}
                  title="Velocity Raid Dampeners"
                  description="Real-time join spike and message velocity dampening. Engages emergency lockdown in milliseconds."
                  accentClass="bg-indigo-500/10 text-indigo-400"
                />
                <FeatureItem
                  icon={Lock}
                  title="Quarantine Isolation"
                  description="Threat actors are stripped of interaction rights and jailed in quarantine automatically."
                  accentClass="bg-indigo-500/10 text-indigo-400"
                />
                <FeatureItem
                  icon={Activity}
                  title="Persistent Database Sync"
                  description="Moderation cases, strike tallies, and audit trails synchronized to a high-availability PostgreSQL engine."
                  accentClass="bg-indigo-500/10 text-indigo-400"
                />
              </div>
            </div>
          </div>

          {/* ═════════════════════════════════════════════════════════
             FAQ ACCORDION
             ═════════════════════════════════════════════════════════ */}
          <div className="rounded-2xl bg-surface border border-white/[0.06] p-6 sm:p-10">
            <div className="text-center max-w-lg mx-auto mb-6">
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-2">Help</p>
              <h3 className="text-xl sm:text-2xl font-black text-white">
                Frequently Asked Questions
              </h3>
            </div>

            <div className="max-w-2xl mx-auto space-y-2">
              {FAQ_ITEMS.map((faq, idx) => {
                const isOpen = openFaq === idx;
                return (
                  <div
                    key={idx}
                    className={`border rounded-xl overflow-hidden transition-colors ${
                      isOpen
                        ? "border-blue-500/20 bg-blue-500/[0.03]"
                        : "border-white/[0.06] bg-white/[0.01] hover:border-white/[0.1]"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaq(isOpen ? null : idx)}
                      className="w-full flex items-center justify-between p-4 text-left text-sm font-semibold text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-inset rounded-xl"
                      aria-expanded={isOpen}
                    >
                      <span className="pr-4">{faq.q}</span>
                      <ChevronDown
                        className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
                          isOpen ? "rotate-180 text-blue-400" : ""
                        }`}
                      />
                    </button>

                    <AnimatePresence>
                      {isOpen && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={transition.expand}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-4 text-sm text-slate-300 leading-relaxed border-t border-white/[0.04] pt-3">
                            {faq.a}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ═════════════════════════════════════════════════════════
             RECRUITMENT CTA
             ═════════════════════════════════════════════════════════ */}
          <div className="rounded-2xl bg-surface border border-white/[0.06] p-8 sm:p-12 text-center">
            <div className="max-w-lg mx-auto space-y-4">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/15 flex items-center justify-center mx-auto text-blue-400">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white">
                Join the Team
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                Passionate about community moderation or bot development? Apply through
                our portal with your Discord account in under two minutes.
              </p>
              <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                <Link
                  href="/apply"
                  className="h-10 px-6 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-colors flex items-center gap-2 active:scale-[0.98]"
                >
                  <span>Apply Now</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <a
                  href="https://discord.gg/PmxfJwmQuB"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-10 px-6 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-200 font-semibold text-sm transition-colors border border-white/[0.06] flex items-center gap-2 active:scale-[0.98]"
                >
                  <span>Discord Server</span>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
