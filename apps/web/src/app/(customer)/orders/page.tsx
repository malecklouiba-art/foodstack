'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ShoppingBag, ChevronRight, Search, Filter,
  MapPin, Clock, Star, RotateCcw, Eye,
  CheckCircle2, Truck, XCircle, AlertCircle,
  CreditCard, Smartphone, Coins, Calendar, X, Download, RefreshCw,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { useCartStore } from '@/store/cart';
import { useAuthStore } from '@/store/auth';
import api from '@/lib/api';
import type { Order, OrderStatus } from '@foodstack/shared';

// ── Normalize API order shape → shared Order type ──────────────────────────
interface ApiOrder {
  id: string;
  orderNumber: string;
  restaurantId: string;
  customerId: string;
  status: string;
  total: number;
  subtotal: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  items: Array<{
    id: string;
    menuItemId: string;
    name: string;
    price: number;
    quantity: number;
    subtotal: number;
  }>;
  deliveryAddress?: unknown;
  restaurant?: { id: string; name: string; logo?: string };
}

type DisplayOrder = Order & { restaurantName?: string };

function normaliseOrder(raw: ApiOrder): DisplayOrder {
  return {
    id: raw.id,
    orderNumber: raw.orderNumber,
    restaurantId: raw.restaurantId,
    customerId: raw.customerId,
    type: 'delivery',
    status: raw.status as OrderStatus,
    paymentStatus: 'paid',
    paymentMethod: 'card',
    items: raw.items.map((i) => ({
      id: i.id,
      menuItemId: i.menuItemId,
      name: i.name || 'Article',
      price: i.price,
      quantity: i.quantity,
      modifiers: [],
      subtotal: i.subtotal,
    })),
    deliveryAddress: raw.deliveryAddress as any,
    subtotal: raw.subtotal,
    deliveryFee: 0,
    tax: 0,
    discount: 0,
    loyaltyPointsUsed: 0,
    loyaltyPointsEarned: Math.floor(raw.total),
    total: raw.total,
    createdAt: new Date(raw.createdAt),
    updatedAt: new Date(raw.updatedAt),
    restaurantName: raw.restaurant?.name,
  };
}

// ── Scheduled orders (UI only — not backed by API yet) ─────────────────────
interface ScheduledOrder {
  id: string;
  orderNumber: string;
  scheduledFor: Date;
  type: 'delivery' | 'pickup';
  items: { name: string; quantity: number; price: number }[];
  total: number;
  address?: string;
  status: 'scheduled' | 'cancelled';
}

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
type TabView = 'historique' | 'programmees';

