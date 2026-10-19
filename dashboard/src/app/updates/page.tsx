"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  GitCommit,
  Calendar,
  Filter,
  ExternalLink,
  Sparkles,
  Bug,
  Wrench,
  RefreshCw,
  Zap,
  FileText,
  ArrowUpRight,
  Clock,
  Tag,
  ChevronDown,
  Search,
  Shield,
  MessageSquare,
  Radio,
} from "lucide-react";
import { PublicNavbar } from "@/components/PublicNavbar";
import { PublicFooter } from "@/components/PublicFooter";

/* ─── Types ──────────────────────────────────────────────────────────── */

interface ChangelogEntry {
  id: string;
  repo: string;
  botName: string;
  accent: string;
  message: string;
  description: string;
  author: string;
  date: string;
  sha: string;
  url: string;
  tags: string[];
}

/* ─── Constants ──────────────────────────────────────────────────────── */

const ACCENT_MAP: Record<
  string,
  {
    border: string;
    bg: string;
    text: string;
    glow: string;
    icon: React.ElementType;
    dot: string;
    tagBg: string;
    tagBorder: string;
    tagText: string;
  }
> = {
  violet: {
    border: "border-violet-500/30",
    bg: "bg-violet-500/10",
    text: "text-violet-300",
    glow: "shadow-[0_0_20px_rgba(139,92,246,0.15)]",
    icon: Shield,
    dot: "bg-violet-400",
    tagBg: "bg-violet-500/12",
    tagBorder: "border-violet-500/25",
    tagText: "text-violet-300",
  },
  blue: {
    border: "border-blue-500/30",
    bg: "bg-blue-500/10",
    text: "text-blue-300",
    glow: "shadow-[0_0_20px_rgba(59,130,246,0.15)]",
    icon: MessageSquare,
    dot: "bg-blue-400",
    tagBg: "bg-blue-500/12",
    tagBorder: "border-blue-500/25",
    tagText: "text-blue-300",
  },
  cyan: {
    border: "border-cyan-500/30",
    bg: "bg-cyan-500/10",
    text: "text-cyan-300",
    glow: "shadow-[0_0_20px_rgba(6,182,212,0.15)]",
    icon: Radio,
    dot: "bg-cyan-400",
    tagBg: "bg-cyan-500/12",
    tagBorder: "border-cyan-500/25",
    tagText: "text-cyan-300",
  },
};

const TAG_ICONS: Record<string, React.ElementType> = {
  Feature: Sparkles,
  "Bug Fix": Bug,
  Maintenance: Wrench,
  Refactor: RefreshCw,
  Performance: Zap,
  Documentation: FileText,
};

const FILTER_OPTIONS = [
  { key: "all", label: "All Bots" },
  { key: "SyncInk-Support-Bot", label: "Support & Security" },
  { key: "SyncInk-Ticket", label: "Ticket Bot" },
  { key: "SyncInk-Voice", label: "Voice Bot" },
];

/* ─── Helpers ────────────────────────────────────────────────────────── */

function relativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;

  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;

  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w ago`;

  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;

  return `${Math.floor(months / 12)}y ago`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function groupByDate(
  entries: ChangelogEntry[]
): { dateKey: string; label: string; entries: ChangelogEntry[] }[] {
  const grouped = new Map<string, ChangelogEntry[]>();

  entries.forEach((entry) => {
    const d = new Date(entry.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const existing = grouped.get(key) || [];
    existing.push(entry);
    grouped.set(key, existing);
  });

  return Array.from(grouped.entries()).map(([dateKey, entries]) => {
    const d = new Date(entries[0].date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    let label: string;
    if (d.toDateString() === today.toDateString()) {
      label = "Today";
    } else if (d.toDateString() === yesterday.toDateString()) {
      label = "Yesterday";
    } else {
      label = d.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      });
    }

    return { dateKey, label, entries };
  });
}

/* ─── Component ──────────────────────────────────────────────────────── */

export default function UpdatesPage() {
  const [entries, setEntries] = useState<ChangelogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(40);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/updates");
        if (!res.ok) throw new Error("fetch failed");
        const data = await res.json();
        setEntries(data.entries || []);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = useMemo(() => {
    let result = entries;
    if (filter !== "all") {
      result = result.filter((e) => e.repo === filter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (e) =>
          e.message.toLowerCase().includes(q) ||
          e.description.toLowerCase().includes(q) ||
          e.tags.some((t) => t.toLowerCase().includes(q)) ||
          e.botName.toLowerCase().includes(q)
      );
    }
    return result;
  }, [entries, filter, search]);

  const visible = filtered.slice(0, visibleCount);
  const grouped = groupByDate(visible);
  const hasMore = visibleCount < filtered.length;

  // Stats
  const stats = useMemo(() => {
    const features = entries.filter((e) => e.tags.includes("Feature")).length;
    const fixes = entries.filter((e) => e.tags.includes("Bug Fix")).length;
    const total = entries.length;
    const repos = new Set(entries.map((e) => e.repo)).size;
    return { features, fixes, total, repos };
  }, [entries]);

  return (
    <div className="min-h-screen bg-[#060812] text-slate-100 flex flex-col font-sans selection:bg-brand-blue selection:text-white relative overflow-x-hidden">
      <PublicNavbar />

      <main className="relative z-10 flex-1">
        {/* ─── Hero ─────────────────────────────────────────────── */}
        <section className="pt-20 sm:pt-28 pb-10 sm:pb-14 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/25 text-violet-300 text-xs font-bold uppercase tracking-widest mb-5">
              <GitCommit className="w-3.5 h-3.5" />
              <span>Live Changelog</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.1] mb-4">
              Updates &{" "}
              <span className="bg-gradient-to-r from-blue-400 via-violet-400 to-cyan-300 bg-clip-text text-transparent">
                Changelog
              </span>
            </h1>

            <p className="text-sm sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
              Every feature, fix, and improvement shipped across the SyncInk
              ecosystem — pulled directly from our engineering pipeline.
            </p>
          </motion.div>

          {/* ─── Stats Strip ────────────────────────────────────── */}
          {!loading && !error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.4 }}
              className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3"
            >
              <div className="text-center p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                <div className="text-2xl sm:text-3xl font-black text-white">
                  {stats.total}
                </div>
                <div className="text-[11px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider mt-0.5">
                  Total Commits
                </div>
              </div>
              <div className="text-center p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                <div className="text-2xl sm:text-3xl font-black text-emerald-400">
                  {stats.features}
                </div>
                <div className="text-[11px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider mt-0.5">
                  New Features
                </div>
              </div>
              <div className="text-center p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                <div className="text-2xl sm:text-3xl font-black text-amber-400">
                  {stats.fixes}
                </div>
                <div className="text-[11px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider mt-0.5">
                  Bug Fixes
                </div>
              </div>
              <div className="text-center p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                <div className="text-2xl sm:text-3xl font-black text-violet-400">
                  {stats.repos}
                </div>
                <div className="text-[11px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider mt-0.5">
                  Active Repos
                </div>
              </div>
            </motion.div>
          )}
        </section>

        {/* ─── Controls ─────────────────────────────────────────── */}
        <section className="px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto mb-8">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search updates..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0e121d] border border-white/[0.08] text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-violet-500/40 focus:ring-1 focus:ring-violet-500/20 transition-all"
              />
            </div>

            {/* Filter Dropdown */}
            <div className="relative">
              <button
                onClick={() => setFilterOpen(!filterOpen)}
                className="w-full sm:w-auto flex items-center justify-between gap-2 px-4 py-2.5 rounded-xl bg-[#0e121d] border border-white/[0.08] text-sm font-semibold text-slate-200 hover:border-white/15 transition-all min-w-[180px]"
              >
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-slate-400" />
                  <span>
                    {FILTER_OPTIONS.find((f) => f.key === filter)?.label}
                  </span>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 transition-transform ${filterOpen ? "rotate-180" : ""}`}
                />
              </button>

              <AnimatePresence>
                {filterOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-1.5 w-full sm:w-56 rounded-xl bg-[#0e121d] border border-white/[0.1] shadow-2xl z-30 overflow-hidden"
                  >
                    {FILTER_OPTIONS.map((opt) => (
                      <button
                        key={opt.key}
                        onClick={() => {
                          setFilter(opt.key);
                          setFilterOpen(false);
                          setVisibleCount(40);
                        }}
                        className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors ${
                          filter === opt.key
                            ? "bg-violet-500/15 text-white"
                            : "text-slate-300 hover:bg-white/[0.04] hover:text-white"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </section>

        {/* ─── Timeline ─────────────────────────────────────────── */}
        <section className="px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto pb-16">
          {loading && (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-8 h-8 border-2 border-violet-500/30 border-t-violet-400 rounded-full animate-spin" />
              <p className="text-sm text-slate-400">
                Fetching latest commits...
              </p>
            </div>
          )}

          {error && (
            <div className="text-center py-20">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/10 border border-red-500/25 flex items-center justify-center">
                <Bug className="w-7 h-7 text-red-400" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">
                Failed to load updates
              </h3>
              <p className="text-sm text-slate-400 mb-6">
                GitHub API may be rate-limited. Try again in a few minutes.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-bold transition-colors"
              >
                Retry
              </button>
            </div>
          )}

          {!loading && !error && filtered.length === 0 && (
            <div className="text-center py-20">
              <Search className="w-12 h-12 text-slate-500 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-white mb-2">
                No matching updates
              </h3>
              <p className="text-sm text-slate-400">
                Try a different search term or filter.
              </p>
            </div>
          )}

          {!loading && !error && grouped.length > 0 && (
            <div className="space-y-10">
              {grouped.map((group, groupIdx) => (
                <motion.div
                  key={group.dateKey}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: groupIdx * 0.04, duration: 0.35 }}
                >
                  {/* Date Header */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                        {group.label}
                      </span>
                    </div>
                    <div className="flex-1 h-px bg-gradient-to-r from-white/[0.06] to-transparent" />
                    <span className="text-[11px] text-slate-500 font-mono">
                      {group.entries.length} update
                      {group.entries.length !== 1 ? "s" : ""}
                    </span>
                  </div>

                  {/* Entries */}
                  <div className="space-y-2.5 pl-1">
                    {group.entries.map((entry) => {
                      const accent =
                        ACCENT_MAP[entry.accent] || ACCENT_MAP.violet;
                      const AccentIcon = accent.icon;
                      const primaryTag = entry.tags[0];
                      const TagIcon = primaryTag
                        ? TAG_ICONS[primaryTag]
                        : undefined;

                      return (
                        <div
                          key={entry.id}
                          className={`group relative rounded-xl bg-[#0b0e1a]/80 border ${accent.border} hover:border-opacity-60 transition-all duration-200 ${accent.glow} hover:shadow-lg`}
                        >
                          <div className="flex items-start gap-3.5 p-4">
                            {/* Timeline dot */}
                            <div
                              className={`mt-1 flex-shrink-0 w-8 h-8 rounded-lg ${accent.bg} border ${accent.border} flex items-center justify-center`}
                            >
                              <AccentIcon
                                className={`w-4 h-4 ${accent.text}`}
                              />
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              {/* Top row: bot name + time */}
                              <div className="flex items-center justify-between gap-2 mb-1.5">
                                <div className="flex items-center gap-2 min-w-0">
                                  <span
                                    className={`text-[11px] font-bold uppercase tracking-wider ${accent.text}`}
                                  >
                                    {entry.botName}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-mono shrink-0">
                                  <Clock className="w-3 h-3" />
                                  <span>{relativeTime(entry.date)}</span>
                                </div>
                              </div>

                              {/* Commit message */}
                              <h3 className="text-sm sm:text-[15px] font-semibold text-white leading-snug mb-1.5 group-hover:text-white/95">
                                {entry.message}
                              </h3>

                              {entry.description && (
                                <p className="text-xs text-slate-400 leading-relaxed mb-2 line-clamp-2">
                                  {entry.description}
                                </p>
                              )}

                              {/* Tags + SHA + Link */}
                              <div className="flex flex-wrap items-center gap-2">
                                {entry.tags.map((tag) => {
                                  const TIcon = TAG_ICONS[tag];
                                  return (
                                    <span
                                      key={tag}
                                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold ${accent.tagBg} border ${accent.tagBorder} ${accent.tagText}`}
                                    >
                                      {TIcon && <TIcon className="w-3 h-3" />}
                                      {tag}
                                    </span>
                                  );
                                })}

                                <span className="text-[11px] text-slate-500 font-mono">
                                  {entry.sha.substring(0, 7)}
                                </span>

                                <a
                                  href={entry.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-white transition-colors ml-auto opacity-0 group-hover:opacity-100"
                                >
                                  <span>View commit</span>
                                  <ArrowUpRight className="w-3 h-3" />
                                </a>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              ))}

              {/* Load More */}
              {hasMore && (
                <div className="text-center pt-4">
                  <button
                    onClick={() => setVisibleCount((v) => v + 30)}
                    className="px-6 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm font-semibold text-slate-300 hover:text-white hover:bg-white/[0.06] hover:border-white/[0.12] transition-all"
                  >
                    Load more updates ({filtered.length - visibleCount}{" "}
                    remaining)
                  </button>
                </div>
              )}
            </div>
          )}
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
