import { initStripe } from '@stripe/stripe-react-native';

export const STRIPE_PK = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? 'pk_test_placeholder';

export async function setupStripe() {
  await initStripe({
    publishableKey: STRIPE_PK,
    merchantIdentifier: 'merchant.com.foodstack',
  });
}
