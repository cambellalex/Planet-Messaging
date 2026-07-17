import { NextRequest, NextResponse } from 'next/server';
import { getSessionPayload } from '@/lib/auth/session';
import { sendSms, sendWhatsApp, type TwilioCredentials } from '@/lib/twilio';
import { db } from '@/lib/db';

async function getTwilioCreds(orgId: string): Promise<TwilioCredentials | null> {
  const channel = await db.channel.findFirst({
    where: { organisationId: orgId, type: 'sms' },
    select: { credentials: true },
  });
  if (!channel) return null;
  const c = channel.credentials as Record<string, string>;
  if (!c.accountSid || !c.authToken || !c.fromNumber) return null;
  return { accountSid: c.accountSid, authToken: c.authToken, fromNumber: c.fromNumber };
}

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

  const creds = await getTwilioCreds(session.orgId);
  if (!creds) {
    return NextResponse.json(
      { error: 'Twilio is not configured. Go to Channels and add your Account SID, Auth Token, and phone number.' },
      { status: 422 },
    );
  }

  try {
    let result: { sid: string; status: string };

    if (channel === 'sms') {
      result = await sendSms(creds, to, text);
    } else if (channel === 'whatsapp') {
      result = await sendWhatsApp(creds, to, text);
    } else {
      return NextResponse.json({ error: `Channel '${channel}' is not yet supported` }, { status: 400 });
    }

    await db.message.create({
      data: {
        direction: 'outbound',
        channel,
        from: creds.fromNumber,
        to,
        body: text,
        status: result.status,
        twilioSid: result.sid,
        organisationId: session.orgId,
      },
    });

    return NextResponse.json({ messageId: result.sid, status: result.status, channel, to });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[/api/messages/send]', msg);
    return NextResponse.json({ error: `Twilio error: ${msg}` }, { status: 502 });
  }
}
