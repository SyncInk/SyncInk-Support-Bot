import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Member Applications Admin Console",
  description:
    "Administrator and Staff management console for reviewing, inspecting, and managing member applications for SyncInk.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function ApplicationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
