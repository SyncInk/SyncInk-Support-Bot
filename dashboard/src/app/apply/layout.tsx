import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Join the Team • Staff & Developer Applications",
  description:
    "Apply to join the SyncInk Operations, Community Support, or Engineering team. Help build and support Discord tools for active online communities.",
  alternates: {
    canonical: "https://syncink.site/apply",
  },
  openGraph: {
    title: "Join the Team • Staff & Developer Applications | SyncInk",
    description:
      "Apply to join the SyncInk Operations, Community Support, or Engineering team. Help build and support Discord tools for active online communities.",
    url: "https://syncink.site/apply",
  },
  twitter: {
    card: "summary_large_image",
    title: "Join the Team • Staff & Developer Applications | SyncInk",
    description:
      "Apply to join the SyncInk Operations, Community Support, or Engineering team. Help build and support Discord tools for active online communities.",
  },
};

export default function ApplyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
