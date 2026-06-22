'use client';

/**
 * AUTH MODULE — Create Account
 * UI scaffold only. Account creation logic (email verification, org setup,
 * Stripe billing hooks) lives in src/lib/auth/.
 */

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { MessageCircle, Eye, EyeOff, Check } from 'lucide-react';

const passwordRules = [
  { label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
  { label: 'One uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
  { label: 'One number', test: (p: string) => /\d/.test(p) },
];

export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    const confirmPassword = formData.get('confirmPassword');
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (!passwordRules.every((rule) => rule.test(password))) {
      setError('Please satisfy all password requirements.');
      return;
    }

    setLoading(true);

    const payload = {
      firstName: formData.get('firstName'),
      lastName: formData.get('lastName'),
      companyName: formData.get('company'),
      email: formData.get('email'),
      password,
    };

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Unable to create your account. Please try again.');
        setLoading(false);
        return;
      }

      router.push('/inbox');
    } catch {
      setError('Unable to reach the server. Please try again.');
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-16"
      style={{ background: 'var(--background)' }}
    >
      <Link href="/" className="flex items-center gap-2 mb-8">
        <MessageCircle className="w-8 h-8" style={{ color: 'var(--accent)' }} />
        <span className="text-xl font-bold" style={{ color: 'var(--foreground)' }}>Planet Messaging</span>
      </Link>

      <div
        className="w-full max-w-md rounded-2xl border p-8 shadow-sm"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        <h1 className="text-2xl font-extrabold mb-1" style={{ color: 'var(--foreground)' }}>Create your account</h1>
        <p className="text-sm mb-6" style={{ color: 'var(--muted)' }}>
          Already have an account?{' '}
          <Link href="/login" className="font-medium hover:underline" style={{ color: 'var(--accent)' }}>
            Sign in
          </Link>
        </p>

        {error && (
          <p
            role="alert"
            className="text-sm mb-4 px-3 py-2 rounded-lg border"
            style={{ color: '#ef4444', borderColor: '#ef4444', background: 'rgba(239, 68, 68, 0.08)' }}
          >
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="firstName" className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                First name
              </label>
              <input
                id="firstName"
                name="firstName"
                type="text"
                required
                placeholder="Jane"
                className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none"
                style={{ background: 'var(--background)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="lastName" className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                Last name
              </label>
              <input
                id="lastName"
                name="lastName"
                type="text"
                required
                placeholder="Smith"
                className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none"
                style={{ background: 'var(--background)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="company" className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
              Company name
            </label>
            <input
              id="company"
              name="company"
              type="text"
              required
              placeholder="Acme Corp"
              className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none"
              style={{ background: 'var(--background)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
              Work email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@company.com"
              className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none"
              style={{ background: 'var(--background)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 pr-11 rounded-xl border text-sm outline-none"
                style={{ background: 'var(--background)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2"
                onClick={() => setShowPassword(!showPassword)}
                style={{ color: 'var(--muted)' }}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {/* Password strength hints */}
            {password.length > 0 && (
              <ul className="flex flex-col gap-1 mt-1">
                {passwordRules.map(({ label, test }) => (
                  <li key={label} className="flex items-center gap-1.5 text-xs">
                    <Check
                      className="w-3.5 h-3.5"
                      style={{ color: test(password) ? '#10b981' : 'var(--muted)' }}
                    />
                    <span style={{ color: test(password) ? '#10b981' : 'var(--muted)' }}>{label}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="confirmPassword" className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
              Confirm password
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type={showPassword ? 'text' : 'password'}
              required
              placeholder="••••••••"
              className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none"
              style={{ background: 'var(--background)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
            />
          </div>

          <label className="flex items-start gap-2 cursor-pointer mt-1">
            <input type="checkbox" required className="mt-0.5 accent-blue-500" />
            <span className="text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>
              I agree to the{' '}
              <Link href="/terms" className="hover:underline" style={{ color: 'var(--accent)' }}>Terms of Service</Link>
              {' '}and{' '}
              <Link href="/privacy" className="hover:underline" style={{ color: 'var(--accent)' }}>Privacy Policy</Link>.
            </span>
          </label>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full py-2.5 rounded-xl font-semibold text-sm transition-all hover:opacity-90 disabled:opacity-60"
            style={{ background: 'var(--accent)', color: '#fff' }}
          >
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>
      </div>
    </div>
  );
}
