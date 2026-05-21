import { useEffect, useState, useCallback, useMemo } from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl, TextInput } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { Colors } from '@/constants/Colors';
import { useApi } from '@/hooks/useApi';

interface Restaurant {
  id: string;
  name: string;
  logo?: string;
  rating?: number;
  categories?: string[];
  deliveryTime?: string;
  deliveryFee?: number;
  isOpen?: boolean;
}

export default function HomeScreen() {
  const api = useApi();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return restaurants;
    const q = search.toLowerCase();
    return restaurants.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.categories?.some((c) => c.toLowerCase().includes(q)),
    );
  }, [restaurants, search]);

  const loadRestaurants = useCallback(async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      setError(null);

      // Try geolocation for nearby restaurants
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        const { latitude, longitude } = loc.coords;
        try {
          const nearby = await api.get<Restaurant[]>(
            `/api/v1/restaurants/nearby?lat=${latitude}&lng=${longitude}&radius=5000`,
          );
          setRestaurants(nearby);
          return;
        } catch {
          // Fall through to default list
        }
      }

      const data = await api.get<Restaurant[]>('/api/v1/restaurants');
      setRestaurants(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impossible de charger les restaurants.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    loadRestaurants();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const onRefresh = () => {
    setRefreshing(true);
    loadRestaurants(true);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.brand[500]} />
        }
      >

        {/* Hero */}
        <LinearGradient
          colors={[Colors.brand[600], Colors.brand[500], '#f59e0b']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <View style={styles.heroContent}>
            <Text style={styles.heroGreeting}>Bonjour 👋</Text>
            <Text style={styles.heroTitle}>Commandez{'\n'}vos plats préférés</Text>
            <TouchableOpacity style={styles.heroBtn} onPress={() => router.push('/(tabs)/menu')} activeOpacity={0.85}>
              <Text style={styles.heroBtnText}>Voir le menu →</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.heroEmoji}>🍽️</Text>
        </LinearGradient>

        {/* Delivery strip */}
        <View style={styles.strip}>
          {([['🛵', '20-35 min'], ['💳', 'Paiement sécurisé'], ['⭐', '4.8 / 5']] as [string, string][]).map(([icon, label]) => (
            <View key={label} style={styles.stripItem}>
              <Text style={styles.stripIcon}>{icon}</Text>
              <Text style={styles.stripLabel}>{label}</Text>
            </View>
          ))}
        </View>

        {/* Search */}
        <View style={styles.searchRow}>
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="🔍  Rechercher un restaurant ou cuisine…"
            placeholderTextColor={Colors.surface[400]}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
        </View>

        {/* Restaurants */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {search.trim() ? `Résultats pour "${search}"` : '🏪 Restaurants'}
          </Text>

          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.brand[500]} />
              <Text style={styles.loadingText}>Chargement…</Text>
            </View>
          )}

          {!loading && error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorEmoji}>😕</Text>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity style={styles.retryBtn} onPress={() => loadRestaurants()} activeOpacity={0.8}>
                <Text style={styles.retryBtnText}>Réessayer</Text>
              </TouchableOpacity>
            </View>
          )}

          {!loading && !error && filtered.length === 0 && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorEmoji}>{search ? '🔍' : '🏪'}</Text>
              <Text style={styles.errorText}>
                {search ? `Aucun résultat pour "${search}".` : 'Aucun restaurant disponible pour le moment.'}
              </Text>
              {search ? (
                <TouchableOpacity style={styles.retryBtn} onPress={() => setSearch('')} activeOpacity={0.8}>
                  <Text style={styles.retryBtnText}>Effacer la recherche</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          )}

          {!loading && !error && filtered.map((resto) => (
            <TouchableOpacity
              key={resto.id}
              style={styles.restaurantCard}
              onPress={() => router.push(`/restaurant/${resto.id}`)}
              activeOpacity={0.85}
            >
              <View style={styles.restaurantLogo}>
                <Text style={{ fontSize: 32 }}>🍽️</Text>
              </View>
              <View style={styles.restaurantInfo}>
                <View style={styles.restaurantNameRow}>
                  <Text style={styles.restaurantName} numberOfLines={1}>{resto.name}</Text>
                  {resto.isOpen === false && (
                    <View style={styles.closedBadge}>
                      <Text style={styles.closedBadgeText}>Fermé</Text>
                    </View>
                  )}
                </View>
                {resto.categories && resto.categories.length > 0 && (
                  <Text style={styles.restaurantCategories} numberOfLines={1}>
                    {resto.categories.join(' · ')}
                  </Text>
                )}
                <View style={styles.restaurantMeta}>
                  {resto.rating != null && (
                    <Text style={styles.metaItem}>⭐ {resto.rating.toFixed(1)}</Text>
                  )}
                  {resto.deliveryTime && (
                    <Text style={styles.metaItem}>🕐 {resto.deliveryTime}</Text>
                  )}
                  {resto.deliveryFee != null && (
                    <Text style={styles.metaItem}>
                      {resto.deliveryFee === 0 ? '🆓 Livraison offerte' : `🛵 ${resto.deliveryFee.toFixed(2)}€`}
                    </Text>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: Colors.surface[50] },
  scroll: { flex: 1 },

  hero: {
    marginHorizontal: 16, marginTop: 16, borderRadius: 24,
    padding: 24, flexDirection: 'row', alignItems: 'center', overflow: 'hidden',
  },
  heroContent: { flex: 1 },
  heroGreeting:{ color: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: '500', marginBottom: 4 },
  heroTitle:   { color: '#fff', fontSize: 24, fontWeight: '800', lineHeight: 30, marginBottom: 16 },
  heroBtn:     { alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 8 },
  heroBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  heroEmoji:   { fontSize: 56, marginLeft: 8 },

  searchRow: { paddingHorizontal: 16, marginTop: 12 },
  searchInput: {
    backgroundColor: '#fff', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12,
    fontSize: 14, color: Colors.surface[900],
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 1,
  },

  strip: {
    flexDirection: 'row', justifyContent: 'space-around',
    backgroundColor: '#fff', marginHorizontal: 16, marginTop: 12,
    borderRadius: 16, paddingVertical: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 1,
  },
  stripItem:  { alignItems: 'center', gap: 2 },
  stripIcon:  { fontSize: 18 },
  stripLabel: { fontSize: 11, color: Colors.surface[500], fontWeight: '500' },

  section:       { marginTop: 24, paddingHorizontal: 16 },
  sectionTitle:  { fontSize: 18, fontWeight: '800', color: Colors.surface[900], marginBottom: 12 },

  loadingContainer: { alignItems: 'center', paddingVertical: 32, gap: 10 },
  loadingText:      { fontSize: 14, color: Colors.surface[400] },

  errorContainer: { alignItems: 'center', paddingVertical: 32, gap: 8 },
  errorEmoji:     { fontSize: 48 },
  errorText:      { fontSize: 15, color: Colors.surface[500], textAlign: 'center', paddingHorizontal: 16 },
  retryBtn:       { marginTop: 8, backgroundColor: Colors.brand[500], borderRadius: 12, paddingHorizontal: 24, paddingVertical: 10 },
  retryBtnText:   { color: '#fff', fontWeight: '700', fontSize: 14 },

  restaurantCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#fff', borderRadius: 16, padding: 14, marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 1,
  },
  restaurantLogo: {
    width: 64, height: 64, borderRadius: 16,
    backgroundColor: Colors.surface[50],
    alignItems: 'center', justifyContent: 'center',
  },
  restaurantInfo:       { flex: 1 },
  restaurantNameRow:    { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  restaurantName:       { flex: 1, fontSize: 16, fontWeight: '700', color: Colors.surface[900] },
  closedBadge:          { backgroundColor: '#fee2e2', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  closedBadgeText:      { fontSize: 11, color: '#ef4444', fontWeight: '600' },
  restaurantCategories: { fontSize: 12, color: Colors.surface[400], marginBottom: 6 },
  restaurantMeta:       { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  metaItem:             { fontSize: 12, color: Colors.surface[500] },
});
