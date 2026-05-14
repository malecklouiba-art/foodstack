'use client';

import { motion } from 'framer-motion';
import { TrendingUp, CheckCircle2 } from 'lucide-react';
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

// ── Demo data ─────────────────────────────────────────────────────────────────

const revenueHistory = [
  { month: 'Juin',  revenue: 1800 },
  { month: 'Juil',  revenue: 2050 },
  { month: 'Août',  revenue: 2100 },
  { month: 'Sep',   revenue: 2300 },
  { month: 'Oct',   revenue: 2450 },
  { month: 'Nov',   revenue: 2500 },
  { month: 'Déc',   revenue: 2600 },
  { month: 'Jan',   revenue: 2750 },
  { month: 'Fév',   revenue: 2820 },
  { month: 'Mar',   revenue: 2950 },
  { month: 'Avr',   revenue: 3100 },
  { month: 'Mai',   revenue: 3239 },
];

const billingHistory = [
  { date: '14 mai 2026',  restaurant: 'Sushi Yama',          plan: 'Enterprise', amount: '199€', status: 'Payé'     },
  { date: '14 mai 2026',  restaurant: 'Cloud Kitchen Alpha',  plan: 'Enterprise', amount: '199€', status: 'Payé'     },
  { date: '13 mai 2026',  restaurant: 'Le Petit Bistro',      plan: 'Pro',        amount: '79€',  status: 'Payé'     },
  { date: '13 mai 2026',  restaurant: 'Burger Factory',       plan: 'Pro',        amount: '79€',  status: 'Payé'     },
  { date: '12 mai 2026',  restaurant: 'La Crêperie Dorée',    plan: 'Starter',    amount: '29€',  status: 'Payé'     },
  { date: '10 mai 2026',  restaurant: 'Ramen Republic',       plan: 'Pro',        amount: '79€',  status: 'Payé'     },
  { date: '9 mai 2026',   restaurant: 'Thai Garden',          plan: 'Starter',    amount: '29€',  status: 'Payé'     },
  { date: '8 mai 2026',   restaurant: 'Tacos Azteca',         plan: 'Pro',        amount: '79€',  status: 'Échoué'   },
  { date: '7 mai 2026',   restaurant: 'Le Ramen House',       plan: 'Starter',    amount: '29€',  status: 'Remboursé'},
  { date: '6 mai 2026',   restaurant: 'Pizza Palace',         plan: 'Starter',    amount: '0€',   status: 'Trial'    },
];

const plans = [
  {
    name:        'Starter',
    price:       '29€',
    period:      '/mois',
    restaurants: 12,
    mrr:         348,
    color:       'text-surface-700 dark:text-surface-300',
    bg:          'bg-surface-50 dark:bg-surface-800/40',
    border:      'border-surface-200 dark:border-surface-700',
    features:    ['1 emplacement', 'Menu en ligne', 'Commandes basiques', 'Support email'],
  },
  {
    name:        'Pro',
    price:       '79€',
    period:      '/mois',
    restaurants: 24,
    mrr:         1896,
    color:       'text-brand-600 dark:text-brand-400',
    bg:          'bg-brand-500/5 dark:bg-brand-500/10',
    border:      'border-brand-500/30',
    features:    ['3 emplacements', 'Analytics avancés', 'Livraison intégrée', 'Support prioritaire'],
    popular:     true,
  },
  {
    name:        'Enterprise',
    price:       '199€',
    period:      '/mois',
    restaurants: 5,
    mrr:         995,
    color:       'text-purple-600 dark:text-purple-400',
    bg:          'bg-purple-50 dark:bg-purple-900/10',
    border:      'border-purple-200 dark:border-purple-800',
    features:    ['Illimité', 'API complète', 'SLA 99.9%', 'Account manager dédié'],
  },
];

function paymentStatusBadge(status: string) {
  if (status === 'Payé')       return <Badge variant="success">{status}</Badge>;
  if (status === 'Échoué')     return <Badge variant="danger">{status}</Badge>;
  if (status === 'Remboursé')  return <Badge variant="warning">{status}</Badge>;
  return <Badge variant="default">{status}</Badge>;
}

