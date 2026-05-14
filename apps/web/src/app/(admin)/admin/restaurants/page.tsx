'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Store, Mail, Calendar, Euro, ExternalLink, Ban } from 'lucide-react';
import { clsx } from 'clsx';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

// ── Types ─────────────────────────────────────────────────────────────────────

type Plan   = 'Starter' | 'Pro' | 'Enterprise';
type Status = 'Actif' | 'Suspendu' | 'Trial';

interface Restaurant {
  id:      string;
  name:    string;
  owner:   string;
  email:   string;
  plan:    Plan;
  status:  Status;
  mrr:     number;
  joined:  string;
  orders:  number;
  city:    string;
}

// ── Demo data ─────────────────────────────────────────────────────────────────

const RESTAURANTS: Restaurant[] = [
  { id: 'r1',  name: 'Le Petit Bistro',      owner: 'Julien Martin',    email: 'j.martin@bistro.fr',      plan: 'Pro',        status: 'Actif',    mrr: 79,  joined: '15 jan. 2026', orders: 1240, city: 'Paris'     },
  { id: 'r2',  name: 'Sushi Yama',            owner: 'Aiko Tanaka',      email: 'a.tanaka@sushiyama.fr',   plan: 'Enterprise', status: 'Actif',    mrr: 199, joined: '22 jan. 2026', orders: 3820, city: 'Lyon'      },
  { id: 'r3',  name: 'Pizza Palace',          owner: 'Marco Rossi',      email: 'm.rossi@pizza-palace.fr', plan: 'Starter',    status: 'Trial',    mrr: 0,   joined: '7 mai 2026',  orders: 18,   city: 'Marseille' },
  { id: 'r4',  name: 'Burger Factory',        owner: 'Sophie Dupont',    email: 's.dupont@burgerfact.fr',  plan: 'Pro',        status: 'Actif',    mrr: 79,  joined: '5 mar. 2026',  orders: 960,  city: 'Bordeaux'  },
  { id: 'r5',  name: 'La Crêperie Dorée',     owner: 'Pierre Leblanc',   email: 'p.leblanc@creperie.fr',   plan: 'Starter',    status: 'Actif',    mrr: 29,  joined: '2 fév. 2026',  orders: 430,  city: 'Nantes'    },
  { id: 'r6',  name: 'Tacos Azteca',          owner: 'Carlos Mendez',    email: 'c.mendez@tacos.fr',       plan: 'Pro',        status: 'Suspendu', mrr: 0,   joined: '10 déc. 2025', orders: 750,  city: 'Toulouse'  },
  { id: 'r7',  name: 'Le Ramen House',        owner: 'Hana Kimura',      email: 'h.kimura@ramen.fr',       plan: 'Starter',    status: 'Suspendu', mrr: 0,   joined: '18 nov. 2025', orders: 200,  city: 'Strasbourg'},
  { id: 'r8',  name: 'Cloud Kitchen Alpha',   owner: 'Thomas Bernard',   email: 't.bernard@cloudkitchen.fr',plan: 'Enterprise',status: 'Actif',    mrr: 199, joined: '3 avr. 2026',  orders: 2100, city: 'Paris'     },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function statusBadge(status: Status) {
  if (status === 'Actif')    return <Badge variant="success" dot>{status}</Badge>;
  if (status === 'Trial')    return <Badge variant="warning" dot>{status}</Badge>;
  return <Badge variant="danger" dot>{status}</Badge>;
}

function planBadge(plan: Plan) {
  if (plan === 'Enterprise') return <Badge variant="info">{plan}</Badge>;
  if (plan === 'Pro')        return <Badge variant="brand">{plan}</Badge>;
  return <Badge variant="default">{plan}</Badge>;
}

type FilterStatus = 'tous' | 'actif' | 'suspendu' | 'trial';

// ── Page ──────────────────────────────────────────────────────────────────────

export default function RestaurantsPage() {
  const [search,   setSearch]   = useState('');
  const [filter,   setFilter]   = useState<FilterStatus>('tous');
  const [selected, setSelected] = useState<Restaurant | null>(null);

  const filtered = RESTAURANTS.filter((r) => {
    const matchSearch =
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.owner.toLowerCase().includes(search.toLowerCase()) ||
      r.city.toLowerCase().includes(search.toLowerCase());
    const matchFilter =
      filter === 'tous'     ? true :
      filter === 'actif'    ? r.status === 'Actif' :
      filter === 'suspendu' ? r.status === 'Suspendu' :
      r.status === 'Trial';
    return matchSearch && matchFilter;
  });

  const stats = {
    total:    RESTAURANTS.length,
    actifs:   RESTAURANTS.filter((r) => r.status === 'Actif').length,
    trial:    RESTAURANTS.filter((r) => r.status === 'Trial').length,
    suspendus:RESTAURANTS.filter((r) => r.status === 'Suspendu').length,
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-surface-900">Restaurants</h1>
        <p className="mt-1 text-sm text-surface-500">Gestion de tous les restaurants sur la plateforme</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: 'Total',      value: stats.total,     color: 'text-surface-900'               },
          { label: 'Actifs',     value: stats.actifs,    color: 'text-green-600 dark:text-green-400' },
          { label: 'Trial',      value: stats.trial,     color: 'text-yellow-600 dark:text-yellow-400' },
          { label: 'Suspendus',  value: stats.suspendus, color: 'text-red-600 dark:text-red-400' },
        ].map((s) => (
          <Card key={s.label} padding="md">
            <p className="text-xs font-medium text-surface-500 uppercase tracking-wide">{s.label}</p>
            <p className={`mt-1 text-3xl font-bold ${s.color}`}>{s.value}</p>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card padding="md">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-400" />
            <input
              type="text"
              placeholder="Rechercher un restaurant, propriétaire, ville…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 pl-9 pr-4 py-2 text-sm text-surface-900 placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
            />
          </div>
          {/* Status filter */}
          <div className="flex gap-1.5">
            {(['tous', 'actif', 'suspendu', 'trial'] as FilterStatus[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={clsx(
                  'rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition-colors',
                  filter === f
                    ? 'bg-brand-500 text-black'
                    : 'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 hover:bg-surface-200 dark:hover:bg-surface-700'
                )}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Table + Detail panel */}
      <div className="flex gap-6">
        <Card padding="none" className="flex-1 min-w-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-100 dark:border-surface-700">
                  {['Restaurant', 'Plan', 'Statut', 'MRR', 'Inscrit le', 'Actions'].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-surface-500">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100 dark:divide-surface-700">
                {filtered.map((r) => (
                  <motion.tr
                    key={r.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    onClick={() => setSelected(r)}
                    className={clsx(
                      'cursor-pointer transition-colors',
                      selected?.id === r.id
                        ? 'bg-brand-500/10'
                        : 'hover:bg-surface-50 dark:hover:bg-surface-800/40'
                    )}
                  >
                    <td className="px-5 py-4">
                      <div>
                        <p className="font-medium text-surface-900">{r.name}</p>
                        <p className="text-xs text-surface-500">{r.owner} · {r.city}</p>
                      </div>
                    </td>
                    <td className="px-5 py-4">{planBadge(r.plan)}</td>
                    <td className="px-5 py-4">{statusBadge(r.status)}</td>
                    <td className="px-5 py-4 font-semibold text-surface-900">
                      {r.mrr > 0 ? `${r.mrr}€` : <span className="text-surface-400">—</span>}
                    </td>
                    <td className="px-5 py-4 text-surface-500">{r.joined}</td>
                    <td className="px-5 py-4">
                      <div className="flex gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setSelected(r)}
                          className="flex items-center gap-1 rounded-lg bg-surface-100 dark:bg-surface-800 px-2.5 py-1.5 text-xs font-medium text-surface-700 dark:text-surface-300 hover:bg-surface-200 dark:hover:bg-surface-700 transition-colors"
                        >
                          <ExternalLink className="h-3 w-3" />
                          Voir
                        </button>
                        <button className="flex items-center gap-1 rounded-lg bg-red-50 dark:bg-red-900/20 px-2.5 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors">
                          <Ban className="h-3 w-3" />
                          Suspendre
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-sm text-surface-400">
                      Aucun restaurant trouvé.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Slide-in detail panel */}
        <AnimatePresence>
          {selected && (
            <motion.div
              key="panel"
              initial={{ opacity: 0, x: 24, width: 0 }}
              animate={{ opacity: 1, x: 0, width: 320 }}
              exit={{ opacity: 0, x: 24, width: 0 }}
              transition={{ type: 'spring', damping: 22, stiffness: 260 }}
              className="flex-shrink-0 overflow-hidden"
            >
              <Card padding="none" className="w-80 h-full overflow-y-auto">
                {/* Panel header */}
                <div className="flex items-center justify-between border-b border-surface-100 dark:border-surface-700 px-5 py-4">
                  <CardTitle className="text-base">Détails</CardTitle>
                  <button
                    onClick={() => setSelected(null)}
                    className="rounded-lg p-1.5 text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="p-5 space-y-5">
                  {/* Identity */}
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-brand-500/10">
                      <Store className="h-6 w-6 text-brand-500" />
                    </div>
                    <div>
                      <p className="font-semibold text-surface-900">{selected.name}</p>
                      <p className="text-sm text-surface-500">{selected.city}</p>
                    </div>
                  </div>

                  {/* Badges */}
                  <div className="flex flex-wrap gap-2">
                    {planBadge(selected.plan)}
                    {statusBadge(selected.status)}
                  </div>

                  {/* Info rows */}
                  <div className="space-y-3">
                    {[
                      { icon: Store,    label: 'Propriétaire', value: selected.owner   },
                      { icon: Mail,     label: 'Email',        value: selected.email   },
                      { icon: Calendar, label: 'Inscrit le',   value: selected.joined  },
                      { icon: Euro,     label: 'MRR',          value: selected.mrr > 0 ? `${selected.mrr}€/mois` : 'Trial gratuit' },
                      { icon: Store,    label: 'Commandes',    value: `${selected.orders.toLocaleString('fr-FR')} total` },
                    ].map(({ icon: Icon, label, value }) => (
                      <div key={label} className="flex items-start gap-3">
                        <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-surface-100 dark:bg-surface-800">
                          <Icon className="h-3.5 w-3.5 text-surface-500" />
                        </div>
                        <div>
                          <p className="text-xs text-surface-400">{label}</p>
                          <p className="text-sm font-medium text-surface-900">{value}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="space-y-2 pt-2 border-t border-surface-100 dark:border-surface-700">
                    <button className="w-full rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-black hover:bg-brand-400 transition-colors">
                      Voir le tableau de bord
                    </button>
                    {selected.status !== 'Suspendu' ? (
                      <button className="w-full rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-900/20 px-4 py-2.5 text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors">
                        Suspendre le compte
                      </button>
                    ) : (
                      <button className="w-full rounded-xl border border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-900/20 px-4 py-2.5 text-sm font-semibold text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors">
                        Réactiver le compte
                      </button>
                    )}
                  </div>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
