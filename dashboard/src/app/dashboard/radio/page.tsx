"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Radio,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Repeat,
  Shuffle,
  Square,
  Volume2,
  VolumeX,
  Sparkles,
  Music,
  Disc,
  Layers,
  ExternalLink,
  Copy,
  Check,
  Info,
  Shield,
  CheckCircle2,
  ChevronRight,
  ArrowLeft,
  RefreshCw,
  Sliders,
  Globe,
  ThumbsUp,
  ThumbsDown,
  Lock,
  Terminal,
  ListMusic,
  Zap,
  Search,
  HelpCircle,
  ArrowRight,
  Clock,
  Flame,
} from "lucide-react";
import { PublicNavbar } from "@/components/PublicNavbar";
import { PublicFooter } from "@/components/PublicFooter";

// Official Invite URL for SyncInk Radio
const RADIO_INVITE_URL =
  "https://discord.com/oauth2/authorize?client_id=1500567606648897819&permissions=8&scope=bot%20applications.commands";

// Sample Stations Directory
interface RadioStation {
  id: string;
  name: string;
  genre: string;
  country: string;
  flag: string;
  bitrate: string;
  description: string;
  command: string;
}

const RADIO_STATIONS: RadioStation[] = [
  {
    id: "lofi-beats",
    name: "Lofi Girl Study & Chill",
    genre: "Lo-Fi Beats",
    country: "Worldwide",
    flag: "🌐",
    bitrate: "320 kbps Opus",
    description: "24/7 relaxing beats to study, relax, and code to. Ultra smooth low-fidelity hip hop.",
    command: "/radio station:lofi",
  },
  {
    id: "synthwave",
    name: "Nightwave Plaza 80s",
    genre: "Synthwave / Cyberpunk",
    country: "USA",
    flag: "🇺🇸",
    bitrate: "320 kbps Opus",
    description: "Retro 80s synth melodies, neon vibes, and late-night outrun electronic rhythms.",
    command: "/radio station:synthwave",
  },
  {
    id: "bollywood-retro",
    name: "Bollywood Golden Melodies",
    genre: "Bollywood Romantic",
    country: "India",
    flag: "🇮🇳",
    bitrate: "192 kbps Opus",
    description: "Heartfelt romantic classics, timeless vocals, and cinematic orchestral arrangements.",
    command: "/radio station:bollywood",
  },
  {
    id: "bbc-radio-1",
    name: "BBC Radio 1",
    genre: "Top 40 & Indie Pop",
    country: "United Kingdom",
    flag: "🇬🇧",
    bitrate: "320 kbps Opus",
    description: "The UK's flagship hit radio channel featuring live host interviews and new music premieres.",
    command: "/radio station:bbc1",
  },
  {
    id: "deep-focus",
    name: "Ambient Deep Space",
    genre: "Ambient Focus",
    country: "Global",
    flag: "🌌",
    bitrate: "320 kbps Opus",
    description: "Zero-vocal drone, binaural soundscapes, and calming harmonic pads for deep concentration.",
    command: "/radio station:ambient",
  },
  {
    id: "monstercat",
    name: "Monstercat Electronic",
    genre: "EDM & Drum and Bass",
    country: "Canada",
    flag: "🇨🇦",
    bitrate: "320 kbps Opus",
    description: "High-octane electronic drops, melodic future bass, electro house, and festival anthems.",
    command: "/radio station:monstercat",
  },
];

// Interactive Slash Commands Cheatsheet
interface CommandItem {
  name: string;
  args?: string;
  category: "playback" | "queue" | "radio" | "ai";
  description: string;
  example: string;
}

