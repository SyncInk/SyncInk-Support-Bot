"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  Shield,
  BookOpen,
  HelpCircle,
  FileCheck,
  Lock,
  Menu,
  X,
  Sparkles,
  ChevronDown,
  Layers,
  Info,
  GitCommit,
  LogOut,
  Crown,
  User,
  ExternalLink,
  ChevronRight,
  ClipboardList,
} from "lucide-react";

interface AuthenticatedUser {
  id: string;
  username: string;
  global_name?: string | null;
  avatar?: string | null;
  isOwner?: boolean;
  isAdmin?: boolean;
  isStaff?: boolean;
  roleType?: string;
  roleIcon?: string;
  role?: string;
}

export function PublicNavbar() {
  const pathname = usePathname();
  const router = useRouter();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [resourcesOpen, setResourcesOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const [currentUser, setCurrentUser] = useState<AuthenticatedUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [greeting, setGreeting] = useState("");

  const resourcesRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // 1. Fetch current authentication state
  useEffect(() => {
    let isMounted = true;

    async function checkAuth() {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setCurrentUser(data.authenticated ? data.user : null);
          }
        }
      } catch {
        if (isMounted) setCurrentUser(null);
      } finally {
        if (isMounted) setAuthLoading(false);
      }
    }

    checkAuth();
    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Compute dynamic personalized greeting based on client browser local time
  useEffect(() => {
    function updateGreeting() {
      if (!currentUser) return;
      const hour = new Date().getHours();
      let timeGreeting = "Hello";
      if (hour >= 5 && hour < 12) {
        timeGreeting = "Good morning";
      } else if (hour >= 12 && hour < 17) {
        timeGreeting = "Good afternoon";
      } else if (hour >= 17 && hour < 21) {
        timeGreeting = "Good evening";
      } else {
        timeGreeting = "Good night";
      }

      // Truncate display name safely to prevent layout overflow
      const rawName = currentUser.global_name || currentUser.username || "Member";
      const cleanName = rawName.length > 14 ? rawName.slice(0, 14) + "…" : rawName;
      setGreeting(`${timeGreeting}, ${cleanName}`);
    }

    updateGreeting();
    // Re-check every 60 seconds so transitions between periods happen live
    const interval = setInterval(updateGreeting, 60000);
    return () => clearInterval(interval);
  }, [currentUser]);

  // 3. Handle click outside & keyboard escape for accessible dropdowns
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (resourcesRef.current && !resourcesRef.current.contains(event.target as Node)) {
        setResourcesOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setResourcesOpen(false);
        setUserDropdownOpen(false);
        setMobileMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Close menus on path change
  useEffect(() => {
    setMobileMenuOpen(false);
    setResourcesOpen(false);
    setUserDropdownOpen(false);
  }, [pathname]);

  // Handle logout
  async function handleLogout() {
    try {
      await fetch("/api/auth/me", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "logout" }),
      });
      setCurrentUser(null);
      setUserDropdownOpen(false);
      router.refresh();
    } catch (err) {
      console.error("Logout failed:", err);
    }
  }

  const isOwnerUser =
    currentUser?.id === "930306512864280607" ||
    currentUser?.isOwner === true ||
    currentUser?.id === "admin";

  const isStaffUser = Boolean(currentUser?.isStaff || currentUser?.isAdmin || isOwnerUser);

  const avatarUrl = currentUser?.avatar
    ? `https://cdn.discordapp.com/avatars/${currentUser.id}/${currentUser.avatar}.png`
    : currentUser
    ? `https://cdn.discordapp.com/embed/avatars/${parseInt(currentUser.id || "0", 10) % 5}.png`
    : null;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/[0.08] bg-[#070913]/90 backdrop-blur-xl transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* ========================================================= */}
          {/* LEFT AREA — BRAND */}
          {/* ========================================================= */}
          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/"
              className="flex items-center gap-2.5 group focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-lg p-0.5"
            >
              <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.04] border border-white/10 group-hover:border-blue-500/40 transition-colors shadow-sm">
                <Image
                  src="/syncink-main-logo.png"
                  alt="SyncInk Logo"
                  width={24}
                  height={24}
                  className="object-contain drop-shadow"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-base font-black text-white tracking-tight group-hover:text-blue-400 transition-colors">
                  SyncInk
                </span>
                <span className="hidden sm:inline-flex px-1.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider bg-white/[0.04] text-slate-400 border border-white/10 rounded-md">
                  .site
                </span>
              </div>
            </Link>
          </div>

          {/* ========================================================= */}
          {/* CENTER AREA — PRIMARY NAVIGATION */}
          {/* ========================================================= */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-1.5">
            <Link
              href="/#bots"
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                pathname === "/"
                  ? "text-white bg-white/[0.06]"
                  : "text-slate-300 hover:text-white hover:bg-white/[0.04]"
              }`}
            >
              Bots
            </Link>

            <Link
              href="/about"
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                pathname === "/about"
                  ? "text-blue-300 bg-blue-500/15 border border-blue-500/25"
                  : "text-slate-300 hover:text-white hover:bg-white/[0.04]"
              }`}
            >
              About
            </Link>

            <Link
              href="/updates"
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                pathname === "/updates"
                  ? "text-blue-300 bg-blue-500/15 border border-blue-500/25"
                  : "text-slate-300 hover:text-white hover:bg-white/[0.04]"
              }`}
            >
              Updates
            </Link>

            <Link
              href="/apply"
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                pathname === "/apply"
                  ? "text-blue-300 bg-blue-500/15 border border-blue-500/25"
                  : "text-slate-300 hover:text-white hover:bg-white/[0.04]"
              }`}
            >
              Team
            </Link>

            {/* Resources Dropdown */}
            <div className="relative" ref={resourcesRef}>
              <button
                onClick={() => setResourcesOpen((prev) => !prev)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all focus:outline-none ${
                  resourcesOpen
                    ? "text-white bg-white/[0.08]"
                    : "text-slate-300 hover:text-white hover:bg-white/[0.04]"
                }`}
                aria-expanded={resourcesOpen}
                aria-haspopup="true"
              >
                <span>Resources</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    resourcesOpen ? "rotate-180 text-blue-400" : "text-slate-400"
                  }`}
                />
              </button>

              {resourcesOpen && (
                <div className="absolute left-0 mt-2 w-48 rounded-xl bg-[#0b0e1d] border border-white/10 shadow-2xl p-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <Link
                    href="/rules"
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-white/[0.06] transition-colors"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-blue-400" />
                    <span>Server Rules</span>
                  </Link>

                  <Link
                    href="/faq"
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-white/[0.06] transition-colors"
                  >
                    <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
                    <span>FAQ</span>
                  </Link>

                  <Link
                    href="/terms"
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-white/[0.06] transition-colors"
                  >
                    <FileCheck className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Terms of Service</span>
                  </Link>

                  <Link
                    href="/privacy"
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-white/[0.06] transition-colors"
                  >
                    <Lock className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Privacy Policy</span>
                  </Link>
                </div>
              )}
            </div>
          </nav>

          {/* ========================================================= */}
          {/* RIGHT AREA — ACCOUNT & PRIMARY ACTIONS */}
          {/* ========================================================= */}
          <div className="hidden sm:flex items-center gap-2.5">
            {/* Multi-Bot Console Link */}
            <Link
              href="/dashboard"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-200 bg-white/[0.04] border border-white/10 hover:bg-white/[0.08] hover:text-white transition-all shadow-sm"
            >
              <Layers className="w-3.5 h-3.5 text-sky-400" />
              <span>Multi-Bot Console</span>
            </Link>

            {/* Account Control */}
            {authLoading ? (
              <div className="h-8 w-24 rounded-lg bg-white/[0.04] animate-pulse" />
            ) : currentUser ? (
              /* Signed-in Profile Menu */
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserDropdownOpen((prev) => !prev)}
                  className={`flex items-center gap-2 px-2.5 py-1 rounded-xl transition-all border ${
                    userDropdownOpen
                      ? "bg-white/[0.08] border-white/20"
                      : "bg-white/[0.03] border-white/10 hover:border-white/20 hover:bg-white/[0.06]"
                  }`}
                  aria-expanded={userDropdownOpen}
                  aria-haspopup="true"
                >
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={currentUser.username}
                      className="w-6 h-6 rounded-full object-cover ring-1 ring-white/20"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-blue-600/30 text-blue-400 flex items-center justify-center text-xs font-bold">
                      {currentUser.username.charAt(0).toUpperCase()}
                    </div>
                  )}

                  <span className="text-xs font-semibold text-slate-200">
                    {greeting || currentUser.username}
                  </span>

                  {isOwnerUser && (
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      Owner
                    </span>
                  )}

                  <ChevronDown
                    className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                      userDropdownOpen ? "rotate-180 text-blue-400" : ""
                    }`}
                  />
                </button>

                {/* Dropdown Menu */}
                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-[#0b0e1d] border border-white/10 shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    {/* User Identity Banner */}
                    <div className="px-3 py-2.5 border-b border-white/[0.08] mb-1">
                      <div className="text-xs font-bold text-white truncate">
                        {currentUser.global_name || currentUser.username}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono truncate">
                        @{currentUser.username} • {currentUser.id}
                      </div>
                      <div className="mt-1 flex items-center gap-1.5">
                        <span className="text-[10px] font-semibold text-blue-300 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                          {currentUser.role || "Member"}
                        </span>
                      </div>
                    </div>

                    {/* OWNER-EXCLUSIVE CONTROL PANEL LINK */}
                    {isOwnerUser && (
                      <Link
                        href="/dashboard/admin"
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 transition-colors my-1"
                      >
                        <Crown className="w-3.5 h-3.5 text-amber-400" />
                        <span>Admin Control Panel</span>
                      </Link>
                    )}

                    {/* STAFF & MANAGEMENT LINKS */}
                    {isStaffUser && (
                      <Link
                        href="/dashboard/applications"
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-white/[0.05] transition-colors"
                      >
                        <ClipboardList className="w-3.5 h-3.5 text-blue-400" />
                        <span>Manage Applications</span>
                      </Link>
                    )}

                    <Link
                      href="/dashboard"
                      className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-white/[0.05] transition-colors"
                    >
                      <Layers className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Bot Ecosystem Dashboard</span>
                    </Link>

                    <div className="my-1 border-t border-white/[0.08]" />

                    {/* Sign Out Button */}
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* Signed-out Discord Login Button */
              <a
                href="/api/auth/discord"
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold text-white bg-[#5865F2] hover:bg-[#4752c4] transition-all shadow-[0_0_15px_rgba(88,101,242,0.3)]"
              >
                <svg
                  className="w-3.5 h-3.5 fill-current"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                </svg>
                <span>Sign in with Discord</span>
              </a>
            )}
          </div>

          {/* ========================================================= */}
          {/* MOBILE MENU TOGGLE */}
          {/* ========================================================= */}
          <div className="flex md:hidden items-center gap-2">
            {!authLoading && !currentUser && (
              <a
                href="/api/auth/discord"
                className="px-2.5 py-1 text-[11px] font-bold text-white bg-[#5865F2] rounded-md"
              >
                Sign in
              </a>
            )}

            <button
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="p-2 rounded-lg bg-white/[0.04] text-slate-300 hover:text-white border border-white/10 focus:outline-none"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* ========================================================= */}
        {/* MOBILE NAVIGATION SHEET */}
        {/* ========================================================= */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-white/[0.08] space-y-3 animate-in fade-in slide-in-from-top-2">
            {currentUser && (
              <div className="px-3 py-2 bg-white/[0.02] border border-white/5 rounded-xl mb-2 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-white">
                    {greeting || currentUser.username}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {currentUser.role || "Member"}
                  </div>
                </div>

                {isOwnerUser && (
                  <Link
                    href="/dashboard/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1"
                  >
                    <Crown className="w-3 h-3" />
                    <span>Admin</span>
                  </Link>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-1.5">
              <Link
                href="/#bots"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg text-xs font-semibold text-slate-200 hover:bg-white/[0.05]"
              >
                Bots Showcase
              </Link>
              <Link
                href="/about"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg text-xs font-semibold text-slate-200 hover:bg-white/[0.05]"
              >
                About
              </Link>
              <Link
                href="/updates"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg text-xs font-semibold text-slate-200 hover:bg-white/[0.05]"
              >
                Updates
              </Link>
              <Link
                href="/apply"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg text-xs font-semibold text-slate-200 hover:bg-white/[0.05]"
              >
                Team Apply
              </Link>
              <Link
                href="/rules"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg text-xs font-semibold text-slate-200 hover:bg-white/[0.05]"
              >
                Rules
              </Link>
              <Link
                href="/faq"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg text-xs font-semibold text-slate-200 hover:bg-white/[0.05]"
              >
                FAQ
              </Link>
              <Link
                href="/terms"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg text-xs font-semibold text-slate-200 hover:bg-white/[0.05]"
              >
                Terms
              </Link>
              <Link
                href="/privacy"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg text-xs font-semibold text-slate-200 hover:bg-white/[0.05]"
              >
                Privacy
              </Link>
            </div>

            <div className="pt-2 border-t border-white/[0.08] space-y-2">
              <Link
                href="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-white/[0.05] border border-white/10"
              >
                <Layers className="w-4 h-4 text-sky-400" />
                <span>Multi-Bot Console</span>
              </Link>

              {currentUser ? (
                <button
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-red-400 bg-red-500/10"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              ) : (
                <a
                  href="/api/auth/discord"
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-[#5865F2]"
                >
                  <span>Sign in with Discord</span>
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
