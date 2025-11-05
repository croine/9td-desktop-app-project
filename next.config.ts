import type { NextConfig } from "next";
import path from "node:path";
import withPWA from 'next-pwa';

const LOADER = path.resolve(__dirname, 'src/visual-edits/component-tagger-loader.js');

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
  },
  outputFileTracingRoot: path.resolve(__dirname, '../../'),
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Disable all caching to force fresh builds
  onDemandEntries: {
    maxInactiveAge: 0,
    pagesBufferLength: 0,
  },
  turbopack: {
    rules: {
      "*.{jsx,tsx}": {
        loaders: [LOADER]
      }
    }
  }
};

// DISABLE PWA COMPLETELY - IT WAS CACHING OLD VERSION
export default withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: true, // DISABLED TO PREVENT CACHE ISSUES
  buildExcludes: [/middleware-manifest\.json$/],
})(nextConfig);
// Orchids restart: 1761148720525
