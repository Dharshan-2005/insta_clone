/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: '**',
      },
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  async rewrites() {
    if (process.env.NODE_ENV !== 'production') return [];
    return [
      {
        source: '/media/:path*',
        destination: 'http://nginx/media/:path*',
      },
    ];
  },
};

export default nextConfig;

