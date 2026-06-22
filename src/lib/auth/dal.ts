import 'server-only';
import { cache } from 'react';
import { getSessionPayload } from '@/lib/auth/session';

export const verifySession = cache(async () => {
  const session = await getSessionPayload();
  if (!session?.userId) {
    return null;
  }
  return { isAuth: true, userId: session.userId, orgId: session.orgId };
});

export interface UserDTO {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  organisationId: string;
  role: string;
}

export const getUser = cache(async (): Promise<UserDTO | null> => {
  const session = await verifySession();
  if (!session) return null;

  const { db } = await import('@/lib/db');
  const user = await db.user.findUnique({ where: { id: session.userId } });
  if (!user) return null;

  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    organisationId: user.organisationId,
    role: user.role,
  };
});
