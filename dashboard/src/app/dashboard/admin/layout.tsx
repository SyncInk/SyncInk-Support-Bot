import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Owner Admin Control Panel | SyncInk",
  description: "Exclusive administration, role-based access control, and ecosystem management for the SyncInk Owner.",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
