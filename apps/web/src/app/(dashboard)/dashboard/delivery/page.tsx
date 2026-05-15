'use client';

import { useState, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Link from 'next/link';
import {
  MapPin, Clock, Truck, CheckCircle2, XCircle,
  RotateCcw, Navigation, User, Package, Search,
  Download, FileText, MessageSquare, ArrowLeft,
} from 'lucide-react';
import { clsx } from 'clsx';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';

// ── Types ────────────────────────────────────────────────────────────────────

type DeliveryStatus = 'preparing' | 'ready' | 'delivering' | 'delivered' | 'failed';
type TimeRange     = 'today' | 'week' | 'month' | 'year';

interface NoteEntry {
  ts: string;
  text: string;
}

interface Delivery {
  id: string;
  order: string;
  driver: string;
  customer: string;
  address: string;
  status: DeliveryStatus;
  pickupTime: string;
  eta: string;
  distance: string;
  createdAt: string; // ISO
  notes: NoteEntry[];
}

interface FailureReason {
  deliveryId: string;
  reason: string;
}

// ── Mock data ────────────────────────────────────────────────────────────────

const now = new Date();
const isoDaysAgo = (d: number) => new Date(now.getTime() - d * 86_400_000).toISOString();

const DELIVERIES: Delivery[] = [
  {
    id: 'DEL-441', order: 'ORD-8821', driver: 'Karim Benali', customer: 'Marie L.',
    address: '12 rue de Rivoli, Paris', status: 'delivering',
    pickupTime: '12:34', eta: '12:56', distance: '2.3 km',
    createdAt: isoDaysAgo(0), notes: [],
  },
  {
    id: 'DEL-440', order: 'ORD-8820', driver: 'Amina Diallo', customer: 'Pierre D.',
    address: '45 bd Voltaire, Paris', status: 'delivering',
    pickupTime: '12:28', eta: '12:50', distance: '1.8 km',
    createdAt: isoDaysAgo(0), notes: [],
  },
  {
    id: 'DEL-439', order: 'ORD-8819', driver: 'Karim Benali', customer: 'Sophie M.',
    address: '8 rue du Temple, Paris', status: 'delivered',
    pickupTime: '12:05', eta: '12:22', distance: '3.1 km',
    createdAt: isoDaysAgo(0), notes: [],
  },
  {
    id: 'DEL-438', order: 'ORD-8818', driver: 'Sofia Medina', customer: 'Julien K.',
    address: '23 av Daumesnil, Paris', status: 'delivered',
    pickupTime: '11:48', eta: '12:08', distance: '2.7 km',
    createdAt: isoDaysAgo(2), notes: [],
  },
  {
    id: 'DEL-437', order: 'ORD-8817', driver: 'Lucas Petit', customer: 'Emma R.',
    address: '67 rue Oberkampf, Paris', status: 'failed',
    pickupTime: '11:30', eta: '11:52', distance: '1.5 km',
    createdAt: isoDaysAgo(1), notes: [],
  },
  {
    id: 'DEL-430', order: 'ORD-8810', driver: 'Sofia Medina', customer: 'Antoine B.',
    address: '5 rue Lepic, Paris', status: 'delivered',
    pickupTime: '14:10', eta: '14:35', distance: '2.0 km',
    createdAt: isoDaysAgo(10), notes: [],
  },
  {
    id: 'DEL-420', order: 'ORD-8800', driver: 'Karim Benali', customer: 'Claire F.',
    address: '88 rue Saint-Honoré, Paris', status: 'delivered',
    pickupTime: '19:20', eta: '19:45', distance: '3.4 km',
    createdAt: isoDaysAgo(45), notes: [],
  },
];

const FAILURE_REASONS: FailureReason[] = [
  { deliveryId: 'DEL-437', reason: 'Client absent' },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<DeliveryStatus, { label: string; variant: 'brand' | 'success' | 'danger' | 'warning' | 'info' }> = {
  preparing:  { label: 'En préparation', variant: 'warning' },
  ready:      { label: 'Prête',          variant: 'info'    },
  delivering: { label: 'En livraison',   variant: 'brand'   },
  delivered:  { label: 'Livrée',         variant: 'success' },
  failed:     { label: 'Échouée',        variant: 'danger'  },
};

const TIME_TABS: { key: TimeRange; label: string }[] = [
  { key: 'today', label: "Aujourd'hui" },
  { key: 'week',  label: 'Semaine'     },
  { key: 'month', label: 'Mois'        },
  { key: 'year',  label: 'Année'       },
];

function inRange(iso: string, range: TimeRange): boolean {
  const d = new Date(iso);
  const ref = new Date();
  if (range === 'today') {
    return d.toDateString() === ref.toDateString();
  }
  if (range === 'week') {
    const start = new Date(ref);
    start.setDate(ref.getDate() - 7);
    return d >= start;
  }
  if (range === 'month') {
    return d.getMonth() === ref.getMonth() && d.getFullYear() === ref.getFullYear();
  }
  return d.getFullYear() === ref.getFullYear();
}

function driverInitials(name: string): string {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

function fmtNow(): string {
  return new Date().toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });
}

// ── Sub-components ────────────────────────────────────────────────────────────

function DriverAvatar({ name }: { name: string }) {
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-surface-200 to-surface-300">
      <span className="text-xs font-bold text-surface-700">{driverInitials(name)}</span>
    </div>
  );
}

