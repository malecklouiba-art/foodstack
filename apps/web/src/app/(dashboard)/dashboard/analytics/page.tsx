'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Users, ShoppingBag, Euro, Download } from 'lucide-react';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { useGSAPReveal } from '@/hooks/useGSAPReveal';

// ── Mock data ──────────────────────────────────────────────────────────────────

const PERIODS = ['7j', '30j', '90j', 'Année'];

const REVENUE_DATA = [
  { day: 'Lun', revenue: 1840, objectif: 2500 },
  { day: 'Mar', revenue: 2230, objectif: 2500 },
  { day: 'Mer', revenue: 1960, objectif: 2500 },
  { day: 'Jeu', revenue: 2650, objectif: 2500 },
  { day: 'Ven', revenue: 3100, objectif: 2500 },
  { day: 'Sam', revenue: 3800, objectif: 2500 },
  { day: 'Dim', revenue: 2870, objectif: 2500 },
];

const KPI_CARDS = [
  { title: 'CA total',        value: '18 450€', change: '+14.2%', positive: true,  icon: Euro,        iconBg: 'bg-green-50 dark:bg-green-900/20',  iconColor: 'text-green-600 dark:text-green-400' },
  { title: 'Nb commandes',    value: '312',      change: '+8.7%',  positive: true,  icon: ShoppingBag, iconBg: 'bg-brand-50',  iconColor: 'text-brand-600' },
  { title: 'Panier moyen',    value: '59.13€',   change: '+5.1%',  positive: true,  icon: TrendingUp,  iconBg: 'bg-blue-50 dark:bg-blue-900/20',   iconColor: 'text-blue-600 dark:text-blue-400' },
  { title: 'Nouveaux clients',value: '47',       change: '-3.2%',  positive: false, icon: Users,       iconBg: 'bg-purple-50 dark:bg-purple-900/20', iconColor: 'text-purple-600 dark:text-purple-400' },
];

const PIE_DATA = [
  { name: 'Plats principaux', value: 45 },
  { name: 'Entrées',          value: 20 },
  { name: 'Desserts',         value: 18 },
  { name: 'Boissons',         value: 17 },
];

const PIE_COLORS = ['#1EFF6A', '#42ff7b', '#70ff98', '#abffbe'];

const DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const HOURS = ['8h', '10h', '12h', '14h', '16h', '18h', '20h', '22h'];

// Peak at 12h Fri/Sat/Sun, dinner peak 19-20h
const HEATMAP: Record<string, number[]> = {
  Lun: [2, 4, 18, 12,  8, 10, 14,  5],
  Mar: [1, 3, 20, 14,  9, 11, 16,  4],
  Mer: [3, 5, 22, 15, 10, 12, 17,  6],
  Jeu: [2, 4, 25, 16, 11, 13, 18,  7],
  Ven: [4, 6, 38, 20, 14, 17, 28, 10],
  Sam: [5, 8, 42, 24, 18, 20, 35, 14],
  Dim: [6, 9, 40, 22, 16, 18, 30, 12],
};

const MAX_HEATMAP = 42;

const TOP_ITEMS = [
  { rank: 1, name: 'Burger Classique',   sold: 234, revenue: 2808, change: +12.3, up: true  },
  { rank: 2, name: 'Salade César',       sold: 187, revenue: 1683, change: +5.7,  up: true  },
  { rank: 3, name: 'Pizza Margherita',   sold: 156, revenue: 1716, change: -2.1,  up: false },
  { rank: 4, name: 'Tiramisu',           sold: 143, revenue: 858,  change: +8.4,  up: true  },
  { rank: 5, name: 'Limonade maison',    sold: 198, revenue: 594,  change: -4.5,  up: false },
];

// ── Custom tooltip ─────────────────────────────────────────────────────────────

function AreaTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-surface-200 bg-white px-3 py-2 shadow-md">
      <p className="mb-1 text-xs font-medium text-surface-500">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="text-sm font-bold" style={{ color: p.color }}>
          {p.name === 'objectif' ? 'Objectif' : 'CA'}: {p.value.toLocaleString('fr-FR')}€
        </p>
      ))}
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const [period, setPeriod] = useState(0);
  const pageRef = useGSAPReveal<HTMLDivElement>('.gsap-card');

  return (
    <div ref={pageRef} className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Analytiques</h1>
          <p className="mt-1 text-sm text-surface-500">Analyse approfondie de votre activité</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex rounded-xl border border-surface-200 bg-surface-50 p-1">
            {PERIODS.map((p, i) => (
              <button
                key={p}
                onClick={() => setPeriod(i)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  period === i
                    ? 'bg-white text-surface-900 shadow-sm'
                    : 'text-surface-500 hover:text-surface-700'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
          <button className="flex items-center gap-2 rounded-xl border border-surface-200 bg-white px-4 py-2 text-sm font-medium text-surface-700 shadow-sm transition-colors hover:bg-surface-50">
            <Download className="h-4 w-4" />
            Exporter
          </button>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {KPI_CARDS.map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <motion.div
              key={kpi.title}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className="gsap-card"
            >
              <Card padding="lg" className="hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-surface-500">{kpi.title}</p>
                    <p className="mt-2 text-2xl font-bold text-surface-900">{kpi.value}</p>
                    <p className={`mt-1 flex items-center gap-1 text-xs font-medium ${kpi.positive ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>
                      {kpi.positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      {kpi.change} vs période préc.
                    </p>
                  </div>
                  <div className={`rounded-xl p-2.5 ${kpi.iconBg}`}>
                    <Icon className={`h-5 w-5 ${kpi.iconColor}`} />
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Charts row */}
      <div className="grid gap-6 xl:grid-cols-2">
        {/* Area chart */}
        <Card padding="lg" className="gsap-card">
          <CardHeader>
            <CardTitle>Chiffre d&apos;affaires — 7 derniers jours</CardTitle>
          </CardHeader>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={REVENUE_DATA} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1EFF6A" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#1EFF6A" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}€`} />
              <Tooltip content={<AreaTooltip />} />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#1EFF6A"
                strokeWidth={2}
                fill="url(#colorRevenue)"
                dot={{ fill: '#1EFF6A', r: 4, strokeWidth: 0 }}
                activeDot={{ r: 6 }}
              />
              <Area
                type="monotone"
                dataKey="objectif"
                stroke="#cbd5e1"
                strokeWidth={2}
                strokeDasharray="6 4"
                fill="none"
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
          <div className="mt-3 flex items-center gap-6 text-xs text-surface-500">
            <div className="flex items-center gap-2">
              <div className="h-0.5 w-6 rounded bg-brand-500" />
              <span>CA réel</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-0.5 w-6 rounded border-t-2 border-dashed border-surface-300" />
              <span>Objectif (2 500€/j)</span>
            </div>
          </div>
        </Card>

        {/* Pie chart */}
        <Card padding="lg" className="gsap-card">
          <CardHeader>
            <CardTitle>Répartition des commandes</CardTitle>
          </CardHeader>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={PIE_DATA}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={3}
                dataKey="value"
              >
                {PIE_DATA.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={PIE_COLORS[index]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => [`${value}%`, '']} />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {PIE_DATA.map((entry, i) => (
              <div key={entry.name} className="flex items-center gap-2 text-sm">
                <div className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: PIE_COLORS[i] }} />
                <span className="text-surface-600">{entry.name}</span>
                <span className="ml-auto font-semibold text-surface-900">{entry.value}%</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Heatmap */}
      <Card padding="lg" className="gsap-card">
        <CardHeader>
          <CardTitle>Commandes par jour / heure</CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="w-14 pb-2 text-left text-xs font-semibold text-surface-400" />
                {HOURS.map((h) => (
                  <th key={h} className="pb-2 text-center text-xs font-semibold text-surface-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="space-y-1">
              {DAYS.map((day) => (
                <tr key={day}>
                  <td className="pr-3 py-1 text-xs font-medium text-surface-600">{day}</td>
                  {HEATMAP[day].map((count, hi) => {
                    const opacity = Math.max(0.07, count / MAX_HEATMAP);
                    return (
                      <td key={hi} className="px-1 py-1">
                        <div
                          className="mx-auto flex h-9 w-full min-w-[2.5rem] items-center justify-center rounded-lg text-xs font-semibold"
                          style={{
                            backgroundColor: `rgba(249,115,22,${opacity})`,
                            color: opacity > 0.5 ? '#fff' : '#9a3412',
                          }}
                          title={`${day} ${HOURS[hi]}: ${count} cmd`}
                        >
                          {count}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-3 flex items-center gap-3 text-xs text-surface-400">
          <span>Intensité :</span>
          {[0.07, 0.3, 0.6, 1].map((op, i) => (
            <div key={i} className="flex items-center gap-1">
              <div className="h-4 w-4 rounded" style={{ backgroundColor: `rgba(249,115,22,${op})` }} />
              {i === 0 ? 'Faible' : i === 3 ? 'Fort' : ''}
            </div>
          ))}
        </div>
      </Card>

      {/* Bottom row */}
      <div className="grid gap-6 xl:grid-cols-[2fr,1fr]">
        {/* Top performers */}
        <Card padding="none" className="gsap-card">
          <CardHeader className="border-b border-surface-100 px-6 py-5">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-brand-500" />
              <CardTitle>Top 5 plats — cette période</CardTitle>
            </div>
          </CardHeader>
          <div className="divide-y divide-surface-100">
            {TOP_ITEMS.map((item, i) => (
              <motion.div
                key={item.name}
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center justify-between px-6 py-4 hover:bg-surface-50"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-surface-100 text-sm font-bold text-surface-600">
                    {item.rank}
                  </div>
                  <div>
                    <p className="font-medium text-surface-900">{item.name}</p>
                    <p className="text-sm text-surface-500">{item.sold} vendus</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <p className="font-bold text-surface-900">{item.revenue.toLocaleString('fr-FR')}€</p>
                  <div className={`flex items-center gap-1 text-xs font-medium ${item.up ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>
                    {item.up
                      ? <TrendingUp className="h-3.5 w-3.5" />
                      : <TrendingDown className="h-3.5 w-3.5" />}
                    {item.up ? '+' : ''}{item.change}%
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </Card>

        {/* Customer retention */}
        <Card padding="lg" className="gsap-card">
          <CardHeader>
            <CardTitle>Fidélisation clients</CardTitle>
          </CardHeader>
          <div className="space-y-5">
            {[
              { label: 'Clients récurrents',      value: '67%',   bar: 67, color: 'bg-green-500',  desc: 'Ont commandé 2× ou plus' },
              { label: 'Abandon de panier',        value: '23%',   bar: 23, color: 'bg-red-400',    desc: 'Panier non finalisé' },
              { label: 'NPS Score',                value: '72',    bar: 72, color: 'bg-brand-500',   desc: 'Net Promoter Score' },
            ].map((metric) => (
              <div key={metric.label}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <div>
                    <p className="font-medium text-surface-800">{metric.label}</p>
                    <p className="text-xs text-surface-400">{metric.desc}</p>
                  </div>
                  <span className="text-lg font-bold text-surface-900">{metric.value}</span>
                </div>
                <div className="h-2 w-full rounded-full bg-surface-100">
                  <div className={`h-full rounded-full ${metric.color} transition-all`} style={{ width: `${metric.bar}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 rounded-xl bg-brand-50 px-4 py-3">
            <p className="text-xs font-medium text-brand-700">Conseil IA</p>
            <p className="mt-1 text-sm text-brand-800">
              Vos clients récurrents génèrent <strong>78%</strong> du CA. Pensez à activer des offres de fidélité.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
