'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ChevronRight,
  ShoppingBag,
  MapPin,
  Clock,
  CheckCircle2,
  UtensilsCrossed,
  Truck,
  Package,
  RotateCcw,
  Navigation,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useCartStore } from '@/store/cart';
import api from '@/lib/api';
import type { Order, OrderStatus } from '@foodstack/shared';
import toast from 'react-hot-toast';

// ── Status config ───────────────────────────────────────────────────────────

type BadgeVariant = 'success' | 'warning' | 'brand' | 'info' | 'danger' | 'default';

const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; variant: BadgeVariant; icon: React.ElementType }
> = {
  pending:    { label: 'En attente',      variant: 'default',  icon: Clock },
  confirmed:  { label: 'Confirmé',        variant: 'info',     icon: CheckCircle2 },
  preparing:  { label: 'En préparation',  variant: 'warning',  icon: UtensilsCrossed },
  ready:      { label: 'Prête',           variant: 'brand',    icon: Package },
  delivering: { label: 'En livraison',    variant: 'info',     icon: Truck },
  delivered:  { label: 'Livré',           variant: 'success',  icon: CheckCircle2 },
  cancelled:  { label: 'Annulée',         variant: 'danger',   icon: AlertCircle },
  refunded:   { label: 'Remboursée',      variant: 'default',  icon: AlertCircle },
};

// Progress steps shown in the detail view (collapsed variant of the full track page)
const PROGRESS_STEPS: { id: OrderStatus; label: string; icon: React.ElementType }[] = [
  { id: 'confirmed',  label: 'Confirmé',        icon: CheckCircle2 },
  { id: 'preparing',  label: 'En préparation',  icon: UtensilsCrossed },
  { id: 'delivering', label: 'En livraison',    icon: Truck },
  { id: 'delivered',  label: 'Livré',           icon: CheckCircle2 },
];

const STEP_ORDER: OrderStatus[] = [
  'pending', 'confirmed', 'preparing', 'ready', 'delivering', 'delivered',
];

function stepIndex(status: OrderStatus): number {
  return STEP_ORDER.indexOf(status);
}

// Map PROGRESS_STEPS id → step index for coloring
function progressStepReached(stepId: OrderStatus, currentStatus: OrderStatus): boolean {
  return stepIndex(currentStatus) >= stepIndex(stepId);
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(d: Date | string) {
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(d));
}

// ── Mock fallback (used when API is unreachable in dev) ───────────────────

const MOCK_ORDER: Order = {
  id: 'mock',
  orderNumber: 'ORD-1234',
  restaurantId: 'r1',
  customerId: 'u1',
  type: 'delivery',
  status: 'delivering',
  paymentStatus: 'paid',
  paymentMethod: 'card',
  items: [
    { id: 'oi1', menuItemId: 'i1', name: 'Classic Burger', price: 14.90, quantity: 2, modifiers: [], subtotal: 29.80 },
    { id: 'oi2', menuItemId: 'i3', name: 'Frites maison',  price: 4.50,  quantity: 2, modifiers: [], subtotal: 9.00 },
  ],
  deliveryAddress: { street: '12 rue de la Paix', city: 'Paris', postalCode: '75001', country: 'FR' },
  subtotal: 38.80,
  deliveryFee: 2.90,
  tax: 3.88,
  discount: 0,
  loyaltyPointsUsed: 0,
  loyaltyPointsEarned: 39,
  total: 45.58,
  estimatedDeliveryTime: new Date(Date.now() + 15 * 60 * 1000),
  createdAt: new Date('2026-05-11T14:23:00'),
  updatedAt: new Date(),
};