function DeliveryRow({
  delivery, onRetry, onOpen,
}: {
  delivery: Delivery;
  onRetry: (id: string) => void;
  onOpen: (id: string) => void;
}) {
  const statusCfg = STATUS_CONFIG[delivery.status];

  return (
    <motion.tr
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      onClick={() => onOpen(delivery.id)}
      className="cursor-pointer border-b border-surface-50 hover:bg-surface-50 transition-colors"
    >
      <td className="px-6 py-4">
        <span className="font-mono text-sm font-semibold text-surface-900">{delivery.id}</span>
      </td>
      <td className="px-6 py-4">
        <span className="text-sm font-medium text-brand-600">{delivery.order}</span>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          <DriverAvatar name={delivery.driver} />
          <span className="text-sm text-surface-700">{delivery.driver}</span>
        </div>
      </td>
      <td className="px-6 py-4">
        <p className="text-sm font-medium text-surface-900">{delivery.customer}</p>
        <p className="flex items-center gap-1 text-xs text-surface-400">
          <MapPin className="h-3 w-3 shrink-0" />
          {delivery.address}
        </p>
      </td>
      <td className="px-6 py-4">
        <Badge variant={statusCfg.variant} dot>{statusCfg.label}</Badge>
      </td>
      <td className="px-6 py-4 text-sm text-surface-600">{delivery.pickupTime}</td>
      <td className="px-6 py-4 text-sm text-surface-600">{delivery.eta}</td>
      <td className="px-6 py-4 text-sm text-surface-500">{delivery.distance}</td>
      <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2 flex-wrap">
          {(delivery.status === 'delivering' || delivery.status === 'ready' || delivery.status === 'preparing') && (
            <button
              onClick={() => onOpen(delivery.id)}
              className="rounded-lg bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700 transition-colors hover:bg-brand-100"
            >
              Suivre
            </button>
          )}
          {delivery.status === 'failed' && (
            <button
              onClick={() => onRetry(delivery.id)}
              className="flex items-center gap-1 rounded-lg bg-red-50 dark:bg-red-900/20 px-3 py-1.5 text-xs font-semibold text-red-700 dark:text-red-400 transition-colors hover:bg-red-100"
            >
              <RotateCcw className="h-3 w-3" />
              Relancer
            </button>
          )}
          <Link
            href="/dashboard/drivers"
            className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2.5 py-1.5 text-xs font-semibold text-blue-700 transition-colors hover:bg-blue-100"
          >
            <User className="h-3 w-3" />
            Livreur
          </Link>
        </div>
      </td>
    </motion.tr>
  );
}

// ── Detail modal ─────────────────────────────────────────────────────────────

const STATUS_ORDER: DeliveryStatus[] = ['preparing', 'ready', 'delivering', 'delivered'];
const STATUS_BUTTONS: { value: DeliveryStatus; label: string }[] = [
  { value: 'preparing',  label: 'Démarrer'     },
  { value: 'ready',      label: 'Prête'        },
  { value: 'delivering', label: 'En livraison' },
  { value: 'delivered',  label: 'Livré'        },
];

