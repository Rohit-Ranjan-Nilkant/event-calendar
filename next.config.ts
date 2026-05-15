import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,

  images: {
    // Avatars are served from the Express backend — disable Next.js image
    // optimisation so <Image> works with cross-service URLs in production.
    unoptimized: true,
  },

  // ── Development proxy ──────────────────────────────────────────────────────
  // In production, Nginx routes /api/* and /avatars/* to the Express backend.
  // In development (next dev), Next.js itself proxies these paths so you don't
  // need to run Nginx locally — just start both services:
  //   backend:  cd backend && npm run dev   (port 4000)
  //   frontend: npm run dev                 (port 3000)
  async rewrites() {
    const backendUrl =
      process.env.BACKEND_INTERNAL_URL || "http://localhost:4000";
    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
      {
        source: "/avatars/:path*",
        destination: `${backendUrl}/avatars/:path*`,
      },
    ];
  },
};

export default nextConfig;
