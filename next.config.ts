import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  compress: true,
  async headers() {
    return [{
      source: "/geo/:path*",
      headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
    }];
  },
};

export default nextConfig;
