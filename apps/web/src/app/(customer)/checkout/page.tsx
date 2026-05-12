'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import {
  MapPin,
  CreditCard,
  Clock,
  CheckCircle2,
  Loader2,
  Tag,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Navbar } from '@/components/layout/Navbar';
import { StripeCardForm } from '@/components/checkout/StripeCardForm';
import { useCartStore } from '@/store/cart';
import axios from 'axios';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? '');

const COUPONS: Record<string, { type: 'percent' | 'fixed' | 'delivery'; value: number; label: string }> = {
  'SAVE10': { type: 'percent', value: 10, label: '-10%' },
  'WELCOME20': { type: 'percent', value: 20, label: '-20%' },
  'FREEDEL': { type: 'delivery', value: 0, label: 'Livraison offerte' },
  'MOINS5': { type: 'fixed', value: 5, label: '-5 €' },
};

const DELIVERY_SLOTS = [
  { id: 'asap', label: 'Dès que possible', sublabel: '20–35 min' },
  { id: '12:30', label: '12h30', sublabel: "Aujourd'hui" },
  { id: '13:00', label: '13h00', sublabel: "Aujourd'hui" },
  { id: '13:30', label: '13h30', sublabel: "Aujourd'hui" },
];

function CheckoutForm() {
  const router = useRouter();
  const { items, subtotal, deliveryFee, tax, total, clearCart } = useCartStore();
  const [selectedSlot, setSelectedSlot] = useState('asap');
  const [address, setAddress] = useState('');
  const [apt, setApt] = useState('');
  const [code, setCode] = useState('');
  const [notes, setNotes] = useState('');
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [couponError, setCouponError] = useState('');
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loadingIntent, setLoadingIntent] = useState(false);
  const [step, setStep] = useState<'details' | 'payment'>('details');

  const coupon = appliedCoupon ? COUPONS[appliedCoupon] : null;
  const discount = coupon
    ? coupon.type === 'percent' ? (total() * coupon.value) / 100
    : coupon.type === 'fixed' ? coupon.value
    : total() > 0 ? useCartStore.getState().deliveryFee() : 0
    : 0;
  const orderTotal = Math.max(0, total() - (coupon?.type === 'delivery' ? 0 : discount));

  const applyCoupon = () => {
    const key = couponInput.trim().toUpperCase();
    if (COUPONS[key]) {
      setAppliedCoupon(key);
      setCouponError('');
      setCouponInput('');
      toast.success(`Code "${key}" appliqué !`);
    } else {
      setCouponError('Code invalide ou expiré');
    }
  };

  const goToPayment = async () => {
    if (!address.trim()) {
      toast.error('Veuillez entrer une adresse de livraison');
      return;
    }
    setLoadingIntent(true);
    try {
      const { data } = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'}/payments/intent`,
        { amount: Math.round(orderTotal * 100), currency: 'eur', orderId: `tmp-${Date.now()}` },
        { headers: { Authorization: `Bearer ${localStorage.getItem('access_token') ?? ''}` } },
      );
      setClientSecret(data.clientSecret);
      setStep('payment');
    } catch {
      toast.error('Impossible d\'initialiser le paiement. Réessayez.');
    } finally {
      setLoadingIntent(false);
    }
  };

  const onPaymentSuccess = (paymentIntentId: string) => {
    clearCart();
    toast.success('Commande confirmée !');
    router.push(`/orders/${paymentIntentId.slice(-8)}/track`);
  };

  const onPaymentError = (message: string) => {
    toast.error(message);
  };

  useEffect(() => {
    if (items.length === 0) router.replace('/menu');
  }, [items.length, router]);

  if (items.length === 0) return null;

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-surface-50 py-8">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          {/* Step indicator */}
          <div className="mb-6 flex items-center gap-3">
            <button onClick={() => step === 'payment' && setStep('details')} className="flex items-center gap-2">
              <span className={`flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold ${step === 'details' ? 'bg-brand-500 text-white' : 'bg-green-500 text-white'}`}>
                {step === 'payment' ? <CheckCircle2 className="h-4 w-4" /> : '1'}
              </span>
              <span className={`text-sm font-medium ${step === 'details' ? 'text-surface-900' : 'text-surface-500'}`}>Livraison</span>
            </button>
            <div className="h-px w-8 bg-surface-200" />
            <span className="flex items-center gap-2">
              <span className={`flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold ${step === 'payment' ? 'bg-brand-500 text-white' : 'bg-surface-200 text-surface-500'}`}>2</span>
              <span className={`text-sm font-medium ${step === 'payment' ? 'text-surface-900' : 'text-surface-400'}`}>Paiement</span>
            </span>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1fr,380px]">
            {/* Left col */}
            <div className="space-y-4">
              {step === 'details' && (
                <>
                  {/* Address */}
                  <Card padding="lg">
                    <div className="mb-4 flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100">
                        <MapPin className="h-4 w-4 text-brand-600" />
                      </div>
                      <h2 className="font-semibold text-surface-900">Adresse de livraison</h2>
                    </div>
                    <Input label="Adresse complète" placeholder="12 rue de la Paix, 75001 Paris"
                      value={address} onChange={(e) => setAddress(e.target.value)} required />
                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <Input label="Appartement / Étage" placeholder="Bât. A, 3ème étage"
                        value={apt} onChange={(e) => setApt(e.target.value)} />
                      <Input label="Digicode" placeholder="A1234"
                        value={code} onChange={(e) => setCode(e.target.value)} />
                    </div>
                  </Card>

                  {/* Slot */}
                  <Card padding="lg">
                    <div className="mb-4 flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                        <Clock className="h-4 w-4 text-blue-600" />
                      </div>
                      <h2 className="font-semibold text-surface-900">Heure de livraison</h2>
                    </div>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {DELIVERY_SLOTS.map((slot) => (
                        <button key={slot.id} onClick={() => setSelectedSlot(slot.id)}
                          className={`rounded-xl border p-3 text-left transition-all ${selectedSlot === slot.id ? 'border-brand-500 bg-brand-50' : 'border-surface-200 bg-white hover:border-surface-300'}`}>
                          <p className={`text-sm font-semibold ${selectedSlot === slot.id ? 'text-brand-700' : 'text-surface-900'}`}>{slot.label}</p>
                          <p className="text-xs text-surface-400">{slot.sublabel}</p>
                        </button>
                      ))}
                    </div>
                  </Card>

                  {/* Notes */}
                  <Card padding="lg">
                    <h2 className="mb-3 font-semibold text-surface-900">Instructions spéciales</h2>
                    <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
                      placeholder="Allergies, préférences, instructions pour le livreur..."
                      rows={3}
                      className="w-full resize-none rounded-xl border border-surface-200 px-3 py-2.5 text-sm placeholder:text-surface-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20" />
                  </Card>

                  <Button fullWidth size="lg" loading={loadingIntent} onClick={goToPayment}
                    icon={<CreditCard className="h-4 w-4" />}>
                    Continuer vers le paiement
                  </Button>
                </>
              )}

              {step === 'payment' && (
                <Card padding="lg">
                  <div className="mb-4 flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
                      <CreditCard className="h-4 w-4 text-green-600" />
                    </div>
                    <h2 className="font-semibold text-surface-900">Paiement sécurisé</h2>
                  </div>
                  {clientSecret ? (
                    <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'stripe', variables: { colorPrimary: '#f97316' } } }}>
                      <StripeCardForm total={orderTotal} onSuccess={onPaymentSuccess} onError={onPaymentError} />
                    </Elements>
                  ) : (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-brand-500" />
                    </div>
                  )}
                </Card>
              )}
            </div>

            {/* Right: summary */}
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
                        {(item.price * item.quantity).toFixed(2)} €
                      </span>
                    </div>
                  ))}
                </div>
                {/* Coupon input */}
                <div className="mt-4 border-t border-surface-100 pt-4">
                  {appliedCoupon ? (
                    <div className="flex items-center justify-between rounded-xl bg-green-50 px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <Tag className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-semibold text-green-700">{appliedCoupon}</span>
                        <span className="text-xs text-green-600">{COUPONS[appliedCoupon].label}</span>
                      </div>
                      <button onClick={() => setAppliedCoupon(null)} className="text-green-500 hover:text-green-700">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div>
                      <div className="flex gap-2">
                        <input
                          value={couponInput}
                          onChange={(e) => { setCouponInput(e.target.value); setCouponError(''); }}
                          onKeyDown={(e) => e.key === 'Enter' && applyCoupon()}
                          placeholder="Code promo"
                          className="h-9 flex-1 rounded-lg border border-surface-200 px-3 text-sm text-surface-900 placeholder:text-surface-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                        />
                        <button onClick={applyCoupon}
                          className="h-9 rounded-lg bg-surface-900 px-3 text-sm font-medium text-white hover:bg-surface-800">
                          Appliquer
                        </button>
                      </div>
                      {couponError && <p className="mt-1 text-xs text-red-500">{couponError}</p>}
                    </div>
                  )}
                </div>

                <div className="mt-4 space-y-2 border-t border-surface-100 pt-4">
                  <div className="flex justify-between text-sm text-surface-600">
                    <span>Sous-total</span><span>{subtotal().toFixed(2)} €</span>
                  </div>
                  <div className="flex justify-between text-sm text-surface-600">
                    <span>Livraison</span>
                    <span>{coupon?.type === 'delivery'
                      ? <span className="text-green-600">Offerte 🎉</span>
                      : deliveryFee() === 0 ? <span className="text-green-600">Gratuite</span>
                      : `${deliveryFee().toFixed(2)} €`}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm text-surface-600">
                    <span>TVA</span><span>{tax().toFixed(2)} €</span>
                  </div>
                  {coupon && coupon.type !== 'delivery' && (
                    <div className="flex justify-between text-sm font-medium text-green-600">
                      <span>Réduction ({coupon.label})</span>
                      <span>-{discount.toFixed(2)} €</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-surface-100 pt-2 font-bold text-surface-900">
                    <span>Total à payer</span>
                    <span className="text-lg">{orderTotal.toFixed(2)} €</span>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2 rounded-xl bg-green-50 px-3 py-2.5">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span className="text-xs text-green-700">
                    Vous gagnerez {Math.floor(orderTotal)} points de fidélité
                  </span>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default CheckoutForm;
