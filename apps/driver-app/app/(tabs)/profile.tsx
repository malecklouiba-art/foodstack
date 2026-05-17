import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/Colors';
import { useDriverStore } from '@/store/driver';
import { useApi } from '@/hooks/useApi';
import { useAuthStore } from '@/store/auth';

// ── Types ────────────────────────────────────────────────────────────────────

interface DriverProfile {
  id: string;
  vehicleType?: string;
  vehiclePlate?: string;
  rating?: number;
  totalDeliveries?: number;
  isAvailable?: boolean;
}

// ── Vehicle helpers ───────────────────────────────────────────────────────────

function vehicleEmoji(type?: string): string {
  if (!type) return '🛵';
  const t = type.toLowerCase();
  if (t.includes('bike') || t.includes('velo') || t.includes('bicycle')) return '🚲';
  if (t.includes('car') || t.includes('voiture')) return '🚗';
  if (t.includes('foot') || t.includes('pied')) return '🚶';
  return '🛵';
}

function vehicleLabel(type?: string): string {
  if (!type) return 'Scooter';
  const map: Record<string, string> = {
    motorcycle: 'Moto',
    scooter: 'Scooter',
    bike: 'Vélo',
    bicycle: 'Vélo',
    car: 'Voiture',
    foot: 'À pied',
  };
  return map[type.toLowerCase()] ?? type;
}

/** Derive initials from a full name ("Mohammed Alami" → "MA") */
function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
}

// ── Hook ─────────────────────────────────────────────────────────────────────

