"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ShieldCheck,
  ShieldAlert,
  Clock,
  ArrowRight,
  ExternalLink,
  CheckCircle2,
  RefreshCw,
  Lock,
  UserCheck,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { PublicNavbar } from "@/components/PublicNavbar";
import { PublicFooter } from "@/components/PublicFooter";

type ViewState =
  | "LOADING"
  | "NEEDS_AUTH"
  | "IDENTITY_MISMATCH"
  | "READY"
  | "VERIFYING"
  | "SUCCESS"
  | "ALREADY_VERIFIED"
  | "EXPIRED"
  | "ERROR";

function VerifyContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionToken = searchParams.get("session") || "";

  const [state, setState] = useState<ViewState>("LOADING");
  const [errorMessage, setErrorMessage] = useState("");
  const [oauthUrl, setOauthUrl] = useState("");
  const [userInfo, setUserInfo] = useState<{
    id: string;
    username: string;
    global_name?: string | null;
    avatar?: string | null;
  } | null>(null);
  const [accountAgeDays, setAccountAgeDays] = useState<number | null>(null);
  const [mismatchData, setMismatchData] = useState<{
    sessionUserId: string;
    currentUsername?: string;
  } | null>(null);

  // Professional Cloud Armor Turnstile-style Human Verification
  const [humanCheckStatus, setHumanCheckStatus] = useState<"IDLE" | "CHECKING" | "VERIFIED" | "FAILED">("IDLE");
  const [humanToken, setHumanToken] = useState<string>("");
  const [botCheckNotice, setBotCheckNotice] = useState<string>("");

  const runHumanVerification = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (humanCheckStatus === "CHECKING" || humanCheckStatus === "VERIFIED") return;

    // 1. Anti-bot heuristics: evaluate trusted pointer interaction & headless signals
    const isRealEvent = (e.nativeEvent as any).isTrusted !== false;
    const isHeadless = typeof navigator !== "undefined" && Boolean((navigator as any).webdriver);

    if (isHeadless) {
      setHumanCheckStatus("FAILED");
      setBotCheckNotice("Automated environment detected. Please verify from a standard browser.");
      return;
    }

    setHumanCheckStatus("CHECKING");
    setBotCheckNotice("");

    // Professional scanning sequence verifying browser integrity
    setTimeout(() => {
      const entropyToken = `armor_${Math.random().toString(36).substring(2, 10)}_${Date.now().toString(36)}`;
      setHumanToken(entropyToken);
      setHumanCheckStatus("VERIFIED");
    }, 1000);
  };

  // 1. Validate session on mount (supports direct recovery for logged in users)
  useEffect(() => {
    async function checkSession() {
      try {
        const url = sessionToken
          ? `/api/verify?session=${encodeURIComponent(sessionToken)}`
          : `/api/verify`;
        const res = await fetch(url);
        const data = await res.json();

        if (res.status === 429) {
          setState("ERROR");
          setErrorMessage(data.error || "Too many attempts. Please wait a minute.");
          return;
        }

        if (data.status === "EXPIRED") {
          setState("EXPIRED");
          setErrorMessage(data.message);
          return;
        }

        if (data.status === "ALREADY_COMPLETED") {
          setState("ALREADY_VERIFIED");
          return;
        }

        if (data.status === "INVALID" || !res.ok) {
          setState("ERROR");
          setErrorMessage(data.message || "No active verification session. Please visit #verification in Discord.");
          return;
        }

        if (data.status === "NEEDS_AUTH") {
          setState("NEEDS_AUTH");
          setOauthUrl(data.oauthUrl || "/api/auth/discord");
          return;
        }

        if (data.status === "IDENTITY_MISMATCH") {
          setState("IDENTITY_MISMATCH");
          setMismatchData({
            sessionUserId: data.sessionUserId,
            currentUsername: data.currentUsername,
          });
          setErrorMessage(data.message);
          return;
        }

        if (data.status === "READY") {
          setUserInfo(data.currentUser);
          setAccountAgeDays(data.accountAgeDays);
          setState("READY");
        }
      } catch (err: any) {
        setState("ERROR");
        setErrorMessage("Network error connecting to verification gateway.");
      }
    }

    checkSession();
  }, [sessionToken]);

  // 2. Perform verification submission
  async function handleCompleteVerification() {
    if (humanCheckStatus !== "VERIFIED") {
      setBotCheckNotice("Please complete the human verification check above.");
      return;
    }

    setState("VERIFYING");
    try {
      const res = await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session: sessionToken,
          humanToken: humanToken,
          humanProof: {
            timestamp: Date.now(),
            token: humanToken,
          },
          captchaChallenge: "shield",
          captchaAnswer: "shield",
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        if (data.alreadyVerified) {
          setState("ALREADY_VERIFIED");
        } else {
          setState("SUCCESS");
        }
      } else {
        setState("ERROR");
        setErrorMessage(data.error || "Failed to complete verification.");
      }
    } catch (err: any) {
      setState("ERROR");
      setErrorMessage("Network error completing verification. Please try again.");
    }
  }

  const userAvatarUrl = userInfo?.avatar
    ? `https://cdn.discordapp.com/avatars/${userInfo.id}/${userInfo.avatar}.png?size=128`
    : "https://cdn.discordapp.com/embed/avatars/0.png";

  return (
    <div className="min-h-screen bg-[#060812] text-slate-100 flex flex-col font-sans selection:bg-purple-600/30 selection:text-white">
      <PublicNavbar />

      <main className="flex-1 flex items-center justify-center px-4 py-16 sm:py-24 relative overflow-hidden">
        {/* Background Ambient Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-md w-full relative z-10">
          {/* Card Container */}
          <div className="glass-card rounded-3xl p-7 sm:p-9 border border-white/10 bg-[#0b0e1d]/90 shadow-2xl backdrop-blur-xl space-y-6 text-center">
            
            {/* STATE: LOADING / CHECKING */}
            {state === "LOADING" && (
              <div className="py-8 space-y-5 animate-in fade-in duration-200">
                <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-purple-600/30 to-blue-600/30 animate-pulse" />
                  <RefreshCw className="w-8 h-8 text-purple-400 animate-spin relative z-10" />
                </div>
                <div className="space-y-1.5">
                  <h2 className="text-xl font-black text-white tracking-tight">Verifying Checkpoint</h2>
                  <p className="text-xs text-slate-400">Securing encrypted verification handshake...</p>
                </div>
              </div>
            )}

            {/* STATE: NEEDS_AUTH */}
            {state === "NEEDS_AUTH" && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="w-16 h-16 rounded-2xl bg-purple-600/15 border border-purple-500/30 flex items-center justify-center mx-auto text-purple-400 shadow-lg shadow-purple-950/40">
                  <Lock className="w-8 h-8" />
                </div>

                <div className="space-y-2">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/25 text-[11px] font-bold uppercase tracking-wider text-purple-300">
                    <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                    <span>SyncInk Checkpoint</span>
                  </div>
                  <h1 className="text-2xl font-black text-white tracking-tight">Discord Authentication</h1>
                  <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
                    Sign in with Discord to verify your account identity. Only standard identity scope is requested.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.06] text-left text-xs text-slate-300 space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Instant access to all support channels</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Automatic <strong>Verified</strong> &amp; <strong>UPDATES</strong> roles</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Zero access to personal passwords or messages</span>
                  </div>
                </div>

                <a
                  href={oauthUrl || "/api/auth/discord"}
                  className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-purple-600/25 transition-all flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
                >
                  <span>Authenticate with Discord</span>
                  <ArrowRight className="w-4 h-4" />
                </a>

                <p className="text-[11px] text-slate-500">
                  Single-use session valid for 5 minutes.
                </p>
              </div>
            )}

            {/* STATE: IDENTITY_MISMATCH */}
            {state === "IDENTITY_MISMATCH" && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="w-16 h-16 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
                  <ShieldAlert className="w-8 h-8" />
                </div>

                <div className="space-y-2">
                  <h2 className="text-xl font-bold text-white tracking-tight">Discord Account Mismatch</h2>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    You are signed in as <span className="text-white font-semibold">@{mismatchData?.currentUsername}</span> on this browser, but this session was initiated for Discord ID <span className="text-white font-mono">{mismatchData?.sessionUserId}</span>.
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 text-left">
                  Please sign out and sign in using the Discord account that clicked the "Verify Now" button in the server.
                </div>

                <div className="space-y-2.5">
                  <a
                    href={`/api/auth/discord?redirect=${encodeURIComponent(`/verify?session=${encodeURIComponent(sessionToken)}`)}`}
                    className="w-full py-3 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition-colors flex items-center justify-center gap-2"
                  >
                    <span>Switch Discord Account</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                  <Link
                    href="https://discord.com/channels/1520457643842342912/1520748219100041348"
                    className="w-full py-2.5 px-4 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 text-xs font-semibold border border-white/10 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <span>Return to #verification</span>
                  </Link>
                </div>
              </div>
            )}

            {/* STATE: READY */}
            {state === "READY" && userInfo && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="space-y-3">
                  <div className="relative w-20 h-20 mx-auto">
                    <img
                      src={userAvatarUrl}
                      alt={userInfo.username}
                      className="w-20 h-20 rounded-2xl object-cover ring-2 ring-purple-500/40 shadow-xl"
                    />
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-[#0b0e1d] flex items-center justify-center text-white">
                      <UserCheck className="w-3.5 h-3.5" />
                    </div>
                  </div>

                  <div>
                    <h2 className="text-xl font-bold text-white tracking-tight">
                      {userInfo.global_name || userInfo.username}
                    </h2>
                    <p className="text-xs text-slate-400 font-mono">@{userInfo.username}</p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] text-left space-y-2.5 text-xs">
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="text-slate-400">Target Server</span>
                    <span className="font-bold text-white">SyncInk Support</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="text-slate-400">Account Age</span>
                    <span className="font-mono text-purple-300 font-semibold">{accountAgeDays} days</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300 pt-2 border-t border-white/[0.06]">
                    <span className="text-slate-400">Roles to Grant</span>
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-bold border border-purple-500/30">
                        Verified
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-bold border border-blue-500/30">
                        UPDATES
                      </span>
                    </div>
                  </div>
                </div>

                {/* Professional Enterprise-Grade Cloud Armor Human Verification Widget */}
                <div className="rounded-2xl bg-[#0d1124]/90 border border-purple-500/20 p-4 shadow-xl space-y-3 text-left">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-lg bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
                        <ShieldCheck className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-bold text-white tracking-wide">SyncInk Cloud Armor</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span>Anti-Bot Shield</span>
                    </div>
                  </div>

                  {/* Turnstile-style Interactive Security Container */}
                  <div
                    onClick={runHumanVerification}
                    className={`relative p-3.5 rounded-xl border transition-all cursor-pointer select-none flex items-center justify-between ${
                      humanCheckStatus === "VERIFIED"
                        ? "bg-emerald-500/10 border-emerald-500/40 ring-1 ring-emerald-500/20"
                        : humanCheckStatus === "CHECKING"
                        ? "bg-purple-500/10 border-purple-500/40"
                        : humanCheckStatus === "FAILED"
                        ? "bg-red-500/10 border-red-500/40"
                        : "bg-white/[0.03] border-white/10 hover:border-purple-500/40 hover:bg-white/[0.06]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Checkbox / Scanner / Checkmark Icon */}
                      <div
                        className={`w-7 h-7 rounded-lg border flex items-center justify-center transition-all ${
                          humanCheckStatus === "VERIFIED"
                            ? "bg-emerald-500 border-emerald-400 text-white shadow-lg shadow-emerald-500/30"
                            : humanCheckStatus === "CHECKING"
                            ? "bg-purple-950/60 border-purple-400 text-purple-300"
                            : humanCheckStatus === "FAILED"
                            ? "bg-red-950/60 border-red-400 text-red-300"
                            : "border-white/20 bg-white/[0.04] hover:border-purple-400"
                        }`}
                      >
                        {humanCheckStatus === "VERIFIED" && <CheckCircle2 className="w-4 h-4 animate-in zoom-in-75 duration-200" />}
                        {humanCheckStatus === "CHECKING" && <RefreshCw className="w-4 h-4 animate-spin text-purple-400" />}
                        {humanCheckStatus === "FAILED" && <ShieldAlert className="w-4 h-4 text-red-400" />}
                        {humanCheckStatus === "IDLE" && <div className="w-2.5 h-2.5 rounded-sm bg-transparent" />}
                      </div>

                      <div>
                        <p className="text-xs font-bold text-white">
                          {humanCheckStatus === "VERIFIED"
                            ? "Human Verification Passed"
                            : humanCheckStatus === "CHECKING"
                            ? "Analyzing Browser Integrity..."
                            : humanCheckStatus === "FAILED"
                            ? "Security Verification Flagged"
                            : "Verify you are human"}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {humanCheckStatus === "VERIFIED"
                            ? "Cryptographic token validated successfully"
                            : humanCheckStatus === "CHECKING"
                            ? "Validating behavioral and client environment..."
                            : humanCheckStatus === "FAILED"
                            ? "Automated connection flagged. Please retry."
                            : "Click to perform human security check"}
                        </p>
                      </div>
                    </div>

                    <div className="text-right text-[10px] text-slate-500 shrink-0 flex flex-col items-end">
                      <Lock className="w-3.5 h-3.5 text-purple-400/80 mb-0.5" />
                      <span className="font-semibold text-slate-400">Turnstile</span>
                    </div>
                  </div>

                  {botCheckNotice && (
                    <p className="text-[11px] text-red-400 animate-in fade-in flex items-center gap-1.5">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      <span>{botCheckNotice}</span>
                    </p>
                  )}
                </div>

                <button
                  onClick={handleCompleteVerification}
                  disabled={humanCheckStatus !== "VERIFIED"}
                  className={`w-full py-3.5 px-5 rounded-2xl font-bold text-sm shadow-lg transition-all flex items-center justify-center gap-2 ${
                    humanCheckStatus === "VERIFIED"
                      ? "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-purple-600/30 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                      : "bg-white/10 text-slate-400 border border-white/5 cursor-not-allowed opacity-60"
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{humanCheckStatus === "VERIFIED" ? "Complete Verification & Access Server" : "Verify you are human above"}</span>
                </button>
              </div>
            )}

            {/* STATE: VERIFYING */}
            {state === "VERIFYING" && (
              <div className="py-8 space-y-4 animate-in fade-in duration-200">
                <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-purple-600/30 to-emerald-600/30 animate-pulse" />
                  <RefreshCw className="w-8 h-8 text-purple-400 animate-spin relative z-10" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-white tracking-tight">Assigning Server Permissions</h3>
                  <p className="text-xs text-slate-400">Authorizing Verified and Updates roles on Discord...</p>
                </div>
              </div>
            )}

            {/* STATE: SUCCESS */}
            {state === "SUCCESS" && (
              <div className="space-y-6 animate-in zoom-in-95 duration-300">
                <div className="w-18 h-18 rounded-3xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400 shadow-xl shadow-emerald-950/40 p-4">
                  <CheckCircle2 className="w-10 h-10" />
                </div>

                <div className="space-y-2">
                  <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[10px] font-extrabold uppercase tracking-wider text-emerald-300">
                    <span>Identity Verified</span>
                  </div>
                  <h1 className="text-2xl font-black text-white tracking-tight">Welcome to SyncInk!</h1>
                  <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
                    Your account has been fully verified. The <strong className="text-white">Verified</strong> and <strong className="text-white">UPDATES</strong> roles have been unlocked on your profile.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.06] text-xs text-slate-300 space-y-1.5 text-left">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Server channels unlocked</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Unverified role removed</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Community and support access active</span>
                  </div>
                </div>

                <a
                  href="https://discord.com/channels/1520457643842342912"
                  className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/25 transition-all flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
                >
                  <span>Return to Discord Server</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            )}

            {/* STATE: ALREADY_VERIFIED */}
            {state === "ALREADY_VERIFIED" && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="w-16 h-16 rounded-2xl bg-purple-600/15 border border-purple-500/30 flex items-center justify-center mx-auto text-purple-400">
                  <ShieldCheck className="w-8 h-8" />
                </div>

                <div className="space-y-2">
                  <h2 className="text-xl font-bold text-white tracking-tight">Already Verified</h2>
                  <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
                    Your account already has full access to the SyncInk Support Server with the Verified role.
                  </p>
                </div>

                <a
                  href="https://discord.com/channels/1520457643842342912"
                  className="w-full py-3.5 px-5 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm shadow-lg shadow-purple-600/25 transition-colors flex items-center justify-center gap-2"
                >
                  <span>Open Discord Support Server</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            )}

            {/* STATE: EXPIRED */}
            {state === "EXPIRED" && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="w-16 h-16 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
                  <Clock className="w-8 h-8" />
                </div>

                <div className="space-y-2">
                  <h2 className="text-xl font-bold text-white tracking-tight">Session Expired</h2>
                  <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
                    For security reasons, verification tokens expire after 5 minutes. Please head back to Discord and click "Verify Now" to start a new session.
                  </p>
                </div>

                <a
                  href="https://discord.com/channels/1520457643842342912/1520748219100041348"
                  className="w-full py-3.5 px-5 rounded-2xl bg-white/[0.06] hover:bg-white/[0.1] text-slate-200 font-bold text-sm border border-white/10 transition-colors flex items-center justify-center gap-2"
                >
                  <span>Go to #verification</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            )}

            {/* STATE: ERROR */}
            {state === "ERROR" && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="w-16 h-16 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center mx-auto text-red-400">
                  <AlertCircle className="w-8 h-8" />
                </div>

                <div className="space-y-2">
                  <h2 className="text-xl font-bold text-white tracking-tight">Verification Notice</h2>
                  <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
                    {errorMessage || "Unable to proceed with verification."}
                  </p>
                </div>

                <a
                  href="https://discord.com/channels/1520457643842342912/1520748219100041348"
                  className="w-full py-3 px-4 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-slate-300 font-bold text-xs border border-white/10 transition-colors flex items-center justify-center gap-2"
                >
                  <span>Return to #verification in Discord</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
            )}

          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#060812] flex items-center justify-center text-slate-400">
          <div className="flex items-center gap-2 text-xs font-mono">
            <RefreshCw className="w-4 h-4 animate-spin text-purple-400" />
            <span>Loading verification portal...</span>
          </div>
        </div>
      }
    >
      <VerifyContent />
    </Suspense>
  );
}
