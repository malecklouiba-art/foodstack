'use client';

import { useState, useMemo } from 'react';
import {
  Building2,
  ShoppingBag,
  Euro,
  Activity,
  Search,
  Eye,
  Ban,
  CheckCircle,
  Users,
  Zap,
  Crown,
  Clock,
  TrendingUp,
  AlertTriangle,
  CreditCard,
  Plus,
} from 'lucide-react';
import { StatCard } from '@/components/ui/StatCard';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';

// ── Types ─────────────────────────────────────────────────────────────────────

type Plan = 'Starter' | 'Pro' | 'Enterprise';
type RestaurantStatus = 'Actif' | 'Suspendu';
type ActivityEventType =
  | 'restaurant_created'
  | 'plan_upgraded'
  | 'payment_received'
  | 'restaurant_suspended';

interface Restaurant {
  id: string;
  name: string;
  plan: Plan;
  ordersPerMonth: number;
  revenuePerMonth: number;
  status: RestaurantStatus;
  city: string;
}

interface ActivityEvent {
  id: string;
  timestamp: string;
  restaurantName: string;
  eventType: ActivityEventType;
  detail: string;
}

interface PlanInfo {
  name: Plan;
  price: string;
  ordersLimit: string;
  users: string;
  features: string[];
  subscribers: number;
  highlight?: boolean;
}

// ── Mock Data ─────────────────────────────────────────────────────────────────

const MOCK_RESTAURANTS: Restaurant[] = [
  {
    id: 'r1',
    name: 'Le Petit Bistrot',
    plan: 'Pro',
    ordersPerMonth: 3_420,
    revenuePerMonth: 28_450,
    status: 'Actif',
    city: 'Paris',
  },
  {
    id: 'r2',
    name: 'Brasserie du Marché',
    plan: 'Enterprise',
    ordersPerMonth: 9_870,
    revenuePerMonth: 74_200,
    status: 'Actif',
    city: 'Lyon',
  },
  {
    id: 'r3',
    name: 'La Table du Chef',
    plan: 'Starter',
    ordersPerMonth: 312,
    revenuePerMonth: 4_100,
    status: 'Actif',
    city: 'Bordeaux',
  },
  {
    id: 'r4',
    name: 'Chez Marguerite',
    plan: 'Pro',
    ordersPerMonth: 1_980,
    revenuePerMonth: 17_600,
    status: 'Suspendu',
    city: 'Marseille',
  },
  {
    id: 'r5',
    name: 'Le Moulin à Vent',
    plan: 'Starter',
    ordersPerMonth: 480,
    revenuePerMonth: 5_800,
    status: 'Actif',
    city: 'Toulouse',
  },
  {
    id: 'r6',
    name: 'Auberge des Saveurs',
    plan: 'Enterprise',
    ordersPerMonth: 12_300,
    revenuePerMonth: 98_000,
    status: 'Actif',
    city: 'Nantes',
  },
  {
    id: 'r7',
    name: 'Café de la Paix',
    plan: 'Starter',
    ordersPerMonth: 95,
    revenuePerMonth: 1_200,
    status: 'Suspendu',
    city: 'Strasbourg',
  },
  {
    id: 'r8',
    name: 'La Maison Dorée',
    plan: 'Pro',
    ordersPerMonth: 2_750,
    revenuePerMonth: 22_900,
    status: 'Actif',
    city: 'Nice',
  },
];

