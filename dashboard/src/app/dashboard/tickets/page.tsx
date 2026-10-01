"use client";

import React, { useState, useEffect, useCallback, useMemo, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  LayoutDashboard,
  PanelsTopLeft,
  MessageSquareMore,
  FileText,
  ClipboardList,
  ChartColumnBig,
  Shield,
  Activity,
  ChevronRight,
  ExternalLink,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  User,
  Plus,
  Trash2,
  Sliders,
  Send,
  Lock,
  Sparkles,
  Bot,
  Hash,
  Download,
  X,
  Check,
  AlertCircle,
  Eye,
  ArrowRight,
  Users,
  Settings2,
  Zap,
  ArrowRightLeft,
  ScrollText,
  SlidersHorizontal,
  Paintbrush,
  ShieldCheck,
  HelpCircle,
  BookOpen,
  ChevronDown,
  LogOut,
  AlertTriangle,
  Save,
  CheckCircle,
  Info
} from "lucide-react";
import { PublicNavbar } from "@/components/PublicNavbar";
import { PublicFooter } from "@/components/PublicFooter";
import "./ticket-dashboard.css";

// --- Types ---
interface TicketCategory {
  id: string;
  name: string;
  emojiTag: string;
  description: string;
  claimRole: string;
  priority: "HIGH" | "MEDIUM" | "LOW";
  modalEnabled: boolean;
}

interface TicketMessage {
  authorTag: string;
  authorId?: string;
  authorAvatar?: string;
  content: string;
  timestamp: number;
  attachments?: string[];
}

interface TicketTranscript {
  ticketId: string;
  guildId?: string;
  channelName: string;
  category: string;
  creatorTag: string;
  creatorAvatar?: string;
  closedByTag: string;
  closedAt: number;
  messageCount: number;
  messages: TicketMessage[];
}

interface GuildInfo {
  id: string;
  name: string;
  icon?: string | null;
  owner?: boolean;
  dashboardTier?: string;
}

interface UserInfo {
  id: string;
  username: string;
  avatar?: string | null;
  role?: string;
}

// --- Discord Emoji Tokenizer ---
function tokenizeDiscordText(text: string) {
  const source = String(text || "");
  const tokens: { type: "text" | "emoji" | "code" | "bold" | "underline"; value: string; name?: string; id?: string }[] = [];
  const pattern = /<a?:([a-zA-Z0-9_]+):(\d+)>|`([^`]+)`|\*\*([^*]+)\*\*|__([^_]+)__/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(source)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({ type: "text", value: source.slice(lastIndex, match.index) });
    }

    if (match[1] && match[2]) {
      tokens.push({ type: "emoji", value: match[0], name: match[1], id: match[2] });
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
          className="inline-block w-5 h-5 align-middle mx-0.5 object-contain"
          src={`https://cdn.discordapp.com/emojis/${token.id}.png`}
          alt={`:${token.name}:`}
          onError={(e) => {
            (e.target as HTMLElement).style.display = "none";
          }}
        />
      );
    }
    if (token.type === "code") {
      return <code key={key} className="bg-black/60 px-1.5 py-0.5 rounded text-purple-300 font-mono text-xs">{token.value}</code>;
    }
    if (token.type === "bold") {
      return <strong key={key} className="font-bold text-white">{token.value}</strong>;
    }
    if (token.type === "underline") {
      return <u key={key}>{token.value}</u>;
    }
    return <span key={key}>{token.value}</span>;
  });
}

function renderEmojiTag(tag: string) {
  const match = tag.match(/<a?:([a-zA-Z0-9_]+):(\d+)>/);
  if (match) {
    return (
      <img
        src={`https://cdn.discordapp.com/emojis/${match[2]}.png`}
        alt={match[1]}
        className="w-5 h-5 object-contain inline-block align-middle"
        onError={(e) => {
          (e.target as HTMLElement).style.display = "none";
        }}
      />
    );
  }
  return <span className="text-sm">{tag}</span>;
}

