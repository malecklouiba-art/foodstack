import { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { useApi } from '@/hooks/useApi';
import { useCartStore } from '@/store/cart';
import { MenuItemCard } from '@/components/menu/MenuItemCard';

interface MenuCategory {
  id: string;
  name: string;
}

interface MenuItem {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  prepTime: number;
  dietaryTags: string[];
  allergens: string[];
  isActive: boolean;
  isFeatured: boolean;
  rating?: number;
  image?: string;
}

interface MenuResponse {
  categories: MenuCategory[];
  items: MenuItem[];
}

interface RestaurantDetail {
  id: string;
  name: string;
  logo?: string;
  rating?: number;
  categories?: string[];
  deliveryTime?: string;
  deliveryFee?: number;
  isOpen?: boolean;
}

const ALL_CATEGORY: MenuCategory = { id: 'all', name: 'Tout' };

export default function RestaurantDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const api = useApi();

  const [restaurant, setRestaurant] = useState<RestaurantDetail | null>(null);
  const [categories, setCategories] = useState<MenuCategory[]>([ALL_CATEGORY]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [selectedCat, setSelectedCat] = useState('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cartCount = useCartStore((s) => s.count());
  const cartTotal = useCartStore((s) => s.total());

  // Animate cart bar in/out
  const cartBarAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(cartBarAnim, {
      toValue: cartCount > 0 ? 1 : 0,
      useNativeDriver: true,
      tension: 60,
      friction: 9,
    }).start();
  }, [cartCount, cartBarAnim]);

  const loadData = useCallback(
    async (isRefresh = false) => {
      if (!id) return;
      try {
        if (!isRefresh) setLoading(true);
        setError(null);

        const [restoData, menuData] = await Promise.all([
          api.get<RestaurantDetail>(`/api/v1/restaurants/${id}`),
          api.get<MenuResponse>(`/api/v1/menus?restaurantId=${id}`),
        ]);

        setRestaurant(restoData);
        setCategories([ALL_CATEGORY, ...menuData.categories]);
        setItems(menuData.items);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Impossible de charger les données.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [id], // eslint-disable-line react-hooks/exhaustive-deps
  );

  useEffect(() => {
    loadData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const onRefresh = () => {
    setRefreshing(true);
    loadData(true);
  };

  const filtered = items.filter(
    (i) => selectedCat === 'all' || i.categoryId === selectedCat,
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
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
        <View style={styles.backRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
            <Text style={styles.backBtnText}>← Retour</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.center}>
          <Text style={styles.errorEmoji}>😕</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => loadData()} activeOpacity={0.8}>
            <Text style={styles.retryBtnText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const cartBarTranslateY = cartBarAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [100, 0],
  });

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Back button */}
      <View style={styles.backRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <Text style={styles.backBtnText}>← Retour</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(i) => i.id}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.brand[500]} />
        }
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <>
            {/* Hero header */}
            <View style={styles.hero}>
              <View style={styles.heroLogo}>
                <Text style={styles.heroLogoEmoji}>🍽️</Text>
              </View>
              <View style={styles.heroInfo}>
                <Text style={styles.heroName}>{restaurant?.name ?? ''}</Text>
                {restaurant?.categories && restaurant.categories.length > 0 && (
                  <Text style={styles.heroCuisine} numberOfLines={1}>
                    {restaurant.categories.join(' · ')}
                  </Text>
                )}
                <View style={styles.heroMeta}>
                  {restaurant?.rating != null && (
                    <View style={styles.metaBadge}>
                      <Text style={styles.metaBadgeText}>⭐ {restaurant.rating.toFixed(1)}</Text>
                    </View>
                  )}
                  {restaurant?.deliveryTime && (
                    <View style={styles.metaBadge}>
                      <Text style={styles.metaBadgeText}>🕐 {restaurant.deliveryTime}</Text>
                    </View>
                  )}
                  {restaurant?.deliveryFee != null && (
                    <View style={styles.metaBadge}>
                      <Text style={styles.metaBadgeText}>
                        {restaurant.deliveryFee === 0
                          ? '🆓 Livraison offerte'
                          : `🛵 ${restaurant.deliveryFee.toFixed(2)}€`}
                      </Text>
                    </View>
                  )}
                </View>
                {restaurant?.isOpen === false && (
                  <View style={styles.closedBanner}>
                    <Text style={styles.closedBannerText}>🔴 Fermé actuellement</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Category tabs */}
            <FlatList
              data={categories}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(c) => c.id}
              contentContainerStyle={styles.catList}
              renderItem={({ item: cat }) => (
                <TouchableOpacity
                  onPress={() => setSelectedCat(cat.id)}
                  style={[styles.catChip, selectedCat === cat.id && styles.catChipActive]}
                  activeOpacity={0.75}
                >
                  <Text
                    style={[styles.catChipText, selectedCat === cat.id && styles.catChipTextActive]}
                  >
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              )}
            />

            <Text style={styles.sectionTitle}>
              {filtered.length} article{filtered.length !== 1 ? 's' : ''}
            </Text>
          </>
        }
        renderItem={({ item }) => (
          <MenuItemCard
            id={item.id}
            name={item.name}
            description={item.description}
            price={item.price}
            compareAtPrice={item.compareAtPrice}
            image={item.image}
            prepTime={item.prepTime}
            isFeatured={item.isFeatured}
            isActive={item.isActive}
            restaurantId={id ?? ''}
          />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🍽️</Text>
            <Text style={styles.emptyText}>Aucun article dans cette catégorie</Text>
          </View>
        }
      />

      {/* Sticky cart bar */}
      <Animated.View
        style={[styles.cartBar, { transform: [{ translateY: cartBarTranslateY }] }]}
        pointerEvents={cartCount > 0 ? 'auto' : 'none'}
      >
        <TouchableOpacity
          style={styles.cartBarInner}
          onPress={() => router.push('/(tabs)/cart')}
          activeOpacity={0.9}
        >
          <View style={styles.cartBadge}>
            <Text style={styles.cartBadgeText}>{cartCount}</Text>
          </View>
          <Text style={styles.cartBarText}>Voir le panier</Text>
          <Text style={styles.cartBarTotal}>{cartTotal.toFixed(2)}€</Text>
        </TouchableOpacity>
      </Animated.View>
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

  backRow: { paddingHorizontal: 16, paddingVertical: 8 },
  backBtn: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start' },
  backBtnText: { fontSize: 15, fontWeight: '600', color: Colors.brand[600] },

  listContent: { paddingBottom: 120 },

  hero: {
    flexDirection: 'row', gap: 14, alignItems: 'flex-start',
    backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 16,
    borderRadius: 20, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 10, elevation: 2,
  },
  heroLogo: {
    width: 80, height: 80, borderRadius: 20,
    backgroundColor: Colors.surface[100],
    alignItems: 'center', justifyContent: 'center',
  },
  heroLogoEmoji: { fontSize: 36 },
  heroInfo: { flex: 1 },
  heroName: { fontSize: 20, fontWeight: '800', color: Colors.surface[900], marginBottom: 4 },
  heroCuisine: { fontSize: 13, color: Colors.surface[400], marginBottom: 8 },
  heroMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  metaBadge: {
    backgroundColor: Colors.surface[100], borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 4,
  },
  metaBadgeText: { fontSize: 12, color: Colors.surface[600], fontWeight: '500' },
  closedBanner: {
    marginTop: 8, backgroundColor: '#fee2e2',
    borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  closedBannerText: { fontSize: 12, color: '#ef4444', fontWeight: '600' },

  catList: { gap: 8, paddingHorizontal: 16, paddingVertical: 8 },
  catChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: '#fff', borderWidth: 1, borderColor: Colors.surface[200],
  },
  catChipActive:     { backgroundColor: Colors.brand[500], borderColor: Colors.brand[500] },
  catChipText:       { fontSize: 13, fontWeight: '600', color: Colors.surface[600] },
  catChipTextActive: { color: '#fff' },

  sectionTitle: {
    fontSize: 13, color: Colors.surface[400], fontWeight: '500',
    paddingHorizontal: 16, paddingBottom: 4,
  },

  empty:      { alignItems: 'center', paddingTop: 60, gap: 8 },
  emptyEmoji: { fontSize: 48 },
  emptyText:  { fontSize: 15, color: Colors.surface[400] },

  cartBar: {
    position: 'absolute', bottom: 16, left: 16, right: 16,
  },
  cartBarInner: {
    backgroundColor: Colors.brand[500], borderRadius: 18,
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14, gap: 10,
    shadowColor: Colors.brand[500], shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 12, elevation: 6,
  },
  cartBadge:     { backgroundColor: '#fff', borderRadius: 8, minWidth: 24, height: 24, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  cartBadgeText: { color: Colors.brand[600], fontWeight: '800', fontSize: 13 },
  cartBarText:   { flex: 1, color: '#fff', fontWeight: '700', fontSize: 16 },
  cartBarTotal:  { color: '#fff', fontWeight: '800', fontSize: 16 },
});
