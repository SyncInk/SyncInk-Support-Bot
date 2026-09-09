"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Shield, Lock, ArrowRight, AlertCircle, Key, ChevronDown, ChevronUp } from "lucide-react";

function LoginForm() {
  const [key, setKey] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPasskey, setShowPasskey] = useState(false);
  const [redirectUri, setRedirectUri] = useState("");
  const [copied, setCopied] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (typeof window !== "undefined") {
      setRedirectUri(`${window.location.origin}/api/auth/discord/callback`);
    }
  }, []);

  function copyRedirect() {
    if (redirectUri) {
      navigator.clipboard.writeText(redirectUri);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  }

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
    <div className="relative w-full max-w-md">
      {/* Ambient glows */}
      <div className="pointer-events-none absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-brand-red/10 blur-[120px]" />
      <div className="pointer-events-none absolute left-1/4 bottom-1/4 w-[350px] h-[350px] rounded-full bg-[#5865F2]/10 blur-[100px]" />

      <div className="relative glass-panel rounded-2xl p-8 shadow-2xl border border-border/80">
        <div className="flex flex-col items-center text-center">
          {/* Logo Badge */}
          <div className="relative mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-card border border-border shadow-glow">
            <img
              src="https://files.catbox.moe/74l9su.png"
              alt="SyncInk Logo"
              className="h-10 w-10 object-contain"
              onError={(e) => {
                (e.target as HTMLElement).style.display = "none";
              }}
            />
            <Shield className="h-8 w-8 text-brand-red absolute" />
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            SyncInk Security
          </h1>
          <p className="mt-1.5 text-sm text-slate-400">
            Master Defense & Operations Console
          </p>
        </div>

        {error && (
          <div className="mt-6 flex items-start gap-2.5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <span className="leading-snug">{error}</span>
          </div>
        )}

        <div className="mt-6 space-y-4">
          {/* 1. Primary: Login with Discord */}
          <a
            href="/api/auth/discord"
            className="group flex items-center justify-center gap-3 w-full rounded-xl bg-[#5865F2] hover:bg-[#4752C4] py-3.5 px-4 font-bold text-white shadow-lg transition-all hover:shadow-[#5865F2]/30 active:scale-[0.99]"
          >
            {/* Discord Icon */}
            <svg
              className="h-5 w-5 fill-current"
              viewBox="0 0 127.14 96.36"
            >
              <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,45.91,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,45.91,96.12,53,91.08,65.69,84.69,65.69Z" />
            </svg>
            <span>Continue with Discord</span>
          </a>

          {/* Exact Redirect URI Copy Helper */}
          {redirectUri && (
            <div className="rounded-xl border border-border/80 bg-surface/80 p-3 text-left shadow-sm">
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="text-[11px] font-semibold text-slate-300">
                  Exact OAuth2 Redirect URI:
                </span>
                <button
                  type="button"
                  onClick={copyRedirect}
                  className="text-[10px] px-2 py-0.5 rounded bg-[#5865F2]/20 hover:bg-[#5865F2]/30 text-[#8ea1e1] font-semibold transition-colors"
                >
                  {copied ? "✓ Copied!" : "Copy"}
                </button>
              </div>
              <code className="block rounded-lg bg-black/50 px-2.5 py-1.5 text-[11px] text-emerald-400 break-all select-all font-mono border border-border/60">
                {redirectUri}
              </code>
              <p className="mt-1 text-[10px] text-slate-500 leading-normal">
                Ensure this exact URL is saved in Discord Developer Portal ➔ OAuth2 ➔ Redirects.
              </p>
            </div>
          )}

          {/* Divider */}
          <div className="relative my-4 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border/70" />
            </div>
            <div className="relative bg-surface-card px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Or
            </div>
          </div>

          {/* 2. Secondary: Admin Passkey Collapsible */}
          <button
            type="button"
            onClick={() => setShowPasskey(!showPasskey)}
            className="flex items-center justify-center gap-2 w-full text-xs font-semibold text-slate-400 hover:text-white py-1 transition-colors"
          >
            <span>Log in with Administrator Passkey</span>
            {showPasskey ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>

          {showPasskey && (
            <form onSubmit={handlePasskeyLogin} className="space-y-3 pt-1">
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
                  <Key className="h-4 w-4" />
                </div>
                <input
                  type="password"
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  placeholder="Enter ADMIN_ACCESS_KEY..."
                  required
                  className="w-full rounded-xl border border-border bg-surface py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 outline-none transition-all focus:border-brand-red focus:ring-1 focus:ring-brand-red"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="group relative flex w-full items-center justify-center gap-2 rounded-xl bg-surface-hover hover:bg-surface border border-border py-2.5 px-4 text-sm font-semibold text-white transition-all hover:border-slate-500 disabled:opacity-50"
              >
                <span>{loading ? "Authenticating..." : "Authenticate via Passkey"}</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </button>
            </form>
          )}
        </div>

        <div className="mt-6 border-t border-border/60 pt-4 text-center">
          <p className="text-xs text-slate-500 flex items-center justify-center gap-1.5">
            <Lock className="h-3.5 w-3.5" /> Secured by Discord OAuth2 & PostgreSQL
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <Suspense fallback={<div className="text-slate-400">Loading auth...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
