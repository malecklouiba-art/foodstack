import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { useTrackOrder } from '@/hooks/useTrackOrder';

type StepStatus = 'done' | 'active' | 'pending';

const STEPS = [
  { key: 'confirmed', label: 'Commande confirmée', emoji: '✅' },
  { key: 'preparing', label: 'En préparation', emoji: '👨‍🍳' },
  { key: 'ready',     label: 'Prête pour livraison', emoji: '🔔' },
  { key: 'delivering',label: 'En cours de livraison', emoji: '🛵' },
  { key: 'delivered', label: 'Livrée !', emoji: '🎉' },
];

function stepStatus(stepKey: string, currentStep: string): StepStatus {
  const stepIdx = STEPS.findIndex((s) => s.key === stepKey);
  const currentIdx = STEPS.findIndex((s) => s.key === currentStep);
  if (stepIdx < currentIdx) return 'done';
  if (stepIdx === currentIdx) return 'active';
  return 'pending';
}

const STATUS_ETA: Partial<Record<string, string>> = {
  confirmed:  'Estimation : ~30 min',
  preparing:  'En préparation · ~20 min',
  ready:      'Recherche d\'un livreur…',
  delivering: 'En route vers vous',
  delivered:  'Livrée !',
};

export default function TrackOrderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { status, driverLocation, connected } = useTrackOrder(id ?? null);

  const currentStep = status ?? 'delivering';
  const currentStepData = STEPS.find((s) => s.key === currentStep) ?? STEPS[3];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.closeBtn}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Suivi de commande</Text>
        <View style={styles.headerRight}>
          <View style={[styles.connDot, { backgroundColor: connected ? '#22c55e' : '#94a3b8' }]} />
          <Text style={styles.orderNum}>#{id}</Text>
        </View>
      </View>

      {/* ETA card */}
      <View style={styles.etaCard}>
        <Text style={styles.etaEmoji}>{currentStepData.emoji}</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.etaTitle}>{STATUS_ETA[currentStep] ?? 'En cours'}</Text>
          {driverLocation && (
            <Text style={styles.etaTime}>
              📍 {driverLocation.lat.toFixed(4)}, {driverLocation.lng.toFixed(4)}
            </Text>
          )}
        </View>
      </View>

      {/* Timeline */}
      <View style={styles.timeline}>
        {STEPS.map((step, idx) => {
          const status = stepStatus(step.key, currentStep);
          return (
            <View key={step.key} style={styles.timelineRow}>
              <View style={styles.timelineLeft}>
                <View style={[
                  styles.dot,
                  status === 'done' && styles.dotDone,
                  status === 'active' && styles.dotActive,
                ]}>
                  {status === 'active' && <View style={styles.dotInner} />}
                  {status === 'done' && <Text style={styles.checkmark}>✓</Text>}
                </View>
                {idx < STEPS.length - 1 && (
                  <View style={[styles.line, status === 'done' && styles.lineDone]} />
                )}
              </View>
              <View style={[styles.stepContent, idx < STEPS.length - 1 && { marginBottom: 20 }]}>
                <Text style={styles.stepEmoji}>{step.emoji}</Text>
                <Text style={[
                  styles.stepLabel,
                  status === 'active' && styles.stepLabelActive,
                  status === 'pending' && styles.stepLabelPending,
                ]}>
                  {step.label}
                </Text>
              </View>
            </View>
          );
        })}
      </View>

      {/* Contact */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.contactBtn} activeOpacity={0.85}>
          <Text style={styles.contactBtnText}>📞 Contacter le livreur</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.surface[50] },

  header:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 },
  closeBtn:    { fontSize: 18, color: Colors.surface[400], fontWeight: '600', padding: 4, marginRight: 8 },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '800', color: Colors.surface[900] },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  connDot:     { width: 8, height: 8, borderRadius: 4 },
  orderNum:    { fontSize: 14, color: Colors.surface[400], fontWeight: '600' },

  etaCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    marginHorizontal: 16, backgroundColor: Colors.brand[500], borderRadius: 18, padding: 16, marginBottom: 28,
  },
  etaEmoji: { fontSize: 28 },
  etaTitle: { color: '#fff', fontSize: 15, fontWeight: '700', marginBottom: 2 },
  etaTime:  { color: 'rgba(255,255,255,0.8)', fontSize: 13 },
  etaBadge:     { backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6 },
  etaBadgeText: { color: '#fff', fontWeight: '800', fontSize: 15 },

  timeline: { paddingHorizontal: 24 },
  timelineRow:  { flexDirection: 'row' },
  timelineLeft: { alignItems: 'center', width: 28, marginRight: 14 },

  dot: {
    width: 24, height: 24, borderRadius: 12,
    borderWidth: 2, borderColor: Colors.surface[200],
    backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
  },
  dotDone:   { backgroundColor: Colors.brand[500], borderColor: Colors.brand[500] },
  dotActive: { borderColor: Colors.brand[500], borderWidth: 2.5 },
  dotInner:  { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.brand[500] },
  checkmark: { color: '#fff', fontSize: 12, fontWeight: '800' },

  line:     { width: 2, flex: 1, backgroundColor: Colors.surface[100], marginVertical: 2 },
  lineDone: { backgroundColor: Colors.brand[300] },

  stepContent: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingBottom: 4 },
  stepEmoji:        { fontSize: 18, width: 24, textAlign: 'center' },
  stepLabel:        { fontSize: 15, fontWeight: '600', color: Colors.surface[900] },
  stepLabelActive:  { color: Colors.brand[600] },
  stepLabelPending: { color: Colors.surface[400], fontWeight: '500' },

  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, paddingBottom: 32, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: Colors.surface[100] },
  contactBtn: { backgroundColor: Colors.surface[100], borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  contactBtnText: { fontSize: 15, fontWeight: '700', color: Colors.surface[700] },
});
