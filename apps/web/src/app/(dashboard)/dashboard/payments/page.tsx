'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/store/auth';
import api from '@/lib/api';
import {
  Euro, CreditCard, Clock, ArrowDownToLine, TrendingUp,
  Building2, CheckCircle2, AlertCircle, RotateCcw,
  Download, FileText, X, Store, ChevronLeft, ChevronRight,
  Wallet, RefreshCw,
} from 'lucide-react';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
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
type TxFilter = 'all' | 'payments' | 'refunds' | 'payouts';

interface Transaction {
  id: string;
  order: string;
  customer: string;
  amount: number;
  method: string;
  status: TxStatus;
  time: string;
  type: 'payment' | 'refund' | 'payout';
}

// Expanded mock transactions (>10 to test pagination)
const TRANSACTIONS: Transaction[] = [
  { id: 'TXN-9921', order: 'ORD-8821', customer: 'Marie L.',    amount: 42.50,  method: 'Carte',       status: 'completed', time: '12:45', type: 'payment' },
  { id: 'TXN-9920', order: 'ORD-8820', customer: 'Pierre D.',   amount: 28.90,  method: 'Apple Pay',   status: 'completed', time: '12:30', type: 'payment' },
  { id: 'TXN-9919', order: 'ORD-8819', customer: 'Sophie M.',   amount: 67.30,  method: 'Carte',       status: 'completed', time: '12:12', type: 'payment' },
  { id: 'TXN-9918', order: 'ORD-8818', customer: 'Julien K.',   amount: 16.90,  method: 'Espèces',     status: 'pending',   time: '12:05', type: 'payment' },
  { id: 'TXN-9917', order: 'ORD-8817', customer: 'Emma R.',     amount: 33.20,  method: 'Carte',       status: 'refunded',  time: '11:58', type: 'refund'  },
  { id: 'TXN-9916', order: 'ORD-8816', customer: 'Antoine B.',  amount: 54.80,  method: 'Google Pay',  status: 'completed', time: '11:44', type: 'payment' },
  { id: 'TXN-9915', order: 'ORD-8815', customer: 'Inès L.',     amount: 22.10,  method: 'Carte',       status: 'completed', time: '11:30', type: 'payment' },
  { id: 'TXN-9914', order: 'ORD-8814', customer: 'Lucas P.',    amount: 89.40,  method: 'Carte',       status: 'completed', time: '11:15', type: 'payment' },
  { id: 'TXN-9913', order: 'ORD-8813', customer: 'Clara V.',    amount: 38.00,  method: 'Apple Pay',   status: 'completed', time: '11:00', type: 'payment' },
  { id: 'TXN-9912', order: 'ORD-8812', customer: 'Thomas G.',   amount: 71.60,  method: 'Carte',       status: 'completed', time: '10:45', type: 'payment' },
  { id: 'TXN-9911', order: 'VIR-001',  customer: 'Virement Stripe', amount: 3420.00, method: 'Virement', status: 'completed', time: '10:00', type: 'payout' },
  { id: 'TXN-9910', order: 'ORD-8811', customer: 'Nadia K.',    amount: 19.50,  method: 'Carte',       status: 'refunded',  time: '09:55', type: 'refund'  },
  { id: 'TXN-9909', order: 'ORD-8810', customer: 'Hugo M.',     amount: 45.20,  method: 'Google Pay',  status: 'completed', time: '09:40', type: 'payment' },
];

const STATUS_CONFIG: Record<TxStatus, { label: string; variant: 'success' | 'warning' | 'danger'; icon: React.ReactNode }> = {
  completed: { label: 'Complété',   variant: 'success', icon: <CheckCircle2 className="h-3 w-3" /> },
  pending:   { label: 'En attente', variant: 'warning', icon: <AlertCircle  className="h-3 w-3" /> },
  refunded:  { label: 'Remboursé',  variant: 'danger',  icon: <RotateCcw    className="h-3 w-3" /> },
};

const PERIODS = ["Aujourd'hui", '7j', '30j', 'Mois'];

