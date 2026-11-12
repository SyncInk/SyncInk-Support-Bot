"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Radio,
  Layers,
  Shield,
  CheckCircle2,
  Lock,
  Share2,
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
  Clock,
  Compass,
  ArrowUp,
  Menu,
  X,
  ListOrdered,
  Eye,
  Zap,
  Music2,
  Network,
  Disc3,
  Flame,
} from "lucide-react";
import { PublicNavbar } from "@/components/PublicNavbar";
import { PublicFooter } from "@/components/PublicFooter";

/* ═══════════════════════════════════════════════════════════════════════
   DATA STRUCTURES — PRESERVING 100% OF TECHNICAL ARCHITECTURE & MEANING
   ═══════════════════════════════════════════════════════════════════════ */

interface SectionMeta {
  id: string;
  num: string;
  title: string;
  shortTitle: string;
}

const SECTIONS: SectionMeta[] = [
  { id: "sec-01", num: "01", title: "Executive Introduction & Rebranding Rationale", shortTitle: "Introduction" },
  { id: "sec-02", num: "02", title: "System Definition: What is Audia AI?", shortTitle: "System Definition" },
  { id: "sec-03", num: "03", title: "Ten Core Architectural Capabilities", shortTitle: "Core Capabilities" },
  { id: "sec-04", num: "04", title: "Operational Workflow & Six-Stage Pipeline", shortTitle: "6-Stage Pipeline" },
  { id: "sec-05", num: "05", title: "Acoustic & Contextual Signal Processing", shortTitle: "Signal Processing" },
  { id: "sec-06", num: "06", title: "Production Capability vs. Roadmap Verification", shortTitle: "Verification Matrix" },
  { id: "sec-07", num: "07", title: "The Community Listening Experience", shortTitle: "Community Experience" },
  { id: "sec-08", num: "08", title: "Ecosystem & Brand Hierarchy (SyncInk → Audia AI)", shortTitle: "Brand Hierarchy" },
  { id: "sec-09", num: "09", title: "Rebranding Transition & Command Migration", shortTitle: "Command Migration" },
  { id: "sec-10", num: "10", title: "Privacy Framework & Responsible AI Governance", shortTitle: "Privacy & Governance" },
  { id: "sec-11", num: "11", title: "Strategic Future Vision & Engineering Roadmap", shortTitle: "Future Vision" },
  { id: "sec-12", num: "12", title: "Conclusion & Official Publication Colophon", shortTitle: "Colophon" },
];

const CAPABILITIES = [
  {
    id: "01",
    name: "Personalized Music Recommendations",
    desc: "Generates tailored track suggestions aligned with each user's demonstrated musical tastes rather than relying on generic global popularity charts.",
    tag: "Taste Alignment",
  },
  {
    id: "02",
    name: "Individual Preference Profiles",
    desc: "Builds and maintains structured preference profiles that map affinity weights across acoustic styles, artists, tempos, and vocal textures.",
    tag: "Vector Profiling",
  },
  {
    id: "03",
    name: "Listening History Analysis",
    desc: "Reviews historical playback sessions, track completion ratios, and repeat requests to distinguish core musical preferences from one-off plays.",
    tag: "Session Telemetry",
  },
  {
    id: "04",
    name: "Genre-Based Recommendations",
    desc: "Classifies music across macro-genres and granular sub-genres (such as Synthwave, Lo-Fi Hip-Hop, Indie Rock, and Neo-Soul) to maintain stylistic cohesion.",
    tag: "Sub-genre Taxonomy",
  },
  {
    id: "05",
    name: "Language-Based Recommendations",
    desc: "Recognizes vocal language metadata and script identifiers, enabling recommendations tailored to specific regional catalogs or multilingual listening sessions.",
    tag: "Zero-Bleed Language",
  },
  {
    id: "06",
    name: "Mood-Based Music Discovery",
    desc: "Evaluates sonic energy, valence, and atmospheric tone so communities can discover tracks suited for study focus, late-night relaxation, or active gaming.",
    tag: "Valence & Energy",
  },
  {
    id: "07",
    name: "AI-Powered Autoplay",
    desc: "Automatically selects and queues contextually matched tracks when a manual playlist ends, preventing sudden voice-channel silence.",
    tag: "Continuous Playback",
  },
  {
    id: "08",
    name: "Continuous Habit Learning",
    desc: "Adapts dynamically to evolving listening behaviors, observing session pacing and skip patterns to refine future track selections over time.",
    tag: "Adaptive Heuristics",
  },
  {
    id: "09",
    name: "Like & Dislike Feedback Loops",
    desc: "Processes explicit positive and negative user feedback to reinforce favored sonic traits while immediately suppressing disliked tracks and styles.",
    tag: "Direct Feedback",
  },
  {
    id: "10",
    name: "Cycle-Free Track Selection",
    desc: "Applies intelligent deduplication and cooldown windows to prevent the assistant from repeatedly looping the same songs or overplaying identical artists.",
    tag: "Anti-Loop Guard",
  },
];

const PIPELINE_STAGES = [
  {
    phase: "01",
    code: "OBSERVE",
    title: "Activity Observation",
    desc: "Observes user listening activity, command requests, play durations, and skip interactions within SyncInk Radio where permitted by user and server settings.",
    metric: "Duration & Skips",
  },
  {
    phase: "02",
    code: "CONSTRUCT",
    title: "Profile Construction",
    desc: "Aggregates observed interactions into individual music preference profiles that capture long-term affinities without exposing raw logs to external parties.",
    metric: "Weight Vectors",
  },
  {
    phase: "03",
    code: "ANALYZE",
    title: "Attribute Analysis",
    desc: "Analyzes track genres, vocal languages, mood indicators, and temporal listening patterns to establish the acoustic context of the active session.",
    metric: "Acoustic Context",
  },
  {
    phase: "04",
    code: "INTEGRATE",
    title: "Feedback Integration",
    desc: "Incorporates explicit like and dislike feedback alongside implicit completion signals to re-weight candidate scoring matrices immediately.",
    metric: "Candidate Matrix",
  },
  {
    phase: "05",
    code: "DISPATCH",
    title: "Autoplay Selection",
    desc: "Filters candidate tracks through the anti-repetition deduplication engine and dispatches the highest-scoring track to the SyncInk Radio audio pipeline.",
    metric: "Zero-Loop Output",
  },
  {
    phase: "06",
    code: "CALIBRATE",
    title: "Continuous Adaptation",
    desc: "Recalibrates preference weights as listener tastes evolve across sessions, ensuring recommendations remain fresh and responsive over time.",
    metric: "Long-term Drift",
  },
];

