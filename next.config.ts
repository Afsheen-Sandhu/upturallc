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
      { source: "/admin.html", destination: "/admin", permanent: false },
      { source: "/admin-dashboard.html", destination: "/admin/dashboard", permanent: false },
    ];
  },
};

export default nextConfig;
