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
  Layers,
  Cpu,
  Database,
  Radio,
  FileCheck,
  BookOpen,
  HelpCircle,
  Sparkles,
  ArrowRight,
  Server,
  Zap,
  Eye,
  Sliders,
  Terminal,
  Activity,
  Users,
} from "lucide-react";
import { PublicNavbar } from "@/components/PublicNavbar";
import { PublicFooter } from "@/components/PublicFooter";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#060812] text-slate-100 flex flex-col font-sans selection:bg-brand-red selection:text-white relative overflow-x-hidden">
      <PublicNavbar />

      <main className="flex-1 w-full">
        {/* ========================================================= */}
        {/* HERO SECTION */}
        {/* ========================================================= */}
        <section
          aria-labelledby="about-hero-title"
          className="relative pt-20 sm:pt-28 pb-16 sm:pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-b border-white/[0.06]"
        >
          {/* Subtle Ambient Glow */}
          <div
            aria-hidden="true"
            className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[36rem] h-[20rem] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none"
          />

          <div className="relative z-10 max-w-4xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-white/10 text-slate-300 text-xs font-semibold uppercase tracking-wider shadow-sm">
              <Layers className="h-3.5 w-3.5 text-blue-400" />
              <span>About SyncInk • Platform Overview</span>
            </div>

            <h1
              id="about-hero-title"
              className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.15]"
            >
              Purpose-Built Automation for{" "}
              <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-cyan-300 bg-clip-text text-transparent">
                Modern Discord Communities.
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
              SyncInk designs and operates specialized Discord bots, web consoles, and community infrastructure. We replace cluttered, monolithic bots with focused, high-performance systems engineered for reliability, privacy, and scale.
            </p>

            {/* Factual Core Badges */}
            <div className="pt-4 flex flex-wrap items-center justify-center gap-3 sm:gap-4 text-xs font-medium text-slate-300">
              <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/[0.03] border border-white/[0.08]">
                <Cpu className="w-4 h-4 text-blue-400" />
                <span>Micro-Bot Specialization</span>
              </div>
              <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/[0.03] border border-white/[0.08]">
                <Lock className="w-4 h-4 text-indigo-400" />
                <span>Thread-Native Privacy</span>
              </div>
              <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/[0.03] border border-white/[0.08]">
                <Zap className="w-4 h-4 text-cyan-400" />
                <span>1.5s Ephemeral Purge</span>
              </div>
              <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/[0.03] border border-white/[0.08]">
                <Server className="w-4 h-4 text-emerald-400" />
                <span>PostgreSQL & Node.js Engine</span>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* PHILOSOPHY & WHY WE EXIST */}
        {/* ========================================================= */}
        <section
          aria-labelledby="philosophy-title"
          className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-b border-white/[0.06]"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
            <div className="lg:col-span-5 space-y-4">
              <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">
                Our Engineering Philosophy
              </span>
              <h2
                id="philosophy-title"
                className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight"
              >
                Why Specialization Beats Monolithic Bots.
              </h2>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                Most community bots try to solve every problem at once—bundling tickets, voice, leveling, games, and moderation into a single fragile process. The result is often channel clutter, hitting Discord rate limits, and slow responsiveness during traffic spikes.
              </p>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                SyncInk takes an infrastructure-first approach: we break common server bottlenecks into independent, dedicated micro-bots. Each bot executes one domain flawlessly with isolated failure boundaries and zero server clutter.
              </p>
            </div>

            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
              <div className="p-6 rounded-2xl bg-[#0a0d18] border border-white/[0.08] space-y-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
                  <Layers className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white">Zero Channel Clutter</h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  Instead of creating hundreds of separate text channels that fill server lists and hit Discord's 500-channel limit, our ticket platform operates entirely inside native private threads.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-[#0a0d18] border border-white/[0.08] space-y-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                  <Zap className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white">Ephemeral Resources</h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  Voice rooms spawn automatically on demand and cleanly purge within 1.5 seconds of being vacated, guaranteeing clean voice categories without dead rooms.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-[#0a0d18] border border-white/[0.08] space-y-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <Lock className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white">Confidential Transcripts</h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  Ticket archives are saved as encrypted HTML transcripts. Only designated moderators and the ticket author can access records via our secured transcript viewer.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-[#0a0d18] border border-white/[0.08] space-y-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Activity className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white">Decoupled Operations</h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  A spike in voice channel creations will never slow down support tickets. Each bot runs on dedicated services with isolated event queues.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* PRODUCTS & BOTS ECOSYSTEM */}
        {/* ========================================================= */}
        <section
          aria-labelledby="products-title"
          className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-b border-white/[0.06]"
        >
          <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16 space-y-3">
            <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">
              The Product Lineup
            </span>
            <h2
              id="products-title"
              className="text-2xl sm:text-4xl font-black text-white tracking-tight"
            >
              The SyncInk Bot Suite
            </h2>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              Every tool in the SyncInk ecosystem is crafted for a distinct operational requirement in Discord community management.
            </p>
          </div>

          <div className="space-y-8 sm:space-y-10">
            {/* PRODUCT 1: SYNCINK TICKET BOT */}
            <article className="p-6 sm:p-10 rounded-3xl bg-[#0a0d1a] border border-blue-500/20 hover:border-blue-500/40 transition-colors shadow-xl">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pb-6 border-b border-white/[0.06]">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-5">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-blue-600/15 border border-blue-500/30 flex items-center justify-center shrink-0">
                    <img
                      src="/ticket-logo.png"
                      alt="SyncInk Ticket Bot Icon"
                      className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl object-cover"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = "none";
                      }}
                    />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-blue-500/15 text-blue-300 border border-blue-500/30">
                        Public Bot • Invitable
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-white/5 text-slate-300 border border-white/10">
                        Node.js & Discord.js v14
                      </span>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-bold text-white">SyncInk Ticket Bot</h3>
                    <p className="text-xs sm:text-sm text-slate-400 mt-1">
                      Enterprise Support Ticketing with Native Private Thread Isolation
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                  <a
                    href="https://discord.com/oauth2/authorize?client_id=1513075101992747158&permissions=361046068240&integration_type=0&scope=bot+applications.commands"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-colors flex items-center justify-center gap-2"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Invite Ticket Bot</span>
                  </a>
                  <Link
                    href="/dashboard/tickets"
                    className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 font-bold text-xs border border-white/10 transition-colors flex items-center justify-center gap-2"
                  >
                    <Layers className="w-3.5 h-3.5 text-blue-400" />
                    <span>Ticket Dashboard</span>
                  </Link>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6">
                <div className="space-y-1.5">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-400" />
                    Private Thread Infrastructure
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Operates inside Discord's private threads. Avoids filling up the server channel list, preserves member confidentiality, and never hits server channel quotas.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-400" />
                    Custom Categories & Emojis
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Interactive buttons and drop-down menus with support for custom Discord emojis. Routes user tickets into dedicated departments (General, Bug Reports, Reports, etc.).
                  </p>
                </div>

                <div className="space-y-1.5">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-400" />
                    Encrypted Web Transcripts
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Automatic transcript generation upon closure. Archives message timestamps, attachments, and embedded messages in an encrypted HTML viewer for staff auditability.
                  </p>
                </div>
              </div>
            </article>

            {/* PRODUCT 2: SYNCINK VOICE BOT */}
            <article className="p-6 sm:p-10 rounded-3xl bg-[#080f1a] border border-cyan-500/20 hover:border-cyan-500/40 transition-colors shadow-xl">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pb-6 border-b border-white/[0.06]">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-5">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-cyan-600/15 border border-cyan-500/30 flex items-center justify-center shrink-0">
                    <img
                      src="/voice-logo.png"
                      alt="SyncInk Voice Bot Icon"
                      className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl object-cover"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = "none";
                      }}
                    />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                        Public Bot • Invitable
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-white/5 text-slate-300 border border-white/10">
                        Node.js & Express Architecture
                      </span>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-bold text-white">SyncInk Voice Bot</h3>
                    <p className="text-xs sm:text-sm text-slate-400 mt-1">
                      Dynamic Temporary Voice Channels with In-Room Controls
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                  <a
                    href="https://discord.com/oauth2/authorize?client_id=1516578887109181520&permissions=285220880&integration_type=0&scope=bot+applications.commands"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs transition-colors flex items-center justify-center gap-2"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Invite Voice Bot</span>
                  </a>
                  <Link
                    href="/dashboard/voice"
                    className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 font-bold text-xs border border-white/10 transition-colors flex items-center justify-center gap-2"
                  >
                    <Layers className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Voice Dashboard</span>
                  </Link>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6">
                <div className="space-y-1.5">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                    Join-to-Create Hubs
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Members connect to a single generator channel. The bot instantly spawns a dedicated temporary voice channel and moves the user into it seamlessly.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                    In-Room Owner Controls
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Room creators manage permissions with slash commands and interactive panels: lock, hide (ghost mode), set user limits, permit friends, or kick unwanted members.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                    1.5-Second Auto-Purge
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    When the last member disconnects, the channel is permanently deleted within 1.5 seconds. No lingering empty rooms or voice channel debris left behind.
                  </p>
                </div>
              </div>
            </article>

            {/* PRODUCT 3: SYNCINK SUPPORT & SECURITY BOT */}
            <article className="p-6 sm:p-10 rounded-3xl bg-[#0f0c1a] border border-indigo-500/20 hover:border-indigo-500/40 transition-colors shadow-xl">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pb-6 border-b border-white/[0.06]">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-5">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-indigo-600/15 border border-indigo-500/30 flex items-center justify-center shrink-0">
                    <img
                      src="/syncink-main-logo.png"
                      alt="SyncInk Support Bot Icon"
                      className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl object-cover"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = "none";
                      }}
                    />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                        Internal Platform Shield • Non-Invitable
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-white/5 text-slate-300 border border-white/10">
                        Python 3.10+ & PostgreSQL
                      </span>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-bold text-white">SyncInk Support & Security Bot</h3>
                    <p className="text-xs sm:text-sm text-slate-400 mt-1">
                      Dedicated automod defense and real-time incident quarantine for the official SyncInk Support Server
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                  <span className="px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-mono text-indigo-300">
                    Server ID: 1520461877073674392
                  </span>
                  <Link
                    href="/dashboard/security"
                    className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-colors flex items-center justify-center gap-2"
                  >
                    <Shield className="w-3.5 h-3.5" />
                    <span>Security Telemetry</span>
                  </Link>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6">
                <div className="space-y-1.5">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-400" />
                    Velocity Raid Dampening
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Detects abnormal member join spikes and message velocity surges. Engages instant emergency lockdowns in milliseconds to neutralize automated raid attacks.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-400" />
                    Automated Quarantine
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Raid suspects and policy bypass accounts are automatically stripped of permissions and confined to an isolated quarantine channel awaiting staff review.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-400" />
                    Live Database Forensics
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Persistent PostgreSQL migrations record every moderation action, strike tally, and whitelist change with real-time API sync to our web console.
                  </p>
                </div>
              </div>
            </article>

            {/* PRODUCT 4: SYNCINK RADIO (FACTUAL STATUS) */}
            <article className="p-6 sm:p-8 rounded-3xl bg-[#120a16] border border-pink-500/15 opacity-80">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-pink-500/15 border border-pink-500/30 flex items-center justify-center text-pink-400 shrink-0">
                    <Radio className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-white">SyncInk Radio</h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-300 border border-amber-500/30">
                        Under Maintenance
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      High-fidelity audio streaming service currently undergoing scheduled backend upgrades to support larger listener capacities.
                    </p>
                  </div>
                </div>

                <span className="text-xs text-slate-500 font-medium">
                  Status: Temporarily Offline
                </span>
              </div>
            </article>
          </div>
        </section>

        {/* ========================================================= */}
        {/* ARCHITECTURE & TECHNOLOGY STANDARDS */}
        {/* ========================================================= */}
        <section
          aria-labelledby="tech-title"
          className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-b border-white/[0.06]"
        >
          <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16 space-y-3">
            <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">
              Under the Hood
            </span>
            <h2
              id="tech-title"
              className="text-2xl sm:text-4xl font-black text-white tracking-tight"
            >
              Architected for Stability & Low Latency
            </h2>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              Our infrastructure is purpose-built with modern toolchains, strict schema migrations, and clean separation between Discord bot processes and web dashboards.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="p-6 rounded-2xl bg-[#0a0d18] border border-white/[0.08] space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <Terminal className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white">Discord.js v14 & Python</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Utilizing latest Discord gateway intents, slash command routing, and localized Cog architecture for predictable sub-millisecond execution.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#0a0d18] border border-white/[0.08] space-y-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                <Database className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white">PostgreSQL & MongoDB</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Persistent relational data for moderation audit logs and thread state, paired with document storage for dynamic voice configurations.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#0a0d18] border border-white/[0.08] space-y-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white">Next.js 14 App Router</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Server-rendered console hosted on Vercel with edge caching, strict security headers, and instant real-time telemetry polling.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#0a0d18] border border-white/[0.08] space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Shield className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white">Role-Based OAuth2 Security</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Discord OAuth2 session authentication restricting server dashboards exclusively to verified administrators and guild owners.
              </p>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* ECOSYSTEM TRANSPARENCY & COMMUNITY DIRECTORY */}
        {/* ========================================================= */}
        <section
          aria-labelledby="governance-title"
          className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-b border-white/[0.06]"
        >
          <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-14 space-y-3">
            <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">
              Governance & Resources
            </span>
            <h2
              id="governance-title"
              className="text-2xl sm:text-4xl font-black text-white tracking-tight"
            >
              Public Standards & Transparency
            </h2>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              We operate with transparent policies, structured rules, and open channels for community participation and staff recruitment.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <Link
              href="/rules"
              className="group p-6 rounded-2xl bg-[#0a0d18] border border-white/[0.08] hover:border-white/20 transition-all space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                  <BookOpen className="w-4 h-4" />
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
              </div>
              <h3 className="text-base font-bold text-white group-hover:text-blue-300 transition-colors">
                Community Rules
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Official behavior policies, Discord bot usage guidelines, and moderation standards across all SyncInk servers.
              </p>
            </Link>

            <Link
              href="/faq"
              className="group p-6 rounded-2xl bg-[#0a0d18] border border-white/[0.08] hover:border-white/20 transition-all space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                  <HelpCircle className="w-4 h-4" />
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
              </div>
              <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors">
                Frequently Asked Questions
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Answers regarding bot permissions, setup commands (`/setup`), voice hub configuration, and troubleshooting.
              </p>
            </Link>

            <Link
              href="/privacy"
              className="group p-6 rounded-2xl bg-[#0a0d18] border border-white/[0.08] hover:border-white/20 transition-all space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Lock className="w-4 h-4" />
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
              </div>
              <h3 className="text-base font-bold text-white group-hover:text-emerald-300 transition-colors">
                Privacy Policies
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Transparent documentation of data retention, transcript encryption, and minimal data access protocols.
              </p>
            </Link>

            <Link
              href="/terms"
              className="group p-6 rounded-2xl bg-[#0a0d18] border border-white/[0.08] hover:border-white/20 transition-all space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <FileCheck className="w-4 h-4" />
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
              </div>
              <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors">
                Terms of Service
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Conditions governing bot invitation, dashboard usage, API interactions, and community membership.
              </p>
            </Link>

            <Link
              href="/apply"
              className="group p-6 rounded-2xl bg-[#0a0d18] border border-white/[0.08] hover:border-white/20 transition-all space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                  <Sparkles className="w-4 h-4" />
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
              </div>
              <h3 className="text-base font-bold text-white group-hover:text-amber-300 transition-colors">
                Join the Team (Staff & Dev)
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Official application portal for community moderators, support personnel, and software developers.
              </p>
            </Link>

            <a
              href="https://github.com/SyncInk"
              target="_blank"
              rel="noopener noreferrer"
              className="group p-6 rounded-2xl bg-[#0a0d18] border border-white/[0.08] hover:border-white/20 transition-all space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                  <ExternalLink className="w-4 h-4" />
                </div>
                <ExternalLink className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
              </div>
              <h3 className="text-base font-bold text-white group-hover:text-purple-300 transition-colors">
                GitHub Organization
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Official open repositories, issue tracking, and developer updates from the SyncInk development team.
              </p>
            </a>
          </div>
        </section>

        {/* ========================================================= */}
        {/* FINAL CALL TO ACTION */}
        {/* ========================================================= */}
        <section
          aria-labelledby="community-cta-title"
          className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto"
        >
          <div className="p-8 sm:p-14 rounded-3xl bg-gradient-to-b from-[#0f1426] to-[#0a0d18] border border-blue-500/25 text-center max-w-3xl mx-auto space-y-6 shadow-2xl relative overflow-hidden">
            <div className="w-14 h-14 rounded-2xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center mx-auto text-blue-400">
              <Users className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <h2
                id="community-cta-title"
                className="text-2xl sm:text-4xl font-black text-white tracking-tight"
              >
                Join the SyncInk Ecosystem
              </h2>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-xl mx-auto">
                Whether you need scalable ticket support, automated voice rooms, or want to connect with our developer community, you can get started right now.
              </p>
            </div>

            <div className="pt-2 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
              <a
                href="https://discord.gg/rB6gNZaK9u"
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm transition-all shadow-lg flex items-center gap-2 hover:-translate-y-0.5 duration-200"
              >
                <span>Join Official Discord Server</span>
                <ExternalLink className="w-4 h-4" />
              </a>

              <Link
                href="/dashboard"
                className="px-6 py-3.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 font-bold text-sm border border-white/10 transition-all flex items-center gap-2 hover:-translate-y-0.5 duration-200"
              >
                <Layers className="w-4 h-4 text-blue-400" />
                <span>Multi-Bot Console</span>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
