import { jwtVerify, type JWTPayload } from 'jose';

export interface SessionPayload extends JWTPayload {
  userId: string;
  orgId: string;
}

function getEncodedKey(): Uint8Array | null {
  const secret = process.env.SESSION_SECRET;
  if (!secret) return null;
  return new TextEncoder().encode(secret);
}

export async function decrypt(session: string | undefined = ''): Promise<SessionPayload | null> {
  if (!session) return null;
  try {
    const key = getEncodedKey();
    if (!key) return null;
    const { payload } = await jwtVerify<SessionPayload>(session, key, {
      algorithms: ['HS256'],
    });
    return payload;
  } catch {
    return null;
  }
}
