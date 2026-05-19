import { useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, Alert,
  ActivityIndicator, TextInput, Keyboard, Modal, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';
import { useCartStore } from '@/store/cart';
import { router } from 'expo-router';
import { useStripePayment } from '@/hooks/useStripePayment';
import { useApi } from '@/hooks/useApi';

interface CouponResult {
  valid: boolean;
  discount?: number;
  discountType?: string | null;
  discountValue?: number;
  description?: string | null;
  message?: string | null;
}

// Saved addresses shape (matches addresses/index.tsx)
interface SavedAddress {
  id: string;
  label: string;
  address: string;
  isDefault?: boolean;
}

const MOCK_SAVED: SavedAddress[] = [
  { id: 'a1', label: 'Maison',  address: '12 rue de la Paix, 75001 Paris',            isDefault: true  },
  { id: 'a2', label: 'Bureau',  address: '45 avenue des Champs-Élysées, 75008 Paris', isDefault: false },
];

export default function CartScreen() {
  const { items, increment, decrement, remove, clear, total, deliveryFee: storedDeliveryFee, checkout, restaurantId } = useCartStore();
  const { pay, loading: payLoading } = useStripePayment();
  const api = useApi();

  const subtotal = total();
  const deliveryFee = items.length > 0 ? storedDeliveryFee : 0;

  // ── Checkout modal ──────────────────────────────────────────────────────────
  const [checkoutModalVisible, setCheckoutModalVisible] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [customAddress, setCustomAddress] = useState('');
  const [useCustom, setUseCustom] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const openCheckoutModal = async () => {
    try {
      const data = await api.get<any[]>('/api/v1/users/me/addresses');
      if (Array.isArray(data) && data.length > 0) {
        const mapped: SavedAddress[] = data.map((a) => ({
          id: a.id,
          label: a.label,
          address: a.address ?? [a.street, a.city, a.postalCode].filter(Boolean).join(', '),
          isDefault: a.isDefault,
        }));
        setSavedAddresses(mapped);
        setSelectedAddressId(mapped.find((a) => a.isDefault)?.id ?? mapped[0].id);
      }
    } catch {
      // No saved addresses available — user can type a custom address
    }
    setCheckoutModalVisible(true);
  };

  const selectedAddress = savedAddresses.find((a) => a.id === selectedAddressId);
  const deliveryAddress = useCustom
    ? customAddress.trim()
    : selectedAddress?.address ?? '';

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
        orderTotal: subtotal,
        restaurantId: restaurantId ?? '',
      });

      if (!result.valid) {
        setCouponError(result.message ?? 'Code invalide.');
        return;
      }

      const discount = result.discount ?? 0;
      let label = '';
      if (result.discountType === 'percent' && result.discountValue) {
        label = `${result.description ?? code} (−${result.discountValue}%)`;
      } else if (result.discountType === 'fixed' && result.discountValue) {
        label = `${result.description ?? code} (−${result.discountValue.toFixed(2)}€)`;
      } else {
        label = result.description ?? code;
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

  // ── Checkout — create order first, then pay ──────────────────────────────────
  const handleConfirmPayment = async () => {
    if (!deliveryAddress) {
      Alert.alert('Adresse requise', 'Veuillez sélectionner ou saisir une adresse de livraison.');
      return;
    }
    setCheckoutLoading(true);
    try {
      // Step 1: Create the order
      let realOrderId: string;
      try {
        const order = await checkout(deliveryAddress);
        realOrderId = order.id;
      } catch {
        // Fallback: use a temp ID if API is unavailable
        realOrderId = `ORD-${Date.now()}`;
      }

      // Step 2: Charge via Stripe
      const amountCents = Math.round(grandTotal * 100);
      const success = await pay(amountCents, realOrderId);
      if (success) {
        setCheckoutModalVisible(false);
        // cart is already cleared by checkout() or clear()
        clear();
        router.push(`/order/${realOrderId}/track`);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Une erreur est survenue';
      Alert.alert('Erreur', message);
    } finally {
      setCheckoutLoading(false);
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
          onPress={openCheckoutModal}
          disabled={payLoading}
        >
          {payLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.checkoutBtnText}>Commander · {grandTotal.toFixed(2)}€</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* ── Checkout confirmation modal ──────────────────────────────────────── */}
      <Modal
        visible={checkoutModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setCheckoutModalVisible(false)}
      >
        <SafeAreaView style={styles.modalSafe} edges={['top']}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Confirmer la commande</Text>
            <TouchableOpacity onPress={() => setCheckoutModalVisible(false)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={styles.modalClose}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled">

            {/* Address selection */}
            <Text style={styles.modalSection}>Adresse de livraison</Text>
            {savedAddresses.map((addr) => (
              <TouchableOpacity
                key={addr.id}
                style={[styles.addrCard, !useCustom && selectedAddressId === addr.id && styles.addrCardSelected]}
                onPress={() => { setSelectedAddressId(addr.id); setUseCustom(false); }}
                activeOpacity={0.7}
              >
                <View style={styles.addrCardLeft}>
                  <Text style={styles.addrLabel}>
                    {addr.label === 'Maison' ? '🏠' : addr.label === 'Bureau' ? '🏢' : '📍'} {addr.label}
                  </Text>
                  <Text style={styles.addrText} numberOfLines={2}>{addr.address}</Text>
                </View>
                {!useCustom && selectedAddressId === addr.id && (
                  <View style={styles.radioSelected}><View style={styles.radioDot} /></View>
                )}
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={[styles.addrCard, useCustom && styles.addrCardSelected]}
              onPress={() => setUseCustom(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.addrLabel}>📝 Autre adresse</Text>
              {useCustom && (
                <TextInput
                  style={styles.customAddrInput}
                  value={customAddress}
                  onChangeText={setCustomAddress}
                  placeholder="Entrez votre adresse…"
                  placeholderTextColor={Colors.surface[400]}
                  multiline
                  autoFocus
                />
              )}
            </TouchableOpacity>

            {/* Order summary */}
            <Text style={[styles.modalSection, { marginTop: 20 }]}>Récapitulatif</Text>
            <View style={styles.summaryCard}>
              {items.slice(0, 4).map((item) => (
                <View key={item.id} style={styles.summaryItemRow}>
                  <Text style={styles.summaryItemQty}>{item.quantity}×</Text>
                  <Text style={styles.summaryItemName} numberOfLines={1}>{item.name}</Text>
                  <Text style={styles.summaryItemPrice}>{(item.price * item.quantity).toFixed(2)}€</Text>
                </View>
              ))}
              {items.length > 4 && (
                <Text style={styles.moreItems}>+{items.length - 4} autre(s) article(s)</Text>
              )}
              <View style={styles.summarySep} />
              <View style={styles.summaryItemRow}>
                <Text style={[styles.summaryItemName, { color: Colors.surface[500] }]}>Sous-total</Text>
                <Text style={styles.summaryItemPrice}>{subtotal.toFixed(2)}€</Text>
              </View>
              <View style={styles.summaryItemRow}>
                <Text style={[styles.summaryItemName, { color: Colors.surface[500] }]}>Livraison</Text>
                <Text style={styles.summaryItemPrice}>{deliveryFee.toFixed(2)}€</Text>
              </View>
              {discountAmount > 0 && (
                <View style={styles.summaryItemRow}>
                  <Text style={[styles.summaryItemName, { color: Colors.success }]}>Réduction</Text>
                  <Text style={[styles.summaryItemPrice, { color: Colors.success }]}>−{discountAmount.toFixed(2)}€</Text>
                </View>
              )}
              <View style={[styles.summaryItemRow, { marginTop: 6, paddingTop: 8, borderTopWidth: 1, borderTopColor: Colors.surface[100] }]}>
                <Text style={[styles.summaryItemName, { fontWeight: '800', fontSize: 15, color: Colors.surface[900] }]}>Total</Text>
                <Text style={[styles.summaryItemPrice, { fontWeight: '800', fontSize: 16, color: Colors.brand[600] }]}>{grandTotal.toFixed(2)}€</Text>
              </View>
            </View>

            <View style={{ height: 20 }} />
          </ScrollView>

          {/* Pay button */}
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[styles.payBtn, (checkoutLoading || payLoading) && styles.payBtnDisabled]}
              onPress={handleConfirmPayment}
              disabled={checkoutLoading || payLoading}
              activeOpacity={0.88}
            >
              {checkoutLoading || payLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.payBtnText}>Payer {grandTotal.toFixed(2)}€</Text>
              )}
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
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

  // Modal
  modalSafe: { flex: 1, backgroundColor: Colors.surface[50] },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: Colors.surface[100],
  },
  modalTitle: { fontSize: 17, fontWeight: '800', color: Colors.surface[900] },
  modalClose:  { fontSize: 18, color: Colors.surface[400], fontWeight: '600', padding: 4 },
  modalContent: { padding: 16 },
  modalSection: { fontSize: 13, fontWeight: '700', color: Colors.surface[400], textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },

  addrCard: {
    backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 8,
    borderWidth: 1.5, borderColor: Colors.surface[200],
  },
  addrCardSelected: { borderColor: Colors.brand[500], backgroundColor: Colors.brand[50] },
  addrCardLeft: { flex: 1 },
  addrLabel: { fontSize: 14, fontWeight: '700', color: Colors.surface[900], marginBottom: 2 },
  addrText:  { fontSize: 13, color: Colors.surface[500], marginTop: 2 },
  radioSelected: {
    width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: Colors.brand[500],
    alignItems: 'center', justifyContent: 'center', alignSelf: 'center',
  },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.brand[500] },
  customAddrInput: {
    marginTop: 8, borderWidth: 1, borderColor: Colors.surface[200], borderRadius: 8,
    padding: 10, fontSize: 14, color: Colors.surface[900], minHeight: 60,
  },

  summaryCard: {
    backgroundColor: '#fff', borderRadius: 14, padding: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 1,
  },
  summaryItemRow:  { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  summaryItemQty:  { fontSize: 12, fontWeight: '800', color: Colors.brand[600], width: 24 },
  summaryItemName: { flex: 1, fontSize: 13, color: Colors.surface[700] },
  summaryItemPrice:{ fontSize: 13, fontWeight: '700', color: Colors.surface[900] },
  moreItems:       { fontSize: 12, color: Colors.surface[400], fontStyle: 'italic', marginBottom: 6 },
  summarySep:      { height: 1, backgroundColor: Colors.surface[100], marginVertical: 8 },

  modalFooter: {
    padding: 16, paddingBottom: 28,
    backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: Colors.surface[100],
  },
  payBtn: {
    backgroundColor: Colors.brand[500], borderRadius: 16, paddingVertical: 16, alignItems: 'center',
    shadowColor: Colors.brand[500], shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 10, elevation: 5,
  },
  payBtnDisabled: { opacity: 0.6 },
  payBtnText: { color: '#fff', fontSize: 17, fontWeight: '800' },
});
