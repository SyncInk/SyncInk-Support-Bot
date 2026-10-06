"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  FileText,
  Scale,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  ChevronRight,
  Server,
  Lock,
  MessageSquare,
  Copy,
  Check,
  Ban
} from "lucide-react";
import { TicketMarketingFrame } from "@/components/TicketMarketingFrame";

const SUPPORT_URL = "https://discord.gg/rB6gNZaK9u";

interface TermsSection {
  id: string;
  number: string;
  badge: string;
  title: string;
  takeaway: string;
  points: { subtitle: string; desc: string }[];
}

const TERMS_SECTIONS: TermsSection[] = [
  {
    id: "acceptance",
    number: "01",
    badge: "Binding Agreement",
    title: "Acceptance of Terms & Eligibility",
    takeaway: "By inviting the bot or accessing the web console, you agree to be bound by these Terms of Service.",
    points: [
      {
        subtitle: "Contractual Relationship",
        desc: "These Terms of Service constitute a legally binding agreement between you (individual user or representative of a Discord server) and the SyncInk operations team regarding your use of SyncInk Ticket Bot and the Web Dashboard."
      },
      {
        subtitle: "Discord Terms Compliance",
        desc: "You must at all times comply with Discord's Terms of Service and Discord Community Guidelines. Any violation of Discord's underlying platform rules is deemed an automatic breach of these Terms."
      },
      {
        subtitle: "Age & Authority Requirements",
        desc: "You confirm that you meet the minimum age required by Discord in your jurisdiction (at least 13 years old or local legal threshold) and possess the authority to bind the server on which the bot is deployed."
      }
    ]
  },
  {
    id: "service-scope",
    number: "02",
    badge: "License & Permissions",
    title: "Scope of Service & Bot Permissions",
    takeaway: "SyncInk grants a limited, revocable license to automate ticket workflows on your Discord servers.",
    points: [
      {
        subtitle: "Granted Functional Scope",
        desc: "The bot provides interactive ticket panels, channel creation, role permission overwrites, staff assignment, activity logging, and encrypted transcript generation."
      },
      {
        subtitle: "Required Permissions",
        desc: "To function reliably, the bot requires specific channel management and messaging permissions. Revoking necessary permissions may result in degraded functionality for which SyncInk is not responsible."
      },
      {
        subtitle: "Non-Exclusive License",
        desc: "SyncInk grants you a revocable, non-exclusive, non-transferable license to access the dashboard and deploy the bot strictly for legitimate community support operations."
      }
    ]
  },
  {
    id: "acceptable-use",
    number: "03",
    badge: "Prohibited Conduct",
    title: "Acceptable Use Policy & Server Conduct",
    takeaway: "Zero tolerance for automated spamming, harassment, illegal content, or API exploitation.",
    points: [
      {
        subtitle: "Prohibited Exploits & Rate Abuse",
        desc: "You may not deploy user-bots, automated macros, or spam utilities to flood ticket creation, bypass API rate limits, or overwhelm Discord's infrastructure."
      },
      {
        subtitle: "Illegal Activities & Malicious Content",
        desc: "You agree never to use the ticketing system to facilitate fraud, phishing, distribution of malware, illegal transactions, or harassment of community members."
      },
      {
        subtitle: "Sensitive Information Safeguards",
        desc: "Users must not request or store sensitive passwords, two-factor authentication tokens, credit card numbers, or social security details inside ticket channels."
      }
    ]
  },
  {
    id: "transcripts-confidentiality",
    number: "04",
    badge: "Confidentiality",
    title: "Transcript Confidentiality & Staff Access",
    takeaway: "Ticket logs are confidential between server staff and ticket creators.",
    points: [
      {
        subtitle: "Staff Responsibilities",
        desc: "Server administrators are solely responsible for configuring role permissions. Staff members granted dashboard access must treat member tickets and transcripts as private, confidential communications."
      },
      {
        subtitle: "No Unauthorized Distribution",
        desc: "Publishing, leaking, or distributing confidential ticket logs containing private user communications to unauthorized third parties is strictly prohibited."
      },
      {
        subtitle: "Creator Access",
        desc: "Ticket creators receive an access link to their ticket's closed transcript. Server owners may restrict public transcript links inside dashboard settings."
      }
    ]
  },
  {
    id: "availability-sla",
    number: "05",
    badge: "Availability & SLA",
    title: "Service Availability & Scheduled Maintenance",
    takeaway: "We target 99.9% uptime, but external Discord outages or maintenance may cause brief interruptions.",
    points: [
      {
        subtitle: "High Availability Commitment",
        desc: "SyncInk infrastructure is deployed on scalable cloud infrastructure with automated health monitoring to maintain 24/7 availability."
      },
      {
        subtitle: "Third-Party Dependencies",
        desc: "We cannot guarantee uninterrupted operations during widespread Discord Gateway outages, Cloudflare network degradations, or upstream provider maintenance."
      },
      {
        subtitle: "Scheduled Maintenance",
        desc: "Planned system upgrades will be announced in our official Discord community whenever possible prior to execution."
      }
    ]
  },
  {
    id: "liability-disclaimer",
    number: "06",
    badge: "Legal Disclaimer",
    title: "Warranty Disclaimer & Limitation of Liability",
    takeaway: "The service is provided 'as is' without warranties. Liability is limited to the fullest extent permitted by law.",
    points: [
      {
        subtitle: "As-Is Provision",
        desc: "SyncInk Ticket is provided on an 'AS-IS' and 'AS-AVAILABLE' basis without express or implied warranties of merchantability, fitness for a particular purpose, or non-infringement."
      },
      {
        subtitle: "Limitation of Liability",
        desc: "In no event shall SyncInk, its developers, or affiliates be liable for indirect, incidental, punitive, or consequential damages resulting from lost server data, unauthorized staff leaks, or Discord platform downtime."
      },
      {
        subtitle: "Server Administrator Responsibility",
        desc: "Server owners remain solely responsible for the actions of their server staff and the configuration of role access tiers inside their servers."
      }
    ]
  },
  {
    id: "termination-governance",
    number: "07",
    badge: "Enforcement",
    title: "Termination, Blacklisting & Dispute Resolution",
    takeaway: "Violations may lead to immediate bot removal and dashboard blacklisting. Disputes resolved via Discord support.",
    points: [
      {
        subtitle: "Sanctions for Misconduct",
        desc: "SyncInk reserves the right to terminate bot operation, revoke dashboard licenses, and blacklist servers or users engaged in malicious attacks, API spamming, or terms violations."
      },
      {
        subtitle: "Voluntary Termination",
        desc: "You may terminate your agreement at any time by kicking the bot from your server and discontinuing web dashboard usage."
      },
      {
        subtitle: "Dispute Escalation & Support",
        desc: "For any policy clarifications, tier licensing inquiries, or operational disputes, reach out to our team in the official Discord Support Server at https://discord.gg/rB6gNZaK9u."
      }
    ]
  }
];

