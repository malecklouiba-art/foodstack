import { useEffect } from 'react';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StripeProvider } from '@stripe/stripe-react-native';
import { STRIPE_PK, setupStripe } from '@/lib/stripe';
import { useAuthStore } from '@/store/auth';

export default function RootLayout() {
  const { loadStoredAuth, isAuthenticated, isLoading } = useAuthStore();

  useEffect(() => {
    setupStripe().catch(() => {});
    loadStoredAuth().catch(() => {});
  }, []);

  useEffect(() => {
    if (isLoading) return;
    if (isAuthenticated) {
      router.replace('/(tabs)');
    } else {
      router.replace('/(auth)/login');
    }
  }, [isAuthenticated, isLoading]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StripeProvider publishableKey={STRIPE_PK} merchantIdentifier="merchant.com.foodstack">
          <StatusBar style="dark" />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="order/[id]/track" options={{ presentation: 'modal' }} />
          </Stack>
        </StripeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
