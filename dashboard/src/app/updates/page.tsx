"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { motion, AnimatePresence, MotionConfig } from "framer-motion";
import {
  Sparkles,
  Zap,
  Shield,
  Bug,
  Search,
  Calendar,
  GitCommit,
  Layers,
  Filter,
  CheckCircle2,
  Radio,
  MessageSquare,
  Bookmark,
  Activity,
  Boxes,
  Link2,
  Check,
  ChevronDown,
  ChevronsUpDown,
  X,
  ArrowUp,
  Share2,
  Copy,
} from "lucide-react";
import { PublicNavbar } from "@/components/PublicNavbar";
import { PublicFooter } from "@/components/PublicFooter";
import { spring, ease, transition } from "@/lib/motion-tokens";

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

const PRODUCT_FILTERS = [
  "ALL",
  "Audia AI",
  "SyncInk Radio",
  "Support Bot",
  "Higher Administrators",
  "Boosters",
  "Ticket Bot",
  "Voice Bot",
  "Platform",
] as const;

const CATEGORY_FILTERS = [
  { id: "ALL", label: "All" },
  { id: "features", label: "Features" },
  { id: "improvements", label: "Improvements" },
  { id: "fixes", label: "Fixes" },
] as const;

const BADGE_STYLES: Record<string, { bg: string; border: string; text: string }> = {
  "AUDIA AI V1.0": {
    bg: "bg-purple-500/10",
    border: "border-purple-500/25",
    text: "text-purple-300",
  },
  "AUDIA AI": {
    bg: "bg-purple-500/10",
    border: "border-purple-500/25",
    text: "text-purple-300",
  },
  "AI DJ": {
    bg: "bg-purple-500/10",
    border: "border-purple-500/25",
    text: "text-purple-300",
  },
  "ADMIN & BOOSTERS": {
    bg: "bg-fuchsia-500/10",
    border: "border-fuchsia-500/25",
    text: "text-fuchsia-300",
  },
  LATEST: {
    bg: "bg-blue-500/10",
    border: "border-blue-500/25",
    text: "text-blue-300",
  },
  SECURITY: {
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/25",
    text: "text-emerald-300",
  },
  FEATURE: {
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/25",
    text: "text-cyan-300",
  },
  MAJOR: {
    bg: "bg-indigo-500/10",
    border: "border-indigo-500/25",
    text: "text-indigo-300",
  },
  STABLE: {
    bg: "bg-white/[0.04]",
    border: "border-white/[0.1]",
    text: "text-slate-300",
  },
};

const PRODUCT_ICONS: Record<string, React.ElementType> = {
  "Support Bot": Shield,
  "Higher Administrators": Shield,
  Boosters: Sparkles,
  "SyncInk Radio": Radio,
  "Audia AI": Sparkles,
  Radio: Radio,
  "Ticket Bot": MessageSquare,
  "Voice Bot": Radio,
  Platform: Boxes,
  Dashboard: Layers,
};

const CHANNEL_NAME_MAP: Record<string, string> = {
  "1520460587522330634": "guides",
  "1520460624864350218": "faq",
  "1520460764937322566": "support-tickets",
  "1520460808499363840": "support-chat",
  "1520461481857122485": "general",
  "1546548728721178724": "feature-request",
  "1520749466330857492": "music-commands",
  "1558585414829211668": "booster-perks",
  "1558589470469525504": "vip-support",
  "1539301185423413398": "developer-apply",
  "1539319001673367604": "staff-apply",
  "1544361954574073916": "ask-ai",
  "1541796896199417906": "incident-recovery",
};

function getReleaseSlug(version: string): string {
  return `release-${String(version).toLowerCase().replace(/[^a-z0-9]/g, "-")}`;
}

function formatRelativeDate(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const diffMs = Date.now() - d.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffHours < 1) return "Just now";
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays}d ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/**
 * Parses markdown bold (**text**), markdown links [label](url),
 * Discord custom emojis (<:name:id> or <a:name:id>), inline code (`code`),
 * and channel mentions (<#id>) into clean React nodes.
 */
