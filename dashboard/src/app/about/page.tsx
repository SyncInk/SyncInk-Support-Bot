"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence, MotionConfig } from "framer-motion";
import {
  Shield,
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
  Terminal,
  Activity,
  Users,
} from "lucide-react";
import { PublicNavbar } from "@/components/PublicNavbar";
import { PublicFooter } from "@/components/PublicFooter";
import { spring, transition } from "@/lib/motion-tokens";

type BotFilter = "all" | "ticket" | "voice" | "radio" | "security";

interface BotSpec {
  id: Exclude<BotFilter, "all">;
  name: string;
  tagline: string;
  availability: string;
  runtime: string;
  logo: string;
  logoAlt: string;
  useNextImage?: boolean;
  primaryAction: {
    label: string;
    href: string;
    external?: boolean;
  };
  secondaryAction?: {
    label: string;
    href: string;
  };
  tertiaryAction?: {
    label: string;
    href: string;
  };
  metaText?: string;
  highlights: { title: string; desc: string }[];
}

const BOT_SPECS: BotSpec[] = [
  {
    id: "ticket",
    name: "SyncInk Ticket Bot",
    tagline: "Enterprise support ticketing with native private thread isolation",
    availability: "Public · Invitable",
    runtime: "Node.js & Discord.js v14",
    logo: "/ticket-logo.png",
    logoAlt: "SyncInk Ticket Bot Logo",
    primaryAction: {
      label: "Invite Ticket Bot",
      href: "https://discord.com/oauth2/authorize?client_id=1513075101992747158&permissions=361046068240&integration_type=0&scope=bot+applications.commands",
      external: true,
    },
    secondaryAction: {
      label: "Ticket Dashboard",
      href: "/dashboard/tickets",
    },
    highlights: [
      {
        title: "Private Thread Infrastructure",
        desc: "Operates inside Discord's native private threads. Avoids filling up the server channel list, preserves member confidentiality, and never hits server channel quotas.",
      },
      {
        title: "Custom Categories & Emojis",
        desc: "Interactive buttons and drop-down menus with support for custom Discord emojis. Routes user tickets into dedicated departments (General, Bug Reports, Reports, etc.).",
      },
      {
        title: "Encrypted Web Transcripts",
        desc: "Automatic transcript generation upon closure. Archives message timestamps, attachments, and embedded messages in an encrypted HTML viewer for staff auditability.",
      },
    ],
  },
  {
    id: "voice",
    name: "SyncInk Voice Bot",
    tagline: "Dynamic temporary voice channels with in-room owner controls",
    availability: "Public · Invitable",
    runtime: "Node.js & Express",
    logo: "/voice-logo.png",
    logoAlt: "SyncInk Voice Bot Logo",
    primaryAction: {
      label: "Invite Voice Bot",
      href: "https://discord.com/oauth2/authorize?client_id=1516578887109181520&permissions=285220880&integration_type=0&scope=bot+applications.commands",
      external: true,
    },
    secondaryAction: {
      label: "Voice Dashboard",
      href: "/dashboard/voice",
    },
    highlights: [
      {
        title: "Join-to-Create Hubs",
        desc: "Members connect to a single generator channel. The bot instantly spawns a dedicated temporary voice channel and moves the user into it seamlessly.",
      },
      {
        title: "In-Room Owner Controls",
        desc: "Room creators manage permissions with slash commands and interactive panels: lock, hide (ghost mode), set user limits, permit friends, or kick unwanted members.",
      },
      {
        title: "1.5-Second Auto-Purge",
        desc: "When the last member disconnects, the channel is permanently deleted within 1.5 seconds. No lingering empty rooms or voice channel debris left behind.",
      },
    ],
  },
  {
    id: "radio",
    name: "SyncInk Radio",
    tagline: "24/7 lossless 48kHz music and radio streaming powered by Audia AI",
    availability: "Official Release · Live",
    runtime: "Opus 48kHz Stereo · Audia AI",
    logo: "/radio-logo.png",
    logoAlt: "SyncInk Radio Logo",
    useNextImage: true,
    primaryAction: {
      label: "Invite Radio Bot",
      href: "https://discord.com/oauth2/authorize?client_id=1500567606648897819&permissions=8&scope=bot%20applications.commands",
      external: true,
    },
    secondaryAction: {
      label: "Radio Dashboard",
      href: "/dashboard/radio",
    },
    tertiaryAction: {
      label: "Audia Spec",
      href: "/audia",
    },
    highlights: [
      {
        title: "48kHz Lossless Opus Audio",
        desc: "Direct Opus container extraction eliminates CPU resampling jitter. Streams at uncompromised 192kbps stereo with zero-buffer socket reconnections.",
      },
      {
        title: "Audia AI Autonomous AutoPlay",
        desc: "Continuously vectorizes listener preferences, tracks skips, and runs a six-stage recommendation cycle to queue matching upcoming tracks automatically.",
      },
      {
        title: "Strict Zero-Bleed Isolation",
        desc: "Enforces strict language isolation (e.g. Hindi, English, Punjabi) and acoustic mood barriers so tracks never bleed into dissonant or unwanted genres.",
      },
    ],
  },
  {
    id: "security",
    name: "SyncInk Support & Security Bot",
    tagline: "Automod defense and real-time quarantine for the official SyncInk Support Server",
    availability: "Internal Shield · Non-Invitable",
    runtime: "Python 3.10+ & PostgreSQL",
    logo: "/syncink-support-logo.png",
    logoAlt: "SyncInk Support & Security Bot Logo",
    primaryAction: {
      label: "Security Console",
      href: "/dashboard/security",
    },
    metaText: "Server ID: 1520457643842342912",
    highlights: [
      {
        title: "Velocity Raid Dampening",
        desc: "Detects abnormal member join spikes and message velocity surges. Engages instant emergency lockdowns in milliseconds to neutralize automated raid attacks.",
      },
      {
        title: "Automated Quarantine",
        desc: "Raid suspects and policy bypass accounts are automatically stripped of permissions and confined to an isolated quarantine channel awaiting staff review.",
      },
      {
        title: "Live Database Forensics",
        desc: "Persistent PostgreSQL migrations record every moderation action, strike tally, and whitelist change with real-time API sync to our web console.",
      },
    ],
  },
];

