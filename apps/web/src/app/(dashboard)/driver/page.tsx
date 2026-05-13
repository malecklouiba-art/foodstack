'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Bike,
  MapPin,
  RefreshCw,
  Package,
  Clock,
  DollarSign,
  CheckCircle2,
  Navigation,
  Store,
  ChevronRight,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { useAuthStore } from '@/store/auth';
import api from '@/lib/api';
import { getSocket } from '@/lib/socket';

// ── Types ──────────────────────────────────────────────────────────────────

type DeliveryStatus =
  | 'assigned'
  | 'en_route_to_restaurant'
  | 'at_restaurant'
  | 'picked_up'
  | 'en_route_to_customer'
  | 'delivered';

interface DeliveryItem {
  name: string;
  quantity: number;
}

interface ActiveDelivery {
  orderId: string;
  orderNumber: string;
  customerName: string;
  address: string;
  items: DeliveryItem[];
  total: number;
  status: DeliveryStatus;
  restaurantName: string;
}

interface PendingDelivery {
  orderId: string;
  orderNumber: string;
  restaurantName: string;
  deliveryAddress: string;
  distanceKm: number;
  fee: number;
}

interface GpsPosition {
  lat: number;
  lng: number;
}

// ── Mock data ──────────────────────────────────────────────────────────────

const MOCK_ACTIVE: ActiveDelivery = {
  orderId: 'ord-001',
  orderNumber: 'ORD-8821',
  customerName: 'Marie Laurent',
  address: '12 rue de la Paix, 75001 Paris',
  items: [
    { name: 'Classic Burger', quantity: 2 },
    { name: 'Frites', quantity: 2 },
  ],
  total: 42.5,
  status: 'en_route_to_restaurant',
  restaurantName: 'Burger Palace',
};

const MOCK_PENDING: PendingDelivery[] = [
  {
    orderId: 'ord-002',
    orderNumber: 'ORD-8822',
    restaurantName: 'Pizza Roma',
    deliveryAddress: '45 avenue Montaigne, 75008 Paris',
    distanceKm: 2.4,
    fee: 5.5,
  },
  {
    orderId: 'ord-003',
    orderNumber: 'ORD-8823',
    restaurantName: 'Sushi Zen',
    deliveryAddress: '8 rue Lepic, 75018 Paris',
    distanceKm: 3.7,
    fee: 6.0,
  },
];

// ── Status config ──────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  DeliveryStatus,
  {
    label: string;
    badgeVariant: 'info' | 'warning' | 'default' | 'brand' | 'success';
    nextStatus: DeliveryStatus | null;
    nextLabel: string | null;
    icon: React.ReactNode;
  }
> = {
  assigned: {
    label: 'Assignée',
    badgeVariant: 'info',
    nextStatus: 'en_route_to_restaurant',
    nextLabel: 'En route vers resto',
    icon: <Package className="h-4 w-4" />,
  },
  en_route_to_restaurant: {
    label: 'En route vers resto',
    badgeVariant: 'warning',
    nextStatus: 'at_restaurant',
    nextLabel: 'Au restaurant',
    icon: <Navigation className="h-4 w-4" />,
  },
  at_restaurant: {
    label: 'Au restaurant',
    badgeVariant: 'warning',
    nextStatus: 'picked_up',
    nextLabel: 'Récupéré',
    icon: <Store className="h-4 w-4" />,
  },
  picked_up: {
    label: 'Récupéré',
    badgeVariant: 'default',
    nextStatus: 'en_route_to_customer',
    nextLabel: 'En route client',
    icon: <Package className="h-4 w-4" />,
  },
  en_route_to_customer: {
    label: 'En route client',
    badgeVariant: 'brand',
    nextStatus: 'delivered',
    nextLabel: 'Livré',
    icon: <Bike className="h-4 w-4" />,
  },
  delivered: {
    label: 'Livré',
    badgeVariant: 'success',
    nextStatus: null,
    nextLabel: null,
    icon: <CheckCircle2 className="h-4 w-4" />,
  },
};

// ── Step progress bar ──────────────────────────────────────────────────────

const STATUS_STEPS: DeliveryStatus[] = [
  'assigned',
  'en_route_to_restaurant',
  'at_restaurant',
  'picked_up',
  'en_route_to_customer',
  'delivered',
];

