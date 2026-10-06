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
  Ban,
  Share2
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
  const [copiedRuleId, setCopiedRuleId] = useState<string | null>(null);

  const handleCopyLink = (ruleId?: string) => {
    if (typeof window !== "undefined") {
      const url = ruleId
        ? `${window.location.origin}/dashboard/tickets/terms#${ruleId}`
        : `${window.location.origin}/dashboard/tickets/terms`;
      navigator.clipboard.writeText(url);
      setCopiedRuleId(ruleId || "all");
      setTimeout(() => setCopiedRuleId(null), 2000);
    }
  };

  return (
    <TicketMarketingFrame
      active="terms"
      eyebrow="Official Legal Agreements & Terms"
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
      <div className="space-y-10">
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
                className="p-4 rounded-2xl bg-[#0e121d] border border-white/[0.08] flex flex-col gap-1.5"
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
        <div className="flex flex-wrap items-center gap-2 p-4 rounded-2xl bg-[#0e121d] border border-white/[0.08]">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-2 font-mono">Jump to Clause:</span>
          {TERMS_SECTIONS.map((sec) => (
            <a
              key={sec.id}
              href={`#${sec.id}`}
              className="px-3 py-1 rounded-full text-xs font-semibold bg-white/[0.04] hover:bg-purple-600/20 hover:border-purple-500/40 border border-white/[0.08] text-slate-300 hover:text-white transition-all"
            >
              {sec.number}. {sec.badge}
            </a>
          ))}
          <button
            type="button"
            onClick={() => handleCopyLink()}
            className="ml-auto inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-600/20 text-purple-300 border border-purple-500/30 hover:bg-purple-600/30 transition-all"
          >
            {copiedRuleId === "all" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedRuleId === "all" ? "Link Copied!" : "Share Terms"}</span>
          </button>
        </div>

        {/* Detailed Terms Clauses */}
        <section className="space-y-6">
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5">
                <FileText className="h-6 w-6 text-purple-400" />
                Enforceable Service Clauses
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Official terms and service conditions governing SyncInk Ticket Bot operations.
              </p>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              Showing {TERMS_SECTIONS.length} of {TERMS_SECTIONS.length} Clauses
            </span>
          </div>

          <div className="grid grid-cols-1 gap-5">
            {TERMS_SECTIONS.map((sec) => (
              <div
                key={sec.id}
                id={sec.id}
                className="group relative rounded-2xl border border-white/[0.08] bg-[#0e121d] p-6 hover:border-purple-500/40 hover:shadow-[0_4px_24px_rgba(139,76,255,0.12)] transition-all duration-300 scroll-mt-24"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-black text-white uppercase tracking-wider px-2.5 py-1 rounded-md bg-white/[0.06] border border-white/10 font-mono">
                      CLAUSE {sec.number}
                    </span>
                    <h3 className="text-lg font-bold text-white group-hover:text-purple-400 transition-colors">
                      {sec.title}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border bg-purple-950/60 text-purple-400 border-purple-800/50">
                      {sec.badge}
                    </span>
                    <button
                      onClick={() => handleCopyLink(sec.id)}
                      title="Copy link to this clause"
                      className="p-1 rounded-md text-slate-500 hover:text-white hover:bg-white/[0.06] transition-colors"
                    >
                      {copiedRuleId === sec.id ? (
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                      ) : (
                        <Share2 className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-4">
                  {sec.takeaway}
                </p>

                {/* Sub details bullet points matching /rules */}
                <div className="mt-4 pt-3 border-t border-white/[0.06] space-y-2">
                  {sec.points.map((pt, pIdx) => (
                    <div
                      key={pIdx}
                      className="flex items-start gap-2 text-xs text-slate-300 leading-relaxed"
                    >
                      <span className="text-purple-400 font-bold mt-0.5">•</span>
                      <div>
                        <strong className="text-white font-semibold">{pt.subtitle}: </strong>
                        <span className="text-slate-400">{pt.desc}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer metadata */}
                <div className="mt-4 pt-3 border-t border-white/[0.04] flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-slate-400">Jurisdiction:</span>
                    <span>Discord Developer Platform & Terms</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-slate-400">Enforcement:</span>
                    <span className="text-rose-400 font-medium">Automatic Revocation</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Contact Legal Inquiry Card */}
        <div className="p-6 rounded-2xl bg-[#0e121d] border border-white/[0.08] hover:border-purple-500/30 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-purple-300 font-bold text-sm sm:text-base">
              <MessageSquare className="w-5 h-5 text-purple-400" />
              <span>Questions or Enterprise Licensing Inquiries?</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
              Have specific questions regarding customized SLA agreements, high-volume server deployments, or policy compliance? Our operations team is available in our official Discord community.
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

        {/* Bottom Metadata Bar - NO RULES BUTTON */}
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
            <Link href="/dashboard/tickets/status" className="hover:text-white transition-colors">
              System Status
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
