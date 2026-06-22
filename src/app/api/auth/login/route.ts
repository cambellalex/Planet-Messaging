/**
 * POST /api/auth/login
 *
 * Body: { email, password }
 *
 * 1. Rate-limits repeated attempts per IP+email
 * 2. Looks up user by email and verifies password with verifyPassword()
 * 3. Creates a signed session cookie
 * 4. Returns { userId, orgId }
 *
 * Always returns a generic "invalid credentials" error so the response
 * cannot be used to enumerate which emails have an account.
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyPassword } from '@/lib/auth';
import { db } from '@/lib/db';
import { createSession } from '@/lib/auth/session';
import { checkLoginRateLimit, resetLoginRateLimit } from '@/lib/auth/rate-limit';

const INVALID_CREDENTIALS = { error: 'Invalid email or password.' };

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json() as { email: string; password: string };

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
    }

    const normalisedEmail = email.trim().toLowerCase();
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const rateLimitKey = `${ip}:${normalisedEmail}`;

    const { allowed, retryAfterMs } = checkLoginRateLimit(rateLimitKey);
    if (!allowed) {
      return NextResponse.json(
        { error: 'Too many login attempts. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil(retryAfterMs / 1000)) } },
      );
    }

    const user = await db.user.findUnique({ where: { email: normalisedEmail } });
    if (!user) {
      return NextResponse.json(INVALID_CREDENTIALS, { status: 401 });
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json(INVALID_CREDENTIALS, { status: 401 });
    }

    resetLoginRateLimit(rateLimitKey);
    await createSession(user.id, user.organisationId);

    return NextResponse.json({ userId: user.id, orgId: user.organisationId });
  } catch (err) {
    console.error('[/api/auth/login]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
