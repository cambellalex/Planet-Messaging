import { NextRequest, NextResponse } from 'next/server';
import { getSessionPayload } from '@/lib/auth/session';
import { db } from '@/lib/db';

async function sha256hex(text: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function GET() {
  const session = await getSessionPayload();
  if (!session?.userId) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });

  const keys = await db.apiKey.findMany({
    where: { organisationId: session.orgId },
    select: { id: true, name: true, keyPrefix: true, lastFour: true, createdAt: true, lastUsedAt: true },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(keys);
}

export async function POST(req: NextRequest) {
  const session = await getSessionPayload();
  if (!session?.userId) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });

  const body = await req.json().catch(() => ({})) as { name?: string };
  const name = typeof body.name === 'string' && body.name.trim() ? body.name.trim() : 'API Key';

  // Generate: pmk_ + 40 random hex chars (20 bytes)
  const bytes = new Uint8Array(20);
  crypto.getRandomValues(bytes);
  const hex = Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
  const key = `pmk_${hex}`;

  const record = await db.apiKey.create({
    data: {
      name,
      keyHash: await sha256hex(key),
      keyPrefix: key.slice(0, 12),  // pmk_ + first 8 hex
      lastFour: key.slice(-4),
      organisationId: session.orgId,
    },
    select: { id: true, name: true, keyPrefix: true, lastFour: true, createdAt: true },
  });

  // key is returned ONCE — never stored in plaintext
  return NextResponse.json({ ...record, key }, { status: 201 });
}
