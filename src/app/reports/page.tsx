'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import dynamic from 'next/dynamic';
import NavBar from '@/components/nav/NavBar';
import { Download, Loader2, ChevronDown, BarChart2, TrendingUp, Signal } from 'lucide-react';

// Recharts — dynamically imported to avoid SSR issues
const ResponsiveContainer = dynamic(() => import('recharts').then((m) => m.ResponsiveContainer), { ssr: false });
const BarChart = dynamic(() => import('recharts').then((m) => m.BarChart), { ssr: false });
const Bar = dynamic(() => import('recharts').then((m) => m.Bar), { ssr: false });
const LineChart = dynamic(() => import('recharts').then((m) => m.LineChart), { ssr: false });
const Line = dynamic(() => import('recharts').then((m) => m.Line), { ssr: false });
const XAxis = dynamic(() => import('recharts').then((m) => m.XAxis), { ssr: false });
const YAxis = dynamic(() => import('recharts').then((m) => m.YAxis), { ssr: false });
const CartesianGrid = dynamic(() => import('recharts').then((m) => m.CartesianGrid), { ssr: false });
const Tooltip = dynamic(() => import('recharts').then((m) => m.Tooltip), { ssr: false });
const Legend = dynamic(() => import('recharts').then((m) => m.Legend), { ssr: false });
const PieChart = dynamic(() => import('recharts').then((m) => m.PieChart), { ssr: false });
const Pie = dynamic(() => import('recharts').then((m) => m.Pie), { ssr: false });
const Cell = dynamic(() => import('recharts').then((m) => m.Cell), { ssr: false });

// ── Types ──────────────────────────────────────────────────────────────────────

interface DailyRow { date: string; sent: number; delivered: number; failed: number }
interface DeliveryRow { status: string; count: number }
interface NetworkRow { network: string; count: number }
interface Campaign { id: string; name: string; createdAt: string }

const DATE_RANGES = [
  { label: '30 days', days: 30 },
  { label: '60 days', days: 60 },
  { label: '90 days', days: 90 },
  { label: '180 days', days: 180 },
  { label: '1 year', days: 365 },
];

const COLORS = {
  sent:      '#3b82f6',
  delivered: '#10b981',
  failed:    '#f87171',
  network:   ['#3b82f6', '#10b981', '#f59e0b', '#a78bfa', '#f87171', '#64748b', '#06b6d4', '#ec4899'],
};

// ── CSV / Excel export helpers ──────────────────────────────────────────────────

function toCSV(headers: string[], rows: (string | number)[][]): string {
  const escape = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  return [headers, ...rows].map((row) => row.map(escape).join(',')).join('\n');
}

function downloadCSV(filename: string, csv: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

async function downloadXLSX(filename: string, headers: string[], rows: (string | number)[][]) {
  const XLSX = await import('xlsx');
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Data');
  XLSX.writeFile(wb, filename);
}

// ── Shared UI ──────────────────────────────────────────────────────────────────

function Card({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border p-5" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
      <div className="flex items-center gap-2 mb-4">
        <span style={{ color: 'var(--accent)' }}>{icon}</span>
        <h2 className="font-semibold text-sm">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function ExportBar({ onCSV, onXLSX }: { onCSV: () => void; onXLSX: () => void }) {
  return (
    <div className="flex items-center gap-2 justify-end mt-3">
      <button
        onClick={onCSV}
        className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border hover:opacity-80"
        style={{ borderColor: 'var(--border)', color: 'var(--muted)', background: 'var(--background)' }}
      >
        <Download className="w-3 h-3" /> CSV
      </button>
      <button
        onClick={onXLSX}
        className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border hover:opacity-80"
        style={{ borderColor: 'var(--border)', color: 'var(--muted)', background: 'var(--background)' }}
      >
        <Download className="w-3 h-3" /> Excel
      </button>
    </div>
  );
}

function ChartLoader() {
  return (
    <div className="flex items-center justify-center h-48">
      <Loader2 className="w-5 h-5 animate-spin" style={{ color: 'var(--muted)' }} />
    </div>
  );
}

function EmptyChart({ msg }: { msg: string }) {
  return (
    <div className="flex items-center justify-center h-48 text-sm" style={{ color: 'var(--muted)' }}>
      {msg}
    </div>
  );
}

// ── Dropdown ───────────────────────────────────────────────────────────────────

function Dropdown<T extends string | number>({ value, onChange, options }: {
  value: T;
  onChange: (v: T) => void;
  options: { label: string; value: T }[];
}) {
  return (
    <div className="relative inline-block">
      <select
        value={String(value)}
        onChange={(e) => onChange(options.find((o) => String(o.value) === e.target.value)?.value ?? options[0].value)}
        className="appearance-none pl-3 pr-8 py-1.5 rounded-lg border text-sm outline-none cursor-pointer"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
      >
        {options.map((o) => <option key={String(o.value)} value={String(o.value)}>{o.label}</option>)}
      </select>
      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none" style={{ color: 'var(--muted)' }} />
    </div>
  );
}

// ── Custom tooltip style ───────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border px-3 py-2 text-xs shadow-lg" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
      {label && <p className="font-medium mb-1" style={{ color: 'var(--foreground)' }}>{label}</p>}
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>{p.name}: <strong>{p.value.toLocaleString()}</strong></p>
      ))}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

