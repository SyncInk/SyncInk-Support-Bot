import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/dashboard/*/transcripts/*", "/login"],
      },
      {
        userAgent: [
          "Googlebot",
          "Bingbot",
          "Applebot",
          "DuckDuckBot",
          "OAI-SearchBot",
          "ChatGPT-User",
          "GPTBot",
          "PerplexityBot",
          "Google-Extended",
          "ClaudeBot",
          "anthropic-ai",
          "cohere-ai",
        ],
        allow: "/",
        disallow: ["/api/", "/login"],
      },
    ],
    sitemap: "https://syncink.site/sitemap.xml",
    host: "https://syncink.site",
  };
}
