/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  serverRuntimeConfig: {
    backendUrl: process.env.NEXT_PUBLIC_BACKEND_URL,
  },
  publicRuntimeConfig: {
    backendUrl: process.env.NEXT_PUBLIC_BACKEND_URL,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'aljshowzwfryjtexdczf.supabase.co',
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb',
    },
  },
};

module.exports = nextConfig;