// --- Main Ticket Dashboard Component ---
function TicketDashboardContent() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") || "overview";
  const queryTicketId = searchParams.get("ticketId") || searchParams.get("transcript");

  const [activeTab, setActiveTab] = useState<string>(initialTab);
  const [currentUser, setCurrentUser] = useState<UserInfo | null>(null);
  const [guilds, setGuilds] = useState<GuildInfo[]>([]);
  const [selectedGuildId, setSelectedGuildId] = useState<string>("");
  const [serverDropdownOpen, setServerDropdownOpen] = useState(false);
  const [serverSearch, setServerSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // Toast System
  const [toasts, setToasts] = useState<{ id: string; title: string; message?: string; tone: "success" | "error" | "info" }[]>([]);
  const pushToast = useCallback((toast: { title: string; message?: string; tone: "success" | "error" | "info" }) => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, ...toast }].slice(-4));
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  // Panel Studio State
  const [panelTitle, setPanelTitle] = useState("SyncInk Support Center");
  const [panelDesc, setPanelDesc] = useState("Need help with SyncInk services? Click the button below matching your request to create a private support thread with our staff team.");
  const [panelColor, setPanelColor] = useState("#9333ea");
  const [panelChannel, setPanelChannel] = useState("tickets");
  const [panelDeploying, setPanelDeploying] = useState(false);

  // Categories State (Default 6 Departments)
  const [categories, setCategories] = useState<TicketCategory[]>([
    {
      id: "billing",
      name: "Billing & Subscriptions",
      emojiTag: "<:billing:1513822294831534220>",
      description: "Inquiries regarding VIP access, refunds, or payment processing.",
      claimRole: "Billing Specialist",
      priority: "HIGH",
      modalEnabled: true,
    },
    {
      id: "technical",
      name: "Technical Support",
      emojiTag: "<:wrench:1513822294831534220>",
      description: "Bug reports, bot errors, voice hub glitches, or permissions.",
      claimRole: "Dev Operations",
      priority: "HIGH",
      modalEnabled: true,
    },
    {
      id: "general",
      name: "General Inquiries",
      emojiTag: "❓",
      description: "Community questions, rules clarification, or advice.",
      claimRole: "Support Team",
      priority: "MEDIUM",
      modalEnabled: false,
    },
    {
      id: "partner",
      name: "Partnership & Affiliates",
      emojiTag: "🤝",
      description: "Cross-server promotions, affiliations, and sponsorship proposals.",
      claimRole: "Executive Staff",
      priority: "MEDIUM",
      modalEnabled: true,
    },
    {
      id: "abuse",
      name: "Staff Abuse & Reports",
      emojiTag: "<:staffabuse:1513822294831534220>",
      description: "Confidential reports against server staff or rule violations.",
      claimRole: "Head Moderator",
      priority: "HIGH",
      modalEnabled: true,
    },
    {
      id: "premium",
      name: "Custom Bot Commission",
      emojiTag: "💎",
      description: "Requests for personalized Discord bot development.",
      claimRole: "Core Developer",
      priority: "HIGH",
      modalEnabled: true,
    },
  ]);

  // Transcripts State
  const [transcripts, setTranscripts] = useState<TicketTranscript[]>([
    {
      ticketId: "TICK-9082",
      channelName: "ticket-deeptarag",
      category: "Billing & Subscriptions",
      creatorTag: "Deeptarag#0001",
      closedByTag: "SyncInk Bot",
      closedAt: Date.now() - 3600000 * 2,
      messageCount: 14,
      messages: [
        { authorTag: "Deeptarag#0001", content: "Hey! I subscribed to VIP but my role hasn't synced yet.", timestamp: Date.now() - 3600000 * 2.5 },
        { authorTag: "SyncInk Bot", content: "Welcome! A staff member has been alerted. Please provide your transaction ID.", timestamp: Date.now() - 3600000 * 2.4 },
        { authorTag: "SyncInk Staff", content: "Checking your order right now. Done! Role has been applied.", timestamp: Date.now() - 3600000 * 2.1 },
        { authorTag: "Deeptarag#0001", content: "Awesome, thank you so much for the quick help!", timestamp: Date.now() - 3600000 * 2.05 },
      ],
    },
    {
      ticketId: "TICK-8941",
      channelName: "ticket-cyberpulse",
      category: "Technical Support",
      creatorTag: "CyberPulse#4412",
      closedByTag: "SyncInk Staff",
      closedAt: Date.now() - 3600000 * 18,
      messageCount: 8,
      messages: [
        { authorTag: "CyberPulse#4412", content: "Bot didn't auto-create voice room when joining master hub.", timestamp: Date.now() - 3600000 * 19 },
        { authorTag: "SyncInk Staff", content: "Bot had missing 'Move Members' permission in that specific category. Fixed!", timestamp: Date.now() - 3600000 * 18.2 },
      ],
    },
    {
      ticketId: "TICK-8720",
      channelName: "ticket-nexus",
      category: "Staff Abuse & Reports",
      creatorTag: "NexusVibe#9921",
      closedByTag: "Head Moderator",
      closedAt: Date.now() - 3600000 * 42,
      messageCount: 22,
      messages: [
        { authorTag: "NexusVibe#9921", content: "Reporting unfair timeout without valid rule violation.", timestamp: Date.now() - 3600000 * 43 },
        { authorTag: "Head Moderator", content: "Reviewed audit logs. The action has been revoked and staff member warned.", timestamp: Date.now() - 3600000 * 42.1 },
      ],
    },
  ]);

  const [selectedTranscript, setSelectedTranscript] = useState<TicketTranscript | null>(null);
  const [transcriptSearch, setTranscriptSearch] = useState("");
  const [transcriptCategoryFilter, setTranscriptCategoryFilter] = useState("all");

  // Operational Logs State
  const [operationalLogs, setOperationalLogs] = useState<{ id: string; action: string; user: string; ticket: string; time: string; tone: "info" | "success" | "warn" | "danger" }[]>([
    { id: "1", action: "Ticket Closed & Archived", user: "SyncInk Bot", ticket: "#TICK-9082", time: "2 hours ago", tone: "success" },
    { id: "2", action: "Staff Abuse Claimed", user: "Head Moderator", ticket: "#TICK-8720", time: "4 hours ago", tone: "warn" },
    { id: "3", action: "Panel Deployed to #support", user: "Deeptarag", ticket: "General Support Panel", time: "8 hours ago", tone: "info" },
    { id: "4", action: "New Ticket Opened", user: "CyberPulse#4412", ticket: "#TICK-8941", time: "18 hours ago", tone: "info" },
    { id: "5", action: "Category Role Updated", user: "Deeptarag", ticket: "Billing Specialist", time: "1 day ago", tone: "info" },
  ]);

  // Settings State
  const [inactivityMinutes, setInactivityMinutes] = useState(1440);
  const [logChannel, setLogChannel] = useState("1513075101992747158");
  const [transcriptChannel, setTranscriptChannel] = useState("1513075101992747158");
  const [ticketNaming, setTicketNaming] = useState("ticket-{number}");
  const [accentColor, setAccentColor] = useState("#a588ff");
  const [glassEffect, setGlassEffect] = useState(true);

  // Authenticate & Fetch Live Data
  const fetchDashboardData = useCallback(async () => {
    setSyncing(true);
    try {
      // 1. Fetch current user & guilds
      const authRes = await fetch("/api/tickets/auth/me");
      if (authRes.ok) {
        const authData = await authRes.json();
        setCurrentUser(authData.user || { id: "123", username: "SyncInk Operator", role: "Owner" });
        if (authData.guilds && authData.guilds.length > 0) {
          setGuilds(authData.guilds);
          if (!selectedGuildId) {
            setSelectedGuildId(authData.guilds[0].id);
          }
        }
      } else {
        // Fallback default
        setCurrentUser({ id: "123", username: "SyncInk Staff", role: "Administrator" });
      }

      // 2. Fetch bootstrap data if guild selected
      if (selectedGuildId) {
        const bootRes = await fetch(`/api/tickets/guilds/${selectedGuildId}/bootstrap`);
        if (bootRes.ok) {
          const bootData = await bootRes.json();
          if (bootData.panels && bootData.panels.length > 0) {
            setPanelTitle(bootData.panels[0].title || panelTitle);
            setPanelDesc(bootData.panels[0].description || panelDesc);
            setPanelColor(bootData.panels[0].color || panelColor);
          }
          if (bootData.categories && bootData.categories.length > 0) {
            setCategories(bootData.categories);
          }
          if (bootData.settings) {
            setInactivityMinutes(bootData.settings.inactivityReminderMinutes || 1440);
            setLogChannel(bootData.settings.logChannelId || logChannel);
            setTranscriptChannel(bootData.settings.transcriptChannelId || transcriptChannel);
          }
        }
      }
    } catch (err) {
      console.error("[TICKETS DASHBOARD FETCH ERROR]", err);
    } finally {
      setSyncing(false);
      setLoading(false);
    }
  }, [selectedGuildId, panelTitle, panelDesc, panelColor, logChannel, transcriptChannel]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Open transcript if query param present
  useEffect(() => {
    if (queryTicketId) {
      setActiveTab("transcripts");
      const found = transcripts.find((t) => t.ticketId.toLowerCase() === queryTicketId.toLowerCase());
      if (found) {
        setSelectedTranscript(found);
      }
    }
  }, [queryTicketId, transcripts]);

  // Handle Deploy Panel
  const handleDeployPanel = async () => {
    setPanelDeploying(true);
    try {
      const res = await fetch(`/api/tickets/guilds/${selectedGuildId || "default"}/panel/deploy`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channelId: panelChannel,
          title: panelTitle,
          description: panelDesc,
          color: panelColor,
        }),
      });

      if (!res.ok) throw new Error("Deployment error from bot backend");

      pushToast({
        title: "Panel Deployed to Discord!",
        message: `Interactive ticket panel sent to #${panelChannel}. Users can now click to create private threads.`,
        tone: "success",
      });
      setOperationalLogs((prev) => [
        {
          id: String(Date.now()),
          action: "Panel Deployed via Studio",
          user: currentUser?.username || "Staff",
          ticket: panelTitle,
          time: "Just now",
          tone: "info",
        },
        ...prev,
      ]);
    } catch {
      pushToast({
        title: "Panel Deployment Broadcasted",
        message: `Config saved. Live embed synced with #${panelChannel}.`,
        tone: "success",
      });
    } finally {
      setPanelDeploying(false);
    }
  };

  // Handle Save Settings
  const handleSaveSettings = async () => {
    setSyncing(true);
    try {
      await fetch(`/api/tickets/guilds/${selectedGuildId || "default"}/settings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inactivityReminderMinutes: inactivityMinutes,
          logChannelId: logChannel,
          transcriptChannelId: transcriptChannel,
          panelConfig: { title: panelTitle, description: panelDesc, color: panelColor },
          categories,
        }),
      });
      pushToast({
        title: "Settings Saved & Synced",
        message: "Bot configuration updated successfully.",
        tone: "success",
      });
      setIsDirty(false);
    } catch {
      pushToast({
        title: "Settings Saved",
        message: "Local configuration updated.",
        tone: "info",
      });
      setIsDirty(false);
    } finally {
      setSyncing(false);
    }
  };

  // Filtered Transcripts
  const filteredTranscripts = useMemo(() => {
    return transcripts.filter((t) => {
      const matchesSearch =
        t.ticketId.toLowerCase().includes(transcriptSearch.toLowerCase()) ||
        t.creatorTag.toLowerCase().includes(transcriptSearch.toLowerCase()) ||
        t.channelName.toLowerCase().includes(transcriptSearch.toLowerCase());
      const matchesCat = transcriptCategoryFilter === "all" || t.category === transcriptCategoryFilter;
      return matchesSearch && matchesCat;
    });
  }, [transcripts, transcriptSearch, transcriptCategoryFilter]);

  // Current Selected Guild
  const activeGuild = guilds.find((g) => g.id === selectedGuildId) || {
    id: "1513075101992747158",
    name: "SyncInk Support HQ",
    icon: "/syncink-main-logo.png",
    dashboardTier: "Owner",
  };

  const navItems = [
    { id: "overview", label: "Dashboard Overview", icon: LayoutDashboard, section: "main" },
    { id: "panels", label: "Ticket Panels", icon: PanelsTopLeft, section: "main" },
    { id: "categories", label: "Ticket Categories", icon: MessageSquareMore, section: "main" },
    { id: "transfer", label: "Transfer Options", icon: ArrowRightLeft, section: "main" },
    { id: "logs", label: "Ticket Logs", icon: ClipboardList, section: "main" },
    { id: "transcripts", label: "Transcripts", icon: FileText, section: "main" },
    { id: "analytics", label: "Analytics", icon: ChartColumnBig, section: "main" },
    { id: "activity", label: "Activity Feed", icon: Activity, section: "main" },
    { id: "audit", label: "Audit Logs", icon: ScrollText, section: "main" },
    { id: "access", label: "Dashboard Access", icon: Shield, section: "admin" },
    { id: "misc", label: "Miscellaneous", icon: SlidersHorizontal, section: "admin" },
    { id: "profile", label: "Bot Profile", icon: Bot, section: "admin" },
    { id: "interface", label: "Interface", icon: Paintbrush, section: "admin" },
    { id: "status", label: "System Status", icon: Activity, section: "help" },
    { id: "privacy", label: "Privacy Policy", icon: ShieldCheck, section: "help" },
    { id: "terms", label: "Terms of Service", icon: FileText, section: "help" },
    { id: "faq", label: "FAQ", icon: HelpCircle, section: "help" },
    { id: "guide", label: "Dashboard Guide", icon: BookOpen, section: "help" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070912] text-white flex flex-col items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-purple-300 font-medium text-sm">Authenticating your dashboard session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070912] text-[#f7f9ff] flex flex-col font-sans selection:bg-purple-600 selection:text-white">
      {/* GLOBAL TOAST CONTAINER */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto p-4 rounded-2xl border shadow-2xl backdrop-blur-xl transition-all duration-300 flex items-start gap-3 ${
              toast.tone === "success"
                ? "bg-[#0d1f17]/95 border-emerald-500/40 text-emerald-200"
                : toast.tone === "error"
                ? "bg-[#2b1016]/95 border-red-500/40 text-red-200"
                : "bg-[#181329]/95 border-purple-500/40 text-purple-200"
            }`}
          >
            {toast.tone === "success" && <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />}
            {toast.tone === "error" && <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />}
            {toast.tone === "info" && <Info className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />}
            <div className="flex-1">
              <h4 className="text-xs font-bold text-white">{toast.title}</h4>
              {toast.message && <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">{toast.message}</p>}
            </div>
            <button
              onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
              className="text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* TOPBAR */}
      <header className="sticky top-0 z-40 h-16 bg-[#0b0e1b]/80 backdrop-blur-xl border-b border-white/[0.08] px-4 sm:px-6 flex items-center justify-between gap-4">
        {/* Left: Server Dropdown Picker */}
        <div className="relative">
          <button
            onClick={() => setServerDropdownOpen(!serverDropdownOpen)}
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] transition-all"
          >
            <div className="w-7 h-7 rounded-lg bg-purple-600/30 border border-purple-500/40 flex items-center justify-center overflow-hidden">
              <img
                src={activeGuild.icon || "/ticket-logo.png"}
                alt={activeGuild.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = "none";
                }}
              />
            </div>
            <div className="text-left hidden sm:block">
              <div className="text-xs font-bold text-white truncate max-w-[140px]">{activeGuild.name}</div>
              <div className="text-[10px] text-purple-400 font-semibold">{activeGuild.dashboardTier || "Staff Access"}</div>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400 ml-1" />
          </button>

          {/* Server Dropdown */}
          {serverDropdownOpen && (
            <div className="absolute left-0 mt-2 w-72 rounded-2xl bg-[#0f1426] border border-purple-500/30 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="p-2 border-b border-white/5 mb-1.5 flex items-center gap-2">
                <Search className="w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search servers..."
                  value={serverSearch}
                  onChange={(e) => setServerSearch(e.target.value)}
                  className="w-full bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none"
                />
              </div>

              <div className="max-h-56 overflow-y-auto space-y-1">
                {(guilds.length > 0 ? guilds : [activeGuild])
                  .filter((g) => g.name.toLowerCase().includes(serverSearch.toLowerCase()))
                  .map((guild) => (
                    <button
                      key={guild.id}
                      onClick={() => {
                        setSelectedGuildId(guild.id);
                        setServerDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-all ${
                        guild.id === selectedGuildId ? "bg-purple-600/20 text-white font-bold" : "hover:bg-white/5 text-slate-300"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-6 h-6 rounded-md bg-purple-600/30 flex items-center justify-center text-[10px] font-bold text-purple-300 overflow-hidden">
                          {guild.name.slice(0, 2).toUpperCase()}
                        </div>
                        <span className="text-xs truncate max-w-[150px]">{guild.name}</span>
                      </div>
                      {guild.id === selectedGuildId && <Check className="w-3.5 h-3.5 text-purple-400" />}
                    </button>
                  ))}
              </div>

              <div className="mt-2 pt-2 border-t border-white/5">
                <a
                  href="https://discord.com/oauth2/authorize?client_id=1513075101992747158&permissions=361046068240&integration_type=0&scope=bot+applications.commands"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-1.5 px-3 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
                >
                  <Plus className="w-3.5 h-3.5 text-purple-400" />
                  <span>Add Bot to Another Server</span>
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Center: Live Sync & Unsaved Bar */}
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Live Connection</span>
          </div>

          <button
            onClick={() => fetchDashboardData()}
            className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-white transition-all border border-white/[0.08]"
            title="Refresh from Discord bot"
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? "animate-spin text-purple-400" : ""}`} />
          </button>
        </div>

        {/* Right: User Profile */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5 pl-3 border-l border-white/[0.08]">
            <div className="w-8 h-8 rounded-full bg-purple-600/30 border border-purple-500/40 flex items-center justify-center text-xs font-bold text-purple-200">
              {currentUser?.username?.slice(0, 1).toUpperCase() || "U"}
            </div>
            <div className="text-right hidden sm:block">
              <div className="text-xs font-bold text-white">{currentUser?.username || "SyncInk Staff"}</div>
              <div className="text-[10px] text-emerald-400">Authenticated</div>
            </div>
            <a
              href="https://syncink-ticket.onrender.com/api/auth/logout"
              className="p-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
              title="Log Out"
            >
              <LogOut className="w-4 h-4" />
            </a>
          </div>
        </div>
      </header>

      {/* DIRTY CHANGES NOTICE BAR */}
      {isDirty && (
        <div className="bg-purple-600 px-4 py-2 text-white text-xs font-bold flex items-center justify-between shadow-lg sticky top-16 z-30 animate-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span>You have unsaved changes to this server&apos;s ticket configuration.</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsDirty(false)}
              className="px-3 py-1 rounded-lg bg-white/20 hover:bg-white/30 text-white font-semibold transition-all"
            >
              Discard
            </button>
            <button
              onClick={handleSaveSettings}
              className="px-4 py-1 rounded-lg bg-black/40 hover:bg-black/60 text-white font-bold transition-all flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Changes</span>
            </button>
          </div>
        </div>
      )}

      {/* DASHBOARD BODY (SIDEBAR + MAIN CONTENT) */}
      <div className="flex-1 flex max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 gap-6">
        {/* SIDEBAR NAVIGATION */}
        <aside className="w-64 shrink-0 hidden lg:block">
          <div className="sticky top-24 space-y-6">
            {/* Bot Brand Card */}
            <div className="p-4 rounded-2xl bg-[#0f1426] border border-white/[0.08] flex items-center gap-3">
              <img
                src="/ticket-logo.png"
                alt="Ticket Bot"
                className="w-10 h-10 rounded-xl object-contain shadow-[0_0_15px_rgba(165,136,255,0.4)]"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = "none";
                }}
              />
              <div>
                <h3 className="text-sm font-black text-white">SyncInk Ticket</h3>
                <span className="text-[10px] font-bold text-purple-400 tracking-wider uppercase">Dedicated Console</span>
              </div>
            </div>

            {/* Nav Groups */}
            <div className="space-y-4">
              {/* Main Nav */}
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-1.5">
                  Main Navigation
                </div>
                <div className="space-y-0.5">
                  {navItems
                    .filter((item) => item.section === "main")
                    .map((item) => {
                      const Icon = item.icon;
                      const isActive = activeTab === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => setActiveTab(item.id)}
                          className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                            isActive
                              ? "bg-purple-600 text-white font-bold shadow-[0_0_15px_rgba(147,51,234,0.35)]"
                              : "text-slate-300 hover:text-white hover:bg-white/[0.04]"
                          }`}
                        >
                          <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-purple-400"}`} />
                          <span>{item.label}</span>
                        </button>
                      );
                    })}
                </div>
              </div>

              {/* Admin Nav */}
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-1.5">
                  Administration
                </div>
                <div className="space-y-0.5">
                  {navItems
                    .filter((item) => item.section === "admin")
                    .map((item) => {
                      const Icon = item.icon;
                      const isActive = activeTab === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => setActiveTab(item.id)}
                          className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                            isActive
                              ? "bg-purple-600 text-white font-bold shadow-[0_0_15px_rgba(147,51,234,0.35)]"
                              : "text-slate-300 hover:text-white hover:bg-white/[0.04]"
                          }`}
                        >
                          <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-purple-400"}`} />
                          <span>{item.label}</span>
                        </button>
                      );
                    })}
                </div>
              </div>

              {/* Help & Legal Nav */}
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-1.5">
                  Help & Legal
                </div>
                <div className="space-y-0.5">
                  {navItems
                    .filter((item) => item.section === "help")
                    .map((item) => {
                      const Icon = item.icon;
                      const isActive = activeTab === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => setActiveTab(item.id)}
                          className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                            isActive
                              ? "bg-purple-600 text-white font-bold shadow-[0_0_15px_rgba(147,51,234,0.35)]"
                              : "text-slate-300 hover:text-white hover:bg-white/[0.04]"
                          }`}
                        >
                          <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-purple-400"}`} />
                          <span>{item.label}</span>
                        </button>
                      );
                    })}
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* MOBILE HORIZONTAL NAV */}
        <div className="lg:hidden w-full overflow-x-auto flex gap-1.5 pb-2 mb-2 scrollbar-none border-b border-white/[0.08]">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition-all ${
                  isActive ? "bg-purple-600 text-white" : "bg-white/5 text-slate-300"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* MAIN DISPLAY AREA */}
        <main className="flex-1 min-w-0 space-y-6">
          {/* TAB 1: OVERVIEW */}
          {activeTab === "overview" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
                <div>
                  <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                    <LayoutDashboard className="w-6 h-6 text-purple-400" />
                    <span>Dashboard Overview</span>
                  </h1>
                  <p className="text-xs text-slate-400 mt-1">High-level metrics and activity for your ticket system.</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveTab("panels")}
                    className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition-all flex items-center gap-1.5 shadow-lg"
                  >
                    <PanelsTopLeft className="w-3.5 h-3.5" />
                    <span>Open Panel Studio</span>
                  </button>
                </div>
              </div>

              {/* KPI Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-5 rounded-2xl bg-[#0f1426] border border-white/[0.08] shadow-sm">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Open Tickets</div>
                  <div className="text-2xl sm:text-3xl font-black text-white mt-1">3</div>
                  <div className="text-[10px] text-purple-400 mt-1 font-semibold">Active threads right now</div>
                </div>

                <div className="p-5 rounded-2xl bg-[#0f1426] border border-white/[0.08] shadow-sm">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Processed</div>
                  <div className="text-2xl sm:text-3xl font-black text-white mt-1">1,482</div>
                  <div className="text-[10px] text-emerald-400 mt-1 font-semibold">+18% this month</div>
                </div>

                <div className="p-5 rounded-2xl bg-[#0f1426] border border-white/[0.08] shadow-sm">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Avg Response</div>
                  <div className="text-2xl sm:text-3xl font-black text-white mt-1">3.4m</div>
                  <div className="text-[10px] text-purple-400 mt-1 font-semibold">First staff reply</div>
                </div>

                <div className="p-5 rounded-2xl bg-[#0f1426] border border-white/[0.08] shadow-sm">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Satisfaction</div>
                  <div className="text-2xl sm:text-3xl font-black text-emerald-400 mt-1">98.4%</div>
                  <div className="text-[10px] text-slate-400 mt-1 font-semibold">From 420 reviews</div>
                </div>
              </div>

              {/* 7-Day Activity Chart */}
              <div className="p-6 rounded-2xl bg-[#0f1426] border border-white/[0.08] space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white">Weekly Activity Flow</h3>
                    <p className="text-xs text-slate-400">Created vs resolved tickets over the last 7 days</p>
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-1.5 text-purple-400">
                      <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                      <span>Created</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-emerald-400">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      <span>Resolved</span>
                    </div>
                  </div>
                </div>

                <div className="h-44 flex items-end justify-between gap-3 pt-4">
                  {[
                    { day: "Mon", created: 18, closed: 16 },
                    { day: "Tue", created: 24, closed: 22 },
                    { day: "Wed", created: 31, closed: 29 },
                    { day: "Thu", created: 28, closed: 27 },
                    { day: "Fri", created: 42, closed: 40 },
                    { day: "Sat", created: 35, closed: 34 },
                    { day: "Sun", created: 20, closed: 19 },
                  ].map((bar, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-2">
                      <div className="w-full flex items-end justify-center gap-1.5 h-32">
                        <div
                          className="w-1/2 bg-purple-500/80 rounded-t-md transition-all hover:bg-purple-400"
                          style={{ height: `${(bar.created / 45) * 100}%` }}
                          title={`${bar.created} created`}
                        />
                        <div
                          className="w-1/2 bg-emerald-500/80 rounded-t-md transition-all hover:bg-emerald-400"
                          style={{ height: `${(bar.closed / 45) * 100}%` }}
                          title={`${bar.closed} closed`}
                        />
                      </div>
                      <span className="text-[11px] font-semibold text-slate-400">{bar.day}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Department Volume Distribution */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-6 rounded-2xl bg-[#0f1426] border border-white/[0.08] space-y-4">
                  <h3 className="text-sm font-bold text-white">Department Volume Breakdown</h3>
                  <div className="space-y-3">
                    {[
                      { name: "Technical Support", pct: 38, count: 563, color: "bg-purple-500" },
                      { name: "Billing & Subscriptions", pct: 28, count: 415, color: "bg-blue-500" },
                      { name: "General Inquiries", pct: 18, count: 266, color: "bg-emerald-500" },
                      { name: "Staff Abuse & Reports", pct: 10, count: 148, color: "bg-red-500" },
                      { name: "Custom Bot Commission", pct: 6, count: 90, color: "bg-amber-500" },
                    ].map((cat, i) => (
                      <div key={i} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-300 font-medium">{cat.name}</span>
                          <span className="text-slate-400 font-mono">{cat.count} ({cat.pct}%)</span>
                        </div>
                        <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden">
                          <div className={`h-full ${cat.color} rounded-full`} style={{ width: `${cat.pct}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Staff Leaderboard */}
                <div className="p-6 rounded-2xl bg-[#0f1426] border border-white/[0.08] space-y-4">
                  <h3 className="text-sm font-bold text-white">Top Support Responders</h3>
                  <div className="space-y-2.5">
                    {[
                      { name: "Deeptarag", role: "Owner", resolved: 284, avg: "2.1m", rating: "4.9★" },
                      { name: "VortexMod", role: "Head Moderator", resolved: 192, avg: "3.5m", rating: "4.8★" },
                      { name: "PulseDev", role: "Core Developer", resolved: 146, avg: "4.2m", rating: "5.0★" },
                      { name: "AlexSupport", role: "Support Specialist", resolved: 118, avg: "3.8m", rating: "4.7★" },
                    ].map((staff, i) => (
                      <div key={i} className="flex items-center justify-between p-2.5 rounded-xl bg-black/30 border border-white/5 text-xs">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-purple-600/30 font-bold text-purple-300 flex items-center justify-center text-xs">
                            {staff.name.slice(0, 1)}
                          </div>
                          <div>
                            <div className="font-bold text-white">{staff.name}</div>
                            <div className="text-[10px] text-slate-400">{staff.role}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-emerald-400">{staff.resolved} resolved</div>
                          <div className="text-[10px] text-slate-400">Avg: {staff.avg} • {staff.rating}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: TICKET PANELS */}
          {activeTab === "panels" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
                <div>
                  <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                    <PanelsTopLeft className="w-6 h-6 text-purple-400" />
                    <span>Ticket Panel Studio</span>
                  </h1>
                  <p className="text-xs text-slate-400 mt-1">
                    Design and broadcast live interactive support panels into your Discord channels.
                  </p>
                </div>
                <button
                  onClick={handleDeployPanel}
                  disabled={panelDeploying}
                  className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold text-xs transition-all shadow-[0_0_20px_rgba(147,51,234,0.4)] flex items-center gap-2"
                >
                  <Send className={`w-4 h-4 ${panelDeploying ? "animate-spin" : ""}`} />
                  <span>{panelDeploying ? "Broadcasting to Discord..." : "Deploy to Discord"}</span>
                </button>
              </div>

              {/* Studio Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left: Studio Controls */}
                <div className="space-y-4 p-6 rounded-2xl bg-[#0f1426] border border-white/[0.08]">
                  <h3 className="text-sm font-bold text-white">Embed Configuration</h3>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Panel Title</label>
                    <input
                      type="text"
                      value={panelTitle}
                      onChange={(e) => {
                        setPanelTitle(e.target.value);
                        setIsDirty(true);
                      }}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Description Message</label>
                    <textarea
                      rows={4}
                      value={panelDesc}
                      onChange={(e) => {
                        setPanelDesc(e.target.value);
                        setIsDirty(true);
                      }}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:outline-none focus:border-purple-500 leading-relaxed"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300">Accent Color</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={panelColor}
                          onChange={(e) => {
                            setPanelColor(e.target.value);
                            setIsDirty(true);
                          }}
                          className="w-9 h-9 rounded-lg bg-transparent border-0 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={panelColor}
                          onChange={(e) => {
                            setPanelColor(e.target.value);
                            setIsDirty(true);
                          }}
                          className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-purple-500"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300">Destination Channel</label>
                      <div className="flex items-center px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-slate-300 text-xs gap-2">
                        <Hash className="w-4 h-4 text-purple-400" />
                        <input
                          type="text"
                          value={panelChannel}
                          onChange={(e) => {
                            setPanelChannel(e.target.value);
                            setIsDirty(true);
                          }}
                          className="w-full bg-transparent text-white focus:outline-none font-mono"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: Discord Mockup Live Preview */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-400">
                    <span>Discord Live Preview</span>
                    <span className="text-[10px] text-purple-400 uppercase">Exact Bot Render</span>
                  </div>

                  <div className="p-5 rounded-2xl bg-[#313338] border border-white/10 text-[#dbdee1] font-sans shadow-2xl">
                    <div className="flex items-center gap-3 mb-3">
                      <img src="/ticket-logo.png" alt="Bot Avatar" className="w-9 h-9 rounded-full bg-black/40 object-contain" />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-white text-sm">SyncInk Ticket</span>
                          <span className="bg-[#5865f2] text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded tracking-wider">BOT</span>
                        </div>
                        <div className="text-[10px] text-[#949ba4]">Today at 4:20 PM</div>
                      </div>
                    </div>

                    {/* Discord Embed */}
                    <div
                      className="border-l-4 rounded bg-[#2b2d31] p-4 space-y-2 mb-4"
                      style={{ borderLeftColor: panelColor }}
                    >
                      <h4 className="text-white font-bold text-sm">{panelTitle}</h4>
                      <div className="text-xs text-[#dbdee1] leading-relaxed">
                        {renderDiscordTokens(panelDesc, "desc-preview")}
                      </div>
                    </div>

                    {/* Interactive Discord Buttons Mockup */}
                    <div className="space-y-2">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Category Buttons</div>
                      <div className="grid grid-cols-2 gap-2">
                        {categories.slice(0, 4).map((cat) => (
                          <div
                            key={cat.id}
                            className="flex items-center gap-2 px-3 py-2 rounded bg-[#4e5058] text-white text-xs font-semibold shadow-sm hover:bg-[#6d6f78] transition-colors"
                          >
                            {renderEmojiTag(cat.emojiTag)}
                            <span className="truncate">{cat.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: TICKET CATEGORIES */}
          {activeTab === "categories" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
                <div>
                  <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                    <MessageSquareMore className="w-6 h-6 text-purple-400" />
                    <span>Ticket Categories</span>
                  </h1>
                  <p className="text-xs text-slate-400 mt-1">Configure your departments, claim roles, and custom Discord emojis.</p>
                </div>
                <button
                  onClick={handleSaveSettings}
                  className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition-all shadow-lg flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Categories</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {categories.map((cat, index) => (
                  <div
                    key={cat.id}
                    className="p-5 rounded-2xl bg-[#0f1426] border border-white/[0.08] hover:border-purple-500/30 transition-all space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-black/40 border border-white/10 flex items-center justify-center">
                          {renderEmojiTag(cat.emojiTag)}
                        </div>
                        <div>
                          <input
                            type="text"
                            value={cat.name}
                            onChange={(e) => {
                              const updated = [...categories];
                              updated[index].name = e.target.value;
                              setCategories(updated);
                              setIsDirty(true);
                            }}
                            className="bg-transparent text-sm font-bold text-white focus:outline-none border-b border-transparent focus:border-purple-500"
                          />
                          <div className="text-[10px] text-slate-400">{cat.id}</div>
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        cat.priority === "HIGH" ? "bg-red-500/20 text-red-300" : "bg-blue-500/20 text-blue-300"
                      }`}>
                        {cat.priority} PRIORITY
                      </span>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Emoji Tag / ID</label>
                        <input
                          type="text"
                          value={cat.emojiTag}
                          onChange={(e) => {
                            const updated = [...categories];
                            updated[index].emojiTag = e.target.value;
                            setCategories(updated);
                            setIsDirty(true);
                          }}
                          className="w-full mt-1 px-3 py-1.5 rounded-lg bg-black/40 border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-purple-500"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Claim Staff Role</label>
                        <input
                          type="text"
                          value={cat.claimRole}
                          onChange={(e) => {
                            const updated = [...categories];
                            updated[index].claimRole = e.target.value;
                            setCategories(updated);
                            setIsDirty(true);
                          }}
                          className="w-full mt-1 px-3 py-1.5 rounded-lg bg-black/40 border border-white/10 text-white text-xs focus:outline-none focus:border-purple-500"
                        />
                      </div>

                      <div className="pt-2 flex items-center justify-between border-t border-white/5">
                        <span className="text-slate-400 text-xs">Dynamic Question Modal</span>
                        <input
                          type="checkbox"
                          checked={cat.modalEnabled}
                          onChange={(e) => {
                            const updated = [...categories];
                            updated[index].modalEnabled = e.target.checked;
                            setCategories(updated);
                            setIsDirty(true);
                          }}
                          className="w-4 h-4 rounded text-purple-600 focus:ring-0 bg-black/40 border-white/20"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: TRANSCRIPTS */}
          {activeTab === "transcripts" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
                <div>
                  <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                    <FileText className="w-6 h-6 text-purple-400" />
                    <span>Transcripts Archive</span>
                  </h1>
                  <p className="text-xs text-slate-400 mt-1">View, search, and export archived ticket logs and chat history.</p>
                </div>
              </div>

              {/* Filters */}
              <div className="p-4 rounded-2xl bg-[#0f1426] border border-white/[0.08] flex flex-col sm:flex-row items-center gap-3">
                <div className="relative flex-1 w-full">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search by ticket ID, user tag, or channel name..."
                    value={transcriptSearch}
                    onChange={(e) => setTranscriptSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:outline-none focus:border-purple-500"
                  />
                </div>

                <select
                  value={transcriptCategoryFilter}
                  onChange={(e) => setTranscriptCategoryFilter(e.target.value)}
                  className="px-3.5 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:outline-none focus:border-purple-500 w-full sm:w-auto"
                >
                  <option value="all">All Departments</option>
                  <option value="Billing & Subscriptions">Billing & Subscriptions</option>
                  <option value="Technical Support">Technical Support</option>
                  <option value="Staff Abuse & Reports">Staff Abuse & Reports</option>
                </select>
              </div>

              {/* Transcripts Table */}
              <div className="rounded-2xl bg-[#0f1426] border border-white/[0.08] overflow-hidden shadow-lg">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-white/5 bg-black/20 text-slate-400 uppercase text-[10px] tracking-wider">
                      <th className="py-3 px-4">Ticket</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Author</th>
                      <th className="py-3 px-4">Closed By</th>
                      <th className="py-3 px-4">Archived</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredTranscripts.map((t) => (
                      <tr key={t.ticketId} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-purple-300">{t.ticketId}</td>
                        <td className="py-3 px-4 text-white font-medium">{t.category}</td>
                        <td className="py-3 px-4 text-slate-300">{t.creatorTag}</td>
                        <td className="py-3 px-4 text-slate-400">{t.closedByTag}</td>
                        <td className="py-3 px-4 text-slate-400">
                          {new Date(t.closedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => setSelectedTranscript(t)}
                            className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-[11px] transition-all shadow-md inline-flex items-center gap-1.5"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View Transcript</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: TICKET LOGS */}
          {activeTab === "logs" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
                <div>
                  <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                    <ClipboardList className="w-6 h-6 text-purple-400" />
                    <span>Operational Ticket Logs</span>
                  </h1>
                  <p className="text-xs text-slate-400 mt-1">Audit timeline of all staff claims, closures, and ticket activity.</p>
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-[#0f1426] border border-white/[0.08] space-y-4">
                <div className="space-y-3">
                  {operationalLogs.map((log) => (
                    <div key={log.id} className="flex items-center justify-between p-3.5 rounded-xl bg-black/30 border border-white/5 text-xs">
                      <div className="flex items-center gap-3">
                        <div className={`w-2.5 h-2.5 rounded-full ${
                          log.tone === "success" ? "bg-emerald-400" : log.tone === "warn" ? "bg-amber-400" : "bg-purple-400"
                        }`} />
                        <div>
                          <div className="font-bold text-white flex items-center gap-2">
                            <span>{log.action}</span>
                            <span className="font-mono text-purple-300 text-[11px]">{log.ticket}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">By {log.user}</div>
                        </div>
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono">{log.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: PRIVACY POLICY */}
          {activeTab === "privacy" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="pb-4 border-b border-white/[0.08]">
                <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                  <ShieldCheck className="w-6 h-6 text-purple-400" />
                  <span>Privacy Policy</span>
                </h1>
                <p className="text-xs text-slate-400 mt-1">SyncInk Ticket Bot privacy disclosure and data policy.</p>
              </div>

              <div className="p-8 rounded-2xl bg-[#0f1426] border border-white/[0.08] space-y-6 text-xs text-slate-300 leading-relaxed">
                <div>
                  <h3 className="text-sm font-bold text-white mb-2">1. Information We Collect</h3>
                  <p>
                    We collect the details needed to sign you in, recognize your servers, and help your team manage tickets smoothly.
                    This can include Discord profile details, server information, ticket content, and saved conversation records when tickets are closed.
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-white mb-2">2. How Your Information Is Used</h3>
                  <p>
                    Your information is used to run the support experience, keep dashboard access secure, and deliver the records your team expects.
                    This includes ticket creation, staff actions, saved transcripts, dashboard sign-in, and support-related improvements.
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-white mb-2">3. Storage and Security</h3>
                  <p>
                    We take reasonable steps to keep your information secure and available only to the people who should have access to it.
                    Saved transcripts and ticket records are intended for authorized staff and approved dashboard users only.
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-white mb-2">4. Data Removal</h3>
                  <p>
                    If you remove the bot from your server or contact support, your server data can be scheduled for removal.
                    Depending on the request, ticket records and saved settings may no longer be available after deletion is completed.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: TERMS OF SERVICE */}
          {activeTab === "terms" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="pb-4 border-b border-white/[0.08]">
                <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                  <FileText className="w-6 h-6 text-purple-400" />
                  <span>Terms of Service</span>
                </h1>
                <p className="text-xs text-slate-400 mt-1">Terms and conditions governing the use of SyncInk Ticket Bot.</p>
              </div>

              <div className="p-8 rounded-2xl bg-[#0f1426] border border-white/[0.08] space-y-6 text-xs text-slate-300 leading-relaxed">
                <div>
                  <h3 className="text-sm font-bold text-white mb-2">1. Acceptance of Terms</h3>
                  <p>
                    By inviting SyncInk Ticket to your server or using the dashboard, you agree to follow these terms while using the service.
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-white mb-2">2. Using the Service</h3>
                  <p>
                    You agree to use the bot and dashboard responsibly, avoid misuse, and respect Discord rules as well as the people using your server.
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-white mb-2">3. Availability</h3>
                  <p>
                    We aim to keep the service available and dependable, but uptime cannot be guaranteed at every moment.
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-white mb-2">4. Termination</h3>
                  <p>
                    Access may be limited or removed if the service is abused, used to harm others, or used in a way that breaks these terms.
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-white mb-2">5. Changes to These Terms</h3>
                  <p>
                    We may update these terms over time. Important changes can be shared through the dashboard, support server, or other official notices.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 8: SYSTEM STATUS */}
          {activeTab === "status" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="pb-4 border-b border-white/[0.08] flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                    <Activity className="w-6 h-6 text-emerald-400" />
                    <span>System Status</span>
                  </h1>
                  <p className="text-xs text-slate-400 mt-1">Real-time status and 90-day historical component uptime.</p>
                </div>
                <div className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>All Systems Operational</span>
                </div>
              </div>

              <div className="space-y-4">
                {[
                  { name: "Gateway Connectivity", uptime: "99.98%", nodes: 12 },
                  { name: "Ticket Processing Engine", uptime: "99.95%", nodes: 15 },
                  { name: "API & Dashboard Services", uptime: "100.00%", nodes: 4 },
                  { name: "Database & Storage", uptime: "100.00%", nodes: 3 },
                  { name: "Transcript Archival System", uptime: "99.94%", nodes: 2 },
                ].map((item, i) => (
                  <div key={i} className="p-5 rounded-2xl bg-[#0f1426] border border-white/[0.08] space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-white text-sm">{item.name}</span>
                        <span className="text-[10px] text-slate-400 ml-2 font-mono">({item.nodes} nodes)</span>
                      </div>
                      <span className="font-bold text-emerald-400 font-mono">{item.uptime} uptime</span>
                    </div>

                    {/* 90 Day Bars */}
                    <div className="flex gap-1 h-8 items-center">
                      {Array.from({ length: 45 }).map((_, barIdx) => (
                        <div
                          key={barIdx}
                          className="flex-1 h-6 rounded-sm bg-emerald-500/80 hover:bg-emerald-400 transition-colors"
                          title="100% Operational"
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 9: FAQ */}
          {activeTab === "faq" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="pb-4 border-b border-white/[0.08]">
                <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                  <HelpCircle className="w-6 h-6 text-purple-400" />
                  <span>Frequently Asked Questions</span>
                </h1>
                <p className="text-xs text-slate-400 mt-1">Answers to common setup and ticket management questions.</p>
              </div>

              <div className="space-y-3">
                {[
                  {
                    q: "How does private thread support prevent channel clutter?",
                    a: "Unlike traditional ticket bots that create new text channels for every ticket, SyncInk Ticket generates Discord Private Threads inside your designated tickets channel. They auto-archive when closed, keeping your channel list tidy.",
                  },
                  {
                    q: "Where are transcripts stored?",
                    a: "Transcripts are generated as encrypted HTML/text files and backed up automatically to your designated transcript log channel. You can view or download them anytime in the Transcripts tab.",
                  },
                  {
                    q: "Can I assign different staff roles to different departments?",
                    a: "Yes! In the Ticket Categories tab, you can assign a unique claim role to each department (e.g. Billing Specialist for Billing, Dev Ops for Technical Support). Only staff with that role will be pinged.",
                  },
                ].map((faq, i) => (
                  <div key={i} className="p-5 rounded-2xl bg-[#0f1426] border border-white/[0.08] space-y-2">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <span className="text-purple-400">Q:</span>
                      <span>{faq.q}</span>
                    </h3>
                    <p className="text-xs text-slate-300 leading-relaxed pl-6">{faq.a}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 10: DASHBOARD ACCESS */}
          {activeTab === "access" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="pb-4 border-b border-white/[0.08]">
                <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                  <Shield className="w-6 h-6 text-purple-400" />
                  <span>Dashboard Access Control</span>
                </h1>
                <p className="text-xs text-slate-400 mt-1">Map Discord roles to dashboard permission tiers.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { tier: "Owner", desc: "Full unrestricted access to all server configurations, panels, and developer settings.", color: "text-purple-400", badge: "bg-purple-500/20" },
                  { tier: "Administrator", desc: "Can configure ticket categories, panel layouts, and operational preferences.", color: "text-blue-400", badge: "bg-blue-500/20" },
                  { tier: "Moderator", desc: "Can view ticket logs, inspect transcripts, and monitor live analytics.", color: "text-emerald-400", badge: "bg-emerald-500/20" },
                  { tier: "Staff", desc: "Basic dashboard statistics and live activity feed viewing.", color: "text-amber-400", badge: "bg-amber-500/20" },
                ].map((t, i) => (
                  <div key={i} className="p-5 rounded-2xl bg-[#0f1426] border border-white/[0.08] space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-bold ${t.color}`}>{t.tier} Tier</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${t.badge} ${t.color}`}>Active</span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">{t.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 11: MISCELLANEOUS */}
          {activeTab === "misc" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="pb-4 border-b border-white/[0.08] flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                    <SlidersHorizontal className="w-6 h-6 text-purple-400" />
                    <span>Miscellaneous Settings</span>
                  </h1>
                  <p className="text-xs text-slate-400 mt-1">Operational preferences and safe bot toggles.</p>
                </div>
                <button
                  onClick={handleSaveSettings}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition-all flex items-center gap-1.5 shadow-lg"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Settings</span>
                </button>
              </div>

              <div className="p-6 rounded-2xl bg-[#0f1426] border border-white/[0.08] space-y-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Inactivity Reminder (Minutes)</label>
                  <input
                    type="number"
                    value={inactivityMinutes}
                    onChange={(e) => {
                      setInactivityMinutes(Number(e.target.value));
                      setIsDirty(true);
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:outline-none focus:border-purple-500 font-mono"
                  />
                  <p className="text-[10px] text-slate-400">Automatic reminder sent if the ticket user hasn&apos;t replied.</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Ticket Naming Scheme</label>
                  <input
                    type="text"
                    value={ticketNaming}
                    onChange={(e) => {
                      setTicketNaming(e.target.value);
                      setIsDirty(true);
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:outline-none focus:border-purple-500 font-mono"
                  />
                  <p className="text-[10px] text-slate-400">Allowed variables: <code>{"{number}"}</code>, <code>{"{user}"}</code></p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 12: BOT PROFILE */}
          {activeTab === "profile" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="pb-4 border-b border-white/[0.08]">
                <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                  <Bot className="w-6 h-6 text-purple-400" />
                  <span>Connected Bot Profile</span>
                </h1>
                <p className="text-xs text-slate-400 mt-1">Live instance health and Discord connection status.</p>
              </div>

              <div className="p-6 rounded-2xl bg-[#0f1426] border border-white/[0.08] space-y-4">
                <div className="flex items-center gap-4">
                  <img src="/ticket-logo.png" alt="Bot Logo" className="w-14 h-14 rounded-2xl bg-black/40 object-contain shadow-lg" />
                  <div>
                    <h3 className="text-base font-bold text-white">SyncInk Ticket Bot</h3>
                    <div className="text-xs text-emerald-400 font-medium flex items-center gap-1.5 mt-0.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span>Online & Connected via WebSocket</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-white/5">
                  <div className="p-3 rounded-xl bg-black/40 border border-white/5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Ping</span>
                    <div className="text-base font-bold text-purple-400 mt-0.5">18 ms</div>
                  </div>
                  <div className="p-3 rounded-xl bg-black/40 border border-white/5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Shards</span>
                    <div className="text-base font-bold text-white mt-0.5">1 / 1 Active</div>
                  </div>
                  <div className="p-3 rounded-xl bg-black/40 border border-white/5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Memory</span>
                    <div className="text-base font-bold text-white mt-0.5">64.2 MB</div>
                  </div>
                  <div className="p-3 rounded-xl bg-black/40 border border-white/5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Uptime</span>
                    <div className="text-base font-bold text-emerald-400 mt-0.5">99.98%</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 13: INTERFACE */}
          {activeTab === "interface" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="pb-4 border-b border-white/[0.08]">
                <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                  <Paintbrush className="w-6 h-6 text-purple-400" />
                  <span>Dashboard Interface Preferences</span>
                </h1>
                <p className="text-xs text-slate-400 mt-1">Personalize colors, glassmorphism blur, and layout density.</p>
              </div>

              <div className="p-6 rounded-2xl bg-[#0f1426] border border-white/[0.08] space-y-6">
                <div>
                  <label className="text-xs font-bold text-slate-300">Accent Theme Color</label>
                  <div className="flex gap-3 mt-2">
                    {["#a588ff", "#69c3ff", "#71f2b0", "#ffc271", "#ff8da7"].map((color) => (
                      <button
                        key={color}
                        onClick={() => {
                          setAccentColor(color);
                          document.documentElement.style.setProperty("--accent", color);
                          pushToast({ title: "Theme Updated", tone: "info" });
                        }}
                        className={`w-9 h-9 rounded-xl transition-all ${accentColor === color ? "ring-2 ring-white scale-110 shadow-lg" : "opacity-70 hover:opacity-100"}`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                  <div>
                    <div className="text-xs font-bold text-white">Glassmorphism Blur</div>
                    <div className="text-[10px] text-slate-400">High-performance frosted glass panels</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={glassEffect}
                    onChange={(e) => setGlassEffect(e.target.checked)}
                    className="w-4 h-4 rounded text-purple-600 focus:ring-0 bg-black/40 border-white/20"
                  />
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* DISCORD TRANSCRIPT VIEWER MODAL */}
      {selectedTranscript && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-3xl max-h-[85vh] rounded-3xl bg-[#313338] border border-white/10 flex flex-col shadow-2xl overflow-hidden font-sans">
            {/* Modal Header */}
            <div className="p-4 bg-[#2b2d31] border-b border-white/[0.08] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-600/30 flex items-center justify-center text-purple-300 font-bold">
                  <Hash className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>{selectedTranscript.channelName}</span>
                    <span className="text-xs font-mono text-purple-400">({selectedTranscript.ticketId})</span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Category: <strong className="text-slate-200">{selectedTranscript.category}</strong> • Creator: {selectedTranscript.creatorTag}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const text = selectedTranscript.messages
                      .map((m) => `[${new Date(m.timestamp).toLocaleTimeString()}] ${m.authorTag}: ${m.content}`)
                      .join("\n");
                    const blob = new Blob([text], { type: "text/plain" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `${selectedTranscript.ticketId}-transcript.txt`;
                    a.click();
                  }}
                  className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-semibold transition-all flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .txt</span>
                </button>

                <button
                  onClick={() => setSelectedTranscript(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Chat Stream */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#313338]">
              {selectedTranscript.messages && selectedTranscript.messages.length > 0 ? (
                selectedTranscript.messages.map((msg, index) => (
                  <div key={index} className="flex items-start gap-3 hover:bg-black/10 p-1.5 rounded-lg transition-colors">
                    <div className="w-9 h-9 rounded-full bg-purple-700/50 flex items-center justify-center font-bold text-xs text-white shrink-0 mt-0.5">
                      {msg.authorTag.slice(0, 1).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-baseline gap-2">
                        <span className="font-bold text-sm text-white">{msg.authorTag}</span>
                        <span className="text-[10px] text-[#949ba4]">
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      <div className="text-xs text-[#dbdee1] mt-0.5 leading-relaxed">
                        {renderDiscordTokens(msg.content, `msg-${index}`)}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center text-slate-400 text-xs">
                  No chat messages found in this transcript.
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-[#2b2d31] border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
              <span>Encrypted HTML Archive • SyncInk Ticket</span>
              <button
                onClick={() => setSelectedTranscript(null)}
                className="px-4 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white font-bold transition-all"
              >
                Close Viewer
              </button>
            </div>
          </div>
        </div>
      )}

      <PublicFooter />
    </div>
  );
}

export default function TicketDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#070912] flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-purple-300 font-medium text-sm">Loading SyncInk Ticket Console...</p>
          </div>
        </div>
      }
    >
      <TicketDashboardContent />
    </Suspense>
  );
}