export default function DedicatedTermsPage() {
  const [copiedLink, setCopiedLink] = useState(false);

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  return (
    <TicketMarketingFrame
      active="terms"
      eyebrow="Legal & Agreements"
      title="Terms of Service & Usage Agreement"
      description="Binding contractual terms governing your use of SyncInk Ticket Bot, administrative web consoles, transcripts, and related platform services."
      actions={[
        {
          label: "Ticket Console",
          href: "/dashboard/tickets",
          tone: "primary"
        },
        {
          label: "Privacy Policy",
          href: "/dashboard/tickets/privacy",
          tone: "secondary"
        },
        {
          label: "Support Server",
          href: SUPPORT_URL,
          external: true,
          tone: "secondary"
        }
      ]}
    >
      <div className="space-y-8">
        {/* Key Contract Summary Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {[
            { label: "Discord Compliant", desc: "Adheres to platform ToS", icon: CheckCircle2, color: "text-emerald-400" },
            { label: "Confidential Logs", desc: "Protected staff transcripts", icon: Lock, color: "text-purple-400" },
            { label: "Fair Use Policy", desc: "Zero tolerance for spam", icon: AlertTriangle, color: "text-amber-400" },
            { label: "Community First", desc: "Dedicated support team", icon: Scale, color: "text-cyan-400" }
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="p-3.5 sm:p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-md flex flex-col gap-1.5"
              >
                <div className="flex items-center gap-2">
                  <Icon className={`w-4 h-4 ${item.color}`} />
                  <span className="text-xs sm:text-sm font-bold text-white tracking-tight">{item.label}</span>
                </div>
                <span className="text-[11px] text-slate-400">{item.desc}</span>
              </div>
            );
          })}
        </div>

        {/* Quick Navigation Anchor Pills */}
        <div className="flex flex-wrap items-center gap-2 p-3 sm:p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-2">Jump to Clause:</span>
          {TERMS_SECTIONS.map((sec) => (
            <a
              key={sec.id}
              href={`#${sec.id}`}
              className="px-3 py-1 rounded-full text-xs font-semibold bg-white/[0.05] hover:bg-purple-600/30 hover:border-purple-500/40 border border-white/[0.08] text-slate-300 hover:text-white transition-all"
            >
              {sec.number}. {sec.badge}
            </a>
          ))}
          <button
            type="button"
            onClick={handleCopyLink}
            className="ml-auto inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-600/20 text-purple-300 border border-purple-500/30 hover:bg-purple-600/30 transition-all"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedLink ? "Link Copied!" : "Share Terms"}</span>
          </button>
        </div>

        {/* Detailed Terms Clauses */}
        <div className="space-y-6">
          {TERMS_SECTIONS.map((sec) => (
            <section
              key={sec.id}
              id={sec.id}
              className="scroll-mt-28 p-5 sm:p-7 rounded-2xl bg-white/[0.025] border border-white/[0.08] hover:border-purple-500/30 transition-all relative overflow-hidden"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-lg bg-purple-500/15 border border-purple-500/30 text-purple-400 font-mono text-xs font-bold flex items-center justify-center">
                    {sec.number}
                  </span>
                  <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                    {sec.title}
                  </h2>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white/[0.06] text-purple-300 border border-purple-500/20">
                  {sec.badge}
                </span>
              </div>

              {/* Takeaway Highlight Box */}
              <div className="p-3 sm:p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/25 text-xs text-purple-200 mb-5 flex items-start gap-2.5">
                <Scale className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white font-semibold">Key Takeaway: </strong>
                  {sec.takeaway}
                </div>
              </div>

              {/* Detailed Points */}
              <div className="space-y-4">
                {sec.points.map((pt, pIdx) => (
                  <div key={pIdx} className="pl-3.5 border-l-2 border-purple-500/30 space-y-1">
                    <h3 className="text-sm font-semibold text-white">
                      {pt.subtitle}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                      {pt.desc}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* Contact Legal Inquiry Card */}
        <div className="p-5 sm:p-7 rounded-2xl bg-gradient-to-r from-purple-950/30 to-purple-900/10 border border-purple-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-purple-300 font-bold text-sm sm:text-base">
              <MessageSquare className="w-5 h-5 text-purple-400" />
              <span>Questions or Enterprise Licensing Inquiries?</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Have specific questions regarding customized SLA agreements, high-volume server deployments, or policy compliance? Our operations team is available to assist you in our official Discord community.
            </p>
          </div>
          <a
            href={SUPPORT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs sm:text-sm font-bold text-white transition-all shrink-0 shadow-lg shadow-purple-950/50 border border-purple-400/40"
          >
            <span>Contact Support Server</span>
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>

        {/* Footer Navigation Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-6 border-t border-white/[0.08] text-xs text-slate-400">
          <div>
            Last updated: <span className="text-slate-200 font-medium">October 2026</span> • Version 2.4 (Enterprise)
          </div>
          <div className="flex items-center gap-4">
            <Link href="/dashboard/tickets/privacy" className="hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <Link href="/dashboard/tickets/faq" className="hover:text-white transition-colors">
              FAQ
            </Link>
            <Link href="/rules" className="hover:text-white transition-colors">
              Rules
            </Link>
            <a href={SUPPORT_URL} target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300 transition-colors">
              Discord Support Server
            </a>
          </div>
        </div>
      </div>
    </TicketMarketingFrame>
  );
}
