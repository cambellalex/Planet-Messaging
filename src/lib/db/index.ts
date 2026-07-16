import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

function createClient() {
  const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
}

type PrismaClientInstance = ReturnType<typeof createClient>;

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClientInstance };

export const db = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;