const ARCHITECTURE_LAYERS = [
  {
    id: "runtime",
    icon: Terminal,
    title: "Discord.js v14 & Python",
    tag: "Gateway & Worker Processes",
    summary:
      "Utilizing latest Discord gateway intents, slash command routing, and localized Cog architecture for predictable low-latency execution.",
    details: [
      "Isolated bot processes prevent voice spikes or radio decoding from delaying ticket interactions.",
      "Dedicated command sync and event queues per domain with clean graceful shutdown handling.",
      "Custom Components V2 layouts, ephemeral moderation responses, and structured audit logging.",
    ],
  },
  {
    id: "storage",
    icon: Database,
    title: "PostgreSQL & MongoDB",
    tag: "Relational + Document Storage",
    summary:
      "Persistent relational data for moderation audit logs and thread state, paired with document storage for dynamic voice configurations.",
    details: [
      "Strict schema migrations preserve moderation case histories, strike tallies, and recovery tickets.",
      "Encrypted HTML transcript payloads stored with strict staff/requester access boundaries.",
      "Low-latency read paths power live status telemetry on syncink.site.",
    ],
  },
  {
    id: "console",
    icon: Layers,
    title: "Next.js 14 App Router",
    tag: "Edge-Delivered Web Console",
    summary:
      "Server-rendered console hosted on Vercel with strict security headers and real-time API synchronization.",
    details: [
      "Unified multi-bot navigation across Ticket, Voice, Radio, Security, and Application portals.",
      "Responsive layouts engineered for desktop consoles and mobile administration on the go.",
      "Respects user motion preferences and keyboard-first workflows.",
    ],
  },
  {
    id: "security",
    icon: Shield,
    title: "Role-Based OAuth2 Security",
    tag: "Verified Access Control",
    summary:
      "Discord OAuth2 session authentication restricting server dashboards exclusively to verified administrators and guild owners.",
    details: [
      "Session validation verifies live guild roles, staff clearance, and owner signatures.",
      "Anti-duplicate application guards and verified account matching on onboarding endpoints.",
      "Zero secret exposure across client bundles or public telemetry routes.",
    ],
  },
];

