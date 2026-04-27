import type { MetadataRoute } from "next";

const site = "https://uptura.net";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return [
    { url: site, lastModified, changeFrequency: "monthly", priority: 1 },
    { url: `${site}/about`, lastModified, changeFrequency: "monthly", priority: 0.8 },
    { url: `${site}/digital-solutions`, lastModified, changeFrequency: "monthly", priority: 0.9 },
    { url: `${site}/ai-consultancy`, lastModified, changeFrequency: "monthly", priority: 0.9 },
    { url: `${site}/work`, lastModified, changeFrequency: "monthly", priority: 0.7 },
    { url: `${site}/contact`, lastModified, changeFrequency: "monthly", priority: 0.8 },
    { url: `${site}/checkout`, lastModified, changeFrequency: "monthly", priority: 0.6 },
    { url: `${site}/consultation`, lastModified, changeFrequency: "monthly", priority: 0.5 },
  ];
}
