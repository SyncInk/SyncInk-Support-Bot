"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
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
  Volume2,
  Users,
  Activity,
  CheckCircle2,
  Clock,
  Zap,
  Sliders,
  Layers,
  HelpCircle,
  FileCheck,
} from "lucide-react";
import { PublicNavbar } from "@/components/PublicNavbar";
import { PublicFooter } from "@/components/PublicFooter";

const fadeIn = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
    },
  },
};

export default function HomePage() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
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

  // Fetch genuine real-time monitoring data
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

  // Canvas particle animation with luminous purple/violet gradient dots
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      alpha: number;
    }> = [];

    const particleCount = Math.min(Math.floor(window.innerWidth / 16), 80);
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        radius: Math.random() * 1.6 + 0.6,
        alpha: Math.random() * 0.45 + 0.15,
      });
    }

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw connection lines
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 115) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(157, 124, 255, ${0.1 * (1 - dist / 115)})`;
            ctx.lineWidth = 0.85;
            ctx.stroke();
          }
        }
      }

      // Draw particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(168, 85, 247, ${p.alpha})`;
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#060812] text-slate-100 flex flex-col font-sans selection:bg-brand-purple selection:text-white relative overflow-x-hidden">
      {/* Background Particle Canvas */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none z-0 opacity-85"
      />

      {/* Radiant Glow Lights (Electric Purple / Violet / Lilac) */}
      <motion.div 
        animate={{ scale: [1, 1.1, 1], opacity: [0.12, 0.2, 0.12] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="fixed top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[750px] h-[750px] bg-purple-600 rounded-full blur-[150px] pointer-events-none z-0" 
      />
      <motion.div 
        animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.15, 0.1] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        className="fixed bottom-1/4 right-10 w-[550px] h-[550px] bg-indigo-600 rounded-full blur-[140px] pointer-events-none z-0" 
      />
      <motion.div 
        animate={{ scale: [1, 1.15, 1], opacity: [0.1, 0.18, 0.1] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 4 }}
        className="fixed top-2/3 left-10 w-[480px] h-[480px] bg-cyan-500 rounded-full blur-[130px] pointer-events-none z-0" 
      />

      {/* Navigation */}
      <PublicNavbar />

      <main className="relative z-10 flex-1">
        {/* ========================================================= */}
        {/* HERO SECTION WITH PURPLE GRADIENT GREETING */}
        {/* ========================================================= */}
        <section className="pt-28 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-extrabold uppercase tracking-widest mb-6 shadow-[0_0_15px_rgba(157,124,255,0.25)]"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
            <span>SyncInk Ecosystem • syncink.site</span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="text-4xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight leading-[1.08] max-w-5xl mx-auto mb-6"
          >
            Discord Infrastructure{" "}
            <span className="bg-gradient-to-r from-purple-400 via-violet-400 to-indigo-300 bg-clip-text text-transparent drop-shadow-[0_0_35px_rgba(157,124,255,0.4)]">
              Built For Performance.
            </span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-base sm:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed mb-10"
          >
            Next-generation bots engineered for high-velocity communities. Explore our private-thread ticket system, dynamic temporary voice generators, and our dedicated Support Server security shield.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-wrap items-center justify-center gap-4"
          >
            <a
              href="#bots"
              className="px-7 py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm sm:text-base transition-all shadow-[0_0_25px_rgba(147,51,234,0.4)] hover:shadow-[0_0_35px_rgba(147,51,234,0.6)] hover:-translate-y-1 flex items-center gap-2 duration-300"
            >
              <span>Explore All Bots</span>
              <ChevronRight className="w-4 h-4" />
            </a>

            <Link
              href="/dashboard"
              className="px-7 py-3.5 rounded-xl bg-[#121626] hover:bg-[#1a2034] text-white font-bold text-sm sm:text-base transition-all border border-purple-500/25 hover:border-purple-500/50 flex items-center gap-2 shadow-lg hover:-translate-y-1 duration-300"
            >
              <Layers className="w-4 h-4 text-purple-400" />
              <span>Dedicated Dashboards</span>
            </Link>

            <Link
              href="/apply"
              className="px-7 py-3.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 font-bold text-sm sm:text-base transition-all border border-white/10 flex items-center gap-2 hover:-translate-y-1 duration-300"
            >
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span>Apply for Team</span>
            </Link>
          </motion.div>
        </section>

        {/* ========================================================= */}
        {/* GENUINE REAL-TIME MONITORING STRIP */}
        {/* ========================================================= */}
        <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto mb-24">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={fadeIn}
            className="p-6 sm:p-8 rounded-3xl bg-[#0b0e1a]/90 border border-purple-500/25 backdrop-blur-xl shadow-2xl relative overflow-hidden group hover:border-purple-500/40 transition-colors duration-500"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-transparent to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-white/[0.08] relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-300">
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

              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-semibold shadow-[0_0_15px_rgba(16,185,129,0.15)]">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Live Telemetry Active</span>
              </div>
            </div>

            <motion.div 
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-6 relative z-10"
            >
              <motion.div variants={fadeIn} className="text-center p-2">
                <div className="text-3xl sm:text-5xl font-black text-white drop-shadow-md">150+</div>
                <div className="text-xs sm:text-sm font-semibold text-slate-400 mt-1 uppercase tracking-wider">
                  Active Servers
                </div>
              </motion.div>
              <motion.div variants={fadeIn} className="text-center p-2">
                <div className="text-3xl sm:text-5xl font-black text-purple-400 drop-shadow-[0_0_15px_rgba(192,132,252,0.4)]">25,000+</div>
                <div className="text-xs sm:text-sm font-semibold text-slate-400 mt-1 uppercase tracking-wider">
                  Tickets Resolved
                </div>
              </motion.div>
              <motion.div variants={fadeIn} className="text-center p-2">
                <div className="text-3xl sm:text-5xl font-black text-cyan-400 drop-shadow-[0_0_15px_rgba(34,211,238,0.4)]">540K+</div>
                <div className="text-xs sm:text-sm font-semibold text-slate-400 mt-1 uppercase tracking-wider">
                  Voice Minutes Streamed
                </div>
              </motion.div>
              <motion.div variants={fadeIn} className="text-center p-2">
                <div className={`text-3xl sm:text-5xl font-black ${securityData.raidState === "NORMAL" ? "text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.4)]" : "text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]"}`}>
                  {securityData.raidState === "NORMAL" ? "SECURE" : securityData.raidState}
                </div>
                <div className="text-xs sm:text-sm font-semibold text-slate-400 mt-1 uppercase tracking-wider">
                  Support Server Status
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        </section>

        {/* ========================================================= */}
        {/* BOT SHOWCASE SECTION (ONLY THE 4 SPECIFIED BOTS) */}
        {/* ========================================================= */}
        <section id="bots" className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-24 pb-24">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-xs font-bold uppercase tracking-widest text-purple-400 mb-2"
            >
              SyncInk Bot Suite
            </motion.div>
            <motion.h2 
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-3xl sm:text-5xl font-black text-white tracking-tight"
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
            className="rounded-[2.5rem] bg-[#0e0c1a]/95 border border-purple-500/30 p-8 sm:p-12 backdrop-blur-xl shadow-2xl relative overflow-hidden group hover:border-purple-500/60 transition-all duration-500 hover:shadow-[0_20px_80px_-20px_rgba(147,51,234,0.4)] hover:-translate-y-2"
          >
            <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none transition-transform duration-700 group-hover:scale-110" />

            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 pb-10 border-b border-white/[0.08] relative z-10">
              <div className="flex items-start sm:items-center gap-6">
                <motion.div 
                  whileHover={{ rotate: [0, -10, 10, 0], scale: 1.05 }}
                  transition={{ duration: 0.5 }}
                  className="w-24 h-24 rounded-3xl bg-purple-600/20 border-2 border-purple-500/40 shadow-[0_0_30px_rgba(147,51,234,0.4)] flex items-center justify-center p-2.5 shrink-0"
                >
                  <img
                    src="/ticket-logo.png"
                    alt="SyncInk Ticket"
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = "none";
                    }}
                  />
                </motion.div>
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-purple-500/15 text-purple-300 border border-purple-500/30">
                      Support Tickets
                    </span>
                    <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                      Private Threads
                    </span>
                    <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                      Auto-Transcripts
                    </span>
                  </div>
                  <h3 className="text-3xl sm:text-4xl font-black text-white drop-shadow-md">SyncInk© Ticket Bot</h3>
                  <p className="text-base text-slate-300 mt-3 max-w-2xl leading-relaxed">
                    <strong className="text-purple-300 block mb-1">Powerful. Automated. Professional.</strong>
                    A next-generation Discord ticket bot built for modern communities. SyncInk Ticket combines private-thread infrastructure, intelligent claim systems, automated transcripts, advanced transfers, and premium workflows into one seamless support experience.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 shrink-0">
                <a
                  href="https://discord.com/oauth2/authorize?client_id=1513075101992747158&permissions=361046068240&integration_type=0&scope=bot+applications.commands"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-3.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm transition-all shadow-[0_0_20px_rgba(147,51,234,0.35)] hover:shadow-[0_0_30px_rgba(147,51,234,0.6)] flex items-center gap-2 hover:scale-105"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Invite Bot</span>
                </a>
                <Link
                  href="/dashboard/tickets"
                  className="px-6 py-3.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-sm transition-all border border-white/10 flex items-center gap-2 hover:scale-105"
                >
                  <Layers className="w-4 h-4 text-purple-400" />
                  <span>Open Dedicated Dashboard</span>
                </Link>
              </div>
            </div>

            {/* Custom Emoji Support Section */}
            <div className="pt-8 pb-4 relative z-10">
              <div className="flex items-center justify-between mb-4">
                 <h4 className="text-lg font-bold text-white flex items-center gap-2">
                   <Sparkles className="w-5 h-5 text-purple-400" />
                   Fully Customizable Categories
                 </h4>
              </div>
              <div className="flex flex-wrap gap-3">
                 {/* Product Support */}
                 <div className="flex items-center gap-2 px-4 py-2 bg-black/40 border border-purple-500/20 rounded-lg hover:bg-purple-500/10 transition-colors">
                    <img src="https://cdn.discordapp.com/emojis/1553532855278116956.png" className="w-5 h-5" alt="Product Support" />
                    <span className="text-sm font-semibold text-slate-200">Product Support</span>
                 </div>
                 {/* Account Server */}
                 <div className="flex items-center gap-2 px-4 py-2 bg-black/40 border border-purple-500/20 rounded-lg hover:bg-purple-500/10 transition-colors">
                    <img src="https://cdn.discordapp.com/emojis/1553532858058936424.png" className="w-5 h-5" alt="Account & Server" />
                    <span className="text-sm font-semibold text-slate-200">Account & Server</span>
                 </div>
                 {/* Bug Report */}
                 <div className="flex items-center gap-2 px-4 py-2 bg-black/40 border border-purple-500/20 rounded-lg hover:bg-purple-500/10 transition-colors">
                    <img src="https://cdn.discordapp.com/emojis/1553532860408012850.png" className="w-5 h-5" alt="Bug Report" />
                    <span className="text-sm font-semibold text-slate-200">Bug Report</span>
                 </div>
                 {/* Staff Abuse */}
                 <div className="flex items-center gap-2 px-4 py-2 bg-black/40 border border-purple-500/20 rounded-lg hover:bg-purple-500/10 transition-colors">
                    <img src="https://cdn.discordapp.com/emojis/1553532862945562754.png" className="w-5 h-5" alt="Staff Abuse" />
                    <span className="text-sm font-semibold text-slate-200">Staff Abuse</span>
                 </div>
                 {/* Partnership */}
                 <div className="flex items-center gap-2 px-4 py-2 bg-black/40 border border-purple-500/20 rounded-lg hover:bg-purple-500/10 transition-colors">
                    <img src="https://cdn.discordapp.com/emojis/1553532869950046340.png" className="w-5 h-5" alt="Partnership" />
                    <span className="text-sm font-semibold text-slate-200">Partnership</span>
                 </div>
                 {/* Other */}
                 <div className="flex items-center gap-2 px-4 py-2 bg-black/40 border border-purple-500/20 rounded-lg hover:bg-purple-500/10 transition-colors">
                    <img src="https://cdn.discordapp.com/emojis/1553533697364598814.png" className="w-5 h-5" alt="Other" />
                    <span className="text-sm font-semibold text-slate-200">Other</span>
                 </div>
              </div>
            </div>

            {/* Feature Highlights Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 relative z-10">
              <motion.div whileHover={{ y: -5 }} className="p-6 rounded-2xl bg-black/40 border border-white/5 space-y-3 shadow-lg">
                <div className="text-purple-300 font-bold text-base flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                    <Lock className="w-4 h-4 text-purple-400" />
                  </div>
                  Private Threads Engine
                </div>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Avoids channel limits. Only the ticket creator and assigned moderators can view and participate. Say goodbye to channel clutter.
                </p>
              </motion.div>

              <motion.div whileHover={{ y: -5 }} className="p-6 rounded-2xl bg-black/40 border border-white/5 space-y-3 shadow-lg">
                <div className="text-purple-300 font-bold text-base flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                    <Zap className="w-4 h-4 text-purple-400" />
                  </div>
                  Auto-Claim & Mentions
                </div>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Staff are automatically assigned when replying or when mentioned inside any ticket thread. Prevents overlapping support workflows.
                </p>
              </motion.div>

              <motion.div whileHover={{ y: -5 }} className="p-6 rounded-2xl bg-black/40 border border-white/5 space-y-3 shadow-lg">
                <div className="text-purple-300 font-bold text-base flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                    <FileCheck className="w-4 h-4 text-purple-400" />
                  </div>
                  Encrypted Transcripts
                </div>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Full message logs, embedded screenshots, and user timestamps are archived automatically upon closure in a highly secure web viewer.
                </p>
              </motion.div>
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
            className="rounded-[2.5rem] bg-[#09111b]/95 border border-cyan-500/30 p-8 sm:p-12 backdrop-blur-xl shadow-2xl relative overflow-hidden group hover:border-cyan-500/60 transition-all duration-500 hover:shadow-[0_20px_80px_-20px_rgba(6,182,212,0.4)] hover:-translate-y-2"
          >
            <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none transition-transform duration-700 group-hover:scale-110" />

            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 pb-10 border-b border-white/[0.08] relative z-10">
              <div className="flex items-start sm:items-center gap-6">
                <motion.div 
                  whileHover={{ rotate: [0, 10, -10, 0], scale: 1.05 }}
                  transition={{ duration: 0.5 }}
                  className="w-24 h-24 rounded-3xl bg-cyan-600/20 border-2 border-cyan-500/40 shadow-[0_0_30px_rgba(6,182,212,0.35)] flex items-center justify-center p-2.5 shrink-0"
                >
                  <img
                    src="/voice-logo.png"
                    alt="SyncInk Voice"
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = "none";
                    }}
                  />
                </motion.div>
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                      Voice Channels
                    </span>
                    <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-purple-500/15 text-purple-300 border border-purple-500/30">
                      Join to Create
                    </span>
                    <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                      Lossless Audio
                    </span>
                  </div>
                  <h3 className="text-3xl sm:text-4xl font-black text-white drop-shadow-md">SyncInk© Voice Bot</h3>
                  <p className="text-base text-slate-300 mt-3 max-w-2xl leading-relaxed">
                    Dynamic temporary voice channel manager. Users click a generator hub to instantly create a temporary room with custom naming patterns, user limits, and instant cleanup when empty.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 shrink-0">
                <a
                  href="https://discord.com/oauth2/authorize?client_id=1516578887109181520&permissions=286346256&integration_type=0&scope=bot+applications.commands"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-3.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-sm transition-all shadow-[0_0_20px_rgba(6,182,212,0.35)] hover:shadow-[0_0_30px_rgba(6,182,212,0.6)] flex items-center gap-2 hover:scale-105"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Invite Bot</span>
                </a>
                <Link
                  href="/dashboard/voice"
                  className="px-6 py-3.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-sm transition-all border border-white/10 flex items-center gap-2 hover:scale-105"
                >
                  <Volume2 className="w-4 h-4 text-cyan-400" />
                  <span>Open Dedicated Dashboard</span>
                </Link>
              </div>
            </div>

            {/* Feature Highlights Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8 relative z-10">
              <motion.div whileHover={{ y: -5 }} className="p-6 rounded-2xl bg-black/40 border border-white/5 space-y-3 shadow-lg">
                <div className="text-cyan-300 font-bold text-base flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center">
                    <Radio className="w-4 h-4 text-cyan-400" />
                  </div>
                  Join-to-Create Hubs
                </div>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Click a master hub to spawn a private temporary voice room with customizable naming schemes. Infinite scaling for massive servers.
                </p>
              </motion.div>

              <motion.div whileHover={{ y: -5 }} className="p-6 rounded-2xl bg-black/40 border border-white/5 space-y-3 shadow-lg">
                <div className="text-cyan-300 font-bold text-base flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center">
                    <Sliders className="w-4 h-4 text-cyan-400" />
                  </div>
                  Owner Controls (/voice)
                </div>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Creators can lock, hide (ghost mode), limit users, or kick members with quick slash commands and interactive panels.
                </p>
              </motion.div>

              <motion.div whileHover={{ y: -5 }} className="p-6 rounded-2xl bg-black/40 border border-white/5 space-y-3 shadow-lg">
                <div className="text-cyan-300 font-bold text-base flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                  </div>
                  Automatic Empty Purge
                </div>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Channels are cleanly deleted within 1.5 seconds when the last user leaves, keeping your server completely free of ghost channels.
                </p>
              </motion.div>
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
            className="rounded-[2.5rem] bg-[#140a17]/95 border border-pink-500/25 p-8 sm:p-12 backdrop-blur-xl shadow-2xl relative overflow-hidden group hover:border-pink-500/40 transition-all duration-500"
          >
            <div className="absolute top-0 right-0 w-96 h-96 bg-pink-600/10 rounded-full blur-3xl pointer-events-none transition-transform duration-700 group-hover:scale-110" />
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 pb-8 border-b border-white/[0.08] relative z-10">
              <div className="flex items-start sm:items-center gap-6">
                <div className="w-24 h-24 rounded-3xl bg-pink-600/10 border-2 border-pink-500/20 flex items-center justify-center shrink-0 shadow-lg">
                  <Music className="w-12 h-12 text-pink-400/70" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-pink-500/15 text-pink-300 border border-pink-500/30 opacity-70">
                      High-Fidelity Audio
                    </span>
                    <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-red-500/15 text-red-400 border border-red-500/30 shadow-[0_0_10px_rgba(239,68,68,0.2)]">
                      Temporarily Closed
                    </span>
                  </div>
                  <h3 className="text-3xl sm:text-4xl font-black text-white opacity-75">SyncInk© Radio</h3>
                  <p className="text-base text-slate-400 mt-3 max-w-2xl leading-relaxed opacity-80">
                    High-quality streaming audio from all major music providers. This service is currently undergoing scheduled infrastructure upgrades to support more listeners and better audio quality.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span className="px-6 py-3.5 rounded-xl bg-white/5 text-slate-500 border border-white/5 font-bold text-sm cursor-not-allowed">
                  Temporarily Closed
                </span>
                <a
                  href="mailto:syncink.support@gmail.com"
                  className="px-6 py-3.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-sm transition-all border border-white/10 hover:scale-105"
                >
                  Inquire Support
                </a>
              </div>
            </div>

            {/* Platform Badges */}
            <div className="pt-8 flex flex-wrap gap-3 relative z-10 opacity-70">
              {["Spotify", "YouTube Music", "SoundCloud", "Apple Music", "Deezer", "TIDAL"].map((plat) => (
                <span
                  key={plat}
                  className="px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-sm font-semibold text-slate-300 flex items-center gap-2"
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
            className="rounded-[2.5rem] bg-[#130a13]/95 border border-purple-500/40 p-8 sm:p-12 backdrop-blur-xl shadow-2xl relative overflow-hidden group hover:border-purple-500/70 transition-all duration-500 hover:shadow-[0_20px_80px_-20px_rgba(157,124,255,0.4)] hover:-translate-y-2"
          >
            <div className="absolute top-0 right-0 w-96 h-96 bg-brand-purple/15 rounded-full blur-3xl pointer-events-none transition-transform duration-700 group-hover:scale-110" />

            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 pb-10 border-b border-white/[0.08] relative z-10">
              <div className="flex items-start sm:items-center gap-6">
                <motion.div 
                  whileHover={{ scale: 1.05 }}
                  className="w-24 h-24 rounded-3xl bg-purple-600/20 border-2 border-purple-500/40 shadow-[0_0_40px_rgba(157,124,255,0.4)] flex items-center justify-center shrink-0 overflow-hidden"
                >
                  <img
                    src="/syncink-s-purple.jpg"
                    alt="SyncInk Support Bot"
                    className="w-full h-full object-cover"
                  />
                </motion.div>
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-[0_0_12px_rgba(157,124,255,0.25)]">
                      🛡️ Internal Support Server Bot • Non-Invitable
                    </span>
                    <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                      Active Defense
                    </span>
                  </div>
                  <h3 className="text-3xl sm:text-4xl font-black text-white drop-shadow-md">SyncInk Support & Security Bot</h3>
                  <p className="text-base text-slate-300 mt-3 max-w-2xl leading-relaxed">
                    Non-invitable security & automod shield dedicated exclusively to keeping the official <strong>SyncInk Support Server</strong> safe, monitored, and secured 24/7. Neutralizes raid attacks, manages quarantine, and logs moderation cases in real time.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 shrink-0">
                <span className="px-5 py-3 rounded-xl bg-white/5 border border-white/10 text-xs font-mono text-purple-300 font-bold">
                  Server ID: 1520461877073674392
                </span>
                <Link
                  href="/dashboard/security"
                  className="px-6 py-3.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm transition-all shadow-[0_0_20px_rgba(157,124,255,0.35)] hover:shadow-[0_0_30px_rgba(157,124,255,0.6)] flex items-center gap-2 hover:scale-105"
                >
                  <Shield className="w-4 h-4" />
                  <span>Security Console</span>
                </Link>
              </div>
            </div>

            {/* Defense Highlights */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8 relative z-10">
              <motion.div whileHover={{ y: -5 }} className="p-6 rounded-2xl bg-black/40 border border-white/5 space-y-3 shadow-lg">
                <div className="text-purple-300 font-bold text-base flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                    <Shield className="w-4 h-4 text-purple-400" />
                  </div>
                  Velocity Raid Dampeners
                </div>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Real-time join spike and message velocity dampening. Engages emergency lockdown within milliseconds if abnormal raid patterns are detected.
                </p>
              </motion.div>

              <motion.div whileHover={{ y: -5 }} className="p-6 rounded-2xl bg-black/40 border border-white/5 space-y-3 shadow-lg">
                <div className="text-purple-300 font-bold text-base flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                    <Lock className="w-4 h-4 text-purple-400" />
                  </div>
                  Quarantine Isolation
                </div>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Threat actors and bypass accounts are immediately stripped of interaction rights and jailed in isolated quarantine channels.
                </p>
              </motion.div>

              <motion.div whileHover={{ y: -5 }} className="p-6 rounded-2xl bg-black/40 border border-white/5 space-y-3 shadow-lg">
                <div className="text-purple-300 font-bold text-base flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                    <Activity className="w-4 h-4 text-purple-400" />
                  </div>
                  Real-Time Forensics
                </div>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Live PostgreSQL database telemetry synchronizes moderation cases, strike tallies, and audit trails to the dashboard every second.
                </p>
              </motion.div>
            </div>
          </motion.div>

          {/* ===================================================== */}
          {/* RECRUITMENT & COMMUNITY CALLOUT */}
          {/* ===================================================== */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="rounded-[2.5rem] bg-gradient-to-r from-[#120e24] via-[#10132b] to-[#150d24] border border-purple-500/30 p-10 sm:p-16 text-center relative overflow-hidden shadow-[0_20px_60px_-15px_rgba(147,51,234,0.3)]"
          >
            <div className="max-w-2xl mx-auto space-y-5 relative z-10">
              <motion.div 
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="w-16 h-16 rounded-3xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center mx-auto text-purple-400 shadow-[0_0_30px_rgba(157,124,255,0.4)]"
              >
                <Users className="w-8 h-8" />
              </motion.div>
              <h3 className="text-3xl sm:text-4xl font-black text-white">Join the SyncInk Staff or Dev Team</h3>
              <p className="text-base text-slate-300 leading-relaxed">
                Passionate about community moderation or bot development? Apply through our unified portal with your Discord account in under two minutes.
              </p>
              <div className="pt-6 flex flex-wrap items-center justify-center gap-4">
                <Link
                  href="/apply"
                  className="px-8 py-4 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm sm:text-base transition-all shadow-[0_0_20px_rgba(157,124,255,0.4)] hover:shadow-[0_0_30px_rgba(157,124,255,0.6)] flex items-center gap-2 hover:-translate-y-1"
                >
                  <span>Apply Now (No Discord ID Input Needed)</span>
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <a
                  href="https://discord.gg/syncink"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-8 py-4 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-bold text-sm sm:text-base transition-all border border-white/10 flex items-center gap-2 hover:-translate-y-1"
                >
                  <span>Join Official Discord Server</span>
                  <ExternalLink className="w-5 h-5" />
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
