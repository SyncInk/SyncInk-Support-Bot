"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Shield,
  MessageSquare,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  Clock,
  Send,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  Lock,
  Unlock,
  Paperclip,
  X,
  ArrowLeft,
  Copy,
  Check,
  RefreshCw,
  Search,
  Filter,
  User,
  Crown,
  Sparkles,
  ArrowRight,
  Database,
  FileText,
  AlertCircle,
  HelpCircle,
  Hash,
  Server,
  Layers,
} from "lucide-react";
import { PublicNavbar } from "@/components/PublicNavbar";
import { PublicFooter } from "@/components/PublicFooter";
import { DISCORD_CUSTOM_EMOJIS } from "@/lib/custom-emojis";

interface CurrentUser {
  id: string;
  username: string;
  global_name?: string | null;
  avatar?: string | null;
  isOwner?: boolean;
  isAdmin?: boolean;
  isStaff?: boolean;
}

interface ReportItem {
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

interface ChatMessage {
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

export default function ReportPortalPage() {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Tab state
  const [activeTab, setActiveTab] = useState<"submit" | "cases">("submit");

  // Reports state
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [selectedReport, setSelectedReport] = useState<ReportItem | null>(null);

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [userAttachment, setUserAttachment] = useState<File | null>(null);
  const [uploadingUserAttachment, setUploadingUserAttachment] = useState(false);
  const userFileInputRef = useRef<HTMLInputElement>(null);
  const [mobileShowChat, setMobileShowChat] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Form state
  const [botTarget, setBotTarget] = useState("SyncInk Ticket Bot");
  const [category, setCategory] = useState("DATA_LOSS");
  const [guildId, setGuildId] = useState("");
  const [guildName, setGuildName] = useState("");
  const [title, setTitle] = useState("");
  const [incidentDate, setIncidentDate] = useState("");
  const [affectedChannels, setAffectedChannels] = useState("");
  const [description, setDescription] = useState("");
  const [evidenceLinks, setEvidenceLinks] = useState("");
  const [priority, setPriority] = useState<"NORMAL" | "HIGH" | "CRITICAL">("HIGH");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Ensure the page stays at the top on initial mount
  useEffect(() => {
    if (typeof window !== "undefined" && !window.location.hash) {
      window.scrollTo(0, 0);
    }
  }, []);

  // 1. Fetch current user authentication
  useEffect(() => {
    async function loadUser() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated && data.user) {
            setCurrentUser(data.user);
          }
        }
      } catch (err) {
        console.error("Auth check failed:", err);
      } finally {
        setAuthLoading(false);
      }
    }
    loadUser();
  }, []);

  // 2. Fetch reports when user is available or tab changes to cases
  useEffect(() => {
    if (currentUser) {
      fetchReports();
    }
  }, [currentUser, activeTab]);

  // 3. Poll chat messages when a report is selected
  useEffect(() => {
    if (!selectedReport) return;

    fetchMessages(selectedReport.id);
    const interval = setInterval(() => {
      fetchMessages(selectedReport.id, true);
    }, 3000);

    return () => clearInterval(interval);
  }, [selectedReport]);

  // Auto scroll messages strictly within the inner chat container (NEVER scroll the page window)
  useEffect(() => {
    if (chatContainerRef.current && messages.length > 0) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages.length]);

  async function fetchReports() {
    setReportsLoading(true);
    try {
      const res = await fetch("/api/reports");
      if (res.ok) {
        const data = await res.json();
        setReports(data.reports || []);
        // Auto-select first report if in cases view and none selected
        if (data.reports?.length > 0 && !selectedReport && activeTab === "cases") {
          setSelectedReport(data.reports[0]);
        }
      }
    } catch (err) {
      console.error("Failed to load reports:", err);
    } finally {
      setReportsLoading(false);
    }
  }

  async function fetchMessages(reportId: number, silent = false) {
    if (!silent) setMessagesLoading(true);
    try {
      const [msgRes, repRes] = await Promise.all([
        fetch(`/api/reports/${reportId}/messages`),
        fetch(`/api/reports/${reportId}`),
      ]);

      if (msgRes.ok) {
        const data = await msgRes.json();
        setMessages(data.messages || []);
      }

      if (repRes.ok) {
        const repData = await repRes.json();
        if (repData.report) {
          setSelectedReport((prev) => (prev && prev.id === reportId ? { ...prev, ...repData.report } : prev));
        }
      }
    } catch (err) {
      console.error("Failed to fetch messages:", err);
    } finally {
      if (!silent) setMessagesLoading(false);
    }
  }

  async function handleSendMessage(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!selectedReport || sendingMessage || uploadingUserAttachment) return;
    if (!newMessage.trim() && !userAttachment) return;

    setSendingMessage(true);
    try {
      let attachmentUrl: string | null = null;
      let attachmentName: string | null = null;
      let attachmentType: string | null = null;
      let attachmentSize: number | null = null;

      if (userAttachment) {
        setUploadingUserAttachment(true);
        const fd = new FormData();
        fd.append("file", userAttachment);

        const upRes = await fetch(`/api/reports/${selectedReport.id}/upload`, {
          method: "POST",
          body: fd,
        });

        if (!upRes.ok) {
          const errData = await upRes.json().catch(() => ({}));
          throw new Error(errData.error || "Attachment upload failed");
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
          message: newMessage.trim(),
          attachment_url: attachmentUrl,
          attachment_name: attachmentName,
          attachment_type: attachmentType,
          attachment_size: attachmentSize,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.message) {
          setMessages((prev) => [...prev, data.message]);
          setNewMessage("");
          setUserAttachment(null);
          if (userFileInputRef.current) userFileInputRef.current.value = "";
        }
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(errData.error || "Failed to send message");
      }
    } catch (err: any) {
      alert(err?.message || "Failed to send message");
    } finally {
      setSendingMessage(false);
      setUploadingUserAttachment(false);
    }
  }

  async function handleSubmitReport(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");

    if (!currentUser) {
      setFormError("You must sign in with Discord before filing a report.");
      return;
    }

    if (!guildId.trim() || !/^\d{17,20}$/.test(guildId.trim())) {
      setFormError("Please enter a valid Discord Server (Guild) ID (17-20 digits).");
      return;
    }

    if (!title.trim() || title.trim().length < 4) {
      setFormError("Please provide a descriptive title (at least 4 characters).");
      return;
    }

    if (!description.trim() || description.trim().length < 15) {
      setFormError("Please provide detailed description and scope of the loss (at least 15 characters).");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guild_id: guildId.trim(),
          guild_name: guildName.trim() || undefined,
          bot_target: botTarget,
          category,
          title: title.trim(),
          incident_date: incidentDate.trim() || undefined,
          affected_channels: affectedChannels.trim() || undefined,
          description: description.trim(),
          evidence_links: evidenceLinks.trim() || undefined,
          priority,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit report.");
      }

      setFormSuccess(`Report #${data.report.report_code} created successfully! Opening recovery workspace...`);
      // Reset form
      setGuildId("");
      setGuildName("");
      setTitle("");
      setIncidentDate("");
      setAffectedChannels("");
      setDescription("");
      setEvidenceLinks("");

      // Refresh reports list and switch to cases view with the new report selected
      await fetchReports();
      setSelectedReport(data.report);
      setActiveTab("cases");
    } catch (err: any) {
      setFormError(err.message || "An error occurred while submitting your report.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleCopy(text: string, id: string) {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  const isStaff = Boolean(
    currentUser?.isOwner ||
    currentUser?.isAdmin ||
    currentUser?.isStaff ||
    currentUser?.id === "admin" ||
    currentUser?.id === "930306512864280607"
  );

  return (
    <div className="min-h-screen bg-[#060812] text-slate-100 flex flex-col font-sans selection:bg-brand-blue selection:text-white relative overflow-x-hidden">
      <PublicNavbar />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
        {/* ========================================================= */}
        {/* HERO SECTION */}
        {/* ========================================================= */}
        <div className="relative border-b border-white/[0.08] pb-8 mb-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-300 text-xs font-semibold uppercase tracking-wider mb-3">
                <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                <span>Incident Response &amp; Data Recovery Desk</span>
              </div>
              <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
                Data Loss Recovery &amp; Bot Inquiries
              </h1>
              <p className="text-sm sm:text-base text-slate-400 max-w-2xl mt-2 leading-relaxed">
                Experiencing missing ticket transcripts, accidental wipe, or technical bot disruptions? Open a recovery inquiry to communicate directly with SyncInk administrators and engineering leads.
              </p>
            </div>

            {/* Quick Admin shortcut if privileged user */}
            {isStaff && (
              <Link
                href="/dashboard/admin"
                className="px-4 py-2.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-xs font-bold transition-all flex items-center gap-2 shadow-sm"
              >
                <Crown className="w-4 h-4 text-amber-400" />
                <span>Open Admin Control Panel</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>

          {/* Navigation Mode Switcher */}
          <div className="flex items-center gap-2.5 mt-8 border-t border-white/[0.06] pt-6">
            <button
              onClick={() => setActiveTab("submit")}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 ${
                activeTab === "submit"
                  ? "bg-blue-600 text-white shadow-[0_0_20px_rgba(88,101,242,0.35)]"
                  : "bg-white/[0.03] text-slate-400 hover:text-white border border-white/5 hover:bg-white/[0.06]"
              }`}
            >
              <RotateCcw className="w-4 h-4" />
              <span>Submit Recovery Request</span>
            </button>

            <button
              onClick={() => setActiveTab("cases")}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 ${
                activeTab === "cases"
                  ? "bg-blue-600 text-white shadow-[0_0_20px_rgba(88,101,242,0.35)]"
                  : "bg-white/[0.03] text-slate-400 hover:text-white border border-white/5 hover:bg-white/[0.06]"
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>Recovery Chat &amp; Cases</span>
              {reports.length > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-white/20 text-white">
                  {reports.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* ========================================================= */}
        {/* AUTH CHECK / LOGIN BANNER IF LOGGED OUT */}
        {/* ========================================================= */}
        {!authLoading && !currentUser && (
          <div className="mb-8 p-6 rounded-2xl bg-blue-500/[0.06] border border-blue-500/25 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Lock className="w-4 h-4 text-blue-400" />
                Sign in with Discord to Submit or View Inquiries
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
                Authentication with your Discord account verifies server administration rights, guarantees transcript recovery access, and ensures private chat with support engineers.
              </p>
            </div>
            <a
              href="/api/auth/discord?redirect=/report"
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm transition-all shadow-[0_0_20px_rgba(88,101,242,0.35)] flex items-center gap-2 shrink-0 active:scale-[0.98]"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 127.14 96.36">
                <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,45.91,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,45.91,96.12,53,91.08,65.69,84.69,65.69Z" />
              </svg>
              <span>Continue with Discord</span>
            </a>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 1: SUBMIT RECOVERY REQUEST */}
        {/* ========================================================= */}
        {activeTab === "submit" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Form Column */}
            <div className="lg:col-span-2 space-y-6">
              <div className="p-6 sm:p-8 rounded-2xl bg-[#0b0e1d] border border-white/[0.08] shadow-2xl">
                <div className="flex items-center gap-2.5 pb-5 border-b border-white/[0.06]">
                  <RotateCcw className="w-5 h-5 text-blue-400" />
                  <div>
                    <h2 className="text-lg font-bold text-white">Create Recovery Report</h2>
                    <p className="text-xs text-slate-400">Please provide as much verifiable context as possible.</p>
                  </div>
                </div>

                {formError && (
                  <div className="mt-5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-2 text-xs sm:text-sm text-red-300">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                    <span>{formError}</span>
                  </div>
                )}

                {formSuccess && (
                  <div className="mt-5 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2 text-xs sm:text-sm text-emerald-300">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                    <span>{formSuccess}</span>
                  </div>
                )}

                <form onSubmit={handleSubmitReport} className="mt-6 space-y-5">
                  {/* Bot Target Selector */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                      <span className="flex items-center gap-1.5">
                        <DiscordEmoji src={DISCORD_CUSTOM_EMOJIS.developer.url} alt="Bot" size="xs" />
                        <span>Target Bot System</span>
                        <span className="text-red-400">*</span>
                      </span>
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {[
                        { name: "SyncInk Ticket Bot", desc: "Tickets, Threads & Transcripts", border: "hover:border-blue-500/50", active: "border-blue-500 bg-blue-500/15" },
                        { name: "SyncInk Voice Bot", desc: "Dynamic Hubs & Voice Controls", border: "hover:border-cyan-500/50", active: "border-cyan-500 bg-cyan-500/15" },
                        { name: "SyncInk Support & Security Bot", desc: "Defense Shield & Quarantine Logs", border: "hover:border-indigo-500/50", active: "border-indigo-500 bg-indigo-500/15" },
                        { name: "All / Ecosystem Incident", desc: "Cross-bot or database anomaly", border: "hover:border-emerald-500/50", active: "border-emerald-500 bg-emerald-500/15" },
                      ].map((item) => (
                        <button
                          key={item.name}
                          type="button"
                          onClick={() => setBotTarget(item.name)}
                          className={`p-3 rounded-xl border text-left transition-all ${
                            botTarget === item.name
                              ? `${item.active} text-white`
                              : `bg-white/[0.02] border-white/5 text-slate-300 ${item.border}`
                          }`}
                        >
                          <div className="font-bold text-xs">{item.name}</div>
                          <div className="text-[11px] text-slate-400 mt-0.5">{item.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Incident Category */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                      <span className="flex items-center gap-1.5">
                        <DiscordEmoji src={DISCORD_CUSTOM_EMOJIS.scenario2.url} alt="Category" size="xs" />
                        <span>Inquiry Category</span>
                        <span className="text-red-400">*</span>
                      </span>
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { id: "DATA_LOSS", label: "Major Data Loss" },
                        { id: "TRANSCRIPT_RECOVERY", label: "Transcript Recovery" },
                        { id: "BOT_OUTAGE", label: "Bot Crash / Outage" },
                        { id: "OTHER", label: "Other Technical Issue" },
                      ].map((cat) => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setCategory(cat.id)}
                          className={`py-2.5 px-3 rounded-xl text-xs font-semibold border transition-all text-center ${
                            category === cat.id
                              ? "bg-blue-600 text-white border-blue-500 shadow-sm"
                              : "bg-white/[0.02] text-slate-400 border-white/5 hover:text-white hover:bg-white/[0.05]"
                          }`}
                        >
                          {cat.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Guild ID & Guild Name */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                        <span className="flex items-center gap-1.5">
                          <DiscordEmoji src={DISCORD_CUSTOM_EMOJIS.region.url} alt="Server" size="xs" />
                          <span>Discord Server ID (Guild ID)</span>
                          <span className="text-red-400">*</span>
                        </span>
                      </label>
                      <input
                        type="text"
                        value={guildId}
                        onChange={(e) => setGuildId(e.target.value)}
                        placeholder="e.g. 1520457643842342912"
                        required
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-mono"
                      />
                      <p className="text-[11px] text-slate-500 mt-1">Right-click your server name in Discord → Copy Server ID</p>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                        Server Name (Optional)
                      </label>
                      <input
                        type="text"
                        value={guildName}
                        onChange={(e) => setGuildName(e.target.value)}
                        placeholder="e.g. SyncInk Official"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                      />
                    </div>
                  </div>

                  {/* Subject Title */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                      <span className="flex items-center gap-1.5">
                        <DiscordEmoji src={DISCORD_CUSTOM_EMOJIS.scenario1.url} alt="Subject" size="xs" />
                        <span>Subject / Summary</span>
                        <span className="text-red-400">*</span>
                      </span>
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Requesting recovery for 12 ticket transcripts from yesterday's migration"
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                    />
                  </div>

                  {/* Date & Affected Channels */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                        Approximate Date &amp; Time of Loss
                      </label>
                      <input
                        type="text"
                        value={incidentDate}
                        onChange={(e) => setIncidentDate(e.target.value)}
                        placeholder="e.g. Yesterday ~6:30 PM UTC"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                        <span className="flex items-center gap-1.5">
                          <DiscordEmoji src={DISCORD_CUSTOM_EMOJIS.scenario3.url} alt="Channels" size="xs" />
                          <span>Affected Channels / Threads</span>
                        </span>
                      </label>
                      <input
                        type="text"
                        value={affectedChannels}
                        onChange={(e) => setAffectedChannels(e.target.value)}
                        placeholder="e.g. #tickets (1520...), ticket-0042"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-mono"
                      />
                    </div>
                  </div>

                  {/* Detailed Description */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                      <span className="flex items-center gap-1.5">
                        <DiscordEmoji src={DISCORD_CUSTOM_EMOJIS.experience.url} alt="Notes" size="xs" />
                        <span>Detailed Incident Notes &amp; Data Lost</span>
                        <span className="text-red-400">*</span>
                      </span>
                    </label>
                    <textarea
                      rows={5}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Please explain what data is missing, what command or event triggered it, any specific users or ticket creators involved, and what you need recovered..."
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all resize-y"
                    />
                  </div>

                  {/* Evidence / Transcript Hashes */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                      <span className="flex items-center gap-1.5">
                        <DiscordEmoji src={DISCORD_CUSTOM_EMOJIS.verified.url} alt="Evidence" size="xs" />
                        <span>Evidence Links, Transcripts or Screenshot URLs</span>
                      </span>
                    </label>
                    <input
                      type="text"
                      value={evidenceLinks}
                      onChange={(e) => setEvidenceLinks(e.target.value)}
                      placeholder="e.g. https://syncink.site/dashboard/... or Imgur / Discord message links"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                    />
                  </div>

                  {/* Priority selector */}
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-xs text-slate-400">Urgency Level:</span>
                    <div className="flex items-center gap-2">
                      {(["NORMAL", "HIGH", "CRITICAL"] as const).map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setPriority(p)}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition-all border ${
                            priority === p
                              ? p === "CRITICAL"
                                ? "bg-red-500/20 text-red-300 border-red-500/40"
                                : p === "HIGH"
                                ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                                : "bg-blue-500/20 text-blue-300 border-blue-500/40"
                              : "bg-white/[0.02] text-slate-400 border-white/5 hover:bg-white/[0.05]"
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-4 border-t border-white/[0.06]">
                    <button
                      type="submit"
                      disabled={submitting || !currentUser}
                      className="w-full py-3.5 px-6 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-sm transition-all shadow-[0_0_24px_rgba(88,101,242,0.4)] flex items-center justify-center gap-2 active:scale-[0.98]"
                    >
                      {submitting ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Dispatching Recovery Case...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>Submit Report &amp; Open Chat</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Sidebar Guidelines Column */}
            <div className="space-y-6">
              {/* How Recovery Works */}
              <div className="p-6 rounded-2xl bg-[#0b0e1d] border border-white/[0.08] space-y-4">
                <div className="flex items-center gap-2 text-blue-400">
                  <Database className="w-4 h-4" />
                  <h3 className="font-bold text-white text-sm">How Data Recovery Works</h3>
                </div>
                <ul className="space-y-3 text-xs text-slate-300 leading-relaxed">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span>
                      <strong className="text-white">Continuous Archiving:</strong> Ticket Bot message batches, attachments, and thread events are backed up to PostgreSQL.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span>
                      <strong className="text-white">Transcript Retrieval:</strong> If a ticket channel was pruned or closed prematurely, we can export HTML/JSON transcripts directly into your dashboard.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span>
                      <strong className="text-white">Admin Two-Way Chat:</strong> Administrators and the primary owner can reply, provide recovery links, and troubleshoot directly in the browser chat.
                    </span>
                  </li>
                </ul>
              </div>

              {/* Verified Identity Card */}
              {currentUser && (
                <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06] flex items-center gap-3">
                  <div className="relative">
                    <img
                      src={
                        currentUser.avatar
                          ? `https://cdn.discordapp.com/avatars/${currentUser.id}/${currentUser.avatar}.png`
                          : `https://cdn.discordapp.com/embed/avatars/0.png`
                      }
                      alt={currentUser.username}
                      className="w-11 h-11 rounded-xl object-cover border border-white/10"
                    />
                    <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-[#060812]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-white truncate">
                      {currentUser.global_name || currentUser.username}
                    </div>
                    <div className="text-[11px] font-mono text-slate-400 truncate">
                      ID: {currentUser.id}
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    {isStaff ? "Staff / Admin" : "Verified"}
                  </span>
                </div>
              )}

              {/* Direct Discord Support Emergency Server */}
              <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-900/20 to-purple-900/10 border border-blue-500/20 space-y-3">
                <div className="flex items-center gap-2 text-blue-300 text-xs font-bold uppercase tracking-wider">
                  <Sparkles className="w-4 h-4 text-blue-400" />
                  <span>Immediate Escalation</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Need real-time voice or urgent raid response? Join our official support guild to ping our on-call moderation and development teams directly.
                </p>
                <a
                  href="https://discord.gg/PmxfJwmQuB"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-4 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2"
                >
                  <span>Support Discord Server</span>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                </a>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: RECOVERY CHAT & ACTIVE CASES WORKSPACE */}
        {/* ========================================================= */}
        {activeTab === "cases" && (
          <div>
            {reports.length === 0 && !reportsLoading ? (
              <div className="text-center py-16 px-4 rounded-2xl bg-[#0b0e1d] border border-white/[0.08]">
                <RotateCcw className="w-10 h-10 text-slate-500 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-white">No Recovery Reports Filed</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  You have not submitted any data loss recovery inquiries yet. Click below to file a new case.
                </p>
                <button
                  onClick={() => setActiveTab("submit")}
                  className="mt-5 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md inline-flex items-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Create Recovery Inquiry</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[580px] lg:min-h-[640px]">
                {/* Reports Selector Sidebar */}
                <div
                  className={`lg:col-span-4 bg-[#0b0e1d] border border-white/[0.08] rounded-2xl p-4 flex flex-col h-[580px] lg:h-[640px] ${
                    mobileShowChat && selectedReport ? "hidden lg:flex" : "flex"
                  }`}
                >
                  <div className="flex items-center justify-between pb-3 border-b border-white/[0.06] mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                      Your Inquiries ({reports.length})
                    </span>
                    <button
                      onClick={fetchReports}
                      disabled={reportsLoading}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                      title="Refresh reports"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${reportsLoading ? "animate-spin" : ""}`} />
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                    {reports.map((rep) => {
                      const isSelected = selectedReport?.id === rep.id;
                      const statusColors = {
                        OPEN: "bg-red-500/10 text-red-400 border-red-500/25",
                        IN_PROGRESS: "bg-amber-500/10 text-amber-400 border-amber-500/25",
                        RESOLVED: "bg-emerald-500/10 text-emerald-400 border-emerald-500/25",
                        CLOSED: "bg-slate-500/10 text-slate-400 border-slate-500/25",
                      };

                      return (
                        <button
                          key={rep.id}
                          onClick={() => {
                            setSelectedReport(rep);
                            setMobileShowChat(true);
                          }}
                          className={`w-full p-3.5 rounded-xl border text-left transition-all ${
                            isSelected
                              ? "bg-blue-600/15 border-blue-500 text-white shadow-sm"
                              : "bg-white/[0.02] border-white/5 text-slate-300 hover:bg-white/[0.05]"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="font-mono text-xs font-bold text-blue-400">
                              #{rep.report_code}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${
                                statusColors[rep.status] || statusColors.OPEN
                              }`}
                            >
                              {rep.status.replace("_", " ")}
                            </span>
                          </div>

                          <div className="font-semibold text-xs text-white line-clamp-1 mb-1">
                            {rep.title}
                          </div>

                          <div className="flex items-center justify-between text-[11px] text-slate-400">
                            <span className="truncate max-w-[140px]">{rep.bot_target}</span>
                            <span>{new Date(rep.created_at).toLocaleDateString()}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <div className="pt-3 border-t border-white/[0.06] mt-auto">
                    <button
                      onClick={() => setActiveTab("submit")}
                      className="w-full py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 text-xs font-bold transition-all border border-white/5 flex items-center justify-center gap-1.5"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>New Inquiry</span>
                    </button>
                  </div>
                </div>

                {/* Main Chat Workspace */}
                <div
                  className={`lg:col-span-8 bg-[#0b0e1d] border border-white/[0.08] rounded-2xl flex flex-col h-[580px] lg:h-[640px] overflow-hidden ${
                    !mobileShowChat && !selectedReport ? "hidden lg:flex" : "flex"
                  }`}
                >
                  {selectedReport ? (
                    <>
                      {/* Case Header */}
                      <div className="p-3.5 sm:p-5 border-b border-white/[0.08] bg-white/[0.02] flex flex-wrap items-center justify-between gap-3 shrink-0">
                        <div className="flex items-center gap-2.5 min-w-0">
                          {/* Back Button on Mobile */}
                          <button
                            type="button"
                            onClick={() => setMobileShowChat(false)}
                            className="lg:hidden p-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 transition-colors shrink-0"
                            title="Back to inquiries"
                          >
                            <ArrowLeft className="w-4 h-4" />
                          </button>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className="font-mono text-sm font-black text-blue-400">
                                #{selectedReport.report_code}
                              </span>
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                {selectedReport.bot_target}
                              </span>
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-white/[0.04] text-slate-300 border border-white/10">
                                {selectedReport.category.replace("_", " ")}
                              </span>
                              {selectedReport.attachments_allowed ? (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                                  <Unlock className="w-2.5 h-2.5" />
                                  <span>Uploads Active</span>
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-white/[0.03] text-slate-400 border border-white/5 flex items-center gap-1">
                                  <Lock className="w-2.5 h-2.5 text-slate-500" />
                                  <span>Uploads Locked</span>
                                </span>
                              )}
                            </div>
                            <h3 className="font-bold text-xs sm:text-base text-white truncate">
                              {selectedReport.title}
                            </h3>
                            <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                              <span>
                                Server ID: <code className="font-mono text-slate-300">{selectedReport.guild_id}</code>
                              </span>
                              {selectedReport.assigned_staff_name && (
                                <>
                                  <span>•</span>
                                  <span className="text-emerald-400 font-semibold">
                                    Assigned: {selectedReport.assigned_staff_name}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Status badge */}
                        <div className="flex items-center gap-2 shrink-0">
                          <span
                            className={`px-3 py-1 rounded-xl text-xs font-bold border uppercase tracking-wider ${
                              selectedReport.status === "RESOLVED"
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/25"
                                : selectedReport.status === "IN_PROGRESS"
                                ? "bg-amber-500/10 text-amber-400 border-amber-500/25"
                                : "bg-red-500/10 text-red-400 border-red-500/25"
                            }`}
                          >
                            {selectedReport.status.replace("_", " ")}
                          </span>
                        </div>
                      </div>

                      {/* Chat Messages Body */}
                      <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-3.5 sm:p-5 space-y-3.5">
                        {/* Initial system banner */}
                        <div className="p-3 rounded-xl bg-blue-500/[0.05] border border-blue-500/15 text-xs text-slate-300 flex items-start gap-2.5">
                          <Sparkles className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold text-white">Live Support Mirror:</span> Messages sent here mirror directly to our Discord Support staff thread. If screenshots or database logs are requested, staff can grant attachment upload access inside this desk.
                          </div>
                        </div>

                        {messagesLoading && messages.length === 0 ? (
                          <div className="text-center py-10 text-xs text-slate-500 flex items-center justify-center gap-2">
                            <RefreshCw className="w-4 h-4 animate-spin text-blue-400" />
                            <span>Loading case conversation...</span>
                          </div>
                        ) : (
                          messages.map((msg) => {
                            if (msg.message_type === "SYSTEM") {
                              return (
                                <div key={msg.id} className="flex justify-center my-1.5">
                                  <div className="px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-white/10 text-[11px] text-slate-300 flex items-center gap-2 shadow-sm">
                                    <Sparkles className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                                    <span>{msg.message}</span>
                                    <span className="text-slate-500 text-[10px] ml-1">
                                      {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                    </span>
                                  </div>
                                </div>
                              );
                            }

                            const isStaffMsg = msg.is_staff_reply || msg.sender_role !== "USER";
                            const isMe = String(msg.sender_id) === String(currentUser?.id);

                            return (
                              <div
                                key={msg.id}
                                className={`flex items-start gap-2.5 sm:gap-3 ${isMe ? "justify-end" : "justify-start"}`}
                              >
                                {!isMe && (
                                  <img
                                    src={
                                      msg.sender_avatar
                                        ? `https://cdn.discordapp.com/avatars/${msg.sender_id}/${msg.sender_avatar}.png`
                                        : `https://cdn.discordapp.com/embed/avatars/0.png`
                                    }
                                    alt={msg.sender_name}
                                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg object-cover border border-white/10 shrink-0 mt-1"
                                  />
                                )}

                                <div className={`max-w-[88%] sm:max-w-[78%] ${isMe ? "items-end" : "items-start"}`}>
                                  {/* Sender info */}
                                  <div
                                    className={`flex items-center gap-1.5 mb-1 text-[11px] ${
                                      isMe ? "justify-end" : "justify-start"
                                    }`}
                                  >
                                    <span className="font-bold text-white text-[11px]">{msg.sender_name}</span>
                                    {msg.sender_role === "OWNER" && (
                                      <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                        👑 Owner
                                      </span>
                                    )}
                                    {msg.sender_role === "ADMIN" && (
                                      <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold uppercase tracking-wider bg-red-500/20 text-red-300 border border-red-500/30">
                                        🛡️ Admin
                                      </span>
                                    )}
                                    {msg.sender_role === "STAFF" && (
                                      <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-500/30">
                                        Staff
                                      </span>
                                    )}
                                    <span className="text-slate-500 text-[10px]">
                                      {new Date(msg.created_at).toLocaleTimeString([], {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })}
                                    </span>
                                  </div>

                                  {/* Bubble */}
                                  <div
                                    className={`p-3 sm:p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed whitespace-pre-wrap ${
                                      isMe
                                        ? "bg-blue-600 text-white rounded-tr-none shadow-md"
                                        : isStaffMsg
                                        ? "bg-gradient-to-r from-[#171b30] to-[#121626] border border-blue-500/30 text-slate-100 rounded-tl-none shadow-sm"
                                        : "bg-white/[0.04] border border-white/[0.08] text-slate-200 rounded-tl-none"
                                    }`}
                                  >
                                    {msg.message && <div>{msg.message}</div>}

                                    {/* Attachment rendering */}
                                    {msg.attachment_url && (
                                      <div className="mt-2.5 pt-2 border-t border-white/[0.1]">
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
                                            <div className="flex items-center gap-1 text-[10px] text-slate-300 mt-1 group-hover:underline">
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
                                            <span className="truncate max-w-[180px]">
                                              {msg.attachment_name || "Download File"}
                                            </span>
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

                                {isMe && (
                                  <img
                                    src={
                                      currentUser?.avatar
                                        ? `https://cdn.discordapp.com/avatars/${currentUser.id}/${currentUser.avatar}.png`
                                        : `https://cdn.discordapp.com/embed/avatars/0.png`
                                    }
                                    alt="You"
                                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg object-cover border border-white/10 shrink-0 mt-1"
                                  />
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>

                      {/* Chat Input & Composer */}
                      <form
                        onSubmit={handleSendMessage}
                        className="p-3 sm:p-4 border-t border-white/[0.08] bg-[#070914] flex flex-col gap-2 shrink-0"
                      >
                        {/* Selected file preview pill */}
                        {userAttachment && (
                          <div className="px-3 py-1.5 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-between text-xs text-blue-200">
                            <div className="flex items-center gap-2 truncate">
                              <Paperclip className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                              <span className="truncate font-medium">{userAttachment.name}</span>
                              <span className="text-[10px] text-blue-300/70 shrink-0">
                                ({Math.round(userAttachment.size / 1024)} KB)
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setUserAttachment(null);
                                if (userFileInputRef.current) userFileInputRef.current.value = "";
                              }}
                              className="p-1 hover:bg-blue-500/20 rounded text-blue-300 transition-colors ml-2"
                              title="Remove attachment"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}

                        <div className="flex items-center gap-2">
                          {/* Hidden File Input */}
                          <input
                            type="file"
                            ref={userFileInputRef}
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                setUserAttachment(e.target.files[0]);
                              }
                            }}
                            className="hidden"
                            disabled={!selectedReport.attachments_allowed}
                          />

                          {/* Paperclip Button with Security Permission State */}
                          <button
                            type="button"
                            onClick={() => {
                              if (selectedReport.attachments_allowed) {
                                userFileInputRef.current?.click();
                              }
                            }}
                            disabled={!selectedReport.attachments_allowed || sendingMessage || uploadingUserAttachment}
                            className={`p-2.5 rounded-xl transition-all border shrink-0 flex items-center justify-center ${
                              selectedReport.attachments_allowed
                                ? "bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border-blue-500/40 cursor-pointer shadow-[0_0_12px_rgba(59,130,246,0.2)]"
                                : "bg-white/[0.02] text-slate-600 border-white/5 cursor-not-allowed opacity-60"
                            }`}
                            title={
                              selectedReport.attachments_allowed
                                ? "Attach screenshot, logs, or file (Permission granted)"
                                : "Attachment uploads locked by support staff. Ask in chat to enable."
                            }
                          >
                            {selectedReport.attachments_allowed ? (
                              <Paperclip className="w-4 h-4 text-blue-400" />
                            ) : (
                              <Lock className="w-4 h-4 text-slate-500" />
                            )}
                          </button>

                          <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder={
                              selectedReport.attachments_allowed
                                ? "Type recovery reply or attach files... (Press Enter)"
                                : "Type recovery inquiry or statement... (Press Enter)"
                            }
                            disabled={sendingMessage || uploadingUserAttachment}
                            className="flex-1 px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                          />

                          <button
                            type="submit"
                            disabled={
                              sendingMessage ||
                              uploadingUserAttachment ||
                              (!newMessage.trim() && !userAttachment)
                            }
                            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-bold text-xs sm:text-sm transition-all flex items-center gap-1.5 shadow-md shrink-0"
                          >
                            <Send className="w-4 h-4" />
                            <span className="hidden sm:inline">
                              {uploadingUserAttachment ? "Uploading..." : sendingMessage ? "Sending..." : "Send"}
                            </span>
                          </button>
                        </div>
                      </form>
                    </>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-slate-400">
                      <MessageSquare className="w-10 h-10 text-slate-600 mb-2" />
                      <p className="text-sm font-semibold text-white">Select a case on the left to open chat</p>
                      <p className="text-xs text-slate-500 mt-1">Chat history and recovery updates will appear here.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <PublicFooter />
    </div>
  );
}