function ReportsPageInner() {
  const [days, setDays] = useState(30);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [campaignId, setCampaignId] = useState<string>('');

  const [dailyData, setDailyData] = useState<DailyRow[] | null>(null);
  const [deliveryData, setDeliveryData] = useState<DeliveryRow[] | null>(null);
  const [networkData, setNetworkData] = useState<NetworkRow[] | null>(null);

  const [dailyLoading, setDailyLoading] = useState(true);
  const [deliveryLoading, setDeliveryLoading] = useState(true);
  const [networkLoading, setNetworkLoading] = useState(true);

  // Load campaign list for filter dropdown
  useEffect(() => {
    fetch('/api/campaigns')
      .then((r) => r.json() as Promise<Campaign[]>)
      .then(setCampaigns)
      .catch(() => {});
  }, []);

  const qs = `days=${days}${campaignId ? `&campaignId=${campaignId}` : ''}`;

  const loadDaily = useCallback(() => {
    setDailyLoading(true);
    fetch(`/api/reports/daily-sends?${qs}`)
      .then((r) => r.json() as Promise<DailyRow[]>)
      .then(setDailyData)
      .catch(() => setDailyData([]))
      .finally(() => setDailyLoading(false));
  }, [qs]);

  const loadDelivery = useCallback(() => {
    setDeliveryLoading(true);
    fetch(`/api/reports/delivery?${qs}`)
      .then((r) => r.json() as Promise<DeliveryRow[]>)
      .then(setDeliveryData)
      .catch(() => setDeliveryData([]))
      .finally(() => setDeliveryLoading(false));
  }, [qs]);

  const loadNetworks = useCallback(() => {
    setNetworkLoading(true);
    fetch(`/api/reports/networks?${qs}`)
      .then((r) => r.json() as Promise<NetworkRow[]>)
      .then(setNetworkData)
      .catch(() => setNetworkData([]))
      .finally(() => setNetworkLoading(false));
  }, [qs]);

  useEffect(() => { loadDaily(); }, [loadDaily]);
  useEffect(() => { loadDelivery(); }, [loadDelivery]);
  useEffect(() => { loadNetworks(); }, [loadNetworks]);

  // Format date label compactly
  function fmtDate(d: string) {
    return new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  }

  // ── Export helpers ──────────────────────────────────────────────────────────

  function exportDailyCSV() {
    if (!dailyData) return;
    downloadCSV('daily-sends.csv', toCSV(
      ['Date', 'Sent', 'Delivered', 'Failed'],
      dailyData.map((r) => [r.date, r.sent, r.delivered, r.failed]),
    ));
  }
  function exportDailyXLSX() {
    if (!dailyData) return;
    void downloadXLSX('daily-sends.xlsx', ['Date', 'Sent', 'Delivered', 'Failed'],
      dailyData.map((r) => [r.date, r.sent, r.delivered, r.failed]));
  }

  function exportDeliveryCSV() {
    if (!deliveryData) return;
    downloadCSV('delivery-stats.csv', toCSV(['Status', 'Count'], deliveryData.map((r) => [r.status, r.count])));
  }
  function exportDeliveryXLSX() {
    if (!deliveryData) return;
    void downloadXLSX('delivery-stats.xlsx', ['Status', 'Count'], deliveryData.map((r) => [r.status, r.count]));
  }

  function exportNetworksCSV() {
    if (!networkData) return;
    downloadCSV('networks.csv', toCSV(['Network', 'Count'], networkData.map((r) => [r.network, r.count])));
  }
  function exportNetworksXLSX() {
    if (!networkData) return;
    void downloadXLSX('networks.xlsx', ['Network', 'Count'], networkData.map((r) => [r.network, r.count]));
  }

  // Tick formatter — show every Nth label so the axis isn't crowded
  function tickEvery(data: DailyRow[], idx: number) {
    const step = Math.max(1, Math.ceil(data.length / 10));
    return idx % step === 0 ? fmtDate(data[idx]?.date ?? '') : '';
  }

  const campaignOptions = [
    { label: 'All campaigns', value: '' },
    ...campaigns.map((c) => ({ label: c.name, value: c.id })),
  ];

  const hasDailyData = dailyData && dailyData.some((r) => r.sent > 0);
  const hasDelivery = deliveryData && deliveryData.some((r) => r.count > 0);
  const hasNetworks = networkData && networkData.length > 0;

  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--background)', color: 'var(--foreground)' }}>
      <NavBar variant="app" />

      <main className="max-w-5xl mx-auto w-full px-4 pt-24 pb-12">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
          <h1 className="text-2xl font-bold">Reports</h1>

          {/* Global filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <Dropdown
              value={campaignId}
              onChange={(v) => setCampaignId(v)}
              options={campaignOptions}
            />
            <Dropdown
              value={days}
              onChange={(v) => setDays(v)}
              options={DATE_RANGES.map((r) => ({ label: r.label, value: r.days }))}
            />
          </div>
        </div>

        <div className="flex flex-col gap-6">

          {/* ── 1. Daily Sends ──────────────────────────────────────────────── */}
          <Card title="Daily Sends" icon={<TrendingUp className="w-4 h-4" />}>
            {dailyLoading ? <ChartLoader /> : !hasDailyData ? (
              <EmptyChart msg="No outbound messages in this period" />
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={dailyData} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(_, idx) => tickEvery(dailyData!, idx)}
                    tick={{ fontSize: 11, fill: 'var(--muted)' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--muted)' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line type="monotone" dataKey="sent" name="Sent" stroke={COLORS.sent} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                  <Line type="monotone" dataKey="delivered" name="Delivered" stroke={COLORS.delivered} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                  <Line type="monotone" dataKey="failed" name="Failed" stroke={COLORS.failed} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
            <ExportBar onCSV={exportDailyCSV} onXLSX={exportDailyXLSX} />
          </Card>

          {/* ── 2. Delivery Breakdown ───────────────────────────────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card title="Sent vs Delivered vs Failed" icon={<BarChart2 className="w-4 h-4" />}>
              {deliveryLoading ? <ChartLoader /> : !hasDelivery ? (
                <EmptyChart msg="No data for this period" />
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={deliveryData!}
                      dataKey="count"
                      nameKey="status"
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={3}
                    >
                      {deliveryData!.map((_, i) => (
                        <Cell key={i} fill={[COLORS.delivered, COLORS.sent, COLORS.failed][i % 3]} />
                      ))}
                    </Pie>
                    <Tooltip content={<ChartTooltip />} />
                    <Legend
                      formatter={(value, entry) => (
                        <span style={{ fontSize: 12, color: 'var(--foreground)' }}>
                          {value} — {(entry as { payload?: { count?: number } }).payload?.count?.toLocaleString() ?? 0}
                        </span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
              <ExportBar onCSV={exportDeliveryCSV} onXLSX={exportDeliveryXLSX} />
            </Card>

            {/* ── 3. Mobile Networks ──────────────────────────────────────────── */}
            <Card title="Mobile Networks" icon={<Signal className="w-4 h-4" />}>
              {networkLoading ? <ChartLoader /> : !hasNetworks ? (
                <EmptyChart msg="No data for this period" />
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={networkData} layout="vertical" margin={{ top: 0, right: 20, bottom: 0, left: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--muted)' }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <YAxis dataKey="network" type="category" tick={{ fontSize: 11, fill: 'var(--muted)' }} axisLine={false} tickLine={false} width={80} />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="count" name="Messages" radius={[0, 4, 4, 0]}>
                      {networkData!.map((_, i) => (
                        <Cell key={i} fill={COLORS.network[i % COLORS.network.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
              <ExportBar onCSV={exportNetworksCSV} onXLSX={exportNetworksXLSX} />
            </Card>
          </div>

        </div>
      </main>
    </div>
  );
}

export default function ReportsPage() {
  return (
    <Suspense>
      <ReportsPageInner />
    </Suspense>
  );
}
