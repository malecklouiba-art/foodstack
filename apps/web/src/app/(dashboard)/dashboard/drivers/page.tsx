'use client';

import { useState, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bike, Star, Package, Phone, MapPin, Clock,
  CheckCircle, AlertCircle, XCircle, Search,
  UserPlus, Filter, TrendingUp, Wifi, WifiOff,
  ChevronDown, X,
} from 'lucide-react';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useRealtimeDrivers } from '@/hooks/useRealtimeDrivers';
import type { DriverPosition } from './_DriversMap';

const DriversMap = dynamic(() => import('./_DriversMap'), { ssr: false });

// ── Types ────────────────────────────────────────────────────────────────────

type DocStatus = 'valid' | 'pending' | 'expired';
type DriverStatus = 'online' | 'offline' | 'delivering';

interface Driver {
  id: string;
  name: string;
  phone: string;
  vehicle: string;
  zone: string;
  status: DriverStatus;
  rating: number;
  deliveriesToday: number;
  earningsToday: number;
  activeOrder?: string;
  joinedAt: string;
  docs: { license: DocStatus; insurance: DocStatus; id: DocStatus };
  avatar: string;
}

// ── Static seed data ─────────────────────────────────────────────────────────

const SEED: Driver[] = [
  {
    id: 'd1', name: 'Karim Benali', phone: '+33 6 12 34 56 78', vehicle: 'Scooter · CB500',
    zone: 'Centre-ville', status: 'delivering', rating: 4.9, deliveriesToday: 12, earningsToday: 87.50,
    activeOrder: 'ORD-8821', joinedAt: '2024-03',
    docs: { license: 'valid', insurance: 'valid', id: 'valid' },
    avatar: 'KB',
  },
  {
    id: 'd2', name: 'Sofia Medina', phone: '+33 6 98 76 54 32', vehicle: 'Vélo électrique',
    zone: 'Bastille – Marais', status: 'online', rating: 4.7, deliveriesToday: 8, earningsToday: 54.20,
    joinedAt: '2024-07',
    docs: { license: 'valid', insurance: 'pending', id: 'valid' },
    avatar: 'SM',
  },
  {
    id: 'd3', name: 'Lucas Petit', phone: '+33 6 55 44 33 22', vehicle: 'Moto · MT-07',
    zone: 'Montparnasse', status: 'online', rating: 4.5, deliveriesToday: 6, earningsToday: 43.80,
    joinedAt: '2024-11',
    docs: { license: 'valid', insurance: 'valid', id: 'expired' },
    avatar: 'LP',
  },
  {
    id: 'd4', name: 'Amina Diallo', phone: '+33 6 22 33 44 55', vehicle: 'Scooter · Kymco',
    zone: 'Nation – Vincennes', status: 'delivering', rating: 4.8, deliveriesToday: 10, earningsToday: 72.00,
    activeOrder: 'ORD-8820', joinedAt: '2024-05',
    docs: { license: 'valid', insurance: 'valid', id: 'valid' },
    avatar: 'AD',
  },
  {
    id: 'd5', name: 'Thomas Roux', phone: '+33 6 77 88 99 00', vehicle: 'Vélo cargo',
    zone: 'Oberkampf', status: 'offline', rating: 4.3, deliveriesToday: 0, earningsToday: 0,
    joinedAt: '2025-01',
    docs: { license: 'pending', insurance: 'pending', id: 'valid' },
    avatar: 'TR',
  },
  {
    id: 'd6', name: 'Inès Laurent', phone: '+33 6 44 55 66 77', vehicle: 'Scooter · Piaggio',
    zone: 'Pigalle – 18ème', status: 'offline', rating: 4.6, deliveriesToday: 3, earningsToday: 21.30,
    joinedAt: '2024-09',
    docs: { license: 'valid', insurance: 'expired', id: 'valid' },
    avatar: 'IL',
  },
];

// ── Initial GPS positions (Paris area) ───────────────────────────────────────

