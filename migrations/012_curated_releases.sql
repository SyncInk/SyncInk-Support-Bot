-- 012_curated_releases.sql
-- Curated Release Notes & Product Changelog for SyncInk Ecosystem

CREATE TABLE IF NOT EXISTS curated_releases (
    id SERIAL PRIMARY KEY,
    version VARCHAR(50) NOT NULL UNIQUE,
    title VARCHAR(255) NOT NULL,
    release_date DATE NOT NULL,
    badge VARCHAR(50) DEFAULT 'STABLE', -- 'LATEST', 'MAJOR', 'SECURITY', 'FEATURE', 'PATCH'
    summary TEXT NOT NULL,
    products JSONB NOT NULL DEFAULT '[]', -- Array of string product tags
    features JSONB NOT NULL DEFAULT '[]', -- Array of string feature items
    improvements JSONB NOT NULL DEFAULT '[]', -- Array of string improvement items
    fixes JSONB NOT NULL DEFAULT '[]', -- Array of string bug fix items
    status VARCHAR(50) DEFAULT 'PUBLISHED', -- 'PUBLISHED', 'DRAFT'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_curated_releases_date
ON curated_releases (release_date DESC);

CREATE INDEX IF NOT EXISTS idx_curated_releases_status
ON curated_releases (status);

-- Seed Initial Curated Product Releases
INSERT INTO curated_releases (version, title, release_date, badge, summary, products, features, improvements, fixes, status)
VALUES
(
    'v2.4.0',
    'Platform Security Hardening & Durable Bot Dispatch Engine',
    '2026-10-22',
    'LATEST',
    'Comprehensive ecosystem upgrade introducing server-side authorization, edge security middleware, live Discord Bot queue delivery replacing legacy webhooks, and the new Applications Review Console.',
    '["Support Bot", "Platform", "Dashboard"]'::jsonb,
    '[
        "Direct Discord Gateway bot delivery for staff and developer applications replacing webhook dependencies",
        "Interactive Admin Applications Management Console (/dashboard/applications) with review notes and status workflows",
        "Edge security middleware with dynamic origin validation, CSRF verification, and security headers",
        "Curated release-notes system with product filtering, category tags, and live commit feed telemetry"
    ]'::jsonb,
    '[
        "Optimized Next.js 14 App Router rendering with client-side caching and resilient fallbacks",
        "Strict token-bucket rate limiting across public and sensitive administrative endpoints",
        "Replaced dramatic 404 void screen with refined brand-consistent error state and working navigation"
    ]'::jsonb,
    '[
        "Resolved AutoMod bypass where rapid unauthorized administrator commands evaded strike limits",
        "Eliminated dead navigation links and normalized responsive layouts across mobile viewports"
    ]'::jsonb,
    'PUBLISHED'
),
(
    'v2.3.2',
    'Advanced AutoMod Engine & Strike Thresholds',
    '2026-10-15',
    'SECURITY',
    'Production security engine overhaul with 24-hour strike rolling windows, ghost-ping telemetry, and automated anti-evasion quarantine.',
    '["Support Bot"]'::jsonb,
    '[
        "24-hour decay window for automated moderation strikes to prevent permanent penalty accumulation",
        "Heuristic spam and mass-mention detection with automated progressive timeouts",
        "Ghost-ping interception cache logging deleted and edited pings in real-time"
    ]'::jsonb,
    '[
        "Reduced database query latency on high-frequency message listener events via in-memory caching",
        "Improved quarantine isolation role enforcement with evasion detection on guild join"
    ]'::jsonb,
    '[
        "Corrected role hierarchy check when executing disciplinary timeouts from the web dashboard"
    ]'::jsonb,
    'PUBLISHED'
),
(
    'v2.3.0',
    'Interactive Ticket Transcripts & Secure Storage',
    '2026-10-01',
    'FEATURE',
    'Private-thread ticket handling system with real-time transcript archival and dashboard viewer integration.',
    '["Ticket Bot"]'::jsonb,
    '[
        "One-click Discord private thread generation for confidential support queries",
        "Automatic HTML transcript generation and persistent cloud archival upon ticket closure",
        "End-to-end encrypted transcript viewer accessible through the Web Dashboard"
    ]'::jsonb,
    '[
        "Streamlined ticket claim workflows with role-based claim restrictions for server staff",
        "Enhanced ticket category routing based on user-selected inquiry type"
    ]'::jsonb,
    '[
        "Fixed transcript rendering for animated custom emojis and Discord code blocks"
    ]'::jsonb,
    'PUBLISHED'
),
(
    'v2.2.0',
    'Dynamic Voice Rooms & Auto-Clean Generator',
    '2026-09-18',
    'STABLE',
    'Join-to-create temporary voice channels with zero-latency channel provisioning and automated cleanup on exit.',
    '["Voice Bot"]'::jsonb,
    '[
        "Instant temporary voice channel creation upon connecting to the primary ecosystem lobby",
        "Interactive member channel management menu for custom room names, user limits, and locking",
        "Automated empty channel garbage collection keeping server channel lists tidy"
    ]'::jsonb,
    '[
        "High-bitrate voice channel allocation with region-optimal voice server selection"
    ]'::jsonb,
    '[
        "Resolved rare race condition during rapid consecutive channel join/disconnect events"
    ]'::jsonb,
    'PUBLISHED'
),
(
    'v2.0.0',
    'SyncInk Multi-Bot Ecosystem Launch',
    '2026-08-15',
    'MAJOR',
    'Official launch of the unified SyncInk bot platform, connecting community management, ticket operations, and voice utilities under a shared design system.',
    '["Platform", "Ticket Bot", "Voice Bot", "Support Bot"]'::jsonb,
    '[
        "Unified Multi-Bot Console for configuring Ticket, Voice, and Security bots from a single hub",
        "Custom branded dark-theme design system with accessible interactive controls",
        "Discord OAuth2 authentication with server permission checks"
    ]'::jsonb,
    '[
        "Comprehensive REST API architecture with unified database pooling"
    ]'::jsonb,
    '[]'::jsonb,
    'PUBLISHED'
)
ON CONFLICT (version) DO NOTHING;
