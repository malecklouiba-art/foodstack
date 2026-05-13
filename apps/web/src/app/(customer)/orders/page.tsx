'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Package,
  ChevronRight,
  Search,
  Clock,
  CheckCircle2,
  XCircle,
  Bike,
  UtensilsCrossed,
  RefreshCw,
  ShoppingBag,
} from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

type OrderStatus = 'confirmed' | 'preparing' | 'ready' | 'delivering' | 'delivered' | 'cancelled';

interface PastOrder {
  id: string;
  orderNumber: string;
  restaurantName: string;
  restaurantEmoji: string;
  items: string[];
  total: number;
  status: OrderStatus;
  type: 'delivery' | 'pickup' | 'dine_in';
  date: string;
  canReorder: boolean;
  canTrack: boolean;
}

const STATUS_CONFIG: Record<OrderStatus, { label: string; variant: 'info' | 'warning' | 'brand' | 'success' | 'danger' | 'default'; icon: React.ElementType }> = {
  confirmed: { label: 'Confirmée', variant: 'info', icon: CheckCircle2 },
  preparing: { label: 'En préparation', variant: 'warning', icon: UtensilsCrossed },
  ready: { label: 'Prête', variant: 'brand', icon: Package },
  delivering: { label: 'En livraison', variant: 'info', icon: Bike },
  delivered: { label: 'Livrée', variant: 'success', icon: CheckCircle2 },
  cancelled: { label: 'Annulée', variant: 'danger', icon: XCircle },
};

const ORDERS: PastOrder[] = [
  {
    id: 'ord-1', orderNumber: 'ORD-8821', restaurantName: 'FoodStack Montmartre', restaurantEmoji: '🍔',
    items: ['Classic Burger x2', 'Frites x2', 'Limonade x1'],
    total: 42.50, status: 'delivering', type: 'delivery',
    date: "Aujourd'hui, 14:23", canReorder: true, canTrack: true,
  },
  {
    id: 'ord-2', orderNumber: 'ORD-8805', restaurantName: 'FoodStack Montmartre', restaurantEmoji: '🍔',
    items: ['Truffle Burger x1', 'Tiramisu x2'],
    total: 37.00, status: 'delivered', type: 'delivery',
    date: 'Hier, 19:45', canReorder: true, canTrack: false,
  },
  {
    id: 'ord-3', orderNumber: 'ORD-8782', restaurantName: 'FoodStack République', restaurantEmoji: '🍕',
    items: ['Margherita x2', 'Diavola x1', 'Fondant Chocolat x3'],
    total: 68.40, status: 'delivered', type: 'pickup',
    date: '10 mai, 12:30', canReorder: true, canTrack: false,
  },
  {
    id: 'ord-4', orderNumber: 'ORD-8740', restaurantName: 'FoodStack Montmartre', restaurantEmoji: '🍔',
    items: ['Chicken Burger x3'],
    total: 42.17, status: 'cancelled', type: 'delivery',
    date: '5 mai, 20:15', canReorder: true, canTrack: false,
  },
  {
    id: 'ord-5', orderNumber: 'ORD-8701', restaurantName: 'FoodStack République', restaurantEmoji: '🍕',
    items: ['Margherita x1', 'Limonade x2'],
    total: 23.70, status: 'delivered', type: 'dine_in',
    date: '2 mai, 13:00', canReorder: false, canTrack: false,
  },
];

const FILTERS: { label: string; value: 'all' | OrderStatus }[] = [
  { label: 'Toutes', value: 'all' },
  { label: 'En cours', value: 'delivering' },
  { label: 'Livrées', value: 'delivered' },
  { label: 'Annulées', value: 'cancelled' },
];

const TYPE_LABELS = { delivery: '🛵 Livraison', pickup: '🏪 À emporter', dine_in: '🪑 Sur place' };

