"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence, MotionConfig } from "framer-motion";
import {
  HelpCircle,
  ChevronDown,
  Search,
  ExternalLink,
  Sparkles,
  Ticket,
  Mic,
  Shield,
  Bot,
  MessageSquare,
  Users,
  Code,
  ArrowRight,
  BookOpen,
} from "lucide-react";
import { PublicNavbar } from "@/components/PublicNavbar";
import { PublicFooter } from "@/components/PublicFooter";
import { transition } from "@/lib/motion-tokens";

interface FAQItem {
  question: string;
  answer: string | React.ReactNode;
  tags?: string[];
}

interface FAQSection {
  category: string;
  icon: any;
  color: string;
  items: FAQItem[];
}

export default function FAQPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({
    "0-0": true, // open first item by default
  });

  const toggleItem = (key: string) => {
    setOpenItems((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const faqSections: FAQSection[] = [
    {
      category: "1. Getting Started & Server Access",
      icon: Users,
      color: "text-blue-400 bg-blue-950/60 border-blue-800/50",
      items: [
        {
          question: "How do I verify my account to access the server?",
          answer: (
            <div className="space-y-2 text-xs sm:text-sm text-slate-300">
              <p>
                Head to the{" "}
                <a
                  href="https://discord.com/channels/1520457643842342912/1520748219100041348"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-400 font-semibold hover:underline"
                >
                  # ✅・verification
                </a>{" "}
                channel. Click the verification button to verify your Discord account.
                Once confirmed, the gatekeeper role will be removed and you will receive full
                server permissions.
              </p>
            </div>
          ),
          tags: ["verify", "verification", "access", "channels", "locked"],
        },
        {
          question: "Why are all channels locked or hidden for me?",
          answer: (
            <p className="text-xs sm:text-sm text-slate-300">
              All new members are held in the verification checkpoint to shield the SyncInk community
              from automated spam bots, webhooks, and raiding attempts. As soon as you complete the
              verification step, all general, support, product, and media showcase channels will unlock.
            </p>
          ),
          tags: ["locked", "hidden", "gatekeeper", "permission"],
        },
      ],
    },
    {
      category: "2. Official Support System & Tickets",
      icon: Ticket,
      color: "text-brand-crimson bg-red-950/60 border-red-800/50",
      items: [
        {
          question: "How do I create a support ticket?",
          answer: (
            <div className="space-y-2 text-xs sm:text-sm text-slate-300">
              <p>
                Navigate to{" "}
                <a
                  href="https://discord.com/channels/1520457643842342912/1520460764937322566"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-400 font-semibold hover:underline"
                >
                  # 🎟️・create-ticket
                </a>{" "}
                (Support Requests). Select the category that matches your inquiry from the dropdown
                menu:
              </p>
              <ul className="list-disc list-inside space-y-1 pl-1 text-slate-300">
                <li>
                  <strong>Product Support:</strong> For bot setup, commands, bugs, or troubleshooting.
                </li>
                <li>
                  <strong>Account & Server:</strong> Appeals, verification assistance, or member reports.
                </li>
                <li>
                  <strong>Bug Report:</strong> Report glitches directly to bot developers.
                </li>
                <li>
                  <strong>Staff Abuse:</strong> Report misbehaving staff members privately to admins.
                </li>
                <li>
                  <strong>Partnership / Business:</strong> Collaboration & business inquiries.
                </li>
                <li>
                  <strong>Other:</strong> Miscellaneous matters not listed above.
                </li>
              </ul>
              <p>
                A private thread will be automatically created between you and the staff. Please explain
                your inquiry thoroughly and wait patiently for a staff member to claim it.
              </p>
            </div>
          ),
          tags: ["ticket", "support", "help", "claim", "staff", "categories"],
        },
        {
          question: "Can I ask quick support questions in public chat?",
          answer: (
            <p className="text-xs sm:text-sm text-slate-300">
              Yes! For general troubleshooting, questions, or quick bot guidance, use{" "}
              <a
                href="https://discord.com/channels/1520457643842342912/1520460808499363840"
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-400 font-semibold hover:underline"
              >
                # 💬・support-chat
              </a>
              . Please note that casual talk and socializing are strictly forbidden in support chat;
              all casual socializing belongs in # 💬・general.
            </p>
          ),
          tags: ["support-chat", "questions", "general"],
        },
      ],
    },
    {
      category: "3. SyncInk Product Suite",
      icon: Shield,
      color: "text-accent-cyan bg-cyan-950/60 border-cyan-800/50",
      items: [
        {
          question: "What is SyncInk Ticket Bot?",
          answer: (
            <div className="space-y-2 text-xs sm:text-sm text-slate-300">
              <p>
                <strong>SyncInk Ticket Bot</strong> is a modular, high-capacity Discord ticketing bot
                engineered for seamless community management.
              </p>
              <ul className="list-disc list-inside space-y-1 text-slate-300 pl-1">
                <li>
                  <strong>Thread Architecture:</strong> Private in-channel threads reduce server
                  channel clutter.
                </li>
                <li>
                  <strong>Staff Claim Engine:</strong> Interactive claim buttons ensure clear accountability.
                </li>
                <li>
                  <strong>Automatic Transcripts:</strong> Rich HTML transcript archives generated upon
                  ticket closure.
                </li>
                <li>
                  <strong>Slash Commands:</strong> /ticket-panel, /ticket-add, /ticket-remove, /ticket-rename.
                </li>
              </ul>
            </div>
          ),
          tags: ["ticket bot", "features", "transcripts", "commands"],
        },
        {
          question: "What is SyncInk Voice Bot?",
          answer: (
            <div className="space-y-2 text-xs sm:text-sm text-slate-300">
              <p>
                <strong>SyncInk Voice Bot</strong> enables automated, temporary voice room creation.
              </p>
              <ul className="list-disc list-inside space-y-1 text-slate-300 pl-1">
                <li>
                  <strong>Join-to-Create:</strong> Joining the hub channel (
                  <span className="font-mono text-white"># 🔊・Join to Create VC</span>) instantly generates
                  your own customizable private voice room.
                </li>
                <li>
                  <strong>Interactive Control Panel:</strong> Manage room names, member capacity (0–99),
                  bitrate, privacy locks, and user permissions directly via Discord buttons.
                </li>
                <li>
                  <strong>Self-Cleaning:</strong> Voice rooms automatically clean up when all members leave.
                </li>
              </ul>
            </div>
          ),
          tags: ["voice bot", "join to create", "voice rooms", "vc"],
        },
        {
          question: "What is SyncInk Security Bot & Web Shield?",
          answer: (
            <p className="text-xs sm:text-sm text-slate-300">
              SyncInk Security Bot protects Discord servers with autonomous defense algorithms,
              including anti-spam heuristics, anti-raid burst interception, anti-nuke safeguards, and
              instant message deletion filters. All actions sync in real time to the live web security dashboard.
            </p>
          ),
          tags: ["security bot", "shield", "anti-raid", "anti-nuke", "dashboard"],
        },
      ],
    },
    {
      category: "4. SyncInk AI Assistant & Interactive Games",
      icon: Bot,
      color: "text-purple-400 bg-purple-950/60 border-purple-800/50",
      items: [
        {
          question: "How do I use the SyncInk AI Assistant?",
          answer: (
            <div className="space-y-2 text-xs sm:text-sm text-slate-300">
              <p>
                You can ask questions to the AI assistant using either prefix commands or slash commands:
              </p>
              <ul className="list-disc list-inside space-y-1 text-slate-300 pl-1">
                <li>
                  <span className="font-mono text-white">?ask &lt;question&gt;</span> — Prefix command in any
                  authorized channel.
                </li>
                <li>
                  <span className="font-mono text-white">/ask question:&lt;text&gt;</span> — Discord slash
                  command.
                </li>
                <li>
                  Dedicated Channel:{" "}
                  <a
                    href="https://discord.com/channels/1520457643842342912/1544361954574073916"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-400 font-semibold hover:underline"
                  >
                    # 🤖・ask-ai
                  </a>
                  .
                </li>
              </ul>
              <p>
                Members are subject to a 1-minute cooldown per query. Please adhere to the{" "}
                <Link href="/rules#ai-rules" className="text-brand-crimson font-semibold hover:underline">
                  Rules for Use of AI
                </Link>
                .
              </p>
            </div>
          ),
          tags: ["ai", "chatgpt", "ask", "assistant", "cooldown"],
        },
        {
          question: "How does Truth or Dare work with the AI?",
          answer: (
            <p className="text-xs sm:text-sm text-slate-300">
              SyncInk AI includes an interactive Truth or Dare engine! When asked, it generates
              creative, unpredictable, and exciting challenges tailored to your server environment.
              All generated dares and questions are strictly filtered for PG-13 safety, friendliness,
              and community respect.
            </p>
          ),
          tags: ["truth or dare", "games", "fun", "interactive", "pg-13"],
        },
      ],
    },
    {
      category: "5. Updates, Suggestions & Applications",
      icon: Code,
      color: "text-emerald-400 bg-emerald-950/60 border-emerald-800/50",
      items: [
        {
          question: "Where can I follow bot updates and changelogs?",
          answer: (
            <p className="text-xs sm:text-sm text-slate-300">
              Official patches, releases, and service statuses are posted in{" "}
              <a
                href="https://discord.com/channels/1520457643842342912/1520460505196662836"
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-400 font-semibold hover:underline"
              >
                # 📢・updates
              </a>{" "}
              and{" "}
              <a
                href="https://discord.com/channels/1520457643842342912/1520460544811859968"
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-400 font-semibold hover:underline"
              >
                # 📢・announcements
              </a>
              .
            </p>
          ),
          tags: ["updates", "changelog", "announcements"],
        },
        {
          question: "How do I propose a new feature for SyncInk bots?",
          answer: (
            <p className="text-xs sm:text-sm text-slate-300">
              Submit your idea using the{" "}
              <span className="font-mono text-white">/feature request</span>,{" "}
              <span className="font-mono text-white">/feature_request</span>,{" "}
              <span className="font-mono text-white">?feature request</span>, or{" "}
              <span className="font-mono text-white">?feature_request</span> command exclusively in{" "}
              <a
                href="https://discord.com/channels/1520457643842342912/1546548728721178724"
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-400 font-semibold hover:underline"
              >
                # 💡・feature-request
              </a>
              . The community and team will vote on and review submissions.
            </p>
          ),
          tags: ["feature", "suggestion", "request", "ideas"],
        },
        {
          question: "How do I apply for Developer or Staff roles?",
          answer: (
            <div className="space-y-2 text-xs sm:text-sm text-slate-300">
              <p>Use <span className="font-mono text-white">?apply</span> (or <span className="font-mono text-white">/apply</span>) in Discord, or apply directly through our authenticated portal:</p>
              <ul className="list-disc list-inside space-y-1 text-slate-300 pl-1">
                <li>
                  <strong>Developer Application:</strong>{" "}
                  <a
                    href="https://syncink.site/apply?tab=developer"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-400 font-semibold hover:underline"
                  >
                    syncink.site/apply?tab=developer
                  </a>{" "}
                  (Requirements in # 💻・developer-apply).
                </li>
                <li>
                  <strong>Staff Application:</strong>{" "}
                  <a
                    href="https://syncink.site/apply?tab=staff"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-400 font-semibold hover:underline"
                  >
                    syncink.site/apply?tab=staff
                  </a>{" "}
                  (Requirements in # 🛡️・staff-apply).
                </li>
              </ul>
            </div>
          ),
          tags: ["developer", "staff", "apply", "join team", "contribute"],
        },
      ],
    },
  ];

  const filteredSections = faqSections
    .map((section) => {
      const matchingItems = section.items.filter((item) => {
        const query = searchQuery.toLowerCase();
        return (
          item.question.toLowerCase().includes(query) ||
          item.tags?.some((t) => t.toLowerCase().includes(query))
        );
      });
      return { ...section, items: matchingItems };
    })
    .filter((section) => section.items.length > 0);

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen bg-[#060812] text-slate-100 flex flex-col overflow-x-hidden font-sans">
        <PublicNavbar />

        {/* Hero Section */}
        <section className="pt-12 pb-12 border-b border-white/[0.08]">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={transition.enter}
            className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#0c0f18] border border-white/[0.08] text-slate-300 font-mono text-[11px] mb-4">
              <HelpCircle className="h-3.5 w-3.5 text-amber-400" />
              <span>Knowledge base</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-semibold text-white tracking-tight leading-tight">
              Frequently asked questions
            </h1>

            <p className="mt-3 text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
              Everything you need to know about the SyncInk Support Server, Ticket Bot, Voice Bot, SyncInk Radio, Security Shield, and AI Assistant.
            </p>

            {/* Quick Jump Buttons */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5 text-xs">
              <Link
                href="/rules"
                className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-slate-200 hover:bg-white/[0.08] hover:text-white transition-colors touch-manipulation"
              >
                <BookOpen className="h-3.5 w-3.5 text-slate-400" />
                <span>Read Server Rules</span>
              </Link>

              <a
                href="https://discord.com/channels/1520457643842342912/1520460624864350218"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg bg-[#5865F2] hover:bg-[#4752c4] text-white font-medium transition-colors touch-manipulation"
              >
                <span>Discord #faq channel</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>

            {/* Search Bar */}
            <div className="mt-7 max-w-md mx-auto relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search FAQ (e.g. ticket, voice, radio, ai, apply)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 bg-[#0c0f18] border border-white/[0.1] rounded-lg pl-10 pr-4 text-base sm:text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </motion.div>
        </section>

        {/* Main FAQ Accordion */}
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12 flex-1 w-full space-y-10">
          {filteredSections.map((section, sIdx) => {
            const Icon = section.icon;
            return (
              <div key={sIdx} className="space-y-3.5">
                <div className="flex items-center gap-2.5 border-b border-white/[0.08] pb-3">
                  <span className={`p-1.5 rounded-lg border ${section.color}`}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <h2 className="text-base sm:text-lg font-semibold text-white tracking-tight">
                    {section.category}
                  </h2>
                </div>

                <div className="space-y-2.5">
                  {section.items.map((item, iIdx) => {
                    const itemKey = `${sIdx}-${iIdx}`;
                    const isOpen = Boolean(openItems[itemKey]);

                    return (
                      <div
                        key={iIdx}
                        className={`rounded-xl border overflow-hidden transition-colors ${
                          isOpen
                            ? "border-white/[0.14] bg-[#0c0f18]"
                            : "border-white/[0.08] bg-[#0c0f18]/70 hover:border-white/[0.12]"
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => toggleItem(itemKey)}
                          aria-expanded={isOpen}
                          className="w-full px-4 sm:px-5 py-3.5 sm:py-4 flex items-center justify-between text-left hover:bg-white/[0.02] transition-colors focus:outline-none touch-manipulation"
                        >
                          <span className="text-sm font-medium text-white pr-4">
                            {item.question}
                          </span>
                          <ChevronDown
                            className={`h-4 w-4 text-slate-400 flex-shrink-0 transition-transform duration-200 ${
                              isOpen ? "rotate-180 text-white" : ""
                            }`}
                          />
                        </button>

                        <AnimatePresence initial={false}>
                          {isOpen && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={transition.expand}
                              className="overflow-hidden"
                            >
                              <div className="px-4 sm:px-5 pb-4 pt-3 border-t border-white/[0.06] text-slate-300">
                                {item.answer}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Still have questions banner */}
          <section className="rounded-xl border border-white/[0.08] bg-[#0c0f18] p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-5 text-center sm:text-left">
            <div className="space-y-1.5">
              <h3 className="text-base font-semibold text-white">
                Still have a question not covered here?
              </h3>
              <p className="text-xs text-slate-400 max-w-lg leading-relaxed">
                Our support team and AI assistant are available on Discord to help with bot setup, permissions, or recovery requests.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2.5 shrink-0">
              <a
                href="https://discord.com/channels/1520457643842342912/1520460764937322566"
                target="_blank"
                rel="noopener noreferrer"
                className="h-9 px-4 rounded-lg text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 transition-colors inline-flex items-center touch-manipulation"
              >
                Open Support Ticket
              </a>
              <Link
                href="/rules"
                className="h-9 px-4 rounded-lg text-xs font-medium text-slate-200 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] transition-colors inline-flex items-center touch-manipulation"
              >
                Read Rules
              </Link>
            </div>
          </section>
        </main>

        <PublicFooter />
      </div>
    </MotionConfig>
  );
}
