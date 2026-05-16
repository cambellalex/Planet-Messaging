/**
 * POST /api/messages/send
 *
 * Body: { channel: 'sms'|'whatsapp'|'rcs'|'email', to: string, body: string, subject?: string }
 *
 * 1. Validates the request (channel live, 'to' format, body length)
 * 2. Looks up the organisation's channel credentials (stored encrypted)
 * 3. Routes to the appropriate provider:
 *    - sms / whatsapp / rcs → src/lib/twilio
 *    - email                → SendGrid (future)
 * 4. Persists the outbound message record in the database
 * 5. Returns { messageId, status, channel, to }
 */

import { NextRequest, NextResponse } from 'next/server';
// import { sendSms, sendWhatsApp } from '@/lib/twilio';
// import { requireAuth } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    // const session = await requireAuth();   // throws 401 if not logged in
    const body = await req.json() as { channel: string; to: string; body: string; subject?: string };

    if (!body.channel || !body.to || !body.body) {
      return NextResponse.json({ error: 'channel, to, and body are required' }, { status: 400 });
    }

    // Route by channel
    // switch (body.channel) {
    //   case 'sms':
    //     const msg = await sendSms({ to: body.to, body: body.body });
    //     await db.message.create({ data: { ... } });
    //     return NextResponse.json({ messageId: msg.sid, status: msg.status });
    //   case 'whatsapp':
    //     ...
    // }

    // Placeholder response until Twilio is wired up
    return NextResponse.json({
      messageId: `stub_${Date.now()}`,
      status: 'queued',
      channel: body.channel,
      to: body.to,
    });
  } catch (err) {
    console.error('[/api/messages/send]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