const SIGNALS = [
  {
    dimension: "Genre & Style Affinity",
    params: "Primary genre classification, sub-genre adjacency, and instrumentation tags.",
    outcome: "Prevents abrupt stylistic clashes between consecutive tracks during autoplay.",
    badge: "Cohesion",
  },
  {
    dimension: "Linguistic Continuity",
    params: "Vocal language metadata, regional catalog identifiers, and user language preferences.",
    outcome: "Maintains language consistency or executes smooth multilingual rotations as preferred.",
    badge: "Language Lock",
  },
  {
    dimension: "Mood & Energy Curve",
    params: "Acoustic valence, rhythmic tempo density, and chill vs. high-energy markers.",
    outcome: "Aligns music playback with the prevailing atmosphere of the Discord voice channel.",
    badge: "Dynamic Atmosphere",
  },
  {
    dimension: "Repetition Suppression",
    params: "Recent play timestamps, artist frequency caps, and disliked track exclusions.",
    outcome: "Eliminates repetitive track loops and ensures catalog variety across extended sessions.",
    badge: "Anti-Repetition",
  },
];

const ROADMAP_ITEMS = [
  {
    module: "Personalized Recommendations",
    status: "Active (Production)",
    scope: "Operational within SyncInk Radio; suggests tracks matched to individual preference profiles.",
    active: true,
    quarter: "Current Core",
  },
  {
    module: "Individual Preference Profiles",
    status: "Active (Production)",
    scope: "Operational; maintains per-user affinity weights based on permitted listening activity.",
    active: true,
    quarter: "Current Core",
  },
  {
    module: "Genre, Language & Mood Analysis",
    status: "Active (Production)",
    scope: "Operational; classifies track metadata across genre, language, and mood dimensions.",
    active: true,
    quarter: "Current Core",
  },
  {
    module: "AI-Powered Autoplay & Anti-Looping",
    status: "Active (Production)",
    scope: "Operational; automates queue continuation while suppressing repeated tracks and artists.",
    active: true,
    quarter: "Current Core",
  },
  {
    module: "Like / Dislike Feedback Learning",
    status: "Active (Production)",
    scope: "Operational; updates recommendation weights in response to explicit user feedback.",
    active: true,
    quarter: "Current Core",
  },
  {
    module: "Harmonic Roster Modeling",
    status: "Planned (H1 2027)",
    scope: "In development; multi-user consensus engine blending preferences across all active channel members.",
    active: false,
    quarter: "Q1–Q2 2027",
  },
  {
    module: "Harmonic Key & BPM Matching",
    status: "Planned (H2 2027)",
    scope: "In development; tempo-synced transitions and harmonic key matching between autoplay songs.",
    active: false,
    quarter: "Q3–Q4 2027",
  },
  {
    module: "Audia Engine Developer API",
    status: "Planned (H2 2027)",
    scope: "In development; controlled external endpoints for partner community integrations.",
    active: false,
    quarter: "Q4 2027",
  },
];

const DISCORD_MOOD_GENRES = [
  { name: "Romantic & Soulful", id: "1568327378504130600", desc: "Acoustic melodies, heartfelt love songs" },
  { name: "Lo-Fi & Chill", id: "1568327227983007864", desc: "Relaxing beats, study & chillhop vibes" },
  { name: "Energetic & High BPM", id: "1568327456434430093", desc: "Uplifting pop hits, dance grooves" },
  { name: "Punjabi Pop & Urban", id: "1568327108533551144", desc: "Punjabi folk, urban pop & bass" },
  { name: "Hip-Hop & Rap", id: "1568327544279662663", desc: "Modern hip-hop, trap & rap rhythms" },
  { name: "Indie Acoustic", id: "1568327695639650464", desc: "Organic instruments, indie singer-songwriters" },
  { name: "EDM & Dance", id: "1568327771501895762", desc: "Club anthems, future bass & festival drops" },
  { name: "K-Pop", id: "1568327830981583039", desc: "Korean pop hits, dynamic choreography anthems" },
];

