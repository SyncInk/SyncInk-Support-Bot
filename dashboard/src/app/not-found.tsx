"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Home, MessageSquare, ExternalLink } from "lucide-react";
import { PublicNavbar } from "@/components/PublicNavbar";
import { PublicFooter } from "@/components/PublicFooter";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#060812] text-slate-100 flex flex-col font-sans selection:bg-brand-blue selection:text-white">
      <PublicNavbar />

      <main className="flex-1 flex items-center justify-center px-4 py-16 sm:py-24 relative overflow-hidden">
        {/* Subtle, restrained ambient lighting */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-brand-blue/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-md w-full text-center relative z-10 space-y-6">
          {/* Small tasteful SyncInk logo mark */}
          <div className="w-16 h-16 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center mx-auto p-3 shadow-inner">
            <Image
              src="/syncink-main-logo.png"
              alt="SyncInk Logo"
              width={40}
              height={40}
              className="object-contain drop-shadow"
            />
          </div>

          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-sky-400">
              404 — Page Not Found
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mt-1">
              This page doesn&apos;t exist.
            </h1>
            <p className="text-sm text-slate-400 mt-2 max-w-sm mx-auto leading-relaxed">
              The requested route was moved, renamed, or is unavailable in the ecosystem.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/"
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm transition-all shadow-[0_0_20px_rgba(88,101,242,0.25)] flex items-center justify-center gap-2"
            >
              <Home className="w-4 h-4" />
              <span>Return Home</span>
            </Link>
            <a
              href="https://discord.gg/rB6gNZaK9u"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] text-slate-200 hover:text-white font-medium text-sm transition-all border border-white/10 flex items-center justify-center gap-2"
            >
              <MessageSquare className="w-4 h-4 text-sky-400" />
              <span>Open Support</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
            </a>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
