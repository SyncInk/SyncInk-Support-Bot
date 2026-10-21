"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  MessageSquare,
  Radio,
  Music,
  Shield,
  Sparkles,
  ChevronRight,
  ExternalLink,
  Lock,
  ArrowRight,
  Users,
  Activity,
  CheckCircle2,
  Zap,
  Sliders,
  Layers,
  FileCheck,
  ChevronDown,
  HelpCircle,
  Clock,
  Terminal,
} from "lucide-react";
import { PublicNavbar } from "@/components/PublicNavbar";
import { PublicFooter } from "@/components/PublicFooter";
import { AmbientBackground } from "@/components/AmbientBackground";
import { LivePulseBadge } from "@/components/MotionWrapper";

const FAQ_ITEMS = [
  {
    q: "How do I invite and set up SyncInk Ticket Bot?",
    a: "Click 'Invite Bot' on the Ticket Bot showcase card above to authorize it with your Discord server. Once invited, run the /setup command in your designated admin channel to generate your interactive ticket panel.",
  },
  {
    q: "How does the Dynamic Voice generator work?",
    a: "SyncInk Voice Bot creates an automated master generator hub. Whenever a member connects to the hub, the bot instantly spawns a dedicated temporary voice channel with full owner controls (/voice lock, /voice limit) and auto-deletes it when empty.",
  },
  {
    q: "Why is the SyncInk Support & Security Bot non-invitable?",
    a: "The Support & Security Bot is custom-engineered specifically to protect the official SyncInk Support Server, running low-level velocity raid dampeners, quarantine isolation, and real-time strike database telemetry.",
  },
  {
    q: "How can I apply for the SyncInk Staff or Developer team?",
    a: "Sign in with your verified Discord account and navigate to our Team Apply portal (/apply). Your submission is enqueued directly into our bot gateway and evaluated in the Owner Control Panel.",
  },
];