const MOCK_ACTIVITY: ActivityEvent[] = [
  {
    id: 'ev10',
    timestamp: '2026-05-12T09:42:00Z',
    restaurantName: 'Le Nouveau Comptoir',
    eventType: 'restaurant_created',
    detail: 'Nouveau restaurant inscrit sur la plateforme',
  },
  {
    id: 'ev9',
    timestamp: '2026-05-12T09:15:00Z',
    restaurantName: 'Brasserie du Marché',
    eventType: 'payment_received',
    detail: 'Paiement mensuel Enterprise — 490€',
  },
  {
    id: 'ev8',
    timestamp: '2026-05-12T08:58:00Z',
    restaurantName: 'Le Petit Bistrot',
    eventType: 'plan_upgraded',
    detail: 'Starter → Pro',
  },
  {
    id: 'ev7',
    timestamp: '2026-05-11T21:10:00Z',
    restaurantName: 'Café de la Paix',
    eventType: 'restaurant_suspended',
    detail: 'Paiement en retard (> 30 jours)',
  },
  {
    id: 'ev6',
    timestamp: '2026-05-11T18:33:00Z',
    restaurantName: 'Auberge des Saveurs',
    eventType: 'payment_received',
    detail: 'Paiement mensuel Enterprise — 490€',
  },
  {
    id: 'ev5',
    timestamp: '2026-05-11T15:20:00Z',
    restaurantName: 'La Maison Dorée',
    eventType: 'plan_upgraded',
    detail: 'Starter → Pro',
  },
  {
    id: 'ev4',
    timestamp: '2026-05-11T12:05:00Z',
    restaurantName: 'Crêperie Bretonne',
    eventType: 'restaurant_created',
    detail: 'Nouveau restaurant inscrit sur la plateforme',
  },
  {
    id: 'ev3',
    timestamp: '2026-05-11T10:47:00Z',
    restaurantName: 'Le Moulin à Vent',
    eventType: 'payment_received',
    detail: 'Paiement mensuel Starter — 49€',
  },
  {
    id: 'ev2',
    timestamp: '2026-05-10T22:19:00Z',
    restaurantName: 'Chez Marguerite',
    eventType: 'restaurant_suspended',
    detail: 'Non-conformité aux CGU',
  },
  {
    id: 'ev1',
    timestamp: '2026-05-10T17:55:00Z',
    restaurantName: 'La Table du Chef',
    eventType: 'restaurant_created',
    detail: 'Nouveau restaurant inscrit sur la plateforme',
  },
];

const MOCK_PLANS: PlanInfo[] = [
  {
    name: 'Starter',
    price: '49€/mois',
    ordersLimit: '500 commandes/mois',
    users: '1 utilisateur',
    features: ['Tableau de bord basique', 'Support par email'],
    subscribers: 7,
  },
  {
    name: 'Pro',
    price: '149€/mois',
    ordersLimit: '5 000 commandes/mois',
    users: '5 utilisateurs',
    features: ['Analytics avancés', 'Support prioritaire', 'Intégrations POS'],
    subscribers: 12,
    highlight: true,
  },
  {
    name: 'Enterprise',
    price: 'Sur devis',
    ordersLimit: 'Illimité',
    users: 'Utilisateurs illimités',
    features: ['API access', 'Support dédié 24/7', 'SLA personnalisé', 'Onboarding accompagné'],
    subscribers: 5,
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

const PLAN_FILTER_OPTIONS = [
  { value: 'all', label: 'Tous les plans' },
  { value: 'Starter', label: 'Starter' },
  { value: 'Pro', label: 'Pro' },
  { value: 'Enterprise', label: 'Enterprise' },
];

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value);
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}

function getPlanBadgeClass(plan: Plan): string {
  switch (plan) {
    case 'Starter':
      return 'bg-gray-700 text-gray-200';
    case 'Pro':
      return 'bg-blue-600 text-blue-100';
    case 'Enterprise':
      return 'bg-purple-600 text-purple-100';
  }
}

function getEventIcon(type: ActivityEventType): React.ReactNode {
  switch (type) {
    case 'restaurant_created':
      return <Plus className="h-3.5 w-3.5" />;
    case 'plan_upgraded':
      return <TrendingUp className="h-3.5 w-3.5" />;
    case 'payment_received':
      return <CreditCard className="h-3.5 w-3.5" />;
    case 'restaurant_suspended':
      return <AlertTriangle className="h-3.5 w-3.5" />;
  }
}

function getEventBadgeVariant(type: ActivityEventType): 'success' | 'info' | 'brand' | 'danger' {
  switch (type) {
    case 'restaurant_created':
      return 'success';
    case 'plan_upgraded':
      return 'info';
    case 'payment_received':
      return 'brand';
    case 'restaurant_suspended':
      return 'danger';
  }
}

function getEventLabel(type: ActivityEventType): string {
  switch (type) {
    case 'restaurant_created':
      return 'Restaurant créé';
    case 'plan_upgraded':
      return 'Plan upgradé';
    case 'payment_received':
      return 'Paiement reçu';
    case 'restaurant_suspended':
      return 'Suspendu';
  }
}

