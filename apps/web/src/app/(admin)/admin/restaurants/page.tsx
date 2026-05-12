'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, MoreVertical, Store, MapPin,
  TrendingUp, ShoppingBag, Euro,
  Eye, Ban, RefreshCw, Mail, X,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

type Status = 'active' | 'trial' | 'suspended' | 'all';
type Plan = 'Starter' | 'Pro' | 'Enterprise';

interface Restaurant {
  id: string;
  name: string;
  city: string;
  owner: string;
  email: string;
  plan: Plan;
  status: 'active' | 'trial' | 'suspended';
  mrr: number;
  orders: number;
  revenue: number;
  joined: string;
  lastOrder: string;
}

const RESTAURANTS: Restaurant[] = [
  { id: 'r1', name: 'Le Gourmet Parisien', city: 'Paris 7e', owner: 'Marc Leblanc', email: 'marc@legourmet.fr', plan: 'Pro', status: 'active', mrr: 149, orders: 312, revenue: 8420, joined: '02/05/2026', lastOrder: 'il y a 2h' },
  { id: 'r2', name: 'Bella Italia', city: 'Lyon 2e', owner: 'Sofia Russo', email: 'sofia@bella.it', plan: 'Starter', status: 'active', mrr: 49, orders: 278, revenue: 5180, joined: '28/04/2026', lastOrder: 'il y a 4h' },
  { id: 'r3', name: 'Sushi Club Lyon', city: 'Lyon 6e', owner: 'Kenji Tanaka', email: 'kenji@sushiclub.fr', plan: 'Pro', status: 'active', mrr: 149, orders: 241, revenue: 7230, joined: '15/04/2026', lastOrder: 'il y a 1h' },
  { id: 'r4', name: 'Burger Factory', city: 'Bordeaux', owner: 'Alex Martin', email: 'alex@burgerfactory.fr', plan: 'Pro', status: 'trial', mrr: 0, orders: 198, revenue: 3940, joined: '10/05/2026', lastOrder: 'il y a 30min' },
  { id: 'r5', name: 'La Crêperie Bretonne', city: 'Rennes', owner: 'Anne Moreau', email: 'anne@creperie.fr', plan: 'Starter', status: 'suspended', mrr: 49, orders: 0, revenue: 0, joined: '03/03/2026', lastOrder: 'il y a 2 sem.' },
  { id: 'r6', name: 'Taco Loco', city: 'Marseille', owner: 'Carlos Diaz', email: 'carlos@tacoloco.fr', plan: 'Starter', status: 'active', mrr: 49, orders: 167, revenue: 2810, joined: '22/04/2026', lastOrder: 'il y a 6h' },
  { id: 'r7', name: 'Pho Saigon', city: 'Paris 13e', owner: 'Linh Nguyen', email: 'linh@phosaigon.fr', plan: 'Pro', status: 'active', mrr: 149, orders: 145, revenue: 4120, joined: '08/04/2026', lastOrder: 'il y a 3h' },
  { id: 'r8', name: 'Le Steak House', city: 'Toulouse', owner: 'Pierre Duval', email: 'pierre@steakhouse.fr', plan: 'Enterprise', status: 'active', mrr: 299, orders: 389, revenue: 14200, joined: '12/01/2026', lastOrder: 'il y a 1h' },
];

const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'success' | 'warning' | 'danger' }> = {
  active: { label: 'Actif', variant: 'success' },
  trial: { label: 'Essai gratuit', variant: 'warning' },
  suspended: { label: 'Suspendu', variant: 'danger' },
};

const PLAN_COLORS: Record<Plan, string> = {
  Starter: 'bg-surface-100 text-surface-600',
  Pro: 'bg-brand-100 text-brand-700',
  Enterprise: 'bg-purple-100 text-purple-700',
};

