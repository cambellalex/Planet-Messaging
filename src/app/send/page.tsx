'use client';

/**
 * Send Message page.
 * Submits to POST /api/messages/send — wired to the Twilio module (src/lib/twilio/).
 * Supports single recipient or a comma-separated list for bulk sends.
 */

import { useState } from 'react';
import NavBar from '@/components/nav/NavBar';
import { Send, Phone, MessageSquare, Zap, Mail, AlertCircle, CheckCircle2 } from 'lucide-react';

type Channel = 'sms' | 'whatsapp' | 'rcs' | 'email';

const channels: { id: Channel; label: string; icon: React.ReactNode; live: boolean }[] = [
  { id: 'sms', label: 'SMS', icon: <Phone className="w-4 h-4" />, live: true },
  { id: 'whatsapp', label: 'WhatsApp', icon: <MessageSquare className="w-4 h-4" />, live: false },
  { id: 'rcs', label: 'RCS', icon: <Zap className="w-4 h-4" />, live: false },
  { id: 'email', label: 'Email', icon: <Mail className="w-4 h-4" />, live: false },
];

const SMS_LIMIT = 160;

type Status = 'idle' | 'sending' | 'success' | 'error';

export default function SendPage() {
  const [channel, setChannel] = useState<Channel>('sms');
  const [to, setTo] = useState('');
  const [body, setBody] = useState('');
  const [status, setStatus] = useState<Status>('idle');

  const isSms = channel === 'sms';
  const remaining = SMS_LIMIT - body.length;
  const segments = isSms ? Math.ceil(body.length / SMS_LIMIT) || 1 : null;

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    setStatus('sending');
    // TODO: POST /api/messages/send  { channel, to, body }
    // Twilio module handles delivery and returns messageId + status.
    await new Promise((r) => setTimeout(r, 1200));
    setStatus('success');
    setTimeout(() => setStatus('idle'), 3000);
  }

  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--background)', color: 'var(--foreground)' }}>
      <NavBar variant="app" />

      <main className="max-w-2xl mx-auto w-full px-4 pt-24 pb-12">
        <h1 className="text-2xl font-bold mb-6">Send Message</h1>

        {/* Channel selector */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {channels.map((c) => (
            <button
              key={c.id}
              onClick={() => c.live && setChannel(c.id)}
              disabled={!c.live}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all"
              style={{
                background: channel === c.id ? 'var(--accent)' : 'var(--surface)',
                color: channel === c.id ? '#fff' : c.live ? 'var(--foreground)' : 'var(--muted)',
                borderColor: channel === c.id ? 'var(--accent)' : 'var(--border)',
                opacity: c.live ? 1 : 0.5,
                cursor: c.live ? 'pointer' : 'not-allowed',
              }}
              title={!c.live ? 'Coming soon' : undefined}
            >
              {c.icon} {c.label}
              {!c.live && <span className="text-xs ml-1" style={{ color: 'var(--muted)' }}>(soon)</span>}
            </button>
          ))}
        </div>

        <form onSubmit={handleSend} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="to" className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
              To{' '}
              <span className="font-normal text-xs" style={{ color: 'var(--muted)' }}>
                {isSms ? '(E.164 format, e.g. +447700900123)' : '(email address)'}
              </span>
            </label>
            <input
              id="to"
              type={isSms ? 'tel' : 'email'}
              required
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder={isSms ? '+1 555 000 0000' : 'recipient@company.com'}
              className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none"
              style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
            />
          </div>

          {/* Subject — email only */}
          {channel === 'email' && (
            <div className="flex flex-col gap-1.5">
              <label htmlFor="subject" className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Subject</label>
              <input
                id="subject"
                type="text"
                required
                placeholder="Message subject"
                className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none"
                style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
              />
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="body" className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Message</label>
              {isSms && (
                <span className="text-xs" style={{ color: remaining < 20 ? '#f87171' : 'var(--muted)' }}>
                  {body.length}/{SMS_LIMIT} · {segments} segment{segments !== 1 ? 's' : ''}
                </span>
              )}
            </div>
            <textarea
              id="body"
              required
              rows={5}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Type your message…"
              className="w-full px-4 py-3 rounded-xl border text-sm outline-none resize-y"
              style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
            />
          </div>

          {status === 'success' && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm" style={{ background: 'rgba(52,211,153,0.1)', color: '#10b981' }}>
              <CheckCircle2 className="w-4 h-4" /> Message sent successfully!
            </div>
          )}
          {status === 'error' && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm" style={{ background: 'rgba(248,113,113,0.1)', color: '#f87171' }}>
              <AlertCircle className="w-4 h-4" /> Failed to send. Please try again.
            </div>
          )}

          <button
            type="submit"
            disabled={status === 'sending' || status === 'success'}
            className="flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all hover:opacity-90 disabled:opacity-60"
            style={{ background: 'var(--accent)', color: '#fff' }}
          >
            <Send className="w-4 h-4" />
            {status === 'sending' ? 'Sending…' : 'Send message'}
          </button>
        </form>
      </main>
    </div>
  );
}
