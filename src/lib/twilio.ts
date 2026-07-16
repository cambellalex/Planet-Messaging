import twilio from 'twilio';

function getClient() {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token) throw new Error('TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN must be set.');
  return twilio(sid, token);
}

function getFromNumber(channel: 'sms' | 'whatsapp'): string {
  const from = process.env.TWILIO_FROM_NUMBER;
  if (!from) throw new Error('TWILIO_FROM_NUMBER must be set.');
  return channel === 'whatsapp' ? `whatsapp:${from}` : from;
}

export interface SendResult {
  sid: string;
  status: string;
}

export async function sendSms(to: string, body: string): Promise<SendResult> {
  const msg = await getClient().messages.create({
    to,
    from: getFromNumber('sms'),
    body,
  });
  return { sid: msg.sid, status: msg.status };
}

export async function sendWhatsApp(to: string, body: string): Promise<SendResult> {
  const msg = await getClient().messages.create({
    to: `whatsapp:${to}`,
    from: getFromNumber('whatsapp'),
    body,
  });
  return { sid: msg.sid, status: msg.status };
}

export interface InboundMessage {
  sid: string;
  from: string;
  to: string;
  body: string;
  channel: 'sms' | 'whatsapp';
  numMedia: number;
}

export function validateWebhookSignature(
  signature: string,
  url: string,
  params: Record<string, string>,
): boolean {
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!token) return false;
  return twilio.validateRequest(token, signature, url, params);
}

export function parseInbound(params: Record<string, string>): InboundMessage {
  const from = params.From ?? '';
  const to = params.To ?? '';
  const isWhatsApp = from.startsWith('whatsapp:') || to.startsWith('whatsapp:');
  return {
    sid: params.MessageSid ?? '',
    from: from.replace('whatsapp:', ''),
    to: to.replace('whatsapp:', ''),
    body: params.Body ?? '',
    channel: isWhatsApp ? 'whatsapp' : 'sms',
    numMedia: parseInt(params.NumMedia ?? '0', 10),
  };
}
