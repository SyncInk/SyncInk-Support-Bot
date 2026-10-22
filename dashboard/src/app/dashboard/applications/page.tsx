"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FileText,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  ExternalLink,
  Shield,
  Code,
  Users,
  Copy,
  Check,
  ChevronRight,
  ArrowLeft,
  RefreshCw,
  Trash2,
  MessageSquare,
  Sparkles,
  Calendar,
  Globe,
  Tag,
  Lock,
  Layers,
} from "lucide-react";
import { PublicNavbar } from "@/components/PublicNavbar";
import { PublicFooter } from "@/components/PublicFooter";
import { DISCORD_CUSTOM_EMOJIS } from "@/lib/custom-emojis";

/**
 * Interactive Discord Custom Emoji Component
 * Renders high-resolution custom emojis inside a polished, semi-transparent frosted box.
 */
function DiscordEmoji({
  src,
  alt,
  size = "md",
  className = "",
}: {
  src: string;
  alt: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
}) {
  const boxClasses = {
    xs: "w-5 h-5 rounded p-0.5",
    sm: "w-6 h-6 rounded-md p-1",
    md: "w-7 h-7 rounded-lg p-1",
    lg: "w-9 h-9 rounded-xl p-1.5",
    xl: "w-11 h-11 rounded-xl p-2",
  };
  const imgClasses = {
    xs: "w-3.5 h-3.5",
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
    xl: "w-7 h-7",
  };
  return (
    <span
      className={`inline-flex items-center justify-center bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.1] hover:border-white/[0.22] backdrop-blur-sm shadow-[0_2px_8px_rgba(0,0,0,0.35)] transition-all duration-200 hover:scale-105 shrink-0 align-middle ${boxClasses[size]} ${className}`}
      title={alt}
    >
      <img
        src={src}
        alt={alt}
        className={`object-contain select-none transition-transform duration-200 ${imgClasses[size]}`}
        loading="lazy"
      />
    </span>
  );
}

interface ApplicationItem {
  id: number;
  guild_id: string;
  user_id: string;
  username: string;
  global_name: string | null;
  avatar: string | null;
  app_type: "staff" | "developer";
  age: number;
  timezone: string;
  availability: string | null;
  reason: string | null;
  experience: string | null;
  scenario_1: string | null;
  scenario_2: string | null;
  scenario_3: string | null;
  languages: string | null;
  portfolio: string | null;
  bot_experience: string | null;
  complex_features: string | null;
  attachment_name: string | null;
  attachment_size: number | null;
  status: "PENDING" | "UNDER_REVIEW" | "ACCEPTED" | "REJECTED";
  reviewer_id: string | null;
  reviewer_name: string | null;
  reviewer_notes: string | null;
  created_at: string;
  reviewed_at: string | null;
}

interface ApplicationStats {
  total: number;
  pending: number;
  under_review: number;
  accepted: number;
  rejected: number;
}

