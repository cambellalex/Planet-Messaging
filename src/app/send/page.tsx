'use client';

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import NavBar from '@/components/nav/NavBar';
import {
  Send, Phone, MessageSquare, Zap, Mail, AlertCircle, CheckCircle2,
  Users, Layers, Hash, Upload, X, Search, Loader2, Wand2, Check,
} from 'lucide-react';

type Channel = 'sms' | 'whatsapp' | 'rcs' | 'email';

const CHANNELS: { id: Channel; label: string; icon: React.ReactNode; live: boolean }[] = [
  { id: 'sms',       label: 'SMS',       icon: <Phone className="w-4 h-4" />,          live: true  },
  { id: 'whatsapp',  label: 'WhatsApp',  icon: <MessageSquare className="w-4 h-4" />,   live: false },
  { id: 'rcs',       label: 'RCS',       icon: <Zap className="w-4 h-4" />,             live: false },
  { id: 'email',     label: 'Email',     icon: <Mail className="w-4 h-4" />,            live: false },
];

const SMS_LIMIT = 160;

// ── Recipient types ───────────────────────────────────────────────────────────

interface DBContact {
  id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  groupName?: string | null;
}

interface AdhocContact {
  name: string;
  phone?: string;
  email?: string;
}

// What the user has selected
interface RecipientSelection {
  contactIds: string[];        // individual contacts from DB
  groupNames: string[];        // whole groups from DB
  phones: string[];            // manually typed numbers
  adhocContacts: AdhocContact[]; // from uploaded file
  adhocGroupLabel: string;     // label shown for the uploaded batch
}

function emptySelection(): RecipientSelection {
  return { contactIds: [], groupNames: [], phones: [], adhocContacts: [], adhocGroupLabel: '' };
}

// Total unique recipients we'll be sending to (approximate — server deduplicates)
function recipientSummary(sel: RecipientSelection, groupSizes: Record<string, number>): string {
  const parts: string[] = [];
  if (sel.contactIds.length) parts.push(`${sel.contactIds.length} contact${sel.contactIds.length !== 1 ? 's' : ''}`);
  for (const g of sel.groupNames) {
    const n = groupSizes[g] ?? '?';
    parts.push(`${g} (${n})`);
  }
  if (sel.phones.length) parts.push(`${sel.phones.length} number${sel.phones.length !== 1 ? 's' : ''}`);
  if (sel.adhocContacts.length) parts.push(`${sel.adhocContacts.length} uploaded`);
  return parts.length ? parts.join(', ') : 'No recipients selected';
}

function totalCount(sel: RecipientSelection, groupSizes: Record<string, number>): number {
  const groupTotal = sel.groupNames.reduce((s, g) => s + (groupSizes[g] ?? 0), 0);
  return sel.contactIds.length + groupTotal + sel.phones.length + sel.adhocContacts.length;
}

// ── Phone helpers ─────────────────────────────────────────────────────────────

function compactPhone(raw: string) { return raw.replace(/\s+/g, ''); }
function ukLocalToE164(raw: string): string | null {
  const s = compactPhone(raw);
  return /^07\d{9}$/.test(s) ? '+44' + s.slice(1) : null;
}
function phoneIssue(raw: string): 'uk_local' | 'no_plus' | null {
  if (!raw.trim()) return null;
  const s = compactPhone(raw);
  if (/^07/.test(s)) return 'uk_local';
  if (!s.startsWith('+')) return 'no_plus';
  return null;
}

// ── CSV upload helpers ─────────────────────────────────────────────────────────

function parseCSV(text: string): AdhocContact[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];
  const data = lines.slice(1); // skip header
  return data
    .map((line) => {
      const parts = line.split(',').map((c) => c.trim());
      return { name: parts[0] ?? '', phone: parts[1] || undefined, email: parts[2] || undefined };
    })
    .filter((c) => c.name);
}

// ── Sub-components ────────────────────────────────────────────────────────────

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
      style={{
        background: active ? 'var(--accent)' : 'transparent',
        color: active ? '#fff' : 'var(--muted)',
      }}
    >
      {children}
    </button>
  );
}

