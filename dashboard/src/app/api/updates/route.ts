import { NextResponse } from "next/server";

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

interface ChangelogEntry {
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

  // Parse conventional commit prefix
  const conventionalMatch = firstLine.match(
    /^(feat|fix|chore|refactor|perf|docs|style|test|ci|build|revert)(\(.+?\))?(!)?:\s*(.+)/i
  );

  if (conventionalMatch) {
    const type = conventionalMatch[1].toLowerCase();
    const scope = conventionalMatch[2]
      ? conventionalMatch[2].replace(/[()]/g, "")
      : null;
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

let cachedData: { entries: ChangelogEntry[]; fetchedAt: number } | null = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function fetchAllChangelogs(): Promise<ChangelogEntry[]> {
  const now = Date.now();
  if (cachedData && now - cachedData.fetchedAt < CACHE_TTL) {
    return cachedData.entries;
  }

  const allEntries: ChangelogEntry[] = [];

  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "SyncInk-Updates-Page",
  };

  // Use GitHub token if available for higher rate limits
  const token = process.env.GITHUB_TOKEN;
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const fetches = REPOS.map(async (repoConfig) => {
    try {
      const res = await fetch(
        `https://api.github.com/repos/${repoConfig.owner}/${repoConfig.repo}/commits?per_page=30`,
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

  // Sort by date descending
  allEntries.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  cachedData = { entries: allEntries, fetchedAt: now };
  return allEntries;
}

export async function GET() {
  try {
    const entries = await fetchAllChangelogs();
    return NextResponse.json(
      { entries, count: entries.length },
      {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        },
      }
    );
  } catch {
    return NextResponse.json(
      { entries: [], count: 0, error: "Failed to fetch changelogs" },
      { status: 500 }
    );
  }
}
