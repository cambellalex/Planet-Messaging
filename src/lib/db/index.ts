import { PrismaClient } from '@prisma/client';

function createClient() {
  return new PrismaClient({
    accelerateUrl: process.env.DATABASE_URL,
  });
}

type PrismaClientInstance = ReturnType<typeof createClient>;

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClientInstance };

export const db = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;
