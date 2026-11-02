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
  Menu,
  X,
  LogOut,
  Sliders,
  Check,
} from "lucide-react";
import { DISCORD_CUSTOM_EMOJIS } from "@/lib/custom-emojis";

interface CurrentUser {
  id: string;
  username: string;
  global_name?: string | null;
  avatar?: string | null;
  isOwner?: boolean;
  isAdmin?: boolean;
  isStaff?: boolean;
  role?: string;
  roleIcon?: string;
}

interface ServerTelemetry {
  name: string;
  icon: string | null;
  approximate_member_count: number;
  approximate_presence_count: number;
  premium_subscription_count: number;
  premium_tier: number;
}

export default function MasterDashboardHub() {
  const router = useRouter();

  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [securityStats, setSecurityStats] = useState({
    jailedCount: 0,
    whitelistCount: 0,
    incidentCount: 0,
    modCasesCount: 0,
    violationsCount: 0,
  });
  const [raidState, setRaidState] = useState("NORMAL");
  const [serverTelemetry, setServerTelemetry] = useState<ServerTelemetry>({
    name: "SyncInk Support",
    icon: "ba66f3204080aec335d410249295408d",
    approximate_member_count: 12,
    approximate_presence_count: 6,
    premium_subscription_count: 0,
    premium_tier: 0,
  });
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
        // Fetch security telemetry & live guild info
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
          if (secData.server) {
            setServerTelemetry({
              name: secData.server.name || "SyncInk Support",
              icon: secData.server.icon || "ba66f3204080aec335d410249295408d",
              approximate_member_count: secData.server.approximate_member_count || 12,
              approximate_presence_count: secData.server.approximate_presence_count || 6,
              premium_subscription_count: secData.server.premium_subscription_count || 0,
              premium_tier: secData.server.premium_tier || 0,
            });
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

  const handleLogout = async () => {
    await fetch("/api/auth", { method: "DELETE" }).catch(() => {});
    router.push("/login");
  };

  // Close mobile drawer on route click
  const handleNavClick = () => {
    setMobileMenuOpen(false);
  };

  // =========================================================
  // SMOOTH SKELETON LOADING VIEW
  // =========================================================
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#060812] text-slate-100 flex flex-col md:flex-row font-sans">
        {/* Skeleton Sidebar */}
        <aside className="w-full md:w-64 xl:w-72 bg-[#090c18] border-r border-white/[0.08] p-5 space-y-6 hidden md:block shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/[0.06] animate-pulse" />
            <div className="space-y-1.5 flex-1">
              <div className="w-24 h-4 bg-white/[0.08] rounded animate-pulse" />
              <div className="w-16 h-3 bg-white/[0.04] rounded animate-pulse" />
            </div>
          </div>
          <div className="space-y-2 pt-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="w-full h-10 bg-white/[0.04] rounded-xl animate-pulse" />
            ))}
          </div>
        </aside>

        {/* Skeleton Content */}
        <main className="flex-1 p-6 sm:p-10 space-y-8">
          <div className="h-36 rounded-3xl bg-white/[0.04] border border-white/[0.06] p-6 animate-pulse" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 rounded-2xl bg-white/[0.04] border border-white/[0.06] animate-pulse" />
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-64 rounded-3xl bg-white/[0.04] border border-white/[0.06] animate-pulse" />
            ))}
          </div>
        </main>
      </div>
    );
  }

  // =========================================================
  // MAIN SIDE-PANEL DASHBOARD VIEW
  // =========================================================
  return (
    <div className="min-h-screen bg-[#060812] text-slate-100 flex flex-col md:flex-row font-sans selection:bg-blue-600 selection:text-white">
      {/* ========================================================= */}
      {/* MOBILE COMPACT TOP BAR (< md) */}
      {/* ========================================================= */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 bg-[#080b16] border-b border-white/[0.08] sticky top-0 z-40 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open Navigation Side Panel"
            className="w-9 h-9 rounded-xl bg-white/[0.05] hover:bg-white/[0.09] border border-white/10 flex items-center justify-center text-slate-200 transition-colors"
          >
            <Menu className="w-5 h-5 text-slate-300" />
          </button>
          <div className="flex items-center gap-2">
            <img
              src="/syncink-main-logo.png"
              alt="SyncInk Logo"
              className="w-7 h-7 rounded-lg object-contain"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = "/favicon.png";
              }}
            />
            <span className="font-extrabold text-white text-sm tracking-tight">SyncInk Bot</span>
          </div>
        </div>

        {currentUser && (
          <div className="flex items-center gap-2">
            <div className="relative">
              <img
                src={getAvatarUrl(currentUser)}
                alt={currentUser.username}
                className="w-8 h-8 rounded-xl object-cover border border-white/10"
              />
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-[#080b16]" />
            </div>
          </div>
        )}
      </header>

      {/* ========================================================= */}
      {/* MOBILE SLIDE-OUT DRAWER OVERLAY */}
      {/* ========================================================= */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md transition-opacity duration-300 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            className="w-4/5 max-w-xs h-full bg-[#080b17] border-r border-white/10 p-5 flex flex-col justify-between shadow-2xl overflow-y-auto animate-in slide-in-from-left duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-6">
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
                <div className="flex items-center gap-2.5">
                  <img
                    src="/syncink-main-logo.png"
                    alt="SyncInk Logo"
                    className="w-8 h-8 rounded-xl object-contain"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = "/favicon.png";
                    }}
                  />
                  <div>
                    <h3 className="font-extrabold text-white text-sm">SyncInk Support</h3>
                    <p className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Bot Online & Synced
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-8 h-8 rounded-xl bg-white/[0.05] flex items-center justify-center text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Navigation Items */}
              <nav className="space-y-1.5">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-3 pb-1">
                  Main Console
                </div>
                <Link
                  href="/dashboard"
                  onClick={handleNavClick}
                  className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-blue-600/15 border border-blue-500/30 text-blue-300 text-xs font-bold transition-all"
                >
                  <div className="flex items-center gap-2.5">
                    <Shield className="w-4 h-4 text-blue-400" />
                    <span>Command Center</span>
                  </div>
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                </Link>

                <Link
                  href="/dashboard/security"
                  onClick={handleNavClick}
                  className="flex items-center justify-between px-3.5 py-2.5 rounded-xl hover:bg-white/[0.05] text-slate-300 hover:text-white text-xs font-semibold transition-all"
                >
                  <div className="flex items-center gap-2.5">
                    <Activity className="w-4 h-4 text-red-400" />
                    <span>Security & AutoMod</span>
                  </div>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/15 text-emerald-300">
                    {raidState}
                  </span>
                </Link>

                <Link
                  href="/report"
                  onClick={handleNavClick}
                  className="flex items-center justify-between px-3.5 py-2.5 rounded-xl hover:bg-white/[0.05] text-slate-300 hover:text-white text-xs font-semibold transition-all"
                >
                  <div className="flex items-center gap-2.5">
                    <LifeBuoy className="w-4 h-4 text-blue-400" />
                    <span>Incident Recovery Desk</span>
                  </div>
                  {reportCount !== null && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-500/15 text-blue-300">
                      {reportCount}
                    </span>
                  )}
                </Link>

                <Link
                  href="/dashboard/tickets"
                  onClick={handleNavClick}
                  className="flex items-center justify-between px-3.5 py-2.5 rounded-xl hover:bg-white/[0.05] text-slate-300 hover:text-white text-xs font-semibold transition-all"
                >
                  <div className="flex items-center gap-2.5">
                    <MessageSquare className="w-4 h-4 text-indigo-400" />
                    <span>Ticket Engine</span>
                  </div>
                  <span className="text-[10px] text-slate-500">HTML</span>
                </Link>

                <Link
                  href="/dashboard/applications"
                  onClick={handleNavClick}
                  className="flex items-center justify-between px-3.5 py-2.5 rounded-xl hover:bg-white/[0.05] text-slate-300 hover:text-white text-xs font-semibold transition-all"
                >
                  <div className="flex items-center gap-2.5">
                    <ClipboardList className="w-4 h-4 text-violet-400" />
                    <span>Staff Applications</span>
                  </div>
                </Link>

                {/* Confidential Admin Console: ONLY rendered for Owner or Passkey Admin */}
                {isOwner && (
                  <>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-amber-500/80 px-3 pt-3 pb-1">
                      Confidential Area
                    </div>
                    <Link
                      href="/dashboard/admin"
                      onClick={handleNavClick}
                      className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs font-bold transition-all hover:bg-amber-500/15"
                    >
                      <div className="flex items-center gap-2.5">
                        <Crown className="w-4 h-4 text-amber-400" />
                        <span>Executive Governance</span>
                      </div>
                      <Lock className="w-3 h-3 text-amber-400" />
                    </Link>
                  </>
                )}

                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-3 pt-3 pb-1">
                  Ecosystem Links
                </div>
                <a
                  href="https://discord.com/channels/1520457643842342912/1520460764937322566"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between px-3.5 py-2 rounded-xl text-slate-400 hover:text-slate-200 text-xs transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <Users className="w-4 h-4 text-slate-500" />
                    <span>Support Server</span>
                  </div>
                  <ExternalLink className="w-3 h-3 text-slate-600" />
                </a>

                <Link
                  href="/"
                  className="flex items-center justify-between px-3.5 py-2 rounded-xl text-slate-400 hover:text-slate-200 text-xs transition-colors"
                >
                  <span>Public Home</span>
                  <ChevronRight className="w-3 h-3 text-slate-600" />
                </Link>
              </nav>
            </div>

            {/* Mobile Drawer Bottom User Identity */}
            {currentUser && (
              <div className="pt-4 border-t border-white/[0.08] space-y-3">
                <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <img
                    src={getAvatarUrl(currentUser)}
                    alt={currentUser.username}
                    className="w-9 h-9 rounded-xl object-cover border border-white/10 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-white truncate">
                      {currentUser.id === "admin"
                        ? "SyncInk Admin"
                        : currentUser.global_name || currentUser.username}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate">
                      {isOwner ? "Primary Owner" : currentUser.role || "Verified Member"}
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold border border-red-500/20 transition-all"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Log Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* DESKTOP FIXED SIDE PANEL (SIDEBAR) (>= md) */}
      {/* ========================================================= */}
      <aside className="hidden md:flex flex-col justify-between w-64 xl:w-72 bg-[#080b16] border-r border-white/[0.08] p-5 shrink-0 sticky top-0 h-screen overflow-y-auto">
        <div className="space-y-6">
          {/* Side Panel Brand Header */}
          <div className="pb-5 border-b border-white/[0.08]">
            <Link href="/dashboard" className="flex items-center gap-3 group">
              <div className="relative">
                <img
                  src="/syncink-main-logo.png"
                  alt="SyncInk Logo"
                  className="w-10 h-10 rounded-2xl object-contain shadow-glow border border-blue-500/30 group-hover:border-blue-400 transition-colors"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = "/favicon.png";
                  }}
                />
                <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-[#080b16] animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h2 className="font-black text-white text-base tracking-tight">SyncInk Support</h2>
                </div>
                <p className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  Direct Bot Sync Active
                </p>
              </div>
            </Link>
          </div>

          {/* Side Navigation Buttons */}
          <nav className="space-y-1.5">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-3 pb-1">
              Command Modules
            </div>

            <Link
              href="/dashboard"
              className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-blue-600/15 border border-blue-500/35 text-white text-xs font-bold shadow-sm transition-all"
            >
              <div className="flex items-center gap-2.5">
                <Shield className="w-4 h-4 text-blue-400" />
                <span>Command Hub</span>
              </div>
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shadow-glow" />
            </Link>

            <Link
              href="/dashboard/security"
              className="flex items-center justify-between px-3.5 py-2.5 rounded-xl hover:bg-white/[0.04] text-slate-300 hover:text-white text-xs font-semibold border border-transparent hover:border-white/[0.06] transition-all"
            >
              <div className="flex items-center gap-2.5">
                <Activity className="w-4 h-4 text-red-400" />
                <span>Security & AutoMod</span>
              </div>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                {raidState}
              </span>
            </Link>

            <Link
              href="/report"
              className="flex items-center justify-between px-3.5 py-2.5 rounded-xl hover:bg-white/[0.04] text-slate-300 hover:text-white text-xs font-semibold border border-transparent hover:border-white/[0.06] transition-all"
            >
              <div className="flex items-center gap-2.5">
                <LifeBuoy className="w-4 h-4 text-blue-400" />
                <span>Incident Recovery Desk</span>
              </div>
              {reportCount !== null && (
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-500/15 text-blue-300 border border-blue-500/25">
                  {reportCount}
                </span>
              )}
            </Link>

            <Link
              href="/dashboard/tickets"
              className="flex items-center justify-between px-3.5 py-2.5 rounded-xl hover:bg-white/[0.04] text-slate-300 hover:text-white text-xs font-semibold border border-transparent hover:border-white/[0.06] transition-all"
            >
              <div className="flex items-center gap-2.5">
                <MessageSquare className="w-4 h-4 text-indigo-400" />
                <span>Ticket Bot Engine</span>
              </div>
              <span className="text-[10px] font-mono text-slate-500">6 Depts</span>
            </Link>

            <Link
              href="/dashboard/applications"
              className="flex items-center justify-between px-3.5 py-2.5 rounded-xl hover:bg-white/[0.04] text-slate-300 hover:text-white text-xs font-semibold border border-transparent hover:border-white/[0.06] transition-all"
            >
              <div className="flex items-center gap-2.5">
                <ClipboardList className="w-4 h-4 text-violet-400" />
                <span>Staff Applications</span>
              </div>
            </Link>

            {/* Confidential Executive Governance: ONLY displayed for Owner / Admin Passkey */}
            {isOwner && (
              <>
                <div className="text-[10px] font-bold uppercase tracking-wider text-amber-500/80 px-3 pt-3 pb-1">
                  Restricted Governance
                </div>
                <Link
                  href="/dashboard/admin"
                  className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 hover:border-amber-500/40 text-amber-200 text-xs font-bold transition-all shadow-sm group"
                >
                  <div className="flex items-center gap-2.5">
                    <Crown className="w-4 h-4 text-amber-400" />
                    <span>Executive Console</span>
                  </div>
                  <Lock className="w-3 h-3 text-amber-400" />
                </Link>
              </>
            )}

            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-3 pt-4 pb-1">
              External & Quick Links
            </div>

            <a
              href="https://discord.com/channels/1520457643842342912/1520460764937322566"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between px-3.5 py-2 rounded-xl text-slate-400 hover:text-slate-200 text-xs transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <Users className="w-4 h-4 text-slate-500" />
                <span>Support Headquarters</span>
              </div>
              <ExternalLink className="w-3 h-3 text-slate-600" />
            </a>

            <Link
              href="/"
              className="flex items-center justify-between px-3.5 py-2 rounded-xl text-slate-400 hover:text-slate-200 text-xs transition-colors"
            >
              <span>Showcase Home</span>
              <ChevronRight className="w-3 h-3 text-slate-600" />
            </Link>
          </nav>
        </div>

        {/* Side Panel Bottom User Profile Card */}
        {currentUser && (
          <div className="pt-4 border-t border-white/[0.08] space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/[0.03] border border-white/[0.08]">
              <div className="relative shrink-0">
                <img
                  src={getAvatarUrl(currentUser)}
                  alt={currentUser.username}
                  className="w-10 h-10 rounded-xl object-cover border border-white/10"
                />
                <span className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-emerald-500 border-2 border-[#080b16]" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-white truncate">
                    {currentUser.id === "admin"
                      ? "SyncInk Admin"
                      : currentUser.global_name || currentUser.username}
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 truncate mt-0.5 flex items-center gap-1">
                  {currentUser.id === "admin" ? (
                    <span className="text-purple-300 font-bold">SyncInk Admin</span>
                  ) : isOwner ? (
                    <span className="text-amber-400 font-bold flex items-center gap-1">
                      <img
                        src="https://cdn.discordapp.com/emojis/1513803214674464788.png"
                        alt="Owner"
                        className="w-2.5 h-2.5 inline"
                      />
                      <span>Owner</span>
                    </span>
                  ) : (
                    <span>{currentUser.role || "Verified"}</span>
                  )}
                </div>
              </div>

              <button
                onClick={handleLogout}
                title="Log out of session"
                className="w-8 h-8 rounded-xl bg-white/[0.04] hover:bg-red-500/20 text-slate-400 hover:text-red-400 border border-white/10 hover:border-red-500/30 flex items-center justify-center transition-colors shrink-0"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </aside>

      {/* ========================================================= */}
      {/* MAIN CONTENT AREA */}
      {/* ========================================================= */}
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 overflow-y-auto">
        {/* Top Header Banner: Server Synchronization */}
        <div className="bg-[#0b0e1d] border border-white/[0.08] rounded-3xl p-5 sm:p-7 relative overflow-hidden shadow-2xl">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/25 text-blue-400 text-xs font-bold uppercase tracking-wider">
                <Shield className="w-3.5 h-3.5 text-blue-400" />
                <span>Central Bot Operations Console</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Unified Support Bot Dashboard
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
                Directly synchronized with the Discord Bot engine. Manage incident recovery, AutoMod defenses, member applications, and ticket transcripts.
              </p>
            </div>

            {/* Live Synchronized Guild Badge */}
            <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-white/[0.03] border border-white/[0.08] shrink-0 self-start lg:self-auto">
              <img
                src={
                  serverTelemetry.icon
                    ? `https://cdn.discordapp.com/icons/1520457643842342912/${serverTelemetry.icon}.png?size=128`
                    : "https://cdn.discordapp.com/icons/1520457643842342912/ba66f3204080aec335d410249295408d.png?size=128"
                }
                alt="Server Icon"
                className="w-12 h-12 rounded-xl object-cover ring-2 ring-blue-500/30 shrink-0"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src =
                    "https://cdn.discordapp.com/icons/1520457643842342912/ba66f3204080aec335d410249295408d.png?size=128";
                }}
              />
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs sm:text-sm font-extrabold text-white">
                    {serverTelemetry.name}
                  </span>
                  <img
                    src={DISCORD_CUSTOM_EMOJIS.verified.url}
                    alt="Verified"
                    className="w-4 h-4 object-contain inline-block shrink-0"
                  />
                </div>
                <div className="text-[11px] font-mono text-slate-400 mt-0.5 flex items-center gap-2 flex-wrap">
                  <span>Guild: 1520457643842342912</span>
                  <span className="text-slate-600">•</span>
                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Live Bot Direct Sync</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* LIVE ECOSYSTEM STATUS BAR */}
        {/* ========================================================= */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Tile 1: Security Shield */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#0b0e1d] border border-white/[0.08] flex items-center gap-3.5 shadow-sm hover:border-emerald-500/30 transition-all">
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
          <div className="p-4 sm:p-5 rounded-2xl bg-[#0b0e1d] border border-white/[0.08] flex items-center gap-3.5 shadow-sm hover:border-blue-500/30 transition-all">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
              <LifeBuoy className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Recovery Desk
              </div>
              <div className="text-sm sm:text-base font-black text-white mt-0.5">
                {reportCount !== null ? `${reportCount} Reports` : "Active"}
              </div>
              <div className="text-[10px] text-slate-500 truncate mt-0.5">
                Two-Way Discord Mirror
              </div>
            </div>
          </div>

          {/* Tile 3: Live Members */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#0b0e1d] border border-white/[0.08] flex items-center gap-3.5 shadow-sm hover:border-cyan-500/30 transition-all">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Total Members
              </div>
              <div className="text-sm sm:text-base font-black text-white mt-0.5 font-mono">
                {serverTelemetry.approximate_member_count.toLocaleString()}
              </div>
              <div className="text-[10px] text-emerald-400 truncate mt-0.5 font-medium">
                {serverTelemetry.approximate_presence_count} Online Now
              </div>
            </div>
          </div>

          {/* Tile 4: AutoMod Defense */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#0b0e1d] border border-white/[0.08] flex items-center gap-3.5 shadow-sm hover:border-amber-500/30 transition-all">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
              <Activity className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                AutoMod Filters
              </div>
              <div className="text-sm sm:text-base font-black text-white mt-0.5 font-mono">
                {securityStats.violationsCount} Filtered
              </div>
              <div className="text-[10px] text-slate-500 truncate mt-0.5">
                Anti-Nuke Active
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* COMMAND CENTERS GRID */}
        {/* ========================================================= */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {/* CARD 1: DATA LOSS RECOVERY & INCIDENT DESK */}
          <div className="p-6 sm:p-7 rounded-3xl bg-[#0b0e1d] border border-blue-500/20 flex flex-col justify-between hover:border-blue-500/40 transition-all shadow-lg group">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-600/15 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-sm">
                  <LifeBuoy className="w-6 h-6" />
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-blue-500/10 text-blue-300 border border-blue-500/20">
                  Subdomain Ready
                </span>
              </div>
              <h2 className="text-xl font-bold text-white group-hover:text-blue-300 transition-colors">
                Incident &amp; Data Recovery Desk
              </h2>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Experiencing missing ticket transcripts, accidental channel wipe, or bot disruptions? Open a recovery inquiry with private two-way chat with staff.
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
                Automated security engine protecting the official SyncInk Support Server. Manage velocity dampeners, auto-quarantine, and security thresholds.
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
                Review and evaluate submissions for Staff and Developer roles. Inspect applicant questionnaires, evaluate experience, and store confidential notes.
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
          {isOwner && (
            <div className="p-6 sm:p-7 rounded-3xl bg-[#0b0e1d] border border-amber-500/25 flex flex-col justify-between hover:border-amber-500/40 transition-all shadow-lg group">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-sm">
                    <Crown className="w-6 h-6" />
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    <span>Confidential Console</span>
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
                Connect to low-latency community radio and dynamic temporary voice channels. Includes anti-disruption playback protection.
              </p>
              <div className="mt-5 space-y-2 text-xs">
                <div className="flex items-center gap-2 text-slate-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Dynamic temporary voice channels on join</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Anti-disruption protection: prevents channel hijacking</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Official SyncInk Radio bot integrations</span>
                </div>
              </div>
            </div>
            <div className="mt-6 pt-5 border-t border-white/[0.06] space-y-2.5">
              <a
                href="https://discord.com/channels/1520457643842342912/1520460764937322566"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 px-4 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] text-slate-200 border border-white/10 font-bold text-xs transition-all shadow-md flex items-center justify-center gap-2"
              >
                <span>Join Official Voice Lounges</span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
