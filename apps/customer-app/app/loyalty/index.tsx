import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Animated, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { useApi } from '@/hooks/useApi';
import { useAuthStore } from '@/store/auth';
import { useRef } from 'react';

// ── Types ─────────────────────────────────────────────────────────────────────

interface LoyaltyData {
  loyaltyPoints: number;
  loyaltyTier: string;
}

interface Transaction {
  id: string;
  points: number;
  type: 'earn' | 'redeem';
  reason: string;
  createdAt: string;
}

// ── Config ────────────────────────────────────────────────────────────────────

const TIERS = [
  { name: 'Bronze',   min: 0,    emoji: '🥉', color: '#cd7f32' as const, next: 500 },
  { name: 'Silver',   min: 500,  emoji: '🥈', color: '#94a3b8' as const, next: 1500 },
  { name: 'Gold',     min: 1500, emoji: '🥇', color: '#f59e0b' as const, next: 3000 },
  { name: 'Platinum', min: 3000, emoji: '💎', color: '#8b5cf6' as const },
];

const REWARDS = [
  { id: 'r1', label: 'Livraison offerte', points: 300, emoji: '🛵' },
  { id: 'r2', label: 'Dessert offert',    points: 250, emoji: '🍮' },
  { id: 'r3', label: 'Boisson offerte',   points: 200, emoji: '🥤' },
  { id: 'r4', label: 'Réduction 5 €',    points: 500, emoji: '🎟️' },
  { id: 'r5', label: 'Réduction 10 €',   points: 1000, emoji: '💰' },
  { id: 'r6', label: 'Repas offert',      points: 2000, emoji: '🎁' },
];

function getTier(points: number) {
  return [...TIERS].reverse().find((t) => points >= t.min) ?? TIERS[0];
}

