/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Minimal production server for the Docker image (`.next/standalone`).
  output: 'standalone',
  transpilePackages: ['@stellariq/ui', '@stellariq/types', '@stellariq/schemas', '@stellariq/sdk'],
};

export default nextConfig;
