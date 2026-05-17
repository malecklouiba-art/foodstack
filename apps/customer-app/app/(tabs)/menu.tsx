import { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';
import { MenuItemCard } from '@/components/menu/MenuItemCard';
import { useCartStore } from '@/store/cart';
import { useApi } from '@/hooks/useApi';
import { router } from 'expo-router';

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
}

interface MenuResponse {
  categories: MenuCategory[];
  items: MenuItem[];
}

interface Restaurant {
  id: string;
  name: string;
}

const ALL_CATEGORY: MenuCategory = { id: 'all', name: 'Tout' };

export default function MenuScreen() {
  const api = useApi();
  const [categories, setCategories] = useState<MenuCategory[]>([ALL_CATEGORY]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCat, setSelectedCat] = useState('all');
  const [search, setSearch] = useState('');

  const cartCount = useCartStore((s) => s.count());
  const cartTotal = useCartStore((s) => s.total());

  const loadMenu = useCallback(async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      setError(null);

      // Fetch first restaurant if we don't have one yet
      let rid = restaurantId;
      if (!rid) {
        const restaurants = await api.get<Restaurant[]>('/api/v1/restaurants');
        if (restaurants.length === 0) {
          setError('Aucun restaurant disponible.');
          return;
        }
        rid = restaurants[0].id;
        setRestaurantId(rid);
      }

      const data = await api.get<MenuResponse>(`/api/v1/menu?restaurantId=${rid}`);
      setCategories([ALL_CATEGORY, ...data.categories]);
      setItems(data.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impossible de charger le menu.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [restaurantId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    loadMenu();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const onRefresh = () => {
    setRefreshing(true);
    loadMenu(true);
  };

  const filtered = items.filter((i) => {
    const matchCat = selectedCat === 'all' || i.categoryId === selectedCat;
    const matchSearch = !search || i.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.brand[500]} />
          <Text style={styles.loadingText}>Chargement du menu…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.center}>
          <Text style={styles.errorEmoji}>😕</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => loadMenu()} activeOpacity={0.8}>
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
        <Text style={styles.headerTitle}>Notre menu</Text>
        <Text style={styles.headerSub}>{filtered.length} articles</Text>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher un plat…"
          placeholderTextColor={Colors.surface[400]}
          value={search}
          onChangeText={setSearch}
        />
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
            <Text style={[styles.catChipText, selectedCat === cat.id && styles.catChipTextActive]}>
              {cat.name}
            </Text>
          </TouchableOpacity>
        )}
      />

      {/* Items */}
      <FlatList
        data={filtered}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => (
          <MenuItemCard
            id={item.id}
            name={item.name}
            description={item.description}
            price={item.price}
            compareAtPrice={item.compareAtPrice}
            prepTime={item.prepTime}
            isFeatured={item.isFeatured}
            isActive={item.isActive}
            restaurantId={restaurantId ?? ''}
          />
        )}
        contentContainerStyle={styles.itemList}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.brand[500]} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🍽️</Text>
            <Text style={styles.emptyText}>Aucun article trouvé</Text>
          </View>
        }
      />

      {/* Floating cart bar */}
      {cartCount > 0 && (
        <TouchableOpacity
          style={styles.cartBar}
          onPress={() => router.push('/(tabs)/cart')}
          activeOpacity={0.9}
        >
          <View style={styles.cartBadge}>
            <Text style={styles.cartBadgeText}>{cartCount}</Text>
          </View>
          <Text style={styles.cartBarText}>Voir le panier</Text>
          <Text style={styles.cartBarTotal}>{cartTotal.toFixed(2)}€</Text>
        </TouchableOpacity>
      )}
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

  header: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 },
  headerTitle: { fontSize: 26, fontWeight: '800', color: Colors.surface[900] },
  headerSub:   { fontSize: 13, color: Colors.surface[400], marginTop: 2 },

  searchContainer: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#fff', marginHorizontal: 16, marginVertical: 10,
    borderRadius: 14, paddingHorizontal: 12, height: 44,
    borderWidth: 1, borderColor: Colors.surface[200],
  },
  searchIcon:  { fontSize: 16 },
  searchInput: { flex: 1, fontSize: 14, color: Colors.surface[900] },

  catList: { gap: 8, paddingHorizontal: 16, paddingBottom: 8 },
  catChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: '#fff', borderWidth: 1, borderColor: Colors.surface[200],
  },
  catChipActive:     { backgroundColor: Colors.brand[500], borderColor: Colors.brand[500] },
  catChipText:       { fontSize: 13, fontWeight: '600', color: Colors.surface[600] },
  catChipTextActive: { color: '#fff' },

  itemList: { paddingTop: 4, paddingBottom: 100 },

  empty:      { alignItems: 'center', paddingTop: 60, gap: 8 },
  emptyEmoji: { fontSize: 48 },
  emptyText:  { fontSize: 15, color: Colors.surface[400] },

  cartBar: {
    position: 'absolute', bottom: 16, left: 16, right: 16,
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
