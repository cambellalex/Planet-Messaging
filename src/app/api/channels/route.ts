import { NextResponse } from 'next/server';
import { getSessionPayload } from '@/lib/auth/session';
import { db } from '@/lib/db';

// GET /api/channels — returns { [channelId]: { [key]: value } } for the org
export async function GET() {
  const session = await getSessionPayload();
  if (!session?.orgId) return NextResponse.json({}, { status: 401 });

  const rows = await db.channel.findMany({
    where: { organisationId: session.orgId },
    select: { type: true, credentials: true },
  });

  const result: Record<string, Record<string, string>> = {};
  for (const row of rows) {
    result[row.type] = row.credentials as Record<string, string>;
  }

  return NextResponse.json(result);
}
