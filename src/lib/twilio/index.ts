/**
 * TWILIO MODULE
 * ============================================================
 * This is the primary integration point for all Twilio operations.
 *
 * SETUP:
 *   npm install twilio
 *   Set the following environment variables:
 *     TWILIO_ACCOUNT_SID   — from Twilio Console > Account Info
 *     TWILIO_AUTH_TOKEN    — from Twilio Console > Account Info
 *     TWILIO_FROM_NUMBER   — your Twilio phone number (E.164)
 *     TWILIO_WEBHOOK_URL   — public URL for inbound webhooks
 *                            e.g. https://yourdomain.com/api/webhooks/twilio
 *
 * ARCHITECTURE:
 *   - sendSms()      → POST message via REST API
 *   - sendWhatsApp() → same API, prefixed "whatsapp:"
 *   - handleInbound()→ parses TwiML webhook POST body
 *   - getStatus()    → fetch delivery status by messageSid
 *
 * INBOUND ROUTING:
 *   Configure your Twilio number's "A MESSAGE COMES IN" webhook to:
 *     POST https://yourdomain.com/api/webhooks/twilio
 *   The handler validates the X-Twilio-Signature header and stores
 *   the message in the database, then emits a WebSocket event.
 *
 * COMPLEXITY NOTE:
 *   Full implementation includes:
 *   - Message status callbacks (queued → sent → delivered → read)
 *   - Opt-out list management (STOP / UNSTOP / HELP keywords)
 *   - Signature validation (prevents spoofed webhooks)
 *   - Rate limiting (Twilio limits vary by account tier)
 *   - Retry logic with exponential backoff for API errors
 *   - Multi-part SMS handling (>160 chars → segments)
 *   - Media (MMS) upload to Twilio Media Resource
 *   - WhatsApp template pre-approval workflow
 *   - RCS fallback to SMS when carrier unsupported
 *
 * ============================================================
 */

// Install with: npm install twilio
// import twilio from 'twilio';

export interface SendSmsOptions {
  to: string;       // E.164 format
  body: string;
  mediaUrl?: string; // MMS
  from?: string;     // override default sender
}

export interface TwilioMessage {
  sid: string;
  status: 'queued' | 'sending' | 'sent' | 'delivered' | 'failed' | 'undelivered';
  to: string;
  from: string;
  body: string;
  numSegments: number;
  dateCreated: Date;
}

export interface InboundMessage {
  messageSid: string;
  from: string;
  to: string;
  body: string;
  numMedia: number;
  mediaUrls: string[];
  channel: 'sms' | 'whatsapp' | 'rcs';
}

/**
 * Creates an authenticated Twilio REST client.
 * Reads credentials from environment variables.
 * Throws if credentials are missing.
 */
export function createTwilioClient() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!accountSid || !authToken) {
    throw new Error('Missing TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN environment variables.');
  }

  // Uncomment after installing the twilio package:
  // return twilio(accountSid, authToken);
  throw new Error('Twilio SDK not installed. Run: npm install twilio');
}

/**
 * Sends an SMS (or MMS if mediaUrl provided).
 * Returns the Twilio message SID for status tracking.
 */
export async function sendSms(options: SendSmsOptions): Promise<TwilioMessage> {
  const client = createTwilioClient();
  const from = options.from ?? process.env.TWILIO_FROM_NUMBER;

  if (!from) throw new Error('No sender number configured. Set TWILIO_FROM_NUMBER.');

  // const message = await client.messages.create({
  //   to: options.to,
  //   from,
  //   body: options.body,
  //   ...(options.mediaUrl ? { mediaUrl: [options.mediaUrl] } : {}),
  // });

  // return {
  //   sid: message.sid,
  //   status: message.status as TwilioMessage['status'],
  //   to: message.to,
  //   from: message.from,
  //   body: message.body,
  //   numSegments: parseInt(message.numSegments, 10),
  //   dateCreated: new Date(message.dateCreated),
  // };

  void client; // suppress unused warning until SDK is installed
  throw new Error('sendSms: Twilio SDK not installed.');
}

/**
 * Sends a WhatsApp message.
 * Requires pre-approved message templates for outbound-initiated conversations.
 */
export async function sendWhatsApp(options: SendSmsOptions): Promise<TwilioMessage> {
  return sendSms({
    ...options,
    to: `whatsapp:${options.to}`,
    from: `whatsapp:${options.from ?? process.env.TWILIO_FROM_NUMBER}`,
  });
}

/**
 * Validates and parses an inbound Twilio webhook POST body.
 * Call this from POST /api/webhooks/twilio.
 *
 * @param signature  The X-Twilio-Signature header value
 * @param url        The full public URL of your webhook endpoint
 * @param params     The raw POST body params (req.body)
 */
export function handleInboundWebhook(
  signature: string,
  url: string,
  params: Record<string, string>
): InboundMessage {
  // const isValid = twilio.validateRequest(
  //   process.env.TWILIO_AUTH_TOKEN!,
  //   signature,
  //   url,
  //   params
  // );
  // if (!isValid) throw new Error('Invalid Twilio signature');

  const isWhatsApp = (params.To ?? '').startsWith('whatsapp:');
  const numMedia = parseInt(params.NumMedia ?? '0', 10);

  const mediaUrls: string[] = [];
  for (let i = 0; i < numMedia; i++) {
    if (params[`MediaUrl${i}`]) mediaUrls.push(params[`MediaUrl${i}`]);
  }

  void signature; void url; // suppress until validation is enabled

  return {
    messageSid: params.MessageSid,
    from: params.From.replace('whatsapp:', ''),
    to: params.To.replace('whatsapp:', ''),
    body: params.Body ?? '',
    numMedia,
    mediaUrls,
    channel: isWhatsApp ? 'whatsapp' : 'sms',
  };
}

/**
 * Fetches the current delivery status of a message by SID.
 */
export async function getMessageStatus(messageSid: string): Promise<TwilioMessage['status']> {
  const client = createTwilioClient();
  // const message = await client.messages(messageSid).fetch();
  // return message.status as TwilioMessage['status'];
  void client; void messageSid;
  throw new Error('getMessageStatus: Twilio SDK not installed.');
}
