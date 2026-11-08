import type { Metadata } from "next";
import { safeJsonLdString } from "@/lib/security";

export const metadata: Metadata = {
  title: "About SyncInk • Discord Bot Ecosystem & Architecture",
  description:
    "Learn about SyncInk, our mission, and the engineering principles behind our Discord bot infrastructure, including private-thread tickets, dynamic temporary voice channels, and community security.",
  alternates: {
    canonical: "https://syncink.site/about",
  },
  openGraph: {
    title: "About SyncInk • Discord Bot Ecosystem & Architecture",
    description:
      "Learn about SyncInk, our mission, and the engineering principles behind our Discord bot infrastructure, including private-thread tickets, dynamic temporary voice channels, and community security.",
    url: "https://syncink.site/about",
    siteName: "SyncInk",
    images: [
      {
        url: "https://syncink.site/favicon.png",
        width: 256,
        height: 256,
        alt: "SyncInk Logo",
        type: "image/png",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "About SyncInk • Discord Bot Ecosystem & Architecture",
    description:
      "Learn about SyncInk, our mission, and the engineering principles behind our Discord bot infrastructure, including private-thread tickets, dynamic temporary voice channels, and community security.",
    images: ["https://syncink.site/favicon.png"],
  },
};

const aboutJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "AboutPage",
      "@id": "https://syncink.site/about#webpage",
      url: "https://syncink.site/about",
      name: "About SyncInk • Discord Bot Ecosystem & Architecture",
      description:
        "Learn about SyncInk, our mission, and the engineering principles behind our Discord bot infrastructure, including private-thread tickets, dynamic temporary voice channels, and community security.",
      isPartOf: {
        "@type": "WebSite",
        "@id": "https://syncink.site/#website",
        name: "SyncInk",
        url: "https://syncink.site/",
      },
      about: {
        "@id": "https://syncink.site/#organization",
      },
    },
    {
      "@type": "Organization",
      "@id": "https://syncink.site/#organization",
      name: "SyncInk",
      url: "https://syncink.site/",
      logo: {
        "@type": "ImageObject",
        url: "https://syncink.site/favicon.png",
      },
      sameAs: [
        "https://discord.gg/PmxfJwmQuB",
        "https://github.com/SyncInk",
      ],
      description:
        "SyncInk builds professional Discord bots, automation tools, dashboards and community solutions for modern online communities.",
    },
  ],
};

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLdString(aboutJsonLd) }}
      />
      {children}
    </>
  );
}
