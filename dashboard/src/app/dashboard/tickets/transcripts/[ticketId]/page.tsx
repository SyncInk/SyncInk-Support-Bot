"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { FileText, Download, ArrowLeft, Lock, Calendar, User, CheckCircle2 } from "lucide-react";
import { PublicNavbar } from "@/components/PublicNavbar";
import { PublicFooter } from "@/components/PublicFooter";

interface TicketMessage {
  authorTag: string;
  authorId?: string;
  authorAvatar?: string;
  content: string;
  timestamp: number;
  attachments?: string[];
}

interface TicketData {
  ticketId: string;
  guildId?: string;
  creatorId?: string;
  creator?: { displayName?: string; username?: string; avatar?: string };
  category?: { label?: string; emoji?: string };
  status?: string;
  createdAt?: number;
  closedAt?: number;
  messages?: TicketMessage[];
}

export default function StandaloneTranscriptPage() {
  const params = useParams();
  const ticketId = params?.ticketId as string;

  const [ticket, setTicket] = useState<TicketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ticketId) return;
    setLoading(true);
    fetch(`/api/tickets/transcripts/${ticketId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Transcript not found or bot offline");
        return res.json();
      })
      .then((data) => {
        setTicket(data);
        setError(null);
      })
      .catch((err) => {
        console.error(err);
        setError("Unable to load transcript. It may have expired or is still archiving.");
      })
      .finally(() => setLoading(false));
  }, [ticketId]);

  return (
    <div className="min-h-screen bg-[#060812] text-slate-100 flex flex-col font-sans selection:bg-brand-purple selection:text-white">
      <PublicNavbar />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
          <Link
            href="/dashboard/tickets"
            className="text-xs font-bold text-slate-400 hover:text-white transition-colors flex items-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Tickets Console</span>
          </Link>

          <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30">
            Encrypted Discord Transcript
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 space-y-3">
            <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-semibold">Loading ticket transcript #{ticketId}...</p>
          </div>
        ) : error ? (
          <div className="p-8 rounded-2xl bg-[#0e121f] border border-white/10 text-center space-y-4">
            <FileText className="w-10 h-10 text-slate-500 mx-auto" />
            <h2 className="text-base font-bold text-white">Transcript Notice</h2>
            <p className="text-xs text-slate-400 max-w-md mx-auto">{error}</p>
            <Link
              href="/dashboard/tickets"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition-all shadow-lg"
            >
              Return to Ticket Console
            </Link>
          </div>
        ) : (
          <div className="rounded-3xl bg-[#1e1f22] border border-white/10 shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="p-6 bg-[#2b2d31] border-b border-white/[0.08] flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-xl font-black text-white flex items-center gap-2.5">
                  <FileText className="w-5 h-5 text-purple-400" />
                  <span>Ticket Transcript #{ticket?.ticketId}</span>
                </h1>
                <p className="text-xs text-slate-400 mt-1">
                  Closed on {ticket?.closedAt ? new Date(ticket.closedAt).toLocaleString() : "Recently"}
                </p>
              </div>

              <button
                onClick={() => {
                  const textContent = (ticket?.messages || [])
                    .map((m) => `[${new Date(m.timestamp).toLocaleString()}] ${m.authorTag}: ${m.content}`)
                    .join("\n");
                  const blob = new Blob([textContent], { type: "text/plain" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `transcript-${ticket?.ticketId}.txt`;
                  a.click();
                }}
                className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-bold transition-all border border-white/10 flex items-center gap-2"
              >
                <Download className="w-4 h-4 text-purple-400" />
                <span>Download .txt</span>
              </button>
            </div>

            {/* Messages */}
            <div className="p-6 space-y-4 bg-[#313338] min-h-[300px]">
              {ticket?.messages && ticket.messages.length > 0 ? (
                ticket.messages.map((msg, i) => (
                  <div key={i} className="flex items-start gap-3.5 p-2 rounded-xl hover:bg-black/10 transition-colors">
                    <img
                      src={msg.authorAvatar || "https://cdn.discordapp.com/embed/avatars/0.png"}
                      alt=""
                      className="w-10 h-10 rounded-full object-cover shrink-0"
                    />
                    <div className="flex-1 space-y-1">
                      <div className="flex items-baseline gap-2">
                        <span className="font-bold text-white text-sm">{msg.authorTag.split("#")[0]}</span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(msg.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <div className="text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
                        {msg.content}
                      </div>
                      {msg.attachments && msg.attachments.length > 0 && (
                        <div className="pt-2 flex flex-wrap gap-2">
                          {msg.attachments.map((att, attIdx) => (
                            <a
                              key={attIdx}
                              href={att}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block rounded-lg overflow-hidden border border-white/10 max-w-sm"
                            >
                              <img src={att} alt="attachment" className="max-h-56 object-cover" />
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-slate-500 text-xs">
                  No individual messages stored for this ticket.
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <PublicFooter />
    </div>
  );
}
