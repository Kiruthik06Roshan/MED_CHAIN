/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: [
    'localhost:3000',
    'localhost:3001',
    '172.28.112.1',
    '172.28.112.1:3000',
    '172.28.112.1:3001',
  ],
  experimental: {
    serverActions: {
      allowedOrigins: [
        'localhost:3000',
        'localhost:3001',
        '172.28.112.1',
        '172.28.112.1:3000',
        '172.28.112.1:3001',
      ],
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
  },
};

export default nextConfig;