const INITIAL_POSITIONS: Record<string, { lat: number; lng: number }> = {
  d1: { lat: 48.8566, lng: 2.3522 },
  d2: { lat: 48.8606, lng: 2.3622 },
  d3: { lat: 48.8486, lng: 2.3422 },
  d4: { lat: 48.8626, lng: 2.3722 },
  d5: { lat: 48.8546, lng: 2.3302 },
  d6: { lat: 48.8696, lng: 2.3462 },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const DOC_CONFIG: Record<DocStatus, { label: string; color: string; icon: typeof CheckCircle }> = {
  valid:   { label: 'Valide',   color: 'text-green-600', icon: CheckCircle },
  pending: { label: 'En attente', color: 'text-yellow-600', icon: AlertCircle },
  expired: { label: 'Expiré',  color: 'text-red-500',   icon: XCircle },
};

const STATUS_CONFIG: Record<DriverStatus, { label: string; variant: 'success' | 'brand' | 'default' }> = {
  online:    { label: 'Disponible',  variant: 'success' },
  delivering:{ label: 'En livraison',variant: 'brand' },
  offline:   { label: 'Hors ligne', variant: 'default' },
};

function DocBadge({ status }: { status: DocStatus }) {
  const cfg = DOC_CONFIG[status];
  const Icon = cfg.icon;
  return <Icon className={`h-3.5 w-3.5 ${cfg.color}`} aria-label={cfg.label} />;
}

function DriverAvatar({ initials, status }: { initials: string; status: DriverStatus }) {
  const ring = status === 'delivering' ? 'ring-brand-400' : status === 'online' ? 'ring-green-400' : 'ring-surface-300';
  return (
    <div className={`relative flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-surface-200 to-surface-300 ring-2 ${ring}`}>
      <span className="text-sm font-bold text-surface-700">{initials}</span>
      {status !== 'offline' && (
        <span className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white ${status === 'delivering' ? 'bg-brand-500' : 'bg-green-500'}`} />
      )}
    </div>
  );
}

// ── Invite modal ──────────────────────────────────────────────────────────────

function InviteModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({ name: '', phone: '', vehicle: '', zone: '' });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="mx-4 w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-bold text-surface-900">Inviter un livreur</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-surface-100">
            <X className="h-4 w-4 text-surface-500" />
          </button>
        </div>
        <div className="space-y-4">
          {[
            { key: 'name', label: 'Nom complet', placeholder: 'Jean Dupont' },
            { key: 'phone', label: 'Téléphone', placeholder: '+33 6 12 34 56 78' },
            { key: 'vehicle', label: 'Véhicule', placeholder: 'Scooter, vélo, moto…' },
            { key: 'zone', label: 'Zone de livraison', placeholder: 'Centre-ville' },
          ].map((field) => (
            <div key={field.key}>
              <label className="mb-1.5 block text-xs font-semibold text-surface-600">{field.label}</label>
              <input
                type="text"
                placeholder={field.placeholder}
                value={form[field.key as keyof typeof form]}
                onChange={(e) => setForm((f) => ({ ...f, [field.key]: e.target.value }))}
                className="w-full rounded-xl border border-surface-200 px-3 py-2.5 text-sm text-surface-900 placeholder-surface-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
              />
            </div>
          ))}
        </div>
        <div className="mt-6 flex gap-3">
          <button onClick={onClose} className="flex-1 rounded-xl border border-surface-200 py-2.5 text-sm font-semibold text-surface-600 hover:bg-surface-50">
            Annuler
          </button>
          <button
            onClick={onClose}
            className="flex-1 rounded-xl bg-brand-500 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 transition-colors"
          >
            Envoyer l&apos;invitation
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Driver detail panel ───────────────────────────────────────────────────────

function DriverPanel({ driver, onClose }: { driver: Driver; onClose: () => void }) {
  const statusCfg = STATUS_CONFIG[driver.status];
  const docsOk = Object.values(driver.docs).every((d) => d === 'valid');

  return (
    <motion.div
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 24 }}
      className="flex w-80 flex-col overflow-hidden rounded-2xl border border-surface-200 bg-white shadow-lg"
    >
      {/* Header */}
      <div className="border-b border-surface-100 p-5">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-surface-400">Profil livreur</span>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-surface-100">
            <X className="h-4 w-4 text-surface-400" />
          </button>
        </div>
        <div className="flex items-start gap-4">
          <DriverAvatar initials={driver.avatar} status={driver.status} />
          <div className="flex-1 min-w-0">
            <p className="font-bold text-surface-900">{driver.name}</p>
            <p className="text-xs text-surface-500">{driver.vehicle}</p>
            <div className="mt-1.5">
              <Badge variant={statusCfg.variant} dot>{statusCfg.label}</Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 divide-x divide-surface-100 border-b border-surface-100">
        {[
          { label: 'Note', value: `${driver.rating}/5` },
          { label: "Aujourd'hui", value: String(driver.deliveriesToday) },
          { label: 'Gains', value: `${driver.earningsToday.toFixed(0)}€` },
        ].map((s) => (
          <div key={s.label} className="py-4 text-center">
            <p className="text-base font-bold text-surface-900">{s.value}</p>
            <p className="text-xs text-surface-400">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Info */}
      <div className="flex-1 space-y-3 overflow-y-auto p-5">
        {[
          { icon: Phone, label: 'Téléphone', value: driver.phone },
          { icon: MapPin, label: 'Zone', value: driver.zone },
          { icon: Clock, label: "Depuis", value: driver.joinedAt },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-100">
              <Icon className="h-4 w-4 text-surface-400" />
            </div>
            <div>
              <p className="text-xs text-surface-400">{label}</p>
              <p className="text-sm font-medium text-surface-900">{value}</p>
            </div>
          </div>
        ))}

        {driver.activeOrder && (
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50">
              <Package className="h-4 w-4 text-brand-500" />
            </div>
            <div>
              <p className="text-xs text-surface-400">Commande active</p>
              <p className="text-sm font-medium text-brand-700">{driver.activeOrder}</p>
            </div>
          </div>
        )}

        {/* Documents */}
        <div className="rounded-xl border border-surface-100 p-3">
          <p className="mb-2.5 text-xs font-semibold text-surface-500">Documents</p>
          <div className="space-y-2">
            {[
              { key: 'license', label: 'Permis de conduire' },
              { key: 'insurance', label: 'Assurance' },
              { key: 'id', label: "Pièce d'identité" },
            ].map(({ key, label }) => {
              const status = driver.docs[key as keyof typeof driver.docs];
              const cfg = DOC_CONFIG[status];
              return (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-xs text-surface-600">{label}</span>
                  <span className={`flex items-center gap-1 text-xs font-semibold ${cfg.color}`}>
                    <DocBadge status={status} />
                    {cfg.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="border-t border-surface-100 p-4">
        {!docsOk && (
          <div className="mb-3 flex items-center gap-2 rounded-xl bg-yellow-50 px-3 py-2.5 text-xs text-yellow-700">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            Documents en attente de validation
          </div>
        )}
        <div className="flex gap-2">
          <button className="flex-1 rounded-xl border border-surface-200 py-2 text-xs font-semibold text-surface-600 hover:bg-surface-50 transition-colors">
            Suspendre
          </button>
          <button className="flex-1 rounded-xl bg-brand-50 py-2 text-xs font-semibold text-brand-700 hover:bg-brand-100 transition-colors">
            Contacter
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ── Driver card ───────────────────────────────────────────────────────────────

function DriverCard({ driver, selected, onClick }: { driver: Driver; selected: boolean; onClick: () => void }) {
  const statusCfg = STATUS_CONFIG[driver.status];
  const docsIssue = Object.values(driver.docs).some((d) => d !== 'valid');

  return (
    <motion.div layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
      <Card
        padding="md"
        onClick={onClick}
        className={`cursor-pointer transition-all hover:shadow-md ${selected ? 'ring-2 ring-brand-400 shadow-md' : ''}`}
      >
        <div className="flex items-start gap-3">
          <DriverAvatar initials={driver.avatar} status={driver.status} />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate font-semibold text-surface-900">{driver.name}</p>
                <p className="truncate text-xs text-surface-400">{driver.vehicle} · {driver.zone}</p>
              </div>
              <Badge variant={statusCfg.variant} dot>{statusCfg.label}</Badge>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2">
              <div className="text-center">
                <p className="text-sm font-bold text-surface-900">{driver.rating}</p>
                <p className="text-xs text-surface-400 flex items-center justify-center gap-0.5">
                  <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" /> Note
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-surface-900">{driver.deliveriesToday}</p>
                <p className="text-xs text-surface-400">Livraisons</p>
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-surface-900">{driver.earningsToday.toFixed(0)}€</p>
                <p className="text-xs text-surface-400">Gains</p>
              </div>
            </div>

            {driver.activeOrder && (
              <div className="mt-2.5 flex items-center gap-1.5 rounded-lg bg-brand-50 px-2.5 py-1.5">
                <Package className="h-3.5 w-3.5 text-brand-500" />
                <span className="text-xs font-semibold text-brand-700">{driver.activeOrder}</span>
              </div>
            )}

            {docsIssue && (
              <div className="mt-2 flex items-center gap-1 text-xs text-yellow-600">
                <AlertCircle className="h-3 w-3" />
                Document(s) à vérifier
              </div>
            )}
          </div>

          <div className="flex flex-col items-end gap-1 shrink-0">
            <div className="flex gap-1" title="Documents">
              <DocBadge status={driver.docs.license} />
              <DocBadge status={driver.docs.insurance} />
              <DocBadge status={driver.docs.id} />
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

type FilterStatus = 'all' | DriverStatus;

export default function DriversPage() {
  const [drivers, setDrivers] = useState<Driver[]>(SEED);
  const [selected, setSelected] = useState<Driver | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [showInvite, setShowInvite] = useState(false);
  const [showFilter, setShowFilter] = useState(false);

  // Real-time: flip driver status on socket events
  const { connected } = useRealtimeDrivers({
    restaurantId: 'r1',
    onDriverOnline: useCallback(({ driverId }: { driverId: string }) => {
      setDrivers((prev) =>
        prev.map((d) => d.id === driverId ? { ...d, status: 'online' as DriverStatus } : d)
      );
    }, []),
    onDriverOffline: useCallback(({ driverId }: { driverId: string }) => {
      setDrivers((prev) =>
        prev.map((d) => d.id === driverId ? { ...d, status: 'offline' as DriverStatus } : d)
      );
    }, []),
  });

  const filtered = useMemo(() => {
    return drivers.filter((d) => {
      const matchSearch = d.name.toLowerCase().includes(search.toLowerCase()) ||
        d.zone.toLowerCase().includes(search.toLowerCase());
      const matchFilter = filter === 'all' || d.status === filter;
      return matchSearch && matchFilter;
    });
  }, [drivers, search, filter]);

  const counts = useMemo(() => ({
    online: drivers.filter((d) => d.status === 'online').length,
    delivering: drivers.filter((d) => d.status === 'delivering').length,
    offline: drivers.filter((d) => d.status === 'offline').length,
    docIssues: drivers.filter((d) => Object.values(d.docs).some((s) => s !== 'valid')).length,
  }), [drivers]);

  const totalEarnings = useMemo(() => drivers.reduce((s, d) => s + d.earningsToday, 0), [drivers]);
  const totalDeliveries = useMemo(() => drivers.reduce((s, d) => s + d.deliveriesToday, 0), [drivers]);
  const avgRating = useMemo(() => {
    const active = drivers.filter((d) => d.deliveriesToday > 0);
    if (!active.length) return 0;
    return active.reduce((s, d) => s + d.rating, 0) / active.length;
  }, [drivers]);

  const mapDrivers = useMemo<DriverPosition[]>(
    () =>
      drivers.map((d) => ({
        id: d.id,
        name: d.name,
        phone: d.phone,
        status: d.status,
        activeOrder: d.activeOrder,
        lat: INITIAL_POSITIONS[d.id]?.lat ?? 48.8566,
        lng: INITIAL_POSITIONS[d.id]?.lng ?? 2.3522,
      })),
    [drivers]
  );

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Gestion des livreurs</h1>
          <div className="mt-1 flex items-center gap-2">
            <p className="text-sm text-surface-500">{drivers.length} livreurs enregistrés</p>
            <div className={`flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
              connected ? 'bg-green-50 text-green-700' : 'bg-surface-100 text-surface-500'
            }`}>
              {connected
                ? <><Wifi className="h-3 w-3" /> Temps réel actif</>
                : <><WifiOff className="h-3 w-3" /> Hors ligne</>}
            </div>
          </div>
        </div>
        <button
          onClick={() => setShowInvite(true)}
          className="flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 transition-colors shadow-sm"
        >
          <UserPlus className="h-4 w-4" />
          Inviter un livreur
        </button>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 xl:grid-cols-6">
        {[
          { label: 'En livraison', value: counts.delivering, icon: Bike, color: 'text-brand-600', bg: 'bg-brand-50' },
          { label: 'Disponibles', value: counts.online, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Hors ligne', value: counts.offline, icon: XCircle, color: 'text-surface-400', bg: 'bg-surface-100' },
          { label: 'Docs à vérifier', value: counts.docIssues, icon: AlertCircle, color: 'text-yellow-600', bg: 'bg-yellow-50' },
          { label: 'Livraisons (jour)', value: totalDeliveries, icon: Package, color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Gains totaux', value: `${totalEarnings.toFixed(0)}€`, icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50' },
        ].map(({ label, value, icon: Icon, color, bg }, i) => (
          <motion.div key={label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card padding="md" className="flex items-center gap-3">
              <div className={`rounded-xl p-2.5 ${bg}`}>
                <Icon className={`h-5 w-5 ${color}`} />
              </div>
              <div>
                <p className="text-base font-bold text-surface-900">{value}</p>
                <p className="text-xs text-surface-400">{label}</p>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-400" />
          <input
            type="text"
            placeholder="Rechercher un livreur ou une zone…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-surface-200 bg-white py-2.5 pl-9 pr-4 text-sm text-surface-900 placeholder-surface-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
          />
        </div>

        {/* Status filter */}
        <div className="relative">
          <button
            onClick={() => setShowFilter(!showFilter)}
            className="flex items-center gap-2 rounded-xl border border-surface-200 bg-white px-4 py-2.5 text-sm font-medium text-surface-700 hover:bg-surface-50 transition-colors"
          >
            <Filter className="h-4 w-4 text-surface-400" />
            {filter === 'all' ? 'Tous' : STATUS_CONFIG[filter].label}
            <ChevronDown className="h-3 w-3 text-surface-400" />
          </button>
          <AnimatePresence>
            {showFilter && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="absolute right-0 top-full z-20 mt-1.5 w-44 rounded-xl border border-surface-200 bg-white py-1 shadow-lg"
              >
                {(['all', 'online', 'delivering', 'offline'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => { setFilter(f); setShowFilter(false); }}
                    className={`w-full px-4 py-2 text-left text-sm transition-colors ${filter === f ? 'font-semibold text-brand-700 bg-brand-50' : 'text-surface-700 hover:bg-surface-50'}`}
                  >
                    {f === 'all' ? 'Tous les livreurs' : STATUS_CONFIG[f].label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Content: map + list (side by side on xl) */}
      <div className="flex flex-col xl:flex-row gap-6">
        {/* Live map panel */}
        <div className="xl:w-1/2 order-first xl:order-last">
          <div className="rounded-2xl overflow-hidden border border-surface-200 bg-white shadow-sm h-[500px]">
            <div className="flex items-center gap-2 border-b border-surface-100 px-4 py-3">
              <MapPin className="h-4 w-4 text-brand-500" />
              <span className="text-sm font-semibold text-surface-700">Carte des livreurs</span>
              <span className="ml-auto flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                Live
              </span>
            </div>
            <div className="h-[calc(100%-45px)]">
              <DriversMap drivers={mapDrivers} />
            </div>
          </div>
        </div>

        {/* Driver grid + detail panel */}
        <div className="xl:w-1/2 flex gap-6 min-w-0">
          <div className="flex-1 min-w-0">
            {filtered.length === 0 ? (
              <div className="flex h-40 items-center justify-center rounded-2xl border-2 border-dashed border-surface-200 text-sm text-surface-400">
                Aucun livreur trouvé
              </div>
            ) : (
              <div className={`grid gap-4 ${selected ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'}`}>
                <AnimatePresence mode="popLayout">
                  {filtered.map((driver) => (
                    <DriverCard
                      key={driver.id}
                      driver={driver}
                      selected={selected?.id === driver.id}
                      onClick={() => setSelected(selected?.id === driver.id ? null : driver)}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* Detail panel */}
          <AnimatePresence>
            {selected && (
              <DriverPanel
                key={selected.id}
                driver={selected}
                onClose={() => setSelected(null)}
              />
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Performance table */}
      <Card padding="none">
        <CardHeader className="border-b border-surface-100 px-6 py-5">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-brand-500" />
            <CardTitle>Performance du jour</CardTitle>
          </div>
          <p className="text-sm text-surface-400">Note moy. équipe : {avgRating.toFixed(1)}/5</p>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-100 text-left">
                {['Livreur', 'Statut', 'Livraisons', 'Gains', 'Note', 'Documents'].map((h) => (
                  <th key={h} className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-surface-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-50">
              {drivers.map((driver) => {
                const statusCfg = STATUS_CONFIG[driver.status];
                return (
                  <tr
                    key={driver.id}
                    onClick={() => setSelected(driver)}
                    className="cursor-pointer hover:bg-surface-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <DriverAvatar initials={driver.avatar} status={driver.status} />
                        <div>
                          <p className="font-medium text-surface-900">{driver.name}</p>
                          <p className="text-xs text-surface-400">{driver.zone}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={statusCfg.variant} dot>{statusCfg.label}</Badge>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-surface-900">{driver.deliveriesToday}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-surface-900">{driver.earningsToday.toFixed(2)}€</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400" />
                        <span className="font-semibold text-surface-900">{driver.rating}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <DocBadge status={driver.docs.license} />
                        <DocBadge status={driver.docs.insurance} />
                        <DocBadge status={driver.docs.id} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Invite modal */}
      <AnimatePresence>
        {showInvite && <InviteModal onClose={() => setShowInvite(false)} />}
      </AnimatePresence>
    </div>
  );
}
