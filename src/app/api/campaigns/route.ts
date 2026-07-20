import { NextRequest, NextResponse } from 'next/server';
import { getSessionPayload } from '@/lib/auth/session';
import { sendSms, sendWhatsApp, type TwilioCredentials } from '@/lib/twilio';
import { db } from '@/lib/db';

interface Recipient {
  name: string;
  phone?: string | null;
  email?: string | null;
}

interface CampaignBody {
  name: string;
  channel: string;
  body: string;
  recipients: {
    contactIds?: string[];
    groupNames?: string[];
    phones?: string[];
    adhocContacts?: Recipient[];
  };
}

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

export async function GET() {
  const session = await getSessionPayload();
  if (!session?.userId) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });

  const campaigns = await db.campaign.findMany({
    where: { organisationId: session.orgId },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(campaigns);
}

export async function POST(req: NextRequest) {
  const session = await getSessionPayload();
  if (!session?.userId) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });

  let body: CampaignBody;
  try {
    body = await req.json() as CampaignBody;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { name, channel, body: text, recipients } = body;
  if (!name?.trim()) return NextResponse.json({ error: 'Campaign name is required' }, { status: 400 });
  if (!channel) return NextResponse.json({ error: 'Channel is required' }, { status: 400 });
  if (!text?.trim()) return NextResponse.json({ error: 'Message body is required' }, { status: 400 });

  // ── Resolve all recipients into a deduped phone list ────────────────────────
  const allRecipients: Recipient[] = [];

  // From contact IDs
  if (recipients.contactIds?.length) {
    const contacts = await db.contact.findMany({
      where: { id: { in: recipients.contactIds }, organisationId: session.orgId },
      select: { name: true, phone: true, email: true },
    });
    allRecipients.push(...contacts);
  }

  // From group names
  if (recipients.groupNames?.length) {
    const contacts = await db.contact.findMany({
      where: { groupName: { in: recipients.groupNames }, organisationId: session.orgId },
      select: { name: true, phone: true, email: true },
    });
    allRecipients.push(...contacts);
  }

  // From raw phones
  for (const phone of recipients.phones ?? []) {
    if (phone.trim()) allRecipients.push({ name: phone.trim(), phone: phone.trim() });
  }

  // From ad-hoc uploaded contacts
  for (const c of recipients.adhocContacts ?? []) {
    allRecipients.push(c);
  }

  // Deduplicate by phone (or email for email channel)
  const seen = new Set<string>();
  const deduped = allRecipients.filter((r) => {
    const key = (channel === 'email' ? r.email : r.phone)?.trim().toLowerCase() ?? '';
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  if (deduped.length === 0) {
    return NextResponse.json({ error: 'No valid recipients found' }, { status: 400 });
  }

  const creds = await getTwilioCreds(session.orgId);
  if (!creds) {
    return NextResponse.json(
      { error: 'Twilio is not configured. Add credentials in Channels first.' },
      { status: 422 },
    );
  }

  // ── Create campaign record ────────────────────────────────────────────────────
  const campaign = await db.campaign.create({
    data: {
      name: name.trim(),
      channel,
      body: text.trim(),
      status: 'sending',
      totalCount: deduped.length,
      sentCount: 0,
      failedCount: 0,
      organisationId: session.orgId,
    },
  });

  // ── Send to each recipient ─────────────────────────────────────────────────
  let sentCount = 0;
  let failedCount = 0;

  await Promise.allSettled(
    deduped.map(async (recipient) => {
      const to = (channel === 'email' ? recipient.email : recipient.phone)?.trim() ?? '';
      if (!to) { failedCount++; return; }

      try {
        let result: { sid: string; status: string };
        if (channel === 'sms') {
          result = await sendSms(creds, to, text.trim());
        } else if (channel === 'whatsapp') {
          result = await sendWhatsApp(creds, to, text.trim());
        } else {
          failedCount++;
          return;
        }

        await db.message.create({
          data: {
            direction: 'outbound',
            channel,
            from: creds.fromNumber,
            to,
            body: text.trim(),
            status: result.status,
            twilioSid: result.sid,
            organisationId: session.orgId,
            campaignId: campaign.id,
          },
        });
        sentCount++;
      } catch {
        failedCount++;
        await db.message.create({
          data: {
            direction: 'outbound',
            channel,
            from: creds.fromNumber,
            to,
            body: text.trim(),
            status: 'failed',
            organisationId: session.orgId,
            campaignId: campaign.id,
          },
        });
      }
    }),
  );

  // ── Update campaign with final counts ─────────────────────────────────────
  const updated = await db.campaign.update({
    where: { id: campaign.id },
    data: {
      status: failedCount === deduped.length ? 'failed' : 'complete',
      sentCount,
      failedCount,
    },
  });

  return NextResponse.json(updated, { status: 201 });
}