export default function AdminRestaurantsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<Status>('all');
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);

  const filtered = RESTAURANTS.filter((r) => {
    const matchSearch = r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.city.toLowerCase().includes(search.toLowerCase()) ||
      r.owner.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const detail = RESTAURANTS.find((r) => r.id === detailId);

  const totalMRR = RESTAURANTS.filter((r) => r.status === 'active').reduce((s, r) => s + r.mrr, 0);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Restaurants</h1>
          <p className="mt-1 text-sm text-surface-500">{RESTAURANTS.length} établissements · MRR total : {totalMRR} €/mois</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un restaurant, ville, propriétaire…"
            className="w-full rounded-xl border border-surface-200 bg-white py-2.5 pl-9 pr-4 text-sm text-surface-900 placeholder-surface-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto">
          {(['all', 'active', 'trial', 'suspended'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`flex-shrink-0 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                statusFilter === s
                  ? 'bg-surface-900 text-white'
                  : 'bg-white border border-surface-200 text-surface-600 hover:bg-surface-50'
              }`}
            >
              {s === 'all' ? 'Tous' : STATUS_CONFIG[s].label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-surface-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-100 bg-surface-50">
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-surface-400">Restaurant</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-surface-400">Plan</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-surface-400">Statut</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-surface-400">MRR</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-surface-400">Commandes</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-surface-400">CA total</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-surface-400">Dernière cmd</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {filtered.map((r) => {
                const sc = STATUS_CONFIG[r.status];
                return (
                  <tr key={r.id} className="hover:bg-surface-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-100 text-sm font-bold text-brand-700">
                          {r.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-surface-900">{r.name}</p>
                          <div className="flex items-center gap-1 text-xs text-surface-400">
                            <MapPin className="h-3 w-3" />
                            {r.city}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${PLAN_COLORS[r.plan]}`}>
                        {r.plan}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <Badge variant={sc.variant} size="sm">{sc.label}</Badge>
                    </td>
                    <td className="px-4 py-4 text-right font-medium text-surface-900">
                      {r.mrr > 0 ? `${r.mrr} €` : '—'}
                    </td>
                    <td className="px-4 py-4 text-right text-surface-600">{r.orders}</td>
                    <td className="px-4 py-4 text-right font-medium text-surface-900">
                      {r.revenue > 0 ? `${r.revenue.toLocaleString('fr-FR')} €` : '—'}
                    </td>
                    <td className="px-4 py-4 text-xs text-surface-400">{r.lastOrder}</td>
                    <td className="px-4 py-4">
                      <div className="relative">
                        <button
                          onClick={() => setMenuOpenId(menuOpenId === r.id ? null : r.id)}
                          className="rounded-lg p-1.5 text-surface-400 hover:bg-surface-100"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>
                        <AnimatePresence>
                          {menuOpenId === r.id && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                              transition={{ duration: 0.1 }}
                              className="absolute right-0 top-full z-10 mt-1 w-48 overflow-hidden rounded-xl border border-surface-200 bg-white shadow-glass-lg"
                            >
                              <button
                                onClick={() => { setDetailId(r.id); setMenuOpenId(null); }}
                                className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-surface-700 hover:bg-surface-50"
                              >
                                <Eye className="h-4 w-4 text-surface-400" />
                                Voir les détails
                              </button>
                              <button className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-surface-700 hover:bg-surface-50">
                                <Mail className="h-4 w-4 text-surface-400" />
                                Envoyer un email
                              </button>
                              <button className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-surface-700 hover:bg-surface-50">
                                <RefreshCw className="h-4 w-4 text-surface-400" />
                                {r.status === 'suspended' ? 'Réactiver' : 'Réinitialiser'}
                              </button>
                              <div className="border-t border-surface-100" />
                              <button className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50">
                                <Ban className="h-4 w-4" />
                                {r.status === 'suspended' ? 'Supprimer' : 'Suspendre'}
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail panel */}
      <AnimatePresence>
        {detail && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
              onClick={() => setDetailId(null)}
            />
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 40 }}
              transition={{ type: 'spring', damping: 25 }}
              className="fixed right-0 top-0 z-50 h-full w-96 overflow-y-auto border-l border-surface-200 bg-white shadow-glass-lg"
            >
              <div className="flex items-center justify-between border-b border-surface-100 p-5">
                <h3 className="font-semibold text-surface-900">Détails</h3>
                <button onClick={() => setDetailId(null)} className="rounded-lg p-1.5 text-surface-400 hover:bg-surface-100">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="p-5 space-y-5">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-100 text-xl font-bold text-brand-700">
                    {detail.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-surface-900">{detail.name}</p>
                    <p className="text-sm text-surface-500">{detail.city}</p>
                    <span className="mt-1 block">
                      <Badge variant={STATUS_CONFIG[detail.status].variant} size="sm">
                        {STATUS_CONFIG[detail.status].label}
                      </Badge>
                    </span>
                  </div>
                </div>

                <div className="space-y-2 rounded-xl bg-surface-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-surface-400">Propriétaire</p>
                  <p className="text-sm font-medium text-surface-900">{detail.owner}</p>
                  <p className="text-sm text-surface-500">{detail.email}</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Plan', value: detail.plan, icon: Store },
                    { label: 'MRR', value: detail.mrr > 0 ? `${detail.mrr} €` : '—', icon: Euro },
                    { label: 'Commandes', value: detail.orders.toString(), icon: ShoppingBag },
                    { label: 'CA total', value: detail.revenue > 0 ? `${detail.revenue.toLocaleString('fr-FR')} €` : '—', icon: TrendingUp },
                  ].map((item) => (
                    <div key={item.label} className="rounded-xl border border-surface-200 p-3">
                      <item.icon className="mb-1 h-4 w-4 text-surface-400" />
                      <p className="text-lg font-bold text-surface-900">{item.value}</p>
                      <p className="text-xs text-surface-500">{item.label}</p>
                    </div>
                  ))}
                </div>

                <div className="space-y-2 rounded-xl bg-surface-50 p-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-surface-500">Inscrit le</span>
                    <span className="font-medium text-surface-900">{detail.joined}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-surface-500">Dernière commande</span>
                    <span className="font-medium text-surface-900">{detail.lastOrder}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Button variant="ghost" size="sm" icon={<Mail className="h-4 w-4" />} className="w-full justify-start">
                    Envoyer un email
                  </Button>
                  <Button variant="ghost" size="sm" icon={<RefreshCw className="h-4 w-4" />} className="w-full justify-start">
                    {detail.status === 'suspended' ? 'Réactiver le compte' : 'Réinitialiser'}
                  </Button>
                  <Button
                    size="sm"
                    className="w-full justify-start bg-red-50 text-red-600 hover:bg-red-100"
                    icon={<Ban className="h-4 w-4" />}
                  >
                    {detail.status === 'suspended' ? 'Supprimer le compte' : 'Suspendre le compte'}
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Click outside to close action menu */}
      {menuOpenId && (
        <div className="fixed inset-0 z-0" onClick={() => setMenuOpenId(null)} />
      )}
    </div>
  );
}
