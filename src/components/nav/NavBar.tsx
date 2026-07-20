'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Menu, X, MessageCircle } from 'lucide-react';

interface NavBarProps {
  variant?: 'home' | 'app';
}

export default function NavBar({ variant = 'home' }: NavBarProps) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  async function handleSignOut() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  }

  const appLinks = [
    { href: '/inbox', label: 'Inbox' },
    { href: '/send', label: 'Send' },
    { href: '/contacts', label: 'Contacts' },
    { href: '/channels', label: 'Channels' },
    { href: '/reports', label: 'Reports' },
  ];

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 border-b"
      style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 font-bold text-lg" style={{ color: 'var(--foreground)' }}>
            <MessageCircle className="w-7 h-7" style={{ color: 'var(--accent)' }} />
            <span>Planet Messaging</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6">
            {variant === 'app' &&
              appLinks.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="text-sm font-medium transition-colors hover:opacity-80"
                  style={{ color: 'var(--muted)' }}
                >
                  {l.label}
                </Link>
              ))}
            {variant === 'home' && (
              <>
                <Link href="/explore" className="text-sm font-medium" style={{ color: 'var(--muted)' }}>
                  Explore
                </Link>
                <Link
                  href="/login"
                  className="text-sm font-medium px-4 py-2 rounded-lg border transition-colors hover:opacity-80"
                  style={{ color: 'var(--foreground)', borderColor: 'var(--border)' }}
                >
                  Log in
                </Link>
                <Link
                  href="/register"
                  className="text-sm font-medium px-4 py-2 rounded-lg transition-colors hover:opacity-90"
                  style={{ background: 'var(--accent)', color: '#fff' }}
                >
                  Create account
                </Link>
              </>
            )}
            {variant === 'app' && (
              <button
                type="button"
                onClick={handleSignOut}
                className="text-sm font-medium px-4 py-2 rounded-lg border transition-colors hover:opacity-80"
                style={{ color: 'var(--muted)', borderColor: 'var(--border)' }}
              >
                Sign out
              </button>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-md"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
            style={{ color: 'var(--foreground)' }}
          >
            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="md:hidden px-4 pb-4 border-t" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          {variant === 'app' && (
            <>
              {appLinks.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="block py-3 text-sm font-medium border-b"
                  style={{ color: 'var(--foreground)', borderColor: 'var(--border)' }}
                  onClick={() => setMenuOpen(false)}
                >
                  {l.label}
                </Link>
              ))}
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  handleSignOut();
                }}
                className="block w-full text-left py-3 text-sm font-medium"
                style={{ color: 'var(--muted)' }}
              >
                Sign out
              </button>
            </>
          )}
          {variant === 'home' && (
            <>
              <Link href="/explore" className="block py-3 text-sm border-b" style={{ color: 'var(--foreground)', borderColor: 'var(--border)' }}>
                Explore
              </Link>
              <Link href="/login" className="block py-3 text-sm border-b" style={{ color: 'var(--foreground)', borderColor: 'var(--border)' }}>
                Log in
              </Link>
              <Link href="/register" className="block py-3 text-sm font-semibold" style={{ color: 'var(--accent)' }}>
                Create account
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
