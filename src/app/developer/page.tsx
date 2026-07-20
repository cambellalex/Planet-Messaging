'use client';

import { useState, useEffect, useCallback } from 'react';
import NavBar from '@/components/nav/NavBar';
import { Key, Plus, Trash2, Copy, Check, Loader2, AlertTriangle, Terminal, ChevronRight } from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────────

interface ApiKeyRow {
  id: string;
  name: string;
  keyPrefix: string;
  lastFour: string;
  createdAt: string;
  lastUsedAt: string | null;
}

interface NewKeyResult extends ApiKeyRow {
  key: string;
}

type Endpoint = 'send' | 'receive' | 'reports' | 'account';
type Lang = 'curl' | 'node' | 'python';

// ── Code examples ──────────────────────────────────────────────────────────────

function buildExample(endpoint: Endpoint, lang: Lang, base: string, exKey: string): string {
  const k = exKey || 'pmk_your_key_here';
  const h = (s: string) => `"Authorization: Bearer ${k}"${s}`;

  if (endpoint === 'send') {
    const url = `${base}/api/v1/messages`;
    if (lang === 'curl') return (
`curl -X POST ${url} \\
  -H ${h(' \\')}
  -H "Content-Type: application/json" \\
  -d '{"to":"+447911123456","channel":"sms","body":"Hello from Planet Messaging!"}'`
    );
    if (lang === 'node') return (
`const res = await fetch('${url}', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ${k}',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    to: '+447911123456',
    channel: 'sms',          // 'sms' | 'whatsapp'
    body: 'Hello from Planet Messaging!',
  }),
});
const message = await res.json();
// { id, direction, channel, from, to, body, status, twilioSid, createdAt }`
    );
    return (
`import requests

r = requests.post(
    '${url}',
    headers={'Authorization': 'Bearer ${k}'},
    json={
        'to': '+447911123456',
        'channel': 'sms',
        'body': 'Hello from Planet Messaging!',
    }
)
print(r.json())`
    );
  }

  if (endpoint === 'receive') {
    const url = `${base}/api/v1/messages?direction=inbound&limit=50`;
    if (lang === 'curl') return (
`curl "${url}" \\
  -H ${h('')}`
    );
    if (lang === 'node') return (
`const res = await fetch('${url}', {
  headers: { 'Authorization': 'Bearer ${k}' },
});
const { data } = await res.json();
// data → [{ id, direction:"inbound", channel, from, to, body, status, createdAt }]
for (const msg of data) {
  console.log(\`\${msg.from}: \${msg.body}\`);
}`
    );
    return (
`import requests

r = requests.get(
    '${url}',
    headers={'Authorization': 'Bearer ${k}'},
)
messages = r.json()['data']
for msg in messages:
    print(f"{msg['from']}: {msg['body']}")`
    );
  }

  if (endpoint === 'reports') {
    const url = `${base}/api/v1/reports?days=30`;
    if (lang === 'curl') return (
`curl "${url}" \\
  -H ${h('')}`
    );
    if (lang === 'node') return (
`const res = await fetch('${url}', {
  headers: { 'Authorization': 'Bearer ${k}' },
});
const { period, outbound, inbound } = await res.json();
// outbound → { total, sent, delivered, failed }
console.log(\`Sent: \${outbound.sent}, Delivered: \${outbound.delivered}\`);`
    );
    return (
`import requests

r = requests.get(
    '${url}',
    headers={'Authorization': 'Bearer ${k}'},
)
data = r.json()
print(data['outbound'])  # { total, sent, delivered, failed }`
    );
  }

  // account
  const url = `${base}/api/v1/account`;
  if (lang === 'curl') return (
`curl "${url}" \\
  -H ${h('')}`
  );
  if (lang === 'node') return (
`const res = await fetch('${url}', {
  headers: { 'Authorization': 'Bearer ${k}' },
});
const { id, name, plan, pricing } = await res.json();
console.log(\`\${name} — \${plan} plan\`);`
  );
  return (
`import requests

r = requests.get(
    '${url}',
    headers={'Authorization': 'Bearer ${k}'},
)
account = r.json()
print(account['name'], account['plan'])`
  );
}

// ── Endpoint metadata ──────────────────────────────────────────────────────────

