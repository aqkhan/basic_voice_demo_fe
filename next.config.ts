import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  eslint: {
    // Disable ESLint during builds
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Disable TypeScript checks during builds (optional)
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
