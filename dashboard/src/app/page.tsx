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
              and a dedicated support server security shield — engineered for
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
              Three bots. One ecosystem.
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

          {/* ─── BOT 3: SUPPORT & SECURITY BOT ─────────────────────── */}
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
