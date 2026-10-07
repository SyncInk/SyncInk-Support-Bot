import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Community Rules & Platform Guidelines",
  description:
    "Official community standards, Discord bot conduct guidelines, and server management rules for the SyncInk ecosystem.",
  alternates: {
    canonical: "https://syncink.site/rules",
  },
  openGraph: {
    title: "Community Rules & Platform Guidelines | SyncInk",
    description:
      "Official community standards, Discord bot conduct guidelines, and server management rules for the SyncInk ecosystem.",
    url: "https://syncink.site/rules",
  },
  twitter: {
    card: "summary_large_image",
    title: "Community Rules & Platform Guidelines | SyncInk",
    description:
      "Official community standards, Discord bot conduct guidelines, and server management rules for the SyncInk ecosystem.",
  },
};

export default function RulesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
