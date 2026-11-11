"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Sparkles,
  Radio,
  Layers,
  Shield,
  CheckCircle2,
  Lock,
  Share2,
  Copy,
  Check,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  Cpu,
  Sliders,
  Heart,
  Headphones,
  FileText,
  Volume2,
  Activity,
  Calendar,
  Tag,
  Clock,
  Compass,
} from "lucide-react";
import { PublicNavbar } from "@/components/PublicNavbar";
import { PublicFooter } from "@/components/PublicFooter";

export default function AudiaSpecPage() {
  const [copiedLink, setCopiedLink] = useState(false);

  const handleCopy = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const capabilities = [
    {
      id: "01",
      name: "Personalized Music Recommendations",
      desc: "Generates tailored track suggestions aligned with each user’s demonstrated musical tastes rather than relying on generic global popularity charts.",
    },
    {
      id: "02",
      name: "Individual Preference Profiles",
      desc: "Builds and maintains structured preference profiles that map affinity weights across acoustic styles, artists, tempos, and vocal textures.",
    },
    {
      id: "03",
      name: "Listening History Analysis",
      desc: "Reviews historical playback sessions, track completion ratios, and repeat requests to distinguish core musical preferences from one-off plays.",
    },
    {
      id: "04",
      name: "Genre-Based Recommendations",
      desc: "Classifies music across macro-genres and granular sub-genres (such as Synthwave, Lo-Fi Hip-Hop, Indie Rock, and Neo-Soul) to maintain stylistic cohesion.",
    },
    {
      id: "05",
      name: "Language-Based Recommendations",
      desc: "Recognizes vocal language metadata and script identifiers, enabling recommendations tailored to specific regional catalogs or multilingual listening sessions.",
    },
    {
      id: "06",
      name: "Mood-Based Music Discovery",
      desc: "Evaluates sonic energy, valence, and atmospheric tone so communities can discover tracks suited for study focus, late-night relaxation, or active gaming.",
    },
    {
      id: "07",
      name: "AI-Powered Autoplay",
      desc: "Automatically selects and queues contextually matched tracks when a manual playlist ends, preventing sudden voice-channel silence.",
    },
    {
      id: "08",
      name: "Continuous Habit Learning",
      desc: "Adapts dynamically to evolving listening behaviors, observing session pacing and skip patterns to refine future track selections over time.",
    },
    {
      id: "09",
      name: "Like & Dislike Feedback Loops",
      desc: "Processes explicit positive and negative user feedback to reinforce favored sonic traits while immediately suppressing disliked tracks and styles.",
    },
    {
      id: "10",
      name: "Cycle-Free Track Selection",
      desc: "Applies intelligent deduplication and cooldown windows to prevent the assistant from repeatedly looping the same songs or overplaying identical artists.",
    },
  ];

  const pipelineStages = [
    {
      phase: "Phase 01",
      title: "Activity Observation",
      desc: "Observes user listening activity, command requests, play durations, and skip interactions within SyncInk Radio where permitted by user and server settings.",
    },
    {
      phase: "Phase 02",
      title: "Profile Construction",
      desc: "Aggregates observed interactions into individual music preference profiles that capture long-term affinities without exposing raw logs to external parties.",
    },
    {
      phase: "Phase 03",
      title: "Attribute Analysis",
      desc: "Analyzes track genres, vocal languages, mood indicators, and temporal listening patterns to establish the acoustic context of the active session.",
    },
    {
      phase: "Phase 04",
      title: "Feedback Integration",
      desc: "Incorporates explicit like and dislike feedback alongside implicit completion signals to re-weight candidate scoring matrices immediately.",
    },
    {
      phase: "Phase 05",
      title: "Autoplay Selection",
      desc: "Filters candidate tracks through the anti-repetition deduplication engine and dispatches the highest-scoring track to the SyncInk Radio audio pipeline.",
    },
    {
      phase: "Phase 06",
      title: "Continuous Adaptation",
      desc: "Recalibrates preference weights as listener tastes evolve across sessions, ensuring recommendations remain fresh and responsive over time.",
    },
  ];

  const signals = [
    {
      dimension: "Genre & Style Affinity",
      params: "Primary genre classification, sub-genre adjacency, and instrumentation tags.",
      outcome: "Prevents abrupt stylistic clashes between consecutive tracks during autoplay.",
    },
    {
      dimension: "Linguistic Continuity",
      params: "Vocal language metadata, regional catalog identifiers, and user language preferences.",
      outcome: "Maintains language consistency or executes smooth multilingual rotations as preferred.",
    },
    {
      dimension: "Mood & Energy Curve",
      params: "Acoustic valence, rhythmic tempo density, and chill vs. high-energy markers.",
      outcome: "Aligns music playback with the prevailing atmosphere of the Discord voice channel.",
    },
    {
      dimension: "Repetition Suppression",
      params: "Recent play timestamps, artist frequency caps, and disliked track exclusions.",
      outcome: "Eliminates repetitive track loops and ensures catalog variety across extended sessions.",
    },
  ];

  const roadmapItems = [
    {
      module: "Personalized Recommendations",
      status: "Active (Production)",
      scope: "Operational within SyncInk Radio; suggests tracks matched to individual preference profiles.",
      active: true,
    },
    {
      module: "Individual Preference Profiles",
      status: "Active (Production)",
      scope: "Operational; maintains per-user affinity weights based on permitted listening activity.",
      active: true,
    },
    {
      module: "Genre, Language & Mood Analysis",
      status: "Active (Production)",
      scope: "Operational; classifies track metadata across genre, language, and mood dimensions.",
      active: true,
    },
    {
      module: "AI-Powered Autoplay & Anti-Looping",
      status: "Active (Production)",
      scope: "Operational; automates queue continuation while suppressing repeated tracks and artists.",
      active: true,
    },
    {
      module: "Like / Dislike Feedback Learning",
      status: "Active (Production)",
      scope: "Operational; updates recommendation weights in response to explicit user feedback.",
      active: true,
    },
    {
      module: "Harmonic Roster Modeling",
      status: "Planned (H1 2027)",
      scope: "In development; multi-user consensus engine blending preferences across all active channel members.",
      active: false,
    },
    {
      module: "Harmonic Key & BPM Matching",
      status: "Planned (H2 2027)",
      scope: "In development; tempo-synced transitions and harmonic key matching between autoplay songs.",
      active: false,
    },
    {
      module: "Audia Engine Developer API",
      status: "Planned (H2 2027)",
      scope: "In development; controlled external endpoints for partner community integrations.",
      active: false,
    },
  ];

  return (
    <div className="min-h-screen bg-[#060812] text-slate-100 flex flex-col font-sans selection:bg-purple-600 selection:text-white">
      <PublicNavbar />

      <main className="flex-1 py-12 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full">
        {/* Breadcrumb & Navigation Actions */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Link href="/" className="hover:text-white transition-colors">
              Home
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
            <Link href="/#bots" className="hover:text-white transition-colors">
              SyncInk Radio
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
            <span className="text-purple-400 font-semibold">Audia AI Specification</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="h-8 px-3 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 font-medium text-xs transition-colors border border-white/[0.08] flex items-center gap-1.5"
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied Link</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>Share Document</span>
                </>
              )}
            </button>
            <Link
              href="/updates"
              className="h-8 px-3 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 font-medium text-xs transition-colors border border-purple-500/20 flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>Release Notes</span>
            </Link>
          </div>
        </div>

        {/* ========================================================= */}
        {/* DOCUMENT HEADER / MASTHEAD                                */}
        {/* ========================================================= */}
        <div className="rounded-3xl bg-[#0b0e1d] border border-purple-500/20 p-6 sm:p-10 mb-12 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

          {/* Top Bar: Official Classification & Parent Provider */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-white/[0.08]">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase bg-purple-500/15 text-purple-300 border border-purple-500/30">
                Official Product Release &amp; Technical Specification
              </span>
              <span className="text-xs text-slate-400 font-medium hidden md:inline">
                Document Ref: SYNC-AUDIA-SPEC-V1
              </span>
            </div>

            <div className="flex items-center gap-2.5 bg-black/40 px-3.5 py-1.5 rounded-xl border border-white/10">
              <span className="text-[11px] text-slate-400">Parent Technology Provider</span>
              <div className="w-5 h-5 rounded-md bg-white/10 flex items-center justify-center p-0.5">
                <Image
                  src="/syncink-main-logo.png"
                  alt="SyncInk Logo"
                  width={16}
                  height={16}
                  className="object-contain"
                />
              </div>
              <span className="text-xs font-black text-white">SyncInk</span>
            </div>
          </div>

          {/* Brand Presentation Row */}
          <div className="pt-8 pb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-purple-500/10 border border-purple-500/30 p-2.5 flex items-center justify-center shrink-0 shadow-lg shadow-purple-950/40">
                  <Image
                    src="/audia-ai-logo.png"
                    alt="Audia AI Official Logo"
                    width={80}
                    height={80}
                    className="object-contain"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                      Introducing <span className="text-white">Audia</span>{" "}
                      <span className="bg-gradient-to-r from-purple-400 via-fuchsia-400 to-indigo-400 bg-clip-text text-transparent">
                        AI
                      </span>
                    </h1>
                  </div>
                  <p className="text-sm sm:text-base text-slate-300 font-medium mt-1">
                    The Next Generation of Intelligent Music Experiences — by SyncInk
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-end gap-1.5 self-stretch md:self-auto pt-4 md:pt-0 border-t md:border-t-0 border-white/[0.06]">
              <span className="text-[11px] text-slate-400 uppercase tracking-widest font-semibold">
                Deployment Level
              </span>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-purple-500/20 border border-purple-500/30">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-bold text-white">Version 1.0 (Production)</span>
              </div>
            </div>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-6 border-t border-white/[0.08] text-xs">
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
              <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Prepared By</div>
              <div className="text-white font-bold mt-1">SyncInk Engineering &amp; Product</div>
            </div>
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
              <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Host Platform</div>
              <div className="text-purple-300 font-bold mt-1">SyncInk Radio (Discord)</div>
            </div>
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
              <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Legacy Designation</div>
              <div className="text-slate-400 font-bold mt-1 line-through">AI DJ (Retired)</div>
            </div>
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
              <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Release Version</div>
              <div className="text-emerald-400 font-bold mt-1">Version 1.0 Production</div>
            </div>
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] col-span-2 sm:col-span-1">
              <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Publication Date</div>
              <div className="text-white font-bold mt-1">November 2026</div>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* SPECIFICATION INDEX                                       */}
        {/* ========================================================= */}
        <nav aria-label="Specification Index" className="p-6 rounded-2xl bg-surface border border-white/[0.06] mb-12">
          <div className="flex items-center gap-2 mb-4">
            <Compass className="w-4 h-4 text-purple-400" />
            <h2 className="text-xs font-bold text-white uppercase tracking-wider">
              Master Document Structure &amp; Specification Index
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-xs">
            {[
              { id: "sec-01", num: "01", title: "Executive Introduction & Rebranding Rationale" },
              { id: "sec-02", num: "02", title: "System Definition: What is Audia AI?" },
              { id: "sec-03", num: "03", title: "Ten Core Architectural Capabilities" },
              { id: "sec-04", num: "04", title: "Operational Workflow & Six-Stage Pipeline" },
              { id: "sec-05", num: "05", title: "Acoustic & Contextual Signal Processing" },
              { id: "sec-06", num: "06", title: "Production Capability vs. Roadmap Verification" },
              { id: "sec-07", num: "07", title: "The Community Listening Experience" },
              { id: "sec-08", num: "08", title: "Ecosystem & Brand Hierarchy (SyncInk → Audia AI)" },
              { id: "sec-09", num: "09", title: "Rebranding Transition & Command Migration" },
              { id: "sec-10", num: "10", title: "Privacy Framework & Responsible AI Governance" },
              { id: "sec-11", num: "11", title: "Strategic Future Vision & Engineering Roadmap" },
              { id: "sec-12", num: "12", title: "Conclusion & Official Publication Colophon" },
            ].map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/[0.04] text-slate-300 hover:text-purple-300 transition-colors"
              >
                <span className="font-mono text-purple-400/80 font-bold">{item.num}.</span>
                <span className="truncate">{item.title}</span>
              </a>
            ))}
          </div>
        </nav>

        {/* ========================================================= */}
        {/* SECTION 01: EXECUTIVE INTRODUCTION                       */}
        {/* ========================================================= */}
        <section id="sec-01" className="mb-14 scroll-mt-24">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] mb-4">
            <h2 className="text-lg sm:text-xl font-black text-white">
              1. Executive Introduction &amp; Rebranding Rationale
            </h2>
            <span className="text-[11px] font-mono text-purple-400 font-bold uppercase tracking-wider">
              Section 01
            </span>
          </div>
          <div className="text-sm text-slate-300 leading-relaxed space-y-4 bg-surface p-6 rounded-2xl border border-white/[0.06]">
            <p>
              SyncInk Radio’s intelligent music assistant, previously deployed under the early working name{" "}
              <strong className="text-white">AI DJ</strong>, is officially rebranded to{" "}
              <strong className="text-purple-300">Audia AI by SyncInk</strong>. Within Discord communities, shared audio
              listening has evolved from static background playback into an interactive social anchor. While the legacy AI
              DJ designation served initial automated queueing trials, the underlying recommendation engine has matured
              into a dedicated personalization and acoustic discovery architecture that outgrows a generic functional
              title.
            </p>
            <p>
              This transition represents a comprehensive advancement in how SyncInk Radio understands listener intent,
              models multi-dimensional musical taste, and sustains long-form community voice sessions. Developed and
              powered internally by SyncInk, Audia AI operates natively inside SyncInk Radio to eliminate manual queue
              fatigue, prevent repetitive track loops, and deliver contextually coherent music experiences across diverse
              Discord communities.
            </p>
          </div>
        </section>

        {/* ========================================================= */}
        {/* SECTION 02: SYSTEM DEFINITION                             */}
        {/* ========================================================= */}
        <section id="sec-02" className="mb-14 scroll-mt-24">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] mb-4">
            <h2 className="text-lg sm:text-xl font-black text-white">
              2. System Definition: What is Audia AI?
            </h2>
            <span className="text-[11px] font-mono text-purple-400 font-bold uppercase tracking-wider">
              Section 02
            </span>
          </div>
          <div className="text-sm text-slate-300 leading-relaxed space-y-4 bg-surface p-6 rounded-2xl border border-white/[0.06]">
            <p>
              <strong className="text-white">Audia AI</strong> is an intelligent music assistant engineered by SyncInk to
              understand individual and community listening preferences and provide tailored music recommendations inside
              SyncInk Radio. Rather than functioning as a separate Discord bot or requiring external configuration, Audia
              AI serves as the embedded intelligence layer powering SyncInk Radio’s recommendation, discovery, and
              autonomous playback pipelines.
            </p>
            <p>
              Traditional Discord music bots rely on manual track lookups or uncurated shuffle lists that frequently
              disrupt the sonic atmosphere of a voice channel. Audia AI resolves this by evaluating fine-grained musical
              attributes—spanning genre sub-classifications, vocal languages, emotional valence, and historical listening
              patterns. By synthesizing explicit listener feedback with permitted playback telemetry, Audia AI curates a
              seamless progression of tracks that feels intentionally selected for the active listeners in the room.
            </p>

            {/* Architectural Comparison Table */}
            <div className="pt-4 overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-slate-400">
                    <th className="py-2.5 px-3 font-semibold uppercase tracking-wider">Architectural Dimension</th>
                    <th className="py-2.5 px-3 font-semibold uppercase tracking-wider">Legacy Identity: AI DJ</th>
                    <th className="py-2.5 px-3 font-semibold uppercase tracking-wider text-purple-300">
                      Current Identity: Audia AI by SyncInk
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  <tr>
                    <td className="py-2.5 px-3 font-semibold text-white">Core Identity Role</td>
                    <td className="py-2.5 px-3 text-slate-400">Basic reactive track automation utility</td>
                    <td className="py-2.5 px-3 text-purple-200 font-medium">Comprehensive intelligent music assistant &amp; concierge</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-semibold text-white">Recommendation Basis</td>
                    <td className="py-2.5 px-3 text-slate-400">Broad genre tags and static similarity lookups</td>
                    <td className="py-2.5 px-3 text-purple-200 font-medium">Parametric user preference profiles, history, mood, and language</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-semibold text-white">Queue Continuation</td>
                    <td className="py-2.5 px-3 text-slate-400">Simple fallback autoplay prone to track repetition</td>
                    <td className="py-2.5 px-3 text-purple-200 font-medium">AI-powered autoplay with strict anti-repetition cooldown filters</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-semibold text-white">Feedback Processing</td>
                    <td className="py-2.5 px-3 text-slate-400">Session-only manual skips</td>
                    <td className="py-2.5 px-3 text-purple-200 font-medium">Persistent learning from listening habits plus explicit like/dislike loops</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Three System Pillars */}
            <div className="pt-6 border-t border-white/[0.06]">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3">
                Core System Pillars Within SyncInk Radio
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04] space-y-1.5">
                  <span className="text-xs font-bold text-purple-300">Preference Modeling Engine</span>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Constructs structured mathematical taste profiles for participating listeners based on observed track
                    completions, repeat requests, and explicit rating actions.
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04] space-y-1.5">
                  <span className="text-xs font-bold text-purple-300">Multi-Attribute Classifier</span>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Evaluates candidate songs across genre lineage, vocal language metadata, tempo stability, and mood
                    descriptors to ensure smooth sonic transitions.
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04] space-y-1.5">
                  <span className="text-xs font-bold text-purple-300">Autonomous Queue Supervisor</span>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Monitors active SyncInk Radio playback queues and seamlessly injects contextually matched autoplay
                    tracks the moment user-submitted queues conclude.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* SECTION 03: TEN CORE CAPABILITIES                         */}
        {/* ========================================================= */}
        <section id="sec-03" className="mb-14 scroll-mt-24">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] mb-4">
            <h2 className="text-lg sm:text-xl font-black text-white">
              3. Ten Core Architectural Capabilities
            </h2>
            <span className="text-[11px] font-mono text-purple-400 font-bold uppercase tracking-wider">
              Section 03
            </span>
          </div>
          <div className="space-y-3">
            <p className="text-xs text-slate-400 mb-4">
              Audia AI delivers ten foundational capabilities engineered to elevate music discovery and automated
              playback within SyncInk Radio:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {capabilities.map((cap) => (
                <div
                  key={cap.id}
                  className="p-4 rounded-2xl bg-surface border border-white/[0.06] hover:border-purple-500/25 transition-colors space-y-1.5"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-purple-400 px-2 py-0.5 rounded bg-purple-500/10 border border-purple-500/20">
                      ID {cap.id}
                    </span>
                    <h3 className="font-bold text-sm text-white">{cap.name}</h3>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed pl-1">{cap.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* SECTION 04: SIX-STAGE PIPELINE                            */}
        {/* ========================================================= */}
        <section id="sec-04" className="mb-14 scroll-mt-24">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] mb-4">
            <h2 className="text-lg sm:text-xl font-black text-white">
              4. Operational Workflow &amp; Six-Stage Pipeline
            </h2>
            <span className="text-[11px] font-mono text-purple-400 font-bold uppercase tracking-wider">
              Section 04
            </span>
          </div>
          <div className="bg-surface p-6 rounded-2xl border border-white/[0.06] space-y-4">
            <p className="text-sm text-slate-300 leading-relaxed">
              Audia AI executes a continuous, six-stage recommendation lifecycle inside SyncInk Radio. Each stage processes
              permitted playback signals to refine curation quality in real time:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
              {pipelineStages.map((stage) => (
                <div
                  key={stage.phase}
                  className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04] space-y-2"
                >
                  <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded bg-purple-500/15 text-purple-300 border border-purple-500/20 font-bold">
                    {stage.phase}
                  </span>
                  <h3 className="text-xs font-bold text-white">{stage.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{stage.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* SECTION 05: ACOUSTIC & CONTEXTUAL SIGNAL PROCESSING       */}
        {/* ========================================================= */}
        <section id="sec-05" className="mb-14 scroll-mt-24">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] mb-4">
            <h2 className="text-lg sm:text-xl font-black text-white">
              5. Acoustic &amp; Contextual Signal Processing
            </h2>
            <span className="text-[11px] font-mono text-purple-400 font-bold uppercase tracking-wider">
              Section 05
            </span>
          </div>
          <div className="bg-surface p-6 rounded-2xl border border-white/[0.06] space-y-4">
            <p className="text-sm text-slate-300 leading-relaxed">
              To avoid the jarring transitions common in basic shuffle utilities, Audia AI evaluates multiple signal
              layers before committing a track to the SyncInk Radio playback stream. By balancing familiarity with controlled
              exploration, the assistant introduces new music while respecting established session boundaries:
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-slate-400">
                    <th className="py-2.5 px-3 font-semibold uppercase tracking-wider">Signal Dimension</th>
                    <th className="py-2.5 px-3 font-semibold uppercase tracking-wider">Evaluated Parameters</th>
                    <th className="py-2.5 px-3 font-semibold uppercase tracking-wider text-purple-300">Curation Outcome</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {signals.map((s) => (
                    <tr key={s.dimension}>
                      <td className="py-2.5 px-3 font-semibold text-white whitespace-nowrap">{s.dimension}</td>
                      <td className="py-2.5 px-3 text-slate-400">{s.params}</td>
                      <td className="py-2.5 px-3 text-purple-200 font-medium">{s.outcome}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* SECTION 06: OPERATIONAL STATUS & ROADMAP                  */}
        {/* ========================================================= */}
        <section id="sec-06" className="mb-14 scroll-mt-24">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] mb-4">
            <h2 className="text-lg sm:text-xl font-black text-white">
              6. Operational Status &amp; Engineering Roadmap
            </h2>
            <span className="text-[11px] font-mono text-purple-400 font-bold uppercase tracking-wider">
              Section 06
            </span>
          </div>
          <div className="bg-surface p-6 rounded-2xl border border-white/[0.06] space-y-4">
            <p className="text-sm text-slate-300 leading-relaxed">
              In accordance with SyncInk’s commitment to technical transparency, the matrix below clearly distinguishes
              currently active production capabilities from planned features scheduled for future engineering milestones.
              Unimplemented features are never represented as active production systems.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-slate-400">
                    <th className="py-2.5 px-3 font-semibold uppercase tracking-wider">Capability / Module</th>
                    <th className="py-2.5 px-3 font-semibold uppercase tracking-wider">Deployment Status</th>
                    <th className="py-2.5 px-3 font-semibold uppercase tracking-wider">Verification &amp; Scope</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {roadmapItems.map((item) => (
                    <tr key={item.module}>
                      <td className="py-2.5 px-3 font-semibold text-white">{item.module}</td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            item.active
                              ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                              : "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-300">{item.scope}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* SECTION 07: COMMUNITY LISTENING EXPERIENCE                */}
        {/* ========================================================= */}
        <section id="sec-07" className="mb-14 scroll-mt-24">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] mb-4">
            <h2 className="text-lg sm:text-xl font-black text-white">
              7. The Audia AI Experience in Discord Communities
            </h2>
            <span className="text-[11px] font-mono text-purple-400 font-bold uppercase tracking-wider">
              Section 07
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              {
                title: "Elimination of Manual Queue Fatigue",
                desc: "In traditional Discord voice sessions, playback frequently halts as soon as the initial queue runs out, forcing someone to stop their activity and manually search for songs. Audia AI sustains continuous playback automatically.",
              },
              {
                title: "Natural, Context-Aware Discovery",
                desc: "Instead of interrupting a session with unrelated tracks, Audia AI introduces new artists and songs that share genre, language, or mood characteristics with tracks the community already enjoys.",
              },
              {
                title: "Hands-Free Community Curation",
                desc: "Server administrators and event hosts can rely on Audia AI to maintain background music for study lounges, gaming lobbies, and community hangouts without constant moderation or playlist rebuilding.",
              },
              {
                title: "Balanced Variety Without Repetition",
                desc: "By enforcing track and artist cooldown intervals, long listening sessions remain engaging without cycling through the same handful of songs.",
              },
            ].map((exp, idx) => (
              <div key={idx} className="p-5 rounded-2xl bg-surface border border-white/[0.06] space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-purple-400" />
                  <h3 className="font-bold text-sm text-white">{exp.title}</h3>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed pl-6">{exp.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ========================================================= */}
        {/* SECTION 08: BRAND HIERARCHY                               */}
        {/* ========================================================= */}
        <section id="sec-08" className="mb-14 scroll-mt-24">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] mb-4">
            <h2 className="text-lg sm:text-xl font-black text-white">
              8. The Relationship Between Audia AI and SyncInk
            </h2>
            <span className="text-[11px] font-mono text-purple-400 font-bold uppercase tracking-wider">
              Section 08
            </span>
          </div>
          <div className="bg-surface p-6 rounded-2xl border border-white/[0.06] space-y-4">
            <p className="text-sm text-slate-300 leading-relaxed">
              To ensure clear brand communication across all user interfaces, partner materials, and community
              announcements, SyncInk establishes a direct three-tier brand hierarchy:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
              <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Tier 1 — Parent Brand &amp; Developer
                </span>
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-black border border-white/10 flex items-center justify-center p-1.5">
                    <Image
                      src="/syncink-main-logo.png"
                      alt="SyncInk Logo"
                      width={24}
                      height={24}
                      className="object-contain"
                    />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white">SyncInk</h3>
                    <span className="text-[11px] text-slate-400">Technology Provider</span>
                  </div>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Responsible for engineering core platform infrastructure, hosting servers, AI models, and governance
                  standards.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Tier 2 — Flagship Bot Product
                </span>
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                    <Radio className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white">SyncInk Radio</h3>
                    <span className="text-[11px] text-purple-300">Discord Audio Platform</span>
                  </div>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  The Discord music and radio bot installed by community administrators to deliver high-reliability
                  voice-channel audio streaming and queue management.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-purple-950/20 border border-purple-500/30 space-y-3">
                <span className="text-[10px] font-bold text-purple-300 uppercase tracking-widest">
                  Tier 3 — Embedded Intelligence
                </span>
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-500/40 p-1 flex items-center justify-center">
                    <Image
                      src="/audia-ai-logo.png"
                      alt="Audia AI Logo"
                      width={28}
                      height={28}
                      className="object-contain"
                    />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white">Audia AI by SyncInk</h3>
                    <span className="text-[11px] text-purple-300">Embedded Assistant</span>
                  </div>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  The intelligent AI music assistant integrated natively within SyncInk Radio, powering personalized
                  recommendations, mood discovery, and autoplay.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* SECTION 09: REBRANDING & TRANSITION                       */}
        {/* ========================================================= */}
        <section id="sec-09" className="mb-14 scroll-mt-24">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] mb-4">
            <h2 className="text-lg sm:text-xl font-black text-white">
              9. Rebranding &amp; Transition Overview
            </h2>
            <span className="text-[11px] font-mono text-purple-400 font-bold uppercase tracking-wider">
              Section 09
            </span>
          </div>
          <div className="bg-surface p-6 rounded-2xl border border-white/[0.06] space-y-4">
            <p className="text-sm text-slate-300 leading-relaxed">
              The transition from AI DJ to Audia AI by SyncInk is a seamless product identity update within SyncInk Radio.
              Server administrators and listeners require zero manual reinstallation:
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-slate-400">
                    <th className="py-2.5 px-3 font-semibold uppercase tracking-wider">Transition Dimension</th>
                    <th className="py-2.5 px-3 font-semibold uppercase tracking-wider">Previous State (AI DJ)</th>
                    <th className="py-2.5 px-3 font-semibold uppercase tracking-wider text-purple-300">
                      Updated State (Audia AI by SyncInk)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  <tr>
                    <td className="py-2.5 px-3 font-semibold text-white">Official Assistant Name</td>
                    <td className="py-2.5 px-3 text-slate-400">AI DJ</td>
                    <td className="py-2.5 px-3 text-purple-200 font-medium">Audia AI by SyncInk (or Audia AI)</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-semibold text-white">Bot Installation Status</td>
                    <td className="py-2.5 px-3 text-slate-400">Integrated inside SyncInk Radio</td>
                    <td className="py-2.5 px-3 text-purple-200 font-medium">Same SyncInk Radio bot (Not a separate bot; no re-invite needed)</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-semibold text-white">Command Namespace</td>
                    <td className="py-2.5 px-3 text-slate-400">Legacy /dj command triggers</td>
                    <td className="py-2.5 px-3 text-purple-200 font-medium">
                      Primary <code className="text-purple-300 font-bold">/audia</code> commands with full{" "}
                      <code className="text-slate-300 font-mono">/dj</code> alias compatibility
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-semibold text-white">User Preference Data</td>
                    <td className="py-2.5 px-3 text-slate-400">Existing preference &amp; feedback profiles</td>
                    <td className="py-2.5 px-3 text-purple-200 font-medium">Automatically preserved and migrated with zero data loss</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* SECTION 10: PRIVACY FRAMEWORK                             */}
        {/* ========================================================= */}
        <section id="sec-10" className="mb-14 scroll-mt-24">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] mb-4">
            <h2 className="text-lg sm:text-xl font-black text-white">
              10. Privacy Framework &amp; Responsible AI Stewardship
            </h2>
            <span className="text-[11px] font-mono text-purple-400 font-bold uppercase tracking-wider">
              Section 10
            </span>
          </div>
          <div className="bg-surface p-6 rounded-2xl border border-white/[0.06] space-y-4">
            <div className="p-4 rounded-xl bg-purple-950/30 border border-purple-500/30">
              <h3 className="text-xs font-bold text-purple-300 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-purple-400" />
                Strict Audio &amp; Communication Boundary Commitment
              </h3>
              <p className="text-xs text-slate-200 leading-relaxed">
                Audia AI processes only music playback interactions and track metadata where permitted.{" "}
                <strong className="text-white">
                  Audia AI never records, listens to, transcribes, or monitors Discord voice-channel conversations,
                  microphone streams, or private user messages.
                </strong>
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04] space-y-1">
                <span className="text-xs font-bold text-white">Permitted Telemetry Scope</span>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Limited strictly to track metadata (genre, language, mood tags), playback duration, skip events, and
                  explicit like/dislike feedback within SyncInk Radio.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04] space-y-1">
                <span className="text-xs font-bold text-white">User Control &amp; Erasure</span>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Listeners can inspect, pause, or reset their individual music preference profile at any time through
                  dedicated SyncInk Radio privacy commands.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04] space-y-1">
                <span className="text-xs font-bold text-white">Purpose Limitation</span>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Preference profiles are used exclusively to power Audia AI music recommendations and are never sold or
                  shared with external advertising networks.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* SECTION 11: STRATEGIC FUTURE VISION                       */}
        {/* ========================================================= */}
        <section id="sec-11" className="mb-14 scroll-mt-24">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] mb-4">
            <h2 className="text-lg sm:text-xl font-black text-white">
              11. Strategic Future Vision &amp; Engineering Roadmap
            </h2>
            <span className="text-[11px] font-mono text-purple-400 font-bold uppercase tracking-wider">
              Section 11
            </span>
          </div>
          <div className="bg-surface p-6 rounded-2xl border border-white/[0.06] space-y-3 text-sm text-slate-300 leading-relaxed">
            <p>
              Establishing the Audia AI by SyncInk identity lays the foundation for long-term innovation in intelligent
              community audio. Upcoming engineering phases focus on three strategic initiatives:
            </p>
            <ul className="space-y-3 pt-2 text-xs">
              <li className="flex items-start gap-2.5">
                <div className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-1.5 shrink-0" />
                <div>
                  <strong className="text-white">Harmonic Roster Modeling (Group Personalization):</strong> Expanding beyond
                  single-listener profiling to dynamically blend the musical preferences of multiple concurrent
                  voice-channel participants into a cohesive group session.
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <div className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-1.5 shrink-0" />
                <div>
                  <strong className="text-white">Harmonic Key &amp; BPM Transition Intelligence:</strong> Introducing acoustic
                  tempo and key analysis so autoplay transitions flow smoothly with natural rhythmic pacing.
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <div className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-1.5 shrink-0" />
                <div>
                  <strong className="text-white">Deeper Contextual Discovery &amp; Ecosystem APIs:</strong> Enhancing mood and
                  language discovery controls while offering documented integration endpoints for partner Discord
                  communities.
                </div>
              </li>
            </ul>
          </div>
        </section>

        {/* ========================================================= */}
        {/* SECTION 12: CONCLUSION & COLOPHON                         */}
        {/* ========================================================= */}
        <section id="sec-12" className="mb-12 scroll-mt-24">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] mb-4">
            <h2 className="text-lg sm:text-xl font-black text-white">
              12. Conclusion &amp; Official Publication Colophon
            </h2>
            <span className="text-[11px] font-mono text-purple-400 font-bold uppercase tracking-wider">
              Section 12
            </span>
          </div>
          <div className="bg-[#090b16] p-6 sm:p-8 rounded-2xl border border-purple-500/20 space-y-4">
            <p className="text-sm text-slate-300 leading-relaxed">
              The evolution from AI DJ to Audia AI by SyncInk marks a defining step forward for SyncInk Radio. By combining
              personalized preference modeling, genre and language awareness, mood-based discovery, and cycle-free autoplay
              under a cohesive brand identity, Audia AI delivers an intelligent, effortless listening experience built for
              modern Discord communities.
            </p>

            <div className="pt-6 border-t border-white/[0.08] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-slate-400">
              <div>
                <div className="font-bold text-white tracking-wide uppercase">
                  AUDIA AI BY SYNCINK — The Evolution of Intelligent Music Experiences
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Official Product Release &amp; Technical Specification | Version 1.0 | November 2026
                </div>
              </div>

              <div className="text-slate-400 text-[11px]">
                © {new Date().getFullYear()} SyncInk. All Rights Reserved.
              </div>
            </div>
          </div>
        </section>

        {/* Footer CTAs */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-6 border-t border-white/[0.06]">
          <Link
            href="/#bots"
            className="h-10 px-5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition-colors flex items-center gap-2"
          >
            <span>Explore SyncInk Radio</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <Link
            href="/updates"
            className="h-10 px-5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-200 font-semibold text-xs transition-colors border border-white/[0.08] flex items-center gap-2"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>Audia AI Release Notes</span>
          </Link>
          <a
            href="https://discord.gg/PmxfJwmQuB"
            target="_blank"
            rel="noopener noreferrer"
            className="h-10 px-5 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] text-slate-300 font-semibold text-xs transition-colors border border-white/[0.06] flex items-center gap-2"
          >
            <span>Join Beta Discord</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </a>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
