'use client';

import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js';
import { Lock } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface StripeCardFormProps {
  clientSecret: string;
  onSuccess: (paymentIntentId: string) => void;
  onError: (msg: string) => void;
  loading: boolean;
  setLoading: (v: boolean) => void;
}

export function StripeCardForm({
  clientSecret,
  onSuccess,
  onError,
  loading,
  setLoading,
}: StripeCardFormProps) {
  const stripe = useStripe();
  const elements = useElements();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    try {
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement)!,
        },
      });

      if (error) {
        onError(error.message ?? 'Une erreur est survenue');
      } else if (paymentIntent?.status === 'succeeded') {
        onSuccess(paymentIntent.id);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="rounded-xl border border-surface-200 bg-white p-4">
        <CardElement
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#18181b',
                '::placeholder': { color: '#a1a1aa' },
              },
            },
          }}
        />
      </div>
      <Button
        type="submit"
        fullWidth
        size="lg"
        loading={loading}
        disabled={!stripe || !elements}
        icon={<Lock className="h-4 w-4" />}
      >
        Confirmer le paiement
      </Button>
    </form>
  );
}
