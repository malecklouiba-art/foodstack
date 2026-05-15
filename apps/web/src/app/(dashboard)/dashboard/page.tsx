'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useGSAPReveal } from '@/hooks/useGSAPReveal';
import { motion } from 'framer-motion';
import {
  ShoppingBag, Users, Euro, Truck, Star,
  ArrowUpRight, TrendingUp, Clock, Zap,
  Building2, CreditCard, BarChart3, Percent,
} from 'lucide-react';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { RevenueChart } from '@/components/dashboard/RevenueChart';
import { TopItems } from '@/components/dashboard/TopItems';
import { HourlyChart } from '@/components/dashboard/HourlyChart';
import { LiveFeed, type FeedEvent } from '@/components/dashboard/LiveFeed';
import { useRealtimeOrders, type OrderEvent } from '@/hooks/useRealtimeOrders';
import { useRealtimeInventory, type InventoryEvent } from '@/hooks/useRealtimeInventory';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts';

// ── KPI helpers ───────────────────────────────────────────────────────────────

function useCounter(initial: number) {
  const [value, setValue] = useState(initial);
  const inc = useCallback((by = 1) => setValue((v) => v + by), []);
  return [value, inc] as const;
}

let feedSeq = 0;
function makeEvent(type: FeedEvent['type'], message: string, detail?: string): FeedEvent {
  return { id: String(++feedSeq), type, message, detail, ts: new Date() };
}

// ── Static KPI data ───────────────────────────────────────────────────────────

const BASE_STATS = {
  revenue:     12450,
  orders:      84,
  customers:   23,
  deliveries:  7,
  avgOrder:    148.2,
  rating:      4.8,
  cancelRate:  2.3,
  prepTime:    11.4,
};

const statusConfig = {
  confirmed:  { label: 'Confirmée',     variant: 'info'    as const },
  preparing:  { label: 'En préparation',variant: 'warning' as const },
  ready:      { label: 'Prête',         variant: 'brand'   as const },
  delivering: { label: 'En livraison',  variant: 'success' as const },
  delivered:  { label: 'Livrée',        variant: 'success' as const },
  cancelled:  { label: 'Annulée',       variant: 'danger'  as const },
};

const LIVE_ORDERS_INIT = [
  { id: 'ORD-8821', customer: 'Marie L.',  items: 3, total: 42.50, status: 'preparing', time: '12 min' },
  { id: 'ORD-8820', customer: 'Pierre D.', items: 2, total: 28.90, status: 'delivering',time: '8 min'  },
  { id: 'ORD-8819', customer: 'Sophie M.', items: 5, total: 67.30, status: 'ready',     time: '3 min'  },
  { id: 'ORD-8818', customer: 'Julien K.', items: 1, total: 16.90, status: 'confirmed', time: '18 min' },
];

// ── Super Admin data ──────────────────────────────────────────────────────────

const PLATFORM_MRR_DATA = [
  { month: 'Juin',  mrr: 18200 },
  { month: 'Juil',  mrr: 21400 },
  { month: 'Août',  mrr: 19800 },
  { month: 'Sep',   mrr: 24600 },
  { month: 'Oct',   mrr: 27100 },
  { month: 'Nov',   mrr: 29800 },
  { month: 'Déc',   mrr: 32400 },
  { month: 'Jan',   mrr: 30100 },
  { month: 'Fév',   mrr: 33800 },
  { month: 'Mar',   mrr: 37200 },
  { month: 'Avr',   mrr: 41500 },
  { month: 'Mai',   mrr: 45800 },
];

const PLATFORM_RESTAURANTS = [
  { id: 'r1', name: 'Le Gourmet Bastille',   plan: 'Pro',       mrr: 299, status: 'actif',     joined: '2024-01-12' },
  { id: 'r2', name: 'Sushi Marais',          plan: 'Starter',   mrr: 99,  status: 'actif',     joined: '2024-02-03' },
  { id: 'r3', name: 'Pizza Nation',          plan: 'Pro',       mrr: 299, status: 'pause',     joined: '2024-03-17' },
  { id: 'r4', name: 'Burger République',     plan: 'Business',  mrr: 599, status: 'actif',     joined: '2024-04-05' },
  { id: 'r5', name: 'Crêperie Montmartre',   plan: 'Starter',   mrr: 99,  status: 'négociation',joined: '2025-05-01' },
];

const PLAN_COLORS: Record<string, string> = {
  Starter:  'bg-gray-100 text-gray-700',
  Pro:      'bg-brand-50 text-brand-700',
  Business: 'bg-purple-50 text-purple-700',
};
const STATUS_COLORS: Record<string, string> = {
  actif:       'bg-green-50 text-green-700',
  pause:       'bg-amber-50 text-amber-700',
  négociation: 'bg-blue-50 text-blue-700',
  churned:     'bg-red-50 text-red-700',
};

