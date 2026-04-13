import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone output required for Docker production image
  output: "standalone",

  // Allow images from external sources (cover image generation, etc.)
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
  },
};

export default nextConfig;
