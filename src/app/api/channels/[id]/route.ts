import { NextRequest, NextResponse } from 'next/server';
import { getSessionPayload } from '@/lib/auth/session';
import { db } from '@/lib/db';

// PATCH /api/channels/[id] — upsert one or more credential fields for a channel
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSessionPayload();
  if (!session?.orgId) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });

  const { id: channelType } = await params;

  let updates: Record<string, string>;
  try {
    updates = await req.json() as Record<string, string>;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (!updates || Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No fields provided' }, { status: 400 });
  }

  const existing = await db.channel.findFirst({
    where: { organisationId: session.orgId, type: channelType },
  });

  const merged = { ...(existing?.credentials as Record<string, string> ?? {}), ...updates };

  if (existing) {
    await db.channel.update({
      where: { id: existing.id },
      data: { credentials: merged, status: 'connected' },
    });
  } else {
    await db.channel.create({
      data: {
        type: channelType,
        credentials: merged,
        status: 'connected',
        organisationId: session.orgId,
      },
    });
  }

  return NextResponse.json({ ok: true });
}
