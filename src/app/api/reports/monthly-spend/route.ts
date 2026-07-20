import { NextRequest, NextResponse } from 'next/server';
import { getSessionPayload } from '@/lib/auth/session';
import { db } from '@/lib/db';
import { mergePricing, messageCost } from '@/lib/pricing';

export async function GET(req: NextRequest) {
  const session = await getSessionPayload();
  if (!session?.userId) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const months = Math.min(Math.max(parseInt(searchParams.get('months') ?? '12', 10), 1), 36);
  const campaignId = searchParams.get('campaignId') ?? undefined;

  // Load org pricing config
  const org = await db.organisation.findUnique({
    where: { id: session.orgId },
    select: { pricingConfig: true },
  });
  const pricing = mergePricing(org?.pricingConfig);

  const since = new Date();
  since.setMonth(since.getMonth() - months);
  since.setDate(1);
  since.setHours(0, 0, 0, 0);

  const messages = await db.message.findMany({
    where: {
      organisationId: session.orgId,
      direction: 'outbound',
      status: { not: 'failed' },
      createdAt: { gte: since },
      ...(campaignId ? { campaignId } : {}),
    },
    select: { channel: true, body: true, createdAt: true },
  });

  // Build month buckets (YYYY-MM) — zero-filled
  const buckets: Record<string, { month: string; messages: number; cost: number }> = {};
  for (let i = 0; i <= months; i++) {
    const d = new Date();
    d.setMonth(d.getMonth() - months + i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    buckets[key] = { month: key, messages: 0, cost: 0 };
  }

  for (const msg of messages) {
    const key = msg.createdAt.toISOString().slice(0, 7);
    if (!buckets[key]) continue;
    buckets[key].messages++;
    buckets[key].cost = +(buckets[key].cost + messageCost(msg.channel, msg.body, pricing)).toFixed(4);
  }

  return NextResponse.json({
    currency: pricing.currency,
    data: Object.values(buckets),
  });
}
