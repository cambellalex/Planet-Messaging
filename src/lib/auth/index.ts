import bcrypt from 'bcryptjs';
import type { PrismaClient } from '@prisma/client';

type PrismaTx = Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>;

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  organisationId: string;
  role: 'owner' | 'admin' | 'member';
  createdAt: Date;
}

export interface Organisation {
  id: string;
  name: string;
  plan: 'free' | 'pro' | 'enterprise';
  createdAt: Date;
}

export interface CreateUserInput {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  companyName: string;
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export async function createUser(input: CreateUserInput): Promise<{ user: User; org: Organisation }> {
  const { db } = await import('@/lib/db');
  return db.$transaction(async (tx: PrismaTx) => {
    const org = await tx.organisation.create({ data: { name: input.companyName } });
    const hash = await hashPassword(input.password);
    const user = await tx.user.create({
      data: {
        email: input.email,
        firstName: input.firstName,
        lastName: input.lastName,
        passwordHash: hash,
        organisationId: org.id,
        role: 'owner',
      },
    });
    return {
      user: { ...user, role: user.role as User['role'] },
      org: { ...org, plan: org.plan as Organisation['plan'] },
    };
  });
}
