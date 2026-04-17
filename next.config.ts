import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Avatar + community uploads are capped at 5MB app-side; give a
      // little headroom for multipart overhead.
      bodySizeLimit: "6mb",
    },
  },
};

export default nextConfig;
