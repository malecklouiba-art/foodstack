import { useCallback, useState } from 'react';
import { useStripe } from '@stripe/stripe-react-native';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001';

export function useStripePayment() {
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [loading, setLoading] = useState(false);

  const pay = useCallback(async (amountCents: number, orderId: string): Promise<boolean> => {
    setLoading(true);
    try {
      // 1. Fetch payment intent from API
      const res = await fetch(`${API_URL}/payments/intent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: amountCents, currency: 'eur', orderId }),
      });
      if (!res.ok) throw new Error('Erreur création paiement');
      const { clientSecret } = await res.json();

      // 2. Init payment sheet
      const { error: initError } = await initPaymentSheet({
        paymentIntentClientSecret: clientSecret,
        merchantDisplayName: 'FoodStack',
        style: 'alwaysLight',
        primaryButtonLabel: `Payer ${(amountCents / 100).toFixed(2)}€`,
        appearance: {
          colors: { primary: '#f97316' },
          shapes: { borderRadius: 16 },
        },
      });
      if (initError) throw new Error(initError.message);

      // 3. Present payment sheet
      const { error: presentError } = await presentPaymentSheet();
      if (presentError) {
        if (presentError.code === 'Canceled') return false;
        throw new Error(presentError.message);
      }
      return true;
    } finally {
      setLoading(false);
    }
  }, [initPaymentSheet, presentPaymentSheet]);

  return { pay, loading };
}
