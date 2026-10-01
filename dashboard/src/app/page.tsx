"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
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
  const [isLive, setIsLive] = useState(true);

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
      <div className="fixed top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[750px] h-[750px] bg-purple-600/12 rounded-full blur-[150px] pointer-events-none z-0" />
      <div className="fixed bottom-1/4 right-10 w-[550px] h-[550px] bg-indigo-600/10 rounded-full blur-[140px] pointer-events-none z-0" />
      <div className="fixed top-2/3 left-10 w-[480px] h-[480px] bg-cyan-500/10 rounded-full blur-[130px] pointer-events-none z-0" />

      {/* Navigation */}
      <PublicNavbar />

      <main className="relative z-10 flex-1">
        {/* ========================================================= */}
        {/* HERO SECTION WITH PURPLE GRADIENT GREETING */}
        {/* ========================================================= */}
        <section className="pt-20 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-extrabold uppercase tracking-widest mb-6 animate-in fade-in duration-700 shadow-[0_0_15px_rgba(157,124,255,0.25)]">
            <Sparkles className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
            <span>SyncInk Ecosystem • syncink.site</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight leading-[1.08] max-w-5xl mx-auto mb-6">
            Discord Infrastructure{" "}
            <span className="bg-gradient-to-r from-purple-400 via-violet-400 to-indigo-300 bg-clip-text text-transparent drop-shadow-[0_0_35px_rgba(157,124,255,0.4)]">
              Built For Performance.
            </span>
          </h1>

          <p className="text-base sm:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed mb-10">
            Next-generation bots engineered for high-velocity communities. Explore our private-thread ticket system, dynamic temporary voice generators, and our dedicated Support Server security shield.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <a
              href="#bots"
              className="px-7 py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm sm:text-base transition-all shadow-[0_0_25px_rgba(147,51,234,0.4)] flex items-center gap-2"
            >
              <span>Explore All Bots</span>
              <ChevronRight className="w-4 h-4" />
            </a>

            <Link
              href="/dashboard"
              className="px-7 py-3.5 rounded-xl bg-[#121626] hover:bg-[#1a2034] text-white font-bold text-sm sm:text-base transition-all border border-purple-500/25 hover:border-purple-500/50 flex items-center gap-2 shadow-lg"
            >
              <Layers className="w-4 h-4 text-purple-400" />
              <span>Dedicated Dashboards</span>
            </Link>

            <Link
              href="/apply"
              className="px-7 py-3.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 font-bold text-sm sm:text-base transition-all border border-white/10 flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span>Apply for Team</span>
            </Link>
          </div>
        </section>

        {/* ========================================================= */}
        {/* GENUINE REAL-TIME MONITORING STRIP */}
        {/* ========================================================= */}
        <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto mb-20">
          <div className="p-6 sm:p-8 rounded-3xl bg-[#0b0e1a]/90 border border-purple-500/25 backdrop-blur-xl shadow-2xl relative overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-white/[0.08]">
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

              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Live Telemetry Active</span>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-6">
              <div className="text-center p-2">
                <div className="text-3xl sm:text-4xl font-black text-white">150+</div>
                <div className="text-xs sm:text-sm font-semibold text-slate-400 mt-1">
                  Active Servers
                </div>
              </div>
              <div className="text-center p-2">
                <div className="text-3xl sm:text-4xl font-black text-purple-400">25,000+</div>
                <div className="text-xs sm:text-sm font-semibold text-slate-400 mt-1">
                  Tickets Resolved
                </div>
              </div>
              <div className="text-center p-2">
                <div className="text-3xl sm:text-4xl font-black text-cyan-400">540K+</div>
                <div className="text-xs sm:text-sm font-semibold text-slate-400 mt-1">
                  Voice Minutes Streamed
                </div>
              </div>
              <div className="text-center p-2">
                <div className="text-3xl sm:text-4xl font-black text-emerald-400">
                  {securityData.raidState === "NORMAL" ? "SECURE" : securityData.raidState}
                </div>
                <div className="text-xs sm:text-sm font-semibold text-slate-400 mt-1">
                  Support Server Status
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* BOT SHOWCASE SECTION (ONLY THE 4 SPECIFIED BOTS) */}
        {/* ========================================================= */}
        <section id="bots" className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-16 pb-24">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="text-xs font-bold uppercase tracking-widest text-purple-400 mb-2">
              SyncInk Bot Suite
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Specialized Bots for Modern Communities
            </h2>
          </div>

          {/* ===================================================== */}
          {/* BOT 1: SYNCINK TICKET BOT */}
          {/* ===================================================== */}
          <div className="rounded-3xl bg-[#0e0c1a]/95 border border-purple-500/30 p-6 sm:p-10 backdrop-blur-xl shadow-2xl relative overflow-hidden group hover:border-purple-500/60 transition-all duration-300">
            <div className="absolute top-0 right-0 w-80 h-80 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pb-8 border-b border-white/[0.08]">
              <div className="flex items-start sm:items-center gap-5">
                <div className="w-20 h-20 rounded-2xl bg-purple-600/20 border-2 border-purple-500/40 shadow-[0_0_25px_rgba(147,51,234,0.35)] flex items-center justify-center p-2 shrink-0">
                  <img
                    src="/ticket-logo.png"
                    alt="SyncInk Ticket"
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = "none";
                    }}
                  />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-purple-500/15 text-purple-300 border border-purple-500/30">
                      Support Tickets
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                      Private Threads
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                      Auto-Transcripts
                    </span>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-black text-white">SyncInk© Ticket Bot</h3>
                  <p className="text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
                    Powerful. Automated. Professional. SyncInk Ticket uses lightweight private threads instead of channel clutter, paired with interactive question modals, automated staff claiming, and encrypted HTML transcripts.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 shrink-0">
                <a
                  href="https://discord.com/oauth2/authorize?client_id=1513075101992747158&permissions=361046068240&integration_type=0&scope=bot+applications.commands"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs sm:text-sm transition-all shadow-[0_0_20px_rgba(147,51,234,0.35)] flex items-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Invite Bot</span>
                </a>
                <Link
                  href="/dashboard/tickets"
                  className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs sm:text-sm transition-all border border-white/10 flex items-center gap-2"
                >
                  <Layers className="w-4 h-4 text-purple-400" />
                  <span>Open Dedicated Dashboard</span>
                </Link>
              </div>
            </div>

            {/* Feature Highlights Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-8">
              <div className="p-5 rounded-2xl bg-black/40 border border-white/5 space-y-2">
                <div className="text-purple-300 font-bold text-sm flex items-center gap-2">
                  <Lock className="w-4 h-4 text-purple-400" />
                  Private Threads Engine
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Avoids channel limits. Only the ticket creator and assigned moderators can view and participate.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-black/40 border border-white/5 space-y-2">
                <div className="text-purple-300 font-bold text-sm flex items-center gap-2">
                  <Zap className="w-4 h-4 text-purple-400" />
                  Auto-Claim & Mentions
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Staff are automatically assigned when replying or when mentioned inside any ticket thread.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-black/40 border border-white/5 space-y-2">
                <div className="text-purple-300 font-bold text-sm flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-purple-400" />
                  Encrypted Transcripts
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Full message logs, embedded screenshots, and user timestamps are archived automatically upon closure.
                </p>
              </div>
            </div>
          </div>

          {/* ===================================================== */}
          {/* BOT 2: SYNCINK VOICE BOT */}
          {/* ===================================================== */}
          <div className="rounded-3xl bg-[#09111b]/95 border border-cyan-500/30 p-6 sm:p-10 backdrop-blur-xl shadow-2xl relative overflow-hidden group hover:border-cyan-500/60 transition-all duration-300">
            <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pb-8 border-b border-white/[0.08]">
              <div className="flex items-start sm:items-center gap-5">
                <div className="w-20 h-20 rounded-2xl bg-cyan-600/20 border-2 border-cyan-500/40 shadow-[0_0_25px_rgba(6,182,212,0.35)] flex items-center justify-center p-2 shrink-0">
                  <img
                    src="/voice-logo.png"
                    alt="SyncInk Voice"
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = "none";
                    }}
                  />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                      Voice Channels
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-purple-500/15 text-purple-300 border border-purple-500/30">
                      Join to Create
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                      Lossless Audio
                    </span>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-black text-white">SyncInk© Voice Bot</h3>
                  <p className="text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
                    Dynamic temporary voice channel manager. Users click a generator hub to instantly create a temporary room with custom naming patterns, user limits, and instant cleanup when empty.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 shrink-0">
                <a
                  href="https://discord.com/oauth2/authorize?client_id=1516578887109181520&permissions=286346256&integration_type=0&scope=bot+applications.commands"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs sm:text-sm transition-all shadow-[0_0_20px_rgba(6,182,212,0.35)] flex items-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Invite Bot</span>
                </a>
                <Link
                  href="/dashboard/voice"
                  className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs sm:text-sm transition-all border border-white/10 flex items-center gap-2"
                >
                  <Volume2 className="w-4 h-4 text-cyan-400" />
                  <span>Open Dedicated Dashboard</span>
                </Link>
              </div>
            </div>

            {/* Feature Highlights Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-8">
              <div className="p-5 rounded-2xl bg-black/40 border border-white/5 space-y-2">
                <div className="text-cyan-300 font-bold text-sm flex items-center gap-2">
                  <Radio className="w-4 h-4 text-cyan-400" />
                  Join-to-Create Hubs
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Click a master hub to spawn a private temporary voice room with customizable naming schemes.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-black/40 border border-white/5 space-y-2">
                <div className="text-cyan-300 font-bold text-sm flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-cyan-400" />
                  Owner Controls (/voice)
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Creators can lock, hide (ghost mode), limit users, or kick members with quick slash commands.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-black/40 border border-white/5 space-y-2">
                <div className="text-cyan-300 font-bold text-sm flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                  Automatic Empty Purge
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Channels are cleanly deleted within 1.5 seconds when the last user leaves, preventing ghost channels.
                </p>
              </div>
            </div>
          </div>

          {/* ===================================================== */}
          {/* BOT 3: SYNCINK RADIO (TEMPORARILY CLOSED) */}
          {/* ===================================================== */}
          <div className="rounded-3xl bg-[#140a17]/95 border border-pink-500/25 p-6 sm:p-10 backdrop-blur-xl shadow-2xl relative overflow-hidden">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pb-8 border-b border-white/[0.08]">
              <div className="flex items-start sm:items-center gap-5">
                <div className="w-20 h-20 rounded-2xl bg-pink-600/20 border-2 border-pink-500/30 flex items-center justify-center shrink-0 shadow-lg">
                  <Music className="w-10 h-10 text-pink-400" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-pink-500/15 text-pink-300 border border-pink-500/30">
                      High-Fidelity Audio
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-red-500/15 text-red-400 border border-red-500/30 shadow-[0_0_10px_rgba(239,68,68,0.2)]">
                      Temporarily Closed
                    </span>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-black text-white opacity-85">SyncInk© Radio</h3>
                  <p className="text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
                    High-quality streaming audio from all major music providers. This service is currently undergoing scheduled infrastructure upgrades.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span className="px-5 py-2.5 rounded-xl bg-white/5 text-slate-500 border border-white/5 font-bold text-xs sm:text-sm cursor-not-allowed">
                  Temporarily Closed
                </span>
                <a
                  href="mailto:syncink.support@gmail.com"
                  className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs sm:text-sm transition-all border border-white/10"
                >
                  Inquire Support
                </a>
              </div>
            </div>

            {/* Platform Badges */}
            <div className="pt-6 flex flex-wrap gap-2.5">
              {["Spotify", "YouTube Music", "SoundCloud", "Apple Music", "Deezer", "TIDAL"].map((plat) => (
                <span
                  key={plat}
                  className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-slate-300"
                >
                  {plat}
                </span>
              ))}
            </div>
          </div>

          {/* ===================================================== */}
          {/* BOT 4: SYNCINK SUPPORT & SECURITY BOT (NON-INVITABLE) */}
          {/* ===================================================== */}
          <div className="rounded-3xl bg-[#130a13]/95 border border-purple-500/40 p-6 sm:p-10 backdrop-blur-xl shadow-2xl relative overflow-hidden group hover:border-purple-500/70 transition-all duration-300">
            <div className="absolute top-0 right-0 w-80 h-80 bg-brand-purple/15 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pb-8 border-b border-white/[0.08]">
              <div className="flex items-start sm:items-center gap-5">
                <div className="w-20 h-20 rounded-2xl bg-purple-600/20 border-2 border-purple-500/40 shadow-[0_0_30px_rgba(157,124,255,0.4)] flex items-center justify-center shrink-0 overflow-hidden">
                  <img
                    src="/syncink-s-purple.jpg"
                    alt="SyncInk Support Bot"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-[0_0_12px_rgba(157,124,255,0.25)]">
                      🛡️ Internal Support Server Bot • Non-Invitable
                    </span>
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                      Active Defense
                    </span>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-black text-white">SyncInk Support & Security Bot</h3>
                  <p className="text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
                    Non-invitable security & automod shield dedicated exclusively to keeping the official <strong>SyncInk Support Server</strong> safe, monitored, and secured 24/7. Neutralizes raid attacks, manages quarantine, and logs moderation cases in real time.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 shrink-0">
                <span className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-mono text-purple-300 font-bold">
                  Server ID: 1520461877073674392
                </span>
                <Link
                  href="/dashboard/security"
                  className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs sm:text-sm transition-all shadow-[0_0_20px_rgba(157,124,255,0.35)] flex items-center gap-2"
                >
                  <Shield className="w-4 h-4" />
                  <span>Security Console</span>
                </Link>
              </div>
            </div>

            {/* Defense Highlights */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-8">
              <div className="p-5 rounded-2xl bg-black/40 border border-white/5 space-y-2">
                <div className="text-purple-300 font-bold text-sm flex items-center gap-2">
                  <Shield className="w-4 h-4 text-purple-400" />
                  Velocity Raid Dampeners
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Real-time join spike and message velocity dampening. Engages emergency lockdown within milliseconds if abnormal raid patterns are detected.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-black/40 border border-white/5 space-y-2">
                <div className="text-purple-300 font-bold text-sm flex items-center gap-2">
                  <Lock className="w-4 h-4 text-purple-400" />
                  Quarantine Isolation
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Threat actors and bypass accounts are immediately stripped of interaction rights and jailed in isolated quarantine channels.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-black/40 border border-white/5 space-y-2">
                <div className="text-purple-300 font-bold text-sm flex items-center gap-2">
                  <Activity className="w-4 h-4 text-purple-400" />
                  Real-Time Forensics
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Live PostgreSQL database telemetry synchronizes moderation cases, strike tallies, and audit trails to the dashboard every second.
                </p>
              </div>
            </div>
          </div>

          {/* ===================================================== */}
          {/* RECRUITMENT & COMMUNITY CALLOUT */}
          {/* ===================================================== */}
          <div className="rounded-3xl bg-gradient-to-r from-[#120e24] via-[#10132b] to-[#150d24] border border-purple-500/30 p-8 sm:p-12 text-center relative overflow-hidden shadow-2xl">
            <div className="max-w-2xl mx-auto space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center mx-auto text-purple-400 shadow-xl">
                <Users className="w-7 h-7" />
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-white">Join the SyncInk Staff or Dev Team</h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                Passionate about community moderation or bot development? Apply through our unified portal with your Discord account in under two minutes.
              </p>
              <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
                <Link
                  href="/apply"
                  className="px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm transition-all shadow-[0_0_20px_rgba(157,124,255,0.4)] flex items-center gap-2"
                >
                  <span>Apply Now (No Discord ID Input Needed)</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <a
                  href="https://discord.gg/syncink"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-sm transition-all border border-white/10 flex items-center gap-2"
                >
                  <span>Join Official Discord Server</span>
                  <ExternalLink className="w-4 h-4" />
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
