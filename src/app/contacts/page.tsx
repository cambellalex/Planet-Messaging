'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import NavBar from '@/components/nav/NavBar';
import {
  Search, Plus, Phone, Mail, Trash2, Send, Upload, Link2, Pencil,
  X, AlertCircle, Check, ChevronDown, Loader2, Wand2,
} from 'lucide-react';
import Link from 'next/link';
import * as XLSX from 'xlsx';

interface Contact {
  id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  tags: string[];
  groupName?: string | null;
  extraFields?: Record<string, unknown> | null;
  createdAt: string;
}

// ── phone helpers ─────────────────────────────────────────────────────────────

/** Strip all whitespace for display and storage */
function compactPhone(raw: string): string {
  return raw.replace(/\s+/g, '');
}

/** Convert 07XXXXXXXXX → +447XXXXXXXXX. Returns null if not a convertible UK local number. */
function ukLocalToE164(raw: string): string | null {
  const s = compactPhone(raw);
  if (/^07\d{9}$/.test(s)) return '+44' + s.slice(1);
  return null;
}

type PhoneIssue =
  | { kind: 'uk_local'; fixed: string }   // starts with 07, convertible
  | { kind: 'no_plus' }                    // no leading +, not a UK local
  | null;

function getPhoneIssue(raw: string): PhoneIssue {
  if (!raw.trim()) return null;
  const s = compactPhone(raw);
  const fixed = ukLocalToE164(s);
  if (fixed) return { kind: 'uk_local', fixed };
  if (!s.startsWith('+')) return { kind: 'no_plus' };
  return null;
}

// ── generic helpers ────────────────────────────────────────────────────────────

function initials(name: string) {
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

function GroupBadge({ name }: { name: string }) {
  return (
    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(59,130,246,0.12)', color: 'var(--accent)' }}>
      {name}
    </span>
  );
}

function Tag({ label }: { label: string }) {
  return (
    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(100,116,139,0.12)', color: 'var(--muted)' }}>
      {label}
    </span>
  );
}

// ── phone input with inline warning ───────────────────────────────────────────

function PhoneInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const issue = getPhoneIssue(value);

  return (
    <div className="flex flex-col gap-1">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="+44 7700 900123"
        className="px-3 py-2 rounded-lg border text-sm outline-none"
        style={{
          background: 'var(--background)',
          borderColor: issue ? (issue.kind === 'uk_local' ? '#f59e0b' : '#f87171') : 'var(--border)',
          color: 'var(--foreground)',
        }}
      />
      {issue?.kind === 'uk_local' && (
        <div className="flex items-center justify-between gap-2 text-xs px-3 py-1.5 rounded-lg" style={{ background: 'rgba(251,191,36,0.1)', color: '#f59e0b' }}>
          <span className="flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
            UK local number — missing international code
          </span>
          <button
            type="button"
            onClick={() => onChange(issue.fixed)}
            className="flex items-center gap-1 font-medium hover:opacity-80 flex-shrink-0"
            style={{ color: '#f59e0b' }}
          >
            <Wand2 className="w-3 h-3" /> Fix: {issue.fixed}
          </button>
        </div>
      )}
      {issue?.kind === 'no_plus' && (
        <div className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg" style={{ background: 'rgba(248,113,113,0.1)', color: '#f87171' }}>
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          Phone must start with + and country code (e.g. +44, +1)
        </div>
      )}
    </div>
  );
}

// ── Add / Edit contact modal ───────────────────────────────────────────────────

interface ContactModalProps {
  contact?: Contact;
  onClose: () => void;
  onSave: (c: Contact) => void;
}

