'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Euro, CreditCard, Clock, ArrowDownToLine, TrendingUp,
  Building2, CheckCircle2, AlertCircle, RotateCcw,
} from 'lucide-react';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts';

// ── Mock data ──────────────────────────────────────────────────────────────────

const REVENUE_DATA = [
  { day: 'Lun', revenue: 1840 },
  { day: 'Mar', revenue: 2230 },
  { day: 'Mer', revenue: 1960 },
  { day: 'Jeu', revenue: 2650 },
  { day: 'Ven', revenue: 3100 },
  { day: 'Sam', revenue: 3800 },
  { day: 'Dim', revenue: 2870 },
];

const PAYMENT_METHODS = [
  { label: 'Carte bancaire', pct: 72, color: 'bg-brand-500' },
  { label: 'Espèces',        pct: 18, color: 'bg-blue-400' },
  { label: 'Apple Pay',      pct: 7,  color: 'bg-surface-700' },
  { label: 'Google Pay',     pct: 3,  color: 'bg-green-500' },
];

type TxStatus = 'completed' | 'pending' | 'refunded';

interface Transaction {
  id: string;
  order: string;
  customer: string;
  amount: number;
  method: string;
  status: TxStatus;
  time: string;
}

const TRANSACTIONS: Transaction[] = [
  { id: 'TXN-9921', order: 'ORD-8821', customer: 'Marie L.',   amount: 42.50, method: 'Carte',     status: 'completed', time: '12:45' },
  { id: 'TXN-9920', order: 'ORD-8820', customer: 'Pierre D.',  amount: 28.90, method: 'Apple Pay', status: 'completed', time: '12:30' },
  { id: 'TXN-9919', order: 'ORD-8819', customer: 'Sophie M.',  amount: 67.30, method: 'Carte',     status: 'completed', time: '12:12' },
  { id: 'TXN-9918', order: 'ORD-8818', customer: 'Julien K.',  amount: 16.90, method: 'Espèces',   status: 'pending',   time: '12:05' },
  { id: 'TXN-9917', order: 'ORD-8817', customer: 'Emma R.',    amount: 33.20, method: 'Carte',     status: 'refunded',  time: '11:58' },
  { id: 'TXN-9916', order: 'ORD-8816', customer: 'Antoine B.', amount: 54.80, method: 'Google Pay',status: 'completed', time: '11:44' },
  { id: 'TXN-9915', order: 'ORD-8815', customer: 'Inès L.',    amount: 22.10, method: 'Carte',     status: 'completed', time: '11:30' },
  { id: 'TXN-9914', order: 'ORD-8814', customer: 'Lucas P.',   amount: 89.40, method: 'Carte',     status: 'completed', time: '11:15' },
];

const STATUS_CONFIG: Record<TxStatus, { label: string; variant: 'success' | 'warning' | 'danger'; icon: React.ReactNode }> = {
  completed: { label: 'Complété',  variant: 'success', icon: <CheckCircle2 className="h-3 w-3" /> },
  pending:   { label: 'En attente',variant: 'warning', icon: <AlertCircle className="h-3 w-3" /> },
  refunded:  { label: 'Remboursé', variant: 'danger',  icon: <RotateCcw className="h-3 w-3" /> },
};

const PERIODS = ['Aujourd\'hui', '7j', '30j', 'Mois'];

const KPI_CARDS = [
  { title: "Chiffre d'affaires", value: '12 450€', change: '+12.5%', positive: true,  icon: Euro,            iconBg: 'bg-green-50',   iconColor: 'text-green-600' },
  { title: 'Commissions plateforme', value: '1 245€', change: null,     positive: null, icon: TrendingUp,      iconBg: 'bg-brand-50',   iconColor: 'text-brand-600' },
  { title: 'Net à percevoir',     value: '11 205€', change: null,     positive: null, icon: CheckCircle2,    iconBg: 'bg-blue-50',    iconColor: 'text-blue-600' },
  { title: 'En attente virement', value: '3 420€',  change: null,     positive: null, icon: Clock,           iconBg: 'bg-yellow-50',  iconColor: 'text-yellow-600' },
];

