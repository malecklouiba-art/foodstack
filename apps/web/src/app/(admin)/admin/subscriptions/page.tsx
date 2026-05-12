'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Euro, TrendingUp, Users, CreditCard, CheckCircle2,
  ChevronUp, ChevronDown, AlertCircle,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';

const PLANS = [
  {
    name: 'Starter',
    price: 49,
    color: 'bg-surface-100 dark:bg-surface-800',
    textColor: 'text-surface-700 dark:text-surface-200',
    features: ['1 restaurant', 'Jusqu\'à 500 cmd/mois', 'Support email', 'Analytics basiques'],
    subscribers: 9,
    mrr: 9 * 49,
  },
  {
    name: 'Pro',
    price: 149,
    color: 'bg-brand-500',
    textColor: 'text-white',
    features: ['Multi-restaurants', 'Commandes illimitées', 'Support prioritaire', 'Analytics avancées', 'API accès', 'Exports PDF/Excel'],
    subscribers: 13,
    mrr: 13 * 149,
  },
  {
    name: 'Enterprise',
    price: 299,
    color: 'bg-surface-900 dark:bg-surface-950',
    textColor: 'text-white',
    features: ['Tout Pro +', 'Onboarding dédié', 'SLA 99.9%', 'Intégrations custom', 'Facturation sur mesure', 'Account manager'],
    subscribers: 2,
    mrr: 2 * 299,
  },
];

const BILLING_HISTORY = [
  { restaurant: 'Le Steak House', plan: 'Enterprise', amount: 299, date: '01/05/2026', status: 'paid' },
  { restaurant: 'Le Gourmet Parisien', plan: 'Pro', amount: 149, date: '01/05/2026', status: 'paid' },
  { restaurant: 'Sushi Club Lyon', plan: 'Pro', amount: 149, date: '01/05/2026', status: 'paid' },
  { restaurant: 'Pho Saigon', plan: 'Pro', amount: 149, date: '01/05/2026', status: 'paid' },
  { restaurant: 'Bella Italia', plan: 'Starter', amount: 49, date: '01/05/2026', status: 'paid' },
  { restaurant: 'Taco Loco', plan: 'Starter', amount: 49, date: '01/05/2026', status: 'paid' },
  { restaurant: 'La Crêperie Bretonne', plan: 'Starter', amount: 49, date: '01/04/2026', status: 'failed' },
  { restaurant: 'Burger Factory', plan: 'Pro', amount: 149, date: '10/05/2026', status: 'trial' },
];

const MRR_BREAKDOWN = [
  { label: 'MRR actuel', value: 2_547, change: +10.6 },
  { label: 'Nouveau MRR', value: 298, change: +4 },
  { label: 'MRR perdu (churn)', value: 49, change: -1 },
  { label: 'MRR net', value: 249, change: +9.8 },
];

