"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Shield, ShieldAlert, Lock, ArrowRight, AlertCircle, Key, ChevronDown, ChevronUp, CheckCircle2, ShieldCheck, Zap } from "lucide-react";

function LoginForm() {
  const [key, setKey] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPasskey, setShowPasskey] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const err = searchParams.get("error");
    if (err) {
      setError(decodeURIComponent(err));
    }
  }, [searchParams]);

  async function handlePasskeyLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!key.trim()) {
      setError("Please enter your administrator passkey.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: key.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Authentication failed.");
      }

      router.push("/");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "An error occurred during authentication.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative w-full max-w-[420px] px-2">
      {/* Ambient background glows */}
      <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-[340px] h-[340px] rounded-full bg-brand-red/15 blur-[100px]" />
      <div className="pointer-events-none absolute -bottom-20 left-1/2 -translate-x-1/2 w-[300px] h-[300px] rounded-full bg-[#5865F2]/15 blur-[90px]" />

      <div className="relative rounded-2xl p-7 sm:p-8 shadow-2xl border border-white/[0.09] bg-[#0e121d]/90 backdrop-blur-2xl">
        {/* Top Logo & Branding */}
        <div className="flex flex-col items-center text-center">
          <div className="relative mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-card border border-white/10 shadow-[0_0_24px_rgba(231,76,60,0.25)]">
            <img
              src="https://files.catbox.moe/74l9su.png"
              alt="SyncInk Logo"
              className="h-11 w-11 object-contain drop-shadow-md"
              onError={(e) => {
                (e.target as HTMLElement).style.display = "none";
              }}
            />
          </div>

          <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
            SyncInk Security
          </h1>
          <p className="mt-1 text-xs text-slate-400 font-medium">
            Autonomous Server Defense & Command Console
          </p>

          {/* Status Badge */}
          <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold text-emerald-400 border border-emerald-500/20">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Security Engine Active</span>
          </div>
        </div>

        {/* Error notification */}
        {error && (
          <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs text-red-300">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-400" />
            <span className="leading-relaxed">{error}</span>
          </div>
        )}

        {/* Action buttons */}
        <div className="mt-6 space-y-4">
          {/* Primary: Continue with Discord */}
          <a
            href="/api/auth/discord"
            className="group relative flex items-center justify-center gap-3 w-full rounded-xl bg-gradient-to-r from-[#5865F2] to-[#4752C4] hover:from-[#4f5bd5] hover:to-[#3e48b0] py-3.5 px-4 font-semibold text-white shadow-[0_4px_20px_rgba(88,101,242,0.35)] transition-all duration-200 hover:shadow-[0_6px_28px_rgba(88,101,242,0.5)] active:scale-[0.98]"
          >
            <svg
              className="h-5 w-5 fill-current transition-transform duration-200 group-hover:scale-110"
              viewBox="0 0 127.14 96.36"
            >
              <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,45.91,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,45.91,96.12,53,91.08,65.69,84.69,65.69Z" />
            </svg>
            <span className="text-sm tracking-wide">Continue with Discord</span>
          </a>

          {/* Micro Security Features Row with SVG Icons */}
          <div className="grid grid-cols-3 gap-2 py-1 text-center">
            <div className="flex items-center justify-center gap-1.5 rounded-lg bg-surface/60 border border-white/[0.05] py-1.5 px-2">
              <ShieldAlert className="h-3.5 w-3.5 text-rose-400 shrink-0" />
              <span className="text-[11px] font-medium text-slate-300">Anti-Nuke</span>
            </div>
            <div className="flex items-center justify-center gap-1.5 rounded-lg bg-surface/60 border border-white/[0.05] py-1.5 px-2">
              <Zap className="h-3.5 w-3.5 text-amber-400 shrink-0" />
              <span className="text-[11px] font-medium text-slate-300">Anti-Raid</span>
            </div>
            <div className="flex items-center justify-center gap-1.5 rounded-lg bg-surface/60 border border-white/[0.05] py-1.5 px-2">
              <Lock className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
              <span className="text-[11px] font-medium text-slate-300">Quarantine</span>
            </div>
          </div>

          {/* Divider */}
          <div className="relative my-3 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/[0.07]" />
            </div>
            <div className="relative bg-[#0e121d] px-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              Or
            </div>
          </div>

          {/* Secondary: Administrator Passkey */}
          <button
            type="button"
            onClick={() => setShowPasskey(!showPasskey)}
            className="flex items-center justify-center gap-1.5 w-full text-xs font-medium text-slate-400 hover:text-white py-1 transition-colors"
          >
            <Key className="h-3.5 w-3.5 text-slate-500" />
            <span>Use Administrator Passkey</span>
            {showPasskey ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>

          {showPasskey && (
            <form onSubmit={handlePasskeyLogin} className="space-y-2.5 pt-1 transition-all">
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                  <Lock className="h-3.5 w-3.5" />
                </div>
                <input
                  type="password"
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  placeholder="Enter administrator passkey..."
                  required
                  className="w-full rounded-xl border border-white/10 bg-surface py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 outline-none transition-all focus:border-brand-red focus:ring-1 focus:ring-brand-red"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-surface-card hover:bg-surface-hover border border-white/10 py-2 px-3 text-xs font-semibold text-white transition-all disabled:opacity-50"
              >
                <span>{loading ? "Verifying..." : "Unlock Console"}</span>
                <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
              </button>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 border-t border-white/[0.06] pt-4 text-center">
          <p className="text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
            <Lock className="h-3 w-3 text-slate-500" /> Encrypted Session • Discord OAuth2 Verified
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[#080a0f] px-4 py-12">
      <Suspense fallback={<div className="text-xs text-slate-400">Loading...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
