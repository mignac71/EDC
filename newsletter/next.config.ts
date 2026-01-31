import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: "/newsletter",
  async redirects() {
    return [
      {
        source: "/",
        destination: "/newsletter",
        permanent: true,
        basePath: false,
      },
      {
        source: "/dashboard",
        destination: "/",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
