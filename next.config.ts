import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  turbopack: {
    // In this repo we use git worktrees; pin root so .env.local is loaded from this folder.
    root: path.join(__dirname),
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.prod.website-files.com",
      },
    ],
  },
  async redirects() {
    return [
      // Legacy .html → clean URLs (permanent 301 so Google transfers PageRank)
      { source: "/index.html",             destination: "/",                  permanent: true },
      { source: "/about.html",             destination: "/about",             permanent: true },
      { source: "/work.html",              destination: "/work",              permanent: true },
      { source: "/contact.html",           destination: "/contact",           permanent: true },
      { source: "/digital-solutions.html", destination: "/digital-solutions", permanent: true },
      { source: "/ai-consultancy.html",    destination: "/ai-consultancy",    permanent: true },
      { source: "/checkout.html",          destination: "/checkout",          permanent: true },
      { source: "/admin.html",             destination: "/admin",             permanent: true },
      { source: "/admin-dashboard.html",   destination: "/admin/dashboard",   permanent: true },
      // CRM — legacy tool, not in Next.js app yet; redirect to admin
      { source: "/crm.html",               destination: "/admin",             permanent: false },
      { source: "/crm-:page.html",         destination: "/admin",             permanent: false },
    ];
  },
};

export default nextConfig;
