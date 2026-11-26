"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence, MotionConfig, useReducedMotion, useInView } from "framer-motion";
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
import { LivePulseBadge, AnimatedCounter } from "@/components/MotionWrapper";
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
    q: "Is SyncInk Radio and Audia AI publicly available?",
    a: "Yes! SyncInk Radio powered natively by Audia AI is officially released and publicly available. You can invite the bot to your Discord server or manage audio telemetry, station presets, and taste models directly via our web dashboard at syncink.site/dashboard/radio.",
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
    <div className="p-4 rounded-lg bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.1] transition-colors space-y-1.5">
      <div className="flex items-center gap-2.5">
        <div className={`w-7 h-7 rounded-md ${iconBg} flex items-center justify-center shrink-0`}>
          <Icon className={`w-3.5 h-3.5 ${iconColor}`} />
        </div>
        <span className="font-medium text-sm text-white">{title}</span>
      </div>
      <p className="text-xs text-slate-400 leading-relaxed pl-[38px]">{description}</p>
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

  const [botAvatarUrl, setBotAvatarUrl] = useState<string>("/syncink-support-logo.png");
  const [hasLoadedSecurity, setHasLoadedSecurity] = useState(false);
  const statusSectionRef = useRef<HTMLDivElement>(null);
  const isStatusInView = useInView(statusSectionRef, { once: true, margin: "-40px" });
  const shouldReduceMotion = useReducedMotion();
  const isCountersActive = hasLoadedSecurity && (isStatusInView || shouldReduceMotion);

  // Safety fallback ensures numbers activate even if API is slow
  useEffect(() => {
    const timer = setTimeout(() => {
      setHasLoadedSecurity(true);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

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
          if (data.botAvatarUrl) {
            setBotAvatarUrl(data.botAvatarUrl);
          }
          setHasLoadedSecurity(true);
        }
      } catch {
        // Fallback remains operational
        if (mounted) setHasLoadedSecurity(true);
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
    <MotionConfig reducedMotion="user">
    <div className="min-h-screen bg-[#060812] text-slate-100 flex flex-col font-sans selection:bg-brand-blue selection:text-white relative overflow-x-hidden">
      <PublicNavbar />

      <main className="flex-1">
        {/* ═════════════════════════════════════════════════════════════
           HERO — Clear hierarchy, immediate visibility, reliable render
           ═════════════════════════════════════════════════════════════ */}
        <section className="pt-20 sm:pt-28 pb-16 sm:pb-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
          <div className="text-center">
            <h1 className="text-3xl sm:text-5xl lg:text-[3.25rem] font-semibold text-white tracking-tight leading-[1.14] max-w-3xl mx-auto mb-4">
              Discord infrastructure engineered for high-velocity communities
            </h1>

            <p className="text-sm sm:text-base text-slate-400 max-w-xl mx-auto leading-relaxed mb-8">
              Private-thread ticketing, ephemeral voice generation, 24/7 lossless radio streaming with Audia AI, and autonomous support server defense.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <a
                href="#bots"
                className="h-10 px-5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm transition-colors flex items-center gap-2"
              >
                <span>Explore bots</span>
                <ChevronRight className="w-4 h-4 text-blue-200" />
              </a>

              <Link
                href="/dashboard"
                className="h-10 px-5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-slate-200 font-medium text-sm transition-colors border border-white/[0.08] flex items-center gap-2"
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
        <section className="px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto mb-16">
          <div ref={statusSectionRef} className="p-5 sm:p-6 rounded-xl bg-[#0c0f18] border border-white/[0.08]">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-5 border-b border-white/[0.06]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-slate-300 shrink-0">
                  <Activity className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-sm">Support server telemetry</h3>
                  <p className="text-xs text-slate-400">Live operational metrics &amp; defense state from active bot instances</p>
                </div>
              </div>
              <LivePulseBadge label={securityData.raidState === "NORMAL" ? "Operational" : "Threat Detected"} />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
              {/* Threat Level */}
              <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                <div className="text-[11px] text-slate-400 font-mono mb-1">Threat level</div>
                <motion.div
                  key={securityData.raidState}
                  initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className={`text-lg sm:text-xl font-mono font-semibold ${
                    securityData.raidState === "NORMAL"
                      ? "text-emerald-400"
                      : "text-red-400"
                  }`}
                >
                  {securityData.raidState === "NORMAL" ? "SECURE" : securityData.raidState}
                </motion.div>
              </div>

              {/* Mod Cases */}
              <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                <div className="text-[11px] text-slate-400 font-mono mb-1">Mod cases</div>
                <div className="text-lg sm:text-xl font-mono font-semibold text-white tabular-nums">
                  <AnimatedCounter
                    value={securityData.modCasesCount}
                    delay={0}
                    duration={1700}
                    enabled={isCountersActive}
                  />
                </div>
              </div>

              {/* Quarantined */}
              <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                <div className="text-[11px] text-slate-400 font-mono mb-1">Quarantined</div>
                <div className="text-lg sm:text-xl font-mono font-semibold text-white tabular-nums">
                  <AnimatedCounter
                    value={securityData.jailedCount}
                    delay={150}
                    duration={1700}
                    enabled={isCountersActive}
                  />
                </div>
              </div>

              {/* Incidents */}
              <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                <div className="text-[11px] text-slate-400 font-mono mb-1">Incidents</div>
                <div className="text-lg sm:text-xl font-mono font-semibold text-white tabular-nums">
                  <AnimatedCounter
                    value={securityData.incidentCount}
                    delay={300}
                    duration={1700}
                    enabled={isCountersActive}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═════════════════════════════════════════════════════════════
           BOT SHOWCASE — Each bot has distinct visual treatment
           ═════════════════════════════════════════════════════════════ */}
        <section id="bots" className="px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-12 pb-20">
          <div className="text-center mb-4">
            <p className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-1">Ecosystem</p>
            <h2 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight">
              Four bots. One coordinated platform.
            </h2>
          </div>

          {/* ─── BOT 1: TICKET BOT ─────────────────────────────────── */}
          <div className="rounded-xl bg-[#0c0f18] border border-white/[0.08] transition-colors overflow-hidden">
            <div className="p-6 sm:p-8">
              {/* Header row */}
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pb-6 border-b border-white/[0.06]">
                <div className="flex items-start sm:items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-[#101420] border border-white/[0.08] flex items-center justify-center shrink-0 overflow-hidden">
                    <img
                      src="/ticket-logo.png"
                      alt="SyncInk Ticket Bot"
                      className="w-10 h-10 sm:w-11 sm:h-11 object-contain rounded-lg"
                      onError={(e) => { (e.target as HTMLElement).style.display = "none"; }}
                    />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        Support tickets
                      </span>
                      <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-white/[0.04] text-slate-300 border border-white/[0.06]">
                        Private threads
                      </span>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-semibold text-white">SyncInk Ticket Bot</h3>
                    <p className="text-sm text-slate-400 mt-1 max-w-lg leading-relaxed">
                      Private-thread ticket isolation, intelligent claim system, automated transcripts, and role-based access — one seamless workflow.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
                  <a
                    href="https://discord.com/oauth2/authorize?client_id=1513075101992747158&permissions=361046068240&integration_type=0&scope=bot+applications.commands"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 lg:flex-initial justify-center h-9 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs transition-colors flex items-center gap-2"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-blue-200" />
                    <span>Invite bot</span>
                  </a>
                  <Link
                    href="/dashboard/tickets"
                    className="flex-1 lg:flex-initial justify-center h-9 px-4 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 font-medium text-xs transition-colors border border-white/[0.08] flex items-center gap-2"
                  >
                    <span>Dashboard</span>
                  </Link>
                </div>
              </div>

              {/* Category tags */}
              <div className="pt-5 pb-4">
                <p className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-2.5">Customizable categories</p>
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
          <div className="rounded-xl bg-[#0c0f18] border border-white/[0.08] transition-colors overflow-hidden">
            <div className="p-6 sm:p-8">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pb-6 border-b border-white/[0.06]">
                <div className="flex items-start sm:items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-[#101420] border border-white/[0.08] flex items-center justify-center shrink-0 overflow-hidden">
                    <img
                      src="/voice-logo.png"
                      alt="SyncInk Voice Bot"
                      className="w-10 h-10 sm:w-11 sm:h-11 object-contain rounded-lg"
                      onError={(e) => { (e.target as HTMLElement).style.display = "none"; }}
                    />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                        Voice channels
                      </span>
                      <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-white/[0.04] text-slate-300 border border-white/[0.06]">
                        Auto-generator
                      </span>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-semibold text-white">SyncInk Voice Bot</h3>
                    <p className="text-sm text-slate-400 mt-1 max-w-lg leading-relaxed">
                      Dynamic temporary voice channel manager. Users click a generator hub to create a room with custom naming, user limits, and instant cleanup when empty.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
                  <a
                    href="https://discord.com/oauth2/authorize?client_id=1516578887109181520&permissions=285220880&integration_type=0&scope=bot+applications.commands"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 lg:flex-initial justify-center h-9 px-4 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs transition-colors flex items-center gap-2"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-cyan-200" />
                    <span>Invite bot</span>
                  </a>
                  <Link
                    href="/dashboard"
                    className="flex-1 lg:flex-initial justify-center h-9 px-4 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 font-medium text-xs transition-colors border border-white/[0.08] flex items-center gap-2"
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
          <div className="rounded-xl bg-[#0c0f18] border border-white/[0.08] transition-colors overflow-hidden">
            <div className="p-6 sm:p-8">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pb-6 border-b border-white/[0.06]">
                <div className="flex items-start sm:items-center gap-4">
                  <div className="relative group/avatar shrink-0">
                    <div className="w-14 h-14 rounded-xl bg-[#101420] border border-white/[0.08] p-1 flex items-center justify-center shrink-0 overflow-hidden">
                      <img
                        src="/radio-logo.png"
                        alt="SyncInk Radio Official Logo"
                        className="w-full h-full object-contain rounded-lg select-none"
                      />
                    </div>
                    {/* Live Opus Audio Stream Indicator */}
                    <div className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded bg-[#090810] border border-white/10 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span className="text-[9px] font-mono font-medium text-slate-300">OPUS</span>
                    </div>
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-purple-500/10 text-purple-300 border border-purple-500/20 flex items-center gap-1.5">
                        <Sparkles className="w-3 h-3 text-purple-400" />
                        Powered by Audia AI
                      </span>
                      <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        Official release
                      </span>
                      <span className="hidden sm:inline-flex px-2 py-0.5 rounded text-[11px] font-mono text-slate-400 bg-white/[0.04] border border-white/[0.06]">
                        48kHz Opus
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h3 className="text-xl sm:text-2xl font-semibold text-white tracking-tight">SyncInk Radio</h3>
                      <span className="text-slate-600 hidden sm:inline">•</span>
                      <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-white/[0.04] border border-white/[0.08]">
                        <span className="text-[10px] text-slate-400 font-mono uppercase">Engine:</span>
                        <img
                          src="/audia-symbol.png"
                          alt="Audia AI"
                          className="w-3.5 h-3.5 object-contain"
                        />
                        <span className="text-xs font-medium text-white">Audia AI</span>
                      </div>
                    </div>
                    <p className="text-sm text-slate-400 mt-1 max-w-xl leading-relaxed">
                      24/7 lossless music streaming for Discord powered natively by{" "}
                      <span className="text-white font-medium">Audia AI</span>. Learns personal listener taste vectors, executes continuous AutoPlay, and enforces strict zero-bleed acoustic isolation.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
                  <a
                    href="https://discord.com/oauth2/authorize?client_id=1500567606648897819&permissions=8&scope=bot%20applications.commands"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 lg:flex-initial justify-center h-9 px-4 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-medium text-xs transition-colors flex items-center gap-2"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-purple-200" />
                    <span>Invite bot</span>
                  </a>
                  <Link
                    href="/dashboard/radio"
                    className="flex-1 lg:flex-initial justify-center h-9 px-3.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-slate-200 font-medium text-xs transition-colors border border-white/[0.08] flex items-center gap-1.5"
                  >
                    <Radio className="w-3.5 h-3.5 text-purple-400" />
                    <span>Dashboard</span>
                  </Link>
                  <Link
                    href="/audia"
                    className="flex-1 lg:flex-initial justify-center h-9 px-3.5 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/20 font-medium text-xs transition-colors flex items-center gap-1.5"
                  >
                    <FileText className="w-3.5 h-3.5 text-purple-400" />
                    <span>Spec</span>
                  </Link>
                  <Link
                    href="/updates"
                    className="flex-1 lg:flex-initial justify-center h-9 px-3.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 font-medium text-xs transition-colors border border-white/[0.06] flex items-center gap-1.5"
                  >
                    <span>Changelog</span>
                  </Link>
                </div>
              </div>

              {/* Audia AI Embedded Engine Rack with Live Studio Telemetry */}
              <div className="my-5 p-4 rounded-xl bg-[#090812] border border-white/[0.08]">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-lg bg-[#141224] border border-white/[0.12] p-1.5 flex items-center justify-center shrink-0">
                      <img
                        src="/audia-symbol.png"
                        alt="Audia AI Logo"
                        className="w-full h-full object-contain select-none"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = "https://cdn.discordapp.com/emojis/1571879222908031078.png";
                        }}
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-white">Audia AI Engine</span>
                        <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20">
                          v1.0 Core
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Deep learning taste vectorization • 6-stage recommendation cycle • Zero-bleed filter
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5 self-stretch md:self-auto justify-between md:justify-end border-t md:border-t-0 pt-3 md:pt-0 border-white/[0.06]">
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <span className="text-[11px] font-mono text-slate-400">Commands:</span>
                      <code className="text-purple-300 font-mono bg-white/[0.04] px-2 py-0.5 rounded border border-white/[0.08] text-[11px]">/audia</code>
                    </div>
                    <Link
                      href="/audia"
                      className="inline-flex items-center gap-1 text-xs font-medium text-purple-300 hover:text-white transition-colors bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 px-2.5 py-1 rounded-lg"
                    >
                      <span>Engine architecture</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>

                {/* Real-Time Studio Telemetry Metrics */}
                <div className="mt-3.5 pt-3.5 border-t border-white/[0.06] grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                    <div className="text-[10px] text-slate-500 font-mono uppercase">Audio format</div>
                    <div className="font-mono text-xs font-medium text-slate-200 mt-0.5">Opus 48kHz Stereo</div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                    <div className="text-[10px] text-slate-500 font-mono uppercase">Autoplay</div>
                    <div className="font-mono text-xs font-medium text-slate-200 mt-0.5">Continuous AI loop</div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                    <div className="text-[10px] text-slate-500 font-mono uppercase">Personal taste</div>
                    <div className="font-mono text-xs font-medium text-slate-200 mt-0.5">Mathematical vectors</div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                    <div className="text-[10px] text-slate-500 font-mono uppercase">Language lock</div>
                    <div className="font-mono text-xs font-medium text-emerald-400 mt-0.5">Strict zero-bleed</div>
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
          <div className="rounded-xl bg-[#0c0f18] border border-white/[0.08] transition-colors overflow-hidden">
            <div className="p-6 sm:p-8">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pb-6 border-b border-white/[0.06]">
                <div className="flex items-start sm:items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-[#101420] border border-white/[0.08] p-1 flex items-center justify-center shrink-0 overflow-hidden">
                    <img
                      src={botAvatarUrl || "/syncink-support-logo.png"}
                      alt="SyncInk Support Bot"
                      className="w-full h-full object-cover rounded-lg select-none"
                      onError={(e) => {
                        if (e.currentTarget.src !== "/syncink-support-logo.png") {
                          e.currentTarget.src = "/syncink-support-logo.png";
                        }
                      }}
                    />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                        Internal only
                      </span>
                      <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        Active defense
                      </span>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-semibold text-white">Support &amp; Security Bot</h3>
                    <p className="text-sm text-slate-400 mt-1 max-w-lg leading-relaxed">
                      Dedicated defense shield protecting the official SyncInk Support Server 24/7.
                      Raid dampening, quarantine isolation, and synchronized moderation logs.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
                  <Link
                    href="/dashboard/security"
                    className="flex-1 lg:flex-initial justify-center h-9 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition-colors flex items-center gap-2"
                  >
                    <Shield className="w-3.5 h-3.5" />
                    <span>Security Console</span>
                  </Link>
                  <span className="hidden sm:inline-flex h-9 px-3.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-[11px] font-mono text-slate-400 items-center">
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
          <div className="rounded-xl bg-[#0c0f18] border border-white/[0.08] p-6 sm:p-10">
            <div className="text-center max-w-lg mx-auto mb-6">
              <p className="text-xs font-mono text-slate-400 mb-1">Help</p>
              <h3 className="text-xl sm:text-2xl font-semibold text-white">
                Frequently asked questions
              </h3>
            </div>

            <div className="max-w-2xl mx-auto space-y-2">
              {FAQ_ITEMS.map((faq, idx) => {
                const isOpen = openFaq === idx;
                return (
                  <div
                    key={idx}
                    className={`border rounded-lg overflow-hidden transition-colors ${
                      isOpen
                        ? "border-blue-500/20 bg-blue-500/[0.03]"
                        : "border-white/[0.06] bg-white/[0.01] hover:border-white/[0.1]"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaq(isOpen ? null : idx)}
                      className="w-full flex items-center justify-between p-4 text-left text-sm font-medium text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-lg"
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
                          <div className="px-4 pb-4 text-xs sm:text-sm text-slate-400 leading-relaxed border-t border-white/[0.04] pt-3">
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
          <div className="rounded-xl bg-[#0c0f18] border border-white/[0.08] p-8 sm:p-12 text-center">
            <div className="max-w-lg mx-auto space-y-4">
              <div className="w-10 h-10 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center mx-auto text-blue-400">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="text-xl sm:text-2xl font-semibold text-white">
                Join the team
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Passionate about community moderation or bot development? Apply through
                our portal with your Discord account in under two minutes.
              </p>
              <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                <Link
                  href="/apply"
                  className="h-9 px-5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs transition-colors flex items-center gap-2"
                >
                  <span>Apply now</span>
                  <ArrowRight className="w-3.5 h-3.5 text-blue-200" />
                </Link>
                <a
                  href="https://discord.gg/PmxfJwmQuB"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-9 px-5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 font-medium text-xs transition-colors border border-white/[0.08] flex items-center gap-2"
                >
                  <span>Discord server</span>
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
    </MotionConfig>
  );
}
