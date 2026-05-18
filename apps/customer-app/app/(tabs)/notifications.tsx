import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';
import { useApi } from '@/hooks/useApi';

export interface AppNotification {
  id: string;
  type: 'order_confirmed' | 'order_ready' | 'driver_assigned' | 'delivered' | 'promo';
  title: string;
  body: string;
  orderId?: string;
  read: boolean;
  createdAt: string;
}

const MOCK_NOTIFICATIONS: AppNotification[] = [
  {
    id: '1',
    type: 'delivered',
    title: 'Commande livrée !',
    body: 'Votre commande #1234 a bien été livrée. Bon appétit !',
    orderId: '1234',
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(), // 10 min ago
  },
  {
    id: '2',
    type: 'driver_assigned',
    title: 'Livreur en route',
    body: 'Un livreur a été assigné à votre commande #1234.',
    orderId: '1234',
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(), // 25 min ago
  },
  {
    id: '3',
    type: 'order_ready',
    title: 'Commande prête',
    body: 'Votre commande #1234 est prête et en attente de livreur.',
    orderId: '1234',
    read: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 40).toISOString(), // 40 min ago
  },
  {
    id: '4',
    type: 'order_confirmed',
    title: 'Commande confirmée',
    body: 'Le restaurant a accepté votre commande #1234. Préparation en cours…',
    orderId: '1234',
    read: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(), // 1h ago
  },
  {
    id: '5',
    type: 'promo',
    title: '-20% ce week-end !',
    body: 'Profitez de 20% de réduction sur toute commande supérieure à 15€ ce week-end.',
    read: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 50).toISOString(), // ~2 days ago
  },
  {
    id: '6',
    type: 'order_confirmed',
    title: 'Commande confirmée',
    body: 'Le restaurant a accepté votre commande #1100.',
    orderId: '1100',
    read: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(), // 10 days ago
  },
];

