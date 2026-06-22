/**
 * POST /api/auth/register
 *
 * Body: { firstName, lastName, email, password, companyName }
 *
 * 1. Validates all fields and password strength
 * 2. Creates org + user via createUser() (atomic transaction)
 * 3. Creates a signed session cookie
 * 4. Returns the new user's id/org id
 */

import { NextRequest, NextResponse } from 'next/server';
import { createUser } from '@/lib/auth';
import { createSession } from '@/lib/auth/session';

const PASSWORD_RULES: Array<[RegExp, string]> = [
  [/.{8,}/, 'Password must be at least 8 characters.'],
  [/[A-Z]/, 'Password must contain an uppercase letter.'],
  [/\d/, 'Password must contain a number.'],
];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      firstName: string; lastName: string;
      email: string; password: string; companyName: string;
    };

    const missing = ['firstName', 'lastName', 'email', 'password', 'companyName']
      .filter((k) => !body[k as keyof typeof body]);

    if (missing.length > 0) {
      return NextResponse.json({ error: `Missing fields: ${missing.join(', ')}` }, { status: 400 });
    }

    for (const [pattern, message] of PASSWORD_RULES) {
      if (!pattern.test(body.password)) {
        return NextResponse.json({ error: message }, { status: 400 });
      }
    }

    const email = body.email.trim().toLowerCase();

    let result;
    try {
      result = await createUser({ ...body, email });
    } catch (err) {
      if (err && typeof err === 'object' && 'code' in err && err.code === 'P2002') {
        return NextResponse.json({ error: 'An account with that email already exists.' }, { status: 409 });
      }
      throw err;
    }

    const { user, org } = result;
    await createSession(user.id, org.id);

    return NextResponse.json({ userId: user.id, orgId: org.id });
  } catch (err) {
    console.error('[/api/auth/register]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
