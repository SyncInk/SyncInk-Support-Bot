/**
 * SyncInk Motion Design System — Centralized Tokens
 *
 * Every animation in the application should reference these values
 * instead of hardcoding durations, easings, or spring configs.
 *
 * Based on the Motion for React (framer-motion) API.
 */

// ─── Duration tokens (seconds) ───────────────────────────────────────
export const duration = {
  /** Button press, checkbox toggle */
  micro: 0.12,
  /** Hover states, focus rings, icon transitions */
  fast: 0.18,
  /** Dropdowns, tooltips, small panels */
  normal: 0.25,
  /** Modal entrance, meaningful section reveals */
  emphasis: 0.35,
  /** Page-level transitions, complex layout shifts */
  slow: 0.5,
} as const;

// ─── Easing curves ───────────────────────────────────────────────────
export const ease = {
  /** Standard deceleration — use for most entrances and state changes */
  out: [0.32, 0.72, 0, 1] as [number, number, number, number],
  /** Standard acceleration — use for exits */
  in: [0.4, 0, 1, 0.6] as [number, number, number, number],
  /** Symmetric — use for reversible transitions (accordion expand/collapse) */
  inOut: [0.4, 0, 0.2, 1] as [number, number, number, number],
} as const;

// ─── Spring presets ──────────────────────────────────────────────────
export const spring = {
  /** Snappy, no overshoot — buttons, interactive controls */
  snappy: { type: "spring" as const, stiffness: 400, damping: 30 },
  /** Gentle settle — dropdowns, panels */
  gentle: { type: "spring" as const, stiffness: 300, damping: 28 },
  /** Soft — modals, page transitions */
  soft: { type: "spring" as const, stiffness: 200, damping: 24 },
} as const;

// ─── Reusable transition presets ─────────────────────────────────────
export const transition = {
  /** Immediate press feedback */
  press: { duration: duration.micro, ease: ease.out },
  /** Hover/focus state changes */
  hover: { duration: duration.fast, ease: ease.out },
  /** Standard content entrance */
  enter: { duration: duration.normal, ease: ease.out },
  /** Content exit */
  exit: { duration: duration.fast, ease: ease.in },
  /** Accordion / expandable content */
  expand: { duration: duration.normal, ease: ease.inOut },
  /** Section entrance (scroll-triggered, use sparingly) */
  section: { duration: duration.emphasis, ease: ease.out },
} as const;

// ─── Viewport detection for scroll-triggered animation ───────────────
export const viewport = {
  /** Standard: trigger when 40px inside viewport, play once */
  once: { once: true, margin: "-40px" } as const,
} as const;
