'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  MapPin, Clock, Truck, CheckCircle2, XCircle,
  RotateCcw, Navigation, User, Package,
} from 'lucide-react';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

// ── Types ────────────────────────────────────────────────────────────────────

type DeliveryStatus = 'delivering' | 'delivered' | 'failed';

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
}

interface FailureReason {
  deliveryId: string;
  reason: string;
}

// ── Mock data ────────────────────────────────────────────────────────────────

const DELIVERIES: Delivery[] = [
  {
    id: 'DEL-441', order: 'ORD-8821', driver: 'Karim Benali', customer: 'Marie L.',
    address: '12 rue de Rivoli, Paris', status: 'delivering',
    pickupTime: '12:34', eta: '12:56', distance: '2.3 km',
  },
  {
    id: 'DEL-440', order: 'ORD-8820', driver: 'Amina Diallo', customer: 'Pierre D.',
    address: '45 bd Voltaire, Paris', status: 'delivering',
    pickupTime: '12:28', eta: '12:50', distance: '1.8 km',
  },
  {
    id: 'DEL-439', order: 'ORD-8819', driver: 'Karim Benali', customer: 'Sophie M.',
    address: '8 rue du Temple, Paris', status: 'delivered',
    pickupTime: '12:05', eta: '12:22', distance: '3.1 km',
  },
  {
    id: 'DEL-438', order: 'ORD-8818', driver: 'Sofia Medina', customer: 'Julien K.',
    address: '23 av Daumesnil, Paris', status: 'delivered',
    pickupTime: '11:48', eta: '12:08', distance: '2.7 km',
  },
  {
    id: 'DEL-437', order: 'ORD-8817', driver: 'Lucas Petit', customer: 'Emma R.',
    address: '67 rue Oberkampf, Paris', status: 'failed',
    pickupTime: '11:30', eta: '11:52', distance: '1.5 km',
  },
];

const FAILURE_REASONS: FailureReason[] = [
  { deliveryId: 'DEL-437', reason: 'Client absent' },
];

const KPI_DATA = [
  { label: 'En cours', value: '3', icon: Truck, iconColor: 'text-brand-600', iconBg: 'bg-brand-50' },
  { label: 'Livrées aujourd\'hui', value: '47', icon: CheckCircle2, iconColor: 'text-green-600 dark:text-green-400', iconBg: 'bg-green-50 dark:bg-green-900/20' },
  { label: 'Temps moyen', value: '22 min', icon: Clock, iconColor: 'text-blue-600 dark:text-blue-400', iconBg: 'bg-blue-50 dark:bg-blue-900/20' },
  { label: 'Taux succès', value: '96%', icon: Navigation, iconColor: 'text-purple-600 dark:text-purple-400', iconBg: 'bg-purple-50 dark:bg-purple-900/20' },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<DeliveryStatus, { label: string; variant: 'brand' | 'success' | 'danger' }> = {
  delivering: { label: 'En cours', variant: 'brand' },
  delivered:  { label: 'Livrée',   variant: 'success' },
  failed:     { label: 'Échouée',  variant: 'danger' },
};

function driverInitials(name: string): string {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

// ── Sub-components ────────────────────────────────────────────────────────────

function DriverAvatar({ name }: { name: string }) {
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-surface-200 to-surface-300">
      <span className="text-xs font-bold text-surface-700">{driverInitials(name)}</span>
    </div>
  );
}

function DeliveryRow({ delivery, onRetry }: { delivery: Delivery; onRetry: (id: string) => void }) {
  const statusCfg = STATUS_CONFIG[delivery.status];

  return (
    <motion.tr
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      className="border-b border-surface-50 hover:bg-surface-50 transition-colors"
    >
      {/* ID */}
      <td className="px-6 py-4">
        <span className="font-mono text-sm font-semibold text-surface-900">{delivery.id}</span>
      </td>

      {/* Commande */}
      <td className="px-6 py-4">
        <span className="text-sm font-medium text-brand-600">{delivery.order}</span>
      </td>

      {/* Livreur */}
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          <DriverAvatar name={delivery.driver} />
          <span className="text-sm text-surface-700">{delivery.driver}</span>
        </div>
      </td>

      {/* Client + adresse */}
      <td className="px-6 py-4">
        <p className="text-sm font-medium text-surface-900">{delivery.customer}</p>
        <p className="flex items-center gap-1 text-xs text-surface-400">
          <MapPin className="h-3 w-3 shrink-0" />
          {delivery.address}
        </p>
      </td>

      {/* Statut */}
      <td className="px-6 py-4">
        <Badge variant={statusCfg.variant} dot>{statusCfg.label}</Badge>
      </td>

      {/* Prise en charge */}
      <td className="px-6 py-4 text-sm text-surface-600">{delivery.pickupTime}</td>

      {/* ETA */}
      <td className="px-6 py-4 text-sm text-surface-600">{delivery.eta}</td>

      {/* Distance */}
      <td className="px-6 py-4 text-sm text-surface-500">{delivery.distance}</td>

      {/* Action */}
      <td className="px-6 py-4">
        {delivery.status === 'delivering' && (
          <button className="rounded-lg bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700 transition-colors hover:bg-brand-100">
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
        {delivery.status === 'delivered' && (
          <span className="text-xs text-surface-400">—</span>
        )}
      </td>
    </motion.tr>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function DeliveryPage() {
  const [deliveries, setDeliveries] = useState<Delivery[]>(DELIVERIES);

  const handleRetry = (id: string) => {
    setDeliveries((prev) =>
      prev.map((d) => d.id === id ? { ...d, status: 'delivering' } : d)
    );
  };

  const failedDeliveries = deliveries.filter((d) => d.status === 'failed');

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Suivi des livraisons</h1>
          <p className="mt-1 text-sm text-surface-500">
            {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-xl bg-green-50 dark:bg-green-900/20 px-4 py-2">
          <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
          <span className="text-sm font-medium text-green-700 dark:text-green-400">Connecté</span>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {KPI_DATA.map(({ label, value, icon: Icon, iconColor, iconBg }, i) => (
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

      {/* Deliveries table */}
      <Card padding="none">
        <CardHeader className="border-b border-surface-100 px-6 py-5">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-brand-500" />
            <CardTitle>Livraisons actives</CardTitle>
          </div>
          <span className="text-sm text-surface-400">{deliveries.length} livraisons</span>
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
                {deliveries.map((delivery) => (
                  <DeliveryRow key={delivery.id} delivery={delivery} onRetry={handleRetry} />
                ))}
              </AnimatePresence>
            </tbody>
          </table>
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

            {/* Extra mock failure */}
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-xl border border-red-100 bg-red-50 dark:bg-red-900/20 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-semibold text-red-800">DEL-435</span>
                    <Badge variant="danger">ORD-8815</Badge>
                  </div>
                  <div className="mt-1 flex items-center gap-1.5 text-xs text-surface-500">
                    <User className="h-3 w-3" />
                    Sofia Medina
                  </div>
                  <p className="mt-1.5 text-xs font-medium text-red-700">Adresse introuvable</p>
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-surface-400">
                    <MapPin className="h-3 w-3 shrink-0" />
                    89 passage Thiéré, Paris
                  </p>
                </div>
                <button className="flex shrink-0 items-center gap-1 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-red-700 shadow-sm transition-colors hover:bg-red-100">
                  <RotateCcw className="h-3 w-3" />
                  Relancer
                </button>
              </div>
            </motion.div>
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
    </div>
  );
}