const COMMANDS_LIST: CommandItem[] = [
  {
    name: "/play",
    args: "<query | url>",
    category: "playback",
    description: "Stream high-definition audio from YouTube, Spotify, or SoundCloud directly into voice.",
    example: "/play Arijit Singh Romantic Medley",
  },
  {
    name: "/search",
    args: "<query>",
    category: "playback",
    description: "Search track catalogs and choose from top 5 interactive picker options.",
    example: "/search Kesariya Brahmastra",
  },
  {
    name: "/pause",
    category: "playback",
    description: "Temporarily freeze audio stream without disconnecting from voice.",
    example: "/pause",
  },
  {
    name: "/resume",
    category: "playback",
    description: "Resume frozen audio playback with zero stutter or buffer delay.",
    example: "/resume",
  },
  {
    name: "/skip",
    category: "playback",
    description: "Immediately advance to the next track in queue or trigger Audia AI AutoPlay.",
    example: "/skip",
  },
  {
    name: "/previous",
    category: "playback",
    description: "Step back to the previously played track in the session history.",
    example: "/previous",
  },
  {
    name: "/stop",
    category: "playback",
    description: "Halt audio playback, clear active session queue, and disconnect bot gracefully.",
    example: "/stop",
  },
  {
    name: "/queue",
    category: "queue",
    description: "Display active track queue with interactive pagination and duration tally.",
    example: "/queue",
  },
  {
    name: "/nowplaying",
    category: "queue",
    description: "Summon the interactive Components V2 player card with scrubber and buttons.",
    example: "/nowplaying",
  },
  {
    name: "/volume",
    args: "<1-150>",
    category: "queue",
    description: "Adjust software amplifier gain safely without introducing digital audio clipping.",
    example: "/volume 85",
  },
  {
    name: "/loop",
    args: "<off | track | queue>",
    category: "queue",
    description: "Toggle continuous repetition modes for the single track or entire queue.",
    example: "/loop track",
  },
  {
    name: "/shuffle",
    category: "queue",
    description: "Randomly re-order the upcoming song list using cryptographic random shuffle.",
    example: "/shuffle",
  },
  {
    name: "/radio",
    args: "[station]",
    category: "radio",
    description: "Browse 50+ 24/7 global internet radio stations filtered by country flags.",
    example: "/radio lofi",
  },
  {
    name: "/lofi",
    category: "radio",
    description: "Instant shortcut to start uninterrupted 24/7 high-fidelity Lo-Fi beats.",
    example: "/lofi",
  },
  {
    name: "/autoplay",
    category: "ai",
    description: "Open the Audia AI AutoPlay control panel to set genre, mood, and language lock.",
    example: "/autoplay",
  },
  {
    name: "/audia",
    category: "ai",
    description: "Inspect active Audia AI mathematical taste vectors, memory depth, and song curation logs.",
    example: "/audia",
  },
];

