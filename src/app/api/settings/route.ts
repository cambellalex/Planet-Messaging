import { NextRequest, NextResponse } from 'next/server';
import { getSessionPayload } from '@/lib/auth/session';
import { db } from '@/lib/db';
import { mergePricing, DEFAULT_PRICING, type PricingConfig } from '@/lib/pricing';
import type { Prisma } from '@prisma/client';

export async function GET() {
  const session = await getSessionPayload();
  if (!session?.userId) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });

  const org = await db.organisation.findUnique({
    where: { id: session.orgId },
    select: { name: true, pricingConfig: true },
  });
  if (!org) return NextResponse.json({ error: 'Organisation not found' }, { status: 404 });

  return NextResponse.json({
    name: org.name,
    pricing: mergePricing(org.pricingConfig),
  });
}

export async function PATCH(req: NextRequest) {
  const session = await getSessionPayload();
  if (!session?.userId) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });

  let body: { pricing?: Partial<PricingConfig> };
  try {
    body = await req.json() as typeof body;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const org = await db.organisation.findUnique({
    where: { id: session.orgId },
    select: { pricingConfig: true },
  });
  const current = mergePricing(org?.pricingConfig);
  const updated: PricingConfig = { ...current, ...(body.pricing ?? {}) };

  // Validate numeric rates are positive
  const numericFields: (keyof PricingConfig)[] = ['smsPerSegment', 'whatsappPerMessage', 'rcsPerMessage', 'emailPerMessage'];
  for (const f of numericFields) {
    const v = updated[f] as number;
    if (typeof v !== 'number' || v < 0) updated[f as keyof typeof DEFAULT_PRICING] = DEFAULT_PRICING[f as keyof typeof DEFAULT_PRICING] as never;
  }

  await db.organisation.update({
    where: { id: session.orgId },
    data: { pricingConfig: updated as unknown as Prisma.InputJsonValue },
  });

  return NextResponse.json({ pricing: updated });
}
