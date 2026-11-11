import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/payments", destination: "/payment/return", permanent: false },
      { source: "/payments/:path*", destination: "/payment/return", permanent: false },
      { source: "/payment", destination: "/payment/return", permanent: false },
      { source: "/payment/callback", destination: "/payment/return", permanent: false },
      { source: "/payment/success", destination: "/payment/return", permanent: false },
    ];
  },
};

export default nextConfig;