// Admin view — FoodStack billing its restaurant clients
const ADMIN_TRANSACTIONS: Transaction[] = [
  { id: 'TXN-A001', order: 'ABN-2201', customer: 'Le Bistrot Parisien', amount: 299.00, method: 'Prélèvement', status: 'completed', time: '01/05', type: 'payment' },
  { id: 'TXN-A002', order: 'ABN-2202', customer: 'Sushi Zen',           amount: 199.00, method: 'Prélèvement', status: 'completed', time: '01/05', type: 'payment' },
  { id: 'TXN-A003', order: 'ABN-2203', customer: 'Pizza Roma',          amount: 299.00, method: 'Carte',       status: 'pending',   time: '02/05', type: 'payment' },
  { id: 'TXN-A004', order: 'COM-8801', customer: 'Le Bistrot Parisien', amount: 124.50, method: 'Commission',  status: 'completed', time: '30/04', type: 'payment' },
  { id: 'TXN-A005', order: 'ABN-2204', customer: 'Burger House',        amount: 99.00,  method: 'Prélèvement', status: 'refunded',  time: '28/04', type: 'refund'  },
];

const ADMIN_KPI_CARDS = [
  { title: 'MRR Plateforme',    value: '14 200€', change: '+8.3%', positive: true,  icon: TrendingUp,  iconBg: 'bg-brand-50',       iconColor: 'text-brand-600'   },
  { title: 'Commissions mois',  value: '3 840€',  change: '+5.1%', positive: true,  icon: Euro,        iconBg: 'bg-green-50',       iconColor: 'text-green-600'   },
  { title: 'Impayés',           value: '398€',    change: null,    positive: null,  icon: AlertCircle, iconBg: 'bg-red-50',         iconColor: 'text-red-500'     },
  { title: 'Prochains prélèv.', value: '8 200€',  change: null,    positive: null,  icon: Clock,       iconBg: 'bg-yellow-50',      iconColor: 'text-yellow-600'  },
];

const KPI_CARDS = [
  { title: "Chiffre d'affaires",    value: '12 450€', change: '+12.5%', positive: true,  icon: Euro,         iconBg: 'bg-green-50 dark:bg-green-900/20',    iconColor: 'text-green-600 dark:text-green-400'   },
  { title: 'Commissions plateforme',value: '1 245€',  change: null,     positive: null,  icon: TrendingUp,   iconBg: 'bg-brand-50',                          iconColor: 'text-brand-600'                       },
  { title: 'Net à percevoir',       value: '11 205€', change: null,     positive: null,  icon: CheckCircle2, iconBg: 'bg-blue-50 dark:bg-blue-900/20',       iconColor: 'text-blue-600 dark:text-blue-400'     },
  { title: 'En attente virement',   value: '3 420€',  change: null,     positive: null,  icon: Clock,        iconBg: 'bg-yellow-50 dark:bg-yellow-900/20',   iconColor: 'text-yellow-600 dark:text-yellow-400' },
];

// ── Stripe summary mock data ───────────────────────────────────────────────────

const STRIPE_SUMMARY = {
  available:      { amount: 2_184.50, currency: 'EUR' },
  pending:        { amount: 1_235.30, currency: 'EUR' },
  nextPayout: {
    date:   '20 mai 2026',
    amount: 2_184.50,
  },
};

// ── TX filter map ──────────────────────────────────────────────────────────────

const TX_FILTER_LABELS: Record<TxFilter, string> = {
  all:      'Toutes',
  payments: 'Paiements',
  refunds:  'Remboursements',
  payouts:  'Virements',
};

const PAGE_SIZE = 10;

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatEUR(n: number) {
  return n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '€';
}

