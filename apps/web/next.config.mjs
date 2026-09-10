/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  transpilePackages: ['@stellariq/ui', '@stellariq/types', '@stellariq/schemas', '@stellariq/sdk'],
};

export default nextConfig;
