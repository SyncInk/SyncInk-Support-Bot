"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence, MotionConfig } from "framer-motion";
import {
  CheckCircle2,
  AlertCircle,
  Upload,
  Lock,
  Clock,
  Send,
  UserCheck,
  LogIn,
  RefreshCw,
  XCircle,
  ChevronDown,
  FileText,
  ExternalLink,
  MessageSquare,
  Award,
  Sparkles,
} from "lucide-react";
import { PublicNavbar } from "@/components/PublicNavbar";
import { PublicFooter } from "@/components/PublicFooter";
import { DISCORD_CUSTOM_EMOJIS } from "@/lib/custom-emojis";
import { spring, transition, ease } from "@/lib/motion-tokens";

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
  uk: "🇬🇧", england: "🇬🇧", "united states": "🇺🇸", usa: "🇺🇸", america: "🇺🇸", vietnam: "🇻🇳",
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
 * Renders high-resolution custom emojis inside a clean, quiet neutral container.
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
    lg: "w-9 h-9 rounded-lg p-1.5",
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
      className={`inline-flex items-center justify-center bg-white/[0.04] border border-white/[0.08] shrink-0 align-middle ${boxClasses[size]} ${className}`}
      title={alt}
    >
      <img
        src={src}
        alt={alt}
        className={`object-contain select-none ${imgClasses[size]}`}
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

  // Respect URL ?tab=developer or ?tab=staff deep links
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get("tab")?.toLowerCase();
      if (tab === "developer" || tab === "dev") {
        setActiveTab("developer");
      } else if (tab === "staff" || tab === "mod") {
        setActiveTab("staff");
      }
    }
  }, []);

  const switchRoleTab = (tab: "staff" | "developer") => {
    setActiveTab(tab);
    setErrorMessage("");
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("tab", tab);
      window.history.replaceState(null, "", url.toString());
    }
  };

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

  const formProgress = useMemo(() => {
    if (activeTab === "staff") {
      const checks = [
        Boolean(staffAge.trim() && Number(staffAge) >= 13),
        Boolean(staffTimezone.trim()),
        Boolean(staffAvailability),
        staffReason.trim().length >= 15,
        staffExp.trim().length >= 15,
        staffScen1.trim().length >= 15,
        staffScen2.trim().length >= 15,
        staffScen3.trim().length >= 15,
      ];
      const done = checks.filter(Boolean).length;
      return { done, total: checks.length };
    }
    const checks = [
      Boolean(devAge.trim() && Number(devAge) >= 13),
      Boolean(devTimezone.trim()),
      Boolean(devLangs.trim()),
      devPortfolio.trim().length >= 5,
      devBotExp.trim().length >= 15,
      devComplex.trim().length >= 15,
    ];
    const done = checks.filter(Boolean).length;
    return { done, total: checks.length };
  }, [
    activeTab,
    staffAge,
    staffTimezone,
    staffAvailability,
    staffReason,
    staffExp,
    staffScen1,
    staffScen2,
    staffScen3,
    devAge,
    devTimezone,
    devLangs,
    devPortfolio,
    devBotExp,
    devComplex,
  ]);

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
    if (
      staffScen1.trim().length < 15 ||
      staffScen2.trim().length < 15 ||
      staffScen3.trim().length < 15
    ) {
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
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen bg-[#060812] text-slate-100 flex flex-col selection:bg-brand-blue selection:text-white font-sans relative overflow-x-hidden">
        <PublicNavbar />

        <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          {/* Recruitment Header */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={transition.enter}
            className="mb-7 sm:mb-9 space-y-3"
          >
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-[#0c0f18] border border-white/[0.08] font-mono text-[11px] text-slate-300">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span>SyncInk Team Recruitment</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-semibold tracking-tight text-white leading-[1.15]">
              Join the SyncInk team
            </h1>
            <p className="text-sm sm:text-[15px] text-slate-400 max-w-2xl leading-relaxed">
              We are reviewing dedicated staff moderators and software developers to support, moderate, and extend the SyncInk Discord infrastructure.
            </p>
          </motion.div>

          {/* Loading State */}
          {authLoading || appLoading ? (
            <div className="p-10 sm:p-12 rounded-xl bg-[#0c0f18] border border-white/[0.08] text-center space-y-3">
              <div className="w-8 h-8 border-2 border-white/15 border-t-blue-500 rounded-full animate-spin mx-auto" />
              <p className="text-xs sm:text-sm font-mono text-slate-400">
                Verifying Discord session &amp; application records...
              </p>
            </div>
          ) : existingApp ? (
            /* Existing Application Tracker Card */
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={transition.enter}
              className="rounded-xl bg-[#0c0f18] border border-white/[0.08] overflow-hidden"
            >
              {/* Header Status Bar */}
              <div className="p-4 sm:p-6 border-b border-white/[0.06] bg-white/[0.02] flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={
                      user?.avatar
                        ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`
                        : "/syncink-main-logo.png"
                    }
                    alt={user?.username || "Candidate"}
                    className="w-11 h-11 rounded-full border border-white/[0.12] object-cover shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                      <span className="font-semibold text-white text-sm sm:text-base truncate">
                        {user?.global_name || user?.username}
                      </span>
                      <span className="text-xs text-slate-400 font-mono truncate">
                        @{user?.username}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                      <span className="font-mono">ID: {user?.id}</span>
                      <span className="text-slate-600">•</span>
                      <span className="font-mono text-slate-300 tabular-nums">
                        App #{existingApp.id}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Status Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={fetchApplicationStatus}
                    disabled={refreshing}
                    title="Check for status updates"
                    aria-label="Refresh application status"
                    className="h-9 w-9 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-slate-300 hover:text-white transition-colors inline-flex items-center justify-center disabled:opacity-50 touch-manipulation"
                  >
                    <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin text-blue-400" : ""}`} />
                  </button>

                  {existingApp.status === "REJECTED" ? (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs font-medium">
                      <XCircle className="w-3.5 h-3.5 text-rose-400" />
                      <span>Rejected</span>
                    </div>
                  ) : existingApp.status === "ACCEPTED" ? (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-xs font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Accepted</span>
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs font-medium">
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      <span>Under review</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Application Progress Stepper */}
              <div className="p-5 sm:p-6 border-b border-white/[0.06]">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-4">
                  <span className="font-medium text-slate-200">Review lifecycle</span>
                  <span className="font-mono text-[11px] text-slate-500 tabular-nums">
                    Submitted {new Date(existingApp.created_at).toLocaleDateString()}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5">
                  <div className="flex sm:flex-col items-center sm:items-start gap-3 sm:gap-2 p-3 rounded-lg bg-[#060812] border border-white/[0.06]">
                    <div className="w-7 h-7 rounded-md bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="text-xs font-medium text-white">1. Submitted</div>
                      <div className="text-[11px] text-slate-400">Stored securely</div>
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-start gap-3 sm:gap-2 p-3 rounded-lg bg-[#060812] border border-white/[0.06]">
                    <div className="w-7 h-7 rounded-md bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="text-xs font-medium text-white">2. Verified</div>
                      <div className="text-[11px] text-slate-400">Discord OAuth ID</div>
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-start gap-3 sm:gap-2 p-3 rounded-lg bg-[#060812] border border-white/[0.06]">
                    <div
                      className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 border ${
                        existingApp.status === "ACCEPTED"
                          ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
                          : existingApp.status === "REJECTED"
                          ? "bg-rose-500/15 border-rose-500/30 text-rose-400"
                          : "bg-amber-500/15 border-amber-500/30 text-amber-400"
                      }`}
                    >
                      {existingApp.status === "ACCEPTED" || existingApp.status === "REJECTED" ? (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      ) : (
                        <Clock className="w-3.5 h-3.5" />
                      )}
                    </div>
                    <div>
                      <div className="text-xs font-medium text-white">3. Evaluation</div>
                      <div className="text-[11px] text-slate-400">
                        {existingApp.status === "PENDING" || existingApp.status === "UNDER_REVIEW"
                          ? "Active review"
                          : "Completed"}
                      </div>
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-start gap-3 sm:gap-2 p-3 rounded-lg bg-[#060812] border border-white/[0.06]">
                    <div
                      className={`w-7 h-7 rounded-md flex items-center justify-center text-xs font-mono shrink-0 border ${
                        existingApp.status === "ACCEPTED"
                          ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
                          : existingApp.status === "REJECTED"
                          ? "bg-rose-500/15 border-rose-500/30 text-rose-400"
                          : "bg-white/[0.03] border-white/[0.08] text-slate-500"
                      }`}
                    >
                      {existingApp.status === "ACCEPTED" ? (
                        <Award className="w-3.5 h-3.5" />
                      ) : existingApp.status === "REJECTED" ? (
                        <XCircle className="w-3.5 h-3.5" />
                      ) : (
                        "4"
                      )}
                    </div>
                    <div>
                      <div className="text-xs font-medium text-white">4. Outcome</div>
                      <div className="text-[11px] text-slate-400">
                        {existingApp.status === "ACCEPTED"
                          ? "Approved"
                          : existingApp.status === "REJECTED"
                          ? "Closed"
                          : "Pending"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status Details */}
              <div className="p-5 sm:p-6 space-y-5">
                {existingApp.status === "REJECTED" ? (
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-3">
                      <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <div className="font-medium text-white text-sm">
                          Application not selected
                        </div>
                        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                          Thank you for applying to the SyncInk team. After evaluation by our reviewers, we are unable to move forward at this time.
                        </p>
                      </div>
                    </div>

                    {existingApp.reviewer_notes && (
                      <div className="p-4 rounded-xl bg-[#060812] border border-white/[0.08] space-y-1.5">
                        <div className="text-xs font-medium text-rose-300 flex items-center gap-1.5">
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>Reviewer feedback</span>
                        </div>
                        <div className="text-xs sm:text-sm text-slate-200 whitespace-pre-wrap leading-relaxed pl-3 border-l-2 border-rose-500/40">
                          {existingApp.reviewer_notes}
                        </div>
                      </div>
                    )}

                    <div className="p-3.5 rounded-lg bg-white/[0.02] border border-white/[0.06] text-xs text-slate-400 flex items-center gap-2">
                      <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>
                        <strong className="text-slate-300 font-medium">Anti-duplicate policy:</strong>{" "}
                        Repeat submissions are locked to preserve review integrity.
                      </span>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 pt-1">
                      <a
                        href="https://discord.gg/PmxfJwmQuB"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="h-10 px-4 rounded-lg bg-[#5865F2] hover:bg-[#4752c4] text-white text-xs font-medium transition-colors inline-flex items-center justify-center gap-2 touch-manipulation"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Support Discord Server</span>
                      </a>
                      <Link
                        href="/"
                        className="h-10 px-4 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-slate-200 text-xs font-medium transition-colors inline-flex items-center justify-center touch-manipulation"
                      >
                        Return home
                      </Link>
                    </div>
                  </div>
                ) : existingApp.status === "ACCEPTED" ? (
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-3">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <div className="font-medium text-white text-sm">
                          Application approved
                        </div>
                        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                          Welcome to SyncInk. Your application was approved and onboarding access has been prepared in our Discord channels.
                        </p>
                      </div>
                    </div>

                    {existingApp.reviewer_notes && (
                      <div className="p-4 rounded-xl bg-[#060812] border border-white/[0.08] space-y-1.5">
                        <div className="text-xs font-medium text-emerald-300 flex items-center gap-1.5">
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>Onboarding note</span>
                        </div>
                        <div className="text-xs sm:text-sm text-slate-200 whitespace-pre-wrap leading-relaxed pl-3 border-l-2 border-emerald-500/40">
                          {existingApp.reviewer_notes}
                        </div>
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 pt-1">
                      <a
                        href="https://discord.gg/PmxfJwmQuB"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="h-10 px-4 rounded-lg bg-[#5865F2] hover:bg-[#4752c4] text-white text-xs font-medium transition-colors inline-flex items-center justify-center gap-2 touch-manipulation"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Join Staff Discord</span>
                      </a>
                      <Link
                        href="/dashboard"
                        className="h-10 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-colors inline-flex items-center justify-center touch-manipulation"
                      >
                        Open Command Dashboard
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
                      <Clock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <div className="font-medium text-white text-sm">
                          Application currently under review
                        </div>
                        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                          Your submission is queued for the SyncInk management gateway. Reviews are completed in order of arrival, typically within 24 to 48 hours.
                        </p>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-lg bg-white/[0.02] border border-white/[0.06] text-xs text-slate-400 flex items-center gap-2">
                      <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>
                        <strong className="text-slate-300 font-medium">Notice:</strong>{" "}
                        Duplicate applications are disabled while this submission is active.
                      </span>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 pt-1">
                      <button
                        type="button"
                        onClick={fetchApplicationStatus}
                        disabled={refreshing}
                        className="h-10 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-colors inline-flex items-center justify-center gap-2 touch-manipulation"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
                        <span>Check application status</span>
                      </button>
                      <a
                        href="https://discord.gg/PmxfJwmQuB"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="h-10 px-4 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-slate-200 text-xs font-medium transition-colors inline-flex items-center justify-center gap-2 touch-manipulation"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                        <span>Support Discord Server</span>
                      </a>
                    </div>
                  </div>
                )}

                {/* Collapsible Submitted Answers */}
                <div className="pt-4 border-t border-white/[0.06]">
                  <button
                    type="button"
                    onClick={() => setShowSubmittedDetails((prev) => !prev)}
                    aria-expanded={showSubmittedDetails}
                    className="w-full min-h-[42px] flex items-center justify-between px-3.5 py-2.5 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] text-xs font-medium text-slate-200 transition-colors touch-manipulation"
                  >
                    <span className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-slate-400" />
                      <span>Review your submitted answers</span>
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                        showSubmittedDetails ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  <AnimatePresence initial={false}>
                    {showSubmittedDetails && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.24, ease: ease.inOut }}
                        className="overflow-hidden"
                      >
                        <div className="mt-3 p-4 sm:p-5 rounded-xl bg-[#060812] border border-white/[0.08] space-y-4 text-xs">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-3 border-b border-white/[0.06]">
                            <div>
                              <span className="text-slate-400 block font-mono text-[11px]">
                                Role applied
                              </span>
                              <span className="font-medium text-white flex items-center gap-2 mt-1">
                                {existingApp.app_type === "developer" ? (
                                  <>
                                    <DiscordEmoji
                                      src={DISCORD_CUSTOM_EMOJIS.developer.url}
                                      alt="Developer"
                                      size="sm"
                                    />
                                    Developer Application
                                  </>
                                ) : (
                                  <>
                                    <DiscordEmoji
                                      src={DISCORD_CUSTOM_EMOJIS.staff.url}
                                      alt="Staff"
                                      size="sm"
                                    />
                                    Staff Moderator Application
                                  </>
                                )}
                              </span>
                            </div>

                            <div>
                              <span className="text-slate-400 block font-mono text-[11px]">
                                Age
                              </span>
                              <span className="font-medium text-white mt-1 block tabular-nums">
                                {existingApp.age} years old
                              </span>
                            </div>

                            <div>
                              <span className="text-slate-400 block font-mono text-[11px] flex items-center gap-1.5">
                                <DiscordEmoji
                                  src={DISCORD_CUSTOM_EMOJIS.region.url}
                                  alt="Region"
                                  size="xs"
                                />
                                <span>Region</span>
                              </span>
                              <span className="font-medium text-white mt-1 block">
                                {existingApp.timezone}
                              </span>
                            </div>

                            {existingApp.availability && (
                              <div>
                                <span className="text-slate-400 block font-mono text-[11px]">
                                  Availability
                                </span>
                                <span className="font-medium text-white mt-1 block">
                                  {existingApp.availability}
                                </span>
                              </div>
                            )}
                          </div>

                          {existingApp.app_type === "staff" ? (
                            <div className="space-y-3">
                              {existingApp.reason && (
                                <div>
                                  <span className="text-slate-400 block font-mono text-[11px]">
                                    Motivation
                                  </span>
                                  <p className="text-slate-200 mt-1 whitespace-pre-wrap leading-relaxed break-words">
                                    {existingApp.reason}
                                  </p>
                                </div>
                              )}
                              {existingApp.experience && (
                                <div>
                                  <span className="text-slate-400 font-mono text-[11px] flex items-center gap-1.5">
                                    <DiscordEmoji
                                      src={DISCORD_CUSTOM_EMOJIS.experience.url}
                                      alt="Experience"
                                      size="xs"
                                    />
                                    <span>Past experience</span>
                                  </span>
                                  <p className="text-slate-200 mt-1 whitespace-pre-wrap leading-relaxed break-words">
                                    {existingApp.experience}
                                  </p>
                                </div>
                              )}
                              {existingApp.scenario_1 && (
                                <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.06]">
                                  <span className="text-slate-200 font-medium flex items-center gap-1.5">
                                    <DiscordEmoji
                                      src={DISCORD_CUSTOM_EMOJIS.scenario1.url}
                                      alt="Spam Warning"
                                      size="sm"
                                    />
                                    <span>Scenario 1: Spam bypass</span>
                                  </span>
                                  <p className="text-slate-300 mt-1.5 whitespace-pre-wrap leading-relaxed break-words">
                                    {existingApp.scenario_1}
                                  </p>
                                </div>
                              )}
                              {existingApp.scenario_2 && (
                                <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.06]">
                                  <span className="text-slate-200 font-medium flex items-center gap-1.5">
                                    <DiscordEmoji
                                      src={DISCORD_CUSTOM_EMOJIS.scenario2.url}
                                      alt="Argument"
                                      size="sm"
                                    />
                                    <span>Scenario 2: Heated argument</span>
                                  </span>
                                  <p className="text-slate-300 mt-1.5 whitespace-pre-wrap leading-relaxed break-words">
                                    {existingApp.scenario_2}
                                  </p>
                                </div>
                              )}
                              {existingApp.scenario_3 && (
                                <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.06]">
                                  <span className="text-slate-200 font-medium flex items-center gap-1.5">
                                    <DiscordEmoji
                                      src={DISCORD_CUSTOM_EMOJIS.scenario3.url}
                                      alt="Admin"
                                      size="sm"
                                    />
                                    <span>Scenario 3: Staff abuse accusation</span>
                                  </span>
                                  <p className="text-slate-300 mt-1.5 whitespace-pre-wrap leading-relaxed break-words">
                                    {existingApp.scenario_3}
                                  </p>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {existingApp.languages && (
                                <div>
                                  <span className="text-slate-400 block font-mono text-[11px]">
                                    Languages &amp; frameworks
                                  </span>
                                  <p className="text-slate-200 mt-1 font-mono break-words">
                                    {existingApp.languages}
                                  </p>
                                </div>
                              )}
                              {existingApp.portfolio && (
                                <div>
                                  <span className="text-slate-400 block font-mono text-[11px]">
                                    Portfolio / GitHub
                                  </span>
                                  <a
                                    href={existingApp.portfolio}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-400 hover:underline mt-1 block break-all font-mono"
                                  >
                                    {existingApp.portfolio}
                                  </a>
                                </div>
                              )}
                              {existingApp.bot_experience && (
                                <div>
                                  <span className="text-slate-400 font-mono text-[11px] flex items-center gap-1.5">
                                    <DiscordEmoji
                                      src={DISCORD_CUSTOM_EMOJIS.experience.url}
                                      alt="Experience"
                                      size="xs"
                                    />
                                    <span>Bot experience</span>
                                  </span>
                                  <p className="text-slate-200 mt-1 whitespace-pre-wrap leading-relaxed break-words">
                                    {existingApp.bot_experience}
                                  </p>
                                </div>
                              )}
                              {existingApp.complex_features && (
                                <div>
                                  <span className="text-slate-400 block font-mono text-[11px]">
                                    Complex feature built
                                  </span>
                                  <p className="text-slate-200 mt-1 whitespace-pre-wrap leading-relaxed break-words">
                                    {existingApp.complex_features}
                                  </p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          ) : (
            /* Candidate Application Form */
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={transition.enter}
              className="rounded-xl bg-[#0c0f18] border border-white/[0.08] overflow-hidden"
            >
              {/* Discord Identity Bar */}
              <div className="p-4 sm:p-6 border-b border-white/[0.06] bg-white/[0.02]">
                {user ? (
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={
                          user.avatar
                            ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`
                            : "/syncink-main-logo.png"
                        }
                        alt={user.username}
                        className="w-10 h-10 rounded-full border border-white/[0.12] object-cover shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-white text-sm sm:text-base truncate">
                            {user.global_name || user.username}
                          </span>
                          <span className="text-xs text-slate-400 font-mono truncate">
                            @{user.username}
                          </span>
                        </div>
                        <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                          ID: {user.id}
                        </div>
                      </div>
                    </div>

                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-medium">
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Discord verified</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-3 rounded-lg bg-[#060812] border border-white/[0.08]">
                    <div className="flex items-start gap-3">
                      <Lock className="w-4 h-4 text-slate-300 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-medium text-white text-sm">
                          Discord authentication required
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5">
                          Sign in with Discord so your application links directly to your account.
                        </div>
                      </div>
                    </div>
                    <a
                      href={`/api/auth/discord?redirect_to=${encodeURIComponent(
                        `/apply?tab=${activeTab}`
                      )}`}
                      className="w-full sm:w-auto h-9 px-4 rounded-lg bg-[#5865F2] hover:bg-[#4752c4] text-white text-xs font-medium transition-colors inline-flex items-center justify-center gap-2 shrink-0 touch-manipulation"
                    >
                      <LogIn className="w-3.5 h-3.5" />
                      <span>Sign in with Discord</span>
                    </a>
                  </div>
                )}
              </div>

              {/* Animated Segmented Role Switcher + Readiness Meter */}
              <div className="p-4 sm:px-6 sm:pt-5 sm:pb-4 border-b border-white/[0.06] space-y-3 bg-[#080b14]">
                <div className="grid grid-cols-2 p-1 rounded-xl bg-[#060812] border border-white/[0.08] gap-1">
                  <button
                    type="button"
                    onClick={() => switchRoleTab("staff")}
                    className={`relative min-h-[44px] px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors flex items-center justify-center gap-2 touch-manipulation ${
                      activeTab === "staff"
                        ? "text-white"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {activeTab === "staff" && (
                      <motion.span
                        layoutId="applyRoleTab"
                        transition={spring.snappy}
                        className="absolute inset-0 rounded-lg bg-white/[0.08] border border-white/[0.1]"
                      />
                    )}
                    <DiscordEmoji
                      src={DISCORD_CUSTOM_EMOJIS.staff.url}
                      alt="Staff"
                      size="sm"
                      className="relative z-10"
                    />
                    <span className="relative z-10 truncate">Staff</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => switchRoleTab("developer")}
                    className={`relative min-h-[44px] px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors flex items-center justify-center gap-2 touch-manipulation ${
                      activeTab === "developer"
                        ? "text-white"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {activeTab === "developer" && (
                      <motion.span
                        layoutId="applyRoleTab"
                        transition={spring.snappy}
                        className="absolute inset-0 rounded-lg bg-white/[0.08] border border-white/[0.1]"
                      />
                    )}
                    <DiscordEmoji
                      src={DISCORD_CUSTOM_EMOJIS.developer.url}
                      alt="Developer"
                      size="sm"
                      className="relative z-10"
                    />
                    <span className="relative z-10 truncate">Developer</span>
                  </button>
                </div>

                {/* Live Completion Readiness Bar */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                    <span>
                      {activeTab === "staff" ? "Staff checklist" : "Developer checklist"}
                    </span>
                    <span className="tabular-nums text-slate-300">
                      {formProgress.done}/{formProgress.total} completed
                    </span>
                  </div>
                  <div className="h-1 w-full rounded-full bg-white/[0.06] overflow-hidden">
                    <motion.div
                      initial={false}
                      animate={{
                        scaleX: formProgress.total > 0 ? formProgress.done / formProgress.total : 0,
                      }}
                      transition={transition.hover}
                      className="h-full w-full origin-left bg-blue-500 rounded-full"
                    />
                  </div>
                </div>
              </div>

              {/* Validation Error Banner */}
              <AnimatePresence>
                {errorMessage && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={transition.enter}
                    className="mx-4 sm:mx-6 mt-5 p-3.5 rounded-lg bg-red-500/10 border border-red-500/25 flex items-start gap-2.5 text-xs sm:text-sm text-red-300"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
                    <span>{errorMessage}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Animated Role Form Switch */}
              <AnimatePresence mode="wait">
                {activeTab === "staff" ? (
                  <motion.form
                    key="staff-form"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={transition.enter}
                    onSubmit={handleStaffSubmit}
                    className="p-4 sm:p-6 space-y-5"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1.5">
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
                          className="w-full h-11 px-3.5 rounded-lg bg-[#060812] border border-white/[0.1] text-white placeholder-slate-500 text-base sm:text-sm focus:outline-none focus:border-blue-500 transition-colors tabular-nums"
                        />
                      </div>

                      <div>
                        <label className="flex items-center gap-1.5 text-xs font-medium text-slate-300 mb-1.5">
                          <DiscordEmoji
                            src={DISCORD_CUSTOM_EMOJIS.region.url}
                            alt="Region"
                            size="xs"
                          />
                          <span>Country or region</span>
                          <span className="text-red-400">*</span>
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="e.g. India, United States, Germany"
                            value={staffTimezone}
                            onChange={(e) => setStaffTimezone(e.target.value)}
                            required
                            className="w-full h-11 px-3.5 rounded-lg bg-[#060812] border border-white/[0.1] text-white placeholder-slate-500 text-base sm:text-sm focus:outline-none focus:border-blue-500 transition-colors pr-11"
                          />
                          {staffFlag && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-lg pointer-events-none">
                              {staffFlag}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1.5">
                        Weekly availability <span className="text-red-400">*</span>
                      </label>
                      <select
                        value={staffAvailability}
                        onChange={(e) => setStaffAvailability(e.target.value)}
                        required
                        className="w-full h-11 px-3.5 rounded-lg bg-[#060812] border border-white/[0.1] text-white text-base sm:text-sm focus:outline-none focus:border-blue-500 transition-colors"
                      >
                        <option value="" disabled className="bg-[#0c0f18]">
                          Select weekly commitment
                        </option>
                        <option value="1-5 hours" className="bg-[#0c0f18]">
                          1-5 hours / week
                        </option>
                        <option value="5-10 hours" className="bg-[#0c0f18]">
                          5-10 hours / week
                        </option>
                        <option value="10-20 hours" className="bg-[#0c0f18]">
                          10-20 hours / week
                        </option>
                        <option value="20+ hours" className="bg-[#0c0f18]">
                          20+ hours / week
                        </option>
                      </select>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <label className="block text-xs font-medium text-slate-300">
                          Why do you want to join SyncInk Staff? <span className="text-red-400">*</span>
                        </label>
                        <span className="text-[11px] text-slate-500 font-mono tabular-nums">
                          {staffReason.length}/1024
                        </span>
                      </div>
                      <textarea
                        rows={3}
                        maxLength={1024}
                        placeholder="Describe your motivations and what makes you a reliable moderator..."
                        value={staffReason}
                        onChange={(e) => setStaffReason(e.target.value)}
                        required
                        className="w-full p-3.5 rounded-lg bg-[#060812] border border-white/[0.1] text-white placeholder-slate-500 text-base sm:text-sm focus:outline-none focus:border-blue-500 transition-colors resize-y"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <label className="flex items-center gap-1.5 text-xs font-medium text-slate-300">
                          <DiscordEmoji
                            src={DISCORD_CUSTOM_EMOJIS.experience.url}
                            alt="Experience"
                            size="xs"
                          />
                          <span>Past moderation experience</span>
                          <span className="text-red-400">*</span>
                        </label>
                        <span className="text-[11px] text-slate-500 font-mono tabular-nums">
                          {staffExp.length}/1024
                        </span>
                      </div>
                      <textarea
                        rows={3}
                        maxLength={1024}
                        placeholder="List servers moderated, roles held, or moderation tools used..."
                        value={staffExp}
                        onChange={(e) => setStaffExp(e.target.value)}
                        required
                        className="w-full p-3.5 rounded-lg bg-[#060812] border border-white/[0.1] text-white placeholder-slate-500 text-base sm:text-sm focus:outline-none focus:border-blue-500 transition-colors resize-y"
                      />
                    </div>

                    {/* Practical Scenarios */}
                    <div className="space-y-4 pt-2 border-t border-white/[0.06]">
                      <div className="text-xs font-mono text-slate-400">
                        Practical scenarios
                      </div>

                      <div className="p-3.5 sm:p-4 rounded-xl bg-[#060812] border border-white/[0.08] space-y-2.5">
                        <label className="flex items-start gap-2.5 text-xs font-medium text-slate-200 leading-snug">
                          <DiscordEmoji
                            src={DISCORD_CUSTOM_EMOJIS.scenario1.url}
                            alt="Spam Warning"
                            size="sm"
                            className="shrink-0 mt-0.5"
                          />
                          <span>
                            Scenario 1: A user is spamming chat and attempting to bypass filters. What do you do? <span className="text-red-400">*</span>
                          </span>
                        </label>
                        <textarea
                          rows={2}
                          maxLength={1024}
                          placeholder="Step-by-step actions (timeout, purge, escalation)..."
                          value={staffScen1}
                          onChange={(e) => setStaffScen1(e.target.value)}
                          required
                          className="w-full p-3 rounded-lg bg-[#0c0f18] border border-white/[0.08] text-white placeholder-slate-500 text-base sm:text-sm focus:outline-none focus:border-blue-500 transition-colors resize-y"
                        />
                      </div>

                      <div className="p-3.5 sm:p-4 rounded-xl bg-[#060812] border border-white/[0.08] space-y-2.5">
                        <label className="flex items-start gap-2.5 text-xs font-medium text-slate-200 leading-snug">
                          <DiscordEmoji
                            src={DISCORD_CUSTOM_EMOJIS.scenario2.url}
                            alt="Argument"
                            size="sm"
                            className="shrink-0 mt-0.5"
                          />
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
                          className="w-full p-3 rounded-lg bg-[#0c0f18] border border-white/[0.08] text-white placeholder-slate-500 text-base sm:text-sm focus:outline-none focus:border-blue-500 transition-colors resize-y"
                        />
                      </div>

                      <div className="p-3.5 sm:p-4 rounded-xl bg-[#060812] border border-white/[0.08] space-y-2.5">
                        <label className="flex items-start gap-2.5 text-xs font-medium text-slate-200 leading-snug">
                          <DiscordEmoji
                            src={DISCORD_CUSTOM_EMOJIS.scenario3.url}
                            alt="Admin"
                            size="sm"
                            className="shrink-0 mt-0.5"
                          />
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
                          className="w-full p-3 rounded-lg bg-[#0c0f18] border border-white/[0.08] text-white placeholder-slate-500 text-base sm:text-sm focus:outline-none focus:border-blue-500 transition-colors resize-y"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={submitting || !user}
                      className="w-full h-11 px-5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm flex items-center justify-center gap-2 transition-colors active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
                    >
                      {submitting ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>Submit Staff Application</span>
                        </>
                      )}
                    </button>
                  </motion.form>
                ) : (
                  <motion.form
                    key="dev-form"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={transition.enter}
                    onSubmit={handleDevSubmit}
                    className="p-4 sm:p-6 space-y-5"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1.5">
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
                          className="w-full h-11 px-3.5 rounded-lg bg-[#060812] border border-white/[0.1] text-white placeholder-slate-500 text-base sm:text-sm focus:outline-none focus:border-blue-500 transition-colors tabular-nums"
                        />
                      </div>

                      <div>
                        <label className="flex items-center gap-1.5 text-xs font-medium text-slate-300 mb-1.5">
                          <DiscordEmoji
                            src={DISCORD_CUSTOM_EMOJIS.region.url}
                            alt="Region"
                            size="xs"
                          />
                          <span>Country or region</span>
                          <span className="text-red-400">*</span>
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="e.g. India, United States, Germany"
                            value={devTimezone}
                            onChange={(e) => setDevTimezone(e.target.value)}
                            required
                            className="w-full h-11 px-3.5 rounded-lg bg-[#060812] border border-white/[0.1] text-white placeholder-slate-500 text-base sm:text-sm focus:outline-none focus:border-blue-500 transition-colors pr-11"
                          />
                          {devFlag && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-lg pointer-events-none">
                              {devFlag}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="flex items-center gap-1.5 text-xs font-medium text-slate-300 mb-1.5">
                        <DiscordEmoji
                          src={DISCORD_CUSTOM_EMOJIS.developer.url}
                          alt="Developer"
                          size="xs"
                        />
                        <span>Primary languages &amp; frameworks</span>
                        <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. TypeScript, Node.js, Python, Discord.js, Next.js, PostgreSQL"
                        value={devLangs}
                        onChange={(e) => setDevLangs(e.target.value)}
                        required
                        className="w-full h-11 px-3.5 rounded-lg bg-[#060812] border border-white/[0.1] text-white placeholder-slate-500 text-base sm:text-sm focus:outline-none focus:border-blue-500 transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1.5">
                        GitHub profile or portfolio URL <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="url"
                        placeholder="https://github.com/your-username"
                        value={devPortfolio}
                        onChange={(e) => setDevPortfolio(e.target.value)}
                        required
                        className="w-full h-11 px-3.5 rounded-lg bg-[#060812] border border-white/[0.1] text-white placeholder-slate-500 text-base sm:text-sm font-mono focus:outline-none focus:border-blue-500 transition-colors"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <label className="flex items-center gap-1.5 text-xs font-medium text-slate-300">
                          <DiscordEmoji
                            src={DISCORD_CUSTOM_EMOJIS.experience.url}
                            alt="Experience"
                            size="xs"
                          />
                          <span>Discord bot experience &amp; architecture</span>
                          <span className="text-red-400">*</span>
                        </label>
                        <span className="text-[11px] text-slate-500 font-mono tabular-nums">
                          {devBotExp.length}/1024
                        </span>
                      </div>
                      <textarea
                        rows={3}
                        maxLength={1024}
                        placeholder="Describe bots built, libraries used (discord.py, discord.js), and database design..."
                        value={devBotExp}
                        onChange={(e) => setDevBotExp(e.target.value)}
                        required
                        className="w-full p-3.5 rounded-lg bg-[#060812] border border-white/[0.1] text-white placeholder-slate-500 text-base sm:text-sm focus:outline-none focus:border-blue-500 transition-colors resize-y"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <label className="block text-xs font-medium text-slate-300">
                          Describe a complex feature you have built <span className="text-red-400">*</span>
                        </label>
                        <span className="text-[11px] text-slate-500 font-mono tabular-nums">
                          {devComplex.length}/1024
                        </span>
                      </div>
                      <textarea
                        rows={3}
                        maxLength={1024}
                        placeholder="Explain the problem, architecture choices, edge cases handled, and performance results..."
                        value={devComplex}
                        onChange={(e) => setDevComplex(e.target.value)}
                        required
                        className="w-full p-3.5 rounded-lg bg-[#060812] border border-white/[0.1] text-white placeholder-slate-500 text-base sm:text-sm focus:outline-none focus:border-blue-500 transition-colors resize-y"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1.5">
                        Attachment (optional: screenshot, code sample, or resume)
                      </label>
                      <label className="flex flex-col items-center justify-center p-5 border border-dashed border-white/[0.16] hover:border-white/[0.3] rounded-xl bg-[#060812] hover:bg-white/[0.02] transition-colors cursor-pointer touch-manipulation">
                        <Upload className="w-6 h-6 text-slate-400 mb-2" />
                        <span className="text-xs sm:text-sm font-medium text-slate-300 text-center break-all">
                          {devFile ? devFile.name : "Tap to select a file"}
                        </span>
                        <span className="text-[11px] font-mono text-slate-500 mt-1">
                          Images, PDF, ZIP · Max 8MB
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

                    <button
                      type="submit"
                      disabled={submitting || !user}
                      className="w-full h-11 px-5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm flex items-center justify-center gap-2 transition-colors active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
                    >
                      {submitting ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>Submit Developer Application</span>
                        </>
                      )}
                    </button>
                  </motion.form>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </main>

        <PublicFooter />
      </div>
    </MotionConfig>
  );
}
