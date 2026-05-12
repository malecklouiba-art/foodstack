import {
  ShoppingBag,
  TrendingUp,
  Users,
  Euro,
  Truck,
  Star,
  ArrowUpRight,
  Clock,
} from 'lucide-react';
import { StatCard } from '@/components/ui/StatCard';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { RevenueChart } from '@/components/dashboard/RevenueChart';
import { RecentOrders } from '@/components/dashboard/RecentOrders';
import { TopItems } from '@/components/dashboard/TopItems';

export const metadata = { title: 'Tableau de bord' };

const stats = [
  {
    title: 'Chiffre d\'affaires',
    value: '12 450€',
    change: 12.5,
    changeLabel: 'vs semaine dernière',
    icon: Euro,
    iconColor: 'text-green-600',
    iconBg: 'bg-green-50',
  },
  {
    title: "Commandes aujourd'hui",
    value: '84',
    change: 8.2,
    changeLabel: 'vs hier',
    icon: ShoppingBag,
    iconColor: 'text-brand-600',
    iconBg: 'bg-brand-50',
  },
  {
    title: 'Nouveaux clients',
    value: '23',
    change: 15.3,
    changeLabel: 'vs semaine dernière',
    icon: Users,
    iconColor: 'text-blue-600',
    iconBg: 'bg-blue-50',
  },
  {
    title: 'Livraisons actives',
    value: '7',
    icon: Truck,
    iconColor: 'text-purple-600',
    iconBg: 'bg-purple-50',
  },
];

const liveOrders = [
  { id: 'ORD-8821', customer: 'Marie L.', items: 3, total: 42.50, status: 'preparing', time: '12 min' },
  { id: 'ORD-8820', customer: 'Pierre D.', items: 2, total: 28.90, status: 'delivering', time: '8 min' },
  { id: 'ORD-8819', customer: 'Sophie M.', items: 5, total: 67.30, status: 'ready', time: '3 min' },
  { id: 'ORD-8818', customer: 'Julien K.', items: 1, total: 16.90, status: 'confirmed', time: '18 min' },
];

const statusConfig = {
  confirmed: { label: 'Confirmée', variant: 'info' as const },
  preparing: { label: 'En préparation', variant: 'warning' as const },
  ready: { label: 'Prête', variant: 'brand' as const },
  delivering: { label: 'En livraison', variant: 'success' as const },
  delivered: { label: 'Livrée', variant: 'success' as const },
  cancelled: { label: 'Annulée', variant: 'danger' as const },
};

export default function DashboardPage() {
  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Tableau de bord</h1>
          <p className="mt-1 text-sm text-surface-500">
            Lundi 11 mai 2026 · Mis à jour il y a 2 min
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-xl bg-green-50 px-4 py-2">
          <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
          <span className="text-sm font-medium text-green-700">Restaurant ouvert</span>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-6 xl:grid-cols-[2fr,1fr]">
        <RevenueChart />
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
              Tout voir <ArrowUpRight className="h-4 w-4" />
            </a>
          </div>
        </CardHeader>
        <div className="divide-y divide-surface-100">
          {liveOrders.map((order) => {
            const status = statusConfig[order.status as keyof typeof statusConfig];
            return (
              <div key={order.id} className="flex items-center justify-between px-6 py-4 hover:bg-surface-50">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-100">
                    <ShoppingBag className="h-5 w-5 text-surface-500" />
                  </div>
                  <div>
                    <p className="font-medium text-surface-900">{order.id}</p>
                    <p className="text-sm text-surface-500">{order.customer} · {order.items} articles</p>
                  </div>
                </div>
                <div className="hidden items-center gap-4 sm:flex">
                  <Badge variant={status.variant} dot>{status.label}</Badge>
                  <div className="text-right">
                    <p className="font-semibold text-surface-900">{order.total.toFixed(2)}€</p>
                    <p className="text-xs text-surface-400">Il y a {order.time}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Bottom row */}
      <div className="grid gap-6 md:grid-cols-2">
        <RecentOrders />
        <Card padding="lg">
          <CardHeader>
            <CardTitle>Programme Fidélité</CardTitle>
          </CardHeader>
          <div className="space-y-4">
            {[
              { tier: 'Bronze', customers: 234, points: '0–499', color: 'bg-amber-700' },
              { tier: 'Silver', customers: 89, points: '500–999', color: 'bg-slate-400' },
              { tier: 'Gold', customers: 34, points: '1000–2499', color: 'bg-yellow-500' },
              { tier: 'Platinum', customers: 12, points: '2500+', color: 'bg-purple-500' },
            ].map((tier) => (
              <div key={tier.tier} className="flex items-center gap-3">
                <div className={`h-3 w-3 rounded-full ${tier.color}`} />
                <span className="flex-1 text-sm text-surface-700">{tier.tier}</span>
                <span className="text-xs text-surface-400">{tier.points} pts</span>
                <span className="w-12 text-right text-sm font-semibold text-surface-900">{tier.customers}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center gap-1 text-xs text-surface-500">
            <Star className="h-3.5 w-3.5 text-brand-500" />
            <span>369 clients actifs dans le programme</span>
          </div>
        </Card>
      </div>
    </div>
  );
}
