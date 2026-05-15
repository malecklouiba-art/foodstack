'use client';

import { motion } from 'framer-motion';
import {
  TrendingUp,
  Store,
  CreditCard,
  Euro,
  CheckCircle2,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import Link from 'next/link';

// ── Demo data ─────────────────────────────────────────────────────────────────

const mrrData = [
  { month: 'Juin',   mrr: 18200 },
  { month: 'Juil',   mrr: 19400 },
  { month: 'Août',   mrr: 19900 },
  { month: 'Sep',    mrr: 20500 },
  { month: 'Oct',    mrr: 21200 },
  { month: 'Nov',    mrr: 21800 },
  { month: 'Déc',    mrr: 22400 },
  { month: 'Jan',    mrr: 22900 },
  { month: 'Fév',    mrr: 23100 },
  { month: 'Mar',    mrr: 23600 },
  { month: 'Avr',    mrr: 24200 },
  { month: 'Mai',    mrr: 24850 },
];

const systemServices = [
  { name: 'API Gateway',  status: 'Opérationnel', uptime: '99.98%', latency: '42ms'  },
  { name: 'Database',     status: 'Opérationnel', uptime: '99.99%', latency: '8ms'   },
  { name: 'Redis Cache',  status: 'Opérationnel', uptime: '100%',   latency: '1ms'   },
  { name: 'CDN',          status: 'Opérationnel', uptime: '99.95%', latency: '18ms'  },
];

const recentRestaurants = [
  { name: 'Le Petit Bistro',     plan: 'Pro',        status: 'Actif',   joined: '10 mai 2026',  mrr: '79€'  },
  { name: 'Sushi Yama',          plan: 'Enterprise', status: 'Actif',   joined: '8 mai 2026',   mrr: '199€' },
  { name: 'Pizza Palace',        plan: 'Starter',    status: 'Trial',   joined: '7 mai 2026',   mrr: '0€'   },
  { name: 'Burger Factory',      plan: 'Pro',        status: 'Actif',   joined: '5 mai 2026',   mrr: '79€'  },
  { name: 'La Crêperie Dorée',   plan: 'Starter',    status: 'Actif',   joined: '2 mai 2026',   mrr: '29€'  },
];

// ── KPI cards ─────────────────────────────────────────────────────────────────

const kpis = [
  {
    title:    'MRR',
    value:    '24 850€',
    change:   '+8.2%',
    positive: true,
    icon:     Euro,
    iconBg:   'bg-green-50 dark:bg-green-900/20',
    iconColor:'text-green-600 dark:text-green-400',
  },
  {
    title:    'Total restaurants',
    value:    '47',
    change:   '+3 ce mois',
    positive: true,
    icon:     Store,
    iconBg:   'bg-blue-50 dark:bg-blue-900/20',
    iconColor:'text-blue-600 dark:text-blue-400',
  },
  {
    title:    'Abonnements actifs',
    value:    '41',
    change:   '87% du total',
    positive: true,
    icon:     CreditCard,
    iconBg:   'bg-purple-50 dark:bg-purple-900/20',
    iconColor:'text-purple-600 dark:text-purple-400',
  },
  {
    title:    'Revenus annualisés',
    value:    '298 200€',
    change:   '+8.2% ARR',
    positive: true,
    icon:     TrendingUp,
    iconBg:   'bg-brand-50 dark:bg-brand-900/20',
    iconColor:'text-brand-600 dark:text-brand-400',
  },
];

function statusBadge(status: string) {
  if (status === 'Actif')  return <Badge variant="success" dot>{status}</Badge>;
  if (status === 'Trial')  return <Badge variant="warning" dot>{status}</Badge>;
  return <Badge variant="danger" dot>{status}</Badge>;
}

function planBadge(plan: string) {
  if (plan === 'Enterprise') return <Badge variant="info">{plan}</Badge>;
  if (plan === 'Pro')        return <Badge variant="brand">{plan}</Badge>;
  return <Badge variant="default">{plan}</Badge>;
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AdminOverviewPage() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Super Admin</h1>
          <p className="mt-1 text-sm text-surface-500">
            {new Date().toLocaleDateString('fr-FR', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-xl bg-green-50 dark:bg-green-900/20 px-4 py-2">
          <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
          <span className="text-sm font-medium text-green-700 dark:text-green-400">Tous les systèmes opérationnels</span>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <motion.div
              key={kpi.title}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
            >
              <Card padding="lg" className="hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-surface-500">{kpi.title}</p>
                    <p className="mt-2 text-2xl font-bold text-surface-900">{kpi.value}</p>
                    <p className={`mt-1 flex items-center gap-1 text-xs font-medium ${
                      kpi.positive ? 'text-green-600 dark:text-green-400' : 'text-red-500'
                    }`}>
                      <TrendingUp className="h-3 w-3" />
                      {kpi.change}
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

      {/* MRR Chart + System Status */}
      <div className="grid gap-6 xl:grid-cols-[2fr,1fr]">
        {/* MRR chart */}
        <Card padding="none">
          <CardHeader className="border-b border-surface-100 dark:border-surface-700 px-6 py-5">
            <div>
              <CardTitle>Évolution du MRR</CardTitle>
              <CardDescription className="mt-0.5">12 derniers mois</CardDescription>
            </div>
            <span className="text-xl font-bold text-brand-500">24 850€</span>
          </CardHeader>
          <div className="p-6 pt-4">
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={mrrData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="mrrGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#1EFF6A" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#1EFF6A" stopOpacity={0}    />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k€`} />
                <Tooltip
                  contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: 12 }}
                  formatter={(value: number) => [`${value.toLocaleString('fr-FR')}€`, 'MRR']}
                />
                <Area type="monotone" dataKey="mrr" stroke="#1EFF6A" strokeWidth={2} fill="url(#mrrGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* System status */}
        <Card padding="none">
          <CardHeader className="border-b border-surface-100 dark:border-surface-700 px-6 py-5">
            <CardTitle>Statut système</CardTitle>
            <Badge variant="success" dot>Opérationnel</Badge>
          </CardHeader>
          <div className="divide-y divide-surface-100 dark:divide-surface-700">
            {systemServices.map((svc) => (
              <div key={svc.name} className="flex items-center justify-between px-6 py-4">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-surface-900">{svc.name}</p>
                    <p className="text-xs text-surface-500">Uptime {svc.uptime}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-medium text-green-600 dark:text-green-400">{svc.status}</p>
                  <p className="text-xs text-surface-400">{svc.latency}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Recent restaurants table */}
      <Card padding="none">
        <CardHeader className="border-b border-surface-100 dark:border-surface-700 px-6 py-5">
          <CardTitle>Derniers restaurants inscrits</CardTitle>
          <Link href="/admin/restaurants" className="text-sm font-medium text-brand-500 hover:text-brand-400 transition-colors">
            Voir tous →
          </Link>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-100 dark:border-surface-700">
                {['Restaurant', 'Plan', 'Statut', 'Inscrit le', 'MRR'].map((h) => (
                  <th key={h} className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-surface-500">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100 dark:divide-surface-700">
              {recentRestaurants.map((r) => (
                <tr key={r.name} className="hover:bg-surface-50 dark:hover:bg-surface-800/40 transition-colors">
                  <td className="px-6 py-4 font-medium text-surface-900">{r.name}</td>
                  <td className="px-6 py-4">{planBadge(r.plan)}</td>
                  <td className="px-6 py-4">{statusBadge(r.status)}</td>
                  <td className="px-6 py-4 text-surface-500">{r.joined}</td>
                  <td className="px-6 py-4 font-semibold text-surface-900">{r.mrr}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
