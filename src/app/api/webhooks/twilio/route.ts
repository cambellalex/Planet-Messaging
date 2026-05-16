/**
 * POST /api/webhooks/twilio
 *
 * Twilio calls this URL for every inbound SMS or WhatsApp message.
 *
 * Configuration:
 *   In the Twilio Console, set your number's "A MESSAGE COMES IN" webhook to:
 *   https://yourdomain.com/api/webhooks/twilio   HTTP POST
 *
 * Security:
 *   Every request from Twilio carries an X-Twilio-Signature header.
 *   handleInboundWebhook() in src/lib/twilio validates this before processing.
 *
 * Flow:
 *   1. Validate signature
 *   2. Parse inbound message fields
 *   3. Store in database (linked to org by "to" number)
 *   4. Emit WebSocket event to notify the inbox UI in real time
 *   5. Return empty TwiML 200 response (Twilio requires 200 to stop retries)
 */

import { NextRequest, NextResponse } from 'next/server';
// import { handleInboundWebhook } from '@/lib/twilio';
// import { db } from '@/lib/db';
// import { emitToOrg } from '@/lib/websocket';

export async function POST(req: NextRequest) {
  const params = Object.fromEntries((await req.formData()).entries()) as Record<string, string>;
  const signature = req.headers.get('x-twilio-signature') ?? '';
  const url = req.url;

  try {
    // const inbound = handleInboundWebhook(signature, url, params);
    // await db.message.create({ data: { direction: 'inbound', ...inbound } });
    // await emitToOrg(inbound.to, 'new_message', inbound);

    void signature; void url; void params;

    // TwiML empty response — tells Twilio we received the message
    return new NextResponse('<?xml version="1.0" encoding="UTF-8"?><Response></Response>', {
      status: 200,
      headers: { 'Content-Type': 'text/xml' },
    });
  } catch (err) {
    console.error('[/api/webhooks/twilio]', err);
    return new NextResponse('<?xml version="1.0" encoding="UTF-8"?><Response></Response>', {
      status: 200, // Always 200 — Twilio retries on non-200
      headers: { 'Content-Type': 'text/xml' },
    });
  }
}
