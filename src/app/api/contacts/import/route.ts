import { NextRequest, NextResponse } from 'next/server';
import { getSessionPayload } from '@/lib/auth/session';
import { db } from '@/lib/db';
import type { Prisma } from '@prisma/client';

const MAX_ROWS = 2000;

interface ContactRow {
  name: string;
  phone?: string;
  email?: string;
  extraFields?: Record<string, unknown>;
}

export async function POST(req: NextRequest) {
  const session = await getSessionPayload();
  if (!session?.userId) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });

  let body: { groupName: string; contacts: ContactRow[] };
  try {
    body = await req.json() as typeof body;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (!body.groupName?.trim()) return NextResponse.json({ error: 'groupName is required' }, { status: 400 });
  if (!Array.isArray(body.contacts) || body.contacts.length === 0) {
    return NextResponse.json({ error: 'contacts array is required' }, { status: 400 });
  }
  if (body.contacts.length > MAX_ROWS) {
    return NextResponse.json({ error: `Maximum ${MAX_ROWS} contacts per import` }, { status: 400 });
  }

  const valid = body.contacts.filter((c) => c.name?.trim());
  if (valid.length === 0) return NextResponse.json({ error: 'No valid rows (name is required)' }, { status: 400 });

  const created = await db.contact.createMany({
    data: valid.map((c) => ({
      name: c.name.trim(),
      phone: c.phone?.trim() || null,
      email: c.email?.trim() || null,
      tags: [],
      groupName: body.groupName.trim(),
      extraFields: c.extraFields ? (c.extraFields as Prisma.InputJsonValue) : undefined,
      organisationId: session.orgId,
    })),
  });

  return NextResponse.json({ imported: created.count }, { status: 201 });
}