function StatusProgress({ status }: { status: DeliveryStatus }) {
  const currentIdx = STATUS_STEPS.indexOf(status);
  return (
    <div className="flex items-center gap-1 mt-3">
      {STATUS_STEPS.map((s, i) => (
        <div key={s} className="flex items-center flex-1">
          <div
            className={`h-2 w-full rounded-full transition-all duration-300 ${
              i <= currentIdx
                ? 'bg-brand-500'
                : 'bg-surface-200 dark:bg-surface-700'
            }`}
          />
        </div>
      ))}
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────

export default function DriverPage() {
  const { user } = useAuthStore();

  const [isOnline, setIsOnline] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);

  const [activeDelivery, setActiveDelivery] = useState<ActiveDelivery | null>(MOCK_ACTIVE);
  const [pendingDeliveries, setPendingDeliveries] = useState<PendingDelivery[]>(MOCK_PENDING);
  const [gps, setGps] = useState<GpsPosition | null>(null);

  // Stats (mock)
  const stats = { deliveries: 7, earnings: 42.5, avgTime: 22 };

  // ── Socket ────────────────────────────────────────────────────────────────

  useEffect(() => {
    const socket = getSocket();
    if (!socket.connected) socket.connect();

    socket.emit('driver:online', { driverId: user?.id });

    socket.on('delivery:assigned', (delivery: PendingDelivery) => {
      setPendingDeliveries((prev) => {
        const alreadyExists = prev.some((d) => d.orderId === delivery.orderId);
        return alreadyExists ? prev : [delivery, ...prev];
      });
    });

    return () => {
      socket.off('delivery:assigned');
    };
  }, [user?.id]);

  // ── GPS watch ─────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setGps({ lat: latitude, lng: longitude });

        if (user?.id) {
          api
            .patch(`/delivery/drivers/${user.id}/location`, {
              lat: latitude,
              lng: longitude,
            })
            .catch(() => {
              // silently ignore location update errors
            });
        }
      },
      () => {
        // silently ignore geolocation errors
      },
      { enableHighAccuracy: true, maximumAge: 10000 }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [user?.id]);

  // ── Refresh ───────────────────────────────────────────────────────────────

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const data = await api.get('/delivery/active') as ActiveDelivery | null;
      setActiveDelivery(data ?? null);
    } catch {
      // keep existing data on error
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  // ── Update delivery status ────────────────────────────────────────────────

  const handleStatusUpdate = useCallback(
    async (orderId: string, nextStatus: DeliveryStatus) => {
      setIsUpdatingStatus(true);
      try {
        await api.patch(`/delivery/orders/${orderId}/status`, { status: nextStatus });
        setActiveDelivery((prev) =>
          prev ? { ...prev, status: nextStatus } : prev
        );
        if (nextStatus === 'delivered') {
          setActiveDelivery(null);
        }
      } catch {
        // keep existing status on error
      } finally {
        setIsUpdatingStatus(false);
      }
    },
    []
  );

  // ── Accept delivery ───────────────────────────────────────────────────────

  const handleAccept = useCallback(
    async (delivery: PendingDelivery) => {
      if (!user?.id) return;
      setAcceptingId(delivery.orderId);
      try {
        await api.patch(`/delivery/orders/${delivery.orderId}/assign-driver`, {
          driverId: user.id,
        });
        setPendingDeliveries((prev) => prev.filter((d) => d.orderId !== delivery.orderId));
        setActiveDelivery({
          orderId: delivery.orderId,
          orderNumber: delivery.orderNumber,
          customerName: 'Client',
          address: delivery.deliveryAddress,
          items: [],
          total: 0,
          status: 'assigned',
          restaurantName: delivery.restaurantName,
        });
      } catch {
        // keep existing list on error
      } finally {
        setAcceptingId(null);
      }
    },
    [user?.id]
  );

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-900 p-4 md:p-6 space-y-6">
      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500 text-white shadow-brand">
            <Bike className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-50">
              {user?.name ?? 'Livreur'}
            </h1>
            <p className="text-sm text-surface-500 dark:text-surface-400">Interface livreur</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Online toggle */}
          <button
            onClick={() => setIsOnline((v) => !v)}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200 border ${
              isOnline
                ? 'bg-green-50 border-green-200 text-green-700 dark:bg-green-900/30 dark:border-green-700 dark:text-green-400'
                : 'bg-surface-100 border-surface-200 text-surface-600 dark:bg-surface-800 dark:border-surface-700 dark:text-surface-400'
            }`}
          >
            <span
              className={`h-2.5 w-2.5 rounded-full transition-colors ${
                isOnline ? 'bg-green-500 animate-pulse' : 'bg-surface-400'
              }`}
            />
            {isOnline ? 'En ligne' : 'Hors ligne'}
          </button>

          {/* Refresh */}
          <Button
            variant="ghost"
            size="sm"
            icon={<RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />}
            onClick={handleRefresh}
            loading={isRefreshing}
          >
            Actualiser
          </Button>
        </div>
      </motion.div>

      {/* ── Stats ── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05 }}
        className="grid grid-cols-3 gap-3"
      >
        {[
          {
            icon: <Package className="h-5 w-5 text-brand-500" />,
            label: "Livraisons aujourd'hui",
            value: stats.deliveries,
          },
          {
            icon: <DollarSign className="h-5 w-5 text-green-500" />,
            label: 'Gains',
            value: `${stats.earnings.toFixed(2)} €`,
          },
          {
            icon: <Clock className="h-5 w-5 text-orange-500" />,
            label: 'Temps moyen',
            value: `${stats.avgTime} min`,
          },
        ].map((stat, i) => (
          <Card key={i} padding="sm">
            <div className="flex flex-col gap-1">
              {stat.icon}
              <p className="text-xs text-surface-500 dark:text-surface-400 mt-1">{stat.label}</p>
              <p className="text-xl font-bold text-surface-900 dark:text-surface-50">{stat.value}</p>
            </div>
          </Card>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          {/* ── Active delivery ── */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Livraison en cours</CardTitle>
                {activeDelivery && (
                  <Badge variant={STATUS_CONFIG[activeDelivery.status].badgeVariant} dot>
                    {STATUS_CONFIG[activeDelivery.status].label}
                  </Badge>
                )}
              </CardHeader>

              <AnimatePresence mode="wait">
                {activeDelivery ? (
                  <motion.div
                    key="active"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-4"
                  >
                    {/* Order info */}
                    <div className="rounded-xl bg-surface-50 dark:bg-surface-800 p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono text-surface-500 dark:text-surface-400">
                          {activeDelivery.orderNumber}
                        </span>
                        <span className="text-sm font-semibold text-surface-900 dark:text-surface-50">
                          {activeDelivery.total.toFixed(2)} €
                        </span>
                      </div>
                      <p className="text-sm font-medium text-surface-900 dark:text-surface-50">
                        {activeDelivery.customerName}
                      </p>
                      <div className="flex items-start gap-1.5 text-xs text-surface-500 dark:text-surface-400">
                        <MapPin className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                        <span>{activeDelivery.address}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-surface-500 dark:text-surface-400">
                        <Store className="h-3.5 w-3.5 flex-shrink-0" />
                        <span>{activeDelivery.restaurantName}</span>
                      </div>
                      {activeDelivery.items.length > 0 && (
                        <p className="text-xs text-surface-400 dark:text-surface-500">
                          {activeDelivery.items.reduce((acc, i) => acc + i.quantity, 0)} article
                          {activeDelivery.items.reduce((acc, i) => acc + i.quantity, 0) > 1 ? 's' : ''}
                          {' — '}
                          {activeDelivery.items.map((i) => `${i.quantity}× ${i.name}`).join(', ')}
                        </p>
                      )}
                    </div>

                    {/* Progress bar */}
                    <StatusProgress status={activeDelivery.status} />

                    {/* Next status button */}
                    {STATUS_CONFIG[activeDelivery.status].nextStatus && (
                      <Button
                        fullWidth
                        loading={isUpdatingStatus}
                        icon={<ChevronRight className="h-4 w-4" />}
                        iconPosition="right"
                        onClick={() =>
                          handleStatusUpdate(
                            activeDelivery.orderId,
                            STATUS_CONFIG[activeDelivery.status].nextStatus!
                          )
                        }
                      >
                        {STATUS_CONFIG[activeDelivery.status].nextLabel}
                      </Button>
                    )}

                    {activeDelivery.status === 'delivered' && (
                      <div className="flex items-center justify-center gap-2 rounded-xl bg-green-50 dark:bg-green-900/20 p-3 text-green-700 dark:text-green-400">
                        <CheckCircle2 className="h-5 w-5" />
                        <span className="text-sm font-medium">Livraison terminée !</span>
                      </div>
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center gap-3 py-8 text-center"
                  >
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-100 dark:bg-surface-800">
                      <Bike className="h-7 w-7 text-surface-400" />
                    </div>
                    <CardDescription>Aucune livraison en cours</CardDescription>
                    <p className="text-xs text-surface-400 dark:text-surface-500">
                      Acceptez une commande ci-dessous pour commencer
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          </motion.div>

          {/* ── GPS / Map placeholder ── */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.15 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Position GPS</CardTitle>
                {gps ? (
                  <Badge variant="success" dot>
                    Actif
                  </Badge>
                ) : (
                  <Badge variant="default" dot>
                    En attente
                  </Badge>
                )}
              </CardHeader>

              <div className="rounded-xl bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 h-48 flex items-center justify-center">
                {gps ? (
                  <div className="text-center space-y-2">
                    <Navigation className="h-8 w-8 text-brand-500 mx-auto" />
                    <p className="text-sm font-mono text-surface-700 dark:text-surface-300">
                      Position GPS : {gps.lat.toFixed(5)}, {gps.lng.toFixed(5)}
                    </p>
                    <p className="text-xs text-surface-400 dark:text-surface-500">
                      Mise à jour en temps réel
                    </p>
                  </div>
                ) : (
                  <div className="text-center space-y-2">
                    <MapPin className="h-8 w-8 text-surface-400 mx-auto" />
                    <p className="text-sm text-surface-500 dark:text-surface-400">
                      Localisation GPS en attente...
                    </p>
                    <p className="text-xs text-surface-400 dark:text-surface-500">
                      Autorisez la géolocalisation dans votre navigateur
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-3 flex items-center gap-2 text-xs text-surface-400 dark:text-surface-500">
                {isOnline ? (
                  <Wifi className="h-3.5 w-3.5 text-green-500" />
                ) : (
                  <WifiOff className="h-3.5 w-3.5" />
                )}
                <span>
                  {isOnline
                    ? 'Position transmise au serveur toutes les 10s'
                    : 'Passez en ligne pour transmettre votre position'}
                </span>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* ── Pending deliveries ── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card className="h-fit">
            <CardHeader>
              <CardTitle>Commandes disponibles</CardTitle>
              <Badge variant="info">{pendingDeliveries.length}</Badge>
            </CardHeader>

            <div className="space-y-3">
              <AnimatePresence>
                {pendingDeliveries.length === 0 ? (
                  <motion.div
                    key="no-pending"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center gap-3 py-8 text-center"
                  >
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-100 dark:bg-surface-800">
                      <Package className="h-7 w-7 text-surface-400" />
                    </div>
                    <CardDescription>Aucune commande disponible</CardDescription>
                    <p className="text-xs text-surface-400 dark:text-surface-500">
                      Les nouvelles commandes apparaîtront ici
                    </p>
                  </motion.div>
                ) : (
                  pendingDeliveries.map((delivery) => (
                    <motion.div
                      key={delivery.orderId}
                      initial={{ opacity: 0, x: 16 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -16 }}
                      transition={{ duration: 0.2 }}
                      className="rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 p-4 space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-xs font-mono text-surface-400 dark:text-surface-500">
                            {delivery.orderNumber}
                          </p>
                          <p className="text-sm font-semibold text-surface-900 dark:text-surface-50 mt-0.5">
                            {delivery.restaurantName}
                          </p>
                        </div>
                        <span className="text-base font-bold text-green-600 dark:text-green-400 whitespace-nowrap">
                          +{delivery.fee.toFixed(2)} €
                        </span>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-start gap-1.5 text-xs text-surface-500 dark:text-surface-400">
                          <MapPin className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                          <span>{delivery.deliveryAddress}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-surface-500 dark:text-surface-400">
                          <Navigation className="h-3.5 w-3.5 flex-shrink-0" />
                          <span>{delivery.distanceKm} km</span>
                        </div>
                      </div>

                      <Button
                        fullWidth
                        size="sm"
                        loading={acceptingId === delivery.orderId}
                        onClick={() => handleAccept(delivery)}
                      >
                        Accepter
                      </Button>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
