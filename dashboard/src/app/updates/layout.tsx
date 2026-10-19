import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Updates & Changelog",
  description:
    "Latest updates, changelogs, and release notes across the entire SyncInk bot ecosystem — Ticket Bot, Voice Bot, and Support & Security Bot.",
  openGraph: {
    title: "SyncInk — Updates & Changelog",
    description:
      "Track every improvement, bug fix, and new feature shipped across all SyncInk bots in real time.",
    url: "https://syncink.site/updates",
  },
};

export default function UpdatesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