function exportCSV(txs: Transaction[], title: string) {
  const header = 'ID,Référence,Client/Restaurant,Montant,Méthode,Date,Statut';
  const rows = txs.map(
    (t) => `${t.id},${t.order},"${t.customer}",${t.amount},${t.method},${t.time},${t.status}`
  );
  const blob = new Blob([header + '\n' + rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `${title}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

async function exportPDF(txs: Transaction[], title: string) {
  const { default: jsPDF } = await import('jspdf');
  const doc = new jsPDF();
  doc.setFontSize(14);
  doc.text(title, 14, 18);
  doc.setFontSize(9);
  const headers = ['ID', 'Client', 'Montant', 'Méthode', 'Date', 'Statut'];
  const rows    = txs.map((t) => [t.id, t.customer, `${t.amount.toFixed(2)}€`, t.method, t.time, t.status]);
  let y = 28;
  doc.setFont('helvetica', 'bold');
  headers.forEach((h, i) => doc.text(h, 14 + i * 32, y));
  doc.setFont('helvetica', 'normal');
  y += 6;
  rows.forEach((r) => {
    r.forEach((cell, i) => doc.text(String(cell), 14 + i * 32, y));
    y += 6;
  });
  doc.save(`${title}.pdf`);
}

// ── Custom tooltip ─────────────────────────────────────────────────────────────

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-surface-200 bg-white px-3 py-2 shadow-md">
      <p className="text-xs font-medium text-surface-500">{label}</p>
      <p className="text-sm font-bold text-surface-900">{payload[0].value.toLocaleString('fr-FR')}€</p>
    </div>
  );
}

// ── Stripe summary card ────────────────────────────────────────────────────────

function StripeSummaryCard() {
  return (
    <Card padding="lg" className="border-brand-200/60 bg-gradient-to-br from-surface-50 to-white dark:from-surface-800 dark:to-surface-800">
      <CardHeader className="mb-5">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#635BFF]/10">
            <Store className="h-4 w-4 text-[#635BFF]" />
          </div>
          <CardTitle>Résumé Stripe</CardTitle>
          <span className="ml-auto rounded-full bg-surface-100 px-2.5 py-0.5 text-xs font-medium text-surface-500 dark:bg-surface-700 dark:text-surface-400">
            Données simulées
          </span>
        </div>
      </CardHeader>

      <div className="grid gap-4 sm:grid-cols-3">
        {/* Balance disponible */}
        <div className="rounded-xl border border-surface-100 bg-white p-4 shadow-sm dark:border-surface-700 dark:bg-surface-900/40">
          <div className="mb-2 flex items-center gap-2">
            <Wallet className="h-4 w-4 text-green-500" />
            <p className="text-xs font-medium text-surface-500">Balance disponible</p>
          </div>
          <p className="text-2xl font-bold text-surface-900 dark:text-surface-50">
            {formatEUR(STRIPE_SUMMARY.available.amount)}
          </p>
          <p className="mt-1 text-xs text-green-600">Disponible immédiatement</p>
        </div>

        {/* En attente de versement */}
        <div className="rounded-xl border border-surface-100 bg-white p-4 shadow-sm dark:border-surface-700 dark:bg-surface-900/40">
          <div className="mb-2 flex items-center gap-2">
            <Clock className="h-4 w-4 text-yellow-500" />
            <p className="text-xs font-medium text-surface-500">En attente de versement</p>
          </div>
          <p className="text-2xl font-bold text-surface-900 dark:text-surface-50">
            {formatEUR(STRIPE_SUMMARY.pending.amount)}
          </p>
          <p className="mt-1 text-xs text-yellow-600">Délai de règlement T+2</p>
        </div>

        {/* Prochain versement */}
        <div className="rounded-xl border border-surface-100 bg-white p-4 shadow-sm dark:border-surface-700 dark:bg-surface-900/40">
          <div className="mb-2 flex items-center gap-2">
            <ArrowDownToLine className="h-4 w-4 text-[#635BFF]" />
            <p className="text-xs font-medium text-surface-500">Prochain versement</p>
          </div>
          <p className="text-2xl font-bold text-surface-900 dark:text-surface-50">
            {formatEUR(STRIPE_SUMMARY.nextPayout.amount)}
          </p>
          <p className="mt-1 text-xs text-surface-500">
            Prévu le{' '}
            <span className="font-semibold text-surface-700 dark:text-surface-300">
              {STRIPE_SUMMARY.nextPayout.date}
            </span>
          </p>
        </div>
      </div>
    </Card>
  );
}

// ── Refund modal ───────────────────────────────────────────────────────────────

interface RefundModalProps {
  tx: Transaction | null;
  onClose: () => void;
  onConfirm: (txId: string, amount: number, reason: string) => void;
}

function RefundModal({ tx, onClose, onConfirm }: RefundModalProps) {
  const [amount, setAmount]   = useState('');
  const [reason, setReason]   = useState('');
  const [error, setError]     = useState('');

  // Reset form when transaction changes
  useEffect(() => {
    if (tx) {
      setAmount(tx.amount.toFixed(2));
      setReason('');
      setError('');
    }
  }, [tx]);

  function handleSubmit() {
    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed <= 0) {
      setError('Montant invalide');
      return;
    }
    if (tx && parsed > tx.amount) {
      setError(`Le montant ne peut pas dépasser ${tx.amount.toFixed(2)}€`);
      return;
    }
    if (!reason.trim()) {
      setError('Veuillez indiquer un motif');
      return;
    }
    if (tx) onConfirm(tx.id, parsed, reason);
    onClose();
  }

  return (
    <Modal
      open={!!tx}
      onClose={onClose}
      title="Rembourser une transaction"
      description={tx ? `Transaction ${tx.id} — ${tx.customer}` : undefined}
      size="sm"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Annuler
          </Button>
          <Button variant="danger" size="sm" onClick={handleSubmit}>
            <RefreshCw className="h-3.5 w-3.5" />
            Confirmer le remboursement
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {tx && (
          <div className="rounded-xl bg-surface-50 p-3 dark:bg-surface-700/50">
            <div className="flex justify-between text-sm">
              <span className="text-surface-500">Montant original</span>
              <span className="font-semibold text-surface-900 dark:text-surface-100">{formatEUR(tx.amount)}</span>
            </div>
          </div>
        )}

        <Input
          label="Montant à rembourser (€)"
          type="number"
          min="0.01"
          step="0.01"
          value={amount}
          onChange={(e) => { setAmount(e.target.value); setError(''); }}
          placeholder="0.00"
        />

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-surface-700 dark:text-surface-300">
            Motif du remboursement <span className="text-red-500">*</span>
          </label>
          <select
            value={reason}
            onChange={(e) => { setReason(e.target.value); setError(''); }}
            className="h-10 w-full rounded-xl border border-surface-200 bg-white px-3 text-sm text-surface-900 transition-all focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-surface-600 dark:bg-surface-800 dark:text-surface-50"
          >
            <option value="">Sélectionner un motif…</option>
            <option value="customer_request">Demande client</option>
            <option value="duplicate">Transaction en double</option>
            <option value="fraudulent">Transaction frauduleuse</option>
            <option value="product_not_received">Commande non livrée</option>
            <option value="other">Autre</option>
          </select>
        </div>

        {error && (
          <p className="flex items-center gap-1.5 text-xs text-red-500">
            <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
            {error}
          </p>
        )}
      </div>
    </Modal>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function PaymentsPage() {
  const authUser = useAuthStore((s) => s.user);
  const [period,        setPeriod]        = useState(0);
  const [selectedTx,    setSelectedTx]    = useState<Transaction | null>(null);
  const [refundTx,      setRefundTx]      = useState<Transaction | null>(null);
  const [txFilter,      setTxFilter]      = useState<TxFilter>('all');
  const [currentPage,   setCurrentPage]   = useState(1);
  const [refundedIds,   setRefundedIds]   = useState<Set<string>>(new Set());
  const [apiTxs,        setApiTxs]        = useState<Transaction[] | null>(null);
  const [apiRevenue,    setApiRevenue]    = useState<{ day: string; revenue: number }[] | null>(null);

  const isAdmin       = authUser?.role === 'super_admin';
  const restaurantId  = authUser?.restaurantIds?.[0] ?? '';

  useEffect(() => {
    const endpoint = isAdmin
      ? '/orders'
      : restaurantId ? `/orders/restaurant/${restaurantId}` : null;
    if (!endpoint) return;
    (api.get(endpoint) as Promise<any[]>)
      .then((data) => {
        if (!Array.isArray(data) || data.length === 0) return;
        const txs: Transaction[] = data.map((o) => ({
          id: `TXN-${o.orderNumber ?? o.id.slice(-6)}`,
          order: `ORD-${o.orderNumber ?? o.id.slice(-6)}`,
          customer: o.customerName ?? o.customer?.name ?? o.customer ?? 'Client',
          amount: o.total ?? 0,
          method: o.paymentMethod ?? 'Carte',
          status: o.status === 'delivered' ? 'completed' : o.status === 'cancelled' ? 'refunded' : 'pending',
          time: new Date(o.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
          type: 'payment',
        }));
        setApiTxs(txs);
      })
      .catch(() => {});
  }, [isAdmin, restaurantId]);

  useEffect(() => {
    if (isAdmin || !restaurantId) return;
    (api.get(`/analytics/${restaurantId}/revenue?period=week`) as Promise<{ data: { total: number; createdAt: string }[] }>)
      .then(({ data }) => {
        if (!Array.isArray(data) || data.length === 0) return;
        const DAY_LABELS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
        const buckets: Record<string, number> = {};
        for (let i = 6; i >= 0; i--) {
          const d = new Date(); d.setDate(d.getDate() - i);
          buckets[DAY_LABELS[d.getDay()]] = 0;
        }
        for (const o of data) {
          const label = DAY_LABELS[new Date(o.createdAt).getDay()];
          if (label in buckets) buckets[label] = (buckets[label] ?? 0) + o.total;
        }
        setApiRevenue(Object.entries(buckets).map(([day, revenue]) => ({ day, revenue })));
      })
      .catch(() => {});
  }, [isAdmin, restaurantId]);

  const baseTxs = apiTxs ?? (isAdmin ? ADMIN_TRANSACTIONS : TRANSACTIONS);
  const activeKPIs    = isAdmin ? ADMIN_KPI_CARDS    : KPI_CARDS;
  const pageTitle     = isAdmin ? 'Paiements Restaurateurs' : 'Paiements';
  const pageSubtitle  = isAdmin
    ? 'Abonnements et commissions de vos clients restaurants'
    : 'Transactions de vos clients consommateurs';

  // Apply refunded status overrides
  const txsWithRefunds = useMemo<Transaction[]>(
    () =>
      baseTxs.map((t) =>
        refundedIds.has(t.id) ? { ...t, status: 'refunded' as TxStatus, type: 'refund' as const } : t
      ),
    [baseTxs, refundedIds]
  );

  // Filter
  const filteredTxs = useMemo<Transaction[]>(() => {
    if (txFilter === 'all')      return txsWithRefunds;
    if (txFilter === 'payments') return txsWithRefunds.filter((t) => t.type === 'payment');
    if (txFilter === 'refunds')  return txsWithRefunds.filter((t) => t.type === 'refund');
    if (txFilter === 'payouts')  return txsWithRefunds.filter((t) => t.type === 'payout');
    return txsWithRefunds;
  }, [txsWithRefunds, txFilter]);

  // Reset page when filter changes
  useEffect(() => setCurrentPage(1), [txFilter]);

  // Pagination
  const totalPages   = Math.max(1, Math.ceil(filteredTxs.length / PAGE_SIZE));
  const pagedTxs     = filteredTxs.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  function handleRefundConfirm(txId: string, _amount: number, _reason: string) {
    setRefundedIds((prev) => new Set([...prev, txId]));
  }

  return (
    <>
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-50">{pageTitle}</h1>
            <p className="mt-1 text-sm text-surface-500">{pageSubtitle}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => exportCSV(filteredTxs, pageTitle)}
              className="flex items-center gap-2 rounded-xl border border-surface-200 bg-white px-4 py-2 text-sm font-medium text-surface-700 transition-colors hover:bg-surface-50 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-200 dark:hover:bg-surface-700"
            >
              <Download className="h-4 w-4" /> CSV
            </button>
            <button
              onClick={() => exportPDF(filteredTxs, pageTitle)}
              className="flex items-center gap-2 rounded-xl border border-surface-200 bg-white px-4 py-2 text-sm font-medium text-surface-700 transition-colors hover:bg-surface-50 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-200 dark:hover:bg-surface-700"
            >
              <FileText className="h-4 w-4" /> PDF
            </button>
            <div className="flex rounded-xl border border-surface-200 bg-surface-50 p-1 dark:border-surface-700 dark:bg-surface-800/50">
              {PERIODS.map((p, i) => (
                <button
                  key={p}
                  onClick={() => setPeriod(i)}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                    period === i
                      ? 'bg-white text-surface-900 shadow-sm dark:bg-surface-700 dark:text-surface-50'
                      : 'text-surface-500 hover:text-surface-700 dark:text-surface-400 dark:hover:text-surface-200'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Stripe summary — owner only */}
        {!isAdmin && <StripeSummaryCard />}

        {/* KPI cards */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {activeKPIs.map((kpi, i) => {
            const Icon = kpi.icon;
            return (
              <motion.div
                key={kpi.title}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
              >
                <Card padding="lg" className="transition-shadow hover:shadow-md">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-surface-500">{kpi.title}</p>
                      <p className="mt-2 text-2xl font-bold text-surface-900 dark:text-surface-50">{kpi.value}</p>
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
              <BarChart data={apiRevenue ?? REVENUE_DATA} barSize={32} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}€`} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#1EFF6A', fillOpacity: 0.06 }} />
                <Bar dataKey="revenue" fill="#1EFF6A" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Payment method split */}
          <Card padding="lg">
            <CardHeader>
              <CardTitle>Modes de paiement</CardTitle>
            </CardHeader>
            <div className="space-y-4">
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
              <div className="space-y-2">
                {PAYMENT_METHODS.map((m) => (
                  <div key={m.label} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className={`h-2.5 w-2.5 rounded-full ${m.color}`} />
                      <span className="text-surface-700 dark:text-surface-300">{m.label}</span>
                    </div>
                    <span className="font-semibold text-surface-900 dark:text-surface-100">{m.pct}%</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>

        {/* Transactions table */}
        <Card padding="none">
          <CardHeader className="border-b border-surface-100 px-6 py-5 dark:border-surface-700">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-brand-500" />
                <CardTitle>Dernières transactions</CardTitle>
              </div>

              {/* Filter tabs */}
              <div className="flex rounded-xl border border-surface-200 bg-surface-50 p-1 dark:border-surface-700 dark:bg-surface-800/50">
                {(Object.entries(TX_FILTER_LABELS) as [TxFilter, string][]).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setTxFilter(key)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                      txFilter === key
                        ? 'bg-white text-surface-900 shadow-sm dark:bg-surface-700 dark:text-surface-50'
                        : 'text-surface-500 hover:text-surface-700 dark:text-surface-400 dark:hover:text-surface-200'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </CardHeader>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-surface-100 bg-surface-50 dark:border-surface-700 dark:bg-surface-800/30">
                  {['Transaction', 'Commande', 'Client', 'Montant', 'Méthode', 'Heure', 'Statut', ''].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-surface-400"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100 dark:divide-surface-700">
                <AnimatePresence mode="wait">
                  {pagedTxs.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-10 text-center text-sm text-surface-400">
                        Aucune transaction pour ce filtre.
                      </td>
                    </tr>
                  ) : (
                    pagedTxs.map((tx, i) => {
                      const cfg       = STATUS_CONFIG[tx.status];
                      const canRefund = tx.status === 'completed' && !isAdmin;
                      return (
                        <motion.tr
                          key={tx.id}
                          initial={{ opacity: 0, x: -4 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.03 }}
                          className="cursor-pointer hover:bg-surface-50 dark:hover:bg-surface-700/30"
                          onClick={() => setSelectedTx(tx)}
                        >
                          <td className="px-4 py-3.5 font-mono text-sm font-medium text-surface-700 dark:text-surface-300">
                            {tx.id}
                          </td>
                          <td className="px-4 py-3.5 text-sm text-surface-600 dark:text-surface-400">{tx.order}</td>
                          <td className="px-4 py-3.5 text-sm font-medium text-surface-900 dark:text-surface-100">
                            {tx.customer}
                          </td>
                          <td className="px-4 py-3.5 text-sm font-bold text-surface-900 dark:text-surface-100">
                            {formatEUR(tx.amount)}
                          </td>
                          <td className="px-4 py-3.5 text-sm text-surface-600 dark:text-surface-400">{tx.method}</td>
                          <td className="px-4 py-3.5 text-sm text-surface-500">{tx.time}</td>
                          <td className="px-4 py-3.5">
                            <Badge variant={cfg.variant} dot>
                              {cfg.label}
                            </Badge>
                          </td>
                          <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                            {canRefund && (
                              <button
                                onClick={() => setRefundTx(tx)}
                                className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-medium text-red-600 transition-all hover:bg-red-100 active:scale-95 dark:border-red-800/50 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30"
                              >
                                <RotateCcw className="h-3 w-3" />
                                Rembourser
                              </button>
                            )}
                          </td>
                        </motion.tr>
                      );
                    })
                  )}
                </AnimatePresence>
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-surface-100 px-6 py-4 dark:border-surface-700">
              <p className="text-xs text-surface-500">
                {filteredTxs.length} transaction{filteredTxs.length !== 1 ? 's' : ''} —
                page {currentPage} / {totalPages}
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-surface-200 bg-white text-surface-600 transition-all hover:bg-surface-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-400"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setCurrentPage(p)}
                    className={`flex h-8 w-8 items-center justify-center rounded-lg border text-sm font-medium transition-all ${
                      p === currentPage
                        ? 'border-brand-500 bg-brand-500 text-white'
                        : 'border-surface-200 bg-white text-surface-600 hover:bg-surface-50 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-400'
                    }`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-surface-200 bg-white text-surface-600 transition-all hover:bg-surface-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-400"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </Card>

        {/* Payout section */}
        <Card padding="lg" className="border-brand-200 bg-gradient-to-br from-brand-50 to-brand-50 dark:border-brand-800/30 dark:from-brand-900/10 dark:to-surface-800">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="rounded-2xl bg-white p-3 shadow-sm dark:bg-surface-800">
                <ArrowDownToLine className="h-6 w-6 text-brand-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-surface-500">Prochain virement</p>
                <p className="text-2xl font-bold text-surface-900 dark:text-surface-50">
                  {formatEUR(STRIPE_SUMMARY.nextPayout.amount)}
                </p>
                <p className="mt-0.5 text-sm text-surface-500">
                  Prévu le{' '}
                  <span className="font-medium text-surface-700 dark:text-surface-300">
                    {STRIPE_SUMMARY.nextPayout.date}
                  </span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 rounded-xl bg-white px-4 py-3 shadow-sm dark:bg-surface-800">
                <Building2 className="h-4 w-4 text-surface-400" />
                <div>
                  <p className="text-xs text-surface-400">Compte bancaire</p>
                  <p className="text-sm font-semibold text-surface-900 dark:text-surface-100">****4521</p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Transaction detail modal */}
      <AnimatePresence>
        {selectedTx && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
            onClick={() => setSelectedTx(null)}
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-surface-800"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-5 flex items-center justify-between">
                <h3 className="text-lg font-bold text-surface-900 dark:text-surface-50">Détail transaction</h3>
                <button
                  onClick={() => setSelectedTx(null)}
                  className="rounded-lg p-1.5 text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-700"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-3">
                {(
                  [
                    ['ID Transaction', selectedTx.id],
                    [isAdmin ? 'Référence' : 'Commande', selectedTx.order],
                    [isAdmin ? 'Restaurant' : 'Client', selectedTx.customer],
                    ['Montant HT', `${(selectedTx.amount * 0.9).toFixed(2)}€`],
                    ['TVA (10%)', `${(selectedTx.amount * 0.1).toFixed(2)}€`],
                    ['Montant TTC', formatEUR(selectedTx.amount)],
                    ['Méthode', selectedTx.method],
                    ['Date / Heure', selectedTx.time],
                    ['Statut', STATUS_CONFIG[selectedTx.status].label],
                  ] as [string, string][]
                ).map(([label, value]) => (
                  <div
                    key={label}
                    className="flex justify-between border-b border-surface-100 pb-2 last:border-0 last:pb-0 dark:border-surface-700"
                  >
                    <span className="text-sm text-surface-500">{label}</span>
                    <span className="text-sm font-semibold text-surface-900 dark:text-surface-100">{value}</span>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setSelectedTx(null)}
                className="mt-5 w-full rounded-xl bg-brand-500 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-brand-600"
              >
                Fermer
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Refund modal */}
      <RefundModal
        tx={refundTx}
        onClose={() => setRefundTx(null)}
        onConfirm={handleRefundConfirm}
      />
    </>
  );
}
