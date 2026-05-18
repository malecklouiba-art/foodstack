import { useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, Alert,
  ActivityIndicator, TextInput, Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';
import { useCartStore } from '@/store/cart';
import { router } from 'expo-router';
import { useStripePayment } from '@/hooks/useStripePayment';
import { useApi } from '@/hooks/useApi';

interface CouponResult {
  valid: boolean;
  discountType?: 'percent' | 'fixed';
  discountValue?: number;
  description?: string;
  message?: string;
}

export default function CartScreen() {
  const { items, increment, decrement, remove, clear, total, deliveryFee: storedDeliveryFee } = useCartStore();
  const { pay, loading: payLoading } = useStripePayment();
  const api = useApi();

  const subtotal = total();
  const deliveryFee = items.length > 0 ? storedDeliveryFee : 0;

  // ── Promo code ───────────────────────────────────────────────────────────────
  const [couponCode, setCouponCode] = useState('');
  const [couponInput, setCouponInput] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponLabel, setCouponLabel] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');

  const discountAmount =
    couponDiscount > 0
      ? Math.min(couponDiscount, subtotal)
      : 0;
  const grandTotal = Math.max(0, subtotal + deliveryFee - discountAmount);

  const applyCoupon = async () => {
    const code = couponInput.trim().toUpperCase();
    if (!code) return;
    Keyboard.dismiss();
    setCouponLoading(true);
    setCouponError('');

    try {
      const result = await api.post<CouponResult>('/api/v1/coupons/validate', {
        code,
        amount: subtotal,
      });

      if (!result.valid) {
        setCouponError(result.message ?? 'Code invalide.');
        return;
      }

      let discount = 0;
      let label = '';
      if (result.discountType === 'percent' && result.discountValue) {
        discount = (subtotal * result.discountValue) / 100;
        label = `${result.description ?? code} (−${result.discountValue}%)`;
      } else if (result.discountType === 'fixed' && result.discountValue) {
        discount = result.discountValue;
        label = `${result.description ?? code} (−${result.discountValue.toFixed(2)}€)`;
      }

      setCouponCode(code);
      setCouponDiscount(discount);
      setCouponLabel(label);
      setCouponInput('');
    } catch {
      // Fallback mock validation for demo/offline
      const MOCK_CODES: Record<string, { type: 'percent' | 'fixed'; value: number; label: string }> = {
        'BIENVENUE10': { type: 'percent', value: 10, label: 'Nouveau client (−10%)' },
        'WEEKEND10':   { type: 'percent', value: 10, label: 'Promo week-end (−10%)' },
        'FIDELE20':    { type: 'percent', value: 20, label: 'Client fidèle (−20%)' },
        'FLASH15':     { type: 'percent', value: 15, label: 'Offre flash (−15%)' },
        'GRATUIT8':    { type: 'fixed',   value: 8,  label: 'Livraison offerte (−8€)' },
      };
      const mock = MOCK_CODES[code];
      if (mock) {
        const discount = mock.type === 'percent' ? (subtotal * mock.value) / 100 : mock.value;
        setCouponCode(code);
        setCouponDiscount(discount);
        setCouponLabel(mock.label);
        setCouponInput('');
      } else {
        setCouponError('Code invalide ou expiré.');
      }
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = () => {
    setCouponCode('');
    setCouponDiscount(0);
    setCouponLabel('');
    setCouponError('');
    setCouponInput('');
  };

  // ── Checkout ─────────────────────────────────────────────────────────────────
  const handleCheckout = async () => {
    const amountCents = Math.round(grandTotal * 100);
    const orderId = `ORD-${Date.now()}`;
    try {
      const success = await pay(amountCents, orderId);
      if (success) {
        clear();
        router.push(`/order/${orderId}/track`);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Une erreur est survenue';
      Alert.alert('Erreur de paiement', message);
    }
  };

  if (items.length === 0) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Mon panier</Text>
        </View>
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>🛒</Text>
          <Text style={styles.emptyTitle}>Panier vide</Text>
          <Text style={styles.emptyText}>Ajoutez des articles depuis le menu</Text>
          <TouchableOpacity style={styles.browseBtn} onPress={() => router.push('/(tabs)/menu')} activeOpacity={0.85}>
            <Text style={styles.browseBtnText}>Voir le menu</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mon panier</Text>
        <TouchableOpacity onPress={() => Alert.alert('Vider le panier', 'Supprimer tous les articles ?', [
          { text: 'Annuler', style: 'cancel' },
          { text: 'Vider', style: 'destructive', onPress: clear },
        ])}>
          <Text style={styles.clearText}>Tout vider</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={items}
        keyExtractor={(i) => i.id}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => (
          <View style={styles.cartItem}>
            <View style={styles.itemImage}>
              <Text style={styles.itemEmoji}>🍽️</Text>
            </View>
            <View style={styles.itemInfo}>
              <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
              <Text style={styles.itemPrice}>{item.price.toFixed(2)}€</Text>
            </View>
            <View style={styles.qtyControls}>
              <TouchableOpacity style={styles.qtyBtn} onPress={() => decrement(item.id)} activeOpacity={0.7}>
                <Text style={styles.qtyBtnText}>−</Text>
              </TouchableOpacity>
              <Text style={styles.qtyValue}>{item.quantity}</Text>
              <TouchableOpacity style={styles.qtyBtn} onPress={() => increment(item.id)} activeOpacity={0.7}>
                <Text style={styles.qtyBtnText}>+</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.lineTotal}>{(item.price * item.quantity).toFixed(2)}€</Text>
          </View>
        )}
        ListFooterComponent={
          <View>
            {/* Promo code */}
            <View style={styles.couponCard}>
              <Text style={styles.couponTitle}>🏷️ Code promo</Text>
              {couponCode ? (
                <View style={styles.couponApplied}>
                  <View style={styles.couponAppliedLeft}>
                    <Text style={styles.couponAppliedCode}>{couponCode}</Text>
                    <Text style={styles.couponAppliedLabel}>{couponLabel}</Text>
                  </View>
                  <TouchableOpacity onPress={removeCoupon} style={styles.couponRemoveBtn}>
                    <Text style={styles.couponRemoveText}>✕</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  <View style={styles.couponRow}>
                    <TextInput
                      style={styles.couponInput}
                      value={couponInput}
                      onChangeText={(t) => {
                        setCouponInput(t.toUpperCase());
                        setCouponError('');
                      }}
                      placeholder="Entrez votre code"
                      placeholderTextColor={Colors.surface[400]}
                      autoCapitalize="characters"
                      returnKeyType="done"
                      onSubmitEditing={applyCoupon}
                    />
                    <TouchableOpacity
                      style={[styles.couponApplyBtn, (!couponInput.trim() || couponLoading) && styles.couponApplyBtnDisabled]}
                      onPress={applyCoupon}
                      disabled={!couponInput.trim() || couponLoading}
                      activeOpacity={0.8}
                    >
                      {couponLoading
                        ? <ActivityIndicator color="#fff" size="small" />
                        : <Text style={styles.couponApplyText}>Appliquer</Text>
                      }
                    </TouchableOpacity>
                  </View>
                  {couponError ? <Text style={styles.couponError}>{couponError}</Text> : null}
                </>
              )}
            </View>

            {/* Order summary */}
            <View style={styles.summary}>
              <Text style={styles.summaryTitle}>Récapitulatif</Text>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Sous-total</Text>
                <Text style={styles.summaryValue}>{subtotal.toFixed(2)}€</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Livraison</Text>
                <Text style={styles.summaryValue}>{deliveryFee.toFixed(2)}€</Text>
              </View>
              {discountAmount > 0 && (
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, styles.discountLabel]}>Réduction</Text>
                  <Text style={styles.discountValue}>−{discountAmount.toFixed(2)}€</Text>
                </View>
              )}
              <View style={[styles.summaryRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>{grandTotal.toFixed(2)}€</Text>
              </View>
            </View>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.checkoutBtn, payLoading && styles.checkoutBtnDisabled]}
          activeOpacity={0.88}
          onPress={handleCheckout}
          disabled={payLoading}
        >
          {payLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.checkoutBtnText}>Commander · {grandTotal.toFixed(2)}€</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.surface[50] },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12,
  },
  headerTitle: { fontSize: 26, fontWeight: '800', color: Colors.surface[900] },
  clearText: { fontSize: 14, color: Colors.brand[500], fontWeight: '600' },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  emptyEmoji: { fontSize: 64, marginBottom: 4 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: Colors.surface[900] },
  emptyText:  { fontSize: 14, color: Colors.surface[400], textAlign: 'center' },
  browseBtn: {
    marginTop: 8, backgroundColor: Colors.brand[500], borderRadius: 14,
    paddingHorizontal: 24, paddingVertical: 12,
  },
  browseBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  list: { paddingHorizontal: 16, paddingBottom: 120 },

  cartItem: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#fff', borderRadius: 14, padding: 12, marginBottom: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 1,
  },
  itemImage: {
    width: 52, height: 52, borderRadius: 10,
    backgroundColor: Colors.surface[100], alignItems: 'center', justifyContent: 'center',
  },
  itemEmoji: { fontSize: 22 },
  itemInfo: { flex: 1 },
  itemName:  { fontSize: 14, fontWeight: '700', color: Colors.surface[900], marginBottom: 2 },
  itemPrice: { fontSize: 13, color: Colors.surface[500] },
  lineTotal: { fontSize: 15, fontWeight: '800', color: Colors.brand[600], minWidth: 52, textAlign: 'right' },

  qtyControls: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  qtyBtn: {
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: Colors.surface[100], alignItems: 'center', justifyContent: 'center',
  },
  qtyBtnText: { fontSize: 18, color: Colors.surface[900], fontWeight: '700', lineHeight: 22 },
  qtyValue:   { fontSize: 14, fontWeight: '700', color: Colors.surface[900], minWidth: 16, textAlign: 'center' },

  couponCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16, marginTop: 8, marginBottom: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 1,
  },
  couponTitle: { fontSize: 14, fontWeight: '700', color: Colors.surface[900], marginBottom: 10 },
  couponRow:   { flexDirection: 'row', gap: 8 },
  couponInput: {
    flex: 1, height: 44, borderRadius: 10, borderWidth: 1.5, borderColor: Colors.surface[200],
    paddingHorizontal: 12, fontSize: 14, fontWeight: '700', color: Colors.surface[900],
    letterSpacing: 1,
  },
  couponApplyBtn: {
    backgroundColor: Colors.brand[500], borderRadius: 10, paddingHorizontal: 16,
    alignItems: 'center', justifyContent: 'center', minWidth: 96,
  },
  couponApplyBtnDisabled: { opacity: 0.5 },
  couponApplyText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  couponError: { fontSize: 12, color: Colors.danger, marginTop: 6, fontWeight: '500' },
  couponApplied: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.brand[50], borderRadius: 10, padding: 10,
    borderWidth: 1, borderColor: Colors.brand[100],
  },
  couponAppliedLeft: { flex: 1 },
  couponAppliedCode: { fontSize: 14, fontWeight: '800', color: Colors.brand[700], letterSpacing: 1 },
  couponAppliedLabel: { fontSize: 12, color: Colors.brand[600], marginTop: 2 },
  couponRemoveBtn: { padding: 4 },
  couponRemoveText: { fontSize: 16, color: Colors.surface[400], fontWeight: '700' },

  summary: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16, marginTop: 0,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 1,
  },
  summaryTitle: { fontSize: 16, fontWeight: '700', color: Colors.surface[900], marginBottom: 12 },
  summaryRow:   { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  summaryLabel: { fontSize: 14, color: Colors.surface[500] },
  summaryValue: { fontSize: 14, color: Colors.surface[700], fontWeight: '600' },
  discountLabel:{ color: Colors.success },
  discountValue:{ fontSize: 14, fontWeight: '700', color: Colors.success },
  totalRow:     { borderTopWidth: 1, borderTopColor: Colors.surface[100], paddingTop: 10, marginTop: 4, marginBottom: 0 },
  totalLabel:   { fontSize: 16, fontWeight: '800', color: Colors.surface[900] },
  totalValue:   { fontSize: 18, fontWeight: '800', color: Colors.brand[600] },

  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#fff', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 28,
    borderTopWidth: 1, borderTopColor: Colors.surface[100],
  },
  checkoutBtn: {
    backgroundColor: Colors.brand[500], borderRadius: 16,
    paddingVertical: 16, alignItems: 'center',
    shadowColor: Colors.brand[500], shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 10, elevation: 5,
  },
  checkoutBtnText: { color: '#fff', fontSize: 17, fontWeight: '800' },
  checkoutBtnDisabled: { opacity: 0.6 },
});
