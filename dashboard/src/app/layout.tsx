import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://syncink.site"),
  title: "SyncInk | Official Bot Ecosystem & Multi-Bot Console (syncink.site)",
  description:
    "All-in-one Discord bot infrastructure: Enterprise Security & AutoMod, Private-Thread Tickets, Dynamic Voice Generation, and high-fidelity audio.",
  icons: {
    icon: "https://files.catbox.moe/74l9su.png",
  },
  openGraph: {
    title: "SyncInk | Official Bot Ecosystem & Multi-Bot Console",
    description:
      "Enterprise Discord bot suite: Security & AutoMod, Private-Thread Tickets, Dynamic Voice Channels, and Staff & Developer applications.",
    url: "https://syncink.site",
    siteName: "SyncInk Ecosystem",
    images: [
      {
        url: "https://files.catbox.moe/74l9su.png",
        width: 512,
        height: 512,
        alt: "SyncInk Logo",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "SyncInk | Official Bot Ecosystem",
    description: "Enterprise Discord bot suite & unified multi-bot console.",
    images: ["https://files.catbox.moe/74l9su.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-background text-slate-100 antialiased selection:bg-brand-red selection:text-white">
        {children}
      </body>
    </html>
  );
}
