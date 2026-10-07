import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://syncink.site";
  const now = new Date();

  return [
    {
      url: `${baseUrl}/`,
      lastModified: now,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: now,
    },
    {
      url: `${baseUrl}/apply`,
      lastModified: now,
    },
    {
      url: `${baseUrl}/rules`,
      lastModified: now,
    },
    {
      url: `${baseUrl}/faq`,
      lastModified: now,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: now,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: now,
    },
  ];
}
