"use client";

import React from "react";
import { BookOpenCheck, ShieldCheck, CheckCircle2, Lightbulb, Terminal, ArrowRight, ExternalLink } from "lucide-react";
import { TicketMarketingFrame } from "@/components/TicketMarketingFrame";

const SUPPORT_URL = "https://discord.gg/rB6gNZaK9u";
const INVITE_URL = "https://discord.com/oauth2/authorize?client_id=1513075101992747158&permissions=361046068240&integration_type=0&scope=bot+applications.commands";

const guideSteps = [
  {
    step: "01",
    badge: "Step 1: Onboarding",
    title: "Invite the Bot & Authenticate",
    description: "Connect the bot to your Discord server and access the web dashboard with administrator permissions.",
    commandSnippet: "/ticket-panel",
    items: [
      "Invite SyncInk Ticket with the Administrator permission flag to ensure it can create private channels and manage role overwrites.",
      "Navigate to the SyncInk web dashboard and click 'Login with Discord' to sign in with your Discord account.",
      "Select your target server from the workspace dropdown. The bot automatically recognizes servers where you have Manage Server or Administrator rights."
    ],
    proTip: "Ensure the 'SyncInk Ticket' bot role is placed higher than your community member roles in Server Settings -> Roles."
  },
  {
    step: "02",
    badge: "Step 2: Customization",
    title: "Configure Categories & Panels",
    description: "Shape what your members see when seeking assistance and organize where channels open.",
    commandSnippet: "/ticket-config category",
    items: [
      "Open the 'Ticket Categories' tab on the dashboard to define support types (e.g. General Support, Billing, Technical Issues, Staff Abuse).",
      "Assign dedicated staff roles for each category so only relevant team members receive pings when a ticket in that category is created.",
      "Head to 'Ticket Panels', customize the embed title, instructions, color gradient, and thumbnail, then click 'Deploy Ticket Panel' to post it into your support channel."
    ],
    proTip: "Use Discord emojis in your category labels (e.g. 💳 Billing, ⚙️ Technical) for higher engagement and clarity."
  },
  {
    step: "03",
    badge: "Step 3: Governance",
    title: "Assign Staff Roles & Permissions",
    description: "Ensure your support agents have the right permissions to handle tickets without exposing server admin settings.",
    commandSnippet: "/ticket-config role",
    items: [
      "Navigate to 'Dashboard Access' to review your server role mappings across Owner, Developer, Admin, Moderator, and Staff tiers.",
      "Staff tier members can claim tickets, transfer conversations, and view activity feeds without accessing sensitive guild settings.",
      "Admins have complete control over panel deployment, bot nickname synchronization, and logging configurations."
    ],
    proTip: "Never give full Administrator permission to junior moderators; assign them to the 'Staff' or 'Moderator' tier instead."
  },
  {
    step: "04",
    badge: "Step 4: Monitoring",
    title: "Transcripts, Logs & Real-Time Analytics",
    description: "Set up automatic conversation logging and monitor team performance indicators.",
    commandSnippet: "/ticket-logs",
    items: [
      "Select a private text channel for 'Ticket Logs' and 'Transcripts' under the 'Miscellaneous' or 'Ticket Logs' tab.",
      "When tickets are closed, SyncInk automatically compiles an encrypted transcript and uploads it securely to cloud storage.",
      "Monitor the 'Analytics' tab to inspect average response times, busiest support days, and staff activity volume rankings."
    ],
    proTip: "You can view online transcripts anytime directly from your dashboard under the 'Transcripts' tab with instant search."
  }
];

export default function DedicatedGuidesPage() {
  return (
    <TicketMarketingFrame
      active="guides"
      eyebrow="Setup Guide & Walkthrough"
      title="Configure SyncInk Ticket in minutes"
      description="A clear walkthrough to help you connect the bot, customize ticket entry panels, configure staff workflows, and monitor server support."
      actions={[
        { label: "Open Dashboard", to: "/dashboard/tickets", tone: "primary" },
        { label: "Invite Bot to Server", href: INVITE_URL, external: true, tone: "secondary" },
        { label: "Discord Support", href: SUPPORT_URL, external: true, tone: "secondary" }
      ]}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {guideSteps.map((step) => (
          <article
            key={step.title}
            className="group relative rounded-2xl border border-white/[0.08] bg-[#0e121d] p-6 hover:border-purple-500/40 hover:shadow-[0_4px_24px_rgba(139,76,255,0.12)] transition-all duration-300 flex flex-col justify-between"
          >
            <div>
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-black text-white uppercase tracking-wider px-2.5 py-1 rounded-md bg-white/[0.06] border border-white/10 font-mono">
                    {step.step}
                  </span>
                  <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-purple-400 transition-colors">
                    {step.title}
                  </h3>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border bg-purple-950/60 text-purple-400 border-purple-800/50">
                  {step.badge}
                </span>
              </div>

              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-4">
                {step.description}
              </p>

              {/* Step items checklist */}
              <div className="space-y-2 mt-4 pt-3 border-t border-white/[0.06]">
                {step.items.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-300 leading-relaxed">
                    <CheckCircle2 className="h-4 w-4 text-purple-400 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Pro Tip Callout */}
            <div className="mt-4 p-3.5 rounded-xl bg-purple-950/40 border border-purple-800/40 text-xs text-purple-200 flex items-start gap-2.5">
              <Lightbulb className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-amber-400 font-semibold">Pro Tip: </strong>
                <span>{step.proTip}</span>
              </div>
            </div>
          </article>
        ))}
      </div>

      {/* Assistance Card */}
      <div className="p-6 rounded-2xl bg-[#0e121d] border border-white/[0.08] hover:border-purple-500/30 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 mt-8">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-purple-300 font-bold text-sm sm:text-base">
            <ShieldCheck className="w-5 h-5 text-purple-400" />
            <span>Need Help With Complex Permissions or Customization?</span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
            Our support team and developer community are ready to assist you in getting your server configured smoothly.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0 flex-wrap">
          <a
            href={SUPPORT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs sm:text-sm font-bold text-white transition-all shadow-lg shadow-purple-950/50 border border-purple-400/40"
          >
            <span>Join Discord Support</span>
            <ExternalLink className="w-4 h-4" />
          </a>
          <a
            href={INVITE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#161b26] hover:bg-[#1c2331] text-xs sm:text-sm font-semibold text-slate-200 hover:text-white border border-white/10 transition-all"
          >
            <span>Invite Bot</span>
          </a>
        </div>
      </div>
    </TicketMarketingFrame>
  );
}
