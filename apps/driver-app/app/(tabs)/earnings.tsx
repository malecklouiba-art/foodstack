import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/Colors';
import { useDriverStore } from '@/store/driver';

const WEEKLY = [
  { day: 'Lun', deliveries: 6, earnings: 42.50 },
  { day: 'Mar', deliveries: 8, earnings: 58.20 },
  { day: 'Mer', deliveries: 5, earnings: 36.80 },
  { day: 'Jeu', deliveries: 9, earnings: 67.40 },
  { day: 'Ven', deliveries: 11, earnings: 81.30 },
  { day: 'Sam', deliveries: 14, earnings: 103.60 },
  { day: 'Dim', deliveries: 4, earnings: 34.50 },
];

const MAX_EARN = Math.max(...WEEKLY.map((d) => d.earnings));

export default function EarningsScreen() {
  const { todayEarnings, todayDeliveries, rating } = useDriverStore();
  const weekTotal = WEEKLY.reduce((s, d) => s + d.earnings, 0);
  const weekDeliveries = WEEKLY.reduce((s, d) => s + d.deliveries, 0);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Mes gains</Text>
        </View>

        {/* Today card */}
        <LinearGradient
          colors={[Colors.brand[600], Colors.brand[500]]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
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

          {/* Bar chart */}
          <View style={styles.chart}>
            {WEEKLY.map((d) => (
              <View key={d.day} style={styles.bar}>
                <Text style={styles.barAmount}>{d.earnings.toFixed(0)}€</Text>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { height: `${(d.earnings / MAX_EARN) * 100}%` }]} />
                </View>
                <Text style={styles.barDay}>{d.day}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Weekly stats */}
        <View style={styles.statsGrid}>
          {[
            { label: 'Livraisons', value: String(weekDeliveries), emoji: '📦' },
            { label: 'Moy. / livraison', value: `${(weekTotal / weekDeliveries).toFixed(2)}€`, emoji: '💵' },
            { label: 'Moy. / jour', value: `${(weekTotal / 7).toFixed(2)}€`, emoji: '📅' },
            { label: 'Note moy.', value: `${rating}/5`, emoji: '⭐' },
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

  todayCard: { marginHorizontal: 16, marginVertical: 16, borderRadius: 22, padding: 22, alignItems: 'center' },
  todayLabel:  { color: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: '600', marginBottom: 4 },
  todayAmount: { color: '#fff', fontSize: 52, fontWeight: '900', marginBottom: 6 },
  todayMeta:   { flexDirection: 'row', alignItems: 'center', gap: 8 },
  todayMetaText:{ color: 'rgba(255,255,255,0.85)', fontSize: 14, fontWeight: '600' },
  todayMetaDot: { color: 'rgba(255,255,255,0.5)', fontSize: 14 },

  section: { marginHorizontal: 16, marginBottom: 16 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle:  { fontSize: 17, fontWeight: '800', color: Colors.surface[900] },
  sectionTotal:  { fontSize: 17, fontWeight: '800', color: Colors.brand[600] },

  chart: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, height: 140, backgroundColor: '#fff', borderRadius: 16, padding: 14 },
  bar:     { flex: 1, alignItems: 'center', gap: 4 },
  barAmount:{ fontSize: 9, color: Colors.surface[500], fontWeight: '600' },
  barTrack: { flex: 1, width: '100%', backgroundColor: Colors.surface[100], borderRadius: 6, justifyContent: 'flex-end' },
  barFill:  { backgroundColor: Colors.brand[400], borderRadius: 6, width: '100%' },
  barDay:   { fontSize: 11, color: Colors.surface[500], fontWeight: '600' },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 10 },
  statCard:  {
    width: '47%', backgroundColor: '#fff', borderRadius: 14,
    padding: 14, alignItems: 'center', gap: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 1,
  },
  statEmoji: { fontSize: 22 },
  statValue: { fontSize: 18, fontWeight: '800', color: Colors.surface[900] },
  statLabel: { fontSize: 12, color: Colors.surface[400], textAlign: 'center' },
});
