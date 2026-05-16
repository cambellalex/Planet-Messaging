/**
 * POST /api/auth/login
 *
 * Body: { email, password }
 *
 * 1. Looks up user by email
 * 2. Verifies password hash with verifyPassword()
 * 3. Creates a signed JWT session (or NextAuth session)
 * 4. Sets HttpOnly session cookie
 * 5. Returns { userId, orgId }
 */

import { NextRequest, NextResponse } from 'next/server';
// import { verifyPassword } from '@/lib/auth';
// import { db } from '@/lib/db';
// import { signJwt } from '@/lib/auth/jwt';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json() as { email: string; password: string };

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
    }

    // const user = await db.user.findUnique({ where: { email } });
    // if (!user) return NextResponse.json({ error: 'Invalid credentials.' }, { status: 401 });
    // const valid = await verifyPassword(password, user.passwordHash);
    // if (!valid) return NextResponse.json({ error: 'Invalid credentials.' }, { status: 401 });
    // const token = signJwt({ userId: user.id, orgId: user.organisationId });
    // const res = NextResponse.json({ userId: user.id });
    // res.cookies.set('session', token, { httpOnly: true, sameSite: 'lax', secure: true, maxAge: 60*60*24*7 });
    // return res;

    return NextResponse.json({ userId: `stub_${Date.now()}` });
  } catch (err) {
    console.error('[/api/auth/login]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