function planBadge(plan: string) {
  if (plan === 'Enterprise') return <Badge variant="info">{plan}</Badge>;
  if (plan === 'Pro')        return <Badge variant="brand">{plan}</Badge>;
  return <Badge variant="default">{plan}</Badge>;
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SubscriptionsPage() {
  const totalMRR   = plans.reduce((sum, p) => sum + p.mrr, 0);
  const totalSubs  = plans.reduce((sum, p) => sum + p.restaurants, 0);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Abonnements</h1>
          <p className="mt-1 text-sm text-surface-500">Gestion des plans et facturation</p>
        </div>
        <div className="flex items-center gap-3 rounded-2xl bg-surface-100 dark:bg-surface-800 px-5 py-3">
          <div>
            <p className="text-xs text-surface-500">MRR total</p>
            <p className="text-xl font-bold text-brand-500">{totalMRR.toLocaleString('fr-FR')}€</p>
          </div>
          <div className="h-8 w-px bg-surface-200 dark:bg-surface-700" />
          <div>
            <p className="text-xs text-surface-500">Abonnements</p>
            <p className="text-xl font-bold text-surface-900">{totalSubs}</p>
          </div>
        </div>
      </div>

      {/* Plan cards */}
      <div className="grid gap-5 sm:grid-cols-3">
        {plans.map((plan, i) => (
          <motion.div
            key={plan.name}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
          >
            <div className={`relative rounded-2xl border p-6 ${plan.bg} ${plan.border}`}>
              {plan.popular && (
                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-brand-500 px-3 py-0.5 text-xs font-bold text-black">
                  Populaire
                </span>
              )}
              <div className="mb-4">
                <h3 className={`text-lg font-bold ${plan.color}`}>{plan.name}</h3>
                <div className="mt-1 flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-surface-900">{plan.price}</span>
                  <span className="text-sm text-surface-500">{plan.period}</span>
                </div>
              </div>

              <div className="mb-4 grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-white/50 dark:bg-surface-800/50 p-3">
                  <p className="text-xs text-surface-500">Restaurants</p>
                  <p className="text-xl font-bold text-surface-900">{plan.restaurants}</p>
                </div>
                <div className="rounded-xl bg-white/50 dark:bg-surface-800/50 p-3">
                  <p className="text-xs text-surface-500">MRR</p>
                  <p className="text-xl font-bold text-surface-900">{plan.mrr}€</p>
                </div>
              </div>

              <ul className="space-y-1.5">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-surface-600 dark:text-surface-400">
                    <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0 text-green-500" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        ))}
      </div>

      {/* MRR Breakdown + Revenue chart */}
      <div className="grid gap-6 xl:grid-cols-[1fr,2fr]">
        {/* Breakdown */}
        <Card padding="lg">
          <CardHeader>
            <CardTitle>Répartition MRR</CardTitle>
            <span className="text-lg font-bold text-brand-500">3 239€</span>
          </CardHeader>
          <div className="space-y-4">
            {plans.map((plan) => {
              const pct = Math.round((plan.mrr / totalMRR) * 100);
              const barColor =
                plan.name === 'Enterprise' ? 'bg-purple-500' :
                plan.name === 'Pro'        ? 'bg-brand-500' :
                'bg-surface-400';
              return (
                <div key={plan.name}>
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className={`h-2.5 w-2.5 rounded-full ${barColor}`} />
                      <span className="font-medium text-surface-700 dark:text-surface-300">{plan.name}</span>
                      <span className="text-surface-400">{pct}%</span>
                    </div>
                    <span className="font-semibold text-surface-900">{plan.mrr}€</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-surface-100 dark:bg-surface-700">
                    <div className={`h-full rounded-full ${barColor} transition-all`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-5 flex items-center gap-1.5 rounded-xl bg-green-50 dark:bg-green-900/20 px-3 py-2">
            <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
            <span className="text-xs font-medium text-green-700 dark:text-green-400">+8.2% vs mois dernier</span>
          </div>
        </Card>

        {/* Revenue chart */}
        <Card padding="none">
          <CardHeader className="border-b border-surface-100 dark:border-surface-700 px-6 py-5">
            <div>
              <CardTitle>Revenus mensuels</CardTitle>
              <CardDescription className="mt-0.5">12 derniers mois</CardDescription>
            </div>
          </CardHeader>
          <div className="p-6 pt-4">
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={revenueHistory} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#1EFF6A" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#1EFF6A" stopOpacity={0}   />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `${v}€`} />
                <Tooltip
                  contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: 12 }}
                  formatter={(value: number) => [`${value.toLocaleString('fr-FR')}€`, 'Revenus']}
                />
                <Area type="monotone" dataKey="revenue" stroke="#1EFF6A" strokeWidth={2} fill="url(#revGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Billing history */}
      <Card padding="none">
        <CardHeader className="border-b border-surface-100 dark:border-surface-700 px-6 py-5">
          <CardTitle>Historique de facturation</CardTitle>
          <span className="text-sm text-surface-500">10 dernières transactions</span>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-100 dark:border-surface-700">
                {['Date', 'Restaurant', 'Plan', 'Montant', 'Statut'].map((h) => (
                  <th key={h} className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-surface-500">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100 dark:divide-surface-700">
              {billingHistory.map((row, idx) => (
                <tr key={idx} className="hover:bg-surface-50 dark:hover:bg-surface-800/40 transition-colors">
                  <td className="px-6 py-4 text-surface-500">{row.date}</td>
                  <td className="px-6 py-4 font-medium text-surface-900">{row.restaurant}</td>
                  <td className="px-6 py-4">{planBadge(row.plan)}</td>
                  <td className="px-6 py-4 font-semibold text-surface-900">{row.amount}</td>
                  <td className="px-6 py-4">{paymentStatusBadge(row.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
