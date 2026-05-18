import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';
import { useApi } from '@/hooks/useApi';
import { useAuthStore } from '@/store/auth';

interface DeliveryRecord {
  id: string;
  number: string;
  date: string;
  restaurantName: string;
  customerAddress: string;
  earnings: number;
  distanceKm: number;
  durationMin: number;
  rating?: number;
}

// Shape returned by GET /api/v1/orders/customer/:customerId
interface ApiOrder {
  id: string;
  orderNumber?: string;
  number?: string;
  createdAt?: string;
  updatedAt?: string;
  restaurantName?: string;
  restaurant?: { name?: string };
  deliveryAddress?: string;
  customerAddress?: string;
  deliveryFee?: number;
  earnings?: number;
  distanceKm?: number;
  deliveryDurationMin?: number;
  durationMin?: number;
  driverRating?: number;
  rating?: number;
  status?: string;
}

function mapApiOrder(o: ApiOrder): DeliveryRecord {
  const rawDate = o.createdAt ?? o.updatedAt ?? '';
  let date = rawDate;
  if (rawDate) {
    try {
      date = new Date(rawDate).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      date = rawDate;
    }
  }

  return {
    id: o.id,
    number: o.orderNumber ?? o.number ?? `#${o.id.slice(-4).toUpperCase()}`,
    date,
    restaurantName: o.restaurantName ?? o.restaurant?.name ?? '—',
    customerAddress: o.deliveryAddress ?? o.customerAddress ?? '—',
    earnings: o.deliveryFee ?? o.earnings ?? 0,
    distanceKm: o.distanceKm ?? 0,
    durationMin: o.deliveryDurationMin ?? o.durationMin ?? 0,
    rating: o.driverRating ?? o.rating,
  };
}

