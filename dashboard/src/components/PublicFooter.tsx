import React from "react";
import Link from "next/link";
import {
  Shield,
  Heart,
  ExternalLink,
  BookOpen,
  HelpCircle,
  FileCheck,
  Lock,
  MessageSquare,
  Bot,
  Radio,
} from "lucide-react";

export function PublicFooter() {
  return (
    <footer className="w-full border-t border-white/[0.08] bg-[#07090d] text-slate-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Brand Info */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#161b26] border border-white/10">
                <img
                  src="https://files.catbox.moe/74l9su.png"
                  alt="SyncInk"
                  className="h-5 w-5 object-contain"
                />
              </div>
              <span className="text-sm font-bold text-white tracking-tight">
                SyncInk Platform
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Official community platform, documentation hub, and automated
              security infrastructure for SyncInk Discord bots and services.
            </p>
            <div className="flex items-center gap-2 text-[11px] text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2.5 py-1 rounded-full w-fit">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>All Systems Operational</span>
            </div>
          </div>

          {/* Quick Navigation */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Documentation & Guides
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link
                  href="/rules"
                  className="hover:text-white transition-colors flex items-center gap-1.5"
                >
                  <BookOpen className="h-3 w-3 text-brand-crimson" />
                  <span>Server Guidelines & Rules</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/rules#ai-rules"
                  className="hover:text-white transition-colors flex items-center gap-1.5"
                >
                  <Bot className="h-3 w-3 text-accent-cyan" />
                  <span>AI Assistant Usage Policy</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/faq"
                  className="hover:text-white transition-colors flex items-center gap-1.5"
                >
                  <HelpCircle className="h-3 w-3 text-amber-400" />
                  <span>Frequently Asked Questions</span>
                </Link>
              </li>
              <li>
                <a
                  href="https://syncink.github.io/syncink-portfolio/apply-developer"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors flex items-center gap-1.5"
                >
                  <ExternalLink className="h-3 w-3 text-indigo-400" />
                  <span>Developer Application</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Legal & Policies */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Legal & Trust
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link
                  href="/terms"
                  className="hover:text-white transition-colors flex items-center gap-1.5"
                >
                  <FileCheck className="h-3 w-3 text-blue-400" />
                  <span>Terms of Use & Service</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="hover:text-white transition-colors flex items-center gap-1.5"
                >
                  <Lock className="h-3 w-3 text-emerald-400" />
                  <span>Privacy Policy & Data Security</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/"
                  className="hover:text-white transition-colors flex items-center gap-1.5"
                >
                  <Shield className="h-3 w-3 text-accent-cyan" />
                  <span>Security & Audit Dashboard</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* SyncInk Ecosystem */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Product Suite
            </h4>
            <ul className="space-y-2 text-xs">
              <li className="flex items-center gap-1.5 text-slate-300">
                <span className="font-semibold text-white">SyncInk Ticket Bot:</span>
                <span>Private threads & transcript logging</span>
              </li>
              <li className="flex items-center gap-1.5 text-slate-300">
                <span className="font-semibold text-white">SyncInk Voice Bot:</span>
                <span>Dynamic join-to-create voice channels</span>
              </li>
              <li className="flex items-center gap-1.5 text-slate-300">
                <span className="font-semibold text-white">SyncInk Security Bot:</span>
                <span>Real-time anti-spam & telemetry shield</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom divider & copyright */}
        <div className="pt-6 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-400">
          <div>
            © {new Date().getFullYear()} SyncInk. All rights reserved.
          </div>
          <div className="flex items-center gap-4">
            <Link href="/rules" className="hover:text-slate-300 transition-colors">
              Rules
            </Link>
            <span className="text-slate-600">•</span>
            <Link href="/faq" className="hover:text-slate-300 transition-colors">
              FAQ
            </Link>
            <span className="text-slate-600">•</span>
            <Link href="/terms" className="hover:text-slate-300 transition-colors">
              Terms
            </Link>
            <span className="text-slate-600">•</span>
            <Link href="/privacy" className="hover:text-slate-300 transition-colors">
              Privacy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
