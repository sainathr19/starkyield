import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.morpho.org',
        port: '',
        pathname: '/v2/assets/images/**',
      },
      {
        protocol: 'https',
        hostname: 'dv3jj1unlp2jl.cloudfront.net',
        port: '',
        pathname: '/128/color/**',
      },
      {
        protocol: 'https',
        hostname: 'garden-finance.imgix.net',
        port: '',
        pathname: '/token-images/**',
      },
      {
        protocol: 'https',
        hostname: 'garden.imgix.net',
        port: '',
        pathname: '/chain_images/**',
      },
    ],
  },
};

export default nextConfig;