function useDeliveryHistory() {
  const { get } = useApi();
  const driver = useAuthStore((s) => s.driver);

  const [history, setHistory] = useState<DeliveryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(
    async (isRefresh = false) => {
      if (!driver?.id) {
        setLoading(false);
        return;
      }
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      try {
        const data = await get<ApiOrder[] | { orders?: ApiOrder[] }>(
          `/api/v1/orders/driver/${driver.id}`
        );
        const raw: ApiOrder[] = Array.isArray(data)
          ? data
          : (data as { orders?: ApiOrder[] }).orders ?? [];

        const completed = raw
          .filter((o) => o.status === 'delivered' || o.status === 'completed')
          .map(mapApiOrder);

        setHistory(completed);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur réseau');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [get, driver?.id]
  );

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const refresh = useCallback(() => fetchHistory(true), [fetchHistory]);

  return { history, loading, refreshing, error, refresh };
}

export default function OrdersScreen() {
  const [selected, setSelected] = useState<DeliveryRecord | null>(null);
  const { history, loading, refreshing, error, refresh } = useDeliveryHistory();

  const totalEarnings = history.reduce((s, d) => s + d.earnings, 0);
  const rated = history.filter((d) => d.rating != null && d.rating > 0);
  const avgRating =
    rated.length > 0
      ? (rated.reduce((s, d) => s + (d.rating ?? 0), 0) / rated.length).toFixed(1)
      : '—';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Historique</Text>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{history.length}</Text>
            <Text style={styles.summaryLabel}>livraisons</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{totalEarnings.toFixed(2)}€</Text>
            <Text style={styles.summaryLabel}>gagnés</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>
              {avgRating !== '—' ? `⭐ ${avgRating}` : '—'}
            </Text>
            <Text style={styles.summaryLabel}>note moy.</Text>
          </View>
        </View>
      </View>

      {loading && !refreshing ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.brand[600]} />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={refresh}>
            <Text style={styles.retryText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={history}
          keyExtractor={(d) => d.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.centered}>
              <Text style={styles.emptyText}>Aucune livraison pour le moment.</Text>
            </View>
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={refresh}
              tintColor={Colors.brand[600]}
            />
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => setSelected(item)}
              activeOpacity={0.8}
            >
              <View style={styles.cardLeft}>
                <Text style={styles.cardNum}>{item.number}</Text>
                <Text style={styles.cardRestaurant}>{item.restaurantName}</Text>
                <Text style={styles.cardAddress} numberOfLines={1}>
                  {item.customerAddress}
                </Text>
                <Text style={styles.cardDate}>{item.date}</Text>
              </View>
              <View style={styles.cardRight}>
                <Text style={styles.cardEarnings}>{item.earnings.toFixed(2)}€</Text>
                {item.distanceKm > 0 && (
                  <Text style={styles.cardMeta}>{item.distanceKm} km</Text>
                )}
                {item.rating != null && item.rating > 0 && (
                  <Text style={styles.cardRating}>{'⭐'.repeat(item.rating)}</Text>
                )}
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      <Modal
        visible={!!selected}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelected(null)}
      >
        {selected && (
          <SafeAreaView style={styles.modalSafe} edges={['top']}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Livraison {selected.number}</Text>
              <TouchableOpacity onPress={() => setSelected(null)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={styles.modalBody}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Restaurant</Text>
                <Text style={styles.detailValue}>{selected.restaurantName}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Destination</Text>
                <Text style={styles.detailValue}>{selected.customerAddress}</Text>
              </View>
              {selected.distanceKm > 0 && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Distance</Text>
                  <Text style={styles.detailValue}>{selected.distanceKm} km</Text>
                </View>
              )}
              {selected.durationMin > 0 && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Durée</Text>
                  <Text style={styles.detailValue}>{selected.durationMin} min</Text>
                </View>
              )}
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Date</Text>
                <Text style={styles.detailValue}>{selected.date}</Text>
              </View>
              {selected.rating != null && selected.rating > 0 && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Note client</Text>
                  <Text style={styles.detailValue}>
                    {'⭐'.repeat(selected.rating)} ({selected.rating}/5)
                  </Text>
                </View>
              )}
              <View style={[styles.detailRow, styles.earningsRow]}>
                <Text style={styles.detailLabel}>Gains</Text>
                <Text style={styles.earningsValue}>{selected.earnings.toFixed(2)}€</Text>
              </View>
            </ScrollView>
          </SafeAreaView>
        )}
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.surface[50] },

  header: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16 },
  title: { fontSize: 26, fontWeight: '800', color: Colors.surface[900], marginBottom: 14 },
  summaryRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
  },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryValue: { fontSize: 16, fontWeight: '800', color: Colors.surface[900] },
  summaryLabel: { fontSize: 11, color: Colors.surface[400], marginTop: 2 },
  divider: { width: 1, backgroundColor: Colors.surface[100] },

  list: { paddingHorizontal: 16, paddingBottom: 100 },

  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  errorText: { fontSize: 14, color: '#ef4444', marginBottom: 12, textAlign: 'center' },
  emptyText: { fontSize: 14, color: Colors.surface[400] },
  retryBtn: {
    backgroundColor: Colors.brand[600],
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  retryText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
  },
  cardLeft: { flex: 1 },
  cardNum: { fontSize: 15, fontWeight: '800', color: Colors.surface[900], marginBottom: 2 },
  cardRestaurant: { fontSize: 13, color: Colors.brand[600], fontWeight: '600', marginBottom: 2 },
  cardAddress: { fontSize: 13, color: Colors.surface[500], marginBottom: 4 },
  cardDate: { fontSize: 11, color: Colors.surface[400] },
  cardRight: { alignItems: 'flex-end', gap: 3 },
  cardEarnings: { fontSize: 18, fontWeight: '900', color: Colors.brand[600] },
  cardMeta: { fontSize: 12, color: Colors.surface[400] },
  cardRating: { fontSize: 11 },

  modalSafe: { flex: 1, backgroundColor: '#fff' },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surface[100],
  },
  modalTitle: { fontSize: 20, fontWeight: '800', color: Colors.surface[900] },
  modalClose: { fontSize: 18, color: Colors.surface[400], padding: 4 },
  modalBody: { padding: 20, gap: 4 },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surface[50],
  },
  detailLabel: { fontSize: 14, color: Colors.surface[500] },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.surface[900],
    flex: 1,
    textAlign: 'right',
  },
  earningsRow: { borderBottomWidth: 0, marginTop: 8 },
  earningsValue: { fontSize: 24, fontWeight: '900', color: Colors.brand[600] },
});
