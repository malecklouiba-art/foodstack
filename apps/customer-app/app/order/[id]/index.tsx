import { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { useApi } from '@/hooks/useApi';
import { useCartStore } from '@/store/cart';

type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivering' | 'delivered' | 'cancelled';

interface OrderItem {
  id?: string;
  name: string;
  quantity?: number;
  qty?: number;
  price?: number;
  unitPrice?: number;
  subtotal?: number;
}

interface OrderDetail {
  id: string;
  number?: string;
  orderNumber?: string;
  status: OrderStatus;
  items: OrderItem[];
  subtotal?: number;
  deliveryFee?: number;
  discount?: number;
  total?: number;
  totalAmount?: number;
  createdAt?: string;
  estimatedDelivery?: string;
  deliveryAddress?: { address?: string; street?: string };
  address?: string;
  restaurantId?: string;
  restaurant?: { id?: string; name?: string };
}

const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; bg: string; emoji: string }> = {
  pending:    { label: 'En attente',      color: Colors.surface[600], bg: Colors.surface[100], emoji: '⏳' },
  confirmed:  { label: 'Confirmée',       color: Colors.info,         bg: '#eff6ff',           emoji: '✅' },
  preparing:  { label: 'En préparation',  color: Colors.warning,      bg: '#fffbeb',           emoji: '👨‍🍳' },
  ready:      { label: 'Prête',           color: Colors.brand[600],   bg: Colors.brand[50],    emoji: '🔔' },
  delivering: { label: 'En livraison',    color: Colors.success,      bg: '#f0fdf4',           emoji: '🛵' },
  delivered:  { label: 'Livrée',          color: Colors.success,      bg: '#f0fdf4',           emoji: '🎉' },
  cancelled:  { label: 'Annulée',         color: Colors.danger,       bg: '#fef2f2',           emoji: '✕' },
};

const STEPS: { key: OrderStatus; label: string; emoji: string }[] = [
  { key: 'confirmed',  label: 'Confirmée',       emoji: '✅' },
  { key: 'preparing',  label: 'En préparation',  emoji: '👨‍🍳' },
  { key: 'ready',      label: 'Prête',           emoji: '🔔' },
  { key: 'delivering', label: 'En livraison',    emoji: '🛵' },
  { key: 'delivered',  label: 'Livrée !',        emoji: '🎉' },
];

const STEP_ORDER = ['confirmed', 'preparing', 'ready', 'delivering', 'delivered'];

