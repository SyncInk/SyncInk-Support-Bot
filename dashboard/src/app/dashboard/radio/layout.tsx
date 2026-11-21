import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "SyncInk Radio Dashboard | Lossless Discord Audio & Audia AI Console",
  description:
    "Official management and control console for SyncInk Radio. Monitor 48kHz lossless Opus audio streams, manage 24/7 world radio stations, and configure Audia AI AutoPlay taste models.",
  openGraph: {
    title: "SyncInk Radio Dashboard | Lossless Discord Audio & Audia AI Console",
    description:
      "Control 48kHz lossless Opus Discord music streaming, world radio stations, and Audia AI continuous AutoPlay.",
    url: "https://syncink.site/dashboard/radio",
    siteName: "SyncInk Platform",
    images: [
      {
        url: "/radio-logo.png",
        width: 1024,
        height: 1024,
        alt: "SyncInk Radio Official Logo",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "SyncInk Radio Dashboard | SyncInk",
    description: "Manage 48kHz lossless Discord streaming, world radio, and Audia AI AutoPlay.",
    images: ["/radio-logo.png"],
  },
};

export default function RadioDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
