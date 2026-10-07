import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "Official terms and conditions governing the use of SyncInk Discord bots, web dashboards, transcripts, and community services.",
  alternates: {
    canonical: "https://syncink.site/terms",
  },
  openGraph: {
    title: "Terms of Service | SyncInk",
    description:
      "Official terms and conditions governing the use of SyncInk Discord bots, web dashboards, transcripts, and community services.",
    url: "https://syncink.site/terms",
  },
  twitter: {
    card: "summary_large_image",
    title: "Terms of Service | SyncInk",
    description:
      "Official terms and conditions governing the use of SyncInk Discord bots, web dashboards, transcripts, and community services.",
  },
};

export default function TermsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
