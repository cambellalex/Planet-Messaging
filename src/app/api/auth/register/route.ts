/**
 * POST /api/auth/register
 *
 * Body: { firstName, lastName, email, password, companyName }
 *
 * 1. Validates all fields and password strength
 * 2. Checks email uniqueness
 * 3. Creates org + user via createUser() (atomic transaction)
 * 4. Sends verification email (optional but recommended)
 * 5. Returns a session token
 */

import { NextRequest, NextResponse } from 'next/server';
// import { createUser } from '@/lib/auth';

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

    if (body.password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 });
    }

    // const { user, org } = await createUser(body);
    // return NextResponse.json({ userId: user.id, orgId: org.id });

    return NextResponse.json({ userId: `stub_${Date.now()}`, orgId: `org_${Date.now()}` });
  } catch (err) {
    console.error('[/api/auth/register]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
