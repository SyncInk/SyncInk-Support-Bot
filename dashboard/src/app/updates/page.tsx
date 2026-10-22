"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Zap,
  Shield,
  Bug,
  Search,
  Calendar,
  ExternalLink,
  GitCommit,
  Layers,
  ArrowRight,
  Filter,
  CheckCircle2,
  RefreshCw,
  Tag,
  Radio,
  MessageSquare,
  Bookmark,
  Activity,
  Boxes,
} from "lucide-react";
import { PublicNavbar } from "@/components/PublicNavbar";
import { PublicFooter } from "@/components/PublicFooter";

/* ─── Interfaces ──────────────────────────────────────────────────────── */

interface CuratedRelease {
  id: number | string;
  version: string;
  title: string;
  release_date: string;
  badge: string;
  summary: string;
  products: string[];
  features: string[];
  improvements: string[];
  fixes: string[];
  status: string;
}

interface ChangelogCommit {
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

const BADGE_STYLES: Record<string, { bg: string; border: string; text: string }> = {
  LATEST: {
    bg: "bg-blue-500/15",
    border: "border-blue-500/30",
    text: "text-blue-300",
  },
  SECURITY: {
    bg: "bg-emerald-500/15",
    border: "border-emerald-500/30",
    text: "text-emerald-300",
  },
  FEATURE: {
    bg: "bg-cyan-500/15",
    border: "border-cyan-500/30",
    text: "text-cyan-300",
  },
  MAJOR: {
    bg: "bg-purple-500/15",
    border: "border-purple-500/30",
    text: "text-purple-300",
  },
  STABLE: {
    bg: "bg-slate-500/15",
    border: "border-slate-500/30",
    text: "text-slate-300",
  },
};

const PRODUCT_ICONS: Record<string, React.ElementType> = {
  "Support Bot": Shield,
  "Ticket Bot": MessageSquare,
  "Voice Bot": Radio,
  Platform: Boxes,
  Dashboard: Layers,
};

export default function UpdatesPage() {
  const [activeTab, setActiveTab] = useState<"curated" | "commits">("curated");
  const [releases, setReleases] = useState<CuratedRelease[]>([]);
  const [commits, setCommits] = useState<ChangelogCommit[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedProduct, setSelectedProduct] = useState<string>("ALL");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");

  useEffect(() => {
    async function loadUpdates() {
      try {
        const res = await fetch("/api/updates");
        if (res.ok) {
          const data = await res.json();
          setReleases(data.releases || []);
          setCommits(data.commits || []);
        }
      } catch (err) {
        console.error("Failed to fetch updates:", err);
      } finally {
        setLoading(false);
      }
    }
    loadUpdates();
  }, []);

  // Filtered Curated Releases
  const filteredReleases = useMemo(() => {
    return releases.filter((release) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        release.version.toLowerCase().includes(q) ||
        release.title.toLowerCase().includes(q) ||
        release.summary.toLowerCase().includes(q) ||
        release.features.some((f) => f.toLowerCase().includes(q)) ||
        release.improvements.some((i) => i.toLowerCase().includes(q)) ||
        release.fixes.some((fx) => fx.toLowerCase().includes(q));

      const matchesProduct =
        selectedProduct === "ALL" ||
        release.products.some((p) => p.toLowerCase().includes(selectedProduct.toLowerCase()));

      const matchesCategory =
        selectedCategory === "ALL" ||
        (selectedCategory === "features" && release.features.length > 0) ||
        (selectedCategory === "improvements" && release.improvements.length > 0) ||
        (selectedCategory === "fixes" && release.fixes.length > 0);

      return matchesSearch && matchesProduct && matchesCategory;
    });
  }, [releases, searchQuery, selectedProduct, selectedCategory]);

