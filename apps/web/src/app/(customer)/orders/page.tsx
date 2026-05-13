'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ShoppingBag, ChevronRight, Search, Filter,
  MapPin, Clock, Star, RotateCcw, Eye,
  CheckCircle2, Truck, XCircle, AlertCircle,
  CreditCard, Smartphone, Coins,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import type { Order, OrderStatus } from '@foodstack/shared';

// ── Mock data ──────────────────────────────────────────────────────────────
const ORDERS: Order[] = [
  {
    id: 'o1', orderNumber: 'ORD-8821', restaurantId: 'r1', customerId: 'u1',
    type: 'delivery', status: 'delivered', paymentStatus: 'paid', paymentMethod: 'card',
    items: [
      { id: 'oi1', menuItemId: 'i1', name: 'Classic Burger', price: 14.90, quantity: 2, modifiers: [], subtotal: 29.80 },
      { id: 'oi2', menuItemId: 'i3', name: 'Frites maison', price: 4.50, quantity: 2, modifiers: [], subtotal: 9.00 },
    ],
    deliveryAddress: { street: '12 rue de la Paix', city: 'Paris', postalCode: '75001', country: 'FR' },
    subtotal: 38.80, deliveryFee: 2.90, tax: 3.88, discount: 0,
    loyaltyPointsUsed: 0, loyaltyPointsEarned: 39, total: 45.58,
    createdAt: new Date('2026-05-11T14:23:00'), updatedAt: new Date('2026-05-11T15:01:00'),
    actualDeliveryTime: new Date('2026-05-11T15:01:00'),
  },
  {
    id: 'o2', orderNumber: 'ORD-8790', restaurantId: 'r1', customerId: 'u1',
    type: 'delivery', status: 'delivered', paymentStatus: 'paid', paymentMethod: 'apple_pay',
    items: [
      { id: 'oi3', menuItemId: 'i5', name: 'Margherita', price: 13.90, quantity: 1, modifiers: [], subtotal: 13.90 },
      { id: 'oi4', menuItemId: 'i8', name: 'Tiramisu', price: 7.50, quantity: 2, modifiers: [], subtotal: 15.00 },
    ],
    deliveryAddress: { street: '12 rue de la Paix', city: 'Paris', postalCode: '75001', country: 'FR' },
    subtotal: 28.90, deliveryFee: 2.90, tax: 2.89, discount: 0,
    loyaltyPointsUsed: 0, loyaltyPointsEarned: 29, total: 34.69,
    createdAt: new Date('2026-05-08T19:45:00'), updatedAt: new Date('2026-05-08T20:28:00'),
    actualDeliveryTime: new Date('2026-05-08T20:28:00'),
  },
  {
    id: 'o3', orderNumber: 'ORD-8754', restaurantId: 'r1', customerId: 'u1',
    type: 'pickup', status: 'delivered', paymentStatus: 'paid', paymentMethod: 'card',
    items: [
      { id: 'oi5', menuItemId: 'i2', name: 'Truffle Burger', price: 22.50, quantity: 1, modifiers: [], subtotal: 22.50 },
    ],
    subtotal: 22.50, deliveryFee: 0, tax: 2.25, discount: 2.00,
    loyaltyPointsUsed: 200, loyaltyPointsEarned: 20, total: 22.75,
    createdAt: new Date('2026-05-03T12:10:00'), updatedAt: new Date('2026-05-03T12:35:00'),
  },
  {
    id: 'o4', orderNumber: 'ORD-8720', restaurantId: 'r1', customerId: 'u1',
    type: 'delivery', status: 'cancelled', paymentStatus: 'refunded', paymentMethod: 'card',
    items: [
      { id: 'oi6', menuItemId: 'i6', name: 'Diavola', price: 15.90, quantity: 2, modifiers: [], subtotal: 31.80 },
    ],
    deliveryAddress: { street: '12 rue de la Paix', city: 'Paris', postalCode: '75001', country: 'FR' },
    subtotal: 31.80, deliveryFee: 2.90, tax: 3.18, discount: 0,
    loyaltyPointsUsed: 0, loyaltyPointsEarned: 0, total: 37.88,
    createdAt: new Date('2026-04-28T20:05:00'), updatedAt: new Date('2026-04-28T20:12:00'),
  },
  {
    id: 'o5', orderNumber: 'ORD-8695', restaurantId: 'r1', customerId: 'u1',
    type: 'delivery', status: 'delivered', paymentStatus: 'paid', paymentMethod: 'google_pay',
    items: [
      { id: 'oi7', menuItemId: 'i7', name: 'Salade César', price: 12.50, quantity: 2, modifiers: [], subtotal: 25.00 },
      { id: 'oi8', menuItemId: 'i8', name: 'Tiramisu', price: 7.50, quantity: 1, modifiers: [], subtotal: 7.50 },
    ],
    deliveryAddress: { street: '12 rue de la Paix', city: 'Paris', postalCode: '75001', country: 'FR' },
    subtotal: 32.50, deliveryFee: 2.90, tax: 3.25, discount: 0,
    loyaltyPointsUsed: 0, loyaltyPointsEarned: 33, total: 38.65,
    createdAt: new Date('2026-04-20T13:15:00'), updatedAt: new Date('2026-04-20T14:00:00'),
    actualDeliveryTime: new Date('2026-04-20T14:00:00'),
  },
];

