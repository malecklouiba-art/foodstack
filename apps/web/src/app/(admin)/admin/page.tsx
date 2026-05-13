'use client';

import { motion } from 'framer-motion';
import {
  Store,
  Users,
  Euro,
  TrendingUp,
  TrendingDown,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowUpRight,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { Badge } from '@/components/ui/Badge';

const MRR_DATA = [
  { month: 'Nov', mrr: 8200 },
  { month: 'Déc', mrr: 9400 },
  { month: 'Jan', mrr: 8800 },
  { month: 'Fév', mrr: 10200 },
  { month: 'Mar', mrr: 11500 },
  { month: 'Avr', mrr: 12100 },
  { month: 'Mai', mrr: 13400 },
];

const ORDERS_BY_RESTAURANT = [
  { name: 'Le Gourmet', orders: 312 },
  { name: 'Bella Italia', orders: 278 },
  { name: 'Sushi Club', orders: 241 },
  { name: 'Burger Co.', orders: 198 },
  { name: 'La Crêperie', orders: 156 },
];

const RECENT_RESTAURANTS = [
  { name: 'Le Gourmet Parisien', plan: 'Pro', status: 'active', mrr: 149, orders: 312, joined: '2 mai 2026' },
  { name: 'Bella Italia', plan: 'Starter', status: 'active', mrr: 49, orders: 278, joined: '28 avr. 2026' },
  { name: 'Sushi Club Lyon', plan: 'Pro', status: 'active', mrr: 149, orders: 241, joined: '15 avr. 2026' },
  { name: 'Burger Factory', plan: 'Pro', status: 'trial', mrr: 0, orders: 198, joined: '10 mai 2026' },
  { name: 'La Crêperie Bretonne', plan: 'Starter', status: 'suspended', mrr: 49, orders: 0, joined: '3 mar. 2026' },
];

const SYSTEM_ALERTS = [
  { type: 'ok', message: 'API — Latence moyenne 42ms', time: 'Maintenant' },
  { type: 'warning', message: 'Redis — Utilisation mémoire 78%', time: 'il y a 5 min' },
  { type: 'ok', message: 'PostgreSQL — Connexions : 12/100', time: 'Maintenant' },
  { type: 'error', message: 'Webhook Stripe — 3 échecs consécutifs', time: 'il y a 12 min' },
];

const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'success' | 'warning' | 'danger' }> = {
  active: { label: 'Actif', variant: 'success' },
  trial: { label: 'Essai', variant: 'warning' },
  suspended: { label: 'Suspendu', variant: 'danger' },
};

