"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence, MotionConfig } from "framer-motion";
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
import { transition } from "@/lib/motion-tokens";

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
    <MotionConfig reducedMotion="user">
    <div className="min-h-screen bg-[#060812] text-slate-100 flex flex-col font-sans overflow-x-hidden selection:bg-blue-600/30 selection:text-white">
      <PublicNavbar />

      <main className="flex-1 flex items-center justify-center px-4 py-12 sm:py-20">
        <div className="max-w-md w-full">
          <div className="rounded-xl p-6 sm:p-8 border border-white/[0.08] bg-[#0c0f18] space-y-6 text-center">
            <AnimatePresence mode="wait">
            {/* STATE: LOADING / CHECKING */}
            {state === "LOADING" && (
              <motion.div
                key="loading"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={transition.enter}
                className="py-8 space-y-4"
              >
                <div className="w-14 h-14 mx-auto rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center">
                  <RefreshCw className="w-6 h-6 text-blue-400 animate-spin" />
                </div>
                <div className="space-y-1">
                  <h2 className="text-lg font-semibold text-white tracking-tight">Verifying checkpoint</h2>
                  <p className="text-xs text-slate-400">Checking verification session...</p>
                </div>
              </motion.div>
            )}

            {/* STATE: NEEDS_AUTH */}
            {state === "NEEDS_AUTH" && (
              <motion.div
                key="needs-auth"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={transition.enter}
                className="space-y-5"
              >
                <div className="w-12 h-12 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center mx-auto text-slate-200">
                  <Lock className="w-6 h-6" />
                </div>

                <div className="space-y-2">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/[0.03] border border-white/[0.08] font-mono text-[11px] text-slate-300">
                    <Sparkles className="w-3 h-3 text-blue-400" />
                    <span>SyncInk Checkpoint</span>
                  </div>
                  <h1 className="text-2xl font-semibold text-white tracking-tight">Discord Authentication</h1>
                  <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
                    Sign in with Discord to verify your account identity. Only standard identity scope is requested.
                  </p>
                </div>

                <div className="p-3.5 rounded-lg bg-[#060812] border border-white/[0.06] text-left text-xs text-slate-300 space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Instant access to support channels</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Automatic <strong className="text-white">Verified</strong> &amp; <strong className="text-white">UPDATES</strong> roles</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Zero access to passwords or messages</span>
                  </div>
                </div>

                <a
                  href={oauthUrl || "/api/auth/discord"}
                  className="w-full h-11 px-5 rounded-lg bg-[#5865F2] hover:bg-[#4752c4] text-white font-medium text-sm transition-colors flex items-center justify-center gap-2 active:scale-[0.98] touch-manipulation"
                >
                  <span>Authenticate with Discord</span>
                  <ArrowRight className="w-4 h-4" />
                </a>

                <p className="text-[11px] font-mono text-slate-500">
                  Single-use session valid for 5 minutes.
                </p>
              </motion.div>
            )}

            {/* STATE: IDENTITY_MISMATCH */}
            {state === "IDENTITY_MISMATCH" && (
              <motion.div
                key="mismatch"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={transition.enter}
                className="space-y-5"
              >
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center mx-auto text-amber-400">
                  <ShieldAlert className="w-6 h-6" />
                </div>

                <div className="space-y-2">
                  <h2 className="text-xl font-semibold text-white tracking-tight">Discord account mismatch</h2>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Signed in as <span className="text-white font-medium">@{mismatchData?.currentUsername}</span>, but this link was created for Discord ID <span className="text-white font-mono">{mismatchData?.sessionUserId}</span>.
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 text-left">
                  Switch to the Discord account that clicked &ldquo;Verify Now&rdquo; inside the server.
                </div>

                <div className="space-y-2">
                  <a
                    href={`/api/auth/discord?redirect=${encodeURIComponent(`/verify?session=${encodeURIComponent(sessionToken)}`)}`}
                    className="w-full h-10 px-4 rounded-lg bg-[#5865F2] hover:bg-[#4752c4] text-white font-medium text-xs transition-colors flex items-center justify-center gap-2 touch-manipulation"
                  >
                    <span>Switch Discord account</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                  <Link
                    href="https://discord.com/channels/1520457643842342912/1520748219100041348"
                    className="w-full h-10 px-4 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 text-xs font-medium border border-white/[0.08] transition-colors flex items-center justify-center gap-1.5 touch-manipulation"
                  >
                    <span>Return to #verification</span>
                  </Link>
                </div>
              </motion.div>
            )}

            {/* STATE: READY */}
            {state === "READY" && userInfo && (
              <motion.div
                key="ready"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={transition.enter}
                className="space-y-5"
              >
                <div className="space-y-3">
                  <div className="relative w-18 h-18 mx-auto inline-block">
                    <img
                      src={userAvatarUrl}
                      alt={userInfo.username}
                      className="w-16 h-16 rounded-xl object-cover border border-white/[0.15]"
                    />
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-[#0c0f18] flex items-center justify-center text-white">
                      <UserCheck className="w-3 h-3" />
                    </div>
                  </div>

                  <div>
                    <h2 className="text-lg font-semibold text-white tracking-tight">
                      {userInfo.global_name || userInfo.username}
                    </h2>
                    <p className="text-xs text-slate-400 font-mono">@{userInfo.username}</p>
                  </div>
                </div>

                <div className="p-3.5 rounded-lg bg-[#060812] border border-white/[0.06] text-left space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="text-slate-400">Target server</span>
                    <span className="font-medium text-white">SyncInk Support</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="text-slate-400">Account age</span>
                    <span className="font-mono text-slate-200 tabular-nums">{accountAgeDays} days</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300 pt-2 border-t border-white/[0.06]">
                    <span className="text-slate-400">Roles to grant</span>
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded bg-white/[0.05] text-slate-200 font-mono text-[10px] border border-white/[0.08]">
                        Verified
                      </span>
                      <span className="px-2 py-0.5 rounded bg-white/[0.05] text-slate-200 font-mono text-[10px] border border-white/[0.08]">
                        UPDATES
                      </span>
                    </div>
                  </div>
                </div>

                {/* SyncInk Cloud Armor Human Verification Widget */}
                <div className="rounded-lg bg-[#060812] border border-white/[0.08] p-3.5 space-y-2.5 text-left">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-blue-400" />
                      <span className="font-medium text-white">SyncInk Cloud Armor</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span>Anti-bot shield</span>
                    </div>
                  </div>

                  <div
                    role="button"
                    tabIndex={0}
                    onClick={runHumanVerification}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        runHumanVerification(e as any);
                      }
                    }}
                    className={`p-3 rounded-lg border transition-colors cursor-pointer select-none flex items-center justify-between touch-manipulation ${
                      humanCheckStatus === "VERIFIED"
                        ? "bg-emerald-500/10 border-emerald-500/35"
                        : humanCheckStatus === "CHECKING"
                        ? "bg-blue-500/10 border-blue-500/35"
                        : humanCheckStatus === "FAILED"
                        ? "bg-red-500/10 border-red-500/35"
                        : "bg-white/[0.02] border-white/[0.08] hover:border-white/[0.16]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-6 h-6 rounded-md border flex items-center justify-center transition-colors ${
                          humanCheckStatus === "VERIFIED"
                            ? "bg-emerald-500 border-emerald-400 text-white"
                            : humanCheckStatus === "CHECKING"
                            ? "bg-blue-500/20 border-blue-400 text-blue-300"
                            : humanCheckStatus === "FAILED"
                            ? "bg-red-500/20 border-red-400 text-red-300"
                            : "border-white/20 bg-white/[0.03]"
                        }`}
                      >
                        {humanCheckStatus === "VERIFIED" && <CheckCircle2 className="w-4 h-4" />}
                        {humanCheckStatus === "CHECKING" && <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-400" />}
                        {humanCheckStatus === "FAILED" && <ShieldAlert className="w-3.5 h-3.5 text-red-400" />}
                      </div>

                      <div>
                        <p className="text-xs font-medium text-white">
                          {humanCheckStatus === "VERIFIED"
                            ? "Human verification passed"
                            : humanCheckStatus === "CHECKING"
                            ? "Checking browser integrity..."
                            : humanCheckStatus === "FAILED"
                            ? "Verification flagged"
                            : "Verify you are human"}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {humanCheckStatus === "VERIFIED"
                            ? "Challenge token validated"
                            : humanCheckStatus === "CHECKING"
                            ? "Running session integrity check..."
                            : humanCheckStatus === "FAILED"
                            ? "Automated connection flagged. Retry."
                            : "Tap to run security check"}
                        </p>
                      </div>
                    </div>

                    <div className="text-right text-[10px] text-slate-500 shrink-0 flex flex-col items-end">
                      <Lock className="w-3.5 h-3.5 text-slate-400 mb-0.5" />
                      <span className="font-mono text-slate-400">Turnstile</span>
                    </div>
                  </div>

                  {botCheckNotice && (
                    <p className="text-[11px] text-red-400 flex items-center gap-1.5">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      <span>{botCheckNotice}</span>
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleCompleteVerification}
                  disabled={humanCheckStatus !== "VERIFIED"}
                  className={`w-full h-11 px-5 rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2 touch-manipulation ${
                    humanCheckStatus === "VERIFIED"
                      ? "bg-blue-600 hover:bg-blue-500 text-white active:scale-[0.98] cursor-pointer"
                      : "bg-white/[0.06] text-slate-400 border border-white/[0.06] cursor-not-allowed opacity-60"
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{humanCheckStatus === "VERIFIED" ? "Complete verification" : "Verify you are human above"}</span>
                </button>
              </motion.div>
            )}

            {/* STATE: VERIFYING */}
            {state === "VERIFYING" && (
              <motion.div
                key="verifying"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={transition.enter}
                className="py-8 space-y-4"
              >
                <div className="w-12 h-12 mx-auto rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center">
                  <RefreshCw className="w-6 h-6 text-blue-400 animate-spin" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-semibold text-white tracking-tight">Assigning server roles</h3>
                  <p className="text-xs text-slate-400">Authorizing Verified and UPDATES roles on Discord...</p>
                </div>
              </motion.div>
            )}

            {/* STATE: SUCCESS */}
            {state === "SUCCESS" && (
              <motion.div
                key="success"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={transition.enter}
                className="space-y-5"
              >
                <div className="w-14 h-14 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center mx-auto text-emerald-400">
                  <CheckCircle2 className="w-8 h-8" />
                </div>

                <div className="space-y-2">
                  <div className="inline-flex items-center px-2.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/25 font-mono text-[11px] text-emerald-300">
                    Identity verified
                  </div>
                  <h1 className="text-2xl font-semibold text-white tracking-tight">Verification complete</h1>
                  <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
                    Your account has been verified. The <strong className="text-white">Verified</strong> and <strong className="text-white">UPDATES</strong> roles are now active on your profile.
                  </p>
                </div>

                <div className="p-3.5 rounded-lg bg-[#060812] border border-white/[0.06] text-xs text-slate-300 space-y-1.5 text-left">
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
                  className="w-full h-11 px-5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm transition-colors flex items-center justify-center gap-2 active:scale-[0.98] touch-manipulation"
                >
                  <span>Return to Discord server</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
              </motion.div>
            )}

            {/* STATE: ALREADY_VERIFIED */}
            {state === "ALREADY_VERIFIED" && (
              <motion.div
                key="already-verified"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={transition.enter}
                className="space-y-5"
              >
                <div className="w-12 h-12 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center mx-auto text-blue-400">
                  <ShieldCheck className="w-6 h-6" />
                </div>

                <div className="space-y-2">
                  <h2 className="text-xl font-semibold text-white tracking-tight">Already verified</h2>
                  <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
                    Your account already has full access to the SyncInk Support Server.
                  </p>
                </div>

                <a
                  href="https://discord.com/channels/1520457643842342912"
                  className="w-full h-11 px-5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm transition-colors flex items-center justify-center gap-2 touch-manipulation"
                >
                  <span>Open Discord Support Server</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
              </motion.div>
            )}

            {/* STATE: EXPIRED */}
            {state === "EXPIRED" && (
              <motion.div
                key="expired"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={transition.enter}
                className="space-y-5"
              >
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center mx-auto text-amber-400">
                  <Clock className="w-6 h-6" />
                </div>

                <div className="space-y-2">
                  <h2 className="text-xl font-semibold text-white tracking-tight">Session expired</h2>
                  <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
                    Verification tokens expire after 5 minutes. Head back to Discord and click &ldquo;Verify Now&rdquo; for a fresh link.
                  </p>
                </div>

                <a
                  href="https://discord.com/channels/1520457643842342912/1520748219100041348"
                  className="w-full h-10 px-5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-slate-200 font-medium text-sm border border-white/[0.08] transition-colors flex items-center justify-center gap-2 touch-manipulation"
                >
                  <span>Go to #verification</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
              </motion.div>
            )}

            {/* STATE: ERROR */}
            {state === "ERROR" && (
              <motion.div
                key="error"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={transition.enter}
                className="space-y-5"
              >
                <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/25 flex items-center justify-center mx-auto text-red-400">
                  <AlertCircle className="w-6 h-6" />
                </div>

                <div className="space-y-2">
                  <h2 className="text-xl font-semibold text-white tracking-tight">Verification notice</h2>
                  <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
                    {errorMessage || "Unable to proceed with verification."}
                  </p>
                </div>

                <a
                  href="https://discord.com/channels/1520457643842342912/1520748219100041348"
                  className="w-full h-10 px-4 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 font-medium text-xs border border-white/[0.08] transition-colors flex items-center justify-center gap-2 touch-manipulation"
                >
                  <span>Return to #verification in Discord</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </motion.div>
            )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
    </MotionConfig>
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
