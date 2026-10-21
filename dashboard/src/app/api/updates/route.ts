import { NextResponse } from "next/server";
import { rateLimiter, getClientIp } from "@/lib/rate-limit";
import { query } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { validateCsrfOrigin, sanitizeInputText } from "@/lib/security";

export const dynamic = "force-dynamic";

export interface CuratedRelease {
  id: number | string;
  version: string;
  title: string;
  release_date: string;
  badge: string;
  summary: string;
  products: string[];
  features: string[];
  improvements: string[];
  fixes: string[];
  status: string;
}

interface GitHubCommit {
  sha: string;
  commit: {
    message: string;
    author: {
      name: string;
      date: string;
    };
  };
  html_url: string;
}

export interface ChangelogCommit {
  id: string;
  repo: string;
  botName: string;
  accent: string;
  message: string;
  description: string;
  author: string;
  date: string;
  sha: string;
  url: string;
  tags: string[];
}

const STATIC_CURATED_RELEASES: CuratedRelease[] = [
  {
    id: 1,
    version: "v2.4.0",
    title: "Platform Security Hardening & Durable Bot Dispatch Engine",
    release_date: "2026-10-22",
    badge: "LATEST",
    summary:
      "Comprehensive ecosystem upgrade introducing server-side authorization, edge security middleware, live Discord Bot queue delivery replacing legacy webhooks, and the new Applications Review Console.",
    products: ["Support Bot", "Platform", "Dashboard"],
    features: [
      "Direct Discord Gateway bot delivery for staff and developer applications replacing webhook dependencies",
      "Interactive Admin Applications Management Console (/dashboard/applications) with review notes and status workflows",
      "Edge security middleware with dynamic origin validation, CSRF verification, and security headers",
      "Curated release-notes system with product filtering, category tags, and live commit feed telemetry",
    ],
    improvements: [
      "Optimized Next.js 14 App Router rendering with client-side caching and resilient fallbacks",
      "Strict token-bucket rate limiting across public and sensitive administrative endpoints",
      "Replaced dramatic 404 void screen with refined brand-consistent error state and working navigation",
    ],
    fixes: [
      "Resolved AutoMod bypass where rapid unauthorized administrator commands evaded strike limits",
      "Eliminated dead navigation links and normalized responsive layouts across mobile viewports",
    ],
    status: "PUBLISHED",
  },
  {
    id: 2,
    version: "v2.3.2",
    title: "Advanced AutoMod Engine & Strike Thresholds",
    release_date: "2026-10-15",
    badge: "SECURITY",
    summary:
      "Production security engine overhaul with 24-hour strike rolling windows, ghost-ping telemetry, and automated anti-evasion quarantine.",
    products: ["Support Bot"],
    features: [
      "24-hour decay window for automated moderation strikes to prevent permanent penalty accumulation",
      "Heuristic spam and mass-mention detection with automated progressive timeouts",
      "Ghost-ping interception cache logging deleted and edited pings in real-time",
    ],
    improvements: [
      "Reduced database query latency on high-frequency message listener events via in-memory caching",
      "Improved quarantine isolation role enforcement with evasion detection on guild join",
    ],
    fixes: [
      "Corrected role hierarchy check when executing disciplinary timeouts from the web dashboard",
    ],
    status: "PUBLISHED",
  },
  {
    id: 3,
    version: "v2.3.0",
    title: "Interactive Ticket Transcripts & Secure Storage",
    release_date: "2026-10-01",
    badge: "FEATURE",
    summary:
      "Private-thread ticket handling system with real-time transcript archival and dashboard viewer integration.",
    products: ["Ticket Bot"],
    features: [
      "One-click Discord private thread generation for confidential support queries",
      "Automatic HTML transcript generation and persistent cloud archival upon ticket closure",
      "End-to-end encrypted transcript viewer accessible through the Web Dashboard",
    ],
    improvements: [
      "Streamlined ticket claim workflows with role-based claim restrictions for server staff",
      "Enhanced ticket category routing based on user-selected inquiry type",
    ],
    fixes: [
      "Fixed transcript rendering for animated custom emojis and Discord code blocks",
    ],
    status: "PUBLISHED",
  },
  {
    id: 4,
    version: "v2.2.0",
    title: "Dynamic Voice Rooms & Auto-Clean Generator",
    release_date: "2026-09-18",
    badge: "STABLE",
    summary:
      "Join-to-create temporary voice channels with zero-latency channel provisioning and automated cleanup on exit.",
    products: ["Voice Bot"],
    features: [
      "Instant temporary voice channel creation upon connecting to the primary ecosystem lobby",
      "Interactive member channel management menu for custom room names, user limits, and locking",
      "Automated empty channel garbage collection keeping server channel lists tidy",
    ],
    improvements: [
      "High-bitrate voice channel allocation with region-optimal voice server selection",
    ],
    fixes: [
      "Resolved rare race condition during rapid consecutive channel join/disconnect events",
    ],
    status: "PUBLISHED",
  },
  {
    id: 5,
    version: "v2.0.0",
    title: "SyncInk Multi-Bot Ecosystem Launch",
    release_date: "2026-08-15",
    badge: "MAJOR",
    summary:
      "Official launch of the unified SyncInk bot platform, connecting community management, ticket operations, and voice utilities under a shared design system.",
    products: ["Platform", "Ticket Bot", "Voice Bot", "Support Bot"],
    features: [
      "Unified Multi-Bot Console for configuring Ticket, Voice, and Security bots from a single hub",
      "Custom branded dark-theme design system with accessible interactive controls",
      "Discord OAuth2 authentication with server permission checks",
    ],
    improvements: [
      "Comprehensive REST API architecture with unified database pooling",
    ],
    fixes: [],
    status: "PUBLISHED",
  },
];

