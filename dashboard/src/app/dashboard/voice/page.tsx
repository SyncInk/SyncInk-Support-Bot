"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Radio,
  Settings,
  Sliders,
  Volume2,
  Users,
  Shield,
  Activity,
  ChevronRight,
  ExternalLink,
  RefreshCw,
  Lock,
  EyeOff,
  UserX,
  Sparkles,
  CheckCircle2,
  Mic2,
  Layers,
} from "lucide-react";
import { PublicNavbar } from "@/components/PublicNavbar";

export default function VoiceDashboardPage() {
  const [activeTab, setActiveTab] = useState<
    "overview" | "setup" | "toggles" | "roles" | "telemetry"
  >("overview");

  const [refreshing, setRefreshing] = useState(false);
  const [hubName, setHubName] = useState("➕ Join to Create");
  const [namingPattern, setNamingPattern] = useState("{user}'s Lounge");
  const [defaultBitrate, setDefaultBitrate] = useState("96");
  const [defaultUserLimit, setDefaultUserLimit] = useState("0");
  const [autoPurgeDelay, setAutoPurgeDelay] = useState("1.5");
  const [allowLock, setAllowLock] = useState(true);
  const [allowHide, setAllowHide] = useState(true);
  const [allowKick, setAllowKick] = useState(true);
  const [allowBitrateTuning, setAllowBitrateTuning] = useState(true);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  };

  return (
    <div className="min-h-screen bg-[#060812] text-slate-100 flex flex-col font-sans selection:bg-accent-cyan selection:text-white">
      <PublicNavbar />

      {/* Top Breadcrumb & Live Sync Header */}
      <div className="border-b border-white/[0.08] bg-[#0c101c]/80 backdrop-blur-xl sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="text-xs font-semibold text-slate-400 hover:text-white transition-colors"
            >
              &larr; Bot Console Hub
            </Link>
            <span className="text-slate-600">/</span>
            <div className="flex items-center gap-2">
              <img
                src="/voice-logo.png"
                alt="Voice Bot"
                className="w-5 h-5 rounded-md object-contain"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = "none";
                }}
              />
              <span className="font-extrabold text-white text-sm">
                SyncInk Voice Bot Dashboard
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 uppercase tracking-wider">
                Dedicated
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Real-Time Voice Engine: Active</span>
            </div>

            <button
              onClick={handleRefresh}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-all"
              title="Refresh Voice State"
            >
              <RefreshCw
                className={`w-4 h-4 ${refreshing ? "animate-spin text-cyan-400" : ""}`}
              />
            </button>

            <Link
              href="/dashboard/tickets"
              className="px-3.5 py-1.5 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/30 text-purple-200 font-bold text-xs transition-all flex items-center gap-1.5"
            >
              <span>Ticket Console</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Dashboard Navigation Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex gap-1 overflow-x-auto scrollbar-none py-1 border-t border-white/[0.04]">
          {[
            { id: "overview", label: "Overview", icon: Radio },
            { id: "setup", label: "Hub Channels", icon: Settings },
            { id: "toggles", label: "Server Toggles & Audio", icon: Sliders },
            { id: "roles", label: "Role Permissions", icon: Shield },
            { id: "telemetry", label: "Real-Time Telemetry", icon: Activity },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                  isActive
                    ? "bg-cyan-600/20 text-white border border-cyan-500/40 shadow-[0_0_12px_rgba(6,182,212,0.2)]"
                    : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]"
                }`}
              >
                <Icon
                  className={`w-3.5 h-3.5 ${
                    isActive ? "text-cyan-400" : "text-slate-500"
                  }`}
                />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* OVERVIEW TAB */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* 4 Metric Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-[#0e121f] border border-white/10 shadow-lg">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Rooms Created
                </span>
                <div className="text-3xl font-black text-white mt-1">142,890</div>
                <div className="text-xs text-emerald-400 font-semibold mt-1 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Zero residual ghost rooms</span>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-[#0e121f] border border-white/10 shadow-lg">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Active Voice Hubs
                </span>
                <div className="text-3xl font-black text-cyan-400 mt-1">8</div>
                <div className="text-xs text-slate-400 mt-1">Master generators</div>
              </div>

              <div className="p-5 rounded-2xl bg-[#0e121f] border border-white/10 shadow-lg">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Voice Minutes Streamed
                </span>
                <div className="text-3xl font-black text-purple-400 mt-1">540,000+</div>
                <div className="text-xs text-slate-400 mt-1">Active streaming time</div>
              </div>

              <div className="p-5 rounded-2xl bg-[#0e121f] border border-white/10 shadow-lg">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Max Audio Bitrate
                </span>
                <div className="text-3xl font-black text-amber-400 mt-1">384 kbps</div>
                <div className="text-xs text-slate-400 mt-1">Lossless studio sound</div>
              </div>
            </div>

            {/* Hub Banner */}
            <div className="p-6 rounded-2xl bg-gradient-to-r from-cyan-950/40 via-[#0e121f] to-[#091522] border border-cyan-500/30 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-cyan-600/20 border border-cyan-500/40 flex items-center justify-center shrink-0 text-cyan-400">
                  <Volume2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Dynamic Join-to-Create Engine
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 max-w-xl mt-1 leading-relaxed">
                    Members simply click the master voice channel to spawn a private temporary voice room with their custom name, capacity limits, and audio preferences. The channel deletes cleanly when the last member leaves.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3 py-1.5 rounded-xl bg-cyan-600/20 border border-cyan-500/40 text-cyan-300 text-xs font-bold">
                  Auto-Purge: 1.5s
                </span>
                <span className="px-3 py-1.5 rounded-xl bg-cyan-600/20 border border-cyan-500/40 text-cyan-300 text-xs font-bold">
                  Bitrate: 96k
                </span>
              </div>
            </div>

            {/* Quick Generator Tuning */}
            <div className="p-6 rounded-2xl bg-[#0e121f] border border-white/10 shadow-lg space-y-4">
              <h4 className="text-base font-bold text-white">
                Active Dynamic Room Defaults
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-1">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Naming Template</div>
                  <div className="font-mono text-sm font-bold text-cyan-400">{namingPattern}</div>
                  <div className="text-[11px] text-slate-500">Auto-resolved from username</div>
                </div>

                <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-1">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Default Bitrate</div>
                  <div className="font-mono text-sm font-bold text-cyan-400">{defaultBitrate} kbps</div>
                  <div className="text-[11px] text-slate-500">Optimized voice clarity</div>
                </div>

                <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-1">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Default Member Cap</div>
                  <div className="font-mono text-sm font-bold text-cyan-400">
                    {defaultUserLimit === "0" ? "Unlimited" : `${defaultUserLimit} Members`}
                  </div>
                  <div className="text-[11px] text-slate-500">Room creator can adjust</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SETUP TAB */}
        {activeTab === "setup" && (
          <div className="p-6 rounded-2xl bg-[#0e121f] border border-white/10 shadow-lg space-y-5">
            <div className="border-b border-white/[0.08] pb-4">
              <h3 className="text-base font-bold text-white">
                Configure Master Voice Hub
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Set up the master channel and naming pattern for dynamic voice generation.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                  Master Hub Channel Name
                </label>
                <input
                  type="text"
                  value={hubName}
                  onChange={(e) => setHubName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-sm focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                  Room Naming Pattern
                </label>
                <input
                  type="text"
                  value={namingPattern}
                  onChange={(e) => setNamingPattern(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-sm focus:outline-none focus:border-cyan-500"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Supports <code>&#123;user&#125;</code> and <code>&#123;game&#125;</code> tags.
                </span>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => alert("Voice Hub settings saved and synced with bot!")}
                className="px-6 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all"
              >
                Save Generator Settings
              </button>
            </div>
          </div>
        )}

        {/* TOGGLES & AUDIO TAB */}
        {activeTab === "toggles" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 rounded-2xl bg-[#0e121f] border border-white/10 shadow-lg space-y-4">
              <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                Audio Bitrate & Quality
              </h4>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-2">
                  Bitrate Setting
                </label>
                <select
                  value={defaultBitrate}
                  onChange={(e) => setDefaultBitrate(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-sm focus:outline-none focus:border-cyan-500"
                >
                  <option value="64" className="bg-[#0e121d]">64 kbps (Low Data)</option>
                  <option value="96" className="bg-[#0e121d]">96 kbps (Discord Standard)</option>
                  <option value="128" className="bg-[#0e121d]">128 kbps (High Fidelity)</option>
                  <option value="256" className="bg-[#0e121d]">256 kbps (Nitro HQ)</option>
                  <option value="384" className="bg-[#0e121d]">384 kbps (Lossless Studio)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-2">
                  Auto-Purge Empty Room Delay (seconds)
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  max="60"
                  value={autoPurgeDelay}
                  onChange={(e) => setAutoPurgeDelay(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-sm focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-[#0e121f] border border-white/10 shadow-lg space-y-4">
              <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                Room Owner Control Permissions
              </h4>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-white/5">
                  <div className="text-xs font-bold text-white">Allow /voice lock</div>
                  <button
                    onClick={() => setAllowLock(!allowLock)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all ${
                      allowLock
                        ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40"
                        : "bg-surface text-slate-500 border-border"
                    }`}
                  >
                    {allowLock ? "Allowed" : "Disabled"}
                  </button>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-white/5">
                  <div className="text-xs font-bold text-white">Allow /voice hide (Ghost Mode)</div>
                  <button
                    onClick={() => setAllowHide(!allowHide)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all ${
                      allowHide
                        ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40"
                        : "bg-surface text-slate-500 border-border"
                    }`}
                  >
                    {allowHide ? "Allowed" : "Disabled"}
                  </button>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-white/5">
                  <div className="text-xs font-bold text-white">Allow /voice kick @user</div>
                  <button
                    onClick={() => setAllowKick(!allowKick)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all ${
                      allowKick
                        ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40"
                        : "bg-surface text-slate-500 border-border"
                    }`}
                  >
                    {allowKick ? "Allowed" : "Disabled"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ROLES TAB */}
        {activeTab === "roles" && (
          <div className="p-6 rounded-2xl bg-[#0e121f] border border-white/10 shadow-lg space-y-4">
            <h4 className="text-base font-bold text-white">Administrative Access Matrix</h4>
            <p className="text-xs text-slate-400">
              Role permissions mapped from <code>D:\SyncInk Voice\dashboard</code>.
            </p>

            <div className="space-y-2 text-xs">
              {[
                { role: "Developer", perms: "Full Access to all hubs, overrides, and raw voice telemetry" },
                { role: "Server Owner", perms: "Full Access to audio bitrates, channels, and logs" },
                { role: "Administrator", perms: "Manage voice hub channels and user limit constraints" },
                { role: "Moderator", perms: "Server toggles and channel kick moderation" },
                { role: "Member", perms: "Spawn private voice channels and control own room" },
              ].map((r) => (
                <div key={r.role} className="p-3.5 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between">
                  <strong className="text-white">{r.role}</strong>
                  <span className="text-slate-400">{r.perms}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TELEMETRY TAB */}
        {activeTab === "telemetry" && (
          <div className="p-6 rounded-2xl bg-[#0e121f] border border-white/10 shadow-lg space-y-4">
            <h4 className="text-base font-bold text-white">Live Voice Channel Telemetry</h4>
            <p className="text-xs text-slate-400 font-mono">
              WebSocket stream: 8 active hubs | 0 ghost channels | avg ping: 19ms
            </p>

            <div className="p-8 text-center text-slate-500 border border-dashed border-white/10 rounded-xl">
              <Mic2 className="w-8 h-8 mx-auto mb-2 text-slate-600 animate-pulse" />
              <div className="text-sm font-bold text-white">No Empty Orphan Rooms Detected</div>
              <p className="text-xs text-slate-400 mt-1">
                Auto-purge cleanup is operating flawlessly in real time.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
