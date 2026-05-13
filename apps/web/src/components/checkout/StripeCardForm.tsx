'use client';

import { useState } from 'react';
import {
  useStripe,
  useElements,
  PaymentElement,
  AddressElement,
} from '@stripe/react-stripe-js';
import { Lock } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface StripeCardFormProps {
  total: number;
  onSuccess: (paymentIntentId: string) => void;
  onError: (message: string) => void;
}

export function StripeCardForm({ total, onSuccess, onError }: StripeCardFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setProcessing(true);
    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/orders`,
      },
      redirect: 'if_required',
    });

    if (error) {
      onError(error.message ?? 'Erreur de paiement');
      setProcessing(false);
      return;
    }

    if (paymentIntent?.status === 'succeeded') {
      onSuccess(paymentIntent.id);
    }
    setProcessing(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement
        options={{
          layout: 'tabs',
          wallets: { applePay: 'auto', googlePay: 'auto' },
        }}
      />
      <Button
        type="submit"
        fullWidth
        size="lg"
        loading={processing}
        disabled={!stripe || !elements}
        icon={<Lock className="h-4 w-4" />}
      >
        Payer {total.toFixed(2)} €
      </Button>
      <p className="text-center text-xs text-surface-400">
        Paiement 100% sécurisé via Stripe · SSL
      </p>
    </form>
  );
}
