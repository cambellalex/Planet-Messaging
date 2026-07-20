import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getOrgFromApiKey } from '@/lib/api-auth';
import { mergePricing } from '@/lib/pricing';

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

  const organisation = await db.organisation.findUnique({
    where: { id: org.orgId },
    select: { id: true, name: true, plan: true, pricingConfig: true, createdAt: true },
  });
  if (!organisation) return NextResponse.json({ error: 'Organisation not found' }, { status: 404, headers: CORS });

  const pricing = mergePricing(organisation.pricingConfig);

  return NextResponse.json({
    id: organisation.id,
    name: organisation.name,
    plan: organisation.plan,
    pricing,
    createdAt: organisation.createdAt,
  }, { headers: CORS });
}
