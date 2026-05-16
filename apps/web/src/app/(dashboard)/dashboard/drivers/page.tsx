'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bike, Star, Phone, MapPin, Clock, TrendingUp,
  AlertCircle, Search,
  UserPlus, X, Edit2, Trash2, ChevronDown,
  Package, Euro, ShieldCheck, ShieldAlert, ShieldX,
  MoreVertical, Trophy, Zap, ChevronRight,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

// ── Types ─────────────────────────────────────────────────────────────────────

type DocStatus    = 'valid' | 'pending' | 'expired';
type DriverStatus = 'online' | 'offline' | 'delivering';
type StatTab      = 'today' | 'week' | 'month' | 'year';

interface Driver {
  id: string;
  name: string;
  avatar: string;
  phone: string;
  vehicle: string;
  zone: string;
  status: DriverStatus;
  rating: number;
  deliveriesToday: number;
  earningsToday: number;
  ordersPerWeek: number;
  avgDeliveryMin: number;
  activeOrder?: string;
  joinedAt: string;
  docs: { license: DocStatus; insurance: DocStatus; id: DocStatus };
}

// ── Config ────────────────────────────────────────────────────────────────────

const STATUS_CFG: Record<DriverStatus, { label: string; dot: string; variant: 'success' | 'warning' | 'info' }> = {
  online:    { label: 'Disponible',   dot: 'bg-green-500', variant: 'success' },
  delivering:{ label: 'En livraison', dot: 'bg-brand-500', variant: 'info'    },
  offline:   { label: 'Hors ligne',   dot: 'bg-gray-400',  variant: 'default' as any },
};

const DOC_CFG: Record<DocStatus, { icon: React.ElementType; color: string; label: string }> = {
  valid:   { icon: ShieldCheck, color: 'text-green-500', label: 'Valide'     },
  pending: { icon: ShieldAlert, color: 'text-amber-500', label: 'En attente' },
  expired: { icon: ShieldX,     color: 'text-red-500',   label: 'Expiré'    },
};

const STAT_TABS: { key: StatTab; label: string }[] = [
  { key: 'today', label: "Aujourd'hui" },
  { key: 'week',  label: 'Semaine'     },
  { key: 'month', label: 'Mois'        },
  { key: 'year',  label: 'Année'       },
];

// ── Seed data ─────────────────────────────────────────────────────────────────

const SEED: Driver[] = [
  {
    id: 'd1', name: 'Karim Benali',   avatar: 'KB', phone: '+33 6 12 34 56 78',
    vehicle: 'Scooter · CB500', zone: 'Centre-ville',
    status: 'delivering', rating: 4.9, deliveriesToday: 12, earningsToday: 87.50,
    ordersPerWeek: 68, avgDeliveryMin: 19,
    activeOrder: 'ORD-8821', joinedAt: '2024-03',
    docs: { license: 'valid', insurance: 'valid', id: 'valid' },
  },
  {
    id: 'd2', name: 'Sofia Medina',   avatar: 'SM', phone: '+33 6 98 76 54 32',
    vehicle: 'Vélo électrique', zone: 'Bastille – Marais',
    status: 'online', rating: 4.7, deliveriesToday: 8, earningsToday: 54.20,
    ordersPerWeek: 52, avgDeliveryMin: 22,
    joinedAt: '2024-07',
    docs: { license: 'valid', insurance: 'pending', id: 'valid' },
  },
  {
    id: 'd3', name: 'Lucas Fontaine', avatar: 'LF', phone: '+33 6 45 67 89 01',
    vehicle: 'Moto · Yamaha MT-07', zone: 'La Défense',
    status: 'delivering', rating: 4.5, deliveriesToday: 9, earningsToday: 68.00,
    ordersPerWeek: 59, avgDeliveryMin: 16,
    activeOrder: 'ORD-8819', joinedAt: '2024-05',
    docs: { license: 'valid', insurance: 'valid', id: 'expired' },
  },
  {
    id: 'd4', name: 'Amina Touati',   avatar: 'AT', phone: '+33 6 33 22 11 00',
    vehicle: 'Scooter · Honda PCX', zone: 'Saint-Denis',
    status: 'online', rating: 4.8, deliveriesToday: 6, earningsToday: 43.80,
    ordersPerWeek: 45, avgDeliveryMin: 24,
    joinedAt: '2024-09',
    docs: { license: 'valid', insurance: 'valid', id: 'valid' },
  },
  {
    id: 'd5', name: 'Thomas Renard',  avatar: 'TR', phone: '+33 6 77 88 99 00',
    vehicle: 'Vélo cargo', zone: 'Montmartre',
    status: 'offline', rating: 4.3, deliveriesToday: 0, earningsToday: 0,
    ordersPerWeek: 31, avgDeliveryMin: 28,
    joinedAt: '2023-11',
    docs: { license: 'pending', insurance: 'valid', id: 'valid' },
  },
  {
    id: 'd6', name: 'Léa Dupont',     avatar: 'LD', phone: '+33 6 55 44 33 22',
    vehicle: 'Scooter · Vespa GTS', zone: 'Oberkampf',
    status: 'offline', rating: 4.6, deliveriesToday: 3, earningsToday: 22.10,
    ordersPerWeek: 39, avgDeliveryMin: 21,
    joinedAt: '2024-02',
    docs: { license: 'valid', insurance: 'expired', id: 'valid' },
  },
];

