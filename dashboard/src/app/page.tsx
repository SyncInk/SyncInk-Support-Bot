"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Shield,
  MessageSquare,
  Radio,
  Music,
  Sparkles,
  ChevronRight,
  ExternalLink,
  Copy,
  Check,
  Zap,
  Users,
  Lock,
  ArrowRight,
  Sliders,
  FileText,
  Volume2,
  Terminal,
  Activity,
  Layers,
  HelpCircle,
  FileCheck,
  CheckCircle2,
} from "lucide-react";
import { PublicNavbar } from "@/components/PublicNavbar";
import { PublicFooter } from "@/components/PublicFooter";

// Command Definition Interface
interface Command {
  name: string;
  desc: string;
}

export default function HomePage() {
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);
  const [mainTab, setMainTab] = useState<"economy" | "casino" | "moderation" | "fun">("economy");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Copy helper
  const handleCopy = (cmd: string) => {
    navigator.clipboard.writeText(cmd);
    setCopiedCmd(cmd);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  // Canvas particle animation
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

    const particleCount = Math.min(Math.floor(window.innerWidth / 18), 70);
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        radius: Math.random() * 1.5 + 0.6,
        alpha: Math.random() * 0.45 + 0.1,
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

          if (dist < 110) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(231, 76, 60, ${0.08 * (1 - dist / 110)})`;
            ctx.lineWidth = 0.8;
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
        ctx.fillStyle = `rgba(240, 82, 82, ${p.alpha})`;
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

  // Main Bot Commands by Category
  const commandsData: Record<string, Command[]> = {
    economy: [
      { name: "?bal", desc: "View cookie wallet & bank balance" },
      { name: "?dep <amt>", desc: "Deposit cookies into secure vault" },
      { name: "?with <amt>", desc: "Withdraw cookies from vault" },
      { name: "?daily", desc: "Claim daily streak bonus reward" },
      { name: "?weekly", desc: "Claim weekly tiered reward" },
      { name: "?work", desc: "Complete shifts for cookie earnings" },
      { name: "?give @user <amt>", desc: "Transfer cookies to another user" },
    ],
    casino: [
      { name: "?bet <amt> <h/l>", desc: "Predict high or low card multiplier" },
      { name: "?cr <amt>", desc: "Live multiplier crash game - cash out before crash" },
      { name: "?slots <amt>", desc: "Roll classic 3-reel high-stakes slot machine" },
      { name: "?cf <amt> <h/t>", desc: "50/50 Coinflip double-or-nothing" },
      { name: "?dice <amt> <1-6>", desc: "Roll single die for 5x jackpot payout" },
      { name: "?bj <amt>", desc: "Play full rules Blackjack vs dealer" },
      { name: "?rl <amt> <color>", desc: "High-roller European roulette table" },
    ],
    moderation: [
      { name: "?ban / ?kick", desc: "Remove malicious users with case logging" },
      { name: "?mute / ?warn", desc: "Apply Discord timeout or persistent strikes" },
      { name: "?clear <amount>", desc: "Purge chat history (up to 100 messages)" },
      { name: "?lock / ?unlock", desc: "Seal channel permissions during incidents" },
      { name: "?setwelcome", desc: "Configure custom welcome portal channel" },
      { name: "?setlog", desc: "Define administrative audit log destination" },
      { name: "?setauthorole", desc: "Automatically assign roles to joining users" },
    ],
    fun: [
      { name: "?rob / ?heist", desc: "Attempt risky wallet heist or group bank raid" },
      { name: "?cd", desc: "Check cooldowns on all rewards and commands" },
      { name: "?lvl", desc: "Inspect current activity level, card, and XP" },
      { name: "?msgs / ?vctime", desc: "View message frequency and voice channel stats" },
      { name: "?lb", desc: "Global and server-wide wealth leaderboards" },
      { name: "?truth / ?dare", desc: "AI-enhanced unique truth or dare challenges" },
      { name: "?help", desc: "Complete interactive command directory" },
    ],
  };

  return (
    <div className="min-h-screen bg-[#060812] text-slate-100 flex flex-col font-sans selection:bg-brand-red selection:text-white relative overflow-x-hidden">
      {/* Dynamic Background Particle Canvas */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none z-0 opacity-80"
      />

      {/* Subtle Glow Spheres */}
      <div className="fixed top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-brand-red/10 rounded-full blur-[140px] pointer-events-none z-0" />
      <div className="fixed bottom-1/4 right-10 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[130px] pointer-events-none z-0" />
      <div className="fixed top-2/3 left-10 w-[450px] h-[450px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none z-0" />

      {/* Navigation */}
      <PublicNavbar />

      <main className="relative z-10 flex-1">
        {/* ========================================================= */}
        {/* HERO SECTION WITH SMOOTH GREETING */}
        {/* ========================================================= */}
        <section className="pt-20 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-red/10 border border-brand-red/30 text-brand-crimson text-xs font-extrabold uppercase tracking-widest mb-6 animate-in fade-in duration-700">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            <span>SyncInk Ecosystem • Custom Domain syncink.site</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight leading-[1.08] max-w-5xl mx-auto mb-6">
            Discord Infrastructure{" "}
            <span className="bg-gradient-to-r from-brand-crimson via-brand-red to-accent-cyan bg-clip-text text-transparent">
              Engineered For Excellence.
            </span>
          </h1>

          <p className="text-base sm:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed mb-10">
            Welcome to the official home of SyncInk. Protect your community with real-time velocity shields, resolve tickets with zero-clutter private threads, and power your voice channels with dynamic generation.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <a
              href="#bots"
              className="px-7 py-3.5 rounded-xl bg-gradient-to-r from-brand-crimson to-brand-red hover:opacity-95 text-white font-bold text-sm sm:text-base transition-all shadow-[0_0_25px_rgba(231,76,60,0.35)] flex items-center gap-2"
            >
              <span>Explore All Bots</span>
              <ChevronRight className="w-4 h-4" />
            </a>

            <Link
              href="/dashboard"
              className="px-7 py-3.5 rounded-xl bg-[#121624] hover:bg-[#1a2034] text-white font-bold text-sm sm:text-base transition-all border border-white/10 flex items-center gap-2 shadow-lg"
            >
              <Shield className="w-4 h-4 text-accent-cyan" />
              <span>Unified Console</span>
            </Link>

            <Link
              href="/apply"
              className="px-7 py-3.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 font-bold text-sm sm:text-base transition-all border border-white/10 flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span>Join Our Team</span>
            </Link>
          </div>
        </section>

        {/* ========================================================= */}
        {/* METRICS STRIP */}
        {/* ========================================================= */}
        <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto mb-20">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 rounded-2xl bg-[#0b0e18]/80 border border-white/10 backdrop-blur-xl shadow-xl">
            <div className="text-center p-3">
              <div className="text-3xl sm:text-4xl font-black text-white">150+</div>
              <div className="text-xs sm:text-sm font-semibold text-slate-400 mt-1">Servers Protected</div>
            </div>
            <div className="text-center p-3">
              <div className="text-3xl sm:text-4xl font-black text-brand-crimson">1.2M+</div>
              <div className="text-xs sm:text-sm font-semibold text-slate-400 mt-1">Monthly Commands</div>
            </div>
            <div className="text-center p-3">
              <div className="text-3xl sm:text-4xl font-black text-purple-400">25,000+</div>
              <div className="text-xs sm:text-sm font-semibold text-slate-400 mt-1">Tickets Resolved</div>
            </div>
            <div className="text-center p-3">
              <div className="text-3xl sm:text-4xl font-black text-accent-cyan">540K+</div>
              <div className="text-xs sm:text-sm font-semibold text-slate-400 mt-1">Voice Minutes Streamed</div>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* BOT SHOWCASE SECTION */}
        {/* ========================================================= */}
        <section id="bots" className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-16 pb-24">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="text-xs font-bold uppercase tracking-widest text-brand-crimson mb-2">
              SyncInk Ecosystem Portfolio
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Four Specialized Bots. One Cohesive Experience.
            </h2>
          </div>

          {/* ===================================================== */}
          {/* BOT 1: SYNCINK MULTI-PURPOSE & SECURITY */}
          {/* ===================================================== */}
          <div className="rounded-3xl bg-[#0c101c]/90 border border-white/10 p-6 sm:p-10 backdrop-blur-xl shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-brand-red/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pb-8 border-b border-white/[0.08]">
              <div className="flex items-start sm:items-center gap-5">
                <img
                  src="https://files.catbox.moe/74l9su.png"
                  alt="SyncInk Main Bot"
                  className="w-20 h-20 rounded-2xl border-2 border-brand-red/40 shadow-[0_0_25px_rgba(231,76,60,0.3)] object-cover shrink-0"
                />
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-brand-red/15 text-brand-crimson border border-brand-red/30">
                      Multi-Purpose
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-blue-500/15 text-blue-400 border border-blue-500/30">
                      Security Shields
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-400 border border-amber-500/30">
                      Economy & Casino
                    </span>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-black text-white">SyncInk© Multi-Purpose</h3>
                  <p className="text-sm text-slate-300 mt-1 max-w-2xl">
                    The ultimate server cornerstone. Packed with real-time raid velocity dampeners, auto-quarantine, deep economy simulation, gambling minigames, and comprehensive moderation controls.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 shrink-0">
                <a
                  href="https://discord.com/oauth2/authorize?client_id=1500289929731768472"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-2.5 rounded-xl bg-brand-red hover:bg-brand-crimson text-white font-bold text-xs sm:text-sm transition-all shadow-[0_0_20px_rgba(231,76,60,0.3)] flex items-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Invite SyncInk</span>
                </a>
                <Link
                  href="/dashboard"
                  className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs sm:text-sm transition-all border border-white/10 flex items-center gap-2"
                >
                  <Shield className="w-4 h-4 text-accent-cyan" />
                  <span>Security Console</span>
                </Link>
              </div>
            </div>

            {/* Interactive Command Tabs */}
            <div className="pt-8">
              <div className="flex items-center justify-between mb-4">
                <div className="text-xs font-bold uppercase tracking-widest text-slate-400">
                  Interactive Command Directory
                </div>
                {copiedCmd && (
                  <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" />
                    Copied `{copiedCmd}` to clipboard!
                  </span>
                )}
              </div>

              <div className="flex flex-wrap gap-2 mb-6">
                {(["economy", "casino", "moderation", "fun"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setMainTab(tab)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border ${
                      mainTab === tab
                        ? "bg-brand-red/20 border-brand-red text-white shadow-sm"
                        : "bg-black/30 border-white/10 text-slate-400 hover:text-white"
                    }`}
                  >
                    {tab === "fun" ? "Fun, Stats & Crime" : tab}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {commandsData[mainTab].map((cmd) => (
                  <div
                    key={cmd.name}
                    onClick={() => handleCopy(cmd.name.split(" ")[0])}
                    className="p-3.5 rounded-xl bg-black/40 border border-white/5 hover:border-brand-red/40 hover:bg-white/[0.03] transition-all cursor-pointer group flex items-center justify-between"
                  >
                    <div className="min-w-0 pr-2">
                      <div className="font-mono text-xs font-bold text-brand-crimson group-hover:text-white transition-colors">
                        {cmd.name}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate mt-0.5">{cmd.desc}</div>
                    </div>
                    <Copy className="w-3.5 h-3.5 text-slate-500 group-hover:text-white shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ===================================================== */}
          {/* BOT 2: SYNCINK TICKET BOT */}
          {/* ===================================================== */}
          <div className="rounded-3xl bg-[#100d1c]/90 border border-purple-500/20 p-6 sm:p-10 backdrop-blur-xl shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pb-8 border-b border-white/[0.08]">
              <div className="flex items-start sm:items-center gap-5">
                <div className="w-20 h-20 rounded-2xl bg-purple-600/20 border-2 border-purple-500/40 shadow-[0_0_25px_rgba(147,51,234,0.3)] flex items-center justify-center shrink-0">
                  <MessageSquare className="w-10 h-10 text-purple-400" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-purple-500/15 text-purple-300 border border-purple-500/30">
                      Private Threads
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                      Auto-Claim Engine
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                      Encrypted Transcripts
                    </span>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-black text-white">SyncInk© Ticket Bot</h3>
                  <p className="text-sm text-slate-300 mt-1 max-w-2xl">
                    Powerful. Automated. Professional. Private thread infrastructure prevents public channel spam, coupled with question modals before ticket creation and automated HTML transcripts.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 shrink-0">
                <a
                  href="https://discord.com/oauth2/authorize?client_id=1513075101992747158&permissions=361046068240&integration_type=0&scope=bot+applications.commands"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs sm:text-sm transition-all shadow-[0_0_20px_rgba(147,51,234,0.3)] flex items-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Invite Ticket Bot</span>
                </a>
                <a
                  href="https://syncink-ticket-bot.up.railway.app/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs sm:text-sm transition-all border border-white/10 flex items-center gap-2"
                >
                  <Layers className="w-4 h-4 text-purple-400" />
                  <span>Railway Console</span>
                </a>
              </div>
            </div>

            {/* Ticket Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-8">
              <div className="p-5 rounded-2xl bg-black/30 border border-white/5 space-y-2">
                <div className="text-purple-400 font-bold text-sm flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  Private Thread Architecture
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Tickets open as private Discord threads instead of cluttering your server with hundreds of text channels.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-black/30 border border-white/5 space-y-2">
                <div className="text-purple-400 font-bold text-sm flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  Auto-Claim & Mentions
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Support staff are automatically assigned to the ticket as soon as they reply or when explicitly @mentioned.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-black/30 border border-white/5 space-y-2">
                <div className="text-purple-400 font-bold text-sm flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Complete HTML Transcripts
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Full message logs, embedded attachments, and user timestamps are archived automatically upon ticket closure.
                </p>
              </div>
            </div>

            {/* Setup Cheatsheet */}
            <div className="mt-6 p-4 rounded-xl bg-[#141026] border border-purple-500/20 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3 text-xs text-slate-300">
                <span className="font-bold text-purple-300">Instant Deploy:</span>
                <span>Type <code className="text-purple-400 font-mono">/ticket-config</code> followed by <code className="text-purple-400 font-mono">/ticket-panel</code></span>
              </div>
              <Link
                href="/dashboard"
                className="text-xs font-bold text-purple-400 hover:text-purple-300 flex items-center gap-1 transition-colors"
              >
                Configure in Dashboard &rarr;
              </Link>
            </div>
          </div>

          {/* ===================================================== */}
          {/* BOT 3: SYNCINK VOICE BOT */}
          {/* ===================================================== */}
          <div className="rounded-3xl bg-[#09111b]/90 border border-cyan-500/20 p-6 sm:p-10 backdrop-blur-xl shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pb-8 border-b border-white/[0.08]">
              <div className="flex items-start sm:items-center gap-5">
                <div className="w-20 h-20 rounded-2xl bg-cyan-600/20 border-2 border-cyan-500/40 shadow-[0_0_25px_rgba(6,182,212,0.3)] flex items-center justify-center shrink-0">
                  <Radio className="w-10 h-10 text-cyan-400" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                      Join to Create
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-blue-500/15 text-blue-300 border border-blue-500/30">
                      High Bitrate
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                      Auto-Purge
                    </span>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-black text-white">SyncInk© Voice Bot</h3>
                  <p className="text-sm text-slate-300 mt-1 max-w-2xl">
                    Dynamic temporary voice channel manager. Users click a hub channel to instantly generate a custom room with real-time bitrate controls, user limits, and automatic deletion when empty.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 shrink-0">
                <a
                  href="https://discord.com/oauth2/authorize?client_id=1516578887109181520&permissions=286346256&integration_type=0&scope=bot+applications.commands"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs sm:text-sm transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] flex items-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Invite Voice Bot</span>
                </a>
                <a
                  href="https://syncink-voice-dashboard.up.railway.app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs sm:text-sm transition-all border border-white/10 flex items-center gap-2"
                >
                  <Volume2 className="w-4 h-4 text-cyan-400" />
                  <span>Dedicated Voice Console</span>
                </a>
              </div>
            </div>

            {/* Voice Command Chips */}
            <div className="pt-8">
              <div className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">
                Channel Owner Slash Commands
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { cmd: "/voice lock", label: "Lock Channel" },
                  { cmd: "/voice hide", label: "Make Ghost/Invisible" },
                  { cmd: "/voice limit [n]", label: "Set User Cap" },
                  { cmd: "/voice kick @user", label: "Eject User" },
                  { cmd: "/voice bitrate", label: "Audio Fidelity" },
                  { cmd: "/voice claim", label: "Claim Ownership" },
                  { cmd: "/voice rename", label: "Dynamic Rename" },
                  { cmd: "/setup", label: "Deploy Hub Channel" },
                ].map((item) => (
                  <div
                    key={item.cmd}
                    onClick={() => handleCopy(item.cmd)}
                    className="p-3 rounded-xl bg-black/40 border border-white/5 hover:border-cyan-500/40 transition-all cursor-pointer group flex items-center justify-between"
                  >
                    <div>
                      <div className="font-mono text-xs font-bold text-cyan-400">{item.cmd}</div>
                      <div className="text-[11px] text-slate-400">{item.label}</div>
                    </div>
                    <Copy className="w-3.5 h-3.5 text-slate-500 group-hover:text-white shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ===================================================== */}
          {/* BOT 4: SYNCINK RADIO (PRESERVING STATUS) */}
          {/* ===================================================== */}
          <div className="rounded-3xl bg-[#140a14]/90 border border-pink-500/20 p-6 sm:p-10 backdrop-blur-xl shadow-2xl relative overflow-hidden">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pb-8 border-b border-white/[0.08]">
              <div className="flex items-start sm:items-center gap-5">
                <div className="w-20 h-20 rounded-2xl bg-pink-600/20 border-2 border-pink-500/30 flex items-center justify-center shrink-0">
                  <Music className="w-10 h-10 text-pink-400" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-pink-500/15 text-pink-300 border border-pink-500/30">
                      Audio Streaming
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-red-500/15 text-red-400 border border-red-500/30">
                      Temporarily Closed
                    </span>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-black text-white opacity-80">SyncInk© Radio</h3>
                  <p className="text-sm text-slate-400 mt-1 max-w-2xl">
                    High-quality audio streaming from all major platforms. This service is undergoing maintenance and upgrades.
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
          {/* COMMUNITY & APPLICATION CALLOUT */}
          {/* ===================================================== */}
          <div className="rounded-3xl bg-gradient-to-r from-[#11162b] to-[#1a1128] border border-white/10 p-8 sm:p-12 text-center relative overflow-hidden">
            <div className="max-w-2xl mx-auto space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center mx-auto text-brand-crimson shadow-xl">
                <Users className="w-7 h-7" />
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-white">Join the SyncInk Staff or Dev Team</h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                We are actively recruiting passionate Discord community moderators and skilled programmers. Log in securely with Discord and submit your application in under two minutes.
              </p>
              <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
                <Link
                  href="/apply"
                  className="px-6 py-3 rounded-xl bg-brand-red hover:bg-brand-crimson text-white font-bold text-sm transition-all shadow-[0_0_20px_rgba(231,76,60,0.35)] flex items-center gap-2"
                >
                  <span>Apply Now</span>
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
