"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence, MotionConfig } from "framer-motion";
import { transition } from "@/lib/motion-tokens";
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

const SUPPORT_URL = "https://discord.gg/PmxfJwmQuB";
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
    <MotionConfig reducedMotion="user">
    <div className="min-h-screen bg-[#060812] text-slate-100 flex flex-col font-sans overflow-x-hidden selection:bg-[#8b4cff]/30 selection:text-white">
      {/* Sticky Full-Width Navbar */}
      <header className="sticky top-0 z-50 w-full border-b border-white/[0.08] bg-[#060812]/90 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Brand Logo & Name */}
            <Link
              href="/dashboard/tickets"
              className="flex items-center gap-3 group focus:outline-none"
            >
              <div className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-[#0c0f18] border border-white/[0.08] group-hover:border-white/[0.16] transition-colors">
                <Image
                  src="/syncink-main-logo.png"
                  alt="SyncInk"
                  width={20}
                  height={20}
                  className="object-contain"
                />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm sm:text-base font-semibold text-white tracking-tight group-hover:text-blue-400 transition-colors">
                    SyncInk Ticket
                  </span>
                  <span className="px-1.5 py-0.5 text-[10px] font-mono bg-white/[0.04] text-slate-300 border border-white/[0.08] rounded">
                    Tickets
                  </span>
                </div>
                <span className="text-[11px] text-slate-400">
                  Enterprise Discord support
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
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      isActive
                        ? "bg-white/[0.08] text-white border border-white/[0.12]"
                        : "text-slate-300 hover:text-white hover:bg-white/[0.04]"
                    }`}
                  >
                    <Icon
                      className={`h-3.5 w-3.5 ${
                        isActive ? "text-blue-400" : "text-slate-400"
                      }`}
                    />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Right Action Buttons */}
            <div className="hidden sm:flex items-center gap-2">
              <Link
                href="/dashboard/tickets"
                className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium text-white bg-[#0c0f18] border border-white/[0.08] hover:border-white/[0.16] hover:bg-white/[0.04] transition-colors touch-manipulation"
              >
                <Shield className="h-3.5 w-3.5 text-slate-400" />
                <span>Ticket Console</span>
              </Link>
              <a
                href={SUPPORT_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium text-white bg-[#5865F2] hover:bg-[#4752c4] transition-colors touch-manipulation"
              >
                <MessageSquare className="h-3.5 w-3.5" />
                <span>Join Discord</span>
              </a>
            </div>

            {/* Mobile Menu Button */}
            <button
              type="button"
              className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors touch-manipulation"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={transition.expand}
            className="lg:hidden overflow-hidden border-t border-white/[0.08] bg-[#0c0f18]"
          >
          <div className="px-4 pt-3 pb-5 space-y-1">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || active === item.id;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors touch-manipulation ${
                    isActive
                      ? "bg-white/[0.08] text-white border border-white/[0.12]"
                      : "text-slate-300 hover:text-white hover:bg-white/[0.04]"
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? "text-blue-400" : "text-slate-400"}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
            <div className="pt-3 border-t border-white/[0.08] flex flex-col gap-2">
              <Link
                href="/dashboard/tickets"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-lg text-xs font-medium text-white bg-white/[0.04] border border-white/[0.08]"
              >
                <Shield className="h-4 w-4 text-slate-300" />
                <span>Ticket Console</span>
              </Link>
              <a
                href={SUPPORT_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-lg text-xs font-medium text-white bg-[#5865F2]"
              >
                <MessageSquare className="h-4 w-4" />
                <span>Join Discord Support</span>
              </a>
            </div>
          </div>
          </motion.div>
        )}
        </AnimatePresence>
      </header>

      {/* Hero Section */}
      <section className="pt-12 pb-12 border-b border-white/[0.08]">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={transition.enter}
          className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center"
        >
          {eyebrow && (
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-[#0c0f18] border border-white/[0.08] text-slate-300 font-mono text-[11px] mb-4">
              {eyebrowIcon || <Sparkles className="h-3.5 w-3.5 text-blue-400" />}
              <span>{eyebrow}</span>
            </div>
          )}

          <h1 className="text-3xl sm:text-5xl font-semibold text-white tracking-tight leading-tight">
            {title}
          </h1>

          <p className="mt-3 text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
            {description}
          </p>

          {actions && actions.length > 0 && (
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5 text-xs">
              {actions.map((act, i) => {
                const isPrimary = act.tone !== "secondary";
                const btnClass = isPrimary
                  ? "inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors touch-manipulation"
                  : "inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg bg-white/[0.04] border border-white/[0.08] hover:border-white/[0.16] text-slate-200 hover:text-white transition-colors font-medium touch-manipulation";

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
        </motion.div>
      </section>

      {/* Main Content Area */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12 flex-1 w-full space-y-10">
        {children}
      </main>

      {/* Public Footer */}
      <PublicFooter />
    </div>
    </MotionConfig>
  );
}
