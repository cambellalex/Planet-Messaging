'use client';

import { useState, useEffect } from 'react';
import NavBar from '@/components/nav/NavBar';
import { Save, Loader2, Check, AlertCircle, DollarSign } from 'lucide-react';
import type { PricingConfig } from '@/lib/pricing';
import { CURRENCY_SYMBOLS } from '@/lib/pricing';

const CURRENCIES = Object.entries(CURRENCY_SYMBOLS).map(([code, sym]) => ({
  code,
  label: `${sym} ${code}`,
}));

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium">{label}</label>
      {hint && <p className="text-xs" style={{ color: 'var(--muted)' }}>{hint}</p>}
      {children}
    </div>
  );
}

function RateInput({ symbol, value, onChange }: { symbol: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-0">
      <span
        className="px-3 py-2 rounded-l-lg border-y border-l text-sm"
        style={{ background: 'var(--background)', borderColor: 'var(--border)', color: 'var(--muted)' }}
      >
        {symbol}
      </span>
      <input
        type="number"
        min={0}
        step={0.0001}
        value={value}
        onChange={(e) => onChange(Math.max(0, parseFloat(e.target.value) || 0))}
        className="flex-1 px-3 py-2 rounded-r-lg border text-sm outline-none"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
      />
    </div>
  );
}

export default function SettingsPage() {
  const [pricing, setPricing] = useState<PricingConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errMsg, setErrMsg] = useState('');

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json() as Promise<{ pricing: PricingConfig }>)
      .then((d) => setPricing(d.pricing))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!pricing) return;
    setSaving(true); setStatus('idle');
    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pricing }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(d.error ?? 'Save failed');
      }
      setStatus('success');
      setTimeout(() => setStatus('idle'), 3000);
    } catch (err) {
      setErrMsg(err instanceof Error ? err.message : 'Save failed');
      setStatus('error');
    } finally {
      setSaving(false);
    }
  }

  function update(patch: Partial<PricingConfig>) {
    setPricing((p) => p ? { ...p, ...patch } : p);
  }

  const sym = pricing ? (CURRENCY_SYMBOLS[pricing.currency] ?? pricing.currency + ' ') : '£';

  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--background)', color: 'var(--foreground)' }}>
      <NavBar variant="app" />

      <main className="max-w-2xl mx-auto w-full px-4 pt-24 pb-12">
        <h1 className="text-2xl font-bold mb-2">Settings</h1>
        <p className="text-sm mb-8" style={{ color: 'var(--muted)' }}>
          Configure your organisation&apos;s messaging costs. These rates are used to calculate spend in Reports.
        </p>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--muted)' }} />
          </div>
        ) : !pricing ? (
          <p style={{ color: '#f87171' }}>Failed to load settings.</p>
        ) : (
          <form onSubmit={handleSave} className="flex flex-col gap-6">

            {/* Currency */}
            <div
              className="p-5 rounded-2xl border flex flex-col gap-4"
              style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
            >
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                <h2 className="font-semibold text-sm">Messaging Costs</h2>
              </div>

              <Field label="Currency" hint="All spend figures in Reports will use this currency.">
                <select
                  value={pricing.currency}
                  onChange={(e) => update({ currency: e.target.value })}
                  className="px-3 py-2 rounded-lg border text-sm outline-none"
                  style={{ background: 'var(--background)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
                >
                  {CURRENCIES.map((c) => (
                    <option key={c.code} value={c.code}>{c.label}</option>
                  ))}
                </select>
              </Field>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field
                  label="SMS (per segment)"
                  hint="One segment = 160 characters. Long messages count as multiple segments."
                >
                  <RateInput symbol={sym} value={pricing.smsPerSegment} onChange={(v) => update({ smsPerSegment: v })} />
                </Field>

                <Field label="WhatsApp (per message)">
                  <RateInput symbol={sym} value={pricing.whatsappPerMessage} onChange={(v) => update({ whatsappPerMessage: v })} />
                </Field>

                <Field label="RCS (per message)">
                  <RateInput symbol={sym} value={pricing.rcsPerMessage} onChange={(v) => update({ rcsPerMessage: v })} />
                </Field>

                <Field label="Email (per message)">
                  <RateInput symbol={sym} value={pricing.emailPerMessage} onChange={(v) => update({ emailPerMessage: v })} />
                </Field>
              </div>

              <p className="text-xs" style={{ color: 'var(--muted)' }}>
                Defaults include a 12% markup on Twilio UK rates: SMS {sym}0.0448/seg · WhatsApp {sym}0.056 · RCS {sym}0.056 · Email {sym}0.0011
              </p>
            </div>

            {status === 'success' && (
              <div className="flex items-center gap-2 text-sm px-4 py-3 rounded-xl" style={{ background: 'rgba(52,211,153,0.1)', color: '#10b981' }}>
                <Check className="w-4 h-4" /> Settings saved
              </div>
            )}
            {status === 'error' && (
              <div className="flex items-center gap-2 text-sm px-4 py-3 rounded-xl" style={{ background: 'rgba(248,113,113,0.1)', color: '#f87171' }}>
                <AlertCircle className="w-4 h-4" /> {errMsg}
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-60"
                style={{ background: 'var(--accent)', color: '#fff' }}
              >
                {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : <><Save className="w-4 h-4" /> Save settings</>}
              </button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}
