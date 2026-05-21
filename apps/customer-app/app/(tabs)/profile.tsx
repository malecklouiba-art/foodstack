import { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Switch, Alert, ActivityIndicator, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '@/constants/Colors';
import { useApi } from '@/hooks/useApi';
import { router } from 'expo-router';

const TIERS = [
  { name: 'Bronze',   min: 0,    max: 500,      emoji: '🥉', color: '#cd7f32' },
  { name: 'Silver',   min: 500,  max: 1500,     emoji: '🥈', color: '#94a3b8' },
  { name: 'Gold',     min: 1500, max: 3000,     emoji: '🥇', color: '#f59e0b' },
  { name: 'Platinum', min: 3000, max: Infinity,  emoji: '💎', color: '#8b5cf6' },
];

function getTier(points: number) {
  return TIERS.find((t) => points >= t.min && points < t.max) ?? TIERS[0];
}

interface LoyaltyData {
  loyaltyPoints: number;
  loyaltyTier?: string;
}

interface UserProfile {
  id: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone?: string;
}

export default function ProfileScreen() {
  const api = useApi();
  const [notifOrders, setNotifOrders] = useState(true);
  const [notifPromo, setNotifPromo] = useState(true);
  const [section, setSection] = useState<'main' | 'notifications'>('main');

  const [points, setPoints] = useState(0);
  const [userName, setUserName] = useState('');
  const [loadingProfile, setLoadingProfile] = useState(true);
  const progressAnim = useRef(new Animated.Value(0)).current;

  const loadProfile = useCallback(async () => {
    try {
      setLoadingProfile(true);

      // Get userId from stored auth
      const userRaw = await AsyncStorage.getItem('auth_user');
      const storedUser = userRaw ? (JSON.parse(userRaw) as { id: string; name?: string }) : null;

      // Fetch loyalty data and user profile in parallel
      const [loyaltyData, userProfile] = await Promise.allSettled([
        api.get<LoyaltyData>('/api/v1/loyalty/me'),
        storedUser ? api.get<UserProfile>(`/api/v1/users/${storedUser.id}`) : Promise.reject(new Error('no user')),
      ]);

      if (loyaltyData.status === 'fulfilled') {
        setPoints(loyaltyData.value.loyaltyPoints ?? 0);
      }

      if (userProfile.status === 'fulfilled') {
        const p = userProfile.value;
        const computedName = p.name ?? ([p.firstName, p.lastName].filter(Boolean).join(' ') || p.email);
        setUserName(computedName);
      } else if (storedUser?.name) {
        // Fallback to locally stored name
        setUserName(storedUser.name);
      }
    } catch {
      // Non-fatal: keep defaults
    } finally {
      setLoadingProfile(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    loadProfile();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const currentTier = getTier(points);
  const nextTier = TIERS[TIERS.indexOf(currentTier) + 1];
  const tierProgress = nextTier
    ? (points - currentTier.min) / (nextTier.min - currentTier.min)
    : 1;

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: tierProgress,
      duration: 800,
      useNativeDriver: false,
    }).start();
  }, [tierProgress]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSignOut = () => {
    Alert.alert('Déconnexion', 'Vous serez déconnecté.', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Se déconnecter',
        style: 'destructive',
        onPress: async () => {
          await Promise.all(['auth_token', 'auth_refresh_token', 'auth_user'].map((k) => AsyncStorage.removeItem(k))).catch(() => {});
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  if (section === 'notifications') {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.navHeader}>
          <TouchableOpacity onPress={() => setSection('main')}>
            <Text style={styles.backBtn}>← Retour</Text>
          </TouchableOpacity>
          <Text style={styles.navTitle}>Notifications</Text>
          <View style={{ width: 60 }} />
        </View>
        <View style={styles.notifList}>
          {[
            { label: 'Statut des commandes', value: notifOrders, setter: setNotifOrders, desc: 'Confirmation, préparation, livraison' },
            { label: 'Promotions', value: notifPromo, setter: setNotifPromo, desc: 'Offres spéciales et nouveautés' },
          ].map((item) => (
            <View key={item.label} style={styles.notifRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.notifLabel}>{item.label}</Text>
                <Text style={styles.notifDesc}>{item.desc}</Text>
              </View>
              <Switch
                value={item.value}
                onValueChange={item.setter}
                trackColor={{ false: Colors.surface[200], true: Colors.brand[400] }}
                thumbColor={item.value ? Colors.brand[600] : '#fff'}
              />
            </View>
          ))}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Loyalty hero */}
        <LinearGradient
          colors={[currentTier.color + 'cc', Colors.brand[600]]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={styles.loyaltyCard}
        >
          <View style={styles.loyaltyTop}>
            <View>
              <Text style={styles.loyaltyGreeting}>Bonjour</Text>
              {loadingProfile ? (
                <ActivityIndicator color="#fff" style={{ marginTop: 4 }} />
              ) : (
                <Text style={styles.loyaltyName}>{userName || 'Mon profil'}</Text>
              )}
            </View>
            <Text style={styles.tierEmoji}>{currentTier.emoji}</Text>
          </View>
          <View style={styles.loyaltyPoints}>
            <Text style={styles.pointsValue}>{points}</Text>
            <Text style={styles.pointsLabel}>points</Text>
          </View>
          {nextTier && (
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
                {nextTier.min - points} pts avant {nextTier.emoji} {nextTier.name}
              </Text>
            </>
          )}
        </LinearGradient>

        {/* Quick actions */}
        <View style={styles.quickActions}>
          {[
            { emoji: '📍', label: 'Adresses', onPress: () => router.push('/addresses') },
            { emoji: '🏆', label: 'Fidélité', onPress: () => router.push('/loyalty') },
            { emoji: '💳', label: 'Paiement', onPress: () => {} },
            { emoji: '❓', label: 'Aide', onPress: () => {} },
          ].map((item) => (
            <TouchableOpacity key={item.label} style={styles.quickAction} onPress={item.onPress} activeOpacity={0.7}>
              <Text style={styles.quickEmoji}>{item.emoji}</Text>
              <Text style={styles.quickLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Account section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mon compte</Text>
          <View style={styles.menuCard}>
            {[
              { icon: '👤', label: 'Modifier le profil', action: () => {} },
              { icon: '🔒', label: 'Changer le mot de passe', action: () => {} },
              { icon: '📍', label: 'Mes adresses', action: () => router.push('/addresses') },
              { icon: '🔔', label: 'Notifications', action: () => setSection('notifications') },
            ].map((item, idx, arr) => (
              <TouchableOpacity
                key={item.label}
                style={[styles.menuRow, idx < arr.length - 1 && styles.menuRowBorder]}
                onPress={item.action}
                activeOpacity={0.7}
              >
                <Text style={styles.menuIcon}>{item.icon}</Text>
                <Text style={styles.menuLabel}>{item.label}</Text>
                <Text style={styles.menuChevron}>›</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Sign out */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.signOutBtn}
            activeOpacity={0.85}
            onPress={handleSignOut}
          >
            <Text style={styles.signOutText}>Se déconnecter</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: Colors.surface[50] },

  navHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.surface[100] },
  navTitle:  { fontSize: 17, fontWeight: '700', color: Colors.surface[900] },
  backBtn:   { fontSize: 15, color: Colors.brand[500], fontWeight: '600' },

  loyaltyCard: { marginHorizontal: 16, marginTop: 16, borderRadius: 24, padding: 20 },
  loyaltyTop:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  loyaltyGreeting:{ color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: '500' },
  loyaltyName:    { color: '#fff', fontSize: 20, fontWeight: '800', marginTop: 2 },
  tierEmoji:      { fontSize: 36 },
  loyaltyPoints:  { flexDirection: 'row', alignItems: 'baseline', gap: 4, marginBottom: 12 },
  pointsValue:    { color: '#fff', fontSize: 42, fontWeight: '900' },
  pointsLabel:    { color: 'rgba(255,255,255,0.8)', fontSize: 16, fontWeight: '600' },
  progressBg:     { height: 6, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 3, marginBottom: 6 },
  progressFill:   { height: 6, backgroundColor: '#fff', borderRadius: 3 },
  progressLabel:  { color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: '500' },

  quickActions: { flexDirection: 'row', justifyContent: 'space-around', marginHorizontal: 16, marginTop: 16, backgroundColor: '#fff', borderRadius: 16, paddingVertical: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 1 },
  quickAction:  { alignItems: 'center', gap: 4 },
  quickEmoji:   { fontSize: 22 },
  quickLabel:   { fontSize: 11, color: Colors.surface[600], fontWeight: '600' },

  section:      { marginTop: 20, paddingHorizontal: 16 },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: Colors.surface[400], textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },

  menuCard: { backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 1 },
  menuRow:  { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  menuRowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.surface[100] },
  menuIcon:     { fontSize: 18 },
  menuLabel:    { flex: 1, fontSize: 15, color: Colors.surface[900], fontWeight: '500' },
  menuChevron:  { fontSize: 20, color: Colors.surface[300] },

  signOutBtn: { backgroundColor: '#fff', borderRadius: 14, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: '#fee2e2' },
  signOutText: { color: '#ef4444', fontWeight: '700', fontSize: 15 },

  addressList: { padding: 16, gap: 10 },
  addressCard: { backgroundColor: '#fff', borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 1 },
  addressLeft:  { flex: 1 },
  addressLabel: { fontSize: 14, fontWeight: '700', color: Colors.surface[900], marginBottom: 2 },
  defaultBadge: { fontSize: 11, color: Colors.brand[600], fontWeight: '600', backgroundColor: Colors.brand[50], paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, alignSelf: 'flex-start', marginBottom: 4 },
  addressText:  { fontSize: 13, color: Colors.surface[500] },
  editBtn:      { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: Colors.surface[200] },
  editBtnText:  { fontSize: 13, color: Colors.surface[600], fontWeight: '600' },
  addAddressBtn:{ borderRadius: 14, borderWidth: 1.5, borderColor: Colors.brand[300], borderStyle: 'dashed', paddingVertical: 14, alignItems: 'center' },
  addAddressBtnText: { fontSize: 14, color: Colors.brand[500], fontWeight: '700' },

  notifList: { padding: 16 },
  notifRow:  { backgroundColor: '#fff', borderRadius: 14, padding: 16, flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  notifLabel:{ fontSize: 15, fontWeight: '600', color: Colors.surface[900], marginBottom: 2 },
  notifDesc: { fontSize: 13, color: Colors.surface[400] },
});
