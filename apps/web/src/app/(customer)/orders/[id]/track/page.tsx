'use client';

import { useEffect, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2,
  UtensilsCrossed,
  Package,
  Bike,
  MapPin,
  Phone,
  Star,
  Clock,
  MessageCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Navbar } from '@/components/layout/Navbar';
import { useTrackOrder } from '@/hooks/useTrackOrder';
import api from '@/lib/api';
import type { DeliveryMapProps } from '@/components/map/DeliveryMap';

// Leaflet does not support SSR — load only on client
const DeliveryMap = dynamic<DeliveryMapProps>(
  () => import('@/components/map/DeliveryMap').then((m) => m.DeliveryMap),
  { ssr: false }
);

const ORDER_STEPS = [
  { id: 'confirmed', label: 'Confirmée', icon: CheckCircle2, description: 'Votre commande a été reçue' },
  { id: 'preparing', label: 'En préparation', icon: UtensilsCrossed, description: 'Le restaurant prépare votre commande' },
  { id: 'ready', label: 'Prête', icon: Package, description: 'Commande prête pour le livreur' },
  { id: 'delivering', label: 'En livraison', icon: Bike, description: 'Votre livreur est en route' },
  { id: 'delivered', label: 'Livrée', icon: MapPin, description: 'Commande livrée !' },
];

// Placeholder coordinates — come from order API in production
const DEFAULT_RESTAURANT_POS: [number, number] = [48.8566, 2.3522];
const DEFAULT_CUSTOMER_POS: [number, number] = [48.8606, 2.3376];

const STATUS_TO_STEP: Record<string, number> = {
  confirmed: 0,
  preparing: 1,
  ready: 2,
  delivering: 3,
  delivered: 4,
};

interface ApiOrder {
  status?: string;
  estimatedDeliveryTime?: string;
  driver?: { firstName?: string; lastName?: string; rating?: number; totalDeliveries?: number };
}

