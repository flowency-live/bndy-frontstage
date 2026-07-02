// next.config.ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Enable bundle analyzer when ANALYZE=true
  ...(process.env.ANALYZE === 'true' && {
    experimental: {
      bundlePagesRouterDependencies: true,
    },
  }),
  reactStrictMode: true,
  
  // Temporarily ignore ESLint errors during build
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Enhanced mobile and performance optimizations
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      'react-icons',
      '@radix-ui/react-avatar',
      '@radix-ui/react-dialog',
      '@radix-ui/react-popover',
      '@radix-ui/react-select',
      '@radix-ui/react-tabs'
    ],
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  },

  // Compiler optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn']
    } : false,
  },

  // Enhanced image optimization for mobile
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'graph.facebook.com',
      },
      {
        protocol: 'https',
        hostname: '*.fbcdn.net',
      },
      {
        protocol: 'https',
        hostname: 'bndy-images.s3.eu-west-2.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: 'bndy-images.s3.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: 'i.ibb.co',
      },
      {
        protocol: 'https',
        hostname: 'yt3.googleusercontent.com',
      },
    ],
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
    dangerouslyAllowSVG: false,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // NOTE: custom webpack splitChunks removed 2026-07-02. It forced all of
  // node_modules into a single ~3MB vendors chunk loaded on every route, and
  // optimization.sideEffects=false DISABLED tree-shaking. Next.js defaults
  // produce granular per-route chunks.

  // Headers for better mobile performance
  async headers() {
    return [
      {
        // Security headers for all routes
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'X-UA-Compatible',
            value: 'IE=edge',
          },
        ],
      },
      {
        // Cache static assets aggressively
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // Never cache API routes
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
