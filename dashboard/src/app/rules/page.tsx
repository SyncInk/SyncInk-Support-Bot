"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Shield,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Bot,
  Sparkles,
  ExternalLink,
  Search,
  MessageSquare,
  Lock,
  ArrowRight,
  UserCheck,
  Ban,
  FileWarning,
  Share2,
  Copy,
  Check,
} from "lucide-react";
import { PublicNavbar } from "@/components/PublicNavbar";
import { PublicFooter } from "@/components/PublicFooter";

export default function RulesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedRuleId, setCopiedRuleId] = useState<string | null>(null);

  const handleCopyLink = (ruleId: string) => {
    if (typeof window !== "undefined") {
      const url = `${window.location.origin}/rules#${ruleId}`;
      navigator.clipboard.writeText(url);
      setCopiedRuleId(ruleId);
      setTimeout(() => setCopiedRuleId(null), 2000);
    }
  };

  const communityRules = [
    {
      id: "rule-1",
      number: "Rule 1",
      title: "Verification Required",
      badge: "Mandatory Access",
      badgeColor: "bg-blue-950/60 text-blue-400 border-blue-800/50",
      channel: "# ✅・verification (ID: 1520748219100041348)",
      channelLink: "https://discord.com/channels/1520457643842342912/1520748219100041348",
      description:
        "All incoming members must successfully complete verification in the designated verification checkpoint before gaining access to the rest of the server channels. Unverified accounts have restricted access to prevent automated bots and hostile raids.",
      details: [
        "Follow the interactive button instructions in the verification checkpoint.",
        "Attempting to bypass the gatekeeper role or using automated token bots triggers an instant security quarantine.",
      ],
      severity: "Access Restriction",
    },
    {
      id: "rule-2",
      number: "Rule 2",
      title: "Professional Conduct & Mutual Respect",
      badge: "Zero Toxicity",
      badgeColor: "bg-red-950/60 text-brand-crimson border-red-800/50",
      channel: "All Server Channels",
      description:
        "Treat all members, staff personnel, and developers with mutual dignity and respect. SyncInk maintains a zero-tolerance stance against abusive, hostile, and discriminatory behavior.",
      details: [
        "Strictly prohibited: Harassment, bullying, hate speech, racism, sexism, bigotry, discriminatory remarks, personal attacks, and toxic provocation.",
        "Do not intentionally bait arguments, start drama, or escalate conflicts with other members.",
      ],
      severity: "Warning -> Timeout -> Kick / Ban",
    },
    {
      id: "rule-3",
      number: "Rule 3",
      title: "Keep Discussions Relevant",
      badge: "Channel Integrity",
      badgeColor: "bg-amber-950/60 text-amber-400 border-amber-800/50",
      channel: "Designated Channels",
      description:
        "Ensure all messages, media, and inquiries remain strictly relevant to the designated purpose of each respective server channel.",
      details: [
        "General Chat (# 💬・general): Designated channel for casual talk, socializing, and off-topic discussion.",
        "Support Requests (# 🎟️・create-ticket): Official private tickets for one-on-one assistance, reports, and appeals.",
        "Support Chat (# 💬・support-chat): STRICTLY for asking public support questions, troubleshooting, and bot usage. (Note: Casual chatting is NOT permitted here!).",
        "Feature Suggestions (# 💡・feature-request): Post community proposals exclusively via /feature_request or ?feature_request.",
      ],
      severity: "Message Deletion -> Warning",
    },
    {
      id: "rule-4",
      number: "Rule 4",
      title: "Zero Tolerance for Spam",
      badge: "Anti-Spam Shield",
      badgeColor: "bg-orange-950/60 text-orange-400 border-orange-800/50",
      channel: "All Server Channels",
      description:
        "Spamming degrades community discussions and triggers automated defense protocols. All forms of message flooding are strictly banned.",
      details: [
        "Prohibited: Rapid repeated messages, copy-pastas, unsolicited mass mentions/pings (especially staff pings), mass emojis/GIFs/stickers, and bot command spam.",
        "Use bot commands strictly in authorized bot channels or via slash commands.",
      ],
      severity: "Auto-Timeout -> Strike System",
    },
    {
      id: "rule-5",
      number: "Rule 5",
      title: "No Advertising or Self-Promotion",
      badge: "No Solicitation",
      badgeColor: "bg-purple-950/60 text-purple-400 border-purple-800/50",
      channel: "Server Channels & Member DMs",
      description:
        "Direct advertising of external Discord servers, paid third-party services, affiliate links, or social accounts without explicit management approval is strictly forbidden.",
      details: [
        "Posting Discord invite links in chat channels will be automatically intercepted and deleted by SyncInk Security Bot.",
        "Unsolicited advertising sent via direct messages (DM advertising) to server members results in an instant, unappealable ban.",
      ],
      severity: "Instant Kick -> Permanent Ban",
    },
    {
      id: "rule-6",
      number: "Rule 6",
      title: "Security & Responsible Use",
      badge: "Cyber Defense",
      badgeColor: "bg-cyan-950/60 text-accent-cyan border-cyan-800/50",
      channel: "Platform-Wide",
      description:
        "Members must use SyncInk bots, web tools, and Discord infrastructure responsibly. Any attempt to compromise server stability or user accounts is treated as an active malicious exploit.",
      details: [
        "Prohibited: Bug abusing, exploiting bot bugs, token grabbers, malware, phishing sites, or attempting to trigger bot crashes.",
        "If you discover a security glitch or vulnerability, report it privately via a Support Ticket (# 🎟️・create-ticket). Responsible security disclosures may be rewarded.",
      ],
      severity: "Immediate Permanent Ban & Network Blacklist",
    },
    {
      id: "rule-7",
      number: "Rule 7",
      title: "Respect Staff Decisions & Appeal Privately",
      badge: "Staff Authority",
      badgeColor: "bg-indigo-950/60 text-indigo-400 border-indigo-800/50",
      channel: "# 🎟️・create-ticket",
      channelLink: "https://discord.com/channels/1520457643842342912/1520460764937322566",
      description:
        "Follow instructions issued by moderators and administrators. Staff members work continuously to ensure the safety and productivity of the platform.",
      details: [
        "Never argue with or insult moderators in public chat channels.",
        "If you believe a warning, timeout, or moderation sanction was applied mistakenly, file an appeal privately via a ticket under the 'Account & Server' category in # 🎟️・create-ticket.",
      ],
      severity: "Escalated Moderation Action",
    },
    {
      id: "rule-8",
      number: "Rule 8",
      title: "Enforcement Policy & Escalation Ladder",
      badge: "Sanctions Framework",
      badgeColor: "bg-rose-950/60 text-rose-400 border-rose-800/50",
      channel: "Automated & Staff Moderation",
      description:
        "To ensure fair and transparent administration, SyncInk operates an escalating sanction ladder for standard violations.",
      details: [
        "Tier 1: Official Warning (Logged persistently to PostgreSQL database mod_cases).",
        "Tier 2: Message Deletion & Temporary Timeout (Mute).",
        "Tier 3: Temporary or Permanent Kick from the server.",
        "Tier 4: Permanent Ban from the server and API blacklist.",
        "Critical Exception: Severe violations (including posting NSFW content, malicious attacks, hate speech, or raiding) bypass the ladder and result in an immediate permanent ban without warning!",
      ],
      severity: "Progressive Sanctions Ladder",
    },
    {
      id: "media-policy",
      number: "Media Policy",
      title: "Strict Zero-NSFW Policy in Media Showcase",
      badge: "Zero Tolerance",
      badgeColor: "bg-red-950/70 text-brand-red border-red-700/60",
      channel: "# 📸・media-showcase (ID: 1520461517093343232)",
      channelLink: "https://discord.com/channels/1520457643842342912/1520461517093343232",
      description:
        "SyncInk is a professional and public platform. Posting, streaming, or linking any NSFW, adult, sexually suggestive, gore, or graphic media is strictly forbidden.",
      details: [
        "Any NSFW content in # 📸・media-showcase or any other channel results in an IMMEDIATE PERMANENT BAN without prior warning.",
      ],
      severity: "Immediate Permanent Ban",
    },
  ];

  const aiRules = [
    {
      id: "ai-1",
      code: "AI-RULE 1",
      title: "Fair Usage & Member Rate Limits",
      description:
        "Each member is allocated a 1-minute cooldown per query across the SyncInk AI assistant to preserve shared computational resources.",
      rules: [
        "Do not use macro scripts, automated user-bots, or simultaneous sessions to bypass the cooldown.",
        "Spamming ?ask or /ask during the cooldown period will result in command throttling and temporary timeout.",
      ],
    },
    {
      id: "ai-2",
      code: "AI-RULE 2",
      title: "Prompt Integrity & Anti-Jailbreak Protection",
      description:
        "Our AI models are fortified with autonomous security filters. Tampering with model directives or attempting to hijack the AI persona is strictly prohibited.",
      rules: [
        "Strictly forbidden: Prompt injection, 'DAN' style jailbreak scripts, bypass exploits, instruction override attacks, and malicious roleplay.",
        "Attempting to extract confidential system prompts, internal instructions, or API secrets is tracked as an active cyber incident.",
      ],
    },
    {
      id: "ai-3",
      code: "AI-RULE 3",
      title: "Appropriate Content & PG-13 Safety Standard",
      description:
        "All generated outputs and user questions must remain strictly family-friendly, PG-13, and in alignment with community guidelines.",
      rules: [
        "Do not prompt the AI for NSFW, sexual, defamatory, hateful, abusive, or dangerous content.",
        "Truth or Dare game prompts generated by the AI are carefully curated to ensure they are safe, engaging, and compliant with server standards.",
      ],
    },
    {
      id: "ai-4",
      code: "AI-RULE 4",
      title: "Channel Etiquette & Designated Zones",
      description:
        "Keep AI interactions organized without cluttering public discussion spaces.",
      rules: [
        "General AI questions and interactive games should be executed in # 🤖・ask-ai (ID: 1544361954574073916) or using the slash command /ask.",
        "Do not flood general chat or support channels with long AI output dumps.",
      ],
    },
    {
      id: "ai-5",
      code: "AI-RULE 5",
      title: "Enforcement & AI Blacklisting",
      description:
        "Abusing the AI assistant has direct consequences on both the web platform and the Discord server.",
      rules: [
        "Violating AI rules will trigger automated revocation of AI permissions (?reset_ai/ask blacklisting).",
        "Severe or repeated attempts to compromise the AI assistant result in server-wide timeouts and permanent bans.",
      ],
    },
  ];

  const filteredRules = communityRules.filter(
    (r) =>
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.number.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#080a0f] text-slate-100 flex flex-col">
      <PublicNavbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-14 border-b border-white/[0.08] bg-gradient-to-b from-[#111624] via-[#0b0e15] to-[#080a0f]">
        <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-[600px] h-[350px] rounded-full bg-brand-red/10 blur-[120px]" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-red/15 border border-brand-red/30 text-brand-crimson text-xs font-bold uppercase tracking-wider mb-4">
            <BookOpen className="h-3.5 w-3.5" />
            Official Server Guidelines & Policies
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
            SyncInk Community Rules & AI Guidelines
          </h1>

          <p className="mt-4 text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Please read and adhere to all community standards and server guidelines listed below.
            Non-compliance will result in automated moderation sanctions and staff enforcement.
          </p>

          {/* Discord Channel Link Callout */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-xs">
            <a
              href="https://discord.com/channels/1520457643842342912/1520460587522330634/1539582756001161238"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#5865F2]/20 border border-[#5865F2]/40 text-white hover:bg-[#5865F2]/30 transition-colors"
            >
              <span>View Original Embed in # 📖・guides</span>
              <ExternalLink className="h-3 w-3" />
            </a>

            <a
              href="#ai-rules"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-950/50 border border-cyan-800/50 text-accent-cyan hover:bg-cyan-900/50 transition-colors"
            >
              <Bot className="h-3.5 w-3.5" />
              <span>Jump to Rules for Use of AI</span>
            </a>
          </div>

          {/* Search Bar */}
          <div className="mt-8 max-w-md mx-auto relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search server rules by keyword (e.g., spam, ticket, nsfw)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#121622] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-red/60 focus:ring-1 focus:ring-brand-red/60 transition-all"
            />
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-1 w-full space-y-16">
        {/* Section 1: Community Guidelines */}
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.08] pb-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5">
                <Shield className="h-6 w-6 text-brand-crimson" />
                Community Guidelines & Server Rules
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Official rules mirrored directly from the SyncInk Support Server guides channel.
              </p>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              Showing {filteredRules.length} of {communityRules.length} Rules
            </span>
          </div>

          <div className="grid grid-cols-1 gap-5">
            {filteredRules.map((rule) => (
              <div
                key={rule.id}
                id={rule.id}
                className="group relative rounded-2xl border border-white/[0.08] bg-[#0e121d] p-6 hover:border-brand-red/40 hover:shadow-[0_4px_24px_rgba(231,76,60,0.12)] transition-all duration-300"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-black text-white uppercase tracking-wider px-2.5 py-1 rounded-md bg-white/[0.06] border border-white/10 font-mono">
                      {rule.number}
                    </span>
                    <h3 className="text-lg font-bold text-white group-hover:text-brand-crimson transition-colors">
                      {rule.title}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${rule.badgeColor}`}
                    >
                      {rule.badge}
                    </span>
                    <button
                      onClick={() => handleCopyLink(rule.id)}
                      title="Copy link to this rule"
                      className="p-1 rounded-md text-slate-500 hover:text-white hover:bg-white/[0.06] transition-colors"
                    >
                      {copiedRuleId === rule.id ? (
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                      ) : (
                        <Share2 className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {rule.description}
                </p>

                {/* Sub details bullet points */}
                <div className="mt-4 pt-3 border-t border-white/[0.06] space-y-1.5">
                  {rule.details.map((detail, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2 text-xs text-slate-400"
                    >
                      <span className="text-brand-crimson font-bold mt-0.5">•</span>
                      <span>{detail}</span>
                    </div>
                  ))}
                </div>

                {/* Footer metadata */}
                <div className="mt-4 pt-3 border-t border-white/[0.04] flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-slate-400">Target Channel:</span>
                    {rule.channelLink ? (
                      <a
                        href={rule.channelLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-400 hover:underline flex items-center gap-1"
                      >
                        <span>{rule.channel}</span>
                        <ExternalLink className="h-2.5 w-2.5" />
                      </a>
                    ) : (
                      <span>{rule.channel}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-slate-400">Enforcement:</span>
                    <span className="text-rose-400 font-medium">{rule.severity}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Section 2: Rules for Use of AI (SyncInk AI Assistant) */}
        <section id="ai-rules" className="space-y-6 scroll-mt-20">
          <div className="border-b border-cyan-500/20 pb-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-800/50 text-accent-cyan text-xs font-bold uppercase tracking-wider mb-2">
              <Bot className="h-3.5 w-3.5" />
              SyncInk AI Assistant Policy
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5">
              Rules for Use of Artificial Intelligence (AI)
            </h2>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Standard usage policy governing all interactions with the SyncInk AI Assistant,
              chat commands (?ask, /ask), and interactive truth-or-dare game modes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {aiRules.map((rule) => (
              <div
                key={rule.id}
                className="relative rounded-2xl border border-white/[0.08] bg-[#0c101a] p-5 hover:border-cyan-500/40 hover:shadow-[0_4px_24px_rgba(0,210,211,0.1)] transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-cyan-950/80 text-accent-cyan border border-cyan-800/50">
                      {rule.code}
                    </span>
                    <Bot className="h-4 w-4 text-cyan-400" />
                  </div>

                  <h3 className="text-base font-bold text-white mb-2">
                    {rule.title}
                  </h3>

                  <p className="text-xs text-slate-300 leading-relaxed mb-3">
                    {rule.description}
                  </p>

                  <div className="space-y-1.5">
                    {rule.rules.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-2 text-xs text-slate-400"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5 text-accent-cyan mt-0.5 flex-shrink-0" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* AI Truth or Dare & PG-13 Notice Banner */}
          <div className="rounded-2xl border border-indigo-500/30 bg-gradient-to-r from-indigo-950/40 via-[#0e121d] to-[#0c101a] p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-2 text-indigo-400 font-bold text-sm">
                <Sparkles className="h-4 w-4" />
                <span>Truth or Dare & Interactive Entertainment Policy</span>
              </div>
              <p className="text-xs text-slate-300 max-w-xl">
                When participating in Truth or Dare sessions with SyncInk AI, all prompts generated
                are strictly calibrated for community enjoyment and PG-13 compliance. Bypassing safety
                checks to elicit vulgar or sexually explicit answers is prohibited.
              </p>
            </div>

            <Link
              href="/faq#ai-section"
              className="whitespace-nowrap px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 transition-colors shadow-lg"
            >
              Learn More in FAQ
            </Link>
          </div>
        </section>

        {/* Section 3: Summary & Public Appeal Process */}
        <section className="rounded-2xl border border-white/[0.08] bg-[#0c1019] p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-red/15 text-brand-crimson border border-brand-red/30">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                How Moderation Appeals & Inquiries Work
              </h3>
              <p className="text-xs text-slate-400">
                Staff decisions are permanently logged in our PostgreSQL security ledger.
              </p>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Every sanction issued by human staff or automated shield engines (warnings, timeouts,
            kicks, bans, automod strikes) is recorded in real time to the server database. If you
            believe an action was taken against you in error:
          </p>

          <ol className="list-decimal list-inside space-y-2 text-xs text-slate-300 pl-1">
            <li>
              Navigate to{" "}
              <a
                href="https://discord.com/channels/1520457643842342912/1520460764937322566"
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-400 hover:underline font-semibold"
              >
                # 🎟️・create-ticket
              </a>{" "}
              in the Discord server.
            </li>
            <li>
              Select the <span className="text-white font-semibold">Account & Server</span> category
              from the dropdown.
            </li>
            <li>
              State your case ID (if provided) and explain your situation politely. Do NOT argue with
              staff in general channels.
            </li>
            <li>
              A senior administrator will inspect the live audit log and respond inside your private ticket thread.
            </li>
          </ol>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
