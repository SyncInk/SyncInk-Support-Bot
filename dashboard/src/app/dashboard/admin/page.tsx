"use client";

import React, { useState, useEffect, useRef } from "react";
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
  Unlock,
  Paperclip,
  Sparkles,
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
  LifeBuoy,
  MessageSquare,
  Clock,
  Send,
  Database,
  FileText,
  AlertCircle,
  Check,
  ChevronDown,
  X,
  User as UserIcon,
  Filter,
  Copy,
} from "lucide-react";
import { PublicNavbar } from "@/components/PublicNavbar";
import { PublicFooter } from "@/components/PublicFooter";
import { DISCORD_CUSTOM_EMOJIS } from "@/lib/custom-emojis";

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

interface AdminReportItem {
  id: number;
  report_code: string;
  user_id: string;
  username: string;
  global_name: string | null;
  avatar: string | null;
  guild_id: string;
  guild_name: string | null;
  bot_target: string;
  category: string;
  title: string;
  incident_date: string | null;
  affected_channels: string | null;
  description: string;
  evidence_links: string | null;
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
  priority: "LOW" | "NORMAL" | "HIGH" | "CRITICAL";
  assigned_staff_id: string | null;
  assigned_staff_name: string | null;
  admin_notes: string | null;
  discord_thread_id?: string | null;
  attachments_allowed?: boolean;
  created_at: string;
  updated_at: string;
  message_count?: number;
  last_message_at?: string;
}

interface AdminChatMessage {
  id: number;
  report_id: number;
  sender_id: string;
  sender_name: string;
  sender_avatar: string | null;
  sender_role: "OWNER" | "ADMIN" | "STAFF" | "USER";
  message: string;
  is_staff_reply: boolean;
  attachment_url?: string | null;
  attachment_name?: string | null;
  attachment_type?: string | null;
  attachment_size?: number | null;
  discord_message_id?: string | null;
  message_type?: string;
  created_at: string;
}

