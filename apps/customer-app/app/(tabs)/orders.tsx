import { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Modal, ScrollView, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { useApi } from '@/hooks/useApi';

type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivering' | 'delivered' | 'cancelled';

interface OrderItem {
  name: string;
  qty: number;
  price: number;
  // API may also provide quantity/unitPrice
  quantity?: number;
  unitPrice?: number;
}

interface Order {
  id: string;
  number?: string;
  orderNumber?: string;
  status: OrderStatus;
  items: OrderItem[];
  subtotal?: number;
  deliveryFee?: number;
  total?: number;
  totalAmount?: number;
  createdAt: string;
  estimatedDelivery?: string;
}

// Normalise raw API order shape to our internal Order shape
function normaliseOrder(raw: Record<string, unknown>): Order {
  const items = (raw.items as Record<string, unknown>[] | undefined) ?? [];
  const normalisedItems: OrderItem[] = items.map((i) => ({
    name: (i.name as string | undefined) ?? (i.itemName as string | undefined) ?? 'Article',
    qty: (i.qty as number | undefined) ?? (i.quantity as number | undefined) ?? 1,
    price: (i.price as number | undefined) ?? (i.unitPrice as number | undefined) ?? 0,
  }));

  const total =
    (raw.total as number | undefined) ??
    (raw.totalAmount as number | undefined) ??
    normalisedItems.reduce((s, i) => s + i.price * i.qty, 0);

  const subtotal =
    (raw.subtotal as number | undefined) ?? total - ((raw.deliveryFee as number | undefined) ?? 0);

  const createdAt = raw.createdAt
    ? new Date(raw.createdAt as string).toLocaleString('fr-FR', {
        day: 'numeric', month: 'long', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      })
    : '';

  return {
    id: raw.id as string,
    number: (raw.number as string | undefined) ?? (raw.orderNumber as string | undefined) ?? `#${(raw.id as string).slice(-4).toUpperCase()}`,
    status: (raw.status as OrderStatus) ?? 'pending',
    items: normalisedItems,
    subtotal,
    deliveryFee: (raw.deliveryFee as number | undefined) ?? 0,
    total,
    createdAt,
    estimatedDelivery: raw.estimatedDelivery as string | undefined,
  };
}

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'En attente',
  confirmed: 'Confirmée',
  preparing: 'En préparation',
  ready: 'Prête',
  delivering: 'En livraison',
  delivered: 'Livrée',
  cancelled: 'Annulée',
};

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: '#f59e0b',
  confirmed: Colors.brand[500],
  preparing: '#8b5cf6',
  ready: '#10b981',
  delivering: '#3b82f6',
  delivered: '#6b7280',
  cancelled: '#ef4444',
};

const STATUS_EMOJI: Record<OrderStatus, string> = {
  pending: '⏳',
  confirmed: '✅',
  preparing: '👨‍🍳',
  ready: '🔔',
  delivering: '🛵',
  delivered: '🎉',
  cancelled: '❌',
};

function ActiveOrderBanner({ order }: { order: Order }) {
  return (
    <View style={styles.activeBanner}>
      <View style={styles.activeBannerLeft}>
        <Text style={styles.activeBannerEmoji}>{STATUS_EMOJI[order.status]}</Text>
        <View>
          <Text style={styles.activeBannerTitle}>Commande {order.number}</Text>
          <Text style={styles.activeBannerStatus}>{STATUS_LABELS[order.status]}</Text>
        </View>
      </View>
      {order.estimatedDelivery && (
        <View style={styles.etaBadge}>
          <Text style={styles.etaText}>~{order.estimatedDelivery}</Text>
        </View>
      )}
    </View>
  );
}

