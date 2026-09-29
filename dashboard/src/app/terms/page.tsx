"use client";

import React from "react";
import Link from "next/link";
import {
  FileCheck,
  Shield,
  AlertTriangle,
  Scale,
  Lock,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import { PublicNavbar } from "@/components/PublicNavbar";
import { PublicFooter } from "@/components/PublicFooter";

export default function TermsPage() {
  const lastUpdated = "September 30, 2026";

  const sections = [
    {
      id: "acceptance",
      title: "1. Acceptance of Terms",
      content:
        "By accessing or utilizing any SyncInk products, services, Discord bots (including SyncInk Ticket Bot, SyncInk Voice Bot, and SyncInk Security Bot), the web security dashboard, or the official SyncInk Discord community, you agree to be legally bound by these Terms of Use, our Privacy Policy, and the Server Rules. If you do not agree to these terms, you must immediately cease using all SyncInk services and leave the Discord server.",
    },
    {
      id: "services",
      title: "2. Description of Services",
      content:
        "SyncInk provides autonomous Discord community infrastructure, including automated ticketing workflows, join-to-create temporary voice room routing, anti-raid and anti-nuke telemetry protection, AI-assisted community support, and web management consoles. SyncInk reserves the right to modify, suspend, or enhance any service component at any time without prior liability.",
    },
    {
      id: "conduct",
      title: "3. User Conduct & Prohibited Activities",
      content:
        "Users agree to maintain high standards of digital conduct across all SyncInk platforms. You expressly agree not to:",
      points: [
        "Engage in harassment, bullying, hate speech, defamation, or discriminatory abuse against members or staff.",
        "Post, upload, stream, or distribute any NSFW, sexually explicit, gory, or illegal content.",
        "Deploy unauthorized automation, spam bots, user-bots, or raid utilities against SyncInk services.",
        "Attempt to exploit bugs, reverse-engineer bot code, or execute prompt injection against our AI infrastructure.",
        "Advertise external Discord servers, commercial products, or send unsolicited DMs to server members.",
      ],
    },
    {
      id: "ai-terms",
      title: "4. Artificial Intelligence (AI) Acceptable Use",
      content:
        "Interactions with the SyncInk AI Assistant are governed by strict safety and fair-use guidelines:",
      points: [
        "Fair Use: Members are subject to rate limiting (1 query per minute) to ensure equitable computing access.",
        "Anti-Jailbreak Protection: Any attempt to bypass safety guardrails, execute DAN exploits, inject malicious system instructions, or extract proprietary model prompts is strictly prohibited.",
        "PG-13 Standard: All interactive outputs, including Truth or Dare games, must remain suitable for family-friendly community standards. Requests for vulgar, violent, or sexually suggestive answers will be refused automatically.",
      ],
    },
    {
      id: "ip",
      title: "5. Intellectual Property",
      content:
        "All visual branding, trademarks, logos, custom bot architectures, codebases, algorithms, and web dashboards associated with SyncInk are the exclusive intellectual property of SyncInk and its creators. Unauthorized copying, distribution, or commercial exploitation is strictly prohibited without explicit written authorization.",
    },
    {
      id: "liability",
      title: "6. Disclaimers & Limitation of Liability",
      content:
        "SyncInk services are provided strictly on an 'AS-IS' and 'AS-AVAILABLE' basis. While our security engines work continuously to protect server integrity, we make no warranties regarding uninterrupted availability, zero latency, or third-party Discord API outages. Under no circumstances will SyncInk or its developers be held liable for indirect, incidental, or consequential damages resulting from the use or inability to use our services.",
    },
    {
      id: "enforcement",
      title: "7. Moderation Sanctions & Account Termination",
      content:
        "SyncInk administrators and automated security shields reserve the right, at their sole discretion, to issue warnings, timeouts, kicks, server bans, and API blacklists to any user who breaches these Terms. Serious violations (including NSFW distribution, raiding, or malware sharing) result in immediate permanent bans without prior notice.",
    },
    {
      id: "appeals",
      title: "8. Inquiries & Appeals",
      content:
        "If you believe an action was taken against your account mistakenly, you may appeal through our official support ticket system on Discord (# 🎟️・create-ticket) under the Account & Server category. Public disputes regarding moderation actions in chat channels are prohibited.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#080a0f] text-slate-100 flex flex-col">
      <PublicNavbar />

      {/* Header Banner */}
      <section className="relative overflow-hidden pt-12 pb-14 border-b border-white/[0.08] bg-gradient-to-b from-[#111624] via-[#0b0e15] to-[#080a0f]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-950/60 border border-blue-800/50 text-blue-400 text-xs font-bold uppercase tracking-wider mb-4">
            <Scale className="h-3.5 w-3.5" />
            Legal Documentation
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Terms of Use & Service
          </h1>

          <p className="mt-3 text-xs sm:text-sm text-slate-400">
            Last Updated: {lastUpdated} • Public Document (No Authentication Required)
          </p>
        </div>
      </section>

      {/* Main Legal Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-1 w-full space-y-8">
        <div className="rounded-2xl border border-white/[0.08] bg-[#0e121d] p-6 sm:p-8 space-y-8">
          <div className="border-b border-white/[0.06] pb-4">
            <h2 className="text-base sm:text-lg font-bold text-white">
              SyncInk Platform Terms of Service Agreement
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Please review these terms carefully before engaging with SyncInk bots, web tools, or community channels.
            </p>
          </div>

          <div className="space-y-8">
            {sections.map((sec) => (
              <div key={sec.id} className="space-y-3">
                <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                  <span className="text-brand-crimson">§</span>
                  {sec.title}
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
            ))}
          </div>

          {/* Quick links to Privacy and Rules */}
          <div className="pt-6 border-t border-white/[0.06] flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
            <div className="flex items-center gap-4">
              <Link href="/privacy" className="text-accent-cyan hover:underline font-semibold">
                Privacy Policy
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
              <span>Open Support Ticket on Discord</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