export default function OrdersHistoryPage() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | OrderStatus>('all');

  const activeOrder = ORDERS.find((o) => ['confirmed', 'preparing', 'ready', 'delivering'].includes(o.status));

  const filtered = ORDERS.filter((o) => {
    const matchFilter = filter === 'all' || o.status === filter ||
      (filter === 'delivering' && ['confirmed', 'preparing', 'ready', 'delivering'].includes(o.status));
    const matchSearch = !search || o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      o.items.some((i) => i.toLowerCase().includes(search.toLowerCase()));
    return matchFilter && matchSearch;
  });

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-surface-50 py-8">
        <div className="mx-auto max-w-2xl px-4 sm:px-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-surface-900">Mes commandes</h1>
            <p className="mt-1 text-sm text-surface-500">{ORDERS.length} commandes au total</p>
          </div>

          {/* Active order banner */}
          {activeOrder && (
            <Link href={`/orders/${activeOrder.id}/track`}>
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 flex items-center gap-4 rounded-2xl bg-brand-500 p-4 shadow-brand"
              >
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-white/20 text-2xl">
                  {activeOrder.restaurantEmoji}
                </div>
                <div className="flex-1 text-white">
                  <div className="flex items-center gap-2">
                    <motion.span
                      animate={{ opacity: [1, 0.3, 1] }}
                      transition={{ duration: 1.2, repeat: Infinity }}
                      className="h-2 w-2 rounded-full bg-white"
                    />
                    <p className="text-sm font-semibold">{STATUS_CONFIG[activeOrder.status].label}</p>
                  </div>
                  <p className="text-sm text-white/80">{activeOrder.restaurantName} · {activeOrder.items[0]}{activeOrder.items.length > 1 ? ` +${activeOrder.items.length - 1}` : ''}</p>
                </div>
                <ChevronRight className="h-5 w-5 text-white/70" />
              </motion.div>
            </Link>
          )}

          {/* Search + filters */}
          <div className="mb-4 space-y-3">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher dans mes commandes..."
                className="h-11 w-full rounded-2xl border border-surface-200 bg-white pl-10 pr-4 text-sm text-surface-900 placeholder:text-surface-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100 shadow-sm"
              />
            </div>
            <div className="flex gap-2">
              {FILTERS.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setFilter(f.value)}
                  className={`rounded-xl border px-3 py-2 text-sm font-medium transition-colors ${
                    filter === f.value
                      ? 'border-brand-500 bg-brand-50 text-brand-700'
                      : 'border-surface-200 bg-white text-surface-600 hover:border-surface-300'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Orders list */}
          <div className="space-y-3">
            {filtered.length === 0 ? (
              <div className="py-16 text-center">
                <div className="mb-3 flex justify-center text-5xl">
                  <ShoppingBag className="h-14 w-14 text-surface-200" />
                </div>
                <p className="font-semibold text-surface-600">Aucune commande trouvée</p>
                <p className="mt-1 text-sm text-surface-400">
                  {search ? 'Essayez un autre terme de recherche' : "Vous n'avez pas encore passé de commande"}
                </p>
                <Link href="/menu">
                  <Button className="mt-4" size="sm">Commander maintenant</Button>
                </Link>
              </div>
            ) : (
              filtered.map((order, i) => {
                const statusConf = STATUS_CONFIG[order.status];
                const StatusIcon = statusConf.icon;
                const isActive = ['confirmed', 'preparing', 'ready', 'delivering'].includes(order.status);

                return (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="rounded-2xl border border-surface-200 bg-white p-4 shadow-sm"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-surface-100 text-2xl">
                        {order.restaurantEmoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <p className="font-semibold text-surface-900">{order.restaurantName}</p>
                            <p className="text-xs text-surface-400">{order.orderNumber} · {TYPE_LABELS[order.type]}</p>
                          </div>
                          <Badge variant={statusConf.variant} dot size="sm">
                            {statusConf.label}
                          </Badge>
                        </div>

                        <p className="mt-2 text-sm text-surface-600 truncate">
                          {order.items.join(' · ')}
                        </p>

                        <div className="mt-3 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-bold text-surface-900">{order.total.toFixed(2)} €</span>
                            <span className="flex items-center gap-1 text-xs text-surface-400">
                              <Clock className="h-3.5 w-3.5" />
                              {order.date}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            {isActive && order.canTrack && (
                              <Link href={`/orders/${order.id}/track`}>
                                <Button size="sm" variant="primary" icon={<StatusIcon className="h-3.5 w-3.5" />}>
                                  Suivre
                                </Button>
                              </Link>
                            )}
                            {order.canReorder && !isActive && (
                              <Button
                                size="sm"
                                variant="ghost"
                                icon={<RefreshCw className="h-3.5 w-3.5" />}
                              >
                                Recommander
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </>
  );
}