export default function OwnerControlPanel() {
  const [activeTab, setActiveTab] = useState<"overview" | "reports" | "roles" | "audit" | "settings">("overview");

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

  // Reports & Recovery Desk state
  const [reports, setReports] = useState<AdminReportItem[]>([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [reportStats, setReportStats] = useState({
    total: 0,
    open: 0,
    in_progress: 0,
    resolved: 0,
    closed: 0,
  });
  const [reportFilterStatus, setReportFilterStatus] = useState<string>("ALL");
  const [reportFilterCategory, setReportFilterCategory] = useState<string>("ALL");
  const [reportSearch, setReportSearch] = useState<string>("");
  const [selectedReport, setSelectedReport] = useState<AdminReportItem | null>(null);
  const [reportMessages, setReportMessages] = useState<AdminChatMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [sendingChat, setSendingChat] = useState(false);
  const [adminNotesDraft, setAdminNotesDraft] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const [updatingReportStatus, setUpdatingReportStatus] = useState(false);
  const [copiedGuildId, setCopiedGuildId] = useState(false);
  const [adminAttachment, setAdminAttachment] = useState<File | null>(null);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const adminFileInputRef = useRef<HTMLInputElement>(null);
  const adminChatContainerRef = useRef<HTMLDivElement>(null);

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
        fetchReports(false);
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

  // Reports fetching
  async function fetchReports(showLoading = false) {
    if (showLoading) setReportsLoading(true);
    try {
      const params = new URLSearchParams();
      if (reportFilterStatus !== "ALL") params.set("status", reportFilterStatus);
      if (reportFilterCategory !== "ALL") params.set("category", reportFilterCategory);
      if (reportSearch.trim()) params.set("search", reportSearch.trim());
      params.set("limit", "100");

      const res = await fetch(`/api/reports?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setReports(data.reports || []);
        if (data.stats) setReportStats(data.stats);
      }
    } catch (err) {
      console.error("Failed to fetch reports:", err);
    } finally {
      if (showLoading) setReportsLoading(false);
    }
  }

  useEffect(() => {
    if (activeTab === "reports") {
      fetchReports(true);
    }
  }, [activeTab, reportFilterStatus, reportFilterCategory]);

  // Load chat messages for selected report
  async function fetchReportMessages(reportId: number, silent = false) {
    if (!silent) setMessagesLoading(true);
    try {
      const res = await fetch(`/api/reports/${reportId}/messages`);
      if (res.ok) {
        const data = await res.json();
        setReportMessages(data.messages || []);
      }
    } catch (err) {
      console.error("Failed to fetch messages:", err);
    } finally {
      if (!silent) setMessagesLoading(false);
    }
  }

  function handleSelectReport(report: AdminReportItem) {
    setSelectedReport(report);
    setAdminNotesDraft(report.admin_notes || "");
    fetchReportMessages(report.id, false);
  }

  // Polling for chat messages when a report is selected
  useEffect(() => {
    if (!selectedReport) return;
    const interval = setInterval(() => {
      fetchReportMessages(selectedReport.id, true);
    }, 5000);
    return () => clearInterval(interval);
  }, [selectedReport]);

  // Auto-scroll chat strictly within the admin chat container (NEVER scroll the page window)
  useEffect(() => {
    if (adminChatContainerRef.current && reportMessages.length > 0) {
      adminChatContainerRef.current.scrollTop = adminChatContainerRef.current.scrollHeight;
    }
  }, [reportMessages.length]);

  // Toggle attachment permission for this case
  async function handleToggleAttachments(reportId: number, allowed: boolean) {
    try {
      const res = await fetch(`/api/reports/${reportId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attachments_allowed: allowed }),
      });

      if (res.ok) {
        if (selectedReport && selectedReport.id === reportId) {
          setSelectedReport((prev) => (prev ? { ...prev, attachments_allowed: allowed } : null));
          await fetchReportMessages(reportId, true);
        }
        fetchReports(false);
      } else {
        const err = await res.json();
        alert(err.error || "Failed to update attachment permission");
      }
    } catch {
      alert("Error updating attachment permission");
    }
  }

  // Send admin reply in chat with optional attachment
  async function handleSendAdminReply(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedReport || sendingChat) return;
    if (!chatInput.trim() && !adminAttachment) return;

    setSendingChat(true);
    try {
      let attachmentUrl: string | null = null;
      let attachmentName: string | null = null;
      let attachmentType: string | null = null;
      let attachmentSize: number | null = null;

      if (adminAttachment) {
        setUploadingAttachment(true);
        const fd = new FormData();
        fd.append("file", adminAttachment);

        const upRes = await fetch(`/api/reports/${selectedReport.id}/upload`, {
          method: "POST",
          body: fd,
        });

        if (!upRes.ok) {
          const errData = await upRes.json().catch(() => ({}));
          throw new Error(errData.error || "Failed to upload file");
        }

        const upData = await upRes.json();
        attachmentUrl = upData.url;
        attachmentName = upData.name;
        attachmentType = upData.type;
        attachmentSize = upData.size;
      }

      const res = await fetch(`/api/reports/${selectedReport.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: chatInput.trim(),
          attachment_url: attachmentUrl,
          attachment_name: attachmentName,
          attachment_type: attachmentType,
          attachment_size: attachmentSize,
        }),
      });

      if (res.ok) {
        setChatInput("");
        setAdminAttachment(null);
        if (adminFileInputRef.current) adminFileInputRef.current.value = "";
        await fetchReportMessages(selectedReport.id, true);
        fetchReports(false);
      } else {
        const err = await res.json();
        alert(err.error || "Failed to send message");
      }
    } catch (err: any) {
      alert(err?.message || "Network error sending message");
    } finally {
      setSendingChat(false);
      setUploadingAttachment(false);
    }
  }

  // Update report status / priority
  async function handleUpdateStatus(reportId: number, newStatus: string, newPriority?: string) {
    setUpdatingReportStatus(true);
    try {
      const body: any = { status: newStatus };
      if (newPriority) body.priority = newPriority;

      const res = await fetch(`/api/reports/${reportId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        if (selectedReport && selectedReport.id === reportId) {
          setSelectedReport((prev) =>
            prev
              ? {
                  ...prev,
                  status: newStatus as any,
                  ...(newPriority ? { priority: newPriority as any } : {}),
                }
              : null
          );
          fetchReportMessages(reportId, true);
        }
        fetchReports(false);
      } else {
        const err = await res.json();
        alert(err.error || "Failed to update status");
      }
    } catch {
      alert("Error updating report status");
    } finally {
      setUpdatingReportStatus(false);
    }
  }

  // Save internal notes
  async function handleSaveAdminNotes(reportId: number) {
    setSavingNotes(true);
    try {
      const res = await fetch(`/api/reports/${reportId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ admin_notes: adminNotesDraft }),
      });

      if (res.ok) {
        if (selectedReport && selectedReport.id === reportId) {
          setSelectedReport((prev) => (prev ? { ...prev, admin_notes: adminNotesDraft } : null));
        }
        fetchReports(false);
        alert("Internal recovery notes saved.");
      } else {
        const err = await res.json();
        alert(err.error || "Failed to save notes");
      }
    } catch {
      alert("Error saving notes");
    } finally {
      setSavingNotes(false);
    }
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
              Protected governance hub for ecosystem access, data loss recovery desk, role assignments, audit logs, and website settings.
            </p>
          </div>

          {/* Quick Navigation Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: "overview", label: "Overview", icon: Layers },
              { id: "reports", label: "Recovery Desk", icon: LifeBuoy, badge: reportStats.open },
              { id: "roles", label: "Access & Roles", icon: Users },
              { id: "audit", label: "Audit Logs", icon: History },
              { id: "settings", label: "Settings", icon: Settings },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id as any);
                    if (tab.id === "reports" && selectedReport) {
                      // maintain state
                    }
                  }}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                    activeTab === tab.id
                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.2)]"
                      : "bg-white/[0.03] text-slate-400 hover:text-slate-200 border border-white/5 hover:bg-white/[0.06]"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                  {typeof tab.badge === "number" && tab.badge > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500/30 text-amber-200 border border-amber-500/40">
                      {tab.badge}
                    </span>
                  )}
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
                  Open Recovery Cases
                </span>
                <div className="text-3xl font-black text-amber-300 mt-1">
                  {reportStats.open}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Data Loss & Incident Reports
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
                  Resolved Incidents
                </span>
                <div className="text-3xl font-black text-emerald-300 mt-1">
                  {reportStats.resolved}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Successfully Restored Cases
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
                  <button
                    onClick={() => setActiveTab("reports")}
                    className="w-full flex items-center justify-between p-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/15 border border-amber-500/20 text-xs font-medium text-amber-200 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <LifeBuoy className="w-4 h-4 text-amber-400" />
                      <span>Data Loss Recovery Desk</span>
                      {reportStats.open > 0 && (
                        <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          {reportStats.open} Open
                        </span>
                      )}
                    </div>
                    <ChevronRight className="w-4 h-4 text-amber-400" />
                  </button>

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

              {/* Bot Ecosystem Health */}
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
        {/* TAB 2: DATA LOSS RECOVERY DESK & CHAT SYSTEM */}
        {/* ========================================================= */}
        {activeTab === "reports" && (
          <div className="space-y-6">
            {/* If a report is selected: Focused Recovery Workspace */}
            {selectedReport ? (
              <div className="space-y-6">
                {/* Back button & Report Header */}
                <div className="bg-[#0b0e1d] border border-white/[0.08] rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setSelectedReport(null)}
                      className="px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-white text-xs font-semibold border border-white/10 flex items-center gap-1.5 transition-colors"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Back to Reports</span>
                    </button>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-black text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                          #{selectedReport.report_code}
                        </span>
                        <h2 className="text-base font-bold text-white truncate max-w-md">
                          {selectedReport.title}
                        </h2>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Opened on {new Date(selectedReport.created_at).toLocaleString()} by{" "}
                        <strong className="text-slate-200">{selectedReport.username}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Status & Priority Pills */}
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider border ${
                        selectedReport.status === "OPEN"
                          ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
                          : selectedReport.status === "IN_PROGRESS"
                          ? "bg-blue-500/15 text-blue-300 border-blue-500/30"
                          : selectedReport.status === "RESOLVED"
                          ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                          : "bg-slate-500/15 text-slate-300 border-slate-500/30"
                      }`}
                    >
                      {selectedReport.status}
                    </span>

                    <span
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase border ${
                        selectedReport.priority === "CRITICAL"
                          ? "bg-red-500/20 text-red-300 border-red-500/30"
                          : selectedReport.priority === "HIGH"
                          ? "bg-orange-500/20 text-orange-300 border-orange-500/30"
                          : "bg-white/[0.05] text-slate-300 border-white/10"
                      }`}
                    >
                      {selectedReport.priority} Priority
                    </span>
                  </div>
                </div>

                {/* Workspace Split Layout: Case Info + Live Chat */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Left Column: Case Details & Admin Controls (5 cols) */}
                  <div className="lg:col-span-5 space-y-6">
                    {/* Status Changer Actions */}
                    <div className="bg-[#0b0e1d] border border-white/[0.08] rounded-2xl p-5 space-y-3">
                      <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-amber-400" />
                        <span>Case State Controls</span>
                      </h3>
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <button
                          disabled={updatingReportStatus || selectedReport.status === "IN_PROGRESS"}
                          onClick={() => handleUpdateStatus(selectedReport.id, "IN_PROGRESS")}
                          className="px-3 py-2 rounded-xl text-xs font-semibold bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border border-blue-500/25 transition-all disabled:opacity-40"
                        >
                          Mark In Progress
                        </button>
                        <button
                          disabled={updatingReportStatus || selectedReport.status === "RESOLVED"}
                          onClick={() => handleUpdateStatus(selectedReport.id, "RESOLVED")}
                          className="px-3 py-2 rounded-xl text-xs font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/25 transition-all disabled:opacity-40"
                        >
                          Mark Resolved
                        </button>
                        <button
                          disabled={updatingReportStatus || selectedReport.status === "CLOSED"}
                          onClick={() => handleUpdateStatus(selectedReport.id, "CLOSED")}
                          className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-500/10 hover:bg-slate-500/20 text-slate-300 border border-slate-500/25 transition-all disabled:opacity-40"
                        >
                          Close Case
                        </button>
                        <button
                          disabled={updatingReportStatus || selectedReport.status === "OPEN"}
                          onClick={() => handleUpdateStatus(selectedReport.id, "OPEN")}
                          className="px-3 py-2 rounded-xl text-xs font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/25 transition-all disabled:opacity-40"
                        >
                          Reopen Case
                        </button>
                      </div>

                      {/* Desk Permissions & Mirror Integration */}
                      <div className="pt-3 border-t border-white/[0.06] space-y-2">
                        <div className="text-[11px] font-semibold text-slate-400">Desk Permission &amp; Mirror:</div>
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleToggleAttachments(selectedReport.id, !selectedReport.attachments_allowed)}
                            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 ${
                              selectedReport.attachments_allowed
                                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30"
                                : "bg-red-500/15 text-red-300 border-red-500/30 hover:bg-red-500/25"
                            }`}
                            title={
                              selectedReport.attachments_allowed
                                ? "Revoke submitter's permission to upload attachments"
                                : "Permit submitter to upload screenshots and files"
                            }
                          >
                            {selectedReport.attachments_allowed ? (
                              <>
                                <Unlock className="w-3.5 h-3.5 text-emerald-400" />
                                <span>Attachments: ALLOWED</span>
                              </>
                            ) : (
                              <>
                                <Lock className="w-3.5 h-3.5 text-red-400" />
                                <span>Attachments: LOCKED</span>
                              </>
                            )}
                          </button>

                          {selectedReport.discord_thread_id && (
                            <a
                              href={`https://discord.com/channels/1520457643842342912/${selectedReport.discord_thread_id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-2 rounded-xl bg-[#5865F2]/20 hover:bg-[#5865F2]/30 text-[#8ea1e1] border border-[#5865F2]/40 text-xs font-bold transition-all flex items-center gap-1.5"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              <span>Open Discord Thread ↗</span>
                            </a>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Incident Details Card */}
                    <div className="bg-[#0b0e1d] border border-white/[0.08] rounded-2xl p-5 space-y-4 text-xs">
                      <h3 className="font-bold text-white uppercase tracking-wider flex items-center gap-2">
                        <Database className="w-4 h-4 text-blue-400" />
                        <span>Report Metadata &amp; Parameters</span>
                      </h3>

                      <div className="space-y-3 divide-y divide-white/[0.05]">
                        <div className="pt-2 flex justify-between items-start">
                          <span className="text-slate-400">Target Bot:</span>
                          <span className="font-bold text-white bg-white/[0.04] px-2 py-0.5 rounded border border-white/10">
                            {selectedReport.bot_target}
                          </span>
                        </div>

                        <div className="pt-2 flex justify-between items-start">
                          <span className="text-slate-400">Category:</span>
                          <span className="font-bold text-cyan-300 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                            {selectedReport.category.replace(/_/g, " ")}
                          </span>
                        </div>

                        <div className="pt-2 flex justify-between items-center">
                          <span className="text-slate-400">Guild (Server) ID:</span>
                          <div className="flex items-center gap-1.5 font-mono text-slate-200">
                            <span>{selectedReport.guild_id}</span>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(selectedReport.guild_id);
                                setCopiedGuildId(true);
                                setTimeout(() => setCopiedGuildId(false), 2000);
                              }}
                              className="p-1 hover:bg-white/10 rounded transition-colors text-slate-400 hover:text-white"
                              title="Copy Guild ID"
                            >
                              {copiedGuildId ? (
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </div>

                        {selectedReport.guild_name && (
                          <div className="pt-2 flex justify-between items-start">
                            <span className="text-slate-400">Server Name:</span>
                            <span className="font-medium text-slate-200">{selectedReport.guild_name}</span>
                          </div>
                        )}

                        <div className="pt-2 flex justify-between items-start">
                          <span className="text-slate-400">Submitter:</span>
                          <span className="font-mono text-slate-300">
                            {selectedReport.username} ({selectedReport.user_id})
                          </span>
                        </div>

                        {selectedReport.incident_date && (
                          <div className="pt-2 flex justify-between items-start">
                            <span className="text-slate-400">Incident Time:</span>
                            <span className="text-slate-300">{selectedReport.incident_date}</span>
                          </div>
                        )}

                        {selectedReport.affected_channels && (
                          <div className="pt-2 flex justify-between items-start">
                            <span className="text-slate-400">Affected Channels:</span>
                            <span className="text-slate-300 max-w-[200px] truncate">
                              {selectedReport.affected_channels}
                            </span>
                          </div>
                        )}

                        {selectedReport.evidence_links && (
                          <div className="pt-2 space-y-1">
                            <span className="text-slate-400 block">Evidence Links / Transcripts:</span>
                            <div className="bg-black/30 p-2 rounded-lg font-mono text-[11px] text-cyan-300 break-all border border-white/5">
                              {selectedReport.evidence_links}
                            </div>
                          </div>
                        )}

                        <div className="pt-2 space-y-1">
                          <span className="text-slate-400 block">Incident Statement:</span>
                          <div className="bg-black/40 p-3 rounded-xl text-slate-200 whitespace-pre-wrap leading-relaxed border border-white/5 font-sans">
                            {selectedReport.description}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Admin Internal Recovery Notes */}
                    <div className="bg-[#0b0e1d] border border-white/[0.08] rounded-2xl p-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                          <FileText className="w-4 h-4 text-amber-400" />
                          <span>Internal Staff Notes</span>
                        </h3>
                        <span className="text-[10px] text-slate-500">Admins/Owner Only</span>
                      </div>
                      <textarea
                        rows={3}
                        value={adminNotesDraft}
                        onChange={(e) => setAdminNotesDraft(e.target.value)}
                        placeholder="Internal recovery notes (backup restored from, audit hashes, transcript retrieval notes)..."
                        className="w-full bg-[#060812] border border-white/10 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                      />
                      <button
                        onClick={() => handleSaveAdminNotes(selectedReport.id)}
                        disabled={savingNotes}
                        className="px-4 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-amber-300 border border-amber-500/30 text-xs font-bold transition-all disabled:opacity-50"
                      >
                        {savingNotes ? "Saving Notes..." : "Save Internal Notes"}
                      </button>
                    </div>
                  </div>

                  {/* Right Column: Two-Way Live Chat Desk (7 cols) */}
                  <div className="lg:col-span-7 flex flex-col bg-[#0b0e1d] border border-white/[0.08] rounded-2xl overflow-hidden min-h-[580px] h-[720px]">
                    {/* Chat Desk Header */}
                    <div className="p-4 border-b border-white/[0.08] bg-[#0d1124] flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                          <MessageSquare className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-white">Live Recovery Desk Channel</h4>
                          <p className="text-[11px] text-slate-400">
                            Two-way communication thread with {selectedReport.username}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          <span>Connected</span>
                        </span>
                        <button
                          onClick={() => fetchReportMessages(selectedReport.id, false)}
                          className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-slate-400 hover:text-white transition-colors"
                          title="Refresh Messages"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${messagesLoading ? "animate-spin" : ""}`} />
                        </button>
                      </div>
                    </div>

                    {/* Messages Body */}
                    <div ref={adminChatContainerRef} className="flex-1 p-4 overflow-y-auto space-y-3.5">
                      {messagesLoading && reportMessages.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-slate-500 text-xs gap-2">
                          <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
                          <span>Loading recovery thread...</span>
                        </div>
                      ) : reportMessages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs space-y-2">
                          <MessageSquare className="w-8 h-8 text-slate-600" />
                          <p>No messages yet in this incident thread.</p>
                        </div>
                      ) : (
                        reportMessages.map((msg) => {
                          if (msg.message_type === "SYSTEM") {
                            return (
                              <div key={msg.id} className="flex justify-center my-1.5">
                                <div className="px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-white/10 text-[11px] text-slate-300 flex items-center gap-2 shadow-sm">
                                  <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                  <span>{msg.message}</span>
                                  <span className="text-slate-500 text-[10px] ml-1">
                                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                              </div>
                            );
                          }

                          const isStaff = msg.is_staff_reply || msg.sender_role === "OWNER" || msg.sender_role === "ADMIN" || msg.sender_role === "STAFF";

                          return (
                            <div
                              key={msg.id}
                              className={`flex flex-col ${isStaff ? "items-end" : "items-start"}`}
                            >
                              <div
                                className={`max-w-[85%] rounded-2xl p-3.5 text-xs shadow-sm border ${
                                  isStaff
                                    ? "bg-gradient-to-br from-amber-950/30 to-[#0e1628] border-amber-500/30 text-slate-100"
                                    : "bg-white/[0.04] border-white/10 text-slate-200"
                                }`}
                              >
                                <div className="flex items-center gap-2 mb-1.5 pb-1 border-b border-white/[0.06]">
                                  <span className="font-bold text-white text-[11px]">
                                    {msg.sender_name}
                                  </span>

                                  {msg.sender_role === "OWNER" ? (
                                    <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase bg-amber-500/25 text-amber-300 border border-amber-500/40">
                                      👑 OWNER
                                    </span>
                                  ) : msg.sender_role === "ADMIN" ? (
                                    <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase bg-blue-500/25 text-blue-300 border border-blue-500/40">
                                      🛡️ ADMIN
                                    </span>
                                  ) : msg.sender_role === "STAFF" ? (
                                    <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase bg-purple-500/25 text-purple-300 border border-purple-500/40">
                                      STAFF
                                    </span>
                                  ) : (
                                    <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold uppercase bg-white/[0.05] text-slate-400">
                                      USER
                                    </span>
                                  )}

                                  <span className="text-[10px] text-slate-500 ml-auto">
                                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>

                                {msg.message && (
                                  <p className="whitespace-pre-wrap leading-relaxed text-xs">
                                    {msg.message}
                                  </p>
                                )}

                                {msg.attachment_url && (
                                  <div className="mt-2.5 pt-2 border-t border-white/[0.08]">
                                    {/\.(png|jpe?g|gif|webp)(\?.*)?$/i.test(msg.attachment_url) ? (
                                      <a
                                        href={msg.attachment_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="block group"
                                      >
                                        <img
                                          src={msg.attachment_url}
                                          alt={msg.attachment_name || "Attachment"}
                                          className="max-h-56 max-w-full rounded-xl object-contain bg-black/40 border border-white/15 group-hover:opacity-90 transition-opacity"
                                        />
                                        <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-1 group-hover:text-blue-300">
                                          <ExternalLink className="w-3 h-3" />
                                          <span className="truncate">{msg.attachment_name || "View image"}</span>
                                        </div>
                                      </a>
                                    ) : (
                                      <a
                                        href={msg.attachment_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        download={msg.attachment_name || "download"}
                                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/40 hover:bg-black/60 border border-white/10 text-cyan-300 text-xs font-mono transition-colors"
                                      >
                                        <Paperclip className="w-3.5 h-3.5 shrink-0" />
                                        <span className="truncate max-w-[200px]">{msg.attachment_name || "Download File"}</span>
                                        {msg.attachment_size && (
                                          <span className="text-[10px] text-slate-400">
                                            ({Math.round(msg.attachment_size / 1024)} KB)
                                          </span>
                                        )}
                                      </a>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* Chat Input Composer */}
                    <form
                      onSubmit={handleSendAdminReply}
                      className="p-3.5 bg-[#090c1a] border-t border-white/[0.08] flex flex-col gap-2"
                    >
                      {/* Attachment preview chip if selected */}
                      {adminAttachment && (
                        <div className="px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-between text-xs text-amber-200">
                          <div className="flex items-center gap-2 truncate">
                            <Paperclip className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            <span className="truncate font-medium">{adminAttachment.name}</span>
                            <span className="text-[10px] text-amber-300/70 shrink-0">
                              ({Math.round(adminAttachment.size / 1024)} KB)
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setAdminAttachment(null);
                              if (adminFileInputRef.current) adminFileInputRef.current.value = "";
                            }}
                            className="p-1 hover:bg-amber-500/20 rounded text-amber-300 transition-colors ml-2"
                            title="Remove attachment"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}

                      <div className="flex items-end gap-2">
                        {/* Hidden file input */}
                        <input
                          type="file"
                          ref={adminFileInputRef}
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              setAdminAttachment(e.target.files[0]);
                            }
                          }}
                          className="hidden"
                        />

                        {/* Paperclip Button */}
                        <button
                          type="button"
                          onClick={() => adminFileInputRef.current?.click()}
                          disabled={sendingChat || uploadingAttachment}
                          className="p-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-400 hover:text-white transition-colors border border-white/10 shrink-0"
                          title="Attach screenshot or file"
                        >
                          <Paperclip className="w-4 h-4" />
                        </button>

                        <div className="flex-1">
                          <textarea
                            rows={2}
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                handleSendAdminReply(e);
                              }
                            }}
                            placeholder="Type official reply or transcript recovery link (Enter to send)..."
                            className="w-full bg-[#060812] border border-white/10 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 resize-none"
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={sendingChat || uploadingAttachment || (!chatInput.trim() && !adminAttachment)}
                          className="px-4 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-[0_0_15px_rgba(245,158,11,0.3)] disabled:opacity-50 shrink-0"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>{uploadingAttachment ? "Uploading..." : sendingChat ? "Sending..." : "Reply"}</span>
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            ) : (
              /* All Reports List View */
              <div className="space-y-6">
                {/* Metrics Bar */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  <div className="bg-[#0b0e1d] border border-white/[0.08] rounded-xl p-4">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      Total Reports
                    </span>
                    <div className="text-2xl font-black text-white mt-1">{reportStats.total}</div>
                  </div>

                  <div className="bg-[#0b0e1d] border border-amber-500/25 rounded-xl p-4">
                    <span className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider">
                      Open Cases
                    </span>
                    <div className="text-2xl font-black text-amber-300 mt-1">{reportStats.open}</div>
                  </div>

                  <div className="bg-[#0b0e1d] border border-blue-500/25 rounded-xl p-4">
                    <span className="text-[11px] font-semibold text-blue-400 uppercase tracking-wider">
                      In Progress
                    </span>
                    <div className="text-2xl font-black text-blue-300 mt-1">{reportStats.in_progress}</div>
                  </div>

                  <div className="bg-[#0b0e1d] border border-emerald-500/25 rounded-xl p-4">
                    <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">
                      Resolved
                    </span>
                    <div className="text-2xl font-black text-emerald-300 mt-1">{reportStats.resolved}</div>
                  </div>

                  <div className="bg-[#0b0e1d] border border-white/[0.08] rounded-xl p-4">
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                      Closed
                    </span>
                    <div className="text-2xl font-black text-slate-400 mt-1">{reportStats.closed}</div>
                  </div>
                </div>

                {/* Filters & Search Toolbar */}
                <div className="bg-[#0b0e1d] border border-white/[0.08] rounded-2xl p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Status Filter */}
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="text-slate-400">Status:</span>
                      <select
                        value={reportFilterStatus}
                        onChange={(e) => setReportFilterStatus(e.target.value)}
                        className="bg-[#060812] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                      >
                        <option value="ALL">All Statuses</option>
                        <option value="OPEN">Open Only</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="RESOLVED">Resolved</option>
                        <option value="CLOSED">Closed</option>
                      </select>
                    </div>

                    {/* Category Filter */}
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="text-slate-400">Category:</span>
                      <select
                        value={reportFilterCategory}
                        onChange={(e) => setReportFilterCategory(e.target.value)}
                        className="bg-[#060812] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                      >
                        <option value="ALL">All Categories</option>
                        <option value="DATA_LOSS">Data Loss</option>
                        <option value="TRANSCRIPT_RECOVERY">Transcript Recovery</option>
                        <option value="BOT_OUTAGE">Bot Outage</option>
                        <option value="OTHER">Other Inquiries</option>
                      </select>
                    </div>
                  </div>

                  {/* Search and Refresh */}
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1 sm:w-64">
                      <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Search code, user, guild ID..."
                        value={reportSearch}
                        onChange={(e) => setReportSearch(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") fetchReports(true);
                        }}
                        className="w-full bg-[#060812] border border-white/10 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <button
                      onClick={() => fetchReports(true)}
                      className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-white border border-white/10 transition-colors"
                      title="Refresh"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${reportsLoading ? "animate-spin" : ""}`} />
                    </button>
                  </div>
                </div>

                {/* Reports Table */}
                <div className="bg-[#0b0e1d] border border-white/[0.08] rounded-2xl overflow-hidden shadow-sm">
                  {reportsLoading && reports.length === 0 ? (
                    <div className="py-16 text-center text-slate-500 text-xs flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
                      <span>Loading recovery cases...</span>
                    </div>
                  ) : reports.length === 0 ? (
                    <div className="py-16 text-center space-y-3">
                      <LifeBuoy className="w-10 h-10 text-slate-600 mx-auto" />
                      <p className="text-sm font-bold text-white">No incident reports found</p>
                      <p className="text-xs text-slate-400">
                        {reportSearch || reportFilterStatus !== "ALL"
                          ? "Try clearing filters to see other reports."
                          : "No recovery or data loss tickets have been logged yet."}
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-white/[0.08] text-slate-400 bg-white/[0.01]">
                            <th className="py-3 px-4">Code / Subject</th>
                            <th className="py-3 px-3">Target Bot</th>
                            <th className="py-3 px-3">User &amp; Guild</th>
                            <th className="py-3 px-3">Priority</th>
                            <th className="py-3 px-3">Status</th>
                            <th className="py-3 px-3">Activity</th>
                            <th className="py-3 px-4 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.04]">
                          {reports.map((report) => (
                            <tr
                              key={report.id}
                              className="hover:bg-white/[0.02] transition-colors cursor-pointer"
                              onClick={() => handleSelectReport(report)}
                            >
                              <td className="py-3.5 px-4">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 text-[11px]">
                                    #{report.report_code}
                                  </span>
                                  <span className="font-bold text-white truncate max-w-[220px]">
                                    {report.title}
                                  </span>
                                </div>
                                <div className="text-[10px] text-slate-500 mt-1 line-clamp-1">
                                  {report.description}
                                </div>
                              </td>

                              <td className="py-3.5 px-3">
                                <span className="text-[11px] font-medium text-slate-300">
                                  {report.bot_target}
                                </span>
                                <div className="text-[10px] text-cyan-400 font-mono">
                                  {report.category}
                                </div>
                              </td>

                              <td className="py-3.5 px-3">
                                <div className="font-bold text-white">{report.username}</div>
                                <div className="text-[10px] text-slate-500 font-mono">
                                  G: {report.guild_id}
                                </div>
                              </td>

                              <td className="py-3.5 px-3">
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                                    report.priority === "CRITICAL"
                                      ? "bg-red-500/20 text-red-300 border-red-500/30"
                                      : report.priority === "HIGH"
                                      ? "bg-orange-500/20 text-orange-300 border-orange-500/30"
                                      : "bg-white/[0.05] text-slate-300 border-white/10"
                                  }`}
                                >
                                  {report.priority}
                                </span>
                              </td>

                              <td className="py-3.5 px-3">
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                                    report.status === "OPEN"
                                      ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                                      : report.status === "IN_PROGRESS"
                                      ? "bg-blue-500/20 text-blue-300 border-blue-500/30"
                                      : report.status === "RESOLVED"
                                      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                                      : "bg-slate-500/20 text-slate-300 border-slate-500/30"
                                  }`}
                                >
                                  {report.status}
                                </span>
                              </td>

                              <td className="py-3.5 px-3 text-[11px] text-slate-400">
                                <div className="flex items-center gap-1 text-slate-300">
                                  <MessageSquare className="w-3 h-3 text-amber-400" />
                                  <span>{report.message_count || 1} msgs</span>
                                </div>
                                <div className="text-[10px] text-slate-500">
                                  {new Date(report.updated_at).toLocaleDateString()}
                                </div>
                              </td>

                              <td className="py-3.5 px-4 text-right">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSelectReport(report);
                                  }}
                                  className="px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-bold transition-all"
                                >
                                  Inspect Desk →
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: ACCESS & ROLES MANAGEMENT */}
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
        {/* TAB 4: AUDIT LOGS */}
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
        {/* TAB 5: WEBSITE CONFIGURATION */}
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
