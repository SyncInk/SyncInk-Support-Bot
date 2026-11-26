import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";

const PLATFORM_LINKS = [
  { label: "About", href: "/about" },
  { label: "Updates", href: "/updates" },
  { label: "Incident Desk", href: "/report" },
  { label: "FAQ", href: "/faq" },
  { label: "Server Rules", href: "/rules" },
  { label: "Join Team", href: "/apply" },
];

const LEGAL_LINKS = [
  { label: "Multi-Bot Console", href: "/dashboard" },
  { label: "AI Usage Policy", href: "/rules#ai-rules" },
  { label: "Server Terms", href: "/terms" },
  { label: "Server Privacy", href: "/privacy" },
  { label: "Ticket Terms", href: "/dashboard/tickets/terms" },
  { label: "Ticket Privacy", href: "/dashboard/tickets/privacy" },
];

const ECOSYSTEM_ITEMS = [
  {
    name: "SyncInk Ticket Bot",
    desc: "Private-thread ticketing and encrypted HTML transcripts",
    href: "/dashboard/tickets",
    meta: "Public",
  },
  {
    name: "SyncInk Voice Bot",
    desc: "Join-to-create temporary voice hubs with auto-purge",
    href: "/dashboard/voice",
    meta: "Public",
  },
  {
    name: "SyncInk Radio · Audia AI",
    desc: "Lossless 48kHz streaming and taste-vector AutoPlay",
    href: "/dashboard/radio",
    meta: "Live",
  },
  {
    name: "Support & Security Bot",
    desc: "Automated raid dampening, quarantine, and telemetry",
    href: "/dashboard/security",
    meta: "Shield",
  },
];

export function PublicFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-white/[0.08] bg-[#060812] text-slate-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-14">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8">
          {/* Brand Column */}
          <div className="lg:col-span-4 space-y-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2.5 group focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-lg"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0c0f18] border border-white/[0.08]">
                <Image
                  src="/syncink-main-logo.png"
                  alt="SyncInk"
                  width={18}
                  height={18}
                  className="object-contain"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-white tracking-tight">
                  SyncInk
                </span>
                <span className="font-mono text-[11px] text-slate-500">.site</span>
              </div>
            </Link>

            <p className="text-xs sm:text-[13px] text-slate-400 leading-relaxed max-w-sm">
              Dedicated Discord bots, web consoles, and automated server defense engineered for reliable community operations.
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <Link
                href="/updates"
                className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-[#0c0f18] border border-white/[0.08] hover:border-white/[0.16] text-[11px] font-mono text-slate-300 transition-colors touch-manipulation"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0" />
                <span>All systems operational</span>
              </Link>

              <a
                href="https://discord.gg/PmxfJwmQuB"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.08] text-[11px] text-slate-300 hover:text-white transition-colors touch-manipulation"
              >
                <span>Discord</span>
                <ArrowUpRight className="w-3 h-3 text-slate-500" />
              </a>

              <a
                href="https://github.com/SyncInk"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.08] text-[11px] text-slate-300 hover:text-white transition-colors touch-manipulation"
              >
                <span>GitHub</span>
                <ArrowUpRight className="w-3 h-3 text-slate-500" />
              </a>
            </div>
          </div>

          {/* Mobile 2-Column Wrapper for Platform + Legal Links */}
          <div className="grid grid-cols-2 gap-8 lg:col-span-4">
            <div className="space-y-3">
              <h4 className="text-xs font-medium text-slate-200">Platform</h4>
              <ul className="space-y-2 text-[13px]">
                {PLATFORM_LINKS.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="text-slate-400 hover:text-white transition-colors inline-block py-0.5 touch-manipulation"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-medium text-slate-200">Legal & Access</h4>
              <ul className="space-y-2 text-[13px]">
                {LEGAL_LINKS.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="text-slate-400 hover:text-white transition-colors inline-block py-0.5 touch-manipulation"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Clean Stacked Product Suite */}
          <div className="lg:col-span-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-medium text-slate-200">Product suite</h4>
              <Link
                href="/audia"
                className="text-[11px] font-mono text-slate-400 hover:text-white transition-colors"
              >
                Audia Spec
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2">
              {ECOSYSTEM_ITEMS.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="group flex items-start justify-between gap-3 px-3 py-2.5 rounded-lg bg-[#0c0f18] border border-white/[0.06] hover:border-white/[0.14] transition-colors touch-manipulation"
                >
                  <div className="min-w-0">
                    <div className="text-xs font-medium text-slate-100 group-hover:text-white truncate">
                      {item.name}
                    </div>
                    <div className="text-[11px] text-slate-400 leading-snug mt-0.5">
                      {item.desc}
                    </div>
                  </div>
                  <span className="font-mono text-[10px] text-slate-400 px-1.5 py-0.5 rounded bg-white/[0.03] border border-white/[0.06] shrink-0">
                    {item.meta}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Copyright & Compact Links */}
        <div className="mt-10 pt-6 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="tabular-nums">
            © {year} SyncInk. All rights reserved.
          </div>
          <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
            <Link href="/about" className="hover:text-slate-300 transition-colors">
              About
            </Link>
            <Link href="/updates" className="hover:text-slate-300 transition-colors">
              Updates
            </Link>
            <Link href="/rules" className="hover:text-slate-300 transition-colors">
              Rules
            </Link>
            <Link href="/faq" className="hover:text-slate-300 transition-colors">
              FAQ
            </Link>
            <Link href="/terms" className="hover:text-slate-300 transition-colors">
              Terms
            </Link>
            <Link href="/privacy" className="hover:text-slate-300 transition-colors">
              Privacy
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
