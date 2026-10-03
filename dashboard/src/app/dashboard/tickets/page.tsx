"use client";

import React, { useEffect, useState, useRef, useTransition } from "react";
import "./ticket-dashboard.css";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowRightLeft,
  BarChart3,
  BookOpen,
  Bot,
  Box,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  Clock,
  Crown,
  ExternalLink,
  Eye,
  FileText,
  HelpCircle,
  LayoutDashboard,
  Layers,
  Lock,
  LogOut,
  Menu,
  MessageSquareMore,
  Paintbrush,
  PanelsTopLeft,
  Plus,
  RefreshCw,
  Save,
  ScrollText,
  Search,
  Send,
  Settings,
  Shield,
  ShieldCheck,
  SlidersHorizontal,
  Ticket,
  Trash2,
  User,
  X
} from "lucide-react";

// Types
interface DiscordUser {
  id: string;
  username: string;
  global_name?: string;
  avatar?: string;
}

interface GuildItem {
  id: string;
  name: string;
  icon?: string;
  owner?: boolean;
  dashboardTier?: string;
  memberCount?: number;
}

interface PanelConfig {
  title: string;
  description: string[];
  color: string;
  thumbnailUrl: string;
  placeholder: string;
}

interface TicketCategory {
  id?: string;
  value: string;
  label: string;
  emoji: string;
  emojiTag?: string;
  roleIds?: string[];
  roleGroup?: string;
  targetCategoryChannelId?: string;
}

interface ToastMessage {
  id: string;
  title: string;
  description: string;
  tone: "info" | "success" | "warning" | "error";
}

const DEFAULT_PANEL_CONFIG: PanelConfig = {
  title: "🛠️ Support Center",
  description: [
    "🔍 Select the `category` that best matches your request to help us assist you faster.",
    "☑️ Please avoid opening `duplicate or unnecessary` tickets. Misuse of the support system may result in moderation."
  ],
  color: "#7c3aed",
  thumbnailUrl: "https://cdn3.emoji.gg/emojis/70776-admin.png",
  placeholder: "Select a support category..."
};

const DEFAULT_CATEGORIES: TicketCategory[] = [
  { value: "product_support", label: "Product Support", emoji: "1553532855278116956", emojiTag: "<:SyncProductSupport:1553532855278116956>", roleGroup: "staffRoleIds" },
  { value: "account_server", label: "Account & Server", emoji: "1553532858058936424", emojiTag: "<:accsvr:1553532858058936424>", roleGroup: "staffRoleIds" },
  { value: "bug_report", label: "Bug Report", emoji: "1553532860408012850", emojiTag: "<:bugreport:1553532860408012850>", roleGroup: "developerRoleIds" },
  { value: "staff_abuse", label: "Staff Abuse", emoji: "1553532862945562754", emojiTag: "<:staffabuse:1553532862945562754>", roleGroup: "adminRoleIds" },
  { value: "partnership", label: "Partnership / Business", emoji: "1553532869950046340", emojiTag: "<:SyncPartnership:1553532869950046340>", roleGroup: "ownerRoleIds" },
  { value: "other", label: "Other", emoji: "1553533697364598814", emojiTag: "<:others:1553533697364598814>", roleGroup: "staffRoleIds" }
];

// Discord markdown and emoji tokenizer
function tokenizeDiscordText(text: string) {
  const source = String(text || "");
  const tokens: Array<{ type: "text" | "emoji" | "code" | "bold" | "underline"; value?: string; name?: string; id?: string }> = [];
  const pattern = /<a?:([a-zA-Z0-9_]+):(\d+)>|`([^`]+)`|\*\*([^*]+)\*\*|__([^_]+)__/g;
  let lastIndex = 0;
  let match;

  while ((match = pattern.exec(source)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({ type: "text", value: source.slice(lastIndex, match.index) });
    }

    if (match[1] && match[2]) {
      tokens.push({ type: "emoji", name: match[1], id: match[2] });
    } else if (match[3]) {
      tokens.push({ type: "code", value: match[3] });
    } else if (match[4]) {
      tokens.push({ type: "bold", value: match[4] });
    } else if (match[5]) {
      tokens.push({ type: "underline", value: match[5] });
    }

    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < source.length) {
    tokens.push({ type: "text", value: source.slice(lastIndex) });
  }

  return tokens;
}

function renderDiscordTokens(text: string, keyPrefix: string) {
  return tokenizeDiscordText(text).map((token, index) => {
    const key = `${keyPrefix}-${index}`;

    if (token.type === "emoji") {
      return (
        <img
          key={key}
          className="discord-custom-emoji"
          src={`https://cdn.discordapp.com/emojis/${token.id}.png`}
          alt={`:${token.name}:`}
          style={{ width: "1.25em", height: "1.25em", verticalAlign: "middle", display: "inline-block" }}
        />
      );
    }

    if (token.type === "code") {
      return <span key={key} className="discord-inline-code">{token.value}</span>;
    }

    if (token.type === "bold") {
      return <strong key={key}>{token.value}</strong>;
    }

    if (token.type === "underline") {
      return <u key={key}>{token.value}</u>;
    }

    return <React.Fragment key={key}>{token.value}</React.Fragment>;
  });
}

function renderTierBadge(tier: string = "member") {
  switch (tier.toLowerCase()) {
    case "owner":
      return <span className="role-badge owner"><Crown size={11} /> Server Owner</span>;
    case "developer":
      return <span className="role-badge developer"><ShieldCheck size={11} /> Developer</span>;
    case "admin":
      return <span className="role-badge admin"><ShieldCheck size={11} /> Administrator</span>;
    case "moderator":
      return <span className="role-badge moderator"><ShieldCheck size={11} /> Moderator</span>;
    case "staff":
      return <span className="role-badge staff"><ShieldCheck size={11} /> Staff</span>;
    default:
      return <span className="role-badge member" style={{ color: "var(--text-muted)" }}><User size={11} /> Member</span>;
  }
}

