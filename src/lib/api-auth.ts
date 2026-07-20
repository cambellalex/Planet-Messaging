import { db } from '@/lib/db';

async function sha256hex(text: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function getOrgFromApiKey(req: Request): Promise<{ orgId: string } | null> {
  const auth = req.headers.get('authorization');
  if (!auth?.startsWith('Bearer pmk_')) return null;
  const key = auth.slice(7).trim();

  const hash = await sha256hex(key);
  const apiKey = await db.apiKey.findUnique({
    where: { keyHash: hash },
    select: { id: true, organisationId: true },
  });
  if (!apiKey) return null;

  // Fire-and-forget — don't block the response on this
  void db.apiKey.update({ where: { id: apiKey.id }, data: { lastUsedAt: new Date() } });

  return { orgId: apiKey.organisationId };
}
