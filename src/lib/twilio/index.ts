import twilio from 'twilio';

export interface SendSmsOptions {
  to: string;
  body: string;
  mediaUrl?: string;
  from?: string;
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

export function createTwilioClient() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!accountSid || !authToken) {
    throw new Error('Missing TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN environment variables.');
  }

  return twilio(accountSid, authToken);
}

export async function sendSms(options: SendSmsOptions): Promise<TwilioMessage> {
  const client = createTwilioClient();
  const from = options.from ?? process.env.TWILIO_FROM_NUMBER;

  if (!from) throw new Error('No sender number configured. Set TWILIO_FROM_NUMBER.');

  const message = await client.messages.create({
    to: options.to,
    from,
    body: options.body,
    ...(options.mediaUrl ? { mediaUrl: [options.mediaUrl] } : {}),
  });

  return {
    sid: message.sid,
    status: message.status as TwilioMessage['status'],
    to: message.to,
    from: message.from,
    body: message.body,
    numSegments: parseInt(message.numSegments, 10),
    dateCreated: new Date(message.dateCreated),
  };
}

export async function sendWhatsApp(options: SendSmsOptions): Promise<TwilioMessage> {
  return sendSms({
    ...options,
    to: `whatsapp:${options.to}`,
    from: `whatsapp:${options.from ?? process.env.TWILIO_FROM_NUMBER}`,
  });
}

export function handleInboundWebhook(
  signature: string,
  url: string,
  params: Record<string, string>
): InboundMessage {
  const isValid = twilio.validateRequest(
    process.env.TWILIO_AUTH_TOKEN!,
    signature,
    url,
    params
  );
  if (!isValid) throw new Error('Invalid Twilio signature');

  const isWhatsApp = (params.To ?? '').startsWith('whatsapp:');
  const numMedia = parseInt(params.NumMedia ?? '0', 10);

  const mediaUrls: string[] = [];
  for (let i = 0; i < numMedia; i++) {
    if (params[`MediaUrl${i}`]) mediaUrls.push(params[`MediaUrl${i}`]);
  }

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

export async function getMessageStatus(messageSid: string): Promise<TwilioMessage['status']> {
  const client = createTwilioClient();
  const message = await client.messages(messageSid).fetch();
  return message.status as TwilioMessage['status'];
}