const REPOS = [
  {
    owner: "SyncInk",
    repo: "SyncInk-Support-Bot",
    botName: "SyncInk Support & Security Bot",
    accent: "violet",
  },
  {
    owner: "SyncInk",
    repo: "SyncInk-Ticket",
    botName: "SyncInk Ticket Bot",
    accent: "blue",
  },
  {
    owner: "SyncInk",
    repo: "SyncInk-Voice",
    botName: "SyncInk Voice Bot",
    accent: "cyan",
  },
];

function parseConventionalCommit(message: string): {
  title: string;
  description: string;
  tags: string[];
} {
  const lines = message.split("\n");
  const firstLine = lines[0].trim();
  const description = lines
    .slice(1)
    .map((l) => l.trim())
    .filter(Boolean)
    .join(" ");

  const tags: string[] = [];
  const conventionalMatch = firstLine.match(
    /^(feat|fix|chore|refactor|perf|docs|style|test|ci|build|revert)(\(.+?\))?(!)?:\s*(.+)/i
  );

  if (conventionalMatch) {
    const type = conventionalMatch[1].toLowerCase();
    const scope = conventionalMatch[2] ? conventionalMatch[2].replace(/[()]/g, "") : null;
    const breaking = conventionalMatch[3] === "!";
    const title = conventionalMatch[4];

    const typeLabels: Record<string, string> = {
      feat: "Feature",
      fix: "Bug Fix",
      chore: "Maintenance",
      refactor: "Refactor",
      perf: "Performance",
      docs: "Documentation",
      style: "Style",
      test: "Testing",
      ci: "CI/CD",
      build: "Build",
      revert: "Revert",
    };

    tags.push(typeLabels[type] || type);
    if (scope) tags.push(scope);
    if (breaking) tags.push("Breaking Change");

    return { title, description, tags };
  }

  return { title: firstLine, description, tags };
}

let cachedCommits: { entries: ChangelogCommit[]; fetchedAt: number } | null = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function fetchAllCommits(): Promise<ChangelogCommit[]> {
  const now = Date.now();
  if (cachedCommits && now - cachedCommits.fetchedAt < CACHE_TTL) {
    return cachedCommits.entries;
  }

  const allEntries: ChangelogCommit[] = [];
  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "SyncInk-Updates-Page",
  };

  const token = process.env.GITHUB_TOKEN;
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const fetches = REPOS.map(async (repoConfig) => {
    try {
      const res = await fetch(
        `https://api.github.com/repos/${repoConfig.owner}/${repoConfig.repo}/commits?per_page=20`,
        { headers, next: { revalidate: 300 } }
      );

      if (!res.ok) return [];
      const commits: GitHubCommit[] = await res.json();

      return commits.map((commit) => {
        const parsed = parseConventionalCommit(commit.commit.message);
        return {
          id: `${repoConfig.repo}-${commit.sha}`,
          repo: repoConfig.repo,
          botName: repoConfig.botName,
          accent: repoConfig.accent,
          message: parsed.title,
          description: parsed.description,
          author: commit.commit.author.name,
          date: commit.commit.author.date,
          sha: commit.sha,
          url: commit.html_url,
          tags: parsed.tags,
        };
      });
    } catch {
      return [];
    }
  });

  const results = await Promise.all(fetches);
  results.forEach((entries) => allEntries.push(...entries));

  allEntries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  cachedCommits = { entries: allEntries, fetchedAt: now };
  return allEntries;
}