function ContactModal({ contact, onClose, onSave }: ContactModalProps) {
  const [name, setName] = useState(contact?.name ?? '');
  const [phone, setPhone] = useState(contact?.phone ?? '');
  const [email, setEmail] = useState(contact?.email ?? '');
  const [groupName, setGroupName] = useState(contact?.groupName ?? '');
  const [tags, setTags] = useState((contact?.tags ?? []).join(', '));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError('Name is required'); return; }
    const phoneIssue = getPhoneIssue(phone);
    if (phoneIssue?.kind === 'no_plus') { setError('Phone number must start with + and a country code.'); return; }
    if (phoneIssue?.kind === 'uk_local') { setError('Please fix the phone number to international format first.'); return; }

    setSaving(true); setError('');
    try {
      const payload = {
        name: name.trim(),
        phone: phone.trim() ? compactPhone(phone.trim()) : undefined,
        email: email.trim() || undefined,
        groupName: groupName.trim() || undefined,
        tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
      };
      const res = contact
        ? await fetch(`/api/contacts/${contact.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
        : await fetch('/api/contacts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!res.ok) {
        const d = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(d.error ?? 'Save failed');
      }
      const saved = await res.json() as Contact;
      onSave(saved);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Overlay onClose={onClose}>
      <form onSubmit={handleSave} className="flex flex-col gap-4">
        <ModalHeader title={contact ? 'Edit Contact' : 'Add Contact'} onClose={onClose} />

        <Field label="Full name *">
          <Input value={name} onChange={setName} placeholder="Alice Martin" required />
        </Field>
        <Field label="Phone">
          <PhoneInput value={phone} onChange={setPhone} />
        </Field>
        <Field label="Email">
          <Input type="email" value={email} onChange={setEmail} placeholder="alice@example.com" />
        </Field>
        <Field label="Group Name">
          <Input value={groupName} onChange={setGroupName} placeholder="e.g. Spring Campaign" />
        </Field>
        <Field label="Tags (comma-separated)">
          <Input value={tags} onChange={setTags} placeholder="customer, vip" />
        </Field>

        {error && <ErrorMsg msg={error} />}

        <div className="flex justify-end gap-2 pt-1">
          <GhostBtn onClick={onClose}>Cancel</GhostBtn>
          <PrimaryBtn type="submit" disabled={saving}>
            {saving ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving…</> : 'Save'}
          </PrimaryBtn>
        </div>
      </form>
    </Overlay>
  );
}

// ── Upload Contacts modal ──────────────────────────────────────────────────────

const PASTE_HINT = `Name, Phone, Email, [extra columns…]
Alice Martin, +44 7700 900456, alice@example.com
Bob Chen, +1 555 234 5678, bob@example.com`;

interface UploadModalProps {
  onClose: () => void;
  onImported: (count: number) => void;
}

/** Count data rows (skip header at index 0) whose phone column starts with 07 */
function count07Numbers(rows: string[][]): number {
  return rows.slice(1).filter((r) => /^07/.test(compactPhone(r[1] ?? ''))).length;
}

/** Convert all 07XXXXXXXXX phone cells in data rows to +44 format */
function fixAllUkLocals(rows: string[][]): string[][] {
  if (rows.length === 0) return rows;
  const [hdr, ...data] = rows;
  return [
    hdr,
    ...data.map((r) => {
      const fixed = ukLocalToE164(r[1] ?? '');
      if (!fixed) return r;
      const next = [...r];
      next[1] = fixed;
      return next;
    }),
  ];
}

function UploadModal({ onClose, onImported }: UploadModalProps) {
  const [groupName, setGroupName] = useState('');
  const [pasted, setPasted] = useState('');
  const [rows, setRows] = useState<string[][]>([]);
  const [preview, setPreview] = useState<{ headers: string[]; data: string[][] } | null>(null);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'input' | 'preview'>('input');
  const fileRef = useRef<HTMLInputElement>(null);

  const uk07Count = step === 'preview' ? count07Numbers(rows) : 0;

  function parseCSVText(text: string): string[][] {
    return text
      .split(/\r?\n/)
      .map((line) => line.split(',').map((c) => c.trim()))
      .filter((row) => row.some((c) => c));
  }

  function loadFile(file: File) {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext === 'csv' || ext === 'txt') {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        const parsed = parseCSVText(text);
        setRows(parsed);
        setPasted(text);
      };
      reader.readAsText(file);
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const arr = XLSX.utils.sheet_to_json<string[]>(ws, { header: 1 }) as string[][];
        setRows(arr.filter((r) => r.some((c) => c)));
      };
      reader.readAsArrayBuffer(file);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) loadFile(file);
  }

  function handlePasteChange(text: string) {
    setPasted(text);
    setRows(parseCSVText(text));
  }

  function buildPreview() {
    setError('');
    if (!groupName.trim()) { setError('Please enter a Group Name'); return; }
    if (rows.length < 2) { setError('Paste or upload at least one data row (plus a header row)'); return; }
    if (rows.length - 1 > 2000) { setError('Maximum 2,000 contacts per import'); return; }
    const [hdr, ...data] = rows;
    setPreview({ headers: hdr, data: data.slice(0, 5) });
    setStep('preview');
  }

  function applyUkFix() {
    const fixed = fixAllUkLocals(rows);
    setRows(fixed);
    const [hdr, ...data] = fixed;
    setPreview({ headers: hdr, data: data.slice(0, 5) });
  }

  async function doImport() {
    if (!preview) return;
    setImporting(true); setError('');
    try {
      const [hdr, ...data] = rows;
      const contacts = data.filter((r) => r[0]?.trim()).map((r) => {
        const extra: Record<string, unknown> = {};
        hdr.slice(3).forEach((h, i) => { if (r[i + 3]) extra[h] = r[i + 3]; });
        return {
          name: r[0]?.trim() ?? '',
          phone: r[1]?.trim() ? compactPhone(r[1].trim()) : undefined,
          email: r[2]?.trim() || undefined,
          ...(Object.keys(extra).length > 0 && { extraFields: extra }),
        };
      });
      const res = await fetch('/api/contacts/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupName: groupName.trim(), contacts }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(d.error ?? 'Import failed');
      }
      const { imported } = await res.json() as { imported: number };
      onImported(imported);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setImporting(false);
    }
  }

  return (
    <Overlay onClose={onClose}>
      <div className="flex flex-col gap-4">
        <ModalHeader title="Upload Contacts" onClose={onClose} />

        {step === 'input' ? (
          <>
            <Field label="Group Name *">
              <Input value={groupName} onChange={setGroupName} placeholder="e.g. Spring Campaign 2026" />
            </Field>

            {/* Drop zone */}
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed rounded-xl p-4 text-center cursor-pointer hover:opacity-80 transition-all"
              style={{ borderColor: 'var(--border)' }}
            >
              <Upload className="w-5 h-5 mx-auto mb-1" style={{ color: 'var(--muted)' }} />
              <p className="text-sm" style={{ color: 'var(--muted)' }}>
                Drag &amp; drop a CSV or Excel file, or <span style={{ color: 'var(--accent)' }}>click to browse</span>
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>Supports .csv, .xlsx, .xls — max 2,000 rows</p>
              <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls,.txt" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) loadFile(f); }} />
            </div>

            <div className="text-xs text-center" style={{ color: 'var(--muted)' }}>— or paste CSV below —</div>

            <Field label="Paste CSV">
              <textarea
                rows={6}
                value={pasted}
                onChange={(e) => handlePasteChange(e.target.value)}
                placeholder={PASTE_HINT}
                className="w-full px-3 py-2 rounded-lg border text-xs font-mono outline-none resize-y"
                style={{ background: 'var(--background)', borderColor: 'var(--border)', color: 'var(--foreground)', minHeight: 100 }}
              />
            </Field>

            <p className="text-xs" style={{ color: 'var(--muted)' }}>
              Format: <code>Name, Phone, Email, [extra columns…]</code> — first row is header.
            </p>

            {rows.length > 1 && (
              <p className="text-xs" style={{ color: '#10b981' }}>
                <Check className="inline w-3 h-3 mr-0.5" />{rows.length - 1} rows detected
              </p>
            )}

            {error && <ErrorMsg msg={error} />}

            <div className="flex justify-end gap-2">
              <GhostBtn onClick={onClose}>Cancel</GhostBtn>
              <PrimaryBtn onClick={buildPreview}>Preview →</PrimaryBtn>
            </div>
          </>
        ) : (
          <>
            <p className="text-sm" style={{ color: 'var(--muted)' }}>
              Group: <strong style={{ color: 'var(--foreground)' }}>{groupName}</strong> · {rows.length - 1} contact{rows.length - 1 !== 1 ? 's' : ''}
            </p>

            {/* UK 07 number fix banner */}
            {uk07Count > 0 && (
              <div
                className="flex items-start justify-between gap-3 px-4 py-3 rounded-xl border"
                style={{ background: 'rgba(251,191,36,0.08)', borderColor: 'rgba(251,191,36,0.4)' }}
              >
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#f59e0b' }} />
                  <div>
                    <p className="text-sm font-medium" style={{ color: '#f59e0b' }}>
                      {uk07Count} number{uk07Count !== 1 ? 's' : ''} start with 07 (UK local format)
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                      Most of your contacts are using +44. Convert the remaining {uk07Count} to UK international format?
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={applyUkFix}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium flex-shrink-0 hover:opacity-90"
                  style={{ background: '#f59e0b', color: '#000' }}
                >
                  <Wand2 className="w-3.5 h-3.5" /> Convert all to +44
                </button>
              </div>
            )}

            <div className="overflow-x-auto rounded-lg border" style={{ borderColor: 'var(--border)' }}>
              <table className="w-full text-xs" style={{ borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--surface)' }}>
                    {preview!.headers.map((h, i) => (
                      <th key={i} className="px-3 py-2 text-left font-medium" style={{ color: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview!.data.map((row, ri) => (
                    <tr key={ri} style={{ borderBottom: '1px solid var(--border)' }}>
                      {preview!.headers.map((_, ci) => {
                        const isPhoneCol = ci === 1;
                        const cellVal = row[ci] ?? '';
                        const isUk07 = isPhoneCol && /^07/.test(compactPhone(cellVal));
                        return (
                          <td
                            key={ci}
                            className="px-3 py-1.5"
                            style={{ color: isUk07 ? '#f59e0b' : 'var(--foreground)', fontWeight: isUk07 ? 600 : undefined }}
                          >
                            {cellVal}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {rows.length - 1 > 5 && (
              <p className="text-xs" style={{ color: 'var(--muted)' }}>Showing first 5 rows of {rows.length - 1}</p>
            )}

            {error && <ErrorMsg msg={error} />}

            <div className="flex justify-end gap-2">
              <GhostBtn onClick={() => setStep('input')}>← Back</GhostBtn>
              <PrimaryBtn onClick={doImport} disabled={importing}>
                {importing ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Importing…</> : `Import ${rows.length - 1} contacts`}
              </PrimaryBtn>
            </div>
          </>
        )}
      </div>
    </Overlay>
  );
}

// ── Connect to CRM modal (stub) ────────────────────────────────────────────────

const CRM_OPTIONS = [
  { id: 'salesforce', name: 'Salesforce', logo: '☁️' },
  { id: 'monday', name: 'Monday.com', logo: '📅' },
  { id: 'dynamics', name: 'Microsoft Dynamics', logo: '🔷' },
  { id: 'servicenow', name: 'ServiceNow', logo: '⚙️' },
] as const;

function CRMModal({ onClose }: { onClose: () => void }) {
  return (
    <Overlay onClose={onClose}>
      <div className="flex flex-col gap-4">
        <ModalHeader title="Connect to CRM" onClose={onClose} />
        <p className="text-sm" style={{ color: 'var(--muted)' }}>
          Sync your contacts directly from your CRM. Select a provider to get started.
        </p>
        <div className="flex flex-col gap-2">
          {CRM_OPTIONS.map((crm) => (
            <div
              key={crm.id}
              className="flex items-center justify-between p-4 rounded-xl border"
              style={{ background: 'var(--background)', borderColor: 'var(--border)' }}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{crm.logo}</span>
                <span className="font-medium text-sm">{crm.name}</span>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full" style={{ background: 'rgba(251,191,36,0.15)', color: '#f59e0b' }}>
                Coming soon
              </span>
            </div>
          ))}
        </div>
        <div className="flex justify-end">
          <GhostBtn onClick={onClose}>Close</GhostBtn>
        </div>
      </div>
    </Overlay>
  );
}

// ── shared tiny components ─────────────────────────────────────────────────────

function Overlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.5)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-lg rounded-2xl border p-6"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)', maxHeight: '90vh', overflowY: 'auto' }}
      >
        {children}
      </div>
    </div>
  );
}

function ModalHeader({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="font-semibold">{title}</h2>
      <button onClick={onClose} className="p-1 rounded hover:opacity-70" style={{ color: 'var(--muted)' }}>
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium">{label}</label>
      {children}
    </div>
  );
}

function Input({ value, onChange, placeholder, required, type = 'text' }: {
  value: string; onChange: (v: string) => void; placeholder?: string; required?: boolean; type?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      required={required}
      className="px-3 py-2 rounded-lg border text-sm outline-none"
      style={{ background: 'var(--background)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
    />
  );
}

function ErrorMsg({ msg }: { msg: string }) {
  return (
    <div className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg" style={{ background: 'rgba(248,113,113,0.1)', color: '#f87171' }}>
      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /> {msg}
    </div>
  );
}

function PrimaryBtn({ children, onClick, disabled, type = 'button' }: {
  children: React.ReactNode; onClick?: () => void; disabled?: boolean; type?: 'button' | 'submit';
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-60"
      style={{ background: 'var(--accent)', color: '#fff' }}
    >
      {children}
    </button>
  );
}

function GhostBtn({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="px-4 py-2 rounded-lg border text-sm"
      style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}
    >
      {children}
    </button>
  );
}

// ── Group filter dropdown ──────────────────────────────────────────────────────

function GroupFilter({ groups, selected, onChange }: { groups: string[]; selected: string; onChange: (g: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-xl border font-medium"
        style={{ borderColor: 'var(--border)', color: 'var(--foreground)', background: 'var(--surface)' }}
      >
        {selected || 'All groups'} <ChevronDown className="w-3.5 h-3.5" />
      </button>
      {open && (
        <div
          className="absolute top-full mt-1 left-0 min-w-40 rounded-xl border shadow-lg z-20"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          {['', ...groups].map((g) => (
            <button
              key={g || '__all'}
              onClick={() => { onChange(g); setOpen(false); }}
              className="w-full text-left px-4 py-2 text-sm hover:opacity-70 first:rounded-t-xl last:rounded-b-xl"
              style={{ color: 'var(--foreground)', background: g === selected ? 'rgba(59,130,246,0.08)' : undefined }}
            >
              {g || 'All groups'}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

type Modal = 'add' | 'edit' | 'upload' | 'crm' | null;

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [groupFilter, setGroupFilter] = useState('');
  const [modal, setModal] = useState<Modal>(null);
  const [editing, setEditing] = useState<Contact | null>(null);
  const [toast, setToast] = useState('');

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }, []);

  async function loadContacts() {
    try {
      const res = await fetch('/api/contacts');
      if (res.ok) setContacts(await res.json() as Contact[]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void loadContacts(); }, []);

  const groups = [...new Set(contacts.map((c) => c.groupName).filter(Boolean))] as string[];

  const visible = contacts.filter((c) => {
    const q = search.toLowerCase();
    const matchSearch =
      c.name.toLowerCase().includes(q) ||
      (c.phone ?? '').includes(q) ||
      (c.email ?? '').toLowerCase().includes(q) ||
      (c.groupName ?? '').toLowerCase().includes(q);
    const matchGroup = !groupFilter || c.groupName === groupFilter;
    return matchSearch && matchGroup;
  });

  async function deleteContact(id: string) {
    setContacts((prev) => prev.filter((c) => c.id !== id));
    await fetch(`/api/contacts/${id}`, { method: 'DELETE' });
    showToast('Contact deleted');
  }

  function handleSaved(updated: Contact) {
    setContacts((prev) => {
      const idx = prev.findIndex((c) => c.id === updated.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = updated;
        return next;
      }
      return [updated, ...prev];
    });
    showToast(editing ? 'Contact updated' : 'Contact added');
    setEditing(null);
  }

  function openEdit(c: Contact) {
    setEditing(c);
    setModal('edit');
  }

  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--background)', color: 'var(--foreground)' }}>
      <NavBar variant="app" />

      {/* Modals */}
      {modal === 'add' && <ContactModal onClose={() => setModal(null)} onSave={handleSaved} />}
      {modal === 'edit' && editing && <ContactModal contact={editing} onClose={() => { setModal(null); setEditing(null); }} onSave={handleSaved} />}
      {modal === 'upload' && (
        <UploadModal
          onClose={() => setModal(null)}
          onImported={(count) => { showToast(`${count} contacts imported`); void loadContacts(); }}
        />
      )}
      {modal === 'crm' && <CRMModal onClose={() => setModal(null)} />}

      {/* Toast */}
      {toast && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl text-sm font-medium shadow-lg flex items-center gap-2"
          style={{ background: '#10b981', color: '#fff' }}
        >
          <Check className="w-4 h-4" /> {toast}
        </div>
      )}

      <main className="max-w-4xl mx-auto w-full px-4 pt-24 pb-12">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <h1 className="text-2xl font-bold">Address Book</h1>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setModal('upload')}
              className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-xl border font-medium hover:opacity-80"
              style={{ borderColor: 'var(--border)', color: 'var(--foreground)', background: 'var(--surface)' }}
            >
              <Upload className="w-4 h-4" /> Upload Contacts
            </button>
            <button
              onClick={() => setModal('crm')}
              className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-xl border font-medium hover:opacity-80"
              style={{ borderColor: 'var(--border)', color: 'var(--foreground)', background: 'var(--surface)' }}
            >
              <Link2 className="w-4 h-4" /> Connect to CRM
            </button>
            <button
              onClick={() => setModal('add')}
              className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-xl font-medium hover:opacity-90"
              style={{ background: 'var(--accent)', color: '#fff' }}
            >
              <Plus className="w-4 h-4" /> Add Contact
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-4 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--muted)' }} />
            <input
              type="search"
              placeholder="Search contacts…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border text-sm outline-none"
              style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
            />
          </div>
          {groups.length > 0 && (
            <GroupFilter groups={groups} selected={groupFilter} onChange={setGroupFilter} />
          )}
        </div>

        <p className="text-xs mb-3" style={{ color: 'var(--muted)' }}>
          {loading ? 'Loading…' : `${visible.length} contact${visible.length !== 1 ? 's' : ''}`}
        </p>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--muted)' }} />
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {visible.length === 0 && (
              <div className="text-center py-16" style={{ color: 'var(--muted)' }}>
                <p className="text-sm">No contacts yet.</p>
                <p className="text-xs mt-1">Add a contact or upload a CSV to get started.</p>
              </div>
            )}
            {visible.map((c) => (
              <div
                key={c.id}
                className="flex items-center gap-4 p-4 rounded-xl border"
                style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm"
                  style={{ background: 'rgba(59,130,246,0.15)', color: 'var(--accent)' }}
                >
                  {initials(c.name)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-sm">{c.name}</p>
                    {c.groupName && <GroupBadge name={c.groupName} />}
                  </div>
                  <div className="flex flex-wrap gap-3 mt-0.5">
                    {c.phone && (
                      <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--muted)' }}>
                        <Phone className="w-3 h-3" />{compactPhone(c.phone)}
                      </span>
                    )}
                    {c.email && (
                      <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--muted)' }}>
                        <Mail className="w-3 h-3" />{c.email}
                      </span>
                    )}
                  </div>
                  {c.tags.length > 0 && (
                    <div className="flex gap-1 mt-1 flex-wrap">
                      {c.tags.map((t) => <Tag key={t} label={t} />)}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  <Link
                    href={`/send?to=${encodeURIComponent(compactPhone(c.phone ?? '') || (c.email ?? ''))}`}
                    className="p-2 rounded-lg hover:opacity-70 transition-all"
                    title="Send message"
                    style={{ color: 'var(--accent)' }}
                  >
                    <Send className="w-4 h-4" />
                  </Link>
                  <button
                    onClick={() => openEdit(c)}
                    className="p-2 rounded-lg hover:opacity-70 transition-all"
                    title="Edit contact"
                    style={{ color: 'var(--muted)' }}
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteContact(c.id)}
                    className="p-2 rounded-lg hover:opacity-70 transition-all"
                    title="Delete contact"
                    style={{ color: '#f87171' }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
