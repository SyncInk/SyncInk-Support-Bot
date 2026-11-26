"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence, MotionConfig } from "framer-motion";
import {
  ShieldAlert,
  Lock,
  ArrowRight,
  AlertCircle,
  ChevronDown,
  Zap,
  ArrowLeft,
} from "lucide-react";
import { transition } from "@/lib/motion-tokens";

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
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={transition.enter}
      className="relative w-full max-w-[420px]"
    >
      <div className="mb-4">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors touch-manipulation"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to syncink.site</span>
        </Link>
      </div>

      <div className="rounded-xl p-6 sm:p-8 border border-white/[0.08] bg-[#0c0f18]">
        {/* Top Logo & Branding */}
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#060812] border border-white/[0.1]">
            <Image
              src="/syncink-main-logo.png"
              alt="SyncInk"
              width={28}
              height={28}
              className="object-contain"
            />
          </div>

          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-white">
            SyncInk Console
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Server Defense &amp; Multi-Bot Command Access
          </p>

          <div className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-white/[0.03] px-2.5 py-1 text-[11px] font-mono text-emerald-400 border border-white/[0.08]">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            <span>Security engine active</span>
          </div>
        </div>

        {/* Error notification */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={transition.enter}
              className="mt-5 flex items-start gap-2.5 rounded-lg border border-red-500/25 bg-red-500/10 px-3.5 py-2.5 text-xs text-red-300"
            >
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-400" />
              <span className="leading-relaxed">{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action buttons */}
        <div className="mt-6 space-y-4">
          <a
            href="/api/auth/discord"
            className="flex items-center justify-center gap-2.5 w-full h-11 rounded-lg bg-[#5865F2] hover:bg-[#4752C4] px-4 font-medium text-white transition-colors active:scale-[0.98] touch-manipulation"
          >
            <svg
              className="h-4 w-4 fill-current shrink-0"
              viewBox="0 0 127.14 96.36"
            >
              <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,45.91,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,45.91,96.12,53,91.08,65.69,84.69,65.69Z" />
            </svg>
            <span className="text-sm">Continue with Discord</span>
          </a>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="flex items-center justify-center gap-1.5 rounded-lg bg-[#060812] border border-white/[0.06] py-1.5 px-2">
              <ShieldAlert className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <span className="text-[11px] font-medium text-slate-300">Anti-nuke</span>
            </div>
            <div className="flex items-center justify-center gap-1.5 rounded-lg bg-[#060812] border border-white/[0.06] py-1.5 px-2">
              <Zap className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <span className="text-[11px] font-medium text-slate-300">Anti-raid</span>
            </div>
            <div className="flex items-center justify-center gap-1.5 rounded-lg bg-[#060812] border border-white/[0.06] py-1.5 px-2">
              <Lock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <span className="text-[11px] font-medium text-slate-300">Quarantine</span>
            </div>
          </div>

          <div className="relative my-2 flex items-center justify-center">
            <div className="w-full border-t border-white/[0.06]" />
            <span className="bg-[#0c0f18] px-3 text-[11px] font-mono text-slate-500">
              or
            </span>
            <div className="w-full border-t border-white/[0.06]" />
          </div>

          <button
            type="button"
            onClick={() => setShowPasskey((prev) => !prev)}
            className="flex items-center justify-center gap-2 w-full py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-white/[0.03] transition-colors touch-manipulation"
          >
            <img
              src="/syncink-admin.jpg"
              alt="SyncInk Admin"
              className="h-4 w-4 rounded object-cover border border-white/[0.15]"
            />
            <span>Use SyncInk Admin passkey</span>
            <ChevronDown
              className={`h-3.5 w-3.5 transition-transform duration-200 ${
                showPasskey ? "rotate-180" : ""
              }`}
            />
          </button>

          <AnimatePresence initial={false}>
            {showPasskey && (
              <motion.form
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={transition.expand}
                onSubmit={handlePasskeyLogin}
                className="overflow-hidden"
              >
                <div className="space-y-2.5 pt-1">
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                      <Lock className="h-3.5 w-3.5 text-slate-400" />
                    </div>
                    <input
                      type="password"
                      value={key}
                      onChange={(e) => setKey(e.target.value)}
                      placeholder="Enter SyncInk Admin passkey..."
                      required
                      className="w-full h-10 rounded-lg border border-white/[0.1] bg-[#060812] pl-9 pr-3 text-base sm:text-xs text-white placeholder-slate-500 outline-none transition-colors focus:border-blue-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="flex w-full h-10 items-center justify-center gap-2 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.1] px-3 text-xs font-medium text-white transition-colors disabled:opacity-50 touch-manipulation"
                  >
                    <span>{loading ? "Verifying..." : "Unlock Admin Console"}</span>
                    <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </div>

        <div className="mt-6 border-t border-white/[0.06] pt-4 text-center">
          <p className="text-[11px] font-mono text-slate-500 flex items-center justify-center gap-1.5">
            <Lock className="h-3 w-3 text-slate-500" />
            <span>Encrypted session · Discord OAuth2</span>
          </p>
        </div>
      </div>
    </motion.div>
  );
}

export default function LoginPage() {
  return (
    <MotionConfig reducedMotion="user">
      <div className="flex min-h-screen items-center justify-center bg-[#060812] px-4 py-12 font-sans overflow-x-hidden">
        <Suspense fallback={<div className="text-xs font-mono text-slate-400">Loading...</div>}>
          <LoginForm />
        </Suspense>
      </div>
    </MotionConfig>
  );
}