function getPlanIcon(plan: Plan): React.ReactNode {
  switch (plan) {
    case 'Starter':
      return <Zap className="h-5 w-5 text-gray-400" />;
    case 'Pro':
      return <Activity className="h-5 w-5 text-blue-400" />;
    case 'Enterprise':
      return <Crown className="h-5 w-5 text-purple-400" />;
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

interface SuspendModalState {
  open: boolean;
  restaurant: Restaurant | null;
}

export default function SuperAdminPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>(MOCK_RESTAURANTS);
  const [searchQuery, setSearchQuery] = useState('');
  const [planFilter, setPlanFilter] = useState<'all' | Plan>('all');
  const [suspendModal, setSuspendModal] = useState<SuspendModalState>({ open: false, restaurant: null });
  const [suspendReason, setSuspendReason] = useState('');
  const [suspending, setSuspending] = useState(false);

  // Filtered restaurants
  const filteredRestaurants = useMemo(() => {
    return restaurants.filter((r) => {
      const matchesSearch = r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.city.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesPlan = planFilter === 'all' || r.plan === planFilter;
      return matchesSearch && matchesPlan;
    });
  }, [restaurants, searchQuery, planFilter]);

  // KPIs
  const totalOrders = restaurants.reduce((acc, r) => acc + r.ordersPerMonth, 0);
  const totalRevenue = restaurants.reduce((acc, r) => acc + r.revenuePerMonth, 0);

  function openSuspendModal(restaurant: Restaurant): void {
    setSuspendReason('');
    setSuspendModal({ open: true, restaurant });
  }

  function closeSuspendModal(): void {
    setSuspendModal({ open: false, restaurant: null });
  }

  function handleSuspendConfirm(): void {
    if (!suspendModal.restaurant) return;
    setSuspending(true);
    // Mock async action
    setTimeout(() => {
      setRestaurants((prev) =>
        prev.map((r) =>
          r.id === suspendModal.restaurant?.id ? { ...r, status: 'Suspendu' } : r
        )
      );
      setSuspending(false);
      closeSuspendModal();
    }, 800);
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="space-y-8 p-6">
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-white">Super Admin</h1>
              <span className="inline-flex items-center rounded-full border border-purple-500/40 bg-purple-500/10 px-3 py-0.5 text-xs font-semibold text-purple-300">
                Platform v2.0
              </span>
            </div>
            <p className="mt-1 text-sm text-gray-400">Vue globale SaaS</p>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-2">
            <span className="h-2 w-2 animate-pulse rounded-full bg-green-400" />
            <span className="text-sm font-medium text-green-400">Tous les services opérationnels</span>
          </div>
        </div>

        {/* ── KPI Row ─────────────────────────────────────────────────────── */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10">
                <Building2 className="h-5 w-5 text-purple-400" />
              </div>
              <span className="flex items-center gap-1 text-xs font-medium text-green-400">
                ↑ 3 ce mois
              </span>
            </div>
            <div className="mt-4">
              <p className="text-2xl font-bold text-white">24</p>
              <p className="mt-1 text-sm text-gray-400">Total restaurants</p>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10">
                <ShoppingBag className="h-5 w-5 text-blue-400" />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-2xl font-bold text-white">1 847</p>
              <p className="mt-1 text-sm text-gray-400">Commandes aujourd'hui</p>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-500/10">
                <Euro className="h-5 w-5 text-green-400" />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-2xl font-bold text-white">48 320€</p>
              <p className="mt-1 text-sm text-gray-400">CA total</p>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
                <Activity className="h-5 w-5 text-emerald-400" />
              </div>
              <span className="flex items-center gap-1 text-xs font-medium text-green-400">
                ↑ stable
              </span>
            </div>
            <div className="mt-4">
              <p className="text-2xl font-bold text-white">99.9%</p>
              <p className="mt-1 text-sm text-gray-400">Uptime</p>
            </div>
          </div>
        </div>

        {/* ── Restaurants Table ─────────────────────────────────────────── */}
        <div className="rounded-2xl border border-gray-800 bg-gray-900 shadow-sm">
          {/* Table header / filters */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-800 px-6 py-5">
            <div>
              <h2 className="text-lg font-semibold text-white">Restaurants</h2>
              <p className="mt-0.5 text-sm text-gray-400">
                {filteredRestaurants.length} résultat{filteredRestaurants.length !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {/* Search */}
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  placeholder="Rechercher..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-10 w-56 rounded-xl border border-gray-700 bg-gray-800 pl-9 pr-3 text-sm text-white placeholder:text-gray-500 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                />
              </div>
              {/* Plan filter */}
              <div className="flex items-center gap-1 rounded-xl border border-gray-700 bg-gray-800 p-1">
                {PLAN_FILTER_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setPlanFilter(opt.value as 'all' | Plan)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                      planFilter === opt.value
                        ? 'bg-purple-600 text-white'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Nom
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Plan
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                    Commandes/mois
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                    CA/mois
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {filteredRestaurants.map((restaurant) => (
                  <tr
                    key={restaurant.id}
                    className="transition-colors hover:bg-gray-800/50"
                  >
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-white">{restaurant.name}</p>
                        <p className="text-xs text-gray-500">{restaurant.city}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getPlanBadgeClass(restaurant.plan)}`}
                      >
                        {restaurant.plan}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm text-gray-300">
                        {restaurant.ordersPerMonth.toLocaleString('fr-FR')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm font-medium text-white">
                        {formatCurrency(restaurant.revenuePerMonth)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {restaurant.status === 'Actif' ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-green-500/10 px-2.5 py-0.5 text-xs font-medium text-green-400">
                          <CheckCircle className="h-3 w-3" />
                          Actif
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/10 px-2.5 py-0.5 text-xs font-medium text-red-400">
                          <Ban className="h-3 w-3" />
                          Suspendu
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button className="flex items-center gap-1.5 rounded-lg border border-gray-700 bg-gray-800 px-3 py-1.5 text-xs font-medium text-gray-300 transition-colors hover:border-gray-600 hover:text-white">
                          <Eye className="h-3.5 w-3.5" />
                          Voir
                        </button>
                        {restaurant.status === 'Actif' && (
                          <button
                            onClick={() => openSuspendModal(restaurant)}
                            className="flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-400 transition-colors hover:border-red-500/60 hover:bg-red-500/20"
                          >
                            <Ban className="h-3.5 w-3.5" />
                            Suspendre
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredRestaurants.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-sm text-gray-500">
                      Aucun restaurant ne correspond aux critères de recherche.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Table footer summary */}
          <div className="border-t border-gray-800 px-6 py-4">
            <div className="flex items-center gap-6 text-xs text-gray-500">
              <span>
                Total commandes/mois :{' '}
                <span className="font-semibold text-gray-300">
                  {totalOrders.toLocaleString('fr-FR')}
                </span>
              </span>
              <span>
                CA total/mois :{' '}
                <span className="font-semibold text-gray-300">{formatCurrency(totalRevenue)}</span>
              </span>
            </div>
          </div>
        </div>

        {/* ── Plans Section ──────────────────────────────────────────────── */}
        <div>
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-white">Plans tarifaires</h2>
            <p className="mt-0.5 text-sm text-gray-400">Offres disponibles sur la plateforme</p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {MOCK_PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-2xl border p-6 transition-all ${
                  plan.highlight
                    ? 'border-blue-500/50 bg-blue-500/5 shadow-lg shadow-blue-500/10'
                    : 'border-gray-800 bg-gray-900'
                }`}
              >
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="rounded-full bg-blue-600 px-3 py-0.5 text-xs font-semibold text-white">
                      Populaire
                    </span>
                  </div>
                )}

                {/* Plan header */}
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                      plan.name === 'Starter'
                        ? 'bg-gray-700/50'
                        : plan.name === 'Pro'
                        ? 'bg-blue-500/10'
                        : 'bg-purple-500/10'
                    }`}
                  >
                    {getPlanIcon(plan.name)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{plan.name}</h3>
                    <p className="text-lg font-bold text-white">{plan.price}</p>
                  </div>
                </div>

                {/* Limits */}
                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <ShoppingBag className="h-4 w-4 text-gray-500" />
                    {plan.ordersLimit}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Users className="h-4 w-4 text-gray-500" />
                    {plan.users}
                  </div>
                </div>

                {/* Features */}
                <ul className="mt-4 space-y-1.5">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm text-gray-300">
                      <CheckCircle className="h-3.5 w-3.5 flex-shrink-0 text-green-400" />
                      {feature}
                    </li>
                  ))}
                </ul>

                {/* Subscribers */}
                <div
                  className={`mt-5 rounded-xl border px-4 py-3 ${
                    plan.name === 'Starter'
                      ? 'border-gray-700 bg-gray-800/50'
                      : plan.name === 'Pro'
                      ? 'border-blue-500/20 bg-blue-500/5'
                      : 'border-purple-500/20 bg-purple-500/5'
                  }`}
                >
                  <p className="text-xs text-gray-500">Abonnés actuels</p>
                  <p className="mt-0.5 text-2xl font-bold text-white">{plan.subscribers}</p>
                  <p className="text-xs text-gray-500">restaurants</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Recent Activity Log ────────────────────────────────────────── */}
        <div className="rounded-2xl border border-gray-800 bg-gray-900 shadow-sm">
          <div className="border-b border-gray-800 px-6 py-5">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-purple-400" />
              <h2 className="text-lg font-semibold text-white">Activité récente</h2>
            </div>
            <p className="mt-0.5 text-sm text-gray-400">10 derniers événements plateforme</p>
          </div>
          <div className="divide-y divide-gray-800">
            {MOCK_ACTIVITY.map((event) => (
              <div
                key={event.id}
                className="flex items-start justify-between gap-4 px-6 py-4 transition-colors hover:bg-gray-800/50"
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg ${
                      event.eventType === 'restaurant_created'
                        ? 'bg-green-500/10 text-green-400'
                        : event.eventType === 'plan_upgraded'
                        ? 'bg-blue-500/10 text-blue-400'
                        : event.eventType === 'payment_received'
                        ? 'bg-purple-500/10 text-purple-400'
                        : 'bg-red-500/10 text-red-400'
                    }`}
                  >
                    {getEventIcon(event.eventType)}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-white">{event.restaurantName}</span>
                      <Badge variant={getEventBadgeVariant(event.eventType)} size="sm">
                        {getEventLabel(event.eventType)}
                      </Badge>
                    </div>
                    <p className="mt-0.5 text-sm text-gray-400">{event.detail}</p>
                  </div>
                </div>
                <span className="flex-shrink-0 text-xs text-gray-600">
                  {formatDate(event.timestamp)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Suspend Modal ──────────────────────────────────────────────────── */}
      <Modal
        open={suspendModal.open}
        onClose={closeSuspendModal}
        title="Suspendre le restaurant"
        description={
          suspendModal.restaurant
            ? `Vous êtes sur le point de suspendre « ${suspendModal.restaurant.name} ». Cette action désactivera immédiatement l'accès à la plateforme.`
            : undefined
        }
        size="md"
        footer={
          <div className="flex items-center justify-end gap-3">
            <button
              onClick={closeSuspendModal}
              disabled={suspending}
              className="rounded-xl border border-gray-700 bg-gray-800 px-4 py-2 text-sm font-medium text-gray-300 transition-colors hover:border-gray-600 hover:text-white disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              onClick={handleSuspendConfirm}
              disabled={suspending || suspendReason.trim().length === 0}
              className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {suspending ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Suspension...
                </>
              ) : (
                <>
                  <Ban className="h-4 w-4" />
                  Confirmer la suspension
                </>
              )}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          {suspendModal.restaurant && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-400" />
                <span className="text-sm font-medium text-red-400">Action irréversible depuis ce panneau</span>
              </div>
              <p className="mt-1 text-xs text-red-400/70">
                Le restaurant devra contacter le support pour être réactivé.
              </p>
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-300">
              Motif de la suspension <span className="text-red-500">*</span>
            </label>
            <textarea
              value={suspendReason}
              onChange={(e) => setSuspendReason(e.target.value)}
              placeholder="Décrivez la raison de la suspension..."
              rows={4}
              className="w-full resize-none rounded-xl border border-gray-700 bg-gray-800 px-3 py-2.5 text-sm text-white placeholder:text-gray-500 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20"
            />
            <p className="text-xs text-gray-500">Ce motif sera enregistré dans les logs de la plateforme.</p>
          </div>
        </div>
      </Modal>
    </div>
  );
}
