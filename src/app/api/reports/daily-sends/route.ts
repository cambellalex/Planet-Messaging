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
    select: { createdAt: true, status: true },
    orderBy: { createdAt: 'asc' },
  });

  // Group by date (YYYY-MM-DD)
  const byDate: Record<string, { date: string; sent: number; delivered: number; failed: number }> = {};

  // Pre-fill every day in range with zeros
  for (let i = 0; i <= days; i++) {
    const d = new Date(since);
    d.setDate(since.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    byDate[key] = { date: key, sent: 0, delivered: 0, failed: 0 };
  }

  for (const msg of messages) {
    const key = msg.createdAt.toISOString().slice(0, 10);
    if (!byDate[key]) continue;
    byDate[key].sent++;
    if (msg.status === 'delivered') byDate[key].delivered++;
    else if (msg.status === 'failed' || msg.status === 'undelivered') byDate[key].failed++;
  }

  return NextResponse.json(Object.values(byDate));
}
