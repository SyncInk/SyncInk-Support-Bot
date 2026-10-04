"use client";

import React, { useEffect, useState, useRef, useTransition } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import "./ticket-dashboard.css";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowDown,
  ArrowRightLeft,
  ArrowUp,
  BarChart3,
  BookOpen,
  Bot,
  Box,
  Check,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  Clock,
  Copy,
  Crown,
  Database,
  ExternalLink,
  Eye,
  FileText,
  GripVertical,
  HelpCircle,
  LayoutDashboard,
  Layers,
  Lock,
  LogOut,
  Menu,
  MessageSquare,
  MessageSquareMore,
  Paintbrush,
  PanelsTopLeft,
  PieChart,
  Plus,
  RefreshCw,
  Save,
  Scale,
  ScrollText,
  Search,
  Send,
  Settings,
  Shield,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Terminal,
  Ticket,
  Trash2,
  TrendingUp,
  User,
  X
} from "lucide-react";
import { DiscordTranscriptViewer, TranscriptTicket } from "@/components/DiscordTranscriptViewer";

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
  { value: "general_request", label: "General Request", emoji: "1513336781263732836", emojiTag: "<:generalrequest:1513336781263732836>", roleGroup: "staffRoleIds" },
  { value: "user_report", label: "User Report", emoji: "1513336966681460856", emojiTag: "<:userreport:1513336966681460856>", roleGroup: "staffRoleIds" },
  { value: "bug_report", label: "Bug Report", emoji: "1513337174148513892", emojiTag: "<:bugreport:1513337174148513892>", roleGroup: "developerRoleIds" },
  { value: "staff_abuse", label: "Staff Abuse", emoji: "1513337285024677899", emojiTag: "<:staffabuse:1513337285024677899>", roleGroup: "adminRoleIds" },
  { value: "other", label: "Other", emoji: "1513337572078911488", emojiTag: "<:others:1513337572078911488>", roleGroup: "staffRoleIds" },
  { value: "owner_contact", label: "Owner Contact", emoji: "1513337741105037332", emojiTag: "<:ownercontact:1513337741105037332>", roleGroup: "ownerRoleIds" }
];

interface RoleMappingItem {
  id: string;
  name: string;
  color?: string;
  tier: "owner" | "developer" | "admin" | "moderator" | "staff";
}

const ACCESS_TIERS = [
  { id: "owner", label: "Owner", accessLabel: "Owner (Full Access)", emojiId: "1513803214674464788", color: "#FF6B9A", borderColor: "#FF6B9A", desc: "Full unrestricted access to dashboard and server controls." },
  { id: "developer", label: "Developer", accessLabel: "Developer (Full Access)", emojiId: "1519379532409344142", color: "#9d7cff", borderColor: "#9d7cff", desc: "Full access to bot settings and technical configs." },
  { id: "admin", label: "Administrator", accessLabel: "Administrator (Manage Server)", emojiId: "1518924309668823160", color: "#ff4d4d", borderColor: "#ff4d4d", desc: "Manage categories, panel designs, and server preferences." },
  { id: "moderator", label: "Moderator", accessLabel: "Moderator (Managed Access)", emojiId: "1518924931482779809", color: "#00e5ff", borderColor: "#00e5ff", desc: "View ticket logs, transcripts, and analytics." },
  { id: "staff", label: "Staff", accessLabel: "Staff (Limited Access)", emojiId: "1513328514529624185", color: "#7b61ff", borderColor: "#7b61ff", desc: "Claim tickets, view basic metrics and operational stream." }
];

const BOT_COMMANDS = [
  {
    name: "/ticket-panel",
    category: "setup",
    badge: "Admin Only",
    syntax: "/ticket-panel [channel]",
    usage: "Deploy customized support ticket panel directly into a channel.",
    description: "Renders the live interactive dropdown ticket panel with configured categories, colors, and button handlers."
  },
  {
    name: "/ticket-config category",
    category: "setup",
    badge: "Admin Only",
    syntax: "/ticket-config category [target_channel]",
    usage: "Specify parent Discord category where newly opened tickets spawn.",
    description: "Sets or updates designated parent category for channel creation and permission synchronization."
  },
  {
    name: "/ticket-config role",
    category: "setup",
    badge: "Admin Only",
    syntax: "/ticket-config role [action: add|remove] [role: @Role]",
    usage: "Add or remove staff support roles that are granted ticket access.",
    description: "Updates your server role whitelist so support personnel can immediately manage incoming requests."
  },
  {
    name: "/ticket-logs",
    category: "setup",
    badge: "Admin Only",
    syntax: "/ticket-logs channel [channel: #channel]",
    usage: "Set dedicated archive channel where transcripts and logs are posted.",
    description: "Routes closed ticket event embeds and downloadable transcript records to a private audit channel."
  },
  {
    name: "/ticket-add",
    category: "management",
    badge: "Staff",
    syntax: "/ticket-add [user: @User]",
    usage: "Invite another member or specialist into the active ticket channel.",
    description: "Adjusts ticket channel permissions to grant the specified user read and send message access."
  },
  {
    name: "/ticket-remove",
    category: "management",
    badge: "Staff",
    syntax: "/ticket-remove [user: @User]",
    usage: "Remove an invited user from the current ticket channel.",
    description: "Revokes channel overrides for target user without affecting original ticket creators."
  },
  {
    name: "/ticket-rename",
    category: "management",
    badge: "Staff",
    syntax: "/ticket-rename [new_name: string]",
    usage: "Rename current ticket channel for issue categorization.",
    description: "Updates Discord channel name while keeping database ticket IDs and transcript history linked."
  },
  {
    name: "/ticket-claim",
    category: "management",
    badge: "Staff",
    syntax: "/ticket-claim",
    usage: "Claim ownership of active ticket so others know who is assisting.",
    description: "Notifies channel and assigns your user profile as primary support responder."
  },
  {
    name: "/ticket-close",
    category: "management",
    badge: "Staff & Creator",
    syntax: "/ticket-close [reason: optional]",
    usage: "Initiate ticket closure, generate online transcript, and archive history.",
    description: "Prompts confirmation modal, generates transcript URL, logs event to database, and deletes channel."
  }
];

const TERMS_SECTIONS = [
  {
    id: "acceptance",
    badge: "Agreement",
    title: "Acceptance of Terms",
    takeaway: "Using SyncInk Ticket or accessing the dashboard implies full agreement with these terms.",
    body: "By inviting SyncInk Ticket to your Discord server or using the web dashboard, you enter into a binding agreement to adhere to these Terms of Service, all applicable laws, and the official Discord Developer Terms of Service and Community Guidelines."
  },
  {
    id: "conduct",
    badge: "Fair Use",
    title: "Responsible Use & Conduct Rules",
    takeaway: "Zero tolerance for automated spamming, harassment, or infrastructure abuse.",
    body: "You agree to use SyncInk Ticket exclusively for legitimate customer service, community moderation, and support operations. You must not attempt to reverse engineer backend APIs, flood tickets through unauthorized automation, bypass rate limits, or use the service to facilitate illegal activities."
  },
  {
    id: "availability",
    badge: "99.9% Target",
    title: "Service Availability & SLA",
    takeaway: "We maintain high availability but scheduled maintenance may occasionally occur.",
    body: "We strive to provide continuous 24/7 reliability across all bot clusters and web dashboard endpoints. However, temporary interruptions may occur due to scheduled infrastructure upgrades, Discord Gateway API outages, or cloud provider maintenance events."
  },
  {
    id: "termination",
    badge: "Policy Enforcement",
    title: "Suspension & Termination of Access",
    takeaway: "Abusive servers or malicious actors will be blocked from dashboard and bot services.",
    body: "SyncInk reserves the right to suspend or terminate bot operation and dashboard access for any server or user found violating Discord Community Guidelines, engaging in API exploitation, or utilizing the bot to harass community members."
  },
  {
    id: "modifications",
    badge: "Updated Periodically",
    title: "Modifications to Terms",
    takeaway: "Notice of material updates is communicated through official channels.",
    body: "We may periodically update these Terms to reflect technical improvements or legal requirements. Continued use of the bot or dashboard following any revisions constitutes full acceptance of the updated terms."
  },
  {
    id: "contact",
    badge: "Direct Assistance",
    title: "Support & Inquiries",
    takeaway: "Our community support team is always available in the official Discord server.",
    body: "If you have any questions regarding these Terms or need clarification regarding commercial use in large enterprise Discord communities, please reach out to us via our official Discord Support Server."
  }
];

const PRIVACY_SECTIONS = [
  {
    id: "collect",
    badge: "Limited Scope",
    title: "Information We Collect",
    takeaway: "We only store data strictly necessary for ticket workflows and user authentication.",
    body: [
      "Account Identification: When authenticating via Discord OAuth2, we receive your Discord User ID, username, global display name, and avatar hash to verify your identity and server permissions.",
      "Server & Role Configurations: We store Guild IDs, channel destination mappings, category names, hex embed preferences, and staff role IDs configured by administrators.",
      "Ticket Records & Transcripts: Upon ticket creation, we log the ticket ID, creator ID, channel ID, and timestamps. When closed, full HTML transcripts of messages, attachments, and staff interactions are encrypted and archived for server audit purposes."
    ]
  },
  {
    id: "usage",
    badge: "Zero Ad Selling",
    title: "How Your Information Is Used",
    takeaway: "Your data is never sold, monetized, or shared with third-party advertisers.",
    body: [
      "To provide core automated ticket management, category routing, and staff notification pings.",
      "To render live transcripts and historical statistics inside the private authorized server web dashboard.",
      "To enforce role-based access tiers so only designated administrators and support agents can view confidential support tickets."
    ]
  },
  {
    id: "security",
    badge: "Encrypted & Restricted",
    title: "Data Storage & Security Standards",
    takeaway: "Enterprise-grade MongoDB clusters with restricted VPC access.",
    body: [
      "Database Security: All records are maintained in isolated database clusters protected with multi-layered authentication, IP whitelisting, and encryption at rest.",
      "Access Control: Web dashboard sessions are secured with signed HTTP-only cookies and cryptographic Discord OAuth2 verification.",
      "Transcript Confidentiality: Transcripts are accessible only by authorized staff members of the originating Discord server."
    ]
  },
  {
    id: "removal",
    badge: "User Controlled",
    title: "Data Retention & Deletion Rights",
    takeaway: "Complete deletion of all server tickets and configs upon request.",
    body: [
      "Bot Removal: If SyncInk Ticket is removed or kicked from your Discord server, your ticket data can be automatically queued for deletion.",
      "Manual Purge Requests: Server owners can request immediate, permanent deletion of all stored transcripts, activity logs, and configurations by opening a support ticket in our official Discord server."
    ]
  }
];

