import type { NextConfig } from 'next';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

const nextConfig: NextConfig = {
  ...(process.env.VERCEL
    ? { adapterPath: require.resolve('@vercel/next/dist/adapter') }
    : {}),
};

export default nextConfig;
