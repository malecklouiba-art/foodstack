'use client';

import { useEffect, useState } from 'react';
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

const ORDER_STEPS = [
  { id: 'confirmed', label: 'Confirmée', icon: CheckCircle2, description: 'Votre commande a été reçue' },
  { id: 'preparing', label: 'En préparation', icon: UtensilsCrossed, description: 'Le restaurant prépare votre commande' },
  { id: 'ready', label: 'Prête', icon: Package, description: 'Commande prête pour le livreur' },
  { id: 'delivering', label: 'En livraison', icon: Bike, description: 'Votre livreur est en route' },
  { id: 'delivered', label: 'Livrée', icon: MapPin, description: 'Commande livrée !' },
];

const STEP_DURATIONS = [0, 8000, 12000, 18000, 25000];

export default function OrderTrackingPage() {
  const params = useParams();
  const orderId = params.id as string;
  const [currentStep, setCurrentStep] = useState(0);
  const [eta, setEta] = useState(28);
  const [showRating, setShowRating] = useState(false);
  const [rating, setRating] = useState(0);
  const [driverPosition, setDriverPosition] = useState({ x: 20, y: 60 });

  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];

    STEP_DURATIONS.forEach((delay, index) => {
      if (delay === 0) { setCurrentStep(0); return; }
      timers.push(
        setTimeout(() => {
          setCurrentStep(index);
          setEta((prev) => Math.max(0, prev - Math.floor(Math.random() * 5 + 2)));
        }, delay)
      );
    });

    timers.push(setTimeout(() => setShowRating(true), 26000));

    return () => timers.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    if (currentStep === 3) {
      const interval = setInterval(() => {
        setDriverPosition((prev) => ({
          x: Math.min(80, prev.x + Math.random() * 5),
          y: Math.max(20, prev.y - Math.random() * 3),
        }));
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [currentStep]);

  const isDelivered = currentStep === ORDER_STEPS.length - 1;

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

          {/* Map placeholder */}
          <div className="relative mb-6 overflow-hidden rounded-2xl bg-gradient-to-br from-slate-700 to-slate-900 shadow-glass-lg" style={{ height: '240px' }}>
            {/* Fake map grid */}
            <div className="absolute inset-0 opacity-20"
              style={{
                backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
                backgroundSize: '30px 30px',
              }}
            />

            {/* Route line */}
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <path d="M 20 60 Q 50 40 80 20" stroke="rgba(249,115,22,0.6)" strokeWidth="2" fill="none" strokeDasharray="4 2" />
            </svg>

            {/* Restaurant marker */}
            <div className="absolute flex flex-col items-center" style={{ left: '20%', top: '60%', transform: 'translate(-50%, -100%)' }}>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-900 shadow-lg">
                <UtensilsCrossed className="h-4 w-4 text-white" />
              </div>
              <div className="mt-1 rounded bg-surface-900/80 px-1.5 py-0.5 text-xs text-white">Restaurant</div>
            </div>

            {/* Driver marker (animated) */}
            {currentStep >= 3 && (
              <motion.div
                animate={{ left: `${driverPosition.x}%`, top: `${driverPosition.y}%` }}
                transition={{ duration: 2, ease: 'linear' }}
                className="absolute flex flex-col items-center"
                style={{ transform: 'translate(-50%, -100%)' }}
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-500 shadow-brand ring-2 ring-white">
                  <Bike className="h-5 w-5 text-white" />
                </div>
                <div className="mt-1 rounded bg-brand-500/90 px-1.5 py-0.5 text-xs text-white">Livreur</div>
              </motion.div>
            )}

            {/* Destination marker */}
            <div className="absolute flex flex-col items-center" style={{ left: '80%', top: '20%', transform: 'translate(-50%, -100%)' }}>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500 shadow-lg">
                <MapPin className="h-4 w-4 text-white" />
              </div>
              <div className="mt-1 rounded bg-green-600/80 px-1.5 py-0.5 text-xs text-white">Vous</div>
            </div>

            <div className="absolute bottom-3 left-3 rounded-lg bg-surface-900/70 px-2 py-1 text-xs text-white backdrop-blur-sm">
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
                  <p className="font-semibold text-surface-900">Karim Amara</p>
                  <div className="flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm text-surface-500">4.9 · 1 247 livraisons</span>
                  </div>
                  <p className="mt-0.5 text-xs text-surface-400">🛵 Scooter électrique · XX-123-XX</p>
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
                  <Button className="mt-4" size="sm">
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
