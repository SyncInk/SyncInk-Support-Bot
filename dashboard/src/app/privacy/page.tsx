"use client";

import React from "react";
import Link from "next/link";
import {
  Lock,
  ShieldCheck,
  Database,
  EyeOff,
  UserCheck,
  FileCheck,
  ExternalLink,
} from "lucide-react";
import { PublicNavbar } from "@/components/PublicNavbar";
import { PublicFooter } from "@/components/PublicFooter";

export default function PrivacyPage() {
  const lastUpdated = "September 30, 2026";

  const sections = [
    {
      id: "overview",
      icon: ShieldCheck,
      title: "1. Privacy Commitment & Overview",
      content:
        "SyncInk is committed to maintaining high standards of data security, privacy, and transparency. This Privacy Policy details how we collect, process, and safeguard information across our Discord bots (Ticket Bot, Voice Bot, Security Bot), the live web dashboard, and official community channels. We never sell user data, distribute personal information to third-party advertisers, or access private member communications.",
    },
    {
      id: "collection",
      icon: Database,
      title: "2. Information We Collect",
      content:
        "We collect only the minimal data strictly necessary to execute Discord bot features, community safety, and automated moderation:",
      points: [
        "Discord Identification: Public Discord User IDs, guild/server IDs, and channel IDs required to route bot commands, voice rooms, and ticket threads.",
        "Moderation Sanction Ledger: Records of issued warnings, timeouts, kicks, bans, and automod strikes (including case ID, user ID, moderator ID, action type, reason, and timestamp) stored in our secure PostgreSQL database (mod_cases).",
        "Security & Anti-Spam Telemetry: Temporary message frequency and rate-limit counters used exclusively in-memory by our anti-raid, anti-spam, and anti-nuke defense engines.",
        "AI Assistant Session Data: Transient question-and-answer context used strictly to provide relevant conversational responses during an active AI interaction.",
        "What We DO NOT Collect: We never collect, request, or store personal passwords, private payment card information, physical addresses, or off-platform biometric data.",
      ],
    },
    {
      id: "security",
      icon: Lock,
      title: "3. How Data Is Stored & Protected",
      content:
        "All server data is housed in enterprise-grade PostgreSQL databases with end-to-end SSL/TLS encryption in transit and secure encrypted volumes at rest. Administrative web dashboard access is protected via role-based Discord OAuth authorization and encrypted session cookies.",
    },
    {
      id: "third-party",
      icon: EyeOff,
      title: "4. Third-Party Service Providers",
      content:
        "To deliver fast, reliable services, SyncInk interfaces with select vetted technical infrastructure providers:",
      points: [
        "Discord Inc.: The platform through which our bots operate, governed by Discord's Developer Terms and Privacy Policy.",
        "Vercel Inc.: Provides secure cloud hosting and edge runtime execution for the public documentation and management dashboard.",
        "AI Model API Providers (OpenRouter, Google Gemini, OpenAI): Query prompts sent to the SyncInk AI Assistant are processed securely via encrypted API endpoints without permanent profile indexing.",
      ],
    },
    {
      id: "retention",
      icon: UserCheck,
      title: "5. Data Retention & User Rights",
      content:
        "Moderation cases and audit logs are retained to maintain server safety, facilitate fair appeals, and prevent ban evasion. Users hold the right to request information regarding their stored records or request data deletion under appropriate circumstances. To file a data inquiry, submit a ticket in # 🎟️・create-ticket under the 'Account & Server' category.",
    },
    {
      id: "changes",
      icon: FileCheck,
      title: "6. Updates to this Policy",
      content:
        "SyncInk may periodically update this Privacy Policy to reflect technical enhancements or regulatory compliance. Any significant modifications will be announced in # 📢・updates on the official Discord server.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#080a0f] text-slate-100 flex flex-col">
      <PublicNavbar />

      {/* Hero Header */}
      <section className="relative overflow-hidden pt-12 pb-14 border-b border-white/[0.08] bg-gradient-to-b from-[#111624] via-[#0b0e15] to-[#080a0f]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-800/50 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-4">
            <Lock className="h-3.5 w-3.5" />
            Data Protection & Trust
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Privacy Policy & Data Security
          </h1>

          <p className="mt-3 text-xs sm:text-sm text-slate-400">
            Last Updated: {lastUpdated} • Public Access (No Login Required)
          </p>
        </div>
      </section>

      {/* Main Privacy Body */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-1 w-full space-y-8">
        <div className="rounded-2xl border border-white/[0.08] bg-[#0e121d] p-6 sm:p-8 space-y-8">
          <div className="border-b border-white/[0.06] pb-4">
            <h2 className="text-base sm:text-lg font-bold text-white">
              SyncInk Platform Privacy & Telemetry Standards
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Transparent, privacy-first infrastructure designed to protect Discord communities.
            </p>
          </div>

          <div className="space-y-8">
            {sections.map((sec) => {
              const Icon = sec.icon;
              return (
                <div key={sec.id} className="space-y-3">
                  <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2.5">
                    <Icon className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                    <span>{sec.title}</span>
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    {sec.content}
                  </p>
                  {sec.points && (
                    <ul className="list-disc list-inside space-y-1.5 pl-2 text-xs text-slate-400">
                      {sec.points.map((pt, idx) => (
                        <li key={idx} className="leading-relaxed">
                          {pt}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>

          {/* Bottom navigation links */}
          <div className="pt-6 border-t border-white/[0.06] flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
            <div className="flex items-center gap-4">
              <Link href="/terms" className="text-blue-400 hover:underline font-semibold">
                Terms of Use
              </Link>
              <span>•</span>
              <Link href="/rules" className="text-brand-crimson hover:underline font-semibold">
                Server Rules
              </Link>
              <span>•</span>
              <Link href="/faq" className="text-amber-400 hover:underline font-semibold">
                FAQ
              </Link>
            </div>
            <a
              href="https://discord.com/channels/1520457643842342912/1520460764937322566"
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-400 hover:underline flex items-center gap-1 font-semibold"
            >
              <span>Data Rights Inquiries via Ticket</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
