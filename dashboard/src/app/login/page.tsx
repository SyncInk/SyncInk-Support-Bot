"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, Lock, ArrowRight, AlertCircle, Key } from "lucide-react";

export default function LoginPage() {
  const [key, setKey] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleLogin(e: React.FormEvent) {
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
    <div className="relative flex min-h-screen items-center justify-center bg-background px-4 py-12">
      {/* Ambient background glows */}
      <div className="pointer-events-none absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-brand-red/10 blur-[120px]" />
      <div className="pointer-events-none absolute left-1/4 bottom-1/4 w-[350px] h-[350px] rounded-full bg-accent-cyan/5 blur-[100px]" />

      <div className="relative w-full max-w-md">
        {/* Card */}
        <div className="glass-panel rounded-2xl p-8 shadow-2xl border border-border/80">
          <div className="flex flex-col items-center text-center">
            {/* Logo Badge */}
            <div className="relative mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-card border border-border shadow-glow">
              <img
                src="https://files.catbox.moe/74l9su.png"
                alt="SyncInk Logo"
                className="h-10 w-10 object-contain"
                onError={(e) => {
                  // Fallback icon if image fails
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
            <div className="mt-6 flex items-center gap-2.5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="mt-6 space-y-4">
            <div>
              <label
                htmlFor="access-key"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2"
              >
                Administrator Access Key
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
                  <Key className="h-4 w-4" />
                </div>
                <input
                  id="access-key"
                  type="password"
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  placeholder="Enter ADMIN_ACCESS_KEY..."
                  autoFocus
                  required
                  className="w-full rounded-xl border border-border bg-surface-card py-3 pl-10 pr-4 text-sm text-white placeholder-slate-500 outline-none transition-all focus:border-brand-red focus:ring-1 focus:ring-brand-red"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="group relative flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-red to-brand-crimson py-3 px-4 text-sm font-semibold text-white shadow-glow transition-all hover:brightness-110 active:scale-[0.99] disabled:opacity-50"
            >
              <span>{loading ? "Authenticating..." : "Access Control Panel"}</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </button>
          </form>

          <div className="mt-6 border-t border-border/60 pt-4 text-center">
            <p className="text-xs text-slate-500 flex items-center justify-center gap-1.5">
              <Lock className="h-3.5 w-3.5" /> End-to-end encrypted session with PostgreSQL
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
