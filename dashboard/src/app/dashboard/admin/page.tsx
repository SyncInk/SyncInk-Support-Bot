"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Crown,
  Shield,
  Users,
  Settings,
  History,
  ClipboardList,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Plus,
  Trash2,
  RefreshCw,
  Search,
  ExternalLink,
  ChevronRight,
  Sliders,
  Server,
  Activity,
  Layers,
  ArrowLeft,
} from "lucide-react";
import { PublicNavbar } from "@/components/PublicNavbar";
import { PublicFooter } from "@/components/PublicFooter";

interface AdminRole {
  id: number;
  user_id: string;
  username: string;
  role: string;
  granted_by: string;
  granted_by_name: string;
  notes: string | null;
  created_at: string;
}

interface AuditLog {
  id: number;
  actor_id: string;
  actor_name: string;
  action: string;
  target_id: string | null;
  target_name: string | null;
  details: any;
  created_at: string;
}

export default function OwnerControlPanel() {
  const [activeTab, setActiveTab] = useState<"overview" | "roles" | "audit" | "settings">("overview");

  // State
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  // Overview data
  const [overview, setOverview] = useState<any>(null);

  // Roles data
  const [roles, setRoles] = useState<AdminRole[]>([]);
  const [roleSearch, setRoleSearch] = useState("");
  const [newUserId, setNewUserId] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [newRole, setNewRole] = useState("staff");
  const [newNotes, setNewNotes] = useState("");
  const [assigning, setAssigning] = useState(false);
  const [roleFeedback, setRoleFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Audit Logs data
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Settings data
  const [appSettings, setAppSettings] = useState<Record<string, string>>({
    recruitment_enabled: "true",
    staff_apply_channel: "1538896833852481556",
    developer_apply_channel: "1538896901007736872",
    support_server_invite: "https://discord.gg/PmxfJwmQuB",
    telemetry_mode: "LIVE",
  });
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsFeedback, setSettingsFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // 1. Initial Load & Auth Check
  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch("/api/admin/overview");
        if (res.status === 403 || res.status === 401) {
          setAuthorized(false);
          setLoading(false);
          return;
        }

        const data = await res.json();
        setOverview(data);
        setAuthorized(true);

        // Fetch additional tabs data
        fetchRoles();
        fetchAuditLogs();
        fetchSettings();
      } catch (err) {
        setAuthorized(false);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  async function fetchRoles() {
    try {
      const res = await fetch("/api/admin/roles");
      if (res.ok) {
        const data = await res.json();
        setRoles(data.roles || []);
      }
    } catch {}
  }

  async function fetchAuditLogs() {
    try {
      const res = await fetch("/api/admin/audit-logs");
      if (res.ok) {
        const data = await res.json();
        setAuditLogs(data.logs || []);
      }
    } catch {}
  }

  async function fetchSettings() {
    try {
      const res = await fetch("/api/admin/settings");
      if (res.ok) {
        const data = await res.json();
        if (data.settings) {
          setAppSettings(data.settings);
        }
      }
    } catch {}
  }

  // Handle Role Assignment
  async function handleAssignRole(e: React.FormEvent) {
    e.preventDefault();
    setRoleFeedback(null);
    setAssigning(true);

    try {
      const res = await fetch("/api/admin/roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: newUserId,
          username: newUsername,
          role: newRole,
          notes: newNotes,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setRoleFeedback({ type: "success", message: data.message || "Role assigned successfully." });
        setNewUserId("");
        setNewUsername("");
        setNewNotes("");
        fetchRoles();
        fetchAuditLogs();
      } else {
        setRoleFeedback({ type: "error", message: data.error || "Failed to assign role." });
      }
    } catch (err: any) {
      setRoleFeedback({ type: "error", message: err.message || "Network error" });
    } finally {
      setAssigning(false);
    }
  }

  // Handle Role Revocation
  async function handleRevokeRole(userId: string, username: string) {
    if (!confirm(`Are you sure you want to revoke all administrative permissions for ${username} (${userId})?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/roles?userId=${userId}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (res.ok) {
        fetchRoles();
        fetchAuditLogs();
      } else {
        alert(data.error || "Failed to revoke role");
      }
    } catch (err) {
      alert("Failed to send revocation request");
    }
  }

  // Handle Settings Save
  async function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault();
    setSettingsFeedback(null);
    setSavingSettings(true);

    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings: appSettings }),
      });

      const data = await res.json();
      if (res.ok) {
        setSettingsFeedback({ type: "success", message: "Ecosystem settings saved successfully." });
        fetchAuditLogs();
      } else {
        setSettingsFeedback({ type: "error", message: data.error || "Failed to save settings." });
      }
    } catch (err: any) {
      setSettingsFeedback({ type: "error", message: err.message || "Network error" });
    } finally {
      setSavingSettings(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#060812] text-slate-100 flex flex-col font-sans">
        <PublicNavbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-3">
            <RefreshCw className="w-8 h-8 text-amber-400 animate-spin mx-auto" />
            <p className="text-sm text-slate-400">Verifying Owner Credentials...</p>
          </div>
        </main>
        <PublicFooter />
      </div>
    );
  }

  if (authorized === false) {
    return (
      <div className="min-h-screen bg-[#060812] text-slate-100 flex flex-col font-sans">
        <PublicNavbar />
        <main className="flex-1 flex items-center justify-center px-4 py-20">
          <div className="max-w-md w-full text-center bg-[#0b0e1d] border border-red-500/20 rounded-2xl p-8 space-y-4 shadow-xl">
            <div className="w-14 h-14 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center mx-auto text-red-400">
              <Lock className="w-7 h-7" />
            </div>
            <h1 className="text-xl font-bold text-white">Access Denied</h1>
            <p className="text-xs text-slate-400 leading-relaxed">
              This control panel is strictly restricted to the verified Primary Server Owner (ID: <code>930306512864280607</code>).
            </p>
            <div className="pt-2">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] text-slate-200 text-xs font-semibold border border-white/10 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Return to Multi-Bot Console</span>
              </Link>
            </div>
          </div>
        </main>
        <PublicFooter />
      </div>
    );
  }

  const filteredRoles = roles.filter(
    (r) =>
      !roleSearch ||
      r.username.toLowerCase().includes(roleSearch.toLowerCase()) ||
      r.user_id.includes(roleSearch) ||
      r.role.toLowerCase().includes(roleSearch.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#060812] text-slate-100 flex flex-col font-sans selection:bg-amber-500/30 selection:text-white">
      <PublicNavbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Header Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/[0.08] pb-6 mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold uppercase tracking-wider mb-2">
              <Crown className="w-3.5 h-3.5 text-amber-400" />
              <span>Owner Administration Tier</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Owner Control Panel
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Protected governance hub for ecosystem access, role assignments, audit logs, and website settings.
            </p>
          </div>

          {/* Quick Navigation Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: "overview", label: "Overview", icon: Layers },
              { id: "roles", label: "Access & Roles", icon: Users },
              { id: "audit", label: "Audit Logs", icon: History },
              { id: "settings", label: "Settings", icon: Settings },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                    activeTab === tab.id
                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.2)]"
                      : "bg-white/[0.03] text-slate-400 hover:text-slate-200 border border-white/5 hover:bg-white/[0.06]"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ========================================================= */}
        {/* TAB 1: OVERVIEW */}
        {/* ========================================================= */}
        {activeTab === "overview" && (
          <div className="space-y-8">
            {/* Metric Strips */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-[#0b0e1d] border border-white/[0.08] rounded-2xl p-5 shadow-sm">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Total Applications
                </span>
                <div className="text-3xl font-black text-white mt-1">
                  {overview?.appStats?.total || 0}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Staff & Developer Submissions
                </div>
              </div>

              <div className="bg-[#0b0e1d] border border-white/[0.08] rounded-2xl p-5 shadow-sm">
                <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
                  Pending Review
                </span>
                <div className="text-3xl font-black text-amber-300 mt-1">
                  {overview?.appStats?.pending || 0}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Awaiting Moderator Action
                </div>
              </div>

              <div className="bg-[#0b0e1d] border border-white/[0.08] rounded-2xl p-5 shadow-sm">
                <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">
                  Authorized Staff
                </span>
                <div className="text-3xl font-black text-blue-300 mt-1">
                  {overview?.adminCount || 1}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Role-Managed Identities
                </div>
              </div>

              <div className="bg-[#0b0e1d] border border-white/[0.08] rounded-2xl p-5 shadow-sm">
                <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                  Accepted Candidates
                </span>
                <div className="text-3xl font-black text-emerald-300 mt-1">
                  {overview?.appStats?.accepted || 0}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Approved Team Members
                </div>
              </div>
            </div>

            {/* Quick Actions & Ecosystem Status */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Quick Actions */}
              <div className="lg:col-span-1 bg-[#0b0e1d] border border-white/[0.08] rounded-2xl p-6 space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Shield className="w-4 h-4 text-blue-400" />
                  <span>Administrative Shortcuts</span>
                </h3>

                <div className="space-y-2">
                  <Link
                    href="/dashboard/applications"
                    className="w-full flex items-center justify-between p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 text-xs font-medium text-slate-200 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <ClipboardList className="w-4 h-4 text-amber-400" />
                      <span>Review Candidate Applications</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-500" />
                  </Link>

                  <button
                    onClick={() => setActiveTab("roles")}
                    className="w-full flex items-center justify-between p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 text-xs font-medium text-slate-200 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <Users className="w-4 h-4 text-blue-400" />
                      <span>Manage Staff & Developer Roles</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-500" />
                  </button>

                  <Link
                    href="/dashboard/security"
                    className="w-full flex items-center justify-between p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 text-xs font-medium text-slate-200 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <Lock className="w-4 h-4 text-emerald-400" />
                      <span>AutoMod Quarantine & Security</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-500" />
                  </Link>

                  <button
                    onClick={() => setActiveTab("settings")}
                    className="w-full flex items-center justify-between p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 text-xs font-medium text-slate-200 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <Settings className="w-4 h-4 text-cyan-400" />
                      <span>Configure Website Parameters</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-500" />
                  </button>
                </div>
              </div>

              {/* Verified Ecosystem Telemetry */}
              <div className="lg:col-span-2 bg-[#0b0e1d] border border-white/[0.08] rounded-2xl p-6">
                <div className="flex items-center justify-between pb-4 border-b border-white/[0.06] mb-4">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-400" />
                    <span>Active Bot Ecosystem Health</span>
                  </h3>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/25">
                    All Nodes Synchronized
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(overview?.services || []).map((srv: any) => (
                    <div
                      key={srv.name}
                      className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.05] flex items-center justify-between"
                    >
                      <div>
                        <div className="text-xs font-bold text-white">{srv.name}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{srv.type}</div>
                      </div>
                      <div className="text-right">
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          {srv.status}
                        </span>
                        <div className="text-[10px] text-slate-500 font-mono">{srv.version}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent Audit Log Preview */}
            <div className="bg-[#0b0e1d] border border-white/[0.08] rounded-2xl p-6">
              <div className="flex items-center justify-between pb-4 border-b border-white/[0.06] mb-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <History className="w-4 h-4 text-amber-400" />
                  <span>Recent Administrative Activity</span>
                </h3>
                <button
                  onClick={() => setActiveTab("audit")}
                  className="text-xs font-semibold text-amber-400 hover:text-amber-300"
                >
                  View All Logs →
                </button>
              </div>

              {(overview?.recentAudits || []).length === 0 ? (
                <p className="text-xs text-slate-500 py-4 text-center">No recent actions logged.</p>
              ) : (
                <div className="space-y-2">
                  {overview.recentAudits.slice(0, 5).map((log: any) => (
                    <div
                      key={log.id}
                      className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                          {log.action}
                        </span>
                        <span className="text-slate-300 font-medium">
                          by <strong className="text-white">{log.actor_name}</strong>
                        </span>
                        {log.target_name && (
                          <span className="text-slate-400">
                            → {log.target_name} ({log.target_id})
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-500">
                        {new Date(log.created_at).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: ACCESS & ROLES MANAGEMENT */}
        {/* ========================================================= */}
        {activeTab === "roles" && (
          <div className="space-y-8">
            {/* Form: Assign / Update Role */}
            <div className="bg-[#0b0e1d] border border-white/[0.08] rounded-2xl p-6 sm:p-8">
              <h3 className="text-base font-bold text-white flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-blue-400" />
                <span>Grant or Update Administrator Role</span>
              </h3>
              <p className="text-xs text-slate-400 mb-6">
                Assign application-level privileges to Discord members. The Primary Owner is immutable and cannot be demoted.
              </p>

              {roleFeedback && (
                <div
                  className={`p-3 rounded-xl text-xs font-semibold mb-5 border ${
                    roleFeedback.type === "success"
                      ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/25"
                      : "bg-red-500/10 text-red-300 border-red-500/25"
                  }`}
                >
                  {roleFeedback.message}
                </div>
              )}

              <form onSubmit={handleAssignRole} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Discord User ID *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 1520457643842342912"
                      value={newUserId}
                      onChange={(e) => setNewUserId(e.target.value.trim())}
                      className="w-full bg-[#060812] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Discord Username / Tag
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. sync_developer"
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      className="w-full bg-[#060812] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Assigned Role *
                    </label>
                    <select
                      value={newRole}
                      onChange={(e) => setNewRole(e.target.value)}
                      className="w-full bg-[#060812] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="admin">Administrator (Applications & Management)</option>
                      <option value="staff">Staff Reviewer (Candidate Review)</option>
                      <option value="developer">Developer (Tech & Applications)</option>
                      <option value="reviewer">Read-Only Reviewer</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Administrative Notes / Justification
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Appointed lead moderator for ticket bot support"
                    value={newNotes}
                    onChange={(e) => setNewNotes(e.target.value)}
                    className="w-full bg-[#060812] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={assigning}
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-all shadow-[0_0_20px_rgba(88,101,242,0.3)] disabled:opacity-50 flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{assigning ? "Saving Role..." : "Assign / Update Role"}</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Current Role Assignments Table */}
            <div className="bg-[#0b0e1d] border border-white/[0.08] rounded-2xl p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.06] mb-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Shield className="w-4 h-4 text-amber-400" />
                  <span>Authorized Administrative Accounts</span>
                </h3>

                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Filter by user or role..."
                    value={roleSearch}
                    onChange={(e) => setRoleSearch(e.target.value)}
                    className="w-full bg-[#060812] border border-white/10 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-white/[0.06] text-slate-400">
                      <th className="py-2.5 px-3">Identity</th>
                      <th className="py-2.5 px-3">Role</th>
                      <th className="py-2.5 px-3">Granted By</th>
                      <th className="py-2.5 px-3">Notes</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {filteredRoles.map((r) => {
                      const isMasterOwner = r.user_id === "930306512864280607";
                      return (
                        <tr key={r.user_id} className="hover:bg-white/[0.01]">
                          <td className="py-3 px-3">
                            <div className="font-bold text-white">{r.username}</div>
                            <div className="text-[10px] text-slate-500 font-mono">{r.user_id}</div>
                          </td>
                          <td className="py-3 px-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                r.role === "owner"
                                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                                  : r.role === "admin"
                                  ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                                  : "bg-white/[0.05] text-slate-300 border border-white/10"
                              }`}
                            >
                              {r.role}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-slate-300">
                            <div>{r.granted_by_name}</div>
                            <div className="text-[10px] text-slate-500">
                              {new Date(r.created_at).toLocaleDateString()}
                            </div>
                          </td>
                          <td className="py-3 px-3 text-slate-400 italic max-w-xs truncate">
                            {r.notes || "—"}
                          </td>
                          <td className="py-3 px-3 text-right">
                            {isMasterOwner ? (
                              <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-1 rounded border border-amber-500/20">
                                Protected Owner
                              </span>
                            ) : (
                              <button
                                onClick={() => handleRevokeRole(r.user_id, r.username)}
                                className="px-2.5 py-1 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-[11px] font-semibold transition-colors flex items-center gap-1 ml-auto"
                              >
                                <Trash2 className="w-3 h-3" />
                                <span>Revoke</span>
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: AUDIT LOGS */}
        {/* ========================================================= */}
        {activeTab === "audit" && (
          <div className="bg-[#0b0e1d] border border-white/[0.08] rounded-2xl p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-white/[0.06]">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <History className="w-4 h-4 text-amber-400" />
                  <span>Security &amp; Administrative Audit Trail</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Immutable chronological log of privileged operations performed across the platform.
                </p>
              </div>

              <button
                onClick={fetchAuditLogs}
                className="px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-xs font-semibold text-slate-300 border border-white/10 flex items-center gap-1.5 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh</span>
              </button>
            </div>

            {auditLogs.length === 0 ? (
              <p className="text-xs text-slate-500 py-12 text-center">No audit trail entries recorded yet.</p>
            ) : (
              <div className="space-y-2.5">
                {auditLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-4 rounded-xl bg-white/[0.02] border border-white/5 flex flex-col sm:flex-row sm:items-start justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/25">
                          {log.action}
                        </span>
                        <span className="font-bold text-white">{log.actor_name}</span>
                        <span className="text-slate-500 font-mono">({log.actor_id})</span>
                      </div>

                      {log.target_name && (
                        <div className="text-slate-400 text-[11px]">
                          Target: <strong className="text-slate-300">{log.target_name}</strong> (ID: {log.target_id})
                        </div>
                      )}

                      {log.details && Object.keys(log.details).length > 0 && (
                        <pre className="text-[10px] text-slate-400 font-mono bg-black/40 p-2 rounded border border-white/5 overflow-x-auto max-w-2xl mt-1">
                          {JSON.stringify(log.details, null, 2)}
                        </pre>
                      )}
                    </div>

                    <div className="text-right shrink-0 text-slate-500 text-[11px]">
                      {new Date(log.created_at).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 4: WEBSITE CONFIGURATION */}
        {/* ========================================================= */}
        {activeTab === "settings" && (
          <div className="bg-[#0b0e1d] border border-white/[0.08] rounded-2xl p-6 sm:p-8 space-y-6">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Settings className="w-4 h-4 text-cyan-400" />
                <span>Platform Environment Configuration</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Configure runtime behavior without restarting or redeploying the web ecosystem.
              </p>
            </div>

            {settingsFeedback && (
              <div
                className={`p-3 rounded-xl text-xs font-semibold border ${
                  settingsFeedback.type === "success"
                    ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/25"
                    : "bg-red-500/10 text-red-300 border-red-500/25"
                }`}
              >
                {settingsFeedback.message}
              </div>
            )}

            <form onSubmit={handleSaveSettings} className="space-y-6 max-w-2xl">
              <div className="space-y-4">
                {/* Recruitment Enabled Toggle */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5">
                  <div>
                    <div className="text-xs font-bold text-white">Public Recruitment Portal</div>
                    <div className="text-[11px] text-slate-400">
                      When active, visitors can submit Staff & Developer applications.
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setAppSettings((prev) => ({
                        ...prev,
                        recruitment_enabled: prev.recruitment_enabled === "true" ? "false" : "true",
                      }))
                    }
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                      appSettings.recruitment_enabled === "true"
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                        : "bg-red-500/20 text-red-300 border border-red-500/30"
                    }`}
                  >
                    {appSettings.recruitment_enabled === "true" ? "ACTIVE" : "PAUSED"}
                  </button>
                </div>

                {/* Staff Channel ID */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Staff Application Channel ID
                  </label>
                  <input
                    type="text"
                    value={appSettings.staff_apply_channel || ""}
                    onChange={(e) =>
                      setAppSettings((prev) => ({ ...prev, staff_apply_channel: e.target.value.trim() }))
                    }
                    className="w-full bg-[#060812] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Guild: 1520457643842342912 • Default: 1538896833852481556
                  </span>
                </div>

                {/* Developer Channel ID */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Developer Application Channel ID
                  </label>
                  <input
                    type="text"
                    value={appSettings.developer_apply_channel || ""}
                    onChange={(e) =>
                      setAppSettings((prev) => ({ ...prev, developer_apply_channel: e.target.value.trim() }))
                    }
                    className="w-full bg-[#060812] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Guild: 1520457643842342912 • Default: 1538896901007736872
                  </span>
                </div>

                {/* Support Server Invite URL */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Official Discord Support Invite
                  </label>
                  <input
                    type="text"
                    value={appSettings.support_server_invite || ""}
                    onChange={(e) =>
                      setAppSettings((prev) => ({ ...prev, support_server_invite: e.target.value.trim() }))
                    }
                    className="w-full bg-[#060812] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Configured: https://discord.gg/PmxfJwmQuB
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={savingSettings}
                  className="px-6 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] disabled:opacity-50"
                >
                  {savingSettings ? "Saving Settings..." : "Save Configuration"}
                </button>
              </div>
            </form>
          </div>
        )}
      </main>

      <PublicFooter />
    </div>
  );
}