function typeIcon(type: AppNotification['type']): string {
  switch (type) {
    case 'order_confirmed': return '✅';
    case 'order_ready':     return '🍳';
    case 'driver_assigned': return '🛵';
    case 'delivered':       return '📦';
    case 'promo':           return '🎁';
  }
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

/** Returns 'today' | 'week' | 'older' */
function bucket(iso: string): 'today' | 'week' | 'older' {
  const now = Date.now();
  const ms = now - new Date(iso).getTime();
  const DAY = 1000 * 60 * 60 * 24;
  if (ms < DAY) return 'today';
  if (ms < DAY * 7) return 'week';
  return 'older';
}

const BUCKET_LABELS: Record<'today' | 'week' | 'older', string> = {
  today: "Aujourd'hui",
  week:  'Cette semaine',
  older: 'Plus ancien',
};

type GroupedItem =
  | { kind: 'header'; key: string; label: string }
  | { kind: 'notif'; key: string; notif: AppNotification };

function buildGrouped(notifications: AppNotification[]): GroupedItem[] {
  const buckets: ('today' | 'week' | 'older')[] = ['today', 'week', 'older'];
  const result: GroupedItem[] = [];
  for (const b of buckets) {
    const group = notifications.filter((n) => bucket(n.createdAt) === b);
    if (group.length === 0) continue;
    result.push({ kind: 'header', key: `header-${b}`, label: BUCKET_LABELS[b] });
    for (const n of group) {
      result.push({ kind: 'notif', key: n.id, notif: n });
    }
  }
  return result;
}

export default function NotificationsScreen() {
  const api = useApi();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadNotifications = useCallback(async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      setError(null);
      const data = await api.get<AppNotification[]>('/api/v1/notifications');
      setNotifications(data);
    } catch {
      // API unavailable — use mock data
      setNotifications(MOCK_NOTIFICATIONS);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    loadNotifications();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const onRefresh = () => {
    setRefreshing(true);
    loadNotifications(true);
  };

  const markAsRead = useCallback(async (id: string) => {
    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
    try {
      await api.patch(`/api/v1/notifications/${id}/read`, {});
    } catch {
      // Silently ignore if API unavailable; optimistic update stays
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const markAllRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    api.patch('/api/v1/notifications/read-all', {}).catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const unreadCount = notifications.filter((n) => !n.read).length;
  const grouped = buildGrouped(notifications);

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Notifications</Text>
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
          <Text style={styles.headerTitle}>Notifications</Text>
        </View>
        <View style={styles.center}>
          <Text style={styles.errorEmoji}>😕</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => loadNotifications()} activeOpacity={0.8}>
            <Text style={styles.retryBtnText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Notifications</Text>
          {unreadCount > 0 && (
            <TouchableOpacity onPress={markAllRead} style={styles.markAllBtn} activeOpacity={0.75}>
              <Text style={styles.markAllText}>Tout marquer comme lu</Text>
            </TouchableOpacity>
          )}
        </View>
        {unreadCount > 0 && (
          <Text style={styles.unreadHint}>
            {unreadCount} non lue{unreadCount > 1 ? 's' : ''}
          </Text>
        )}
      </View>

      <FlatList
        data={grouped}
        keyExtractor={(item) => item.key}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={grouped.length === 0 ? styles.emptyContent : styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.brand[500]} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🔔</Text>
            <Text style={styles.emptyTitle}>Aucune notification</Text>
            <Text style={styles.emptySubtitle}>Vous serez notifié ici de l'avancement de vos commandes.</Text>
          </View>
        }
        renderItem={({ item }) => {
          if (item.kind === 'header') {
            return (
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionHeaderText}>{item.label}</Text>
              </View>
            );
          }

          const { notif } = item;
          return (
            <TouchableOpacity
              style={[styles.notifCard, !notif.read && styles.notifCardUnread]}
              onPress={() => markAsRead(notif.id)}
              activeOpacity={0.75}
            >
              <View style={styles.iconWrapper}>
                <Text style={styles.notifIcon}>{typeIcon(notif.type)}</Text>
              </View>
              <View style={styles.notifBody}>
                <View style={styles.notifTitleRow}>
                  <Text style={[styles.notifTitle, !notif.read && styles.notifTitleUnread]} numberOfLines={1}>
                    {notif.title}
                  </Text>
                  <Text style={styles.notifTime}>{formatTime(notif.createdAt)}</Text>
                </View>
                <Text style={styles.notifText} numberOfLines={2}>{notif.body}</Text>
              </View>
              {!notif.read && <View style={styles.unreadDot} />}
            </TouchableOpacity>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: Colors.surface[50] },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },

  loadingText: { fontSize: 14, color: Colors.surface[400], marginTop: 8 },
  errorEmoji:  { fontSize: 48 },
  errorText:   { fontSize: 15, color: Colors.surface[500], textAlign: 'center', paddingHorizontal: 32 },
  retryBtn:    { marginTop: 8, backgroundColor: Colors.brand[500], borderRadius: 12, paddingHorizontal: 24, paddingVertical: 10 },
  retryBtnText:{ color: '#fff', fontWeight: '700', fontSize: 14 },

  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: Colors.surface[50],
    borderBottomWidth: 1,
    borderBottomColor: Colors.surface[100],
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { fontSize: 26, fontWeight: '800', color: Colors.surface[900] },
  markAllBtn: { paddingHorizontal: 10, paddingVertical: 6 },
  markAllText: { fontSize: 13, color: Colors.brand[600], fontWeight: '600' },
  unreadHint: { fontSize: 12, color: Colors.surface[400], marginTop: 2 },

  listContent: { paddingBottom: 24 },
  emptyContent: { flex: 1 },

  sectionHeader: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 6,
  },
  sectionHeaderText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.surface[400],
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },

  notifCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 6,
    borderRadius: 14,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  notifCardUnread: {
    backgroundColor: '#fff',
    borderLeftWidth: 3,
    borderLeftColor: Colors.info,
  },

  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.surface[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifIcon: { fontSize: 22 },

  notifBody: { flex: 1 },
  notifTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 },
  notifTitle: { flex: 1, fontSize: 14, fontWeight: '600', color: Colors.surface[700], marginRight: 8 },
  notifTitleUnread: { color: Colors.surface[900], fontWeight: '700' },
  notifText: { fontSize: 13, color: Colors.surface[500], lineHeight: 18 },
  notifTime: { fontSize: 11, color: Colors.surface[400], flexShrink: 0 },

  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.info,
    alignSelf: 'center',
  },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, paddingHorizontal: 40 },
  emptyEmoji:    { fontSize: 64, marginBottom: 4 },
  emptyTitle:    { fontSize: 18, fontWeight: '800', color: Colors.surface[900], textAlign: 'center' },
  emptySubtitle: { fontSize: 14, color: Colors.surface[400], textAlign: 'center', lineHeight: 20 },
});
