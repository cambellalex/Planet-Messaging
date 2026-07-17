'use client';

import { useState, useEffect, useRef } from 'react';
import NavBar from '@/components/nav/NavBar';
import { Phone, MessageSquare, Zap, Mail, Check, Settings, ExternalLink, AlertCircle, KeyRound, X } from 'lucide-react';

type ChannelStatus = 'connected' | 'disconnected' | 'pending';

interface Credential {
  key: string;
  label: string;
  masked: string;
}

interface ChannelConfig {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  status: ChannelStatus;
  provider: string;
  docsUrl: string;
  credentials: Credential[];
}

function mask(value: string): string {
  if (!value) return '—';
  if (value.length <= 8) return '••••••••';
  return value.slice(0, 4) + '••••••••' + value.slice(-4);
}

// ── Configure modal ────────────────────────────────────────────────────────────
interface ConfigureModalProps {
  label: string;
  currentMasked: string;
  onClose: () => void;
  onSave: (value: string) => Promise<void>;
}

function ConfigureModal({ label, currentMasked, onClose, onSave }: ConfigureModalProps) {
  const [value, setValue] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  async function handleSave() {
    if (!value) { setError('Please enter a value.'); return; }
    if (value !== confirm) { setError('Values do not match.'); return; }
    setSaving(true);
    setError('');
    try {
      await onSave(value);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.5)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-md rounded-2xl border p-6 flex flex-col gap-4"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <KeyRound className="w-4 h-4" style={{ color: 'var(--accent)' }} />
            <h2 className="font-semibold">Configure {label}</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:opacity-70" style={{ color: 'var(--muted)' }}>
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-sm" style={{ color: 'var(--muted)' }}>
          Current value: <span className="font-mono">{currentMasked}</span>
        </p>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium">New {label}</label>
          <input
            ref={inputRef}
            type="password"
            autoComplete="new-password"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Enter new value"
            className="px-3 py-2 rounded-lg border text-sm outline-none font-mono"
            style={{ background: 'var(--background)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium">Confirm {label}</label>
          <input
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Re-enter to confirm"
            className="px-3 py-2 rounded-lg border text-sm outline-none font-mono"
            style={{ background: 'var(--background)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
          />
        </div>

        {error && (
          <div className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg" style={{ background: 'rgba(248,113,113,0.1)', color: '#f87171' }}>
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /> {error}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border text-sm"
            style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-60"
            style={{ background: 'var(--accent)', color: '#fff' }}
          >
            {saving ? 'Saving…' : 'Update'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Read-only credential row ───────────────────────────────────────────────────
interface CredentialRowProps {
  label: string;
  masked: string;
  onConfigure: () => void;
}

function CredentialRow({ label, masked, onConfigure }: CredentialRowProps) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium" style={{ color: 'var(--foreground)' }}>{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="text"
          readOnly
          value={masked}
          autoComplete="off"
          className="flex-1 px-3 py-2 rounded-lg border text-sm font-mono outline-none cursor-default"
          style={{
            background: 'var(--background)',
            borderColor: 'var(--border)',
            color: 'var(--muted)',
            opacity: 0.7,
          }}
        />
        <button
          onClick={onConfigure}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-medium hover:opacity-80 flex-shrink-0"
          style={{ borderColor: 'var(--border)', color: 'var(--foreground)', background: 'var(--surface)' }}
        >
          <Settings className="w-3.5 h-3.5" />
          Configure
        </button>
      </div>
    </div>
  );
}

// ── Status badge ───────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: ChannelStatus }) {
  const styles: Record<ChannelStatus, { bg: string; color: string; label: string }> = {
    connected:    { bg: 'rgba(52,211,153,0.15)',   color: '#10b981',       label: 'Connected'     },
    disconnected: { bg: 'rgba(100,116,139,0.12)',  color: 'var(--muted)',  label: 'Not connected' },
    pending:      { bg: 'rgba(251,191,36,0.15)',   color: '#f59e0b',       label: 'Pending…'      },
  };
  const s = styles[status];
  return (
    <span className="text-xs px-2.5 py-0.5 rounded-full font-medium" style={{ background: s.bg, color: s.color }}>
      {status === 'connected' && <Check className="inline w-3 h-3 mr-0.5" />}
      {s.label}
    </span>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
const CHANNEL_DEFS: Omit<ChannelConfig, 'credentials' | 'status'>[] = [
  {
    id: 'sms',
    name: 'SMS',
    description: 'Send and receive SMS via Twilio. Supports two-way messaging, delivery receipts, opt-out lists, and webhook inbound routing.',
    icon: <Phone className="w-6 h-6" />,
    provider: 'Twilio',
    docsUrl: 'https://www.twilio.com/docs/sms',
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    description: 'WhatsApp Business API via Twilio. Send template messages, media, and interactive buttons. Requires Meta Business verification.',
    icon: <MessageSquare className="w-6 h-6" />,
    provider: 'Twilio / Meta',
    docsUrl: 'https://www.twilio.com/docs/whatsapp',
  },
  {
    id: 'rcs',
    name: 'RCS',
    description: 'Rich Communication Services for branded, interactive messages on Android. Delivered via Twilio RCS Business Messaging.',
    icon: <Zap className="w-6 h-6" />,
    provider: 'Twilio',
    docsUrl: 'https://www.twilio.com/docs/rcs',
  },
  {
    id: 'email',
    name: 'Email',
    description: 'Transactional and marketing email via SendGrid. Domain authentication, template management, and open/click tracking.',
    icon: <Mail className="w-6 h-6" />,
    provider: 'SendGrid',
    docsUrl: 'https://docs.sendgrid.com',
  },
];

const CREDENTIAL_KEYS: Record<string, { key: string; label: string }[]> = {
  sms: [
    { key: 'accountSid',  label: 'Account SID'       },
    { key: 'authToken',   label: 'Auth Token'         },
    { key: 'fromNumber',  label: 'Twilio phone number' },
  ],
  whatsapp: [{ key: 'waNumber', label: 'WhatsApp number (E.164)' }],
  rcs:      [{ key: 'rcsSender', label: 'RCS Sender ID' }],
  email:    [
    { key: 'sgApiKey',   label: 'SendGrid API Key' },
    { key: 'fromEmail',  label: 'Sender email'     },
  ],
};

type ModalState = { channelId: string; key: string; label: string; masked: string } | null;

export default function ChannelsPage() {
  const [channels, setChannels] = useState<ChannelConfig[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [modal, setModal] = useState<ModalState>(null);

  // Load channel state from API (or initialise with placeholders)
  useEffect(() => {
    async function load() {
      let saved: Record<string, Record<string, string>> = {};
      try {
        const res = await fetch('/api/channels');
        if (res.ok) saved = await res.json() as typeof saved;
      } catch { /* use empty */ }

      setChannels(CHANNEL_DEFS.map((def) => {
        const creds = saved[def.id] ?? {};
        const hasAll = CREDENTIAL_KEYS[def.id]?.every((f) => !!creds[f.key]);
        return {
          ...def,
          status: hasAll ? 'connected' : 'disconnected',
          credentials: (CREDENTIAL_KEYS[def.id] ?? []).map((f) => ({
            key: f.key,
            label: f.label,
            masked: mask(creds[f.key] ?? ''),
          })),
        };
      }));
    }
    void load();
  }, []);

  function openModal(channelId: string, key: string, label: string, masked: string) {
    setModal({ channelId, key, label, masked });
  }

  async function handleSave(value: string) {
    if (!modal) return;
    const res = await fetch(`/api/channels/${modal.channelId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [modal.key]: value }),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({})) as { error?: string };
      throw new Error(d.error ?? 'Failed to save');
    }
    // Update masked display
    setChannels((prev) =>
      prev.map((ch) => {
        if (ch.id !== modal.channelId) return ch;
        const updated = ch.credentials.map((c) =>
          c.key === modal.key ? { ...c, masked: mask(value) } : c
        );
        const hasAll = updated.every((c) => c.masked !== '—');
        return { ...ch, credentials: updated, status: hasAll ? 'connected' : 'disconnected' };
      })
    );
  }

  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--background)', color: 'var(--foreground)' }}>
      <NavBar variant="app" />

      {modal && (
        <ConfigureModal
          label={modal.label}
          currentMasked={modal.masked}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}

      <main className="max-w-3xl mx-auto w-full px-4 pt-24 pb-12">
        <h1 className="text-2xl font-bold mb-2">Manage Channels</h1>
        <p className="text-sm mb-8" style={{ color: 'var(--muted)' }}>
          Connect your messaging providers. Credentials are stored encrypted and never exposed after saving.
        </p>

        <div className="flex flex-col gap-4">
          {channels.map((ch) => (
            <div
              key={ch.id}
              className="rounded-2xl border overflow-hidden"
              style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
            >
              {/* Header */}
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

                <button
                  onClick={() => setExpanded(expanded === ch.id ? null : ch.id)}
                  className="p-2 rounded-lg hover:opacity-70 flex-shrink-0"
                  title="Settings"
                  style={{ color: 'var(--muted)' }}
                >
                  <Settings className="w-4 h-4" />
                </button>
              </div>

              {/* Credentials panel */}
              {expanded === ch.id && (
                <div className="border-t px-5 pb-5 pt-4 flex flex-col gap-3" style={{ borderColor: 'var(--border)' }}>
                  <div className="flex items-center gap-1.5 text-xs mb-1" style={{ color: '#f59e0b' }}>
                    <AlertCircle className="w-3.5 h-3.5" />
                    Credentials are masked. Use Configure to update each value individually.
                  </div>

                  {ch.credentials.map((cred) => (
                    <CredentialRow
                      key={cred.key}
                      label={cred.label}
                      masked={cred.masked}
                      onConfigure={() => openModal(ch.id, cred.key, cred.label, cred.masked)}
                    />
                  ))}

                  <div className="flex justify-end mt-2">
                    <a
                      href={ch.docsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs hover:underline"
                      style={{ color: 'var(--muted)' }}
                    >
                      <ExternalLink className="w-3 h-3" /> View Twilio docs
                    </a>
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
