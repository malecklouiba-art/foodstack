'use client';

import { useState } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { TrendingUp, TrendingDown } from 'lucide-react';

const DATA_7D = [
  { label: 'Lun', revenue: 1840, orders: 42 },
  { label: 'Mar', revenue: 2230, orders: 56 },
  { label: 'Mer', revenue: 1960, orders: 48 },
  { label: 'Jeu', revenue: 2650, orders: 64 },
  { label: 'Ven', revenue: 3100, orders: 78 },
  { label: 'Sam', revenue: 3800, orders: 95 },
  { label: 'Dim', revenue: 2870, orders: 71 },
];

const DATA_30D = Array.from({ length: 30 }, (_, i) => ({
  label: `J${i + 1}`,
  revenue: Math.round(1200 + (i % 7 === 5 ? 2200 : i % 7 === 6 ? 1800 : 800) + (i * 37) % 600),
  orders:  Math.round(28 + (i % 7 === 5 ? 60 : i % 7 === 6 ? 48 : 20) + (i * 3) % 20),
}));

const DATA_TODAY = Array.from({ length: 16 }, (_, i) => {
  const h = i + 8;
  const lunch  = Math.exp(-0.5 * ((h - 12.5) / 1.8) ** 2);
  const dinner = Math.exp(-0.5 * ((h - 19.5) / 1.5) ** 2);
  return {
    label:   `${h}h`,
    revenue: Math.round(60 + lunch * 320 + dinner * 400),
    orders:  Math.round(2  + lunch * 14  + dinner * 18),
  };
});

const PERIODS = [
  { key: 'today', label: "Auj.", data: DATA_TODAY },
  { key: '7d',    label: '7j',   data: DATA_7D },
  { key: '30d',   label: '30j',  data: DATA_30D },
] as const;

type Period = typeof PERIODS[number]['key'];

interface TooltipPayload { value: number; name: string }
const CustomTooltip = ({ active, payload, label }: {
  active?: boolean; payload?: TooltipPayload[]; label?: string;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-surface-200 bg-white p-3 shadow-glass">
      <p className="mb-1.5 text-xs font-semibold text-surface-500">{label}</p>
      {payload.map((e) => (
        <p key={e.name} className="text-sm font-semibold text-surface-900">
          {e.name === 'revenue'
            ? `${Math.round(e.value).toLocaleString('fr-FR')}€`
            : `${e.value} cmd`}
        </p>
      ))}
    </div>
  );
};

interface Props { extraRevenue?: number }

export function RevenueChart({ extraRevenue = 0 }: Props) {
  const [period, setPeriod] = useState<Period>('7d');
  const conf = PERIODS.find((p) => p.key === period)!;

  const total       = conf.data.reduce((s, d) => s + d.revenue, 0) + extraRevenue;
  const totalOrders = conf.data.reduce((s, d) => s + d.orders, 0);
  const avg         = total / conf.data.length;
  const last        = conf.data[conf.data.length - 1].revenue;
  const prev        = conf.data[conf.data.length - 2]?.revenue ?? last;
  const trend       = ((last - prev) / prev) * 100;

  return (
    <Card padding="none">
      <CardHeader className="border-b border-surface-100 px-6 py-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            <div>
              <p className="text-2xl font-bold text-surface-900">
                {Math.round(total).toLocaleString('fr-FR')}€
              </p>
              <p className="text-xs text-surface-500">
                {totalOrders} commandes · moy. {Math.round(avg).toLocaleString('fr-FR')}€
              </p>
            </div>
            <div className={`flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold ${
              trend >= 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}>
              {trend >= 0
                ? <TrendingUp className="h-3.5 w-3.5" />
                : <TrendingDown className="h-3.5 w-3.5" />}
              {trend >= 0 ? '+' : ''}{trend.toFixed(1)}%
            </div>
          </div>
          {/* Period selector */}
          <div className="flex rounded-xl border border-surface-200 bg-surface-50 p-0.5">
            {PERIODS.map((p) => (
              <button
                key={p.key}
                onClick={() => setPeriod(p.key)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                  period === p.key
                    ? 'bg-white text-surface-900 shadow-sm'
                    : 'text-surface-500 hover:text-surface-700'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>
      <div className="p-6">
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={conf.data} margin={{ top: 10, right: 0, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#1EFF6A" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#1EFF6A" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="ordGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#60a5fa" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#60a5fa" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#71717a' }} axisLine={false} tickLine={false} />
            <YAxis
              tick={{ fontSize: 11, fill: '#71717a' }} axisLine={false} tickLine={false}
              tickFormatter={(v) => `${Math.round(v)}€`}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={avg} stroke="#1EFF6A" strokeDasharray="4 4" strokeOpacity={0.35} />
            <Area type="monotone" dataKey="revenue" name="revenue"
              stroke="#1EFF6A" strokeWidth={2.5} fill="url(#revGrad)"
              dot={false} activeDot={{ r: 4, fill: '#1EFF6A' }} />
            <Area type="monotone" dataKey="orders" name="orders"
              stroke="#60a5fa" strokeWidth={1.5} fill="url(#ordGrad)"
              dot={false} activeDot={{ r: 3, fill: '#60a5fa' }} />
          </AreaChart>
        </ResponsiveContainer>
        <div className="mt-3 flex items-center gap-5 text-xs text-surface-500">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-brand-500" />Revenus
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-blue-400" />Commandes
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-4 border-t border-dashed border-brand-400" />Moyenne
          </span>
        </div>
      </div>
    </Card>
  );
}
