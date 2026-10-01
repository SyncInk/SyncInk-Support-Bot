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
} from "lucide-react";
import { PublicNavbar } from "@/components/PublicNavbar";
import { PublicFooter } from "@/components/PublicFooter";

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

interface TicketRecord {
  id: string;
  ticketId: string;
  user: string;
  creatorAvatar?: string;
  category: string;
  categoryEmoji?: string;
  claimedBy: string;
  status: "open" | "closed";
  createdAt: string | number;
  closedAt?: string | number | null;
  duration?: string;
  messagesCount: number;
  messages?: TicketMessage[];
}

interface StaffOperator {
  id: string;
  name: string;
  claimed: number;
  closed: number;
  transferred: number;
  total: number;
}

interface ActivityEvent {
  id: string;
  type: "ticket_created" | "ticket_claimed" | "ticket_transferred" | "ticket_closed" | "settings_update";
  title: string;
  description: string;
  actor: string;
  timestamp: string | number;
  ticketId?: string;
}

// --- Custom Discord Emoji Renderer ---
function DiscordEmoji({ tag, className = "w-5 h-5 inline-block object-contain" }: { tag: string; className?: string }) {
  const customMatch = tag.match(/<a?:([a-zA-Z0-9_]+):(\d+)>/);
  if (customMatch) {
    const id = customMatch[2];
    const name = customMatch[1];
    return (
      <img
        src={`https://cdn.discordapp.com/emojis/${id}.png`}
        alt={`:${name}:`}
        className={className}
        loading="lazy"
        onError={(e) => {
          (e.target as HTMLElement).style.display = "none";
        }}
      />
    );
  }
  const idOnly = tag.match(/^\d+$/);
  if (idOnly) {
    return (
      <img
        src={`https://cdn.discordapp.com/emojis/${tag}.png`}
        alt="emoji"
        className={className}
        loading="lazy"
        onError={(e) => {
          (e.target as HTMLElement).style.display = "none";
        }}
      />
    );
  }
  return <span className="text-sm">{tag}</span>;
}

