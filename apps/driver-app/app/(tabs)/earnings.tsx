import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/Colors';
import { useDriverStore } from '@/store/driver';
import { useApi } from '@/hooks/useApi';
import { useAuthStore } from '@/store/auth';

// ── Types ────────────────────────────────────────────────────────────────────

interface ApiOrder {
  id: string;
  createdAt?: string;
  updatedAt?: string;
  deliveryFee?: number;
  earnings?: number;
  status?: string;
}

interface DayStats {
  day: string;
  deliveries: number;
  earnings: number;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const DAY_LABELS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

/** Returns the ISO date string (YYYY-MM-DD) for the Monday of the current week */
function getWeekStart(): Date {
  const now = new Date();
  const day = now.getDay(); // 0=Sun … 6=Sat
  const diff = day === 0 ? -6 : 1 - day; // shift to Monday
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function buildWeeklyStats(orders: ApiOrder[]): DayStats[] {
  const weekStart = getWeekStart();
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);

  // Initialise Mon–Sun slots
  const slots: DayStats[] = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return { day: DAY_LABELS[(d.getDay())], deliveries: 0, earnings: 0 };
  });

  orders.forEach((o) => {
    const raw = o.createdAt ?? o.updatedAt;
    if (!raw) return;
    const date = new Date(raw);
    if (date < weekStart || date >= weekEnd) return;
    const dayOfWeek = date.getDay(); // 0=Sun … 6=Sat
    // Map to slot index: Mon=0 … Sun=6
    const slotIdx = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    slots[slotIdx].deliveries += 1;
    slots[slotIdx].earnings += o.deliveryFee ?? o.earnings ?? 0;
  });

  return slots;
}

// ── Hook ─────────────────────────────────────────────────────────────────────

function useWeeklyEarnings() {
  const { get } = useApi();
  const driver = useAuthStore((s) => s.driver);

  const [weekly, setWeekly] = useState<DayStats[]>(
    Array.from({ length: 7 }, (_, i) => ({
      day: DAY_LABELS[(i + 1) % 7], // Mon … Sun
      deliveries: 0,
      earnings: 0,
    }))
  );
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEarnings = useCallback(
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

        const completed = raw.filter(
          (o) => o.status === 'delivered' || o.status === 'completed'
        );

        setWeekly(buildWeeklyStats(completed));
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
    fetchEarnings();
  }, [fetchEarnings]);

  const refresh = useCallback(() => fetchEarnings(true), [fetchEarnings]);

  return { weekly, loading, refreshing, error, refresh };
}

// ── Screen ───────────────────────────────────────────────────────────────────

