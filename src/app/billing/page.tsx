'use client';

import { useState, useEffect } from 'react';
import NavBar from '@/components/nav/NavBar';
import { CreditCard, Zap, FileText, ArrowUpRight, Loader2, Check } from 'lucide-react';

interface OrgInfo {
  name: string;
  plan: string;
}

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: '£0',
    period: '/month',
    features: ['Up to 500 messages/month', '1 channel', '1 user', 'Basic reports'],
    cta: 'Current plan',
    highlight: false,
  },
  {
    id: 'starter',
    name: 'Starter',
    price: '£29',
    period: '/month',
    features: ['Up to 5,000 messages/month', '3 channels', '5 users', 'Full reports & exports', 'Campaign tracking'],
    cta: 'Upgrade to Starter',
    highlight: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '£99',
    period: '/month',
    features: ['Unlimited messages', 'All channels', 'Unlimited users', 'Full reports & exports', 'Campaign tracking', 'Priority support'],
    cta: 'Upgrade to Pro',
    highlight: true,
  },
];

const MOCK_INVOICES = [
  { id: 'INV-2026-006', date: 'Jun 2026', amount: '£29.00', status: 'Paid' },
  { id: 'INV-2026-005', date: 'May 2026', amount: '£29.00', status: 'Paid' },
  { id: 'INV-2026-004', date: 'Apr 2026', amount: '£29.00', status: 'Paid' },
  { id: 'INV-2026-003', date: 'Mar 2026', amount: '£29.00', status: 'Paid' },
];

function PlanCard({ plan, current }: { plan: typeof PLANS[number]; current: boolean }) {
  return (
    <div
      className="rounded-2xl border p-5 flex flex-col gap-3 relative"
      style={{
        background: plan.highlight ? 'var(--accent)' : 'var(--surface)',
        borderColor: plan.highlight ? 'var(--accent)' : 'var(--border)',
        color: plan.highlight ? '#fff' : 'var(--foreground)',
      }}
    >
      {plan.highlight && (
        <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-xs font-semibold px-3 py-0.5 rounded-full" style={{ background: '#fff', color: 'var(--accent)' }}>
          Most popular
        </span>
      )}
      <div>
        <p className="font-semibold text-sm">{plan.name}</p>
        <p className="text-2xl font-bold mt-1">
          {plan.price}<span className="text-sm font-normal opacity-70">{plan.period}</span>
        </p>
      </div>
      <ul className="flex flex-col gap-1.5 flex-1">
        {plan.features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-xs opacity-80">
            <Check className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            {f}
          </li>
        ))}
      </ul>
      <button
        disabled={current}
        className="mt-2 w-full py-2 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80 disabled:opacity-40"
        style={{
          background: plan.highlight ? '#fff' : 'var(--accent)',
          color: plan.highlight ? 'var(--accent)' : '#fff',
        }}
      >
        {current ? 'Current plan' : plan.cta}
      </button>
    </div>
  );
}

export default function BillingPage() {
  const [org, setOrg] = useState<OrgInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json() as Promise<OrgInfo>)
      .then(setOrg)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const currentPlan = org?.plan ?? 'free';

  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--background)', color: 'var(--foreground)' }}>
      <NavBar variant="app" />

      <main className="max-w-3xl mx-auto w-full px-4 pt-24 pb-12">
        <h1 className="text-2xl font-bold mb-2">Billing</h1>
        <p className="text-sm mb-10" style={{ color: 'var(--muted)' }}>
          Manage your subscription, payment method, and invoices.
        </p>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--muted)' }} />
          </div>
        ) : (
          <div className="flex flex-col gap-8">

            {/* Current plan summary */}
            <div className="rounded-2xl border p-5 flex items-center gap-4" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(var(--accent-rgb, 99,102,241),0.12)' }}>
                <Zap className="w-5 h-5" style={{ color: 'var(--accent)' }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold capitalize">{currentPlan} plan</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                  {currentPlan === 'free' ? 'Upgrade to unlock more channels, users, and higher message limits.' : 'Your subscription renews on the 1st of each month.'}
                </p>
              </div>
              <a
                href="mailto:support@planetmessaging.io"
                className="shrink-0 flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border hover:opacity-80"
                style={{ borderColor: 'var(--border)', color: 'var(--muted)', background: 'var(--background)' }}
              >
                Contact sales <ArrowUpRight className="w-3 h-3" />
              </a>
            </div>

            {/* Plan cards */}
            <div>
              <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
                <CreditCard className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                Plans
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {PLANS.map((plan) => (
                  <PlanCard key={plan.id} plan={plan} current={plan.id === currentPlan} />
                ))}
              </div>
              <p className="text-xs mt-3 text-center" style={{ color: 'var(--muted)' }}>
                Need a custom volume deal?{' '}
                <a href="mailto:support@planetmessaging.io" className="underline hover:opacity-80">
                  Talk to us
                </a>
              </p>
            </div>

            {/* Payment method */}
            <div className="rounded-2xl border p-5" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
              <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
                <CreditCard className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                Payment method
              </h2>
              {currentPlan === 'free' ? (
                <p className="text-sm" style={{ color: 'var(--muted)' }}>No payment method required on the Free plan.</p>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-6 rounded border flex items-center justify-center text-xs font-bold" style={{ borderColor: 'var(--border)', background: 'var(--background)' }}>
                      VISA
                    </div>
                    <span className="text-sm">•••• •••• •••• 4242</span>
                    <span className="text-xs" style={{ color: 'var(--muted)' }}>Expires 12/27</span>
                  </div>
                  <button className="text-xs px-3 py-1.5 rounded-lg border hover:opacity-80" style={{ borderColor: 'var(--border)', color: 'var(--muted)', background: 'var(--background)' }}>
                    Update
                  </button>
                </div>
              )}
            </div>

            {/* Invoice history */}
            <div className="rounded-2xl border p-5" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
              <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
                <FileText className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                Invoice history
              </h2>
              {currentPlan === 'free' ? (
                <p className="text-sm" style={{ color: 'var(--muted)' }}>No invoices yet. Invoices appear here once you upgrade to a paid plan.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs" style={{ color: 'var(--muted)' }}>
                      <th className="text-left pb-3 font-medium">Invoice</th>
                      <th className="text-left pb-3 font-medium">Date</th>
                      <th className="text-left pb-3 font-medium">Amount</th>
                      <th className="text-left pb-3 font-medium">Status</th>
                      <th className="pb-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {MOCK_INVOICES.map((inv) => (
                      <tr key={inv.id} className="border-t" style={{ borderColor: 'var(--border)' }}>
                        <td className="py-3 font-mono text-xs">{inv.id}</td>
                        <td className="py-3" style={{ color: 'var(--muted)' }}>{inv.date}</td>
                        <td className="py-3">{inv.amount}</td>
                        <td className="py-3">
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: 'rgba(16,185,129,0.12)', color: '#10b981' }}>
                            {inv.status}
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          <button className="text-xs hover:opacity-80 flex items-center gap-1 ml-auto" style={{ color: 'var(--muted)' }}>
                            PDF <ArrowUpRight className="w-3 h-3" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

          </div>
        )}
      </main>
    </div>
  );
}
