import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'rwiitcwutjjokkltqqlw.supabase.co',
      },
    ],
  },
  productionBrowserSourceMaps: false,
  async redirects() {
    return [
      {
        source: '/.env',
        destination: '/404',
        permanent: true,
      },
      {
        source: '/.git/config',
        destination: '/404',
        permanent: true,
      },
      {
        source: '/config.js',
        destination: '/404',
        permanent: true,
      },
      {
        source: '/phpinfo.php',
        destination: '/404',
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://*.clerk.accounts.dev https://*.clerk.com https://challenges.cloudflare.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://rwiitcwutjjokkltqqlw.supabase.co wss://rwiitcwutjjokkltqqlw.supabase.co https://*.clerk.accounts.dev https://*.clerk.com; worker-src 'self' blob:; frame-ancestors 'none';",
          },
          // CORS Lockdown
          {
            key: 'Access-Control-Allow-Origin',
            value: 'https://www.lockedinumat.tech', // Note: Next.js headers don't support dynamic multiple origins easily here, we will enforce multi-origin via Middleware if API routes are used across both. For general static assets, restricting to the primary domain is safest.
          },
        ],
      },
    ];
  },
};



export default withSentryConfig(nextConfig, {
  org: "kaizen-x",
  project: "javascript-nextjs",
  widenClientFileUpload: true,
  tunnelRoute: "/monitoring",
  silent: !process.env.CI,
});
