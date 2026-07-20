import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getOrgFromApiKey } from '@/lib/api-auth';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function GET(req: NextRequest) {
  const org = await getOrgFromApiKey(req);
  if (!org) return NextResponse.json({ error: 'Invalid or missing API key' }, { status: 401, headers: CORS });

  const days = Math.min(Math.max(parseInt(req.nextUrl.searchParams.get('days') ?? '30', 10), 1), 365);
  const since = new Date();
  since.setDate(since.getDate() - days);
  since.setHours(0, 0, 0, 0);

  const base = { organisationId: org.orgId, createdAt: { gte: since } };

  const [total, delivered, failed, inbound] = await Promise.all([
    db.message.count({ where: { ...base, direction: 'outbound' } }),
    db.message.count({ where: { ...base, direction: 'outbound', status: 'delivered' } }),
    db.message.count({ where: { ...base, direction: 'outbound', status: 'failed' } }),
    db.message.count({ where: { ...base, direction: 'inbound' } }),
  ]);

  return NextResponse.json({
    period: { days, since: since.toISOString() },
    outbound: { total, sent: total - failed, delivered, failed },
    inbound,
  }, { headers: CORS });
}
