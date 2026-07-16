import { NextRequest, NextResponse } from 'next/server';
import { validateWebhookSignature, parseInbound } from '@/lib/twilio';
import { db } from '@/lib/db';

const TWIML_OK = '<?xml version="1.0" encoding="UTF-8"?><Response></Response>';

function twiml(status = 200) {
  return new NextResponse(TWIML_OK, {
    status,
    headers: { 'Content-Type': 'text/xml' },
  });
}

export async function POST(req: NextRequest) {
  const params = Object.fromEntries((await req.formData()).entries()) as Record<string, string>;
  const signature = req.headers.get('x-twilio-signature') ?? '';
  const url = req.url;

  if (!validateWebhookSignature(signature, url, params)) {
    return twiml(403);
  }

  try {
    const inbound = parseInbound(params);

    const channel = await db.channel.findFirst({
      where: { organisationId: { not: undefined }, type: inbound.channel },
      select: { organisationId: true },
    });

    const orgId = channel?.organisationId ?? process.env.DEFAULT_ORG_ID ?? '';

    await db.message.create({
      data: {
        direction: 'inbound',
        channel: inbound.channel,
        from: inbound.from,
        to: inbound.to,
        body: inbound.body,
        status: 'received',
        twilioSid: inbound.sid,
        organisationId: orgId,
      },
    });

    return twiml();
  } catch (err) {
    console.error('[/api/webhooks/twilio]', err);
    return twiml(); // Always 200 — Twilio retries on non-200
  }
}
