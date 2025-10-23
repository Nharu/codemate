import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: path.join(__dirname, "../../"),
  // Skip lint and type check only in CI (performed locally via pre-commit hook)
  eslint: {
    ignoreDuringBuilds: process.env.CI === 'true',
  },
  typescript: {
    ignoreBuildErrors: process.env.CI === 'true',
  },
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '9000',
        pathname: '/codemate-uploads/**',
      },
    ],
  },
};

export default nextConfig;
