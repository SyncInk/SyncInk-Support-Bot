"use client";

import React, { useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ExternalLink, Bot, ArrowRight, ShieldCheck, FileText, CheckCircle2 } from "lucide-react";
import { PublicNavbar } from "@/components/PublicNavbar";
import { PublicFooter } from "@/components/PublicFooter";

function TicketRedirectContent() {
  const searchParams = useSearchParams();
  const transcriptId = searchParams.get("transcript");

  useEffect(() => {
    let target = "https://syncink-discord-ticket-bot.vercel.app";
    if (transcriptId) {
      target = `https://syncink-discord-ticket-bot.vercel.app/transcripts`;
    }
    const timer = setTimeout(() => {
      window.location.href = target;
    }, 800);
    return () => clearTimeout(timer);
  }, [transcriptId]);

  const targetUrl = transcriptId
    ? `https://syncink-discord-ticket-bot.vercel.app/transcripts`
    : "https://syncink-discord-ticket-bot.vercel.app";

  return (
    <div className="min-h-screen bg-[#060812] text-white flex flex-col font-sans selection:bg-purple-600 selection:text-white">
      <PublicNavbar />

      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="max-w-md w-full p-8 rounded-3xl bg-gradient-to-b from-[#13091e] to-[#0a0510] border border-purple-500/30 text-center shadow-[0_0_50px_rgba(147,51,234,0.2)]">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-purple-600/20 border-2 border-purple-500/40 flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(147,51,234,0.35)]">
            <Bot className="w-8 h-8 text-purple-400 animate-pulse" />
          </div>

          <h1 className="text-2xl font-black text-white tracking-tight">SyncInk Ticket Bot Console</h1>
          <p className="text-xs text-slate-300 mt-2 leading-relaxed">
            Redirecting you to the original dedicated Ticket Dashboard on Vercel...
          </p>

          <div className="my-6 flex justify-center">
            <div className="w-8 h-8 border-3 border-purple-500 border-t-transparent rounded-full animate-spin" />
          </div>

          <a
            href={targetUrl}
            className="w-full py-3 px-5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs sm:text-sm transition-all shadow-[0_0_20px_rgba(147,51,234,0.4)] flex items-center justify-center gap-2"
          >
            <span>Open Dedicated Ticket Dashboard</span>
            <ExternalLink className="w-4 h-4" />
          </a>

          <div className="mt-6 pt-6 border-t border-white/5 flex items-center justify-center gap-4 text-xs text-slate-400">
            <a
              href="https://syncink-discord-ticket-bot.vercel.app/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-purple-400 transition-colors"
            >
              Privacy Policy
            </a>
            <span>•</span>
            <a
              href="https://syncink-discord-ticket-bot.vercel.app/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-purple-400 transition-colors"
            >
              Terms of Use
            </a>
            <span>•</span>
            <a
              href="https://syncink-discord-ticket-bot.vercel.app/transcripts"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-purple-400 transition-colors"
            >
              Transcripts
            </a>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}

export default function TicketDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#060812] flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-purple-300 font-medium text-sm">Redirecting to Ticket Console...</p>
          </div>
        </div>
      }
    >
      <TicketRedirectContent />
    </Suspense>
  );
}