export default function RadioDashboardPage() {
  // Player simulator state
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTimeSec, setCurrentTimeSec] = useState(108); // 1:48
  const [totalDurationSec] = useState(288); // 4:48
  const [volume, setVolume] = useState(80);
  const [isMuted, setIsMuted] = useState(false);
  const [loopMode, setLoopMode] = useState<"off" | "track" | "queue">("off");
  const [isShuffle, setIsShuffle] = useState(false);
  const [feedback, setFeedback] = useState<"like" | "dislike" | null>(null);
  const [activeCategory, setActiveCategory] = useState("Bollywood Romantic");

  // Commands search and filter
  const [commandCategory, setCommandCategory] = useState<"all" | "playback" | "queue" | "radio" | "ai">("all");
  const [commandSearch, setCommandSearch] = useState("");
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  // Stations filter
  const [stationSearch, setStationSearch] = useState("");

  // AutoPlay parameters
  const [languageLock, setLanguageLock] = useState("Hindi + Bollywood Romantic");
  const [autoPlayEnabled, setAutoPlayEnabled] = useState(true);
  const [zeroBleedActive, setZeroBleedActive] = useState(true);

  // Live timer for simulation
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setCurrentTimeSec((prev) => (prev >= totalDurationSec ? 0 : prev + 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [isPlaying, totalDurationSec]);

  // Copy command helper
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(text);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const filteredCommands = useMemo(() => {
    return COMMANDS_LIST.filter((cmd) => {
      const matchCat = commandCategory === "all" || cmd.category === commandCategory;
      const matchSearch =
        cmd.name.toLowerCase().includes(commandSearch.toLowerCase()) ||
        cmd.description.toLowerCase().includes(commandSearch.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [commandCategory, commandSearch]);

  const filteredStations = useMemo(() => {
    return RADIO_STATIONS.filter(
      (s) =>
        s.name.toLowerCase().includes(stationSearch.toLowerCase()) ||
        s.genre.toLowerCase().includes(stationSearch.toLowerCase()) ||
        s.country.toLowerCase().includes(stationSearch.toLowerCase())
    );
  }, [stationSearch]);

  return (
    <div className="min-h-screen bg-[#060812] text-slate-100 flex flex-col font-sans selection:bg-purple-600 selection:text-white">
      <PublicNavbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-10">
        {/* ========================================================= */}
        {/* TOP COMMAND HEADER */}
        {/* ========================================================= */}
        <div className="relative rounded-3xl bg-gradient-to-br from-[#120a22]/90 via-[#0b0818]/90 to-[#070512]/90 border border-purple-500/25 p-6 sm:p-8 lg:p-10 shadow-[0_8px_40px_rgba(168,85,247,0.15)] overflow-hidden">
          {/* Ambient top light */}
          <div className="absolute -top-32 -right-32 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-start sm:items-center gap-5">
              {/* Radio Bot Logo */}
              <div className="relative shrink-0">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-[#080512] border-2 border-purple-500/40 p-1.5 flex items-center justify-center overflow-hidden shadow-[0_0_35px_rgba(168,85,247,0.35)] ring-1 ring-purple-400/30">
                  <Image
                    src="/radio-logo.png"
                    alt="SyncInk Radio Official Logo"
                    width={96}
                    height={96}
                    className="w-full h-full object-contain rounded-2xl select-none"
                    priority
                  />
                </div>
                <div className="absolute -bottom-1 -right-1 px-2 py-0.5 rounded-md bg-purple-950/95 border border-purple-400/40 backdrop-blur-md flex items-center gap-1.5 shadow-md">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[10px] font-mono font-bold text-purple-200">OPUS 48K</span>
                </div>
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5 shadow-sm shadow-emerald-950/40">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Official Release v1.0
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-500/15 text-purple-300 border border-purple-500/30 flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-purple-400" />
                    Audia AI Engine Active
                  </span>
                  <span className="hidden sm:inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-mono text-slate-400 bg-white/5 border border-white/10">
                    ID: 1500567606648897819
                  </span>
                </div>

                <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight flex items-center gap-3">
                  <span>SyncInk Radio Dashboard</span>
                </h1>
                <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-2xl leading-relaxed">
                  Next-generation Discord audio streaming engine featuring direct 48kHz Opus extraction, 24/7 global radio directories, and continuous taste-vector AutoPlay powered natively by{" "}
                  <Link href="/audia" className="text-purple-400 hover:text-purple-300 underline font-semibold">
                    Audia AI
                  </Link>.
                </p>
              </div>
            </div>

            {/* CTA action buttons */}
            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto shrink-0">
              <a
                href={RADIO_INVITE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 sm:flex-initial h-11 px-6 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-600/30 active:scale-[0.98]"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Invite Radio Bot</span>
              </a>

              <Link
                href="/audia"
                className="flex-1 sm:flex-initial h-11 px-5 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 text-purple-200 font-bold text-xs sm:text-sm transition-colors flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span>Audia AI Spec</span>
              </Link>

              <Link
                href="/dashboard"
                className="h-11 px-4 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-slate-300 hover:text-white font-semibold text-xs flex items-center justify-center gap-2 transition-colors"
                title="Return to Multi-Bot Console"
              >
                <Layers className="w-4 h-4 text-slate-400" />
                <span className="hidden sm:inline">All Bots</span>
              </Link>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* LIVE AUDIO STREAM TELEMETRY BAR */}
        {/* ========================================================= */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 sm:p-5 rounded-2xl bg-[#0b0e1d] border border-purple-500/20 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/25 flex items-center justify-center text-purple-400 shrink-0">
              <Music className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Audio Pipeline</div>
              <div className="text-sm sm:text-base font-black text-white mt-0.5 truncate">48kHz Lossless Opus</div>
              <div className="text-[10px] text-purple-300 truncate mt-0.5">192 kbps Direct Format 251</div>
            </div>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-[#0b0e1d] border border-purple-500/20 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Audia AI Engine</div>
              <div className="text-sm sm:text-base font-black text-emerald-400 mt-0.5 truncate">AutoPlay Active</div>
              <div className="text-[10px] text-slate-400 truncate mt-0.5">Continuous Taste Vector Loop</div>
            </div>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-[#0b0e1d] border border-purple-500/20 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center text-cyan-400 shrink-0">
              <Globe className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">World Radio</div>
              <div className="text-sm sm:text-base font-black text-white mt-0.5 truncate">50+ Global Feeds</div>
              <div className="text-[10px] text-cyan-300 truncate mt-0.5">24/7 Zero Buffer Reconnect</div>
            </div>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-[#0b0e1d] border border-purple-500/20 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/25 flex items-center justify-center text-blue-400 shrink-0">
              <Zap className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Gateway Latency</div>
              <div className="text-sm sm:text-base font-black text-white mt-0.5 truncate">~11ms Real-time</div>
              <div className="text-[10px] text-emerald-400 truncate mt-0.5">Hardware Jitter Dampened</div>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* INTERACTIVE COMPONENTS V2 PLAYER CONSOLE */}
        {/* ========================================================= */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Disc className="w-5 h-5 text-purple-400 animate-spin" style={{ animationDuration: "4s" }} />
              <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                Live Components V2 Player Card
              </h2>
            </div>
            <span className="text-[11px] text-slate-400 hidden sm:inline-block">
              Simulates Discord voice playback state &amp; interactive button layout
            </span>
          </div>

          <div className="rounded-3xl bg-[#0d0918] border border-purple-500/30 p-6 sm:p-8 shadow-2xl relative overflow-hidden">
            {/* Top row: Track Title & Live Equalizer */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-white/[0.08]">
              <div className="flex items-center gap-4">
                {/* Album Art with Equalizer Overlay */}
                <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-purple-950 border border-purple-400/40 p-1 shrink-0 overflow-hidden shadow-lg shadow-purple-950/50">
                  <img
                    src="https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&auto=format&fit=crop&q=80"
                    alt="Album Art"
                    className="w-full h-full object-cover rounded-xl"
                  />
                  {isPlaying && (
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center gap-1">
                      <span className="w-1 bg-purple-400 rounded-full animate-bounce h-4" />
                      <span className="w-1 bg-purple-300 rounded-full animate-bounce h-7" style={{ animationDelay: "0.15s" }} />
                      <span className="w-1 bg-purple-400 rounded-full animate-bounce h-5" style={{ animationDelay: "0.3s" }} />
                      <span className="w-1 bg-purple-200 rounded-full animate-bounce h-3" style={{ animationDelay: "0.45s" }} />
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      Now Playing
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono text-slate-400 bg-white/5 border border-white/10">
                      48kHz Stereo
                    </span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-black text-white tracking-tight">
                    Gerua (Romantic Reprise)
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                    Artist: <span className="text-slate-200 font-semibold">Arijit Singh, Antara Mitra</span> • Album: Dilwale
                  </p>
                </div>
              </div>

              {/* Volume & Telemetry */}
              <div className="flex items-center gap-4 bg-white/[0.03] border border-white/10 rounded-2xl px-4 py-2.5 self-start md:self-auto">
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className="text-slate-400 hover:text-white transition-colors"
                  title={isMuted ? "Unmute" : "Mute"}
                >
                  {isMuted || volume === 0 ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-purple-400" />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => {
                    setVolume(Number(e.target.value));
                    setIsMuted(false);
                  }}
                  className="w-24 sm:w-28 accent-purple-500 cursor-pointer h-1.5 bg-white/10 rounded-lg"
                />
                <span className="text-xs font-mono font-bold text-slate-300 w-8 text-right">
                  {isMuted ? "0%" : `${volume}%`}
                </span>
              </div>
            </div>

            {/* Scrubber Progress Bar */}
            <div className="py-6 space-y-2">
              <div className="relative w-full h-2.5 bg-white/[0.08] rounded-full overflow-hidden cursor-pointer group"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const clickPos = (e.clientX - rect.left) / rect.width;
                  setCurrentTimeSec(Math.floor(clickPos * totalDurationSec));
                }}
              >
                <div
                  className="h-full bg-gradient-to-r from-purple-600 via-purple-400 to-indigo-400 rounded-full transition-all duration-300 relative"
                  style={{ width: `${(currentTimeSec / totalDurationSec) * 100}%` }}
                >
                  <span className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-white shadow-md opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
              <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                <span>{formatTime(currentTimeSec)}</span>
                <span className="text-[11px] text-purple-300 font-sans font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Opus 48kHz Direct Streaming
                </span>
                <span>{formatTime(totalDurationSec)}</span>
              </div>
            </div>

            {/* Discord Components V2 Two-Row Interactive Button Console */}
            <div className="space-y-3 pt-2">
              {/* Row 1: Playback Navigation Controls */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setCurrentTimeSec(0)}
                  className="flex-1 sm:flex-initial h-10 px-4 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-slate-300 hover:text-white transition-all flex items-center justify-center gap-2 text-xs font-semibold active:scale-95"
                  title="Previous Track"
                >
                  <SkipBack className="w-4 h-4" />
                  <span>Previous</span>
                </button>

                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="flex-1 sm:flex-initial h-10 px-6 rounded-xl bg-purple-600 hover:bg-purple-500 text-white transition-all flex items-center justify-center gap-2 text-xs font-bold active:scale-95 shadow-md shadow-purple-900/40"
                  title={isPlaying ? "Pause Stream" : "Resume Stream"}
                >
                  {isPlaying ? (
                    <>
                      <Pause className="w-4 h-4 fill-white" />
                      <span>Pause</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-white" />
                      <span>Play</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => {
                    setCurrentTimeSec(0);
                    setFeedback(null);
                  }}
                  className="flex-1 sm:flex-initial h-10 px-4 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-slate-300 hover:text-white transition-all flex items-center justify-center gap-2 text-xs font-semibold active:scale-95"
                  title="Skip to Next Track"
                >
                  <SkipForward className="w-4 h-4" />
                  <span>Next</span>
                </button>

                <button
                  onClick={() => {
                    if (loopMode === "off") setLoopMode("track");
                    else if (loopMode === "track") setLoopMode("queue");
                    else setLoopMode("off");
                  }}
                  className={`flex-1 sm:flex-initial h-10 px-4 rounded-xl border transition-all flex items-center justify-center gap-2 text-xs font-semibold active:scale-95 ${
                    loopMode !== "off"
                      ? "bg-purple-500/20 border-purple-500/40 text-purple-200"
                      : "bg-white/[0.04] hover:bg-white/[0.08] border-white/10 text-slate-300"
                  }`}
                  title="Cycle Repeat Mode"
                >
                  <Repeat className="w-4 h-4" />
                  <span>Loop: {loopMode.toUpperCase()}</span>
                </button>

                <button
                  onClick={() => {
                    setIsPlaying(false);
                    setCurrentTimeSec(0);
                  }}
                  className="flex-1 sm:flex-initial h-10 px-4 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/25 text-red-300 hover:text-red-200 transition-all flex items-center justify-center gap-2 text-xs font-semibold active:scale-95"
                  title="Stop Playback & Disconnect"
                >
                  <Square className="w-3.5 h-3.5 fill-red-400 text-red-400" />
                  <span>Stop</span>
                </button>
              </div>

              {/* Row 2: Queue, Shuffle, Like/Dislike Feedback */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  onClick={() => handleCopy("/queue")}
                  className="flex-1 sm:flex-initial h-9 px-4 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/10 text-slate-300 hover:text-white transition-all flex items-center justify-center gap-2 text-xs font-medium"
                >
                  <ListMusic className="w-3.5 h-3.5 text-slate-400" />
                  <span>Queue (14 Tracks)</span>
                </button>

                <button
                  onClick={() => setIsShuffle(!isShuffle)}
                  className={`flex-1 sm:flex-initial h-9 px-4 rounded-xl border transition-all flex items-center justify-center gap-2 text-xs font-medium ${
                    isShuffle
                      ? "bg-purple-500/20 border-purple-500/40 text-purple-200"
                      : "bg-white/[0.03] hover:bg-white/[0.07] border-white/10 text-slate-300"
                  }`}
                >
                  <Shuffle className="w-3.5 h-3.5 text-purple-400" />
                  <span>Shuffle: {isShuffle ? "ON" : "OFF"}</span>
                </button>

                {/* Taste Feedback Buttons */}
                <div className="flex items-center gap-1.5 ml-auto">
                  <span className="text-[11px] text-slate-400 font-medium mr-1 hidden sm:inline">Taste Feedback:</span>
                  <button
                    onClick={() => setFeedback(feedback === "like" ? null : "like")}
                    className={`h-9 px-3 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${
                      feedback === "like"
                        ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300 shadow-sm shadow-emerald-950/50"
                        : "bg-white/[0.03] hover:bg-white/[0.07] border-white/10 text-slate-300"
                    }`}
                    title="Thumbs Up - Strengthen Category Preference"
                  >
                    <ThumbsUp className={`w-3.5 h-3.5 ${feedback === "like" ? "text-emerald-400 fill-emerald-400" : ""}`} />
                    <span>Like</span>
                  </button>

                  <button
                    onClick={() => setFeedback(feedback === "dislike" ? null : "dislike")}
                    className={`h-9 px-3 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${
                      feedback === "dislike"
                        ? "bg-red-500/20 border-red-500/40 text-red-300 shadow-sm shadow-red-950/50"
                        : "bg-white/[0.03] hover:bg-white/[0.07] border-white/10 text-slate-300"
                    }`}
                    title="Thumbs Down - Teach Audia AI to Skip Similar Tracks"
                  >
                    <ThumbsDown className={`w-3.5 h-3.5 ${feedback === "dislike" ? "text-red-400 fill-red-400" : ""}`} />
                    <span>Dislike</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Audia AI AutoPlay Up Next Banner */}
            <div className="mt-6 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-purple-950/40 via-[#130b22]/70 to-[#0e091a]/80 border border-purple-500/25 relative overflow-hidden">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start sm:items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center shrink-0 shadow-inner">
                    <img
                      src="/audia-symbol.png"
                      alt="Audia AI"
                      className="w-5 h-5 object-contain"
                    />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span>Audia AI • Up Next (AutoPlay)</span>
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                        Category: {activeCategory}
                      </span>
                    </div>
                    <p className="text-xs text-purple-200/90 mt-1">
                      <strong className="text-white">Zaalima</strong> (Raees) • Arijit Singh &amp; Harshdeep Kaur
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5 italic">
                      Curation Reason: Maintains melodic romantic acoustic vibe with matching vocal harmonic resonance.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                  <button
                    onClick={() => setAutoPlayEnabled(!autoPlayEnabled)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                      autoPlayEnabled
                        ? "bg-purple-600 text-white border-purple-400 shadow-sm"
                        : "bg-white/5 text-slate-400 border-white/10"
                    }`}
                  >
                    AutoPlay: {autoPlayEnabled ? "ENABLED" : "PAUSED"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* WORLD 24/7 RADIO DIRECTORY */}
        {/* ========================================================= */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg sm:text-xl font-black text-white tracking-tight flex items-center gap-2">
                <Radio className="w-5 h-5 text-purple-400" />
                <span>Global 24/7 Radio Stations Directory</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Zero-buffer internet radio stations streaming worldwide 24/7 without disconnects.
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search stations or genres..."
                value={stationSearch}
                onChange={(e) => setStationSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredStations.map((station) => (
              <div
                key={station.id}
                className="p-5 rounded-2xl bg-[#0b0e1d] border border-white/[0.08] hover:border-purple-500/40 transition-all flex flex-col justify-between group shadow-lg"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-2xl select-none" title={station.country}>
                      {station.flag}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono text-purple-300 bg-purple-500/10 border border-purple-500/20">
                      {station.bitrate}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white group-hover:text-purple-300 transition-colors">
                    {station.name}
                  </h3>
                  <div className="text-[11px] font-semibold text-purple-400 mt-0.5">
                    {station.genre} • {station.country}
                  </div>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                    {station.description}
                  </p>
                </div>

                <div className="mt-5 pt-4 border-t border-white/[0.06] flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleCopy(station.command)}
                    className="flex-1 py-2 px-3 rounded-xl bg-purple-600/15 hover:bg-purple-600/30 border border-purple-500/30 text-purple-200 font-mono text-xs font-semibold transition-all flex items-center justify-center gap-2 active:scale-95"
                    title="Copy Discord command"
                  >
                    {copiedCmd === station.command ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-300 font-sans font-bold">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-purple-400" />
                        <span>{station.command}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ========================================================= */}
        {/* AUDIA AI TASTE VECTOR TUNING PANEL */}
        {/* ========================================================= */}
        <section className="rounded-3xl bg-gradient-to-r from-[#12091f]/90 via-[#0b0816]/90 to-[#0e091d]/90 border border-purple-500/25 p-6 sm:p-8 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                  Audia AI Autonomous Taste Tuning
                </h2>
                <p className="text-xs text-slate-400">
                  Configure real-time vector modeling, language boundaries, and deduplication memory.
                </p>
              </div>
            </div>

            <Link
              href="/audia"
              className="text-xs font-bold text-purple-300 hover:text-white flex items-center gap-1.5 bg-purple-500/15 border border-purple-500/30 px-3 py-1.5 rounded-lg transition-colors shrink-0"
            >
              <span>Read Full Architecture</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Setting 1: Strict Zero-Bleed Language Lock */}
            <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white uppercase tracking-wider">Language Lock</span>
                <button
                  onClick={() => setZeroBleedActive(!zeroBleedActive)}
                  className={`w-9 h-5 rounded-full p-0.5 transition-colors ${
                    zeroBleedActive ? "bg-purple-600" : "bg-white/20"
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white transition-transform ${
                      zeroBleedActive ? "translate-x-4" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Prevents foreign or dissimilar linguistic streams from bleeding into active listening sessions.
              </p>
              <div className="pt-2">
                <select
                  value={languageLock}
                  onChange={(e) => {
                    setLanguageLock(e.target.value);
                    setActiveCategory(e.target.value);
                  }}
                  className="w-full bg-[#0a0715] border border-purple-500/30 rounded-xl px-3 py-2 text-xs text-purple-200 focus:outline-none focus:border-purple-400 font-medium"
                >
                  <option value="Bollywood Romantic">Hindi (Bollywood Romantic)</option>
                  <option value="English Pop & Rock">English (Pop / Rock / Indie)</option>
                  <option value="Lo-Fi Instrumental">Instrumental (Lo-Fi Study)</option>
                  <option value="Punjabi Upbeat">Punjabi (Upbeat / Folk)</option>
                  <option value="Synthwave Retro">Electronic (Synthwave / EDM)</option>
                </select>
              </div>
            </div>

            {/* Setting 2: Deduplication Memory Depth */}
            <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white uppercase tracking-wider">Memory Depth</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/25">
                  250 Tracks
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Anti-repetition vector memory prevents duplicate song playback within dynamic AutoPlay sessions.
              </p>
              <div className="pt-2 flex items-center gap-2 text-xs text-emerald-400">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Zero repetition cycle active across listeners</span>
              </div>
            </div>

            {/* Setting 3: Listener Preference Vectorization */}
            <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white uppercase tracking-wider">Per-User Vectors</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-500/15 text-purple-300 border border-purple-500/25">
                  Multi-Profile
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Every Discord guild member develops an isolated taste profile that dynamically factors skips, likes, and play duration.
              </p>
              <div className="pt-2 flex items-center gap-2 text-xs text-purple-300">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-purple-400" />
                <span>Skip duration penalty learning active</span>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* COMPREHENSIVE SLASH COMMANDS REFERENCE */}
        {/* ========================================================= */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg sm:text-xl font-black text-white tracking-tight flex items-center gap-2">
                <Terminal className="w-5 h-5 text-purple-400" />
                <span>Official Slash Commands Cheatsheet</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Full reference of commands supported natively by SyncInk Radio in Discord.
              </p>
            </div>

            {/* Filter Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-white/[0.03] border border-white/10">
              {(["all", "playback", "queue", "radio", "ai"] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCommandCategory(cat)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-all ${
                    commandCategory === cat
                      ? "bg-purple-600 text-white shadow-sm"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {cat === "ai" ? "Audia AI" : cat}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {filteredCommands.map((cmd) => (
              <div
                key={cmd.name}
                className="p-4 rounded-2xl bg-[#0b0e1d] border border-white/[0.08] hover:border-purple-500/30 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 font-mono text-xs">
                      <span className="font-bold text-white group-hover:text-purple-300 transition-colors">
                        {cmd.name}
                      </span>
                      {cmd.args && <span className="text-purple-400 font-semibold">{cmd.args}</span>}
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-white/5 text-slate-400 border border-white/10">
                      {cmd.category}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">{cmd.description}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-white/[0.04] flex items-center justify-between gap-2 text-xs">
                  <span className="font-mono text-[11px] text-slate-500 truncate max-w-[240px]">
                    {cmd.example}
                  </span>
                  <button
                    onClick={() => handleCopy(cmd.example)}
                    className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-slate-400 hover:text-white transition-colors"
                    title="Copy command"
                  >
                    {copiedCmd === cmd.example ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ========================================================= */}
        {/* BOT SETUP QUICKSTART CARD */}
        {/* ========================================================= */}
        <section className="p-6 sm:p-8 rounded-3xl bg-[#0c0919] border border-purple-500/30 shadow-2xl relative overflow-hidden">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="space-y-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30">
                Quick Setup
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Get Started with SyncInk Radio in Under 30 Seconds
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
                1. Invite the bot with official permissions. 2. Join any voice channel in your Discord server. 3. Type{" "}
                <code className="text-purple-300 bg-white/5 px-1.5 py-0.5 rounded">/play &lt;song&gt;</code> or{" "}
                <code className="text-purple-300 bg-white/5 px-1.5 py-0.5 rounded">/lofi</code> to experience lossless 48kHz audio.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <a
                href={RADIO_INVITE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="h-11 px-6 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs sm:text-sm transition-all flex items-center gap-2 shadow-lg shadow-purple-600/30 active:scale-95"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Authorize &amp; Invite</span>
              </a>

              <a
                href="https://discord.gg/PmxfJwmQuB"
                target="_blank"
                rel="noopener noreferrer"
                className="h-11 px-5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-slate-300 hover:text-white font-semibold text-xs sm:text-sm transition-colors flex items-center gap-2"
              >
                <span>Support Server</span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
              </a>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