export default function OrdersPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { addItem, clearCart } = useCartStore();
  const [tab, setTab] = useState<TabView>('historique');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [selected, setSelected] = useState<DisplayOrder | null>(null);
  const [rated, setRated] = useState<Record<string, number>>({});
  const [scheduled, setScheduled] = useState<ScheduledOrder[]>([]);
  const [orders, setOrders] = useState<DisplayOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  const loadOrders = useCallback(async () => {
    try {
      const data = await api.get<ApiOrder[]>('/orders/me');
      if (Array.isArray(data)) {
        setOrders(data.map(normaliseOrder));
      }
    } catch {
      // keep empty state
    } finally {
      setLoadingOrders(false);
    }
  }, []);

  useEffect(() => { loadOrders(); }, [loadOrders]);

  const filtered = orders.filter((o) => {
    const matchSearch = !search || o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      o.items.some((i) => i.name.toLowerCase().includes(search.toLowerCase()));
    const matchStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const total = orders.reduce((sum, o) => sum + (o.status !== 'cancelled' ? o.total : 0), 0);
  const points = orders.reduce((sum, o) => sum + o.loyaltyPointsEarned, 0);

  async function downloadInvoice(order: Order) {
    const { default: jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');
    const doc = new jsPDF();
    const dateStr = new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(order.createdAt);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.text('FACTURE', 20, 25);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`FoodStack — ${(order as DisplayOrder).restaurantName ?? 'Restaurant'}`, 20, 35);
    doc.text(`Commande : ${order.orderNumber}`, 20, 42);
    doc.text(`Date : ${dateStr}`, 20, 49);
    doc.text(`Mode : ${order.type === 'delivery' ? 'Livraison' : order.type === 'pickup' ? 'À emporter' : 'Sur place'}`, 20, 56);

    if (order.deliveryAddress) {
      doc.text(`Adresse : ${order.deliveryAddress.street}, ${order.deliveryAddress.postalCode} ${order.deliveryAddress.city}`, 20, 63);
    }

    autoTable(doc, {
      startY: 72,
      head: [['Article', 'Qté', 'Prix unit.', 'Total']],
      body: order.items.map((i) => [i.name, i.quantity, `${i.price.toFixed(2)} €`, `${i.subtotal.toFixed(2)} €`]),
      foot: [
        ['', '', 'Sous-total', `${order.subtotal.toFixed(2)} €`],
        ...(order.deliveryFee > 0 ? [['', '', 'Livraison', `${order.deliveryFee.toFixed(2)} €`]] : []),
        ['', '', 'TVA', `${order.tax.toFixed(2)} €`],
        ...(order.discount > 0 ? [['', '', 'Réduction', `-${order.discount.toFixed(2)} €`]] : []),
        ['', '', 'TOTAL', `${order.total.toFixed(2)} €`],
      ],
      headStyles: { fillColor: [30, 255, 106], textColor: [0, 0, 0] },
      footStyles: { fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 248, 248] },
    });

    doc.save(`facture-${order.orderNumber}.pdf`);
    toast.success('Facture téléchargée');
  }

  function cancelScheduled(id: string) {
    setScheduled((prev) => prev.map((s) => s.id === id ? { ...s, status: 'cancelled' as const } : s));
    toast.success('Commande programmée annulée');
  }

  function reorder(order: Order) {
    clearCart();
    order.items.forEach((item, idx) => {
      for (let q = 0; q < item.quantity; q++) {
        addItem({ id: `reorder-${item.menuItemId}-${idx}-${q}`, menuItemId: item.menuItemId, restaurantId: order.restaurantId, name: item.name, price: item.price });
      }
    });
    toast.success('Panier rempli avec votre commande !');
    router.push('/checkout');
  }

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
            <h1 className="flex-1 text-lg font-bold text-gray-900">Mes commandes</h1>
            <button onClick={() => loadOrders()} className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors">
              <RefreshCw className={`h-3.5 w-3.5 ${loadingOrders ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Summary strip */}
          <div className="mt-4 grid grid-cols-3 gap-3">
            {[
              { label: 'Commandes', value: orders.length.toString() },
              { label: 'Total dépensé', value: `${total.toFixed(0)}€` },
              { label: 'Points gagnés', value: `${points} pts` },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl bg-brand-50 px-4 py-3 text-center">
                <p className="text-lg font-bold text-brand-600">{s.value}</p>
                <p className="text-xs text-brand-500">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 space-y-4">
        {/* Tab switcher */}
        <div className="flex rounded-2xl border border-surface-200 bg-surface-50 p-1">
          {([['historique', 'Historique', ShoppingBag], ['programmees', 'Programmées', Calendar]] as const).map(([id, label, Icon]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all ${
                tab === id ? 'bg-white text-surface-900 shadow-sm' : 'text-surface-500 hover:text-surface-700'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
              {id === 'programmees' && scheduled.filter((s) => s.status === 'scheduled').length > 0 && (
                <span className="rounded-full bg-brand-500 px-1.5 py-0.5 text-[10px] font-bold text-black">
                  {scheduled.filter((s) => s.status === 'scheduled').length}
                </span>
              )}
            </button>
          ))}
        </div>

        {tab === 'programmees' ? (
          /* ── Scheduled orders view ── */
          <div className="space-y-4">
            {scheduled.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
                <Calendar className="h-12 w-12 text-gray-200" />
                <p className="font-medium text-gray-500">Aucune commande programmée</p>
                <Button variant="primary" onClick={() => router.push('/menu')}>Commander maintenant</Button>
              </div>
            ) : (
              <AnimatePresence>
                {scheduled.map((order, idx) => {
                  const isCancelled = order.status === 'cancelled';
                  const scheduledDate = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }).format(order.scheduledFor);
                  const scheduledTime = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' }).format(order.scheduledFor);
                  return (
                    <motion.div
                      key={order.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.97 }}
                      transition={{ delay: idx * 0.05 }}
                    >
                      <Card padding="none" className={`overflow-hidden ${isCancelled ? 'opacity-50' : ''}`}>
                        {/* Top bar */}
                        <div className={`flex items-center justify-between px-5 py-3 border-b border-gray-100 ${isCancelled ? '' : 'bg-brand-50'}`}>
                          <div className="flex items-center gap-2">
                            <Calendar className={`h-4 w-4 ${isCancelled ? 'text-gray-400' : 'text-brand-500'}`} />
                            <span className="text-sm font-semibold capitalize text-surface-900">{scheduledDate} à {scheduledTime}</span>
                          </div>
                          {isCancelled ? (
                            <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-600">Annulée</span>
                          ) : (
                            <span className="rounded-full bg-brand-100 px-2.5 py-0.5 text-xs font-medium text-brand-700">Programmée</span>
                          )}
                        </div>

                        <div className="px-5 py-4">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-mono text-xs font-semibold text-gray-500">{order.orderNumber}</span>
                            <span className="text-xs text-gray-400">{order.type === 'delivery' ? '🛵 Livraison' : '🏪 À emporter'}</span>
                          </div>

                          <p className="text-sm text-gray-700">
                            {order.items.map((i) => `${i.name} ×${i.quantity}`).join(' · ')}
                          </p>

                          {order.address && (
                            <div className="mt-2 flex items-center gap-1.5 text-xs text-gray-400">
                              <MapPin className="h-3 w-3" />
                              <span>{order.address}</span>
                            </div>
                          )}

                          <div className="mt-3 flex items-center justify-between">
                            <span className="font-bold text-gray-900">{order.total.toFixed(2)}€</span>
                            {!isCancelled && (
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  icon={<RotateCcw className="h-3.5 w-3.5" />}
                                  onClick={() => {
                                    clearCart();
                                    order.items.forEach((item, i) => {
                                      for (let q = 0; q < item.quantity; q++) {
                                        addItem({ id: `reorder-${order.id}-${i}-${q}`, menuItemId: `m${i}`, restaurantId: 'r1', name: item.name, price: item.price });
                                      }
                                    });
                                    toast.success('Panier rempli !');
                                    router.push('/checkout');
                                  }}
                                >
                                  Modifier
                                </Button>
                                <button
                                  onClick={() => cancelScheduled(order.id)}
                                  className="flex items-center gap-1 rounded-xl border border-red-200 px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50 transition-colors"
                                >
                                  <X className="h-3 w-3" />
                                  Annuler
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            )}

            <div className="flex justify-center pt-2">
              <Button
                variant="ghost"
                icon={<Calendar className="h-4 w-4" />}
                onClick={() => router.push('/checkout')}
              >
                Programmer une nouvelle commande
              </Button>
            </div>
          </div>
        ) : (
        <>
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
                      {/* Restaurant name */}
                      {(order as DisplayOrder).restaurantName && (
                        <p className="text-xs font-semibold text-brand-600 mb-1">{(order as DisplayOrder).restaurantName}</p>
                      )}
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
                            <span className="text-xs font-medium text-brand-500">+{order.loyaltyPointsEarned} pts</span>
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
                            <Button size="sm" variant="ghost" icon={<RotateCcw className="h-3.5 w-3.5" />} onClick={() => reorder(order)}>
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
        </>
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
                <div className="flex justify-between text-brand-500">
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
                <MapPin className="h-5 w-5 flex-shrink-0 text-brand-500 mt-0.5" />
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
              <div className="space-y-3">
                <Button
                  variant="ghost"
                  fullWidth
                  icon={<Download className="h-4 w-4" />}
                  onClick={() => downloadInvoice(selected)}
                >
                  Télécharger la facture PDF
                </Button>
                <div className="flex gap-3">
                  <Button variant="ghost" fullWidth icon={<Star className="h-4 w-4" />}>
                    Laisser un avis
                  </Button>
                  <Button variant="primary" fullWidth icon={<RotateCcw className="h-4 w-4" />} onClick={() => { reorder(selected); setSelected(null); }}>
                    Recommander
                  </Button>
                </div>
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
