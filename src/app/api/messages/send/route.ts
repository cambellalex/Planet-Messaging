import { NextRequest, NextResponse } from 'next/server';
import { getSessionPayload } from '@/lib/auth/session';
import { sendSms, sendWhatsApp } from '@/lib/twilio';
import { db } from '@/lib/db';

export async function POST(req: NextRequest) {
  const session = await getSessionPayload();
  if (!session?.userId) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
  }

  let body: { channel: string; to: string; body: string };
  try {
    body = await req.json() as typeof body;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { channel, to, body: text } = body;
  if (!channel || !to || !text) {
    return NextResponse.json({ error: 'channel, to, and body are required' }, { status: 400 });
  }

  if (text.length > 1600) {
    return NextResponse.json({ error: 'Message body too long (max 1600 chars)' }, { status: 400 });
  }

  try {
    let result: { sid: string; status: string };

    if (channel === 'sms') {
      result = await sendSms(to, text);
    } else if (channel === 'whatsapp') {
      result = await sendWhatsApp(to, text);
    } else {
      return NextResponse.json({ error: `Channel '${channel}' is not yet supported` }, { status: 400 });
    }

    await db.message.create({
      data: {
        direction: 'outbound',
        channel,
        from: process.env.TWILIO_FROM_NUMBER ?? '',
        to,
        body: text,
        status: result.status,
        twilioSid: result.sid,
        organisationId: session.orgId,
      },
    });

    return NextResponse.json({ messageId: result.sid, status: result.status, channel, to });
  } catch (err) {
    console.error('[/api/messages/send]', err);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