// Fake per-tab stats (multiplied from today's data)
const TAB_MULTIPLIERS: Record<StatTab, { del: number; rev: number; time: number }> = {
  today: { del: 1,   rev: 1,   time: 1   },
  week:  { del: 6,   rev: 5.8, time: 1.05},
  month: { del: 24,  rev: 22,  time: 1.1 },
  year:  { del: 280, rev: 260, time: 1.02},
};

function getTabStats(driver: Driver, tab: StatTab) {
  const m = TAB_MULTIPLIERS[tab];
  return {
    deliveries: Math.round(driver.deliveriesToday * m.del) || (tab === 'today' ? 0 : Math.round(m.del * 2)),
    revenue:    parseFloat((driver.earningsToday * m.rev).toFixed(2)) || 0,
    avgTime:    Math.round(driver.avgDeliveryMin * m.time),
  };
}

// Fake active deliveries per driver
const ACTIVE_DELIVERIES: Record<string, { id: string; customer: string; address: string; eta: string }[]> = {
  d1: [
    { id: 'ORD-8821', customer: 'Marie L.',   address: '12 rue de Rivoli',     eta: '4 min'  },
    { id: 'ORD-8815', customer: 'Pierre D.',   address: '8 bd Haussmann',       eta: '12 min' },
  ],
  d2: [
    { id: 'ORD-8822', customer: 'Sophie M.',   address: '34 rue des Archives',  eta: '7 min'  },
  ],
  d3: [
    { id: 'ORD-8819', customer: 'Julien K.',   address: '78 av du Trône',       eta: '6 min'  },
    { id: 'ORD-8810', customer: 'Clara B.',    address: '15 rue Oberkampf',     eta: '14 min' },
    { id: 'ORD-8808', customer: 'Noah W.',     address: '22 rue de la Roquette',eta: '18 min' },
  ],
  d4: [],
  d5: [],
  d6: [
    { id: 'ORD-8800', customer: 'Emma D.',     address: '5 rue Ménilmontant',   eta: '9 min'  },
  ],
};

// ── Add/Edit modal ────────────────────────────────────────────────────────────

interface DriverForm {
  name: string; phone: string; vehicle: string; zone: string;
  license?: string; insurance?: string; idDoc?: string;
}