export default function HomePage() {
  const shouldReduceMotion = useReducedMotion();
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

  // Fetch real-time monitoring telemetry
  useEffect(() => {
    async function fetchMonitoring() {
      try {
        const res = await fetch("/api/security");
        if (res.ok) {
          const data = await res.json();
          setSecurityData({
            raidState: data.raidState || "NORMAL",
            jailedCount: data.stats?.jailedCount || 0,
            incidentCount: data.stats?.incidentCount || 0,
            modCasesCount: data.stats?.modCasesCount || 0,
          });
        }
      } catch (err) {
        console.error("Telemetry poll failed:", err);
      }
    }

    fetchMonitoring();
    const interval = setInterval(fetchMonitoring, 8000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#060812] text-slate-100 flex flex-col font-sans selection:bg-brand-blue selection:text-white relative overflow-x-hidden">
      {/* 1. Subtle GPU-Accelerated Ambient Light Orbs */}
      <AmbientBackground />

      {/* 2. Top-tier Header with Localized Greeting */}
      <PublicNavbar />

      <main className="relative z-10 flex-1">
        {/* ========================================================= */}
        {/* HERO SECTION */}
        {/* ========================================================= */}
        <section className="pt-16 sm:pt-24 pb-12 sm:pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
          {/* Subtle Top Flourish Badge */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs font-semibold tracking-wide mb-6 shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>Next-Generation Bot Ecosystem &amp; Telemetry</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
            className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.12] max-w-4xl mx-auto mb-5"
          >
            Discord Infrastructure{" "}
            <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent drop-shadow-[0_0_35px_rgba(88,101,242,0.35)]">
              Built For Performance.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
            className="text-sm sm:text-base md:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed mb-8 sm:mb-10 px-2"
          >
            Engineered for high-velocity communities. Explore private-thread ticket systems,
            dynamic temporary voice channels, and our dedicated Support Server security shield.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }}
            className="flex flex-wrap items-center justify-center gap-3 sm:gap-4"
          >
            <motion.a
              href="#bots"
              whileHover={shouldReduceMotion ? undefined : { scale: 1.02 }}
              whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
              className="h-11 sm:h-12 px-6 sm:px-7 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm transition-all shadow-[0_0_20px_rgba(88,101,242,0.35)] flex items-center gap-2 duration-200"
            >
              <span>Explore All Bots</span>
              <ChevronRight className="w-4 h-4" />
            </motion.a>

            <motion.div
              whileHover={shouldReduceMotion ? undefined : { scale: 1.02 }}
              whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
            >
              <Link
                href="/dashboard"
                className="h-11 sm:h-12 px-6 sm:px-7 rounded-xl bg-[#121626] hover:bg-[#1a2034] text-white font-bold text-xs sm:text-sm transition-all border border-blue-500/25 hover:border-blue-500/50 flex items-center gap-2 shadow-sm duration-200"
              >
                <Layers className="w-4 h-4 text-sky-400" />
                <span>Multi-Bot Console</span>
              </Link>
            </motion.div>

            <motion.div
              whileHover={shouldReduceMotion ? undefined : { scale: 1.02 }}
              whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
            >
              <Link
                href="/apply"
                className="h-11 sm:h-12 px-6 sm:px-7 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 font-bold text-xs sm:text-sm transition-all border border-white/10 flex items-center gap-2 duration-200"
              >
                <Sparkles className="w-4 h-4 text-blue-400" />
                <span>Apply for Team</span>
              </Link>
            </motion.div>
          </motion.div>
        </section>

        {/* ========================================================= */}
        {/* REAL-TIME MONITORING STRIP */}
        {/* ========================================================= */}
        <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto mb-16 sm:mb-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            className="p-5 sm:p-8 rounded-2xl sm:rounded-3xl bg-[#0b0e1a]/90 border border-blue-500/20 backdrop-blur-xl shadow-2xl relative overflow-hidden group hover:border-blue-500/35 transition-colors duration-300"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-white/[0.08] relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-300 shrink-0">
                  <Activity className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h3 className="font-extrabold text-white text-base">
                    Live Ecosystem Monitoring
                  </h3>
                  <p className="text-xs text-slate-400">
                    Real-time operational telemetry queried directly from active bot instances.
                  </p>
                </div>
              </div>

              {/* Accessible Live Telemetry Badge */}
              <LivePulseBadge label="Live Telemetry Active" />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6 pt-6 relative z-10">
              <motion.div
                whileHover={shouldReduceMotion ? undefined : { y: -3 }}
                className="text-center p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-white/[0.02] border border-white/[0.05] transition-all"
              >
                <div className="text-2xl sm:text-4xl lg:text-5xl font-black text-white drop-shadow-md">
                  150+
                </div>
                <div className="text-[11px] sm:text-xs md:text-sm font-semibold text-slate-400 mt-1 uppercase tracking-wider">
                  Active Servers
                </div>
              </motion.div>

              <motion.div
                whileHover={shouldReduceMotion ? undefined : { y: -3 }}
                className="text-center p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-white/[0.02] border border-white/[0.05] transition-all"
              >
                <div className="text-2xl sm:text-4xl lg:text-5xl font-black text-blue-400 drop-shadow-[0_0_15px_rgba(88,101,242,0.4)]">
                  25,000+
                </div>
                <div className="text-[11px] sm:text-xs md:text-sm font-semibold text-slate-400 mt-1 uppercase tracking-wider">
                  Tickets Resolved
                </div>
              </motion.div>

              <motion.div
                whileHover={shouldReduceMotion ? undefined : { y: -3 }}
                className="text-center p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-white/[0.02] border border-white/[0.05] transition-all"
              >
                <div className="text-2xl sm:text-4xl lg:text-5xl font-black text-cyan-400 drop-shadow-[0_0_15px_rgba(6,182,212,0.4)]">
                  540K+
                </div>
                <div className="text-[11px] sm:text-xs md:text-sm font-semibold text-slate-400 mt-1 uppercase tracking-wider">
                  Voice Minutes
                </div>
              </motion.div>

              <motion.div
                whileHover={shouldReduceMotion ? undefined : { y: -3 }}
                className="text-center p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-white/[0.02] border border-white/[0.05] transition-all"
              >
                <div
                  className={`text-2xl sm:text-4xl lg:text-5xl font-black ${
                    securityData.raidState === "NORMAL"
                      ? "text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.4)]"
                      : "text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]"
                  }`}
                >
                  {securityData.raidState === "NORMAL" ? "SECURE" : securityData.raidState}
                </div>
                <div className="text-[11px] sm:text-xs md:text-sm font-semibold text-slate-400 mt-1 uppercase tracking-wider">
                  Support Server
                </div>
              </motion.div>
            </div>
          </motion.div>
        </section>

        {/* ========================================================= */}
        {/* BOT SHOWCASE SECTION */}
        {/* ========================================================= */}
        <section id="bots" className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-16 sm:space-y-24 pb-20 sm:pb-24">
          <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-16">
            <div className="text-xs font-bold uppercase tracking-widest text-blue-400 mb-2">
              SyncInk Bot Suite
            </div>
            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
              Specialized Bots for Modern Communities
            </h2>
          </div>

          {/* ===================================================== */}
          {/* BOT 1: SYNCINK TICKET BOT */}
          {/* ===================================================== */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            whileHover={shouldReduceMotion ? undefined : { y: -3 }}
            className="rounded-3xl sm:rounded-[2.5rem] bg-[#0e0c1a]/95 border border-blue-500/25 hover:border-blue-500/50 p-5 sm:p-8 lg:p-12 backdrop-blur-xl shadow-2xl relative overflow-hidden transition-all duration-300"
          >
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 sm:gap-8 pb-6 sm:pb-10 border-b border-white/[0.08] relative z-10">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-blue-600/20 border-2 border-blue-500/40 shadow-[0_0_30px_rgba(88,101,242,0.3)] flex items-center justify-center shrink-0 overflow-hidden">
                  <img
                    src="/ticket-logo.png"
                    alt="SyncInk Ticket"
                    className="w-full h-full object-cover rounded-full"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = "none";
                    }}
                  />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-2 sm:mb-3">
                    <span className="px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full text-[11px] sm:text-xs font-bold uppercase tracking-wider bg-blue-500/15 text-blue-300 border border-blue-500/30">
                      Support Tickets
                    </span>
                    <span className="px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full text-[11px] sm:text-xs font-bold uppercase tracking-wider bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                      Private Threads
                    </span>
                    <span className="px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full text-[11px] sm:text-xs font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                      Auto-Transcripts
                    </span>
                  </div>
                  <h3 className="text-2xl sm:text-4xl font-black text-white drop-shadow-md">
                    SyncInk Ticket Bot
                  </h3>
                  <p className="text-sm sm:text-base text-slate-300 mt-2 sm:mt-3 max-w-2xl leading-relaxed">
                    <strong className="text-blue-300 block mb-1">Powerful. Automated. Professional.</strong>
                    A next-generation Discord ticket bot built for modern communities. Combines private-thread isolation,
                    intelligent claim systems, automated transcripts, and role transfers into one seamless workflow.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 shrink-0 w-full sm:w-auto">
                <a
                  href="https://discord.com/oauth2/authorize?client_id=1513075101992747158&permissions=361046068240&integration_type=0&scope=bot+applications.commands"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 sm:flex-initial justify-center px-5 sm:px-6 py-3 sm:py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm transition-all shadow-[0_0_20px_rgba(88,101,242,0.35)] flex items-center gap-2 active:scale-[0.98]"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Invite Bot</span>
                </a>
                <Link
                  href="/dashboard/tickets"
                  className="flex-1 sm:flex-initial justify-center px-5 sm:px-6 py-3 sm:py-3.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs sm:text-sm transition-all border border-white/10 flex items-center gap-2 active:scale-[0.98]"
                >
                  <Layers className="w-4 h-4 text-sky-400" />
                  <span>Open Dedicated Dashboard</span>
                </Link>
              </div>
            </div>

            {/* Custom Emoji Support Section */}
            <div className="pt-6 sm:pt-8 pb-3 relative z-10">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h4 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-400" />
                  <span>Fully Customizable Categories</span>
                </h4>
              </div>
              <div className="flex flex-wrap gap-2 sm:gap-3">
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
                    className="flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-black/40 border border-blue-500/20 rounded-lg text-xs sm:text-sm font-semibold text-slate-200"
                  >
                    <img
                      src={`https://cdn.discordapp.com/emojis/${cat.id}.png`}
                      className="w-4 h-4 sm:w-5 sm:h-5"
                      alt={cat.name}
                    />
                    <span>{cat.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Feature Highlights Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 pt-6 relative z-10 border-t border-white/5 mt-6">
              <div className="p-5 sm:p-6 rounded-2xl bg-black/40 border border-white/5 space-y-2.5 shadow-lg">
                <div className="text-blue-300 font-bold text-sm sm:text-base flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
                    <Lock className="w-4 h-4 text-blue-400" />
                  </div>
                  <span>Private Threads Engine</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  Avoids channel limits. Only the ticket creator and assigned moderators can view and participate.
                </p>
              </div>

              <div className="p-5 sm:p-6 rounded-2xl bg-black/40 border border-white/5 space-y-2.5 shadow-lg">
                <div className="text-blue-300 font-bold text-sm sm:text-base flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
                    <Zap className="w-4 h-4 text-blue-400" />
                  </div>
                  <span>Auto-Claim &amp; Mentions</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  Staff are automatically assigned when replying or mentioned inside any ticket thread.
                </p>
              </div>

              <div className="p-5 sm:p-6 rounded-2xl bg-black/40 border border-white/5 space-y-2.5 shadow-lg">
                <div className="text-blue-300 font-bold text-sm sm:text-base flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
                    <FileCheck className="w-4 h-4 text-blue-400" />
                  </div>
                  <span>Encrypted Transcripts</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  Full message logs, embedded screenshots, and timestamps are archived in our secure viewer.
                </p>
              </div>
            </div>
          </motion.div>

          {/* ===================================================== */}
          {/* BOT 2: SYNCINK VOICE BOT */}
          {/* ===================================================== */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            whileHover={shouldReduceMotion ? undefined : { y: -3 }}
            className="rounded-3xl sm:rounded-[2.5rem] bg-[#09111b]/95 border border-cyan-500/25 hover:border-cyan-500/50 p-5 sm:p-8 lg:p-12 backdrop-blur-xl shadow-2xl relative overflow-hidden transition-all duration-300"
          >
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 sm:gap-8 pb-6 sm:pb-10 border-b border-white/[0.08] relative z-10">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-cyan-600/20 border-2 border-cyan-500/40 shadow-[0_0_30px_rgba(6,182,212,0.3)] flex items-center justify-center shrink-0 overflow-hidden">
                  <img
                    src="/voice-logo.png"
                    alt="SyncInk Voice"
                    className="w-full h-full object-cover rounded-full"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = "none";
                    }}
                  />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-2 sm:mb-3">
                    <span className="px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full text-[11px] sm:text-xs font-bold uppercase tracking-wider bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                      Voice Channels
                    </span>
                    <span className="px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full text-[11px] sm:text-xs font-bold uppercase tracking-wider bg-blue-500/15 text-blue-300 border border-blue-500/30">
                      Auto-Generator
                    </span>
                    <span className="px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full text-[11px] sm:text-xs font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                      Lossless Audio
                    </span>
                  </div>
                  <h3 className="text-2xl sm:text-4xl font-black text-white drop-shadow-md">
                    SyncInk Voice Bot
                  </h3>
                  <p className="text-sm sm:text-base text-slate-300 mt-2 sm:mt-3 max-w-2xl leading-relaxed">
                    Dynamic temporary voice channel manager. Users click a generator hub to instantly create a room with custom naming patterns, user limits, and instant cleanup when empty.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 shrink-0 w-full sm:w-auto">
                <a
                  href="https://discord.com/oauth2/authorize?client_id=1516578887109181520&permissions=285220880&integration_type=0&scope=bot+applications.commands"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 sm:flex-initial justify-center px-5 sm:px-6 py-3 sm:py-3.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs sm:text-sm transition-all shadow-[0_0_20px_rgba(6,182,212,0.35)] flex items-center gap-2 active:scale-[0.98]"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Invite Bot</span>
                </a>
                <Link
                  href="/dashboard"
                  className="flex-1 sm:flex-initial justify-center px-5 sm:px-6 py-3 sm:py-3.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs sm:text-sm transition-all border border-white/10 flex items-center gap-2 active:scale-[0.98]"
                >
                  <Layers className="w-4 h-4 text-cyan-400" />
                  <span>Open Dedicated Dashboard</span>
                </Link>
              </div>
            </div>

            {/* Voice Feature Highlights */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 pt-6 relative z-10">
              <div className="p-5 sm:p-6 rounded-2xl bg-black/40 border border-white/5 space-y-2.5 shadow-lg">
                <div className="text-cyan-300 font-bold text-sm sm:text-base flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center shrink-0">
                    <Radio className="w-4 h-4 text-cyan-400" />
                  </div>
                  <span>Join-to-Create Hubs</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  Click a master hub to spawn a private temporary voice room with customizable naming schemes.
                </p>
              </div>

              <div className="p-5 sm:p-6 rounded-2xl bg-black/40 border border-white/5 space-y-2.5 shadow-lg">
                <div className="text-cyan-300 font-bold text-sm sm:text-base flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center shrink-0">
                    <Sliders className="w-4 h-4 text-cyan-400" />
                  </div>
                  <span>Owner Controls (/voice)</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  Creators can lock, ghost-hide, limit users, or kick members with quick slash commands and panels.
                </p>
              </div>

              <div className="p-5 sm:p-6 rounded-2xl bg-black/40 border border-white/5 space-y-2.5 shadow-lg">
                <div className="text-cyan-300 font-bold text-sm sm:text-base flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                  </div>
                  <span>Automatic Empty Purge</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  Channels are cleanly deleted within 1.5 seconds when the last user leaves, keeping server channels tidy.
                </p>
              </div>
            </div>
          </motion.div>

          {/* ===================================================== */}
          {/* BOT 3: SYNCINK SUPPORT & SECURITY BOT */}
          {/* ===================================================== */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            whileHover={shouldReduceMotion ? undefined : { y: -3 }}
            className="rounded-3xl sm:rounded-[2.5rem] bg-[#110d1f]/95 border border-blue-500/30 hover:border-blue-500/50 p-5 sm:p-8 lg:p-12 backdrop-blur-xl shadow-2xl relative overflow-hidden transition-all duration-300"
          >
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 sm:gap-8 pb-6 sm:pb-10 border-b border-white/[0.08] relative z-10">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-blue-600/20 border-2 border-blue-500/40 shadow-[0_0_40px_rgba(88,101,242,0.3)] flex items-center justify-center shrink-0 overflow-hidden">
                  <img
                    src="/syncink-main-logo.png"
                    alt="SyncInk Support Bot"
                    className="w-full h-full object-cover rounded-full"
                  />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-2 sm:mb-3">
                    <span className="px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full text-[11px] sm:text-xs font-bold uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-500/30">
                      🛡️ Internal Support Server Bot • Dedicated
                    </span>
                    <span className="px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full text-[11px] sm:text-xs font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                      Active Defense
                    </span>
                  </div>
                  <h3 className="text-2xl sm:text-4xl font-black text-white drop-shadow-md">
                    SyncInk Support &amp; Security Bot
                  </h3>
                  <p className="text-sm sm:text-base text-slate-300 mt-2 sm:mt-3 max-w-2xl leading-relaxed">
                    Dedicated defense shield protecting the official <strong>SyncInk Support Server</strong> 24/7.
                    Neutralizes raid attacks, manages quarantine isolation, and logs moderation cases in real time.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 shrink-0 w-full sm:w-auto">
                <span className="px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl bg-white/5 border border-white/10 text-xs font-mono text-blue-300 font-bold">
                  Server ID: 1520457643842342912
                </span>
                <Link
                  href="/dashboard/security"
                  className="flex-1 sm:flex-initial justify-center px-5 sm:px-6 py-3 sm:py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm transition-all shadow-[0_0_20px_rgba(88,101,242,0.35)] flex items-center gap-2 active:scale-[0.98]"
                >
                  <Shield className="w-4 h-4" />
                  <span>Security Console</span>
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 pt-6 relative z-10">
              <div className="p-5 sm:p-6 rounded-2xl bg-black/40 border border-white/5 space-y-2.5 shadow-lg">
                <div className="text-blue-300 font-bold text-sm sm:text-base flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
                    <Shield className="w-4 h-4 text-blue-400" />
                  </div>
                  <span>Velocity Raid Dampeners</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  Real-time join spike and message velocity dampening. Engages emergency lockdown in milliseconds.
                </p>
              </div>

              <div className="p-5 sm:p-6 rounded-2xl bg-black/40 border border-white/5 space-y-2.5 shadow-lg">
                <div className="text-blue-300 font-bold text-sm sm:text-base flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
                    <Lock className="w-4 h-4 text-blue-400" />
                  </div>
                  <span>Quarantine Isolation</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  Threat actors and bypass accounts are stripped of interaction rights and jailed in quarantine.
                </p>
              </div>

              <div className="p-5 sm:p-6 rounded-2xl bg-black/40 border border-white/5 space-y-2.5 shadow-lg">
                <div className="text-blue-300 font-bold text-sm sm:text-base flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
                    <Activity className="w-4 h-4 text-blue-400" />
                  </div>
                  <span>Real-Time Forensics</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  PostgreSQL database telemetry synchronizes moderation cases, strike tallies, and audit trails.
                </p>
              </div>
            </div>
          </motion.div>

          {/* ===================================================== */}
          {/* INTERACTIVE FAQ ACCORDION */}
          {/* ===================================================== */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.45 }}
            className="rounded-3xl sm:rounded-[2.5rem] bg-[#0b0e1a]/80 border border-white/[0.08] p-6 sm:p-12 relative overflow-hidden"
          >
            <div className="text-center max-w-xl mx-auto mb-8 sm:mb-10">
              <span className="text-xs font-bold uppercase tracking-widest text-sky-400 mb-2 block">
                Knowledge Base
              </span>
              <h3 className="text-xl sm:text-3xl font-black text-white">
                Frequently Asked Questions
              </h3>
            </div>

            <div className="max-w-3xl mx-auto space-y-3">
              {FAQ_ITEMS.map((faq, idx) => {
                const isOpen = openFaq === idx;
                return (
                  <div
                    key={idx}
                    className="border border-white/[0.06] rounded-2xl overflow-hidden bg-white/[0.02] transition-colors hover:border-white/10"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaq(isOpen ? null : idx)}
                      className="w-full flex items-center justify-between p-4 sm:p-5 text-left text-xs sm:text-sm font-bold text-white focus:outline-none"
                    >
                      <span>{faq.q}</span>
                      <ChevronDown
                        className={`w-4 h-4 text-slate-400 shrink-0 ml-3 transition-transform duration-200 ${
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
                          transition={{ duration: 0.25, ease: "easeInOut" }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-4 sm:px-5 sm:pb-5 text-xs sm:text-sm text-slate-400 leading-relaxed border-t border-white/[0.04] pt-3">
                            {faq.a}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* ===================================================== */}
          {/* RECRUITMENT CALLOUT */}
          {/* ===================================================== */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45 }}
            className="rounded-3xl sm:rounded-[2.5rem] bg-gradient-to-r from-[#120e24] via-[#10132b] to-[#150d24] border border-blue-500/30 p-6 sm:p-12 lg:p-16 text-center relative overflow-hidden shadow-[0_20px_60px_-15px_rgba(88,101,242,0.3)]"
          >
            <div className="max-w-2xl mx-auto space-y-4 sm:space-y-5 relative z-10">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-blue-600/20 border border-blue-500/40 flex items-center justify-center mx-auto text-blue-400 shadow-[0_0_30px_rgba(88,101,242,0.4)]">
                <Users className="w-7 h-7 sm:w-8 sm:h-8" />
              </div>
              <h3 className="text-2xl sm:text-4xl font-black text-white">
                Join the SyncInk Staff or Dev Team
              </h3>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed px-2">
                Passionate about community moderation or bot development? Apply through our unified portal with your Discord account in under two minutes.
              </p>
              <div className="pt-4 sm:pt-6 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Link
                    href="/apply"
                    className="w-full sm:w-auto justify-center px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl sm:rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm transition-all shadow-[0_0_20px_rgba(88,101,242,0.4)] flex items-center gap-2"
                  >
                    <span>Apply Now</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </motion.div>

                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <a
                    href="https://discord.gg/PmxfJwmQuB"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto justify-center px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl sm:rounded-2xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs sm:text-sm transition-all border border-white/10 flex items-center gap-2"
                  >
                    <span>Join Official Discord Server</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
