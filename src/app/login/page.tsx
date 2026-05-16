'use client';

/**
 * AUTH MODULE — Login
 * This file is a UI scaffold. Authentication logic (session management, JWT,
 * password hashing, MFA) is implemented separately in src/lib/auth/.
 */

import Link from 'next/link';
import { useState } from 'react';
import { MessageCircle, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    // TODO: call POST /api/auth/login
    await new Promise((r) => setTimeout(r, 800));
    setLoading(false);
    // TODO: redirect to /inbox on success
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-16"
      style={{ background: 'var(--background)' }}
    >
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2 mb-8">
        <MessageCircle className="w-8 h-8" style={{ color: 'var(--accent)' }} />
        <span className="text-xl font-bold" style={{ color: 'var(--foreground)' }}>Planet Messaging</span>
      </Link>

      <div
        className="w-full max-w-md rounded-2xl border p-8 shadow-sm"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        <h1 className="text-2xl font-extrabold mb-1" style={{ color: 'var(--foreground)' }}>Welcome back</h1>
        <p className="text-sm mb-6" style={{ color: 'var(--muted)' }}>
          Don&apos;t have an account?{' '}
          <Link href="/register" className="font-medium hover:underline" style={{ color: 'var(--accent)' }}>
            Create one free
          </Link>
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@company.com"
              className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none focus:ring-2"
              style={{
                background: 'var(--background)',
                borderColor: 'var(--border)',
                color: 'var(--foreground)',
              }}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                Password
              </label>
              <Link href="/forgot-password" className="text-xs hover:underline" style={{ color: 'var(--accent)' }}>
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full px-4 py-2.5 pr-11 rounded-xl border text-sm outline-none focus:ring-2"
                style={{
                  background: 'var(--background)',
                  borderColor: 'var(--border)',
                  color: 'var(--foreground)',
                }}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                style={{ color: 'var(--muted)' }}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full py-2.5 rounded-xl font-semibold text-sm transition-all hover:opacity-90 disabled:opacity-60"
            style={{ background: 'var(--accent)', color: '#fff' }}
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="text-xs text-center mt-6" style={{ color: 'var(--muted)' }}>
          By signing in you agree to our{' '}
          <Link href="/terms" className="hover:underline" style={{ color: 'var(--accent)' }}>Terms</Link>
          {' '}and{' '}
          <Link href="/privacy" className="hover:underline" style={{ color: 'var(--accent)' }}>Privacy Policy</Link>.
        </p>
      </div>
    </div>
  );
}
