import { NextRequest, NextResponse } from 'next/server';
import { getSessionPayload } from '@/lib/auth/session';
import { db } from '@/lib/db';
import type { Prisma } from '@prisma/client';

export async function GET() {
  const session = await getSessionPayload();
  if (!session?.userId) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });

  const contacts = await db.contact.findMany({
    where: { organisationId: session.orgId },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(contacts);
}

export async function POST(req: NextRequest) {
  const session = await getSessionPayload();
  if (!session?.userId) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });

  let body: { name: string; phone?: string; email?: string; tags?: string[]; groupName?: string; extraFields?: Record<string, unknown> };
  try {
    body = await req.json() as typeof body;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (!body.name?.trim()) return NextResponse.json({ error: 'name is required' }, { status: 400 });

  const contact = await db.contact.create({
    data: {
      name: body.name.trim(),
      phone: body.phone?.trim() || null,
      email: body.email?.trim() || null,
      tags: body.tags ?? [],
      groupName: body.groupName?.trim() || null,
      extraFields: body.extraFields ? (body.extraFields as Prisma.InputJsonValue) : undefined,
      organisationId: session.orgId,
    },
  });
  return NextResponse.json(contact, { status: 201 });
}
