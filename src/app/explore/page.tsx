import Link from 'next/link';
import { Phone, MessageSquare, Zap, Mail, BarChart2, Lock, Globe, Users } from 'lucide-react';
import NavBar from '@/components/nav/NavBar';

const highlights = [
  {
    icon: Phone,
    title: 'SMS — Live now',
    desc: "Send individual or bulk SMS to any mobile number worldwide using Twilio's carrier network. Supports two-way messaging, delivery receipts, and opt-out management.",
    accent: true,
  },
  {
    icon: MessageSquare,
    title: 'WhatsApp Business',
    desc: 'Send rich template messages, images, files, and interactive buttons via the WhatsApp Business API. Perfect for order updates and customer support.',
    accent: false,
  },
  {
    icon: Zap,
    title: 'RCS Messaging',
    desc: 'Next-generation SMS with branded sender, carousels, suggested replies, and inline maps — delivered natively on Android.',
    accent: false,
  },
  {
    icon: Mail,
    title: 'Email Campaigns',
    desc: 'Transactional and marketing emails with template management, open tracking, and bounce handling, all through the same unified dashboard.',
    accent: false,
  },
  {
    icon: BarChart2,
    title: 'Analytics & Reporting',
    desc: 'Real-time delivery stats, open rates, reply rates, and cost summaries — broken down by channel, campaign, and contact segment.',
    accent: false,
  },
  {
    icon: Lock,
    title: 'Security & Compliance',
    desc: 'GDPR and TCPA compliance tools built in: consent tracking, opt-out lists, audit logs, and role-based access control.',
    accent: false,
  },
  {
    icon: Globe,
    title: 'Global Reach',
    desc: 'Twilio-powered delivery to 180+ countries with intelligent routing to maximise deliverability and minimise cost.',
    accent: false,
  },
  {
    icon: Users,
    title: 'Address Book',
    desc: 'Centralised contact management with tags, segments, custom fields, and import/export — shared across all messaging channels.',
    accent: false,
  },
];

export default function ExplorePage() {
  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--background)', color: 'var(--foreground)' }}>
      <NavBar variant="home" />

      <div className="max-w-6xl mx-auto w-full px-6 pt-28 pb-20">
        <div className="text-center mb-14">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4">
            Everything you need to{' '}
            <span style={{ color: 'var(--accent)' }}>message at scale</span>
          </h1>
          <p className="text-lg max-w-2xl mx-auto" style={{ color: 'var(--muted)' }}>
            Planet Messaging brings every channel, contact, and conversation into one clean platform — so your team moves faster.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {highlights.map(({ icon: Icon, title, desc, accent }) => (
            <div
              key={title}
              className="channel-card rounded-2xl p-6 border flex flex-col gap-4"
              style={{
                background: accent ? 'rgba(59,130,246,0.07)' : 'var(--surface)',
                borderColor: accent ? 'var(--accent)' : 'var(--border)',
              }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ background: accent ? 'rgba(59,130,246,0.15)' : 'rgba(100,116,139,0.1)' }}
              >
                <Icon className="w-6 h-6" style={{ color: accent ? 'var(--accent)' : 'var(--muted)' }} />
              </div>
              <div>
                <h3 className="font-bold text-lg mb-1">{title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>{desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-14">
          <Link
            href="/register"
            className="px-8 py-3 rounded-xl font-semibold text-base hover:opacity-90 shadow-lg text-center"
            style={{ background: 'var(--accent)', color: '#fff' }}
          >
            Create free account
          </Link>
          <Link
            href="/login"
            className="px-8 py-3 rounded-xl border font-semibold text-base hover:opacity-80 text-center"
            style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
          >
            Log in
          </Link>
        </div>
      </div>

      <footer className="mt-auto border-t py-6 text-center text-sm" style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}>
        © {new Date().getFullYear()} Planet Messaging. All rights reserved.
      </footer>
    </div>
  );
}