export async function GET(request: Request) {
  // Rate Limiting: 60 requests per minute per IP
  const clientIp = getClientIp(request);
  const rateLimit = rateLimiter.check(`updates_get_${clientIp}`, 60, 60 * 1000);
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: "Too many requests. Please slow down." }, { status: 429 });
  }

  try {
    // 1. Fetch Curated Releases from Database
    let releases: CuratedRelease[] = [];
    try {
      const dbRows = await query<any>(
        `SELECT id, version, title, TO_CHAR(release_date, 'YYYY-MM-DD') as release_date,
                badge, summary, products, features, improvements, fixes, status
         FROM curated_releases
         WHERE status = 'PUBLISHED'
         ORDER BY release_date DESC`
      );

      if (dbRows && dbRows.length > 0) {
        releases = dbRows.map((r) => ({
          ...r,
          products: Array.isArray(r.products) ? r.products : JSON.parse(r.products || "[]"),
          features: Array.isArray(r.features) ? r.features : JSON.parse(r.features || "[]"),
          improvements: Array.isArray(r.improvements) ? r.improvements : JSON.parse(r.improvements || "[]"),
          fixes: Array.isArray(r.fixes) ? r.fixes : JSON.parse(r.fixes || "[]"),
        }));
      }
    } catch (dbErr) {
      // Table will be created/populated via migration; fall back to static data cleanly
    }

    if (releases.length === 0) {
      releases = STATIC_CURATED_RELEASES;
    }

    // 2. Fetch Live GitHub Commits
    const commits = await fetchAllCommits();

    return NextResponse.json(
      {
        releases,
        commits,
        totalReleases: releases.length,
        totalCommits: commits.length,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        },
      }
    );
  } catch (error) {
    return NextResponse.json(
      {
        releases: STATIC_CURATED_RELEASES,
        commits: [],
        error: "Failed to load dynamic updates",
      },
      { status: 200 }
    );
  }
}

export async function POST(request: Request) {
  if (!validateCsrfOrigin(request)) {
    return NextResponse.json({ error: "CSRF validation failed" }, { status: 403 });
  }

  const user = await getCurrentUser();
  const isManagerOrAdmin =
    user?.isOwner ||
    user?.isAdmin ||
    user?.isStaff ||
    user?.roles?.includes("1520854378192572546");

  if (!user || !isManagerOrAdmin) {
    return NextResponse.json({ error: "Unauthorized. Staff or Manager privileges required." }, { status: 403 });
  }

  try {
    const body = await request.json();
    const version = sanitizeInputText(body.version || "", 50);
    const title = sanitizeInputText(body.title || "", 255);
    const summary = sanitizeInputText(body.summary || "", 1500);
    const badge = sanitizeInputText(body.badge || "STABLE", 50);
    const releaseDate = body.release_date || new Date().toISOString().split("T")[0];
    const products = Array.isArray(body.products) ? body.products : [];
    const features = Array.isArray(body.features) ? body.features : [];
    const improvements = Array.isArray(body.improvements) ? body.improvements : [];
    const fixes = Array.isArray(body.fixes) ? body.fixes : [];
    const status = body.status === "DRAFT" ? "DRAFT" : "PUBLISHED";

    if (!version || !title || !summary) {
      return NextResponse.json({ error: "Version, title, and summary are required." }, { status: 400 });
    }

    await query(
      `INSERT INTO curated_releases (version, title, release_date, badge, summary, products, features, improvements, fixes, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (version) DO UPDATE SET
         title = EXCLUDED.title,
         release_date = EXCLUDED.release_date,
         badge = EXCLUDED.badge,
         summary = EXCLUDED.summary,
         products = EXCLUDED.products,
         features = EXCLUDED.features,
         improvements = EXCLUDED.improvements,
         fixes = EXCLUDED.fixes,
         status = EXCLUDED.status,
         updated_at = CURRENT_TIMESTAMP`,
      [
        version,
        title,
        releaseDate,
        badge,
        summary,
        JSON.stringify(products),
        JSON.stringify(features),
        JSON.stringify(improvements),
        JSON.stringify(fixes),
        status,
      ]
    );

    return NextResponse.json({ success: true, message: `Release ${version} saved successfully.` });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to create curated release" }, { status: 500 });
  }
}
