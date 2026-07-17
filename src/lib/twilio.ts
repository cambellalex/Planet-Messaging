import twilio from 'twilio';

export interface TwilioCredentials {
  accountSid: string;
  authToken: string;
  fromNumber: string;
}

export interface SendResult {
  sid: string;
  status: string;
}

export async function sendSms(creds: TwilioCredentials, to: string, body: string): Promise<SendResult> {
  const client = twilio(creds.accountSid, creds.authToken);
  const msg = await client.messages.create({ to, from: creds.fromNumber, body });
  return { sid: msg.sid, status: msg.status };
}

export async function sendWhatsApp(creds: TwilioCredentials, to: string, body: string): Promise<SendResult> {
  const client = twilio(creds.accountSid, creds.authToken);
  const msg = await client.messages.create({
    to: `whatsapp:${to}`,
    from: `whatsapp:${creds.fromNumber}`,
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
  authToken: string,
  signature: string,
  url: string,
  params: Record<string, string>,
): boolean {
  return twilio.validateRequest(authToken, signature, url, params);
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
