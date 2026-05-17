'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  MapPin,
  CreditCard,
  Clock,
  CheckCircle2,
  Lock,
  Tag,
  X,
  Calendar,
  Star,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Navbar } from '@/components/layout/Navbar';
import { useCartStore } from '@/store/cart';
import { StripeCardForm } from '@/components/checkout/StripeCardForm';
import api from '@/lib/api';

const STRIPE_PK = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ?? 'pk_test_51TY6WvJk77DdlLmcDeNnWRkFfR4Hvwa7uW6WWCa8BQxgWsDkjQwiQoy02WB5jsUcCL0NeN1P11KOVJorbNysYK5800UsDP4oev';
const stripePromise = loadStripe(STRIPE_PK);

type PaymentMethod = 'card' | 'apple_pay' | 'google_pay' | 'cash';

const deliverySlots = [
  { id: 'asap',  label: 'Dès que possible', sublabel: '20–35 min' },
  { id: '12:30', label: '12h30',             sublabel: "Aujourd'hui" },
  { id: '13:00', label: '13h00',             sublabel: "Aujourd'hui" },
  { id: '13:30', label: '13h30',             sublabel: "Aujourd'hui" },
  { id: 'schedule', label: 'Programmer',     sublabel: 'Choisir date/heure' },
];

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, deliveryFee, tax, total, clearCart } = useCartStore();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [selectedSlot, setSelectedSlot] = useState('asap');
  const [loading, setLoading] = useState(false);
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [_paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number; type: 'percent' | 'fixed' } | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewStars, setReviewStars] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const reviewDismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const FALLBACK_COUPONS: Record<string, { discount: number; type: 'percent' | 'fixed' }> = {
    'SAVE10':    { discount: 10, type: 'percent' },
    'WELCOME20': { discount: 20, type: 'percent' },
  };

  function triggerReviewModal() {
    const isFirstOrder = true; // demo: always show; replace with real check
    if (!isFirstOrder) return;
    setTimeout(() => {
      setShowReviewModal(true);
      reviewDismissTimer.current = setTimeout(() => setShowReviewModal(false), 30000);
    }, 3000);
  }

  function dismissReviewModal() {
    setShowReviewModal(false);
    if (reviewDismissTimer.current) clearTimeout(reviewDismissTimer.current);
  }

  async function applyCoupon() {
    if (!couponCode.trim()) return;
    setCouponLoading(true);

    const code = couponCode.toUpperCase();

    try {
      const apiBase =
        process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

      const response = await fetch(`${apiBase}/api/v1/coupons/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          restaurantId: 'demo-restaurant-id',
          orderValue: subtotal(),
        }),
      });

      if (response.ok) {
        const data = (await response.json()) as {
          code: string;
          discount: number;
          type: 'percent' | 'fixed';
        };
        setAppliedCoupon({ code: data.code ?? code, discount: data.discount, type: data.type });
        toast.success(`Code "${data.code ?? code}" appliqué !`);
      } else {
        const err = await response.json().catch(() => ({})) as { message?: string };
        toast.error(err.message ?? 'Code promo invalide ou expiré');
      }
    } catch {
      // Network error — fall back to hardcoded demo coupons
      const found = FALLBACK_COUPONS[code];
      if (found) {
        setAppliedCoupon({ code, ...found });
        toast.success(`Code "${code}" appliqué ! (mode hors-ligne)`);
      } else {
        toast.error('Code promo invalide ou expiré');
      }
    } finally {
      setCouponLoading(false);
    }
  }

  function removeCoupon() {
    setAppliedCoupon(null);
    setCouponCode('');
  }

  function couponDiscount(): number {
    if (!appliedCoupon) return 0;
    if (appliedCoupon.type === 'percent') return subtotal() * appliedCoupon.discount / 100;
    return Math.min(appliedCoupon.discount, subtotal());
  }

  function finalTotal(): number {
    return Math.max(0, total() - couponDiscount());
  }

  const handlePlaceOrder = async () => {
    if (!address) {
      toast.error('Veuillez entrer une adresse de livraison');
      return;
    }

    if (paymentMethod === 'card') {
      setLoading(true);
      try {
        const data = await api.post<unknown, { clientSecret: string; paymentIntentId: string }>(
          '/payments/intent',
          {
            amount: Math.round(total() * 100),
            currency: 'eur',
            orderId: 'ORD-' + Date.now(),
          }
        );
        setClientSecret(data.clientSecret);
        setPaymentIntentId(data.paymentIntentId);
      } catch {
        toast.error('Impossible de préparer le paiement. Veuillez réessayer.');
      } finally {
        setLoading(false);
      }
    } else {
      // Non-card payment methods: mock flow
      setLoading(true);
      await new Promise((r) => setTimeout(r, 1000));
      const orderId = `ORD-${Date.now()}`;
      clearCart();
      if (selectedSlot === 'schedule' && scheduledDate && scheduledTime) {
        const dateLabel = new Date(scheduledDate).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
        toast.success(`Commande programmée pour le ${dateLabel} à ${scheduledTime} !`);
      } else {
        toast.success('Commande passée avec succès !');
      }
      triggerReviewModal();
      router.push(`/orders/${orderId}/track`);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (items.length === 0) {
      router.replace('/menu');
    }
  }, [items.length, router]);

  if (items.length === 0) return null;

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-surface-50 py-8">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <h1 className="mb-6 text-2xl font-bold text-surface-900">Finaliser la commande</h1>

          <div className="grid gap-6 lg:grid-cols-[1fr,400px]">
            {/* Left: Forms */}
            <div className="space-y-4">
              {/* Delivery address */}
              <Card padding="lg">
                <div className="mb-4 flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100">
                    <MapPin className="h-4 w-4 text-brand-600" />
                  </div>
                  <h2 className="font-semibold text-surface-900">Adresse de livraison</h2>
                </div>
                <Input
                  label="Adresse complète"
                  placeholder="12 rue de la Paix, 75001 Paris"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  required
                />
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <Input label="Appartement / Étage" placeholder="Bât. A, 3ème étage" />
                  <Input label="Digicode" placeholder="A1234" />
                </div>
              </Card>

              {/* Delivery slot */}
              <Card padding="lg">
                <div className="mb-4 flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                    <Clock className="h-4 w-4 text-blue-600" />
                  </div>
                  <h2 className="font-semibold text-surface-900">Heure de livraison</h2>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                  {deliverySlots.map((slot) => (
                    <button
                      key={slot.id}
                      onClick={() => setSelectedSlot(slot.id)}
                      className={`rounded-xl border p-3 text-left transition-all ${
                        selectedSlot === slot.id
                          ? 'border-brand-500 bg-brand-50'
                          : 'border-surface-200 bg-white hover:border-surface-300'
                      }`}
                    >
                      <div className="flex items-center gap-1 mb-0.5">
                        {slot.id === 'schedule' && <Calendar className={`h-3 w-3 ${selectedSlot === slot.id ? 'text-brand-600' : 'text-surface-400'}`} />}
                        <p className={`text-sm font-semibold ${selectedSlot === slot.id ? 'text-brand-700' : 'text-surface-900'}`}>
                          {slot.label}
                        </p>
                      </div>
                      <p className="text-xs text-surface-400">{slot.sublabel}</p>
                    </button>
                  ))}
                </div>

                {selectedSlot === 'schedule' && (
                  <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl border border-brand-200 bg-brand-50 p-4">
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-surface-700">Date</label>
                      <input
                        type="date"
                        value={scheduledDate}
                        min={new Date().toISOString().split('T')[0]}
                        onChange={(e) => setScheduledDate(e.target.value)}
                        className="w-full rounded-xl border border-surface-200 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-surface-700">Heure</label>
                      <select
                        value={scheduledTime}
                        onChange={(e) => setScheduledTime(e.target.value)}
                        className="w-full rounded-xl border border-surface-200 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
                      >
                        <option value="">Choisir...</option>
                        {Array.from({ length: 28 }, (_, i) => {
                          const totalMins = 11 * 60 + i * 30;
                          const h = Math.floor(totalMins / 60);
                          const m = totalMins % 60;
                          const label = `${String(h).padStart(2, '0')}h${String(m).padStart(2, '0')}`;
                          return <option key={label} value={label}>{label}</option>;
                        })}
                      </select>
                    </div>
                    {scheduledDate && scheduledTime && (
                      <div className="col-span-2 flex items-center gap-2 rounded-lg bg-brand-500/10 px-3 py-2">
                        <Calendar className="h-4 w-4 text-brand-600" />
                        <span className="text-sm font-medium text-brand-700">
                          Livraison programmée : {new Date(scheduledDate).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })} à {scheduledTime}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </Card>

              {/* Payment */}
              <Card padding="lg">
                <div className="mb-4 flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
                    <CreditCard className="h-4 w-4 text-green-600" />
                  </div>
                  <h2 className="font-semibold text-surface-900">Paiement</h2>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 mb-4">
                  {[
                    { id: 'card' as const, label: 'Carte', icon: '💳' },
                    { id: 'apple_pay' as const, label: 'Apple Pay', icon: '' },
                    { id: 'google_pay' as const, label: 'Google Pay', icon: '🇬' },
                    { id: 'cash' as const, label: 'Espèces', icon: '💵' },
                  ].map((method) => (
                    <button
                      key={method.id}
                      onClick={() => {
                        setPaymentMethod(method.id);
                        setClientSecret(null);
                        setPaymentIntentId(null);
                      }}
                      className={`flex items-center justify-center gap-2 rounded-xl border p-3 transition-all ${
                        paymentMethod === method.id
                          ? 'border-brand-500 bg-brand-50 text-brand-700'
                          : 'border-surface-200 bg-white text-surface-600 hover:border-surface-300'
                      }`}
                    >
                      <span>{method.icon}</span>
                      <span className="text-sm font-medium">{method.label}</span>
                    </button>
                  ))}
                </div>

                {paymentMethod === 'card' && clientSecret && (
                  <Elements stripe={stripePromise} options={{ clientSecret }}>
                    <StripeCardForm
                      clientSecret={clientSecret}
                      onSuccess={() => {
                        clearCart();
                        router.push(`/orders/ORD-${Date.now()}/track`);
                      }}
                      onError={(msg) => toast.error(msg)}
                      loading={loading}
                      setLoading={setLoading}
                    />
                  </Elements>
                )}
              </Card>

              {/* Notes */}
              <Card padding="lg">
                <h2 className="mb-3 font-semibold text-surface-900">Instructions spéciales</h2>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Allergies, préférences, instructions pour le livreur..."
                  rows={3}
                  className="w-full rounded-xl border border-surface-200 px-3 py-2.5 text-sm text-surface-900 placeholder:text-surface-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 resize-none"
                />
              </Card>
            </div>

            {/* Right: Summary */}
            <div className="space-y-4">
              <Card padding="lg">
                <h2 className="mb-4 font-semibold text-surface-900">Récapitulatif</h2>
                <div className="space-y-3">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">
                          {item.quantity}
                        </span>
                        <span className="text-sm text-surface-700">{item.name}</span>
                      </div>
                      <span className="text-sm font-medium text-surface-900">
                        {(item.price * item.quantity).toFixed(2)}€
                      </span>
                    </div>
                  ))}
                </div>

                {/* Coupon code */}
                <div className="mt-4 border-t border-surface-100 pt-4">
                  {appliedCoupon ? (
                    <div className="flex items-center justify-between rounded-xl bg-green-50 px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <Tag className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-semibold text-green-700">{appliedCoupon.code}</span>
                        <span className="text-xs text-green-600">
                          −{appliedCoupon.type === 'percent' ? `${appliedCoupon.discount}%` : `${appliedCoupon.discount}€`}
                        </span>
                      </div>
                      <button onClick={removeCoupon} className="text-green-500 hover:text-green-700">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        onKeyDown={(e) => e.key === 'Enter' && applyCoupon()}
                        placeholder="Code promo"
                        className="flex-1 rounded-xl border border-surface-200 bg-surface-50 px-3 py-2 text-sm uppercase tracking-wider placeholder:normal-case placeholder:tracking-normal focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                      />
                      <button
                        onClick={applyCoupon}
                        disabled={couponLoading || !couponCode}
                        className="flex items-center gap-1.5 rounded-xl bg-surface-900 px-4 py-2 text-sm font-medium text-white hover:bg-surface-800 disabled:opacity-50"
                      >
                        <Tag className="h-3.5 w-3.5" />
                        {couponLoading ? '...' : 'Appliquer'}
                      </button>
                    </div>
                  )}
                </div>

                <div className="mt-4 space-y-2 border-t border-surface-100 pt-4">
                  <div className="flex justify-between text-sm text-surface-600">
                    <span>Sous-total</span>
                    <span>{subtotal().toFixed(2)}€</span>
                  </div>
                  <div className="flex justify-between text-sm text-surface-600">
                    <span>Livraison</span>
                    <span>
                      {deliveryFee() === 0 ? (
                        <span className="text-green-600">Gratuite</span>
                      ) : (
                        `${deliveryFee().toFixed(2)}€`
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm text-surface-600">
                    <span>TVA</span>
                    <span>{tax().toFixed(2)}€</span>
                  </div>
                  {appliedCoupon && (
                    <div className="flex justify-between text-sm font-medium text-green-600">
                      <span>Réduction ({appliedCoupon.code})</span>
                      <span>−{couponDiscount().toFixed(2)}€</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-surface-100 pt-2 font-bold text-surface-900">
                    <span>Total à payer</span>
                    <span className="text-lg">{finalTotal().toFixed(2)}€</span>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-2 rounded-xl bg-green-50 px-3 py-2.5">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span className="text-xs text-green-700">Vous gagnerez 45 points de fidélité</span>
                </div>
              </Card>

              {/* Primary CTA: hidden for card when clientSecret present (StripeCardForm has its own button) */}
              {!(paymentMethod === 'card' && clientSecret) && (
                <Button
                  fullWidth
                  size="lg"
                  loading={loading}
                  onClick={handlePlaceOrder}
                  icon={<Lock className="h-4 w-4" />}
                >
                  {paymentMethod === 'card'
                    ? 'Préparer le paiement'
                    : `Payer ${finalTotal().toFixed(2)}€`}
                </Button>
              )}

              <p className="text-center text-xs text-surface-400">
                Paiement 100% sécurisé via Stripe · SSL
              </p>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showReviewModal && (
          <motion.div
            initial={{ opacity: 0, y: 32, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 32, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            className="fixed bottom-6 right-6 z-50 w-80 rounded-2xl bg-white shadow-2xl ring-1 ring-surface-200 p-5"
          >
            <button
              onClick={dismissReviewModal}
              className="absolute right-3 top-3 text-surface-400 hover:text-surface-600"
              aria-label="Fermer"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="mb-3 flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white shadow ring-1 ring-surface-100 text-lg font-bold">
                <span style={{ background: 'linear-gradient(135deg,#4285F4 25%,#EA4335 50%,#FBBC05 75%,#34A853)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>G</span>
              </span>
              <p className="font-semibold text-surface-900 text-sm">Votre avis compte !</p>
            </div>

            <p className="mb-4 text-xs text-surface-500 leading-relaxed">
              Vous avez apprécié votre commande ? Laissez-nous un avis Google pour aider d&apos;autres clients.
            </p>

            <div className="mb-4 flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onMouseEnter={() => setHoveredStar(n)}
                  onMouseLeave={() => setHoveredStar(0)}
                  onClick={() => setReviewStars(n)}
                  className="transition-transform hover:scale-110"
                  aria-label={`${n} étoile${n > 1 ? 's' : ''}`}
                >
                  <Star
                    className="h-6 w-6"
                    fill={(hoveredStar || reviewStars) >= n ? '#f97316' : 'none'}
                    stroke={(hoveredStar || reviewStars) >= n ? '#f97316' : '#d1d5db'}
                  />
                </button>
              ))}
            </div>

            <a
              href="https://g.page/r/review"
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 transition-colors"
            >
              Laisser un avis Google →
            </a>

            <button
              onClick={dismissReviewModal}
              className="mt-2.5 w-full text-center text-xs text-surface-400 hover:text-surface-600 transition-colors"
            >
              Plus tard
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