const QUICK_JUMP_SECTIONS = [
  { id: "philosophy", label: "Philosophy" },
  { id: "bots", label: "Bot suite" },
  { id: "architecture", label: "Architecture" },
  { id: "resources", label: "Resources" },
];

export default function AboutPage() {
  const [selectedBot, setSelectedBot] = useState<BotFilter>("all");
  const [activeLayer, setActiveLayer] = useState<string>("runtime");

  const visibleBots =
    selectedBot === "all"
      ? BOT_SPECS
      : BOT_SPECS.filter((b) => b.id === selectedBot);

  const currentLayer =
    ARCHITECTURE_LAYERS.find((l) => l.id === activeLayer) || ARCHITECTURE_LAYERS[0];
  const ActiveLayerIcon = currentLayer.icon;

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen bg-[#060812] text-slate-100 flex flex-col font-sans selection:bg-brand-blue selection:text-white overflow-x-hidden">
        <PublicNavbar />

        <main className="flex-1 w-full">
          {/* Hero Section */}
          <section
            aria-labelledby="about-hero-title"
            className="pt-14 sm:pt-20 pb-12 sm:pb-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto border-b border-white/[0.06]"
          >
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={transition.enter}
              className="max-w-3xl space-y-5"
            >
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-[#0c0f18] border border-white/[0.08] font-mono text-[11px] text-slate-300">
                <Layers className="h-3.5 w-3.5 text-blue-400" />
                <span>About SyncInk · Platform architecture</span>
              </div>

              <h1
                id="about-hero-title"
                className="text-3xl sm:text-5xl font-semibold text-white tracking-tight leading-[1.12]"
              >
                Purpose-built automation for modern Discord communities
              </h1>

              <p className="text-sm sm:text-base text-slate-400 max-w-2xl leading-relaxed">
                SyncInk designs and operates specialized Discord bots, web consoles, and community infrastructure. Instead of cramming every feature into a fragile monolith, each system runs independently for reliability, privacy, and predictable scale.
              </p>

              {/* Spec Summary Strip */}
              <div className="pt-2 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3 rounded-lg bg-[#0c0f18] border border-white/[0.08]">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-white">
                    <Cpu className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">Micro-bots</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Isolated domains
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-[#0c0f18] border border-white/[0.08]">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-white">
                    <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">Thread-native</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Encrypted transcripts
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-[#0c0f18] border border-white/[0.08]">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-white">
                    <Zap className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate tabular-nums">1.5s purge</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Ephemeral voice rooms
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-[#0c0f18] border border-white/[0.08]">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-white">
                    <Server className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">PostgreSQL</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Next.js &amp; Node.js
                  </div>
                </div>
              </div>
            </motion.div>
          </section>

          {/* Mobile Sticky Jump Strip */}
          <div className="lg:hidden sticky top-16 z-30 bg-[#060812]/90 backdrop-blur-md border-b border-white/[0.06] px-4 py-2">
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar max-w-6xl mx-auto">
              <span className="font-mono text-[10px] uppercase tracking-wider text-slate-500 shrink-0 pr-1">
                Sections
              </span>
              {QUICK_JUMP_SECTIONS.map((sec) => (
                <a
                  key={sec.id}
                  href={`#${sec.id}`}
                  className="shrink-0 min-h-[30px] px-2.5 py-1 rounded-md bg-white/[0.04] border border-white/[0.08] text-xs font-medium text-slate-300 hover:text-white inline-flex items-center touch-manipulation"
                >
                  {sec.label}
                </a>
              ))}
            </div>
          </div>

          {/* Philosophy Section */}
          <section
            id="philosophy"
            aria-labelledby="philosophy-title"
            className="scroll-mt-32 lg:scroll-mt-24 py-14 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto border-b border-white/[0.06]"
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
              <div className="lg:col-span-5 space-y-4">
                <div className="font-mono text-xs text-slate-400">
                  Engineering philosophy
                </div>
                <h2
                  id="philosophy-title"
                  className="text-2xl sm:text-3xl font-semibold text-white tracking-tight leading-tight"
                >
                  Why specialization beats monolithic bots
                </h2>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Bundling tickets, voice channels, leveling, and moderation into one fragile bot creates channel clutter, gateway rate limits, and unpredictable lag during peak server traffic.
                </p>
                <p className="text-sm text-slate-400 leading-relaxed">
                  SyncInk separates each operational boundary into dedicated micro-bots with isolated queues, giving communities faster responses and zero server channel spam.
                </p>
              </div>

              <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-5 rounded-xl bg-[#0c0f18] border border-white/[0.08] space-y-2.5">
                  <div className="w-9 h-9 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-slate-300">
                    <Layers className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-semibold text-white">Zero channel clutter</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Instead of creating hundreds of separate text channels near Discord&apos;s 500-channel cap, tickets run inside native private threads.
                  </p>
                </div>

                <div className="p-5 rounded-xl bg-[#0c0f18] border border-white/[0.08] space-y-2.5">
                  <div className="w-9 h-9 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-slate-300">
                    <Zap className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-semibold text-white">Ephemeral resources</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Voice rooms spawn on demand and purge cleanly within 1.5 seconds once empty, leaving zero dead rooms behind.
                  </p>
                </div>

                <div className="p-5 rounded-xl bg-[#0c0f18] border border-white/[0.08] space-y-2.5">
                  <div className="w-9 h-9 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-slate-300">
                    <Lock className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-semibold text-white">Confidential transcripts</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Ticket archives save as encrypted HTML transcripts accessible only to authorized staff and the original ticket author.
                  </p>
                </div>

                <div className="p-5 rounded-xl bg-[#0c0f18] border border-white/[0.08] space-y-2.5">
                  <div className="w-9 h-9 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-slate-300">
                    <Activity className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-semibold text-white">Decoupled operations</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    A surge in temporary voice hubs never slows down ticket support or security defense triggers.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Interactive Product Suite */}
          <section
            id="bots"
            aria-labelledby="products-title"
            className="scroll-mt-32 lg:scroll-mt-24 py-14 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto border-b border-white/[0.06]"
          >
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
              <div className="space-y-2 max-w-xl">
                <div className="font-mono text-xs text-slate-400">
                  Product suite
                </div>
                <h2
                  id="products-title"
                  className="text-2xl sm:text-3xl font-semibold text-white tracking-tight"
                >
                  The SyncInk bot ecosystem
                </h2>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Filter by bot below to inspect specifications, invites, and web console endpoints.
                </p>
              </div>

              {/* Smooth Animated Filter Tabs */}
              <div className="flex items-center gap-1 p-1 rounded-xl bg-[#0c0f18] border border-white/[0.08] overflow-x-auto no-scrollbar shrink-0">
                {(
                  [
                    { id: "all", label: "All bots" },
                    { id: "ticket", label: "Ticket" },
                    { id: "voice", label: "Voice" },
                    { id: "radio", label: "Radio" },
                    { id: "security", label: "Security" },
                  ] as const
                ).map((tab) => {
                  const active = selectedBot === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setSelectedBot(tab.id)}
                      className={`relative px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors touch-manipulation ${
                        active ? "text-white" : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      {active && (
                        <motion.span
                          layoutId="aboutBotTab"
                          transition={spring.snappy}
                          className="absolute inset-0 rounded-lg bg-blue-600"
                        />
                      )}
                      <span className="relative z-10">{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <AnimatePresence mode="popLayout">
              <div className="space-y-5">
                {visibleBots.map((bot) => (
                  <motion.article
                    key={bot.id}
                    layout
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={transition.enter}
                    className="p-5 sm:p-7 rounded-xl bg-[#0c0f18] border border-white/[0.08] hover:border-white/[0.14] transition-colors"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 pb-5 border-b border-white/[0.06]">
                      <div className="flex items-start sm:items-center gap-4 min-w-0">
                        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-[#060812] border border-white/[0.1] flex items-center justify-center shrink-0 overflow-hidden p-1.5">
                          {bot.useNextImage ? (
                            <Image
                              src={bot.logo}
                              alt={bot.logoAlt}
                              width={52}
                              height={52}
                              className="object-contain rounded-lg select-none"
                            />
                          ) : (
                            <img
                              src={bot.logo}
                              alt={bot.logoAlt}
                              className="w-full h-full rounded-lg object-cover select-none"
                            />
                          )}
                        </div>

                        <div className="min-w-0 space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-white/[0.04] border border-white/[0.08] text-slate-300">
                              {bot.availability}
                            </span>
                            <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-white/[0.02] border border-white/[0.06] text-slate-400">
                              {bot.runtime}
                            </span>
                          </div>
                          <h3 className="text-lg sm:text-xl font-semibold text-white tracking-tight">
                            {bot.name}
                          </h3>
                          <p className="text-xs sm:text-sm text-slate-400 leading-snug">
                            {bot.tagline}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 shrink-0 w-full lg:w-auto">
                        {bot.metaText && (
                          <span className="px-3 py-2 rounded-lg bg-[#060812] border border-white/[0.06] text-[11px] font-mono text-slate-400 w-full sm:w-auto text-center">
                            {bot.metaText}
                          </span>
                        )}

                        {bot.primaryAction.external ? (
                          <a
                            href={bot.primaryAction.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 sm:flex-initial h-9 px-3.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-colors inline-flex items-center justify-center gap-1.5 active:scale-[0.98] touch-manipulation"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>{bot.primaryAction.label}</span>
                          </a>
                        ) : (
                          <Link
                            href={bot.primaryAction.href}
                            className="flex-1 sm:flex-initial h-9 px-3.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-colors inline-flex items-center justify-center gap-1.5 active:scale-[0.98] touch-manipulation"
                          >
                            <Shield className="w-3.5 h-3.5" />
                            <span>{bot.primaryAction.label}</span>
                          </Link>
                        )}

                        {bot.secondaryAction && (
                          <Link
                            href={bot.secondaryAction.href}
                            className="flex-1 sm:flex-initial h-9 px-3.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-slate-200 hover:text-white text-xs font-medium transition-colors inline-flex items-center justify-center gap-1.5 touch-manipulation"
                          >
                            {bot.id === "radio" ? (
                              <Radio className="w-3.5 h-3.5 text-slate-400" />
                            ) : (
                              <Layers className="w-3.5 h-3.5 text-slate-400" />
                            )}
                            <span>{bot.secondaryAction.label}</span>
                          </Link>
                        )}

                        {bot.tertiaryAction && (
                          <Link
                            href={bot.tertiaryAction.href}
                            className="h-9 px-3 rounded-lg bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.06] text-slate-300 hover:text-white text-xs font-medium transition-colors inline-flex items-center justify-center gap-1.5 touch-manipulation"
                          >
                            <span>{bot.tertiaryAction.label}</span>
                            <ArrowRight className="w-3 h-3 text-slate-400" />
                          </Link>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-5">
                      {bot.highlights.map((h) => (
                        <div key={h.title} className="space-y-1.5">
                          <h4 className="text-xs sm:text-sm font-medium text-white flex items-center gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{h.title}</span>
                          </h4>
                          <p className="text-xs text-slate-400 leading-relaxed pl-5">
                            {h.desc}
                          </p>
                        </div>
                      ))}
                    </div>
                  </motion.article>
                ))}
              </div>
            </AnimatePresence>
          </section>

          {/* Interactive Architecture Breakdown */}
          <section
            id="architecture"
            aria-labelledby="tech-title"
            className="scroll-mt-32 lg:scroll-mt-24 py-14 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto border-b border-white/[0.06]"
          >
            <div className="max-w-2xl mb-8 space-y-2">
              <div className="font-mono text-xs text-slate-400">
                Under the hood
              </div>
              <h2
                id="tech-title"
                className="text-2xl sm:text-3xl font-semibold text-white tracking-tight"
              >
                Architected for stability and low latency
              </h2>
              <p className="text-sm text-slate-400 leading-relaxed">
                Select any infrastructure layer to inspect how our Discord workers, databases, and web dashboard stay decoupled.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              {/* Layer Selector (Horizontal Rail on Mobile, Vertical Stack on Desktop) */}
              <div className="lg:col-span-5 flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible no-scrollbar pb-1 lg:pb-0">
                {ARCHITECTURE_LAYERS.map((layer) => {
                  const Icon = layer.icon;
                  const active = activeLayer === layer.id;
                  return (
                    <button
                      key={layer.id}
                      type="button"
                      onClick={() => setActiveLayer(layer.id)}
                      className={`shrink-0 lg:w-full text-left p-3.5 sm:p-4 rounded-xl border transition-colors flex items-center gap-3 touch-manipulation ${
                        active
                          ? "bg-[#0c0f18] border-white/[0.18] text-white"
                          : "bg-white/[0.02] border-white/[0.06] text-slate-400 hover:text-slate-200 hover:border-white/[0.1]"
                      }`}
                    >
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border ${
                          active
                            ? "bg-blue-600/15 border-blue-500/30 text-blue-400"
                            : "bg-white/[0.03] border-white/[0.06] text-slate-400"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs sm:text-sm font-medium text-white whitespace-nowrap lg:whitespace-normal">
                          {layer.title}
                        </div>
                        <div className="text-[11px] font-mono text-slate-500 hidden sm:block">
                          {layer.tag}
                        </div>
                      </div>
                      <ChevronRight
                        className={`w-4 h-4 ml-auto hidden lg:block transition-transform ${
                          active ? "text-slate-200 translate-x-0.5" : "text-slate-600"
                        }`}
                      />
                    </button>
                  );
                })}
              </div>

              {/* Detail Panel */}
              <div className="lg:col-span-7">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentLayer.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={transition.enter}
                    className="p-6 sm:p-8 rounded-xl bg-[#0c0f18] border border-white/[0.08] space-y-5"
                  >
                    <div className="flex items-start justify-between gap-3 pb-4 border-b border-white/[0.06]">
                      <div>
                        <div className="font-mono text-[11px] text-blue-400 mb-1">
                          {currentLayer.tag}
                        </div>
                        <h3 className="text-lg sm:text-xl font-semibold text-white">
                          {currentLayer.title}
                        </h3>
                      </div>
                      <ActiveLayerIcon className="w-5 h-5 text-slate-400 shrink-0 mt-1" />
                    </div>

                    <p className="text-sm text-slate-300 leading-relaxed">
                      {currentLayer.summary}
                    </p>

                    <ul className="space-y-2.5 pt-1">
                      {currentLayer.details.map((line) => (
                        <li
                          key={line}
                          className="flex items-start gap-2.5 text-xs sm:text-[13px] text-slate-400 leading-relaxed"
                        >
                          <CheckCircle2 className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                          <span>{line}</span>
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </section>

          {/* Governance & Public Directory */}
          <section
            id="resources"
            aria-labelledby="governance-title"
            className="scroll-mt-32 lg:scroll-mt-24 py-14 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto border-b border-white/[0.06]"
          >
            <div className="max-w-2xl mb-8 space-y-2">
              <div className="font-mono text-xs text-slate-400">
                Governance &amp; resources
              </div>
              <h2
                id="governance-title"
                className="text-2xl sm:text-3xl font-semibold text-white tracking-tight"
              >
                Public standards and transparency
              </h2>
              <p className="text-sm text-slate-400 leading-relaxed">
                Structured documentation, server policies, and direct pathways for team applications.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                {
                  href: "/rules",
                  icon: BookOpen,
                  title: "Community Rules",
                  desc: "Behavior policies, bot usage guidelines, and moderation standards across SyncInk servers.",
                },
                {
                  href: "/faq",
                  icon: HelpCircle,
                  title: "Frequently Asked Questions",
                  desc: "Guides covering permissions, /setup configuration, voice hubs, and troubleshooting.",
                },
                {
                  href: "/privacy",
                  icon: Lock,
                  title: "Privacy Policies",
                  desc: "Documentation of data retention, transcript encryption, and minimal data protocols.",
                },
                {
                  href: "/terms",
                  icon: FileCheck,
                  title: "Terms of Service",
                  desc: "Conditions governing bot invitations, web dashboard usage, and API interactions.",
                },
                {
                  href: "/apply",
                  icon: Sparkles,
                  title: "Join the Team",
                  desc: "Application portal for community moderators, support staff, and software developers.",
                },
              ].map((card) => (
                <Link
                  key={card.href}
                  href={card.href}
                  className="group p-5 rounded-xl bg-[#0c0f18] border border-white/[0.08] hover:border-white/[0.16] transition-colors space-y-2.5 touch-manipulation"
                >
                  <div className="flex items-center justify-between">
                    <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-slate-300">
                      <card.icon className="w-4 h-4" />
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
                  </div>
                  <h3 className="text-sm font-semibold text-white">
                    {card.title}
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {card.desc}
                  </p>
                </Link>
              ))}

              <a
                href="https://github.com/SyncInk"
                target="_blank"
                rel="noopener noreferrer"
                className="group p-5 rounded-xl bg-[#0c0f18] border border-white/[0.08] hover:border-white/[0.16] transition-colors space-y-2.5 touch-manipulation"
              >
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-slate-300">
                    <Terminal className="w-4 h-4" />
                  </div>
                  <ExternalLink className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-sm font-semibold text-white">
                  GitHub Organization
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Official open repositories, issue tracking, and updates from the SyncInk development team.
                </p>
              </a>
            </div>
          </section>

          {/* Call To Action */}
          <section
            aria-labelledby="community-cta-title"
            className="py-14 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto"
          >
            <div className="p-6 sm:p-10 rounded-xl bg-[#0c0f18] border border-white/[0.08] flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2 max-w-xl">
                <div className="inline-flex items-center gap-2 text-xs font-mono text-slate-400">
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  <span>SyncInk Community</span>
                </div>
                <h2
                  id="community-cta-title"
                  className="text-xl sm:text-2xl font-semibold text-white tracking-tight"
                >
                  Ready to deploy in your server?
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  Connect with our developer community or open the Multi-Bot Console to configure your bots right away.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
                <a
                  href="https://discord.gg/PmxfJwmQuB"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-10 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-medium transition-colors inline-flex items-center justify-center gap-2 active:scale-[0.98] touch-manipulation"
                >
                  <span>Join Support Discord</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>

                <Link
                  href="/dashboard"
                  className="h-10 px-4 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-slate-200 hover:text-white text-xs sm:text-sm font-medium transition-colors inline-flex items-center justify-center gap-2 touch-manipulation"
                >
                  <Layers className="w-3.5 h-3.5 text-slate-400" />
                  <span>Multi-Bot Console</span>
                </Link>
              </div>
            </div>
          </section>
        </main>

        <PublicFooter />
      </div>
    </MotionConfig>
  );
}
