"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
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
} from "lucide-react";
import { PublicNavbar } from "@/components/PublicNavbar";
import { PublicFooter } from "@/components/PublicFooter";

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export default function HomePage() {
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
    const interval = setInterval(fetchMonitoring, 6000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#060812] text-slate-100 flex flex-col font-sans selection:bg-brand-blue selection:text-white relative overflow-x-hidden">
      {/* Navigation */}
      <PublicNavbar />

      <main className="relative z-10 flex-1">
        {/* ========================================================= */}
        {/* HERO SECTION */}
        {/* ========================================================= */}
        <section className="pt-20 sm:pt-28 pb-14 sm:pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
          <motion.div 
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-300 text-[11px] sm:text-xs font-extrabold uppercase tracking-widest mb-6 shadow-[0_0_15px_rgba(157,124,255,0.25)]"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
            <span>SyncInk Ecosystem • syncink.site</span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="text-3xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight leading-[1.1] max-w-5xl mx-auto mb-5 sm:mb-6"
          >
            Discord Infrastructure{" "}
            <span className="bg-gradient-to-r from-blue-400 via-violet-400 to-indigo-300 bg-clip-text text-transparent drop-shadow-[0_0_35px_rgba(157,124,255,0.4)]">
              Built For Performance.
            </span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="text-sm sm:text-lg md:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed mb-8 sm:mb-10 px-2"
          >
            Next-generation bots engineered for high-velocity communities. Explore our private-thread ticket system, dynamic temporary voice generators, and our dedicated Support Server security shield.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="flex flex-wrap items-center justify-center gap-3 sm:gap-4"
          >
            <a
              href="#bots"
              className="px-6 sm:px-7 py-3 sm:py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm sm:text-base transition-all shadow-[0_0_25px_rgba(147,51,234,0.4)] hover:shadow-[0_0_35px_rgba(147,51,234,0.6)] hover:-translate-y-0.5 flex items-center gap-2 duration-200"
            >
              <span>Explore All Bots</span>
              <ChevronRight className="w-4 h-4" />
            </a>

            <Link
              href="/dashboard"
              className="px-6 sm:px-7 py-3 sm:py-3.5 rounded-xl bg-[#121626] hover:bg-[#1a2034] text-white font-bold text-sm sm:text-base transition-all border border-blue-500/25 hover:border-blue-500/50 flex items-center gap-2 shadow-lg hover:-translate-y-0.5 duration-200"
            >
              <Layers className="w-4 h-4 text-blue-400" />
              <span>Dedicated Dashboards</span>
            </Link>

            <Link
              href="/apply"
              className="px-6 sm:px-7 py-3 sm:py-3.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 font-bold text-sm sm:text-base transition-all border border-white/10 flex items-center gap-2 hover:-translate-y-0.5 duration-200"
            >
              <Sparkles className="w-4 h-4 text-blue-400" />
              <span>Apply for Team</span>
            </Link>
          </motion.div>
        </section>

        {/* ========================================================= */}
        {/* REAL-TIME MONITORING STRIP */}
        {/* ========================================================= */}
        <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto mb-16 sm:mb-24">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={fadeIn}
            className="p-5 sm:p-8 rounded-2xl sm:rounded-3xl bg-[#0b0e1a]/90 border border-blue-500/25 backdrop-blur-xl shadow-2xl relative overflow-hidden group hover:border-blue-500/40 transition-colors duration-300"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-transparent to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            
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

              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-semibold shadow-[0_0_15px_rgba(16,185,129,0.15)] shrink-0">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Live Telemetry Active</span>
              </div>
            </div>

            <motion.div 
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6 pt-6 relative z-10"
            >
              <motion.div variants={fadeIn} className="text-center p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-white/[0.02] border border-white/[0.05]">
                <div className="text-2xl sm:text-4xl lg:text-5xl font-black text-white drop-shadow-md">150+</div>
                <div className="text-[11px] sm:text-xs md:text-sm font-semibold text-slate-400 mt-1 uppercase tracking-wider">
                  Active Servers
                </div>
              </motion.div>
              <motion.div variants={fadeIn} className="text-center p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-white/[0.02] border border-white/[0.05]">
                <div className="text-2xl sm:text-4xl lg:text-5xl font-black text-blue-400 drop-shadow-[0_0_15px_rgba(192,132,252,0.4)]">25,000+</div>
                <div className="text-[11px] sm:text-xs md:text-sm font-semibold text-slate-400 mt-1 uppercase tracking-wider">
                  Tickets Resolved
                </div>
              </motion.div>
              <motion.div variants={fadeIn} className="text-center p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-white/[0.02] border border-white/[0.05]">
                <div className="text-2xl sm:text-4xl lg:text-5xl font-black text-cyan-400 drop-shadow-[0_0_15px_rgba(34,211,238,0.4)]">540K+</div>
                <div className="text-[11px] sm:text-xs md:text-sm font-semibold text-slate-400 mt-1 uppercase tracking-wider">
                  Voice Minutes
                </div>
              </motion.div>
              <motion.div variants={fadeIn} className="text-center p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-white/[0.02] border border-white/[0.05]">
                <div className={`text-2xl sm:text-4xl lg:text-5xl font-black ${securityData.raidState === "NORMAL" ? "text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.4)]" : "text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]"}`}>
                  {securityData.raidState === "NORMAL" ? "SECURE" : securityData.raidState}
                </div>
                <div className="text-[11px] sm:text-xs md:text-sm font-semibold text-slate-400 mt-1 uppercase tracking-wider">
                  Support Server
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        </section>

        {/* ========================================================= */}
        {/* BOT SHOWCASE SECTION */}
        {/* ========================================================= */}
        <section id="bots" className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-16 sm:space-y-24 pb-20 sm:pb-24">
          <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-16">
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-xs font-bold uppercase tracking-widest text-blue-400 mb-2"
            >
              SyncInk Bot Suite
            </motion.div>
            <motion.h2 
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-2xl sm:text-5xl font-black text-white tracking-tight"
            >
              Specialized Bots for Modern Communities
            </motion.h2>
          </div>

          {/* ===================================================== */}
          {/* BOT 1: SYNCINK TICKET BOT */}
          {/* ===================================================== */}
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeIn}
            className="rounded-3xl sm:rounded-[2.5rem] bg-[#0e0c1a]/95 border border-blue-500/30 p-5 sm:p-8 lg:p-12 backdrop-blur-xl shadow-2xl relative overflow-hidden group hover:border-blue-500/60 transition-all duration-300 hover:shadow-[0_20px_80px_-20px_rgba(147,51,234,0.3)]"
          >
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 sm:gap-8 pb-6 sm:pb-10 border-b border-white/[0.08] relative z-10">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
                <motion.div 
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.2 }}
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-blue-600/20 border-2 border-blue-500/50 shadow-[0_0_30px_rgba(147,51,234,0.4)] flex items-center justify-center shrink-0 overflow-hidden"
                >
                  <img
                    src="/ticket-logo.png"
                    alt="SyncInk Ticket"
                    className="w-full h-full object-cover rounded-full"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = "none";
                    }}
                  />
                </motion.div>
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
                  <h3 className="text-2xl sm:text-4xl font-black text-white drop-shadow-md">SyncInk Ticket Bot</h3>
                  <p className="text-sm sm:text-base text-slate-300 mt-2 sm:mt-3 max-w-2xl leading-relaxed">
                    <strong className="text-blue-300 block mb-1">Powerful. Automated. Professional.</strong>
                    A next-generation Discord ticket bot built for modern communities. SyncInk Ticket combines private-thread infrastructure, intelligent claim systems, automated transcripts, advanced transfers, and premium workflows into one seamless support experience.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 shrink-0 w-full sm:w-auto">
                <a
                  href="https://discord.com/oauth2/authorize?client_id=1513075101992747158&permissions=361046068240&integration_type=0&scope=bot+applications.commands"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 sm:flex-initial justify-center px-5 sm:px-6 py-3 sm:py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm transition-all shadow-[0_0_20px_rgba(147,51,234,0.35)] hover:shadow-[0_0_30px_rgba(147,51,234,0.6)] flex items-center gap-2 hover:scale-105"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Invite Bot</span>
                </a>
                <Link
                  href="/dashboard/tickets"
                  className="flex-1 sm:flex-initial justify-center px-5 sm:px-6 py-3 sm:py-3.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-sm transition-all border border-white/10 flex items-center gap-2 hover:scale-105"
                >
                  <Layers className="w-4 h-4 text-blue-400" />
                  <span>Open Dedicated Dashboard</span>
                </Link>
              </div>
            </div>

            {/* Custom Emoji Support Section */}
            <div className="pt-6 sm:pt-8 pb-3 relative z-10">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                 <h4 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                   <Sparkles className="w-4 sm:w-5 h-4 sm:h-5 text-blue-400" />
                   Fully Customizable Categories
                 </h4>
              </div>
              <div className="flex flex-wrap gap-2 sm:gap-3">
                 <div className="flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-black/40 border border-blue-500/20 rounded-lg">
                    <img src="https://cdn.discordapp.com/emojis/1513336781263732836.png" className="w-4 h-4 sm:w-5 sm:h-5" alt="General Request" />
                    <span className="text-xs sm:text-sm font-semibold text-slate-200">General Request</span>
                 </div>
                 <div className="flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-black/40 border border-blue-500/20 rounded-lg">
                    <img src="https://cdn.discordapp.com/emojis/1513336966681460856.png" className="w-4 h-4 sm:w-5 sm:h-5" alt="User Report" />
                    <span className="text-xs sm:text-sm font-semibold text-slate-200">User Report</span>
                 </div>
                 <div className="flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-black/40 border border-blue-500/20 rounded-lg">
                    <img src="https://cdn.discordapp.com/emojis/1513337174148513892.png" className="w-4 h-4 sm:w-5 sm:h-5" alt="Bug Report" />
                    <span className="text-xs sm:text-sm font-semibold text-slate-200">Bug Report</span>
                 </div>
                 <div className="flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-black/40 border border-blue-500/20 rounded-lg">
                    <img src="https://cdn.discordapp.com/emojis/1513337285024677899.png" className="w-4 h-4 sm:w-5 sm:h-5" alt="Staff Abuse" />
                    <span className="text-xs sm:text-sm font-semibold text-slate-200">Staff Abuse</span>
                 </div>
                 <div className="flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-black/40 border border-blue-500/20 rounded-lg">
                    <img src="https://cdn.discordapp.com/emojis/1513337572078911488.png" className="w-4 h-4 sm:w-5 sm:h-5" alt="Other" />
                    <span className="text-xs sm:text-sm font-semibold text-slate-200">Other</span>
                 </div>
                 <div className="flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-black/40 border border-blue-500/20 rounded-lg">
                    <img src="https://cdn.discordapp.com/emojis/1513337741105037332.png" className="w-4 h-4 sm:w-5 sm:h-5" alt="Owner Contact" />
                    <span className="text-xs sm:text-sm font-semibold text-slate-200">Owner Contact</span>
                 </div>
              </div>
            </div>

            {/* Command Reference */}
            <div className="pt-6 pb-2 relative z-10 border-t border-white/5 mt-6">
              <h4 className="text-base sm:text-lg font-bold text-white mb-3">Core Commands & Features</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                  <div className="text-xs sm:text-sm font-bold text-blue-400 font-mono mb-1">/setup</div>
                  <div className="text-[11px] sm:text-xs text-slate-400">Initialize interactive ticket panel</div>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                  <div className="text-xs sm:text-sm font-bold text-blue-400 font-mono mb-1">/add user</div>
                  <div className="text-[11px] sm:text-xs text-slate-400">Add member to private thread</div>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                  <div className="text-xs sm:text-sm font-bold text-blue-400 font-mono mb-1">/claim</div>
                  <div className="text-[11px] sm:text-xs text-slate-400">Staff claim responsibility</div>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                  <div className="text-xs sm:text-sm font-bold text-blue-400 font-mono mb-1">/close</div>
                  <div className="text-[11px] sm:text-xs text-slate-400">Archive & generate transcript</div>
                </div>
              </div>
            </div>

            {/* Feature Highlights Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 pt-4 relative z-10">
              <div className="p-5 sm:p-6 rounded-2xl bg-black/40 border border-white/5 space-y-2.5 shadow-lg">
                <div className="text-blue-300 font-bold text-sm sm:text-base flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
                    <Lock className="w-4 h-4 text-blue-400" />
                  </div>
                  Private Threads Engine
                </div>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  Avoids channel limits. Only the ticket creator and assigned moderators can view and participate. Say goodbye to channel clutter.
                </p>
              </div>

              <div className="p-5 sm:p-6 rounded-2xl bg-black/40 border border-white/5 space-y-2.5 shadow-lg">
                <div className="text-blue-300 font-bold text-sm sm:text-base flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
                    <Zap className="w-4 h-4 text-blue-400" />
                  </div>
                  Auto-Claim & Mentions
                </div>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  Staff are automatically assigned when replying or when mentioned inside any ticket thread. Prevents overlapping support workflows.
                </p>
              </div>

              <div className="p-5 sm:p-6 rounded-2xl bg-black/40 border border-white/5 space-y-2.5 shadow-lg">
                <div className="text-blue-300 font-bold text-sm sm:text-base flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
                    <FileCheck className="w-4 h-4 text-blue-400" />
                  </div>
                  Encrypted Transcripts
                </div>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  Full message logs, embedded screenshots, and user timestamps are archived automatically upon closure in a highly secure web viewer.
                </p>
              </div>
            </div>
          </motion.div>

          {/* ===================================================== */}
          {/* BOT 2: SYNCINK VOICE BOT */}
          {/* ===================================================== */}
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeIn}
            className="rounded-3xl sm:rounded-[2.5rem] bg-[#09111b]/95 border border-cyan-500/30 p-5 sm:p-8 lg:p-12 backdrop-blur-xl shadow-2xl relative overflow-hidden group hover:border-cyan-500/60 transition-all duration-300 hover:shadow-[0_20px_80px_-20px_rgba(6,182,212,0.3)]"
          >
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 sm:gap-8 pb-6 sm:pb-10 border-b border-white/[0.08] relative z-10">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
                <motion.div 
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.2 }}
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-cyan-600/20 border-2 border-cyan-500/50 shadow-[0_0_30px_rgba(6,182,212,0.35)] flex items-center justify-center shrink-0 overflow-hidden"
                >
                  <img
                    src="/voice-logo.png"
                    alt="SyncInk Voice"
                    className="w-full h-full object-cover rounded-full"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = "none";
                    }}
                  />
                </motion.div>
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
                  <h3 className="text-2xl sm:text-4xl font-black text-white drop-shadow-md">SyncInk Voice Bot</h3>
                  <p className="text-sm sm:text-base text-slate-300 mt-2 sm:mt-3 max-w-2xl leading-relaxed">
                    Dynamic temporary voice channel manager. Users click a generator hub to instantly create a temporary room with custom naming patterns, user limits, and instant cleanup when empty.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 shrink-0 w-full sm:w-auto">
                <a
                  href="https://discord.com/oauth2/authorize?client_id=1516578887109181520&permissions=285220880&integration_type=0&scope=bot+applications.commands"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 sm:flex-initial justify-center px-5 sm:px-6 py-3 sm:py-3.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-sm transition-all shadow-[0_0_20px_rgba(6,182,212,0.35)] hover:shadow-[0_0_30px_rgba(6,182,212,0.6)] flex items-center gap-2 hover:scale-105"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Invite Bot</span>
                </a>
                <Link
                  href="/dashboard/voice"
                  className="flex-1 sm:flex-initial justify-center px-5 sm:px-6 py-3 sm:py-3.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-sm transition-all border border-white/10 flex items-center gap-2 hover:scale-105"
                >
                  <Layers className="w-4 h-4 text-cyan-400" />
                  <span>Open Dedicated Dashboard</span>
                </Link>
              </div>
            </div>

            {/* Feature Highlights Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 pt-6 relative z-10">
              <div className="p-5 sm:p-6 rounded-2xl bg-black/40 border border-white/5 space-y-2.5 shadow-lg">
                <div className="text-cyan-300 font-bold text-sm sm:text-base flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center shrink-0">
                    <Radio className="w-4 h-4 text-cyan-400" />
                  </div>
                  Join-to-Create Hubs
                </div>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  Click a master hub to spawn a private temporary voice room with customizable naming schemes. Infinite scaling for massive servers.
                </p>
              </div>

              <div className="p-5 sm:p-6 rounded-2xl bg-black/40 border border-white/5 space-y-2.5 shadow-lg">
                <div className="text-cyan-300 font-bold text-sm sm:text-base flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center shrink-0">
                    <Sliders className="w-4 h-4 text-cyan-400" />
                  </div>
                  Owner Controls (/voice)
                </div>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  Creators can lock, hide (ghost mode), limit users, or kick members with quick slash commands and interactive panels.
                </p>
              </div>

              <div className="p-5 sm:p-6 rounded-2xl bg-black/40 border border-white/5 space-y-2.5 shadow-lg">
                <div className="text-cyan-300 font-bold text-sm sm:text-base flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                  </div>
                  Automatic Empty Purge
                </div>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  Channels are cleanly deleted within 1.5 seconds when the last user leaves, keeping your server completely free of ghost channels.
                </p>
              </div>
            </div>
          </motion.div>

          {/* ===================================================== */}
          {/* BOT 3: SYNCINK RADIO (TEMPORARILY CLOSED) */}
          {/* ===================================================== */}
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeIn}
            className="rounded-3xl sm:rounded-[2.5rem] bg-[#140a17]/95 border border-pink-500/25 p-5 sm:p-8 lg:p-12 backdrop-blur-xl shadow-2xl relative overflow-hidden group hover:border-pink-500/40 transition-all duration-300"
          >
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 sm:gap-8 pb-6 sm:pb-8 border-b border-white/[0.08] relative z-10">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-pink-600/10 border-2 border-pink-500/20 flex items-center justify-center shrink-0 shadow-lg overflow-hidden">
                  <Music className="w-10 h-10 sm:w-12 sm:h-12 text-pink-400/70" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-2 sm:mb-3">
                    <span className="px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full text-[11px] sm:text-xs font-bold uppercase tracking-wider bg-pink-500/15 text-pink-300 border border-pink-500/30 opacity-70">
                      High-Fidelity Audio
                    </span>
                    <span className="px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full text-[11px] sm:text-xs font-bold uppercase tracking-wider bg-red-500/15 text-red-400 border border-red-500/30 shadow-[0_0_10px_rgba(239,68,68,0.2)]">
                      Temporarily Closed
                    </span>
                  </div>
                  <h3 className="text-2xl sm:text-4xl font-black text-white opacity-75">SyncInk Radio</h3>
                  <p className="text-sm sm:text-base text-slate-400 mt-2 sm:mt-3 max-w-2xl leading-relaxed opacity-80">
                    High-quality streaming audio from all major music providers. This service is currently undergoing scheduled infrastructure upgrades to support more listeners and better audio quality.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto">
                <span className="flex-1 sm:flex-initial text-center px-5 sm:px-6 py-3 sm:py-3.5 rounded-xl bg-white/5 text-slate-500 border border-white/5 font-bold text-sm cursor-not-allowed">
                  Temporarily Closed
                </span>
                <a
                  href="mailto:syncink.support@gmail.com"
                  className="flex-1 sm:flex-initial text-center px-5 sm:px-6 py-3 sm:py-3.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-sm transition-all border border-white/10 hover:scale-105"
                >
                  Inquire Support
                </a>
              </div>
            </div>

            {/* Platform Badges */}
            <div className="pt-6 flex flex-wrap gap-2.5 relative z-10 opacity-70">
              {["Spotify", "YouTube Music", "SoundCloud", "Apple Music", "Deezer", "TIDAL"].map((plat) => (
                <span
                  key={plat}
                  className="px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs sm:text-sm font-semibold text-slate-300 flex items-center gap-2"
                >
                  {plat}
                </span>
              ))}
            </div>
          </motion.div>

          {/* ===================================================== */}
          {/* BOT 4: SYNCINK SUPPORT & SECURITY BOT (NON-INVITABLE) */}
          {/* ===================================================== */}
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeIn}
            className="rounded-3xl sm:rounded-[2.5rem] bg-[#130a13]/95 border border-blue-500/40 p-5 sm:p-8 lg:p-12 backdrop-blur-xl shadow-2xl relative overflow-hidden group hover:border-blue-500/70 transition-all duration-300 hover:shadow-[0_20px_80px_-20px_rgba(157,124,255,0.3)]"
          >
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 sm:gap-8 pb-6 sm:pb-10 border-b border-white/[0.08] relative z-10">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
                <motion.div 
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.2 }}
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-blue-600/20 border-2 border-blue-500/50 shadow-[0_0_40px_rgba(157,124,255,0.4)] flex items-center justify-center shrink-0 overflow-hidden"
                >
                  <img
                    src="/syncink-main-logo.png"
                    alt="SyncInk Support Bot"
                    className="w-full h-full object-cover rounded-full"
                  />
                </motion.div>
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-2 sm:mb-3">
                    <span className="px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full text-[11px] sm:text-xs font-bold uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-500/40 shadow-[0_0_12px_rgba(157,124,255,0.25)]">
                      🛡️ Internal Support Server Bot • Non-Invitable
                    </span>
                    <span className="px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full text-[11px] sm:text-xs font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                      Active Defense
                    </span>
                  </div>
                  <h3 className="text-2xl sm:text-4xl font-black text-white drop-shadow-md">SyncInk Support & Security Bot</h3>
                  <p className="text-sm sm:text-base text-slate-300 mt-2 sm:mt-3 max-w-2xl leading-relaxed">
                    Non-invitable security & automod shield dedicated exclusively to keeping the official <strong>SyncInk Support Server</strong> safe, monitored, and secured 24/7. Neutralizes raid attacks, manages quarantine, and logs moderation cases in real time.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 shrink-0 w-full sm:w-auto">
                <span className="px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl bg-white/5 border border-white/10 text-xs font-mono text-blue-300 font-bold">
                  Server ID: 1520461877073674392
                </span>
                <Link
                  href="/dashboard/security"
                  className="flex-1 sm:flex-initial justify-center px-5 sm:px-6 py-3 sm:py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm transition-all shadow-[0_0_20px_rgba(157,124,255,0.35)] hover:shadow-[0_0_30px_rgba(157,124,255,0.6)] flex items-center gap-2 hover:scale-105"
                >
                  <Shield className="w-4 h-4" />
                  <span>Security Console</span>
                </Link>
              </div>
            </div>

            {/* Defense Highlights Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 pt-6 relative z-10">
              <div className="p-5 sm:p-6 rounded-2xl bg-black/40 border border-white/5 space-y-2.5 shadow-lg">
                <div className="text-blue-300 font-bold text-sm sm:text-base flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
                    <Shield className="w-4 h-4 text-blue-400" />
                  </div>
                  Velocity Raid Dampeners
                </div>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  Real-time join spike and message velocity dampening. Engages emergency lockdown within milliseconds if abnormal raid patterns are detected.
                </p>
              </div>

              <div className="p-5 sm:p-6 rounded-2xl bg-black/40 border border-white/5 space-y-2.5 shadow-lg">
                <div className="text-blue-300 font-bold text-sm sm:text-base flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
                    <Lock className="w-4 h-4 text-blue-400" />
                  </div>
                  Quarantine Isolation
                </div>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  Threat actors and bypass accounts are immediately stripped of interaction rights and jailed in isolated quarantine channels.
                </p>
              </div>

              <div className="p-5 sm:p-6 rounded-2xl bg-black/40 border border-white/5 space-y-2.5 shadow-lg">
                <div className="text-blue-300 font-bold text-sm sm:text-base flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
                    <Activity className="w-4 h-4 text-blue-400" />
                  </div>
                  Real-Time Forensics
                </div>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  Live PostgreSQL database telemetry synchronizes moderation cases, strike tallies, and audit trails to the dashboard every second.
                </p>
              </div>
            </div>
          </motion.div>

          {/* ===================================================== */}
          {/* RECRUITMENT CALLOUT */}
          {/* ===================================================== */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="rounded-3xl sm:rounded-[2.5rem] bg-gradient-to-r from-[#120e24] via-[#10132b] to-[#150d24] border border-blue-500/30 p-6 sm:p-12 lg:p-16 text-center relative overflow-hidden shadow-[0_20px_60px_-15px_rgba(147,51,234,0.3)]"
          >
            <div className="max-w-2xl mx-auto space-y-4 sm:space-y-5 relative z-10">
              <div 
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-blue-600/20 border border-blue-500/40 flex items-center justify-center mx-auto text-blue-400 shadow-[0_0_30px_rgba(157,124,255,0.4)]"
              >
                <Users className="w-7 h-7 sm:w-8 sm:h-8" />
              </div>
              <h3 className="text-2xl sm:text-4xl font-black text-white">Join the SyncInk Staff or Dev Team</h3>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed px-2">
                Passionate about community moderation or bot development? Apply through our unified portal with your Discord account in under two minutes.
              </p>
              <div className="pt-4 sm:pt-6 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
                <Link
                  href="/apply"
                  className="w-full sm:w-auto justify-center px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl sm:rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm sm:text-base transition-all shadow-[0_0_20px_rgba(157,124,255,0.4)] hover:shadow-[0_0_30px_rgba(157,124,255,0.6)] flex items-center gap-2 hover:-translate-y-0.5"
                >
                  <span>Apply Now</span>
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                </Link>
                <a
                  href="https://discord.gg/rB6gNZaK9u"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto justify-center px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl sm:rounded-2xl bg-white/10 hover:bg-white/15 text-white font-bold text-sm sm:text-base transition-all border border-white/10 flex items-center gap-2 hover:-translate-y-0.5"
                >
                  <span>Join Official Discord Server</span>
                  <ExternalLink className="w-4 h-4 sm:w-5 sm:h-5" />
                </a>
              </div>
            </div>
          </motion.div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
