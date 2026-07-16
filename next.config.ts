import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  ...(process.env.VERCEL && {
    distDir: '.vercel',
    adapterPath: '@vercel/next/dist/adapter',
  }),
};

export default nextConfig;
