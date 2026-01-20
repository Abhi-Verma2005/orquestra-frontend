/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {},
  images: {
    remotePatterns: [],
  },
  env: {
    // Disable Coinbase CDP analytics
    NEXT_PUBLIC_DISABLE_CDP_ERROR_REPORTING: 'true',
    NEXT_PUBLIC_DISABLE_CDP_USAGE_TRACKING: 'true',
  },
  async rewrites() {
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000';
    return [
      // Proxy API calls to Rust backend
      {
        source: '/api/chat/:path*',
        destination: `${backendUrl}/api/chat/:path*`,
      },
      {
        source: '/api/user/:path*',
        destination: `${backendUrl}/api/user/:path*`,
      },
      {
        source: '/api/users/:path*',
        destination: `${backendUrl}/api/users/:path*`,
      },
      {
        source: '/api/greeting',
        destination: `${backendUrl}/api/greeting`,
      },
      {
        source: '/api/history',
        destination: `${backendUrl}/api/history`,
      },
      {
        source: '/api/apikeys',
        destination: `${backendUrl}/api/apikeys`,
      },
      {
        source: '/api/agents/:path*',
        destination: `${backendUrl}/api/agents/:path*`,
      },
    ];
  },
};

export default nextConfig;
