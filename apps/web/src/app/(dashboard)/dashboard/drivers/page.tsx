'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bike, Star, Phone, MapPin, Clock, TrendingUp,
  CheckCircle, AlertCircle, XCircle, Search,
  UserPlus, X, Edit2, Trash2, ChevronDown,
  Package, Euro, ShieldCheck, ShieldAlert, ShieldX,
  MoreVertical,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

// ── Types ─────────────────────────────────────────────────────────────────────

type DocStatus    = 'valid' | 'pending' | 'expired';
type DriverStatus = 'online' | 'offline' | 'delivering';

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
  activeOrder?: string;
  joinedAt: string;
  docs: { license: DocStatus; insurance: DocStatus; id: DocStatus };
}

// ── Config ────────────────────────────────────────────────────────────────────

const STATUS_CFG: Record<DriverStatus, { label: string; dot: string; variant: 'success' | 'warning' | 'info' }> = {
  online:    { label: 'Disponible',  dot: 'bg-green-500',  variant: 'success' },
  delivering:{ label: 'En livraison',dot: 'bg-brand-500',  variant: 'info'    },
  offline:   { label: 'Hors ligne',  dot: 'bg-gray-400',   variant: 'default' as any },
};

const DOC_CFG: Record<DocStatus, { icon: React.ElementType; color: string; label: string }> = {
  valid:   { icon: ShieldCheck, color: 'text-green-500', label: 'Valide'    },
  pending: { icon: ShieldAlert, color: 'text-amber-500', label: 'En attente'},
  expired: { icon: ShieldX,     color: 'text-red-500',   label: 'Expiré'   },
};

// ── Seed data ─────────────────────────────────────────────────────────────────

const SEED: Driver[] = [
  {
    id: 'd1', name: 'Karim Benali',   avatar: 'KB', phone: '+33 6 12 34 56 78',
    vehicle: 'Scooter · CB500', zone: 'Centre-ville',
    status: 'delivering', rating: 4.9, deliveriesToday: 12, earningsToday: 87.50,
    activeOrder: 'ORD-8821', joinedAt: '2024-03',
    docs: { license: 'valid', insurance: 'valid', id: 'valid' },
  },
  {
    id: 'd2', name: 'Sofia Medina',   avatar: 'SM', phone: '+33 6 98 76 54 32',
    vehicle: 'Vélo électrique', zone: 'Bastille – Marais',
    status: 'online', rating: 4.7, deliveriesToday: 8, earningsToday: 54.20,
    joinedAt: '2024-07',
    docs: { license: 'valid', insurance: 'pending', id: 'valid' },
  },
  {
    id: 'd3', name: 'Lucas Fontaine', avatar: 'LF', phone: '+33 6 45 67 89 01',
    vehicle: 'Moto · Yamaha MT-07', zone: 'La Défense',
    status: 'delivering', rating: 4.5, deliveriesToday: 9, earningsToday: 68.00,
    activeOrder: 'ORD-8819', joinedAt: '2024-05',
    docs: { license: 'valid', insurance: 'valid', id: 'expired' },
  },
  {
    id: 'd4', name: 'Amina Touati',   avatar: 'AT', phone: '+33 6 33 22 11 00',
    vehicle: 'Scooter · Honda PCX', zone: 'Saint-Denis',
    status: 'online', rating: 4.8, deliveriesToday: 6, earningsToday: 43.80,
    joinedAt: '2024-09',
    docs: { license: 'valid', insurance: 'valid', id: 'valid' },
  },
  {
    id: 'd5', name: 'Thomas Renard',  avatar: 'TR', phone: '+33 6 77 88 99 00',
    vehicle: 'Vélo cargo', zone: 'Montmartre',
    status: 'offline', rating: 4.3, deliveriesToday: 0, earningsToday: 0,
    joinedAt: '2023-11',
    docs: { license: 'pending', insurance: 'valid', id: 'valid' },
  },
  {
    id: 'd6', name: 'Léa Dupont',     avatar: 'LD', phone: '+33 6 55 44 33 22',
    vehicle: 'Scooter · Vespa GTS', zone: 'Oberkampf',
    status: 'offline', rating: 4.6, deliveriesToday: 3, earningsToday: 22.10,
    joinedAt: '2024-02',
    docs: { license: 'valid', insurance: 'expired', id: 'valid' },
  },
];

// ── Add/Edit modal ────────────────────────────────────────────────────────────

interface DriverForm {
  name: string; phone: string; vehicle: string; zone: string;
}

function DriverModal({
  driver, onClose, onSave,
}: {
  driver?: Driver;
  onClose: () => void;
  onSave: (f: DriverForm) => void;
}) {
  const [f, setF] = useState<DriverForm>({
    name:    driver?.name    ?? '',
    phone:   driver?.phone   ?? '',
    vehicle: driver?.vehicle ?? '',
    zone:    driver?.zone    ?? '',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
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
                value={f[key as keyof DriverForm]}
                onChange={e => setF(prev => ({ ...prev, [key]: e.target.value }))}
                placeholder={ph}
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>
          ))}
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

// ── Page ──────────────────────────────────────────────────────────────────────

export default function DriversPage() {
  const [drivers, setDrivers]       = useState<Driver[]>(SEED);
  const [search, setSearch]         = useState('');
  const [statusFilter, setStatus]   = useState<DriverStatus | 'all'>('all');
  const [modal, setModal]           = useState<'add' | Driver | null>(null);
  const [deleteId, setDeleteId]     = useState<string | null>(null);
  const [expanded, setExpanded]     = useState<string | null>(null);
  const [menuOpen, setMenuOpen]     = useState<string | null>(null);

  const filtered = useMemo(() => drivers.filter(d => {
    if (statusFilter !== 'all' && d.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return d.name.toLowerCase().includes(q) || d.zone.toLowerCase().includes(q) || d.vehicle.toLowerCase().includes(q);
    }
    return true;
  }), [drivers, search, statusFilter]);

  const stats = {
    total:     drivers.length,
    online:    drivers.filter(d => d.status !== 'offline').length,
    delivering:drivers.filter(d => d.status === 'delivering').length,
    revenue:   drivers.reduce((s, d) => s + d.earningsToday, 0),
    deliveries:drivers.reduce((s, d) => s + d.deliveriesToday, 0),
  };

  function addDriver(f: DriverForm) {
    const initials = f.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
    setDrivers(prev => [...prev, {
      id: `d${Date.now()}`, ...f, avatar: initials,
      status: 'offline', rating: 5.0, deliveriesToday: 0, earningsToday: 0,
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
                <Card padding="none" className="overflow-hidden">
                  <div className="p-4">
                    {/* Top row */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
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
                      </div>

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
