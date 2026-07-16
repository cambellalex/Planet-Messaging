import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  ...(process.env.VERCEL && {
    adapterPath: '@vercel/next/dist/adapter',
  }),
};

export default nextConfig;