interface CurrentUser {
  id: string;
  username: string;
  global_name?: string | null;
  avatar?: string | null;
  isOwner?: boolean;
  isAdmin?: boolean;
  isStaff?: boolean;
  role?: string;
  roleType?: string;
  roleIcon?: string;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export default function ApplicationsAdminPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [stats, setStats] = useState<ApplicationStats>({
    total: 0,
    pending: 0,
    under_review: 0,
    accepted: 0,
    rejected: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"ALL" | "staff" | "developer">("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Selected for Detailed View Modal
  const [selectedApp, setSelectedApp] = useState<ApplicationItem | null>(null);
  const [reviewStatus, setReviewStatus] = useState<string>("PENDING");
  const [reviewNotes, setReviewNotes] = useState("");
  const [savingReview, setSavingReview] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const isStaffOrAdmin = Boolean(
    currentUser?.isStaff ||
    currentUser?.isAdmin ||
    currentUser?.isOwner ||
    currentUser?.id === "admin"
  );
  const canModify = Boolean(currentUser?.isAdmin || currentUser?.isOwner || currentUser?.id === "admin");

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Auth check
  useEffect(() => {
    async function checkUser() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.status === 401) {
          router.push("/login?redirect=/dashboard/applications");
          return;
        }
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated && data.user) {
            setCurrentUser(data.user);
            if (!data.user.isStaff && !data.user.isAdmin && !data.user.isOwner && data.user.id !== "admin") {
              router.push("/dashboard");
              return;
            }
          }
        }
      } catch (err) {
        console.error("Auth check failed:", err);
      } finally {
        setAuthLoading(false);
      }
    }
    checkUser();
  }, [router]);

  // Load applications
  const fetchApplications = useCallback(async () => {
    setRefreshing(true);
    try {
      const params = new URLSearchParams();
      if (typeFilter !== "ALL") params.set("type", typeFilter);
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      if (search.trim()) params.set("search", search.trim());
      params.set("limit", "100");

      const res = await fetch(`/api/applications?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setApplications(data.applications || []);
        if (data.stats) {
          setStats(data.stats);
        }
      }
    } catch (err) {
      console.error("Failed to fetch applications:", err);
      showToast("Failed to load applications from server.", "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [typeFilter, statusFilter, search]);

  useEffect(() => {
    if (currentUser && isStaffOrAdmin) {
      fetchApplications();
    }
  }, [currentUser, isStaffOrAdmin, fetchApplications]);

  // Update Review Handler
  const handleUpdateStatus = async (newStatus: string) => {
    if (!selectedApp) return;
    setSavingReview(true);
    try {
      const res = await fetch("/api/applications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedApp.id,
          status: newStatus,
          notes: reviewNotes,
        }),
      });

      if (res.ok) {
        showToast(`Application #${selectedApp.id} marked as ${newStatus}.`);
        setSelectedApp((prev) =>
          prev
            ? {
                ...prev,
                status: newStatus as any,
                reviewer_notes: reviewNotes,
                reviewer_name: currentUser?.global_name || currentUser?.username || "Admin",
                reviewed_at: new Date().toISOString(),
              }
            : null
        );
        fetchApplications();
      } else {
        const err = await res.json();
        showToast(err.error || "Failed to update application.", "error");
      }
    } catch {
      showToast("Network error while updating application.", "error");
    } finally {
      setSavingReview(false);
    }
  };

  // Delete Handler
  const handleDeleteApp = async (id: number) => {
    if (!confirm(`Are you sure you want to permanently delete Application #${id}?`)) return;
    try {
      const res = await fetch(`/api/applications?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        showToast(`Application #${id} has been permanently deleted.`);
        setSelectedApp(null);
        fetchApplications();
      } else {
        const err = await res.json();
        showToast(err.error || "Failed to delete application.", "error");
      }
    } catch {
      showToast("Network error while deleting application.", "error");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (authLoading || (loading && applications.length === 0)) {
    return (
      <div className="min-h-screen bg-[#060812] text-slate-100 flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-2 border-violet-500/30 border-t-violet-400 rounded-full animate-spin mb-4" />
        <p className="text-sm font-mono text-slate-400">Loading Application Command Center...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#060812] text-slate-100 flex flex-col font-sans selection:bg-brand-blue selection:text-white relative overflow-x-hidden">
      <PublicNavbar />

      {/* In-app Toast */}
      {toast && (
        <div
          className={`fixed top-20 right-6 z-50 px-4 py-3 rounded-xl border text-sm font-semibold shadow-2xl backdrop-blur-xl animate-in slide-in-from-top-4 flex items-center gap-2.5 ${
            toast.type === "success"
              ? "bg-emerald-950/90 border-emerald-500/40 text-emerald-300"
              : "bg-red-950/90 border-red-500/40 text-red-300"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Navigation & Header Breadcrumb */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/[0.08]">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-2">
              <Link href="/dashboard" className="hover:text-white transition-colors">
                Command Centers
              </Link>
              <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
              <Link href="/dashboard/security" className="hover:text-white transition-colors">
                Security Console
              </Link>
              <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
              <span className="text-violet-400 font-bold">Member Applications</span>
            </div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
                <FileText className="w-8 h-8 text-violet-400" />
                <span>Applications Management Console</span>
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-violet-500/15 text-violet-300 border border-violet-500/30">
                Staff & Admin
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
              Inspect, review, and evaluate candidate submissions for SyncInk Staff and Developer teams.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => fetchApplications()}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-slate-200 transition-all hover:scale-105 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-violet-400" : ""}`} />
              <span>Refresh Roster</span>
            </button>
            <Link
              href="/dashboard/security"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-xs font-bold text-white transition-all shadow-glow hover:scale-105"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Security Hub</span>
            </Link>
          </div>
        </div>

        {/* ─── Metric Cards ────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
          <div className="p-4 rounded-2xl bg-[#0e121d] border border-white/[0.08]">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Total Submissions</div>
            <div className="text-2xl sm:text-3xl font-black text-white font-mono">{stats.total}</div>
          </div>
          <div className="p-4 rounded-2xl bg-[#0e121d] border border-amber-500/20">
            <div className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-1">Pending Review</div>
            <div className="text-2xl sm:text-3xl font-black text-amber-400 font-mono">{stats.pending}</div>
          </div>
          <div className="p-4 rounded-2xl bg-[#0e121d] border border-blue-500/20">
            <div className="text-xs font-bold uppercase tracking-wider text-blue-400 mb-1">Under Review</div>
            <div className="text-2xl sm:text-3xl font-black text-blue-400 font-mono">{stats.under_review}</div>
          </div>
          <div className="p-4 rounded-2xl bg-[#0e121d] border border-emerald-500/20">
            <div className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-1">Accepted</div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">{stats.accepted}</div>
          </div>
          <div className="p-4 rounded-2xl bg-[#0e121d] border border-rose-500/20 col-span-2 sm:col-span-1">
            <div className="text-xs font-bold uppercase tracking-wider text-rose-400 mb-1">Rejected</div>
            <div className="text-2xl sm:text-3xl font-black text-rose-400 font-mono">{stats.rejected}</div>
          </div>
        </div>

        {/* ─── Filter & Search Bar ──────────────────────────────── */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#0e121d] border border-white/[0.08] space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search candidates by username, Discord ID, reason, or portfolio..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#080a12] border border-white/10 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-violet-500/50 transition-all"
              />
            </div>

            {/* Type Filter Buttons */}
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#080a12] border border-white/10 self-start sm:self-auto">
              <button
                onClick={() => setTypeFilter("ALL")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  typeFilter === "ALL" ? "bg-violet-600 text-white shadow-sm" : "text-slate-400 hover:text-white"
                }`}
              >
                All Roles
              </button>
              <button
                onClick={() => setTypeFilter("staff")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  typeFilter === "staff" ? "bg-violet-600 text-white shadow-sm" : "text-slate-400 hover:text-white"
                }`}
              >
                <Shield className="w-3 h-3 text-violet-300" />
                <span>Staff</span>
              </button>
              <button
                onClick={() => setTypeFilter("developer")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  typeFilter === "developer" ? "bg-emerald-600 text-white shadow-sm" : "text-slate-400 hover:text-white"
                }`}
              >
                <Code className="w-3 h-3 text-emerald-300" />
                <span>Developer</span>
              </button>
            </div>
          </div>

          {/* Status Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
            <span className="text-slate-500 font-semibold uppercase text-[11px] tracking-wider shrink-0 mr-1">
              Status Filter:
            </span>
            {["ALL", "PENDING", "UNDER_REVIEW", "ACCEPTED", "REJECTED"].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  statusFilter === st
                    ? "bg-white/15 text-white border border-white/20 font-bold"
                    : "bg-white/5 text-slate-400 hover:text-white border border-white/5"
                }`}
              >
                {st === "ALL" ? "All Statuses" : st.replace("_", " ")}
              </button>
            ))}
          </div>
        </div>

        {/* ─── Applications Table / List ────────────────────────── */}
        <div className="rounded-2xl bg-[#0b0e1a] border border-white/[0.08] overflow-hidden shadow-2xl">
          {applications.length === 0 ? (
            <div className="text-center py-20 px-4">
              <FileText className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h3 className="text-base font-bold text-white mb-1">No Applications Found</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                No member applications match your active search and filter criteria. New candidate submissions will appear here automatically.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/[0.08] bg-white/[0.02] text-slate-400 uppercase tracking-wider text-[11px] font-bold">
                    <th className="py-3.5 px-4">Candidate</th>
                    <th className="py-3.5 px-4">Role Applied</th>
                    <th className="py-3.5 px-4">Age & Region</th>
                    <th className="py-3.5 px-4">Submitted</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Reviewer</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.05]">
                  {applications.map((app) => {
                    const avatarUrl = app.avatar
                      ? `https://cdn.discordapp.com/avatars/${app.user_id}/${app.avatar}.png`
                      : `https://cdn.discordapp.com/embed/avatars/${parseInt(app.user_id) % 5}.png`;

                    return (
                      <tr
                        key={app.id}
                        className="hover:bg-white/[0.03] transition-colors group cursor-pointer"
                        onClick={() => {
                          setSelectedApp(app);
                          setReviewStatus(app.status);
                          setReviewNotes(app.reviewer_notes || "");
                        }}
                      >
                        {/* Candidate */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={avatarUrl}
                              alt={app.username}
                              className="w-9 h-9 rounded-full object-cover border border-white/10 shrink-0"
                            />
                            <div className="min-w-0">
                              <div className="font-bold text-white group-hover:text-violet-300 transition-colors truncate">
                                {app.global_name || app.username}
                              </div>
                              <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-mono">
                                <span>@{app.username}</span>
                                <span className="text-slate-600">•</span>
                                <span>{app.user_id}</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Role Applied */}
                        <td className="py-3.5 px-4">
                          {app.app_type === "staff" ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider bg-violet-500/15 text-violet-300 border border-violet-500/30">
                              <Shield className="w-3 h-3 text-violet-400" />
                              <span>Staff Team</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                              <Code className="w-3 h-3 text-emerald-400" />
                              <span>Dev Team</span>
                            </span>
                          )}
                        </td>

                        {/* Age & Region */}
                        <td className="py-3.5 px-4 text-slate-300">
                          <div>Age: {app.age}</div>
                          <div className="text-[11px] text-slate-500 truncate max-w-[150px]">{app.timezone}</div>
                        </td>

                        {/* Submitted */}
                        <td className="py-3.5 px-4 text-slate-400 font-mono">
                          <div>{timeAgo(app.created_at)}</div>
                          <div className="text-[10px] text-slate-500">
                            {new Date(app.created_at).toLocaleDateString()}
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider ${
                              app.status === "ACCEPTED"
                                ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                                : app.status === "REJECTED"
                                ? "bg-rose-500/15 text-rose-300 border border-rose-500/30"
                                : app.status === "UNDER_REVIEW"
                                ? "bg-blue-500/15 text-blue-300 border border-blue-500/30"
                                : "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                            }`}
                          >
                            {app.status === "ACCEPTED" && <Check className="w-3 h-3" />}
                            {app.status === "REJECTED" && <XCircle className="w-3 h-3" />}
                            {app.status === "UNDER_REVIEW" && <Clock className="w-3 h-3" />}
                            {app.status === "PENDING" && <AlertCircle className="w-3 h-3" />}
                            <span>{app.status.replace("_", " ")}</span>
                          </span>
                        </td>

                        {/* Reviewer */}
                        <td className="py-3.5 px-4 text-slate-400">
                          {app.reviewer_name ? (
                            <div>
                              <div className="font-semibold text-slate-200">{app.reviewer_name}</div>
                              {app.reviewed_at && (
                                <div className="text-[10px] text-slate-500 font-mono">
                                  {new Date(app.reviewed_at).toLocaleDateString()}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-600 font-mono">—</span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedApp(app);
                              setReviewStatus(app.status);
                              setReviewNotes(app.reviewer_notes || "");
                            }}
                            className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-violet-600 text-slate-200 hover:text-white font-bold text-xs transition-all border border-white/10 group-hover:border-violet-500/50"
                          >
                            Inspect
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ─── DETAILED INSPECTION MODAL ───────────────────────── */}
        {selectedApp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
            <div className="w-full max-w-3xl max-h-[90vh] bg-[#0c101c] border border-white/15 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
              {/* Modal Header */}
              <div className="p-6 border-b border-white/[0.08] flex items-center justify-between bg-white/[0.02]">
                <div className="flex items-center gap-4">
                  <img
                    src={
                      selectedApp.avatar
                        ? `https://cdn.discordapp.com/avatars/${selectedApp.user_id}/${selectedApp.avatar}.png`
                        : `https://cdn.discordapp.com/embed/avatars/${parseInt(selectedApp.user_id) % 5}.png`
                    }
                    alt={selectedApp.username}
                    className="w-14 h-14 rounded-2xl object-cover border-2 border-white/10 shadow-lg"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-black text-white">
                        {selectedApp.global_name || selectedApp.username}
                      </h2>
                      <span className="text-xs text-slate-400 font-mono">(@{selectedApp.username})</span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                          selectedApp.status === "ACCEPTED"
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                            : selectedApp.status === "REJECTED"
                            ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                            : selectedApp.status === "UNDER_REVIEW"
                            ? "bg-blue-500/20 text-blue-300 border border-blue-500/40"
                            : "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                        }`}
                      >
                        {selectedApp.status.replace("_", " ")}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-400 mt-1 flex-wrap">
                      <button
                        onClick={() => copyToClipboard(selectedApp.user_id)}
                        className="flex items-center gap-1 font-mono text-[11px] hover:text-white transition-colors bg-white/5 px-2 py-0.5 rounded"
                      >
                        <span>ID: {selectedApp.user_id}</span>
                        {copiedId === selectedApp.user_id ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3 text-slate-500" />
                        )}
                      </button>
                      <span>•</span>
                      <span>Age: {selectedApp.age}</span>
                      <span>•</span>
                      <span className="inline-flex items-center gap-1.5">
                        <DiscordEmoji src={DISCORD_CUSTOM_EMOJIS.region.url} alt="Region" size="xs" />
                        Region: {selectedApp.timezone}
                      </span>
                      <span>•</span>
                      <span>Submitted: {new Date(selectedApp.created_at).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedApp(null)}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              {/* Modal Body: Q&A Breakdown */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {selectedApp.app_type === "staff" ? (
                  /* STAFF FORM RESPONSES */
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-violet-400 mb-1">
                        Weekly Availability
                      </div>
                      <div className="text-sm text-slate-200">{selectedApp.availability || "Not provided"}</div>
                    </div>

                    <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-violet-400 mb-1">
                        Motivation / Why do you want to join the SyncInk Staff team?
                      </div>
                      <div className="text-sm text-slate-200 whitespace-pre-wrap leading-relaxed">
                        {selectedApp.reason || "None"}
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-violet-400 mb-1 flex items-center gap-2">
                        <DiscordEmoji src={DISCORD_CUSTOM_EMOJIS.experience.url} alt="Experience" size="sm" />
                        Prior Moderation Experience & Bot Knowledge
                      </div>
                      <div className="text-sm text-slate-200 whitespace-pre-wrap leading-relaxed">
                        {selectedApp.experience || "None"}
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-amber-400 mb-1 flex items-center gap-2">
                        <DiscordEmoji src={DISCORD_CUSTOM_EMOJIS.scenario1.url} alt="Spam Warning" size="sm" />
                        Scenario 1: Mass Spam / Filter Bypass in Public Channel
                      </div>
                      <div className="text-sm text-slate-200 whitespace-pre-wrap leading-relaxed">
                        {selectedApp.scenario_1 || "None"}
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-amber-400 mb-1 flex items-center gap-2">
                        <DiscordEmoji src={DISCORD_CUSTOM_EMOJIS.scenario2.url} alt="Argument" size="sm" />
                        Scenario 2: Escalating Argument between Veteran Community Members
                      </div>
                      <div className="text-sm text-slate-200 whitespace-pre-wrap leading-relaxed">
                        {selectedApp.scenario_2 || "None"}
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-amber-400 mb-1 flex items-center gap-2">
                        <DiscordEmoji src={DISCORD_CUSTOM_EMOJIS.scenario3.url} alt="Admin" size="sm" />
                        Scenario 3: Member Publicly Accuses Staff of Bias or Power Abuse
                      </div>
                      <div className="text-sm text-slate-200 whitespace-pre-wrap leading-relaxed">
                        {selectedApp.scenario_3 || "None"}
                      </div>
                    </div>
                  </div>
                ) : (
                  /* DEVELOPER FORM RESPONSES */
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 mb-1 flex items-center gap-2">
                        <DiscordEmoji src={DISCORD_CUSTOM_EMOJIS.developer.url} alt="Developer" size="sm" />
                        Primary Programming Languages & Frameworks
                      </div>
                      <div className="text-sm text-slate-200 font-mono">{selectedApp.languages || "None"}</div>
                    </div>

                    <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 mb-1">
                        GitHub / Portfolio Link
                      </div>
                      {selectedApp.portfolio ? (
                        <a
                          href={selectedApp.portfolio}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-sm text-emerald-400 hover:underline font-mono break-all"
                        >
                          <span>{selectedApp.portfolio}</span>
                          <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                        </a>
                      ) : (
                        <span className="text-sm text-slate-500">None provided</span>
                      )}
                    </div>

                    <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 mb-1 flex items-center gap-2">
                        <DiscordEmoji src={DISCORD_CUSTOM_EMOJIS.experience.url} alt="Experience" size="sm" />
                        Discord Bot Development Experience
                      </div>
                      <div className="text-sm text-slate-200 whitespace-pre-wrap leading-relaxed">
                        {selectedApp.bot_experience || "None"}
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 mb-1">
                        Most Complex System or Feature Engineered
                      </div>
                      <div className="text-sm text-slate-200 whitespace-pre-wrap leading-relaxed">
                        {selectedApp.complex_features || "None"}
                      </div>
                    </div>

                    {selectedApp.attachment_name && (
                      <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                          Attached Verification Document / Asset
                        </div>
                        <div className="text-sm text-slate-200 font-mono">
                          📁 {selectedApp.attachment_name} ({Math.round((selectedApp.attachment_size || 0) / 1024)} KB)
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Reviewer Action Bar (Admin Only) */}
                {canModify && (
                  <div className="p-5 rounded-2xl bg-[#080b14] border border-violet-500/20 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
                        <Shield className="w-4 h-4 text-violet-400" />
                        <span>Administrator Evaluation & Decision</span>
                      </h4>
                      {selectedApp.reviewed_at && (
                        <span className="text-[11px] text-slate-500 font-mono">
                          Last evaluated: {new Date(selectedApp.reviewed_at).toLocaleString()}
                        </span>
                      )}
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                        Internal Reviewer Notes / Candidate Feedback
                      </label>
                      <textarea
                        rows={3}
                        value={reviewNotes}
                        onChange={(e) => setReviewNotes(e.target.value)}
                        placeholder="e.g. Approved for stage 2 interview on Discord, strong portfolio with asyncpg experience..."
                        className="w-full p-3 rounded-xl bg-[#0c101c] border border-white/10 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-violet-500"
                      />
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleUpdateStatus("UNDER_REVIEW")}
                          disabled={savingReview}
                          className="px-3.5 py-2 rounded-xl bg-blue-600/20 hover:bg-blue-600 border border-blue-500/30 text-blue-300 hover:text-white text-xs font-bold transition-all disabled:opacity-50"
                        >
                          Mark Under Review
                        </button>
                        <button
                          onClick={() => handleUpdateStatus("ACCEPTED")}
                          disabled={savingReview}
                          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-glow hover:scale-105 disabled:opacity-50"
                        >
                          Accept Candidate
                        </button>
                        <button
                          onClick={() => handleUpdateStatus("REJECTED")}
                          disabled={savingReview}
                          className="px-4 py-2 rounded-xl bg-rose-600/30 hover:bg-rose-600 border border-rose-500/40 text-rose-300 hover:text-white text-xs font-bold transition-all disabled:opacity-50"
                        >
                          Reject Application
                        </button>
                      </div>

                      <button
                        onClick={() => handleDeleteApp(selectedApp.id)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-950/30 hover:text-rose-300 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete Record</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      <PublicFooter />
    </div>
  );
}