const STATUS_CONFIG: Record<OrderStatus, { label: string; variant: 'success' | 'warning' | 'brand' | 'info' | 'danger' | 'default'; icon: React.ElementType }> = {
  pending:    { label: 'En attente',      variant: 'default',  icon: Clock },
  confirmed:  { label: 'Confirmée',       variant: 'info',     icon: CheckCircle2 },
  preparing:  { label: 'En préparation',  variant: 'warning',  icon: Clock },
  ready:      { label: 'Prête',           variant: 'brand',    icon: CheckCircle2 },
  delivering: { label: 'En livraison',    variant: 'info',     icon: Truck },
  delivered:  { label: 'Livrée',          variant: 'success',  icon: CheckCircle2 },
  cancelled:  { label: 'Annulée',         variant: 'danger',   icon: XCircle },
  refunded:   { label: 'Remboursée',      variant: 'default',  icon: AlertCircle },
};

const PAYMENT_ICONS: Record<string, React.ElementType> = {
  card: CreditCard, apple_pay: Smartphone, google_pay: Smartphone, loyalty_points: Coins, cash: Coins,
};

const TYPE_LABELS: Record<string, string> = {
  delivery: '🛵 Livraison', pickup: '🏪 À emporter', dine_in: '🪑 Sur place',
};

function formatDate(d: Date) {
  return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }).format(d);
}

function formatTime(d: Date) {
  return new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' }).format(d);
}

type FilterStatus = OrderStatus | 'all';

