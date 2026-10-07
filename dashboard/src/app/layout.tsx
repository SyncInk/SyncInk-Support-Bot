import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  themeColor: "#060812",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://syncink.site"),
  title: {
    default: "SyncInk | Official Discord Bot Ecosystem & Multi-Bot Console",
    template: "%s | SyncInk (syncink.site)",
  },
  description:
    "Official SyncInk Discord bot infrastructure. Featuring enterprise-grade Ticket Bot with private threads, Dynamic Temporary Voice Generator, and 24/7 Support Security Automod shields.",
  keywords: [
    "SyncInk",
    "SyncInk bot",
    "syncink.site",
    "Discord ticket bot",
    "Discord voice bot",
    "Discord security bot",
    "Discord automod",
    "Discord bot dashboard",
    "Discord temporary voice",
    "Discord transcripts",
    "Discord private threads",
    "Discord server management",
  ],
  authors: [{ name: "SyncInk Operations Team", url: "https://syncink.site" }],
  creator: "SyncInk",
  publisher: "SyncInk",
  alternates: {
    canonical: "https://syncink.site",
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.png", sizes: "512x512", type: "image/png" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    shortcut: "/favicon.ico",
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  manifest: "/site.webmanifest",
  openGraph: {
    title: "SyncInk | Official Discord Bot Ecosystem & Multi-Bot Console",
    description:
      "Enterprise Discord bot infrastructure: Ticket System with private threads, Dynamic Voice Generator, and 24/7 Automod Security shield.",
    url: "https://syncink.site",
    siteName: "SyncInk",
    images: [
      {
        url: "/favicon.png",
        width: 512,
        height: 512,
        alt: "SyncInk Circular Logo",
      },
      {
        url: "/syncink-main-logo.png",
        width: 512,
        height: 512,
        alt: "SyncInk Ecosystem",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "SyncInk | Official Discord Bot Ecosystem",
    description:
      "Enterprise Discord bot infrastructure: Ticket Bot, Voice Bot, and Security Shield.",
    images: ["https://syncink.site/favicon.png"],
    creator: "@SyncInk",
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  category: "technology",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": "https://syncink.site/#organization",
        name: "SyncInk",
        url: "https://syncink.site",
        logo: {
          "@type": "ImageObject",
          url: "https://syncink.site/favicon.png",
          width: 512,
          height: 512,
        },
        sameAs: [
          "https://discord.gg/rB6gNZaK9u",
        ],
        description:
          "High-performance Discord bot ecosystem powering tickets, dynamic voice channels, and server security.",
      },
      {
        "@type": "WebSite",
        "@id": "https://syncink.site/#website",
        url: "https://syncink.site",
        name: "SyncInk",
        publisher: {
          "@id": "https://syncink.site/#organization",
        },
        description:
          "Official SyncInk Discord Bot Ecosystem and Unified Multi-Bot Console.",
      },
      {
        "@type": "SoftwareApplication",
        name: "SyncInk Ticket Bot",
        applicationCategory: "BusinessApplication",
        operatingSystem: "Discord",
        url: "https://syncink.site/dashboard/tickets",
        description:
          "Enterprise Discord support ticket bot with private thread isolation, customizable categories, and encrypted HTML transcripts.",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
        },
      },
      {
        "@type": "SoftwareApplication",
        name: "SyncInk Voice Bot",
        applicationCategory: "UtilitiesApplication",
        operatingSystem: "Discord",
        url: "https://syncink.site/dashboard/voice",
        description:
          "Dynamic temporary voice channel manager with join-to-create generator hubs, user permissions, and automatic cleanup.",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
        },
      },
      {
        "@type": "SoftwareApplication",
        name: "SyncInk Support Bot",
        applicationCategory: "SecurityApplication",
        operatingSystem: "Discord",
        url: "https://syncink.site/dashboard/security",
        description:
          "Real-time raid dampener, automated quarantine, and automod defense bot for community security.",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
        },
      },
    ],
  };

  return (
    <html lang="en" className="dark">
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="alternate icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-screen bg-background text-slate-100 antialiased selection:bg-brand-red selection:text-white">
        {children}
      </body>
    </html>
  );
}
