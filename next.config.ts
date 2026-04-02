import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
