/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Minimal production server for the Docker image (`.next/standalone`).
  output: 'standalone',
  transpilePackages: ['@stellariq/ui', '@stellariq/types', '@stellariq/schemas', '@stellariq/sdk'],
  webpack: (config) => {
    // stellar-base tries the optional native `sodium-native` add-on and falls
    // back to tweetnacl; the add-on can never load in a browser bundle.
    config.resolve.alias = { ...config.resolve.alias, 'sodium-native': false };
    return config;
  },
};

export default nextConfig;
