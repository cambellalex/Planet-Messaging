import { NextRequest, NextResponse } from 'next/server';
import { getSessionPayload } from '@/lib/auth/session';
import { db } from '@/lib/db';
import type { Prisma } from '@prisma/client';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSessionPayload();
  if (!session?.userId) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });

  const { id } = await params;
  let body: { name?: string; phone?: string; email?: string; tags?: string[]; groupName?: string; extraFields?: Record<string, unknown> };
  try {
    body = await req.json() as typeof body;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const existing = await db.contact.findFirst({ where: { id, organisationId: session.orgId } });
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const updated = await db.contact.update({
    where: { id },
    data: {
      ...(body.name !== undefined && { name: body.name.trim() }),
      ...(body.phone !== undefined && { phone: body.phone.trim() || null }),
      ...(body.email !== undefined && { email: body.email.trim() || null }),
      ...(body.tags !== undefined && { tags: body.tags }),
      ...(body.groupName !== undefined && { groupName: body.groupName.trim() || null }),
      ...(body.extraFields !== undefined && { extraFields: body.extraFields as Prisma.InputJsonValue }),
    },
  });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSessionPayload();
  if (!session?.userId) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });

  const { id } = await params;
  const existing = await db.contact.findFirst({ where: { id, organisationId: session.orgId } });
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await db.contact.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