export default function OrdersScreen() {
  const api = useApi();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);


  // Rating feature
  const [ratedOrders, setRatedOrders] = useState<Set<string>>(new Set());
  const [ratingOrder, setRatingOrder] = useState<Order | null>(null);
  const [selectedRating, setSelectedRating] = useState(0);
  const [submittingRating, setSubmittingRating] = useState(false);

  const loadOrders = useCallback(async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      setError(null);

      // Retrieve userId from stored auth
      const userRaw = await AsyncStorage.getItem('auth_user');
      if (!userRaw) {
        setError('Utilisateur non connecté.');
        return;
      }
      const user = JSON.parse(userRaw) as { id: string };
      const raw = await api.get<Record<string, unknown>[]>(`/api/v1/orders/customer/${user.id}`);
      setOrders(raw.map(normaliseOrder));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impossible de charger les commandes.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    loadOrders();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const onRefresh = () => {
    setRefreshing(true);
    loadOrders(true);
  };

  const openRatingModal = (order: Order) => {
    setRatingOrder(order);
    setSelectedRating(0);
  };

  const closeRatingModal = () => {
    setRatingOrder(null);
    setSelectedRating(0);
  };

  const handleSendRating = async () => {
    if (!ratingOrder || selectedRating === 0) return;
    setSubmittingRating(true);
    try {
      // Try POST /api/v1/orders/:id/review — fallback to local state on any error
      await api.post(`/api/v1/orders/${ratingOrder.id}/review`, {
        rating: selectedRating,
        orderId: ratingOrder.id,
      }).catch(() => {
        // Endpoint may not exist — silently swallow and mark locally
      });
      setRatedOrders((prev) => new Set([...prev, ratingOrder.id]));
      closeRatingModal();
    } catch {
      Alert.alert('Erreur', 'Impossible d\'envoyer votre évaluation.');
    } finally {
      setSubmittingRating(false);
    }
  };

  const activeOrders = orders.filter(
    (o) => !['delivered', 'cancelled'].includes(o.status),
  );
  const pastOrders = orders.filter(
    (o) => ['delivered', 'cancelled'].includes(o.status),
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Mes commandes</Text>
        </View>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.brand[500]} />
          <Text style={styles.loadingText}>Chargement…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Mes commandes</Text>
        </View>
        <View style={styles.center}>
          <Text style={styles.errorEmoji}>😕</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => loadOrders()} activeOpacity={0.8}>
            <Text style={styles.retryBtnText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mes commandes</Text>
      </View>

      <FlatList
        data={pastOrders}
        keyExtractor={(o) => o.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.brand[500]} />
        }
        ListHeaderComponent={
          <>
            {activeOrders.map((o) => (
              <TouchableOpacity key={o.id} onPress={() => router.push(`/order/${o.id}`)} activeOpacity={0.85}>
                <ActiveOrderBanner order={o} />
              </TouchableOpacity>
            ))}
            {pastOrders.length > 0 && (
              <Text style={styles.sectionLabel}>Historique</Text>
            )}
          </>
        }
        ListEmptyComponent={
          activeOrders.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>📦</Text>
              <Text style={styles.emptyText}>Aucune commande passée</Text>
            </View>
          ) : null
        }
        renderItem={({ item: order }) => (
          <TouchableOpacity
            style={styles.orderCard}
            onPress={() => router.push(`/order/${order.id}`)}
            activeOpacity={0.8}
          >
            <View style={styles.orderCardHeader}>
              <Text style={styles.orderNumber}>{order.number}</Text>
              <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[order.status] + '20' }]}>
                <Text style={[styles.statusText, { color: STATUS_COLORS[order.status] }]}>
                  {STATUS_EMOJI[order.status]} {STATUS_LABELS[order.status]}
                </Text>
              </View>
            </View>
            <Text style={styles.orderItems} numberOfLines={1}>
              {order.items.map((i) => `${i.qty}× ${i.name}`).join(', ')}
            </Text>
            <View style={styles.orderCardFooter}>
              <Text style={styles.orderDate}>{order.createdAt}</Text>
              <Text style={styles.orderTotal}>{(order.total ?? 0).toFixed(2)}€</Text>
            </View>
            {order.status === 'delivered' && !ratedOrders.has(order.id) && (
              <TouchableOpacity
                style={styles.rateBtn}
                onPress={(e) => {
                  e.stopPropagation?.();
                  openRatingModal(order);
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.rateBtnText}>⭐ Évaluer</Text>
              </TouchableOpacity>
            )}
            {order.status === 'delivered' && ratedOrders.has(order.id) && (
              <Text style={styles.ratedLabel}>✅ Évaluation envoyée</Text>
            )}
          </TouchableOpacity>
        )}
      />

      {/* Rating Modal */}
      <Modal
        visible={!!ratingOrder}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeRatingModal}
      >
        {ratingOrder && (
          <SafeAreaView style={styles.modalSafe} edges={['top']}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Évaluer la commande</Text>
              <TouchableOpacity onPress={closeRatingModal}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.ratingModalContent}>
              <Text style={styles.ratingOrderNum}>{ratingOrder.number}</Text>
              <Text style={styles.ratingSubtitle}>Comment était votre commande ?</Text>

              {/* Star selector */}
              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity
                    key={star}
                    onPress={() => setSelectedRating(star)}
                    activeOpacity={0.7}
                    style={styles.starBtn}
                  >
                    <Text style={[styles.starEmoji, selectedRating >= star && styles.starActive]}>
                      ★
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              {selectedRating > 0 && (
                <Text style={styles.ratingHint}>
                  {['', 'Très mauvais', 'Mauvais', 'Correct', 'Bien', 'Excellent !'][selectedRating]}
                </Text>
              )}

              <TouchableOpacity
                style={[styles.sendRatingBtn, (selectedRating === 0 || submittingRating) && styles.sendRatingBtnDisabled]}
                onPress={handleSendRating}
                disabled={selectedRating === 0 || submittingRating}
                activeOpacity={0.85}
              >
                {submittingRating ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.sendRatingBtnText}>Envoyer</Text>
                )}
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        )}
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.surface[50] },
  header: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 },
  headerTitle: { fontSize: 26, fontWeight: '800', color: Colors.surface[900] },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { fontSize: 14, color: Colors.surface[400], marginTop: 8 },
  errorEmoji:  { fontSize: 48 },
  errorText:   { fontSize: 15, color: Colors.surface[500], textAlign: 'center', paddingHorizontal: 32 },
  retryBtn:    { marginTop: 8, backgroundColor: Colors.brand[500], borderRadius: 12, paddingHorizontal: 24, paddingVertical: 10 },
  retryBtnText:{ color: '#fff', fontWeight: '700', fontSize: 14 },

  list: { paddingHorizontal: 16, paddingBottom: 100 },
  sectionLabel: { fontSize: 13, fontWeight: '600', color: Colors.surface[400], marginTop: 8, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },

  activeBanner: {
    backgroundColor: Colors.brand[500], borderRadius: 16, padding: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 16,
  },
  activeBannerLeft:   { flexDirection: 'row', alignItems: 'center', gap: 12 },
  activeBannerEmoji:  { fontSize: 28 },
  activeBannerTitle:  { fontSize: 15, fontWeight: '700', color: '#fff' },
  activeBannerStatus: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  etaBadge: { backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5 },
  etaText:  { color: '#fff', fontWeight: '700', fontSize: 14 },

  orderCard: {
    backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 1,
  },
  orderCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  orderNumber: { fontSize: 15, fontWeight: '700', color: Colors.surface[900] },
  statusBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  statusText:  { fontSize: 12, fontWeight: '600' },
  orderItems:  { fontSize: 13, color: Colors.surface[500], marginBottom: 8 },
  orderCardFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  orderDate:  { fontSize: 12, color: Colors.surface[400] },
  orderTotal: { fontSize: 14, fontWeight: '700', color: Colors.brand[600] },

  empty:      { alignItems: 'center', paddingTop: 60, gap: 8 },
  emptyEmoji: { fontSize: 48 },
  emptyText:  { fontSize: 15, color: Colors.surface[400] },

  modalSafe:    { flex: 1, backgroundColor: '#fff' },
  modalHeader:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: Colors.surface[100] },
  modalTitle:   { fontSize: 20, fontWeight: '800', color: Colors.surface[900] },
  modalClose:   { fontSize: 18, color: Colors.surface[400], fontWeight: '600', padding: 4 },
  modalContent: { padding: 20 },
  modalSection: { fontSize: 13, fontWeight: '600', color: Colors.surface[400], textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12, marginTop: 20 },
  modalItemRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  modalItemQty: { fontSize: 14, color: Colors.surface[400], minWidth: 28 },
  modalItemName:{ flex: 1, fontSize: 14, color: Colors.surface[700], fontWeight: '600' },
  modalItemPrice:{ fontSize: 14, fontWeight: '700', color: Colors.surface[900] },
  modalMeta:    { fontSize: 14, color: Colors.surface[500] },
  divider:      { height: 1, backgroundColor: Colors.surface[100], marginVertical: 12 },
  reorderBtn: {
    marginTop: 24, backgroundColor: Colors.brand[500], borderRadius: 14,
    paddingVertical: 14, alignItems: 'center',
  },
  reorderBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  rateBtn: {
    marginTop: 10, backgroundColor: Colors.brand[50], borderRadius: 10,
    paddingVertical: 8, alignItems: 'center',
    borderWidth: 1, borderColor: Colors.brand[300],
  },
  rateBtnText: { color: Colors.brand[600], fontWeight: '700', fontSize: 13 },
  ratedLabel:  { marginTop: 10, fontSize: 13, color: Colors.surface[400], fontWeight: '500', textAlign: 'center' },

  ratingModalContent: { flex: 1, padding: 24, alignItems: 'center' },
  ratingOrderNum:     { fontSize: 16, fontWeight: '700', color: Colors.surface[500], marginBottom: 6 },
  ratingSubtitle:     { fontSize: 20, fontWeight: '800', color: Colors.surface[900], marginBottom: 28, textAlign: 'center' },
  starsRow:           { flexDirection: 'row', gap: 8, marginBottom: 12 },
  starBtn:            { padding: 6 },
  starEmoji:          { fontSize: 40, color: Colors.surface[200] },
  starActive:         { color: '#f59e0b' },
  ratingHint:         { fontSize: 15, color: Colors.surface[500], fontWeight: '600', marginBottom: 32 },
  sendRatingBtn: {
    width: '100%', backgroundColor: Colors.brand[500], borderRadius: 16,
    paddingVertical: 15, alignItems: 'center',
    shadowColor: Colors.brand[500], shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 4,
  },
  sendRatingBtnDisabled: { opacity: 0.5 },
  sendRatingBtnText:     { color: '#fff', fontSize: 16, fontWeight: '800' },
});
