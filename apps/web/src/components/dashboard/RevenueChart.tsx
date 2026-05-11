'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';

const data = [
  { day: 'Lun', revenue: 1840, orders: 42 },
  { day: 'Mar', revenue: 2230, orders: 56 },
  { day: 'Mer', revenue: 1960, orders: 48 },
  { day: 'Jeu', revenue: 2650, orders: 64 },
  { day: 'Ven', revenue: 3100, orders: 78 },
  { day: 'Sam', revenue: 3800, orders: 95 },
  { day: 'Dim', revenue: 2870, orders: 71 },
];

interface TooltipPayload {
  value: number;
  name: string;
}

const CustomTooltip = ({ active, payload, label }: {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-surface-200 bg-white p-3 shadow-glass">
      <p className="mb-2 text-xs font-semibold text-surface-500">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} className="text-sm font-semibold text-surface-900">
          {entry.name === 'revenue' ? `${entry.value.toLocaleString('fr-FR')}€` : `${entry.value} cmd`}
        </p>
      ))}
    </div>
  );
};

export function RevenueChart() {
  return (
    <Card padding="none">
      <CardHeader className="border-b border-surface-100 px-6 py-5">
        <div className="flex items-center justify-between">
          <CardTitle>Chiffre d'affaires — Cette semaine</CardTitle>
          <div className="flex items-center gap-4 text-xs text-surface-500">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-brand-500" />
              Revenus
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-blue-400" />
              Commandes
            </div>
          </div>
        </div>
      </CardHeader>
      <div className="p-6">
        <div className="mb-2 flex gap-6">
          <div>
            <p className="text-3xl font-bold text-surface-900">18 450€</p>
            <p className="text-sm text-surface-500">Total cette semaine</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-surface-900">454</p>
            <p className="text-sm text-surface-500">Commandes</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={data} margin={{ top: 10, right: 0, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f97316" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="ordersGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#60a5fa" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
            <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#71717a' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: '#71717a' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}€`} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="revenue" name="revenue" stroke="#f97316" strokeWidth={2} fill="url(#revenueGradient)" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