function useDriverProfile() {
  const { get } = useApi();
  const driver = useAuthStore((s) => s.driver);
  const { setDriverStats } = useDriverStore();

  const [profile, setProfile] = useState<DriverProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(
    async (isRefresh = false) => {
      if (!driver?.id) {
        setLoading(false);
        return;
      }
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      try {
        const data = await get<DriverProfile>(`/api/v1/drivers/${driver.id}`);
        setProfile(data);

        // Sync rating into the global driver store so other screens benefit
        if (data.rating != null) {
          setDriverStats({ rating: data.rating });
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur réseau');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [get, driver?.id, setDriverStats]
  );

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const refresh = useCallback(() => fetchProfile(true), [fetchProfile]);

  return { profile, loading, refreshing, error, refresh };
}

// ── Screen ───────────────────────────────────────────────────────────────────

export default function DriverProfileScreen() {
  const { rating } = useDriverStore();
  const driver = useAuthStore((s) => s.driver);
  const logout = useAuthStore((s) => s.logout);
  const { profile, loading, refreshing, error, refresh } = useDriverProfile();

  const displayName = driver?.name ?? 'Livreur';
  const displayRating = profile?.rating ?? rating;
  const totalDeliveries = profile?.totalDeliveries ?? 0;

  function handleLogout() {
    Alert.alert('Déconnexion', 'Vous serez déconnecté.', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Se déconnecter',
        style: 'destructive',
        onPress: () => logout(),
      },
    ]);
  }

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
        {/* Profile hero */}
        <LinearGradient
          colors={[Colors.brand[700], Colors.brand[500]]}
          style={styles.hero}
        >
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials(displayName)}</Text>
          </View>
          <Text style={styles.heroName}>{displayName}</Text>
          <Text style={styles.heroSub}>Livreur</Text>

          {loading && !refreshing ? (
            <ActivityIndicator color="rgba(255,255,255,0.8)" style={{ marginTop: 12 }} />
          ) : (
            <View style={styles.heroStats}>
              <View style={styles.heroStat}>
                <Text style={styles.heroStatValue}>{totalDeliveries}</Text>
                <Text style={styles.heroStatLabel}>livraisons</Text>
              </View>
              <View style={styles.heroStatDivider} />
              <View style={styles.heroStat}>
                <Text style={styles.heroStatValue}>
                  {displayRating > 0 ? displayRating.toFixed(1) : '—'}
                </Text>
                <Text style={styles.heroStatLabel}>note</Text>
              </View>
              <View style={styles.heroStatDivider} />
              <View style={styles.heroStat}>
                <Text style={styles.heroStatValue}>
                  {profile?.isAvailable ? 'Dispo' : 'Indispo'}
                </Text>
                <Text style={styles.heroStatLabel}>statut</Text>
              </View>
            </View>
          )}
        </LinearGradient>

        {/* Error banner */}
        {error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>{error}</Text>
            <TouchableOpacity onPress={refresh}>
              <Text style={styles.retryText}>Réessayer</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Vehicle */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Véhicule</Text>
          <View style={styles.menuCard}>
            <View style={styles.vehicleRow}>
              <Text style={styles.vehicleEmoji}>
                {vehicleEmoji(profile?.vehicleType)}
              </Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.vehicleName}>
                  {vehicleLabel(profile?.vehicleType)}
                </Text>
                {profile?.vehiclePlate ? (
                  <Text style={styles.vehiclePlate}>{profile.vehiclePlate}</Text>
                ) : null}
              </View>
            </View>
          </View>
        </View>

        {/* Documents */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Documents</Text>
          <View style={styles.menuCard}>
            {[
              { label: "Permis de conduire", status: '✅ Validé' },
              { label: "Assurance véhicule", status: "✅ Valide jusqu'au 03/2027" },
              { label: "Carte d'identité", status: '✅ Validée' },
              { label: "KBIS / Statut", status: '✅ Auto-entrepreneur' },
            ].map((doc, idx, arr) => (
              <View
                key={doc.label}
                style={[styles.docRow, idx < arr.length - 1 && styles.docRowBorder]}
              >
                <Text style={styles.docLabel}>{doc.label}</Text>
                <Text style={styles.docStatus}>{doc.status}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Paramètres</Text>
          <View style={styles.menuCard}>
            {[
              { icon: '🔔', label: 'Notifications' },
              { icon: '🌍', label: 'Zone de livraison' },
              { icon: '💳', label: 'Virement bancaire' },
              { icon: '❓', label: 'Aide & Support' },
            ].map((item, idx, arr) => (
              <TouchableOpacity
                key={item.label}
                style={[styles.menuRow, idx < arr.length - 1 && styles.menuRowBorder]}
                activeOpacity={0.7}
              >
                <Text style={styles.menuIcon}>{item.icon}</Text>
                <Text style={styles.menuLabel}>{item.label}</Text>
                <Text style={styles.menuChevron}>›</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <TouchableOpacity
            style={styles.signOutBtn}
            activeOpacity={0.85}
            onPress={handleLogout}
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
  safe: { flex: 1, backgroundColor: Colors.surface[50] },

  hero:           { paddingTop: 28, paddingBottom: 24, alignItems: 'center', gap: 4 },
  avatar:         { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  avatarText:     { color: '#fff', fontSize: 26, fontWeight: '900' },
  heroName:       { color: '#fff', fontSize: 22, fontWeight: '800' },
  heroSub:        { color: 'rgba(255,255,255,0.75)', fontSize: 13, fontWeight: '500', marginBottom: 16 },
  heroStats:      { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 14, paddingHorizontal: 20, paddingVertical: 12 },
  heroStat:       { alignItems: 'center', paddingHorizontal: 16 },
  heroStatValue:  { color: '#fff', fontSize: 18, fontWeight: '800' },
  heroStatLabel:  { color: 'rgba(255,255,255,0.75)', fontSize: 11, marginTop: 2 },
  heroStatDivider:{ width: 1, height: 30, backgroundColor: 'rgba(255,255,255,0.3)' },

  errorBanner: {
    marginHorizontal: 16, marginTop: 12, backgroundColor: '#fee2e2',
    borderRadius: 10, padding: 12, flexDirection: 'row',
    justifyContent: 'space-between', alignItems: 'center',
  },
  errorBannerText:{ fontSize: 13, color: '#ef4444', flex: 1, marginRight: 8 },
  retryText:      { fontSize: 13, color: Colors.brand[600], fontWeight: '700' },

  section:      { marginTop: 20, paddingHorizontal: 16 },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: Colors.surface[400], textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },

  menuCard: { backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 1 },

  vehicleRow:  { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  vehicleEmoji:{ fontSize: 28 },
  vehicleName: { fontSize: 15, fontWeight: '700', color: Colors.surface[900] },
  vehiclePlate:{ fontSize: 13, color: Colors.surface[500], marginTop: 2 },

  docRow:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  docRowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.surface[100] },
  docLabel:     { fontSize: 14, color: Colors.surface[700] },
  docStatus:    { fontSize: 12, color: Colors.brand[600], fontWeight: '600', flex: 1, textAlign: 'right' },

  menuRow:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  menuRowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.surface[100] },
  menuIcon:      { fontSize: 18 },
  menuLabel:     { flex: 1, fontSize: 15, color: Colors.surface[900], fontWeight: '500' },
  menuChevron:   { fontSize: 20, color: Colors.surface[300] },

  signOutBtn:  { backgroundColor: '#fff', borderRadius: 14, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: '#fee2e2' },
  signOutText: { color: '#ef4444', fontWeight: '700', fontSize: 15 },
});
