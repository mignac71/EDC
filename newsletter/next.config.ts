import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: "/newsletter",
  async redirects() {
    return [
      {
        source: "/dashboard",
        destination: "/",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
