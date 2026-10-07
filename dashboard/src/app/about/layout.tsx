import type { Metadata } from "next";

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
        url: "/favicon.png",
        width: 512,
        height: 512,
        alt: "SyncInk Logo",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
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
        "https://discord.gg/rB6gNZaK9u",
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(aboutJsonLd) }}
      />
      {children}
    </>
  );
}
