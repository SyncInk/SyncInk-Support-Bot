"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Shield,
  MessageSquare,
  Radio,
  ExternalLink,
  ChevronRight,
  Activity,
  Layers,
  Sparkles,
  Lock,
  CheckCircle2,
  Users,
  Settings,
  ArrowRight,
  LifeBuoy,
  ClipboardList,
  RotateCcw,
  Crown,
  FileText,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { PublicNavbar } from "@/components/PublicNavbar";

interface CurrentUser {
  id: string;
  username: string;
  global_name?: string | null;
  avatar?: string | null;
  isOwner?: boolean;
  isAdmin?: boolean;
  isStaff?: boolean;
  role?: string;
}

export default function MasterDashboardHub() {
  const router = useRouter();

  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [securityStats, setSecurityStats] = useState({
    jailedCount: 0,
    whitelistCount: 0,
    incidentCount: 0,
    modCasesCount: 0,
    violationsCount: 0,
  });
  const [raidState, setRaidState] = useState("NORMAL");
  const [reportCount, setReportCount] = useState<number | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // 1. Authenticate user & load profile
  useEffect(() => {
    async function loadUser() {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        if (res.status === 401) {
          router.push("/login?redirect=/dashboard");
          return;
        }
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated && data.user) {
            setCurrentUser(data.user);
          } else {
            router.push("/login?redirect=/dashboard");
            return;
          }
        }
      } catch (err) {
        console.error("Auth verification failed:", err);
      } finally {
        setAuthLoading(false);
      }
    }
    loadUser();
  }, [router]);

  // 2. Fetch ecosystem statistics
  useEffect(() => {
    async function loadStats() {
      try {
        // Fetch security telemetry
        const secRes = await fetch("/api/security");
        if (secRes.ok) {
          const secData = await secRes.json();
          if (secData.stats) {
            setSecurityStats({
              jailedCount: secData.stats.jailedCount || 0,
              whitelistCount: secData.stats.whitelistCount || 0,
              incidentCount: secData.stats.incidentCount || 0,
              modCasesCount: secData.stats.modCasesCount || 0,
              violationsCount: secData.stats.violationsCount || 0,
            });
          }
          if (secData.raidState) {
            setRaidState(secData.raidState);
          }
        }

        // Fetch recovery reports count
        const repRes = await fetch("/api/reports");
        if (repRes.ok) {
          const repData = await repRes.json();
          if (Array.isArray(repData.reports)) {
            setReportCount(repData.reports.length);
          }
        }
      } catch (e) {
        console.error("Ecosystem telemetry error:", e);
      } finally {
        setStatsLoading(false);
      }
    }
    loadStats();
  }, []);

  const isOwner =
    currentUser?.isOwner ||
    currentUser?.id === "930306512864280607" ||
    currentUser?.id === "admin";
  const isPrivilegedStaff =
    isOwner || currentUser?.isAdmin || currentUser?.isStaff;

  const getAvatarUrl = (user: CurrentUser | null) => {
    if (!user) return "https://cdn.discordapp.com/embed/avatars/0.png";
    if (user.id === "admin" || user.avatar?.includes("syncink-admin")) {
      return "/syncink-admin.jpg";
    }
    if (user.avatar) {
      if (user.avatar.startsWith("http") || user.avatar.startsWith("/")) return user.avatar;
      const ext = user.avatar.startsWith("a_") ? "gif" : "png";
      return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.${ext}?size=128`;
    }
    const idx = Math.abs(parseInt(user.id || "0", 10) % 5);
    return `https://cdn.discordapp.com/embed/avatars/${idx}.png`;
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#060812] text-slate-100 flex flex-col font-sans">
        <PublicNavbar />
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-[#0b0e1d]/90 border border-white/10 rounded-3xl p-8 text-center space-y-4 shadow-2xl backdrop-blur-xl">
            <div className="relative w-14 h-14 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-blue-600/30 to-purple-600/30 animate-pulse" />
              <RefreshCw className="w-7 h-7 text-blue-400 animate-spin relative z-10" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white tracking-wide">Loading Bot Operations</h3>
              <p className="text-xs text-slate-400">Verifying authenticated session...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#060812] text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      <PublicNavbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
        {/* ========================================================= */}
        {/* TOP COMMAND CENTER HEADER & USER STATUS */}
        {/* ========================================================= */}
        <div className="bg-[#0b0e1d] border border-white/[0.08] rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-2xl">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/25 text-blue-400 text-xs font-bold uppercase tracking-wider mb-3">
                <Shield className="w-3.5 h-3.5 text-blue-400" />
                <span>SyncInk Bot Operations Console</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                Unified Support Bot Dashboard
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-2 max-w-2xl leading-relaxed">
                Centralized management for incident recovery, server automod defense, ticket archives, and developer governance.
              </p>
            </div>

            {/* Authenticated Identity Pill */}
            {currentUser && (
              <div className="flex items-center gap-3.5 p-3 sm:p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] shrink-0">
                <div className="relative">
                  <img
                    src={getAvatarUrl(currentUser)}
                    alt={currentUser.username}
                    className="w-11 h-11 rounded-xl object-cover border border-white/10"
                  />
                  <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-[#0b0e1d]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs sm:text-sm font-bold text-white truncate max-w-[160px]">
                      {currentUser.id === "admin"
                        ? "SyncInk Admin"
                        : currentUser.global_name || currentUser.username}
                    </span>
                    {currentUser.id === "admin" ? (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider bg-purple-500/15 text-purple-300 border border-purple-500/30">
                        SyncInk Admin
                      </span>
                    ) : isOwner ? (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                        <img
                          src="https://cdn.discordapp.com/emojis/1513803214674464788.png"
                          alt="Owner"
                          className="w-3 h-3 object-contain inline-block"
                        />
                        <span>Owner</span>
                      </span>
                    ) : isPrivilegedStaff ? (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider bg-blue-500/15 text-blue-300 border border-blue-500/30">
                        {currentUser.role || "Staff"}
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                        Verified
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] font-mono text-slate-400 mt-0.5 flex items-center gap-2">
                    <span>ID: {currentUser.id}</span>
                    <span className="text-slate-600">•</span>
                    <span className="text-emerald-400 font-semibold flex items-center gap-1">
                      <Lock className="w-2.5 h-2.5" />
                      <span>Encrypted</span>
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ========================================================= */}
        {/* LIVE ECOSYSTEM STATUS BAR */}
        {/* ========================================================= */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Tile 1: Security Shield */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#0b0e1d] border border-white/[0.08] flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Raid Shield
              </div>
              <div className="text-sm sm:text-base font-black text-white flex items-center gap-1.5 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>{raidState}</span>
              </div>
              <div className="text-[10px] text-slate-500 truncate mt-0.5">
                {securityStats.jailedCount} Quarantined
              </div>
            </div>
          </div>

          {/* Tile 2: Incident Recovery */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#0b0e1d] border border-white/[0.08] flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
              <LifeBuoy className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Recovery Desk
              </div>
              <div className="text-sm sm:text-base font-black text-white mt-0.5">
                {reportCount !== null ? `${reportCount} Total Reports` : "Active"}
              </div>
              <div className="text-[10px] text-slate-500 truncate mt-0.5">
                Two-Way Discord Mirror
              </div>
            </div>
          </div>

          {/* Tile 3: Ticket System */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#0b0e1d] border border-white/[0.08] flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Ticket Engine
              </div>
              <div className="text-sm sm:text-base font-black text-white mt-0.5">
                6 Categories
              </div>
              <div className="text-[10px] text-slate-500 truncate mt-0.5">
                Private HTML Transcripts
              </div>
            </div>
          </div>

          {/* Tile 4: AutoMod Defense */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#0b0e1d] border border-white/[0.08] flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
              <Activity className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                AutoMod Filters
              </div>
              <div className="text-sm sm:text-base font-black text-white mt-0.5">
                {securityStats.violationsCount} Filtered
              </div>
              <div className="text-[10px] text-slate-500 truncate mt-0.5">
                Anti-Nuke Velocity Active
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* COMMAND CENTERS GRID */}
        {/* ========================================================= */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* CARD 1: DATA LOSS RECOVERY & INCIDENT DESK */}
          <div className="p-6 sm:p-7 rounded-3xl bg-[#0b0e1d] border border-blue-500/20 flex flex-col justify-between hover:border-blue-500/40 transition-all shadow-lg group">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-600/15 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-sm">
                  <LifeBuoy className="w-6 h-6" />
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-blue-500/10 text-blue-300 border border-blue-500/20">
                  Recovery Portal
                </span>
              </div>
              <h2 className="text-xl font-bold text-white group-hover:text-blue-300 transition-colors">
                Incident &amp; Data Recovery Desk
              </h2>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Experiencing missing ticket transcripts, accidental channel wipe, or bot disruptions? Open a recovery inquiry with private two-way chat with staff and engineering leads.
              </p>
              <div className="mt-5 space-y-2 text-xs">
                <div className="flex items-center gap-2 text-slate-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Direct browser-to-Discord thread synchronization</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Secure attachment permissions managed by staff</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Dedicated escalation on channel #1541796896199417906</span>
                </div>
              </div>
            </div>
            <div className="mt-6 pt-5 border-t border-white/[0.06] space-y-2.5">
              <Link
                href="/report"
                className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-all shadow-md flex items-center justify-center gap-2"
              >
                <span>Open Recovery Desk</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* CARD 2: SUPPORT SERVER SECURITY & AUTOMOD */}
          <div className="p-6 sm:p-7 rounded-3xl bg-[#0b0e1d] border border-red-500/20 flex flex-col justify-between hover:border-red-500/40 transition-all shadow-lg group">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-red-600/15 border border-red-500/30 flex items-center justify-center text-red-400 shadow-sm">
                  <Shield className="w-6 h-6" />
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-red-500/10 text-red-300 border border-red-500/20">
                  Defense Engine
                </span>
              </div>
              <h2 className="text-xl font-bold text-white group-hover:text-red-300 transition-colors">
                Support Security &amp; AutoMod
              </h2>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Automated security engine protecting the official SyncInk Support Server. Manage velocity dampeners, auto-quarantine, security thresholds, and export audit reports.
              </p>
              <div className="mt-5 space-y-2 text-xs">
                <div className="flex items-center gap-2 text-slate-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Real-time raid velocity monitor and quarantine</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Customizable spam &amp; invite link filters</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Audited incident history and JSON/CSV export</span>
                </div>
              </div>
            </div>
            <div className="mt-6 pt-5 border-t border-white/[0.06] space-y-2.5">
              <Link
                href="/dashboard/security"
                className="w-full py-3 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs transition-all shadow-md flex items-center justify-center gap-2"
              >
                <span>Launch Security Console</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* CARD 3: TICKET BOT & TRANSCRIPTS */}
          <div className="p-6 sm:p-7 rounded-3xl bg-[#0b0e1d] border border-indigo-500/20 flex flex-col justify-between hover:border-indigo-500/40 transition-all shadow-lg group">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-600/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-sm">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                  Support Engine
                </span>
              </div>
              <h2 className="text-xl font-bold text-white group-hover:text-indigo-300 transition-colors">
                Ticket Bot &amp; Transcripts
              </h2>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Configure private thread ticket departments, staff claim actions, embed panels, and view encrypted HTML transcripts directly in your browser.
              </p>
              <div className="mt-5 space-y-2 text-xs">
                <div className="flex items-center gap-2 text-slate-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Private threads organized by 6 departments</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>HTML transcripts retained with attachments</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Staff transfer and claim button interactions</span>
                </div>
              </div>
            </div>
            <div className="mt-6 pt-5 border-t border-white/[0.06] space-y-2.5">
              <Link
                href="/dashboard/tickets"
                className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all shadow-md flex items-center justify-center gap-2"
              >
                <span>Launch Ticket Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* CARD 4: MEMBER APPLICATIONS PANEL */}
          <div className="p-6 sm:p-7 rounded-3xl bg-[#0b0e1d] border border-violet-500/20 flex flex-col justify-between hover:border-violet-500/40 transition-all shadow-lg group">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-violet-600/15 border border-violet-500/30 flex items-center justify-center text-violet-400 shadow-sm">
                  <ClipboardList className="w-6 h-6" />
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-violet-500/10 text-violet-300 border border-violet-500/20">
                  Staff &amp; Dev Roster
                </span>
              </div>
              <h2 className="text-xl font-bold text-white group-hover:text-violet-300 transition-colors">
                Candidate Applications
              </h2>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Review and evaluate submissions for Staff and Developer roles. Inspect applicant questionnaires, evaluate experience, and store confidential reviewer feedback.
              </p>
              <div className="mt-5 space-y-2 text-xs">
                <div className="flex items-center gap-2 text-slate-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Verified applicant background questionnaire</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Application status toggling: Pending, Accepted, Rejected</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Internal team notes and audit logging</span>
                </div>
              </div>
            </div>
            <div className="mt-6 pt-5 border-t border-white/[0.06] space-y-2.5">
              <Link
                href="/dashboard/applications"
                className="w-full py-3 px-4 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs transition-all shadow-md flex items-center justify-center gap-2"
              >
                <span>Open Applications Panel</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* CARD 5: CONFIDENTIAL OWNER / ADMIN GOVERNANCE CONSOLE */}
          {/* Strictly restricted and hidden from normal members */}
          {(isOwner || currentUser?.isAdmin) && (
            <div className="p-6 sm:p-7 rounded-3xl bg-[#0b0e1d] border border-amber-500/25 flex flex-col justify-between hover:border-amber-500/40 transition-all shadow-lg group">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-sm">
                    <Crown className="w-6 h-6" />
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    <span>Confidential Governance</span>
                  </span>
                </div>
                <h2 className="text-xl font-bold text-white group-hover:text-amber-300 transition-colors">
                  Executive Admin Console
                </h2>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  Dedicated control room for the primary owner and administrators. Manage team role assignments, configure website parameters, and supervise recovery cases.
                </p>
                <div className="mt-5 space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-slate-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Role assignments: Owner, Admin, Developer, Staff</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Live data loss recovery desk queue management</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Immutable administrative audit trail</span>
                  </div>
                </div>
              </div>
              <div className="mt-6 pt-5 border-t border-white/[0.06] space-y-2.5">
                <Link
                  href="/dashboard/admin"
                  className="w-full py-3 px-4 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 font-bold text-xs transition-all shadow-md flex items-center justify-center gap-2"
                >
                  <Crown className="w-3.5 h-3.5 text-amber-400" />
                  <span>Enter Governance Console</span>
                  <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
                </Link>
              </div>
            </div>
          )}

          {/* CARD 6: VOICE & RADIO ECOSYSTEM */}
          <div className="p-6 sm:p-7 rounded-3xl bg-[#0b0e1d] border border-cyan-500/20 flex flex-col justify-between hover:border-cyan-500/40 transition-all shadow-lg group">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-cyan-600/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-sm">
                  <Radio className="w-6 h-6" />
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                  Audio &amp; Voice
                </span>
              </div>
              <h2 className="text-xl font-bold text-white group-hover:text-cyan-300 transition-colors">
                Voice &amp; Radio Stations
              </h2>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Join-to-Create temporary voice hubs with automatic cleanup, plus lossless 24/7 radio and smart playback protection so listening sessions are never disrupted.
              </p>
              <div className="mt-5 space-y-2 text-xs">
                <div className="flex items-center gap-2 text-slate-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Smart anti-disruption protection across voice channels</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Join-to-Create private voice rooms with lock/hide</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Continuous 24/7 lofi &amp; worldwide radio streams</span>
                </div>
              </div>
            </div>
            <div className="mt-6 pt-5 border-t border-white/[0.06] space-y-2.5">
              <a
                href="https://discord.gg/PmxfJwmQuB"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 px-4 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2"
              >
                <span>Join Official Support Server</span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              </a>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* SECURITY & DATA INTEGRITY COMMITMENT */}
        {/* ========================================================= */}
        <div className="p-5 sm:p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-3">
            <Lock className="w-4 h-4 text-blue-400 shrink-0" />
            <div>
              <span className="font-semibold text-white">Platform Security Standard:</span> Webhook endpoints, OAuth2 tokens, and database sessions are strictly encrypted with TLS 1.3 and zero client-side credential exposure.
            </div>
          </div>
          <div className="flex items-center gap-4 shrink-0 font-medium">
            <Link href="/terms" className="hover:text-white transition-colors">
              Terms
            </Link>
            <span>•</span>
            <Link href="/privacy" className="hover:text-white transition-colors">
              Privacy
            </Link>
            <span>•</span>
            <Link href="/rules" className="hover:text-white transition-colors">
              Rules
            </Link>
          </div>
        </div>
      </main>

      <footer className="py-6 border-t border-white/[0.06] text-center text-xs text-slate-500">
        © 2026 SyncInk Security &amp; Bot Operations Platform. All rights reserved.
      </footer>
    </div>
  );
}