function DeliveryDetailModal({
  delivery, open, onClose, onStatusChange, onAddNote,
}: {
  delivery: Delivery | null;
  open: boolean;
  onClose: () => void;
  onStatusChange: (id: string, status: DeliveryStatus) => void;
  onAddNote: (id: string, text: string) => void;
}) {
  const [noteText, setNoteText] = useState('');

  if (!delivery) return null;
  const statusCfg = STATUS_CONFIG[delivery.status];

  return (
    <Modal open={open} onClose={onClose} size="xl" title={`Livraison ${delivery.id}`} description={`Commande ${delivery.order}`}>
      <div className="space-y-5">
        {/* Status + summary */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-surface-100 bg-surface-50 p-4">
          <div className="flex items-center gap-3">
            <DriverAvatar name={delivery.driver} />
            <div>
              <p className="text-sm font-semibold text-surface-900">{delivery.driver}</p>
              <p className="text-xs text-surface-500">Livreur assigné</p>
            </div>
          </div>
          <Badge variant={statusCfg.variant} dot>{statusCfg.label}</Badge>
        </div>

        {/* Info grid */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-surface-100 p-3">
            <p className="text-xs uppercase tracking-wide text-surface-400">Client</p>
            <p className="mt-1 text-sm font-medium text-surface-900">{delivery.customer}</p>
            <p className="mt-1 flex items-center gap-1 text-xs text-surface-500">
              <MapPin className="h-3 w-3" />{delivery.address}
            </p>
          </div>
          <div className="rounded-xl border border-surface-100 p-3">
            <p className="text-xs uppercase tracking-wide text-surface-400">Horaires</p>
            <p className="mt-1 text-sm text-surface-700">Prise: <span className="font-medium">{delivery.pickupTime}</span></p>
            <p className="text-sm text-surface-700">ETA: <span className="font-medium">{delivery.eta}</span></p>
            <p className="text-xs text-surface-500">{delivery.distance}</p>
          </div>
        </div>

        {/* Status changer */}
        <div>
          <p className="mb-2 text-sm font-semibold text-surface-900">Changer le statut</p>
          <div className="flex flex-wrap gap-2">
            {STATUS_BUTTONS.map((b) => {
              const active = delivery.status === b.value;
              const idxCur = STATUS_ORDER.indexOf(delivery.status);
              const idxBtn = STATUS_ORDER.indexOf(b.value);
              const disabled = delivery.status === 'delivered' || delivery.status === 'failed' || idxBtn < idxCur;
              return (
                <button
                  key={b.value}
                  disabled={disabled}
                  onClick={() => onStatusChange(delivery.id, b.value)}
                  className={clsx(
                    'rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors',
                    active
                      ? 'bg-brand-500 text-white'
                      : disabled
                        ? 'cursor-not-allowed bg-surface-50 text-surface-300'
                        : 'bg-surface-100 text-surface-700 hover:bg-surface-200'
                  )}
                >
                  {b.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Notes */}
        <div>
          <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-surface-900">
            <MessageSquare className="h-3.5 w-3.5" /> Notes
          </p>
          <textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            rows={3}
            placeholder="Ajouter une note (incident, contact client, etc.)"
            className="w-full rounded-xl border border-surface-200 bg-white p-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          />
          <div className="mt-2 flex justify-end">
            <Button
              size="sm"
              disabled={!noteText.trim()}
              onClick={() => { onAddNote(delivery.id, noteText.trim()); setNoteText(''); }}
            >
              Ajouter à l&apos;historique
            </Button>
          </div>

          {delivery.notes.length > 0 && (
            <div className="mt-3 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-surface-400">Historique</p>
              {delivery.notes.map((n, i) => (
                <div key={i} className="rounded-lg border border-surface-100 bg-surface-50 p-3">
                  <p className="text-xs text-surface-400">{n.ts}</p>
                  <p className="mt-0.5 text-sm text-surface-800">{n.text}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function DeliveryPage() {
  const [deliveries, setDeliveries] = useState<Delivery[]>(DELIVERIES);
  const [search, setSearch] = useState('');
  const [range, setRange] = useState<TimeRange>('today');
  const [openId, setOpenId] = useState<string | null>(null);

  const handleRetry = (id: string) => {
    setDeliveries((prev) =>
      prev.map((d) => d.id === id ? { ...d, status: 'delivering' } : d)
    );
  };

  const handleStatusChange = (id: string, status: DeliveryStatus) => {
    setDeliveries((prev) => prev.map((d) => d.id === id ? { ...d, status } : d));
  };

  const handleAddNote = (id: string, text: string) => {
    setDeliveries((prev) => prev.map((d) => d.id === id
      ? { ...d, notes: [...d.notes, { ts: fmtNow(), text }] }
      : d));
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return deliveries.filter((d) => {
      if (!inRange(d.createdAt, range)) return false;
      if (!q) return true;
      return (
        d.id.toLowerCase().includes(q) ||
        d.order.toLowerCase().includes(q) ||
        d.customer.toLowerCase().includes(q) ||
        d.address.toLowerCase().includes(q) ||
        d.driver.toLowerCase().includes(q)
      );
    });
  }, [deliveries, search, range]);

  const kpis = useMemo(() => {
    const list = filtered;
    const inProgress = list.filter((d) => d.status === 'delivering' || d.status === 'ready' || d.status === 'preparing').length;
    const delivered = list.filter((d) => d.status === 'delivered').length;
    const failed = list.filter((d) => d.status === 'failed').length;
    const total = delivered + failed;
    const success = total > 0 ? Math.round((delivered / total) * 100) : 0;
    return [
      { label: 'En cours',         value: String(inProgress), icon: Truck,        iconColor: 'text-brand-600',  iconBg: 'bg-brand-50' },
      { label: 'Livrées',          value: String(delivered),  icon: CheckCircle2, iconColor: 'text-green-600',  iconBg: 'bg-green-50' },
      { label: 'Temps moyen',      value: '22 min',           icon: Clock,        iconColor: 'text-blue-600',   iconBg: 'bg-blue-50'  },
      { label: 'Taux succès',      value: `${success}%`,      icon: Navigation,   iconColor: 'text-purple-600', iconBg: 'bg-purple-50'},
    ];
  }, [filtered]);

  const failedDeliveries = deliveries.filter((d) => d.status === 'failed');

  // ── Exports ─────────────────────────────────────────────────────────────
  const exportCSV = () => {
    const head = ['ID', 'Commande', 'Livreur', 'Client', 'Adresse', 'Statut', 'Prise en charge', 'ETA', 'Distance'];
    const rows = filtered.map((d) => [
      d.id, d.order, d.driver, d.customer, d.address,
      STATUS_CONFIG[d.status].label, d.pickupTime, d.eta, d.distance,
    ]);
    const csv = [head, ...rows]
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `livraisons_${range}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPDF = async () => {
    const { default: jsPDF } = await import('jspdf');
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Livraisons FoodStack', 14, 18);
    doc.setFontSize(10);
    doc.text(`Période: ${TIME_TABS.find((t) => t.key === range)?.label} · ${new Date().toLocaleDateString('fr-FR')}`, 14, 26);

    let y = 38;
    doc.setFontSize(9);
    doc.text('ID', 14, y);
    doc.text('Commande', 36, y);
    doc.text('Livreur', 64, y);
    doc.text('Client', 100, y);
    doc.text('Statut', 140, y);
    doc.text('ETA', 175, y);
    y += 4;
    doc.line(14, y, 196, y);
    y += 6;

    filtered.forEach((d) => {
      if (y > 280) { doc.addPage(); y = 20; }
      doc.text(d.id, 14, y);
      doc.text(d.order, 36, y);
      doc.text(d.driver.slice(0, 16), 64, y);
      doc.text(d.customer.slice(0, 18), 100, y);
      doc.text(STATUS_CONFIG[d.status].label, 140, y);
      doc.text(d.eta, 175, y);
      y += 6;
    });

    doc.save(`livraisons_${range}_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  const openDelivery = deliveries.find((d) => d.id === openId) ?? null;

  return (
    <div className="space-y-6 p-6">
      {/* Breadcrumb */}
      <div>
        <Link
          href="/dashboard/orders"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-surface-500 hover:text-surface-900 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Retour commandes
        </Link>
      </div>

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Suivi des livraisons</h1>
          <p className="mt-1 text-sm text-surface-500">
            {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="ghost" size="sm" icon={<Download className="h-4 w-4" />} onClick={exportCSV}>
            Export CSV
          </Button>
          <Button variant="ghost" size="sm" icon={<FileText className="h-4 w-4" />} onClick={exportPDF}>
            Export PDF
          </Button>
          <div className="flex items-center gap-2 rounded-xl bg-green-50 dark:bg-green-900/20 px-4 py-2">
            <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
            <span className="text-sm font-medium text-green-700 dark:text-green-400">Connecté</span>
          </div>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map(({ label, value, icon: Icon, iconColor, iconBg }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
          >
            <Card padding="md" className="flex items-center gap-3">
              <div className={`rounded-xl p-2.5 ${iconBg}`}>
                <Icon className={`h-5 w-5 ${iconColor}`} />
              </div>
              <div>
                <p className="text-xl font-bold text-surface-900">{value}</p>
                <p className="text-xs text-surface-400">{label}</p>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Search + tabs */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-56">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ID, commande, client, adresse, livreur..."
            className="w-full rounded-xl border border-surface-200 bg-white py-2.5 pl-9 pr-4 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          />
        </div>
        <div className="flex gap-1 rounded-xl border border-surface-200 bg-white p-1">
          {TIME_TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setRange(t.key)}
              className={clsx(
                'rounded-lg px-3 py-1.5 text-sm font-medium transition-all',
                range === t.key ? 'bg-surface-900 text-white' : 'text-surface-600 hover:bg-surface-100'
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Deliveries table */}
      <Card padding="none">
        <CardHeader className="border-b border-surface-100 px-6 py-5">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-brand-500" />
            <CardTitle>Livraisons</CardTitle>
          </div>
          <span className="text-sm text-surface-400">{filtered.length} livraisons</span>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-100 text-left">
                {['ID', 'Commande', 'Livreur', 'Client · Adresse', 'Statut', 'Prise en charge', 'ETA', 'Distance', 'Action'].map((h) => (
                  <th key={h} className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-surface-400">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <AnimatePresence mode="popLayout">
                {filtered.map((delivery) => (
                  <DeliveryRow
                    key={delivery.id}
                    delivery={delivery}
                    onRetry={handleRetry}
                    onOpen={setOpenId}
                  />
                ))}
              </AnimatePresence>
            </tbody>
          </table>
          {filtered.length === 0 && (
            <p className="py-10 text-center text-sm text-surface-400">Aucune livraison sur cette période</p>
          )}
        </div>
      </Card>

      {/* Bottom row: failures + map */}
      <div className="grid gap-6 xl:grid-cols-[1fr,2fr]">
        {/* Recent failures */}
        <Card padding="md">
          <CardHeader className="mb-4">
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-500" />
              <CardTitle>Échecs récents</CardTitle>
            </div>
          </CardHeader>
          <div className="space-y-3">
            <AnimatePresence>
              {failedDeliveries.length === 0 && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center text-sm text-surface-400 py-4"
                >
                  Aucun échec — excellente journée !
                </motion.p>
              )}
              {failedDeliveries.map((delivery) => {
                const reason = FAILURE_REASONS.find((r) => r.deliveryId === delivery.id)?.reason ?? 'Motif inconnu';
                return (
                  <motion.div
                    key={delivery.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -8 }}
                    className="rounded-xl border border-red-100 bg-red-50 dark:bg-red-900/20 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-semibold text-red-800">{delivery.id}</span>
                          <Badge variant="danger">{delivery.order}</Badge>
                        </div>
                        <div className="mt-1 flex items-center gap-1.5 text-xs text-surface-500">
                          <User className="h-3 w-3" />
                          {delivery.driver}
                        </div>
                        <p className="mt-1.5 text-xs font-medium text-red-700">{reason}</p>
                        <p className="mt-0.5 flex items-center gap-1 text-xs text-surface-400">
                          <MapPin className="h-3 w-3 shrink-0" />
                          {delivery.address}
                        </p>
                      </div>
                      <button
                        onClick={() => handleRetry(delivery.id)}
                        className="flex shrink-0 items-center gap-1 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-red-700 shadow-sm transition-colors hover:bg-red-100"
                      >
                        <RotateCcw className="h-3 w-3" />
                        Relancer
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </Card>

        {/* Map placeholder */}
        <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-2xl bg-surface-100 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-200">
            <MapPin className="h-6 w-6 text-surface-400" />
          </div>
          <div className="text-center">
            <p className="font-semibold text-surface-500">Carte en temps réel</p>
            <p className="text-sm text-surface-400">Intégration maps à venir</p>
          </div>
        </div>
      </div>

      {/* Detail modal */}
      <DeliveryDetailModal
        delivery={openDelivery}
        open={!!openDelivery}
        onClose={() => setOpenId(null)}
        onStatusChange={handleStatusChange}
        onAddNote={handleAddNote}
      />
    </div>
  );
}