// Mock fallback
function makeMock(id: string): OrderDetail {
  return {
    id,
    number: `#${id.slice(-4).toUpperCase()}`,
    status: 'delivering',
    items: [
      { name: 'Burger Classic', quantity: 2, price: 12.9 },
      { name: 'Frites Maison',  quantity: 1, price: 4.5 },
      { name: 'Coca-Cola',      quantity: 2, price: 3.2 },
    ],
    subtotal: 36.7,
    deliveryFee: 2.9,
    discount: 0,
    total: 39.6,
    createdAt: new Date().toISOString(),
    estimatedDelivery: '25 min',
    deliveryAddress: { address: '12 rue de la Paix, 75001 Paris' },
    restaurantId: 'r1',
  };
}

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const api = useApi();
  const { add, restaurantId: cartRestaurantId } = useCartStore();

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    api.get<OrderDetail>(`/api/v1/orders/${id}`)
      .then(setOrder)
      .catch(() => setOrder(makeMock(id)))
      .finally(() => setLoading(false));
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleReorder = () => {
    if (!order) return;
    const rid = order.restaurantId ?? order.restaurant?.id ?? 'unknown';
    if (cartRestaurantId && cartRestaurantId !== rid) {
      Alert.alert(
        'Changer de restaurant',
        'Votre panier actuel sera vidé. Continuer ?',
        [
          { text: 'Annuler', style: 'cancel' },
          { text: 'Continuer', style: 'destructive', onPress: () => doReorder(rid) },
        ],
      );
    } else {
      doReorder(rid);
    }
  };

  const doReorder = (rid: string) => {
    if (!order) return;
    order.items.forEach((item) => {
      add(
        {
          id: item.id ?? String(Math.random()),
          name: item.name,
          price: item.price ?? item.unitPrice ?? 0,
        },
        rid,
      );
    });
    router.push('/(tabs)/cart');
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={styles.backBtn}>← Retour</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Commande</Text>
          <View style={{ width: 60 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.brand[500]} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !order) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={styles.backBtn}>← Retour</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Commande</Text>
          <View style={{ width: 60 }} />
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>{error ?? 'Commande introuvable.'}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => router.back()}>
            <Text style={styles.retryBtnText}>Retour</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const statusCfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.pending;
  const orderNum = order.number ?? order.orderNumber ?? `#${order.id.slice(-4).toUpperCase()}`;
  const currentStepIdx = STEP_ORDER.indexOf(order.status);

  const itemsNorm = order.items.map((i) => ({
    name: i.name,
    qty: i.quantity ?? i.qty ?? 1,
    price: i.price ?? i.unitPrice ?? 0,
  }));

  const subtotal = order.subtotal ?? itemsNorm.reduce((s, i) => s + i.price * i.qty, 0);
  const deliveryFee = order.deliveryFee ?? 0;
  const discount = order.discount ?? 0;
  const total = order.total ?? order.totalAmount ?? subtotal + deliveryFee - discount;
  const address = order.deliveryAddress?.address ?? order.deliveryAddress?.street ?? order.address ?? '';

  const isActive = ['confirmed', 'preparing', 'ready', 'delivering'].includes(order.status);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={styles.backBtn}>← Retour</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Commande {orderNum}</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Status card */}
        <View style={[styles.statusCard, { backgroundColor: statusCfg.bg }]}>
          <Text style={styles.statusEmoji}>{statusCfg.emoji}</Text>
          <View style={{ flex: 1 }}>
            <Text style={[styles.statusLabel, { color: statusCfg.color }]}>{statusCfg.label}</Text>
            {isActive && order.estimatedDelivery && (
              <Text style={styles.etaText}>⏱ Livraison estimée dans {order.estimatedDelivery}</Text>
            )}
          </View>
          {isActive && (
            <TouchableOpacity
              style={styles.trackBtn}
              onPress={() => router.push(`/order/${order.id}/track`)}
              activeOpacity={0.85}
            >
              <Text style={styles.trackBtnText}>Suivre</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Timeline (only for non-cancelled) */}
        {order.status !== 'cancelled' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Progression</Text>
            {STEPS.map((step, idx) => {
              const stepIdx = STEP_ORDER.indexOf(step.key);
              const done = stepIdx < currentStepIdx;
              const active = stepIdx === currentStepIdx;
              const pending = stepIdx > currentStepIdx;
              return (
                <View key={step.key} style={styles.timelineRow}>
                  <View style={styles.timelineLeft}>
                    <View style={[
                      styles.dot,
                      done && styles.dotDone,
                      active && styles.dotActive,
                    ]}>
                      {done   && <Text style={styles.checkmark}>✓</Text>}
                      {active && <View style={styles.dotInner} />}
                    </View>
                    {idx < STEPS.length - 1 && (
                      <View style={[styles.line, done && styles.lineDone]} />
                    )}
                  </View>
                  <View style={[styles.stepContent, idx < STEPS.length - 1 && { marginBottom: 16 }]}>
                    <Text style={styles.stepEmoji}>{step.emoji}</Text>
                    <Text style={[
                      styles.stepLabel,
                      active && styles.stepLabelActive,
                      pending && styles.stepLabelPending,
                    ]}>
                      {step.label}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Items */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Articles commandés</Text>
          {itemsNorm.map((item, idx) => (
            <View key={idx} style={[styles.itemRow, idx < itemsNorm.length - 1 && styles.itemRowBorder]}>
              <View style={styles.itemQtyBadge}>
                <Text style={styles.itemQtyText}>{item.qty}</Text>
              </View>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemLineTotal}>{(item.price * item.qty).toFixed(2)}€</Text>
            </View>
          ))}
        </View>

        {/* Summary */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Récapitulatif</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Sous-total</Text>
            <Text style={styles.summaryValue}>{subtotal.toFixed(2)}€</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Livraison</Text>
            <Text style={styles.summaryValue}>{deliveryFee.toFixed(2)}€</Text>
          </View>
          {discount > 0 && (
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: Colors.success }]}>Réduction</Text>
              <Text style={[styles.summaryValue, { color: Colors.success }]}>−{discount.toFixed(2)}€</Text>
            </View>
          )}
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total payé</Text>
            <Text style={styles.totalValue}>{total.toFixed(2)}€</Text>
          </View>
        </View>

        {/* Delivery address */}
        {address ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Adresse de livraison</Text>
            <View style={styles.addressRow}>
              <Text style={styles.addressEmoji}>📍</Text>
              <Text style={styles.addressText}>{address}</Text>
            </View>
          </View>
        ) : null}

        {/* Reorder button */}
        {order.status === 'delivered' && (
          <TouchableOpacity style={styles.reorderBtn} onPress={handleReorder} activeOpacity={0.85}>
            <Text style={styles.reorderBtnText}>🔄 Commander à nouveau</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.surface[50] },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: Colors.surface[100],
  },
  backBtn:     { fontSize: 15, color: Colors.brand[500], fontWeight: '600' },
  headerTitle: { fontSize: 16, fontWeight: '800', color: Colors.surface[900] },

  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  errorText: { fontSize: 15, color: Colors.surface[500], textAlign: 'center' },
  retryBtn: {
    backgroundColor: Colors.brand[500], borderRadius: 12,
    paddingHorizontal: 20, paddingVertical: 10,
  },
  retryBtnText: { color: '#fff', fontWeight: '700' },

  content: { padding: 16, gap: 12 },

  statusCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderRadius: 16, padding: 14,
  },
  statusEmoji: { fontSize: 26 },
  statusLabel: { fontSize: 15, fontWeight: '700' },
  etaText: { fontSize: 12, color: Colors.surface[500], marginTop: 2 },
  trackBtn: {
    backgroundColor: Colors.brand[500], borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 8,
  },
  trackBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },

  card: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 1,
  },
  cardTitle: { fontSize: 14, fontWeight: '700', color: Colors.surface[900], marginBottom: 12 },

  timelineRow:  { flexDirection: 'row' },
  timelineLeft: { alignItems: 'center', width: 26, marginRight: 10 },
  dot:       { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: Colors.surface[200], backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  dotDone:   { backgroundColor: Colors.brand[500], borderColor: Colors.brand[500] },
  dotActive: { borderColor: Colors.brand[500], borderWidth: 2.5 },
  dotInner:  { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.brand[500] },
  checkmark: { color: '#fff', fontSize: 10, fontWeight: '800' },
  line:      { width: 2, flex: 1, backgroundColor: Colors.surface[100], marginVertical: 2 },
  lineDone:  { backgroundColor: Colors.brand[300] },
  stepContent: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingBottom: 2 },
  stepEmoji:   { fontSize: 15, width: 20, textAlign: 'center' },
  stepLabel:        { fontSize: 13, fontWeight: '600', color: Colors.surface[900] },
  stepLabelActive:  { color: Colors.brand[600] },
  stepLabelPending: { color: Colors.surface[400], fontWeight: '500' },

  itemRow:    { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, gap: 10 },
  itemRowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.surface[100] },
  itemQtyBadge: {
    width: 26, height: 26, borderRadius: 8,
    backgroundColor: Colors.brand[50], alignItems: 'center', justifyContent: 'center',
  },
  itemQtyText: { fontSize: 12, fontWeight: '800', color: Colors.brand[600] },
  itemName:    { flex: 1, fontSize: 14, color: Colors.surface[900], fontWeight: '500' },
  itemLineTotal: { fontSize: 14, fontWeight: '700', color: Colors.surface[900] },

  summaryRow:  { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  summaryLabel:{ fontSize: 14, color: Colors.surface[500] },
  summaryValue:{ fontSize: 14, color: Colors.surface[700], fontWeight: '600' },
  totalRow:    { borderTopWidth: 1, borderTopColor: Colors.surface[100], paddingTop: 10, marginTop: 4, marginBottom: 0 },
  totalLabel:  { fontSize: 15, fontWeight: '800', color: Colors.surface[900] },
  totalValue:  { fontSize: 17, fontWeight: '800', color: Colors.brand[600] },

  addressRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  addressEmoji:{ fontSize: 16, marginTop: 1 },
  addressText: { flex: 1, fontSize: 14, color: Colors.surface[600], lineHeight: 20 },

  reorderBtn: {
    backgroundColor: Colors.brand[500], borderRadius: 16,
    paddingVertical: 15, alignItems: 'center',
    shadowColor: Colors.brand[500], shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  reorderBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
});