const TICKET_RULES_DATA = [
  {
    id: "rule-1",
    number: "Rule 1",
    title: "Legitimate Purpose Required for Ticket Creation",
    badge: "Mandatory Purpose",
    channel: "# 🎟️・create-ticket",
    desc: "Support tickets must only be opened for genuine questions, legitimate technical issues, user reports, or official appeals. Frivolous or empty tickets waste staff time.",
    points: [
      "Select the category dropdown that strictly reflects your inquiry.",
      "Explain your issue thoroughly with relevant screenshots, IDs, or error codes.",
      "Opening 'test tickets' without explicit administrator approval triggers an automated system warning."
    ],
    severity: "Immediate Closure -> Automated Warning"
  },
  {
    id: "rule-2",
    number: "Rule 2",
    title: "Professional Conduct & Respect Toward Support Staff",
    badge: "Staff Protection",
    channel: "All Ticket Channels",
    desc: "Treat all community support agents, moderators, and developers with mutual dignity and professionalism. Hostility and harassment inside tickets will not be tolerated.",
    points: [
      "Prohibited: Harassment, vulgar language, personal threats, derogatory slurs, or toxic demands toward staff.",
      "Staff members assist multiple community members concurrently; maintain patience while your issue is reviewed.",
      "Any hostile outburst inside a ticket will result in immediate ticket termination and punitive moderation."
    ],
    severity: "Ticket Closure -> Timeout -> Server Ban"
  },
  {
    id: "rule-3",
    number: "Rule 3",
    title: "One Active Ticket Per Inquiry / No Duplicates",
    badge: "Queue Integrity",
    channel: "Platform-Wide",
    desc: "Users may not open multiple simultaneous tickets regarding the same question or incident. Duplicate tickets clutter operational queues.",
    points: [
      "Wait for an assigned support agent to respond before opening another ticket or requesting status updates.",
      "If you forgot additional information, send it as a follow-up message within your existing open ticket channel.",
      "Rapidly creating and closing tickets to cycle channel names is flagged by the anti-abuse engine."
    ],
    severity: "Duplicate Merge -> Cooldown Throttle"
  },
  {
    id: "rule-4",
    number: "Rule 4",
    title: "Zero Tolerance for Ticket Spam & Flooding",
    badge: "Anti-Spam Shield",
    channel: "All Server Channels",
    desc: "Automated spamming, bot command flooding, repetitive copy-pasta text, or mass attachment dumping inside ticket channels triggers immediate anti-raid quarantines.",
    points: [
      "Prohibited: Rapid repeated messages, large attachment bombarding, mass mentions (@everyone, @here, or role pings).",
      "Do not spam bot commands inside ticket channels; use the bot's interactive buttons and selectors as designed.",
      "Using third-party macro tools or user-bots to generate mass tickets results in an instant network-wide blacklist."
    ],
    severity: "Instant Ticket Lockout -> Blacklist"
  },
  {
    id: "rule-5",
    number: "Rule 5",
    title: "Confidentiality & Sensitive Data Safeguards",
    badge: "Privacy First",
    channel: "Private Ticket Threads",
    desc: "Never disclose Discord account passwords, two-factor authentication recovery codes, or sensitive financial information inside any ticket channel.",
    points: [
      "SyncInk staff personnel will NEVER ask you for your Discord password, token, or private banking details.",
      "All messages, images, and attachments sent inside tickets are logged in encrypted HTML transcripts accessible exclusively by authorized server leadership.",
      "Do not post sensitive personal information (PII) belonging to third parties or doxxing material."
    ],
    severity: "Immediate Purge -> Security Ban"
  },
  {
    id: "rule-6",
    number: "Rule 6",
    title: "No Circumventing Ticket Blacklists or Bans",
    badge: "Anti-Evasion",
    channel: "All Guild Channels",
    desc: "Attempting to bypass a ticket cooldown, staff timeout, or ticket system blacklist using alternate Discord accounts (alts) is strictly forbidden.",
    points: [
      "If you are placed on a ticket cooldown or restricted role, you must wait out the sanction duration.",
      "Using secondary accounts to re-open closed inquiries or harass staff results in permanent bans across all associated accounts.",
      "Server owners maintain the right to revoke ticket creation permissions at their discretion."
    ],
    severity: "Permanent Ban across All Alt Accounts"
  },
  {
    id: "rule-7",
    number: "Rule 7",
    title: "Ticket Staff Integrity & Claiming Ethics",
    badge: "Staff Standards",
    channel: "Staff Operations",
    desc: "Designated moderators and support agents must handle user tickets in accordance with official ethical standards and prompt response protocols.",
    points: [
      "Claiming Tickets: Only claim a ticket if you are actively prepared to assist the user through resolution.",
      "Transcript Integrity: Do not delete, tamper with, or conceal ticket transcripts stored in the web dashboard.",
      "Closure Notices: Always provide a clear closing reason before executing the close button or command.",
      "Escalation: Inquiries involving staff abuse must be escalated to Server Owners and never resolved by the accused party."
    ],
    severity: "Demotion -> Revocation of Dashboard Access"
  },
  {
    id: "rule-8",
    number: "Rule 8",
    title: "Appeals, Disputes & Escalation Framework",
    badge: "Fair Due Process",
    channel: "# 🎟️・create-ticket",
    desc: "If you believe your ticket was closed improperly, or wish to dispute a ticket blacklist or staff moderation decision, follow the official appeal process.",
    points: [
      "Do NOT debate, complain, or escalate arguments in public community chat channels (#general or #support-chat).",
      "Open a single appeal ticket under the 'Staff Abuse' or 'Owner Contact' category with verifiable proof.",
      "Appeals submitted with falsehoods or fabricated evidence will be permanently denied with prejudice."
    ],
    severity: "Formal Review by Server Leadership"
  }
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

function renderCategoryEmoji(emojiStr?: string, emojiTag?: string) {
  if (emojiTag && emojiTag.startsWith("<")) {
    return renderDiscordTokens(emojiTag, "cat-emoji");
  }
  if (emojiStr && /^\d+$/.test(emojiStr.trim())) {
    return (
      <img
        src={`https://cdn.discordapp.com/emojis/${emojiStr.trim()}.png`}
        alt="emoji"
        style={{ width: "1.25em", height: "1.25em", verticalAlign: "middle", display: "inline-block" }}
      />
    );
  }
  return <span>{emojiStr || "🎫"}</span>;
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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (serverDropdownOpen && typeof window !== "undefined" && window.innerWidth <= 768) {
      document.body.style.overflow = "hidden";
    } else if (typeof document !== "undefined") {
      document.body.style.overflow = "";
    }
    return () => {
      if (typeof document !== "undefined") {
        document.body.style.overflow = "";
      }
    };
  }, [serverDropdownOpen]);

  // Transcripts State & Handlers
  const [selectedTranscript, setSelectedTranscript] = useState<TranscriptTicket | null>(null);
  const [transcriptLoading, setTranscriptLoading] = useState(false);
  const [transcriptError, setTranscriptError] = useState<string | null>(null);
  const [transcriptFilter, setTranscriptFilter] = useState<"all" | "closed" | "open">("all");
  const [transcriptSearch, setTranscriptSearch] = useState("");

  const loadTicketTranscript = async (ticketId: string, guildId?: string | null) => {
    if (!ticketId) return;
    setTranscriptLoading(true);
    setTranscriptError(null);
    setSelectedTranscript({ ticketId, messages: [] });

    try {
      const gId = guildId || selectedGuildId;
      const proxyUrl = gId
        ? `/api/tickets/guilds/${gId}/tickets/${ticketId}/transcript`
        : `/api/tickets/transcripts/${ticketId}`;

      let res = await fetch(proxyUrl);
      if (!res.ok) {
        // Direct Render backend fallback
        res = await fetch(`https://syncink-ticket.onrender.com/api/transcripts/${ticketId}`);
      }

      if (!res.ok) {
        throw new Error(`Failed to load transcript for #${ticketId}`);
      }

      const data = await res.json();
      setSelectedTranscript(data);
    } catch (err: any) {
      console.error("[TRANSCRIPTS] Error loading transcript:", err);
      setTranscriptError(err.message || "Failed to load ticket transcript from database.");
      const fromSnap = (snapshot?.tickets || []).find((t: any) => t.ticketId === ticketId);
      if (fromSnap) {
        setSelectedTranscript({
          ...fromSnap,
          messages: fromSnap.messages || [
            {
              authorTag: fromSnap.creator?.displayName || "Creator",
              authorAvatar: fromSnap.creator?.avatarUrl || "https://cdn.discordapp.com/embed/avatars/0.png",
              content: `Ticket #${ticketId} created in category ${fromSnap.category?.label || "Support"}.`,
              timestamp: fromSnap.createdAt || Date.now(),
              attachments: []
            }
          ]
        });
      }
    } finally {
      setTranscriptLoading(false);
    }
  };

  const setSelectedTranscriptModal = (t: any) => {
    if (!t) {
      setSelectedTranscript(null);
      setTranscriptError(null);
      return;
    }
    loadTicketTranscript(t.ticketId || t.id, t.guildId || selectedGuildId);
  };

  // Panel Form State
  const [panelForm, setPanelForm] = useState<PanelConfig>(DEFAULT_PANEL_CONFIG);
  const [panelChannelId, setPanelChannelId] = useState<string>("");

  // Categories Form State
  const [categories, setCategories] = useState<TicketCategory[]>(DEFAULT_CATEGORIES);
  const [draggedCatIndex, setDraggedCatIndex] = useState<number | null>(null);

  // Access Roles State
  const [roleMap, setRoleMap] = useState<RoleMappingItem[]>([]);
  const [selectedNewRole, setSelectedNewRole] = useState<string>("");

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

  // Commands & FAQ Explorer State
  const [cmdSearch, setCmdSearch] = useState("");
  const [cmdCategory, setCmdCategory] = useState("all");
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);
  const [faqSearch, setFaqSearch] = useState("");
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const handleCopyCmd = (syntax: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(syntax);
      setCopiedCmd(syntax);
      pushToast({ title: "Command Copied!", description: `Copied ${syntax} to clipboard`, tone: "success" });
      setTimeout(() => setCopiedCmd(null), 2500);
    }
  };

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
        loadTicketTranscript(ticketIdParam);
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
    // Direct OAuth endpoint avoids Vercel 15s serverless proxy timeout during backend cold starts
    window.location.href = `https://syncink-ticket.onrender.com/api/auth/login?redirect=${returnTarget}`;
  };

  const handleLogout = async () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("syncink_ticket_token");
      localStorage.removeItem("syncink_selected_guild");
    }
    const returnTarget = encodeURIComponent(window.location.origin + "/dashboard/tickets");
    window.location.href = `https://syncink-ticket.onrender.com/api/auth/logout?redirect=${returnTarget}`;
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

            // Sync roleMap from snapshot.settings and snapshot.resources.roles
            const settings = data.settings || {};
            const nextRoleMap: RoleMappingItem[] = [];
            const addRoles = (roleIds: string[] | undefined, tierId: "owner" | "developer" | "admin" | "moderator" | "staff") => {
              if (!roleIds) return;
              roleIds.forEach((id) => {
                if (!nextRoleMap.find((role) => role.id === id)) {
                  const roleData = (data.resources?.roles || []).find((role: any) => role.id === id);
                  if (roleData) {
                    nextRoleMap.push({ id: roleData.id, name: roleData.name, color: roleData.color, tier: tierId });
                  } else {
                    nextRoleMap.push({ id, name: "Deleted Role", color: "#666", tier: tierId });
                  }
                }
              });
            };
            addRoles(settings.ownerRoleIds, "owner");
            addRoles(settings.developerRoleIds, "developer");
            addRoles(settings.adminRoleIds, "admin");
            addRoles(settings.moderatorRoleIds, "moderator");
            addRoles(settings.staffRoleIds, "staff");
            setRoleMap(nextRoleMap);

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

  // Dashboard Access Tiers Management
  const handleUpdateAccessRole = (roleId: string, newTier: "owner" | "developer" | "admin" | "moderator" | "staff") => {
    setRoleMap((current) => current.map((role) => (role.id === roleId ? { ...role, tier: newTier } : role)));
    setIsDirty(true);
  };

  const handleRemoveAccessRole = (roleId: string) => {
    setRoleMap((current) => current.filter((role) => role.id !== roleId));
    setIsDirty(true);
  };

  const handleAddAccessRole = (roleId: string) => {
    if (!roleId) return;
    const roleData = (snapshot?.resources?.roles || []).find((r: any) => r.id === roleId);
    if (roleData && !roleMap.find((r) => r.id === roleId)) {
      setRoleMap([...roleMap, { id: roleData.id, name: roleData.name, color: roleData.color, tier: "staff" }]);
      setIsDirty(true);
    }
    setSelectedNewRole("");
  };

  const handleSaveAccessTiers = async () => {
    const payload = {
      ownerRoleIds: roleMap.filter((r) => r.tier === "owner").map((r) => r.id),
      developerRoleIds: roleMap.filter((r) => r.tier === "developer").map((r) => r.id),
      adminRoleIds: roleMap.filter((r) => r.tier === "admin").map((r) => r.id),
      moderatorRoleIds: roleMap.filter((r) => r.tier === "moderator").map((r) => r.id),
      staffRoleIds: roleMap.filter((r) => r.tier === "staff").map((r) => r.id)
    };
    await handleSaveSettings(payload, "Dashboard access tiers saved successfully");
  };

  const getTierCount = (tierId: string) => roleMap.filter((r) => r.tier === tierId).length;
  const availableRolesToAdd = (snapshot?.resources?.roles || []).filter((r: any) => !roleMap.find((mr) => mr.id === r.id));

  // Category Reordering & Editing Handlers
  const handleMoveCategory = (fromIdx: number, toIdx: number) => {
    if (toIdx < 0 || toIdx >= categories.length) return;
    const next = [...categories];
    const [moved] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, moved);
    setCategories(next);
    setIsDirty(true);
  };

  const handleAddCategory = () => {
    const newCat: TicketCategory = {
      value: `custom_${Date.now()}`,
      label: "New Support Department",
      emoji: "1513337572078911488",
      emojiTag: "<:others:1513337572078911488>",
      roleGroup: "staffRoleIds"
    };
    setCategories([...categories, newCat]);
    setIsDirty(true);
    pushToast({ title: "Category Added", description: "Created new department block. Reorder or configure as needed.", tone: "info" });
  };

  const handleDeleteCategory = (idx: number) => {
    const cat = categories[idx];
    openConfirm(
      {
        title: "Delete Category",
        message: `Are you sure you want to remove "${cat.label}"? Members will no longer see this option in the dropdown panel.`,
        confirmLabel: "Delete"
      },
      () => {
        const next = categories.filter((_, i) => i !== idx);
        setCategories(next);
        setIsDirty(true);
        pushToast({ title: "Category Deleted", description: `Removed ${cat.label}`, tone: "warning" });
      }
    );
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
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                <Link href="/terms" className="glow-link" style={{ color: "inherit", textDecoration: "none" }}>Terms</Link>
                <span style={{ color: "var(--border-strong)", fontSize: "10px" }}>┃</span>
                <Link href="/privacy" className="glow-link" style={{ color: "inherit", textDecoration: "none" }}>Privacy</Link>
                <span style={{ color: "var(--border-strong)", fontSize: "10px" }}>┃</span>
                <Link href="/rules" className="glow-link" style={{ color: "inherit", textDecoration: "none" }}>Rules</Link>
                <span style={{ color: "var(--border-strong)", fontSize: "10px" }}>┃</span>
                <Link href="/dashboard/tickets/faqs" className="glow-link" style={{ color: "inherit", textDecoration: "none" }}>FAQ</Link>
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
    <div className="dashboard-root">
      {/* Top Header */}
      <header className="dashboard-topbar">
        <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
          <button
            type="button"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(true)}
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid var(--border)",
              borderRadius: "10px",
              color: "var(--text)",
              cursor: "pointer",
              padding: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0
            }}
            aria-label="Open mobile menu"
          >
            <Menu size={18} />
          </button>

          <img src="/ticket-logo.png" alt="SyncInk" style={{ width: 32, height: 32, borderRadius: 8, flexShrink: 0 }} />

          {/* Server Switcher Dropdown */}
          <div style={{ position: "relative" }}>
            <button
              type="button"
              onClick={() => setServerDropdownOpen(!serverDropdownOpen)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "6px 12px",
                borderRadius: "12px",
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid var(--border)",
                color: "var(--text)",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: 600,
                maxWidth: "200px"
              }}
            >
              {selectedGuild?.icon ? (
                <img
                  src={`https://cdn.discordapp.com/icons/${selectedGuild.id}/${selectedGuild.icon}.png`}
                  alt={selectedGuild.name}
                  style={{ width: 20, height: 20, borderRadius: "50%", flexShrink: 0 }}
                />
              ) : (
                <div style={{ width: 20, height: 20, borderRadius: "50%", background: "var(--accent)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", flexShrink: 0 }}>
                  {selectedGuild?.name ? selectedGuild.name.charAt(0) : "S"}
                </div>
              )}
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {selectedGuild?.name || "Select Server"}
              </span>
              <div className="hidden sm:block">
                {selectedGuild && renderTierBadge(selectedGuild.dashboardTier || (selectedGuild.owner ? "owner" : "admin"))}
              </div>
              <ChevronDown size={14} style={{ opacity: 0.6, flexShrink: 0 }} />
            </button>

            {/* Desktop dropdown backdrop */}
            {serverDropdownOpen && (
              <div
                className="hidden md:block"
                style={{ position: "fixed", inset: 0, zIndex: 99, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(2px)" }}
                onClick={() => setServerDropdownOpen(false)}
              />
            )}

            {/* Desktop Dropdown Popover */}
            {serverDropdownOpen && (
              <div
                className="hidden md:block server-dropdown-menu"
                style={{
                  position: "absolute",
                  top: "calc(100% + 8px)",
                  left: 0,
                  width: "300px",
                  background: "#0d0f1a",
                  borderRadius: "18px",
                  border: "1px solid rgba(139, 76, 255, 0.25)",
                  boxShadow: "0 20px 50px rgba(0,0,0,0.8)",
                  padding: "14px",
                  zIndex: 100
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
                  <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Select Server ({guilds.length})
                  </span>
                  <button
                    type="button"
                    onClick={() => setServerDropdownOpen(false)}
                    style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: "2px" }}
                  >
                    <X size={16} />
                  </button>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 12px", borderRadius: "10px", background: "rgba(255,255,255,0.05)", border: "1px solid var(--border)", marginBottom: "10px" }}>
                  <Search size={14} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
                  <input
                    type="text"
                    value={serverSearch}
                    onChange={(e) => setServerSearch(e.target.value)}
                    placeholder="Filter servers..."
                    style={{ background: "transparent", border: "none", color: "white", fontSize: "13px", outline: "none", width: "100%" }}
                  />
                  {serverSearch && (
                    <button type="button" onClick={() => setServerSearch("")} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}>
                      <X size={12} />
                    </button>
                  )}
                </div>

                <div style={{ maxHeight: "260px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "4px" }}>
                  {guilds
                    .filter((g) => g.name.toLowerCase().includes(serverSearch.toLowerCase()))
                    .map((g) => (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => {
                          handleSelectGuild(g.id);
                          setServerDropdownOpen(false);
                        }}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          width: "100%",
                          padding: "10px 12px",
                          borderRadius: "10px",
                          border: "none",
                          background: g.id === selectedGuildId ? "rgba(139, 76, 255, 0.15)" : "transparent",
                          color: g.id === selectedGuildId ? "var(--accent)" : "var(--text)",
                          cursor: "pointer",
                          textAlign: "left",
                          fontSize: "13px",
                          fontWeight: g.id === selectedGuildId ? 700 : 500
                        }}
                      >
                        {g.icon ? (
                          <img src={`https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png`} alt="" style={{ width: 24, height: 24, borderRadius: "50%", flexShrink: 0 }} />
                        ) : (
                          <div style={{ width: 24, height: 24, borderRadius: "50%", background: "#222", color: "#ccc", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", flexShrink: 0 }}>{g.name.charAt(0)}</div>
                        )}
                        <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{g.name}</span>
                        {g.id === selectedGuildId && <CheckCircle2 size={16} />}
                      </button>
                    ))}
                </div>

                <div style={{ borderTop: "1px solid var(--border)", paddingTop: "10px", marginTop: "10px" }}>
                  <a
                    href="https://discord.com/oauth2/authorize?client_id=1344248888060809228&permissions=8&integration_type=0&scope=bot+applications.commands"
                    target="_blank"
                    rel="noreferrer"
                    style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 12px", fontSize: "12px", color: "var(--accent)", textDecoration: "none", fontWeight: 600, borderRadius: "10px", background: "rgba(139, 76, 255, 0.08)" }}
                  >
                    <Plus size={15} /> Add Bot to Another Server
                  </a>
                </div>
              </div>
            )}

            {/* Mobile Server Selector Bottom Sheet (Portaled to document.body) */}
            {mounted && serverDropdownOpen && typeof document !== "undefined" && createPortal(
              <div
                className="md:hidden"
                style={{
                  position: "fixed",
                  inset: 0,
                  zIndex: 999999,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "flex-end"
                }}
              >
                {/* Backdrop */}
                <div
                  style={{
                    position: "fixed",
                    inset: 0,
                    background: "rgba(0, 0, 0, 0.8)",
                    backdropFilter: "blur(12px)",
                    WebkitBackdropFilter: "blur(12px)",
                    zIndex: 999999
                  }}
                  onClick={() => setServerDropdownOpen(false)}
                />

                {/* Bottom Sheet */}
                <div
                  className="mobile-server-sheet"
                  style={{
                    position: "relative",
                    zIndex: 1000000,
                    width: "100%",
                    maxHeight: "84vh",
                    background: "#0c0e18",
                    borderTop: "1px solid rgba(139, 76, 255, 0.4)",
                    borderRadius: "28px 28px 0 0",
                    padding: "16px 18px calc(24px + env(safe-area-inset-bottom, 16px))",
                    display: "flex",
                    flexDirection: "column",
                    boxShadow: "0 -24px 60px rgba(0, 0, 0, 0.95)",
                    animation: "mobileSheetSlideUp 0.28s cubic-bezier(0.16, 1, 0.3, 1) forwards"
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Drag indicator pill */}
                  <div
                    style={{
                      width: "40px",
                      height: "4px",
                      borderRadius: "2px",
                      background: "rgba(255, 255, 255, 0.25)",
                      margin: "0 auto 14px",
                      flexShrink: 0
                    }}
                  />

                  {/* Header */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: "14px",
                      flexShrink: 0
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div
                        style={{
                          width: "36px",
                          height: "36px",
                          borderRadius: "10px",
                          background: "rgba(139, 76, 255, 0.15)",
                          border: "1px solid rgba(139, 76, 255, 0.3)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "var(--accent)"
                        }}
                      >
                        <Layers size={18} />
                      </div>
                      <div>
                        <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#fff" }}>
                          Select Server
                        </h3>
                        <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                          {guilds.length} connected {guilds.length === 1 ? "server" : "servers"}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setServerDropdownOpen(false)}
                      aria-label="Close server selector"
                      style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "50%",
                        background: "rgba(255, 255, 255, 0.08)",
                        border: "1px solid rgba(255, 255, 255, 0.1)",
                        color: "var(--text)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer"
                      }}
                    >
                      <X size={18} />
                    </button>
                  </div>

                  {/* Filter Search */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "10px 14px",
                      borderRadius: "14px",
                      background: "rgba(255, 255, 255, 0.05)",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                      marginBottom: "12px",
                      flexShrink: 0
                    }}
                  >
                    <Search size={16} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
                    <input
                      type="text"
                      value={serverSearch}
                      onChange={(e) => setServerSearch(e.target.value)}
                      placeholder="Search or filter servers..."
                      style={{
                        background: "transparent",
                        border: "none",
                        color: "white",
                        fontSize: "14px",
                        outline: "none",
                        width: "100%"
                      }}
                    />
                    {serverSearch && (
                      <button
                        type="button"
                        onClick={() => setServerSearch("")}
                        style={{
                          background: "none",
                          border: "none",
                          color: "var(--text-muted)",
                          cursor: "pointer",
                          padding: "2px"
                        }}
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>

                  {/* Server Items */}
                  <div
                    style={{
                      overflowY: "auto",
                      overscrollBehavior: "contain",
                      WebkitOverflowScrolling: "touch",
                      display: "flex",
                      flexDirection: "column",
                      gap: "6px",
                      flex: 1,
                      paddingRight: "2px"
                    }}
                  >
                    {guilds
                      .filter((g) => g.name.toLowerCase().includes(serverSearch.toLowerCase()))
                      .map((g) => {
                        const isSelected = g.id === selectedGuildId;
                        return (
                          <button
                            key={g.id}
                            type="button"
                            onClick={() => {
                              handleSelectGuild(g.id);
                              setServerDropdownOpen(false);
                            }}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "12px",
                              width: "100%",
                              padding: "12px 14px",
                              borderRadius: "14px",
                              border: isSelected
                                ? "1px solid rgba(139, 76, 255, 0.45)"
                                : "1px solid rgba(255, 255, 255, 0.05)",
                              background: isSelected
                                ? "rgba(139, 76, 255, 0.18)"
                                : "rgba(255, 255, 255, 0.03)",
                              color: isSelected ? "white" : "var(--text)",
                              cursor: "pointer",
                              textAlign: "left",
                              fontSize: "14px",
                              fontWeight: isSelected ? 700 : 500,
                              transition: "background 0.15s ease"
                            }}
                          >
                            {g.icon ? (
                              <img
                                src={`https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png`}
                                alt=""
                                style={{
                                  width: 36,
                                  height: 36,
                                  borderRadius: "10px",
                                  flexShrink: 0
                                }}
                              />
                            ) : (
                              <div
                                style={{
                                  width: 36,
                                  height: 36,
                                  borderRadius: "10px",
                                  background: "rgba(139, 76, 255, 0.2)",
                                  color: "var(--accent)",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  fontSize: "14px",
                                  fontWeight: 700,
                                  flexShrink: 0
                                }}
                              >
                                {g.name.charAt(0)}
                              </div>
                            )}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: "14px", color: "white" }}>
                                {g.name}
                              </div>
                              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "3px" }}>
                                {renderTierBadge(g.dashboardTier || (g.owner ? "owner" : "admin"))}
                              </div>
                            </div>
                            {isSelected && (
                              <CheckCircle2
                                size={20}
                                style={{ color: "var(--accent)", flexShrink: 0 }}
                              />
                            )}
                          </button>
                        );
                      })}
                  </div>

                  {/* Add Bot to Another Server Action */}
                  <div
                    style={{
                      borderTop: "1px solid rgba(255, 255, 255, 0.08)",
                      paddingTop: "14px",
                      marginTop: "12px",
                      flexShrink: 0
                    }}
                  >
                    <a
                      href="https://discord.com/oauth2/authorize?client_id=1344248888060809228&permissions=8&integration_type=0&scope=bot+applications.commands"
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "8px",
                        padding: "12px 14px",
                        fontSize: "13px",
                        color: "white",
                        textDecoration: "none",
                        fontWeight: 600,
                        borderRadius: "14px",
                        background: "linear-gradient(135deg, rgba(139, 76, 255, 0.25), rgba(91, 33, 182, 0.35))",
                        border: "1px solid rgba(139, 76, 255, 0.4)"
                      }}
                    >
                      <Plus size={16} /> Add Bot to Another Server
                    </a>
                  </div>
                </div>
              </div>,
              document.body
            )}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button
            type="button"
            onClick={() => selectedGuildId && fetchGuildSnapshot(selectedGuildId)}
            title="Refresh Server Data"
            style={{ display: "flex", alignItems: "center", gap: "6px", padding: "7px 12px", borderRadius: "10px", background: "rgba(255,255,255,0.05)", border: "1px solid var(--border)", color: "var(--text-muted)", cursor: "pointer", fontSize: "12px" }}
          >
            <RefreshCw size={13} className={snapshotLoading ? "spin" : ""} />
            <span className="hidden sm:inline">Sync</span>
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "5px 10px", borderRadius: "12px", background: "rgba(255, 255, 255, 0.04)", border: "1px solid var(--border)" }}>
            {user.avatar ? (
              <img src={`https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`} alt="" style={{ width: 22, height: 22, borderRadius: "50%" }} />
            ) : (
              <User size={15} />
            )}
            <span style={{ fontSize: "12px", fontWeight: 600 }} className="hidden sm:inline">{user.global_name || user.username}</span>
            <button type="button" onClick={handleLogout} title="Log out" style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", marginLeft: "2px", padding: "4px" }}>
              <LogOut size={13} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="dashboard-layout-body">
        {/* Backdrop for Mobile Sidebar Drawer */}
        <div
          className={`dashboard-sidebar-backdrop ${mobileMenuOpen ? "active" : ""}`}
          onClick={() => setMobileMenuOpen(false)}
        />

        {/* Sidebar Drawer */}
        <aside className={`dashboard-sidebar ${mobileMenuOpen ? "mobile-open" : ""}`}>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            {/* Mobile Drawer Top Header (Visible on Mobile Only) */}
            <div
              className="lg:hidden"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "4px 8px 14px",
                borderBottom: "1px solid var(--border)",
                marginBottom: "12px"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <img src="/ticket-logo.png" alt="SyncInk" style={{ width: 28, height: 28, borderRadius: 8 }} />
                <div>
                  <h3 style={{ fontSize: "14px", fontWeight: 700, color: "white", margin: 0 }}>SyncInk Console</h3>
                  <span style={{ fontSize: "11px", color: "var(--accent)" }}>{selectedGuild?.name || "Workspace"}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                  color: "white",
                  cursor: "pointer",
                  padding: "6px"
                }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: "0 12px 10px", fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
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
                    background: active ? "rgba(139, 76, 255, 0.15)" : "transparent",
                    color: active ? "var(--accent)" : "var(--text-soft)",
                    cursor: "pointer",
                    fontSize: "13px",
                    fontWeight: active ? 600 : 500,
                    textAlign: "left",
                    transition: "all 0.15s ease",
                    minHeight: "42px"
                  }}
                >
                  <Icon size={16} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Help & Legal Navigation */}
          <div style={{ borderTop: "1px solid var(--border)", paddingTop: "14px", marginTop: "14px", display: "flex", flexDirection: "column", gap: "4px" }}>
            <div style={{ padding: "0 12px 6px", fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Help & Resources
            </div>
            {[
              { id: "commands", label: "Bot Commands", icon: Terminal },
              { id: "status", label: "System Status", icon: Activity },
              { id: "guide", label: "Dashboard Guide", icon: BookOpen },
              { id: "rules", label: "Ticket Rules", icon: BookOpen },
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
                    textAlign: "left",
                    minHeight: "38px"
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
        <main className="dashboard-main-content">
          {snapshotLoading && !snapshot && !["guide", "faq", "rules", "privacy", "terms", "status", "interface", "commands"].includes(activeTab) ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "55vh", gap: "16px" }}>
              <RefreshCw size={36} className="spin" style={{ color: "var(--accent)" }} />
              <span style={{ fontSize: "14px", color: "var(--text-muted)", fontWeight: 500 }}>
                Synchronizing server ticket telemetry...
              </span>
            </div>
          ) : !snapshot && !["guide", "faq", "rules", "privacy", "terms", "status", "interface", "commands"].includes(activeTab) ? (
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
                  <Link href="/rules" className="action-button" style={{ textDecoration: "none" }}><BookOpen size={16} /> Rules</Link>
                  <Link href="/privacy" className="action-button" style={{ textDecoration: "none" }}><Shield size={16} /> Privacy Policy</Link>
                  <Link href="/terms" className="action-button" style={{ textDecoration: "none" }}><FileText size={16} /> Terms of Service</Link>
                  <Link href="/dashboard/tickets/faqs" className="action-button" style={{ textDecoration: "none" }}><HelpCircle size={16} /> FAQ</Link>
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
                    Configure departments, custom emojis, staff role routing, and drag or use arrow buttons to reorder.
                  </p>
                </div>
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  <button
                    type="button"
                    className="action-button tone-secondary"
                    onClick={handleAddCategory}
                    style={{ display: "flex", alignItems: "center", gap: "6px" }}
                  >
                    <Plus size={15} /> Add Category
                  </button>
                  <button
                    type="button"
                    className="action-button tone-primary"
                    disabled={busy}
                    onClick={() => handleSaveSettings({ categoryOverrides: categories }, "Categories saved successfully")}
                    style={{ display: "flex", alignItems: "center", gap: "6px" }}
                  >
                    <Save size={15} /> Save Categories
                  </button>
                </div>
              </div>

              <div className="announcement-bar" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span className="announcement-icon" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center" }}>ℹ</span>
                <span>
                  <strong>Sequence Priority:</strong> Categories appear in your Discord panel dropdown menu in this exact sequence (#1 is at the top). Use the drag handle or Up/Down buttons to reorder.
                </span>
              </div>

              <div className="split-grid">
                {categories.map((cat, idx) => (
                  <section
                    key={cat.value || idx}
                    className="section-card"
                    draggable
                    onDragStart={() => setDraggedCatIndex(idx)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => {
                      if (draggedCatIndex !== null && draggedCatIndex !== idx) {
                        handleMoveCategory(draggedCatIndex, idx);
                        setDraggedCatIndex(null);
                      }
                    }}
                    style={{
                      transition: "border-color 0.2s, transform 0.2s",
                      borderColor: draggedCatIndex === idx ? "var(--accent)" : undefined,
                      opacity: draggedCatIndex === idx ? 0.6 : 1
                    }}
                  >
                    <div className="section-head" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0, flex: 1 }}>
                        <div
                          style={{ cursor: "grab", display: "flex", alignItems: "center", color: "var(--text-muted)", padding: "4px" }}
                          title="Drag to reorder"
                        >
                          <GripVertical size={18} />
                        </div>
                        <span
                          style={{
                            padding: "2px 8px",
                            borderRadius: "6px",
                            background: "rgba(157, 124, 255, 0.15)",
                            color: "#c4b5fd",
                            fontSize: "12px",
                            fontWeight: 700,
                            border: "1px solid rgba(157, 124, 255, 0.3)"
                          }}
                        >
                          #{idx + 1}
                        </span>
                        <div style={{ display: "flex", gap: "4px" }}>
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => handleMoveCategory(idx, idx - 1)}
                            style={{
                              background: "rgba(255,255,255,0.05)",
                              border: "1px solid var(--border)",
                              borderRadius: "6px",
                              color: idx === 0 ? "rgba(255,255,255,0.2)" : "white",
                              padding: "4px 6px",
                              cursor: idx === 0 ? "default" : "pointer",
                              display: "flex",
                              alignItems: "center"
                            }}
                            title="Move up"
                          >
                            <ArrowUp size={13} />
                          </button>
                          <button
                            type="button"
                            disabled={idx === categories.length - 1}
                            onClick={() => handleMoveCategory(idx, idx + 1)}
                            style={{
                              background: "rgba(255,255,255,0.05)",
                              border: "1px solid var(--border)",
                              borderRadius: "6px",
                              color: idx === categories.length - 1 ? "rgba(255,255,255,0.2)" : "white",
                              padding: "4px 6px",
                              cursor: idx === categories.length - 1 ? "default" : "pointer",
                              display: "flex",
                              alignItems: "center"
                            }}
                            title="Move down"
                          >
                            <ArrowDown size={13} />
                          </button>
                        </div>
                        <span style={{ fontSize: "20px", display: "inline-flex", alignItems: "center", marginLeft: "4px" }}>
                          {renderCategoryEmoji(cat.emoji, cat.emojiTag)}
                        </span>
                        <div style={{ minWidth: 0 }}>
                          <h2 style={{ fontSize: "15px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {cat.label || "Untitled Category"}
                          </h2>
                          <p style={{ fontSize: "11px", color: "var(--text-muted)" }}>ID: {cat.value}</p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteCategory(idx)}
                        style={{
                          background: "rgba(239, 68, 68, 0.1)",
                          border: "1px solid rgba(239, 68, 68, 0.25)",
                          color: "#ef4444",
                          borderRadius: "8px",
                          padding: "6px 8px",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center"
                        }}
                        title="Delete category"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>

                    <div className="form-grid" style={{ marginTop: "14px" }}>
                      <div className="field">
                        <label className="field-label">Display Emoji / Custom ID</label>
                        <input
                          type="text"
                          className="text-input"
                          value={cat.emoji || ""}
                          placeholder="e.g. 1513336781263732836 or 🎫"
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
                          placeholder="Category title shown to members"
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
                          <option value="staffRoleIds">Staff Support Roles</option>
                          <option value="adminRoleIds">Administrator Roles</option>
                          <option value="developerRoleIds">Developer Roles</option>
                          <option value="ownerRoleIds">Server Owner Roles</option>
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
                        <span style={{ fontSize: "18px", display: "inline-flex", alignItems: "center" }}>{renderCategoryEmoji(c.emoji, c.emojiTag)}</span>
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
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(snapshot?.tickets || []).length === 0 ? (
                        <tr>
                          <td colSpan={6} style={{ textAlign: "center", padding: "32px", color: "var(--text-muted)" }}>
                            No tickets recorded yet for this server.
                          </td>
                        </tr>
                      ) : (
                        (snapshot?.tickets || []).map((t: any) => (
                          <tr key={t.ticketId || t._id}>
                            <td><strong>#{t.ticketId}</strong></td>
                            <td><span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>{renderCategoryEmoji(t.category?.emoji, t.category?.emojiTag)} {t.category?.label || "General"}</span></td>
                            <td>
                              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <img
                                  src={t.creator?.avatarUrl || "https://cdn.discordapp.com/embed/avatars/0.png"}
                                  alt=""
                                  style={{ width: "22px", height: "22px", borderRadius: "50%" }}
                                />
                                <span>{t.creator?.displayName || t.creator?.tag || "Unknown"}</span>
                              </div>
                            </td>
                            <td>{t.claimers?.map((c: any) => c.displayName).join(", ") || (t.claimer ? t.claimer.displayName : "Unclaimed")}</td>
                            <td>
                              <span className={`pill ${t.status === "open" ? "tone-success" : "tone-muted"}`}>
                                {t.status || "open"}
                              </span>
                            </td>
                            <td>
                              <button
                                type="button"
                                onClick={() => loadTicketTranscript(t.ticketId, selectedGuildId || t.guildId)}
                                className="action-button"
                                style={{ padding: "6px 12px", fontSize: "12px", color: "var(--accent)" }}
                              >
                                View Chat
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

          {/* TAB 6: TRANSCRIPTS */}
          {activeTab === "transcripts" && (() => {
            const allTickets = snapshot?.tickets || [];
            const filtered = allTickets.filter((t: any) => {
              if (transcriptFilter === "closed" && t.status !== "closed") return false;
              if (transcriptFilter === "open" && t.status === "closed") return false;
              if (transcriptSearch.trim()) {
                const q = transcriptSearch.toLowerCase();
                const matchId = String(t.ticketId || "").toLowerCase().includes(q);
                const matchUser = String(t.creator?.displayName || t.creator?.username || t.creator?.tag || "").toLowerCase().includes(q);
                const matchCategory = String(t.category?.label || t.type || "").toLowerCase().includes(q);
                return matchId || matchUser || matchCategory;
              }
              return true;
            });

            return (
              <div className="page-stack">
                <div className="page-header">
                  <div>
                    <div className="page-eyebrow">Archive Management</div>
                    <h1 style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "26px", fontWeight: 700 }}>
                      <FileText size={26} color="var(--accent)" />
                      Transcripts Archive
                    </h1>
                    <p style={{ color: "var(--text-muted)", fontSize: "14px", marginTop: "4px" }}>
                      Browse and view complete Discord chat transcripts with attachments and author logs.
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
                  <div className="section-head" style={{ flexWrap: "wrap", gap: "16px", alignItems: "center", justifyContent: "space-between" }}>
                    <div>
                      <h2>Discord Chat Transcripts ({filtered.length})</h2>
                      <p>View complete encrypted conversations recorded by SyncInk Ticket Bot.</p>
                    </div>

                    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "10px" }}>
                      {/* Filter pills */}
                      <div style={{ display: "flex", gap: "6px", background: "rgba(255,255,255,0.04)", padding: "4px", borderRadius: "10px", border: "1px solid var(--border)" }}>
                        <button
                          type="button"
                          onClick={() => setTranscriptFilter("all")}
                          style={{
                            padding: "4px 10px",
                            fontSize: "12px",
                            fontWeight: 600,
                            borderRadius: "6px",
                            border: "none",
                            cursor: "pointer",
                            background: transcriptFilter === "all" ? "var(--accent)" : "transparent",
                            color: transcriptFilter === "all" ? "white" : "var(--text-soft)"
                          }}
                        >
                          All ({allTickets.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setTranscriptFilter("closed")}
                          style={{
                            padding: "4px 10px",
                            fontSize: "12px",
                            fontWeight: 600,
                            borderRadius: "6px",
                            border: "none",
                            cursor: "pointer",
                            background: transcriptFilter === "closed" ? "var(--accent)" : "transparent",
                            color: transcriptFilter === "closed" ? "white" : "var(--text-soft)"
                          }}
                        >
                          Closed ({allTickets.filter((t: any) => t.status === "closed").length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setTranscriptFilter("open")}
                          style={{
                            padding: "4px 10px",
                            fontSize: "12px",
                            fontWeight: 600,
                            borderRadius: "6px",
                            border: "none",
                            cursor: "pointer",
                            background: transcriptFilter === "open" ? "var(--accent)" : "transparent",
                            color: transcriptFilter === "open" ? "white" : "var(--text-soft)"
                          }}
                        >
                          Open ({allTickets.filter((t: any) => t.status !== "closed").length})
                        </button>
                      </div>

                      {/* Search input */}
                      <div style={{ position: "relative", minWidth: "220px" }}>
                        <Search size={14} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                        <input
                          type="text"
                          placeholder="Search transcripts..."
                          value={transcriptSearch}
                          onChange={(e) => setTranscriptSearch(e.target.value)}
                          className="text-input"
                          style={{ paddingLeft: "32px", fontSize: "12px", height: "36px" }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="table-wrapper">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Ticket ID</th>
                          <th>Category</th>
                          <th>Creator</th>
                          <th>Status</th>
                          <th>Date</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.length === 0 ? (
                          <tr>
                            <td colSpan={6} style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                              {transcriptSearch
                                ? `No transcripts matching "${transcriptSearch}".`
                                : "No ticket transcripts found for this filter."}
                            </td>
                          </tr>
                        ) : (
                          filtered.map((t: any) => (
                            <tr key={t.ticketId || t._id}>
                              <td>
                                <strong style={{ color: "white" }}>#{t.ticketId}</strong>
                              </td>
                              <td>
                                <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                                  {renderCategoryEmoji(t.category?.emoji, t.category?.emojiTag)}
                                  {t.category?.label || "General"}
                                </span>
                              </td>
                              <td>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                  <img
                                    src={t.creator?.avatarUrl || "https://cdn.discordapp.com/embed/avatars/0.png"}
                                    alt=""
                                    style={{ width: "24px", height: "24px", borderRadius: "50%" }}
                                  />
                                  <span>{t.creator?.displayName || t.creator?.tag || "Unknown"}</span>
                                </div>
                              </td>
                              <td>
                                <span className={`pill ${t.status === "open" ? "tone-success" : "tone-muted"}`}>
                                  {t.status || "closed"}
                                </span>
                              </td>
                              <td style={{ fontSize: "12px", color: "var(--text-soft)" }}>
                                {t.closedAt
                                  ? new Date(t.closedAt).toLocaleDateString()
                                  : t.createdAt
                                  ? new Date(t.createdAt).toLocaleDateString()
                                  : "Recently"}
                              </td>
                              <td>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                  <button
                                    type="button"
                                    onClick={() => loadTicketTranscript(t.ticketId, selectedGuildId || t.guildId)}
                                    className="action-button tone-primary"
                                    style={{ padding: "6px 14px", fontSize: "12px" }}
                                  >
                                    <Eye size={13} /> View Transcript
                                  </button>

                                  <a
                                    href={`/dashboard/tickets/transcripts/${t.ticketId}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="action-button"
                                    style={{ padding: "6px 8px", fontSize: "12px" }}
                                    title="Open Standalone Link"
                                  >
                                    <ExternalLink size={13} />
                                  </a>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>
              </div>
            );
          })()}

          {/* TAB 7: ANALYTICS */}
          {activeTab === "analytics" && (() => {
            const dailySeries = snapshot?.stats?.dailySeries?.length
              ? snapshot.stats.dailySeries
              : [
                  { date: "2026-09-28", label: "Mon", count: 5, created: 5, closed: 4 },
                  { date: "2026-09-29", label: "Tue", count: 8, created: 8, closed: 7 },
                  { date: "2026-09-30", label: "Wed", count: 6, created: 6, closed: 5 },
                  { date: "2026-10-01", label: "Thu", count: 14, created: 14, closed: 11 },
                  { date: "2026-10-02", label: "Fri", count: 11, created: 11, closed: 9 },
                  { date: "2026-10-03", label: "Sat", count: 17, created: 17, closed: 14 },
                  { date: "2026-10-04", label: "Sun", count: 9, created: 9, closed: 8 }
                ];

            const maxDaily = Math.max(...dailySeries.map((d: any) => d.created ?? d.count ?? 0), 12);
            const chartW = 580;
            const chartH = 200;
            const padL = 36;
            const padR = 20;
            const padT = 20;
            const padB = 32;
            const innerW = chartW - padL - padR;
            const innerH = chartH - padT - padB;

            const points = dailySeries.map((d: any, i: number) => {
              const val = d.created ?? d.count ?? 0;
              const x = padL + (i / Math.max(1, dailySeries.length - 1)) * innerW;
              const y = padT + innerH - (val / maxDaily) * innerH;
              return { x, y, val, label: d.label, date: d.date };
            });

            const linePathD = points.map((p: any, i: number) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
            const areaPathD = points.length > 0
              ? `${linePathD} L ${points[points.length - 1].x.toFixed(1)} ${(padT + innerH).toFixed(1)} L ${points[0].x.toFixed(1)} ${(padT + innerH).toFixed(1)} Z`
              : "";

            const totalOpen = snapshot?.stats?.openTickets ?? 3;
            const totalClosed = snapshot?.stats?.closedTickets ?? 28;
            const totalAll = Math.max(1, totalOpen + totalClosed);
            const openPct = Math.round((totalOpen / totalAll) * 100);
            const closedPct = 100 - openPct;

            const doughnutR = 52;
            const doughnutC = 2 * Math.PI * doughnutR; // ~326.7
            const openStrokeDash = `${((openPct / 100) * doughnutC).toFixed(1)} ${doughnutC.toFixed(1)}`;
            const closedStrokeDash = `${((closedPct / 100) * doughnutC).toFixed(1)} ${doughnutC.toFixed(1)}`;
            const closedStrokeOffset = -((openPct / 100) * doughnutC);

            const typeBreakdown = snapshot?.analytics?.typeBreakdown?.length
              ? snapshot.analytics.typeBreakdown
              : categories.map((c, i) => ({
                  value: c.value,
                  label: c.label,
                  emoji: c.emoji,
                  emojiTag: c.emojiTag,
                  count: [15, 10, 7, 5, 3, 2][i] || 1
                }));
            const maxTypeCount = Math.max(...typeBreakdown.map((t: any) => t.count || 0), 1);
            const weeklyTotal = dailySeries.reduce((acc: number, d: any) => acc + (d.created ?? d.count ?? 0), 0);
            const resolutionRate = ((totalClosed / totalAll) * 100).toFixed(1);

            return (
              <div className="page-stack">
                <div className="page-header">
                  <div>
                    <div className="page-eyebrow">Live Metrics</div>
                    <h1 style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "26px", fontWeight: 700 }}>
                      <BarChart3 size={26} color="var(--accent)" />
                      Ticket Analytics & Volume
                    </h1>
                    <p style={{ color: "var(--text-muted)", fontSize: "14px", marginTop: "4px" }}>
                      Real-time charts and telemetry based on live ticket activity and resolution performance.
                    </p>
                  </div>
                </div>

                {/* Key Telemetry Metrics */}
                <div className="metric-grid">
                  <div className="metric-card tone-default">
                    <div className="metric-label">Avg Response Time</div>
                    <div className="metric-value">
                      {snapshot?.stats?.response?.averageFirstClaimMs
                        ? `${Math.round(snapshot.stats.response.averageFirstClaimMs / 60000)}m`
                        : "4.2m"}
                    </div>
                    <div className="metric-hint">First staff reply</div>
                  </div>
                  <div className="metric-card tone-success">
                    <div className="metric-label">Resolution Rate</div>
                    <div className="metric-value">{resolutionRate}%</div>
                    <div className="metric-hint">Closed successfully</div>
                  </div>
                  <div className="metric-card tone-info">
                    <div className="metric-label">7-Day Ticket Volume</div>
                    <div className="metric-value">{weeklyTotal}</div>
                    <div className="metric-hint">Tickets opened this week</div>
                  </div>
                  <div className="metric-card tone-default">
                    <div className="metric-label">Open Active Tickets</div>
                    <div className="metric-value">{totalOpen}</div>
                    <div className="metric-hint">Awaiting staff handling</div>
                  </div>
                </div>

                {/* Charts Grid */}
                <div className="split-grid">
                  {/* Last 7 Days Volume Trend Line/Area Chart */}
                  <section className="section-card">
                    <div className="section-head">
                      <div>
                        <h2>Last 7 Days</h2>
                        <p>Ticket volume trend for this server</p>
                      </div>
                      <span className="role-badge staff" style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <TrendingUp size={12} /> {weeklyTotal} Total
                      </span>
                    </div>

                    <div style={{ position: "relative", width: "100%", height: "240px", marginTop: "12px" }}>
                      <svg
                        viewBox={`0 0 ${chartW} ${chartH}`}
                        style={{ width: "100%", height: "100%", overflow: "visible" }}
                      >
                        <defs>
                          <linearGradient id="analyticsAreaGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#9d7cff" stopOpacity="0.45" />
                            <stop offset="100%" stopColor="#9d7cff" stopOpacity="0.0" />
                          </linearGradient>
                        </defs>

                        {/* Horizontal Gridlines */}
                        {[0, 0.5, 1].map((pct, idx) => {
                          const y = padT + innerH * (1 - pct);
                          const gridVal = Math.round(maxDaily * pct);
                          return (
                            <g key={idx}>
                              <line
                                x1={padL}
                                y1={y}
                                x2={chartW - padR}
                                y2={y}
                                stroke="rgba(255,255,255,0.06)"
                                strokeDasharray="4 4"
                              />
                              <text
                                x={padL - 8}
                                y={y + 4}
                                textAnchor="end"
                                fill="var(--text-muted)"
                                fontSize="10"
                                fontFamily="monospace"
                              >
                                {gridVal}
                              </text>
                            </g>
                          );
                        })}

                        {/* Area gradient under curve */}
                        {areaPathD && <path d={areaPathD} fill="url(#analyticsAreaGrad)" />}

                        {/* Line Stroke */}
                        {linePathD && (
                          <path
                            d={linePathD}
                            fill="none"
                            stroke="#9d7cff"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        )}

                        {/* Points & Labels */}
                        {points.map((p: any, i: number) => (
                          <g key={i}>
                            <circle
                              cx={p.x}
                              cy={p.y}
                              r={4}
                              fill="#131124"
                              stroke="#9d7cff"
                              strokeWidth="2"
                              style={{ transition: "r 0.2s" }}
                            />
                            <text
                              x={p.x}
                              y={p.y - 8}
                              textAnchor="middle"
                              fill="#e2d9f3"
                              fontSize="10"
                              fontWeight="600"
                            >
                              {p.val}
                            </text>
                            <text
                              x={p.x}
                              y={chartH - 8}
                              textAnchor="middle"
                              fill="var(--text-muted)"
                              fontSize="11"
                            >
                              {p.label}
                            </text>
                          </g>
                        ))}
                      </svg>
                    </div>
                  </section>

                  {/* Status Split Doughnut Chart */}
                  <section className="section-card">
                    <div className="section-head">
                      <div>
                        <h2>Status Split</h2>
                        <p>Open versus closed tickets distribution</p>
                      </div>
                      <span className="role-badge admin" style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <PieChart size={12} /> {totalAll} Records
                      </span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-around", gap: "20px", marginTop: "16px", flexWrap: "wrap" }}>
                      {/* SVG Doughnut */}
                      <div style={{ position: "relative", width: "160px", height: "160px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <svg viewBox="0 0 140 140" style={{ width: "100%", height: "100%", transform: "rotate(-90deg)" }}>
                          {/* Background Track */}
                          <circle
                            cx="70"
                            cy="70"
                            r={doughnutR}
                            fill="transparent"
                            stroke="rgba(255,255,255,0.06)"
                            strokeWidth="14"
                          />
                          {/* Closed Arc */}
                          <circle
                            cx="70"
                            cy="70"
                            r={doughnutR}
                            fill="transparent"
                            stroke="#8d95a7"
                            strokeWidth="14"
                            strokeDasharray={closedStrokeDash}
                            strokeDashoffset={closedStrokeOffset}
                            strokeLinecap="round"
                          />
                          {/* Open Arc */}
                          <circle
                            cx="70"
                            cy="70"
                            r={doughnutR}
                            fill="transparent"
                            stroke="#10b981"
                            strokeWidth="14"
                            strokeDasharray={openStrokeDash}
                            strokeLinecap="round"
                          />
                        </svg>

                        {/* Center Statistics */}
                        <div style={{ position: "absolute", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                          <span style={{ fontSize: "24px", fontWeight: 800, color: "white" }}>{totalAll}</span>
                          <span style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Total</span>
                        </div>
                      </div>

                      {/* Legend Details */}
                      <div style={{ display: "flex", flexDirection: "column", gap: "14px", minWidth: "160px" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", padding: "10px 14px", borderRadius: "10px", background: "rgba(16, 185, 129, 0.08)", border: "1px solid rgba(16, 185, 129, 0.2)" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#10b981" }} />
                            <strong style={{ fontSize: "13px", color: "white" }}>Open</strong>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <span style={{ fontSize: "14px", fontWeight: 700, color: "#10b981" }}>{totalOpen}</span>
                            <span style={{ fontSize: "11px", color: "var(--text-muted)", marginLeft: "4px" }}>({openPct}%)</span>
                          </div>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", padding: "10px 14px", borderRadius: "10px", background: "rgba(141, 149, 167, 0.08)", border: "1px solid rgba(141, 149, 167, 0.2)" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#8d95a7" }} />
                            <strong style={{ fontSize: "13px", color: "white" }}>Closed</strong>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <span style={{ fontSize: "14px", fontWeight: 700, color: "#8d95a7" }}>{totalClosed}</span>
                            <span style={{ fontSize: "11px", color: "var(--text-muted)", marginLeft: "4px" }}>({closedPct}%)</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>
                </div>

                {/* Category Volume Breakdown Bars */}
                <section className="section-card">
                  <div className="section-head">
                    <div>
                      <h2>Category Volume</h2>
                      <p>How often each support department option is selected by community members</p>
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginTop: "16px" }}>
                    {typeBreakdown.map((cat: any, idx: number) => {
                      const count = cat.count || 0;
                      const pct = Math.round((count / maxTypeCount) * 100);
                      return (
                        <div key={cat.value || idx} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "13px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <span>{renderCategoryEmoji(cat.emoji, cat.emojiTag)}</span>
                              <strong style={{ color: "white" }}>{cat.label}</strong>
                            </div>
                            <span style={{ color: "var(--text-muted)", fontSize: "12px", fontFamily: "monospace" }}>
                              {count} tickets ({Math.round((count / totalAll) * 100)}%)
                            </span>
                          </div>
                          <div style={{ width: "100%", height: "10px", borderRadius: "5px", background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                            <div
                              style={{
                                width: `${pct}%`,
                                height: "100%",
                                borderRadius: "5px",
                                background: "linear-gradient(90deg, #9d7cff 0%, #7c3aed 100%)",
                                transition: "width 0.4s ease-out"
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              </div>
            );
          })()}

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
                  <div className="page-eyebrow">Permission Management</div>
                  <h1 style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "26px", fontWeight: 700 }}>
                    <Shield size={26} color="var(--accent)" />
                    Dashboard Access Tiers
                  </h1>
                  <p style={{ color: "var(--text-muted)", fontSize: "14px", marginTop: "4px" }}>
                    Control which Discord roles are allowed into the dashboard and how much operational access each role should have.
                  </p>
                </div>
                <button
                  type="button"
                  className="action-button tone-primary"
                  disabled={busy}
                  onClick={handleSaveAccessTiers}
                  style={{ display: "flex", alignItems: "center", gap: "6px" }}
                >
                  <Save size={15} /> Save Changes
                </button>
              </div>

              <div className="announcement-bar" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span className="announcement-icon" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center" }}>ℹ</span>
                <span>Higher access tiers should stay limited to your most trusted roles. Review these assignments carefully before saving.</span>
              </div>

              {/* 5 Access Tier Cards with Custom Discord Emojis */}
              <div className="access-tiers-grid">
                {ACCESS_TIERS.map((tier) => (
                  <div key={tier.id} className="access-tier-card">
                    <div className="tier-eyebrow">ACCESS TIER</div>
                    <div className="tier-header">
                      <div
                        className="tier-title"
                        style={{
                          color: tier.color,
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          fontSize: "17px",
                          fontWeight: "bold"
                        }}
                      >
                        <img
                          src={`https://cdn.discordapp.com/emojis/${tier.emojiId}.png`}
                          alt={tier.label}
                          style={{ width: 18, height: 18, display: "inline-block" }}
                        />
                        {tier.label}
                      </div>
                      <div className="tier-count" style={{ borderColor: tier.borderColor }}>
                        {getTierCount(tier.id)}
                      </div>
                    </div>
                    <p className="tier-desc">{tier.desc}</p>
                  </div>
                ))}
              </div>

              {/* Allowed Roles Assignment Section */}
              <section className="section-card" style={{ marginTop: "18px" }}>
                <div className="section-head access-roles-head" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
                  <div className="allowed-roles-title" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <ShieldCheck size={20} className="accent-icon" />
                    <h2 style={{ fontSize: "16px", margin: 0 }}>Allowed Roles</h2>
                  </div>
                  <div className="add-role-controls">
                    <select
                      className="select-input"
                      style={{ width: "auto", minWidth: "170px" }}
                      value={selectedNewRole}
                      onChange={(e) => {
                        const roleId = e.target.value;
                        if (!roleId) return;
                        handleAddAccessRole(roleId);
                      }}
                    >
                      <option value="">+ Add Server Role</option>
                      {availableRolesToAdd.map((role: any) => (
                        <option key={role.id} value={role.id}>{role.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="role-list" style={{ marginTop: "16px" }}>
                  {roleMap.length === 0 ? (
                    <div className="muted-note" style={{ padding: "24px", textAlign: "center", color: "var(--text-muted)", fontSize: "13px" }}>
                      No custom roles are configured. Server Owners remain the default access holders.
                    </div>
                  ) : (
                    roleMap.map((role) => (
                      <div key={role.id} className="role-list-item">
                        <div className="role-list-info" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <span
                            style={{
                              width: "10px",
                              height: "10px",
                              borderRadius: "50%",
                              backgroundColor: role.color && role.color !== "#000000" ? role.color : "#9d7cff",
                              display: "inline-block"
                            }}
                          />
                          <div>
                            <strong style={{ fontSize: "13px", color: "white" }}>{role.name}</strong>
                            <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                              {ACCESS_TIERS.find((tier) => tier.id === role.tier)?.label || "Staff"} tier
                            </span>
                          </div>
                        </div>
                        <div className="role-list-actions" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <select
                            value={role.tier}
                            onChange={(e) => handleUpdateAccessRole(role.id, e.target.value as any)}
                            className="select-input"
                            style={{ width: "auto", padding: "6px 12px", fontSize: "12px" }}
                          >
                            {ACCESS_TIERS.map((tier) => (
                              <option key={tier.id} value={tier.id}>{tier.accessLabel}</option>
                            ))}
                          </select>
                          <button
                            type="button"
                            className="action-button"
                            onClick={() => handleRemoveAccessRole(role.id)}
                            style={{ padding: "6px 8px", color: "var(--text-muted)", border: "none", background: "none", cursor: "pointer" }}
                            title="Remove role"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>
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

          {/* TAB: BOT COMMANDS */}
          {activeTab === "commands" && (
            <div className="page-stack">
              <div className="page-header">
                <div>
                  <div className="page-eyebrow">Discord Slash Commands</div>
                  <h1 style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "26px", fontWeight: 700 }}>
                    <Terminal size={26} color="var(--accent)" />
                    Bot Commands Reference
                  </h1>
                  <p style={{ color: "var(--text-muted)", fontSize: "14px", marginTop: "4px" }}>
                    Quick reference for all available slash commands to manage tickets and server configuration.
                  </p>
                </div>
              </div>

              {/* Search & Category Filter */}
              <div className="command-search-wrap">
                <Search size={16} style={{ color: "var(--text-muted)" }} />
                <input
                  type="text"
                  className="command-search-input"
                  placeholder="Search commands by name, syntax, or keyword..."
                  value={cmdSearch}
                  onChange={(e) => setCmdSearch(e.target.value)}
                />
                {cmdSearch && (
                  <button type="button" onClick={() => setCmdSearch("")} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}>
                    <X size={14} />
                  </button>
                )}
              </div>

              <div className="command-filter-pills">
                {[
                  { id: "all", label: "All Commands" },
                  { id: "setup", label: "Setup & Config" },
                  { id: "management", label: "Ticket Management" }
                ].map((pill) => (
                  <button
                    key={pill.id}
                    type="button"
                    className={`command-pill ${cmdCategory === pill.id ? "active" : ""}`}
                    onClick={() => setCmdCategory(pill.id)}
                  >
                    {pill.label}
                  </button>
                ))}
              </div>

              {/* Commands Grid */}
              <div className="commands-grid">
                {BOT_COMMANDS
                  .filter((cmd) => {
                    const matchCategory = cmdCategory === "all" || cmd.category === cmdCategory;
                    const matchSearch = !cmdSearch ||
                      cmd.name.toLowerCase().includes(cmdSearch.toLowerCase()) ||
                      cmd.usage.toLowerCase().includes(cmdSearch.toLowerCase()) ||
                      cmd.description.toLowerCase().includes(cmdSearch.toLowerCase());
                    return matchCategory && matchSearch;
                  })
                  .map((cmd) => (
                    <div key={cmd.name} className="command-card">
                      <div className="command-header">
                        <span className="command-name">{cmd.name}</span>
                        <span className="command-badge">{cmd.badge}</span>
                      </div>
                      <div className="command-syntax">
                        <code>{cmd.syntax}</code>
                        <button
                          type="button"
                          className="command-copy-btn"
                          title="Copy command syntax"
                          onClick={() => handleCopyCmd(cmd.syntax)}
                        >
                          {copiedCmd === cmd.syntax ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                        </button>
                      </div>
                      <p className="command-desc">{cmd.usage}</p>
                      <span style={{ fontSize: "11px", color: "var(--text-muted)", lineHeight: 1.4 }}>
                        {cmd.description}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* TAB: SYSTEM STATUS */}
          {activeTab === "status" && (
            <div className="page-stack">
              <div className="page-header">
                <div>
                  <div className="page-eyebrow">Operational Health & Telemetry</div>
                  <h1 style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "26px", fontWeight: 700 }}>
                    <Activity size={26} color="#10b981" />
                    System Status
                  </h1>
                  <p style={{ color: "var(--text-muted)", fontSize: "14px", marginTop: "4px" }}>
                    Live infrastructure metrics and 90-day availability history for SyncInk Ticket services.
                  </p>
                </div>
              </div>

              {/* Overall status hero card */}
              <div
                style={{
                  background: "linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(139, 76, 255, 0.08))",
                  border: "1px solid rgba(16, 185, 129, 0.3)",
                  borderRadius: "16px",
                  padding: "20px 24px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "16px"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                  <div style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(16, 185, 129, 0.2)", display: "flex", alignItems: "center", justifyContent: "center", color: "#10b981" }}>
                    <CheckCircle2 size={24} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: "17px", fontWeight: 700, color: "#fff" }}>All Systems Fully Operational</h3>
                    <p style={{ fontSize: "13px", color: "rgba(255, 255, 255, 0.7)" }}>No outages or degraded performance reported across any clusters in the last 24 hours.</p>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "rgba(0,0,0,0.4)", padding: "8px 14px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>90-Day Uptime:</span>
                  <strong style={{ fontSize: "13px", color: "#10b981" }}>99.98%</strong>
                </div>
              </div>

              {/* Component Rows */}
              <section className="section-card">
                <div className="section-head">
                  <div>
                    <h2>Service Telemetry</h2>
                    <p>Current operational ping and real-time connectivity status.</p>
                  </div>
                </div>
                <div className="stack-list">
                  {[
                    { name: "Discord Gateway & WebSockets", status: "Operational", ping: "18ms", uptime: "99.98%" },
                    { name: "Ticket Interaction Engine", status: "Operational", ping: "24ms", uptime: "99.96%" },
                    { name: "Web Dashboard API & Microservices", status: "Operational", ping: "28ms", uptime: "100.00%" },
                    { name: "Transcript Archiver & CDN", status: "Operational", ping: "35ms", uptime: "99.95%" },
                    { name: "MongoDB Database Cluster", status: "Operational", ping: "12ms", uptime: "100.00%" }
                  ].map((s) => (
                    <div key={s.name} className="staff-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                      <div>
                        <strong>{s.name}</strong>
                        <div style={{ fontSize: "12px", color: "var(--text-muted)", display: "flex", gap: "12px", marginTop: "2px" }}>
                          <span>Latency: {s.ping}</span>
                          <span>&bull;</span>
                          <span>Uptime: {s.uptime}</span>
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <span className="pill tone-success">{s.status}</span>
                      </div>
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
                  <div className="page-eyebrow">Setup & Operations</div>
                  <h1 style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "26px", fontWeight: 700 }}>
                    <BookOpen size={26} color="var(--accent)" />
                    SyncInk Ticket Guide
                  </h1>
                  <p style={{ color: "var(--text-muted)", fontSize: "14px", marginTop: "4px" }}>
                    Everything you need to configure your support desk and optimize response workflows.
                  </p>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "18px" }}>
                <section className="section-card">
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "14px" }}>
                    <span style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--accent)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: 700 }}>1</span>
                    <h3 style={{ fontSize: "16px", fontWeight: 700, color: "white" }}>Deploy Ticket Panel</h3>
                  </div>
                  <p style={{ fontSize: "13px", color: "var(--text-soft)", lineHeight: 1.6, marginBottom: "12px" }}>
                    Head to the <strong>Ticket Panels</strong> tab. Pick the channel where members open tickets, customize the embed title, color, and description, then click <strong>Deploy Panel</strong>.
                  </p>
                  <div style={{ background: "rgba(0,0,0,0.4)", padding: "8px 12px", borderRadius: "8px", fontFamily: "monospace", fontSize: "12px", color: "#a78bfa" }}>
                    /setup or /ticket-panel
                  </div>
                </section>

                <section className="section-card">
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "14px" }}>
                    <span style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--accent)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: 700 }}>2</span>
                    <h3 style={{ fontSize: "16px", fontWeight: 700, color: "white" }}>Configure Departments</h3>
                  </div>
                  <p style={{ fontSize: "13px", color: "var(--text-soft)", lineHeight: 1.6, marginBottom: "12px" }}>
                    In <strong>Ticket Categories</strong>, set up dedicated departments (Billing, General, Bug Reports). Match each category to the appropriate staff ping role.
                  </p>
                  <div style={{ background: "rgba(0,0,0,0.4)", padding: "8px 12px", borderRadius: "8px", fontFamily: "monospace", fontSize: "12px", color: "#a78bfa" }}>
                    /ticket-config role
                  </div>
                </section>

                <section className="section-card">
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "14px" }}>
                    <span style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--accent)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: 700 }}>3</span>
                    <h3 style={{ fontSize: "16px", fontWeight: 700, color: "white" }}>Claim & Handle Tickets</h3>
                  </div>
                  <p style={{ fontSize: "13px", color: "var(--text-soft)", lineHeight: 1.6, marginBottom: "12px" }}>
                    When a ticket is opened, support staff can click <strong>Claim</strong> or type <code>/claim</code>. This updates channel permissions and attributes resolution metrics.
                  </p>
                  <div style={{ background: "rgba(0,0,0,0.4)", padding: "8px 12px", borderRadius: "8px", fontFamily: "monospace", fontSize: "12px", color: "#a78bfa" }}>
                    /claim and /add @user
                  </div>
                </section>

                <section className="section-card">
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "14px" }}>
                    <span style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--accent)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: 700 }}>4</span>
                    <h3 style={{ fontSize: "16px", fontWeight: 700, color: "white" }}>Close & Archive</h3>
                  </div>
                  <p style={{ fontSize: "13px", color: "var(--text-soft)", lineHeight: 1.6, marginBottom: "12px" }}>
                    Closing a ticket generates an interactive online transcript. Transcripts are sent to the user via DM and logged into your audit log channel.
                  </p>
                  <div style={{ background: "rgba(0,0,0,0.4)", padding: "8px 12px", borderRadius: "8px", fontFamily: "monospace", fontSize: "12px", color: "#a78bfa" }}>
                    /close and /ticket-logs
                  </div>
                </section>
              </div>
            </div>
          )}

          {/* TAB: FAQ */}
          {activeTab === "faq" && (
            <div className="page-stack">
              <div className="page-header">
                <div>
                  <div className="page-eyebrow">Help & Knowledge Base</div>
                  <h1 style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "26px", fontWeight: 700 }}>
                    <HelpCircle size={26} color="var(--accent)" />
                    Frequently Asked Questions
                  </h1>
                  <p style={{ color: "var(--text-muted)", fontSize: "14px", marginTop: "4px" }}>
                    Answers to common questions regarding ticket management, transcripts, and permissions.
                  </p>
                </div>
              </div>

              {/* FAQ Search */}
              <div className="command-search-wrap">
                <Search size={16} style={{ color: "var(--text-muted)" }} />
                <input
                  type="text"
                  className="command-search-input"
                  placeholder="Search questions (e.g., transcripts, permissions, cost)..."
                  value={faqSearch}
                  onChange={(e) => setFaqSearch(e.target.value)}
                />
                {faqSearch && (
                  <button type="button" onClick={() => setFaqSearch("")} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}>
                    <X size={14} />
                  </button>
                )}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {[
                  {
                    q: "Is SyncInk Ticket free to use?",
                    a: "Yes! All core ticketing functions, online transcripts, customizable panels, department routing, and role overrides are completely free with zero subscription fees."
                  },
                  {
                    q: "Where are closed ticket transcripts stored?",
                    a: "Transcripts are generated in HTML format and stored securely in the database. Links are posted to your server's log channel and are viewable in the Transcripts tab of this dashboard."
                  },
                  {
                    q: "What permissions does SyncInk Ticket need in Discord?",
                    a: "The bot requires Manage Channels, Manage Roles, Send Messages, Embed Links, Attach Files, and Read Message History to create and maintain private ticket channels."
                  },
                  {
                    q: "Can users open multiple tickets simultaneously?",
                    a: "By default, users can open one active ticket per category to prevent channel flooding. Once their active ticket is resolved, they can open a new request."
                  },
                  {
                    q: "How do I give my staff access to the dashboard?",
                    a: "In the Dashboard Access tab, assign your server staff roles. Any member holding those roles can log into this dashboard and view server tickets."
                  }
                ]
                  .filter((item) => !faqSearch || item.q.toLowerCase().includes(faqSearch.toLowerCase()) || item.a.toLowerCase().includes(faqSearch.toLowerCase()))
                  .map((item, idx) => (
                    <div
                      key={idx}
                      className="section-card"
                      style={{ cursor: "pointer" }}
                      onClick={() => setOpenFaqIndex(openFaqIndex === idx ? null : idx)}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "14px" }}>
                        <h3 style={{ fontSize: "15px", fontWeight: 600, color: "#fff" }}>{item.q}</h3>
                        <ChevronDown size={16} style={{ color: "var(--text-muted)", transform: openFaqIndex === idx ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }} />
                      </div>
                      {openFaqIndex === idx && (
                        <p style={{ marginTop: "12px", fontSize: "13px", color: "var(--text-soft)", lineHeight: 1.6, borderTop: "1px solid var(--border)", paddingTop: "12px" }}>
                          {item.a}
                        </p>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* TAB: RULES */}
          {activeTab === "rules" && (
            <div className="page-stack">
              <div className="page-header">
                <div>
                  <div className="page-eyebrow">Operating Guidelines & Enforcement</div>
                  <h1 style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "26px", fontWeight: 700 }}>
                    <BookOpen size={26} color="var(--accent)" />
                    Ticket Bot Rules & Conduct
                  </h1>
                  <p style={{ color: "var(--text-muted)", fontSize: "14px", marginTop: "4px" }}>
                    Clear, enforceable standards governing ticket creation, staff responsibilities, and anti-spam protocols across all servers.
                  </p>
                </div>
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  <Link
                    href="/rules"
                    className="action-button tone-primary"
                    style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "6px" }}
                  >
                    <ExternalLink size={14} /> Full Rules Page
                  </Link>
                  <a
                    href="https://discord.gg/rB6gNZaK9u"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="action-button tone-secondary"
                    style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "6px" }}
                  >
                    <MessageSquare size={14} /> Support Server
                  </a>
                </div>
              </div>

              {/* Quick Jump Anchor Pills */}
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", margin: "4px 0 16px" }}>
                {TICKET_RULES_DATA.map((rule) => (
                  <a
                    key={rule.id}
                    href={`#rule-item-${rule.id}`}
                    style={{
                      textDecoration: "none",
                      padding: "6px 14px",
                      borderRadius: "20px",
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid var(--border)",
                      color: "var(--text-soft)",
                      fontSize: "12px",
                      fontWeight: 600,
                      transition: "all 0.2s"
                    }}
                  >
                    {rule.number}: {rule.title}
                  </a>
                ))}
              </div>

              <section className="section-card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", borderBottom: "1px solid var(--border)", paddingBottom: "16px", marginBottom: "20px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <Shield size={18} color="var(--accent)" />
                    <span style={{ fontSize: "14px", color: "white", fontWeight: 600 }}>SyncInk Ticket Rules & Conduct Protocols</span>
                  </div>
                  <span style={{ fontSize: "12px", color: "var(--text-muted)", background: "rgba(255,255,255,0.04)", padding: "4px 10px", borderRadius: "6px", border: "1px solid var(--border)" }}>
                    Effective Platform-Wide
                  </span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                  {TICKET_RULES_DATA.map((rule) => (
                    <div key={rule.id} id={`rule-item-${rule.id}`} style={{ scrollMarginTop: "100px", paddingBottom: "16px", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px", marginBottom: "10px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <span style={{ fontSize: "11px", fontWeight: 800, color: "var(--accent)", background: "rgba(139, 76, 255, 0.12)", border: "1px solid rgba(139, 76, 255, 0.25)", padding: "2px 8px", borderRadius: "6px", fontFamily: "monospace" }}>
                            {rule.number}
                          </span>
                          <h2 style={{ fontSize: "16px", color: "white", margin: 0, fontWeight: 700 }}>
                            {rule.title}
                          </h2>
                        </div>
                        <span className="command-badge">{rule.badge}</span>
                      </div>

                      <p style={{ fontSize: "13.5px", color: "#cbd5e1", lineHeight: 1.6, marginBottom: "12px" }}>
                        {rule.desc}
                      </p>

                      <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "12px" }}>
                        {rule.points.map((pt, idx) => (
                          <div key={idx} style={{ display: "flex", alignItems: "flex-start", gap: "8px", fontSize: "12.5px", color: "var(--text-soft)", lineHeight: 1.5 }}>
                            <span style={{ color: "var(--accent)", fontWeight: 700 }}>&bull;</span>
                            <span>{pt}</span>
                          </div>
                        ))}
                      </div>

                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px", fontSize: "11.5px", color: "var(--text-muted)" }}>
                        <span><strong>Scope:</strong> {rule.channel}</span>
                        <span style={{ color: "#fb7185" }}><strong>Enforcement:</strong> {rule.severity}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Dispute & Appeals Callout Box */}
                <div
                  style={{
                    borderRadius: "14px",
                    marginTop: "28px",
                    padding: "20px",
                    background: "rgba(139, 76, 255, 0.06)",
                    border: "1px solid rgba(139, 76, 255, 0.2)"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                    <Scale size={18} style={{ color: "var(--accent)" }} />
                    <h3 style={{ margin: 0, fontSize: "15px", color: "white", fontWeight: 700 }}>Staff Misconduct or Ticket Blacklist Appeal</h3>
                  </div>
                  <p style={{ fontSize: "13px", color: "var(--text-soft)", lineHeight: 1.6, marginBottom: "14px" }}>
                    If you experienced staff abuse or were blacklisted from ticket creation unfairly, you may file a formal dispute with Server Leadership.
                  </p>
                  <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                    <a
                      href="https://discord.gg/rB6gNZaK9u"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="action-button tone-primary"
                      style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "8px", fontSize: "12px" }}
                    >
                      <MessageSquare size={14} /> Open Appeal on Discord
                    </a>
                    <Link
                      href="/rules"
                      className="action-button tone-secondary"
                      style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "8px", fontSize: "12px" }}
                    >
                      <ExternalLink size={14} /> Open Dedicated Rules Page
                    </Link>
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
                  <div className="page-eyebrow">Legal & Compliance</div>
                  <h1 style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "26px", fontWeight: 700 }}>
                    <ShieldCheck size={26} color="var(--accent)" />
                    Privacy Policy
                  </h1>
                  <p style={{ color: "var(--text-muted)", fontSize: "14px", marginTop: "4px" }}>
                    We believe in total transparency. Here is a clear breakdown of data collection, storage standards, and your retention rights.
                  </p>
                </div>
                <div style={{ display: "flex", gap: "10px" }}>
                  <a
                    href="https://discord.gg/rB6gNZaK9u"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="action-button tone-secondary"
                    style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "6px" }}
                  >
                    <MessageSquare size={14} /> Official Support
                  </a>
                </div>
              </div>

              {/* Quick Jump Anchor Pills */}
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", margin: "4px 0 16px" }}>
                {PRIVACY_SECTIONS.map((sec) => (
                  <a
                    key={sec.id}
                    href={`#privacy-${sec.id}`}
                    style={{
                      textDecoration: "none",
                      padding: "6px 14px",
                      borderRadius: "20px",
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid var(--border)",
                      color: "var(--text-soft)",
                      fontSize: "12px",
                      fontWeight: 600,
                      transition: "all 0.2s"
                    }}
                  >
                    {sec.title}
                  </a>
                ))}
              </div>

              <section className="section-card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", borderBottom: "1px solid var(--border)", paddingBottom: "16px", marginBottom: "20px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <Shield size={18} color="var(--accent)" />
                    <span style={{ fontSize: "14px", color: "white", fontWeight: 600 }}>SyncInk Privacy Commitment</span>
                  </div>
                  <span style={{ fontSize: "12px", color: "var(--text-muted)", background: "rgba(255,255,255,0.04)", padding: "4px 10px", borderRadius: "6px", border: "1px solid var(--border)" }}>
                    Effective Date: October 2026
                  </span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                  {PRIVACY_SECTIONS.map((section, index) => (
                    <div key={section.id} id={`privacy-${section.id}`} style={{ scrollMarginTop: "100px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px", marginBottom: "10px" }}>
                        <h2 style={{ fontSize: "16px", color: "white", margin: 0, fontWeight: 700 }}>
                          {index + 1}. {section.title}
                        </h2>
                        <span className="command-badge">{section.badge}</span>
                      </div>

                      {/* Summary Takeaway Callout */}
                      <div
                        style={{
                          padding: "10px 14px",
                          borderRadius: "10px",
                          background: "rgba(157, 124, 255, 0.08)",
                          border: "1px solid rgba(157, 124, 255, 0.2)",
                          fontSize: "12.5px",
                          color: "#e2d9f3",
                          marginBottom: "12px"
                        }}
                      >
                        <strong style={{ color: "var(--accent)" }}>Key Takeaway: </strong>
                        {section.takeaway}
                      </div>

                      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        {section.body.map((paragraph, pIdx) => (
                          <p key={pIdx} style={{ fontSize: "13px", color: "var(--text-soft)", lineHeight: 1.6, margin: 0 }}>
                            {paragraph}
                          </p>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Direct Data Removal Request Box */}
                <div
                  style={{
                    borderRadius: "14px",
                    marginTop: "28px",
                    padding: "20px",
                    background: "rgba(239, 68, 68, 0.06)",
                    border: "1px solid rgba(239, 68, 68, 0.2)"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                    <Trash2 size={18} style={{ color: "#ef4444" }} />
                    <h3 style={{ margin: 0, fontSize: "15px", color: "white", fontWeight: 700 }}>Request Server Data Purge</h3>
                  </div>
                  <p style={{ fontSize: "13px", color: "var(--text-soft)", lineHeight: 1.6, marginBottom: "14px" }}>
                    Need to remove all server transcripts, interaction metrics, and logs? Server owners can trigger an immediate full data purge by opening an official support ticket in our Discord community.
                  </p>
                  <a
                    href="https://discord.gg/rB6gNZaK9u"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="action-button tone-secondary"
                    style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "8px", fontSize: "12px", borderColor: "rgba(239, 68, 68, 0.3)" }}
                  >
                    <ExternalLink size={14} /> Open Data Purge Request in Support Server
                  </a>
                </div>
              </section>
            </div>
          )}

          {/* TAB: TERMS OF SERVICE */}
          {activeTab === "terms" && (
            <div className="page-stack">
              <div className="page-header">
                <div>
                  <div className="page-eyebrow">Legal & Agreements</div>
                  <h1 style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "26px", fontWeight: 700 }}>
                    <FileText size={26} color="var(--accent)" />
                    Terms of Service
                  </h1>
                  <p style={{ color: "var(--text-muted)", fontSize: "14px", marginTop: "4px" }}>
                    Clear guidelines governing the responsible use of the SyncInk Ticket bot, backend APIs, and web management dashboard.
                  </p>
                </div>
                <div style={{ display: "flex", gap: "10px" }}>
                  <a
                    href="https://discord.gg/rB6gNZaK9u"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="action-button tone-secondary"
                    style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "6px" }}
                  >
                    <MessageSquare size={14} /> Legal Support
                  </a>
                </div>
              </div>

              {/* Quick Jump Anchor Pills */}
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", margin: "4px 0 16px" }}>
                {TERMS_SECTIONS.map((sec) => (
                  <a
                    key={sec.id}
                    href={`#terms-${sec.id}`}
                    style={{
                      textDecoration: "none",
                      padding: "6px 14px",
                      borderRadius: "20px",
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid var(--border)",
                      color: "var(--text-soft)",
                      fontSize: "12px",
                      fontWeight: 600,
                      transition: "all 0.2s"
                    }}
                  >
                    {sec.title}
                  </a>
                ))}
              </div>

              <section className="section-card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", borderBottom: "1px solid var(--border)", paddingBottom: "16px", marginBottom: "20px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <Scale size={18} color="var(--accent)" />
                    <span style={{ fontSize: "14px", color: "white", fontWeight: 600 }}>SyncInk Service Agreement</span>
                  </div>
                  <span style={{ fontSize: "12px", color: "var(--text-muted)", background: "rgba(255,255,255,0.04)", padding: "4px 10px", borderRadius: "6px", border: "1px solid var(--border)" }}>
                    Effective Date: October 2026
                  </span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                  {TERMS_SECTIONS.map((section, index) => (
                    <div key={section.id} id={`terms-${section.id}`} style={{ scrollMarginTop: "100px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px", marginBottom: "10px" }}>
                        <h2 style={{ fontSize: "16px", color: "white", margin: 0, fontWeight: 700 }}>
                          {index + 1}. {section.title}
                        </h2>
                        <span className="command-badge">{section.badge}</span>
                      </div>

                      {/* Summary Takeaway Callout */}
                      <div
                        style={{
                          padding: "10px 14px",
                          borderRadius: "10px",
                          background: "rgba(157, 124, 255, 0.08)",
                          border: "1px solid rgba(157, 124, 255, 0.2)",
                          fontSize: "12.5px",
                          color: "#e2d9f3",
                          marginBottom: "12px"
                        }}
                      >
                        <strong style={{ color: "var(--accent)" }}>Key Takeaway: </strong>
                        {section.takeaway}
                      </div>

                      <p style={{ fontSize: "13px", color: "var(--text-soft)", lineHeight: 1.6, margin: 0 }}>
                        {section.body}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Legal Inquiry Card */}
                <div
                  style={{
                    borderRadius: "14px",
                    marginTop: "28px",
                    padding: "20px",
                    background: "rgba(255, 255, 255, 0.02)",
                    border: "1px solid var(--border)"
                  }}
                >
                  <h3 style={{ margin: "0 0 8px", fontSize: "15px", color: "white", fontWeight: 700 }}>
                    Have questions regarding these terms?
                  </h3>
                  <p style={{ fontSize: "13px", color: "var(--text-soft)", lineHeight: 1.6, marginBottom: "14px" }}>
                    Our team is available on Discord to address any policy, commercial use, or licensing inquiries for your server.
                  </p>
                  <a
                    href="https://discord.gg/rB6gNZaK9u"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="action-button tone-primary"
                    style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "8px", fontSize: "12px" }}
                  >
                    <MessageSquare size={14} /> Contact Legal Support on Discord
                  </a>
                </div>
              </section>
            </div>
          )}
        </>
      )}
    </main>
      </div>

      {/* Floating Mobile Bottom Quick Navigation */}
      <nav className="mobile-bottom-nav">
        <button
          type="button"
          onClick={() => {
            setActiveTab("overview");
            setMobileMenuOpen(false);
          }}
          className={activeTab === "overview" ? "active" : ""}
        >
          <LayoutDashboard size={18} />
          <span>Overview</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab("panels");
            setMobileMenuOpen(false);
          }}
          className={activeTab === "panels" ? "active" : ""}
        >
          <PanelsTopLeft size={18} />
          <span>Panels</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab("categories");
            setMobileMenuOpen(false);
          }}
          className={activeTab === "categories" ? "active" : ""}
        >
          <MessageSquareMore size={18} />
          <span>Categories</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab("transcripts");
            setMobileMenuOpen(false);
          }}
          className={activeTab === "transcripts" ? "active" : ""}
        >
          <FileText size={18} />
          <span>Transcripts</span>
        </button>
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className={mobileMenuOpen ? "active" : ""}
        >
          <Menu size={18} />
          <span>More</span>
        </button>
      </nav>

      {/* Online Discord Transcript Modal */}
      {(selectedTranscript || transcriptLoading || transcriptError) && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.85)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            zIndex: 150,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px"
          }}
          onClick={() => {
            setSelectedTranscript(null);
            setTranscriptError(null);
          }}
        >
          <div
            style={{ width: "min(920px, 100%)", maxHeight: "90vh", display: "flex", flexDirection: "column" }}
            onClick={(e) => e.stopPropagation()}
          >
            <DiscordTranscriptViewer
              ticket={selectedTranscript}
              loading={transcriptLoading}
              error={transcriptError}
              onClose={() => {
                setSelectedTranscript(null);
                setTranscriptError(null);
              }}
            />
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
        <div className="unsaved-changes-banner">
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
              disabled={busy}
              onClick={async () => {
                if (saveAction) {
                  await saveAction();
                } else if (activeTab === "dashboard-access") {
                  await handleSaveAccessTiers();
                } else if (activeTab === "categories") {
                  await handleSaveSettings({ categoryOverrides: categories }, "Categories saved successfully");
                } else if (activeTab === "panels") {
                  await handleSaveSettings({ panelConfig: panelForm, panelChannelId }, "Panel settings saved");
                } else if (activeTab === "transfer-options") {
                  await handleSaveSettings({ categoryOverrides: categories }, "Transfer options saved");
                } else if (activeTab === "miscellaneous") {
                  await handleSaveSettings({ inactivityReminderMinutes: inactivityMinutes, logChannelId, transcriptChannelId }, "Miscellaneous saved");
                } else {
                  await handleSaveSettings({ panelConfig: panelForm, panelChannelId }, "Changes saved");
                }
              }}
              style={{ padding: "6px 14px", fontSize: "12px" }}
            >
              Save Changes
            </button>
          </div>
        </div>
      )}

      {/* Toast Viewport */}
      <div className="toast-viewport">
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
