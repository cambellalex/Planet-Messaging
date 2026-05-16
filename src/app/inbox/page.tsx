'use client';

/**
 * Inbox — receives messages from all channels.
 * Data fetching: GET /api/messages?type=inbound
 * Real-time updates via WebSocket / polling (wired to Twilio webhooks).
 */

import { useState } from 'react';
import NavBar from '@/components/nav/NavBar';
import { Phone, MessageSquare, Mail, Search, RefreshCw, ChevronRight } from 'lucide-react';

type Channel = 'all' | 'sms' | 'whatsapp' | 'email';

const channelIcon: Record<string, React.ReactNode> = {
  sms: <Phone className="w-4 h-4" />,
  whatsapp: <MessageSquare className="w-4 h-4" />,
  email: <Mail className="w-4 h-4" />,
};

const mockMessages = [
  { id: '1', from: '+1 555 234 5678', channel: 'sms', body: 'Hey, I need to reschedule my appointment.', time: '10:42 AM', read: false },
  { id: '2', from: 'alice@acme.com', channel: 'email', body: 'Following up on our earlier conversation about the enterprise plan.', time: '9:15 AM', read: false },
  { id: '3', from: '+44 7700 900 123', channel: 'sms', body: 'Order #4821 confirmed. Thanks!', time: 'Yesterday', read: true },
  { id: '4', from: '+1 555 876 5432', channel: 'sms', body: 'Can you send me the pricing info?', time: 'Yesterday', read: true },
  { id: '5', from: 'bob@globex.com', channel: 'email', body: 'Please find the signed contract attached.', time: 'Mon', read: true },
];

export default function InboxPage() {
  const [filter, setFilter] = useState<Channel>('all');
  const [search, setSearch] = useState('');

  const visible = mockMessages.filter((m) => {
    if (filter !== 'all' && m.channel !== filter) return false;
    if (search && !m.from.includes(search) && !m.body.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--background)', color: 'var(--foreground)' }}>
      <NavBar variant="app" />

      <main className="max-w-4xl mx-auto w-full px-4 pt-24 pb-12">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Inbox</h1>
          <button className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border hover:opacity-80"
            style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}>
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--muted)' }} />
          <input
            type="search"
            placeholder="Search messages or senders…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm outline-none"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
          />
        </div>

        {/* Channel filter tabs */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          {(['all', 'sms', 'whatsapp', 'email'] as Channel[]).map((c) => (
            <button
              key={c}
              onClick={() => setFilter(c)}
              className="px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap border transition-all"
              style={{
                background: filter === c ? 'var(--accent)' : 'var(--surface)',
                color: filter === c ? '#fff' : 'var(--muted)',
                borderColor: filter === c ? 'var(--accent)' : 'var(--border)',
              }}
            >
              {c.charAt(0).toUpperCase() + c.slice(1)}
            </button>
          ))}
        </div>

        {/* Message list */}
        <div className="flex flex-col gap-2">
          {visible.length === 0 && (
            <p className="text-center py-12 text-sm" style={{ color: 'var(--muted)' }}>No messages found.</p>
          )}
          {visible.map((msg) => (
            <div
              key={msg.id}
              className="flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-all hover:opacity-90"
              style={{
                background: msg.read ? 'var(--surface)' : 'rgba(59,130,246,0.06)',
                borderColor: msg.read ? 'var(--border)' : 'var(--accent)',
              }}
            >
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ background: 'rgba(59,130,246,0.12)', color: 'var(--accent)' }}
              >
                {channelIcon[msg.channel] ?? <Phone className="w-4 h-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-sm truncate" style={{ color: msg.read ? 'var(--muted)' : 'var(--foreground)' }}>
                    {msg.from}
                  </span>
                  <span className="text-xs flex-shrink-0" style={{ color: 'var(--muted)' }}>{msg.time}</span>
                </div>
                <p className="text-sm truncate mt-0.5" style={{ color: 'var(--muted)' }}>{msg.body}</p>
              </div>
              <ChevronRight className="w-4 h-4 flex-shrink-0 self-center" style={{ color: 'var(--muted)' }} />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
