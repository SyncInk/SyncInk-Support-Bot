"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Shield,
  BookOpen,
  HelpCircle,
  FileCheck,
  Lock,
  ExternalLink,
  Menu,
  X,
  Sparkles,
  ChevronRight,
  Layers,
} from "lucide-react";

export function PublicNavbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: "/#bots", label: "Bots Showcase", icon: Layers },
    { href: "/apply", label: "Apply (Staff & Dev)", icon: Sparkles },
    { href: "/rules", label: "Rules", icon: BookOpen },
    { href: "/faq", label: "FAQ", icon: HelpCircle },
    { href: "/terms", label: "Terms", icon: FileCheck },
    { href: "/privacy", label: "Privacy", icon: Lock },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/[0.08] bg-[#0a0c10]/85 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <Link
            href="/"
            className="flex items-center gap-3 group focus:outline-none"
          >
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-[#161b26] border border-white/10 shadow-[0_0_15px_rgba(231,76,60,0.25)] group-hover:border-brand-red/50 transition-all duration-300">
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
                <span className="text-base font-extrabold text-white tracking-tight group-hover:text-brand-crimson transition-colors">
                  SyncInk
                </span>
                <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-brand-red/15 text-brand-crimson border border-brand-red/30 rounded-md">
                  syncink.site
                </span>
              </div>
              <span className="text-[11px] text-slate-400 font-medium">
                Official Bot Ecosystem & Console
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                    isActive
                      ? "bg-brand-red/15 text-white border border-brand-red/30 shadow-[0_0_12px_rgba(231,76,60,0.15)]"
                      : "text-slate-300 hover:text-white hover:bg-white/[0.05]"
                  }`}
                >
                  <Icon
                    className={`h-3.5 w-3.5 ${
                      isActive ? "text-brand-crimson" : "text-slate-400"
                    }`}
                  />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Action Buttons */}
          <div className="hidden sm:flex items-center gap-3">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold text-white bg-[#161b26] border border-white/10 hover:border-white/20 hover:bg-[#1c2331] transition-all duration-200 shadow-sm"
            >
              <Shield className="h-3.5 w-3.5 text-accent-cyan" />
              <span>Multi-Bot Console</span>
            </Link>

            <a
              href="https://discord.gg/rB6gNZaK9u"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold text-white bg-[#5865F2] hover:bg-[#4752c4] border border-[#5865F2]/50 shadow-[0_0_15px_rgba(88,101,242,0.3)] transition-all duration-200"
            >
              <span>Join Discord</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex lg:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/[0.06] transition-colors focus:outline-none"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-b border-white/[0.08] bg-[#0c0f16]/98 backdrop-blur-2xl px-4 pt-3 pb-5 space-y-2">
          {navLinks.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? "bg-brand-red/15 text-white border border-brand-red/30"
                    : "text-slate-300 hover:text-white hover:bg-white/[0.05]"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    className={`h-4 w-4 ${
                      isActive ? "text-brand-crimson" : "text-slate-400"
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                <ChevronRight className="h-3.5 w-3.5 text-slate-500" />
              </Link>
            );
          })}

          <div className="pt-2 border-t border-white/[0.08] space-y-2">
            <Link
              href="/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold text-white bg-[#161b26] border border-white/10"
            >
              <Shield className="h-4 w-4 text-accent-cyan" />
              <span>Multi-Bot Console</span>
            </Link>
            <a
              href="https://discord.gg/rB6gNZaK9u"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold text-white bg-[#5865F2]"
            >
              <span>Join Discord Support</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
