import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SyncInk Security Shield | Master Dashboard",
  description: "Live real-time web defense, automod, and forensics dashboard for SyncInk Security Bot.",
  icons: {
    icon: "https://files.catbox.moe/74l9su.png",
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