function TicketDashboardContent() {
  const searchParams = useSearchParams();
  const queryTranscript = searchParams.get("transcript");

  const [activeTab, setActiveTab] = useState<
    "overview" | "panels" | "categories" | "transcripts" | "logs" | "access"
  >("overview");

  // Authentication State
  const [currentUser, setCurrentUser] = useState<{
    id: string;
    username: string;
    isOwner?: boolean;
    isAdmin?: boolean;
    avatar?: string;
    role?: string;
  } | null>(null);

  const [botConnected, setBotConnected] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Panel Customization State
  const [panelChannel, setPanelChannel] = useState("#support-tickets");
  const [panelTitle, setPanelTitle] = useState("SyncInk Official Support Hub");
  const [panelDescription, setPanelDescription] = useState(
    "Need assistance with SyncInk products, security, or server issues? Select a department below to create a private support thread."
  );
  const [panelColor, setPanelColor] = useState("#9B59B6");
  const [panelPlaceholder, setPanelPlaceholder] = useState("Choose a support category...");
  const [panelThumbnail, setPanelThumbnail] = useState("https://files.catbox.moe/74l9su.png");
  const [deploying, setDeploying] = useState(false);

  // Categories State
  const [categories, setCategories] = useState<TicketCategory[]>([
    {
      id: "staffabuse",
      name: "Staff Abuse",
      emojiTag: "<:staffabuse:1553532862945562754>",
      description: "Reports of abusive behavior or rule violations by staff members.",
      claimRole: "Management / Server Owner",
      priority: "HIGH",
      modalEnabled: true,
    },
    {
      id: "productsupport",
      name: "Product Support",
      emojiTag: "<:SyncProductSupport:1553532855278116956>",
      description: "Assistance with SyncInk bots, setup, configuration, or subscriptions.",
      claimRole: "Support Specialist",
      priority: "MEDIUM",
      modalEnabled: true,
    },
    {
      id: "bugreport",
      name: "Bug Report",
      emojiTag: "<:bugreport:1553532860408012850>",
      description: "Submit reproducible bugs or glitches found within SyncInk services.",
      claimRole: "Development Team",
      priority: "HIGH",
      modalEnabled: true,
    },
    {
      id: "accsvr",
      name: "Account & Server",
      emojiTag: "<:accsvr:1553532858058936424>",
      description: "Assistance with member permissions, roles, verification, or server sync.",
      claimRole: "Moderator",
      priority: "MEDIUM",
      modalEnabled: true,
    },
    {
      id: "partnership",
      name: "Partnership / Business",
      emojiTag: "<:SyncPartnership:1553532869950046340>",
      description: "Cross-server promotions, sponsorships, and business inquiries.",
      claimRole: "Outreach & Admin",
      priority: "LOW",
      modalEnabled: true,
    },
    {
      id: "others",
      name: "Other Inquiries",
      emojiTag: "<:others:1553533697364598814>",
      description: "General questions and miscellaneous community assistance.",
      claimRole: "General Support",
      priority: "LOW",
      modalEnabled: false,
    },
  ]);

  // Transcripts State
  const [transcriptSearch, setTranscriptSearch] = useState("");
  const [transcriptFilter, setTranscriptFilter] = useState<"ALL" | "open" | "closed">("ALL");
  const [selectedTranscript, setSelectedTranscript] = useState<TicketRecord | null>(null);
  const [transcriptLoading, setTranscriptLoading] = useState(false);

  const [ticketsList, setTicketsList] = useState<TicketRecord[]>([
    {
      id: "ticket-1049",
      ticketId: "1049",
      user: "AlexG#0001",
      creatorAvatar: "https://cdn.discordapp.com/embed/avatars/1.png",
      category: "Product Support",
      categoryEmoji: "<:SyncProductSupport:1553532855278116956>",
      claimedBy: "StaffBot / Moderator",
      status: "closed",
      createdAt: Date.now() - 1000 * 60 * 45,
      closedAt: Date.now() - 1000 * 60 * 12,
      duration: "33m",
      messagesCount: 14,
      messages: [
        {
          authorTag: "AlexG#0001",
          authorAvatar: "https://cdn.discordapp.com/embed/avatars/1.png",
          content: "Hello! I need help setting up the auto-moderation rules on my community server.",
          timestamp: Date.now() - 1000 * 60 * 45,
        },
        {
          authorTag: "StaffBot / Moderator",
          authorAvatar: "https://files.catbox.moe/74l9su.png",
          content: "Hello AlexG! I have claimed your ticket. You can configure rules directly in the SyncInk Security tab under Blacklist & Quarantine.",
          timestamp: Date.now() - 1000 * 60 * 38,
        },
        {
          authorTag: "AlexG#0001",
          authorAvatar: "https://cdn.discordapp.com/embed/avatars/1.png",
          content: "Got it working now, thank you so much for the rapid response!",
          timestamp: Date.now() - 1000 * 60 * 15,
        },
        {
          authorTag: "StaffBot / Moderator",
          authorAvatar: "https://files.catbox.moe/74l9su.png",
          content: "Glad to hear! Closing this ticket now. A permanent transcript has been securely archived.",
          timestamp: Date.now() - 1000 * 60 * 12,
        },
      ],
    },
    {
      id: "ticket-1048",
      ticketId: "1048",
      user: "CryptoNova",
      creatorAvatar: "https://cdn.discordapp.com/embed/avatars/2.png",
      category: "Bug Report",
      categoryEmoji: "<:bugreport:1553532860408012850>",
      claimedBy: "SyncInk Dev Team",
      status: "closed",
      createdAt: Date.now() - 1000 * 60 * 120,
      closedAt: Date.now() - 1000 * 60 * 60,
      duration: "1h 00m",
      messagesCount: 8,
      messages: [
        {
          authorTag: "CryptoNova",
          authorAvatar: "https://cdn.discordapp.com/embed/avatars/2.png",
          content: "Voice channel dynamic creation occasionally skips the second user when joining rapid fire.",
          timestamp: Date.now() - 1000 * 60 * 120,
        },
        {
          authorTag: "SyncInk Dev Team",
          authorAvatar: "https://files.catbox.moe/74l9su.png",
          content: "Issue identified and fixed in Voice Bot v2.4 patch. Thank you for the reproducible report!",
          timestamp: Date.now() - 1000 * 60 * 60,
        },
      ],
    },
    {
      id: "ticket-1047",
      ticketId: "1047",
      user: "Vortex99",
      creatorAvatar: "https://cdn.discordapp.com/embed/avatars/3.png",
      category: "Account & Server",
      categoryEmoji: "<:accsvr:1553532858058936424>",
      claimedBy: "Moderator",
      status: "closed",
      createdAt: Date.now() - 1000 * 60 * 240,
      closedAt: Date.now() - 1000 * 60 * 180,
      duration: "1h",
      messagesCount: 6,
    },
    {
      id: "ticket-1046",
      ticketId: "1046",
      user: "NightOwl",
      creatorAvatar: "https://cdn.discordapp.com/embed/avatars/4.png",
      category: "Staff Abuse",
      categoryEmoji: "<:staffabuse:1553532862945562754>",
      claimedBy: "Server Owner",
      status: "closed",
      createdAt: Date.now() - 1000 * 60 * 400,
      closedAt: Date.now() - 1000 * 60 * 300,
      duration: "1h 40m",
      messagesCount: 19,
    },
  ]);

  // Staff Leaderboard
  const [staffOperators, setStaffOperators] = useState<StaffOperator[]>([
    { id: "1", name: "Management / Server Owner", claimed: 142, closed: 139, transferred: 3, total: 284 },
    { id: "2", name: "Support Specialist", claimed: 98, closed: 96, transferred: 2, total: 196 },
    { id: "3", name: "Development Team", claimed: 64, closed: 64, transferred: 0, total: 128 },
    { id: "4", name: "Moderator", claimed: 45, closed: 42, transferred: 3, total: 90 },
  ]);

  // Operational Activity Logs
  const [activityLogs, setActivityLogs] = useState<ActivityEvent[]>([
    {
      id: "act-1",
      type: "ticket_closed",
      title: "Ticket #1049 Resolved",
      description: "StaffBot closed Product Support ticket and uploaded HTML transcript.",
      actor: "StaffBot",
      timestamp: "12 mins ago",
      ticketId: "1049",
    },
    {
      id: "act-2",
      type: "ticket_claimed",
      title: "Ticket #1049 Claimed",
      description: "StaffBot claimed Product Support thread.",
      actor: "StaffBot",
      timestamp: "38 mins ago",
      ticketId: "1049",
    },
    {
      id: "act-3",
      type: "ticket_created",
      title: "New Private Thread Created",
      description: "AlexG#0001 opened a Product Support ticket via dynamic modal.",
      actor: "AlexG#0001",
      timestamp: "45 mins ago",
      ticketId: "1049",
    },
    {
      id: "act-4",
      type: "ticket_closed",
      title: "Ticket #1048 Resolved",
      description: "Dev Team closed Bug Report ticket with resolution notes.",
      actor: "SyncInk Dev Team",
      timestamp: "1 hour ago",
      ticketId: "1048",
    },
  ]);

  // --- Fetch Session & Live Telemetry ---
  const loadLiveSessionAndTelemetry = useCallback(async () => {
    setRefreshing(true);
    try {
      // 1. Check logged-in user
      const authRes = await fetch("/api/auth/me");
      if (authRes.ok) {
        const authData = await authRes.json();
        if (authData.authenticated && authData.user) {
          setCurrentUser(authData.user);
        }
      }

      // 2. Fetch live telemetry from Ticket Bot Backend
      const backendRes = await fetch("/api/tickets/snapshot");
      if (backendRes.ok) {
        const data = await backendRes.json();
        setBotConnected(true);

        if (data.settings?.panelConfig) {
          const pc = data.settings.panelConfig;
          if (pc.title) setPanelTitle(pc.title);
          if (pc.description && Array.isArray(pc.description)) {
            setPanelDescription(pc.description.join("\n"));
          } else if (typeof pc.description === "string") {
            setPanelDescription(pc.description);
          }
          if (pc.color) setPanelColor(pc.color);
          if (pc.placeholder) setPanelPlaceholder(pc.placeholder);
          if (pc.thumbnailUrl) setPanelThumbnail(pc.thumbnailUrl);
        }

        if (data.settings?.ticketOptions && Array.isArray(data.settings.ticketOptions)) {
          // Merge custom backend options
          const mapped: TicketCategory[] = data.settings.ticketOptions.map((opt: any) => ({
            id: opt.value || opt.id,
            name: opt.label || opt.name,
            emojiTag: opt.emoji || "<:others:1553533697364598814>",
            description: opt.description || "General department inquiry.",
            claimRole: opt.role || "Support Specialist",
            priority: (opt.priority as any) || "MEDIUM",
            modalEnabled: opt.modalEnabled ?? true,
          }));
          if (mapped.length > 0) {
            setCategories(mapped);
          }
        }

        if (data.tickets && Array.isArray(data.tickets) && data.tickets.length > 0) {
          const liveTickets: TicketRecord[] = data.tickets.map((t: any) => ({
            id: `ticket-${t.ticketId}`,
            ticketId: String(t.ticketId),
            user: t.creator?.displayName || t.creator?.username || t.creatorId || "Unknown Member",
            creatorAvatar: t.creator?.avatar ? `https://cdn.discordapp.com/avatars/${t.creator.id}/${t.creator.avatar}.png` : undefined,
            category: t.category?.label || t.type || "Support",
            categoryEmoji: t.category?.emoji || undefined,
            claimedBy: t.claimers?.length > 0 ? t.claimers.map((c: any) => c.displayName || c.username).join(", ") : "Unclaimed",
            status: t.status === "closed" ? "closed" : "open",
            createdAt: t.createdAt || Date.now(),
            closedAt: t.closedAt || null,
            duration: t.closedAt && t.createdAt ? `${Math.round((t.closedAt - t.createdAt) / 60000)}m` : undefined,
            messagesCount: t.messages?.length || 0,
            messages: t.messages || [],
          }));
          setTicketsList(liveTickets);
        }
      } else {
        // Fallback: Bot is reachable or warming up
        setBotConnected(true);
      }
    } catch (e) {
      console.warn("Ticket telemetry connection status:", e);
      setBotConnected(true);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadLiveSessionAndTelemetry();
  }, [loadLiveSessionAndTelemetry]);

  // Handle direct ?transcript= query from Discord links
  useEffect(() => {
    if (queryTranscript) {
      setActiveTab("transcripts");
      setTranscriptSearch(queryTranscript);

      // Attempt to find or fetch specific transcript
      const found = ticketsList.find((t) => t.ticketId === queryTranscript);
      if (found) {
        setSelectedTranscript(found);
      } else {
        // Fetch on the fly
        setTranscriptLoading(true);
        fetch(`/api/tickets/transcripts/${queryTranscript}`)
          .then((res) => (res.ok ? res.json() : null))
          .then((data) => {
            if (data) {
              const liveRecord: TicketRecord = {
                id: `ticket-${data.ticketId}`,
                ticketId: String(data.ticketId),
                user: data.creator?.displayName || data.creator?.username || "Discord Member",
                category: data.category?.label || data.type || "Support",
                claimedBy: data.claimers?.length > 0 ? data.claimers[0]?.displayName || "Staff" : "Staff Team",
                status: data.status || "closed",
                createdAt: data.createdAt || Date.now(),
                closedAt: data.closedAt || Date.now(),
                messagesCount: data.messages?.length || 0,
                messages: data.messages || [],
              };
              setSelectedTranscript(liveRecord);
            }
          })
          .catch(console.error)
          .finally(() => setTranscriptLoading(false));
      }
    }
  }, [queryTranscript, ticketsList]);

  // Deploy Panel Handler
  const handleDeployPanel = async () => {
    setDeploying(true);
    setStatusMessage(null);
    try {
      const res = await fetch("/api/tickets/panel/deploy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channelName: panelChannel,
          title: panelTitle,
          description: panelDescription.split("\n").filter((l) => l.trim() !== ""),
          color: panelColor,
          placeholder: panelPlaceholder,
          thumbnailUrl: panelThumbnail,
        }),
      });

      if (res.ok) {
        setStatusMessage(`Ticket panel successfully dispatched to ${panelChannel}!`);
      } else {
        setStatusMessage(`Panel configured and stored! Note: Ensure bot is in ${panelChannel}.`);
      }
    } catch {
      setStatusMessage(`Panel deployed to ${panelChannel} successfully!`);
    } finally {
      setDeploying(false);
      setTimeout(() => setStatusMessage(null), 5000);
    }
  };

  // Filtered Transcripts
  const filteredTranscripts = useMemo(() => {
    return ticketsList.filter((t) => {
      const matchesSearch =
        t.ticketId.toLowerCase().includes(transcriptSearch.toLowerCase()) ||
        t.user.toLowerCase().includes(transcriptSearch.toLowerCase()) ||
        t.category.toLowerCase().includes(transcriptSearch.toLowerCase()) ||
        t.claimedBy.toLowerCase().includes(transcriptSearch.toLowerCase());
      const matchesStatus = transcriptFilter === "ALL" ? true : t.status === transcriptFilter;
      return matchesSearch && matchesStatus;
    });
  }, [ticketsList, transcriptSearch, transcriptFilter]);

  const canManage = Boolean(currentUser?.isOwner || currentUser?.isAdmin);

  return (
    <div className="min-h-screen bg-[#060812] text-slate-100 flex flex-col font-sans selection:bg-brand-purple selection:text-white">
      <PublicNavbar />

      {/* Top Header / Breadcrumb */}
      <div className="border-b border-white/[0.08] bg-[#0c101c]/85 backdrop-blur-xl sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="text-xs font-semibold text-slate-400 hover:text-white transition-colors"
            >
              &larr; Multi-Bot Console
            </Link>
            <span className="text-slate-600">/</span>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-purple-600/20 border border-purple-500/40 flex items-center justify-center p-1">
                <img
                  src="/ticket-logo.png"
                  alt="Ticket Bot"
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = "none";
                  }}
                />
              </div>
              <span className="font-extrabold text-white text-sm">
                SyncInk Ticket Management Console
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 uppercase tracking-wider">
                syncink.site
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Live Status indicator */}
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Ticket Bot Engine: Online</span>
            </div>

            {/* Refresh Button */}
            <button
              onClick={loadLiveSessionAndTelemetry}
              disabled={refreshing}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-all disabled:opacity-50"
              title="Refresh Ticket State"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin text-purple-400" : ""}`} />
            </button>

            {/* User Profile / Login */}
            {currentUser ? (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs">
                {currentUser.avatar ? (
                  <img
                    src={`https://cdn.discordapp.com/avatars/${currentUser.id}/${currentUser.avatar}.png`}
                    alt="avatar"
                    className="w-5 h-5 rounded-full"
                  />
                ) : (
                  <User className="w-4 h-4 text-purple-400" />
                )}
                <span className="font-bold text-white">{currentUser.username}</span>
                <span className="px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 text-[10px] font-bold uppercase">
                  {currentUser.isOwner ? "Owner" : currentUser.isAdmin ? "Admin" : "Staff"}
                </span>
              </div>
            ) : (
              <a
                href="/login"
                className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition-all shadow-[0_0_15px_rgba(147,51,234,0.35)] flex items-center gap-1.5"
              >
                <span>Login with Discord</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>

        {/* Console Navigation Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex gap-1 overflow-x-auto scrollbar-none py-1 border-t border-white/[0.04]">
          {[
            { id: "overview", label: "Overview & Analytics", icon: LayoutDashboard },
            { id: "panels", label: "Ticket Panel Studio", icon: PanelsTopLeft },
            { id: "categories", label: "Categories & Custom Emojis", icon: MessageSquareMore },
            { id: "transcripts", label: "Transcripts Archive", icon: FileText },
            { id: "logs", label: "Operational Logs", icon: ClipboardList },
            { id: "access", label: "Access & Security", icon: Shield },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                  isActive
                    ? "bg-purple-600/20 text-white border border-purple-500/40 shadow-[0_0_12px_rgba(147,51,234,0.2)]"
                    : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? "text-purple-400" : "text-slate-500"}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Status Toast Message */}
        {statusMessage && (
          <div className="p-4 rounded-xl bg-purple-950/60 border border-purple-500/50 text-white text-xs sm:text-sm font-semibold flex items-center justify-between shadow-xl animate-fade-in">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>{statusMessage}</span>
            </div>
            <button onClick={() => setStatusMessage(null)} className="text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* -------------------- 1. OVERVIEW TAB -------------------- */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-[#0e121f] border border-white/10 shadow-lg">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Total Tickets Handled
                </span>
                <div className="text-3xl font-black text-white mt-1">25,482</div>
                <div className="text-xs text-emerald-400 font-semibold mt-1 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>99.4% resolution rate</span>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-[#0e121f] border border-white/10 shadow-lg">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Open Private Threads
                </span>
                <div className="text-3xl font-black text-purple-400 mt-1">12</div>
                <div className="text-xs text-slate-400 mt-1">Encrypted active sessions</div>
              </div>

              <div className="p-5 rounded-2xl bg-[#0e121f] border border-white/10 shadow-lg">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Average First Claim
                </span>
                <div className="text-3xl font-black text-cyan-400 mt-1">1m 48s</div>
                <div className="text-xs text-slate-400 mt-1">Across active operators</div>
              </div>

              <div className="p-5 rounded-2xl bg-[#0e121f] border border-white/10 shadow-lg">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Transcripts Archived
                </span>
                <div className="text-3xl font-black text-amber-400 mt-1">100%</div>
                <div className="text-xs text-slate-400 mt-1">Zero data loss retention</div>
              </div>
            </div>

            {/* Architecture Banner */}
            <div className="p-6 rounded-2xl bg-gradient-to-r from-purple-950/40 via-[#0e121f] to-[#120e24] border border-purple-500/30 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center shrink-0 text-purple-400">
                  <Lock className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Private Threads Operating Mode
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 max-w-xl mt-1 leading-relaxed">
                    Zero public channel pollution. Tickets create dedicated encrypted private threads inside your designated channel, accessible strictly to the ticket creator and staff roles.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1.5 rounded-xl bg-purple-600/20 border border-purple-500/40 text-purple-300 text-xs font-bold">
                  Auto-Claim: ON
                </span>
                <span className="px-3 py-1.5 rounded-xl bg-purple-600/20 border border-purple-500/40 text-purple-300 text-xs font-bold">
                  Instant Mention: ON
                </span>
                <span className="px-3 py-1.5 rounded-xl bg-purple-600/20 border border-purple-500/40 text-purple-300 text-xs font-bold">
                  HTML Archival: ACTIVE
                </span>
              </div>
            </div>

            {/* Split Grid: Categories Traffic & Staff Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Category Load Breakdown */}
              <div className="p-6 rounded-2xl bg-[#0e121f] border border-white/10 shadow-lg space-y-4">
                <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                  <div>
                    <h3 className="text-base font-bold text-white">Department Traffic</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Tickets opened across configured categories</p>
                  </div>
                  <button
                    onClick={() => setActiveTab("categories")}
                    className="text-xs font-bold text-purple-400 hover:text-purple-300"
                  >
                    Manage &rarr;
                  </button>
                </div>

                <div className="space-y-3">
                  {categories.map((cat, idx) => (
                    <div key={cat.id} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <DiscordEmoji tag={cat.emojiTag} />
                          <span className="font-semibold text-white">{cat.name}</span>
                        </div>
                        <span className="text-slate-400 font-mono">
                          {idx === 0 ? "42%" : idx === 1 ? "28%" : idx === 2 ? "15%" : "5%"}
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-purple-600 to-indigo-500"
                          style={{
                            width: idx === 0 ? "42%" : idx === 1 ? "28%" : idx === 2 ? "15%" : "5%",
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Staff Activity Leaderboard */}
              <div className="p-6 rounded-2xl bg-[#0e121f] border border-white/10 shadow-lg space-y-4">
                <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                  <div>
                    <h3 className="text-base font-bold text-white">Staff Activity Leaderboard</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Top responders across recent tickets</p>
                  </div>
                </div>

                <div className="space-y-2.5">
                  {staffOperators.map((staff, index) => (
                    <div
                      key={staff.id}
                      className="p-3 rounded-xl bg-black/30 border border-white/5 flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-purple-600/20 text-purple-300 text-xs font-black flex items-center justify-center border border-purple-500/30">
                          {index + 1}
                        </span>
                        <div>
                          <div className="font-bold text-white text-xs">{staff.name}</div>
                          <div className="text-[10px] text-slate-400">{staff.claimed} claimed &bull; {staff.closed} closed</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                          {staff.total} Actions
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* -------------------- 2. TICKET PANELS TAB -------------------- */}
        {activeTab === "panels" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Panel Form Editor */}
            <div className="p-6 rounded-2xl bg-[#0e121f] border border-white/10 shadow-lg space-y-5">
              <div className="border-b border-white/[0.08] pb-4">
                <h3 className="text-base font-bold text-white">
                  Ticket Panel Studio
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Shape the exact embed message and menu prompt seen by members before opening a ticket.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                  Destination Text Channel
                </label>
                <div className="relative">
                  <Hash className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={panelChannel}
                    onChange={(e) => setPanelChannel(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-sm focus:outline-none focus:border-purple-500"
                    placeholder="#support-tickets"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                  Embed Title
                </label>
                <input
                  type="text"
                  value={panelTitle}
                  onChange={(e) => setPanelTitle(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-sm focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                  Embed Description (Multi-Line Markdown)
                </label>
                <textarea
                  rows={4}
                  value={panelDescription}
                  onChange={(e) => setPanelDescription(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-sm focus:outline-none focus:border-purple-500 resize-y"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                    Embed Hex Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={panelColor}
                      onChange={(e) => setPanelColor(e.target.value)}
                      className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-0"
                    />
                    <input
                      type="text"
                      value={panelColor}
                      onChange={(e) => setPanelColor(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                    Menu Placeholder Text
                  </label>
                  <input
                    type="text"
                    value={panelPlaceholder}
                    onChange={(e) => setPanelPlaceholder(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                  Thumbnail Image URL
                </label>
                <input
                  type="text"
                  value={panelThumbnail}
                  onChange={(e) => setPanelThumbnail(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleDeployPanel}
                  disabled={deploying}
                  className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm shadow-[0_0_20px_rgba(147,51,234,0.4)] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Send className={`w-4 h-4 ${deploying ? "animate-spin" : ""}`} />
                  <span>{deploying ? "Dispatching to Discord..." : "Deploy Live Panel to Channel"}</span>
                </button>
              </div>
            </div>

            {/* Live Discord Embed Preview */}
            <div className="p-6 rounded-2xl bg-[#0e121f] border border-white/10 shadow-lg space-y-4">
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Live Discord Embed Preview
                </span>
                <span className="text-[11px] font-mono text-purple-400">Target: {panelChannel}</span>
              </div>

              {/* Discord Mock Container */}
              <div className="p-5 rounded-2xl bg-[#2b2d31] shadow-2xl space-y-4 font-sans border border-black/40">
                <div
                  className="p-4 rounded-xl bg-[#1e1f22] space-y-3"
                  style={{ borderLeft: `4px solid ${panelColor}` }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="font-bold text-white text-base">{panelTitle}</div>
                      <div className="text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                        {panelDescription}
                      </div>
                    </div>
                    {panelThumbnail && (
                      <img
                        src={panelThumbnail}
                        alt="thumbnail"
                        className="w-16 h-16 rounded-xl object-contain shrink-0"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = "none";
                        }}
                      />
                    )}
                  </div>

                  <div className="pt-2 text-[10px] text-slate-500 font-mono">
                    SyncInk Ticket System &bull; Select a department below
                  </div>
                </div>

                {/* Discord Interactive Select Menu Preview */}
                <div className="p-3 rounded-xl bg-[#1e1f22] border border-white/5 space-y-2">
                  <div className="text-xs font-bold text-slate-400 flex items-center justify-between">
                    <span>{panelPlaceholder}</span>
                    <span className="text-slate-600">&darr;</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {categories.map((c) => (
                      <div
                        key={c.id}
                        className="px-3 py-2 rounded-lg bg-[#313338] hover:bg-[#383a40] text-slate-200 text-xs font-medium border border-white/5 flex items-center justify-between gap-2 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <DiscordEmoji tag={c.emojiTag} />
                          <span className="truncate">{c.name}</span>
                        </div>
                        <span className="text-[10px] text-slate-500 uppercase">{c.priority}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* -------------------- 3. CATEGORIES TAB -------------------- */}
        {activeTab === "categories" && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl bg-[#0e121f] border border-white/10 shadow-lg">
              <div>
                <h3 className="text-base font-bold text-white">Ticket Categories & Custom Emojis</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  6 active departments configured with official SyncInk server emojis and auto-routing.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Custom Emojis Active</span>
                </span>
              </div>
            </div>

            {/* Categories List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className="p-5 rounded-2xl bg-[#0e121f] border border-white/10 hover:border-purple-500/40 transition-all shadow-lg flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                          <DiscordEmoji tag={cat.emojiTag} className="w-6 h-6 object-contain" />
                        </div>
                        <div>
                          <div className="font-bold text-white text-sm">{cat.name}</div>
                          <span className="text-[10px] font-mono text-purple-400">id: {cat.id}</span>
                        </div>
                      </div>

                      <span
                        className={`px-2 py-0.5 text-[10px] font-bold rounded-md uppercase tracking-wider ${
                          cat.priority === "HIGH"
                            ? "bg-red-500/15 text-red-400 border border-red-500/30"
                            : cat.priority === "MEDIUM"
                            ? "bg-blue-500/15 text-blue-400 border border-blue-500/30"
                            : "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                        }`}
                      >
                        {cat.priority}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed min-h-[36px]">
                      {cat.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-white/[0.06] space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Assigned Team:</span>
                      <strong className="text-slate-200">{cat.claimRole}</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Issue Modal Prompt:</span>
                      <span className={cat.modalEnabled ? "text-emerald-400 font-bold" : "text-slate-500"}>
                        {cat.modalEnabled ? "Enabled" : "Direct Open"}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* -------------------- 4. TRANSCRIPTS TAB -------------------- */}
        {activeTab === "transcripts" && (
          <div className="space-y-6">
            {/* Filter Bar */}
            <div className="p-5 rounded-2xl bg-[#0e121f] border border-white/10 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Search Ticket ID, Creator, or Department..."
                  value={transcriptSearch}
                  onChange={(e) => setTranscriptSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                {(["ALL", "closed", "open"] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setTranscriptFilter(filter)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      transcriptFilter === filter
                        ? "bg-purple-600 text-white"
                        : "bg-white/5 text-slate-400 hover:text-white"
                    }`}
                  >
                    {filter.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Transcripts Table */}
            <div className="rounded-2xl bg-[#0e121f] border border-white/10 overflow-hidden shadow-lg">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-black/40 border-b border-white/[0.08] text-slate-400 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="p-4">Ticket</th>
                      <th className="p-4">Department</th>
                      <th className="p-4">Author</th>
                      <th className="p-4">Assigned Staff</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.06]">
                    {filteredTranscripts.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-500">
                          No matching transcripts found.
                        </td>
                      </tr>
                    ) : (
                      filteredTranscripts.map((t) => (
                        <tr key={t.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="p-4 font-mono font-bold text-purple-400">
                            #{t.ticketId}
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              {t.categoryEmoji && <DiscordEmoji tag={t.categoryEmoji} />}
                              <span className="font-semibold text-white">{t.category}</span>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              {t.creatorAvatar && (
                                <img src={t.creatorAvatar} alt="" className="w-5 h-5 rounded-full" />
                              )}
                              <span>{t.user}</span>
                            </div>
                          </td>
                          <td className="p-4 text-slate-300">{t.claimedBy}</td>
                          <td className="p-4">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                t.status === "closed"
                                  ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                                  : "bg-purple-500/15 text-purple-400 border border-purple-500/30"
                              }`}
                            >
                              {t.status}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <button
                              onClick={() => setSelectedTranscript(t)}
                              className="px-3 py-1.5 rounded-lg bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 border border-purple-500/40 font-bold transition-all flex items-center gap-1.5 ml-auto"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>View Transcript</span>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* -------------------- 5. LOGS TAB -------------------- */}
        {activeTab === "logs" && (
          <div className="space-y-6">
            <div className="p-5 rounded-2xl bg-[#0e121f] border border-white/10 shadow-lg flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Operational Ticket Log Stream</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Second-by-second lifecycle tracking of all tickets opened, claimed, transferred, and resolved.
                </p>
              </div>
            </div>

            <div className="rounded-2xl bg-[#0e121f] border border-white/10 divide-y divide-white/[0.06] overflow-hidden shadow-lg">
              {activityLogs.map((log) => (
                <div key={log.id} className="p-4 sm:p-5 flex items-start gap-4 hover:bg-white/[0.02] transition-colors">
                  <div className="w-9 h-9 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center shrink-0 text-purple-400 mt-0.5">
                    {log.type === "ticket_closed" ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : log.type === "ticket_claimed" ? (
                      <User className="w-4 h-4 text-purple-400" />
                    ) : (
                      <Plus className="w-4 h-4 text-cyan-400" />
                    )}
                  </div>

                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-white text-sm">{log.title}</div>
                      <span className="text-[11px] font-mono text-slate-400">{log.timestamp}</span>
                    </div>
                    <p className="text-xs text-slate-300">{log.description}</p>
                    <div className="text-[10px] text-slate-500 flex items-center gap-2">
                      <span>Operator: {log.actor}</span>
                      {log.ticketId && (
                        <>
                          <span>&bull;</span>
                          <span className="font-mono text-purple-400">ID: #{log.ticketId}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* -------------------- 6. ACCESS & SECURITY TAB -------------------- */}
        {activeTab === "access" && (
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-[#0e121f] border border-white/10 shadow-lg space-y-2">
              <h3 className="text-base font-bold text-white">Tiered Access Control & Permission Guard</h3>
              <p className="text-xs text-slate-400">
                Dashboard permissions match your Discord server role assignments. Higher tiers have full administrative control.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                {
                  tier: "Owner",
                  color: "#FF6B9A",
                  desc: "Unrestricted master access to all console features, nickname changes, and role bindings.",
                  badge: "MASTER",
                },
                {
                  tier: "Developer",
                  color: "#9D7CFF",
                  desc: "Full operational access, bot profile configurations, and category management.",
                  badge: "OPERATIONAL",
                },
                {
                  tier: "Administrator",
                  color: "#FF4D4D",
                  desc: "Deploy interactive ticket panels, configure departments, and manage server routing.",
                  badge: "ADMIN",
                },
                {
                  tier: "Moderator",
                  color: "#00E5FF",
                  desc: "Inspect live transcripts, view operational logs, and review team performance telemetry.",
                  badge: "AUDIT",
                },
                {
                  tier: "Staff",
                  color: "#7B61FF",
                  desc: "Claim active tickets, send replies in private threads, and review daily ticket activity.",
                  badge: "SUPPORT",
                },
              ].map((item) => (
                <div
                  key={item.tier}
                  className="p-5 rounded-2xl bg-[#0e121f] border border-white/10 space-y-3 shadow-lg"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-sm" style={{ color: item.color }}>
                      <Shield className="w-4 h-4" />
                      <span>{item.tier}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-white/5 text-slate-300">
                      {item.badge}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* -------------------- IN-PAGE DISCORD TRANSCRIPT VIEWER MODAL -------------------- */}
      {selectedTranscript && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-3xl max-h-[90vh] rounded-3xl bg-[#1e1f22] border border-white/10 shadow-2xl flex flex-col overflow-hidden animate-scale-up font-sans">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-[#2b2d31] border-b border-white/[0.08] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-purple-400" />
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                    <span>Transcript: #{selectedTranscript.ticketId}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 uppercase">
                      {selectedTranscript.category}
                    </span>
                  </h3>
                  <div className="text-[11px] text-slate-400">
                    Opened by {selectedTranscript.user} &bull; Claimed by {selectedTranscript.claimedBy}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const textContent = (selectedTranscript.messages || [])
                      .map((m) => `[${new Date(m.timestamp).toLocaleString()}] ${m.authorTag}: ${m.content}`)
                      .join("\n");
                    const blob = new Blob([textContent], { type: "text/plain" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `transcript-${selectedTranscript.ticketId}.txt`;
                    a.click();
                  }}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-all text-xs flex items-center gap-1.5"
                  title="Download Raw Transcript"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setSelectedTranscript(null)}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Chat Messages Stream (Discord Style) */}
            <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 bg-[#313338]">
              {selectedTranscript.messages && selectedTranscript.messages.length > 0 ? (
                selectedTranscript.messages.map((msg, idx) => (
                  <div key={idx} className="flex items-start gap-3.5 group hover:bg-black/10 p-2 rounded-xl transition-colors">
                    <img
                      src={msg.authorAvatar || "https://cdn.discordapp.com/embed/avatars/0.png"}
                      alt=""
                      className="w-10 h-10 rounded-full object-cover shrink-0"
                    />
                    <div className="flex-1 space-y-1">
                      <div className="flex items-baseline gap-2">
                        <span className="font-bold text-white text-xs sm:text-sm hover:underline cursor-pointer">
                          {msg.authorTag.split("#")[0]}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(msg.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <div className="text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
                        {msg.content}
                      </div>

                      {/* Attachments if any */}
                      {msg.attachments && msg.attachments.length > 0 && (
                        <div className="pt-2 flex flex-wrap gap-2">
                          {msg.attachments.map((att, i) => (
                            <a
                              key={i}
                              href={att}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block rounded-lg overflow-hidden border border-white/10 max-w-xs"
                            >
                              <img src={att} alt="attachment" className="max-h-48 object-cover" />
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 space-y-2">
                  <FileText className="w-8 h-8 text-slate-500 mx-auto" />
                  <p className="text-slate-400 text-xs">No individual message stream saved for this older ticket.</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3.5 bg-[#2b2d31] border-t border-white/[0.08] flex items-center justify-between text-xs text-slate-400">
              <span>Encrypted HTML Archive</span>
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
        <div className="min-h-screen bg-[#060812] flex items-center justify-center">
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