function DriverModal({
  driver, onClose, onSave,
}: {
  driver?: Driver;
  onClose: () => void;
  onSave: (f: DriverForm) => void;
}) {
  const [f, setF] = useState<DriverForm>({
    name:      driver?.name    ?? '',
    phone:     driver?.phone   ?? '',
    vehicle:   driver?.vehicle ?? '',
    zone:      driver?.zone    ?? '',
    license:   '',
    insurance: '',
    idDoc:     '',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl overflow-y-auto max-h-[90vh]"
      >
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">{driver ? 'Modifier le livreur' : 'Ajouter un livreur'}</h3>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100"><X className="h-4 w-4" /></button>
        </div>
        <div className="space-y-3">
          {([ ['name','Nom complet','Jean Dupont'], ['phone','Téléphone','+33 6 12 34 56 78'], ['vehicle','Véhicule','Scooter · Honda PCX'], ['zone','Zone','Centre-ville'] ] as const).map(([key, label, ph]) => (
            <div key={key}>
              <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
              <input
                value={f[key as keyof DriverForm] ?? ''}
                onChange={e => setF(prev => ({ ...prev, [key]: e.target.value }))}
                placeholder={ph}
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>
          ))}
          {/* Document fields — all optional */}
          <div className="pt-2 border-t border-gray-100">
            <p className="mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Documents (optionnel)</p>
            {([ ['license','Permis de conduire'], ['insurance','Assurance'], ['idDoc','Pièce d\'identité'] ] as const).map(([key, label]) => (
              <div key={key} className="mb-2">
                <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
                <input
                  value={f[key as keyof DriverForm] ?? ''}
                  onChange={e => setF(prev => ({ ...prev, [key]: e.target.value }))}
                  placeholder="Numéro ou référence (optionnel)"
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
              </div>
            ))}
          </div>
        </div>
        <div className="mt-5 flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={onClose}>Annuler</Button>
          <Button className="flex-1" onClick={() => onSave(f)} disabled={!f.name || !f.phone}>
            {driver ? 'Enregistrer' : 'Ajouter'}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Driver Detail Modal ───────────────────────────────────────────────────────

function DriverDetailModal({ driver, onClose }: { driver: Driver; onClose: () => void }) {
  const [tab, setTab] = useState<StatTab>('today');
  const ts = getTabStats(driver, tab);
  const deliveries = ACTIVE_DELIVERIES[driver.id] ?? [];
  const scfg = STATUS_CFG[driver.status];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4">
      <motion.div
        initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }}
        className="w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl bg-white shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center gap-4 border-b border-gray-100 px-6 py-5">
          <div className="relative">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 text-lg font-bold text-brand-700">
              {driver.avatar}
            </div>
            <div className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white ${scfg.dot}`} />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-gray-900">{driver.name}</h2>
            <p className="text-sm text-gray-500">{driver.vehicle} · {driver.zone}</p>
            <div className="mt-1 flex items-center gap-1.5">
              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                driver.status === 'online'     ? 'bg-green-50 text-green-700' :
                driver.status === 'delivering' ? 'bg-brand-50 text-brand-700' : 'bg-gray-100 text-gray-600'
              }`}>
                <div className={`h-1.5 w-1.5 rounded-full ${scfg.dot}`} />
                {scfg.label}
              </span>
              <span className="text-xs text-gray-400">Depuis {driver.joinedAt}</span>
            </div>
          </div>
          <button onClick={onClose} className="rounded-xl p-2 text-gray-400 hover:bg-gray-100"><X className="h-5 w-5" /></button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
          {/* Contact info */}
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Phone className="h-4 w-4 text-gray-400" />
            <span>{driver.phone}</span>
            <span className="mx-2 text-gray-200">|</span>
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span className="font-semibold">{driver.rating}</span>
          </div>

          {/* Stats tabs */}
          <div>
            <div className="mb-4 flex gap-1 rounded-xl border border-gray-200 bg-gray-50 p-1">
              {STAT_TABS.map(t => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition-all ${
                    tab === t.key ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Livraisons', value: String(ts.deliveries), icon: Package, color: 'text-brand-600', bg: 'bg-brand-50' },
                { label: 'Revenus',    value: `${ts.revenue.toFixed(0)}€`, icon: Euro,    color: 'text-green-600', bg: 'bg-green-50' },
                { label: 'Temps moy.', value: `${ts.avgTime} min`,  icon: Clock,   color: 'text-blue-600',  bg: 'bg-blue-50'  },
              ].map(s => {
                const Icon = s.icon;
                return (
                  <div key={s.label} className={`rounded-xl ${s.bg} p-3 text-center`}>
                    <Icon className={`mx-auto mb-1 h-4 w-4 ${s.color}`} />
                    <p className="text-lg font-bold text-gray-900">{s.value}</p>
                    <p className="text-xs text-gray-500">{s.label}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Active deliveries */}
          <div>
            <h3 className="mb-2 text-sm font-semibold text-gray-700 flex items-center gap-1.5">
              <Bike className="h-4 w-4 text-brand-500" />
              Livraisons actives
              {deliveries.length > 0 && (
                <span className="ml-1 rounded-full bg-brand-100 px-1.5 py-0.5 text-xs font-bold text-brand-700">
                  {deliveries.length}
                </span>
              )}
            </h3>
            {deliveries.length === 0 ? (
              <p className="rounded-xl bg-gray-50 py-4 text-center text-sm text-gray-400">Aucune livraison active</p>
            ) : (
              <div className="space-y-2">
                {deliveries.map(d => (
                  <div key={d.id} className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-3 py-2.5">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{d.id}</p>
                      <p className="text-xs text-gray-500">{d.customer} · {d.address}</p>
                    </div>
                    <span className="rounded-full bg-brand-100 px-2.5 py-1 text-xs font-bold text-brand-700">{d.eta}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Documents */}
          <div>
            <h3 className="mb-2 text-sm font-semibold text-gray-700">Documents</h3>
            <div className="space-y-1.5">
              {([ ['license','Permis de conduire'], ['insurance','Assurance'], ['id','Pièce d\'identité'] ] as const).map(([key, label]) => {
                const status = driver.docs[key as keyof typeof driver.docs];
                const dcfg = DOC_CFG[status];
                const Icon = dcfg.icon;
                return (
                  <div key={key} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                    <span className="text-sm text-gray-600">{label}</span>
                    <span className={`flex items-center gap-1 text-xs font-semibold ${dcfg.color}`}>
                      <Icon className="h-3.5 w-3.5" />{dcfg.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function DriversPage() {
  const [drivers, setDrivers]     = useState<Driver[]>(SEED);
  const [search, setSearch]       = useState('');
  const [statusFilter, setStatus] = useState<DriverStatus | 'all'>('all');
  const [modal, setModal]         = useState<'add' | Driver | null>(null);
  const [detailDriver, setDetail] = useState<Driver | null>(null);
  const [deleteId, setDeleteId]   = useState<string | null>(null);
  const [expanded, setExpanded]   = useState<string | null>(null);
  const [menuOpen, setMenuOpen]   = useState<string | null>(null);

  const filtered = useMemo(() => drivers.filter(d => {
    if (statusFilter !== 'all' && d.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return d.name.toLowerCase().includes(q) || d.zone.toLowerCase().includes(q) || d.vehicle.toLowerCase().includes(q);
    }
    return true;
  }), [drivers, search, statusFilter]);

  const stats = {
    total:      drivers.length,
    online:     drivers.filter(d => d.status !== 'offline').length,
    delivering: drivers.filter(d => d.status === 'delivering').length,
    revenue:    drivers.reduce((s, d) => s + d.earningsToday, 0),
    deliveries: drivers.reduce((s, d) => s + d.deliveriesToday, 0),
  };

  // KPI champions
  const topPerformer = drivers.reduce((a, b) => b.ordersPerWeek > a.ordersPerWeek ? b : a, drivers[0]);
  const fastestDriver = drivers.reduce((a, b) => b.avgDeliveryMin < a.avgDeliveryMin ? b : a, drivers[0]);

  function addDriver(f: DriverForm) {
    const initials = f.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
    setDrivers(prev => [...prev, {
      id: `d${Date.now()}`, ...f, avatar: initials,
      status: 'offline', rating: 5.0, deliveriesToday: 0, earningsToday: 0,
      ordersPerWeek: 0, avgDeliveryMin: 30,
      joinedAt: new Date().toISOString().slice(0, 7),
      docs: { license: 'pending', insurance: 'pending', id: 'pending' },
    }]);
    setModal(null);
  }

  function editDriver(id: string, f: DriverForm) {
    setDrivers(prev => prev.map(d => d.id === id ? { ...d, ...f } : d));
    setModal(null);
  }

  function cycleStatus(id: string) {
    const cycle: DriverStatus[] = ['offline', 'online', 'delivering'];
    setDrivers(prev => prev.map(d => d.id === id
      ? { ...d, status: cycle[(cycle.indexOf(d.status) + 1) % cycle.length] }
      : d));
    setMenuOpen(null);
  }

  function doDelete() {
    if (deleteId) setDrivers(prev => prev.filter(d => d.id !== deleteId));
    setDeleteId(null);
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Livreurs</h1>
          <p className="mt-1 text-sm text-gray-500">
            {stats.online} actifs · {stats.delivering} en livraison · {stats.total} total
          </p>
        </div>
        <Button onClick={() => setModal('add')} icon={<UserPlus className="h-4 w-4" />}>
          Ajouter un livreur
        </Button>
      </div>

      {/* Champion KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Top performer */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-500 to-green-600 p-5 text-white shadow-lg">
          <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-white/10" />
          <div className="relative flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/20 text-lg font-black backdrop-blur-sm">
              {topPerformer.avatar}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <Trophy className="h-4 w-4 text-yellow-300" />
                <span className="text-xs font-semibold text-white/80 uppercase tracking-wide">Livreur le plus performant</span>
              </div>
              <p className="text-lg font-bold truncate">{topPerformer.name}</p>
              <p className="text-sm text-white/80">{topPerformer.zone}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-2xl font-black">{topPerformer.ordersPerWeek}</p>
              <p className="text-xs text-white/70">cmd/semaine</p>
            </div>
          </div>
        </div>

        {/* Fastest driver */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 p-5 text-white shadow-lg">
          <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-white/10" />
          <div className="relative flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/20 text-lg font-black backdrop-blur-sm">
              {fastestDriver.avatar}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <Zap className="h-4 w-4 text-yellow-300" />
                <span className="text-xs font-semibold text-white/80 uppercase tracking-wide">Livreur le plus rapide</span>
              </div>
              <p className="text-lg font-bold truncate">{fastestDriver.name}</p>
              <p className="text-sm text-white/80">{fastestDriver.zone}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-2xl font-black">{fastestDriver.avgDeliveryMin}</p>
              <p className="text-xs text-white/70">min moy.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: 'Actifs maintenant', value: stats.online,    icon: Bike,       bg: 'bg-green-50',  color: 'text-green-600' },
          { label: 'En livraison',       value: stats.delivering,icon: Package,    bg: 'bg-brand-50',  color: 'text-brand-600' },
          { label: 'Livraisons du jour', value: stats.deliveries,icon: TrendingUp, bg: 'bg-blue-50',   color: 'text-blue-600'  },
          { label: 'CA livreurs (jour)', value: `${stats.revenue.toFixed(0)}€`, icon: Euro, bg: 'bg-purple-50', color: 'text-purple-600' },
        ].map(s => {
          const Icon = s.icon;
          return (
            <Card key={s.label} padding="md" className="flex items-center gap-3">
              <div className={`rounded-xl p-2.5 ${s.bg}`}>
                <Icon className={`h-5 w-5 ${s.color}`} />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900">{s.value}</p>
                <p className="text-xs text-gray-500">{s.label}</p>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Nom, zone, véhicule..."
            className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-9 pr-4 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          />
        </div>
        <div className="flex gap-1 rounded-xl border border-gray-200 bg-white p-1">
          {(['all', 'online', 'delivering', 'offline'] as const).map(s => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${statusFilter === s ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              {s === 'all' ? 'Tous' : STATUS_CFG[s].label}
            </button>
          ))}
        </div>
      </div>

      {/* Driver cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <AnimatePresence>
          {filtered.map(driver => {
            const scfg = STATUS_CFG[driver.status];
            const isOpen = expanded === driver.id;
            const hasDocIssue = Object.values(driver.docs).some(v => v !== 'valid');

            return (
              <motion.div
                key={driver.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
              >
                <Card padding="none" className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow">
                  <div className="p-4">
                    {/* Top row */}
                    <div className="flex items-start justify-between">
                      <button
                        className="flex items-center gap-3 flex-1 text-left"
                        onClick={() => setDetail(driver)}
                      >
                        {/* Avatar */}
                        <div className="relative">
                          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-100 text-sm font-bold text-gray-700">
                            {driver.avatar}
                          </div>
                          <div className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white ${scfg.dot}`} />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <p className="font-semibold text-gray-900">{driver.name}</p>
                            {hasDocIssue && <AlertCircle className="h-3.5 w-3.5 text-amber-500" />}
                          </div>
                          <p className="text-xs text-gray-500">{driver.vehicle}</p>
                        </div>
                      </button>

                      {/* View detail link */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setDetail(driver)}
                          className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-brand-600"
                          title="Voir le détail"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </button>
                        {/* Menu */}
                        <div className="relative">
                          <button
                            onClick={() => setMenuOpen(menuOpen === driver.id ? null : driver.id)}
                            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </button>
                          {menuOpen === driver.id && (
                            <div className="absolute right-0 top-7 z-10 w-40 rounded-xl border border-gray-100 bg-white py-1 shadow-lg">
                              <button onClick={() => { setDetail(driver); setMenuOpen(null); }} className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                                <ChevronRight className="h-3.5 w-3.5" /> Voir le détail
                              </button>
                              <button onClick={() => { setModal(driver); setMenuOpen(null); }} className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                                <Edit2 className="h-3.5 w-3.5" /> Modifier
                              </button>
                              <button onClick={() => cycleStatus(driver.id)} className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                                <Clock className="h-3.5 w-3.5" /> Changer statut
                              </button>
                              <button onClick={() => { setDeleteId(driver.id); setMenuOpen(null); }} className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50">
                                <Trash2 className="h-3.5 w-3.5" /> Supprimer
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Status badge + zone */}
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                        driver.status === 'online'     ? 'bg-green-50 text-green-700' :
                        driver.status === 'delivering' ? 'bg-brand-50 text-brand-700' :
                                                         'bg-gray-100 text-gray-600'
                      }`}>
                        <div className={`h-1.5 w-1.5 rounded-full ${scfg.dot}`} />
                        {scfg.label}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        <MapPin className="h-3 w-3" />{driver.zone}
                      </span>
                      {driver.activeOrder && (
                        <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                          {driver.activeOrder}
                        </span>
                      )}
                    </div>

                    {/* KPIs */}
                    <div className="mt-3 grid grid-cols-3 divide-x divide-gray-100 rounded-xl border border-gray-100 bg-gray-50">
                      <div className="px-3 py-2 text-center">
                        <p className="text-sm font-bold text-gray-900">{driver.deliveriesToday}</p>
                        <p className="text-xs text-gray-400">Livraisons</p>
                      </div>
                      <div className="px-3 py-2 text-center">
                        <p className="text-sm font-bold text-gray-900">{driver.earningsToday.toFixed(0)}€</p>
                        <p className="text-xs text-gray-400">Gains</p>
                      </div>
                      <div className="px-3 py-2 text-center">
                        <p className="flex items-center justify-center gap-0.5 text-sm font-bold text-gray-900">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />{driver.rating}
                        </p>
                        <p className="text-xs text-gray-400">Note</p>
                      </div>
                    </div>

                    {/* Expand toggle */}
                    <button
                      onClick={() => setExpanded(isOpen ? null : driver.id)}
                      className="mt-3 flex w-full items-center justify-center gap-1 rounded-lg py-1 text-xs text-gray-400 hover:bg-gray-50 hover:text-gray-600"
                    >
                      Documents <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                    </button>
                  </div>

                  {/* Documents panel */}
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden border-t border-gray-100 bg-gray-50 px-4 py-3"
                      >
                        <div className="space-y-2">
                          {([ ['license','Permis de conduire'], ['insurance','Assurance'], ['id','Pièce d\'identité'] ] as const).map(([key, label]) => {
                            const status = driver.docs[key as keyof typeof driver.docs];
                            const dcfg = DOC_CFG[status];
                            const Icon = dcfg.icon;
                            return (
                              <div key={key} className="flex items-center justify-between text-sm">
                                <span className="text-gray-600">{label}</span>
                                <span className={`flex items-center gap-1 font-medium ${dcfg.color}`}>
                                  <Icon className="h-3.5 w-3.5" />{dcfg.label}
                                </span>
                              </div>
                            );
                          })}
                          <p className="pt-1 text-xs text-gray-400">Depuis {driver.joinedAt} · {driver.phone}</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {filtered.length === 0 && (
        <div className="py-16 text-center text-gray-400">Aucun livreur trouvé</div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {modal && (
          <DriverModal
            driver={modal === 'add' ? undefined : modal}
            onClose={() => setModal(null)}
            onSave={f => modal === 'add' ? addDriver(f) : editDriver((modal as Driver).id, f)}
          />
        )}
        {detailDriver && (
          <DriverDetailModal driver={detailDriver} onClose={() => setDetail(null)} />
        )}
        {deleteId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
            >
              <h3 className="mb-2 font-bold text-gray-900">Supprimer ce livreur ?</h3>
              <p className="mb-5 text-sm text-gray-500">Cette action est irréversible.</p>
              <div className="flex gap-3">
                <Button variant="secondary" className="flex-1" onClick={() => setDeleteId(null)}>Annuler</Button>
                <Button variant="danger" className="flex-1" onClick={doDelete}>Supprimer</Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
