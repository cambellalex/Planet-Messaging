import { NextRequest, NextResponse } from 'next/server';
import { getSessionPayload } from '@/lib/auth/session';
import { db } from '@/lib/db';

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSessionPayload();
  if (!session?.userId) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });

  const { id } = await params;

  const existing = await db.apiKey.findUnique({
    where: { id },
    select: { organisationId: true },
  });

  if (!existing || existing.organisationId !== session.orgId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  await db.apiKey.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
