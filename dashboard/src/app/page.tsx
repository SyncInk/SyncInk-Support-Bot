"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Lock,
  Unlock,
  Radio,
  RefreshCw,
  LogOut,
  Users,
  Settings,
  Eye,
  Sliders,
  CheckCircle2,
  XCircle,
  Clock,
  Plus,
  Trash2,
  AlertOctagon,
  FileText
} from "lucide-react";

interface SecurityState {
  guildId: string;
  settings: Record<string, any>;
  raidState: string;
  stats: {
    jailedCount: number;
    whitelistCount: number;
    incidentCount: number;
  };
  incidents: Array<{
    id: number;
    user_id: string;
    module: string;
    action_taken: string;
    severity: string;
    risk_score: number;
    details: string;
    created_at: string;
  }>;
  timestamp: string;
}

interface CurrentUser {
  id: string;
  username: string;
  global_name?: string | null;
  avatar?: string | null;
  isOwner?: boolean;
  isAdmin?: boolean;
  role?: string;
  guildId?: string;
  guildName?: string;
}

export default function DashboardPage() {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [data, setData] = useState<SecurityState | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [bannerMessage, setBannerMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"incidents" | "whitelist" | "quarantine">("incidents");

  // Threshold form
  const [spamLimit, setSpamLimit] = useState("5");
  const [mentionLimit, setMentionLimit] = useState("5");
  const [raidLimit, setRaidLimit] = useState("5");
  const [nukeLimit, setNukeLimit] = useState("3");
  const [thresholdsSaved, setThresholdsSaved] = useState(false);

  // Whitelist form & list
  const [whitelistEntries, setWhitelistEntries] = useState<any[]>([]);
  const [newType, setNewType] = useState("domain");
  const [newValue, setNewValue] = useState("");

  // Quarantine roster
  const [jailedUsers, setJailedUsers] = useState<any[]>([]);

  const router = useRouter();

  const fetchData = useCallback(async (silent = false, specificGuildId?: string) => {
    if (!silent) setRefreshing(true);
    try {
      const gid = specificGuildId || currentUser?.guildId;
      const url = gid ? `/api/security?guildId=${encodeURIComponent(gid)}` : "/api/security";
      const res = await fetch(url);
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      if (!res.ok) throw new Error("Failed to fetch security data");
      const json: SecurityState = await res.json();
      setData(json);

      // Populate thresholds initial values
      if (json.settings) {
        setSpamLimit(String(json.settings.spam_threshold ?? 5));
        setMentionLimit(String(json.settings.mention_threshold ?? 5));
        setRaidLimit(String(json.settings.anti_raid_threshold ?? 5));
        setNukeLimit(String(json.settings.anti_nuke_threshold ?? 3));
      }
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [router, currentUser?.guildId]);

  const fetchWhitelist = useCallback(async () => {
    try {
      const res = await fetch("/api/security/whitelist");
      if (res.ok) {
        const json = await res.json();
        setWhitelistEntries(json.entries || []);
      }
    } catch (err) {
      console.error("Fetch whitelist error:", err);
    }
  }, []);

  const fetchQuarantine = useCallback(async () => {
    try {
      const res = await fetch("/api/security/quarantine");
      if (res.ok) {
        const json = await res.json();
        setJailedUsers(json.jailedUsers || []);
      }
    } catch (err) {
      console.error("Fetch quarantine error:", err);
    }
  }, []);

  const fetchUser = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const json = await res.json();
        if (json.authenticated && json.user) {
          setCurrentUser(json.user);
          if (json.user.guildId) {
            fetchData(true, json.user.guildId);
          }
        }
      }
    } catch (err) {
      console.error("Fetch user error:", err);
    }
  }, [fetchData]);

  useEffect(() => {
    fetchUser();
    fetchData();
    fetchWhitelist();
    fetchQuarantine();
  }, [fetchUser, fetchData, fetchWhitelist, fetchQuarantine]);

  // Auto-refresh timer every 6 seconds
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchData(true);
      if (activeTab === "whitelist") fetchWhitelist();
      if (activeTab === "quarantine") fetchQuarantine();
    }, 6000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchData, fetchWhitelist, fetchQuarantine, activeTab]);

  async function handleToggle(moduleName: string, currentValue: boolean) {
    setActionLoading(moduleName);
    try {
      const res = await fetch("/api/security/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ module: moduleName, value: !currentValue }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      setBannerMessage(result.message);
      setTimeout(() => setBannerMessage(null), 4000);
      await fetchData(true);
    } catch (err: any) {
      alert(err.message || "Failed to toggle module.");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleEmergencyLockdown() {
    const isLockdown = data?.raidState === "LOCKDOWN";
    const confirmMsg = isLockdown
      ? "Are you sure you want to lift emergency lockdown and return server to NORMAL?"
      : "🚨 DANGER: Activating emergency lockdown will quarantine all incoming joins and max out all security shields. Proceed?";
    
    if (!window.confirm(confirmMsg)) return;

    setActionLoading("lockdown");
    try {
      const res = await fetch("/api/security/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ module: "emergency_lockdown" }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      setBannerMessage(result.message);
      setTimeout(() => setBannerMessage(null), 6000);
      await fetchData(true);
    } catch (err: any) {
      alert(err.message || "Failed to trigger lockdown.");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleSaveThresholds(e: React.FormEvent) {
    e.preventDefault();
    setActionLoading("thresholds");
    try {
      const res = await fetch("/api/security/thresholds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          spamLimit,
          mentionLimit,
          raidLimit,
          nukeLimit,
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      setThresholdsSaved(true);
      setTimeout(() => setThresholdsSaved(false), 3000);
      await fetchData(true);
    } catch (err: any) {
      alert(err.message || "Failed to save thresholds.");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleAddWhitelist(e: React.FormEvent) {
    e.preventDefault();
    if (!newValue.trim()) return;
    try {
      const res = await fetch("/api/security/whitelist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: newType, value: newValue.trim() }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      setNewValue("");
      fetchWhitelist();
      fetchData(true);
    } catch (err: any) {
      alert(err.message || "Failed to add whitelist.");
    }
  }

  async function handleDeleteWhitelist(id: number) {
    if (!window.confirm("Remove this whitelist entry?")) return;
    try {
      const res = await fetch(`/api/security/whitelist?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete whitelist item.");
      fetchWhitelist();
      fetchData(true);
    } catch (err: any) {
      alert(err.message);
    }
  }

  async function handleUnjail(userId: string) {
    if (!window.confirm(`Release member (${userId}) from quarantine?`)) return;
    try {
      const res = await fetch("/api/security/quarantine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (!res.ok) throw new Error("Failed to release user.");
      fetchQuarantine();
      fetchData(true);
    } catch (err: any) {
      alert(err.message);
    }
  }

  async function handleLogout() {
    await fetch("/api/auth", { method: "DELETE" });
    router.push("/login");
  }

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background text-slate-400">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-brand-red border-t-transparent mb-4" />
        <p className="text-sm">Connecting to SyncInk Security Core...</p>
      </div>
    );
  }

  const raidState = data?.raidState || "NORMAL";
  const isLockdown = raidState === "LOCKDOWN";

  return (
    <div className="min-h-screen bg-background text-slate-100 pb-20">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 border-b border-border/80 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-card border border-border shadow-glow overflow-hidden">
              <img
                src="https://files.catbox.moe/74l9su.png"
                alt="SyncInk Logo"
                className="h-7 w-7 object-contain"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-base tracking-tight">SyncInk Security</span>
                <span className="rounded-full bg-brand-red/15 px-2 py-0.5 text-[10px] font-semibold text-brand-red border border-brand-red/30">
                  SERVER DEFENSE
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {currentUser?.guildName ? `${currentUser.guildName} • ` : ""}Server ID: {data?.guildId || currentUser?.guildId || "1520461877073674392"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Live Sync Badge */}
            <div className="hidden md:flex items-center gap-2 rounded-full border border-border bg-surface-card px-3 py-1 text-xs text-slate-400">
              <span className={`h-2 w-2 rounded-full ${autoRefresh ? "bg-emerald-500 animate-ping" : "bg-slate-500"}`} />
              <span>Live Sync Active</span>
            </div>

            {/* Authenticated Discord User Badge */}
            {currentUser && (
              <div className="flex items-center gap-2.5 rounded-xl border border-border bg-surface-card/90 px-3 py-1.5 shadow-sm">
                {currentUser.avatar ? (
                  <img
                    src={`https://cdn.discordapp.com/avatars/${currentUser.id}/${currentUser.avatar}.png`}
                    alt={currentUser.username}
                    className="h-7 w-7 rounded-full object-cover ring-1 ring-border"
                  />
                ) : (
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#5865F2] text-xs font-bold text-white">
                    {(currentUser.global_name || currentUser.username || "U").charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex flex-col text-left">
                  <span className="text-xs font-semibold text-white leading-tight">
                    {currentUser.global_name || currentUser.username}
                  </span>
                  <span
                    className={`text-[10px] font-semibold leading-tight flex items-center gap-1 ${
                      currentUser.isOwner
                        ? "text-amber-400"
                        : currentUser.isAdmin
                        ? "text-emerald-400"
                        : "text-blue-400"
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full inline-block ${
                        currentUser.isOwner
                          ? "bg-amber-400 animate-pulse"
                          : currentUser.isAdmin
                          ? "bg-emerald-400"
                          : "bg-blue-400"
                      }`}
                    />
                    {currentUser.role || (currentUser.isOwner ? "Server Owner" : currentUser.isAdmin ? "Server Admin" : "Server Member")}
                  </span>
                </div>
              </div>
            )}

            <button
              onClick={() => fetchData()}
              disabled={refreshing}
              title="Refresh security metrics"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-surface-card text-slate-300 hover:text-white hover:border-slate-600 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin text-brand-red" : ""}`} />
            </button>

            <button
              onClick={handleLogout}
              title="Log out"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-surface-card text-slate-400 hover:text-red-400 hover:border-red-500/40 transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8 space-y-6">
        {/* Banner Alert if any */}
        {bannerMessage && (
          <div className="flex items-center gap-3 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            <span>{bannerMessage}</span>
          </div>
        )}

        {/* Emergency Lockdown Panic Banner */}
        <div
          className={`glass-card rounded-2xl p-5 border ${
            isLockdown
              ? "border-red-500/80 bg-red-950/40 pulse-lockdown"
              : "border-border/80 bg-surface-card/60"
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3.5">
              <div
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border ${
                  isLockdown
                    ? "border-red-500 bg-red-500/20 text-red-400"
                    : "border-border bg-surface text-slate-400"
                }`}
              >
                {isLockdown ? <Lock className="h-6 w-6" /> : <ShieldAlert className="h-6 w-6 text-brand-red" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-white">
                    {isLockdown ? "🚨 EMERGENCY LOCKDOWN ACTIVATED" : "Emergency Server Shield"}
                  </h2>
                  <span
                    className={`rounded-md px-2 py-0.5 text-xs font-bold uppercase tracking-wider ${
                      raidState === "LOCKDOWN"
                        ? "bg-red-500/20 text-red-400 border border-red-500/40"
                        : raidState === "ALERT"
                        ? "bg-orange-500/20 text-orange-400 border border-orange-500/40"
                        : raidState === "WATCH"
                        ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                        : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                    }`}
                  >
                    State: {raidState}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  {isLockdown
                    ? "Quarantine gate active. All incoming joins are blocked or jailed. Security shields maxed."
                    : "Instant kill-switch to isolate the server and prevent ongoing raids or attacks."}
                </p>
              </div>
            </div>

            <button
              onClick={handleEmergencyLockdown}
              disabled={actionLoading === "lockdown"}
              className={`flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold shadow-lg transition-all active:scale-[0.98] ${
                isLockdown
                  ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-glow-green"
                  : "bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white shadow-glow"
              }`}
            >
              {isLockdown ? (
                <>
                  <Unlock className="h-4 w-4" />
                  <span>Lift Lockdown (Restore Normal)</span>
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4" />
                  <span>Activate Panic Lockdown</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-card rounded-2xl p-4 flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-surface border border-border text-emerald-400">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs text-slate-400">Active Defense</p>
              <h3 className="text-lg font-bold text-white">Production Guard</h3>
              <p className="text-[11px] text-emerald-400 font-medium">All Systems Operational</p>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-4 flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-surface border border-border text-red-400">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs text-slate-400">Logged Incidents</p>
              <h3 className="text-lg font-bold text-white">{data?.stats.incidentCount || 0}</h3>
              <p className="text-[11px] text-slate-500">Forensics Record</p>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-4 flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-surface border border-border text-amber-400">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs text-slate-400">Quarantined Users</p>
              <h3 className="text-lg font-bold text-white">{data?.stats.jailedCount || 0}</h3>
              <p className="text-[11px] text-amber-400/80 font-medium">Jailed / Isolated</p>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-4 flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-surface border border-border text-cyan-400">
              <Eye className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs text-slate-400">Whitelist Exemptions</p>
              <h3 className="text-lg font-bold text-white">{data?.stats.whitelistCount || 0}</h3>
              <p className="text-[11px] text-cyan-400/80 font-medium">Trusted Entities</p>
            </div>
          </div>
        </div>

        {/* Security Modules Controls */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Sliders className="h-5 w-5 text-brand-red" />
                Security Defense Modules
              </h2>
              <p className="text-xs text-slate-400">
                Toggle shields in real-time. Changes sync automatically to the Discord bot within seconds.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* 1. Anti-Nuke */}
            <ModuleCard
              title="Anti-Nuke Shield"
              description="Intercepts rogue administrator kicks, bans, role deletions, and channel wipes."
              enabled={Boolean(data?.settings?.anti_nuke_enabled ?? true)}
              loading={actionLoading === "anti_nuke_enabled"}
              onToggle={() => handleToggle("anti_nuke_enabled", Boolean(data?.settings?.anti_nuke_enabled ?? true))}
              badge="CRITICAL PROTECTION"
            />

            {/* 2. Anti-Raid */}
            <ModuleCard
              title="Anti-Raid Engine"
              description="Monitors join velocity, flags burst raids, and auto-quarantines suspicious throwaways."
              enabled={Boolean(data?.settings?.anti_raid_enabled ?? true)}
              loading={actionLoading === "anti_raid_enabled"}
              onToggle={() => handleToggle("anti_raid_enabled", Boolean(data?.settings?.anti_raid_enabled ?? true))}
              badge="PROGRESSIVE STATES"
            />

            {/* 3. Anti-Spam */}
            <ModuleCard
              title="Anti-Spam & Strike Filter"
              description="Automated message rate-limiting, 24h strike tracking, and progressive timeouts."
              enabled={Boolean(data?.settings?.automod_enabled ?? false)}
              loading={actionLoading === "automod_enabled"}
              onToggle={() => handleToggle("automod_enabled", Boolean(data?.settings?.automod_enabled ?? false))}
              badge="STRIKE TIERS"
            />

            {/* 4. Phishing Guard */}
            <ModuleCard
              title="Phishing & Scam Guard"
              description="Deep regex & homoglyph scanner intercepting fake Nitro, Steam scams, and bad links."
              enabled={Boolean(data?.settings?.anti_phishing_enabled ?? true)}
              loading={actionLoading === "anti_phishing_enabled"}
              onToggle={() => handleToggle("anti_phishing_enabled", Boolean(data?.settings?.anti_phishing_enabled ?? true))}
              badge="LINK SHIELD"
            />

            {/* 5. Mass Mention Guard */}
            <ModuleCard
              title="Mass Mention Guard"
              description="Prevents mass pings, ghost-ping edits, and unauthorized user harassment."
              enabled={Boolean(data?.settings?.mention_guard_enabled ?? true)}
              loading={actionLoading === "mention_guard_enabled"}
              onToggle={() => handleToggle("mention_guard_enabled", Boolean(data?.settings?.mention_guard_enabled ?? true))}
              badge="PING DEFENSE"
            />

            {/* 6. Content & Word Filter */}
            <ModuleCard
              title="Smart Content Filter"
              description="De-obfuscates text against leetspeak, spacing, zalgo, and unicode homoglyphs."
              enabled={Boolean(data?.settings?.content_filter_enabled ?? true)}
              loading={actionLoading === "content_filter_enabled"}
              onToggle={() => handleToggle("content_filter_enabled", Boolean(data?.settings?.content_filter_enabled ?? true))}
              badge="DE-OBFUSCATION"
            />
          </div>
        </section>

        {/* Sensitivity Thresholds Form */}
        <section className="glass-card rounded-2xl p-6 border border-border">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Settings className="h-5 w-5 text-brand-red" />
                Sensitivity Thresholds Tuning
              </h2>
              <p className="text-xs text-slate-400">
                Adjust trigger tolerances before automated moderation, timeouts, or quarantines activate.
              </p>
            </div>
            {thresholdsSaved && (
              <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-full">
                <CheckCircle2 className="h-3.5 w-3.5" /> Saved & Synced to Bot
              </span>
            )}
          </div>

          <form onSubmit={handleSaveThresholds} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Spam Message Limit (10s window)
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={spamLimit}
                  onChange={(e) => setSpamLimit(e.target.value)}
                  className="w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm text-white focus:border-brand-red outline-none"
                />
                <span className="text-[11px] text-slate-500">Triggers strike at limit</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Mass Mention Limit (Pings)
                </label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={mentionLimit}
                  onChange={(e) => setMentionLimit(e.target.value)}
                  className="w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm text-white focus:border-brand-red outline-none"
                />
                <span className="text-[11px] text-slate-500">Max allowed mentions</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Anti-Raid Join Burst Limit (10s)
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={raidLimit}
                  onChange={(e) => setRaidLimit(e.target.value)}
                  className="w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm text-white focus:border-brand-red outline-none"
                />
                <span className="text-[11px] text-slate-500">Elevates state to ALERT</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Anti-Nuke Rogue Action Limit (10s)
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={nukeLimit}
                  onChange={(e) => setNukeLimit(e.target.value)}
                  className="w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm text-white focus:border-brand-red outline-none"
                />
                <span className="text-[11px] text-slate-500">Quarantines rogue staff</span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={actionLoading === "thresholds"}
                className="flex items-center gap-2 rounded-xl bg-surface-hover hover:bg-surface border border-border px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:border-slate-500 active:scale-[0.99] disabled:opacity-50"
              >
                <span>{actionLoading === "thresholds" ? "Updating..." : "Save Thresholds"}</span>
              </button>
            </div>
          </form>
        </section>

        {/* Forensic & Audit Records Section */}
        <section className="glass-card rounded-2xl border border-border overflow-hidden">
          {/* Tabs Navigation */}
          <div className="flex border-b border-border bg-surface/50 px-4 pt-3 gap-2">
            <button
              onClick={() => setActiveTab("incidents")}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all border-b-2 ${
                activeTab === "incidents"
                  ? "border-brand-red text-white bg-surface-card"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              <FileText className="h-4 w-4" />
              <span>Forensic Incident Stream ({data?.incidents?.length || 0})</span>
            </button>

            <button
              onClick={() => {
                setActiveTab("whitelist");
                fetchWhitelist();
              }}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all border-b-2 ${
                activeTab === "whitelist"
                  ? "border-brand-red text-white bg-surface-card"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>Whitelist Exemptions ({whitelistEntries.length})</span>
            </button>

            <button
              onClick={() => {
                setActiveTab("quarantine");
                fetchQuarantine();
              }}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all border-b-2 ${
                activeTab === "quarantine"
                  ? "border-brand-red text-white bg-surface-card"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              <Users className="h-4 w-4" />
              <span>Quarantine Roster ({jailedUsers.length})</span>
            </button>
          </div>

          <div className="p-6">
            {/* TAB 1: INCIDENTS */}
            {activeTab === "incidents" && (
              <div>
                {data?.incidents && data.incidents.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-300">
                      <thead className="bg-surface text-slate-400 uppercase tracking-wider text-[10px] border-b border-border">
                        <tr>
                          <th className="py-3 px-4">Time</th>
                          <th className="py-3 px-4">Module</th>
                          <th className="py-3 px-4">Target / User ID</th>
                          <th className="py-3 px-4">Action Taken</th>
                          <th className="py-3 px-4">Severity</th>
                          <th className="py-3 px-4">Details</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/60">
                        {data.incidents.map((inc) => (
                          <tr key={inc.id} className="hover:bg-surface/40 transition-colors">
                            <td className="py-3 px-4 font-mono text-slate-400 whitespace-nowrap">
                              {new Date(inc.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </td>
                            <td className="py-3 px-4 font-semibold text-white">{inc.module}</td>
                            <td className="py-3 px-4 font-mono text-slate-300">
                              {inc.user_id === "0" ? "System / Console" : inc.user_id}
                            </td>
                            <td className="py-3 px-4">
                              <span className="rounded-md bg-surface px-2 py-0.5 font-semibold text-white border border-border">
                                {inc.action_taken}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span
                                className={`rounded px-2 py-0.5 font-bold uppercase text-[10px] ${
                                  inc.severity === "CRITICAL"
                                    ? "bg-red-500/20 text-red-400 border border-red-500/40"
                                    : inc.severity === "HIGH"
                                    ? "bg-orange-500/20 text-orange-400 border border-orange-500/40"
                                    : inc.severity === "MEDIUM"
                                    ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                                    : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                                }`}
                              >
                                {inc.severity}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-slate-400 max-w-xs truncate" title={inc.details}>
                              {inc.details || "No extra details recorded."}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-500">
                    <ShieldCheck className="h-10 w-10 mx-auto mb-2 text-slate-600" />
                    <p className="text-sm">No security incidents logged recently. Server is calm & secure.</p>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: WHITELIST */}
            {activeTab === "whitelist" && (
              <div className="space-y-6">
                {/* Add Whitelist Form */}
                <form onSubmit={handleAddWhitelist} className="glass-panel p-4 rounded-xl flex flex-col sm:flex-row gap-3 items-end">
                  <div className="w-full sm:w-44">
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Entity Type</label>
                    <select
                      value={newType}
                      onChange={(e) => setNewType(e.target.value)}
                      className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-white outline-none focus:border-brand-red"
                    >
                      <option value="domain">Domain</option>
                      <option value="user">User ID</option>
                      <option value="role">Role ID</option>
                      <option value="channel">Channel ID</option>
                    </select>
                  </div>

                  <div className="w-full flex-1">
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Target (e.g. syncink.com, 1520462320235577454)
                    </label>
                    <input
                      type="text"
                      value={newValue}
                      onChange={(e) => setNewValue(e.target.value)}
                      placeholder="Enter domain or Discord snowflake ID..."
                      className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-white outline-none focus:border-brand-red"
                    />
                  </div>

                  <button
                    type="submit"
                    className="flex items-center gap-2 rounded-xl bg-brand-red hover:bg-brand-crimson text-white px-4 py-2 text-sm font-semibold transition-all shadow-glow shrink-0"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Exemption</span>
                  </button>
                </form>

                {/* Whitelist Table */}
                {whitelistEntries.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-300">
                      <thead className="bg-surface text-slate-400 uppercase tracking-wider text-[10px] border-b border-border">
                        <tr>
                          <th className="py-3 px-4">Type</th>
                          <th className="py-3 px-4">Target Entity / Domain</th>
                          <th className="py-3 px-4">Added Date</th>
                          <th className="py-3 px-4 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/60">
                        {whitelistEntries.map((e) => (
                          <tr key={e.id} className="hover:bg-surface/40 transition-colors">
                            <td className="py-3 px-4">
                              <span className="rounded bg-surface px-2 py-0.5 font-bold uppercase text-[10px] text-cyan-400 border border-cyan-500/30">
                                {e.entity_type}
                              </span>
                            </td>
                            <td className="py-3 px-4 font-mono font-medium text-white">{e.entity_id_or_val}</td>
                            <td className="py-3 px-4 text-slate-400">
                              {new Date(e.created_at).toLocaleDateString()}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <button
                                onClick={() => handleDeleteWhitelist(e.id)}
                                className="text-red-400 hover:text-red-300 p-1 rounded hover:bg-red-500/10 transition-colors"
                                title="Delete exemption"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-500">
                    <p className="text-sm">No whitelist exemptions created yet.</p>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: QUARANTINE */}
            {activeTab === "quarantine" && (
              <div>
                {jailedUsers.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-300">
                      <thead className="bg-surface text-slate-400 uppercase tracking-wider text-[10px] border-b border-border">
                        <tr>
                          <th className="py-3 px-4">User ID</th>
                          <th className="py-3 px-4">Reason</th>
                          <th className="py-3 px-4">Jailed At</th>
                          <th className="py-3 px-4 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/60">
                        {jailedUsers.map((u) => (
                          <tr key={u.id} className="hover:bg-surface/40 transition-colors">
                            <td className="py-3 px-4 font-mono font-semibold text-white">{u.user_id}</td>
                            <td className="py-3 px-4 text-slate-400">{u.reason || "Automod Violation"}</td>
                            <td className="py-3 px-4 text-slate-400">
                              {new Date(u.jailed_at).toLocaleString()}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <button
                                onClick={() => handleUnjail(u.user_id)}
                                className="rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 px-3 py-1 text-xs font-semibold transition-colors"
                              >
                                Release / Unjail
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-500">
                    <Users className="h-10 w-10 mx-auto mb-2 text-slate-600" />
                    <p className="text-sm">No members are currently quarantined or serving isolation sentences.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

function ModuleCard({
  title,
  description,
  enabled,
  loading,
  onToggle,
  badge
}: {
  title: string;
  description: string;
  enabled: boolean;
  loading: boolean;
  onToggle: () => void;
  badge: string;
}) {
  return (
    <div className="glass-card rounded-2xl p-5 border border-border flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-surface px-2 py-0.5 rounded border border-border">
            {badge}
          </span>
          <span
            className={`text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${
              enabled ? "text-emerald-400" : "text-red-400"
            }`}
          >
            <span className={`h-2 w-2 rounded-full ${enabled ? "bg-emerald-400 shadow-glow-green" : "bg-red-400"}`} />
            {enabled ? "ONLINE" : "DISABLED"}
          </span>
        </div>
        <h3 className="font-bold text-white text-base">{title}</h3>
        <p className="text-xs text-slate-400 mt-1 leading-relaxed">{description}</p>
      </div>

      <div className="mt-5 pt-3 border-t border-border/60 flex items-center justify-between">
        <span className="text-xs text-slate-400">Toggle Module:</span>
        <button
          onClick={onToggle}
          disabled={loading}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50 ${
            enabled ? "bg-emerald-500" : "bg-slate-700"
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              enabled ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
      </div>
    </div>
  );
}
