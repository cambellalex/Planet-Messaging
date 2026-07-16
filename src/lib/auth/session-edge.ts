import { jwtVerify, type JWTPayload } from 'jose';

export interface SessionPayload extends JWTPayload {
  userId: string;
  orgId: string;
}

function getEncodedKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error('SESSION_SECRET environment variable is not set.');
  return new TextEncoder().encode(secret);
}

export async function decrypt(session: string | undefined = ''): Promise<SessionPayload | null> {
  if (!session) return null;
  try {
    const { payload } = await jwtVerify<SessionPayload>(session, getEncodedKey(), {
      algorithms: ['HS256'],
    });
    return payload;
  } catch {
    return null;
  }
}
