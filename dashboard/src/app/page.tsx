"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
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
  AlertCircle,
  FileText,
  Download,
  Search,
  Filter,
  Check,
  X,
  ChevronRight,
  Sparkles,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Hash,
  UserPlus,
  UserMinus,
  Key,
  HelpCircle,
  Send
} from "lucide-react";

// --- Interfaces ---
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

interface SecurityState {
  guildId: string;
  settings: Record<string, any>;
  raidState: string;
  stats: {
    jailedCount: number;
    whitelistCount: number;
    incidentCount: number;
    modCasesCount?: number;
    suggestionsCount?: number;
    blacklistCount?: number;
    violationsCount?: number;
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

interface ModCase {
  case_id: number;
  guild_id: string;
  user_id: string;
  mod_id: string;
  action: string;
  reason: string;
  created_at: string;
}

interface AutoModItem {
  id: number;
  pattern: string;
  match_type: string;
  points: number;
  severity: string;
}

interface ViolationItem {
  id: number;
  user_id: string;
  reason: string;
  detection_type: string;
  created_at: string;
}

interface SuggestionItem {
  id: number;
  guild_id: string;
  user_id: string;
  title: string;
  content: string;
  upvotes: number;
  downvotes: number;
  status: string;
  created_at: string;
}

interface ToastMessage {
  id: string;
  type: "success" | "error" | "warning" | "info";
  title: string;
  message?: string;
}

interface ConfirmState {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  confirmVariant: "danger" | "warning" | "primary";
  onConfirm: () => void;
}

type TabType =
  | "overview"
  | "shields"
  | "thresholds"
  | "moderation"
  | "automod"
  | "quarantine"
  | "whitelist"
  | "channels"
  | "suggestions";

export default function DashboardPage() {
  const router = useRouter();

  // Core User & State
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [data, setData] = useState<SecurityState | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // In-App Toast & Confirmation Modal
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [confirmModal, setConfirmModal] = useState<ConfirmState>({
    isOpen: false,
    title: "",
    message: "",
    confirmLabel: "Confirm",
    confirmVariant: "primary",
    onConfirm: () => {},
  });

  const showToast = useCallback(
    (type: "success" | "error" | "warning" | "info", title: string, message?: string) => {
      const id = Math.random().toString(36).substring(2, 9);
      setToasts((prev) => [...prev, { id, type, title, message }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4500);
    },
    []
  );

  const openConfirm = (
    title: string,
    message: string,
    confirmLabel: string,
    confirmVariant: "danger" | "warning" | "primary",
    onConfirm: () => void
  ) => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      confirmLabel,
      confirmVariant,
      onConfirm: () => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        onConfirm();
      },
    });
  };

  // --- Sub-data States ---
  // Thresholds
  const [spamLimit, setSpamLimit] = useState("5");
  const [mentionLimit, setMentionLimit] = useState("5");
  const [raidLimit, setRaidLimit] = useState("5");
  const [nukeLimit, setNukeLimit] = useState("3");

  // Whitelist
  const [whitelistEntries, setWhitelistEntries] = useState<any[]>([]);
  const [whitelistFilter, setWhitelistFilter] = useState("ALL");
  const [newWhiteType, setNewWhiteType] = useState("domain");
  const [newWhiteValue, setNewWhiteValue] = useState("");

  // Quarantine
  const [jailedUsers, setJailedUsers] = useState<any[]>([]);
  const [manualJailUserId, setManualJailUserId] = useState("");
  const [manualJailReason, setManualJailReason] = useState("");
  const [manualJailDuration, setManualJailDuration] = useState("60");

  // Moderation
  const [modCases, setModCases] = useState<ModCase[]>([]);
  const [modFilter, setModFilter] = useState("ALL");
  const [modSearch, setModSearch] = useState("");
  const [newModUserId, setNewModUserId] = useState("");
  const [newModAction, setNewModAction] = useState("WARN");
  const [newModReason, setNewModReason] = useState("");

  // AutoMod
  const [blacklist, setBlacklist] = useState<AutoModItem[]>([]);
  const [violations, setViolations] = useState<ViolationItem[]>([]);
  const [newBlacklistPattern, setNewBlacklistPattern] = useState("");
  const [newBlacklistType, setNewBlacklistType] = useState("contains");
  const [newBlacklistSeverity, setNewBlacklistSeverity] = useState("MEDIUM");
  const [newBlacklistPoints, setNewBlacklistPoints] = useState("1");

  // Channels & Roles Routing
  const [channelData, setChannelData] = useState<Record<string, string>>({});
  const [roleData, setRoleData] = useState<Record<string, string>>({});
  const [welcomeData, setWelcomeData] = useState<{
    welcome_message: string;
    dm_welcome: boolean;
    auto_delete_welcome: boolean;
  }>({
    welcome_message: "",
    dm_welcome: false,
    auto_delete_welcome: false,
  });

  // Suggestions
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [suggestionFilter, setSuggestionFilter] = useState("ALL");

  // Incidents Search Filter
  const [incidentSearch, setIncidentSearch] = useState("");

  const canEdit = Boolean(currentUser?.isOwner || currentUser?.isAdmin);

  // --- Fetch Handlers ---
  const fetchData = useCallback(
    async (silent = false, specificGuildId?: string) => {
      if (!silent) setRefreshing(true);
      try {
        const gid = specificGuildId || currentUser?.guildId;
        const url = gid ? `/api/security?guildId=${encodeURIComponent(gid)}` : "/api/security";
        const res = await fetch(url);
        if (res.status === 401) {
          router.push("/login");
          return;
        }
        if (!res.ok) throw new Error("Failed to fetch security state");
        const json: SecurityState = await res.json();
        setData(json);

        if (json.settings) {
          setSpamLimit(String(json.settings.spam_threshold ?? 5));
          setMentionLimit(String(json.settings.mention_threshold ?? 5));
          setRaidLimit(String(json.settings.anti_raid_threshold ?? 5));
          setNukeLimit(String(json.settings.anti_nuke_threshold ?? 3));
        }
      } catch (err: any) {
        console.error("Dashboard fetch error:", err);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [router, currentUser?.guildId]
  );

  const fetchWhitelist = useCallback(async () => {
    try {
      const res = await fetch("/api/security/whitelist");
      if (res.ok) {
        const json = await res.json();
        setWhitelistEntries(json.entries || []);
      }
    } catch (err) {
      console.error(err);
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
      console.error(err);
    }
  }, []);

  const fetchModeration = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (modFilter !== "ALL") params.append("action", modFilter);
      if (modSearch) params.append("search", modSearch);
      const res = await fetch(`/api/moderation?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setModCases(json.cases || []);
      }
    } catch (err) {
      console.error(err);
    }
  }, [modFilter, modSearch]);

  const fetchAutoMod = useCallback(async () => {
    try {
      const res = await fetch("/api/automod");
      if (res.ok) {
        const json = await res.json();
        setBlacklist(json.blacklist || []);
        setViolations(json.violations || []);
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  const fetchChannels = useCallback(async () => {
    try {
      const gid = currentUser?.guildId || data?.guildId;
      const url = gid ? `/api/channels?guildId=${encodeURIComponent(gid)}` : "/api/channels";
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        setChannelData(json.channels || {});
        setRoleData(json.roles || {});
        setWelcomeData(
          json.welcome || {
            welcome_message: "",
            dm_welcome: false,
            auto_delete_welcome: false,
          }
        );
      }
    } catch (err) {
      console.error(err);
    }
  }, [currentUser?.guildId, data?.guildId]);

  const fetchSuggestions = useCallback(async () => {
    try {
      const url =
        suggestionFilter !== "ALL"
          ? `/api/suggestions?status=${encodeURIComponent(suggestionFilter)}`
          : "/api/suggestions";
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        setSuggestions(json.suggestions || []);
      }
    } catch (err) {
      console.error(err);
    }
  }, [suggestionFilter]);

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
      console.error(err);
    }
  }, [fetchData]);

  // Initial Load
  useEffect(() => {
    fetchUser();
    fetchData();
  }, [fetchUser, fetchData]);

  // Tab Dependent Fetching
  useEffect(() => {
    if (activeTab === "whitelist") fetchWhitelist();
    if (activeTab === "quarantine") fetchQuarantine();
    if (activeTab === "moderation") fetchModeration();
    if (activeTab === "automod") fetchAutoMod();
    if (activeTab === "channels") fetchChannels();
    if (activeTab === "suggestions") fetchSuggestions();
  }, [
    activeTab,
    fetchWhitelist,
    fetchQuarantine,
    fetchModeration,
    fetchAutoMod,
    fetchChannels,
    fetchSuggestions,
  ]);

  // Auto-refresh interval
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchData(true);
      if (activeTab === "whitelist") fetchWhitelist();
      if (activeTab === "quarantine") fetchQuarantine();
      if (activeTab === "moderation") fetchModeration();
      if (activeTab === "automod") fetchAutoMod();
      if (activeTab === "suggestions") fetchSuggestions();
    }, 7000);
    return () => clearInterval(interval);
  }, [
    autoRefresh,
    fetchData,
    activeTab,
    fetchWhitelist,
    fetchQuarantine,
    fetchModeration,
    fetchAutoMod,
    fetchSuggestions,
  ]);

  // --- Mutating Actions ---
  const handleToggle = async (moduleName: string, currentValue: boolean) => {
    if (!canEdit) {
      showToast("warning", "Access Restricted", "Server Owner or Admin permissions required.");
      return;
    }
    setActionLoading(moduleName);
    try {
      const res = await fetch("/api/security/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ module: moduleName, value: !currentValue }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      showToast("success", "Shield Updated", result.message);
      await fetchData(true);
    } catch (err: any) {
      showToast("error", "Toggle Failed", err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleEmergencyLockdown = () => {
    if (!canEdit) {
      showToast("warning", "Access Restricted", "Server Owner or Admin permissions required.");
      return;
    }
    const isLockdown = data?.raidState === "LOCKDOWN";
    openConfirm(
      isLockdown ? "Lift Emergency Lockdown?" : "🚨 Trigger Panic Lockdown?",
      isLockdown
        ? "This will restore the server to NORMAL mode, allow joins to verify as standard, and return shields to baseline."
        : "CRITICAL: Panic Lockdown isolates the guild, jails unverified joins, and maxes out all security barriers immediately.",
      isLockdown ? "Lift Lockdown" : "Activate Lockdown",
      isLockdown ? "primary" : "danger",
      async () => {
        setActionLoading("lockdown");
        try {
          const res = await fetch("/api/security/toggle", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ module: "emergency_lockdown" }),
          });
          const result = await res.json();
          if (!res.ok) throw new Error(result.error);
          showToast(isLockdown ? "info" : "error", "Lockdown State Shift", result.message);
          await fetchData(true);
        } catch (err: any) {
          showToast("error", "Action Failed", err.message);
        } finally {
          setActionLoading(null);
        }
      }
    );
  };

  const handleSaveThresholds = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) {
      showToast("warning", "Access Restricted", "Server Owner or Admin permissions required.");
      return;
    }
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
      showToast("success", "Thresholds Saved", "Velocity rules successfully updated & synced.");
      await fetchData(true);
    } catch (err: any) {
      showToast("error", "Save Failed", err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleAddWhitelist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWhiteValue.trim()) return;
    if (!canEdit) {
      showToast("warning", "Access Restricted", "Admin privileges required.");
      return;
    }
    try {
      const res = await fetch("/api/security/whitelist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: newWhiteType, value: newWhiteValue.trim() }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      showToast("success", "Exemption Added", result.message);
      setNewWhiteValue("");
      fetchWhitelist();
      fetchData(true);
    } catch (err: any) {
      showToast("error", "Whitelist Error", err.message);
    }
  };

  const handleDeleteWhitelist = (id: number) => {
    if (!canEdit) {
      showToast("warning", "Access Restricted", "Admin privileges required.");
      return;
    }
    openConfirm(
      "Remove Whitelist Entry",
      "Are you sure you want to revoke this security exemption?",
      "Remove Exemption",
      "danger",
      async () => {
        try {
          const res = await fetch(`/api/security/whitelist?id=${id}`, { method: "DELETE" });
          if (!res.ok) throw new Error("Failed to delete entry.");
          showToast("info", "Exemption Revoked", "Entry removed from whitelist.");
          fetchWhitelist();
          fetchData(true);
        } catch (err: any) {
          showToast("error", "Error", err.message);
        }
      }
    );
  };

  const handleUnjail = (userId: string) => {
    if (!canEdit) {
      showToast("warning", "Access Restricted", "Admin privileges required.");
      return;
    }
    openConfirm(
      "Release Inmate?",
      `Release quarantined user (${userId}) and lift isolation penalties?`,
      "Release User",
      "primary",
      async () => {
        try {
          const res = await fetch("/api/security/quarantine", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId, action: "unjail" }),
          });
          const result = await res.json();
          if (!res.ok) throw new Error(result.error);
          showToast("success", "User Released", result.message);
          fetchQuarantine();
          fetchData(true);
        } catch (err: any) {
          showToast("error", "Failed", err.message);
        }
      }
    );
  };

  const handleManualJail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualJailUserId.trim()) return;
    if (!canEdit) {
      showToast("warning", "Access Restricted", "Admin privileges required.");
      return;
    }
    try {
      const res = await fetch("/api/security/quarantine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: manualJailUserId.trim(),
          action: "jail",
          reason: manualJailReason.trim() || "Manual Administrator Quarantine",
          durationMins: manualJailDuration,
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      showToast("warning", "User Isolated", result.message);
      setManualJailUserId("");
      setManualJailReason("");
      fetchQuarantine();
      fetchData(true);
    } catch (err: any) {
      showToast("error", "Jail Error", err.message);
    }
  };

  const handleCreateModCase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newModUserId.trim()) return;
    if (!canEdit) {
      showToast("warning", "Access Restricted", "Admin privileges required.");
      return;
    }
    try {
      const res = await fetch("/api/moderation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: newModUserId.trim(),
          action: newModAction,
          reason: newModReason.trim() || "Manual punishment logged via dashboard",
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      showToast("success", "Case Logged", result.message);
      setNewModUserId("");
      setNewModReason("");
      fetchModeration();
      fetchData(true);
    } catch (err: any) {
      showToast("error", "Case Error", err.message);
    }
  };

  const handleDeleteModCase = (caseId: number) => {
    if (!canEdit) {
      showToast("warning", "Access Restricted", "Admin privileges required.");
      return;
    }
    openConfirm(
      `Pardon & Delete Case #${caseId}?`,
      "This will remove the punishment record from the server case history.",
      "Delete Case",
      "danger",
      async () => {
        try {
          const res = await fetch(`/api/moderation?caseId=${caseId}`, { method: "DELETE" });
          const result = await res.json();
          if (!res.ok) throw new Error(result.error);
          showToast("info", "Case Removed", result.message);
          fetchModeration();
          fetchData(true);
        } catch (err: any) {
          showToast("error", "Delete Failed", err.message);
        }
      }
    );
  };

  const handleAddBlacklist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBlacklistPattern.trim()) return;
    if (!canEdit) {
      showToast("warning", "Access Restricted", "Admin privileges required.");
      return;
    }
    try {
      const res = await fetch("/api/automod", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pattern: newBlacklistPattern.trim(),
          matchType: newBlacklistType,
          severity: newBlacklistSeverity,
          points: newBlacklistPoints,
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      showToast("success", "AutoMod Updated", result.message);
      setNewBlacklistPattern("");
      fetchAutoMod();
      fetchData(true);
    } catch (err: any) {
      showToast("error", "AutoMod Error", err.message);
    }
  };

  const handleDeleteBlacklist = (id: number) => {
    if (!canEdit) {
      showToast("warning", "Access Restricted", "Admin privileges required.");
      return;
    }
    openConfirm(
      "Remove AutoMod Pattern",
      "Are you sure you want to remove this word or expression from the content blacklist?",
      "Delete Pattern",
      "danger",
      async () => {
        try {
          const res = await fetch(`/api/automod?id=${id}`, { method: "DELETE" });
          const result = await res.json();
          if (!res.ok) throw new Error(result.error);
          showToast("info", "Pattern Removed", result.message);
          fetchAutoMod();
          fetchData(true);
        } catch (err: any) {
          showToast("error", "Error", err.message);
        }
      }
    );
  };

  const handleResetStrikes = (userId: string) => {
    if (!canEdit) {
      showToast("warning", "Access Restricted", "Admin privileges required.");
      return;
    }
    openConfirm(
      `Pardon Strikes for User ${userId}?`,
      "This will clear all 24-hour progressive violation strikes for this user.",
      "Clear Strikes",
      "warning",
      async () => {
        try {
          const res = await fetch(`/api/automod?resetUser=${userId}`, { method: "DELETE" });
          const result = await res.json();
          if (!res.ok) throw new Error(result.error);
          showToast("success", "Strikes Cleared", result.message);
          fetchAutoMod();
          fetchData(true);
        } catch (err: any) {
          showToast("error", "Error", err.message);
        }
      }
    );
  };

  const handleSaveChannels = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!canEdit) {
      showToast("warning", "Access Restricted", "Admin privileges required.");
      return;
    }
    setActionLoading("channels");
    try {
      const gid = currentUser?.guildId || data?.guildId;
      const res = await fetch("/api/channels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channels: channelData,
          roles: roleData,
          welcome: welcomeData,
          guildId: gid,
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      showToast("success", "Routing Saved", result.message);
      fetchChannels();
    } catch (err: any) {
      showToast("error", "Save Failed", err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdateSuggestionStatus = async (id: number, status: string) => {
    if (!canEdit) {
      showToast("warning", "Access Restricted", "Admin privileges required.");
      return;
    }
    try {
      const res = await fetch("/api/suggestions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      showToast("success", "Status Updated", result.message);
      fetchSuggestions();
      fetchData(true);
    } catch (err: any) {
      showToast("error", "Update Error", err.message);
    }
  };

  const handleDeleteSuggestion = (id: number) => {
    if (!canEdit) {
      showToast("warning", "Access Restricted", "Admin privileges required.");
      return;
    }
    openConfirm(
      `Delete Suggestion #${id}?`,
      "Are you sure you want to permanently remove this suggestion?",
      "Delete Suggestion",
      "danger",
      async () => {
        try {
          const res = await fetch(`/api/suggestions?id=${id}`, { method: "DELETE" });
          const result = await res.json();
          if (!res.ok) throw new Error(result.error);
          showToast("info", "Deleted", result.message);
          fetchSuggestions();
          fetchData(true);
        } catch (err: any) {
          showToast("error", "Delete Error", err.message);
        }
      }
    );
  };

  const handleLogout = async () => {
    await fetch("/api/auth", { method: "DELETE" });
    router.push("/login");
  };

  // Filtered Whitelist
  const filteredWhitelist = useMemo(() => {
    if (whitelistFilter === "ALL") return whitelistEntries;
    return whitelistEntries.filter(
      (e) => e.entity_type?.toLowerCase() === whitelistFilter.toLowerCase()
    );
  }, [whitelistEntries, whitelistFilter]);

  // Filtered Incidents
  const filteredIncidents = useMemo(() => {
    if (!data?.incidents) return [];
    if (!incidentSearch.trim()) return data.incidents;
    const q = incidentSearch.toLowerCase();
    return data.incidents.filter(
      (inc) =>
        inc.module?.toLowerCase().includes(q) ||
        inc.action_taken?.toLowerCase().includes(q) ||
        inc.user_id?.toLowerCase().includes(q) ||
        inc.details?.toLowerCase().includes(q)
    );
  }, [data?.incidents, incidentSearch]);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background text-slate-400">
        <div className="relative">
          <div className="h-16 w-16 animate-spin rounded-full border-2 border-brand-red border-t-transparent" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Shield className="h-6 w-6 text-brand-red animate-pulse" />
          </div>
        </div>
        <p className="mt-4 font-mono text-sm tracking-wider text-slate-300">
          INITIALIZING CYBER DEFENSE TERMINAL...
        </p>
      </div>
    );
  }

  const raidState = data?.raidState || "NORMAL";
  const isLockdown = raidState === "LOCKDOWN";

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 pb-24 selection:bg-brand-red/30 selection:text-white">
      {/* --- IN-APP TOAST SYSTEM --- */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start gap-3 rounded-2xl border p-4 shadow-2xl backdrop-blur-xl transition-all duration-300 animate-in slide-in-from-top-4 ${
              t.type === "success"
                ? "border-emerald-500/40 bg-emerald-950/80 text-emerald-300 shadow-emerald-950/50"
                : t.type === "error"
                ? "border-red-500/50 bg-red-950/85 text-red-300 shadow-red-950/60"
                : t.type === "warning"
                ? "border-amber-500/40 bg-amber-950/80 text-amber-300 shadow-amber-950/50"
                : "border-cyan-500/40 bg-slate-900/90 text-cyan-300 shadow-cyan-950/50"
            }`}
          >
            {t.type === "success" && <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400 mt-0.5" />}
            {t.type === "error" && <AlertOctagon className="h-5 w-5 shrink-0 text-red-400 mt-0.5" />}
            {t.type === "warning" && <AlertTriangle className="h-5 w-5 shrink-0 text-amber-400 mt-0.5" />}
            {t.type === "info" && <ShieldCheck className="h-5 w-5 shrink-0 text-cyan-400 mt-0.5" />}
            <div className="flex-1 text-xs">
              <p className="font-bold text-white text-sm tracking-tight">{t.title}</p>
              {t.message && <p className="mt-0.5 text-slate-300 leading-relaxed">{t.message}</p>}
            </div>
            <button
              onClick={() => setToasts((prev) => prev.filter((item) => item.id !== t.id))}
              className="text-slate-400 hover:text-white transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      {/* --- CONFIRMATION MODAL --- */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
          <div className="glass-card max-w-md w-full rounded-2xl border border-border p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${
                  confirmModal.confirmVariant === "danger"
                    ? "border-red-500/50 bg-red-500/20 text-red-400"
                    : "border-amber-500/50 bg-amber-500/20 text-amber-400"
                }`}
              >
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">{confirmModal.title}</h3>
                <p className="text-xs text-slate-400 mt-0.5">Authorization Verification Required</p>
              </div>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed">{confirmModal.message}</p>
            <div className="flex justify-end gap-2.5 pt-2">
              <button
                onClick={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
                className="rounded-xl border border-border bg-surface px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmModal.onConfirm}
                className={`rounded-xl px-4 py-2 text-xs font-bold transition-all shadow-lg active:scale-95 ${
                  confirmModal.confirmVariant === "danger"
                    ? "bg-red-600 hover:bg-red-500 text-white shadow-red-950/50"
                    : confirmModal.confirmVariant === "warning"
                    ? "bg-amber-600 hover:bg-amber-500 text-white shadow-amber-950/50"
                    : "bg-brand-red hover:bg-brand-crimson text-white shadow-brand-red/40"
                }`}
              >
                {confirmModal.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- TOP COMMAND BAR --- */}
      <header className="sticky top-0 z-40 border-b border-border/70 bg-[#07090e]/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          {/* Logo & Server Ident */}
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-surface-card border border-border shadow-glow overflow-hidden">
              <img
                src="https://files.catbox.moe/74l9su.png"
                alt="SyncInk Logo"
                className="h-8 w-8 object-contain"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-white text-base tracking-tight">SyncInk Security</span>
                <span className="rounded-full bg-brand-red/20 px-2.5 py-0.5 text-[10px] font-bold text-brand-red border border-brand-red/35 uppercase tracking-wider">
                  Command Center
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span className="font-medium text-slate-300">
                  {currentUser?.guildName || "SyncInk Support"}
                </span>
                <span className="text-slate-600">•</span>
                <span className="font-mono text-[11px] text-slate-400">
                  ID: {data?.guildId || currentUser?.guildId || "1520461877073674392"}
                </span>
              </div>
            </div>
          </div>

          {/* Action & User Telemetry */}
          <div className="flex items-center gap-3">
            {/* Live Polling Pulse */}
            <div
              onClick={() => setAutoRefresh(!autoRefresh)}
              className="hidden sm:flex items-center gap-2 rounded-xl border border-border/80 bg-surface-card/90 px-3 py-1.5 text-xs text-slate-300 cursor-pointer hover:border-slate-600 transition-colors"
              title="Click to toggle live auto-sync"
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  autoRefresh ? "bg-emerald-400 shadow-glow-green animate-pulse" : "bg-slate-500"
                }`}
              />
              <span className="text-[11px] font-medium">
                {autoRefresh ? "Live Telemetry" : "Paused"}
              </span>
            </div>

            {/* Authenticated User Capsule */}
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
                  <span className="text-xs font-bold text-white leading-tight">
                    {currentUser.global_name || currentUser.username}
                  </span>
                  <span
                    className={`text-[10px] font-bold leading-tight flex items-center gap-1 ${
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
                          ? "bg-amber-400 animate-ping"
                          : currentUser.isAdmin
                          ? "bg-emerald-400"
                          : "bg-blue-400"
                      }`}
                    />
                    {currentUser.role ||
                      (currentUser.isOwner
                        ? "Server Owner"
                        : currentUser.isAdmin
                        ? "Server Admin"
                        : "Server Member")}
                  </span>
                </div>
              </div>
            )}

            {/* Refresh Button */}
            <button
              onClick={() => fetchData()}
              disabled={refreshing}
              title="Refresh security metrics"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-surface-card text-slate-300 hover:text-white hover:border-slate-500 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin text-brand-red" : ""}`} />
            </button>

            {/* Logout */}
            <button
              onClick={handleLogout}
              title="Log out"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-surface-card text-slate-400 hover:text-red-400 hover:border-red-500/40 transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* --- NAVIGATION TABS BAR --- */}
        <div className="border-t border-border/50 bg-surface/40 px-4 sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-7xl gap-1 overflow-x-auto py-2 scrollbar-none">
            <NavTab
              active={activeTab === "overview"}
              onClick={() => setActiveTab("overview")}
              icon={<Shield className="h-4 w-4" />}
              label="Overview"
              badge={raidState !== "NORMAL" ? raidState : undefined}
              badgeColor="red"
            />
            <NavTab
              active={activeTab === "shields"}
              onClick={() => setActiveTab("shields")}
              icon={<Sliders className="h-4 w-4" />}
              label="Shields & Defenses"
            />
            <NavTab
              active={activeTab === "thresholds"}
              onClick={() => setActiveTab("thresholds")}
              icon={<Settings className="h-4 w-4" />}
              label="Velocity Tuning"
            />
            <NavTab
              active={activeTab === "moderation"}
              onClick={() => setActiveTab("moderation")}
              icon={<FileText className="h-4 w-4" />}
              label="Moderation Cases"
              badge={data?.stats?.modCasesCount ? String(data.stats.modCasesCount) : undefined}
            />
            <NavTab
              active={activeTab === "automod"}
              onClick={() => setActiveTab("automod")}
              icon={<AlertOctagon className="h-4 w-4" />}
              label="AutoMod & Filters"
              badge={data?.stats?.violationsCount ? `${data.stats.violationsCount} strikes` : undefined}
              badgeColor="amber"
            />
            <NavTab
              active={activeTab === "quarantine"}
              onClick={() => setActiveTab("quarantine")}
              icon={<Users className="h-4 w-4" />}
              label="Quarantine Roster"
              badge={data?.stats?.jailedCount ? String(data.stats.jailedCount) : undefined}
              badgeColor="red"
            />
            <NavTab
              active={activeTab === "whitelist"}
              onClick={() => setActiveTab("whitelist")}
              icon={<CheckCircle2 className="h-4 w-4" />}
              label="Security Whitelist"
              badge={data?.stats?.whitelistCount ? String(data.stats.whitelistCount) : undefined}
            />
            <NavTab
              active={activeTab === "channels"}
              onClick={() => setActiveTab("channels")}
              icon={<Hash className="h-4 w-4" />}
              label="Log Routing"
            />
            <NavTab
              active={activeTab === "suggestions"}
              onClick={() => setActiveTab("suggestions")}
              icon={<MessageSquare className="h-4 w-4" />}
              label="Suggestions"
              badge={data?.stats?.suggestionsCount ? String(data.stats.suggestionsCount) : undefined}
            />
          </div>
        </div>
      </header>

      {/* --- MAIN DASHBOARD CONTENT --- */}
      <main className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8 space-y-6">
        {/* Permission Read-Only Banner for regular members */}
        {!canEdit && (
          <div className="flex items-center gap-3 rounded-2xl border border-blue-500/30 bg-blue-950/30 px-4 py-3 text-xs text-blue-300 backdrop-blur-md">
            <HelpCircle className="h-5 w-5 shrink-0 text-blue-400" />
            <div>
              <p className="font-semibold text-white">Read-Only Telemetry Inspection Mode</p>
              <p className="text-slate-400 mt-0.5">
                You are viewing real-time security data as a Server Member. Mutating shield toggles, threshold saves, and moderation actions require Server Owner or Administrator permissions.
              </p>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 1: OVERVIEW & TELEMETRY */}
        {/* ========================================================= */}
        {activeTab === "overview" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Emergency Panic Lockdown Banner */}
            <div
              className={`glass-card rounded-2xl p-5 border transition-all ${
                isLockdown
                  ? "border-red-500/80 bg-red-950/40 pulse-lockdown shadow-red-950/50"
                  : "border-border/80 bg-surface-card/60"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start sm:items-center gap-3.5">
                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border ${
                      isLockdown
                        ? "border-red-500 bg-red-500/20 text-red-400"
                        : "border-border bg-surface text-slate-400"
                    }`}
                  >
                    {isLockdown ? (
                      <Lock className="h-6 w-6 animate-bounce" />
                    ) : (
                      <ShieldAlert className="h-6 w-6 text-brand-red" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-bold text-white tracking-tight">
                        {isLockdown
                          ? "🚨 EMERGENCY LOCKDOWN ACTIVATED"
                          : "Server Threat Level & Panic Shield"}
                      </h2>
                      <span
                        className={`rounded-md px-2.5 py-0.5 text-xs font-extrabold uppercase tracking-wider ${
                          raidState === "LOCKDOWN"
                            ? "bg-red-500/25 text-red-400 border border-red-500/50"
                            : raidState === "ALERT"
                            ? "bg-orange-500/25 text-orange-400 border border-orange-500/50"
                            : raidState === "WATCH"
                            ? "bg-amber-500/25 text-amber-400 border border-amber-500/50"
                            : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                        }`}
                      >
                        STATUS: {raidState}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      {isLockdown
                        ? "Quarantine gate active. All incoming joins are quarantined or blocked. Security shields maxed."
                        : "Instant master kill-switch to isolate the guild and halt ongoing raids or mass exploitation."}
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleEmergencyLockdown}
                  disabled={actionLoading === "lockdown" || !canEdit}
                  className={`flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-xs font-bold uppercase tracking-wider transition-all shadow-lg active:scale-98 disabled:opacity-50 ${
                    isLockdown
                      ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/50"
                      : "bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white shadow-glow"
                  }`}
                >
                  {isLockdown ? (
                    <>
                      <Unlock className="h-4 w-4" />
                      <span>Lift Panic Lockdown</span>
                    </>
                  ) : (
                    <>
                      <Lock className="h-4 w-4" />
                      <span>Trigger Panic Lockdown</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* 4 Telemetry Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard
                icon={<ShieldCheck className="h-6 w-6 text-emerald-400" />}
                title="Active Defense"
                value="ONLINE"
                subtitle="Anti-Nuke & Anti-Raid Armed"
                badge="100% OPERATIONAL"
                badgeColor="emerald"
              />
              <MetricCard
                icon={<AlertTriangle className="h-6 w-6 text-red-400" />}
                title="Security Incidents"
                value={String(data?.stats?.incidentCount || 0)}
                subtitle="Forensic Audit Records"
                badge="LIVE AUDIT"
                badgeColor="red"
              />
              <MetricCard
                icon={<Users className="h-6 w-6 text-amber-400" />}
                title="Quarantined Inmates"
                value={String(data?.stats?.jailedCount || 0)}
                subtitle="Serving Active Isolation"
                badge="ISOLATED"
                badgeColor="amber"
              />
              <MetricCard
                icon={<FileText className="h-6 w-6 text-cyan-400" />}
                title="Total Mod Cases"
                value={String(data?.stats?.modCasesCount || 0)}
                subtitle="Enforced Server Sanctions"
                badge="SANCTIONS"
                badgeColor="cyan"
              />
            </div>

            {/* Secondary Telemetry Quick-Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="glass-card rounded-xl p-3.5 border border-border/80 flex items-center justify-between">
                <span className="text-xs text-slate-400">AutoMod Rules:</span>
                <span className="font-mono text-sm font-bold text-white">
                  {data?.stats?.blacklistCount || 0}
                </span>
              </div>
              <div className="glass-card rounded-xl p-3.5 border border-border/80 flex items-center justify-between">
                <span className="text-xs text-slate-400">24h Strike Violations:</span>
                <span className="font-mono text-sm font-bold text-amber-400">
                  {data?.stats?.violationsCount || 0}
                </span>
              </div>
              <div className="glass-card rounded-xl p-3.5 border border-border/80 flex items-center justify-between">
                <span className="text-xs text-slate-400">Whitelist Exemptions:</span>
                <span className="font-mono text-sm font-bold text-emerald-400">
                  {data?.stats?.whitelistCount || 0}
                </span>
              </div>
              <div className="glass-card rounded-xl p-3.5 border border-border/80 flex items-center justify-between">
                <span className="text-xs text-slate-400">Community Suggestions:</span>
                <span className="font-mono text-sm font-bold text-cyan-400">
                  {data?.stats?.suggestionsCount || 0}
                </span>
              </div>
            </div>

            {/* Forensic Incident Audit Stream */}
            <div className="glass-card rounded-2xl border border-border overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border bg-surface/50 px-6 py-4">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Radio className="h-4 w-4 text-brand-red animate-pulse" />
                    Forensic Security Incident Stream
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Real-time timeline of intercepted attacks, anti-nuke triggers, and auto-moderation actions.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Search incidents..."
                      value={incidentSearch}
                      onChange={(e) => setIncidentSearch(e.target.value)}
                      className="rounded-xl border border-border bg-surface pl-8 pr-3 py-1.5 text-xs text-white outline-none focus:border-brand-red w-44"
                    />
                  </div>
                  {canEdit && (
                    <div className="flex items-center gap-1.5">
                      <a
                        href={`/api/security/export?format=csv&type=incidents`}
                        download
                        className="flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white hover:border-slate-500 transition-colors"
                        title="Download CSV Audit Report"
                      >
                        <Download className="h-3.5 w-3.5 text-slate-400" />
                        <span>CSV</span>
                      </a>
                      <a
                        href={`/api/security/export?format=json&type=incidents`}
                        download
                        className="flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white hover:border-slate-500 transition-colors"
                        title="Download JSON Audit Report"
                      >
                        <Download className="h-3.5 w-3.5 text-slate-400" />
                        <span>JSON</span>
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {filteredIncidents.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-surface text-slate-400 uppercase tracking-wider text-[10px] border-b border-border">
                      <tr>
                        <th className="py-3 px-4">Time</th>
                        <th className="py-3 px-4">Module</th>
                        <th className="py-3 px-4">Target / Actor ID</th>
                        <th className="py-3 px-4">Action Taken</th>
                        <th className="py-3 px-4">Severity</th>
                        <th className="py-3 px-4">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {filteredIncidents.map((inc) => (
                        <tr key={inc.id} className="hover:bg-surface/40 transition-colors">
                          <td className="py-3 px-4 font-mono text-slate-400 whitespace-nowrap">
                            {new Date(inc.created_at).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                              second: "2-digit",
                            })}
                          </td>
                          <td className="py-3 px-4 font-bold text-white">{inc.module}</td>
                          <td className="py-3 px-4 font-mono text-slate-300">
                            {inc.user_id === "0" ? "Console / System" : inc.user_id}
                          </td>
                          <td className="py-3 px-4">
                            <span className="rounded-md bg-surface px-2 py-0.5 font-semibold text-white border border-border">
                              {inc.action_taken}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`rounded px-2 py-0.5 font-extrabold uppercase text-[10px] ${
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
                          <td className="py-3 px-4 text-slate-400 max-w-sm truncate" title={inc.details}>
                            {inc.details || "No extra metadata."}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 text-slate-500">
                  <ShieldCheck className="h-10 w-10 mx-auto mb-2 text-slate-600" />
                  <p className="text-sm">No incidents match the active search criteria. All quiet.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: SHIELDS & DEFENSE MODULES */}
        {/* ========================================================= */}
        {activeTab === "shields" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Sliders className="h-5 w-5 text-brand-red" />
                  Modular Defense Shields
                </h2>
                <p className="text-xs text-slate-400">
                  Real-time security gates. Toggling shifts live bot protection within seconds.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <ModuleCard
                title="Anti-Nuke Protection"
                description="Intercepts rogue administrator mass kicks, bans, channel wipes, and role destructions."
                enabled={Boolean(data?.settings?.anti_nuke_enabled ?? true)}
                loading={actionLoading === "anti_nuke_enabled"}
                onToggle={() =>
                  handleToggle("anti_nuke_enabled", Boolean(data?.settings?.anti_nuke_enabled ?? true))
                }
                badge="CRITICAL GATE"
                canEdit={canEdit}
              />
              <ModuleCard
                title="Anti-Raid Engine"
                description="Monitors member join velocity, blocks mass user bursts, and isolates suspicious throwaway accounts."
                enabled={Boolean(data?.settings?.anti_raid_enabled ?? true)}
                loading={actionLoading === "anti_raid_enabled"}
                onToggle={() =>
                  handleToggle("anti_raid_enabled", Boolean(data?.settings?.anti_raid_enabled ?? true))
                }
                badge="VELOCITY CONTROL"
                canEdit={canEdit}
              />
              <ModuleCard
                title="Automated Anti-Spam"
                description="Message rate limiting, duplicate spam suppression, and rolling 24-hour progressive timeouts."
                enabled={Boolean(data?.settings?.automod_enabled ?? false)}
                loading={actionLoading === "automod_enabled"}
                onToggle={() =>
                  handleToggle("automod_enabled", Boolean(data?.settings?.automod_enabled ?? false))
                }
                badge="MESSAGE DEFENSE"
                canEdit={canEdit}
              />
              <ModuleCard
                title="Phishing & Scam Guard"
                description="Deep regex & homoglyph scanner catching fake Nitro links, Steam scams, and credential harvesters."
                enabled={Boolean(data?.settings?.anti_phishing_enabled ?? true)}
                loading={actionLoading === "anti_phishing_enabled"}
                onToggle={() =>
                  handleToggle(
                    "anti_phishing_enabled",
                    Boolean(data?.settings?.anti_phishing_enabled ?? true)
                  )
                }
                badge="LINK RADAR"
                canEdit={canEdit}
              />
              <ModuleCard
                title="Mass Mention Guard"
                description="Blocks unauthorized @everyone, @here, and burst member ping flooding."
                enabled={Boolean(data?.settings?.mention_guard_enabled ?? true)}
                loading={actionLoading === "mention_guard_enabled"}
                onToggle={() =>
                  handleToggle(
                    "mention_guard_enabled",
                    Boolean(data?.settings?.mention_guard_enabled ?? true)
                  )
                }
                badge="PING DEFENSE"
                canEdit={canEdit}
              />
              <ModuleCard
                title="Smart Content Filter"
                description="De-obfuscates text against leetspeak, zalgo spacing, and unicode homoglyph bypasses."
                enabled={Boolean(data?.settings?.content_filter_enabled ?? true)}
                loading={actionLoading === "content_filter_enabled"}
                onToggle={() =>
                  handleToggle(
                    "content_filter_enabled",
                    Boolean(data?.settings?.content_filter_enabled ?? true)
                  )
                }
                badge="DE-OBFUSCATION"
                canEdit={canEdit}
              />
              <ModuleCard
                title="Mass Bot Protection"
                description="Quarantines unverified OAuth bot additions and rogue webhook floods."
                enabled={Boolean(data?.settings?.mass_bot_protection_enabled ?? true)}
                loading={actionLoading === "mass_bot_protection_enabled"}
                onToggle={() =>
                  handleToggle(
                    "mass_bot_protection_enabled",
                    Boolean(data?.settings?.mass_bot_protection_enabled ?? true)
                  )
                }
                badge="BOT BARRIER"
                canEdit={canEdit}
              />
              <ModuleCard
                title="Ghost Ping Detection"
                description="Detects and logs stealth mentions that are immediately deleted by trolls."
                enabled={Boolean(data?.settings?.ghost_ping_detection_enabled ?? true)}
                loading={actionLoading === "ghost_ping_detection_enabled"}
                onToggle={() =>
                  handleToggle(
                    "ghost_ping_detection_enabled",
                    Boolean(data?.settings?.ghost_ping_detection_enabled ?? true)
                  )
                }
                badge="STEALTH AUDIT"
                canEdit={canEdit}
              />
              <ModuleCard
                title="Verification Gate"
                description="Enforces interactive captcha or button verification before members acquire default roles."
                enabled={Boolean(data?.settings?.verification_enabled ?? false)}
                loading={actionLoading === "verification_enabled"}
                onToggle={() =>
                  handleToggle(
                    "verification_enabled",
                    Boolean(data?.settings?.verification_enabled ?? false)
                  )
                }
                badge="GATEWAY"
                canEdit={canEdit}
              />
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: VELOCITY & THRESHOLDS TUNING */}
        {/* ========================================================= */}
        {activeTab === "thresholds" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="glass-card rounded-2xl p-6 border border-border">
              <div className="mb-6">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Settings className="h-5 w-5 text-brand-red" />
                  Velocity & Sensitivity Thresholds
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Adjust trigger tolerances before automated moderation, timeouts, or quarantines activate.
                </p>
              </div>

              <form onSubmit={handleSaveThresholds} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Spam Limit Slider */}
                  <div className="glass-panel p-4 rounded-xl border border-border/80 space-y-3">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-slate-200">Spam Message Limit</label>
                      <span className="font-mono text-xs font-bold text-brand-red bg-brand-red/10 px-2 py-0.5 rounded border border-brand-red/30">
                        {spamLimit} msgs / 10s
                      </span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="30"
                      value={spamLimit}
                      onChange={(e) => setSpamLimit(e.target.value)}
                      disabled={!canEdit}
                      className="w-full accent-brand-red cursor-pointer disabled:opacity-50"
                    />
                    <p className="text-[11px] text-slate-500">
                      Users sending more than this limit in 10s receive automatic strike & timeout.
                    </p>
                  </div>

                  {/* Mass Mention Limit Slider */}
                  <div className="glass-panel p-4 rounded-xl border border-border/80 space-y-3">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-slate-200">Mass Mention Limit</label>
                      <span className="font-mono text-xs font-bold text-brand-red bg-brand-red/10 px-2 py-0.5 rounded border border-brand-red/30">
                        {mentionLimit} pings
                      </span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="20"
                      value={mentionLimit}
                      onChange={(e) => setMentionLimit(e.target.value)}
                      disabled={!canEdit}
                      className="w-full accent-brand-red cursor-pointer disabled:opacity-50"
                    />
                    <p className="text-[11px] text-slate-500">
                      Messages containing more pings than this are purged with instant mute.
                    </p>
                  </div>

                  {/* Anti-Raid Burst Limit Slider */}
                  <div className="glass-panel p-4 rounded-xl border border-border/80 space-y-3">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-slate-200">Anti-Raid Join Burst</label>
                      <span className="font-mono text-xs font-bold text-brand-red bg-brand-red/10 px-2 py-0.5 rounded border border-brand-red/30">
                        {raidLimit} joins / 10s
                      </span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="40"
                      value={raidLimit}
                      onChange={(e) => setRaidLimit(e.target.value)}
                      disabled={!canEdit}
                      className="w-full accent-brand-red cursor-pointer disabled:opacity-50"
                    />
                    <p className="text-[11px] text-slate-500">
                      Elevates server threat status to ALERT and gates all joining accounts.
                    </p>
                  </div>

                  {/* Anti-Nuke Action Limit Slider */}
                  <div className="glass-panel p-4 rounded-xl border border-border/80 space-y-3">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-slate-200">Anti-Nuke Rogue Limit</label>
                      <span className="font-mono text-xs font-bold text-brand-red bg-brand-red/10 px-2 py-0.5 rounded border border-brand-red/30">
                        {nukeLimit} actions / 10s
                      </span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="15"
                      value={nukeLimit}
                      onChange={(e) => setNukeLimit(e.target.value)}
                      disabled={!canEdit}
                      className="w-full accent-brand-red cursor-pointer disabled:opacity-50"
                    />
                    <p className="text-[11px] text-slate-500">
                      Rogue moderators performing actions above this threshold are quarantined.
                    </p>
                  </div>
                </div>

                {canEdit && (
                  <div className="flex justify-end pt-3">
                    <button
                      type="submit"
                      disabled={actionLoading === "thresholds"}
                      className="flex items-center gap-2 rounded-xl bg-brand-red hover:bg-brand-crimson px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-glow transition-all active:scale-98 disabled:opacity-50"
                    >
                      <Check className="h-4 w-4" />
                      <span>
                        {actionLoading === "thresholds" ? "Saving..." : "Save & Sync Thresholds"}
                      </span>
                    </button>
                  </div>
                )}
              </form>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 4: MODERATION CENTER */}
        {/* ========================================================= */}
        {activeTab === "moderation" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Quick Dispatch Bar */}
            {canEdit && (
              <div className="glass-card rounded-2xl p-5 border border-border">
                <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                  <UserPlus className="h-4 w-4 text-brand-red" />
                  Issue Moderation Action / Log Case
                </h3>
                <form onSubmit={handleCreateModCase} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      User ID / Mention
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 1520461877073674392"
                      value={newModUserId}
                      onChange={(e) => setNewModUserId(e.target.value)}
                      className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs text-white outline-none focus:border-brand-red"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      Action Type
                    </label>
                    <select
                      value={newModAction}
                      onChange={(e) => setNewModAction(e.target.value)}
                      className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs text-white outline-none focus:border-brand-red"
                    >
                      <option value="WARN">WARN</option>
                      <option value="TIMEOUT">TIMEOUT / MUTE</option>
                      <option value="KICK">KICK</option>
                      <option value="BAN">BAN</option>
                      <option value="JAIL">QUARANTINE JAIL</option>
                      <option value="UNBAN">UNBAN</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      Reason / Reference
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Malicious links, spamming..."
                      value={newModReason}
                      onChange={(e) => setNewModReason(e.target.value)}
                      className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs text-white outline-none focus:border-brand-red"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      type="submit"
                      className="w-full rounded-xl bg-brand-red hover:bg-brand-crimson text-white py-2 text-xs font-bold uppercase tracking-wider transition-all shadow-glow"
                    >
                      Dispatch Sanction
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Cases Table */}
            <div className="glass-card rounded-2xl border border-border overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border bg-surface/50 px-6 py-4">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <FileText className="h-4 w-4 text-cyan-400" />
                    Server Punishment Ledger ({modCases.length})
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Immutable history of all disciplinary actions, bans, and sanctions.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Action Filters */}
                  {["ALL", "BAN", "KICK", "TIMEOUT", "WARN", "JAIL"].map((act) => (
                    <button
                      key={act}
                      onClick={() => setModFilter(act)}
                      className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all ${
                        modFilter === act
                          ? "bg-brand-red text-white shadow-sm"
                          : "bg-surface text-slate-400 hover:text-white border border-border"
                      }`}
                    >
                      {act}
                    </button>
                  ))}

                  {canEdit && (
                    <a
                      href="/api/security/export?format=csv&type=cases"
                      download
                      className="flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
                      title="Export Cases CSV"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>Export CSV</span>
                    </a>
                  )}
                </div>
              </div>

              {modCases.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-surface text-slate-400 uppercase tracking-wider text-[10px] border-b border-border">
                      <tr>
                        <th className="py-3 px-4">Case #</th>
                        <th className="py-3 px-4">Target User</th>
                        <th className="py-3 px-4">Action</th>
                        <th className="py-3 px-4">Moderator</th>
                        <th className="py-3 px-4">Reason</th>
                        <th className="py-3 px-4">Date</th>
                        {canEdit && <th className="py-3 px-4 text-right">Pardon</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {modCases.map((c) => (
                        <tr key={c.case_id} className="hover:bg-surface/40 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-white">#{c.case_id}</td>
                          <td className="py-3 px-4 font-mono text-slate-200">{c.user_id}</td>
                          <td className="py-3 px-4">
                            <span
                              className={`rounded px-2 py-0.5 font-extrabold uppercase text-[10px] ${
                                c.action === "BAN"
                                  ? "bg-red-500/20 text-red-400 border border-red-500/40"
                                  : c.action === "KICK"
                                  ? "bg-orange-500/20 text-orange-400 border border-orange-500/40"
                                  : c.action === "TIMEOUT"
                                  ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                                  : "bg-blue-500/20 text-blue-400 border border-blue-500/40"
                              }`}
                            >
                              {c.action}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-400">
                            {c.mod_id === "0" ? "System" : c.mod_id}
                          </td>
                          <td className="py-3 px-4 text-slate-300 max-w-xs truncate" title={c.reason}>
                            {c.reason || "No reason provided"}
                          </td>
                          <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                            {new Date(c.created_at).toLocaleString()}
                          </td>
                          {canEdit && (
                            <td className="py-3 px-4 text-right">
                              <button
                                onClick={() => handleDeleteModCase(c.case_id)}
                                className="text-slate-400 hover:text-red-400 p-1 rounded hover:bg-red-500/10 transition-colors"
                                title="Pardon / Delete Case"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 text-slate-500">
                  <FileText className="h-10 w-10 mx-auto mb-2 text-slate-600" />
                  <p className="text-sm">No moderation cases recorded.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 5: AUTOMOD & CONTENT FILTERS */}
        {/* ========================================================= */}
        {activeTab === "automod" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Add Pattern Form */}
            {canEdit && (
              <div className="glass-card rounded-2xl p-5 border border-border">
                <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                  <Plus className="h-4 w-4 text-brand-red" />
                  Add Blacklist Word / Regex / Pattern
                </h3>
                <form onSubmit={handleAddBlacklist} className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      Pattern / Keyword / Regex
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. discord.gg/*, free nitro, badword"
                      value={newBlacklistPattern}
                      onChange={(e) => setNewBlacklistPattern(e.target.value)}
                      className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs text-white outline-none focus:border-brand-red"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      Match Type
                    </label>
                    <select
                      value={newBlacklistType}
                      onChange={(e) => setNewBlacklistType(e.target.value)}
                      className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs text-white outline-none focus:border-brand-red"
                    >
                      <option value="contains">Contains Word</option>
                      <option value="exact">Exact Match</option>
                      <option value="regex">Regular Expression</option>
                      <option value="wildcard">Wildcard (*)</option>
                      <option value="invite">Discord Invite</option>
                      <option value="link">Unauthorized Link</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      Severity & Points
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={newBlacklistSeverity}
                        onChange={(e) => setNewBlacklistSeverity(e.target.value)}
                        className="w-2/3 rounded-xl border border-border bg-surface px-2 py-2 text-xs text-white outline-none focus:border-brand-red"
                      >
                        <option value="LOW">LOW</option>
                        <option value="MEDIUM">MEDIUM</option>
                        <option value="HIGH">HIGH</option>
                        <option value="CRITICAL">CRITICAL</option>
                      </select>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={newBlacklistPoints}
                        onChange={(e) => setNewBlacklistPoints(e.target.value)}
                        className="w-1/3 rounded-xl border border-border bg-surface px-2 py-2 text-xs text-white outline-none focus:border-brand-red text-center"
                        title="Strike points"
                      />
                    </div>
                  </div>
                  <div className="flex items-end">
                    <button
                      type="submit"
                      className="w-full rounded-xl bg-brand-red hover:bg-brand-crimson text-white py-2 text-xs font-bold uppercase tracking-wider transition-all shadow-glow"
                    >
                      Add Filter Rule
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Blacklist Patterns Table */}
              <div className="glass-card rounded-2xl border border-border overflow-hidden">
                <div className="border-b border-border bg-surface/50 px-6 py-4">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <ShieldAlert className="h-4 w-4 text-brand-red" />
                    Blacklist Pattern Rules ({blacklist.length})
                  </h3>
                </div>
                {blacklist.length > 0 ? (
                  <div className="overflow-x-auto max-h-96">
                    <table className="w-full text-left text-xs text-slate-300">
                      <thead className="bg-surface text-slate-400 uppercase tracking-wider text-[10px] border-b border-border sticky top-0">
                        <tr>
                          <th className="py-3 px-4">Pattern</th>
                          <th className="py-3 px-4">Type</th>
                          <th className="py-3 px-4">Severity</th>
                          {canEdit && <th className="py-3 px-4 text-right">Delete</th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/60">
                        {blacklist.map((item) => (
                          <tr key={item.id} className="hover:bg-surface/40 transition-colors">
                            <td className="py-3 px-4 font-mono font-bold text-white">{item.pattern}</td>
                            <td className="py-3 px-4">
                              <span className="rounded bg-surface px-2 py-0.5 text-[10px] font-semibold border border-border text-slate-300">
                                {item.match_type}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span
                                className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                                  item.severity === "CRITICAL"
                                    ? "bg-red-500/20 text-red-400"
                                    : item.severity === "HIGH"
                                    ? "bg-orange-500/20 text-orange-400"
                                    : "bg-amber-500/20 text-amber-400"
                                }`}
                              >
                                {item.severity} ({item.points} pts)
                              </span>
                            </td>
                            {canEdit && (
                              <td className="py-3 px-4 text-right">
                                <button
                                  onClick={() => handleDeleteBlacklist(item.id)}
                                  className="text-slate-400 hover:text-red-400 p-1 rounded hover:bg-red-500/10 transition-colors"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-10 text-slate-500">
                    <p className="text-xs">No active content blacklist rules.</p>
                  </div>
                )}
              </div>

              {/* Rolling 24h Violations */}
              <div className="glass-card rounded-2xl border border-border overflow-hidden">
                <div className="border-b border-border bg-surface/50 px-6 py-4">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Clock className="h-4 w-4 text-amber-400" />
                    Rolling 24-Hour Strike Violations ({violations.length})
                  </h3>
                </div>
                {violations.length > 0 ? (
                  <div className="overflow-x-auto max-h-96">
                    <table className="w-full text-left text-xs text-slate-300">
                      <thead className="bg-surface text-slate-400 uppercase tracking-wider text-[10px] border-b border-border sticky top-0">
                        <tr>
                          <th className="py-3 px-4">User ID</th>
                          <th className="py-3 px-4">Reason</th>
                          <th className="py-3 px-4">Time</th>
                          {canEdit && <th className="py-3 px-4 text-right">Pardon</th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/60">
                        {violations.map((v) => (
                          <tr key={v.id} className="hover:bg-surface/40 transition-colors">
                            <td className="py-3 px-4 font-mono font-bold text-white">{v.user_id}</td>
                            <td className="py-3 px-4 text-slate-300">{v.reason}</td>
                            <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                              {new Date(v.created_at).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </td>
                            {canEdit && (
                              <td className="py-3 px-4 text-right">
                                <button
                                  onClick={() => handleResetStrikes(v.user_id)}
                                  className="text-amber-400 hover:text-amber-300 text-[11px] font-semibold underline"
                                >
                                  Pardon
                                </button>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-10 text-slate-500">
                    <p className="text-xs">No strike violations recorded in the last 24 hours.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 6: QUARANTINE ROSTER */}
        {/* ========================================================= */}
        {activeTab === "quarantine" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Manual Quarantine Form */}
            {canEdit && (
              <div className="glass-card rounded-2xl p-5 border border-border">
                <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                  <Lock className="h-4 w-4 text-amber-400" />
                  Manual Quarantine Dispatcher
                </h3>
                <form onSubmit={handleManualJail} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      User ID / Mention
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 1520461877073674392"
                      value={manualJailUserId}
                      onChange={(e) => setManualJailUserId(e.target.value)}
                      className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs text-white outline-none focus:border-brand-red"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      Duration (Minutes)
                    </label>
                    <input
                      type="number"
                      min="5"
                      max="10080"
                      value={manualJailDuration}
                      onChange={(e) => setManualJailDuration(e.target.value)}
                      className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs text-white outline-none focus:border-brand-red"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      Reason
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Raiding, suspicious activity..."
                      value={manualJailReason}
                      onChange={(e) => setManualJailReason(e.target.value)}
                      className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs text-white outline-none focus:border-brand-red"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      type="submit"
                      className="w-full rounded-xl bg-amber-600 hover:bg-amber-500 text-white py-2 text-xs font-bold uppercase tracking-wider transition-all shadow-lg"
                    >
                      Quarantine User
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Inmates Table */}
            <div className="glass-card rounded-2xl border border-border overflow-hidden">
              <div className="border-b border-border bg-surface/50 px-6 py-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Users className="h-4 w-4 text-amber-400" />
                  Active Quarantine Inmates ({jailedUsers.length})
                </h3>
              </div>

              {jailedUsers.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-surface text-slate-400 uppercase tracking-wider text-[10px] border-b border-border">
                      <tr>
                        <th className="py-3 px-4">User ID</th>
                        <th className="py-3 px-4">Reason</th>
                        <th className="py-3 px-4">Jailed At</th>
                        <th className="py-3 px-4">Release Due</th>
                        {canEdit && <th className="py-3 px-4 text-right">Action</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {jailedUsers.map((u) => (
                        <tr key={u.id} className="hover:bg-surface/40 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-white">{u.user_id}</td>
                          <td className="py-3 px-4 text-slate-300">{u.reason || "Automod Violation"}</td>
                          <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                            {new Date(u.jailed_at).toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                            {u.release_at ? new Date(u.release_at).toLocaleString() : "Permanent / Manual"}
                          </td>
                          {canEdit && (
                            <td className="py-3 px-4 text-right">
                              <button
                                onClick={() => handleUnjail(u.user_id)}
                                className="rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-400 px-3 py-1.5 text-xs font-bold transition-all"
                              >
                                Release / Unjail
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 text-slate-500">
                  <Users className="h-10 w-10 mx-auto mb-2 text-slate-600" />
                  <p className="text-sm">No members are currently isolated or serving quarantine terms.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 7: SECURITY WHITELIST */}
        {/* ========================================================= */}
        {activeTab === "whitelist" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Add Exemption Form */}
            {canEdit && (
              <form
                onSubmit={handleAddWhitelist}
                className="glass-card p-5 rounded-2xl border border-border flex flex-col sm:flex-row gap-3 items-end"
              >
                <div className="w-full sm:w-48">
                  <label className="block text-xs font-bold text-slate-300 mb-1">Entity Type</label>
                  <select
                    value={newWhiteType}
                    onChange={(e) => setNewWhiteType(e.target.value)}
                    className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs text-white outline-none focus:border-brand-red"
                  >
                    <option value="domain">Domain</option>
                    <option value="user">User ID</option>
                    <option value="role">Role ID</option>
                    <option value="channel">Channel ID</option>
                  </select>
                </div>

                <div className="w-full flex-1">
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Target (e.g. syncink.com, 1520462320235577454)
                  </label>
                  <input
                    type="text"
                    value={newWhiteValue}
                    onChange={(e) => setNewWhiteValue(e.target.value)}
                    placeholder="Enter trusted domain or Discord snowflake ID..."
                    className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs text-white outline-none focus:border-brand-red"
                  />
                </div>

                <button
                  type="submit"
                  className="flex items-center gap-2 rounded-xl bg-brand-red hover:bg-brand-crimson text-white px-5 py-2 text-xs font-bold uppercase tracking-wider transition-all shadow-glow shrink-0"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Exemption</span>
                </button>
              </form>
            )}

            {/* Whitelist Matrix Table */}
            <div className="glass-card rounded-2xl border border-border overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border bg-surface/50 px-6 py-4">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    Trusted Whitelist Matrix ({whitelistEntries.length})
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Exempted entities bypass anti-spam, link filters, and rate-limits.
                  </p>
                </div>

                <div className="flex items-center gap-1.5">
                  {["ALL", "DOMAIN", "USER", "ROLE", "CHANNEL"].map((type) => (
                    <button
                      key={type}
                      onClick={() => setWhitelistFilter(type)}
                      className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all ${
                        whitelistFilter === type
                          ? "bg-brand-red text-white"
                          : "bg-surface text-slate-400 hover:text-white border border-border"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {filteredWhitelist.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-surface text-slate-400 uppercase tracking-wider text-[10px] border-b border-border">
                      <tr>
                        <th className="py-3 px-4">Type</th>
                        <th className="py-3 px-4">Entity / Target Value</th>
                        <th className="py-3 px-4">Created Date</th>
                        {canEdit && <th className="py-3 px-4 text-right">Revoke</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {filteredWhitelist.map((e) => (
                        <tr key={e.id} className="hover:bg-surface/40 transition-colors">
                          <td className="py-3 px-4">
                            <span className="rounded bg-surface px-2 py-0.5 font-bold uppercase text-[10px] text-cyan-400 border border-cyan-500/30">
                              {e.entity_type}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono font-semibold text-white">
                            {e.entity_id_or_val}
                          </td>
                          <td className="py-3 px-4 text-slate-400">
                            {new Date(e.created_at).toLocaleDateString()}
                          </td>
                          {canEdit && (
                            <td className="py-3 px-4 text-right">
                              <button
                                onClick={() => handleDeleteWhitelist(e.id)}
                                className="text-slate-400 hover:text-red-400 p-1 rounded hover:bg-red-500/10 transition-colors"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-10 text-slate-500">
                  <p className="text-xs">No exemptions found for selected filter.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 8: LOGGING & CHANNEL ROUTING */}
        {/* ========================================================= */}
        {activeTab === "channels" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <form onSubmit={handleSaveChannels} className="space-y-6">
              {/* Log Channels Grid */}
              <div className="glass-card rounded-2xl p-6 border border-border">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-border/60">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-bold text-white flex items-center gap-2">
                        <Hash className="h-5 w-5 text-brand-red" />
                        Dedicated Logging Channel Destinations
                      </h2>
                      <span className="rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Bot Sync Active
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      Route specific Discord security audit logs to dedicated text channels. Paste Channel IDs or mentions (<code className="text-brand-red">#logs</code> or <code className="text-brand-red">&lt;#12345...&gt;</code>). Syncs directly with your Discord bot.
                    </p>
                  </div>

                  {canEdit && (
                    <button
                      type="submit"
                      disabled={actionLoading === "channels"}
                      className="flex items-center justify-center gap-2 rounded-xl bg-brand-red hover:bg-brand-crimson px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-glow transition-all active:scale-98 disabled:opacity-50 shrink-0"
                    >
                      <Check className="h-4 w-4" />
                      <span>{actionLoading === "channels" ? "Saving..." : "Save Logging Channels"}</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    { key: "log_channel_moderation", label: "Moderation Logs", desc: "Bans, kicks, timeouts, warnings", icon: <ShieldAlert className="h-4 w-4 text-red-400" /> },
                    { key: "log_channel_message", label: "Message Logs", desc: "Edits, deletions, purges", icon: <MessageSquare className="h-4 w-4 text-amber-400" /> },
                    { key: "log_channel_member", label: "Member Logs", desc: "Joins, leaves, kick notices", icon: <Users className="h-4 w-4 text-blue-400" /> },
                    { key: "log_channel_role", label: "Role Logs", desc: "Role creations, assignments, edits", icon: <Key className="h-4 w-4 text-purple-400" /> },
                    { key: "log_channel_channel", label: "Channel Logs", desc: "Channel creations, permission edits", icon: <Hash className="h-4 w-4 text-cyan-400" /> },
                    { key: "log_channel_voice", label: "Voice Logs", desc: "Voice channel joins, leaves, moves", icon: <Radio className="h-4 w-4 text-emerald-400" /> },
                    { key: "log_channel_verification", label: "Verification Logs", desc: "Captcha completes, gate failures", icon: <CheckCircle2 className="h-4 w-4 text-emerald-400" /> },
                    { key: "log_channel_server", label: "Server Updates", desc: "Server name, icon, vanity edits", icon: <Settings className="h-4 w-4 text-orange-400" /> },
                    { key: "log_channel_appeals", label: "Appeals Channel", desc: "Ban and quarantine appeal tickets", icon: <AlertCircle className="h-4 w-4 text-rose-400" /> },
                    { key: "welcome_channel_id", label: "Welcome Channel", desc: "Public member welcome messages", icon: <Sparkles className="h-4 w-4 text-amber-400" /> },
                    { key: "suggestion_channel_id", label: "Suggestions Channel", desc: "Community feature requests feed", icon: <ThumbsUp className="h-4 w-4 text-cyan-400" /> },
                    { key: "jail_channel_id", label: "Quarantine Channel", desc: "Isolated channel for inmates", icon: <Lock className="h-4 w-4 text-indigo-400" /> },
                  ].map((field) => (
                    <div key={field.key} className="glass-panel p-4 rounded-xl border border-border/80 flex flex-col justify-between hover:border-slate-600 transition-colors">
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <div className="flex items-center gap-1.5">
                            {field.icon}
                            <label className="text-xs font-bold text-slate-200">
                              {field.label}
                            </label>
                          </div>
                          {channelData[field.key] ? (
                            <span className="text-[10px] text-emerald-400 font-mono font-bold bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                              Configured
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-500 font-mono">
                              Not Set
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 mb-2.5">{field.desc}</p>
                      </div>

                      <div className="relative flex items-center">
                        <span className="absolute left-3 text-slate-500 font-mono text-xs select-none">#</span>
                        <input
                          type="text"
                          placeholder="Paste Channel ID or #mention..."
                          value={channelData[field.key] || ""}
                          onChange={(e) => {
                            const val = e.target.value.replace(/[<#>]/g, "").trim();
                            setChannelData({ ...channelData, [field.key]: val });
                          }}
                          disabled={!canEdit}
                          className="w-full rounded-xl border border-border bg-surface pl-7 pr-7 py-2 text-xs text-white outline-none focus:border-brand-red font-mono disabled:opacity-50 placeholder:text-slate-600"
                        />
                        {channelData[field.key] && canEdit && (
                          <button
                            type="button"
                            onClick={() => setChannelData({ ...channelData, [field.key]: "" })}
                            className="absolute right-2.5 text-slate-500 hover:text-white p-0.5 transition-colors"
                            title="Clear Channel"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {canEdit && (
                  <div className="flex justify-end pt-5 mt-4 border-t border-border/50">
                    <button
                      type="submit"
                      disabled={actionLoading === "channels"}
                      className="flex items-center justify-center gap-2 rounded-xl bg-brand-red hover:bg-brand-crimson px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-glow transition-all active:scale-98 disabled:opacity-50"
                    >
                      <Check className="h-4 w-4" />
                      <span>{actionLoading === "channels" ? "Saving..." : "Save Logging Channels"}</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Special Security Roles */}
              <div className="glass-card rounded-2xl p-6 border border-border">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-4 border-b border-border/60">
                  <div>
                    <h2 className="text-base font-bold text-white flex items-center gap-2">
                      <Key className="h-5 w-5 text-amber-400" />
                      Security Roles Architecture
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">
                      Assign role IDs for automated verification gates, autoroles, and quarantine isolation.
                    </p>
                  </div>

                  {canEdit && (
                    <button
                      type="submit"
                      disabled={actionLoading === "channels"}
                      className="flex items-center justify-center gap-2 rounded-xl bg-surface-hover hover:bg-surface border border-border px-5 py-2 text-xs font-bold uppercase tracking-wider text-white transition-all active:scale-98 disabled:opacity-50 shrink-0"
                    >
                      <Check className="h-4 w-4" />
                      <span>{actionLoading === "channels" ? "Saving..." : "Save Roles"}</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { key: "jail_role_id", label: "Quarantine / Prisoner Role", desc: "Stripped of permissions" },
                    { key: "autorole_id", label: "Default Member Autorole", desc: "Given upon verified join" },
                    { key: "verification_role_id", label: "Verified Member Role", desc: "Gate unlock role" },
                    { key: "unverified_role_id", label: "Unverified Gate Role", desc: "Assigned prior to captcha" },
                  ].map((field) => (
                    <div key={field.key} className="glass-panel p-4 rounded-xl border border-border/80 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <label className="text-xs font-bold text-slate-200">
                            {field.label}
                          </label>
                          {roleData[field.key] ? (
                            <span className="text-[10px] text-emerald-400 font-mono font-bold bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                              Configured
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-500 font-mono">Not Set</span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 mb-2.5">{field.desc}</p>
                      </div>

                      <div className="relative flex items-center">
                        <span className="absolute left-3 text-slate-500 font-mono text-xs select-none">@</span>
                        <input
                          type="text"
                          placeholder="Paste Role ID or @mention..."
                          value={roleData[field.key] || ""}
                          onChange={(e) => {
                            const val = e.target.value.replace(/[<@&>]/g, "").trim();
                            setRoleData({ ...roleData, [field.key]: val });
                          }}
                          disabled={!canEdit}
                          className="w-full rounded-xl border border-border bg-surface pl-7 pr-7 py-2 text-xs text-white outline-none focus:border-brand-red font-mono disabled:opacity-50 placeholder:text-slate-600"
                        />
                        {roleData[field.key] && canEdit && (
                          <button
                            type="button"
                            onClick={() => setRoleData({ ...roleData, [field.key]: "" })}
                            className="absolute right-2.5 text-slate-500 hover:text-white p-0.5 transition-colors"
                            title="Clear Role"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Welcome Message Automation */}
              <div className="glass-card rounded-2xl p-6 border border-border">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-border/60">
                  <div>
                    <h2 className="text-base font-bold text-white flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-cyan-400" />
                      Welcome Flow Automation
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">
                      Custom message sent to new members with optional direct message routing.
                    </p>
                  </div>

                  {canEdit && (
                    <button
                      type="submit"
                      disabled={actionLoading === "channels"}
                      className="flex items-center justify-center gap-2 rounded-xl bg-surface-hover hover:bg-surface border border-border px-5 py-2 text-xs font-bold uppercase tracking-wider text-white transition-all active:scale-98 disabled:opacity-50 shrink-0"
                    >
                      <Check className="h-4 w-4" />
                      <span>{actionLoading === "channels" ? "Saving..." : "Save Welcome Flow"}</span>
                    </button>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      Welcome Message Template
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Welcome {user} to {server}! Please read our rules in #rules."
                      value={welcomeData.welcome_message || ""}
                      onChange={(e) =>
                        setWelcomeData({ ...welcomeData, welcome_message: e.target.value })
                      }
                      disabled={!canEdit}
                      className="w-full rounded-xl border border-border bg-surface p-3.5 text-xs text-white outline-none focus:border-brand-red disabled:opacity-50 leading-relaxed"
                    />
                    <p className="text-[11px] text-slate-500 mt-1">
                      Available variables: <code className="text-brand-red font-mono">&#123;user&#125;</code> (mentions member), <code className="text-brand-red font-mono">&#123;server&#125;</code> (server name).
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-6 pt-1">
                    <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={welcomeData.dm_welcome}
                        onChange={(e) =>
                          setWelcomeData({ ...welcomeData, dm_welcome: e.target.checked })
                        }
                        disabled={!canEdit}
                        className="accent-brand-red h-4 w-4 rounded"
                      />
                      <span>Direct Message (DM) Member on Join</span>
                    </label>
                    <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={welcomeData.auto_delete_welcome}
                        onChange={(e) =>
                          setWelcomeData({
                            ...welcomeData,
                            auto_delete_welcome: e.target.checked,
                          })
                        }
                        disabled={!canEdit}
                        className="accent-brand-red h-4 w-4 rounded"
                      />
                      <span>Auto-delete Welcome message in channel after 60s</span>
                    </label>
                  </div>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 9: COMMUNITY SUGGESTIONS */}
        {/* ========================================================= */}
        {activeTab === "suggestions" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-cyan-400" />
                  Community Suggestions Board
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Review member feature requests, vote metrics, and update development status.
                </p>
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto">
                {["ALL", "PENDING", "APPROVED", "IN PROGRESS", "IMPLEMENTED", "REJECTED"].map((st) => (
                  <button
                    key={st}
                    onClick={() => setSuggestionFilter(st)}
                    className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all whitespace-nowrap ${
                      suggestionFilter === st
                        ? "bg-brand-red text-white"
                        : "bg-surface text-slate-400 hover:text-white border border-border"
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {suggestions.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {suggestions.map((s) => (
                  <div key={s.id} className="glass-card rounded-2xl p-5 border border-border flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="font-mono text-xs font-bold text-slate-400">#{s.id}</span>
                        <span
                          className={`rounded px-2.5 py-0.5 text-[10px] font-extrabold uppercase ${
                            s.status === "APPROVED"
                              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                              : s.status === "IMPLEMENTED"
                              ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/40"
                              : s.status === "IN PROGRESS"
                              ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                              : s.status === "REJECTED"
                              ? "bg-red-500/20 text-red-400 border border-red-500/40"
                              : "bg-slate-700/50 text-slate-300 border border-border"
                          }`}
                        >
                          {s.status}
                        </span>
                      </div>

                      {s.title && <h4 className="font-bold text-white text-sm mb-1">{s.title}</h4>}
                      <p className="text-xs text-slate-300 leading-relaxed">{s.content}</p>
                    </div>

                    <div className="mt-5 pt-3 border-t border-border/60 flex items-center justify-between">
                      <div className="flex items-center gap-3 text-xs text-slate-400">
                        <span className="flex items-center gap-1 font-semibold text-emerald-400">
                          <ThumbsUp className="h-3.5 w-3.5" /> {s.upvotes || 0}
                        </span>
                        <span className="flex items-center gap-1 font-semibold text-red-400">
                          <ThumbsDown className="h-3.5 w-3.5" /> {s.downvotes || 0}
                        </span>
                        <span className="font-mono text-[11px] text-slate-500">by {s.user_id}</span>
                      </div>

                      {canEdit && (
                        <div className="flex items-center gap-2">
                          <select
                            value={s.status}
                            onChange={(e) => handleUpdateSuggestionStatus(s.id, e.target.value)}
                            className="rounded-lg border border-border bg-surface px-2 py-1 text-[11px] font-bold text-white outline-none focus:border-brand-red"
                          >
                            <option value="PENDING">PENDING</option>
                            <option value="APPROVED">APPROVE</option>
                            <option value="IN PROGRESS">IN PROGRESS</option>
                            <option value="IMPLEMENTED">IMPLEMENTED</option>
                            <option value="REJECTED">REJECT</option>
                          </select>
                          <button
                            onClick={() => handleDeleteSuggestion(s.id)}
                            className="text-slate-400 hover:text-red-400 p-1 rounded transition-colors"
                            title="Delete suggestion"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="glass-card rounded-2xl p-12 text-center text-slate-500 border border-border">
                <MessageSquare className="h-10 w-10 mx-auto mb-2 text-slate-600" />
                <p className="text-sm">No community suggestions found for this status.</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

// --- Micro Components ---

function NavTab({
  active,
  onClick,
  icon,
  label,
  badge,
  badgeColor = "slate",
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  badge?: string;
  badgeColor?: "red" | "amber" | "emerald" | "slate";
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${
        active
          ? "bg-brand-red text-white shadow-glow"
          : "text-slate-400 hover:text-slate-200 hover:bg-surface-hover"
      }`}
    >
      {icon}
      <span>{label}</span>
      {badge && (
        <span
          className={`rounded-full px-1.5 py-0.2 text-[9px] font-extrabold uppercase ${
            badgeColor === "red"
              ? "bg-red-500 text-white"
              : badgeColor === "amber"
              ? "bg-amber-500 text-black"
              : badgeColor === "emerald"
              ? "bg-emerald-500 text-white"
              : "bg-surface-card text-slate-300"
          }`}
        >
          {badge}
        </span>
      )}
    </button>
  );
}

function MetricCard({
  icon,
  title,
  value,
  subtitle,
  badge,
  badgeColor,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  subtitle: string;
  badge: string;
  badgeColor: "emerald" | "red" | "amber" | "cyan";
}) {
  return (
    <div className="glass-card rounded-2xl p-5 border border-border/80 flex flex-col justify-between">
      <div className="flex items-center justify-between mb-2">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-surface border border-border">
          {icon}
        </div>
        <span
          className={`rounded px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider ${
            badgeColor === "emerald"
              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
              : badgeColor === "red"
              ? "bg-red-500/20 text-red-400 border border-red-500/30"
              : badgeColor === "amber"
              ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
              : "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
          }`}
        >
          {badge}
        </span>
      </div>
      <div>
        <h3 className="text-2xl font-black text-white tracking-tight">{value}</h3>
        <p className="text-xs font-semibold text-slate-300 mt-0.5">{title}</p>
        <p className="text-[11px] text-slate-500 mt-0.5">{subtitle}</p>
      </div>
    </div>
  );
}

function ModuleCard({
  title,
  description,
  enabled,
  loading,
  onToggle,
  badge,
  canEdit,
}: {
  title: string;
  description: string;
  enabled: boolean;
  loading: boolean;
  onToggle: () => void;
  badge: string;
  canEdit: boolean;
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
            <span
              className={`h-2 w-2 rounded-full ${
                enabled ? "bg-emerald-400 shadow-glow-green" : "bg-red-400"
              }`}
            />
            {enabled ? "ONLINE" : "DISABLED"}
          </span>
        </div>
        <h3 className="font-bold text-white text-base">{title}</h3>
        <p className="text-xs text-slate-400 mt-1 leading-relaxed">{description}</p>
      </div>

      <div className="mt-5 pt-3 border-t border-border/60 flex items-center justify-between">
        <span className="text-xs text-slate-400">
          {canEdit ? "Toggle Module:" : "State (Read-Only):"}
        </span>
        <button
          onClick={onToggle}
          disabled={loading || !canEdit}
          title={!canEdit ? "Server Owner / Admin privileges required" : undefined}
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
