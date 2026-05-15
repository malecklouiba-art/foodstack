'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp, CheckCircle2, Download, X, ChevronRight,
  CreditCard, PauseCircle, XCircle, RefreshCw, Calendar,
  Mail, Phone, Building2,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

// ── Types ─────────────────────────────────────────────────────────────────────

type SubStatus = 'actif' | 'pause' | 'resilié';

interface Subscriber {
  id: string;
  restaurant: string;
  plan: 'Starter' | 'Pro' | 'Enterprise';
  status: SubStatus;
  mrr: number;
  nextBilling: string;
  startDate: string;
  contact: { name: string; email: string; phone: string };
  planHistory: { date: string; from: string; to: string }[];
  paymentHistory: { date: string; amount: string; status: string }[];
}

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

const initSubscribers: Subscriber[] = [
  {
    id: 's1', restaurant: 'Sushi Yama', plan: 'Enterprise', status: 'actif', mrr: 299,
    nextBilling: '14 juin 2026', startDate: '14 jan 2025',
    contact: { name: 'Kenji Tanaka', email: 'kenji@sushiyama.fr', phone: '+33 6 11 22 33 44' },
    planHistory: [{ date: '14 jan 2025', from: 'Pro', to: 'Enterprise' }],
    paymentHistory: [
      { date: '14 mai 2026', amount: '299€', status: 'Payé' },
      { date: '14 avr 2026', amount: '299€', status: 'Payé' },
      { date: '14 mar 2026', amount: '299€', status: 'Payé' },
    ],
  },
  {
    id: 's2', restaurant: 'Cloud Kitchen Alpha', plan: 'Enterprise', status: 'actif', mrr: 299,
    nextBilling: '1 juin 2026', startDate: '1 mar 2025',
    contact: { name: 'Sophie Martin', email: 'sophie@ck-alpha.com', phone: '+33 6 55 44 33 22' },
    planHistory: [],
    paymentHistory: [
      { date: '14 mai 2026', amount: '299€', status: 'Payé' },
      { date: '14 avr 2026', amount: '299€', status: 'Payé' },
    ],
  },
  {
    id: 's3', restaurant: 'Le Petit Bistro', plan: 'Pro', status: 'actif', mrr: 99,
    nextBilling: '13 juin 2026', startDate: '5 avr 2025',
    contact: { name: 'Marie Dupont', email: 'marie@lepetitbistro.fr', phone: '+33 1 42 11 22 33' },
    planHistory: [{ date: '5 avr 2025', from: 'Starter', to: 'Pro' }],
    paymentHistory: [
      { date: '13 mai 2026', amount: '99€', status: 'Payé' },
      { date: '13 avr 2026', amount: '99€', status: 'Payé' },
    ],
  },
  {
    id: 's4', restaurant: 'Burger Factory', plan: 'Pro', status: 'pause', mrr: 99,
    nextBilling: '—', startDate: '20 fév 2025',
    contact: { name: 'Luc Bernard', email: 'luc@burger-factory.fr', phone: '+33 6 77 88 99 00' },
    planHistory: [],
    paymentHistory: [
      { date: '13 mai 2026', amount: '99€', status: 'Payé' },
      { date: '13 avr 2026', amount: '99€', status: 'Payé' },
    ],
  },
  {
    id: 's5', restaurant: 'La Crêperie Dorée', plan: 'Starter', status: 'actif', mrr: 49,
    nextBilling: '12 juin 2026', startDate: '12 mai 2025',
    contact: { name: 'Amandine Lebrun', email: 'amandine@creperie-doree.fr', phone: '+33 2 40 55 66 77' },
    planHistory: [],
    paymentHistory: [
      { date: '12 mai 2026', amount: '49€', status: 'Payé' },
    ],
  },
  {
    id: 's6', restaurant: 'Ramen Republic', plan: 'Pro', status: 'actif', mrr: 99,
    nextBilling: '10 juin 2026', startDate: '10 oct 2024',
    contact: { name: 'Hiroshi Ito', email: 'hiroshi@ramen-republic.com', phone: '+33 9 80 70 60 50' },
    planHistory: [{ date: '10 oct 2024', from: 'Starter', to: 'Pro' }],
    paymentHistory: [
      { date: '10 mai 2026', amount: '99€', status: 'Payé' },
      { date: '10 avr 2026', amount: '99€', status: 'Payé' },
    ],
  },
  {
    id: 's7', restaurant: 'Thai Garden', plan: 'Starter', status: 'resilié', mrr: 0,
    nextBilling: '—', startDate: '9 mar 2025',
    contact: { name: 'Nuan Chai', email: 'nuan@thaigarden.fr', phone: '+33 4 91 22 33 44' },
    planHistory: [],
    paymentHistory: [
      { date: '9 mai 2026', amount: '49€', status: 'Payé' },
      { date: '9 avr 2026', amount: '49€', status: 'Remboursé' },
    ],
  },
  {
    id: 's8', restaurant: 'Tacos Azteca', plan: 'Pro', status: 'actif', mrr: 99,
    nextBilling: '8 juin 2026', startDate: '8 jan 2025',
    contact: { name: 'Carlos Vega', email: 'carlos@tacos-azteca.fr', phone: '+33 5 57 12 34 56' },
    planHistory: [],
    paymentHistory: [
      { date: '8 mai 2026', amount: '99€', status: 'Échoué' },
      { date: '8 avr 2026', amount: '99€', status: 'Payé' },
    ],
  },
];

