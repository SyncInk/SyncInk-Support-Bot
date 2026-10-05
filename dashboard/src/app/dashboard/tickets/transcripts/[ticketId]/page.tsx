"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Shield, Lock, Sparkles, RefreshCw } from "lucide-react";
import { PublicNavbar } from "@/components/PublicNavbar";
import { PublicFooter } from "@/components/PublicFooter";
import { DiscordTranscriptViewer, TranscriptTicket } from "@/components/DiscordTranscriptViewer";

export default function StandaloneTranscriptPage() {
  const params = useParams();
  const ticketId = params?.ticketId as string;

  const [ticket, setTicket] = useState<TranscriptTicket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const searchParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const guildId = searchParams?.get("guildId");

  const fetchTranscript = async () => {
    if (!ticketId) return;
    setLoading(true);
    setError(null);

    try {
      // 1. Try guild-scoped proxy first if guildId is available
      let res = guildId ? await fetch(`/api/tickets/guilds/${guildId}/tickets/${ticketId}/transcript`) : null;

      // 2. Try global transcript proxy
      if (!res || !res.ok) {
        res = await fetch(`/api/tickets/transcripts/${ticketId}`);
      }

      // 3. Direct Render backend fallback
      if (!res || !res.ok) {
        const directUrl = guildId
          ? `https://syncink-ticket.onrender.com/api/guilds/${guildId}/tickets/${ticketId}/transcript`
          : `https://syncink-ticket.onrender.com/api/transcripts/${ticketId}`;
        res = await fetch(directUrl);
      }

      const contentType = res?.headers?.get("content-type") || "";
      if (!res || !res.ok || !contentType.includes("application/json")) {
        throw new Error(`Transcript for ticket #${ticketId} was not found or is still archiving.`);
      }

      const data = await res.json();
      if (!data || !data.ticketId) {
        throw new Error(`Transcript for ticket #${ticketId} not found.`);
      }
      setTicket(data);
    } catch (err: any) {
      console.error("[TRANSCRIPT] Load error:", err);
      setError(err.message || "Failed to load ticket transcript.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTranscript();

    // Auto-sync in the background every 5 seconds silently without UI spinners or notifications
    const interval = setInterval(async () => {
      if (!ticketId) return;
      try {
        let res = guildId ? await fetch(`/api/tickets/guilds/${guildId}/tickets/${ticketId}/transcript`) : null;
        if (!res || !res.ok) {
          res = await fetch(`/api/tickets/transcripts/${ticketId}`);
        }
        if (!res || !res.ok) {
          const directUrl = guildId
            ? `https://syncink-ticket.onrender.com/api/guilds/${guildId}/tickets/${ticketId}/transcript`
            : `https://syncink-ticket.onrender.com/api/transcripts/${ticketId}`;
          res = await fetch(directUrl);
        }

        const contentType = res?.headers?.get("content-type") || "";
        if (res && res.ok && contentType.includes("application/json")) {
          const data = await res.json();
          if (data && (data.ticketId || data.messages)) {
            setTicket((prev) => {
              if (!prev || String(prev.ticketId) !== String(ticketId)) return data;
              const prevLen = prev.messages?.length || 0;
              const newLen = data.messages?.length || 0;
              if (prevLen !== newLen || JSON.stringify(prev.messages) !== JSON.stringify(data.messages)) {
                return { ...prev, ...data };
              }
              return prev;
            });
          }
        }
      } catch (e) {
        // Silent background update
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [ticketId, guildId]);

  return (
    <div className="min-h-screen bg-[#060812] text-slate-100 flex flex-col font-sans selection:bg-purple-600 selection:text-white">
      <PublicNavbar />

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Navigation & Status Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
          <Link
            href="/dashboard/tickets?tab=transcripts"
            className="text-xs font-bold text-slate-400 hover:text-white transition-colors flex items-center gap-2 group"
          >
            <div className="p-1 rounded-md bg-white/[0.05] group-hover:bg-purple-600 group-hover:text-white transition-all">
              <ArrowLeft className="w-3.5 h-3.5" />
            </div>
            <span>Back to Transcripts Archive</span>
          </Link>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-500/15 text-purple-300 border border-purple-500/25">
              <Lock className="w-3 h-3 text-purple-400" />
              Encrypted Discord Archive
            </span>

            {error && (
              <button
                type="button"
                onClick={fetchTranscript}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-xs font-semibold text-slate-300 hover:text-white transition-all border border-white/[0.08]"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry</span>
              </button>
            )}
          </div>
        </div>

        {/* Discord Transcript Viewer */}
        <div className="relative">
          <DiscordTranscriptViewer
            ticket={ticket}
            loading={loading}
            error={error}
            standalone={true}
          />
        </div>

        {/* Security & Verification Footer */}
        <div className="p-4 rounded-2xl bg-[#0c0f1d] border border-white/[0.06] flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-purple-400" />
            <span>Cryptographically sealed and signed by SyncInk Discord Ticket Infrastructure.</span>
          </div>
          <Link
            href="/privacy"
            className="text-purple-400 hover:text-purple-300 font-medium transition-colors"
          >
            Privacy &amp; Data Retention
          </Link>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