export default function OrdersPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [selected, setSelected] = useState<Order | null>(null);
  const [rated, setRated] = useState<Record<string, number>>({});

  const filtered = ORDERS.filter((o) => {
    const matchSearch = !search || o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      o.items.some((i) => i.name.toLowerCase().includes(search.toLowerCase()));
    const matchStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const total = ORDERS.reduce((sum, o) => sum + (o.status !== 'cancelled' ? o.total : 0), 0);
  const points = ORDERS.reduce((sum, o) => sum + o.loyaltyPointsEarned, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-5 sm:px-6">
        <div className="mx-auto max-w-3xl">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-gray-400 hover:text-gray-600 transition-colors">
              <ShoppingBag className="h-5 w-5" />
            </Link>
            <ChevronRight className="h-4 w-4 text-gray-300" />
            <h1 className="text-lg font-bold text-gray-900">Mes commandes</h1>
          </div>

          {/* Summary strip */}
          <div className="mt-4 grid grid-cols-3 gap-3">
            {[
              { label: 'Commandes', value: ORDERS.length.toString() },
              { label: 'Total dépensé', value: `${total.toFixed(0)}€` },
              { label: 'Points gagnés', value: `${points} pts` },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl bg-orange-50 px-4 py-3 text-center">
                <p className="text-lg font-bold text-orange-600">{s.value}</p>
                <p className="text-xs text-orange-500">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 space-y-4">
        {/* Filters */}
        <div className="flex gap-3">
          <Input
            placeholder="Rechercher…"
            leftIcon={<Search className="h-4 w-4" />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1"
          />
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as FilterStatus)}
              className="h-10 appearance-none rounded-xl border border-surface-200 bg-white pl-9 pr-4 text-sm text-surface-700 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            >
              <option value="all">Tous les statuts</option>
              {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
            <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
          </div>
        </div>

        {/* List */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
            <ShoppingBag className="h-12 w-12 text-gray-200" />
            <p className="font-medium text-gray-500">Aucune commande trouvée</p>
          </div>
        ) : (
          <AnimatePresence>
            {filtered.map((order, idx) => {
              const status = STATUS_CONFIG[order.status];
              const StatusIcon = status.icon;
              const PayIcon = PAYMENT_ICONS[order.paymentMethod] ?? CreditCard;
              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Card padding="none" hover onClick={() => setSelected(order)} className="overflow-hidden">
                    {/* Top bar */}
                    <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-semibold text-gray-900">{order.orderNumber}</span>
                        <span className="text-xs text-gray-400">{TYPE_LABELS[order.type]}</span>
                      </div>
                      <Badge variant={status.variant} dot>{status.label}</Badge>
                    </div>

                    <div className="px-5 py-4">
                      {/* Items */}
                      <p className="text-sm text-gray-700 line-clamp-1">
                        {order.items.map((i) => `${i.name} ×${i.quantity}`).join(' · ')}
                      </p>

                      <div className="mt-3 flex items-center justify-between">
                        <div className="flex items-center gap-3 text-xs text-gray-400">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {formatDate(order.createdAt)} à {formatTime(order.createdAt)}
                          </span>
                          {order.deliveryAddress && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5" />
                              {order.deliveryAddress.city}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <PayIcon className="h-3.5 w-3.5" />
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          {order.loyaltyPointsEarned > 0 && (
                            <span className="text-xs font-medium text-orange-500">+{order.loyaltyPointsEarned} pts</span>
                          )}
                          <span className="font-bold text-gray-900">{order.total.toFixed(2)}€</span>
                          <ChevronRight className="h-4 w-4 text-gray-300" />
                        </div>
                      </div>

                      {/* Rating row for delivered */}
                      {order.status === 'delivered' && (
                        <div className="mt-3 flex items-center gap-3 border-t border-gray-100 pt-3">
                          <span className="text-xs text-gray-500">Votre note :</span>
                          <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                onClick={(e) => { e.stopPropagation(); setRated((r) => ({ ...r, [order.id]: star })); }}
                                className="transition-transform hover:scale-110"
                              >
                                <Star className={`h-4 w-4 ${star <= (rated[order.id] ?? 0) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`} />
                              </button>
                            ))}
                          </div>
                          {rated[order.id] && <span className="text-xs text-green-600 font-medium">Merci !</span>}
                          <div className="ml-auto">
                            <Button size="sm" variant="ghost" icon={<RotateCcw className="h-3.5 w-3.5" />}>
                              Recommander
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      {/* Detail modal */}
      <Modal open={!!selected} onClose={() => setSelected(null)} title={`Commande ${selected?.orderNumber}`} size="lg">
        {selected && (
          <div className="space-y-5">
            <div className="flex items-center gap-2">
              <Badge variant={STATUS_CONFIG[selected.status].variant} dot>
                {STATUS_CONFIG[selected.status].label}
              </Badge>
              <span className="text-sm text-gray-500">{TYPE_LABELS[selected.type]}</span>
              <span className="ml-auto text-xs text-gray-400">
                {formatDate(selected.createdAt)} à {formatTime(selected.createdAt)}
              </span>
            </div>

            {/* Items */}
            <div className="rounded-2xl border border-gray-100 divide-y divide-gray-100 overflow-hidden">
              {selected.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{item.name}</p>
                    {item.modifiers.length > 0 && (
                      <p className="text-xs text-gray-400">{item.modifiers.map((m) => m.name).join(', ')}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">{item.subtotal.toFixed(2)}€</p>
                    <p className="text-xs text-gray-400">×{item.quantity} · {item.price.toFixed(2)}€</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Price breakdown */}
            <div className="space-y-1.5 rounded-2xl bg-gray-50 px-4 py-3 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Sous-total</span><span>{selected.subtotal.toFixed(2)}€</span>
              </div>
              {selected.deliveryFee > 0 && (
                <div className="flex justify-between text-gray-600">
                  <span>Livraison</span><span>{selected.deliveryFee.toFixed(2)}€</span>
                </div>
              )}
              <div className="flex justify-between text-gray-600">
                <span>TVA</span><span>{selected.tax.toFixed(2)}€</span>
              </div>
              {selected.discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Réduction</span><span>-{selected.discount.toFixed(2)}€</span>
                </div>
              )}
              {selected.loyaltyPointsUsed > 0 && (
                <div className="flex justify-between text-orange-500">
                  <span>Points utilisés</span><span>-{(selected.loyaltyPointsUsed / 100).toFixed(2)}€</span>
                </div>
              )}
              <div className="flex justify-between border-t border-gray-200 pt-1.5 font-bold text-gray-900">
                <span>Total</span><span>{selected.total.toFixed(2)}€</span>
              </div>
            </div>

            {/* Delivery address */}
            {selected.deliveryAddress && (
              <div className="flex items-start gap-3 rounded-2xl border border-gray-100 p-4">
                <MapPin className="h-5 w-5 flex-shrink-0 text-orange-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Adresse de livraison</p>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {selected.deliveryAddress.street}, {selected.deliveryAddress.postalCode} {selected.deliveryAddress.city}
                  </p>
                </div>
              </div>
            )}

            {/* Actions */}
            {selected.status === 'delivered' && (
              <div className="flex gap-3">
                <Button variant="ghost" fullWidth icon={<Star className="h-4 w-4" />}>
                  Laisser un avis
                </Button>
                <Button variant="primary" fullWidth icon={<RotateCcw className="h-4 w-4" />}>
                  Recommander
                </Button>
              </div>
            )}
            {selected.status === 'confirmed' || selected.status === 'pending' ? (
              <Link href={`/orders/${selected.id}/track`}>
                <Button variant="primary" fullWidth icon={<Eye className="h-4 w-4" />}>
                  Suivre la commande
                </Button>
              </Link>
            ) : null}
          </div>
        )}
      </Modal>
    </div>
  );
}
