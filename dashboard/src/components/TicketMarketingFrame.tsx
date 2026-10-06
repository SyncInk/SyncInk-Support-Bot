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
  ArrowRight,
  MessageSquare
} from "lucide-react";
import "@/app/dashboard/tickets/tickets-marketing.css";

const SUPPORT_URL = "https://discord.gg/rB6gNZaK9u";
const INVITE_URL = "https://discord.com/oauth2/authorize?client_id=1513075101992747158&permissions=361046068240&integration_type=0&scope=bot+applications.commands";

interface MarketingAction {
  label: string;
  href?: string;
  to?: string;
  tone?: "primary" | "secondary";
  external?: boolean;
}

interface TicketMarketingFrameProps {
  active?: "privacy" | "terms" | "faqs" | "guides" | "status" | "overview" | "rules";
  eyebrow?: string;
  title: string;
  description: string;
  actions?: MarketingAction[];
  children: React.ReactNode;
}

export function TicketMarketingFrame({
  active,
  eyebrow,
  title,
  description,
  actions = [],
  children
}: TicketMarketingFrameProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: "/dashboard/tickets", label: "Ticket Console", id: "overview" },
    { href: "/dashboard/tickets/guides", label: "Setup Guides", id: "guides" },
    { href: "/dashboard/tickets/faq", label: "FAQ", id: "faqs" },
    { href: "/dashboard/tickets/status", label: "System Status", id: "status" },
    { href: "/rules", label: "Rules", id: "rules" },
    { href: "/dashboard/tickets/privacy", label: "Privacy Policy", id: "privacy" },
    { href: "/dashboard/tickets/terms", label: "Terms of Service", id: "terms" }
  ];

  return (
    <div className="mk-shell" style={{ minHeight: "100vh", position: "relative", overflowX: "hidden" }}>
      {/* Background Ambient Glowing Orbs */}
      <div className="mk-orbs" aria-hidden="true">
        <div className="mk-orb mk-orb-a" />
        <div className="mk-orb mk-orb-b" />
        <div className="mk-orb mk-orb-c" />
      </div>

      {/* Liquid Glassmorphic Topbar */}
      <header className="mk-topbar" style={{ marginTop: "16px" }}>
        <Link href="/dashboard/tickets" className="mk-brand">
          <img
            src="https://files.catbox.moe/74l9su.png"
            alt="SyncInk Logo"
            onError={(e) => {
              (e.target as HTMLElement).style.display = "none";
            }}
          />
          <div>
            <strong>SyncInk Ticket</strong>
            <span>Enterprise Discord Support</span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="mk-nav hidden lg:flex">
          {navLinks.map((link) => {
            const isLinkActive = active === link.id || pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`mk-nav-link ${isLinkActive ? "active" : ""}`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Topbar Actions */}
        <div className="mk-topbar-actions">
          <Link href="/dashboard/tickets" className="mk-dashboard-link hidden sm:inline-flex">
            Open Dashboard
          </Link>
          <a
            href={SUPPORT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mk-signout-link hidden sm:inline-flex"
            title="Official Support Server"
          >
            <MessageSquare size={18} />
          </a>

          {/* Mobile Menu Button */}
          <button
            type="button"
            className="mk-signout-link lg:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
            style={{ width: "46px", height: "46px" }}
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer Menu (60fps CSS transform) */}
      {mobileMenuOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 49,
            background: "rgba(0, 0, 0, 0.8)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            padding: "80px 20px 20px"
          }}
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            style={{
              background: "#0d0e17",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              borderRadius: "20px",
              padding: "20px",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              maxWidth: "400px",
              margin: "0 auto",
              boxShadow: "0 24px 60px rgba(0,0,0,0.8)"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ paddingBottom: "12px", borderBottom: "1px solid rgba(255, 255, 255, 0.08)", marginBottom: "4px" }}>
              <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Navigation
              </span>
            </div>
            {navLinks.map((link) => {
              const isLinkActive = active === link.id || pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  style={{
                    padding: "12px 16px",
                    borderRadius: "12px",
                    fontSize: "14px",
                    fontWeight: 600,
                    color: isLinkActive ? "white" : "rgba(255, 255, 255, 0.7)",
                    background: isLinkActive ? "rgba(157, 124, 255, 0.15)" : "transparent",
                    textDecoration: "none",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between"
                  }}
                >
                  <span>{link.label}</span>
                  {isLinkActive && <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#a78bfa" }} />}
                </Link>
              );
            })}

            <div style={{ marginTop: "12px", paddingTop: "14px", borderTop: "1px solid rgba(255, 255, 255, 0.08)", display: "flex", flexDirection: "column", gap: "10px" }}>
              <Link
                href="/dashboard/tickets"
                onClick={() => setMobileMenuOpen(false)}
                className="action-button tone-primary"
                style={{ textAlign: "center", justifyContent: "center", padding: "12px" }}
              >
                Open Ticket Dashboard
              </Link>
              <a
                href={SUPPORT_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="action-button tone-secondary"
                style={{ textAlign: "center", justifyContent: "center", padding: "12px", textDecoration: "none" }}
              >
                Support Server
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Main Page Content */}
      <main className="mk-content">
        {/* Hero Header Area */}
        <section className="mk-hero">
          {eyebrow && <div className="mk-eyebrow">{eyebrow}</div>}
          <h1 className="mk-title">{title}</h1>
          <p className="mk-desc">{description}</p>

          {actions.length > 0 && (
            <div className="mk-actions-row">
              {actions.map((act, i) => {
                if (act.to) {
                  return (
                    <Link
                      key={i}
                      href={act.to}
                      className={act.tone === "secondary" ? "mk-action-secondary" : "mk-action-primary"}
                    >
                      {act.label}
                    </Link>
                  );
                }
                return (
                  <a
                    key={i}
                    href={act.href}
                    target={act.external ? "_blank" : undefined}
                    rel={act.external ? "noopener noreferrer" : undefined}
                    className={act.tone === "secondary" ? "mk-action-secondary" : "mk-action-primary"}
                  >
                    {act.label}
                  </a>
                );
              })}
            </div>
          )}
        </section>

        {/* Child Page Specific Elements */}
        {children}
      </main>

      {/* Marketing Footer */}
      <footer style={{ borderTop: "1px solid rgba(255, 255, 255, 0.08)", padding: "40px 20px", background: "rgba(0, 0, 0, 0.6)", marginTop: "60px" }}>
        <div style={{ maxWidth: "1180px", margin: "0 auto", display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <img src="https://files.catbox.moe/74l9su.png" alt="SyncInk Logo" style={{ width: "28px", height: "28px", borderRadius: "8px" }} />
            <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>
              &copy; {new Date().getFullYear()} SyncInk Network. High-performance Discord management systems.
            </span>
          </div>

          <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", fontSize: "12px" }}>
            <Link href="/dashboard/tickets" style={{ color: "rgba(255,255,255,0.6)", textDecoration: "none" }}>Console</Link>
            <Link href="/dashboard/tickets/guides" style={{ color: "rgba(255,255,255,0.6)", textDecoration: "none" }}>Guides</Link>
            <Link href="/dashboard/tickets/faqs" style={{ color: "rgba(255,255,255,0.6)", textDecoration: "none" }}>FAQ</Link>
            <Link href="/dashboard/tickets/status" style={{ color: "rgba(255,255,255,0.6)", textDecoration: "none" }}>System Status</Link>
            <Link href="/rules" style={{ color: "rgba(255,255,255,0.6)", textDecoration: "none" }}>Rules</Link>
            <Link href="/privacy" style={{ color: "rgba(255,255,255,0.6)", textDecoration: "none" }}>Privacy</Link>
            <Link href="/terms" style={{ color: "rgba(255,255,255,0.6)", textDecoration: "none" }}>Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
