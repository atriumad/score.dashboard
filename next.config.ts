import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "scoreusa.com",
        pathname: "/wp-content/**",
      },
    ],
  },
};

export default nextConfig;