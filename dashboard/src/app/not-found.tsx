"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, MotionConfig } from "framer-motion";
import {
  ArrowLeft,
  ArrowUpRight,
  Home,
  Layers,
  MessageSquare,
  Search,
  X,
} from "lucide-react";
import { PublicNavbar } from "@/components/PublicNavbar";
import { PublicFooter } from "@/components/PublicFooter";
import { transition } from "@/lib/motion-tokens";

const KNOWN_ROUTES = [
  {
    path: "/",
    title: "Platform Overview",
    desc: "Bot suite, telemetry, and invites",
  },
  {
    path: "/updates",
    title: "Updates & Changelog",
    desc: "Version releases and live repository feed",
  },
  {
    path: "/dashboard/radio",
    title: "SyncInk Radio Dashboard",
    desc: "Stations, Audia AI settings, and audio stats",
  },
  {
    path: "/dashboard/tickets",
    title: "Ticket Bot Console",
    desc: "Private thread panels and encrypted transcripts",
  },
  {
    path: "/audia",
    title: "Audia AI Specification",
    desc: "Taste vector engine and 6-stage pipeline docs",
  },
  {
    path: "/apply",
    title: "Team Applications",
    desc: "Apply for SyncInk Staff or Developer roles",
  },
  {
    path: "/faq",
    title: "Frequently Asked Questions",
    desc: "Setup commands, permissions, and troubleshooting",
  },
  {
    path: "/report",
    title: "Incident & Recovery Desk",
    desc: "Report data loss or platform issues",
  },
];

export default function NotFound() {
  const pathname = usePathname() || "/unknown";
  const router = useRouter();
  const [routeFilter, setRouteFilter] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (
        e.key === "/" &&
        document.activeElement?.tagName !== "INPUT" &&
        document.activeElement?.tagName !== "TEXTAREA"
      ) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const filteredRoutes = useMemo(() => {
    const q = routeFilter.trim().toLowerCase();
    if (!q) return KNOWN_ROUTES;
    return KNOWN_ROUTES.filter(
      (r) =>
        r.path.toLowerCase().includes(q) ||
        r.title.toLowerCase().includes(q) ||
        r.desc.toLowerCase().includes(q)
    );
  }, [routeFilter]);

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen bg-[#060812] text-slate-100 flex flex-col font-sans overflow-x-hidden selection:bg-brand-blue selection:text-white">
        <PublicNavbar />

        <main className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={transition.enter}
            className="w-full max-w-3xl space-y-6"
          >
            {/* Primary Route Diagnostic Panel */}
            <div className="rounded-xl bg-[#0c0f18] border border-white/[0.08] overflow-hidden">
              <div className="px-4 sm:px-6 py-3 border-b border-white/[0.06] bg-white/[0.02] flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-red-500/10 border border-red-500/20 font-mono text-[11px] font-medium text-red-300 shrink-0 tabular-nums">
                    404
                  </span>
                  <span className="font-mono text-xs text-slate-400 truncate">
                    GET <span className="text-slate-200">{pathname}</span>
                  </span>
                </div>
                <span className="font-mono text-[11px] text-slate-500">
                  syncink.site
                </span>
              </div>

              <div className="p-6 sm:p-8 space-y-6">
                <div className="space-y-2.5 max-w-xl">
                  <h1 className="text-2xl sm:text-4xl font-semibold text-white tracking-tight leading-[1.15]">
                    This page couldn&apos;t be found
                  </h1>
                  <p className="text-sm sm:text-[15px] text-slate-400 leading-relaxed">
                    No route matches <code className="font-mono text-slate-200 bg-white/[0.05] px-1.5 py-0.5 rounded text-xs break-all">{pathname}</code>. Check the URL or pick one of the active endpoints below.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 pt-1">
                  <Link
                    href="/"
                    className="h-10 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors inline-flex items-center justify-center gap-2 active:scale-[0.98] touch-manipulation"
                  >
                    <Home className="w-4 h-4" />
                    <span>Return home</span>
                  </Link>

                  <button
                    type="button"
                    onClick={() => router.back()}
                    className="h-10 px-4 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-slate-200 hover:text-white text-sm font-medium transition-colors inline-flex items-center justify-center gap-2 active:scale-[0.98] touch-manipulation"
                  >
                    <ArrowLeft className="w-4 h-4 text-slate-400" />
                    <span>Go back</span>
                  </button>

                  <Link
                    href="/dashboard"
                    className="h-10 px-4 rounded-lg bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.06] text-slate-300 hover:text-white text-sm font-medium transition-colors inline-flex items-center justify-center gap-2 touch-manipulation"
                  >
                    <Layers className="w-4 h-4 text-slate-400" />
                    <span>Multi-Bot Console</span>
                  </Link>

                  <a
                    href="https://discord.gg/PmxfJwmQuB"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-10 px-3.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.04] text-sm font-medium transition-colors inline-flex items-center justify-center gap-1.5 sm:ml-auto touch-manipulation"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Support Discord</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Destination Directory + Quick Filter */}
            <div className="rounded-xl bg-[#0c0f18] border border-white/[0.08] p-4 sm:p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-medium text-white">
                    Active destinations
                  </h2>
                  <p className="text-xs text-slate-400">
                    Jump directly to a section on syncink.site
                  </p>
                </div>

                <div className="relative sm:w-64">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    ref={searchRef}
                    type="text"
                    value={routeFilter}
                    onChange={(e) => setRouteFilter(e.target.value)}
                    placeholder="Filter routes..."
                    className="w-full h-9 rounded-lg bg-[#060812] border border-white/[0.08] pl-8 pr-8 text-base sm:text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                  {routeFilter ? (
                    <button
                      type="button"
                      onClick={() => setRouteFilter("")}
                      aria-label="Clear filter"
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono text-slate-500 bg-white/[0.04] border border-white/[0.08] rounded absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                      /
                    </kbd>
                  )}
                </div>
              </div>

              {filteredRoutes.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400 border border-dashed border-white/[0.08] rounded-lg">
                  No matching route for &ldquo;{routeFilter}&rdquo;. Try{" "}
                  <button
                    type="button"
                    onClick={() => setRouteFilter("")}
                    className="text-blue-400 hover:underline font-medium"
                  >
                    clearing the filter
                  </button>
                  .
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {filteredRoutes.map((item) => (
                    <Link
                      key={item.path}
                      href={item.path}
                      className="group flex items-start justify-between gap-3 p-3 rounded-lg bg-[#060812] border border-white/[0.06] hover:border-white/[0.16] hover:bg-white/[0.02] transition-colors touch-manipulation"
                    >
                      <div className="min-w-0">
                        <div className="text-xs font-medium text-slate-100 group-hover:text-white truncate">
                          {item.title}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate mt-0.5">
                          {item.desc}
                        </div>
                        <div className="font-mono text-[10px] text-slate-500 mt-1">
                          {item.path}
                        </div>
                      </div>
                      <ArrowUpRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-200 transition-colors shrink-0 mt-0.5" />
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </main>

        <PublicFooter />
      </div>
    </MotionConfig>
  );
}