export default function EarningsScreen() {
  const { todayEarnings, todayDeliveries, rating } = useDriverStore();
  const { weekly, loading, refreshing, error, refresh } = useWeeklyEarnings();

  const weekTotal = weekly.reduce((s, d) => s + d.earnings, 0);
  const weekDeliveries = weekly.reduce((s, d) => s + d.deliveries, 0);
  const maxEarn = Math.max(...weekly.map((d) => d.earnings), 1); // avoid /0

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor={Colors.brand[600]}
          />
        }
      >
        <View style={styles.header}>
          <Text style={styles.title}>Mes gains</Text>
        </View>

        {/* Today card */}
        <LinearGradient
          colors={[Colors.brand[600], Colors.brand[500]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.todayCard}
        >
          <Text style={styles.todayLabel}>Aujourd'hui</Text>
          <Text style={styles.todayAmount}>{todayEarnings.toFixed(2)}€</Text>
          <View style={styles.todayMeta}>
            <Text style={styles.todayMetaText}>{todayDeliveries} livraisons</Text>
            <Text style={styles.todayMetaDot}>·</Text>
            <Text style={styles.todayMetaText}>⭐ {rating}</Text>
          </View>
        </LinearGradient>

        {/* Weekly summary */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Cette semaine</Text>
            <Text style={styles.sectionTotal}>{weekTotal.toFixed(2)}€</Text>
          </View>

          {loading && !refreshing ? (
            <View style={styles.chartPlaceholder}>
              <ActivityIndicator size="small" color={Colors.brand[600]} />
            </View>
          ) : error ? (
            <View style={styles.chartPlaceholder}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity style={styles.retryBtn} onPress={refresh}>
                <Text style={styles.retryText}>Réessayer</Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* Bar chart */
            <View style={styles.chart}>
              {weekly.map((d) => (
                <View key={d.day} style={styles.bar}>
                  <Text style={styles.barAmount}>{d.earnings.toFixed(0)}€</Text>
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.barFill,
                        { height: `${(d.earnings / maxEarn) * 100}%` },
                      ]}
                    />
                  </View>
                  <Text style={styles.barDay}>{d.day}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Weekly stats */}
        <View style={styles.statsGrid}>
          {[
            { label: 'Livraisons', value: String(weekDeliveries), emoji: '📦' },
            {
              label: 'Moy. / livraison',
              value: weekDeliveries > 0 ? `${(weekTotal / weekDeliveries).toFixed(2)}€` : '—',
              emoji: '💵',
            },
            { label: 'Moy. / jour', value: `${(weekTotal / 7).toFixed(2)}€`, emoji: '📅' },
            { label: 'Note moy.', value: rating > 0 ? `${rating}/5` : '—', emoji: '⭐' },
          ].map((s) => (
            <View key={s.label} style={styles.statCard}>
              <Text style={styles.statEmoji}>{s.emoji}</Text>
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: Colors.surface[50] },
  header: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
  title:  { fontSize: 26, fontWeight: '800', color: Colors.surface[900] },

  todayCard:    { marginHorizontal: 16, marginVertical: 16, borderRadius: 22, padding: 22, alignItems: 'center' },
  todayLabel:   { color: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: '600', marginBottom: 4 },
  todayAmount:  { color: '#fff', fontSize: 52, fontWeight: '900', marginBottom: 6 },
  todayMeta:    { flexDirection: 'row', alignItems: 'center', gap: 8 },
  todayMetaText:{ color: 'rgba(255,255,255,0.85)', fontSize: 14, fontWeight: '600' },
  todayMetaDot: { color: 'rgba(255,255,255,0.5)', fontSize: 14 },

  section:      { marginHorizontal: 16, marginBottom: 16 },
  sectionHeader:{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: Colors.surface[900] },
  sectionTotal: { fontSize: 17, fontWeight: '800', color: Colors.brand[600] },

  chartPlaceholder:{
    height: 140, backgroundColor: '#fff', borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  errorText: { fontSize: 13, color: '#ef4444', marginBottom: 8, textAlign: 'center' },
  retryBtn:  { backgroundColor: Colors.brand[600], borderRadius: 8, paddingHorizontal: 16, paddingVertical: 8 },
  retryText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  chart:    { flexDirection: 'row', alignItems: 'flex-end', gap: 8, height: 140, backgroundColor: '#fff', borderRadius: 16, padding: 14 },
  bar:      { flex: 1, alignItems: 'center', gap: 4 },
  barAmount:{ fontSize: 9, color: Colors.surface[500], fontWeight: '600' },
  barTrack: { flex: 1, width: '100%', backgroundColor: Colors.surface[100], borderRadius: 6, justifyContent: 'flex-end' },
  barFill:  { backgroundColor: Colors.brand[400], borderRadius: 6, width: '100%' },
  barDay:   { fontSize: 11, color: Colors.surface[500], fontWeight: '600' },

  statsGrid:{ flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 10 },
  statCard: {
    width: '47%', backgroundColor: '#fff', borderRadius: 14,
    padding: 14, alignItems: 'center', gap: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 1,
  },
  statEmoji:{ fontSize: 22 },
  statValue:{ fontSize: 18, fontWeight: '800', color: Colors.surface[900] },
  statLabel:{ fontSize: 12, color: Colors.surface[400], textAlign: 'center' },
});
