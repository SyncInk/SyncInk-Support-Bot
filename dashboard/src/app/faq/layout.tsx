import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Frequently Asked Questions",
  description:
    "Find answers to common questions about SyncInk Discord bots, setup guides, server integration, and support ticketing.",
  alternates: {
    canonical: "https://syncink.site/faq",
  },
  openGraph: {
    title: "Frequently Asked Questions | SyncInk",
    description:
      "Find answers to common questions about SyncInk Discord bots, setup guides, server integration, and support ticketing.",
    url: "https://syncink.site/faq",
  },
  twitter: {
    card: "summary_large_image",
    title: "Frequently Asked Questions | SyncInk",
    description:
      "Find answers to common questions about SyncInk Discord bots, setup guides, server integration, and support ticketing.",
  },
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "How do I verify my account to access the server?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Upon joining the SyncInk Discord community, complete Discord's native membership screening or use the verification channel to unlock full community access.",
      },
    },
    {
      "@type": "Question",
      name: "How do I open a support ticket?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Navigate to the designated ticket panel channel and select your support category to automatically create a private ticket thread.",
      },
    },
    {
      "@type": "Question",
      name: "How does the Dynamic Voice generator work?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Join the designated 'Join to Create' voice hub channel, and the bot will instantly generate a private temporary voice room with customizable permissions.",
      },
    },
    {
      "@type": "Question",
      name: "Is SyncInk free to use?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes, core features for SyncInk Discord bots including ticketing, dynamic voice channels, and automod security are free for online communities.",
      },
    },
  ],
};

export default function FAQLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      {children}
    </>
  );
}
