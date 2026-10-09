/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Ensure source maps are NOT exposed in production client bundles (Checklist Item 17)
  productionBrowserSourceMaps: false,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'cdn.discordapp.com' },
      { protocol: 'https', hostname: 'files.catbox.moe' },
      { protocol: 'https', hostname: 'cdn3.emoji.gg' },
      { protocol: 'https', hostname: 'syncink.github.io' },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
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
            value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()',
          },
          // Content Security Policy (Checklist Item 2)
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://discord.com",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https://cdn.discordapp.com https://files.catbox.moe https://cdn3.emoji.gg https://syncink.github.io https://*.google.com https://*.googleusercontent.com",
              "font-src 'self' data: https:",
              "connect-src 'self' https://discord.com https://syncink-ticket.onrender.com https://syncink-voice.onrender.com https://*.supabase.co wss:",
              "frame-ancestors 'self'",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self' https://discord.com",
            ].join('; '),
          },
        ],
      },
      // Tighten CORS Settings for API Routes (Checklist Item 11)
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: 'https://syncink.site',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization, x-session-id, x-token, x-requested-with',
          },
          {
            key: 'Access-Control-Allow-Credentials',
            value: 'true',
          },
        ],
      },
    ];
  },
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: '/dashboard/voice',
          destination: 'https://syncink-voice.onrender.com/dashboard/voice/',
        },
        {
          source: '/dashboard/voice/:path*',
          destination: 'https://syncink-voice.onrender.com/dashboard/voice/:path*',
        },
      ],
    };
  },
  async redirects() {
    return [
      {
        source: '/dashboard/tickets/servers',
        destination: '/dashboard/tickets',
        permanent: false,
      },
      {
        source: '/dashboard/tickets/servers/:path*',
        destination: '/dashboard/tickets',
        permanent: false,
      },
      { source: '/dashboard/tickets/rules', destination: '/rules', permanent: true },
      {
        source: '/dashboard/tickets/guide',
        destination: '/dashboard/tickets/guides',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
