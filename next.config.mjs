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
};

export default nextConfig;
