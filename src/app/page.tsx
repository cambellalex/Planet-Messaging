import Link from 'next/link';
import { MessageSquare, Mail, Phone, Zap, Shield, Globe } from 'lucide-react';
import NavBar from '@/components/nav/NavBar';
import GlobeRocket from '@/components/globe/GlobeRocket';

const channels = [
  { icon: Phone, label: 'SMS', desc: 'Reach anyone on any mobile phone instantly.', live: true },
  { icon: MessageSquare, label: 'WhatsApp', desc: 'Rich messaging with read receipts and media.', live: false },
  { icon: Zap, label: 'RCS', desc: 'Next-gen carrier messaging with interactive cards.', live: false },
  { icon: Mail, label: 'Email', desc: 'Professional email campaigns and notifications.', live: false },
];

const features = [
  { icon: Globe, title: 'Omnichannel inbox', desc: 'All your messages in one unified inbox, regardless of channel.' },
  { icon: Shield, title: 'Enterprise security', desc: 'SOC 2 compliant with end-to-end encryption and audit logs.' },
  { icon: Zap, title: 'Instant delivery', desc: 'Sub-second delivery with real-time status tracking via Twilio.' },
];

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--background)', color: 'var(--foreground)' }}>
      <NavBar variant="home" />

      {/* Hero */}
      <section className="flex flex-col items-center justify-center text-center px-6 pt-32 pb-24 gap-10">
        <GlobeRocket />

        <div className="max-w-2xl">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight mb-4">
            One platform.{' '}
            <span style={{ color: 'var(--accent)' }}>Every channel.</span>
          </h1>
          <p className="text-lg sm:text-xl leading-relaxed" style={{ color: 'var(--muted)' }}>
            Planet Messaging lets your business send and receive SMS, WhatsApp, RCS, and email
            from a single, powerful platform — so you can focus on the conversation, not the infrastructure.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mt-2">
          <Link
            href="/explore"
            className="px-8 py-3 rounded-xl border-2 font-semibold text-base transition-all hover:opacity-80"
            style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}
          >
            Explore features
          </Link>
          <Link
            href="/register"
            className="px-8 py-3 rounded-xl font-semibold text-base transition-all hover:opacity-90 shadow-lg"
            style={{ background: 'var(--accent)', color: '#fff' }}
          >
            Create free account
          </Link>
          <Link
            href="/login"
            className="px-8 py-3 rounded-xl border font-semibold text-base transition-all hover:opacity-80"
            style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
          >
            Log in
          </Link>
        </div>
      </section>

      {/* Channel cards */}
      <section className="px-6 py-16 max-w-6xl mx-auto w-full">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-10">
          Messaging channels
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {channels.map(({ icon: Icon, label, desc, live }) => (
            <div
              key={label}
              className="channel-card rounded-2xl p-6 border flex flex-col gap-3"
              style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ background: live ? 'rgba(59,130,246,0.12)' : 'rgba(100,116,139,0.1)' }}
              >
                <Icon className="w-6 h-6" style={{ color: live ? 'var(--accent)' : 'var(--muted)' }} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-lg">{label}</span>
                  {live ? (
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: 'rgba(52,211,153,0.15)', color: '#10b981' }}>
                      Live
                    </span>
                  ) : (
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: 'rgba(100,116,139,0.12)', color: 'var(--muted)' }}>
                      Coming soon
                    </span>
                  )}
                </div>
                <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Feature highlights */}
      <section className="px-6 py-16 max-w-6xl mx-auto w-full">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-10">
          Built for business
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          {features.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex flex-col items-center text-center gap-3">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{ background: 'rgba(59,130,246,0.1)' }}
              >
                <Icon className="w-7 h-7" style={{ color: 'var(--accent)' }} />
              </div>
              <h3 className="font-bold text-lg">{title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA banner */}
      <section className="px-6 py-16 text-center">
        <div
          className="max-w-3xl mx-auto rounded-3xl p-10 border"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <h2 className="text-2xl sm:text-3xl font-bold mb-3">Ready to launch?</h2>
          <p className="mb-6" style={{ color: 'var(--muted)' }}>
            Start sending messages in minutes. No credit card required.
          </p>
          <Link
            href="/register"
            className="inline-block px-8 py-3 rounded-xl font-semibold transition-all hover:opacity-90 shadow-lg"
            style={{ background: 'var(--accent)', color: '#fff' }}
          >
            Get started for free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t py-6 text-center text-sm" style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}>
        © {new Date().getFullYear()} Planet Messaging. All rights reserved.
      </footer>
    </div>
  );
}