  // Filtered Commits
  const filteredCommits = useMemo(() => {
    return commits.filter((c) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        c.message.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.botName.toLowerCase().includes(q) ||
        c.author.toLowerCase().includes(q);

      const matchesProduct =
        selectedProduct === "ALL" ||
        c.botName.toLowerCase().includes(selectedProduct.toLowerCase());

      return matchesSearch && matchesProduct;
    });
  }, [commits, searchQuery, selectedProduct]);

  return (
    <div className="min-h-screen bg-[#060812] text-slate-100 flex flex-col font-sans selection:bg-brand-blue selection:text-white">
      <PublicNavbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
        {/* Header Hero */}
        <div className="relative border-b border-white/[0.08] pb-10 sm:pb-12 mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs font-semibold uppercase tracking-wider mb-4">
            <Activity className="w-3.5 h-3.5 text-blue-400" />
            <span>Official Changelog & Platform Releases</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Updates &amp; Release Notes
          </h1>
          <p className="text-base sm:text-lg text-slate-400 max-w-2xl mt-3 leading-relaxed">
            Curated version releases, architectural security enhancements, and real-time development
            logs across the entire SyncInk ecosystem.
          </p>

          {/* Mode Switcher Tabs */}
          <div className="mt-8 flex items-center gap-3">
            <button
              onClick={() => setActiveTab("curated")}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
                activeTab === "curated"
                  ? "bg-blue-600 text-white shadow-[0_0_20px_rgba(88,101,242,0.35)]"
                  : "bg-white/[0.04] text-slate-400 hover:text-slate-200 hover:bg-white/[0.08] border border-white/5"
              }`}
            >
              <Bookmark className="w-4 h-4" />
              <span>Curated Releases</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-white/20 text-white">
                {releases.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("commits")}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
                activeTab === "commits"
                  ? "bg-blue-600 text-white shadow-[0_0_20px_rgba(88,101,242,0.35)]"
                  : "bg-white/[0.04] text-slate-400 hover:text-slate-200 hover:bg-white/[0.08] border border-white/5"
              }`}
            >
              <GitCommit className="w-4 h-4" />
              <span>Live Commit Feed</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-white/20 text-white">
                {commits.length}
              </span>
            </button>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-8 bg-white/[0.02] border border-white/[0.06] p-4 rounded-2xl">
          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search updates, features, fixes..."
              className="w-full bg-[#0d1020] border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          {/* Product Filter Buttons */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <span className="text-xs font-semibold text-slate-400 mr-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Product:
            </span>
            {["ALL", "Support Bot", "Ticket Bot", "Voice Bot", "Platform"].map((prod) => (
              <button
                key={prod}
                onClick={() => setSelectedProduct(prod)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  selectedProduct === prod
                    ? "bg-white/15 text-white border border-white/20"
                    : "bg-white/[0.03] text-slate-400 hover:text-slate-200 border border-white/[0.05]"
                }`}
              >
                {prod === "ALL" ? "All Products" : prod}
              </button>
            ))}
          </div>

          {/* Category Filter (Active only in curated tab) */}
          {activeTab === "curated" && (
            <div className="flex items-center gap-2 w-full md:w-auto">
              <span className="text-xs font-semibold text-slate-400 mr-1">Category:</span>
              {[
                { id: "ALL", label: "All" },
                { id: "features", label: "Features" },
                { id: "improvements", label: "Improvements" },
                { id: "fixes", label: "Fixes" },
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    selectedCategory === cat.id
                      ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                      : "bg-white/[0.03] text-slate-400 hover:text-slate-200 border border-white/[0.05]"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Content Section */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-44 bg-white/[0.02] border border-white/[0.06] rounded-2xl animate-pulse"
              />
            ))}
          </div>
        ) : activeTab === "curated" ? (
          /* Curated Releases View */
          <div className="space-y-6">
            {filteredReleases.length === 0 ? (
              <div className="text-center py-16 bg-white/[0.02] border border-white/[0.06] rounded-2xl">
                <Bookmark className="w-10 h-10 text-slate-500 mx-auto mb-3 opacity-60" />
                <h3 className="text-base font-bold text-white">No release notes match your query</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Try clearing your search term or switching products.
                </p>
              </div>
            ) : (
              filteredReleases.map((release) => {
                const badgeStyle =
                  BADGE_STYLES[release.badge.toUpperCase()] || BADGE_STYLES.STABLE;

                return (
                  <motion.article
                    key={release.version}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className="bg-[#0b0e1d]/90 border border-white/[0.08] hover:border-white/15 rounded-2xl p-6 sm:p-8 transition-all relative overflow-hidden shadow-sm"
                  >
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.06] pb-5 mb-5">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="text-xl sm:text-2xl font-black text-white font-mono tracking-tight">
                          {release.version}
                        </span>

                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border ${badgeStyle.bg} ${badgeStyle.border} ${badgeStyle.text}`}
                        >
                          {release.badge}
                        </span>

                        <div className="flex items-center gap-1.5 text-xs text-slate-400 ml-1">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{release.release_date}</span>
                        </div>
                      </div>

                      {/* Product Badges */}
                      <div className="flex flex-wrap items-center gap-1.5">
                        {release.products.map((prod) => {
                          const Icon = PRODUCT_ICONS[prod] || Boxes;
                          return (
                            <span
                              key={prod}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white/[0.04] border border-white/[0.06] text-xs font-medium text-slate-300"
                            >
                              <Icon className="w-3 h-3 text-sky-400" />
                              <span>{prod}</span>
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    {/* Title & Executive Summary */}
                    <div className="mb-6">
                      <h2 className="text-lg sm:text-xl font-bold text-slate-100">
                        {release.title}
                      </h2>
                      <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                        {release.summary}
                      </p>
                    </div>

                    {/* Categorized Changes */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-white/[0.05]">
                      {/* Features */}
                      {release.features && release.features.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>New Features</span>
                          </h4>
                          <ul className="space-y-2">
                            {release.features.map((feat, idx) => (
                              <li
                                key={idx}
                                className="text-xs text-slate-300 leading-relaxed pl-3 relative before:content-[''] before:w-1.5 before:h-1.5 before:bg-cyan-400 before:rounded-full before:absolute before:left-0 before:top-1.5"
                              >
                                {feat}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Improvements */}
                      {release.improvements && release.improvements.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                            <Zap className="w-3.5 h-3.5" />
                            <span>Improvements</span>
                          </h4>
                          <ul className="space-y-2">
                            {release.improvements.map((imp, idx) => (
                              <li
                                key={idx}
                                className="text-xs text-slate-300 leading-relaxed pl-3 relative before:content-[''] before:w-1.5 before:h-1.5 before:bg-blue-400 before:rounded-full before:absolute before:left-0 before:top-1.5"
                              >
                                {imp}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Fixes */}
                      {release.fixes && release.fixes.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                            <Bug className="w-3.5 h-3.5" />
                            <span>Fixes &amp; Security</span>
                          </h4>
                          <ul className="space-y-2">
                            {release.fixes.map((fix, idx) => (
                              <li
                                key={idx}
                                className="text-xs text-slate-300 leading-relaxed pl-3 relative before:content-[''] before:w-1.5 before:h-1.5 before:bg-emerald-400 before:rounded-full before:absolute before:left-0 before:top-1.5"
                              >
                                {fix}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </motion.article>
                );
              })
            )}
          </div>
        ) : (
          /* Live Commits View */
          <div className="space-y-4">
            {filteredCommits.length === 0 ? (
              <div className="text-center py-16 bg-white/[0.02] border border-white/[0.06] rounded-2xl">
                <GitCommit className="w-10 h-10 text-slate-500 mx-auto mb-3 opacity-60" />
                <h3 className="text-base font-bold text-white">No repository commits found</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Check your filter or search keywords.
                </p>
              </div>
            ) : (
              filteredCommits.map((commit) => (
                <div
                  key={commit.id}
                  className="bg-[#0b0e1d]/70 border border-white/[0.06] hover:border-white/15 rounded-xl p-4 sm:p-5 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1 max-w-2xl">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-white/[0.05] border border-white/10 text-slate-300">
                        {commit.botName}
                      </span>
                      {commit.tags.map((t) => (
                        <span
                          key={t}
                          className="text-[11px] font-medium px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                    <h3 className="text-sm font-semibold text-white pt-1">{commit.message}</h3>
                    {commit.description && (
                      <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                        {commit.description}
                      </p>
                    )}
                    <div className="flex items-center gap-3 text-xs text-slate-500 pt-1">
                      <span>By {commit.author}</span>
                      <span>•</span>
                      <span>{new Date(commit.date).toLocaleDateString()}</span>
                      <span>•</span>
                      <span className="font-mono text-slate-400">
                        {commit.sha.substring(0, 7)}
                      </span>
                    </div>
                  </div>

                  <a
                    href={commit.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="self-start sm:self-center px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-xs font-medium text-slate-300 hover:text-white border border-white/10 flex items-center gap-1.5 transition-all shrink-0"
                  >
                    <span>Inspect</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              ))
            )}
          </div>
        )}
      </main>

      <PublicFooter />
    </div>
  );
}