export default function OrderTrackingPage() {
  const params = useParams();
  const orderId = params.id as string;
  const { status: socketStatus } = useTrackOrder(orderId);

  const [apiStatus, setApiStatus] = useState<string>('confirmed');
  const [eta, setEta] = useState(28);
  const [showRating, setShowRating] = useState(false);
  const [rating, setRating] = useState(0);
  const [driver, setDriver] = useState<ApiOrder['driver']>(undefined);
  const [driverPosition] = useState<[number, number] | undefined>(undefined);

  const loadOrder = useCallback(async () => {
    if (!orderId || orderId.startsWith('tmp-') || orderId.startsWith('latest')) return;
    try {
      const order = await (api.get(`/orders/${orderId}`) as Promise<ApiOrder>);
      if ((order as any).status) setApiStatus((order as any).status);
      if ((order as any).driver) setDriver((order as any).driver);
    } catch {
      // keep defaults
    }
  }, [orderId]);

  useEffect(() => { loadOrder(); }, [loadOrder]);

  // Prefer real-time socket status
  const currentStatus = socketStatus ?? apiStatus;
  const currentStep = STATUS_TO_STEP[currentStatus] ?? 0;

  useEffect(() => {
    if (currentStatus === 'delivered') {
      setTimeout(() => setShowRating(true), 1500);
    }
  }, [currentStatus]);

  const isDelivered = currentStep === ORDER_STEPS.length - 1;
  const currentStatusLabel = ORDER_STEPS[currentStep]?.label ?? '';

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-surface-50 py-8">
        <div className="mx-auto max-w-2xl px-4 sm:px-6">
          {/* Order ID */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-surface-900">Suivi de commande</h1>
              <p className="mt-1 text-sm text-surface-500">Commande #{orderId}</p>
            </div>
            {!isDelivered && (
              <div className="flex items-center gap-2 rounded-2xl bg-surface-900 px-4 py-2 text-white">
                <Clock className="h-4 w-4 text-brand-400" />
                <span className="font-semibold">{eta} min</span>
              </div>
            )}
          </div>

          {/* Real Leaflet map */}
          <div
            className="relative mb-6 overflow-hidden rounded-2xl shadow-glass-lg"
            style={{ height: '240px' }}
          >
            <DeliveryMap
              restaurantPosition={DEFAULT_RESTAURANT_POS}
              customerPosition={DEFAULT_CUSTOMER_POS}
              driverPosition={currentStep >= 3 ? driverPosition : undefined}
              status={currentStatusLabel}
            />
            <div className="absolute bottom-3 left-3 z-[1000] rounded-lg bg-surface-900/70 px-2 py-1 text-xs text-white backdrop-blur-sm pointer-events-none">
              Carte en direct
            </div>
          </div>

          {/* Progress steps */}
          <div className="mb-6 rounded-2xl border border-surface-200 bg-white p-6 shadow-sm">
            <div className="space-y-1">
              {ORDER_STEPS.map((step, index) => {
                const isCompleted = index < currentStep;
                const isActive = index === currentStep;
                const isPending = index > currentStep;

                return (
                  <div key={step.id}>
                    <div className="flex items-start gap-4 py-3">
                      {/* Icon */}
                      <div className="relative">
                        <motion.div
                          animate={isActive ? { scale: [1, 1.1, 1] } : {}}
                          transition={{ duration: 1.5, repeat: Infinity }}
                          className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${
                            isCompleted
                              ? 'bg-green-500'
                              : isActive
                              ? 'bg-brand-500 shadow-brand'
                              : 'bg-surface-100'
                          }`}
                        >
                          <step.icon
                            className={`h-5 w-5 ${
                              isCompleted || isActive ? 'text-white' : 'text-surface-300'
                            }`}
                          />
                        </motion.div>

                        {/* Connector */}
                        {index < ORDER_STEPS.length - 1 && (
                          <div
                            className={`absolute left-1/2 top-10 h-6 w-0.5 -translate-x-1/2 rounded-full ${
                              isCompleted ? 'bg-green-300' : 'bg-surface-200'
                            }`}
                          />
                        )}
                      </div>

                      {/* Text */}
                      <div className="flex-1 pb-2">
                        <div className="flex items-center justify-between">
                          <p
                            className={`font-semibold ${
                              isCompleted
                                ? 'text-green-700'
                                : isActive
                                ? 'text-brand-700'
                                : 'text-surface-400'
                            }`}
                          >
                            {step.label}
                          </p>
                          {isActive && (
                            <span className="flex items-center gap-1 text-xs text-brand-500">
                              <motion.span
                                animate={{ opacity: [1, 0.3, 1] }}
                                transition={{ duration: 1.2, repeat: Infinity }}
                                className="h-1.5 w-1.5 rounded-full bg-brand-500"
                              />
                              En cours
                            </span>
                          )}
                          {isCompleted && (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          )}
                        </div>
                        <p className={`mt-0.5 text-sm ${isPending ? 'text-surface-300' : 'text-surface-500'}`}>
                          {step.description}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Driver card */}
          {currentStep >= 3 && !isDelivered && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 rounded-2xl border border-surface-200 bg-white p-5 shadow-sm"
            >
              <p className="mb-3 text-sm font-semibold text-surface-700">Votre livreur</p>
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-100 text-2xl font-bold text-brand-700">
                  KA
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-surface-900">
                    {driver ? `${driver.firstName ?? ''} ${driver.lastName ?? ''}`.trim() || 'Votre livreur' : 'Votre livreur'}
                  </p>
                  <div className="flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm text-surface-500">
                      {driver?.rating ?? '4.9'} · {(driver?.totalDeliveries ?? 1247).toLocaleString('fr-FR')} livraisons
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-surface-400">🛵 En route</p>
                </div>
                <div className="flex gap-2">
                  <button className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-100 text-surface-700 hover:bg-surface-200">
                    <Phone className="h-4 w-4" />
                  </button>
                  <button className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-100 text-surface-700 hover:bg-surface-200">
                    <MessageCircle className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Rating */}
          <AnimatePresence>
            {showRating && isDelivered && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-surface-200 bg-white p-6 shadow-sm text-center"
              >
                <div className="mb-2 flex justify-center text-4xl">🎉</div>
                <h3 className="text-lg font-bold text-surface-900">Commande livrée !</h3>
                <p className="mt-1 text-sm text-surface-500">Comment s'est passée votre expérience ?</p>
                <div className="mt-4 flex items-center justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button key={star} onClick={() => setRating(star)}>
                      <Star
                        className={`h-8 w-8 transition-colors ${
                          star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-surface-200 hover:text-yellow-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                {rating > 0 && (
                  <Button
                    className="mt-4"
                    size="sm"
                    onClick={async () => {
                      try {
                        await (api.post(`/orders/${orderId}/review`, { rating }) as Promise<unknown>);
                        setShowRating(false);
                      } catch { setShowRating(false); }
                    }}
                  >
                    Envoyer l'avis
                  </Button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  );
}