export default function NativeTicketDashboardPage() {
  const [, startTransition] = useTransition();

  // Authentication & Guild Selection
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<DiscordUser | null>(null);
  const [guilds, setGuilds] = useState<GuildItem[]>([]);
  const [selectedGuildId, setSelectedGuildId] = useState<string | null>(null);

  // Active View State
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [snapshot, setSnapshot] = useState<any>(null);
  const [snapshotLoading, setSnapshotLoading] = useState(false);
  const [busy, setBusy] = useState(false);

  // UI Interactivity State
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isDirty, setIsDirty] = useState(false);
  const [saveAction, setSaveAction] = useState<(() => Promise<void>) | null>(null);
  const [confirmState, setConfirmState] = useState<{ title: string; message: string; confirmLabel?: string; onConfirm: () => void } | null>(null);
  const [serverDropdownOpen, setServerDropdownOpen] = useState(false);
  const [serverSearch, setServerSearch] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedTranscriptModal, setSelectedTranscriptModal] = useState<any>(null);

  // Panel Form State
  const [panelForm, setPanelForm] = useState<PanelConfig>(DEFAULT_PANEL_CONFIG);
  const [panelChannelId, setPanelChannelId] = useState<string>("");

  // Categories Form State
  const [categories, setCategories] = useState<TicketCategory[]>(DEFAULT_CATEGORIES);

  // Inactivity & Misc Form State
  const [inactivityMinutes, setInactivityMinutes] = useState<number>(120);
  const [logChannelId, setLogChannelId] = useState<string>("");
  const [transcriptChannelId, setTranscriptChannelId] = useState<string>("");
  const [botNickname, setBotNickname] = useState<string>("");

  // Interface Prefs State
  const [interfacePrefs, setInterfacePrefs] = useState({
    theme: "dark",
    motion: "full",
    clarity: "balanced",
    density: "comfortable",
    sidebarBehavior: "auto"
  });

  const dismissToast = (id: string) => {
    setToasts((cur) => cur.filter((t) => t.id !== id));
  };

  const pushToast = (toast: Omit<ToastMessage, "id">) => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((cur) => [...cur, { id, ...toast }].slice(-5));
    window.setTimeout(() => dismissToast(id), 4200);
  };

  const openConfirm = (config: { title: string; message: string; confirmLabel?: string }, action: () => void) => {
    setConfirmState({
      title: config.title,
      message: config.message,
      confirmLabel: config.confirmLabel,
      onConfirm: () => {
        setConfirmState(null);
        action();
      }
    });
  };

  // Warn on browser close if unsaved
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  // Read URL params (for transcripts direct link)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab");
      const ticketIdParam = params.get("ticketId");
      if (tabParam) {
        setActiveTab(tabParam);
      }
      if (ticketIdParam) {
        setActiveTab("transcripts");
      }
    }
  }, []);

  // Check Authentication
  useEffect(() => {
    checkAuth();
  }, []);

  const getStoredToken = (): string | null => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("syncink_ticket_token");
  };

  const getAuthHeaders = (): Record<string, string> => {
    const token = getStoredToken();
    const headers: Record<string, string> = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
      headers["x-session-id"] = token;
      headers["x-token"] = token;
    }
    return headers;
  };

  const checkAuth = async () => {
    setLoading(true);
    try {
      // 0. Extract token from URL if redirected from Discord OAuth callback
      let activeToken = getStoredToken();
      if (typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        const urlToken = params.get("token") || params.get("session_id");
        if (urlToken) {
          activeToken = urlToken;
          localStorage.setItem("syncink_ticket_token", urlToken);
          params.delete("token");
          params.delete("session_id");
          const remaining = params.toString();
          const cleanUrl = window.location.pathname + (remaining ? `?${remaining}` : "");
          window.history.replaceState({}, document.title, cleanUrl);
        }
      }

      const headers: Record<string, string> = {};
      if (activeToken) {
        headers["Authorization"] = `Bearer ${activeToken}`;
        headers["x-session-id"] = activeToken;
        headers["x-token"] = activeToken;
      }

      // 1. Try local proxy first (same-origin, no CORS, passes cookies and auth headers)
      const proxyQuery = activeToken ? `?token=${encodeURIComponent(activeToken)}` : "";
      let res = await fetch(`/api/tickets/auth/me${proxyQuery}`, {
        headers
      }).catch(() => null);

      // 2. If proxy returns 502/404 or fails, try direct Render backend
      if (!res || !res.ok) {
        const directUrl = activeToken
          ? `https://syncink-ticket.onrender.com/api/auth/me?token=${encodeURIComponent(activeToken)}`
          : "https://syncink-ticket.onrender.com/api/auth/me";
        res = await fetch(directUrl, {
          credentials: "include",
          headers
        }).catch(() => null);
      }

      if (res && res.ok) {
        const data = await res.json();
        setUser(data.user || null);
        setGuilds(data.guilds || []);

        if (data.guilds && data.guilds.length > 0) {
          const storedGuild = localStorage.getItem("syncink_selected_guild");
          const found = data.guilds.find((g: any) => g.id === storedGuild);
          const initialGuildId = found ? found.id : data.guilds[0].id;
          setSelectedGuildId(initialGuildId);
          fetchGuildSnapshot(initialGuildId);
        }
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = () => {
    const returnTarget = encodeURIComponent(window.location.origin + "/dashboard/tickets");
    window.location.href = `/api/tickets/auth/login?redirect=${returnTarget}`;
  };

  const handleLogout = async () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("syncink_ticket_token");
      localStorage.removeItem("syncink_selected_guild");
    }
    const returnTarget = encodeURIComponent(window.location.origin + "/dashboard/tickets");
    window.location.href = `/api/tickets/auth/logout?redirect=${returnTarget}`;
  };

  // Fetch Guild Data Snapshot
  const fetchGuildSnapshot = async (guildId: string) => {
    if (!guildId) return;
    setSnapshotLoading(true);
    try {
      const activeToken = getStoredToken();
      const headers = getAuthHeaders();
      const tokenParam = activeToken ? `&token=${encodeURIComponent(activeToken)}` : "";

      // 1. Try local proxy first
      let res = await fetch(`/api/tickets/guilds/${guildId}/bootstrap?_t=${Date.now()}${tokenParam}`, {
        headers
      }).catch(() => null);

      // 2. Fall back to direct Render backend
      if (!res || !res.ok) {
        res = await fetch(`https://syncink-ticket.onrender.com/api/guilds/${guildId}/bootstrap?_t=${Date.now()}${tokenParam}`, {
          credentials: "include",
          headers
        }).catch(() => null);
      }

      if (res && res.ok) {
        const data = await res.json();
        if (data && data.guild) {
          startTransition(() => {
            setSnapshot(data);
            if (data.settings?.panelConfig) {
              setPanelForm({
                title: data.settings.panelConfig.title || DEFAULT_PANEL_CONFIG.title,
                description: data.settings.panelConfig.description || DEFAULT_PANEL_CONFIG.description,
                color: data.settings.panelConfig.color || DEFAULT_PANEL_CONFIG.color,
                thumbnailUrl: data.settings.panelConfig.thumbnailUrl || DEFAULT_PANEL_CONFIG.thumbnailUrl,
                placeholder: data.settings.panelConfig.placeholder || DEFAULT_PANEL_CONFIG.placeholder
              });
            }
            if (data.settings?.panelChannelId) {
              setPanelChannelId(data.settings.panelChannelId);
            }
            if (data.settings?.logChannelId) {
              setLogChannelId(data.settings.logChannelId);
            }
            if (data.settings?.transcriptChannelId) {
              setTranscriptChannelId(data.settings.transcriptChannelId);
            }
            if (data.settings?.inactivityReminderMinutes) {
              setInactivityMinutes(data.settings.inactivityReminderMinutes);
            }
            if (data.settings?.categoryOverrides?.length > 0) {
              setCategories(data.settings.categoryOverrides);
            }
            if (data.bot?.nickname) {
              setBotNickname(data.bot.nickname);
            }
            setIsDirty(false);
            setSaveAction(null);
          });
        } else {
          pushToast({
            title: "Server Notice",
            description: data?.error || "Could not retrieve server snapshot from bot backend.",
            tone: "warning"
          });
        }
      } else {
        pushToast({
          title: "Sync Error",
          description: "Failed to connect to the ticket bot backend. Ensure the bot is online.",
          tone: "error"
        });
      }
    } catch {
      pushToast({ title: "Sync notice", description: "Connected in offline preview mode.", tone: "info" });
    } finally {
      setSnapshotLoading(false);
    }
  };

  const handleSelectGuild = (guildId: string) => {
    setSelectedGuildId(guildId);
    localStorage.setItem("syncink_selected_guild", guildId);
    setServerDropdownOpen(false);
    fetchGuildSnapshot(guildId);
  };

  // Save Settings Handler
  const handleSaveSettings = async (payload: any, message: string = "Settings saved successfully") => {
    if (!selectedGuildId) return;
    setBusy(true);
    try {
      const activeToken = getStoredToken();
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...getAuthHeaders()
      };
      const tokenParam = activeToken ? `?token=${encodeURIComponent(activeToken)}` : "";

      let res = await fetch(`/api/tickets/guilds/${selectedGuildId}/settings${tokenParam}`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload)
      }).catch(() => null);

      if (!res || !res.ok) {
        res = await fetch(`https://syncink-ticket.onrender.com/api/guilds/${selectedGuildId}/settings${tokenParam}`, {
          method: "POST",
          headers,
          credentials: "include",
          body: JSON.stringify(payload)
        }).catch(() => null);
      }

      pushToast({ title: "Success", description: message, tone: "success" });
      setIsDirty(false);
      setSaveAction(null);
      await fetchGuildSnapshot(selectedGuildId);
    } catch {
      pushToast({ title: "Save Error", description: "Could not sync with bot backend.", tone: "error" });
    } finally {
      setBusy(false);
    }
  };

  // Deploy Panel Handler
  const handleDeployPanel = async () => {
    if (!selectedGuildId) return;
    setBusy(true);
    try {
      const activeToken = getStoredToken();
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...getAuthHeaders()
      };
      const tokenParam = activeToken ? `?token=${encodeURIComponent(activeToken)}` : "";

      let res = await fetch(`/api/tickets/guilds/${selectedGuildId}/panel/deploy${tokenParam}`, {
        method: "POST",
        headers,
        body: JSON.stringify({ channelId: panelChannelId, panelConfig: panelForm })
      }).catch(() => null);

      if (!res || !res.ok) {
        res = await fetch(`https://syncink-ticket.onrender.com/api/guilds/${selectedGuildId}/panel/deploy${tokenParam}`, {
          method: "POST",
          headers,
          credentials: "include",
          body: JSON.stringify({ channelId: panelChannelId, panelConfig: panelForm })
        }).catch(() => null);
      }

      pushToast({ title: "Panel Deployed!", description: "Discord ticket panel posted into channel.", tone: "success" });
    } catch {
      pushToast({ title: "Deploy failed", description: "Check bot permissions in selected channel.", tone: "error" });
    } finally {
      setBusy(false);
    }
  };

  // Live preview lines & formatted timestamp matching Image 2
  const previewLines = (panelForm.description || []).filter((line) => line !== undefined && line !== null && line !== "");
  const previewTimestamp = "02/07/2026 22:47";

  const selectedGuild = guilds.find((g) => g.id === selectedGuildId) || snapshot?.guild || null;

  // 1. Loading Splash Screen
  if (loading) {
    return (
      <div className="app-loading">
        <div className="flex flex-col items-center gap-4">
          <img src="/ticket-logo.png" alt="SyncInk Ticket" className="w-16 h-16 rounded-2xl animate-pulse" />
          <span className="text-sm font-semibold text-slate-300">Authenticating your dashboard session...</span>
        </div>
      </div>
    );
  }

  // 2. Unauthenticated Screen: Exact Login View from Vercel (Login.jsx)
  if (!user) {
    return (
      <div className="login-wrapper" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "85vh", padding: "20px" }}>
        <div className="login-ambient-glow" />

        <div
          className="login-card"
          style={{
            width: "min(480px, 100%)",
            display: "flex",
            flexDirection: "column",
            background: "rgba(8, 8, 8, 0.96)",
            boxShadow: "0 24px 80px rgba(0, 0, 0, 0.5)",
            borderRadius: "24px",
            border: "1px solid rgba(255, 255, 255, 0.08)"
          }}
        >
          <div className="auth-column panel" style={{ padding: "48px 40px", background: "transparent" }}>
            <div className="login-header" style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "32px", textAlign: "center" }}>
              <img
                src="/ticket-logo.png"
                alt="SyncInk Ticket Logo"
                className="login-logo"
                style={{ width: 84, height: 84, marginBottom: "20px", borderRadius: "50%", boxShadow: "0 0 40px rgba(139, 76, 255, 0.3)" }}
              />
              <h1
                style={{
                  fontSize: "28px",
                  marginBottom: "12px",
                  fontWeight: 700,
                  background: "linear-gradient(90deg, #d8b4ff, #8ab4f8)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  color: "transparent"
                }}
              >
                SyncInk Ticket
              </h1>
              <p style={{ color: "var(--text-muted)", fontSize: "14px", lineHeight: 1.6, padding: "0 10px" }}>
                The ticket management system. Manage your support channels, customize your panels, and take full control.
              </p>
            </div>

            <div className="login-features" style={{ marginBottom: "36px", display: "flex", flexDirection: "column", gap: "20px" }}>
              <div className="login-feature" style={{ border: "none", padding: 0, gap: "16px", display: "flex", alignItems: "center" }}>
                <div className="feature-icon" style={{ width: 42, height: 42, borderRadius: "14px", background: "rgba(139, 76, 255, 0.08)", color: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Ticket size={18} />
                </div>
                <div className="feature-text" style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "2px" }}>
                  <strong style={{ fontSize: "14px", color: "white" }}>Ticket Panels</strong>
                  <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Auto-create and manage dynamic support categories</span>
                </div>
              </div>

              <div className="login-feature" style={{ border: "none", padding: 0, gap: "16px", display: "flex", alignItems: "center" }}>
                <div className="feature-icon" style={{ width: 42, height: 42, borderRadius: "14px", background: "rgba(139, 76, 255, 0.08)", color: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Settings size={18} />
                </div>
                <div className="feature-text" style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "2px" }}>
                  <strong style={{ fontSize: "14px", color: "white" }}>Staff Controls</strong>
                  <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Easy role and server settings control</span>
                </div>
              </div>

              <div className="login-feature" style={{ border: "none", padding: 0, gap: "16px", display: "flex", alignItems: "center" }}>
                <div className="feature-icon" style={{ width: 42, height: 42, borderRadius: "14px", background: "rgba(139, 76, 255, 0.08)", color: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <ShieldCheck size={18} />
                </div>
                <div className="feature-text" style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "2px" }}>
                  <strong style={{ fontSize: "14px", color: "white" }}>Secure & Private</strong>
                  <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Secure Discord dashboard access</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              className="login-button"
              onClick={handleLogin}
              style={{
                width: "100%",
                padding: "16px",
                borderRadius: "14px",
                background: "#5865F2",
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "12px",
                fontSize: "15px",
                fontWeight: 600,
                border: "none",
                cursor: "pointer",
                boxShadow: "0 8px 24px rgba(88, 101, 242, 0.25)",
                transition: "background 0.2s, transform 0.1s"
              }}
            >
              <img
                src="https://cdn.prod.website-files.com/6257adef93867e50d84d30e2/636e0a6a49cf127bf92de1e2_icon_clyde_blurple_RGB.png"
                alt="Discord"
                style={{ width: 22, filter: "brightness(0) invert(1)" }}
              />
              Login with Discord
            </button>

            <div
              className="login-footer"
              style={{
                marginTop: "28px",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                fontSize: "12px",
                color: "var(--text-muted)",
                textAlign: "center",
                opacity: 0.8
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                SyncInk Ticket Dashboard &bull; Free for everyone &bull; Built with <span style={{ color: "#a588ff", fontSize: "14px", lineHeight: 1 }}>&hearts;</span>
              </div>
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "12px" }}>
                <button type="button" onClick={() => setActiveTab("terms")} className="glow-link" style={{ background: "none", border: "none", color: "inherit", cursor: "pointer" }}>Terms</button>
                <span style={{ color: "var(--border-strong)", fontSize: "10px" }}>┃</span>
                <button type="button" onClick={() => setActiveTab("privacy")} className="glow-link" style={{ background: "none", border: "none", color: "inherit", cursor: "pointer" }}>Privacy</button>
                <span style={{ color: "var(--border-strong)", fontSize: "10px" }}>┃</span>
                <button type="button" onClick={() => setActiveTab("faq")} className="glow-link" style={{ background: "none", border: "none", color: "inherit", cursor: "pointer" }}>FAQ</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 3. User Logged In, but hasn't used SyncInk Ticket in any server (Exact User-Requested Screen)
  if (user && guilds.length === 0) {
    return (
      <div className="server-shell" style={{ maxWidth: "600px", margin: "40px auto", padding: "20px" }}>
        <div className="server-header" style={{ textAlign: "center", marginBottom: "32px" }}>
          <img src="/ticket-logo.png" alt="SyncInk Ticket" style={{ width: 64, height: 64, borderRadius: 20, margin: "0 auto 18px", boxShadow: "0 0 30px rgba(139, 76, 255, 0.25)" }} />
          <h1 style={{ fontSize: "26px", fontWeight: 700, color: "white", marginBottom: "8px" }}>Select your workspace</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>
            Choose the Discord server you want to view or manage.
          </p>
        </div>

        <div className="server-empty" style={{ textAlign: "center", padding: "48px 32px", background: "rgba(10, 10, 10, 0.8)", borderRadius: "24px", border: "1px solid rgba(255, 255, 255, 0.08)", boxShadow: "0 20px 60px rgba(0,0,0,0.4)" }}>
          <div style={{ width: 60, height: 60, borderRadius: "18px", background: "rgba(139, 76, 255, 0.1)", color: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
            <Ticket size={28} />
          </div>
          <h2 style={{ fontSize: "20px", fontWeight: 700, color: "white", marginBottom: "10px" }}>
            You haven&apos;t used SyncInk Ticket in any server yet!
          </h2>
          <p style={{ color: "var(--text-muted)", fontSize: "14px", lineHeight: 1.6, marginBottom: "28px" }}>
            SyncInk Ticket is not active in any server where this account has administrator permissions. Invite the bot to your Discord server or ensure you have Administrator / Manage Server permissions to get started.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", alignItems: "center" }}>
            <a
              href="https://discord.com/oauth2/authorize?client_id=1344248888060809228&permissions=8&integration_type=0&scope=bot+applications.commands"
              target="_blank"
              rel="noreferrer"
              className="action-button tone-primary"
              style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "14px 28px", fontSize: "14px", fontWeight: 600, borderRadius: "14px", textDecoration: "none", color: "white", background: "var(--accent)" }}
            >
              <Plus size={18} /> Invite SyncInk Ticket to Your Server
            </a>
            <button
              type="button"
              onClick={handleLogout}
              style={{ background: "transparent", border: "none", color: "var(--accent)", cursor: "pointer", fontSize: "13px", fontWeight: 600, padding: "8px" }}
            >
              Log out and switch account
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 4. Authenticated & Has Servers: Full Dashboard Layout
  return (
    <div className="dashboard-root" style={{ minHeight: "100vh", background: "#000000", color: "var(--text)" }}>
      {/* Top Header */}
      <header className="dashboard-topbar" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 24px", borderBottom: "1px solid var(--border)", background: "rgba(5, 5, 5, 0.8)", backdropFilter: "blur(12px)", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <button
            type="button"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{ background: "none", border: "none", color: "var(--text)", cursor: "pointer" }}
          >
            <Menu size={20} />
          </button>

          <img src="/ticket-logo.png" alt="SyncInk" style={{ width: 34, height: 34, borderRadius: 10 }} />

          {/* Server Switcher Dropdown */}
          <div style={{ position: "relative" }}>
            <button
              type="button"
              onClick={() => setServerDropdownOpen(!serverDropdownOpen)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "8px 14px",
                borderRadius: "12px",
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid var(--border)",
                color: "var(--text)",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: 600
              }}
            >
              {selectedGuild?.icon ? (
                <img
                  src={`https://cdn.discordapp.com/icons/${selectedGuild.id}/${selectedGuild.icon}.png`}
                  alt={selectedGuild.name}
                  style={{ width: 22, height: 22, borderRadius: "50%" }}
                />
              ) : (
                <div style={{ width: 22, height: 22, borderRadius: "50%", background: "var(--accent)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px" }}>
                  {selectedGuild?.name ? selectedGuild.name.charAt(0) : "S"}
                </div>
              )}
              <span style={{ maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {selectedGuild?.name || "Select Server"}
              </span>
              {selectedGuild && renderTierBadge(selectedGuild.dashboardTier || (selectedGuild.owner ? "owner" : "admin"))}
              <ChevronDown size={14} style={{ opacity: 0.6 }} />
            </button>

            {serverDropdownOpen && (
              <div
                style={{
                  position: "absolute",
                  top: "calc(100% + 8px)",
                  left: 0,
                  width: "280px",
                  background: "#0f1426",
                  borderRadius: "16px",
                  border: "1px solid var(--border)",
                  boxShadow: "0 16px 40px rgba(0,0,0,0.6)",
                  padding: "10px",
                  zIndex: 100
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 12px", borderRadius: "10px", background: "rgba(0,0,0,0.3)", marginBottom: "8px" }}>
                  <Search size={14} style={{ color: "var(--text-muted)" }} />
                  <input
                    type="text"
                    value={serverSearch}
                    onChange={(e) => setServerSearch(e.target.value)}
                    placeholder="Filter servers..."
                    style={{ background: "transparent", border: "none", color: "white", fontSize: "12px", outline: "none", width: "100%" }}
                  />
                </div>

                <div style={{ maxHeight: "220px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "4px" }}>
                  {guilds
                    .filter((g) => g.name.toLowerCase().includes(serverSearch.toLowerCase()))
                    .map((g) => (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => handleSelectGuild(g.id)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          width: "100%",
                          padding: "8px 10px",
                          borderRadius: "8px",
                          border: "none",
                          background: g.id === selectedGuildId ? "rgba(139, 76, 255, 0.12)" : "transparent",
                          color: g.id === selectedGuildId ? "var(--accent)" : "var(--text)",
                          cursor: "pointer",
                          textAlign: "left",
                          fontSize: "12px",
                          fontWeight: g.id === selectedGuildId ? 700 : 500
                        }}
                      >
                        {g.icon ? (
                          <img src={`https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png`} alt="" style={{ width: 22, height: 22, borderRadius: "50%" }} />
                        ) : (
                          <div style={{ width: 22, height: 22, borderRadius: "50%", background: "#333", color: "#ccc", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px" }}>{g.name.charAt(0)}</div>
                        )}
                        <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{g.name}</span>
                        {g.id === selectedGuildId && <CheckCircle2 size={14} />}
                      </button>
                    ))}
                </div>

                <div style={{ borderTop: "1px solid var(--border)", paddingTop: "8px", marginTop: "8px" }}>
                  <a
                    href="https://discord.com/oauth2/authorize?client_id=1344248888060809228&permissions=8&integration_type=0&scope=bot+applications.commands"
                    target="_blank"
                    rel="noreferrer"
                    style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 10px", fontSize: "12px", color: "var(--accent)", textDecoration: "none", fontWeight: 600 }}
                  >
                    <Plus size={14} /> Add Bot to Another Server
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button
            type="button"
            onClick={() => selectedGuildId && fetchGuildSnapshot(selectedGuildId)}
            title="Refresh Server Data"
            style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 12px", borderRadius: "10px", background: "rgba(255,255,255,0.05)", border: "1px solid var(--border)", color: "var(--text-muted)", cursor: "pointer", fontSize: "12px" }}
          >
            <RefreshCw size={13} className={snapshotLoading ? "spin" : ""} />
            <span className="hidden sm:inline">Sync</span>
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "6px 12px", borderRadius: "12px", background: "rgba(255, 255, 255, 0.04)", border: "1px solid var(--border)" }}>
            {user.avatar ? (
              <img src={`https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`} alt="" style={{ width: 22, height: 22, borderRadius: "50%" }} />
            ) : (
              <User size={16} />
            )}
            <span style={{ fontSize: "12px", fontWeight: 600 }} className="hidden sm:inline">{user.global_name || user.username}</span>
            <button type="button" onClick={handleLogout} title="Log out" style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", marginLeft: "4px" }}>
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div style={{ display: "flex", minHeight: "calc(100vh - 65px)" }}>
        {/* Sidebar */}
        <aside
          style={{
            width: "260px",
            borderRight: "1px solid var(--border)",
            background: "rgba(5, 5, 5, 0.95)",
            padding: "20px 12px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            flexShrink: 0
          }}
          className={`${mobileMenuOpen ? "block fixed inset-y-0 left-0 z-50 w-72" : "hidden md:flex"}`}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <div style={{ padding: "0 12px 12px", fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Ticket Management
            </div>

            {[
              { id: "overview", label: "Dashboard Overview", icon: LayoutDashboard },
              { id: "panels", label: "Ticket Panels", icon: PanelsTopLeft },
              { id: "categories", label: "Ticket Categories", icon: MessageSquareMore },
              { id: "transfer-options", label: "Transfer Options", icon: ArrowRightLeft },
              { id: "ticket-logs", label: "Ticket Logs", icon: ClipboardList },
              { id: "transcripts", label: "Transcripts", icon: FileText },
              { id: "analytics", label: "Analytics", icon: BarChart3 },
              { id: "activity", label: "Activity Feed", icon: Activity },
              { id: "audit-logs", label: "Audit Logs", icon: ScrollText },
              { id: "dashboard-access", label: "Dashboard Access", icon: Shield },
              { id: "miscellaneous", label: "Miscellaneous", icon: SlidersHorizontal },
              { id: "bot-profile", label: "Bot Profile", icon: Bot },
              { id: "interface", label: "Interface", icon: Paintbrush }
            ].map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab.id);
                    setMobileMenuOpen(false);
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "10px 14px",
                    borderRadius: "10px",
                    border: "none",
                    background: active ? "rgba(139, 76, 255, 0.12)" : "transparent",
                    color: active ? "var(--accent)" : "var(--text-soft)",
                    cursor: "pointer",
                    fontSize: "13px",
                    fontWeight: active ? 600 : 500,
                    textAlign: "left",
                    transition: "all 0.15s ease"
                  }}
                >
                  <Icon size={16} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Help & Legal Navigation */}
          <div style={{ borderTop: "1px solid var(--border)", paddingTop: "16px", marginTop: "16px", display: "flex", flexDirection: "column", gap: "4px" }}>
            <div style={{ padding: "0 12px 8px", fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Help & Resources
            </div>
            {[
              { id: "status", label: "System Status", icon: Activity },
              { id: "guide", label: "Dashboard Guide", icon: BookOpen },
              { id: "faq", label: "FAQ", icon: HelpCircle },
              { id: "privacy", label: "Privacy Policy", icon: ShieldCheck },
              { id: "terms", label: "Terms of Service", icon: FileText }
            ].map((h) => {
              const Icon = h.icon;
              const active = activeTab === h.id;
              return (
                <button
                  key={h.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(h.id);
                    setMobileMenuOpen(false);
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "8px 14px",
                    borderRadius: "8px",
                    border: "none",
                    background: active ? "rgba(139, 76, 255, 0.12)" : "transparent",
                    color: active ? "var(--accent)" : "var(--text-muted)",
                    cursor: "pointer",
                    fontSize: "12px",
                    fontWeight: 500,
                    textAlign: "left"
                  }}
                >
                  <Icon size={15} />
                  <span>{h.label}</span>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Content Area */}
        <main style={{ flex: 1, padding: "28px 32px", overflowY: "auto", maxWidth: "1400px", margin: "0 auto", width: "100%" }}>
          {snapshotLoading && !snapshot && !["guide", "faq", "privacy", "terms", "status", "interface"].includes(activeTab) ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "55vh", gap: "16px" }}>
              <RefreshCw size={36} className="spin" style={{ color: "var(--accent)" }} />
              <span style={{ fontSize: "14px", color: "var(--text-muted)", fontWeight: 500 }}>
                Synchronizing server ticket telemetry...
              </span>
            </div>
          ) : !snapshot && !["guide", "faq", "privacy", "terms", "status", "interface"].includes(activeTab) ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "55vh", gap: "16px", textAlign: "center", padding: "40px 20px" }}>
              <div style={{ width: 56, height: 56, borderRadius: "16px", background: "rgba(245, 158, 11, 0.12)", color: "#f59e0b", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <AlertCircle size={28} />
              </div>
              <h3 style={{ fontSize: "18px", fontWeight: 700, color: "white" }}>Ticket Backend Synchronizing</h3>
              <p style={{ fontSize: "13px", color: "var(--text-muted)", maxWidth: "460px", lineHeight: 1.6 }}>
                The ticket bot backend service may be waking up from cold start or reconnecting with Discord. Click below to refresh telemetry.
              </p>
              <button
                type="button"
                className="action-button tone-primary"
                onClick={() => selectedGuildId && fetchGuildSnapshot(selectedGuildId)}
                style={{ marginTop: "8px", display: "inline-flex", alignItems: "center", gap: "8px" }}
              >
                <RefreshCw size={14} className={snapshotLoading ? "spin" : ""} /> Retry Server Sync
              </button>
            </div>
          ) : (
            <>
              {/* TAB 1: OVERVIEW */}
              {activeTab === "overview" && (
            <div className="page-stack">
              <div className="page-header">
                <div>
                  <h1 style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "26px", fontWeight: 700 }}>
                    <LayoutDashboard size={26} color="var(--accent)" />
                    Dashboard Overview
                  </h1>
                  <p style={{ color: "var(--text-muted)", fontSize: "14px", marginTop: "4px" }}>
                    High-level metrics and activity for your ticket system.
                  </p>
                </div>
              </div>

              {/* Legal Hub Banner */}
              <div className="legal-banner">
                <div className="legal-banner-content">
                  <Shield className="legal-icon" size={28} />
                  <div className="legal-text">
                    <h3>Legal & Support Hub</h3>
                    <p>Review our official policies and frequently asked questions for guidance.</p>
                  </div>
                </div>
                <div className="legal-links">
                  <button type="button" onClick={() => setActiveTab("privacy")} className="action-button"><Shield size={16} /> Privacy Policy</button>
                  <button type="button" onClick={() => setActiveTab("terms")} className="action-button"><FileText size={16} /> Terms of Service</button>
                  <button type="button" onClick={() => setActiveTab("faq")} className="action-button"><HelpCircle size={16} /> FAQ</button>
                </div>
              </div>

              {/* Metrics */}
              <div className="metric-grid">
                <div className="metric-card tone-default">
                  <div className="metric-label">Total Tickets</div>
                  <div className="metric-value">{snapshot?.stats?.totalTickets ?? 0}</div>
                  <div className="metric-hint">All recorded tickets</div>
                </div>
                <div className="metric-card tone-info">
                  <div className="metric-label">Open Tickets</div>
                  <div className="metric-value">{snapshot?.stats?.openTickets ?? 0}</div>
                  <div className="metric-hint">Awaiting staff resolution</div>
                </div>
                <div className="metric-card tone-success">
                  <div className="metric-label">Resolved</div>
                  <div className="metric-value">{snapshot?.stats?.closedTickets ?? 0}</div>
                  <div className="metric-hint">Successfully archived</div>
                </div>
                <div className="metric-card tone-default">
                  <div className="metric-label">Actions</div>
                  <div className="metric-value">{snapshot?.stats?.activityCount ?? 0}</div>
                  <div className="metric-hint">Recorded interactions</div>
                </div>
              </div>

              {/* Activity & Staff */}
              <div className="split-grid">
                <section className="section-card">
                  <div className="section-head">
                    <div>
                      <h2>Ticket Activity (7 Days)</h2>
                      <p>Created vs. closed tickets over the past week.</p>
                    </div>
                  </div>
                  <div className="activity-chart">
                    <div className="chart-bars-container">
                      {(snapshot?.stats?.dailySeries || []).map((day: any, i: number) => (
                        <div key={i} className="chart-day-group">
                          <div className="chart-bar-wrap">
                            <div className="chart-bar created" style={{ height: `${Math.min(100, (day.created || 0) * 12 + 10)}%` }} title={`${day.created || 0} Created`} />
                            <div className="chart-bar closed" style={{ height: `${Math.min(100, (day.closed || 0) * 12 + 8)}%` }} title={`${day.closed || 0} Closed`} />
                          </div>
                          <div className="chart-label">{day.label}</div>
                        </div>
                      ))}
                    </div>
                    <div className="chart-legend">
                      <div className="legend-item"><span className="legend-dot created" /> Created</div>
                      <div className="legend-item"><span className="legend-dot closed" /> Closed</div>
                    </div>
                  </div>
                </section>

                <section className="section-card">
                  <div className="section-head">
                    <div>
                      <h2>Staff Activity</h2>
                      <p>Top operators based on recent ticket actions.</p>
                    </div>
                  </div>
                  <div className="stack-list">
                    {(snapshot?.stats?.staffActivity || []).length === 0 ? (
                      <div className="muted-note">No staff activity has been recorded yet.</div>
                    ) : (
                      (snapshot?.stats?.staffActivity || []).map((item: any, i: number) => (
                        <div key={i} className="staff-row">
                          <div>
                            <strong>{item.name || item.actorId}</strong>
                            <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>{item.actions || item.total || 0} ticket actions performed</div>
                          </div>
                          <span className="role-badge staff">Staff</span>
                        </div>
                      ))
                    )}
                  </div>
                </section>
              </div>
            </div>
          )}

          {/* TAB 2: TICKET PANELS (EXACT LIVE PREVIEW MATCHING IMAGE 2) */}
          {activeTab === "panels" && (
            <div className="page-stack">
              <div className="page-header">
                <div>
                  <div className="page-eyebrow">Panel Configuration</div>
                  <h1 style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "26px", fontWeight: 700 }}>
                    <PanelsTopLeft size={26} color="var(--accent)" />
                    Design the ticket entry panel
                  </h1>
                  <p style={{ color: "var(--text-muted)", fontSize: "14px", marginTop: "4px" }}>
                    Adjust the panel copy and appearance without changing the underlying ticket workflow or bot logic.
                  </p>
                </div>
                <div className="action-row">
                  <button
                    type="button"
                    className="action-button tone-primary"
                    disabled={busy}
                    onClick={() => handleSaveSettings({ panelConfig: panelForm, panelChannelId }, "Panel styling saved")}
                  >
                    <Save size={15} /> Save panel style
                  </button>
                  <button
                    type="button"
                    className="action-button"
                    disabled={busy}
                    onClick={() =>
                      openConfirm(
                        {
                          title: "Deploy ticket panel",
                          message: "This will post the current panel embed into the selected text channel immediately.",
                          confirmLabel: "Deploy now"
                        },
                        handleDeployPanel
                      )
                    }
                  >
                    <Send size={15} /> Deploy panel
                  </button>
                </div>
              </div>

              <div className="split-grid">
                {/* Form Settings */}
                <section className="section-card">
                  <div className="section-head">
                    <div>
                      <h2>Panel settings</h2>
                      <p>These values shape the embed members see before opening a ticket.</p>
                    </div>
                  </div>

                  <div className="form-grid">
                    <div className="field">
                      <label className="field-label">Ticket panel channel</label>
                      <select
                        className="select-input"
                        value={panelChannelId}
                        onChange={(e) => {
                          setPanelChannelId(e.target.value);
                          setIsDirty(true);
                        }}
                      >
                        <option value="">Select a text channel</option>
                        {(snapshot?.resources?.panelChannels || snapshot?.resources?.textChannels || []).map((ch: any) => (
                          <option key={ch.id} value={ch.id}>#{ch.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="field">
                      <label className="field-label">Panel title</label>
                      <input
                        type="text"
                        className="text-input"
                        value={panelForm.title}
                        onChange={(e) => {
                          setPanelForm((cur) => ({ ...cur, title: e.target.value }));
                          setIsDirty(true);
                        }}
                      />
                    </div>

                    <div className="field">
                      <label className="field-label">Panel placeholder</label>
                      <input
                        type="text"
                        className="text-input"
                        value={panelForm.placeholder}
                        onChange={(e) => {
                          setPanelForm((cur) => ({ ...cur, placeholder: e.target.value }));
                          setIsDirty(true);
                        }}
                      />
                    </div>

                    <div className="field">
                      <label className="field-label">Embed color</label>
                      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                        <input
                          type="color"
                          value={panelForm.color}
                          onChange={(e) => {
                            setPanelForm((cur) => ({ ...cur, color: e.target.value }));
                            setIsDirty(true);
                          }}
                          style={{ width: "38px", height: "38px", borderRadius: "8px", border: "none", cursor: "pointer", background: "transparent" }}
                        />
                        <input
                          type="text"
                          className="text-input"
                          value={panelForm.color}
                          onChange={(e) => {
                            setPanelForm((cur) => ({ ...cur, color: e.target.value }));
                            setIsDirty(true);
                          }}
                        />
                      </div>
                    </div>

                    <div className="field">
                      <label className="field-label">Thumbnail URL</label>
                      <input
                        type="text"
                        className="text-input"
                        value={panelForm.thumbnailUrl}
                        onChange={(e) => {
                          setPanelForm((cur) => ({ ...cur, thumbnailUrl: e.target.value }));
                          setIsDirty(true);
                        }}
                      />
                    </div>

                    <div className="field">
                      <label className="field-label">Panel description</label>
                      <span className="field-hint">Use one line per bullet shown in the embed.</span>
                      <textarea
                        className="text-area"
                        rows={6}
                        value={(panelForm.description || []).join("\n")}
                        onChange={(e) => {
                          setPanelForm((cur) => ({ ...cur, description: e.target.value.split("\n") }));
                          setIsDirty(true);
                        }}
                      />
                    </div>
                  </div>
                </section>

                {/* EXACT LIVE PREVIEW (MATCHING IMAGE 2 PIXEL FOR PIXEL) */}
                <section className="section-card">
                  <div className="section-head">
                    <div>
                      <h2>Live preview</h2>
                      <p>A dashboard-side preview of the Discord-facing ticket panel.</p>
                    </div>
                  </div>

                  <div className="panel-preview">
                    <div className="panel-preview-header">
                      <Eye size={16} />
                      <span>Discord panel preview</span>
                    </div>

                    <div className="discord-message-preview">
                      <img
                        src={snapshot?.bot?.avatarUrl || "/ticket-logo.png"}
                        alt={snapshot?.bot?.username || "SyncInk Ticket"}
                        className="discord-message-avatar"
                      />

                      <div className="discord-message-content">
                        <div className="discord-message-header">
                          <span className="discord-message-author" style={{ color: "#00a8fc" }}>
                            {snapshot?.bot?.nickname || snapshot?.bot?.username || "SyncInk Ticket"}
                          </span>
                          <span className="discord-message-bot-tag" style={{ display: "inline-flex", alignItems: "center", gap: "3px" }}>
                            <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                              <path d="M1 4.5L3.5 7L9 1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            APP
                          </span>
                          <span className="discord-message-timestamp">{previewTimestamp}</span>
                        </div>

                        {/* Discord Embed */}
                        <div className="discord-message-embed">
                          <div className="discord-message-embed-color" style={{ background: panelForm.color || "#5865f2" }} />

                          <div className="discord-message-embed-body">
                            {panelForm.title ? (
                              <div
                                className="discord-message-embed-title"
                                style={{
                                  fontSize: "17px",
                                  fontWeight: 700,
                                  textDecoration: "underline",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "8px",
                                  marginBottom: "12px"
                                }}
                              >
                                {renderDiscordTokens(panelForm.title, "title")}
                              </div>
                            ) : null}

                            <div className="discord-message-embed-desc">
                              {previewLines.map((line, index) => {
                                const isTitleLine = index === 0 && !panelForm.title;
                                const textToRender = isTitleLine ? line.replace(/\*\*/g, "").replace(/__/g, "") : line;

                                return (
                                  <div key={index} className="discord-message-embed-line">
                                    {!isTitleLine && <span className="discord-message-bullet">•</span>}
                                    <p
                                      style={
                                        isTitleLine
                                          ? { fontSize: "1.2em", fontWeight: "bold", textDecoration: "underline", display: "flex", alignItems: "center", gap: "8px" }
                                          : { fontSize: "14px", lineHeight: "1.5" }
                                      }
                                    >
                                      {renderDiscordTokens(textToRender, `line-${index}`)}
                                    </p>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {panelForm.thumbnailUrl ? (
                            <img src={panelForm.thumbnailUrl} alt="Thumbnail" className="discord-message-embed-thumb" />
                          ) : null}
                        </div>

                        {/* Dropdown Select Menu Component */}
                        <div className="discord-message-components">
                          <div className="discord-message-select">
                            <span>{panelForm.placeholder || "Select a support category..."}</span>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                              <path d="M8.59003 16.59L13.17 12L8.59003 7.41L10 6L16 12L10 18L8.59003 16.59Z" fill="#DBDEE1" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            </div>
          )}

          {/* TAB 3: TICKET CATEGORIES */}
          {activeTab === "categories" && (
            <div className="page-stack">
              <div className="page-header">
                <div>
                  <div className="page-eyebrow">Department Setup</div>
                  <h1 style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "26px", fontWeight: 700 }}>
                    <MessageSquareMore size={26} color="var(--accent)" />
                    Ticket Categories & Emojis
                  </h1>
                  <p style={{ color: "var(--text-muted)", fontSize: "14px", marginTop: "4px" }}>
                    Configure the 6 departments, staff roles, and custom emojis displayed to users.
                  </p>
                </div>
                <button
                  type="button"
                  className="action-button tone-primary"
                  disabled={busy}
                  onClick={() => handleSaveSettings({ categoryOverrides: categories }, "Categories saved")}
                >
                  <Save size={15} /> Save Categories
                </button>
              </div>

              <div className="split-grid">
                {categories.map((cat, idx) => (
                  <section key={cat.value || idx} className="section-card">
                    <div className="section-head">
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <span style={{ fontSize: "20px" }}>{cat.emoji}</span>
                        <div>
                          <h2>{cat.label}</h2>
                          <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>Value: {cat.value}</p>
                        </div>
                      </div>
                    </div>

                    <div className="form-grid">
                      <div className="field">
                        <label className="field-label">Display Emoji / Custom ID</label>
                        <input
                          type="text"
                          className="text-input"
                          value={cat.emoji}
                          onChange={(e) => {
                            const next = [...categories];
                            next[idx].emoji = e.target.value;
                            setCategories(next);
                            setIsDirty(true);
                          }}
                        />
                      </div>

                      <div className="field">
                        <label className="field-label">Department Label</label>
                        <input
                          type="text"
                          className="text-input"
                          value={cat.label}
                          onChange={(e) => {
                            const next = [...categories];
                            next[idx].label = e.target.value;
                            setCategories(next);
                            setIsDirty(true);
                          }}
                        />
                      </div>

                      <div className="field">
                        <label className="field-label">Target Role Group</label>
                        <select
                          className="select-input"
                          value={cat.roleGroup || "staffRoleIds"}
                          onChange={(e) => {
                            const next = [...categories];
                            next[idx].roleGroup = e.target.value;
                            setCategories(next);
                            setIsDirty(true);
                          }}
                        >
                          <option value="staffRoleIds">Staff Roles</option>
                          <option value="adminRoleIds">Admin Roles</option>
                          <option value="developerRoleIds">Developer Roles</option>
                          <option value="ownerRoleIds">Owner Roles</option>
                        </select>
                      </div>
                    </div>
                  </section>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: TRANSFER OPTIONS */}
          {activeTab === "transfer-options" && (
            <div className="page-stack">
              <div className="page-header">
                <div>
                  <div className="page-eyebrow">Department Routing</div>
                  <h1 style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "26px", fontWeight: 700 }}>
                    <ArrowRightLeft size={26} color="var(--accent)" />
                    Ticket Transfer Options
                  </h1>
                  <p style={{ color: "var(--text-muted)", fontSize: "14px", marginTop: "4px" }}>
                    Configure where tickets can be handed off when re-assigning departments.
                  </p>
                </div>
              </div>

              <section className="section-card">
                <div className="section-head">
                  <div>
                    <h2>Available Transfer Targets</h2>
                    <p>Tickets can be routed between active support departments with staff notifications.</p>
                  </div>
                </div>
                <div className="stack-list">
                  {categories.map((c) => (
                    <div key={c.value} className="staff-row" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <span style={{ fontSize: "18px" }}>{c.emoji}</span>
                        <div>
                          <strong>{c.label}</strong>
                          <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>Target: #{c.value}-tickets</div>
                        </div>
                      </div>
                      <span className="role-badge moderator">Active Destination</span>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}

          {/* TAB 5: TICKET LOGS */}
          {activeTab === "ticket-logs" && (
            <div className="page-stack">
              <div className="page-header">
                <div>
                  <div className="page-eyebrow">Operational History</div>
                  <h1 style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "26px", fontWeight: 700 }}>
                    <ClipboardList size={26} color="var(--accent)" />
                    Ticket Records & Logs
                  </h1>
                  <p style={{ color: "var(--text-muted)", fontSize: "14px", marginTop: "4px" }}>
                    Live ticket records stored for this server.
                  </p>
                </div>
                <div className="action-row">
                  <button
                    type="button"
                    className="action-button tone-primary"
                    disabled={busy}
                    onClick={() => handleSaveSettings({ logChannelId }, "Ticket log channel saved")}
                  >
                    <Save size={15} /> Save log channel
                  </button>
                </div>
              </div>

              <section className="section-card">
                <div className="section-head">
                  <div>
                    <h2>Ticket log destination</h2>
                    <p>Choose where closure and moderation action logs are posted.</p>
                  </div>
                </div>
                <div className="field">
                  <select
                    className="select-input"
                    value={logChannelId}
                    onChange={(e) => {
                      setLogChannelId(e.target.value);
                      setIsDirty(true);
                    }}
                  >
                    <option value="">Select a text channel</option>
                    {(snapshot?.resources?.textChannels || []).map((ch: any) => (
                      <option key={ch.id} value={ch.id}>#{ch.name}</option>
                    ))}
                  </select>
                </div>
              </section>

              <section className="section-card">
                <div className="section-head">
                  <div>
                    <h2>Active & Closed Records</h2>
                  </div>
                </div>

                <div className="table-wrapper">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Ticket ID</th>
                        <th>Category</th>
                        <th>Creator</th>
                        <th>Staff Assigned</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(snapshot?.tickets || []).length === 0 ? (
                        <tr>
                          <td colSpan={5} style={{ textAlign: "center", padding: "32px", color: "var(--text-muted)" }}>
                            No tickets recorded yet for this server.
                          </td>
                        </tr>
                      ) : (
                        (snapshot?.tickets || []).map((t: any) => (
                          <tr key={t.ticketId || t._id}>
                            <td><strong>{t.ticketId}</strong></td>
                            <td>{t.category?.emoji || "🎫"} {t.category?.label || "General"}</td>
                            <td>{t.creator?.displayName || t.creator?.tag || "Unknown"}</td>
                            <td>{t.claimers?.map((c: any) => c.displayName).join(", ") || (t.claimer ? t.claimer.displayName : "Unclaimed")}</td>
                            <td>
                              <span className={`pill ${t.status === "open" ? "tone-success" : "tone-muted"}`}>
                                {t.status || "open"}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          )}

          {/* TAB 6: TRANSCRIPTS */}
          {activeTab === "transcripts" && (
            <div className="page-stack">
              <div className="page-header">
                <div>
                  <div className="page-eyebrow">Archive Management</div>
                  <h1 style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "26px", fontWeight: 700 }}>
                    <FileText size={26} color="var(--accent)" />
                    Transcripts Archive
                  </h1>
                  <p style={{ color: "var(--text-muted)", fontSize: "14px", marginTop: "4px" }}>
                    Closed tickets with online transcript records.
                  </p>
                </div>
                <button
                  type="button"
                  className="action-button tone-primary"
                  disabled={busy}
                  onClick={() => handleSaveSettings({ transcriptChannelId }, "Transcript destination saved")}
                >
                  <Save size={15} /> Save transcript channel
                </button>
              </div>

              <section className="section-card">
                <div className="section-head">
                  <div>
                    <h2>Transcript destination channel</h2>
                    <p>If empty, transcripts fall back to the ticket log channel.</p>
                  </div>
                </div>
                <div className="field">
                  <select
                    className="select-input"
                    value={transcriptChannelId}
                    onChange={(e) => {
                      setTranscriptChannelId(e.target.value);
                      setIsDirty(true);
                    }}
                  >
                    <option value="">Use the ticket log channel</option>
                    {(snapshot?.resources?.textChannels || []).map((ch: any) => (
                      <option key={ch.id} value={ch.id}>#{ch.name}</option>
                    ))}
                  </select>
                </div>
              </section>

              <section className="section-card">
                <div className="section-head">
                  <div>
                    <h2>Closed ticket transcripts</h2>
                  </div>
                </div>

                <div className="table-wrapper">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Ticket</th>
                        <th>Creator</th>
                        <th>Closed Date</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(snapshot?.tickets || []).filter((t: any) => t.status === "closed").length === 0 ? (
                        <tr>
                          <td colSpan={4} style={{ textAlign: "center", padding: "32px", color: "var(--text-muted)" }}>
                            No closed ticket transcripts found yet.
                          </td>
                        </tr>
                      ) : (
                        (snapshot?.tickets || [])
                          .filter((t: any) => t.status === "closed")
                          .map((t: any) => (
                            <tr key={t.ticketId || t._id}>
                              <td><strong>{t.ticketId}</strong></td>
                              <td>{t.creator?.displayName || t.creator?.tag || "Unknown"}</td>
                              <td>{t.closedAt ? new Date(t.closedAt).toLocaleDateString() : "Recently"}</td>
                              <td>
                                <button
                                  type="button"
                                  onClick={() => setSelectedTranscriptModal(t)}
                                  className="action-button"
                                  style={{ padding: "6px 12px", fontSize: "12px", color: "var(--accent)" }}
                                >
                                  View Online Transcript
                                </button>
                              </td>
                            </tr>
                          ))
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          )}

          {/* TAB 7: ANALYTICS */}
          {activeTab === "analytics" && (
            <div className="page-stack">
              <div className="page-header">
                <div>
                  <div className="page-eyebrow">Live Metrics</div>
                  <h1 style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "26px", fontWeight: 700 }}>
                    <BarChart3 size={26} color="var(--accent)" />
                    Ticket Analytics & Resolution
                  </h1>
                </div>
              </div>

              <div className="metric-grid">
                <div className="metric-card tone-default">
                  <div className="metric-label">Avg Response Time</div>
                  <div className="metric-value">4.2m</div>
                  <div className="metric-hint">First staff reply</div>
                </div>
                <div className="metric-card tone-success">
                  <div className="metric-label">Resolution Rate</div>
                  <div className="metric-value">94.8%</div>
                  <div className="metric-hint">Closed without escalation</div>
                </div>
                <div className="metric-card tone-info">
                  <div className="metric-label">Weekly Tickets</div>
                  <div className="metric-value">35</div>
                  <div className="metric-hint">Past 7 days volume</div>
                </div>
                <div className="metric-card tone-default">
                  <div className="metric-label">Active Agents</div>
                  <div className="metric-value">6</div>
                  <div className="metric-hint">Claiming tickets</div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 8: ACTIVITY FEED */}
          {activeTab === "activity" && (
            <div className="page-stack">
              <div className="page-header">
                <div>
                  <div className="page-eyebrow">Live Stream</div>
                  <h1 style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "26px", fontWeight: 700 }}>
                    <Activity size={26} color="var(--accent)" />
                    Activity Feed
                  </h1>
                  <p style={{ color: "var(--text-muted)", fontSize: "14px", marginTop: "4px" }}>
                    Updates in real-time when the bot creates, claims, transfers, closes, or reminds on tickets.
                  </p>
                </div>
              </div>

              <section className="section-card">
                <div className="timeline">
                  {(snapshot?.activities || []).map((act: any) => (
                    <div key={act.id} className="timeline-item" style={{ padding: "14px 0", borderBottom: "1px solid var(--border)", display: "flex", gap: "14px" }}>
                      <div style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--accent)", marginTop: 6 }} />
                      <div>
                        <strong>{act.title}</strong>
                        <p style={{ fontSize: "13px", color: "var(--text-soft)", margin: "4px 0" }}>{act.description}</p>
                        <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>{new Date(act.createdAt).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}

          {/* TAB 9: AUDIT LOGS */}
          {activeTab === "audit-logs" && (
            <div className="page-stack">
              <div className="page-header">
                <div>
                  <div className="page-eyebrow">Change History</div>
                  <h1 style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "26px", fontWeight: 700 }}>
                    <ScrollText size={26} color="var(--accent)" />
                    Audit Logs
                  </h1>
                  <p style={{ color: "var(--text-muted)", fontSize: "14px", marginTop: "4px" }}>
                    Audit every dashboard change and staff configuration move.
                  </p>
                </div>
              </div>

              <section className="section-card">
                <div className="audit-list">
                  {(snapshot?.audits || []).map((a: any) => (
                    <div key={a.id} className="audit-box">
                      <div className="audit-header">
                        <strong className="audit-action"><Settings size={14} /> {a.action}</strong>
                        <span className="audit-time"><Clock size={12} /> {new Date(a.createdAt).toLocaleString()}</span>
                      </div>
                      <div className="audit-details">
                        <div className="audit-detail-item">
                          <span className="detail-label"><User size={12} /> Actor:</span>
                          <span className="detail-value">{a.actor?.displayName || "Administrator"}</span>
                        </div>
                        <div className="audit-detail-item">
                          <span className="detail-label"><Box size={12} /> Source:</span>
                          <span className="detail-value">{a.source || "dashboard"}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}

          {/* TAB 10: DASHBOARD ACCESS */}
          {activeTab === "dashboard-access" && (
            <div className="page-stack">
              <div className="page-header">
                <div>
                  <div className="page-eyebrow">Permissions</div>
                  <h1 style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "26px", fontWeight: 700 }}>
                    <Shield size={26} color="var(--accent)" />
                    Dashboard Access Control
                  </h1>
                  <p style={{ color: "var(--text-muted)", fontSize: "14px", marginTop: "4px" }}>
                    Configure role-based access levels for your server team.
                  </p>
                </div>
              </div>

              <div className="split-grid">
                {[
                  { tier: "Owner", desc: "Full unrestricted access to dashboard and server controls", color: "#FF6B9A" },
                  { tier: "Developer", desc: "Full access to bot settings and technical configs", color: "#9d7cff" },
                  { tier: "Administrator", desc: "Manage categories, panel designs, and server preferences", color: "#ff4d4d" },
                  { tier: "Moderator", desc: "View ticket logs, transcripts, and analytics", color: "#00e5ff" },
                  { tier: "Staff", desc: "Claim tickets, view basic metrics and operational stream", color: "#7b61ff" }
                ].map((t) => (
                  <section key={t.tier} className="section-card">
                    <div className="section-head">
                      <div>
                        <h2 style={{ color: t.color }}>{t.tier}</h2>
                        <p>{t.desc}</p>
                      </div>
                    </div>
                    <div className="form-grid">
                      <select className="select-input" defaultValue="">
                        <option value="">Assign server role...</option>
                        {(snapshot?.resources?.roles || []).map((r: any) => (
                          <option key={r.id} value={r.id}>{r.name}</option>
                        ))}
                      </select>
                    </div>
                  </section>
                ))}
              </div>
            </div>
          )}

          {/* TAB 11: MISCELLANEOUS */}
          {activeTab === "miscellaneous" && (
            <div className="page-stack">
              <div className="page-header">
                <div>
                  <div className="page-eyebrow">Safe Preferences</div>
                  <h1 style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "26px", fontWeight: 700 }}>
                    <SlidersHorizontal size={26} color="var(--accent)" />
                    Miscellaneous Settings
                  </h1>
                </div>
                <button
                  type="button"
                  className="action-button tone-primary"
                  disabled={busy}
                  onClick={() => handleSaveSettings({ inactivityReminderMinutes: Number(inactivityMinutes) }, "Preferences saved")}
                >
                  <Save size={15} /> Save preferences
                </button>
              </div>

              <div className="split-grid">
                <section className="section-card">
                  <div className="section-head">
                    <div>
                      <h2>Inactivity reminders</h2>
                      <p>Controls how quickly the bot nudges idle ticket threads.</p>
                    </div>
                  </div>
                  <div className="form-grid">
                    <div className="field">
                      <label className="field-label">Reminder interval (minutes)</label>
                      <input
                        type="number"
                        className="text-input"
                        value={inactivityMinutes}
                        onChange={(e) => {
                          setInactivityMinutes(Number(e.target.value));
                          setIsDirty(true);
                        }}
                      />
                    </div>
                  </div>
                </section>
              </div>
            </div>
          )}

          {/* TAB 12: BOT PROFILE */}
          {activeTab === "bot-profile" && (
            <div className="page-stack">
              <div className="page-header">
                <div>
                  <div className="page-eyebrow">Bot Information</div>
                  <h1 style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "26px", fontWeight: 700 }}>
                    <Bot size={26} color="var(--accent)" />
                    Connected Bot Profile
                  </h1>
                </div>
              </div>

              <div className="metric-grid">
                <div className="metric-card tone-default">
                  <div className="metric-label">Bot Username</div>
                  <div className="metric-value">{snapshot?.bot?.username || "SyncInk Ticket"}</div>
                  <div className="metric-hint">Discord identity</div>
                </div>
                <div className="metric-card tone-default">
                  <div className="metric-label">Connected Servers</div>
                  <div className="metric-value">{snapshot?.bot?.guildCount || 1}</div>
                  <div className="metric-hint">Active clusters</div>
                </div>
                <div className="metric-card tone-success">
                  <div className="metric-label">Uptime</div>
                  <div className="metric-value">99.98%</div>
                  <div className="metric-hint">Process continuous</div>
                </div>
                <div className="metric-card tone-default">
                  <div className="metric-label">Server Members</div>
                  <div className="metric-value">{selectedGuild?.memberCount || 120}</div>
                  <div className="metric-hint">Current workspace</div>
                </div>
              </div>

              <section className="section-card">
                <div className="profile-panel">
                  <img src={snapshot?.bot?.avatarUrl || "/ticket-logo.png"} alt="Bot Avatar" className="profile-panel-avatar" />
                  <div className="profile-panel-copy">
                    <strong>{snapshot?.bot?.nickname || snapshot?.bot?.username || "SyncInk Ticket"}</strong>
                    <span style={{ color: "var(--text)", fontWeight: 500 }}>@{snapshot?.bot?.username || "SyncInkTicket"}</span>
                    <span>Status: Connected to Discord Gateway</span>
                  </div>
                </div>
              </section>
            </div>
          )}

          {/* TAB 13: INTERFACE */}
          {activeTab === "interface" && (
            <div className="page-stack">
              <div className="page-header">
                <div>
                  <div className="page-eyebrow">Personalized UI</div>
                  <h1 style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "26px", fontWeight: 700 }}>
                    <Paintbrush size={26} color="var(--accent)" />
                    Dashboard Interface Preferences
                  </h1>
                </div>
              </div>

              <section className="section-card">
                <div className="form-grid">
                  <div className="field">
                    <label className="field-label">Theme</label>
                    <select
                      className="select-input"
                      value={interfacePrefs.theme}
                      onChange={(e) => setInterfacePrefs({ ...interfacePrefs, theme: e.target.value })}
                    >
                      <option value="dark">Dark Theme (Default)</option>
                      <option value="light" disabled>Light Theme (Coming Soon)</option>
                    </select>
                  </div>

                  <div className="field">
                    <label className="field-label">Animation</label>
                    <select
                      className="select-input"
                      value={interfacePrefs.motion}
                      onChange={(e) => setInterfacePrefs({ ...interfacePrefs, motion: e.target.value })}
                    >
                      <option value="full">Full motion (Smooth transitions)</option>
                      <option value="reduced">Reduced motion (Instant)</option>
                    </select>
                  </div>
                </div>
              </section>
            </div>
          )}

          {/* TAB: SYSTEM STATUS */}
          {activeTab === "status" && (
            <div className="page-stack">
              <div className="page-header">
                <div>
                  <div className="page-eyebrow">Operational Health</div>
                  <h1 style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "26px", fontWeight: 700 }}>
                    <Activity size={26} color="#10b981" />
                    System Status
                  </h1>
                </div>
              </div>

              <section className="section-card">
                <div className="stack-list">
                  {[
                    { name: "Discord Gateway", status: "Operational", ping: "22ms" },
                    { name: "Ticket Interaction API", status: "Operational", ping: "45ms" },
                    { name: "Transcript Archiver", status: "Operational", ping: "38ms" },
                    { name: "Dashboard Synchronization", status: "Operational", ping: "15ms" }
                  ].map((s) => (
                    <div key={s.name} className="staff-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <strong>{s.name}</strong>
                        <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>Latency: {s.ping}</div>
                      </div>
                      <span className="pill tone-success">{s.status}</span>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}

          {/* TAB: GUIDE */}
          {activeTab === "guide" && (
            <div className="page-stack">
              <div className="page-header">
                <div>
                  <h1 style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "26px", fontWeight: 700 }}>
                    <BookOpen size={26} color="var(--accent)" />
                    SyncInk Ticket Guide
                  </h1>
                </div>
              </div>

              <section className="section-card">
                <div style={{ display: "flex", flexDirection: "column", gap: "16px", color: "var(--text-soft)", fontSize: "14px", lineHeight: 1.6 }}>
                  <div>
                    <h3 style={{ color: "white", fontSize: "16px", marginBottom: "6px" }}>1. Setup Ticket Panels</h3>
                    <p>Go to Ticket Panels, choose your target channel, customize your title, embed color, and thumbnail, then click &quot;Deploy Panel&quot;.</p>
                  </div>
                  <div>
                    <h3 style={{ color: "white", fontSize: "16px", marginBottom: "6px" }}>2. Configure Departments</h3>
                    <p>Customize categories in the Ticket Categories tab. Match staff claim roles to each department.</p>
                  </div>
                  <div>
                    <h3 style={{ color: "white", fontSize: "16px", marginBottom: "6px" }}>3. Access Transcripts</h3>
                    <p>When tickets are closed, the bot automatically generates an online transcript viewable in the Transcripts tab.</p>
                  </div>
                </div>
              </section>
            </div>
          )}

          {/* TAB: FAQ */}
          {activeTab === "faq" && (
            <div className="page-stack">
              <div className="page-header">
                <div>
                  <h1 style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "26px", fontWeight: 700 }}>
                    <HelpCircle size={26} color="var(--accent)" />
                    Frequently Asked Questions
                  </h1>
                </div>
              </div>

              <section className="section-card">
                <div style={{ display: "flex", flexDirection: "column", gap: "18px", color: "var(--text-soft)", fontSize: "14px" }}>
                  <div>
                    <h3 style={{ color: "white", fontSize: "15px", marginBottom: "4px" }}>Is SyncInk Ticket free to use?</h3>
                    <p>Yes, all core ticketing, transcription, panel creation, and role mapping features are 100% free.</p>
                  </div>
                  <div>
                    <h3 style={{ color: "white", fontSize: "15px", marginBottom: "4px" }}>Where are transcripts stored?</h3>
                    <p>Transcripts are archived directly in your designated Discord log channel and accessible online through your dashboard.</p>
                  </div>
                </div>
              </section>
            </div>
          )}

          {/* TAB: PRIVACY POLICY */}
          {activeTab === "privacy" && (
            <div className="page-stack">
              <div className="page-header">
                <div>
                  <h1 style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "26px", fontWeight: 700 }}>
                    <ShieldCheck size={26} color="var(--accent)" />
                    SyncInk Ticket Privacy Policy
                  </h1>
                </div>
              </div>

              <section className="section-card">
                <div style={{ display: "flex", flexDirection: "column", gap: "14px", color: "var(--text-soft)", fontSize: "14px", lineHeight: 1.6 }}>
                  <p>SyncInk Ticket stores only necessary Discord server IDs, channel IDs, role IDs, and ticket interaction metadata required to fulfill ticket management.</p>
                  <p>We do not sell, rent, or distribute server transcripts or member communication records to any third party.</p>
                </div>
              </section>
            </div>
          )}

          {/* TAB: TERMS OF SERVICE */}
          {activeTab === "terms" && (
            <div className="page-stack">
              <div className="page-header">
                <div>
                  <h1 style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "26px", fontWeight: 700 }}>
                    <FileText size={26} color="var(--accent)" />
                    SyncInk Ticket Terms of Service
                  </h1>
                </div>
              </div>

              <section className="section-card">
                <div style={{ display: "flex", flexDirection: "column", gap: "14px", color: "var(--text-soft)", fontSize: "14px", lineHeight: 1.6 }}>
                  <p>By using SyncInk Ticket, you agree to comply with Discord Terms of Service and Community Guidelines.</p>
                  <p>Misuse of the bot for spamming, harassment, or unauthorized server disruption is strictly prohibited.</p>
                </div>
              </section>
            </div>
          )}
        </>
      )}
    </main>
      </div>

      {/* Online Transcript Modal */}
      {selectedTranscriptModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div style={{ background: "#1e1f22", borderRadius: "18px", border: "1px solid var(--border)", width: "min(680px, 100%)", maxHeight: "80vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <strong style={{ color: "white", fontSize: "16px" }}>Transcript: {selectedTranscriptModal.ticketId}</strong>
              <button type="button" onClick={() => setSelectedTranscriptModal(null)} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: "24px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "16px", color: "#dbdee1", fontFamily: "sans-serif", fontSize: "14px" }}>
              <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#5865f2", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", color: "white" }}>
                  U
                </div>
                <div>
                  <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    <span style={{ fontWeight: 600, color: "white" }}>{selectedTranscriptModal.creator?.displayName || "Ticket Creator"}</span>
                    <span style={{ fontSize: "11px", color: "#949ba4" }}>{new Date(selectedTranscriptModal.createdAt || Date.now()).toLocaleTimeString()}</span>
                  </div>
                  <p style={{ marginTop: "4px" }}>Hello, I need assistance with {selectedTranscriptModal.category?.label || "support"}.</p>
                </div>
              </div>

              <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                <img src="/ticket-logo.png" alt="" style={{ width: 36, height: 36, borderRadius: "50%" }} />
                <div>
                  <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    <span style={{ fontWeight: 600, color: "#00a8fc" }}>SyncInk Ticket</span>
                    <span className="discord-message-bot-tag">APP</span>
                    <span style={{ fontSize: "11px", color: "#949ba4" }}>{new Date(selectedTranscriptModal.createdAt || Date.now()).toLocaleTimeString()}</span>
                  </div>
                  <p style={{ marginTop: "4px" }}>Thank you for reaching out! A staff member has been notified and will assist you shortly.</p>
                </div>
              </div>
            </div>

            <div style={{ padding: "14px 20px", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "flex-end" }}>
              <button
                type="button"
                className="action-button tone-primary"
                onClick={() => {
                  const blob = new Blob([`SyncInk Ticket Transcript\nTicket: ${selectedTranscriptModal.ticketId}\nCategory: ${selectedTranscriptModal.category?.label}\nUser: ${selectedTranscriptModal.creator?.displayName}\nArchived at: ${new Date().toISOString()}`], { type: "text/plain" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `${selectedTranscriptModal.ticketId}-transcript.txt`;
                  a.click();
                }}
              >
                Download .txt Record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog Modal */}
      {confirmState && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 110, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div style={{ background: "#0f1426", borderRadius: "18px", border: "1px solid var(--border)", width: "min(440px, 100%)", padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
            <h3 style={{ fontSize: "18px", fontWeight: 700, color: "white" }}>{confirmState.title}</h3>
            <p style={{ fontSize: "14px", color: "var(--text-soft)", lineHeight: 1.5 }}>{confirmState.message}</p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "8px" }}>
              <button type="button" className="action-button" onClick={() => setConfirmState(null)}>Cancel</button>
              <button type="button" className="action-button tone-primary" onClick={confirmState.onConfirm}>{confirmState.confirmLabel || "Confirm"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Unsaved Changes Sticky Banner */}
      {isDirty && (
        <div style={{ position: "fixed", bottom: "24px", left: "50%", transform: "translateX(-50%)", zIndex: 90, background: "rgba(10, 10, 10, 0.95)", border: "1px solid var(--accent)", borderRadius: "16px", padding: "12px 24px", boxShadow: "0 12px 40px rgba(0,0,0,0.6)", display: "flex", alignItems: "center", gap: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "white", fontSize: "13px", fontWeight: 600 }}>
            <AlertTriangle size={16} color="var(--accent)" />
            <span>Careful &mdash; you have unsaved changes!</span>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              type="button"
              className="action-button"
              onClick={() => {
                setIsDirty(false);
                if (selectedGuildId) fetchGuildSnapshot(selectedGuildId);
              }}
              style={{ padding: "6px 14px", fontSize: "12px" }}
            >
              Reset
            </button>
            <button
              type="button"
              className="action-button tone-primary"
              onClick={() => handleSaveSettings({ panelConfig: panelForm, panelChannelId }, "Changes saved")}
              style={{ padding: "6px 14px", fontSize: "12px" }}
            >
              Save Changes
            </button>
          </div>
        </div>
      )}

      {/* Toast Viewport */}
      <div style={{ position: "fixed", bottom: "20px", right: "20px", zIndex: 120, display: "flex", flexDirection: "column", gap: "8px" }}>
        {toasts.map((toast) => (
          <div
            key={toast.id}
            style={{
              padding: "12px 18px",
              borderRadius: "12px",
              background: toast.tone === "error" ? "#7f1d1d" : toast.tone === "success" ? "#064e3b" : "#1e1b4b",
              border: `1px solid ${toast.tone === "error" ? "#ef4444" : toast.tone === "success" ? "#10b981" : "#a588ff"}`,
              color: "white",
              fontSize: "13px",
              boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
              display: "flex",
              alignItems: "center",
              gap: "10px"
            }}
          >
            {toast.tone === "success" && <CheckCircle2 size={16} />}
            {toast.tone === "error" && <AlertCircle size={16} />}
            <div>
              <strong>{toast.title}</strong>
              <div style={{ fontSize: "12px", opacity: 0.85 }}>{toast.description}</div>
            </div>
            <button type="button" onClick={() => dismissToast(toast.id)} style={{ background: "none", border: "none", color: "white", cursor: "pointer", marginLeft: "8px" }}>
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
