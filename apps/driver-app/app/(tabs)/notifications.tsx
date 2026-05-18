import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';
import { useApi } from '@/hooks/useApi';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DriverNotification {
  id: string;
  type: 'new_delivery' | 'bonus' | 'rating' | 'system' | 'payment';
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TYPE_ICON: Record<DriverNotification['type'], string> = {
  new_delivery: '🚚',
  bonus:        '💰',
  rating:       '⭐',
  system:       '🔔',
  payment:      '💳',
};

const MOCK_NOTIFICATIONS: DriverNotification[] = [
  {
    id: '1',
    type: 'new_delivery',
    title: 'Nouvelle commande disponible',
    body: 'Une livraison de 6,50 € est disponible près de vous — Burger King République.',
    read: false,
    createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
  },
  {
    id: '2',
    type: 'bonus',
    title: 'Bonus de performance débloqué !',
    body: 'Félicitations ! Vous avez effectué 10 livraisons aujourd\'hui. Bonus de 5,00 € crédité.',
    read: false,
    createdAt: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
  },
  {
    id: '3',
    type: 'rating',
    title: 'Nouvelle évaluation reçue',
    body: 'Un client vous a attribué 5 étoiles ⭐ « Livraison rapide et souriante ! »',
    read: true,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '4',
    type: 'payment',
    title: 'Paiement traité',
    body: 'Votre virement hebdomadaire de 142,30 € a été envoyé sur votre compte.',
    read: true,
    createdAt: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '5',
    type: 'system',
    title: 'Mise à jour de l\'application',
    body: 'FoodStack Driver v2.4 est disponible. Nouvelles fonctionnalités de navigation améliorée.',
    read: true,
    createdAt: new Date(Date.now() - 50 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '6',
    type: 'bonus',
    title: 'Heure de pointe — bonus x1.5',
    body: 'Livrez entre 12h et 14h et gagnez 1.5× plus sur chaque commande acceptée.',
    read: true,
    createdAt: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function groupByDay(notifications: DriverNotification[]): [string, DriverNotification[]][] {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const yesterdayStart = todayStart - 86400000;

  const groups: Record<string, DriverNotification[]> = {
    "Aujourd'hui": [],
    'Hier': [],
    'Plus ancien': [],
  };

  for (const n of notifications) {
    const t = new Date(n.createdAt).getTime();
    if (t >= todayStart) {
      groups["Aujourd'hui"].push(n);
    } else if (t >= yesterdayStart) {
      groups['Hier'].push(n);
    } else {
      groups['Plus ancien'].push(n);
    }
  }

  return Object.entries(groups).filter(([, items]) => items.length > 0);
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function NotificationsScreen() {
  const { get } = useApi();
  const [notifications, setNotifications] = useState<DriverNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await get<DriverNotification[]>('/api/v1/notifications');
      setNotifications(data);
    } catch {
      // Fallback to mock data when API is unavailable
      setNotifications(MOCK_NOTIFICATIONS);
    } finally {
      setLoading(false);
    }
  }, [get]);

  useEffect(() => {
    void fetchNotifications();
  }, [fetchNotifications]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  // ── Render states ────────────────────────────────────────────────────────

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Notifications</Text>
        </View>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.brand[500]} />
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
        <View style={styles.centered}>
          <Text style={styles.errorEmoji}>⚠️</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchNotifications}>
            <Text style={styles.retryBtnText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const groups = groupByDay(notifications);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Notifications</Text>
          {unreadCount > 0 && (
            <View style={styles.headerBadge}>
              <Text style={styles.headerBadgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={markAllRead} activeOpacity={0.7}>
            <Text style={styles.markAllText}>Tout lire</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Empty state */}
      {notifications.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>🔕</Text>
          <Text style={styles.emptyTitle}>Aucune notification</Text>
          <Text style={styles.emptyBody}>Vous êtes à jour ! Les nouvelles notifications apparaîtront ici.</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {groups.map(([groupLabel, items]) => (
            <View key={groupLabel}>
              <Text style={styles.groupLabel}>{groupLabel}</Text>
              {items.map((notif) => (
                <TouchableOpacity
                  key={notif.id}
                  style={[styles.notifCard, !notif.read && styles.notifCardUnread]}
                  onPress={() => markAsRead(notif.id)}
                  activeOpacity={0.8}
                >
                  {!notif.read && <View style={styles.unreadBorder} />}
                  <Text style={styles.notifIcon}>{TYPE_ICON[notif.type]}</Text>
                  <View style={styles.notifContent}>
                    <View style={styles.notifTopRow}>
                      <Text style={[styles.notifTitle, !notif.read && styles.notifTitleUnread]} numberOfLines={1}>
                        {notif.title}
                      </Text>
                      <Text style={styles.notifTime}>{formatTime(notif.createdAt)}</Text>
                    </View>
                    <Text style={styles.notifBody} numberOfLines={2}>{notif.body}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ))}
          <View style={{ height: 32 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.surface[50] },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surface[100],
    backgroundColor: '#fff',
  },
  headerLeft:      { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle:     { fontSize: 20, fontWeight: '800', color: Colors.surface[900] },
  headerBadge:     { backgroundColor: Colors.status.confirmed, borderRadius: 10, paddingHorizontal: 7, paddingVertical: 2 },
  headerBadgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  markAllText:     { fontSize: 14, fontWeight: '600', color: Colors.brand[600] },

  centered:   { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  errorEmoji: { fontSize: 40 },
  errorText:  { fontSize: 14, color: Colors.surface[500], textAlign: 'center', paddingHorizontal: 32 },
  retryBtn:   { backgroundColor: Colors.brand[500], borderRadius: 12, paddingVertical: 10, paddingHorizontal: 24, marginTop: 4 },
  retryBtnText:{ color: '#fff', fontWeight: '700', fontSize: 14 },

  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, paddingBottom: 60 },
  emptyEmoji: { fontSize: 60 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.surface[700] },
  emptyBody:  { fontSize: 14, color: Colors.surface[400], textAlign: 'center', paddingHorizontal: 40 },

  groupLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.surface[400],
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: 20,
    marginBottom: 6,
    paddingHorizontal: 16,
  },

  notifCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 14,
    padding: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  notifCardUnread: {
    backgroundColor: '#eef6ff',
  },
  unreadBorder: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: Colors.status.confirmed,
    borderTopLeftRadius: 14,
    borderBottomLeftRadius: 14,
  },

  notifIcon:    { fontSize: 26, marginRight: 12, marginTop: 1 },
  notifContent: { flex: 1 },
  notifTopRow:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 },
  notifTitle:   { flex: 1, fontSize: 14, fontWeight: '600', color: Colors.surface[700], marginRight: 8 },
  notifTitleUnread: { color: Colors.surface[900], fontWeight: '700' },
  notifTime:    { fontSize: 11, color: Colors.surface[400] },
  notifBody:    { fontSize: 13, color: Colors.surface[500], lineHeight: 18 },
});
