// next.config.ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['graph.facebook.com'],
  },
  // ...other Next.js configuration settings as needed
};

export default nextConfig;
