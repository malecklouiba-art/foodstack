'use client';

import { useState } from 'react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { motion } from 'framer-motion';
import {
  TrendingUp, TrendingDown, Euro, ShoppingBag, Users, Star,
  Clock, Download, Calendar,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

const PERIODS = ['7 jours', '30 jours', '3 mois', '12 mois'] as const;
type Period = typeof PERIODS[number];

const REVENUE_DATA: Record<Period, { label: string; revenue: number; orders: number }[]> = {
  '7 jours': [
    { label: 'Lun', revenue: 1840, orders: 42 },
    { label: 'Mar', revenue: 2230, orders: 56 },
    { label: 'Mer', revenue: 1960, orders: 48 },
    { label: 'Jeu', revenue: 2650, orders: 64 },
    { label: 'Ven', revenue: 3100, orders: 78 },
    { label: 'Sam', revenue: 3800, orders: 95 },
    { label: 'Dim', revenue: 2870, orders: 71 },
  ],
  '30 jours': Array.from({ length: 30 }, (_, i) => ({
    label: `${i + 1}`,
    revenue: Math.floor(1500 + Math.random() * 2500),
    orders: Math.floor(30 + Math.random() * 80),
  })),
  '3 mois': [
    { label: 'Mar', revenue: 52400, orders: 1240 },
    { label: 'Avr', revenue: 61200, orders: 1480 },
    { label: 'Mai', revenue: 58900, orders: 1390 },
  ],
  '12 mois': [
    { label: 'Juin', revenue: 42000, orders: 980 },
    { label: 'Juil', revenue: 51000, orders: 1200 },
    { label: 'Août', revenue: 48000, orders: 1100 },
    { label: 'Sep', revenue: 55000, orders: 1300 },
    { label: 'Oct', revenue: 61000, orders: 1450 },
    { label: 'Nov', revenue: 58000, orders: 1380 },
    { label: 'Déc', revenue: 72000, orders: 1720 },
    { label: 'Jan', revenue: 45000, orders: 1050 },
    { label: 'Fév', revenue: 49000, orders: 1160 },
    { label: 'Mar', revenue: 52400, orders: 1240 },
    { label: 'Avr', revenue: 61200, orders: 1480 },
    { label: 'Mai', revenue: 58900, orders: 1390 },
  ],
};

const HOURLY_DATA = [
  { hour: '8h', orders: 4 }, { hour: '9h', orders: 8 }, { hour: '10h', orders: 12 },
  { hour: '11h', orders: 28 }, { hour: '12h', orders: 65 }, { hour: '13h', orders: 72 },
  { hour: '14h', orders: 45 }, { hour: '15h', orders: 22 }, { hour: '16h', orders: 18 },
  { hour: '17h', orders: 30 }, { hour: '18h', orders: 55 }, { hour: '19h', orders: 78 },
  { hour: '20h', orders: 82 }, { hour: '21h', orders: 68 }, { hour: '22h', orders: 40 },
  { hour: '23h', orders: 15 },
];

const ORDER_TYPES = [
  { name: 'Livraison', value: 58, color: '#f97316' },
  { name: 'À emporter', value: 27, color: '#60a5fa' },
  { name: 'Sur place', value: 15, color: '#34d399' },
];

const TOP_ITEMS = [
  { name: 'Classic Burger', orders: 284, revenue: 4231.6, trend: +12 },
  { name: 'Margherita', orders: 231, revenue: 3210.9, trend: +5 },
  { name: 'Truffle Burger', orders: 178, revenue: 4005, trend: -3 },
  { name: 'Chicken Burger', orders: 162, revenue: 2089.8, trend: +8 },
  { name: 'Tiramisu', orders: 145, revenue: 1087.5, trend: +21 },
];

const CUSTOMER_STATS = [
  { label: 'Nouveaux clients', value: 142, change: +18, icon: Users },
  { label: 'Clients récurrents', value: 389, change: +7, icon: Star },
  { label: 'Taux de rétention', value: '73%', change: +3, icon: TrendingUp },
  { label: 'Note moyenne', value: '4.8★', change: +0.1, icon: Star },
];

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number; name: string }[]; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-surface-200 bg-white p-3 shadow-lg text-sm">
      <p className="mb-1.5 font-semibold text-surface-500">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="font-bold text-surface-900">
          {p.name === 'revenue' ? `${p.value.toLocaleString('fr-FR')} €` : `${p.value} cmd`}
        </p>
      ))}
    </div>
  );
};

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<Period>('7 jours');
  const data = REVENUE_DATA[period];
  const totalRevenue = data.reduce((s, d) => s + d.revenue, 0);
  const totalOrders = data.reduce((s, d) => s + d.orders, 0);
  const avgOrder = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Analytiques</h1>
          <p className="mt-1 text-sm text-surface-500">Performances de votre restaurant</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex gap-1 rounded-xl border border-surface-200 bg-surface-50 p-1">
            {PERIODS.map((p) => (
              <button key={p} onClick={() => setPeriod(p)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${period === p ? 'bg-white text-surface-900 shadow-sm' : 'text-surface-500 hover:text-surface-700'}`}>
                {p}
              </button>
            ))}
          </div>
          <Button variant="ghost" size="sm" icon={<Download className="h-4 w-4" />}>
            Exporter
          </Button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: 'Chiffre d\'affaires', value: `${totalRevenue.toLocaleString('fr-FR')} €`, change: +14, icon: Euro, color: 'bg-brand-100 text-brand-600' },
          { label: 'Commandes', value: totalOrders.toLocaleString('fr-FR'), change: +9, icon: ShoppingBag, color: 'bg-blue-100 text-blue-600' },
          { label: 'Panier moyen', value: `${avgOrder.toFixed(2)} €`, change: +4, icon: TrendingUp, color: 'bg-green-100 text-green-600' },
          { label: 'Clients uniques', value: '531', change: +18, icon: Users, color: 'bg-purple-100 text-purple-600' },
        ].map((kpi, i) => (
          <motion.div key={kpi.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="rounded-2xl border border-surface-200 bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${kpi.color}`}>
                <kpi.icon className="h-4 w-4" />
              </div>
              <span className={`flex items-center gap-1 text-xs font-semibold ${kpi.change >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                {kpi.change >= 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                {kpi.change >= 0 ? '+' : ''}{kpi.change}%
              </span>
            </div>
            <p className="text-2xl font-bold text-surface-900">{kpi.value}</p>
            <p className="mt-0.5 text-sm text-surface-500">{kpi.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Revenue chart */}
      <div className="rounded-2xl border border-surface-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-semibold text-surface-900">Revenus & Commandes</h2>
          <div className="flex items-center gap-4 text-xs text-surface-500">
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-brand-500" /> Revenus</span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={data} margin={{ top: 5, right: 0, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f97316" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#71717a' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#71717a' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}€`} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="revenue" name="revenue" stroke="#f97316" strokeWidth={2} fill="url(#grad)" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Commandes par heure */}
        <div className="rounded-2xl border border-surface-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Clock className="h-4 w-4 text-brand-500" />
            <h2 className="font-semibold text-surface-900">Commandes par heure</h2>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={HOURLY_DATA} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" vertical={false} />
              <XAxis dataKey="hour" tick={{ fontSize: 10, fill: '#71717a' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#71717a' }} axisLine={false} tickLine={false} />
              <Tooltip cursor={{ fill: '#f4f4f5' }} contentStyle={{ borderRadius: '12px', border: '1px solid #e4e4e7', fontSize: 12 }} />
              <Bar dataKey="orders" name="Commandes" fill="#f97316" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Répartition par type */}
        <div className="rounded-2xl border border-surface-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 font-semibold text-surface-900">Répartition par type</h2>
          <div className="flex items-center gap-6">
            <ResponsiveContainer width={160} height={160}>
              <PieChart>
                <Pie data={ORDER_TYPES} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                  {ORDER_TYPES.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-3">
              {ORDER_TYPES.map((t) => (
                <div key={t.name} className="flex items-center gap-2.5">
                  <span className="h-3 w-3 rounded-full flex-shrink-0" style={{ background: t.color }} />
                  <span className="text-sm text-surface-700">{t.name}</span>
                  <span className="ml-auto text-sm font-bold text-surface-900">{t.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Top articles */}
      <div className="rounded-2xl border border-surface-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold text-surface-900">Articles les plus vendus</h2>
          <Badge variant="default" size="sm">Cette semaine</Badge>
        </div>
        <div className="space-y-3">
          {TOP_ITEMS.map((item, i) => (
            <div key={item.name} className="flex items-center gap-4">
              <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-surface-100 text-xs font-bold text-surface-500">
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-surface-900 truncate">{item.name}</p>
                  <span className={`ml-2 flex items-center gap-0.5 text-xs font-semibold ${item.trend >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {item.trend >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {item.trend >= 0 ? '+' : ''}{item.trend}%
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-3">
                  <div className="flex-1 h-1.5 overflow-hidden rounded-full bg-surface-100">
                    <div className="h-full rounded-full bg-brand-400" style={{ width: `${(item.orders / TOP_ITEMS[0].orders) * 100}%` }} />
                  </div>
                  <span className="text-xs text-surface-400 w-16 text-right">{item.orders} cmd</span>
                  <span className="text-xs font-semibold text-surface-700 w-20 text-right">{item.revenue.toLocaleString('fr-FR')} €</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Customer stats */}
      <div className="rounded-2xl border border-surface-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 font-semibold text-surface-900">Clients</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {CUSTOMER_STATS.map(({ label, value, change, icon: Icon }) => (
            <div key={label} className="rounded-xl bg-surface-50 p-4">
              <div className="mb-2 flex items-center justify-between">
                <Icon className="h-4 w-4 text-surface-400" />
                <span className={`text-xs font-semibold ${change >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                  {change >= 0 ? '+' : ''}{change}{typeof change === 'number' && Math.abs(change) < 10 && !label.includes('Note') ? '%' : ''}
                </span>
              </div>
              <p className="text-xl font-bold text-surface-900">{value}</p>
              <p className="mt-0.5 text-xs text-surface-500">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
