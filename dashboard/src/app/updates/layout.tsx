import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Updates & Changelog",
  description:
    "Latest updates, changelogs, and release notes across the entire SyncInk ecosystem — Audia AI, SyncInk Radio, Ticket Bot, Voice Bot, and Support & Security Bot.",
  openGraph: {
    title: "SyncInk — Updates & Changelog",
    description:
      "Track every improvement, bug fix, and new feature shipped across SyncInk Radio, Audia AI, and all SyncInk bots.",
    url: "https://syncink.site/updates",
  },
  twitter: {
    card: "summary",
    title: "SyncInk — Updates & Changelog",
    description:
      "Track every improvement, bug fix, and new feature shipped across SyncInk Radio, Audia AI, and all SyncInk bots.",
  },
};

export default function UpdatesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
