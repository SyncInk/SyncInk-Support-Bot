import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Official privacy policy for the SyncInk Discord Bot Ecosystem. Learn how we handle Discord user data, encrypted transcripts, and privacy rights.",
  alternates: {
    canonical: "https://syncink.site/privacy",
  },
  openGraph: {
    title: "Privacy Policy | SyncInk",
    description:
      "Official privacy policy for the SyncInk Discord Bot Ecosystem. Learn how we handle Discord user data, encrypted transcripts, and privacy rights.",
    url: "https://syncink.site/privacy",
  },
  twitter: {
    card: "summary_large_image",
    title: "Privacy Policy | SyncInk",
    description:
      "Official privacy policy for the SyncInk Discord Bot Ecosystem. Learn how we handle Discord user data, encrypted transcripts, and privacy rights.",
  },
};

export default function PrivacyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