// ── Component ────────────────────────────────────────────────────────────────

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { addItem, clearCart } = useCartStore();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrder = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get<Order>(`/orders/${id}`);
      // Hydrate date strings → Date objects if the API returns strings
      const o = data as unknown as Order;
      setOrder({
        ...o,
        createdAt: new Date(o.createdAt),
        updatedAt: new Date(o.updatedAt),
        estimatedDeliveryTime: o.estimatedDeliveryTime ? new Date(o.estimatedDeliveryTime) : undefined,
        actualDeliveryTime: o.actualDeliveryTime ? new Date(o.actualDeliveryTime) : undefined,
      });
    } catch (err: unknown) {
      const status = (err as { status?: number })?.status;
      if (status === 404) {
        setError('Commande introuvable.');
      } else if (status === 401) {
        // Interceptor already redirected; silence here
        setError('Non autorisé.');
      } else {
        // Network / server error → fallback to mock so the UI is still useful
        console.warn('API unavailable, using mock order:', err);
        setOrder({ ...MOCK_ORDER, id });
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  function reorder() {
    if (!order) return;
    clearCart();
    order.items.forEach((item, idx) => {
      for (let q = 0; q < item.quantity; q++) {
        addItem({
          id: `reorder-${item.menuItemId}-${idx}-${q}`,
          menuItemId: item.menuItemId,
          restaurantId: order.restaurantId,
          name: item.name,
          price: item.price,
        });
      }
    });
    toast.success('Panier rempli avec votre commande !');
    router.push('/checkout');
  }

  // ── Loading skeleton ────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b border-gray-100 px-4 py-5 sm:px-6">
          <div className="mx-auto max-w-2xl">
            <div className="flex items-center gap-2">
              <div className="h-4 w-28 rounded-full bg-gray-200 animate-pulse" />
              <div className="h-4 w-4 rounded-full bg-gray-100 animate-pulse" />
              <div className="h-4 w-24 rounded-full bg-gray-200 animate-pulse" />
            </div>
          </div>
        </div>
        <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6 space-y-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-32 rounded-2xl bg-white border border-gray-100 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  // ── Error state ─────────────────────────────────────────────────────────

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-5 px-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-red-100">
          <AlertCircle className="h-8 w-8 text-red-500" />
        </div>
        <div>
          <p className="text-lg font-bold text-gray-900">{error}</p>
          <p className="mt-1 text-sm text-gray-400">Impossible de charger les détails de la commande.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="ghost" onClick={() => router.push('/orders')}>
            Mes commandes
          </Button>
          <Button variant="primary" icon={<RefreshCw className="h-4 w-4" />} onClick={fetchOrder}>
            Réessayer
          </Button>
        </div>
      </div>
    );
  }

  if (!order) return null;

  const status = STATUS_CONFIG[order.status];
  const StatusIcon = status.icon;
  const isActive = !['delivered', 'cancelled', 'refunded'].includes(order.status);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Breadcrumb ─────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-100 px-4 py-5 sm:px-6">
        <div className="mx-auto max-w-2xl">
          <div className="flex items-center gap-2 text-sm">
            <Link
              href="/orders"
              className="flex items-center gap-1.5 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <ShoppingBag className="h-4 w-4" />
              <span className="font-medium">Mes commandes</span>
            </Link>
            <ChevronRight className="h-4 w-4 text-gray-300" />
            <span className="font-semibold text-gray-900">#{order.orderNumber}</span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6 space-y-4">

        {/* ── Status card ───────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card padding="md">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${
                  order.status === 'delivered' ? 'bg-green-100' :
                  order.status === 'cancelled' ? 'bg-red-100' :
                  'bg-brand-100'
                }`}>
                  <StatusIcon className={`h-5 w-5 ${
                    order.status === 'delivered' ? 'text-green-600' :
                    order.status === 'cancelled' ? 'text-red-500' :
                    'text-brand-500'
                  }`} />
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-medium">Statut de la commande</p>
                  <Badge variant={status.variant} dot size="md">{status.label}</Badge>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400">Passée le</p>
                <p className="text-xs font-medium text-gray-700">{formatDate(order.createdAt)}</p>
              </div>
            </div>

            {/* Progress steps — only when order is active (not cancelled/refunded) */}
            {order.status !== 'cancelled' && order.status !== 'refunded' && (
              <div className="mt-5 flex items-center justify-between">
                {PROGRESS_STEPS.map((step, idx) => {
                  const reached = progressStepReached(step.id, order.status);
                  const isCurrentStep = order.status === step.id ||
                    (step.id === 'confirmed' && order.status === 'pending');
                  const StepIcon = step.icon;
                  return (
                    <div key={step.id} className="flex flex-1 items-center">
                      <div className="flex flex-col items-center gap-1">
                        <motion.div
                          animate={isCurrentStep && isActive ? { scale: [1, 1.1, 1] } : {}}
                          transition={{ duration: 1.5, repeat: Infinity }}
                          className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
                            reached ? 'bg-brand-500' : 'bg-gray-100'
                          }`}
                        >
                          <StepIcon className={`h-4 w-4 ${reached ? 'text-white' : 'text-gray-300'}`} />
                        </motion.div>
                        <span className={`text-[10px] font-medium text-center leading-tight ${
                          reached ? 'text-brand-600' : 'text-gray-300'
                        }`}>
                          {step.label}
                        </span>
                      </div>
                      {idx < PROGRESS_STEPS.length - 1 && (
                        <div className={`flex-1 h-0.5 mx-1 rounded-full transition-colors ${
                          progressStepReached(PROGRESS_STEPS[idx + 1].id, order.status)
                            ? 'bg-brand-400'
                            : 'bg-gray-100'
                        }`} />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </motion.div>

        {/* ── Estimated delivery time ────────────────────────────────────── */}
        {isActive && order.estimatedDeliveryTime && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.05 }}
          >
            <Card padding="sm" className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50">
                <Clock className="h-5 w-5 text-brand-500" />
              </div>
              <div>
                <p className="text-xs text-gray-400">Livraison estimée</p>
                <p className="text-sm font-semibold text-gray-900">
                  {formatDate(order.estimatedDeliveryTime)}
                </p>
              </div>
            </Card>
          </motion.div>
        )}

        {/* ── Items list ──────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card padding="none" className="overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-900">Articles commandés</h2>
            </div>
            <div className="divide-y divide-gray-100">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between px-5 py-3.5">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                    {item.modifiers && item.modifiers.length > 0 && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        {item.modifiers.map((m) => m.name).join(', ')}
                      </p>
                    )}
                    <p className="text-xs text-gray-400 mt-0.5">
                      {item.quantity} × {item.price.toFixed(2)} €
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-gray-900 ml-4 shrink-0">
                    {item.subtotal.toFixed(2)} €
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* ── Order summary ───────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
        >
          <Card padding="md">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Récapitulatif</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-500">
                <span>Sous-total</span>
                <span>{order.subtotal.toFixed(2)} €</span>
              </div>
              {order.deliveryFee > 0 && (
                <div className="flex justify-between text-gray-500">
                  <span>Frais de livraison</span>
                  <span>{order.deliveryFee.toFixed(2)} €</span>
                </div>
              )}
              <div className="flex justify-between text-gray-500">
                <span>TVA</span>
                <span>{order.tax.toFixed(2)} €</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Réduction</span>
                  <span>−{order.discount.toFixed(2)} €</span>
                </div>
              )}
              {order.loyaltyPointsUsed > 0 && (
                <div className="flex justify-between text-brand-500">
                  <span>Points utilisés</span>
                  <span>−{(order.loyaltyPointsUsed / 100).toFixed(2)} €</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-gray-900 border-t border-gray-100 pt-2">
                <span>Total</span>
                <span>{order.total.toFixed(2)} €</span>
              </div>
              {order.loyaltyPointsEarned > 0 && (
                <p className="text-xs text-brand-500 text-right">
                  +{order.loyaltyPointsEarned} points fidélité gagnés
                </p>
              )}
            </div>
          </Card>
        </motion.div>

        {/* ── Delivery address ────────────────────────────────────────────── */}
        {order.deliveryAddress && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <Card padding="md" className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50">
                <MapPin className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Adresse de livraison</p>
                <p className="mt-0.5 text-sm text-gray-500">
                  {order.deliveryAddress.street}
                  {order.deliveryAddress.floor ? `, Étage ${order.deliveryAddress.floor}` : ''}
                </p>
                <p className="text-sm text-gray-500">
                  {order.deliveryAddress.postalCode} {order.deliveryAddress.city}
                </p>
                {order.deliveryAddress.doorCode && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    Code porte : {order.deliveryAddress.doorCode}
                  </p>
                )}
              </div>
            </Card>
          </motion.div>
        )}

        {/* ── Actions ─────────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.25 }}
          className="space-y-3 pb-4"
        >
          {/* Track button — shown for active orders */}
          {isActive && (
            <Link href={`/orders/${id}/track`} className="block">
              <Button
                variant="primary"
                fullWidth
                icon={<Navigation className="h-4 w-4" />}
                size="lg"
              >
                Suivre ma livraison
              </Button>
            </Link>
          )}

          {/* Reorder button */}
          {order.status !== 'cancelled' && (
            <Button
              variant={isActive ? 'ghost' : 'primary'}
              fullWidth
              icon={<RotateCcw className="h-4 w-4" />}
              size="lg"
              onClick={reorder}
            >
              Commander à nouveau
            </Button>
          )}
        </motion.div>

      </div>
    </div>
  );
}
