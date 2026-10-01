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
} from "lucide-react";
import { PublicNavbar } from "@/components/PublicNavbar";
import { PublicFooter } from "@/components/PublicFooter";

interface UserInfo {
  id: string;
  username: string;
  global_name?: string;
  avatar?: string;
  role?: string;
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

export default function ApplyPage() {
  const [activeTab, setActiveTab] = useState<"staff" | "developer">("staff");
  const [user, setUser] = useState<UserInfo | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

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
  const [successSubmitted, setSuccessSubmitted] = useState(false);

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

      setSuccessSubmitted(true);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to submit application.");
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

      setSuccessSubmitted(true);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to submit application.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#060812] text-slate-100 flex flex-col selection:bg-brand-red selection:text-white font-sans">
      <PublicNavbar />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-red/10 border border-brand-red/25 text-brand-crimson text-xs font-bold tracking-wider uppercase mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            SyncInk Team Recruitment
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white mb-3">
            Join the <span className="bg-gradient-to-r from-brand-crimson to-accent-cyan bg-clip-text text-transparent">SyncInk Team</span>
          </h1>
          <p className="text-sm sm:text-base text-slate-400 max-w-xl mx-auto">
            Help shape the future of modern Discord bot infrastructure. We are looking for dedicated staff members and talented developers.
          </p>
        </div>

        {/* Success Screen */}
        {successSubmitted ? (
          <div className="p-8 sm:p-12 rounded-2xl bg-[#0e121d] border border-white/10 shadow-2xl text-center backdrop-blur-xl">
            <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto mb-6 text-emerald-400">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white mb-3">
              Application Successfully Dispatched!
            </h2>
            <p className="text-slate-300 max-w-lg mx-auto text-sm sm:text-base leading-relaxed mb-8">
              Thank you for applying to the SyncInk team! Your application has been encrypted, verified with your Discord identity, and forwarded directly to our senior management review channel.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/"
                className="px-6 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-sm transition-all border border-white/10"
              >
                Return to Home
              </Link>
              <Link
                href="/dashboard"
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-brand-crimson to-brand-red hover:opacity-95 text-white font-bold text-sm transition-all shadow-[0_0_20px_rgba(231,76,60,0.3)]"
              >
                Open Dashboard
              </Link>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl bg-[#0d111d]/90 border border-white/10 shadow-2xl overflow-hidden backdrop-blur-xl">
            {/* Discord Identity Bar - Automatically verified */}
            <div className="p-4 sm:p-6 border-b border-white/[0.08] bg-black/25">
              {authLoading ? (
                <div className="flex items-center gap-3 animate-pulse">
                  <div className="w-10 h-10 rounded-full bg-white/10" />
                  <div className="space-y-2 flex-1">
                    <div className="h-3 w-32 bg-white/10 rounded" />
                    <div className="h-2 w-24 bg-white/5 rounded" />
                  </div>
                </div>
              ) : user ? (
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

            {/* Application Type Tabs */}
            <div className="flex border-b border-white/[0.08] bg-[#090c14]">
              <button
                type="button"
                onClick={() => { setActiveTab("staff"); setErrorMessage(""); }}
                className={`flex-1 py-4 px-4 text-center font-bold text-sm sm:text-base transition-all flex items-center justify-center gap-2 border-b-2 ${
                  activeTab === "staff"
                    ? "border-brand-crimson text-white bg-white/[0.03]"
                    : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/[0.01]"
                }`}
              >
                <Shield className="w-4 h-4 text-brand-crimson" />
                Staff Application
              </button>
              <button
                type="button"
                onClick={() => { setActiveTab("developer"); setErrorMessage(""); }}
                className={`flex-1 py-4 px-4 text-center font-bold text-sm sm:text-base transition-all flex items-center justify-center gap-2 border-b-2 ${
                  activeTab === "developer"
                    ? "border-accent-cyan text-white bg-white/[0.03]"
                    : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/[0.01]"
                }`}
              >
                <Code className="w-4 h-4 text-accent-cyan" />
                Developer Application
              </button>
            </div>

            {/* Error Alert */}
            {errorMessage && (
              <div className="mx-6 mt-6 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-2.5 text-xs sm:text-sm text-red-400">
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

                  {/* Region / Country */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
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

                {/* Experience */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
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

                {/* Scenarios */}
                <div className="space-y-4 pt-2">
                  <div className="text-xs font-extrabold uppercase tracking-widest text-brand-crimson">
                    Practical Scenarios
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      Scenario 1: A user is spamming chat and attempting to bypass filters. What do you do? <span className="text-red-400">*</span>
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

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      Scenario 2: Two active members are having a heated argument escalating into insults. How do you de-escalate? <span className="text-red-400">*</span>
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

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      Scenario 3: A user accuses another staff member of abuse of power. How do you handle it? <span className="text-red-400">*</span>
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
                  className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-brand-crimson to-brand-red hover:opacity-95 text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition-all shadow-[0_0_25px_rgba(231,76,60,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
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

                  {/* Region */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
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

                {/* Languages & Tech */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
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

                {/* Bot Experience */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
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
                      Images, PDF, ZIP (Max 25MB)
                    </span>
                    <input
                      type="file"
                      accept="image/*,.pdf,.zip,.rar"
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
                  className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:opacity-95 text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition-all shadow-[0_0_25px_rgba(6,182,212,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
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