const PLANS = ['Starter', 'Pro', 'Enterprise'] as const;

// ── Helpers ───────────────────────────────────────────────────────────────────

function planBadge(plan: string) {
  if (plan === 'Enterprise') return <Badge variant="info">{plan}</Badge>;
  if (plan === 'Pro')        return <Badge variant="brand">{plan}</Badge>;
  return <Badge variant="default">{plan}</Badge>;
}

function statusBadge(s: SubStatus) {
  if (s === 'actif')   return <Badge variant="success" dot>Actif</Badge>;
  if (s === 'pause')   return <Badge variant="warning" dot>En pause</Badge>;
  return <Badge variant="danger" dot>Résilié</Badge>;
}

function payBadge(status: string) {
  if (status === 'Payé')      return <Badge variant="success">{status}</Badge>;
  if (status === 'Échoué')    return <Badge variant="danger">{status}</Badge>;
  if (status === 'Remboursé') return <Badge variant="warning">{status}</Badge>;
  return <Badge variant="default">{status}</Badge>;
}

function exportCsv(rows: Subscriber[]) {
  const header = 'Restaurant,Plan,Statut,MRR,Prochaine facturation,Début,Contact,Email';
  const body = rows.map(r =>
    `"${r.restaurant}",${r.plan},${r.status},${r.mrr}€,"${r.nextBilling}","${r.startDate}","${r.contact.name}","${r.contact.email}"`
  ).join('\n');
  const blob = new Blob([header + '\n' + body], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'abonnements.csv';
  a.click();
}

// ── Toast ─────────────────────────────────────────────────────────────────────

function useToast() {
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const show = useCallback((msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }, []);
  return { toast, show };
}

function Toast({ msg, type }: { msg: string; type: 'success' | 'error' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 40 }}
      className={`fixed bottom-6 left-1/2 z-[100] -translate-x-1/2 flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-medium shadow-lg ${
        type === 'success' ? 'bg-brand-500 text-black' : 'bg-red-500 text-white'
      }`}
    >
      {type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
      {msg}
    </motion.div>
  );
}

// ── Detail side panel ─────────────────────────────────────────────────────────

interface DetailPanelProps {
  sub: Subscriber | null;
  onClose: () => void;
  onChangePlan: (sub: Subscriber) => void;
  onSuspend: (id: string) => void;
  onCancel: (id: string) => void;
}

