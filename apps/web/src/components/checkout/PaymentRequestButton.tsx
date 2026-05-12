'use client';

import { useEffect, useState } from 'react';
import { useStripe, PaymentRequestButtonElement } from '@stripe/react-stripe-js';
import type { PaymentRequest } from '@stripe/stripe-js';

interface PaymentRequestButtonProps {
  totalCents: number;
  clientSecret: string | null;
  onSuccess: () => void;
}

export function PaymentRequestButton({
  totalCents,
  clientSecret,
  onSuccess,
}: PaymentRequestButtonProps) {
  const stripe = useStripe();
  const [paymentRequest, setPaymentRequest] = useState<PaymentRequest | null>(null);

  useEffect(() => {
    if (!stripe || !clientSecret) return;

    const pr = stripe.paymentRequest({
      country: 'FR',
      currency: 'eur',
      total: { label: 'FoodStack', amount: totalCents },
      requestPayerName: true,
      requestPayerEmail: true,
    });

    pr.canMakePayment().then((result) => {
      if (result) {
        setPaymentRequest(pr);
      }
    });

    pr.on('paymentmethod', async (ev) => {
      const { error } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: ev.paymentMethod.id,
      });

      if (error) {
        ev.complete('fail');
      } else {
        ev.complete('success');
        onSuccess();
      }
    });
  }, [stripe, clientSecret, totalCents, onSuccess]);

  if (!paymentRequest) return null;

  return (
    <PaymentRequestButtonElement options={{ paymentRequest }} />
  );
}