// ── Custom tooltip ─────────────────────────────────────────────────────────────

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-surface-200 bg-white px-3 py-2 shadow-md">
      <p className="text-xs font-medium text-surface-500">{label}</p>
      <p className="text-sm font-bold text-surface-900">{payload[0].value.toLocaleString('fr-FR')}€</p>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function PaymentsPage() {
  const [period, setPeriod] = useState(0);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Paiements</h1>
          <p className="mt-1 text-sm text-surface-500">Gestion des transactions et virements</p>
        </div>
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
      </div>

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {KPI_CARDS.map((kpi, i) => {
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
                    {kpi.change && (
                      <p className={`mt-1 flex items-center gap-1 text-xs font-medium ${kpi.positive ? 'text-green-600' : 'text-red-500'}`}>
                        <TrendingUp className="h-3 w-3" />
                        {kpi.change} vs période préc.
                      </p>
                    )}
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
      <div className="grid gap-6 xl:grid-cols-[2fr,1fr]">
        {/* Bar chart */}
        <Card padding="lg">
          <CardHeader>
            <CardTitle>Chiffre d&apos;affaires — 7 derniers jours</CardTitle>
          </CardHeader>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={REVENUE_DATA} barSize={32} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}€`} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: '#00FF73', fillOpacity: 0.06 }} />
              <Bar dataKey="revenue" fill="#00FF73" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Payment method split */}
        <Card padding="lg">
          <CardHeader>
            <CardTitle>Modes de paiement</CardTitle>
          </CardHeader>
          <div className="space-y-4">
            {/* Horizontal bar */}
            <div className="flex h-4 w-full overflow-hidden rounded-full">
              {PAYMENT_METHODS.map((m) => (
                <div
                  key={m.label}
                  className={`${m.color} transition-all`}
                  style={{ width: `${m.pct}%` }}
                  title={`${m.label}: ${m.pct}%`}
                />
              ))}
            </div>
            {/* Legend */}
            <div className="space-y-2">
              {PAYMENT_METHODS.map((m) => (
                <div key={m.label} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className={`h-2.5 w-2.5 rounded-full ${m.color}`} />
                    <span className="text-surface-700">{m.label}</span>
                  </div>
                  <span className="font-semibold text-surface-900">{m.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* Transactions table */}
      <Card padding="none">
        <CardHeader className="border-b border-surface-100 px-6 py-5">
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-brand-500" />
            <CardTitle>Dernières transactions</CardTitle>
          </div>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-surface-100 bg-surface-50">
                {['Transaction', 'Commande', 'Client', 'Montant', 'Méthode', 'Heure', 'Statut'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-surface-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              <AnimatePresence>
                {TRANSACTIONS.map((tx, i) => {
                  const cfg = STATUS_CONFIG[tx.status];
                  return (
                    <motion.tr
                      key={tx.id}
                      initial={{ opacity: 0, x: -4 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="hover:bg-surface-50"
                    >
                      <td className="px-4 py-3.5 text-sm font-mono font-medium text-surface-700">{tx.id}</td>
                      <td className="px-4 py-3.5 text-sm text-surface-600">{tx.order}</td>
                      <td className="px-4 py-3.5 text-sm font-medium text-surface-900">{tx.customer}</td>
                      <td className="px-4 py-3.5 text-sm font-bold text-surface-900">{tx.amount.toFixed(2)}€</td>
                      <td className="px-4 py-3.5 text-sm text-surface-600">{tx.method}</td>
                      <td className="px-4 py-3.5 text-sm text-surface-500">{tx.time}</td>
                      <td className="px-4 py-3.5">
                        <Badge variant={cfg.variant} dot>
                          {cfg.label}
                        </Badge>
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </Card>

      {/* Payout section */}
      <Card padding="lg" className="border-brand-200 bg-gradient-to-br from-brand-50 to-brand-50">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="rounded-2xl bg-white p-3 shadow-sm">
              <ArrowDownToLine className="h-6 w-6 text-brand-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-surface-500">Prochain virement</p>
              <p className="text-2xl font-bold text-surface-900">3 420€</p>
              <p className="mt-0.5 text-sm text-surface-500">Prévu le <span className="font-medium text-surface-700">15 mai 2026</span></p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 rounded-xl bg-white px-4 py-3 shadow-sm">
              <Building2 className="h-4 w-4 text-surface-400" />
              <div>
                <p className="text-xs text-surface-400">Compte bancaire</p>
                <p className="text-sm font-semibold text-surface-900">****4521</p>
              </div>
            </div>
            <button className="rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-600 active:scale-95">
              Demander un virement
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}