function relativeDate(iso: string) {
  const d = new Date(iso);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return "À l'instant";
  if (diff < 3600) return `Il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)}h`;
  return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' }).format(d);
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function LoyaltyScreen() {
  const api = useApi();
  const { user } = useAuthStore();
  const progressAnim = useRef(new Animated.Value(0)).current;

  const [loyalty, setLoyalty] = useState<LoyaltyData>({ loyaltyPoints: 0, loyaltyTier: 'bronze' });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [pts, hist] = await Promise.allSettled([
        api.get<LoyaltyData>('/api/v1/loyalty/me'),
        api.get<Transaction[]>('/api/v1/loyalty/me/history'),
      ]);
      if (pts.status === 'fulfilled') setLoyalty(pts.value);
      if (hist.status === 'fulfilled' && Array.isArray(hist.value)) setTransactions(hist.value);
    } catch {
      // keep defaults
    } finally {
      setLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load(); }, [load]);

  const tier = getTier(loyalty.loyaltyPoints);
  const nextTierDef = TIERS[TIERS.indexOf(tier) + 1];
  const progress = nextTierDef
    ? (loyalty.loyaltyPoints - tier.min) / (nextTierDef.min - tier.min)
    : 1;

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 900,
      useNativeDriver: false,
    }).start();
  }, [progress]); // eslint-disable-line react-hooks/exhaustive-deps

  async function redeem(rewardId: string, cost: number, label: string) {
    if (loyalty.loyaltyPoints < cost) {
      Alert.alert('Points insuffisants', `Il vous faut ${cost} points. Vous en avez ${loyalty.loyaltyPoints}.`);
      return;
    }
    Alert.alert(
      `Échanger ${cost} pts`,
      `Obtenir : ${label}`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          onPress: async () => {
            setRedeeming(rewardId);
            try {
              if (user?.id) {
                await api.post(`/api/v1/loyalty/${user.id}/redeem`, { points: cost });
              }
              setLoyalty((prev) => ({ ...prev, loyaltyPoints: prev.loyaltyPoints - cost }));
              setTransactions((prev) => [{
                id: `tx-${Date.now()}`,
                points: -cost,
                type: 'redeem',
                reason: `Échange : ${label}`,
                createdAt: new Date().toISOString(),
              }, ...prev]);
              Alert.alert('🎉 Succès', `${label} obtenu !`);
            } catch {
              Alert.alert('Erreur', "Impossible d'effectuer l'échange.");
            } finally {
              setRedeeming(null);
            }
          },
        },
      ],
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={styles.backBtn}>← Retour</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Fidélité</Text>
          <View style={{ width: 60 }} />
        </View>
        <ActivityIndicator style={{ marginTop: 60 }} color={Colors.brand[500]} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={styles.backBtn}>← Retour</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Programme fidélité</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* ── Tier card ── */}
        <LinearGradient
          colors={[tier.color + 'dd', Colors.brand[600]]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={styles.tierCard}
        >
          <View style={styles.tierRow}>
            <View>
              <Text style={styles.tierLabel}>Niveau actuel</Text>
              <Text style={styles.tierName}>{tier.emoji} {tier.name}</Text>
            </View>
            <View style={styles.pointsBox}>
              <Text style={styles.pointsValue}>{loyalty.loyaltyPoints.toLocaleString('fr-FR')}</Text>
              <Text style={styles.pointsUnit}>points</Text>
            </View>
          </View>

          {nextTierDef && (
            <>
              <View style={styles.progressBg}>
                <Animated.View
                  style={[
                    styles.progressFill,
                    {
                      width: progressAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0%', '100%'],
                        extrapolate: 'clamp',
                      }),
                    },
                  ]}
                />
              </View>
              <Text style={styles.progressLabel}>
                {nextTierDef.min - loyalty.loyaltyPoints} pts avant {nextTierDef.emoji} {nextTierDef.name}
              </Text>
            </>
          )}
        </LinearGradient>

        {/* ── All tiers overview ── */}
        <View style={styles.tiersSection}>
          <Text style={styles.sectionTitle}>Niveaux</Text>
          <View style={styles.tiersRow}>
            {TIERS.map((t) => {
              const isCurrent = t.name === tier.name;
              return (
                <View
                  key={t.name}
                  style={[styles.tierChip, isCurrent && { backgroundColor: t.color + '22', borderColor: t.color, borderWidth: 1.5 }]}
                >
                  <Text style={styles.tierChipEmoji}>{t.emoji}</Text>
                  <Text style={[styles.tierChipName, isCurrent && { color: t.color, fontWeight: '800' }]}>{t.name}</Text>
                  <Text style={styles.tierChipMin}>{t.min === 0 ? '0 pt' : `${t.min} pts`}</Text>
                  {isCurrent && <View style={[styles.tierCurrentDot, { backgroundColor: t.color }]} />}
                </View>
              );
            })}
          </View>
        </View>

        {/* ── Rewards ── */}
        <View style={styles.rewardsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Échanges disponibles</Text>
            <Text style={styles.pointsAvailable}>{loyalty.loyaltyPoints} pts</Text>
          </View>
          <View style={styles.rewardsGrid}>
            {REWARDS.map((reward) => {
              const canAfford = loyalty.loyaltyPoints >= reward.points;
              const isRedeeming = redeeming === reward.id;
              return (
                <TouchableOpacity
                  key={reward.id}
                  style={[styles.rewardCard, !canAfford && styles.rewardCardDisabled]}
                  onPress={() => redeem(reward.id, reward.points, reward.label)}
                  disabled={!canAfford || !!redeeming}
                  activeOpacity={0.75}
                >
                  <Text style={styles.rewardEmoji}>{reward.emoji}</Text>
                  <Text style={[styles.rewardLabel, !canAfford && { color: Colors.surface[400] }]}>{reward.label}</Text>
                  <View style={[styles.rewardCostPill, !canAfford && styles.rewardCostPillDisabled]}>
                    <Text style={[styles.rewardCostText, !canAfford && { color: Colors.surface[400] }]}>
                      {isRedeeming ? '…' : `${reward.points} pts`}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ── History ── */}
        <View style={styles.historySection}>
          <Text style={styles.sectionTitle}>Historique</Text>
          {transactions.length === 0 ? (
            <View style={styles.emptyHistory}>
              <Text style={styles.emptyHistoryText}>Aucune transaction pour l'instant</Text>
            </View>
          ) : (
            <View style={styles.historyList}>
              {transactions.slice(0, 20).map((tx) => (
                <View key={tx.id} style={styles.txRow}>
                  <View style={[styles.txDot, { backgroundColor: tx.type === 'earn' ? '#22c55e' : '#f87171' }]} />
                  <View style={styles.txInfo}>
                    <Text style={styles.txReason} numberOfLines={1}>{tx.reason}</Text>
                    <Text style={styles.txDate}>{relativeDate(tx.createdAt)}</Text>
                  </View>
                  <Text style={[styles.txPoints, { color: tx.type === 'earn' ? '#16a34a' : '#dc2626' }]}>
                    {tx.type === 'earn' ? '+' : ''}{tx.points} pts
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* ── Referral CTA ── */}
        <View style={styles.referralCard}>
          <Text style={styles.referralTitle}>🎁 Parrainez un ami</Text>
          <Text style={styles.referralDesc}>Gagnez 200 points par ami parrainé</Text>
          <TouchableOpacity
            style={styles.referralBtn}
            onPress={() => Alert.alert('Code copié', `Partagez votre code : ${user?.id?.slice(-6).toUpperCase() ?? 'FOODSTACK'}`)}
          >
            <Text style={styles.referralBtnText}>Partager mon code</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: Colors.surface[50] },
  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.surface[100], backgroundColor: '#fff' },
  headerTitle: { fontSize: 17, fontWeight: '800', color: Colors.surface[900] },
  backBtn:     { fontSize: 15, color: Colors.brand[500], fontWeight: '600' },

  tierCard:    { marginHorizontal: 16, marginTop: 16, borderRadius: 24, padding: 20 },
  tierRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 },
  tierLabel:   { color: 'rgba(255,255,255,0.75)', fontSize: 12, fontWeight: '500' },
  tierName:    { color: '#fff', fontSize: 22, fontWeight: '900', marginTop: 2 },
  pointsBox:   { alignItems: 'flex-end' },
  pointsValue: { color: '#fff', fontSize: 38, fontWeight: '900', lineHeight: 44 },
  pointsUnit:  { color: 'rgba(255,255,255,0.75)', fontSize: 13, fontWeight: '600' },
  progressBg:  { height: 7, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 4, marginBottom: 6 },
  progressFill:{ height: 7, backgroundColor: '#fff', borderRadius: 4 },
  progressLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 11, fontWeight: '500' },

  tiersSection: { marginHorizontal: 16, marginTop: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: Colors.surface[900], marginBottom: 12 },
  tiersRow:     { flexDirection: 'row', gap: 8 },
  tierChip:     { flex: 1, alignItems: 'center', backgroundColor: Colors.surface[100], borderRadius: 16, paddingVertical: 12, paddingHorizontal: 4, gap: 2 },
  tierChipEmoji:{ fontSize: 22 },
  tierChipName: { fontSize: 11, fontWeight: '700', color: Colors.surface[600] },
  tierChipMin:  { fontSize: 9, color: Colors.surface[400] },
  tierCurrentDot: { width: 6, height: 6, borderRadius: 3, marginTop: 2 },

  sectionHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  pointsAvailable:{ fontSize: 13, fontWeight: '700', color: Colors.brand[600] },

  rewardsSection: { marginHorizontal: 16, marginTop: 24 },
  rewardsGrid:    { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  rewardCard:     { width: '30%', flexGrow: 1, alignItems: 'center', backgroundColor: Colors.brand[50], borderRadius: 18, paddingVertical: 14, paddingHorizontal: 8, gap: 4, borderWidth: 1, borderColor: Colors.brand[100] },
  rewardCardDisabled: { backgroundColor: Colors.surface[100], borderColor: Colors.surface[200] },
  rewardEmoji:    { fontSize: 28 },
  rewardLabel:    { fontSize: 11, fontWeight: '700', color: Colors.surface[700], textAlign: 'center' },
  rewardCostPill: { backgroundColor: Colors.brand[500], borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  rewardCostPillDisabled: { backgroundColor: Colors.surface[200] },
  rewardCostText: { fontSize: 10, fontWeight: '800', color: '#000' },

  historySection: { marginHorizontal: 16, marginTop: 24 },
  historyList:    { backgroundColor: '#fff', borderRadius: 20, overflow: 'hidden' },
  txRow:          { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: Colors.surface[50] },
  txDot:          { width: 8, height: 8, borderRadius: 4 },
  txInfo:         { flex: 1 },
  txReason:       { fontSize: 13, fontWeight: '600', color: Colors.surface[700] },
  txDate:         { fontSize: 11, color: Colors.surface[400], marginTop: 1 },
  txPoints:       { fontSize: 13, fontWeight: '800', tabularNums: true } as any,
  emptyHistory:   { backgroundColor: '#fff', borderRadius: 20, paddingVertical: 32, alignItems: 'center' },
  emptyHistoryText: { fontSize: 14, color: Colors.surface[400] },

  referralCard: { marginHorizontal: 16, marginTop: 24, backgroundColor: Colors.brand[500], borderRadius: 24, padding: 20, alignItems: 'center' },
  referralTitle: { fontSize: 18, fontWeight: '900', color: '#000', marginBottom: 4 },
  referralDesc:  { fontSize: 13, color: 'rgba(0,0,0,0.6)', marginBottom: 16 },
  referralBtn:   { backgroundColor: '#000', borderRadius: 14, paddingVertical: 12, paddingHorizontal: 24 },
  referralBtnText: { fontSize: 14, fontWeight: '800', color: Colors.brand[400] },
});