export default function SuperAdminDashboard() {
  const kpis = [
    { label: 'Restaurants actifs', value: '24', change: +4, icon: Store, color: 'bg-brand-100 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400' },
    { label: 'Utilisateurs total', value: '8 412', change: +12, icon: Users, color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' },
    { label: 'MRR', value: '13 400 €', change: +10, icon: Euro, color: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' },
    { label: 'Commandes (7j)', value: '4 891', change: +8, icon: Activity, color: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-50">Vue globale</h1>
          <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">Plateforme FoodStack · {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.map((kpi, i) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-2xl border border-surface-200 bg-white p-5 shadow-sm dark:bg-surface-900 dark:border-surface-700"
          >
            <div className="mb-3 flex items-center justify-between">
              <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${kpi.color}`}>
                <kpi.icon className="h-4 w-4" />
              </div>
              <span className={`flex items-center gap-1 text-xs font-semibold ${kpi.change >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                {kpi.change >= 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                {kpi.change >= 0 ? '+' : ''}{kpi.change}%
              </span>
            </div>
            <p className="text-2xl font-bold text-surface-900 dark:text-surface-50">{kpi.value}</p>
            <p className="mt-0.5 text-sm text-surface-500 dark:text-surface-400">{kpi.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* MRR chart */}
        <div className="lg:col-span-2 rounded-2xl border border-surface-200 bg-white p-6 shadow-sm dark:bg-surface-900 dark:border-surface-700">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="font-semibold text-surface-900 dark:text-surface-50">MRR (Monthly Recurring Revenue)</h2>
            <span className="flex items-center gap-1 text-xs font-semibold text-green-600">
              <TrendingUp className="h-3.5 w-3.5" />
              +63% sur 6 mois
            </span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={MRR_DATA} margin={{ top: 5, right: 0, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="mrrGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#71717a' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#71717a' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}€`} />
              <Tooltip
                contentStyle={{ borderRadius: '12px', border: '1px solid #e4e4e7', fontSize: 12 }}
                formatter={(v: number) => [`${v.toLocaleString('fr-FR')} €`, 'MRR']}
              />
              <Area type="monotone" dataKey="mrr" stroke="#f97316" strokeWidth={2} fill="url(#mrrGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* System status */}
        <div className="rounded-2xl border border-surface-200 bg-white p-6 shadow-sm dark:bg-surface-900 dark:border-surface-700">
          <h2 className="mb-4 font-semibold text-surface-900 dark:text-surface-50">Statut système</h2>
          <div className="space-y-3">
            {SYSTEM_ALERTS.map((alert, i) => (
              <div key={i} className="flex items-start gap-3">
                {alert.type === 'ok' && <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" />}
                {alert.type === 'warning' && <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-yellow-500" />}
                {alert.type === 'error' && <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500" />}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-surface-800 leading-tight dark:text-surface-200">{alert.message}</p>
                  <div className="mt-0.5 flex items-center gap-1 text-xs text-surface-400 dark:text-surface-500">
                    <Clock className="h-3 w-3" />
                    {alert.time}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Orders by restaurant */}
      <div className="rounded-2xl border border-surface-200 bg-white p-6 shadow-sm dark:bg-surface-900 dark:border-surface-700">
        <h2 className="mb-4 font-semibold text-surface-900 dark:text-surface-50">Commandes par restaurant (7 jours)</h2>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={ORDERS_BY_RESTAURANT} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#71717a' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#71717a' }} axisLine={false} tickLine={false} />
            <Tooltip cursor={{ fill: '#f4f4f5' }} contentStyle={{ borderRadius: '12px', border: '1px solid #e4e4e7', fontSize: 12 }} />
            <Bar dataKey="orders" name="Commandes" fill="#f97316" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Restaurants table */}
      <div className="rounded-2xl border border-surface-200 bg-white shadow-sm overflow-hidden dark:bg-surface-900 dark:border-surface-700">
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-100 dark:border-surface-700">
          <h2 className="font-semibold text-surface-900 dark:text-surface-50">Restaurants récents</h2>
          <a href="/admin/restaurants" className="flex items-center gap-1 text-xs text-brand-600 font-medium hover:underline">
            Voir tous <ArrowUpRight className="h-3 w-3" />
          </a>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-100 bg-surface-50 dark:border-surface-700 dark:bg-surface-800">
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-surface-400 dark:text-surface-500">Restaurant</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-surface-400 dark:text-surface-500">Plan</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-surface-400 dark:text-surface-500">Statut</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-surface-400 dark:text-surface-500">MRR</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-surface-400 dark:text-surface-500">Commandes</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-surface-400 dark:text-surface-500">Inscription</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100 dark:divide-surface-700">
              {RECENT_RESTAURANTS.map((r) => {
                const sc = STATUS_CONFIG[r.status];
                return (
                  <tr key={r.name} className="hover:bg-surface-50 transition-colors dark:hover:bg-surface-800">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-100 text-xs font-bold text-surface-600 dark:bg-surface-800 dark:text-surface-300">
                          {r.name.charAt(0)}
                        </div>
                        <span className="font-medium text-surface-900 dark:text-surface-50">{r.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                        r.plan === 'Pro' ? 'bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400' : 'bg-surface-100 text-surface-600 dark:bg-surface-800 dark:text-surface-400'
                      }`}>
                        {r.plan}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <Badge variant={sc.variant} size="sm">{sc.label}</Badge>
                    </td>
                    <td className="px-4 py-4 text-right font-medium text-surface-900 dark:text-surface-50">
                      {r.mrr > 0 ? `${r.mrr} €` : '—'}
                    </td>
                    <td className="px-4 py-4 text-right text-surface-600 dark:text-surface-400">{r.orders}</td>
                    <td className="px-6 py-4 text-surface-400 dark:text-surface-500">{r.joined}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
