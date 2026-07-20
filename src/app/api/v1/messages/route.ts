import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getOrgFromApiKey } from '@/lib/api-auth';
import { sendSms, sendWhatsApp } from '@/lib/twilio';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

async function getTwilioCreds(orgId: string) {
  const ch = await db.channel.findFirst({ where: { organisationId: orgId, type: 'sms' } });
  if (!ch) return null;
  const c = ch.credentials as Record<string, string>;
  if (!c.accountSid || !c.authToken || !c.fromNumber) return null;
  return c as { accountSid: string; authToken: string; fromNumber: string };
}

export async function POST(req: NextRequest) {
  const org = await getOrgFromApiKey(req);
  if (!org) return NextResponse.json({ error: 'Invalid or missing API key' }, { status: 401, headers: CORS });

  let body: { to?: string; channel?: string; body?: string };
  try { body = await req.json() as typeof body; } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400, headers: CORS });
  }

  const { to, channel = 'sms', body: text } = body;
  if (!to || !text) return NextResponse.json({ error: '`to` and `body` are required' }, { status: 422, headers: CORS });
  if (!['sms', 'whatsapp'].includes(channel)) return NextResponse.json({ error: 'channel must be sms or whatsapp' }, { status: 422, headers: CORS });
  if (text.length > 1600) return NextResponse.json({ error: 'body exceeds 1600 characters' }, { status: 422, headers: CORS });

  const creds = await getTwilioCreds(org.orgId);
  if (!creds) return NextResponse.json({ error: 'No channel configured for this organisation' }, { status: 503, headers: CORS });

  let sid: string | undefined;
  let status = 'queued';
  try {
    const result = channel === 'whatsapp'
      ? await sendWhatsApp(creds, to, text)
      : await sendSms(creds, to, text);
    sid = result.sid;
    status = result.status;
  } catch {
    status = 'failed';
  }

  const msg = await db.message.create({
    data: { direction: 'outbound', channel, from: creds.fromNumber, to, body: text, status, twilioSid: sid ?? null, organisationId: org.orgId },
    select: { id: true, direction: true, channel: true, from: true, to: true, body: true, status: true, twilioSid: true, createdAt: true },
  });

  return NextResponse.json(msg, { status: 201, headers: CORS });
}

export async function GET(req: NextRequest) {
  const org = await getOrgFromApiKey(req);
  if (!org) return NextResponse.json({ error: 'Invalid or missing API key' }, { status: 401, headers: CORS });

  const sp = req.nextUrl.searchParams;
  const limit  = Math.min(Math.max(parseInt(sp.get('limit')  ?? '50', 10), 1), 200);
  const offset = Math.max(parseInt(sp.get('offset') ?? '0', 10), 0);
  const direction = sp.get('direction') ?? undefined;
  const channel   = sp.get('channel')   ?? undefined;

  const messages = await db.message.findMany({
    where: {
      organisationId: org.orgId,
      ...(direction ? { direction } : {}),
      ...(channel   ? { channel }   : {}),
    },
    select: { id: true, direction: true, channel: true, from: true, to: true, body: true, status: true, twilioSid: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
    take: limit,
    skip: offset,
  });

  return NextResponse.json({ data: messages, limit, offset }, { headers: CORS });
}
