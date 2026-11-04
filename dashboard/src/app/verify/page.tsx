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

const CAPTCHA_OPTIONS = [
  { id: "shield", label: "Shield", Icon: ShieldCheck },
  { id: "lock", label: "Lock", Icon: Lock },
  { id: "clock", label: "Clock", Icon: Clock },
  { id: "star", label: "Star", Icon: Sparkles },
];

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

  const [captchaTarget, setCaptchaTarget] = useState<string>("shield");
  const [captchaSelected, setCaptchaSelected] = useState<string | null>(null);
  const [captchaError, setCaptchaError] = useState<boolean>(false);

  // Initialize or reset friendly captcha challenge
  const resetCaptcha = () => {
    const random = CAPTCHA_OPTIONS[Math.floor(Math.random() * CAPTCHA_OPTIONS.length)].id;
    setCaptchaTarget(random);
    setCaptchaSelected(null);
    setCaptchaError(false);
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
          resetCaptcha();
          setState("READY");
        }
      } catch (err: any) {
        setState("ERROR");
        setErrorMessage("Network error connecting to verification gateway.");
      }
    }

    checkSession();
  }, [sessionToken]);

  const handleCaptchaClick = (id: string) => {
    setCaptchaSelected(id);
    if (id === captchaTarget) {
      setCaptchaError(false);
    } else {
      setCaptchaError(true);
      setTimeout(() => {
        resetCaptcha();
      }, 900);
    }
  };

  // 2. Perform verification submission
  async function handleCompleteVerification() {
    if (captchaSelected !== captchaTarget) {
      setCaptchaError(true);
      return;
    }

    setState("VERIFYING");
    try {
      const res = await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session: sessionToken,
          captchaChallenge: captchaTarget,
          captchaAnswer: captchaSelected,
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

                {/* Friendly Human Verification CAPTCHA (Not very tough) */}
                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] text-left space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-200 font-semibold flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                      <span>Human Verification</span>
                    </span>
                    {captchaSelected === captchaTarget ? (
                      <span className="text-emerald-400 font-bold text-[11px] flex items-center gap-1 animate-in fade-in">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Check passed
                      </span>
                    ) : (
                      <span className="text-slate-400 text-[11px]">
                        Select the <strong className="text-purple-300 font-bold">{CAPTCHA_OPTIONS.find((o) => o.id === captchaTarget)?.label}</strong>
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    {CAPTCHA_OPTIONS.map((item) => {
                      const isSelected = captchaSelected === item.id;
                      const isCorrect = isSelected && item.id === captchaTarget;
                      const isWrong = isSelected && item.id !== captchaTarget;

                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleCaptchaClick(item.id)}
                          className={`py-3 px-2 rounded-xl border transition-all flex flex-col items-center justify-center gap-1.5 active:scale-95 ${
                            isCorrect
                              ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-300 ring-2 ring-emerald-500/30 scale-105"
                              : isWrong
                              ? "bg-red-500/20 border-red-500/40 text-red-300"
                              : "bg-white/[0.04] border-white/10 hover:bg-white/[0.08] text-slate-300 hover:text-white hover:border-purple-500/40"
                          }`}
                        >
                          <item.Icon className="w-5 h-5" />
                          <span className="text-[10px] font-semibold">{item.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  {captchaError && (
                    <p className="text-[11px] text-red-400 text-center animate-in fade-in">
                      Incorrect choice. Shuffling a fresh challenge...
                    </p>
                  )}
                </div>

                <button
                  onClick={handleCompleteVerification}
                  disabled={captchaSelected !== captchaTarget}
                  className={`w-full py-3.5 px-5 rounded-2xl font-bold text-sm shadow-lg transition-all flex items-center justify-center gap-2 ${
                    captchaSelected === captchaTarget
                      ? "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-purple-600/30 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                      : "bg-white/10 text-slate-400 border border-white/5 cursor-not-allowed opacity-60"
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{captchaSelected === captchaTarget ? "Complete Verification" : "Select requested icon above"}</span>
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
