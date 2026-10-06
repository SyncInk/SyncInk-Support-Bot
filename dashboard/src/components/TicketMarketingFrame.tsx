"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Shield,
  BookOpen,
  HelpCircle,
  Activity,
  FileText,
  Lock,
  ExternalLink,
  Menu,
  X,
  Sparkles,
  MessageSquare,
} from "lucide-react";
import { PublicFooter } from "@/components/PublicFooter";

const SUPPORT_URL = "https://discord.gg/rB6gNZaK9u";
const INVITE_URL =
  "https://discord.com/oauth2/authorize?client_id=1513075101992747158&permissions=361046068240&integration_type=0&scope=bot+applications.commands";

interface MarketingAction {
  label: string;
  href?: string;
  to?: string;
  tone?: "primary" | "secondary";
  external?: boolean;
}

interface TicketMarketingFrameProps {
  active?: "privacy" | "terms" | "faqs" | "guides" | "status" | "overview";
  eyebrow?: string;
  eyebrowIcon?: React.ReactNode;
  title: string;
  description: string;
  actions?: MarketingAction[];
  children: React.ReactNode;
}

export function TicketMarketingFrame({
  active,
  eyebrow,
  eyebrowIcon,
  title,
  description,
  actions = [],
  children,
}: TicketMarketingFrameProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: "/dashboard/tickets/guides", label: "Setup Guides", icon: BookOpen, id: "guides" },
    { href: "/dashboard/tickets/faq", label: "FAQ", icon: HelpCircle, id: "faqs" },
    { href: "/dashboard/tickets/status", label: "System Status", icon: Activity, id: "status" },
    { href: "/dashboard/tickets/privacy", label: "Privacy Policy", icon: Lock, id: "privacy" },
    { href: "/dashboard/tickets/terms", label: "Terms of Service", icon: FileText, id: "terms" },
  ];

  return (
    <div className="min-h-screen bg-[#080a0f] text-slate-100 flex flex-col font-sans selection:bg-[#8b4cff]/30 selection:text-white">
      {/* Sticky Full-Width Navbar Matching /rules */}
      <header className="sticky top-0 z-50 w-full border-b border-white/[0.08] bg-[#0a0c10]/85 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Brand Logo & Name */}
            <Link
              href="/dashboard/tickets"
              className="flex items-center gap-3 group focus:outline-none"
            >
              <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-[#161b26] border border-white/10 shadow-[0_0_15px_rgba(139,76,255,0.25)] group-hover:border-purple-500/50 transition-all duration-300">
                <img
                  src="https://files.catbox.moe/74l9su.png"
                  alt="SyncInk Logo"
                  className="h-7 w-7 object-contain drop-shadow"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = "none";
                  }}
                />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="text-base font-extrabold text-white tracking-tight group-hover:text-purple-400 transition-colors">
                    SyncInk Ticket
                  </span>
                  <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-purple-950/60 text-purple-400 border border-purple-800/50 rounded-md">
                    Tickets
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 font-medium">
                  Enterprise Discord Support
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-1">
              {navLinks.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || active === item.id;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                      isActive
                        ? "bg-purple-600/15 text-white border border-purple-500/30 shadow-[0_0_12px_rgba(139,76,255,0.15)]"
                        : "text-slate-300 hover:text-white hover:bg-white/[0.05]"
                    }`}
                  >
                    <Icon
                      className={`h-3.5 w-3.5 ${
                        isActive ? "text-purple-400" : "text-slate-400"
                      }`}
                    />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Right Action Buttons */}
            <div className="hidden sm:flex items-center gap-2.5">
              <Link
                href="/dashboard/tickets"
                className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold text-white bg-[#161b26] border border-white/10 hover:border-white/20 hover:bg-[#1c2331] transition-all duration-200 shadow-sm"
              >
                <Shield className="h-3.5 w-3.5 text-purple-400" />
                <span>Ticket Console</span>
              </Link>
              <a
                href={SUPPORT_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold text-white bg-[#5865F2] hover:bg-[#4752c4] shadow-[0_0_15px_rgba(88,101,242,0.35)] transition-all duration-200"
              >
                <MessageSquare className="h-3.5 w-3.5" />
                <span>Join Discord</span>
              </a>
            </div>

            {/* Mobile Menu Button */}
            <button
              type="button"
              className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-white/[0.08] bg-[#0c1018] px-4 pt-3 pb-5 space-y-1 animate-in fade-in slide-in-from-top-2 duration-200">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || active === item.id;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-colors ${
                    isActive
                      ? "bg-purple-600/15 text-white border border-purple-500/30"
                      : "text-slate-300 hover:text-white hover:bg-white/[0.04]"
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? "text-purple-400" : "text-slate-400"}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
            <div className="pt-3 border-t border-white/[0.08] flex flex-col gap-2">
              <Link
                href="/dashboard/tickets"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-lg text-xs font-semibold text-white bg-[#161b26] border border-white/10"
              >
                <Shield className="h-4 w-4 text-purple-400" />
                <span>Ticket Console</span>
              </Link>
              <a
                href={SUPPORT_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-lg text-xs font-bold text-white bg-[#5865F2]"
              >
                <MessageSquare className="h-4 w-4" />
                <span>Join Discord Support</span>
              </a>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section Matching /rules Header */}
      <section className="relative overflow-hidden pt-12 pb-14 border-b border-white/[0.08] bg-gradient-to-b from-[#111624] via-[#0b0e15] to-[#080a0f]">
        <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-[600px] h-[350px] rounded-full bg-purple-600/10 blur-[120px]" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          {eyebrow && (
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-950/60 border border-purple-800/50 text-purple-400 text-xs font-bold uppercase tracking-wider mb-4">
              {eyebrowIcon || <Sparkles className="h-3.5 w-3.5" />}
              <span>{eyebrow}</span>
            </div>
          )}

          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
            {title}
          </h1>

          <p className="mt-4 text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
            {description}
          </p>

          {actions && actions.length > 0 && (
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-xs">
              {actions.map((act, i) => {
                const isPrimary = act.tone !== "secondary";
                const btnClass = isPrimary
                  ? "inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold shadow-[0_0_20px_rgba(139,76,255,0.3)] transition-all"
                  : "inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#161b26] border border-white/10 hover:border-white/20 text-slate-200 hover:text-white transition-all font-semibold";

                if (act.to) {
                  return (
                    <Link key={i} href={act.to} className={btnClass}>
                      <span>{act.label}</span>
                    </Link>
                  );
                }
                return (
                  <a
                    key={i}
                    href={act.href}
                    target={act.external ? "_blank" : undefined}
                    rel={act.external ? "noopener noreferrer" : undefined}
                    className={btnClass}
                  >
                    <span>{act.label}</span>
                    {act.external && <ExternalLink className="h-3 w-3 opacity-70" />}
                  </a>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Main Content Area */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-1 w-full space-y-10">
        {children}
      </main>

      {/* Public Footer */}
      <PublicFooter />
    </div>
  );
}
