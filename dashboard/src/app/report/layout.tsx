import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Incident & Data Loss Recovery Desk",
  description:
    "Report bot disruptions, missing ticket transcripts, accidental wipes, or critical bot issues. Connect directly with SyncInk administrators and server owners via real-time recovery chat.",
  openGraph: {
    title: "SyncInk — Data Loss Recovery & Incident Desk",
    description:
      "Dedicated portal for community recovery requests, transcript retrieval, and bot outage reporting with direct administrator chat.",
    url: "https://syncink.site/report",
  },
};

export default function ReportLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