function DetailPanel({ sub, onClose, onChangePlan, onSuspend, onCancel }: DetailPanelProps) {
  return (
    <AnimatePresence>
      {sub && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-surface-900/40 backdrop-blur-sm"
            onClick={onClose}
          />
          {/* Panel */}
          <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 35 }}
            className="fixed right-0 top-0 z-50 h-full w-full max-w-md overflow-y-auto bg-white shadow-2xl"
          >
            {/* Header */}
            <div className="sticky top-0 z-10 border-b border-surface-100 bg-white px-6 py-5 flex items-start justify-between">
              <div>
                <h2 className="text-lg font-bold text-surface-900">{sub.restaurant}</h2>
                <div className="mt-1 flex items-center gap-2">
                  {planBadge(sub.plan)}
                  {statusBadge(sub.status)}
                </div>
              </div>
              <button onClick={onClose} className="rounded-lg p-1.5 text-surface-400 hover:bg-surface-100 hover:text-surface-700 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Contact */}
              <div className="rounded-2xl border border-surface-100 bg-surface-50 p-4 space-y-2.5">
                <p className="text-xs font-semibold uppercase tracking-wider text-surface-500">Contact</p>
                <div className="flex items-center gap-2.5 text-sm text-surface-700">
                  <Building2 className="h-4 w-4 text-surface-400 flex-shrink-0" />
                  {sub.contact.name}
                </div>
                <div className="flex items-center gap-2.5 text-sm text-surface-700">
                  <Mail className="h-4 w-4 text-surface-400 flex-shrink-0" />
                  {sub.contact.email}
                </div>
                <div className="flex items-center gap-2.5 text-sm text-surface-700">
                  <Phone className="h-4 w-4 text-surface-400 flex-shrink-0" />
                  {sub.contact.phone}
                </div>
              </div>

              {/* Billing dates */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-surface-100 bg-surface-50 p-4">
                  <p className="text-xs text-surface-500 mb-1">Abonnement depuis</p>
                  <p className="font-semibold text-surface-900 text-sm">{sub.startDate}</p>
                </div>
                <div className="rounded-2xl border border-surface-100 bg-surface-50 p-4">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Calendar className="h-3.5 w-3.5 text-surface-400" />
                    <p className="text-xs text-surface-500">Prochaine facturation</p>
                  </div>
                  <p className="font-semibold text-surface-900 text-sm">{sub.nextBilling}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  icon={<RefreshCw className="h-3.5 w-3.5" />}
                  onClick={() => onChangePlan(sub)}
                >
                  Changer de plan
                </Button>
                {sub.status !== 'pause' && sub.status !== 'resilié' && (
                  <Button
                    size="sm"
                    variant="ghost"
                    icon={<PauseCircle className="h-3.5 w-3.5" />}
                    onClick={() => { onSuspend(sub.id); onClose(); }}
                  >
                    Suspendre
                  </Button>
                )}
                {sub.status !== 'resilié' && (
                  <Button
                    size="sm"
                    variant="danger"
                    icon={<XCircle className="h-3.5 w-3.5" />}
                    onClick={() => { onCancel(sub.id); onClose(); }}
                  >
                    Résilier
                  </Button>
                )}
              </div>

              {/* Plan history */}
              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-surface-500">Historique des plans</p>
                {sub.planHistory.length === 0 ? (
                  <p className="text-sm text-surface-400 italic">Aucun changement de plan</p>
                ) : (
                  <div className="space-y-2">
                    {sub.planHistory.map((h, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-surface-700 rounded-xl bg-surface-50 px-3 py-2">
                        <span className="text-xs text-surface-400">{h.date}</span>
                        <span>{h.from}</span>
                        <ChevronRight className="h-3.5 w-3.5 text-surface-400" />
                        <span className="font-medium text-brand-600">{h.to}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Payment history */}
              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-surface-500">Historique de paiement</p>
                <div className="rounded-2xl border border-surface-100 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-surface-100 bg-surface-50">
                        <th className="px-4 py-2 text-left text-xs font-semibold text-surface-500">Date</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-surface-500">Montant</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-surface-500">Statut</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-100">
                      {sub.paymentHistory.map((p, i) => (
                        <tr key={i} className="hover:bg-surface-50 transition-colors">
                          <td className="px-4 py-2.5 text-surface-500">{p.date}</td>
                          <td className="px-4 py-2.5 font-semibold text-surface-900">{p.amount}</td>
                          <td className="px-4 py-2.5">{payBadge(p.status)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ── Change plan modal ─────────────────────────────────────────────────────────

interface ChangePlanModalProps {
  sub: Subscriber | null;
  onClose: () => void;
  onConfirm: (id: string, newPlan: 'Starter' | 'Pro' | 'Enterprise') => void;
}

function ChangePlanModal({ sub, onClose, onConfirm }: ChangePlanModalProps) {
  const [selected, setSelected] = useState<'Starter' | 'Pro' | 'Enterprise'>('Pro');

  if (!sub) return null;

  return (
    <Modal
      open={!!sub}
      onClose={onClose}
      title="Changer de plan"
      description={`Modifier le plan de ${sub.restaurant}`}
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="ghost" size="sm" onClick={onClose}>Annuler</Button>
          <Button size="sm" onClick={() => onConfirm(sub.id, selected)}>Confirmer</Button>
        </div>
      }
    >
      <div className="space-y-3">
        {PLANS.map(plan => (
          <label
            key={plan}
            className={`flex items-center gap-3 cursor-pointer rounded-xl border px-4 py-3 transition-colors ${
              selected === plan
                ? 'border-brand-400 bg-brand-500/5'
                : 'border-surface-200 hover:border-surface-300'
            }`}
          >
            <input
              type="radio"
              name="plan"
              value={plan}
              checked={selected === plan}
              onChange={() => setSelected(plan)}
              className="accent-brand-500"
            />
            <div className="flex-1">
              <span className="font-medium text-surface-900">{plan}</span>
              {sub.plan === plan && (
                <span className="ml-2 text-xs text-surface-400">(actuel)</span>
              )}
            </div>
            {planBadge(plan)}
          </label>
        ))}
      </div>
    </Modal>
  );
}

// ── Plan summary cards ────────────────────────────────────────────────────────

const planMeta = [
  {
    name: 'Starter', price: '49€', period: '/mois', mrr: 0, count: 0,
    color: 'text-surface-700', bg: 'bg-surface-50', border: 'border-surface-200',
    features: ['1 emplacement', 'Menu en ligne', 'Commandes basiques', 'Support email'],
  },
  {
    name: 'Pro', price: '99€', period: '/mois', mrr: 0, count: 0,
    color: 'text-brand-600', bg: 'bg-brand-500/5', border: 'border-brand-500/30',
    features: ['3 emplacements', 'Analytics avancés', 'Livraison intégrée', 'Support prioritaire'],
    popular: true,
  },
  {
    name: 'Enterprise', price: '299€', period: '/mois', mrr: 0, count: 0,
    color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200',
    features: ['Illimité', 'API complète', 'SLA 99.9%', 'Account manager dédié'],
  },
] as const;

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SubscriptionsPage() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>(initSubscribers);
  const [selectedSub, setSelectedSub] = useState<Subscriber | null>(null);
  const [changePlanSub, setChangePlanSub] = useState<Subscriber | null>(null);
  const { toast, show } = useToast();

  // Derived stats
  const active  = subscribers.filter(s => s.status === 'actif');
  const paused  = subscribers.filter(s => s.status === 'pause');
  const churned = subscribers.filter(s => s.status === 'resilié');
  const mrr     = active.reduce((sum, s) => sum + s.mrr, 0);

  // Plan summary stats
  const plans = planMeta.map(p => ({
    ...p,
    count: active.filter(s => s.plan === p.name).length,
    mrr:   active.filter(s => s.plan === p.name).reduce((sum, s) => sum + s.mrr, 0),
  }));

  function handleSuspend(id: string) {
    setSubscribers(prev => prev.map(s => s.id === id ? { ...s, status: 'pause', nextBilling: '—' } : s));
    show('Abonnement suspendu');
  }

  function handleCancel(id: string) {
    setSubscribers(prev => prev.map(s => s.id === id ? { ...s, status: 'resilié', mrr: 0, nextBilling: '—' } : s));
    show('Abonnement résilié');
  }

  function handleChangePlan(id: string, newPlan: 'Starter' | 'Pro' | 'Enterprise') {
    const priceMap: Record<string, number> = { Starter: 49, Pro: 99, Enterprise: 299 };
    setSubscribers(prev => prev.map(s => {
      if (s.id !== id) return s;
      const today = '15 mai 2026';
      const history = s.plan !== newPlan
        ? [{ date: today, from: s.plan, to: newPlan }, ...s.planHistory]
        : s.planHistory;
      return { ...s, plan: newPlan, mrr: priceMap[newPlan], planHistory: history };
    }));
    setChangePlanSub(null);
    setSelectedSub(null);
    show(`Plan mis à jour → ${newPlan}`);
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Abonnements</h1>
          <p className="mt-1 text-sm text-surface-500">Gestion des plans et facturation</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          icon={<Download className="h-4 w-4" />}
          onClick={() => { exportCsv(subscribers); show('Export CSV téléchargé'); }}
        >
          Exporter CSV
        </Button>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'MRR',               value: `${mrr.toLocaleString('fr-FR')}€`, color: 'text-brand-500',   icon: <CreditCard className="h-5 w-5" /> },
          { label: 'Actifs',            value: String(active.length),              color: 'text-green-600',   icon: <CheckCircle2 className="h-5 w-5" /> },
          { label: 'En pause',          value: String(paused.length),              color: 'text-yellow-500',  icon: <PauseCircle className="h-5 w-5" /> },
          { label: 'Résiliés ce mois',  value: String(churned.length),             color: 'text-red-500',     icon: <XCircle className="h-5 w-5" /> },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="rounded-2xl border border-surface-100 bg-white px-5 py-4 flex items-center gap-4"
          >
            <div className={`${stat.color} opacity-80`}>{stat.icon}</div>
            <div>
              <p className="text-xs text-surface-500">{stat.label}</p>
              <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
            </div>
          </motion.div>
        ))}
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
              {'popular' in plan && plan.popular && (
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
                <div className="rounded-xl bg-white/50 p-3">
                  <p className="text-xs text-surface-500">Restaurants</p>
                  <p className="text-xl font-bold text-surface-900">{plan.count}</p>
                </div>
                <div className="rounded-xl bg-white/50 p-3">
                  <p className="text-xs text-surface-500">MRR</p>
                  <p className="text-xl font-bold text-surface-900">{plan.mrr}€</p>
                </div>
              </div>

              <ul className="space-y-1.5">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-surface-600">
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
            <span className="text-lg font-bold text-brand-500">{mrr.toLocaleString('fr-FR')}€</span>
          </CardHeader>
          <div className="space-y-4">
            {plans.map((plan) => {
              const pct = mrr > 0 ? Math.round((plan.mrr / mrr) * 100) : 0;
              const barColor =
                plan.name === 'Enterprise' ? 'bg-purple-500' :
                plan.name === 'Pro'        ? 'bg-brand-500' :
                'bg-surface-400';
              return (
                <div key={plan.name}>
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className={`h-2.5 w-2.5 rounded-full ${barColor}`} />
                      <span className="font-medium text-surface-700">{plan.name}</span>
                      <span className="text-surface-400">{pct}%</span>
                    </div>
                    <span className="font-semibold text-surface-900">{plan.mrr}€</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-surface-100">
                    <div className={`h-full rounded-full ${barColor} transition-all`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-5 flex items-center gap-1.5 rounded-xl bg-green-50 px-3 py-2">
            <TrendingUp className="h-4 w-4 text-green-600" />
            <span className="text-xs font-medium text-green-700">+8.2% vs mois dernier</span>
          </div>
        </Card>

        {/* Revenue chart */}
        <Card padding="none">
          <CardHeader className="border-b border-surface-100 px-6 py-5">
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
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `${v}€`} />
                <Tooltip
                  contentStyle={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 12, fontSize: 12 }}
                  formatter={(value: number) => [`${value.toLocaleString('fr-FR')}€`, 'Revenus']}
                />
                <Area type="monotone" dataKey="revenue" stroke="#1EFF6A" strokeWidth={2} fill="url(#revGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Subscribers table */}
      <Card padding="none">
        <CardHeader className="border-b border-surface-100 px-6 py-5">
          <div>
            <CardTitle>Abonnés</CardTitle>
            <CardDescription className="mt-0.5">Cliquez sur une ligne pour les détails</CardDescription>
          </div>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-100">
                {['Restaurant', 'Plan', 'Statut', 'MRR', 'Prochaine facturation', 'Actions'].map(h => (
                  <th key={h} className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-surface-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {subscribers.map(sub => (
                <tr
                  key={sub.id}
                  onClick={() => setSelectedSub(sub)}
                  className="cursor-pointer hover:bg-surface-50 transition-colors"
                >
                  <td className="px-6 py-4 font-medium text-surface-900">{sub.restaurant}</td>
                  <td className="px-6 py-4">{planBadge(sub.plan)}</td>
                  <td className="px-6 py-4">{statusBadge(sub.status)}</td>
                  <td className="px-6 py-4 font-semibold text-surface-900">{sub.mrr > 0 ? `${sub.mrr}€` : '—'}</td>
                  <td className="px-6 py-4 text-surface-500">{sub.nextBilling}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                      <button
                        className="text-xs font-medium text-brand-600 hover:underline"
                        onClick={() => setChangePlanSub(sub)}
                      >
                        Changer
                      </button>
                      {sub.status === 'actif' && (
                        <button
                          className="text-xs font-medium text-yellow-600 hover:underline"
                          onClick={() => handleSuspend(sub.id)}
                        >
                          Suspendre
                        </button>
                      )}
                      {sub.status !== 'resilié' && (
                        <button
                          className="text-xs font-medium text-red-500 hover:underline"
                          onClick={() => handleCancel(sub.id)}
                        >
                          Résilier
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Detail side panel */}
      <DetailPanel
        sub={selectedSub}
        onClose={() => setSelectedSub(null)}
        onChangePlan={(sub) => { setChangePlanSub(sub); setSelectedSub(null); }}
        onSuspend={handleSuspend}
        onCancel={handleCancel}
      />

      {/* Change plan modal */}
      <ChangePlanModal
        sub={changePlanSub}
        onClose={() => setChangePlanSub(null)}
        onConfirm={handleChangePlan}
      />

      {/* Toast */}
      <AnimatePresence>
        {toast && <Toast msg={toast.msg} type={toast.type} />}
      </AnimatePresence>
    </div>
  );
}
