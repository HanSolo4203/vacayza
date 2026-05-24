import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Avoid broken vendor-chunks for Supabase during dev Fast Refresh
  serverExternalPackages: ["@supabase/supabase-js"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.prop24.com",
      },
      {
        protocol: "https",
        hostname: "api.mapbox.com",
      },
    ],
  },
};

export default nextConfig;
