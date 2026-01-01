import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  experimental: {
    typedRoutes: false,
  },
  pageExtensions: ['ts', 'tsx', 'js', 'jsx', 'mdx'],
};

export default nextConfig;
