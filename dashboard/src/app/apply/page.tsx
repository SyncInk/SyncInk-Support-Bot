"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Shield,
  Code,
  CheckCircle2,
  AlertCircle,
  Upload,
  ArrowRight,
  Sparkles,
  Lock,
  Globe,
  Clock,
  Send,
  UserCheck,
  LogIn,
  RefreshCw,
  XCircle,
  ChevronDown,
  ChevronUp,
  FileText,
  ExternalLink,
  MessageSquare,
  Award,
} from "lucide-react";
import { PublicNavbar } from "@/components/PublicNavbar";
import { PublicFooter } from "@/components/PublicFooter";
import { DISCORD_CUSTOM_EMOJIS } from "@/lib/custom-emojis";

interface UserInfo {
  id: string;
  username: string;
  global_name?: string;
  avatar?: string;
  role?: string;
}

interface ApplicationRecord {
  id: number;
  guild_id: string;
  user_id: string;
  username: string;
  global_name?: string;
  avatar?: string;
  app_type: "staff" | "developer";
  age: number;
  timezone: string;
  availability?: string;
  reason?: string;
  experience?: string;
  scenario_1?: string;
  scenario_2?: string;
  scenario_3?: string;
  languages?: string;
  portfolio?: string;
  bot_experience?: string;
  complex_features?: string;
  attachment_name?: string;
  status: "PENDING" | "UNDER_REVIEW" | "ACCEPTED" | "REJECTED" | string;
  reviewer_id?: string;
  reviewer_name?: string;
  reviewer_notes?: string;
  created_at: string;
  reviewed_at?: string;
}

const COUNTRIES_MAP: Record<string, string> = {
  afghanistan: "🇦🇫", albania: "🇦🇱", algeria: "🇩🇿", argentina: "🇦🇷", australia: "🇦🇺",
  austria: "🇦🇹", bangladesh: "🇧🇩", belgium: "🇧🇪", brazil: "🇧🇷", canada: "🇨🇦",
  chile: "🇨🇱", china: "🇨🇳", colombia: "🇨🇴", croatia: "🇭🇷", "czech republic": "🇨🇿",
  denmark: "🇩🇰", egypt: "🇪🇬", finland: "🇫🇮", france: "🇫🇷", germany: "🇩🇪",
  greece: "🇬🇷", hungary: "🇭🇺", india: "🇮🇳", indonesia: "🇮🇩", iran: "🇮🇷",
  iraq: "🇮🇶", ireland: "🇮🇪", israel: "🇮🇱", italy: "🇮🇹", japan: "🇯🇵",
  malaysia: "🇲🇾", mexico: "🇲🇽", morocco: "🇲🇦", netherlands: "🇳🇱", "new zealand": "🇳🇿",
  nigeria: "🇳🇬", norway: "🇳🇴", pakistan: "🇵🇰", peru: "🇵🇪", philippines: "🇵🇭",
  poland: "🇵🇱", portugal: "🇵🇹", romania: "🇷🇴", russia: "🇷🇺", "saudi arabia": "🇸🇦",
  singapore: "🇸🇬", "south africa": "🇿🇦", "south korea": "🇰🇷", spain: "🇪🇸",
  sweden: "🇸🇪", switzerland: "🇨🇭", taiwan: "🇹🇼", thailand: "🇹🇭", turkey: "🇹🇷",
  ukraine: "🇺🇦", "united arab emirates": "🇦🇪", uae: "🇦🇪", "united kingdom": "🇬🇧",
  uk: "🇬🇧", england: "🇬🇧", "united states": "🇺🇸", usa: "🇺🇸", america: "🇺🇸", vietnam: "🇻🇳"
};

function getCountryFlag(input: string): string | null {
  const clean = input.trim().toLowerCase();
  if (!clean) return null;
  if (COUNTRIES_MAP[clean]) return COUNTRIES_MAP[clean];
  for (const [key, flag] of Object.entries(COUNTRIES_MAP)) {
    if (key.startsWith(clean) || clean.includes(key)) {
      return flag;
    }
  }
  return null;
}

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

