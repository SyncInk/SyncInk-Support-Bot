import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Security Checkpoint | SyncInk Support Server Verification",
  description: "Official identity verification portal for the SyncInk Support Discord community.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function VerifyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
