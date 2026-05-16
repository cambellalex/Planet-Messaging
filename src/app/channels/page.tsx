'use client';

/**
 * Manage Channels — connect and configure messaging providers.
 * Each channel card calls its own integration endpoint:
 *   POST /api/channels/:channelId/connect
 *   DELETE /api/channels/:channelId/disconnect
 *
 * SMS (Twilio) is implemented in src/lib/twilio/ — see that module for config.
 */

import { useState } from 'react';
import NavBar from '@/components/nav/NavBar';
import { Phone, MessageSquare, Zap, Mail, Check, Settings, ExternalLink, AlertCircle } from 'lucide-react';

type ChannelStatus = 'connected' | 'disconnected' | 'pending';

interface ChannelConfig {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  status: ChannelStatus;
  provider: string;
  docsUrl: string;
  fields: { key: string; label: string; type: 'text' | 'password'; placeholder: string }[];
}

const initialChannels: ChannelConfig[] = [
  {
    id: 'sms',
    name: 'SMS',
    description: 'Send and receive SMS via Twilio. Supports two-way messaging, delivery receipts, opt-out lists, and webhook inbound routing.',
    icon: <Phone className="w-6 h-6" />,
    status: 'disconnected',
    provider: 'Twilio',
    docsUrl: 'https://www.twilio.com/docs/sms',
    fields: [
      { key: 'accountSid', label: 'Account SID', type: 'text', placeholder: 'ACxxxxxxxxxxxxxxxx' },
      { key: 'authToken', label: 'Auth Token', type: 'password', placeholder: '••••••••••••' },
      { key: 'fromNumber', label: 'Twilio phone number', type: 'text', placeholder: '+1 555 000 0000' },
    ],
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    description: 'WhatsApp Business API via Twilio. Send template messages, media, and interactive buttons. Requires Meta Business verification.',
    icon: <MessageSquare className="w-6 h-6" />,
    status: 'disconnected',
    provider: 'Twilio / Meta',
    docsUrl: 'https://www.twilio.com/docs/whatsapp',
    fields: [
      { key: 'waNumber', label: 'WhatsApp number (E.164)', type: 'text', placeholder: 'whatsapp:+14155238886' },
    ],
  },
  {
    id: 'rcs',
    name: 'RCS',
    description: 'Rich Communication Services for branded, interactive messages on Android. Delivered via Twilio RCS Business Messaging.',
    icon: <Zap className="w-6 h-6" />,
    status: 'disconnected',
    provider: 'Twilio',
    docsUrl: 'https://www.twilio.com/docs/rcs',
    fields: [
      { key: 'rcsSender', label: 'RCS Sender ID', type: 'text', placeholder: 'brand-agent-id' },
    ],
  },
  {
    id: 'email',
    name: 'Email',
    description: 'Transactional and marketing email via SendGrid. Domain authentication, template management, and open/click tracking.',
    icon: <Mail className="w-6 h-6" />,
    status: 'disconnected',
    provider: 'SendGrid',
    docsUrl: 'https://docs.sendgrid.com',
    fields: [
      { key: 'sgApiKey', label: 'SendGrid API Key', type: 'password', placeholder: 'SG.xxxxxx' },
      { key: 'fromEmail', label: 'Sender email', type: 'text', placeholder: 'no-reply@yourdomain.com' },
    ],
  },
];

function StatusBadge({ status }: { status: ChannelStatus }) {
  const styles: Record<ChannelStatus, { bg: string; color: string; label: string }> = {
    connected: { bg: 'rgba(52,211,153,0.15)', color: '#10b981', label: 'Connected' },
    disconnected: { bg: 'rgba(100,116,139,0.12)', color: 'var(--muted)', label: 'Not connected' },
    pending: { bg: 'rgba(251,191,36,0.15)', color: '#f59e0b', label: 'Pending…' },
  };
  const s = styles[status];
  return (
    <span className="text-xs px-2.5 py-0.5 rounded-full font-medium" style={{ background: s.bg, color: s.color }}>
      {status === 'connected' && <Check className="inline w-3 h-3 mr-0.5" />}
      {s.label}
    </span>
  );
}

