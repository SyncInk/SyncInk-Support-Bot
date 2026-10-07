"use client";

import React from "react";
import Link from "next/link";
import { ShieldAlert, ArrowLeft, Home, Layers } from "lucide-react";
import { PublicNavbar } from "@/components/PublicNavbar";
import { PublicFooter } from "@/components/PublicFooter";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#060812] text-slate-100 flex flex-col font-sans selection:bg-brand-red selection:text-white">
      <PublicNavbar />

      <main className="flex-1 flex items-center justify-center px-4 py-16 sm:py-24 relative overflow-hidden">
        {/* Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-brand-red/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-md w-full text-center relative z-10 space-y-6">
          <div className="w-20 h-20 rounded-full bg-brand-red/15 border-2 border-brand-red/30 flex items-center justify-center mx-auto text-brand-crimson shadow-[0_0_30px_rgba(231,76,60,0.3)]">
            <ShieldAlert className="w-10 h-10" />
          </div>

          <div>
            <span className="text-xs font-extrabold uppercase tracking-widest text-brand-crimson">
              404 • Page Not Found
            </span>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight mt-1">
              Destination Unreachable
            </h1>
            <p className="text-sm text-slate-400 mt-2 leading-relaxed">
              The page you are looking for has been moved, archived, or does not exist within the SyncInk ecosystem.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/"
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm transition-all shadow-[0_0_20px_rgba(88,101,242,0.35)] flex items-center justify-center gap-2"
            >
              <Home className="w-4 h-4" />
              <span>Return to Home</span>
            </Link>
            <Link
              href="/dashboard"
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 font-bold text-sm transition-all border border-white/10 flex items-center justify-center gap-2"
            >
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>Multi-Bot Console</span>
            </Link>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
