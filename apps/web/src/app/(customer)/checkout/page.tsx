'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  MapPin,
  CreditCard,
  Smartphone,
  Clock,
  ChevronRight,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Navbar } from '@/components/layout/Navbar';
import { useCartStore } from '@/store/cart';

type PaymentMethod = 'card' | 'apple_pay' | 'google_pay' | 'cash';

const deliverySlots = [
  { id: 'asap', label: 'Dès que possible', sublabel: '20–35 min' },
  { id: '12:30', label: '12h30', sublabel: 'Aujourd\'hui' },
  { id: '13:00', label: '13h00', sublabel: 'Aujourd\'hui' },
  { id: '13:30', label: '13h30', sublabel: 'Aujourd\'hui' },
];

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, deliveryFee, tax, total, clearCart } = useCartStore();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [selectedSlot, setSelectedSlot] = useState('asap');
  const [loading, setLoading] = useState(false);
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');

  const handlePlaceOrder = async () => {
    if (!address) {
      toast.error('Veuillez entrer une adresse de livraison');
      return;
    }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 2000));
    const orderId = `ORD-${Date.now()}`;
    clearCart();
    toast.success('Commande passée avec succès !');
    router.push(`/orders/${orderId}/track`);
    setLoading(false);
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
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
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
                      <p className={`text-sm font-semibold ${selectedSlot === slot.id ? 'text-brand-700' : 'text-surface-900'}`}>
                        {slot.label}
                      </p>
                      <p className="text-xs text-surface-400">{slot.sublabel}</p>
                    </button>
                  ))}
                </div>
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
                      onClick={() => setPaymentMethod(method.id)}
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

                {paymentMethod === 'card' && (
                  <div className="space-y-3">
                    <Input label="Numéro de carte" placeholder="1234 5678 9012 3456" leftIcon={<CreditCard className="h-4 w-4" />} />
                    <div className="grid grid-cols-2 gap-3">
                      <Input label="Date d'expiration" placeholder="MM/AA" />
                      <Input label="CVV" placeholder="123" />
                    </div>
                    <Input label="Nom sur la carte" placeholder="Jean Dupont" />
                  </div>
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

                <div className="mt-4 space-y-2 border-t border-surface-100 pt-4">
                  <div className="flex justify-between text-sm text-surface-600">
                    <span>Sous-total</span>
                    <span>{subtotal().toFixed(2)}€</span>
                  </div>
                  <div className="flex justify-between text-sm text-surface-600">
                    <span>Livraison</span>
                    <span>{deliveryFee() === 0 ? <span className="text-green-600">Gratuite</span> : `${deliveryFee().toFixed(2)}€`}</span>
                  </div>
                  <div className="flex justify-between text-sm text-surface-600">
                    <span>TVA</span>
                    <span>{tax().toFixed(2)}€</span>
                  </div>
                  <div className="flex justify-between border-t border-surface-100 pt-2 font-bold text-surface-900">
                    <span>Total à payer</span>
                    <span className="text-lg">{total().toFixed(2)}€</span>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-2 rounded-xl bg-green-50 px-3 py-2.5">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span className="text-xs text-green-700">Vous gagnerez 45 points de fidélité</span>
                </div>
              </Card>

              <Button
                fullWidth
                size="lg"
                loading={loading}
                onClick={handlePlaceOrder}
                icon={<Lock className="h-4 w-4" />}
              >
                Payer {total().toFixed(2)}€
              </Button>

              <p className="text-center text-xs text-surface-400">
                Paiement 100% sécurisé via Stripe · SSL
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
