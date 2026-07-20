import { NextRequest, NextResponse } from 'next/server';
import { decrypt } from '@/lib/auth/session-edge';

const PROTECTED_ROUTES = ['/inbox', '/send', '/contacts', '/channels', '/reports', '/settings', '/billing', '/faq', '/developer'];
const AUTH_ROUTES = ['/login', '/register'];

export async function proxy(req: NextRequest) {
  try {
    const path = req.nextUrl.pathname;
    const isProtectedRoute = PROTECTED_ROUTES.some((route) => path.startsWith(route));
    const isAuthRoute = AUTH_ROUTES.some((route) => path.startsWith(route));

    if (!isProtectedRoute && !isAuthRoute) {
      return NextResponse.next();
    }

    const cookie = req.cookies.get('session')?.value;
    const session = await decrypt(cookie);

    if (isProtectedRoute && !session?.userId) {
      return NextResponse.redirect(new URL('/login', req.nextUrl));
    }

    if (isAuthRoute && session?.userId) {
      return NextResponse.redirect(new URL('/inbox', req.nextUrl));
    }

    return NextResponse.next();
  } catch {
    // Never let the proxy crash — an unhandled error would return 500 to the user.
    // On unexpected failure, redirect unauthenticated-looking requests to login.
    const path = req.nextUrl.pathname;
    const isProtected = PROTECTED_ROUTES.some((r) => path.startsWith(r));
    if (isProtected) return NextResponse.redirect(new URL('/login', req.nextUrl));
    return NextResponse.next();
  }
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
};