function renderInlineFragment(text: string): React.ReactNode {
  if (!text) return null;

  const tokenRegex =
    /(\[.*?\]\(https?:\/\/[^\s)]+\)|<#[0-9]+>|<(?:a)?:[a-zA-Z0-9_~-]+:[0-9]+>|`[^`]+`|\*\*.*?\*\*)/g;

  const parts = text.split(tokenRegex);

  return parts.map((part, pIdx) => {
    if (!part) return null;

    // 1. Markdown Link: [label](url)
    const linkMatch = part.match(/^\[(.*?)\]\((https?:\/\/[^\s)]+)\)$/);
    if (linkMatch) {
      const label = linkMatch[1];
      const url = linkMatch[2];
      return (
        <a
          key={`link-${pIdx}`}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-400 hover:text-blue-300 underline underline-offset-2 font-medium transition-colors inline-flex items-center gap-0.5 mx-0.5 break-words"
        >
          {renderInlineFragment(label)}
        </a>
      );
    }

    // 2. Channel Mention: <#id>
    const chMatch = part.match(/^<#([0-9]+)>$/);
    if (chMatch) {
      const id = chMatch[1];
      const channelName = CHANNEL_NAME_MAP[id] || `channel-${id.slice(-4)}`;
      const discordUrl = `https://discord.com/channels/1520457643842342912/${id}`;

      return (
        <a
          key={`ch-${id}-${pIdx}`}
          href={discordUrl}
          target="_blank"
          rel="noopener noreferrer"
          title={`Open #${channelName} in Discord`}
          className="inline-flex items-center px-1.5 py-0.5 rounded bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 hover:text-white font-mono text-[11px] font-medium border border-blue-500/20 transition-colors mx-0.5 align-middle select-none"
        >
          #{channelName}
        </a>
      );
    }

    // 3. Custom Discord Emoji: <:name:id> or <a:name:id>
    const emojiMatch = part.match(/^<(a)?:([a-zA-Z0-9_~-]+):([0-9]+)>$/);
    if (emojiMatch) {
      const isAnimated = emojiMatch[1] === "a";
      const name = emojiMatch[2];
      const id = emojiMatch[3];
      const ext = isAnimated ? "gif" : "png";
      const src = `https://cdn.discordapp.com/emojis/${id}.${ext}?size=48&quality=lossless`;

      return (
        <img
          key={`emoji-${id}-${pIdx}`}
          src={src}
          alt={`:${name}:`}
          title={`:${name}:`}
          className="inline-block w-4 h-4 sm:w-[18px] sm:h-[18px] align-middle mx-0.5 object-contain select-none"
          loading="lazy"
        />
      );
    }

    // 4. Inline Code: `code`
    const codeMatch = part.match(/^`([^`]+)`$/);
    if (codeMatch) {
      const code = codeMatch[1];
      return (
        <code
          key={`code-${pIdx}`}
          className="px-1.5 py-0.5 rounded bg-white/[0.06] text-slate-200 border border-white/[0.1] font-mono text-[12px] mx-0.5 align-middle break-words"
        >
          {code}
        </code>
      );
    }

    // 5. Bold: **text**
    const boldMatch = part.match(/^\*\*(.*?)\*\*$/);
    if (boldMatch) {
      const boldText = boldMatch[1];
      return (
        <strong key={`bold-${pIdx}`} className="text-white font-semibold">
          {renderInlineFragment(boldText)}
        </strong>
      );
    }

    return part;
  });
}

function renderFormattedContent(content: string): React.ReactNode {
  if (!content) return null;

  const lines = content.split("\n");
  if (lines.length === 1) {
    return renderInlineFragment(lines[0]);
  }

  return (
    <div className="space-y-1.5">
      {lines.map((line, lIdx) => (
        <div key={`line-${lIdx}`} className={lIdx > 0 ? "pl-2.5 sm:pl-3 text-slate-300" : ""}>
          {renderInlineFragment(line)}
        </div>
      ))}
    </div>
  );
}

function ProductBadgeIcon({ product }: { product: string }) {
  if (product === "SyncInk Radio") {
    return (
      <img
        src="/radio-logo.png"
        alt=""
        className="w-3.5 h-3.5 rounded object-contain shrink-0"
      />
    );
  }
  if (product === "Audia AI") {
    return (
      <img
        src="/audia-symbol.png"
        alt=""
        className="w-3.5 h-3.5 object-contain shrink-0"
      />
    );
  }
  const Icon = PRODUCT_ICONS[product] || Boxes;
  return <Icon className="w-3 h-3 text-blue-400 shrink-0" />;
}

/* ─── Interactive Release Card ────────────────────────────────────────── */

function ReleaseCard({
  release,
  slug,
  isLatest,
  isExpanded,
  isTarget,
  copiedSlug,
  activeSection,
  onToggleExpand,
  onShare,
  onSelectSection,
  onFilterProduct,
}: {
  release: CuratedRelease;
  slug: string;
  isLatest: boolean;
  isExpanded: boolean;
  isTarget: boolean;
  copiedSlug: string | null;
  activeSection: "all" | "features" | "improvements" | "fixes";
  onToggleExpand: (slug: string) => void;
  onShare: (slug: string, release: CuratedRelease) => void;
  onSelectSection: (slug: string, section: "all" | "features" | "improvements" | "fixes") => void;
  onFilterProduct: (prod: string) => void;
}) {
  const badgeStyle = BADGE_STYLES[release.badge.toUpperCase()] || BADGE_STYLES.STABLE;
  const featCount = release.features?.length || 0;
  const impCount = release.improvements?.length || 0;
  const fixCount = release.fixes?.length || 0;
  const totalChanges = featCount + impCount + fixCount;

  const availableSections = [
    { id: "all" as const, label: "All", count: totalChanges },
    ...(featCount > 0 ? [{ id: "features" as const, label: "Features", count: featCount }] : []),
    ...(impCount > 0 ? [{ id: "improvements" as const, label: "Improvements", count: impCount }] : []),
    ...(fixCount > 0 ? [{ id: "fixes" as const, label: "Fixes", count: fixCount }] : []),
  ];

  const showFeatures = featCount > 0 && (activeSection === "all" || activeSection === "features");
  const showImprovements = impCount > 0 && (activeSection === "all" || activeSection === "improvements");
  const showFixes = fixCount > 0 && (activeSection === "all" || activeSection === "fixes");

  return (
    <motion.article
      id={slug}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={transition.enter}
      className="relative sm:pl-7 group scroll-mt-32 lg:scroll-mt-24"
    >
      {/* Timeline Node & Vertical Spine (Desktop/Tablet) */}
      <div
        className={`hidden sm:flex absolute left-0 top-6 w-3 h-3 rounded-full border-2 items-center justify-center z-10 transition-colors ${
          isLatest
            ? "bg-emerald-400 border-[#060812] ring-4 ring-emerald-500/15"
            : isExpanded || isTarget
            ? "bg-blue-500 border-[#060812] ring-4 ring-blue-500/15"
            : "bg-[#1a2033] border-[#060812] group-hover:bg-slate-400"
        }`}
      />

      <div
        className={`rounded-xl bg-[#0c0f18] border transition-colors overflow-hidden ${
          isTarget
            ? "border-blue-500/50 ring-1 ring-blue-500/25"
            : isExpanded
            ? "border-white/[0.12]"
            : "border-white/[0.08] hover:border-white/[0.14]"
        }`}
      >
        {/* Interactive Accordion Header */}
        <div
          role="button"
          tabIndex={0}
          aria-expanded={isExpanded}
          onClick={() => onToggleExpand(slug)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onToggleExpand(slug);
            }
          }}
          className="p-4 sm:p-6 cursor-pointer select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-t-xl"
        >
          {/* Row 1: Version + Badge + Date + Actions */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 min-w-0">
              <span className="text-base sm:text-xl font-mono font-semibold text-white tracking-tight tabular-nums">
                {release.version}
              </span>

              <span
                className={`px-2 py-0.5 rounded text-[11px] font-mono font-medium border ${badgeStyle.bg} ${badgeStyle.border} ${badgeStyle.text}`}
              >
                {release.badge}
              </span>

              {isLatest && (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  Latest
                </span>
              )}

              <span className="inline-flex items-center gap-1 text-xs font-mono text-slate-400 tabular-nums">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                {release.release_date}
              </span>
            </div>

            {/* Action buttons (stop propagation so clicking Share doesn't collapse) */}
            <div
              className="flex items-center gap-1.5 shrink-0"
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => onShare(slug, release)}
                className="min-h-[34px] min-w-[34px] px-2.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-slate-300 hover:text-white text-xs font-medium transition-colors inline-flex items-center justify-center gap-1.5 active:scale-[0.97] touch-manipulation"
                title="Share direct link to this update"
              >
                {copiedSlug === slug ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="hidden sm:inline text-emerald-300">Copied</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-3.5 h-3.5 text-slate-400 sm:hidden" />
                    <Link2 className="w-3.5 h-3.5 text-slate-400 hidden sm:inline" />
                    <span className="hidden sm:inline">Share</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => onToggleExpand(slug)}
                aria-label={isExpanded ? "Collapse release notes" : "Expand release notes"}
                className="min-h-[34px] min-w-[34px] px-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-slate-300 hover:text-white transition-colors inline-flex items-center justify-center active:scale-[0.97] touch-manipulation"
              >
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-200 ${
                    isExpanded ? "rotate-180 text-white" : "text-slate-400"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Row 2: Title + Executive Summary */}
          <div className="mt-3 space-y-1.5 min-w-0">
            <h2 className="text-base sm:text-lg font-semibold text-white leading-snug break-words">
              {renderFormattedContent(release.title)}
            </h2>
            <div className="text-xs sm:text-sm text-slate-400 leading-relaxed break-words">
              {renderFormattedContent(release.summary)}
            </div>
          </div>

          {/* Row 3: Product Tags + Quick Impact Counts */}
          <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div
              className="flex flex-wrap items-center gap-1.5"
              onClick={(e) => e.stopPropagation()}
            >
              {release.products.map((prod) => (
                <button
                  key={prod}
                  type="button"
                  onClick={() => onFilterProduct(prod)}
                  title={`Filter updates by ${prod}`}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.07] text-[11px] font-medium text-slate-300 hover:text-white transition-colors touch-manipulation"
                >
                  <ProductBadgeIcon product={prod} />
                  <span>{prod}</span>
                </button>
              ))}
            </div>

            {!isExpanded && totalChanges > 0 && (
              <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono text-slate-400 tabular-nums">
                {featCount > 0 && <span className="text-cyan-400">{featCount} features</span>}
                {impCount > 0 && <span className="text-blue-400">{impCount} improvements</span>}
                {fixCount > 0 && <span className="text-emerald-400">{fixCount} fixes</span>}
                <span className="text-slate-300 underline underline-offset-2 ml-1">Tap to read</span>
              </div>
            )}
          </div>
        </div>

        {/* Collapsible Release Changelog Body */}
        <AnimatePresence initial={false}>
          {isExpanded && (
            <motion.div
              key="body"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.24, ease: ease.inOut }}
              className="overflow-hidden border-t border-white/[0.06]"
            >
              <div className="p-4 sm:p-6 bg-[#090c14]/70 space-y-5">
                {/* In-card Section Filter Switcher (only when multiple change categories exist) */}
                {availableSections.length > 2 && (
                  <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-0.5">
                    {availableSections.map((sec) => {
                      const isActive = activeSection === sec.id;
                      return (
                        <button
                          key={sec.id}
                          type="button"
                          onClick={() => onSelectSection(slug, sec.id)}
                          className={`relative shrink-0 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors touch-manipulation flex items-center gap-1.5 ${
                            isActive
                              ? "text-white"
                              : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]"
                          }`}
                        >
                          {isActive && (
                            <motion.span
                              layoutId={`card-sec-${slug}`}
                              transition={spring.snappy}
                              className="absolute inset-0 rounded-lg bg-white/[0.09] border border-white/[0.12]"
                            />
                          )}
                          <span className="relative z-10">{sec.label}</span>
                          <span className="relative z-10 text-[10px] font-mono text-slate-400 tabular-nums">
                            {sec.count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}

                <div className="space-y-5">
                  {/* New Features */}
                  {showFeatures && (
                    <div className="rounded-lg bg-white/[0.02] border border-white/[0.06] p-4 sm:p-5">
                      <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5 mb-3">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>New features ({featCount})</span>
                      </h3>
                      <ul className="space-y-2.5">
                        {release.features.map((feat, idx) => (
                          <li
                            key={idx}
                            className="text-xs sm:text-sm text-slate-300 leading-relaxed pl-3.5 relative break-words min-w-0 before:content-[''] before:w-1.5 before:h-1.5 before:bg-cyan-400 before:rounded-full before:absolute before:left-0 before:top-2"
                          >
                            {renderFormattedContent(feat)}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Improvements */}
                  {showImprovements && (
                    <div className="rounded-lg bg-white/[0.02] border border-white/[0.06] p-4 sm:p-5">
                      <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-blue-400 flex items-center gap-1.5 mb-3">
                        <Zap className="w-3.5 h-3.5" />
                        <span>Improvements ({impCount})</span>
                      </h3>
                      <ul className="space-y-2">
                        {release.improvements.map((imp, idx) => (
                          <li
                            key={idx}
                            className="text-xs sm:text-sm text-slate-300 leading-relaxed pl-3.5 relative break-words min-w-0 before:content-[''] before:w-1.5 before:h-1.5 before:bg-blue-400 before:rounded-full before:absolute before:left-0 before:top-2"
                          >
                            {renderFormattedContent(imp)}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Fixes & Security */}
                  {showFixes && (
                    <div className="rounded-lg bg-white/[0.02] border border-white/[0.06] p-4 sm:p-5">
                      <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5 mb-3">
                        <Bug className="w-3.5 h-3.5" />
                        <span>Fixes &amp; security ({fixCount})</span>
                      </h3>
                      <ul className="space-y-2">
                        {release.fixes.map((fix, idx) => (
                          <li
                            key={idx}
                            className="text-xs sm:text-sm text-slate-300 leading-relaxed pl-3.5 relative break-words min-w-0 before:content-[''] before:w-1.5 before:h-1.5 before:bg-emerald-400 before:rounded-full before:absolute before:left-0 before:top-2"
                          >
                            {renderFormattedContent(fix)}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.article>
  );
}

/* ─── Page Component ──────────────────────────────────────────────────── */

export default function UpdatesPage() {
  const [activeTab, setActiveTab] = useState<"curated" | "commits">("curated");
  const [releases, setReleases] = useState<CuratedRelease[]>([]);
  const [commits, setCommits] = useState<ChangelogCommit[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedProduct, setSelectedProduct] = useState<string>("ALL");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");

  const [expandedSlugs, setExpandedSlugs] = useState<Set<string>>(new Set());
  const [sectionBySlug, setSectionBySlug] = useState<
    Record<string, "all" | "features" | "improvements" | "fixes">
  >({});
  const [expandedCommits, setExpandedCommits] = useState<Set<string>>(new Set());

  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const [copiedSha, setCopiedSha] = useState<string | null>(null);
  const [highlightedSlug, setHighlightedSlug] = useState<string | null>(null);
  const [showBackToTop, setShowBackToTop] = useState<boolean>(false);

  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function loadUpdates() {
      try {
        const res = await fetch("/api/updates");
        if (res.ok) {
          const data = await res.json();
          const fetchedReleases: CuratedRelease[] = data.releases || [];
          setReleases(fetchedReleases);
          setCommits(data.commits || []);
          if (fetchedReleases.length > 0) {
            const latestSlug = getReleaseSlug(fetchedReleases[0].version);
            setExpandedSlugs((prev) => new Set(prev).add(latestSlug));
          }
        }
      } catch (err) {
        console.error("Failed to fetch updates:", err);
      } finally {
        setLoading(false);
      }
    }
    loadUpdates();
  }, []);

  // Keyboard shortcut '/' to focus search
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (
        e.key === "/" &&
        document.activeElement?.tagName !== "INPUT" &&
        document.activeElement?.tagName !== "TEXTAREA"
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // Floating back-to-top threshold
  useEffect(() => {
    function onScroll() {
      setShowBackToTop(window.scrollY > 420);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Handle direct permalink navigation on load / hashchange
  useEffect(() => {
    if (typeof window === "undefined" || releases.length === 0) return;

    function handleHashScroll() {
      const hash = window.location.hash.replace("#", "");
      if (!hash) return;

      const matched = releases.find(
        (r) => getReleaseSlug(r.version) === hash || r.version === hash
      );
      const targetSlug = matched ? getReleaseSlug(matched.version) : hash;

      setHighlightedSlug(targetSlug);
      setActiveTab("curated");
      setExpandedSlugs((prev) => new Set(prev).add(targetSlug));

      setTimeout(() => {
        const el = document.getElementById(targetSlug);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 280);
    }

    handleHashScroll();
    window.addEventListener("hashchange", handleHashScroll);
    return () => window.removeEventListener("hashchange", handleHashScroll);
  }, [releases]);

  const jumpToRelease = useCallback((version: string) => {
    const slug = getReleaseSlug(version);
    setActiveTab("curated");
    setHighlightedSlug(slug);
    setExpandedSlugs((prev) => new Set(prev).add(slug));
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", `#${slug}`);
      setTimeout(() => {
        const el = document.getElementById(slug);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 120);
    }
  }, []);

  const handleToggleExpand = useCallback((slug: string) => {
    setExpandedSlugs((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) {
        next.delete(slug);
      } else {
        next.add(slug);
      }
      return next;
    });
  }, []);

  const handleSelectSection = useCallback(
    (slug: string, sec: "all" | "features" | "improvements" | "fixes") => {
      setSectionBySlug((prev) => ({ ...prev, [slug]: sec }));
    },
    []
  );

  const handleShareRelease = useCallback(async (slug: string, release: CuratedRelease) => {
    if (typeof window === "undefined") return;
    const shareUrl = `${window.location.origin}/updates#${slug}`;
    window.history.replaceState(null, "", `#${slug}`);
    setHighlightedSlug(slug);

    // Use Web Share sheet natively on supporting mobile browsers when user taps Share
    if (typeof navigator !== "undefined" && typeof navigator.share === "function" && window.innerWidth < 640) {
      try {
        await navigator.share({
          title: `SyncInk ${release.version}`,
          text: release.summary.slice(0, 140),
          url: shareUrl,
        });
        return;
      } catch {
        // User dismissed share sheet or share unavailable; copy to clipboard cleanly
      }
    }

    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl).catch(() => {});
    }
    setCopiedSlug(slug);
    setTimeout(() => {
      setCopiedSlug((prev) => (prev === slug ? null : prev));
    }, 2200);
  }, []);

  const handleCopySha = useCallback((sha: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(sha).catch(() => {});
    }
    setCopiedSha(sha);
    setTimeout(() => {
      setCopiedSha((prev) => (prev === sha ? null : prev));
    }, 1800);
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

  // Sync per-card section tab with global category filter (and clear when reset to ALL)
  useEffect(() => {
    if (selectedCategory === "ALL") {
      setSectionBySlug({});
    } else {
      const mapped = selectedCategory as "features" | "improvements" | "fixes";
      setSectionBySlug((prev) => {
        const next = { ...prev };
        releases.forEach((r) => {
          next[getReleaseSlug(r.version)] = mapped;
        });
        return next;
      });
    }
  }, [selectedCategory, releases]);

  // Ensure the top matching release is expanded when filtering/searching yields results
  useEffect(() => {
    if (filteredReleases.length === 0) return;
    if (!searchQuery.trim() && selectedProduct === "ALL" && selectedCategory === "ALL") return;

    setExpandedSlugs((prev) => {
      const anyVisibleExpanded = filteredReleases.some((r) =>
        prev.has(getReleaseSlug(r.version))
      );
      if (anyVisibleExpanded) return prev;
      const next = new Set(prev);
      next.add(getReleaseSlug(filteredReleases[0].version));
      return next;
    });
  }, [filteredReleases, searchQuery, selectedProduct, selectedCategory]);

  // Filtered Commits
  const filteredCommits = useMemo(() => {
    const productKeywordMap: Record<string, string[]> = {
      "support bot": ["support", "security"],
      "ticket bot": ["ticket"],
      "voice bot": ["voice"],
      "syncink radio": ["radio"],
      "audia ai": ["audia"],
    };

    return commits.filter((c) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        c.message.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.botName.toLowerCase().includes(q) ||
        c.author.toLowerCase().includes(q);

      const selLow = selectedProduct.toLowerCase();
      const botLow = c.botName.toLowerCase();
      const keywords = productKeywordMap[selLow];
      const matchesProduct =
        selectedProduct === "ALL" ||
        botLow.includes(selLow) ||
        (keywords ? keywords.some((kw) => botLow.includes(kw)) : false);

      return matchesSearch && matchesProduct;
    });
  }, [commits, searchQuery, selectedProduct]);

  const hasActiveFilters =
    searchQuery.trim().length > 0 ||
    selectedProduct !== "ALL" ||
    (activeTab === "curated" && selectedCategory !== "ALL");

  const resetFilters = () => {
    setSearchQuery("");
    setSelectedProduct("ALL");
    setSelectedCategory("ALL");
  };

  const allFilteredExpanded =
    filteredReleases.length > 0 &&
    filteredReleases.every((r) => expandedSlugs.has(getReleaseSlug(r.version)));

  const toggleAllReleases = () => {
    if (allFilteredExpanded) {
      setExpandedSlugs(new Set());
    } else {
      setExpandedSlugs(new Set(filteredReleases.map((r) => getReleaseSlug(r.version))));
    }
  };

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen bg-[#060812] text-slate-100 flex flex-col font-sans overflow-x-hidden">
        <PublicNavbar />

        <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12 min-w-0">
          {/* Header Hero */}
          <div className="border-b border-white/[0.08] pb-6 sm:pb-8 mb-6">
            <div className="flex items-center gap-2 text-xs font-mono text-blue-400 mb-2">
              <Activity className="w-3.5 h-3.5" />
              <span>Changelog &amp; releases</span>
            </div>

            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-4xl font-semibold text-white tracking-tight">
                  Updates &amp; release notes
                </h1>
                <p className="text-xs sm:text-sm text-slate-400 max-w-2xl mt-2 leading-relaxed">
                  Curated version releases, security upgrades, and live repository telemetry across SyncInk bots and dashboards.
                </p>
              </div>

              {/* Animated Segmented Tab Switcher (Full-width on Mobile) */}
              <div className="grid grid-cols-2 sm:inline-flex p-1 rounded-xl bg-[#0c0f18] border border-white/[0.08] shrink-0">
                <button
                  type="button"
                  onClick={() => setActiveTab("curated")}
                  className={`relative px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors flex items-center justify-center gap-2 touch-manipulation ${
                    activeTab === "curated"
                      ? "text-white"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {activeTab === "curated" && (
                    <motion.span
                      layoutId="activeMainTab"
                      transition={spring.snappy}
                      className="absolute inset-0 rounded-lg bg-blue-600"
                    />
                  )}
                  <Bookmark className="w-3.5 h-3.5 relative z-10 shrink-0" />
                  <span className="relative z-10 truncate">Releases</span>
                  <span className="relative z-10 text-[11px] font-mono px-1.5 py-0.5 rounded bg-black/25 text-white/90 tabular-nums">
                    {releases.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("commits")}
                  className={`relative px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors flex items-center justify-center gap-2 touch-manipulation ${
                    activeTab === "commits"
                      ? "text-white"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {activeTab === "commits" && (
                    <motion.span
                      layoutId="activeMainTab"
                      transition={spring.snappy}
                      className="absolute inset-0 rounded-lg bg-blue-600"
                    />
                  )}
                  <GitCommit className="w-3.5 h-3.5 relative z-10 shrink-0" />
                  <span className="relative z-10 truncate">Live Feed</span>
                  <span className="relative z-10 text-[11px] font-mono px-1.5 py-0.5 rounded bg-black/25 text-white/90 tabular-nums">
                    {commits.length}
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Interactive Filter Toolbar */}
          <div className="bg-[#0c0f18] border border-white/[0.08] p-3 sm:p-4 rounded-xl mb-5 space-y-3">
            {/* Search Row + Expand/Reset Controls */}
            <div className="flex flex-col sm:flex-row gap-2.5 sm:items-center justify-between">
              <div className="relative flex-1 sm:max-w-sm">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search updates, versions, fixes..."
                  className="w-full h-10 bg-[#060812] border border-white/[0.1] rounded-lg pl-9 pr-14 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                />
                {searchQuery ? (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    aria-label="Clear search"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded text-slate-400 hover:text-white touch-manipulation"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono text-slate-500 bg-white/[0.04] border border-white/[0.08] rounded absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
                    /
                  </kbd>
                )}
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-2">
                {activeTab === "curated" && (
                  <div className="grid grid-cols-4 sm:inline-flex p-0.5 rounded-lg bg-[#060812] border border-white/[0.08] flex-1 sm:flex-initial">
                    {CATEGORY_FILTERS.map((cat) => {
                      const active = selectedCategory === cat.id;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setSelectedCategory(cat.id)}
                          className={`relative px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors text-center touch-manipulation ${
                            active ? "text-white" : "text-slate-400 hover:text-slate-200"
                          }`}
                        >
                          {active && (
                            <motion.span
                              layoutId="activeCategoryPill"
                              transition={spring.snappy}
                              className="absolute inset-0 rounded-md bg-white/[0.1]"
                            />
                          )}
                          <span className="relative z-10">{cat.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {activeTab === "curated" && filteredReleases.length > 0 && (
                  <button
                    type="button"
                    onClick={toggleAllReleases}
                    className="h-9 px-3 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-medium text-slate-300 hover:text-white transition-colors inline-flex items-center gap-1.5 shrink-0 touch-manipulation"
                    title={allFilteredExpanded ? "Collapse all release notes" : "Expand all release notes"}
                  >
                    <ChevronsUpDown className="w-3.5 h-3.5 text-slate-400" />
                    <span className="hidden sm:inline">
                      {allFilteredExpanded ? "Collapse all" : "Expand all"}
                    </span>
                  </button>
                )}

                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="h-9 px-2.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/25 text-xs font-medium text-blue-300 transition-colors shrink-0 touch-manipulation"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>

            {/* Product Filter Rail: Single Swipeable Row on Mobile, Wrapped on Desktop */}
            <div className="flex items-center gap-2 pt-2 border-t border-white/[0.06]">
              <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider shrink-0 flex items-center gap-1">
                <Filter className="w-3 h-3" />
                <span className="hidden sm:inline">Product</span>
              </span>
              <div className="flex flex-nowrap sm:flex-wrap items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 min-w-0 flex-1">
                {PRODUCT_FILTERS.map((prod) => {
                  const active = selectedProduct === prod;
                  return (
                    <button
                      key={prod}
                      type="button"
                      onClick={() => setSelectedProduct(prod)}
                      className={`relative shrink-0 min-h-[32px] px-2.5 py-1 rounded-lg text-xs font-medium transition-colors whitespace-nowrap touch-manipulation inline-flex items-center gap-1.5 ${
                        active
                          ? "bg-white/[0.12] text-white border border-white/[0.2]"
                          : "bg-white/[0.02] text-slate-400 hover:text-slate-200 border border-white/[0.06]"
                      }`}
                    >
                      {prod !== "ALL" && <ProductBadgeIcon product={prod} />}
                      <span>{prod === "ALL" ? "All products" : prod}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Mobile Quick-Jump Version Bar (Sticky under navbar on phones/tablets) */}
          {!loading && activeTab === "curated" && filteredReleases.length > 1 && (
            <div className="lg:hidden sticky top-16 z-30 -mx-4 px-4 py-2 mb-4 bg-[#060812]/90 backdrop-blur-md border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 shrink-0">
                  Jump
                </span>
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                  {filteredReleases.map((r, idx) => {
                    const slug = getReleaseSlug(r.version);
                    const isFocused = highlightedSlug === slug;
                    return (
                      <button
                        key={r.version}
                        type="button"
                        onClick={() => jumpToRelease(r.version)}
                        className={`shrink-0 px-2.5 py-1 rounded-md text-[11px] font-mono transition-colors touch-manipulation ${
                          isFocused
                            ? "bg-blue-600 text-white"
                            : idx === 0
                            ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                            : "bg-white/[0.04] text-slate-300 border border-white/[0.06]"
                        }`}
                      >
                        {r.version}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Main Content Area */}
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-36 bg-[#0c0f18] border border-white/[0.08] rounded-xl animate-pulse"
                />
              ))}
            </div>
          ) : (
            <AnimatePresence mode="wait">
              {activeTab === "curated" ? (
                <motion.div
                  key="curated-view"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={transition.enter}
                  className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start min-w-0"
                >
                  {/* Releases Timeline Feed */}
                  <div className="lg:col-span-9 min-w-0">
                    {filteredReleases.length === 0 ? (
                      <div className="text-center py-14 bg-[#0c0f18] border border-white/[0.08] rounded-xl px-4">
                        <Bookmark className="w-8 h-8 text-slate-500 mx-auto mb-3 opacity-60" />
                        <h3 className="text-sm sm:text-base font-semibold text-white">
                          No release notes match your filter
                        </h3>
                        <p className="text-xs text-slate-400 mt-1 mb-4">
                          Try clearing the search query or switching products.
                        </p>
                        {hasActiveFilters && (
                          <button
                            type="button"
                            onClick={resetFilters}
                            className="h-9 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-colors"
                          >
                            Reset filters
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="relative space-y-4 sm:space-y-5">
                        {/* Vertical Timeline Rail */}
                        <div className="hidden sm:block absolute left-[5px] top-8 bottom-8 w-px bg-white/[0.08] pointer-events-none" />

                        {filteredReleases.map((release, idx) => {
                          const slug = getReleaseSlug(release.version);
                          const isLatest =
                            idx === 0 && !hasActiveFilters;
                          const isTarget =
                            highlightedSlug === slug ||
                            highlightedSlug === release.version;
                          const isExpanded = expandedSlugs.has(slug);
                          const activeSection = sectionBySlug[slug] || "all";

                          return (
                            <ReleaseCard
                              key={release.version}
                              release={release}
                              slug={slug}
                              isLatest={isLatest}
                              isExpanded={isExpanded}
                              isTarget={isTarget}
                              copiedSlug={copiedSlug}
                              activeSection={activeSection}
                              onToggleExpand={handleToggleExpand}
                              onShare={handleShareRelease}
                              onSelectSection={handleSelectSection}
                              onFilterProduct={(prod) => setSelectedProduct(prod)}
                            />
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Desktop Sticky Timeline Index */}
                  <aside className="hidden lg:block lg:col-span-3 sticky top-24 space-y-4">
                    <div className="rounded-xl bg-[#0c0f18] border border-white/[0.08] p-4">
                      <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-white/[0.06]">
                        <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400">
                          Release index
                        </h3>
                        <span className="text-[11px] font-mono text-slate-500 tabular-nums">
                          {filteredReleases.length}/{releases.length}
                        </span>
                      </div>

                      <nav className="space-y-1 max-h-[60vh] overflow-y-auto pr-1">
                        {filteredReleases.map((r, idx) => {
                          const slug = getReleaseSlug(r.version);
                          const isOpen = expandedSlugs.has(slug);
                          const isFocused = highlightedSlug === slug;
                          return (
                            <button
                              key={r.version}
                              type="button"
                              onClick={() => jumpToRelease(r.version)}
                              className={`w-full text-left px-2.5 py-2 rounded-lg transition-colors flex items-center justify-between gap-2 ${
                                isFocused
                                  ? "bg-blue-500/15 border border-blue-500/25 text-white"
                                  : isOpen
                                  ? "bg-white/[0.05] text-slate-200 border border-transparent"
                                  : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.03] border border-transparent"
                              }`}
                            >
                              <div className="min-w-0">
                                <div className="text-xs font-mono font-medium truncate">
                                  {r.version}
                                </div>
                                <div className="text-[10px] font-mono text-slate-500 tabular-nums">
                                  {r.release_date}
                                </div>
                              </div>
                              {idx === 0 && (
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                              )}
                            </button>
                          );
                        })}
                      </nav>
                    </div>
                  </aside>
                </motion.div>
              ) : (
                /* Live Commit Feed View */
                <motion.div
                  key="commits-view"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={transition.enter}
                  className="space-y-3 min-w-0"
                >
                  {filteredCommits.length === 0 ? (
                    <div className="text-center py-14 bg-[#0c0f18] border border-white/[0.08] rounded-xl px-4">
                      <GitCommit className="w-8 h-8 text-slate-500 mx-auto mb-3 opacity-60" />
                      <h3 className="text-sm sm:text-base font-semibold text-white">
                        No repository commits match your filter
                      </h3>
                      <p className="text-xs text-slate-400 mt-1 mb-4">
                        Adjust your search or switch product filters.
                      </p>
                      {hasActiveFilters && (
                        <button
                          type="button"
                          onClick={resetFilters}
                          className="h-9 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-colors"
                        >
                          Reset filters
                        </button>
                      )}
                    </div>
                  ) : (
                    filteredCommits.map((commit) => {
                      const hasDesc = Boolean(commit.description && commit.description.trim());
                      const isCommitOpen = expandedCommits.has(commit.id);
                      const shortSha = commit.sha.substring(0, 7);

                      return (
                        <div
                          key={commit.id}
                          className="bg-[#0c0f18] border border-white/[0.08] hover:border-white/[0.14] rounded-xl p-4 sm:p-5 transition-colors"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="space-y-1.5 min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-white/[0.05] border border-white/[0.08] text-slate-200">
                                  {commit.botName}
                                </span>
                                {commit.tags.map((t) => (
                                  <span
                                    key={t}
                                    className="text-[11px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20"
                                  >
                                    {t}
                                  </span>
                                ))}
                              </div>

                              <h3 className="text-sm font-semibold text-white leading-snug break-words">
                                {commit.message}
                              </h3>

                              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400 pt-0.5">
                                <span>{commit.author}</span>
                                <span className="text-slate-600">•</span>
                                <span className="font-mono tabular-nums">
                                  {formatRelativeDate(commit.date)}
                                </span>
                                <span className="text-slate-600">•</span>
                                <button
                                  type="button"
                                  onClick={() => handleCopySha(commit.sha)}
                                  title="Copy commit SHA"
                                  className="inline-flex items-center gap-1 font-mono text-[11px] px-1.5 py-0.5 rounded bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-slate-300 transition-colors touch-manipulation"
                                >
                                  {copiedSha === commit.sha ? (
                                    <>
                                      <Check className="w-3 h-3 text-emerald-400" />
                                      <span className="text-emerald-300">Copied</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="w-3 h-3 text-slate-500" />
                                      <span>{shortSha}</span>
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>

                            <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/[0.06]">
                              {hasDesc && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setExpandedCommits((prev) => {
                                      const next = new Set(prev);
                                      if (next.has(commit.id)) next.delete(commit.id);
                                      else next.add(commit.id);
                                      return next;
                                    })
                                  }
                                  className="min-h-[32px] px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-medium text-slate-300 hover:text-white inline-flex items-center gap-1 transition-colors touch-manipulation"
                                >
                                  <span>{isCommitOpen ? "Hide notes" : "Details"}</span>
                                  <ChevronDown
                                    className={`w-3.5 h-3.5 transition-transform duration-200 ${
                                      isCommitOpen ? "rotate-180" : ""
                                    }`}
                                  />
                                </button>
                              )}

                              <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-mono text-emerald-400 inline-flex items-center gap-1.5 select-none">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Verified</span>
                              </span>
                            </div>
                          </div>

                          <AnimatePresence initial={false}>
                            {hasDesc && isCommitOpen && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2, ease: ease.inOut }}
                                className="overflow-hidden"
                              >
                                <p className="mt-3 pt-3 border-t border-white/[0.06] text-xs text-slate-300 leading-relaxed break-words">
                                  {commit.description}
                                </p>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </main>

        {/* Smooth Floating Back-To-Top Button (Phone & Desktop Friendly 44x44 Target) */}
        <AnimatePresence>
          {showBackToTop && (
            <motion.button
              type="button"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              transition={transition.enter}
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              aria-label="Back to top"
              className="fixed bottom-5 right-5 z-40 w-11 h-11 rounded-xl bg-[#101420]/95 hover:bg-blue-600 border border-white/[0.14] text-white shadow-lg backdrop-blur-md flex items-center justify-center transition-colors active:scale-95 touch-manipulation"
            >
              <ArrowUp className="w-4 h-4" />
            </motion.button>
          )}
        </AnimatePresence>

        <PublicFooter />
      </div>
    </MotionConfig>
  );
}
