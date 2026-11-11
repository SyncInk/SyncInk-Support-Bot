import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Audia AI by SyncInk • Official Product Specification & Architecture",
  description:
    "Official product release and technical specification for Audia AI by SyncInk — the next-generation intelligent music assistant powering SyncInk Radio with parametric taste modeling, six-stage real-time learning, and cycle-free AutoPlay.",
  alternates: {
    canonical: "https://syncink.site/audia",
  },
  openGraph: {
    title: "Introducing Audia AI • Official Technical Specification",
    description:
      "The next generation of intelligent music experiences — by SyncInk. Dedicated 10-point recommendation architecture, six-stage pipeline, acoustic signal processing, and /audia command namespace.",
    url: "https://syncink.site/audia",
    siteName: "SyncInk",
    images: [
      {
        url: "https://syncink.site/audia-ai-logo.png",
        width: 1200,
        height: 400,
        alt: "Audia AI by SyncInk",
        type: "image/png",
      },
    ],
    locale: "en_US",
    type: "article",
  },
  twitter: {
    card: "summary",
    title: "Introducing Audia AI • Official Technical Specification",
    description:
      "The next generation of intelligent music experiences — by SyncInk. Official product release and architecture specification.",
    images: ["https://syncink.site/audia-ai-logo.png"],
    creator: "@SyncInk",
  },
};

export default function AudiaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