export default function ApplyPage() {
  const [activeTab, setActiveTab] = useState<"staff" | "developer">("staff");
  const [user, setUser] = useState<UserInfo | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Status & Duplicate Guard
  const [existingApp, setExistingApp] = useState<ApplicationRecord | null>(null);
  const [appLoading, setAppLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showSubmittedDetails, setShowSubmittedDetails] = useState(false);

  // Form fields: Staff
  const [staffAge, setStaffAge] = useState("");
  const [staffTimezone, setStaffTimezone] = useState("");
  const [staffAvailability, setStaffAvailability] = useState("");
  const [staffReason, setStaffReason] = useState("");
  const [staffExp, setStaffExp] = useState("");
  const [staffScen1, setStaffScen1] = useState("");
  const [staffScen2, setStaffScen2] = useState("");
  const [staffScen3, setStaffScen3] = useState("");

  // Form fields: Developer
  const [devAge, setDevAge] = useState("");
  const [devTimezone, setDevTimezone] = useState("");
  const [devLangs, setDevLangs] = useState("");
  const [devPortfolio, setDevPortfolio] = useState("");
  const [devBotExp, setDevBotExp] = useState("");
  const [devComplex, setDevComplex] = useState("");
  const [devFile, setDevFile] = useState<File | null>(null);

  // UI state
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Fetch Authenticated User
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated && data.user) {
            setUser(data.user);
          }
        }
      } catch (err) {
        console.error("Auth check error:", err);
      } finally {
        setAuthLoading(false);
      }
    }
    checkAuth();
  }, []);

  // Fetch User's Application Status
  const fetchApplicationStatus = async () => {
    try {
      setRefreshing(true);
      const res = await fetch("/api/apply");
      if (res.ok) {
        const data = await res.json();
        if (data.hasApplication && data.application) {
          setExistingApp(data.application);
        } else {
          setExistingApp(null);
        }
      }
    } catch (err) {
      console.error("Failed to load application status:", err);
    } finally {
      setRefreshing(false);
      setAppLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user) {
      fetchApplicationStatus();
    } else if (!authLoading && !user) {
      setAppLoading(false);
    }
  }, [authLoading, user]);

  const staffFlag = getCountryFlag(staffTimezone);
  const devFlag = getCountryFlag(devTimezone);

  async function handleStaffSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage("");

    if (!user) {
      setErrorMessage("Please sign in with Discord before submitting.");
      return;
    }

    const ageNum = parseInt(staffAge, 10);
    if (isNaN(ageNum) || ageNum < 13 || ageNum > 99) {
      setErrorMessage("You must be at least 13 years old to apply.");
      return;
    }
    if (!staffTimezone.trim()) {
      setErrorMessage("Please enter your country or region.");
      return;
    }
    if (!staffAvailability) {
      setErrorMessage("Please select your weekly availability.");
      return;
    }
    if (staffReason.trim().length < 15) {
      setErrorMessage("Reason for joining must be at least 15 characters.");
      return;
    }
    if (staffExp.trim().length < 15) {
      setErrorMessage("Moderation experience must be at least 15 characters.");
      return;
    }
    if (staffScen1.trim().length < 15 || staffScen2.trim().length < 15 || staffScen3.trim().length < 15) {
      setErrorMessage("All scenario answers must be at least 15 characters long.");
      return;
    }

    setSubmitting(true);
    try {
      const regionFormatted = staffFlag ? `${staffFlag} ${staffTimezone}` : staffTimezone;
      const res = await fetch("/api/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appType: "staff",
          age: ageNum,
          timezone: regionFormatted,
          availability: staffAvailability,
          reason: staffReason,
          exp: staffExp,
          scen1: staffScen1,
          scen2: staffScen2,
          scen3: staffScen3,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Submission failed. Please try again.");
      }

      // Refresh application status to instantly show Under Review tracker
      await fetchApplicationStatus();
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to submit application.");
      // If error was 409 or duplicate, refresh to display status
      if (err.message && err.message.includes("already have an active")) {
        await fetchApplicationStatus();
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDevSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage("");

    if (!user) {
      setErrorMessage("Please sign in with Discord before submitting.");
      return;
    }

    const ageNum = parseInt(devAge, 10);
    if (isNaN(ageNum) || ageNum < 13 || ageNum > 99) {
      setErrorMessage("You must be at least 13 years old to apply.");
      return;
    }
    if (!devTimezone.trim()) {
      setErrorMessage("Please enter your country or region.");
      return;
    }
    if (!devLangs.trim()) {
      setErrorMessage("Please list your primary programming languages/technologies.");
      return;
    }
    if (devPortfolio.trim().length < 5) {
      setErrorMessage("Please enter a valid GitHub or portfolio URL.");
      return;
    }
    if (devBotExp.trim().length < 15) {
      setErrorMessage("Bot experience description must be at least 15 characters.");
      return;
    }
    if (devComplex.trim().length < 15) {
      setErrorMessage("Complex feature description must be at least 15 characters.");
      return;
    }

    setSubmitting(true);
    try {
      const regionFormatted = devFlag ? `${devFlag} ${devTimezone}` : devTimezone;
      const formData = new FormData();
      formData.append("appType", "developer");
      formData.append("age", String(ageNum));
      formData.append("timezone", regionFormatted);
      formData.append("langs", devLangs);
      formData.append("portfolio", devPortfolio);
      formData.append("bot_exp", devBotExp);
      formData.append("complex", devComplex);
      if (devFile) {
        formData.append("attachment", devFile);
      }

      const res = await fetch("/api/apply", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Submission failed. Please try again.");
      }

      // Refresh status to instantly transition to Under Review tracker
      await fetchApplicationStatus();
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to submit application.");
      if (err.message && err.message.includes("already have an active")) {
        await fetchApplicationStatus();
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#060812] text-slate-100 flex flex-col selection:bg-brand-red selection:text-white font-sans relative overflow-x-hidden">
      <PublicNavbar />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        {/* Recruitment Header */}
        <div className="text-center mb-8 sm:mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-red/10 border border-brand-red/25 text-brand-crimson text-xs font-bold tracking-wider uppercase mb-4 shadow-[0_0_15px_rgba(231,76,60,0.15)]">
            <Sparkles className="w-3.5 h-3.5" />
            SyncInk Team Recruitment
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white mb-3">
            Join the <span className="bg-gradient-to-r from-brand-crimson via-purple-400 to-accent-cyan bg-clip-text text-transparent">SyncInk Team</span>
          </h1>
          <p className="text-sm sm:text-base text-slate-400 max-w-xl mx-auto leading-relaxed">
            Help shape the future of modern Discord bot infrastructure. We are actively reviewing dedicated staff members and talented bot engineers.
          </p>
        </div>

        {/* LOADING INDICATOR */}
        {authLoading || appLoading ? (
          <div className="p-12 rounded-2xl bg-[#0d111d]/90 border border-white/10 shadow-2xl text-center backdrop-blur-xl">
            <div className="w-12 h-12 border-2 border-brand-crimson/30 border-t-brand-crimson rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm font-mono text-slate-400">Verifying Discord Session & Application Records...</p>
          </div>
        ) : existingApp ? (
          /* ========================================================================= */
          /* EXISTING APPLICATION STATUS & TRACKER CARD (ANTI-DUPLICATE GUARD)         */
          /* ========================================================================= */
          <div className="rounded-2xl bg-[#0d111d]/95 border border-white/10 shadow-2xl overflow-hidden backdrop-blur-xl">
            {/* Header Status Bar */}
            <div className="p-5 sm:p-6 border-b border-white/[0.08] bg-black/40 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <img
                  src={
                    user?.avatar
                      ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`
                      : "https://files.catbox.moe/74l9su.png"
                  }
                  alt={user?.username || "Candidate"}
                  className="w-12 h-12 rounded-full border border-white/15 object-cover"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-base">
                      {user?.global_name || user?.username}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">@{user?.username}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span>Candidate ID: <code className="text-accent-cyan font-mono">{user?.id}</code></span>
                    <span>•</span>
                    <span className="font-mono text-slate-300">App #{existingApp.id}</span>
                  </div>
                </div>
              </div>

              {/* Status Pill */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={fetchApplicationStatus}
                  disabled={refreshing}
                  title="Check for status updates"
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-all disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin text-brand-crimson" : ""}`} />
                </button>

                {existingApp.status === "REJECTED" ? (
                  <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-rose-500/15 border border-rose-500/35 text-rose-300 text-xs font-bold shadow-[0_0_15px_rgba(244,63,94,0.2)]">
                    <XCircle className="w-4 h-4 text-rose-400" />
                    Application Rejected
                  </div>
                ) : existingApp.status === "ACCEPTED" ? (
                  <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/35 text-emerald-300 text-xs font-bold shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    Accepted Member
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/35 text-amber-300 text-xs font-bold animate-pulse shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                    <Clock className="w-4 h-4 text-amber-400" />
                    Under Review
                  </div>
                )}
              </div>
            </div>

            {/* Application Progress Stepper */}
            <div className="p-6 sm:p-8 border-b border-white/[0.08] bg-black/20">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-6 flex items-center justify-between">
                <span>Application Review Lifecycle</span>
                <span className="font-mono text-[11px] text-slate-500">
                  Submitted {new Date(existingApp.created_at).toLocaleDateString()}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 relative">
                {/* Step 1: Submission */}
                <div className="flex sm:flex-col items-center sm:items-start gap-3 sm:gap-2">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-emerald-400 font-bold text-xs shrink-0">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">1. Submitted</div>
                    <div className="text-[11px] text-slate-400">Encrypted in DB</div>
                  </div>
                </div>

                {/* Step 2: Verification */}
                <div className="flex sm:flex-col items-center sm:items-start gap-3 sm:gap-2">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-emerald-400 font-bold text-xs shrink-0">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">2. Verified</div>
                    <div className="text-[11px] text-slate-400">Discord OAuth ID</div>
                  </div>
                </div>

                {/* Step 3: Evaluation */}
                <div className="flex sm:flex-col items-center sm:items-start gap-3 sm:gap-2">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                      existingApp.status === "ACCEPTED"
                        ? "bg-emerald-500/20 border border-emerald-500/50 text-emerald-400"
                        : existingApp.status === "REJECTED"
                        ? "bg-rose-500/20 border border-rose-500/50 text-rose-400"
                        : "bg-amber-500/20 border border-amber-500/50 text-amber-400 animate-pulse"
                    }`}
                  >
                    {existingApp.status === "ACCEPTED" || existingApp.status === "REJECTED" ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <Clock className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">3. Management Review</div>
                    <div className="text-[11px] text-slate-400">
                      {existingApp.status === "PENDING" || existingApp.status === "UNDER_REVIEW"
                        ? "Active Evaluation"
                        : "Completed"}
                    </div>
                  </div>
                </div>

                {/* Step 4: Decision */}
                <div className="flex sm:flex-col items-center sm:items-start gap-3 sm:gap-2">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                      existingApp.status === "ACCEPTED"
                        ? "bg-emerald-500/20 border border-emerald-500/50 text-emerald-400"
                        : existingApp.status === "REJECTED"
                        ? "bg-rose-500/20 border border-rose-500/50 text-rose-400"
                        : "bg-white/5 border border-white/10 text-slate-500"
                    }`}
                  >
                    {existingApp.status === "ACCEPTED" ? (
                      <Award className="w-4 h-4" />
                    ) : existingApp.status === "REJECTED" ? (
                      <XCircle className="w-4 h-4" />
                    ) : (
                      "4"
                    )}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">4. Final Outcome</div>
                    <div className="text-[11px] text-slate-400">
                      {existingApp.status === "ACCEPTED"
                        ? "Accepted"
                        : existingApp.status === "REJECTED"
                        ? "Closed"
                        : "Awaiting Verdict"}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Dynamic Status Content */}
            <div className="p-6 sm:p-8 space-y-6">
              {existingApp.status === "REJECTED" ? (
                /* REJECTED STATE */
                <div className="space-y-4">
                  <div className="p-4 sm:p-5 rounded-xl bg-rose-500/10 border border-rose-500/25 flex items-start gap-3">
                    <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <div className="font-bold text-white text-sm">
                        Application Concluded — Status: Rejected
                      </div>
                      <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                        Thank you for taking the time to apply to the SyncInk team. After thorough evaluation by our management team, we are unable to offer you a position at this time.
                      </p>
                    </div>
                  </div>

                  {existingApp.reviewer_notes && (
                    <div className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-1.5">
                      <div className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-2">
                        <MessageSquare className="w-3.5 h-3.5" />
                        Feedback from Reviewers:
                      </div>
                      <div className="text-sm text-slate-200 italic whitespace-pre-wrap leading-relaxed pl-2 border-l-2 border-rose-500/40">
                        "{existingApp.reviewer_notes}"
                      </div>
                    </div>
                  )}

                  {/* Anti-Spam Notice */}
                  <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-xs text-slate-400 flex items-center gap-2">
                    <Lock className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>
                      <strong className="text-slate-300">Anti-Duplicate Policy:</strong> Repeated submissions are locked to prevent spam and preserve record integrity.
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <a
                      href="https://discord.gg/PmxfJwmQuB"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#5865F2] hover:bg-[#4752c4] text-white text-xs font-bold transition-all shadow-md"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Contact Support Server
                    </a>
                    <Link
                      href="/"
                      className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition-all border border-white/10"
                    >
                      Return to Home
                    </Link>
                  </div>
                </div>
              ) : existingApp.status === "ACCEPTED" ? (
                /* ACCEPTED STATE */
                <div className="space-y-4">
                  <div className="p-4 sm:p-5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <div className="font-bold text-white text-sm">
                        Congratulations! Application Approved
                      </div>
                      <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                        Welcome aboard! Your application was approved by the SyncInk Senior Management team. You have been granted access to team resources and channels.
                      </p>
                    </div>
                  </div>

                  {existingApp.reviewer_notes && (
                    <div className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-1.5">
                      <div className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                        <MessageSquare className="w-3.5 h-3.5" />
                        Management Onboarding Note:
                      </div>
                      <div className="text-sm text-slate-200 italic whitespace-pre-wrap leading-relaxed pl-2 border-l-2 border-emerald-500/40">
                        "{existingApp.reviewer_notes}"
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <a
                      href="https://discord.gg/PmxfJwmQuB"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#5865F2] hover:bg-[#4752c4] text-white text-xs font-bold transition-all shadow-md"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Join Staff Discord
                    </a>
                    <Link
                      href="/dashboard"
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-xs font-bold transition-all shadow-md"
                    >
                      Open Command Dashboard
                    </Link>
                  </div>
                </div>
              ) : (
                /* UNDER REVIEW STATE */
                <div className="space-y-4">
                  <div className="p-4 sm:p-5 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-3">
                    <Clock className="w-5 h-5 text-amber-400 shrink-0 mt-0.5 animate-pulse" />
                    <div className="space-y-1">
                      <div className="font-bold text-white text-sm">
                        Application Currently Under Review
                      </div>
                      <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                        Your submission has been dispatched directly to the SyncInk management gateway. Reviewers evaluate applications in the order received, typically within 24 to 48 hours.
                      </p>
                    </div>
                  </div>

                  {/* Anti-Duplicate Notice */}
                  <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-xs text-slate-400 flex items-center gap-2">
                    <Lock className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>
                      <strong className="text-slate-300">Notice:</strong> You cannot submit duplicate applications while an existing submission is under review.
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={fetchApplicationStatus}
                      disabled={refreshing}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-crimson/20 hover:bg-brand-crimson/30 border border-brand-crimson/40 text-white text-xs font-bold transition-all"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
                      Check Application Status
                    </button>
                    <a
                      href="https://discord.gg/PmxfJwmQuB"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition-all border border-white/10"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Discord Support Server
                    </a>
                  </div>
                </div>
              )}

              {/* Collapsible: Review Submitted Application */}
              <div className="pt-4 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setShowSubmittedDetails(!showSubmittedDetails)}
                  className="w-full flex items-center justify-between p-3.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.06] text-xs font-bold text-slate-300 transition-all"
                >
                  <span className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-accent-cyan" />
                    Review Your Submitted Application Answers
                  </span>
                  {showSubmittedDetails ? (
                    <ChevronUp className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  )}
                </button>

                {showSubmittedDetails && (
                  <div className="mt-4 p-5 rounded-xl bg-black/40 border border-white/10 space-y-4 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-3 border-b border-white/[0.06]">
                      <div>
                        <span className="text-slate-400 block font-mono text-[10px] uppercase">Role Applied</span>
                        <span className="font-bold text-white flex items-center gap-2 mt-0.5">
                          {existingApp.app_type === "developer" ? (
                            <>
                              <DiscordEmoji src={DISCORD_CUSTOM_EMOJIS.developer.url} alt="Developer" size="sm" />
                              Developer Application
                            </>
                          ) : (
                            <>
                              <DiscordEmoji src={DISCORD_CUSTOM_EMOJIS.staff.url} alt="Staff" size="sm" />
                              Staff Moderator Application
                            </>
                          )}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-mono text-[10px] uppercase">Age</span>
                        <span className="font-bold text-white mt-0.5 block">{existingApp.age} years old</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-mono text-[10px] uppercase">
                          <DiscordEmoji src={DISCORD_CUSTOM_EMOJIS.region.url} alt="Region" size="sm" className="mr-1" />
                          Region
                        </span>
                        <span className="font-bold text-white mt-0.5 block">{existingApp.timezone}</span>
                      </div>
                      {existingApp.availability && (
                        <div>
                          <span className="text-slate-400 block font-mono text-[10px] uppercase">Availability</span>
                          <span className="font-bold text-white mt-0.5 block">{existingApp.availability}</span>
                        </div>
                      )}
                    </div>

                    {existingApp.app_type === "staff" ? (
                      <div className="space-y-3">
                        {existingApp.reason && (
                          <div>
                            <span className="text-slate-400 block font-mono text-[10px] uppercase">Motivation / Why Join</span>
                            <p className="text-slate-200 mt-1 whitespace-pre-wrap">{existingApp.reason}</p>
                          </div>
                        )}
                        {existingApp.experience && (
                          <div>
                            <span className="text-slate-400 block font-mono text-[10px] uppercase flex items-center gap-1.5">
                              <DiscordEmoji src={DISCORD_CUSTOM_EMOJIS.experience.url} alt="Experience" size="sm" />
                              Past Experience
                            </span>
                            <p className="text-slate-200 mt-1 whitespace-pre-wrap">{existingApp.experience}</p>
                          </div>
                        )}
                        {existingApp.scenario_1 && (
                          <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.05]">
                            <span className="text-amber-400 block font-bold flex items-center gap-1.5">
                              <DiscordEmoji src={DISCORD_CUSTOM_EMOJIS.scenario1.url} alt="Warning" size="sm" />
                              Scenario 1 Response (Spam Bypass)
                            </span>
                            <p className="text-slate-200 mt-1 whitespace-pre-wrap">{existingApp.scenario_1}</p>
                          </div>
                        )}
                        {existingApp.scenario_2 && (
                          <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.05]">
                            <span className="text-amber-400 block font-bold flex items-center gap-1.5">
                              <DiscordEmoji src={DISCORD_CUSTOM_EMOJIS.scenario2.url} alt="Argument" size="sm" />
                              Scenario 2 Response (Heated Argument)
                            </span>
                            <p className="text-slate-200 mt-1 whitespace-pre-wrap">{existingApp.scenario_2}</p>
                          </div>
                        )}
                        {existingApp.scenario_3 && (
                          <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.05]">
                            <span className="text-amber-400 block font-bold flex items-center gap-1.5">
                              <DiscordEmoji src={DISCORD_CUSTOM_EMOJIS.scenario3.url} alt="Admin" size="sm" />
                              Scenario 3 Response (Abuse Accusation)
                            </span>
                            <p className="text-slate-200 mt-1 whitespace-pre-wrap">{existingApp.scenario_3}</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {existingApp.languages && (
                          <div>
                            <span className="text-slate-400 block font-mono text-[10px] uppercase">Languages / Frameworks</span>
                            <p className="text-slate-200 mt-1 font-mono">{existingApp.languages}</p>
                          </div>
                        )}
                        {existingApp.portfolio && (
                          <div>
                            <span className="text-slate-400 block font-mono text-[10px] uppercase">Portfolio / GitHub</span>
                            <a
                              href={existingApp.portfolio}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-accent-cyan hover:underline mt-1 block break-all font-mono"
                            >
                              {existingApp.portfolio}
                            </a>
                          </div>
                        )}
                        {existingApp.bot_experience && (
                          <div>
                            <span className="text-slate-400 block font-mono text-[10px] uppercase flex items-center gap-1.5">
                              <DiscordEmoji src={DISCORD_CUSTOM_EMOJIS.experience.url} alt="Experience" size="sm" />
                              Bot Experience
                            </span>
                            <p className="text-slate-200 mt-1 whitespace-pre-wrap">{existingApp.bot_experience}</p>
                          </div>
                        )}
                        {existingApp.complex_features && (
                          <div>
                            <span className="text-slate-400 block font-mono text-[10px] uppercase">Complex Feature</span>
                            <p className="text-slate-200 mt-1 whitespace-pre-wrap">{existingApp.complex_features}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* ========================================================================= */
          /* CANDIDATE APPLICATION FORM (ONLY SHOWN IF NO ACTIVE/EXISTING APPLICATION)  */
          /* ========================================================================= */
          <div className="rounded-2xl bg-[#0d111d]/90 border border-white/10 shadow-2xl overflow-hidden backdrop-blur-xl">
            {/* Discord Identity Bar - Automatically verified */}
            <div className="p-4 sm:p-6 border-b border-white/[0.08] bg-black/25">
              {user ? (
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={
                        user.avatar
                          ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`
                          : "https://files.catbox.moe/74l9su.png"
                      }
                      alt={user.username}
                      className="w-11 h-11 rounded-full border border-white/15 object-cover"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm sm:text-base">
                          {user.global_name || user.username}
                        </span>
                        <span className="text-xs text-slate-400 font-mono">@{user.username}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <span>Discord ID: <code className="text-accent-cyan font-mono">{user.id}</code></span>
                      </div>
                    </div>
                  </div>

                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-semibold">
                    <UserCheck className="w-3.5 h-3.5" />
                    Verified Discord Identity
                  </div>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-2 rounded-xl bg-brand-red/10 border border-brand-red/25">
                  <div className="flex items-center gap-3">
                    <Lock className="w-5 h-5 text-brand-crimson shrink-0" />
                    <div>
                      <div className="font-bold text-white text-sm">Discord Authentication Required</div>
                      <div className="text-xs text-slate-300">
                        Log in with your Discord account so we can automatically link your identity securely.
                      </div>
                    </div>
                  </div>
                  <a
                    href="/api/auth/discord?redirect_to=/apply"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#5865F2] hover:bg-[#4752c4] text-white text-xs font-bold transition-all shadow-md shrink-0"
                  >
                    <LogIn className="w-4 h-4" />
                    Sign in with Discord
                  </a>
                </div>
              )}
            </div>

            {/* Application Type Tabs with Interactive Custom Emojis */}
            <div className="flex border-b border-white/[0.08] bg-[#090c14]">
              <button
                type="button"
                onClick={() => { setActiveTab("staff"); setErrorMessage(""); }}
                className={`flex-1 py-4 px-4 text-center font-bold text-sm sm:text-base transition-all flex items-center justify-center gap-2.5 border-b-2 ${
                  activeTab === "staff"
                    ? "border-brand-crimson text-white bg-white/[0.03]"
                    : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/[0.01]"
                }`}
              >
                <DiscordEmoji src={DISCORD_CUSTOM_EMOJIS.staff.url} alt="Staff" size="md" />
                Staff Application
              </button>
              <button
                type="button"
                onClick={() => { setActiveTab("developer"); setErrorMessage(""); }}
                className={`flex-1 py-4 px-4 text-center font-bold text-sm sm:text-base transition-all flex items-center justify-center gap-2.5 border-b-2 ${
                  activeTab === "developer"
                    ? "border-accent-cyan text-white bg-white/[0.03]"
                    : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/[0.01]"
                }`}
              >
                <DiscordEmoji src={DISCORD_CUSTOM_EMOJIS.developer.url} alt="Developer" size="md" />
                Developer Application
              </button>
            </div>

            {/* Error Alert */}
            {errorMessage && (
              <div className="mx-6 mt-6 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-2.5 text-xs sm:text-sm text-red-400 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* STAFF FORM */}
            {activeTab === "staff" && (
              <form onSubmit={handleStaffSubmit} className="p-6 sm:p-8 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Age */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                      Age <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="number"
                      min={13}
                      max={99}
                      placeholder="Minimum 13"
                      value={staffAge}
                      onChange={(e) => setStaffAge(e.target.value)}
                      required
                      className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-brand-crimson transition-all"
                    />
                  </div>

                  {/* Region / Country with Animated Region Custom Emoji */}
                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                      <DiscordEmoji src={DISCORD_CUSTOM_EMOJIS.region.url} alt="Region" size="sm" />
                      Where are you from? <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="e.g. United States, Germany, India"
                        value={staffTimezone}
                        onChange={(e) => setStaffTimezone(e.target.value)}
                        required
                        className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-brand-crimson transition-all pr-12"
                      />
                      {staffFlag && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xl pointer-events-none">
                          {staffFlag}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Availability */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                    How many hours per week can you dedicate? <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={staffAvailability}
                    onChange={(e) => setStaffAvailability(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-sm focus:outline-none focus:border-brand-crimson transition-all"
                  >
                    <option value="" disabled className="bg-[#0e121d]">Select weekly commitment</option>
                    <option value="1-5 hours" className="bg-[#0e121d]">1-5 hours / week</option>
                    <option value="5-10 hours" className="bg-[#0e121d]">5-10 hours / week</option>
                    <option value="10-20 hours" className="bg-[#0e121d]">10-20 hours / week</option>
                    <option value="20+ hours" className="bg-[#0e121d]">20+ hours / week (Highly Active)</option>
                  </select>
                </div>

                {/* Motivation */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                      Why do you want to join the SyncInk Staff team? <span className="text-red-400">*</span>
                    </label>
                    <span className="text-[11px] text-slate-500 font-mono">
                      {staffReason.length}/1024
                    </span>
                  </div>
                  <textarea
                    rows={3}
                    maxLength={1024}
                    placeholder="Describe your motivations, passion, and what makes you a reliable moderator..."
                    value={staffReason}
                    onChange={(e) => setStaffReason(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-brand-crimson transition-all resize-y"
                  />
                </div>

                {/* Experience with Experience Custom Emoji */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-300">
                      <DiscordEmoji src={DISCORD_CUSTOM_EMOJIS.experience.url} alt="Experience" size="sm" />
                      Past Moderation Experience <span className="text-red-400">*</span>
                    </label>
                    <span className="text-[11px] text-slate-500 font-mono">
                      {staffExp.length}/1024
                    </span>
                  </div>
                  <textarea
                    rows={3}
                    maxLength={1024}
                    placeholder="List past servers you have moderated, roles held, or bot tools used..."
                    value={staffExp}
                    onChange={(e) => setStaffExp(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-brand-crimson transition-all resize-y"
                  />
                </div>

                {/* Scenarios with Custom Animated & Static Emojis */}
                <div className="space-y-5 pt-2">
                  <div className="text-xs font-extrabold uppercase tracking-widest text-brand-crimson flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5" />
                    Practical Scenarios
                  </div>

                  {/* Scenario 1: Warning Animated Emoji */}
                  <div className="p-4 rounded-xl bg-black/30 border border-white/[0.08] hover:border-amber-500/30 transition-all">
                    <label className="flex items-start gap-2 text-xs font-bold text-slate-200 mb-2">
                      <DiscordEmoji src={DISCORD_CUSTOM_EMOJIS.scenario1.url} alt="Spam Warning" size="md" className="shrink-0 mt-0.5" />
                      <span>
                        Scenario 1: A user is spamming chat and attempting to bypass filters. What do you do? <span className="text-red-400">*</span>
                      </span>
                    </label>
                    <textarea
                      rows={2}
                      maxLength={1024}
                      placeholder="Step-by-step actions (mute, purge, escalation)..."
                      value={staffScen1}
                      onChange={(e) => setStaffScen1(e.target.value)}
                      required
                      className="w-full px-4 py-2 rounded-xl bg-black/40 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-brand-crimson transition-all resize-y"
                    />
                  </div>

                  {/* Scenario 2: Argument Custom Emoji */}
                  <div className="p-4 rounded-xl bg-black/30 border border-white/[0.08] hover:border-amber-500/30 transition-all">
                    <label className="flex items-start gap-2 text-xs font-bold text-slate-200 mb-2">
                      <DiscordEmoji src={DISCORD_CUSTOM_EMOJIS.scenario2.url} alt="Argument" size="md" className="shrink-0 mt-0.5" />
                      <span>
                        Scenario 2: Two active members are having a heated argument escalating into insults. How do you de-escalate? <span className="text-red-400">*</span>
                      </span>
                    </label>
                    <textarea
                      rows={2}
                      maxLength={1024}
                      placeholder="Conflict resolution and mediation strategy..."
                      value={staffScen2}
                      onChange={(e) => setStaffScen2(e.target.value)}
                      required
                      className="w-full px-4 py-2 rounded-xl bg-black/40 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-brand-crimson transition-all resize-y"
                    />
                  </div>

                  {/* Scenario 3: Admin Custom Emoji */}
                  <div className="p-4 rounded-xl bg-black/30 border border-white/[0.08] hover:border-amber-500/30 transition-all">
                    <label className="flex items-start gap-2 text-xs font-bold text-slate-200 mb-2">
                      <DiscordEmoji src={DISCORD_CUSTOM_EMOJIS.scenario3.url} alt="Admin" size="md" className="shrink-0 mt-0.5" />
                      <span>
                        Scenario 3: A user accuses another staff member of abuse of power. How do you handle it? <span className="text-red-400">*</span>
                      </span>
                    </label>
                    <textarea
                      rows={2}
                      maxLength={1024}
                      placeholder="Investigation procedure and reporting protocol..."
                      value={staffScen3}
                      onChange={(e) => setStaffScen3(e.target.value)}
                      required
                      className="w-full px-4 py-2 rounded-xl bg-black/40 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-brand-crimson transition-all resize-y"
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={submitting || !user}
                  className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-brand-crimson to-brand-red hover:opacity-95 text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition-all shadow-[0_0_25px_rgba(231,76,60,0.3)] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {submitting ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Submit Staff Application
                    </>
                  )}
                </button>
              </form>
            )}

            {/* DEVELOPER FORM */}
            {activeTab === "developer" && (
              <form onSubmit={handleDevSubmit} className="p-6 sm:p-8 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Age */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                      Age <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="number"
                      min={13}
                      max={99}
                      placeholder="Minimum 13"
                      value={devAge}
                      onChange={(e) => setDevAge(e.target.value)}
                      required
                      className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-accent-cyan transition-all"
                    />
                  </div>

                  {/* Region with Animated Custom Emoji */}
                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                      <DiscordEmoji src={DISCORD_CUSTOM_EMOJIS.region.url} alt="Region" size="sm" />
                      Where are you from? <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="e.g. United States, Germany, India"
                        value={devTimezone}
                        onChange={(e) => setDevTimezone(e.target.value)}
                        required
                        className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-accent-cyan transition-all pr-12"
                      />
                      {devFlag && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xl pointer-events-none">
                          {devFlag}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Languages & Tech with Developer Custom Emoji */}
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                    <DiscordEmoji src={DISCORD_CUSTOM_EMOJIS.developer.url} alt="Developer" size="sm" />
                    Primary Languages & Frameworks <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. TypeScript, Node.js, Python, Discord.js, Next.js, PostgreSQL"
                    value={devLangs}
                    onChange={(e) => setDevLangs(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-accent-cyan transition-all"
                  />
                </div>

                {/* GitHub or Portfolio URL */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                    GitHub Profile or Portfolio URL <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="url"
                    placeholder="https://github.com/your-username"
                    value={devPortfolio}
                    onChange={(e) => setDevPortfolio(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-accent-cyan transition-all"
                  />
                </div>

                {/* Bot Experience with Experience Custom Emoji */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-300">
                      <DiscordEmoji src={DISCORD_CUSTOM_EMOJIS.experience.url} alt="Experience" size="sm" />
                      Discord Bot Experience & Architecture <span className="text-red-400">*</span>
                    </label>
                    <span className="text-[11px] text-slate-500 font-mono">
                      {devBotExp.length}/1024
                    </span>
                  </div>
                  <textarea
                    rows={3}
                    maxLength={1024}
                    placeholder="Describe bots you have developed, libraries used (discord.py, discord.js), and database solutions..."
                    value={devBotExp}
                    onChange={(e) => setDevBotExp(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-accent-cyan transition-all resize-y"
                  />
                </div>

                {/* Complex Feature */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                      Describe a Complex Feature You Have Built <span className="text-red-400">*</span>
                    </label>
                    <span className="text-[11px] text-slate-500 font-mono">
                      {devComplex.length}/1024
                    </span>
                  </div>
                  <textarea
                    rows={3}
                    maxLength={1024}
                    placeholder="Explain the technical problem, your architecture decisions, edge cases handled, and performance outcomes..."
                    value={devComplex}
                    onChange={(e) => setDevComplex(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-accent-cyan transition-all resize-y"
                  />
                </div>

                {/* Optional File Attachment */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                    Attachment (Optional: Screenshot, Code Sample, or Resume)
                  </label>
                  <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-white/15 hover:border-accent-cyan/50 rounded-2xl bg-black/20 hover:bg-black/30 transition-all cursor-pointer">
                    <Upload className="w-8 h-8 text-slate-400 mb-2" />
                    <span className="text-xs sm:text-sm font-semibold text-slate-300">
                      {devFile ? devFile.name : "Click or drag & drop to attach a file"}
                    </span>
                    <span className="text-[11px] text-slate-500 mt-1">
                      Images, PDF, ZIP (Max 8MB)
                    </span>
                    <input
                      type="file"
                      accept="image/*,.pdf,.zip"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setDevFile(e.target.files[0]);
                        }
                      }}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={submitting || !user}
                  className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:opacity-95 text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition-all shadow-[0_0_25px_rgba(6,182,212,0.3)] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {submitting ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Submit Developer Application
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        )}
      </main>

      <PublicFooter />
    </div>
  );
}
