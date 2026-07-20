import { NextRequest, NextResponse } from 'next/server';
import { getSessionPayload } from '@/lib/auth/session';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  const session = await getSessionPayload();
  if (!session?.userId) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const days = Math.min(Math.max(parseInt(searchParams.get('days') ?? '30', 10), 1), 730);
  const campaignId = searchParams.get('campaignId') ?? undefined;

  const since = new Date();
  since.setDate(since.getDate() - days);
  since.setHours(0, 0, 0, 0);

  const messages = await db.message.findMany({
    where: {
      organisationId: session.orgId,
      direction: 'outbound',
      createdAt: { gte: since },
      ...(campaignId ? { campaignId } : {}),
    },
    select: { status: true },
  });

  const counts: Record<string, number> = { sent: 0, delivered: 0, failed: 0, other: 0 };
  for (const msg of messages) {
    if (msg.status === 'delivered') counts.delivered++;
    else if (msg.status === 'failed' || msg.status === 'undelivered') counts.failed++;
    else if (msg.status === 'sent' || msg.status === 'queued' || msg.status === 'accepted') counts.sent++;
    else counts.other++;
  }

  return NextResponse.json([
    { status: 'Delivered', count: counts.delivered },
    { status: 'Sent / Pending', count: counts.sent + counts.other },
    { status: 'Failed', count: counts.failed },
  ]);
}