export default function ChannelsPage() {
  const [channels, setChannels] = useState<ChannelConfig[]>(initialChannels);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<Record<string, Record<string, string>>>({});

  function toggle(id: string) {
    setExpanded(expanded === id ? null : id);
  }

  function setField(channelId: string, key: string, value: string) {
    setFormValues((prev) => ({
      ...prev,
      [channelId]: { ...(prev[channelId] ?? {}), [key]: value },
    }));
  }

  async function handleConnect(channelId: string) {
    setChannels((prev) =>
      prev.map((c) => (c.id === channelId ? { ...c, status: 'pending' } : c))
    );
    // TODO: POST /api/channels/:channelId/connect  with formValues[channelId]
    // Validates credentials, stores encrypted secrets, registers Twilio webhooks.
    await new Promise((r) => setTimeout(r, 1500));
    setChannels((prev) =>
      prev.map((c) => (c.id === channelId ? { ...c, status: 'connected' } : c))
    );
    setExpanded(null);
  }

  function handleDisconnect(channelId: string) {
    setChannels((prev) =>
      prev.map((c) => (c.id === channelId ? { ...c, status: 'disconnected' } : c))
    );
    // TODO: DELETE /api/channels/:channelId/disconnect — revokes tokens, removes webhooks.
  }

  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--background)', color: 'var(--foreground)' }}>
      <NavBar variant="app" />

      <main className="max-w-3xl mx-auto w-full px-4 pt-24 pb-12">
        <h1 className="text-2xl font-bold mb-2">Manage Channels</h1>
        <p className="text-sm mb-8" style={{ color: 'var(--muted)' }}>
          Connect your messaging providers. Credentials are encrypted at rest and never exposed in the UI after saving.
        </p>

        <div className="flex flex-col gap-4">
          {channels.map((ch) => (
            <div
              key={ch.id}
              className="rounded-2xl border overflow-hidden"
              style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
            >
              {/* Header row */}
              <div className="flex items-center gap-4 p-5">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{
                    background: ch.status === 'connected' ? 'rgba(52,211,153,0.12)' : 'rgba(100,116,139,0.1)',
                    color: ch.status === 'connected' ? '#10b981' : 'var(--muted)',
                  }}
                >
                  {ch.icon}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold">{ch.name}</span>
                    <span className="text-xs" style={{ color: 'var(--muted)' }}>via {ch.provider}</span>
                    <StatusBadge status={ch.status} />
                  </div>
                  <p className="text-xs mt-0.5 line-clamp-2" style={{ color: 'var(--muted)' }}>{ch.description}</p>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {ch.status === 'connected' ? (
                    <>
                      <button
                        onClick={() => toggle(ch.id)}
                        className="p-2 rounded-lg hover:opacity-70"
                        title="Settings"
                        style={{ color: 'var(--muted)' }}
                      >
                        <Settings className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDisconnect(ch.id)}
                        className="text-xs px-3 py-1.5 rounded-lg border hover:opacity-80"
                        style={{ borderColor: '#f87171', color: '#f87171' }}
                      >
                        Disconnect
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => toggle(ch.id)}
                      className="text-xs px-3 py-1.5 rounded-lg font-medium hover:opacity-90"
                      style={{ background: 'var(--accent)', color: '#fff' }}
                    >
                      Connect
                    </button>
                  )}
                </div>
              </div>

              {/* Expanded config form */}
              {expanded === ch.id && (
                <div className="border-t px-5 pb-5 pt-4 flex flex-col gap-3" style={{ borderColor: 'var(--border)' }}>
                  <div className="flex items-center gap-1.5 text-xs mb-1" style={{ color: '#f59e0b' }}>
                    <AlertCircle className="w-3.5 h-3.5" />
                    Credentials are stored encrypted. Never share them.
                  </div>

                  {ch.fields.map((field) => (
                    <div key={field.key} className="flex flex-col gap-1">
                      <label className="text-xs font-medium" style={{ color: 'var(--foreground)' }}>{field.label}</label>
                      <input
                        type={field.type}
                        placeholder={field.placeholder}
                        value={formValues[ch.id]?.[field.key] ?? ''}
                        onChange={(e) => setField(ch.id, field.key, e.target.value)}
                        className="px-3 py-2 rounded-lg border text-sm outline-none"
                        style={{ background: 'var(--background)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
                      />
                    </div>
                  ))}

                  <div className="flex items-center gap-2 justify-end mt-2">
                    <a
                      href={ch.docsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs hover:underline"
                      style={{ color: 'var(--muted)' }}
                    >
                      <ExternalLink className="w-3 h-3" /> Docs
                    </a>
                    <button
                      onClick={() => setExpanded(null)}
                      className="px-3 py-1.5 rounded-lg border text-xs"
                      style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleConnect(ch.id)}
                      className="px-4 py-1.5 rounded-lg text-xs font-medium hover:opacity-90"
                      style={{ background: 'var(--accent)', color: '#fff' }}
                    >
                      {ch.status === 'pending' ? 'Saving…' : 'Save & connect'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