/* ═══════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════════════ */
export default function AudiaSpecPage() {
  const [copiedLink, setCopiedLink] = useState(false);
  const [activeSection, setActiveSection] = useState("sec-01");
  const [readingProgress, setReadingProgress] = useState(0);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Handle Share functionality with native share + clipboard fallback
  const handleShare = async () => {
    if (typeof window === "undefined") return;
    const url = window.location.href;
    const shareData = {
      title: "Audia AI by SyncInk • Official Product Specification",
      text: "Explore Audia AI — the intelligent music assistant powering SyncInk Radio with parametric taste modeling and continuous autoplay.",
      url,
    };

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
        return;
      } catch (err) {
        // Fallback to clipboard if user dismissed or cancelled
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2200);
    } catch {
      // Ignored
    }
  };

  // Scroll listener for reading progress, active section & back to top
  useEffect(() => {
    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
      const currentProgress = totalScroll > 0 ? (window.scrollY / totalScroll) * 100 : 0;
      setReadingProgress(Math.min(100, Math.max(0, currentProgress)));
      setShowBackToTop(window.scrollY > 480);

      // Detect active section
      const sectionElements = SECTIONS.map((sec) => document.getElementById(sec.id));
      const scrollPosition = window.scrollY + 180;

      for (let i = sectionElements.length - 1; i >= 0; i--) {
        const el = sectionElements[i];
        if (el && el.offsetTop <= scrollPosition) {
          setActiveSection(SECTIONS[i].id);
          break;
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen bg-[#080910] text-[#F8F8FC] flex flex-col font-sans selection:bg-purple-600 selection:text-white relative">
      <PublicNavbar />

      {/* ─── STICKY READING PROGRESS BAR ─────────────────────────────── */}
      <div className="fixed top-0 left-0 right-0 h-[2px] bg-transparent z-50 pointer-events-none">
        <div
          className="h-full bg-gradient-to-r from-purple-500 via-fuchsia-400 to-indigo-500 transition-all duration-150 ease-out"
          style={{ width: `${readingProgress}%` }}
        />
      </div>

      {/* ─── STICKY EDITORIAL SUB-NAVBAR ─────────────────────────────── */}
      <nav
        aria-label="Document Reader Navigation"
        className="sticky top-16 z-40 bg-[#080910]/85 backdrop-blur-md border-b border-white/[0.07] px-4 sm:px-6 lg:px-8 py-2.5 transition-all duration-200"
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4 text-xs">
          {/* Left: Active Section breadcrumb indicator */}
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href="/"
              className="text-[#A1A4B8] hover:text-white transition-colors shrink-0 hidden sm:inline"
            >
              SyncInk
            </Link>
            <span className="text-white/20 hidden sm:inline">/</span>
            <div className="flex items-center gap-2 truncate">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30 shrink-0">
                {SECTIONS.find((s) => s.id === activeSection)?.num || "01"}
              </span>
              <span className="text-[#F8F8FC] font-semibold truncate">
                {SECTIONS.find((s) => s.id === activeSection)?.shortTitle || "Introduction"}
              </span>
            </div>
          </div>

          {/* Right: Quick actions */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Table of contents popover trigger on mobile */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden h-8 px-2.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-[#A1A4B8] hover:text-white transition-colors border border-white/[0.07] flex items-center gap-1.5"
              aria-label="Toggle Document Table of Contents"
            >
              <ListOrdered className="w-3.5 h-3.5 text-purple-400" />
              <span className="text-[11px] font-medium">Index</span>
            </button>

            {/* Release notes link */}
            <Link
              href="/updates"
              className="h-8 px-3 rounded-lg bg-white/[0.03] hover:bg-white/[0.07] text-[#A1A4B8] hover:text-white font-medium text-[11px] transition-colors border border-white/[0.07] hidden sm:flex items-center gap-1.5"
            >
              <Sparkles className="w-3 h-3 text-purple-400" />
              <span>Changelog</span>
            </Link>

            {/* Share Document button */}
            <button
              onClick={handleShare}
              className="h-8 px-3 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 font-medium text-[11px] transition-colors border border-purple-500/25 flex items-center gap-1.5 shadow-sm active:scale-[0.98]"
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Link Copied!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5 text-purple-400" />
                  <span>Share Spec</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Expandable Table of Contents Drawer */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden pt-3 pb-2 border-t border-white/[0.07] mt-2.5 overflow-hidden"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-72 overflow-y-auto pr-1">
                {SECTIONS.map((sec) => (
                  <a
                    key={sec.id}
                    href={`#${sec.id}`}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-2 p-2 rounded-lg text-xs transition-colors ${
                      activeSection === sec.id
                        ? "bg-purple-500/20 text-white font-semibold border border-purple-500/30"
                        : "text-[#A1A4B8] hover:bg-white/[0.04] hover:text-white"
                    }`}
                  >
                    <span className="font-mono text-purple-400 text-[10px]">{sec.num}.</span>
                    <span className="truncate">{sec.title}</span>
                  </a>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
        {/* ========================================================= */}
        {/* HERO SECTION — PREMIUM EDITORIAL DESIGN                  */}
        {/* ========================================================= */}
        <header className="relative pt-6 sm:pt-12 pb-16 sm:pb-24 border-b border-white/[0.07] mb-16 overflow-hidden">
          {/* Subtle violet ambient atmospheric depth */}
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[720px] h-[360px] bg-[radial-gradient(ellipse_60%_40%_at_50%_0%,rgba(168,85,247,0.14),transparent)] pointer-events-none blur-2xl" />

          {/* Top Meta Strip: Parent Provider & Specification Ref */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-8 text-xs relative z-10">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/[0.04] text-[#A1A4B8] border border-white/[0.07] flex items-center gap-1.5">
                <FileText className="w-3 h-3 text-purple-400" />
                Technical Specification
              </span>
              <span className="text-[#A1A4B8]/40 hidden sm:inline">•</span>
              <span className="font-mono text-[11px] text-[#A1A4B8] hidden sm:inline">
                DOC REF: SYNC-AUDIA-SPEC-V1
              </span>
            </div>

            {/* Parent Technology Provider Badge */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-[#A1A4B8] text-[11px]">Provider:</span>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.03] border border-white/[0.07]">
                <Image
                  src="/syncink-main-logo.png"
                  alt="SyncInk"
                  width={14}
                  height={14}
                  className="object-contain"
                />
                <span className="font-bold text-[#F8F8FC]">SyncInk Technologies</span>
              </div>
            </div>
          </div>

          {/* Standalone Audia AI Logo (DIRECTLY ON BACKGROUND — NO BOX, NO FRAME) */}
          <div className="relative z-10 pt-2 pb-6">
            <Image
              src="/audia-ai-logo.png"
              alt="Audia AI Official Logo"
              width={140}
              height={47}
              className="w-[90px] sm:w-[115px] md:w-[140px] h-auto object-contain select-none"
              priority
            />
          </div>

          {/* Large Hero Wordmark & Product Title */}
          <div className="relative z-10 space-y-4">
            <h1 className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-black text-[#F8F8FC] tracking-tight leading-[0.95] select-none">
              AUDIA{" "}
              <span className="bg-gradient-to-r from-purple-400 via-fuchsia-400 to-indigo-400 bg-clip-text text-transparent">
                AI
              </span>
            </h1>

            <p className="text-xl sm:text-2xl md:text-3xl font-semibold text-[#F8F8FC] tracking-tight pt-2">
              The Next Generation of Intelligent Music Experiences.
            </p>

            <p className="text-base sm:text-lg text-[#A1A4B8] max-w-2xl leading-relaxed font-normal">
              An intelligent music companion that understands your taste, discovers your next favourite track and keeps
              every listening session moving.
            </p>
          </div>

          {/* Hero Metadata & Verification Bar */}
          <div className="relative z-10 pt-8 mt-8 border-t border-white/[0.07] flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Version 1.0 Production</span>
              </div>
              <span className="text-[#A1A4B8]/40 hidden sm:inline">•</span>
              <span className="text-[#A1A4B8]">Published: November 2026</span>
              <span className="text-[#A1A4B8]/40 hidden sm:inline">•</span>
              <span className="text-[#A1A4B8]">
                Host: <strong className="text-purple-300 font-semibold">SyncInk Radio</strong>
              </span>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center gap-3">
              <a
                href="#sec-01"
                className="h-9 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition-colors flex items-center gap-2 active:scale-[0.98] shadow-sm shadow-purple-950/40"
              >
                <span>Read Specification</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
              <Link
                href="/updates"
                className="h-9 px-4 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-[#F8F8FC] font-semibold text-xs transition-colors border border-white/[0.07] flex items-center gap-2"
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <span>Release Notes</span>
              </Link>
            </div>
          </div>
        </header>

        {/* ========================================================= */}
        {/* DOCUMENT METADATA LEDGER                                   */}
        {/* ========================================================= */}
        <section aria-label="Specification Ledger" className="mb-20">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 py-4 border-y border-white/[0.07] text-xs">
            <div className="space-y-1">
              <div className="text-[10px] text-[#A1A4B8] font-semibold uppercase tracking-wider">Engineered By</div>
              <div className="text-[#F8F8FC] font-bold">SyncInk Engineering</div>
            </div>
            <div className="space-y-1">
              <div className="text-[10px] text-[#A1A4B8] font-semibold uppercase tracking-wider">Host Platform</div>
              <div className="text-purple-300 font-bold">SyncInk Radio (Discord)</div>
            </div>
            <div className="space-y-1">
              <div className="text-[10px] text-[#A1A4B8] font-semibold uppercase tracking-wider">Legacy Title</div>
              <div className="text-[#A1A4B8] font-bold line-through">AI DJ (Retired)</div>
            </div>
            <div className="space-y-1">
              <div className="text-[10px] text-[#A1A4B8] font-semibold uppercase tracking-wider">Production Status</div>
              <div className="text-emerald-400 font-bold">Active V1.0 Core</div>
            </div>
            <div className="space-y-1 col-span-2 sm:col-span-1">
              <div className="text-[10px] text-[#A1A4B8] font-semibold uppercase tracking-wider">Publication Date</div>
              <div className="text-[#F8F8FC] font-bold">November 2026</div>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* MASTER SPECIFICATION INDEX                                */}
        {/* ========================================================= */}
        <section aria-labelledby="toc-heading" className="mb-24">
          <div className="flex items-center justify-between pb-4 border-b border-white/[0.07] mb-6">
            <div className="flex items-center gap-2.5">
              <Compass className="w-4 h-4 text-purple-400" />
              <h2 id="toc-heading" className="text-xs font-bold text-[#F8F8FC] uppercase tracking-wider">
                Specification Navigation &amp; Table of Contents
              </h2>
            </div>
            <span className="text-[11px] text-[#A1A4B8] font-mono">12 Sections • Complete Specification</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 text-xs">
            {SECTIONS.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className="group flex items-start gap-3 p-3.5 rounded-xl bg-[#0D0F19]/60 hover:bg-[#121321] border border-white/[0.06] hover:border-purple-500/30 transition-all duration-150"
              >
                <span className="font-mono text-purple-400 font-bold text-xs shrink-0 mt-0.5">
                  {item.num}
                </span>
                <div className="flex-1 min-w-0">
                  <span className="font-semibold text-[#F8F8FC] group-hover:text-purple-300 transition-colors line-clamp-1">
                    {item.title}
                  </span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-[#A1A4B8]/40 group-hover:text-purple-400 group-hover:translate-x-0.5 transition-all shrink-0 mt-0.5" />
              </a>
            ))}
          </div>
        </section>

        {/* ========================================================= */}
        {/* SECTION 01: EXECUTIVE INTRODUCTION                       */}
        {/* ========================================================= */}
        <section id="sec-01" className="mb-24 scroll-mt-28">
          <div className="pb-4 border-b border-white/[0.07] mb-8">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="font-mono text-xs font-bold text-purple-400 uppercase tracking-widest">
                Section 01
              </span>
              <span className="text-[#A1A4B8]/40">•</span>
              <span className="text-xs text-[#A1A4B8] uppercase tracking-wider">Executive Overview</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-[#F8F8FC] tracking-tight">
              1. Executive Introduction &amp; Rebranding Rationale
            </h2>
          </div>

          <div className="space-y-6 text-[#A1A4B8] text-base leading-relaxed">
            <p className="text-lg text-[#F8F8FC] leading-relaxed font-normal">
              SyncInk Radio’s intelligent music assistant, previously deployed under the early working name{" "}
              <strong className="text-white font-semibold">AI DJ</strong>, is officially rebranded to{" "}
              <strong className="text-purple-300 font-semibold">Audia AI by SyncInk</strong>. Within Discord communities,
              shared audio listening has evolved from static background playback into an interactive social anchor. While
              the legacy AI DJ designation served initial automated queueing trials, the underlying recommendation engine
              has matured into a dedicated personalization and acoustic discovery architecture that outgrows a generic
              functional title.
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
        <section id="sec-02" className="mb-24 scroll-mt-28">
          <div className="pb-4 border-b border-white/[0.07] mb-8">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="font-mono text-xs font-bold text-purple-400 uppercase tracking-widest">
                Section 02
              </span>
              <span className="text-[#A1A4B8]/40">•</span>
              <span className="text-xs text-[#A1A4B8] uppercase tracking-wider">Architecture Definition</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-[#F8F8FC] tracking-tight">
              2. System Definition: What is Audia AI?
            </h2>
          </div>

          <div className="space-y-6 text-[#A1A4B8] text-base leading-relaxed">
            <p>
              <strong className="text-white font-semibold">Audia AI</strong> is an intelligent music assistant engineered
              by SyncInk to understand individual and community listening preferences and provide tailored music
              recommendations inside SyncInk Radio. Rather than functioning as a separate Discord bot or requiring external
              configuration, Audia AI serves as the embedded intelligence layer powering SyncInk Radio’s recommendation,
              discovery, and autonomous playback pipelines.
            </p>
            <p>
              Traditional Discord music bots rely on manual track lookups or uncurated shuffle lists that frequently
              disrupt the sonic atmosphere of a voice channel. Audia AI resolves this by evaluating fine-grained musical
              attributes—spanning genre sub-classifications, vocal languages, emotional valence, and historical listening
              patterns. By synthesizing explicit listener feedback with permitted playback telemetry, Audia AI curates a
              seamless progression of tracks that feels intentionally selected for the active listeners in the room.
            </p>

            {/* Architectural Comparison Table */}
            <div className="pt-6">
              <h3 className="text-xs font-bold text-[#F8F8FC] uppercase tracking-wider mb-4">
                Architectural Evolution Matrix: AI DJ vs. Audia AI by SyncInk
              </h3>
              <div className="overflow-x-auto rounded-2xl border border-white/[0.07] bg-[#0D0F19]/40">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-white/[0.08] bg-white/[0.02] text-[#A1A4B8]">
                      <th className="py-3.5 px-4 font-semibold uppercase tracking-wider">Architectural Dimension</th>
                      <th className="py-3.5 px-4 font-semibold uppercase tracking-wider">Legacy Identity: AI DJ</th>
                      <th className="py-3.5 px-4 font-semibold uppercase tracking-wider text-purple-300">
                        Current Identity: Audia AI by SyncInk
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    <tr>
                      <td className="py-3 px-4 font-semibold text-white whitespace-nowrap">Core Identity Role</td>
                      <td className="py-3 px-4 text-[#A1A4B8]">Basic reactive track automation utility</td>
                      <td className="py-3 px-4 text-purple-200 font-medium">
                        Comprehensive intelligent music assistant &amp; concierge
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-semibold text-white whitespace-nowrap">Recommendation Basis</td>
                      <td className="py-3 px-4 text-[#A1A4B8]">Broad genre tags and static similarity lookups</td>
                      <td className="py-3 px-4 text-purple-200 font-medium">
                        Parametric user preference profiles, history, mood, and language
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-semibold text-white whitespace-nowrap">Queue Continuation</td>
                      <td className="py-3 px-4 text-[#A1A4B8]">Simple fallback autoplay prone to track repetition</td>
                      <td className="py-3 px-4 text-purple-200 font-medium">
                        AI-powered autoplay with strict anti-repetition cooldown filters
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-semibold text-white whitespace-nowrap">Feedback Processing</td>
                      <td className="py-3 px-4 text-[#A1A4B8]">Session-only manual skips</td>
                      <td className="py-3 px-4 text-purple-200 font-medium">
                        Persistent learning from listening habits plus explicit like/dislike loops
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Three System Pillars */}
            <div className="pt-8">
              <h3 className="text-xs font-bold text-[#F8F8FC] uppercase tracking-wider mb-4">
                Core System Pillars Within SyncInk Radio
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-5 rounded-2xl bg-[#0D0F19]/60 border border-white/[0.06] space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-3">
                    <Sliders className="w-4 h-4" />
                  </div>
                  <h4 className="text-sm font-bold text-white">Preference Modeling Engine</h4>
                  <p className="text-xs text-[#A1A4B8] leading-relaxed">
                    Constructs structured mathematical taste profiles for participating listeners based on observed track
                    completions, repeat requests, and explicit rating actions.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-[#0D0F19]/60 border border-white/[0.06] space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-3">
                    <Layers className="w-4 h-4" />
                  </div>
                  <h4 className="text-sm font-bold text-white">Multi-Attribute Classifier</h4>
                  <p className="text-xs text-[#A1A4B8] leading-relaxed">
                    Evaluates candidate songs across genre lineage, vocal language metadata, tempo stability, and mood
                    descriptors to ensure smooth sonic transitions.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-[#0D0F19]/60 border border-white/[0.06] space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-3">
                    <Cpu className="w-4 h-4" />
                  </div>
                  <h4 className="text-sm font-bold text-white">Autonomous Queue Supervisor</h4>
                  <p className="text-xs text-[#A1A4B8] leading-relaxed">
                    Monitors active SyncInk Radio playback queues and seamlessly injects contextually matched autoplay
                    tracks the moment user-submitted queues conclude.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* SECTION 03: TEN CORE ARCHITECTURAL CAPABILITIES           */}
        {/* ========================================================= */}
        <section id="sec-03" className="mb-24 scroll-mt-28">
          <div className="pb-4 border-b border-white/[0.07] mb-8">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="font-mono text-xs font-bold text-purple-400 uppercase tracking-widest">
                Section 03
              </span>
              <span className="text-[#A1A4B8]/40">•</span>
              <span className="text-xs text-[#A1A4B8] uppercase tracking-wider">Engine Pillars</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-[#F8F8FC] tracking-tight">
              3. Ten Core Architectural Capabilities
            </h2>
          </div>

          <div className="space-y-6">
            <p className="text-base text-[#A1A4B8] leading-relaxed">
              Audia AI delivers ten foundational capabilities engineered to elevate music discovery and automated
              playback within SyncInk Radio:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-2">
              {CAPABILITIES.map((cap) => (
                <div
                  key={cap.id}
                  className="p-5 rounded-2xl bg-[#0D0F19]/60 hover:bg-[#121321]/80 border border-white/[0.06] hover:border-purple-500/30 transition-all duration-150 space-y-2 group"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="text-[11px] font-mono font-bold text-purple-400 px-2 py-0.5 rounded bg-purple-500/10 border border-purple-500/20">
                        {cap.id}
                      </span>
                      <h3 className="font-bold text-sm text-[#F8F8FC] group-hover:text-purple-200 transition-colors">
                        {cap.name}
                      </h3>
                    </div>
                    <span className="text-[10px] font-mono text-[#A1A4B8] uppercase tracking-wider">
                      {cap.tag}
                    </span>
                  </div>
                  <p className="text-xs text-[#A1A4B8] leading-relaxed pl-1">{cap.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* SECTION 04: SIX-STAGE OPERATIONAL PIPELINE                */}
        {/* ========================================================= */}
        <section id="sec-04" className="mb-24 scroll-mt-28">
          <div className="pb-4 border-b border-white/[0.07] mb-8">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="font-mono text-xs font-bold text-purple-400 uppercase tracking-widest">
                Section 04
              </span>
              <span className="text-[#A1A4B8]/40">•</span>
              <span className="text-xs text-[#A1A4B8] uppercase tracking-wider">Lifecycle Workflow</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-[#F8F8FC] tracking-tight">
              4. Operational Workflow &amp; Six-Stage Pipeline
            </h2>
          </div>

          <div className="space-y-6">
            <p className="text-base text-[#A1A4B8] leading-relaxed">
              Audia AI executes a continuous, six-stage recommendation lifecycle inside SyncInk Radio. Each stage processes
              permitted playback signals to refine curation quality in real time:
            </p>

            {/* Stepper Grid Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4">
              {PIPELINE_STAGES.map((stage) => (
                <div
                  key={stage.phase}
                  className="p-5 rounded-2xl bg-[#0D0F19]/60 border border-white/[0.06] hover:border-purple-500/25 transition-all space-y-3 relative overflow-hidden group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded bg-purple-500/15 text-purple-300 border border-purple-500/25 font-bold">
                      PHASE {stage.phase}
                    </span>
                    <span className="text-[10px] font-mono text-[#A1A4B8] tracking-widest">
                      {stage.code}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-white group-hover:text-purple-200 transition-colors">
                      {stage.title}
                    </h3>
                    <p className="text-xs text-[#A1A4B8] leading-relaxed mt-1.5">{stage.desc}</p>
                  </div>

                  <div className="pt-2 border-t border-white/[0.05] flex items-center justify-between text-[11px]">
                    <span className="text-[#A1A4B8]">Telemetry Focus</span>
                    <span className="font-mono text-purple-300 font-semibold">{stage.metric}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* SECTION 05: ACOUSTIC & CONTEXTUAL SIGNAL PROCESSING       */}
        {/* ========================================================= */}
        <section id="sec-05" className="mb-24 scroll-mt-28">
          <div className="pb-4 border-b border-white/[0.07] mb-8">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="font-mono text-xs font-bold text-purple-400 uppercase tracking-widest">
                Section 05
              </span>
              <span className="text-[#A1A4B8]/40">•</span>
              <span className="text-xs text-[#A1A4B8] uppercase tracking-wider">Signal Taxonomy</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-[#F8F8FC] tracking-tight">
              5. Acoustic &amp; Contextual Signal Processing
            </h2>
          </div>

          <div className="space-y-6 text-[#A1A4B8] text-base leading-relaxed">
            <p>
              To avoid the jarring transitions common in basic shuffle utilities, Audia AI evaluates multiple signal
              layers before committing a track to the SyncInk Radio playback stream. By balancing familiarity with controlled
              exploration, the assistant introduces new music while respecting established session boundaries:
            </p>

            <div className="overflow-x-auto rounded-2xl border border-white/[0.07] bg-[#0D0F19]/40 mt-4">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/[0.08] bg-white/[0.02] text-[#A1A4B8]">
                    <th className="py-3.5 px-4 font-semibold uppercase tracking-wider">Signal Dimension</th>
                    <th className="py-3.5 px-4 font-semibold uppercase tracking-wider">Evaluated Parameters</th>
                    <th className="py-3.5 px-4 font-semibold uppercase tracking-wider text-purple-300">
                      Curation Outcome
                    </th>
                    <th className="py-3.5 px-4 font-semibold uppercase tracking-wider text-right">Badge</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {SIGNALS.map((s) => (
                    <tr key={s.dimension}>
                      <td className="py-3 px-4 font-semibold text-white whitespace-nowrap">{s.dimension}</td>
                      <td className="py-3 px-4 text-[#A1A4B8] max-w-xs">{s.params}</td>
                      <td className="py-3 px-4 text-purple-200 font-medium">{s.outcome}</td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-500/10 text-purple-300 border border-purple-500/20">
                          {s.badge}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Curated Mood & Genre Preferences Showcase */}
            <div className="pt-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-bold text-[#F8F8FC] uppercase tracking-wider">
                  Verified Production Mood &amp; Genre Taxonomies
                </h3>
                <span className="text-[11px] text-[#A1A4B8] font-mono">Integrated Discord CDN</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {DISCORD_MOOD_GENRES.map((genre) => (
                  <div
                    key={genre.id}
                    className="p-3.5 rounded-xl bg-[#0D0F19]/60 border border-white/[0.06] hover:border-purple-500/30 transition-colors flex items-start gap-3"
                  >
                    <img
                      src={`https://cdn.discordapp.com/emojis/${genre.id}.png`}
                      alt={genre.name}
                      className="w-5 h-5 object-contain select-none shrink-0 mt-0.5"
                    />
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white truncate">{genre.name}</div>
                      <div className="text-[11px] text-[#A1A4B8] leading-snug mt-0.5 line-clamp-1">{genre.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* SECTION 06: PRODUCTION CAPABILITY VS ROADMAP              */}
        {/* ========================================================= */}
        <section id="sec-06" className="mb-24 scroll-mt-28">
          <div className="pb-4 border-b border-white/[0.07] mb-8">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="font-mono text-xs font-bold text-purple-400 uppercase tracking-widest">
                Section 06
              </span>
              <span className="text-[#A1A4B8]/40">•</span>
              <span className="text-xs text-[#A1A4B8] uppercase tracking-wider">Engineering Verification</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-[#F8F8FC] tracking-tight">
              6. Production Capability vs. Roadmap Verification
            </h2>
          </div>

          <div className="space-y-6 text-[#A1A4B8] text-base leading-relaxed">
            <p>
              In accordance with SyncInk’s commitment to technical transparency, the matrix below clearly distinguishes
              currently active production capabilities from planned features scheduled for future engineering milestones.
              Unimplemented features are never represented as active production systems.
            </p>

            <div className="overflow-x-auto rounded-2xl border border-white/[0.07] bg-[#0D0F19]/40 mt-4">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/[0.08] bg-white/[0.02] text-[#A1A4B8]">
                    <th className="py-3.5 px-4 font-semibold uppercase tracking-wider">Capability / Module</th>
                    <th className="py-3.5 px-4 font-semibold uppercase tracking-wider">Deployment Status</th>
                    <th className="py-3.5 px-4 font-semibold uppercase tracking-wider">Target Milestone</th>
                    <th className="py-3.5 px-4 font-semibold uppercase tracking-wider">Verification &amp; Scope</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {ROADMAP_ITEMS.map((item) => (
                    <tr key={item.module}>
                      <td className="py-3 px-4 font-semibold text-white whitespace-nowrap">{item.module}</td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1.5 ${
                            item.active
                              ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                              : "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              item.active ? "bg-emerald-400" : "bg-amber-400"
                            }`}
                          />
                          <span>{item.status}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-[#A1A4B8] whitespace-nowrap">
                        {item.quarter}
                      </td>
                      <td className="py-3 px-4 text-[#A1A4B8]">{item.scope}</td>
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
        <section id="sec-07" className="mb-24 scroll-mt-28">
          <div className="pb-4 border-b border-white/[0.07] mb-8">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="font-mono text-xs font-bold text-purple-400 uppercase tracking-widest">
                Section 07
              </span>
              <span className="text-[#A1A4B8]/40">•</span>
              <span className="text-xs text-[#A1A4B8] uppercase tracking-wider">User Impact</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-[#F8F8FC] tracking-tight">
              7. The Community Listening Experience
            </h2>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <div
                  key={idx}
                  className="p-6 rounded-2xl bg-[#0D0F19]/60 border border-white/[0.06] hover:border-purple-500/25 transition-colors space-y-2.5"
                >
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
                    <h3 className="font-bold text-sm text-[#F8F8FC]">{exp.title}</h3>
                  </div>
                  <p className="text-xs text-[#A1A4B8] leading-relaxed pl-6.5">{exp.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* SECTION 08: ECOSYSTEM & BRAND HIERARCHY                   */}
        {/* ========================================================= */}
        <section id="sec-08" className="mb-24 scroll-mt-28">
          <div className="pb-4 border-b border-white/[0.07] mb-8">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="font-mono text-xs font-bold text-purple-400 uppercase tracking-widest">
                Section 08
              </span>
              <span className="text-[#A1A4B8]/40">•</span>
              <span className="text-xs text-[#A1A4B8] uppercase tracking-wider">Brand Architecture</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-[#F8F8FC] tracking-tight">
              8. Ecosystem &amp; Brand Hierarchy
            </h2>
          </div>

          <div className="space-y-6 text-[#A1A4B8] text-base leading-relaxed">
            <p>
              To ensure clear brand communication across all user interfaces, partner materials, and community
              announcements, SyncInk establishes a direct three-tier brand hierarchy:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
              {/* TIER 1 */}
              <div className="p-6 rounded-2xl bg-[#0D0F19]/60 border border-white/[0.06] space-y-4">
                <span className="text-[10px] font-bold text-[#A1A4B8] uppercase tracking-widest">
                  Tier 1 — Parent Brand &amp; Developer
                </span>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-black/60 border border-white/10 flex items-center justify-center p-1.5 shrink-0">
                    <Image
                      src="/syncink-main-logo.png"
                      alt="SyncInk Logo"
                      width={26}
                      height={26}
                      className="object-contain"
                    />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white">SyncInk</h3>
                    <span className="text-[11px] text-[#A1A4B8]">Technology Provider</span>
                  </div>
                </div>
                <p className="text-xs text-[#A1A4B8] leading-relaxed">
                  Responsible for engineering core platform infrastructure, hosting servers, AI models, and governance
                  standards.
                </p>
              </div>

              {/* TIER 2 */}
              <div className="p-6 rounded-2xl bg-[#0D0F19]/60 border border-white/[0.06] space-y-4">
                <span className="text-[10px] font-bold text-[#A1A4B8] uppercase tracking-widest">
                  Tier 2 — Flagship Bot Product
                </span>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#090714] border-2 border-purple-500/40 p-1 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(168,85,247,0.3)] ring-1 ring-purple-400/20">
                    <Image
                      src="/radio-logo.png"
                      alt="SyncInk Radio Logo"
                      width={32}
                      height={32}
                      className="object-contain rounded-lg select-none"
                    />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white">SyncInk Radio</h3>
                    <span className="text-[11px] text-purple-300">Discord Audio Platform</span>
                  </div>
                </div>
                <p className="text-xs text-[#A1A4B8] leading-relaxed">
                  The Discord music and radio bot installed by community administrators to deliver high-reliability
                  voice-channel audio streaming and queue management.
                </p>
              </div>

              {/* TIER 3 — STANDALONE AUDIA AI LOGO WITHOUT SQUARE BOX */}
              <div className="p-6 rounded-2xl bg-[#121321]/90 border border-purple-500/30 space-y-4 shadow-lg shadow-purple-950/20">
                <span className="text-[10px] font-bold text-purple-300 uppercase tracking-widest">
                  Tier 3 — Embedded Intelligence
                </span>
                <div className="space-y-2">
                  {/* Standalone Audia AI logo directly on card background — no inner square box */}
                  <Image
                    src="/audia-ai-logo.png"
                    alt="Audia AI Official Logo"
                    width={110}
                    height={37}
                    className="w-[100px] h-auto object-contain select-none"
                  />
                  <div>
                    <h3 className="text-base font-black text-white">Audia AI by SyncInk</h3>
                    <span className="text-[11px] text-purple-300">Embedded Music Assistant</span>
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
        {/* SECTION 09: REBRANDING & COMMAND MIGRATION                */}
        {/* ========================================================= */}
        <section id="sec-09" className="mb-24 scroll-mt-28">
          <div className="pb-4 border-b border-white/[0.07] mb-8">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="font-mono text-xs font-bold text-purple-400 uppercase tracking-widest">
                Section 09
              </span>
              <span className="text-[#A1A4B8]/40">•</span>
              <span className="text-xs text-[#A1A4B8] uppercase tracking-wider">Transition Protocol</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-[#F8F8FC] tracking-tight">
              9. Rebranding Transition &amp; Command Migration
            </h2>
          </div>

          <div className="space-y-6 text-[#A1A4B8] text-base leading-relaxed">
            <p>
              The transition from AI DJ to Audia AI by SyncInk is a seamless product identity update within SyncInk Radio.
              Server administrators and listeners require zero manual reinstallation:
            </p>

            <div className="overflow-x-auto rounded-2xl border border-white/[0.07] bg-[#0D0F19]/40 mt-4">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/[0.08] bg-white/[0.02] text-[#A1A4B8]">
                    <th className="py-3.5 px-4 font-semibold uppercase tracking-wider">Transition Dimension</th>
                    <th className="py-3.5 px-4 font-semibold uppercase tracking-wider">Previous State (AI DJ)</th>
                    <th className="py-3.5 px-4 font-semibold uppercase tracking-wider text-purple-300">
                      Updated State (Audia AI by SyncInk)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  <tr>
                    <td className="py-3 px-4 font-semibold text-white whitespace-nowrap">Official Assistant Name</td>
                    <td className="py-3 px-4 text-[#A1A4B8]">AI DJ</td>
                    <td className="py-3 px-4 text-purple-200 font-medium">Audia AI by SyncInk (or Audia AI)</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-semibold text-white whitespace-nowrap">Bot Installation Status</td>
                    <td className="py-3 px-4 text-[#A1A4B8]">Integrated inside SyncInk Radio</td>
                    <td className="py-3 px-4 text-purple-200 font-medium">
                      Same SyncInk Radio bot (Not a separate bot; no re-invite needed)
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-semibold text-white whitespace-nowrap">Command Namespace</td>
                    <td className="py-3 px-4 text-[#A1A4B8]">Legacy /dj command triggers</td>
                    <td className="py-3 px-4 text-purple-200 font-medium">
                      Primary <code className="text-purple-300 font-bold bg-black/40 px-1.5 py-0.5 rounded border border-purple-500/30">/audia</code> commands with full{" "}
                      <code className="text-[#F8F8FC] font-mono bg-black/40 px-1.5 py-0.5 rounded border border-white/10">/dj</code> alias compatibility
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-semibold text-white whitespace-nowrap">User Preference Data</td>
                    <td className="py-3 px-4 text-[#A1A4B8]">Existing preference &amp; feedback profiles</td>
                    <td className="py-3 px-4 text-purple-200 font-medium">
                      Automatically preserved and migrated with zero data loss
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* SECTION 10: PRIVACY FRAMEWORK & GOVERNANCE                */}
        {/* ========================================================= */}
        <section id="sec-10" className="mb-24 scroll-mt-28">
          <div className="pb-4 border-b border-white/[0.07] mb-8">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="font-mono text-xs font-bold text-purple-400 uppercase tracking-widest">
                Section 10
              </span>
              <span className="text-[#A1A4B8]/40">•</span>
              <span className="text-xs text-[#A1A4B8] uppercase tracking-wider">Security &amp; Stewardship</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-[#F8F8FC] tracking-tight">
              10. Privacy Framework &amp; Responsible AI Governance
            </h2>
          </div>

          <div className="space-y-6">
            {/* Critical Voice Boundary Guarantee Banner */}
            <div className="p-6 rounded-2xl bg-gradient-to-r from-purple-950/40 via-[#0D0F19] to-purple-950/40 border border-purple-500/30 space-y-2">
              <h3 className="text-xs font-bold text-purple-300 uppercase tracking-wider flex items-center gap-2">
                <Lock className="w-4 h-4 text-purple-400" />
                Strict Audio &amp; Communication Boundary Commitment
              </h3>
              <p className="text-sm text-[#F8F8FC] leading-relaxed">
                Audia AI processes only music playback interactions and track metadata where permitted.{" "}
                <strong className="text-white font-semibold">
                  Audia AI never records, listens to, transcribes, or monitors Discord voice-channel conversations,
                  microphone streams, or private user messages.
                </strong>
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="p-5 rounded-2xl bg-[#0D0F19]/60 border border-white/[0.06] space-y-2">
                <span className="text-xs font-bold text-white">Permitted Telemetry Scope</span>
                <p className="text-xs text-[#A1A4B8] leading-relaxed">
                  Limited strictly to track metadata (genre, language, mood tags), playback duration, skip events, and
                  explicit like/dislike feedback within SyncInk Radio.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-[#0D0F19]/60 border border-white/[0.06] space-y-2">
                <span className="text-xs font-bold text-white">User Control &amp; Erasure</span>
                <p className="text-xs text-[#A1A4B8] leading-relaxed">
                  Listeners can inspect, pause, or reset their individual music preference profile at any time through
                  dedicated SyncInk Radio privacy commands.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-[#0D0F19]/60 border border-white/[0.06] space-y-2">
                <span className="text-xs font-bold text-white">Purpose Limitation</span>
                <p className="text-xs text-[#A1A4B8] leading-relaxed">
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
        <section id="sec-11" className="mb-24 scroll-mt-28">
          <div className="pb-4 border-b border-white/[0.07] mb-8">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="font-mono text-xs font-bold text-purple-400 uppercase tracking-widest">
                Section 11
              </span>
              <span className="text-[#A1A4B8]/40">•</span>
              <span className="text-xs text-[#A1A4B8] uppercase tracking-wider">Innovation Trajectory</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-[#F8F8FC] tracking-tight">
              11. Strategic Future Vision &amp; Engineering Roadmap
            </h2>
          </div>

          <div className="space-y-6 text-[#A1A4B8] text-base leading-relaxed">
            <p>
              Establishing the Audia AI by SyncInk identity lays the foundation for long-term innovation in intelligent
              community audio. Upcoming engineering phases focus on three strategic initiatives:
            </p>

            <div className="space-y-4 pt-2">
              <div className="p-5 rounded-2xl bg-[#0D0F19]/60 border border-white/[0.06] space-y-1.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white">
                    Harmonic Roster Modeling (Group Personalization)
                  </h3>
                  <span className="text-[10px] font-mono text-purple-300 px-2 py-0.5 rounded bg-purple-500/10 border border-purple-500/20">
                    H1 2027
                  </span>
                </div>
                <p className="text-xs text-[#A1A4B8] leading-relaxed">
                  Expanding beyond single-listener profiling to dynamically blend the musical preferences of multiple
                  concurrent voice-channel participants into a cohesive group session.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-[#0D0F19]/60 border border-white/[0.06] space-y-1.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white">
                    Harmonic Key &amp; BPM Transition Intelligence
                  </h3>
                  <span className="text-[10px] font-mono text-purple-300 px-2 py-0.5 rounded bg-purple-500/10 border border-purple-500/20">
                    H2 2027
                  </span>
                </div>
                <p className="text-xs text-[#A1A4B8] leading-relaxed">
                  Introducing acoustic tempo and key analysis so autoplay transitions flow smoothly with natural rhythmic
                  pacing.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-[#0D0F19]/60 border border-white/[0.06] space-y-1.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white">
                    Deeper Contextual Discovery &amp; Ecosystem APIs
                  </h3>
                  <span className="text-[10px] font-mono text-purple-300 px-2 py-0.5 rounded bg-purple-500/10 border border-purple-500/20">
                    H2 2027
                  </span>
                </div>
                <p className="text-xs text-[#A1A4B8] leading-relaxed">
                  Enhancing mood and language discovery controls while offering documented integration endpoints for
                  partner Discord communities.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* SECTION 12: CONCLUSION & OFFICIAL COLOPHON                */}
        {/* ========================================================= */}
        <section id="sec-12" className="mb-20 scroll-mt-28">
          <div className="pb-4 border-b border-white/[0.07] mb-8">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="font-mono text-xs font-bold text-purple-400 uppercase tracking-widest">
                Section 12
              </span>
              <span className="text-[#A1A4B8]/40">•</span>
              <span className="text-xs text-[#A1A4B8] uppercase tracking-wider">Official Colophon</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-[#F8F8FC] tracking-tight">
              12. Conclusion &amp; Official Publication Colophon
            </h2>
          </div>

          <div className="space-y-6">
            <p className="text-base text-[#A1A4B8] leading-relaxed">
              The evolution from AI DJ to Audia AI by SyncInk marks a defining step forward for SyncInk Radio. By combining
              personalized preference modeling, genre and language awareness, mood-based discovery, and cycle-free autoplay
              under a cohesive brand identity, Audia AI delivers an intelligent, effortless listening experience built for
              modern Discord communities.
            </p>

            <div className="p-6 sm:p-8 rounded-2xl bg-[#0D0F19]/80 border border-purple-500/20 space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-[#A1A4B8]">
                <div>
                  <div className="font-bold text-[#F8F8FC] tracking-wide uppercase">
                    AUDIA AI BY SYNCINK — The Evolution of Intelligent Music Experiences
                  </div>
                  <div className="text-[11px] text-[#A1A4B8] mt-0.5">
                    Official Product Release &amp; Technical Specification | Version 1.0 Production | Published November 2026
                  </div>
                </div>

                <div className="text-[#A1A4B8] text-[11px]">
                  © {new Date().getFullYear()} SyncInk Technologies. All Rights Reserved.
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── BOTTOM ACTION BUTTONS ──────────────────────────────────── */}
        <div className="pt-10 border-t border-white/[0.07] flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/#bots"
            className="h-10 px-5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition-colors flex items-center gap-2 shadow-md shadow-purple-950/40 active:scale-[0.98]"
          >
            <span>Explore SyncInk Radio</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <Link
            href="/updates"
            className="h-10 px-5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-[#F8F8FC] font-semibold text-xs transition-colors border border-white/[0.07] flex items-center gap-2"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>Audia AI Release Notes</span>
          </Link>
          <a
            href="https://discord.gg/PmxfJwmQuB"
            target="_blank"
            rel="noopener noreferrer"
            className="h-10 px-5 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] text-[#A1A4B8] hover:text-white font-semibold text-xs transition-colors border border-white/[0.07] flex items-center gap-2"
          >
            <span>Join Beta Discord</span>
            <ExternalLink className="w-3.5 h-3.5 text-[#A1A4B8]" />
          </a>
        </div>
      </main>

      {/* ─── FLOATING BACK TO TOP BUTTON ─────────────────────────────── */}
      <AnimatePresence>
        {showBackToTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={scrollToTop}
            className="fixed bottom-6 right-6 z-40 w-10 h-10 rounded-full bg-[#121321] hover:bg-purple-600 text-[#F8F8FC] border border-white/[0.1] hover:border-purple-500 shadow-xl flex items-center justify-center transition-colors"
            title="Back to Top"
            aria-label="Back to Top"
          >
            <ArrowUp className="w-4 h-4" />
          </motion.button>
        )}
      </AnimatePresence>

      <PublicFooter />
    </div>
  );
}