export default function SubscriptionsPage() {
  const [tab, setTab] = useState<'overview' | 'billing'>('overview');

  const totalMRR = PLANS.reduce((s, p) => s + p.mrr, 0);
  const totalSubs = PLANS.reduce((s, p) => s + p.subscribers, 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-50">Abonnements</h1>
          <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">{totalSubs} abonnés actifs · {totalMRR.toLocaleString('fr-FR')} € MRR</p>
        </div>
        <div className="flex gap-1 rounded-xl border border-surface-200 bg-surface-50 p-1 dark:border-surface-700 dark:bg-surface-800">
          {(['overview', 'billing'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                tab === t
                  ? 'bg-white text-surface-900 shadow-sm dark:bg-surface-700 dark:text-surface-50'
                  : 'text-surface-500 hover:text-surface-700 dark:text-surface-400 dark:hover:text-surface-200'
              }`}
            >
              {t === 'overview' ? 'Vue d\'ensemble' : 'Historique'}
            </button>
          ))}
        </div>
      </div>

      {tab === 'overview' && (
        <>
          {/* MRR metrics */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {MRR_BREAKDOWN.map((m, i) => (
              <motion.div
                key={m.label}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="rounded-2xl border border-surface-200 bg-white p-5 shadow-sm dark:bg-surface-900 dark:border-surface-700"
              >
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-xs font-medium text-surface-500 dark:text-surface-400">{m.label}</span>
                  <span className={`flex items-center gap-0.5 text-xs font-semibold ${m.change >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {m.change >= 0 ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                    {Math.abs(m.change)}%
                  </span>
                </div>
                <p className="text-2xl font-bold text-surface-900 dark:text-surface-50">{m.value.toLocaleString('fr-FR')} €</p>
              </motion.div>
            ))}
          </div>

          {/* Plans */}
          <div className="grid gap-4 md:grid-cols-3">
            {PLANS.map((plan) => (
              <div key={plan.name} className="rounded-2xl border border-surface-200 bg-white shadow-sm overflow-hidden dark:border-surface-700 dark:bg-surface-900">
                <div className={`p-5 ${plan.color}`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className={`font-bold text-lg ${plan.textColor}`}>{plan.name}</p>
                      <p className={`text-3xl font-extrabold mt-1 ${plan.textColor}`}>{plan.price} €<span className="text-base font-normal opacity-70">/mois</span></p>
                    </div>
                    <div className={`rounded-xl px-3 py-1.5 text-sm font-semibold ${plan.name === 'Pro' ? 'bg-white/20 text-white' : 'bg-surface-200 text-surface-700 dark:bg-surface-700 dark:text-surface-200'}`}>
                      {plan.subscribers} abonnés
                    </div>
                  </div>
                </div>
                <div className="p-5 space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-surface-500 dark:text-surface-400">MRR</span>
                    <span className="font-bold text-surface-900 dark:text-surface-50">{plan.mrr.toLocaleString('fr-FR')} €</span>
                  </div>
                  <div className="space-y-2">
                    {plan.features.map((f) => (
                      <div key={f} className="flex items-center gap-2 text-sm text-surface-600 dark:text-surface-400">
                        <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-green-500" />
                        {f}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Summary stats */}
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { label: 'Taux de rétention', value: '94.2%', icon: TrendingUp, change: '+1.2%' },
              { label: 'LTV moyen', value: '1 840 €', icon: Euro, change: '+8%' },
              { label: 'Churn mensuel', value: '1 restaurant', icon: Users, change: '-1' },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl border border-surface-200 bg-white p-5 shadow-sm flex items-center gap-4 dark:bg-surface-900 dark:border-surface-700">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-100 dark:bg-surface-800">
                  <s.icon className="h-5 w-5 text-surface-500 dark:text-surface-400" />
                </div>
                <div>
                  <p className="text-xl font-bold text-surface-900 dark:text-surface-50">{s.value}</p>
                  <p className="text-xs text-surface-500 dark:text-surface-400">{s.label}</p>
                  <p className="text-xs text-green-600 font-medium">{s.change} ce mois</p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {tab === 'billing' && (
        <div className="rounded-2xl border border-surface-200 bg-white shadow-sm overflow-hidden dark:bg-surface-900 dark:border-surface-700">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-100 bg-surface-50 dark:border-surface-700 dark:bg-surface-800">
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-surface-400 dark:text-surface-500">Restaurant</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-surface-400 dark:text-surface-500">Plan</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-surface-400 dark:text-surface-500">Montant</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-surface-400 dark:text-surface-500">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-surface-400 dark:text-surface-500">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100 dark:divide-surface-700">
                {BILLING_HISTORY.map((b, i) => (
                  <tr key={i} className="hover:bg-surface-50 transition-colors dark:hover:bg-surface-800">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <CreditCard className="h-4 w-4 text-surface-400 dark:text-surface-500" />
                        <span className="font-medium text-surface-900 dark:text-surface-50">{b.restaurant}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                        b.plan === 'Pro' ? 'bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400' :
                        b.plan === 'Enterprise' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' :
                        'bg-surface-100 text-surface-600 dark:bg-surface-800 dark:text-surface-400'
                      }`}>
                        {b.plan}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right font-semibold text-surface-900 dark:text-surface-50">{b.amount} €</td>
                    <td className="px-4 py-4 text-surface-500 dark:text-surface-400">{b.date}</td>
                    <td className="px-4 py-4">
                      {b.status === 'paid' && <Badge variant="success" size="sm">Payé</Badge>}
                      {b.status === 'failed' && (
                        <div className="flex items-center gap-1.5">
                          <AlertCircle className="h-3.5 w-3.5 text-red-500" />
                          <Badge variant="danger" size="sm">Échec</Badge>
                        </div>
                      )}
                      {b.status === 'trial' && <Badge variant="warning" size="sm">Essai</Badge>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