// ── Super Admin Dashboard ─────────────────────────────────────────────────────

function SuperAdminDashboard() {
  const totalMRR = PLATFORM_RESTAURANTS.filter(r => r.status === 'actif').reduce((s, r) => s + r.mrr, 0);
  const activeRestaurants = PLATFORM_RESTAURANTS.filter(r => r.status === 'actif').length;
  const avgCommission = 12.4;
  const totalClients = 14872;

  const kpis = [
    {
      label: 'MRR Plateforme', value: `${totalMRR.toLocaleString('fr-FR')} €`,
      sub: '+18% vs mois dernier', icon: Euro, iconBg: 'bg-brand-50', iconColor: 'text-brand-600',
    },
    {
      label: 'Restaurants actifs', value: String(activeRestaurants),
      sub: `${PLATFORM_RESTAURANTS.length} total`, icon: Building2, iconBg: 'bg-green-50', iconColor: 'text-green-600',
    },
    {
      label: 'Clients totaux', value: totalClients.toLocaleString('fr-FR'),
      sub: '+234 ce mois', icon: Users, iconBg: 'bg-blue-50', iconColor: 'text-blue-600',
    },
    {
      label: 'Commission moy.', value: `${avgCommission}%`,
      sub: 'Par commande livrée', icon: Percent, iconBg: 'bg-purple-50', iconColor: 'text-purple-600',
    },
  ];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Tableau de bord Super Admin — FoodStack</h1>
          <p className="mt-1 text-sm text-surface-500">
            Vue globale de la plateforme · {new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-xl bg-brand-50 px-4 py-2">
          <span className="h-2 w-2 animate-pulse rounded-full bg-brand-500" />
          <span className="text-sm font-medium text-brand-700">Plateforme en ligne</span>
        </div>
      </div>

      {/* Platform KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <motion.div key={kpi.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
              <Card padding="lg" className="hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-surface-500">{kpi.label}</p>
                    <p className="mt-2 text-2xl font-bold text-surface-900">{kpi.value}</p>
                    <p className="mt-1 text-xs text-surface-400">{kpi.sub}</p>
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

      {/* 12-month MRR chart */}
      <Card padding="none">
        <CardHeader className="border-b border-surface-100 px-6 py-5">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-brand-500" />
            <CardTitle>Évolution du MRR — 12 derniers mois</CardTitle>
          </div>
        </CardHeader>
        <div className="px-4 py-6">
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={PLATFORM_MRR_DATA} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="mrrGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#1EFF6A" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#1EFF6A" stopOpacity={0}    />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}k€`} />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 13 }}
                formatter={(v: number) => [`${v.toLocaleString('fr-FR')} €`, 'MRR']}
              />
              <Area type="monotone" dataKey="mrr" stroke="#1EFF6A" strokeWidth={2.5} fill="url(#mrrGrad)" dot={false} activeDot={{ r: 5, fill: '#1EFF6A' }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Recent restaurant clients table */}
      <Card padding="none">
        <CardHeader className="border-b border-surface-100 px-6 py-5">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-brand-500" />
            <CardTitle>Derniers restaurants clients</CardTitle>
          </div>
          <span className="text-sm text-surface-400">5 plus récents</span>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-100 text-left">
                {['Restaurant', 'Plan', 'MRR', 'Statut', 'Rejoint'].map(h => (
                  <th key={h} className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-surface-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-50">
              {PLATFORM_RESTAURANTS.map(r => (
                <tr key={r.id} className="hover:bg-surface-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-surface-900">{r.name}</td>
                  <td className="px-6 py-4">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${PLAN_COLORS[r.plan] ?? 'bg-gray-100 text-gray-700'}`}>
                      {r.plan}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-semibold text-surface-900">{r.mrr} €</td>
                  <td className="px-6 py-4">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_COLORS[r.status] ?? 'bg-gray-100 text-gray-700'}`}>
                      {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-surface-500">
                    {new Date(r.joined).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ── Restaurant Dashboard ──────────────────────────────────────────────────────

function RestaurantDashboard() {
  const [ordersCount,    incOrders   ] = useCounter(BASE_STATS.orders);
  const [revenue,        incRevenue  ] = useCounter(BASE_STATS.revenue);
  const [deliveriesCount,incDeliveries] = useCounter(BASE_STATS.deliveries);
  const [feedEvents, setFeedEvents]    = useState<FeedEvent[]>([]);
  const [liveOrders, setLiveOrders]    = useState(LIVE_ORDERS_INIT);
  const pushEvent = useCallback((ev: FeedEvent) => {
    setFeedEvents((prev) => [ev, ...prev].slice(0, 30));
  }, []);

  // ── Socket hooks ────────────────────────────────────────────────────────────
  useRealtimeOrders({
    restaurantId: 'r1',
    onOrderCreated: useCallback((e: OrderEvent) => {
      incOrders();
      incRevenue(Math.round(e.total ?? 0));
      setLiveOrders((prev) => [
        { id: e.orderNumber, customer: 'Nouveau client', items: e.itemCount ?? 1, total: e.total ?? 0, status: 'confirmed', time: 'À l\'instant' },
        ...prev.slice(0, 3),
      ]);
      pushEvent(makeEvent('order_new', `Nouvelle commande ${e.orderNumber}`, `${e.itemCount} articles · ${e.total?.toFixed(2)}€`));
    }, [incOrders, incRevenue, pushEvent]),
    onStatusUpdated: useCallback((e: OrderEvent) => {
      if (e.status === 'delivering') incDeliveries();
      setLiveOrders((prev) => prev.map((o) => o.id === e.orderNumber ? { ...o, status: e.status } : o));
      pushEvent(makeEvent('order_status', `${e.orderNumber} → ${statusConfig[e.status as keyof typeof statusConfig]?.label ?? e.status}`));
    }, [incDeliveries, pushEvent]),
    showToasts: false,
  });

  useRealtimeInventory({
    restaurantId: 'r1',
    onLowStock: useCallback((e: InventoryEvent) => {
      pushEvent(makeEvent('inventory_low', `Stock bas : ${e.name}`, `${e.currentStock} restant (min. ${e.minStock})`));
    }, [pushEvent]),
  });

  const pageRef = useGSAPReveal('.gsap-card');

  const stats = [
    {
      title: "Chiffre d'affaires", value: `${revenue.toLocaleString('fr-FR')}€`,
      change: 12.5, icon: Euro,     iconColor: 'text-green-600 dark:text-green-400',  iconBg: 'bg-green-50 dark:bg-green-900/20',
    },
    {
      title: "Commandes aujourd'hui", value: String(ordersCount),
      change: 8.2,  icon: ShoppingBag, iconColor: 'text-brand-600 dark:text-brand-400', iconBg: 'bg-brand-50 dark:bg-brand-900/20',
    },
    {
      title: 'Livraisons actives', value: String(deliveriesCount),
      icon: Truck, iconColor: 'text-purple-600 dark:text-purple-400', iconBg: 'bg-purple-50 dark:bg-purple-900/20',
    },
    {
      title: 'Panier moyen', value: `${BASE_STATS.avgOrder.toFixed(2)}€`,
      change: 3.1, icon: TrendingUp, iconColor: 'text-blue-600 dark:text-blue-400', iconBg: 'bg-blue-50 dark:bg-blue-900/20',
    },
  ];

  const kpis = [
    { label: 'Note moy.',   value: `${BASE_STATS.rating}/5`, icon: Star,  color: 'text-yellow-600' },
    { label: 'Taux annul.', value: `${BASE_STATS.cancelRate}%`, icon: Zap, color: 'text-red-500' },
    { label: 'Temps prép.', value: `${BASE_STATS.prepTime} min`, icon: Clock, color: 'text-brand-600' },
    { label: 'Nouveaux clients', value: String(BASE_STATS.customers), icon: Users, color: 'text-green-600' },
  ];

  return (
    <div ref={pageRef} className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Tableau de bord</h1>
          <p className="mt-1 text-sm text-surface-500">
            {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-xl bg-green-50 dark:bg-green-900/20 px-4 py-2">
          <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
          <span className="text-sm font-medium text-green-700 dark:text-green-400">Restaurant ouvert</span>
        </div>
      </div>

      {/* Main KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.title} className="gsap-card">
              <Card padding="lg" className="hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-surface-500">{stat.title}</p>
                    <p className="mt-2 text-2xl font-bold text-surface-900">{stat.value}</p>
                    {stat.change != null && (
                      <p className={`mt-1 flex items-center gap-1 text-xs font-medium ${
                        stat.change >= 0 ? 'text-green-600' : 'text-red-500'
                      }`}>
                        <TrendingUp className="h-3 w-3" />
                        {stat.change >= 0 ? '+' : ''}{stat.change}% vs hier
                      </p>
                    )}
                  </div>
                  <div className={`rounded-xl p-2.5 ${stat.iconBg}`}>
                    <Icon className={`h-5 w-5 ${stat.iconColor}`} />
                  </div>
                </div>
              </Card>
            </div>
          );
        })}
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Card key={kpi.label} padding="md" className="gsap-card flex items-center gap-3">
              <div className="rounded-lg bg-surface-100 p-2">
                <Icon className={`h-4 w-4 ${kpi.color}`} />
              </div>
              <div>
                <p className="text-xs text-surface-400">{kpi.label}</p>
                <p className="text-base font-bold text-surface-900">{kpi.value}</p>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Revenue chart + Live feed */}
      <div className="grid gap-6 xl:grid-cols-[2fr,1fr]">
        <RevenueChart extraRevenue={revenue - BASE_STATS.revenue} />
        <LiveFeed events={feedEvents} />
      </div>

      {/* Hourly chart + Top items */}
      <div className="grid gap-6 xl:grid-cols-[1fr,1fr]">
        <HourlyChart liveOrderCount={ordersCount - BASE_STATS.orders} />
        <TopItems />
      </div>

      {/* Live orders */}
      <Card padding="none">
        <CardHeader className="border-b border-surface-100 px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-brand-500" />
              <CardTitle>Commandes en cours</CardTitle>
            </div>
            <a href="/dashboard/orders" className="flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700">
              Kanban <ArrowUpRight className="h-4 w-4" />
            </a>
          </div>
        </CardHeader>
        <div className="divide-y divide-surface-100">
          {liveOrders.map((order) => {
            const status = statusConfig[order.status as keyof typeof statusConfig];
            return (
              <motion.div
                key={order.id}
                layout
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center justify-between px-6 py-4 hover:bg-surface-50"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-100">
                    <ShoppingBag className="h-5 w-5 text-surface-500" />
                  </div>
                  <div>
                    <p className="font-medium text-surface-900">{order.id}</p>
                    <p className="text-sm text-surface-500">{order.customer} · {order.items} article{order.items !== 1 ? 's' : ''}</p>
                  </div>
                </div>
                <div className="hidden items-center gap-4 sm:flex">
                  <Badge variant={status?.variant ?? 'default'} dot>{status?.label ?? order.status}</Badge>
                  <div className="text-right">
                    <p className="font-semibold text-surface-900">{order.total.toFixed(2)}€</p>
                    <p className="text-xs text-surface-400">{order.time}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </Card>

      {/* Bottom row */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Loyalty tiers */}
        <Card padding="lg">
          <CardHeader>
            <CardTitle>Programme Fidélité</CardTitle>
          </CardHeader>
          <div className="space-y-4">
            {[
              { tier: 'Bronze',   customers: 234, points: '0–499',   color: 'bg-amber-700', pct: 64 },
              { tier: 'Silver',   customers: 89,  points: '500–999',  color: 'bg-slate-400', pct: 24 },
              { tier: 'Gold',     customers: 34,  points: '1000–2499',color: 'bg-yellow-500',pct: 9 },
              { tier: 'Platinum', customers: 12,  points: '2500+',    color: 'bg-purple-500',pct: 3 },
            ].map((tier) => (
              <div key={tier.tier}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className={`h-2.5 w-2.5 rounded-full ${tier.color}`} />
                    <span className="font-medium text-surface-700">{tier.tier}</span>
                    <span className="text-surface-400">{tier.points} pts</span>
                  </div>
                  <span className="font-semibold text-surface-900">{tier.customers}</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-surface-100">
                  <div className={`h-full rounded-full ${tier.color} opacity-80 transition-all`} style={{ width: `${tier.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center gap-1 text-xs text-surface-500">
            <Star className="h-3.5 w-3.5 text-brand-500" />
            <span>369 clients actifs dans le programme</span>
          </div>
        </Card>

        {/* Performance recap */}
        <Card padding="lg">
          <CardHeader>
            <CardTitle>Performance du jour</CardTitle>
          </CardHeader>
          <div className="space-y-3">
            {[
              { label: 'Commandes livrées à temps', value: '94%',   bar: 94, color: 'bg-green-500' },
              { label: 'Satisfaction client',        value: '4.8/5', bar: 96, color: 'bg-yellow-400' },
              { label: 'Taux de complétion',         value: '97.7%', bar: 97, color: 'bg-brand-500' },
              { label: 'Taux d\'annulation',         value: `${BASE_STATS.cancelRate}%`, bar: 100 - BASE_STATS.cancelRate * 10, color: 'bg-red-400' },
            ].map((item) => (
              <div key={item.label}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="text-surface-600">{item.label}</span>
                  <span className="font-semibold text-surface-900">{item.value}</span>
                </div>
                <div className="h-2 w-full rounded-full bg-surface-100">
                  <div className={`h-full rounded-full ${item.color} transition-all`} style={{ width: `${item.bar}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

// ── Cookie parser ─────────────────────────────────────────────────────────────

function parseCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const val = parseCookie('fs_demo');
    setRole(val ?? 'restaurant');
  }, []);

  if (role === null) {
    // Waiting for cookie parse — render nothing or a skeleton
    return <div className="p-6 text-surface-400 text-sm">Chargement…</div>;
  }

  if (role === 'admin') {
    return <SuperAdminDashboard />;
  }

  return <RestaurantDashboard />;
}
