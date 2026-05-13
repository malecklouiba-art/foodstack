'use client';

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';

const HOURS = Array.from({ length: 16 }, (_, i) => {
  const h = i + 8; // 08:00 → 23:00
  const orders = Math.round(
    5 + 18 * Math.exp(-0.5 * ((h - 12.5) / 2.5) ** 2) +
    14 * Math.exp(-0.5 * ((h - 19.5) / 1.8) ** 2)
  );
  return { hour: `${h}h`, orders };
});

const CURRENT_HOUR = new Date().getHours();

interface TooltipPayload { value: number; name: string }
const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: TooltipPayload[]; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-surface-200 bg-white px-3 py-2 shadow-glass">
      <p className="text-xs font-semibold text-surface-500">{label}</p>
      <p className="text-sm font-bold text-surface-900">{payload[0].value} cmd</p>
    </div>
  );
};

interface Props {
  liveOrderCount?: number;
}

export function HourlyChart({ liveOrderCount = 0 }: Props) {
  const data = HOURS.map((h) => {
    const isNow = parseInt(h.hour) === CURRENT_HOUR;
    return { ...h, orders: isNow ? h.orders + liveOrderCount : h.orders, isNow };
  });

  const peak = Math.max(...data.map((d) => d.orders));

  return (
    <Card padding="none">
      <CardHeader className="border-b border-surface-100 px-6 py-5">
        <div className="flex items-center justify-between">
          <CardTitle>Commandes par heure</CardTitle>
          <span className="text-xs text-surface-400">Heure de pointe · {peak} cmd</span>
        </div>
      </CardHeader>
      <div className="px-6 pb-6 pt-4">
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={data} barSize={18} margin={{ top: 4, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" vertical={false} />
            <XAxis dataKey="hour" tick={{ fontSize: 11, fill: '#71717a' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#71717a' }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f4f4f5' }} />
            <Bar dataKey="orders" radius={[6, 6, 0, 0]}>
              {data.map((entry, index) => (
                <Cell
                  key={index}
                  fill={entry.isNow ? '#f97316' : entry.orders >= peak * 0.8 ? '#fb923c' : '#fed7aa'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