// ── Contacts tab ──────────────────────────────────────────────────────────────

function ContactsTab({
  selected,
  onToggle,
}: {
  selected: Set<string>;
  onToggle: (id: string) => void;
}) {
  const [contacts, setContacts] = useState<DBContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');

  useEffect(() => {
    fetch('/api/contacts')
      .then((r) => r.json() as Promise<DBContact[]>)
      .then(setContacts)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const visible = contacts.filter((c) => {
    const query = q.toLowerCase();
    return (
      c.name.toLowerCase().includes(query) ||
      (c.phone ?? '').includes(query) ||
      (c.groupName ?? '').toLowerCase().includes(query)
    );
  });

  return (
    <div className="flex flex-col gap-2">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: 'var(--muted)' }} />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search contacts…"
          className="w-full pl-8 pr-3 py-2 rounded-lg border text-sm outline-none"
          style={{ background: 'var(--background)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
        />
      </div>
      {loading ? (
        <div className="flex justify-center py-6"><Loader2 className="w-4 h-4 animate-spin" style={{ color: 'var(--muted)' }} /></div>
      ) : (
        <div className="flex flex-col gap-1 max-h-52 overflow-y-auto">
          {visible.length === 0 && <p className="text-xs text-center py-4" style={{ color: 'var(--muted)' }}>No contacts found</p>}
          {visible.map((c) => (
            <label
              key={c.id}
              className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer hover:opacity-80"
              style={{ background: selected.has(c.id) ? 'rgba(59,130,246,0.08)' : 'var(--background)' }}
            >
              <input
                type="checkbox"
                checked={selected.has(c.id)}
                onChange={() => onToggle(c.id)}
                className="w-4 h-4 rounded accent-blue-500"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{c.name}</p>
                <p className="text-xs truncate" style={{ color: 'var(--muted)' }}>
                  {c.phone ?? c.email ?? '—'}{c.groupName ? ` · ${c.groupName}` : ''}
                </p>
              </div>
            </label>
          ))}
        </div>
      )}
      <p className="text-xs" style={{ color: 'var(--muted)' }}>{selected.size} selected</p>
    </div>
  );
}

// ── Groups tab ────────────────────────────────────────────────────────────────

function GroupsTab({
  selected,
  onToggle,
  onSizesLoaded,
}: {
  selected: Set<string>;
  onToggle: (name: string) => void;
  onSizesLoaded: (sizes: Record<string, number>) => void;
}) {
  const [groups, setGroups] = useState<{ name: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/contacts')
      .then((r) => r.json() as Promise<DBContact[]>)
      .then((contacts) => {
        const map: Record<string, number> = {};
        for (const c of contacts) {
          if (c.groupName) map[c.groupName] = (map[c.groupName] ?? 0) + 1;
        }
        const g = Object.entries(map).map(([name, count]) => ({ name, count }));
        setGroups(g);
        onSizesLoaded(map);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [onSizesLoaded]);

  return (
    <div className="flex flex-col gap-2">
      {loading ? (
        <div className="flex justify-center py-6"><Loader2 className="w-4 h-4 animate-spin" style={{ color: 'var(--muted)' }} /></div>
      ) : groups.length === 0 ? (
        <p className="text-xs text-center py-4" style={{ color: 'var(--muted)' }}>
          No groups yet — upload contacts to create groups
        </p>
      ) : (
        <div className="flex flex-col gap-1 max-h-52 overflow-y-auto">
          {groups.map((g) => (
            <label
              key={g.name}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer hover:opacity-80"
              style={{ background: selected.has(g.name) ? 'rgba(59,130,246,0.08)' : 'var(--background)' }}
            >
              <input
                type="checkbox"
                checked={selected.has(g.name)}
                onChange={() => onToggle(g.name)}
                className="w-4 h-4 rounded accent-blue-500"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{g.name}</p>
                <p className="text-xs" style={{ color: 'var(--muted)' }}>{g.count} contact{g.count !== 1 ? 's' : ''}</p>
              </div>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Number tab ────────────────────────────────────────────────────────────────

function NumberTab({ phones, onAdd, onRemove }: {
  phones: string[];
  onAdd: (p: string) => void;
  onRemove: (p: string) => void;
}) {
  const [value, setValue] = useState('');
  const issue = phoneIssue(value);
  const fixed = issue === 'uk_local' ? ukLocalToE164(value) : null;

  function addPhone(p: string) {
    const compact = compactPhone(p.trim());
    if (!compact) return;
    onAdd(compact);
    setValue('');
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <div className="flex gap-2">
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addPhone(fixed ?? value); } }}
            placeholder="+44 7700 900123"
            className="flex-1 px-3 py-2 rounded-lg border text-sm outline-none"
            style={{
              background: 'var(--background)',
              borderColor: issue === 'no_plus' ? '#f87171' : issue === 'uk_local' ? '#f59e0b' : 'var(--border)',
              color: 'var(--foreground)',
            }}
          />
          <button
            type="button"
            onClick={() => addPhone(fixed ?? value)}
            className="px-3 py-2 rounded-lg text-sm font-medium"
            style={{ background: 'var(--accent)', color: '#fff' }}
          >
            Add
          </button>
        </div>
        {issue === 'uk_local' && (
          <div className="flex items-center justify-between gap-2 text-xs px-3 py-1.5 rounded-lg" style={{ background: 'rgba(251,191,36,0.1)', color: '#f59e0b' }}>
            <span className="flex items-center gap-1"><AlertCircle className="w-3 h-3" />UK local number</span>
            <button type="button" onClick={() => setValue(fixed!)} className="flex items-center gap-1 font-medium">
              <Wand2 className="w-3 h-3" /> Fix: {fixed}
            </button>
          </div>
        )}
        {issue === 'no_plus' && (
          <p className="text-xs px-3 py-1.5 rounded-lg" style={{ background: 'rgba(248,113,113,0.1)', color: '#f87171' }}>
            Must start with + and country code
          </p>
        )}
      </div>

      {phones.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {phones.map((p) => (
            <span key={p} className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(59,130,246,0.12)', color: 'var(--accent)' }}>
              {p}
              <button type="button" onClick={() => onRemove(p)} className="hover:opacity-70"><X className="w-3 h-3" /></button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Upload tab ────────────────────────────────────────────────────────────────

const UPLOAD_HINT = `Name, Phone, Email
Alice Martin, +44 7700 900456, alice@example.com
Bob Chen, +1 555 234 5678, bob@example.com`;

function UploadTab({ contacts, onLoaded }: {
  contacts: AdhocContact[];
  onLoaded: (list: AdhocContact[]) => void;
}) {
  const [pasted, setPasted] = useState('');
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  function applyText(text: string) {
    setPasted(text);
    setError('');
    const parsed = parseCSV(text);
    if (parsed.length === 0) { setError('No valid rows found (need a header + at least one data row)'); return; }
    if (parsed.length > 2000) { setError('Maximum 2,000 contacts per upload'); return; }
    onLoaded(parsed);
  }

  function loadFile(file: File) {
    if (file.name.match(/\.(xlsx|xls)$/i)) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const XLSX = await import('xlsx');
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const wb = XLSX.read(data, { type: 'array' });
          const ws = wb.Sheets[wb.SheetNames[0]];
          const arr = XLSX.utils.sheet_to_json<(string | number | boolean)[]>(ws, { header: 1, defval: '' });
          const csv = arr.map((r) => r.map((c) => String(c ?? '').trim()).join(',')).join('\n');
          applyText(csv);
        } catch { setError('Could not read Excel file'); }
      };
      reader.readAsArrayBuffer(file);
    } else {
      const reader = new FileReader();
      reader.onload = (e) => applyText(e.target?.result as string);
      reader.readAsText(file);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div
        onClick={() => fileRef.current?.click()}
        onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) loadFile(f); }}
        onDragOver={(e) => e.preventDefault()}
        className="border-2 border-dashed rounded-xl p-3 text-center cursor-pointer hover:opacity-80"
        style={{ borderColor: 'var(--border)' }}
      >
        <Upload className="w-4 h-4 mx-auto mb-0.5" style={{ color: 'var(--muted)' }} />
        <p className="text-xs" style={{ color: 'var(--muted)' }}>
          Drop CSV / Excel or <span style={{ color: 'var(--accent)' }}>click to browse</span>
        </p>
        <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls,.txt" className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) loadFile(f); }} />
      </div>

      <textarea
        rows={4}
        value={pasted}
        onChange={(e) => applyText(e.target.value)}
        placeholder={UPLOAD_HINT}
        className="w-full px-3 py-2 rounded-lg border text-xs font-mono outline-none resize-y"
        style={{ background: 'var(--background)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
      />

      {error && <p className="text-xs" style={{ color: '#f87171' }}>{error}</p>}
      {contacts.length > 0 && !error && (
        <p className="text-xs" style={{ color: '#10b981' }}>
          <Check className="inline w-3 h-3 mr-0.5" />{contacts.length} contacts ready to send
        </p>
      )}
    </div>
  );
}

// ── Recipient chip strip ───────────────────────────────────────────────────────

function ChipStrip({ sel, groupSizes, onClearContactId, onClearGroup, onClearPhone, onClearAdhoc }: {
  sel: RecipientSelection;
  groupSizes: Record<string, number>;
  onClearContactId: (id: string) => void;
  onClearGroup: (g: string) => void;
  onClearPhone: (p: string) => void;
  onClearAdhoc: () => void;
}) {
  const chips: React.ReactNode[] = [];

  if (sel.contactIds.length) {
    chips.push(
      <span key="contacts" className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full"
        style={{ background: 'rgba(59,130,246,0.12)', color: 'var(--accent)' }}>
        <Users className="w-3 h-3" /> {sel.contactIds.length} contact{sel.contactIds.length !== 1 ? 's' : ''}
        <button type="button" onClick={() => sel.contactIds.forEach(onClearContactId)} className="hover:opacity-70 ml-0.5">
          <X className="w-3 h-3" />
        </button>
      </span>
    );
  }

  for (const g of sel.groupNames) {
    chips.push(
      <span key={`g:${g}`} className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full"
        style={{ background: 'rgba(16,185,129,0.12)', color: '#10b981' }}>
        <Layers className="w-3 h-3" /> {g} ({groupSizes[g] ?? '?'})
        <button type="button" onClick={() => onClearGroup(g)} className="hover:opacity-70 ml-0.5"><X className="w-3 h-3" /></button>
      </span>
    );
  }

  for (const p of sel.phones) {
    chips.push(
      <span key={`p:${p}`} className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full"
        style={{ background: 'rgba(100,116,139,0.12)', color: 'var(--muted)' }}>
        <Hash className="w-3 h-3" /> {p}
        <button type="button" onClick={() => onClearPhone(p)} className="hover:opacity-70 ml-0.5"><X className="w-3 h-3" /></button>
      </span>
    );
  }

  if (sel.adhocContacts.length) {
    chips.push(
      <span key="adhoc" className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full"
        style={{ background: 'rgba(251,191,36,0.12)', color: '#f59e0b' }}>
        <Upload className="w-3 h-3" /> {sel.adhocContacts.length} uploaded
        <button type="button" onClick={onClearAdhoc} className="hover:opacity-70 ml-0.5"><X className="w-3 h-3" /></button>
      </span>
    );
  }

  if (chips.length === 0) return null;
  return <div className="flex flex-wrap gap-1.5 mt-2">{chips}</div>;
}

// ── Main page (wrapped in Suspense for useSearchParams) ───────────────────────

function SendPageInner() {
  const params = useSearchParams();
  const prefillTo = params.get('to') ?? '';

  const [channel, setChannel] = useState<Channel>('sms');
  const [campaignName, setCampaignName] = useState(() => {
    const d = new Date();
    return `Campaign ${d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`;
  });
  const [body, setBody] = useState('');

  // Recipient state
  const [sel, setSel] = useState<RecipientSelection>(() => {
    const s = emptySelection();
    if (prefillTo) s.phones = [prefillTo];
    return s;
  });
  const [groupSizes, setGroupSizes] = useState<Record<string, number>>({});
  const [activeTab, setActiveTab] = useState<'contacts' | 'groups' | 'number' | 'upload'>(
    prefillTo ? 'number' : 'contacts',
  );

  // Campaign send state
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [resultMsg, setResultMsg] = useState('');

  const onGroupSizes = useCallback((s: Record<string, number>) => setGroupSizes((prev) => ({ ...prev, ...s })), []);

  const selectedContactIds = new Set(sel.contactIds);
  const selectedGroups = new Set(sel.groupNames);

  function toggleContact(id: string) {
    setSel((prev) => {
      const set = new Set(prev.contactIds);
      set.has(id) ? set.delete(id) : set.add(id);
      return { ...prev, contactIds: [...set] };
    });
  }
  function toggleGroup(name: string) {
    setSel((prev) => {
      const set = new Set(prev.groupNames);
      set.has(name) ? set.delete(name) : set.add(name);
      return { ...prev, groupNames: [...set] };
    });
  }
  function addPhone(p: string) {
    setSel((prev) => ({ ...prev, phones: prev.phones.includes(p) ? prev.phones : [...prev.phones, p] }));
  }
  function removePhone(p: string) { setSel((prev) => ({ ...prev, phones: prev.phones.filter((x) => x !== p) })); }
  function clearContactId(id: string) { setSel((prev) => ({ ...prev, contactIds: prev.contactIds.filter((x) => x !== id) })); }
  function clearGroup(g: string) { setSel((prev) => ({ ...prev, groupNames: prev.groupNames.filter((x) => x !== g) })); }
  function setAdhoc(list: AdhocContact[]) { setSel((prev) => ({ ...prev, adhocContacts: list })); }
  function clearAdhoc() { setSel((prev) => ({ ...prev, adhocContacts: [] })); }

  const total = totalCount(sel, groupSizes);
  const isSms = channel === 'sms';
  const remaining = SMS_LIMIT - body.length;
  const segments = isSms ? Math.ceil(body.length / SMS_LIMIT) || 1 : null;

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (total === 0) { setStatus('error'); setResultMsg('Select at least one recipient.'); return; }
    if (!body.trim()) { setStatus('error'); setResultMsg('Message body is required.'); return; }

    setStatus('sending');
    try {
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: campaignName.trim() || 'Campaign',
          channel,
          body: body.trim(),
          recipients: {
            contactIds: sel.contactIds,
            groupNames: sel.groupNames,
            phones: sel.phones,
            adhocContacts: sel.adhocContacts,
          },
        }),
      });

      const data = await res.json() as { sentCount?: number; failedCount?: number; totalCount?: number; error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Failed to send campaign');

      const { sentCount = 0, failedCount = 0, totalCount: tc = 0 } = data;
      setStatus('success');
      setResultMsg(`Campaign sent — ${sentCount}/${tc} delivered${failedCount > 0 ? `, ${failedCount} failed` : ''}.`);
      setBody('');
      setSel(emptySelection());
    } catch (err) {
      setStatus('error');
      setResultMsg(err instanceof Error ? err.message : 'Network error — please try again.');
    }
  }

  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--background)', color: 'var(--foreground)' }}>
      <NavBar variant="app" />

      <main className="max-w-2xl mx-auto w-full px-4 pt-24 pb-12">
        <h1 className="text-2xl font-bold mb-6">Send Campaign</h1>

        <form onSubmit={handleSend} className="flex flex-col gap-6">

          {/* Campaign name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Campaign name</label>
            <input
              type="text"
              value={campaignName}
              onChange={(e) => setCampaignName(e.target.value)}
              placeholder="e.g. Summer Promotion"
              className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none"
              style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
            />
          </div>

          {/* Channel */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Channel</label>
            <div className="flex gap-2 flex-wrap">
              {CHANNELS.map((c) => (
                <button
                  key={c.id}
                  type="button"
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
                >
                  {c.icon} {c.label}
                  {!c.live && <span className="text-xs ml-0.5" style={{ color: 'var(--muted)' }}>(soon)</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Recipients */}
          <div className="flex flex-col gap-3 p-4 rounded-2xl border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Recipients</label>
              {total > 0 && (
                <span className="text-xs px-2.5 py-0.5 rounded-full font-medium"
                  style={{ background: 'rgba(59,130,246,0.12)', color: 'var(--accent)' }}>
                  {total} recipient{total !== 1 ? 's' : ''}
                </span>
              )}
            </div>

            {/* Tabs */}
            <div className="flex gap-1 p-1 rounded-lg" style={{ background: 'var(--background)' }}>
              <TabBtn active={activeTab === 'contacts'} onClick={() => setActiveTab('contacts')}>
                <Users className="w-3.5 h-3.5" /> Contacts
              </TabBtn>
              <TabBtn active={activeTab === 'groups'} onClick={() => setActiveTab('groups')}>
                <Layers className="w-3.5 h-3.5" /> Groups
              </TabBtn>
              <TabBtn active={activeTab === 'number'} onClick={() => setActiveTab('number')}>
                <Hash className="w-3.5 h-3.5" /> Number
              </TabBtn>
              <TabBtn active={activeTab === 'upload'} onClick={() => setActiveTab('upload')}>
                <Upload className="w-3.5 h-3.5" /> Upload
              </TabBtn>
            </div>

            {/* Tab content */}
            <div>
              {activeTab === 'contacts' && (
                <ContactsTab selected={selectedContactIds} onToggle={toggleContact} />
              )}
              {activeTab === 'groups' && (
                <GroupsTab selected={selectedGroups} onToggle={toggleGroup} onSizesLoaded={onGroupSizes} />
              )}
              {activeTab === 'number' && (
                <NumberTab phones={sel.phones} onAdd={addPhone} onRemove={removePhone} />
              )}
              {activeTab === 'upload' && (
                <UploadTab contacts={sel.adhocContacts} onLoaded={setAdhoc} />
              )}
            </div>

            {/* Chip strip of all selected recipients */}
            <ChipStrip
              sel={sel}
              groupSizes={groupSizes}
              onClearContactId={clearContactId}
              onClearGroup={clearGroup}
              onClearPhone={removePhone}
              onClearAdhoc={clearAdhoc}
            />

            {total === 0 && (
              <p className="text-xs" style={{ color: 'var(--muted)' }}>
                Pick contacts, select groups, enter a number, or upload a file — selections accumulate across tabs.
              </p>
            )}
          </div>

          {/* Message */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Message</label>
              {isSms && (
                <span className="text-xs" style={{ color: remaining < 20 ? '#f87171' : 'var(--muted)' }}>
                  {body.length}/{SMS_LIMIT} · {segments} segment{segments !== 1 ? 's' : ''}
                </span>
              )}
            </div>
            <textarea
              required
              rows={5}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Type your message…"
              className="w-full px-4 py-3 rounded-xl border text-sm outline-none resize-y"
              style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
            />
          </div>

          {/* Status feedback */}
          {status === 'success' && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm" style={{ background: 'rgba(52,211,153,0.1)', color: '#10b981' }}>
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> {resultMsg}
            </div>
          )}
          {status === 'error' && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm" style={{ background: 'rgba(248,113,113,0.1)', color: '#f87171' }}>
              <AlertCircle className="w-4 h-4 flex-shrink-0" /> {resultMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={status === 'sending' || status === 'success'}
            className="flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all hover:opacity-90 disabled:opacity-60"
            style={{ background: 'var(--accent)', color: '#fff' }}
          >
            {status === 'sending' ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Sending campaign…</>
            ) : (
              <><Send className="w-4 h-4" /> Send to {total > 0 ? `${total} recipient${total !== 1 ? 's' : ''}` : 'recipients'}</>
            )}
          </button>
        </form>
      </main>
    </div>
  );
}

export default function SendPage() {
  return (
    <Suspense>
      <SendPageInner />
    </Suspense>
  );
}