const ENDPOINTS: { id: Endpoint; label: string; method: string; path: string; desc: string; params: { name: string; type: string; desc: string; required?: boolean }[] }[] = [
  {
    id: 'send',
    label: 'Send message',
    method: 'POST',
    path: '/api/v1/messages',
    desc: 'Send an SMS or WhatsApp message to any E.164 phone number.',
    params: [
      { name: 'to', type: 'string', desc: 'Recipient in E.164 format (+447911123456)', required: true },
      { name: 'channel', type: '"sms" | "whatsapp"', desc: 'Messaging channel (default: "sms")' },
      { name: 'body', type: 'string', desc: 'Message text (max 1600 chars)', required: true },
    ],
  },
  {
    id: 'receive',
    label: 'Receive messages',
    method: 'GET',
    path: '/api/v1/messages',
    desc: 'List inbound and outbound messages. Filter by direction, channel, and paginate with limit/offset.',
    params: [
      { name: 'direction', type: '"inbound" | "outbound"', desc: 'Filter by message direction' },
      { name: 'channel', type: 'string', desc: 'Filter by channel (sms, whatsapp, …)' },
      { name: 'limit', type: 'number', desc: 'Max results (1–200, default 50)' },
      { name: 'offset', type: 'number', desc: 'Pagination offset (default 0)' },
    ],
  },
  {
    id: 'reports',
    label: 'Reports',
    method: 'GET',
    path: '/api/v1/reports',
    desc: 'Summary delivery statistics for a rolling date window.',
    params: [
      { name: 'days', type: 'number', desc: 'Look-back window in days (1–365, default 30)' },
    ],
  },
  {
    id: 'account',
    label: 'Account',
    method: 'GET',
    path: '/api/v1/account',
    desc: 'Return organisation name, plan, and configured pricing rates.',
    params: [],
  },
];

const METHOD_COLORS: Record<string, string> = {
  POST: '#f59e0b',
  GET:  '#10b981',
};

// ── Small shared components ────────────────────────────────────────────────────

function SectionCard({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border p-5 flex flex-col gap-4" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
      <div className="flex items-center gap-2">
        <span style={{ color: 'var(--accent)' }}>{icon}</span>
        <h2 className="font-semibold text-sm">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function Tab<T extends string>({ value, active, onClick }: { value: T; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-1.5 text-xs font-medium rounded-lg transition-colors"
      style={{
        background: active ? 'var(--accent)' : 'var(--background)',
        color: active ? '#fff' : 'var(--muted)',
        border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
      }}
    >
      {value}
    </button>
  );
}

function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="relative rounded-xl overflow-hidden" style={{ background: 'var(--background)', border: '1px solid var(--border)' }}>
      <button
        onClick={handleCopy}
        className="absolute top-2.5 right-2.5 flex items-center gap-1 text-xs px-2 py-1 rounded-md transition-colors hover:opacity-80"
        style={{ background: 'var(--surface)', color: copied ? '#10b981' : 'var(--muted)', border: '1px solid var(--border)' }}
      >
        {copied ? <><Check className="w-3 h-3" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
      </button>
      <pre className="text-xs p-4 overflow-x-auto leading-relaxed" style={{ color: 'var(--foreground)', fontFamily: 'monospace' }}>
        <code>{code}</code>
      </pre>
    </div>
  );
}

// ── One-time key reveal banner ─────────────────────────────────────────────────

function NewKeyBanner({ newKey, onDismiss }: { newKey: NewKeyResult; onDismiss: () => void }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(newKey.key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="rounded-xl border p-4 flex flex-col gap-3" style={{ background: 'rgba(16,185,129,0.06)', borderColor: '#10b981' }}>
      <div className="flex items-start gap-2">
        <Check className="w-4 h-4 mt-0.5 shrink-0" style={{ color: '#10b981' }} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold" style={{ color: '#10b981' }}>Key created — copy it now</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
            This key will never be shown again. Store it somewhere safe.
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <code
          className="flex-1 text-xs px-3 py-2 rounded-lg font-mono truncate"
          style={{ background: 'var(--background)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
        >
          {newKey.key}
        </code>
        <button
          onClick={handleCopy}
          className="shrink-0 flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg font-medium hover:opacity-80"
          style={{ background: '#10b981', color: '#fff' }}
        >
          {copied ? <><Check className="w-3.5 h-3.5" /> Copied</> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
        </button>
      </div>
      <button
        onClick={onDismiss}
        className="self-end text-xs hover:opacity-80"
        style={{ color: 'var(--muted)' }}
      >
        I&apos;ve saved my key ✕
      </button>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function DeveloperPage() {
  const [keys, setKeys] = useState<ApiKeyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [newKey, setNewKey] = useState<NewKeyResult | null>(null);
  const [revoking, setRevoking] = useState<string | null>(null);

  const [endpoint, setEndpoint] = useState<Endpoint>('send');
  const [lang, setLang] = useState<Lang>('curl');
  const [origin, setOrigin] = useState('https://your-domain.com');

  useEffect(() => { setOrigin(window.location.origin); }, []);

  const loadKeys = useCallback(() => {
    setLoading(true);
    fetch('/api/developer/keys')
      .then((r) => r.json() as Promise<ApiKeyRow[]>)
      .then(setKeys)
      .catch(() => setKeys([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadKeys(); }, [loadKeys]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch('/api/developer/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newKeyName || 'API Key' }),
      });
      const data = await res.json() as NewKeyResult;
      setNewKey(data);
      setKeys((prev) => [data, ...prev]);
      setShowForm(false);
      setNewKeyName('');
    } finally {
      setCreating(false);
    }
  }

  async function handleRevoke(id: string) {
    if (!confirm('Revoke this API key? Any apps using it will stop working immediately.')) return;
    setRevoking(id);
    try {
      await fetch(`/api/developer/keys/${id}`, { method: 'DELETE' });
      setKeys((prev) => prev.filter((k) => k.id !== id));
      if (newKey?.id === id) setNewKey(null);
    } finally {
      setRevoking(null);
    }
  }

  function fmtDate(s: string) {
    return new Date(s).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  function fmtRelative(s: string | null) {
    if (!s) return '—';
    const diff = Date.now() - new Date(s).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  }

  const exKey = keys[0] ? `${keys[0].keyPrefix}••••••••••••${keys[0].lastFour}` : '';
  const currentEndpoint = ENDPOINTS.find((e) => e.id === endpoint)!;

  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--background)', color: 'var(--foreground)' }}>
      <NavBar variant="app" />

      <main className="max-w-3xl mx-auto w-full px-4 pt-24 pb-12 flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">Developer API</h1>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>
            Integrate Planet Messaging into your own apps using our REST API. Authenticate with a Bearer token.
          </p>
        </div>

        {/* ── API Keys ───────────────────────────────────────────────────────── */}
        <SectionCard title="API Keys" icon={<Key className="w-4 h-4" />}>

          {newKey && <NewKeyBanner newKey={newKey} onDismiss={() => setNewKey(null)} />}

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin" style={{ color: 'var(--muted)' }} />
            </div>
          ) : keys.length === 0 && !showForm ? (
            <p className="text-sm" style={{ color: 'var(--muted)' }}>No API keys yet. Generate one to get started.</p>
          ) : keys.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs" style={{ color: 'var(--muted)' }}>
                    <th className="text-left pb-2 font-medium">Name</th>
                    <th className="text-left pb-2 font-medium">Key</th>
                    <th className="text-left pb-2 font-medium hidden sm:table-cell">Last used</th>
                    <th className="text-left pb-2 font-medium hidden sm:table-cell">Created</th>
                    <th className="pb-2" />
                  </tr>
                </thead>
                <tbody>
                  {keys.map((k) => (
                    <tr key={k.id} className="border-t" style={{ borderColor: 'var(--border)' }}>
                      <td className="py-2.5 pr-3 font-medium text-xs">{k.name}</td>
                      <td className="py-2.5 pr-3">
                        <code className="text-xs font-mono" style={{ color: 'var(--muted)' }}>
                          {k.keyPrefix}••••••••••••{k.lastFour}
                        </code>
                      </td>
                      <td className="py-2.5 pr-3 text-xs hidden sm:table-cell" style={{ color: 'var(--muted)' }}>
                        {fmtRelative(k.lastUsedAt)}
                      </td>
                      <td className="py-2.5 pr-3 text-xs hidden sm:table-cell" style={{ color: 'var(--muted)' }}>
                        {fmtDate(k.createdAt)}
                      </td>
                      <td className="py-2.5 text-right">
                        <button
                          onClick={() => handleRevoke(k.id)}
                          disabled={revoking === k.id}
                          className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg hover:opacity-80 ml-auto"
                          style={{ color: '#f87171', background: 'rgba(248,113,113,0.1)' }}
                        >
                          {revoking === k.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                          Revoke
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}

          {showForm ? (
            <form onSubmit={handleCreate} className="flex items-center gap-2 mt-1">
              <input
                autoFocus
                placeholder="Key name (e.g. Production)"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg border text-sm outline-none"
                style={{ background: 'var(--background)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
              />
              <button
                type="submit"
                disabled={creating}
                className="px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-60 flex items-center gap-1.5"
                style={{ background: 'var(--accent)', color: '#fff' }}
              >
                {creating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                Generate
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-3 py-2 rounded-lg text-sm hover:opacity-80"
                style={{ color: 'var(--muted)', border: '1px solid var(--border)' }}
              >
                Cancel
              </button>
            </form>
          ) : (
            <button
              onClick={() => setShowForm(true)}
              className="self-start flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border hover:opacity-80"
              style={{ borderColor: 'var(--border)', color: 'var(--foreground)', background: 'var(--background)' }}
            >
              <Plus className="w-3.5 h-3.5" /> New API key
            </button>
          )}

          <div className="flex items-start gap-2 text-xs p-3 rounded-xl" style={{ background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.2)' }}>
            <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: '#f87171' }} />
            <span style={{ color: 'var(--muted)' }}>
              Keep your API keys secret. Do not commit them to version control or share them publicly. Revoke and regenerate any key you believe has been compromised.
            </span>
          </div>
        </SectionCard>

        {/* ── Authentication ─────────────────────────────────────────────────── */}
        <SectionCard title="Authentication" icon={<Terminal className="w-4 h-4" />}>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>
            All v1 API requests must include an <code className="text-xs px-1 py-0.5 rounded" style={{ background: 'var(--background)' }}>Authorization</code> header with your API key as a Bearer token.
          </p>
          <div className="flex flex-col gap-1.5">
            <p className="text-xs font-medium" style={{ color: 'var(--muted)' }}>Base URL</p>
            <code className="text-xs px-3 py-2 rounded-lg font-mono" style={{ background: 'var(--background)', border: '1px solid var(--border)', color: 'var(--foreground)' }}>
              {origin}
            </code>
          </div>
          <CodeBlock code={`Authorization: Bearer ${exKey || 'pmk_your_key_here'}`} />
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl" style={{ background: 'var(--background)', border: '1px solid var(--border)' }}>
              <p className="font-medium mb-0.5">Rate limit</p>
              <p style={{ color: 'var(--muted)' }}>100 requests / minute per key</p>
            </div>
            <div className="p-3 rounded-xl" style={{ background: 'var(--background)', border: '1px solid var(--border)' }}>
              <p className="font-medium mb-0.5">Response format</p>
              <p style={{ color: 'var(--muted)' }}>JSON — all dates in ISO 8601</p>
            </div>
          </div>
        </SectionCard>

        {/* ── API Reference ──────────────────────────────────────────────────── */}
        <SectionCard title="API Reference" icon={<ChevronRight className="w-4 h-4" />}>

          {/* Endpoint tabs */}
          <div className="flex flex-wrap gap-1.5">
            {ENDPOINTS.map((ep) => (
              <button
                key={ep.id}
                onClick={() => setEndpoint(ep.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                style={{
                  background: endpoint === ep.id ? 'var(--accent)' : 'var(--background)',
                  color: endpoint === ep.id ? '#fff' : 'var(--muted)',
                  border: `1px solid ${endpoint === ep.id ? 'var(--accent)' : 'var(--border)'}`,
                }}
              >
                <span
                  className="font-mono font-bold text-xs"
                  style={{ color: endpoint === ep.id ? 'rgba(255,255,255,0.8)' : METHOD_COLORS[ep.method] ?? 'var(--muted)' }}
                >
                  {ep.method}
                </span>
                {ep.label}
              </button>
            ))}
          </div>

          {/* Endpoint detail */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <span
                className="text-xs font-bold font-mono px-2 py-0.5 rounded"
                style={{ background: `${METHOD_COLORS[currentEndpoint.method] ?? 'var(--muted)'}22`, color: METHOD_COLORS[currentEndpoint.method] ?? 'var(--muted)' }}
              >
                {currentEndpoint.method}
              </span>
              <code className="text-sm font-mono" style={{ color: 'var(--foreground)' }}>{currentEndpoint.path}</code>
            </div>
            <p className="text-sm" style={{ color: 'var(--muted)' }}>{currentEndpoint.desc}</p>

            {currentEndpoint.params.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr style={{ color: 'var(--muted)' }}>
                      <th className="text-left pb-2 font-medium pr-4">Parameter</th>
                      <th className="text-left pb-2 font-medium pr-4">Type</th>
                      <th className="text-left pb-2 font-medium">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentEndpoint.params.map((p) => (
                      <tr key={p.name} className="border-t" style={{ borderColor: 'var(--border)' }}>
                        <td className="py-2 pr-4">
                          <code className="font-mono" style={{ color: 'var(--foreground)' }}>{p.name}</code>
                          {p.required && <span className="ml-1 text-xs" style={{ color: '#f87171' }}>*</span>}
                        </td>
                        <td className="py-2 pr-4 font-mono" style={{ color: 'var(--accent)' }}>{p.type}</td>
                        <td className="py-2" style={{ color: 'var(--muted)' }}>{p.desc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Language tabs */}
            <div className="flex gap-1.5 mt-1">
              {(['curl', 'node', 'python'] as Lang[]).map((l) => (
                <Tab key={l} value={l === 'curl' ? 'cURL' : l === 'node' ? 'Node.js' : 'Python'} active={lang === l} onClick={() => setLang(l)} />
              ))}
            </div>

            <CodeBlock code={buildExample(endpoint, lang, origin, exKey)} />
          </div>
        </SectionCard>

      </main>
    </div>
  );
}
