import { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';
import { MenuItemCard } from '@/components/menu/MenuItemCard';
import { useCartStore } from '@/store/cart';
import { router } from 'expo-router';

const CATEGORIES = [
  { id: 'all', name: 'Tout' },
  { id: 'cat-1', name: '🍔 Burgers' },
  { id: 'cat-2', name: '🍕 Pizzas' },
  { id: 'cat-3', name: '🥗 Salades' },
  { id: 'cat-4', name: '🍰 Desserts' },
  { id: 'cat-5', name: '🥤 Boissons' },
];

const ITEMS = [
  { id: 'i-1', categoryId: 'cat-1', name: 'Classic Burger', description: 'Steak haché, cheddar, salade, tomate, oignons caramélisés', price: 14.90, prepTime: 12, dietaryTags: [], allergens: ['Gluten', 'Lait'], isActive: true, isFeatured: true, rating: 4.8 },
  { id: 'i-2', categoryId: 'cat-1', name: 'Truffle Burger', description: 'Huile de truffe, champignons poêlés, emmental, mayo maison', price: 22.50, compareAtPrice: 26.00, prepTime: 15, dietaryTags: [], allergens: ['Gluten', 'Lait'], isActive: true, isFeatured: false, rating: 4.9 },
  { id: 'i-3', categoryId: 'cat-1', name: 'Chicken Burger', description: 'Poulet croustillant, coleslaw maison, sauce BBQ fumée', price: 12.90, prepTime: 14, dietaryTags: [], allergens: ['Gluten'], isActive: true, isFeatured: false, rating: 4.6 },
  { id: 'i-4', categoryId: 'cat-1', name: 'Veggie Burger', description: 'Steak de légumes, avocat frais, tomate, roquette', price: 13.50, prepTime: 10, dietaryTags: ['vegetarian', 'vegan'], allergens: ['Gluten'], isActive: true, isFeatured: false, rating: 4.3 },
  { id: 'i-5', categoryId: 'cat-2', name: 'Margherita', description: 'Sauce tomate, mozzarella di bufala, basilic frais', price: 13.90, prepTime: 18, dietaryTags: ['vegetarian'], allergens: ['Gluten', 'Lait'], isActive: true, isFeatured: true, rating: 4.7 },
  { id: 'i-6', categoryId: 'cat-2', name: 'Diavola', description: 'Sauce tomate, mozzarella, salami piquant, piment', price: 15.90, prepTime: 18, dietaryTags: ['spicy'], allergens: ['Gluten', 'Lait'], isActive: true, isFeatured: false, rating: 4.5 },
  { id: 'i-7', categoryId: 'cat-3', name: 'Salade César', description: 'Romaine, parmesan, croûtons dorés, poulet grillé', price: 12.50, prepTime: 8, dietaryTags: [], allergens: ['Gluten', 'Lait', 'Oeufs'], isActive: true, isFeatured: false, rating: 4.4 },
  { id: 'i-8', categoryId: 'cat-4', name: 'Tiramisu', description: 'Recette traditionnelle italienne, mascarpone, café', price: 7.50, prepTime: 0, dietaryTags: ['vegetarian'], allergens: ['Oeufs', 'Lait', 'Gluten'], isActive: true, isFeatured: false, rating: 4.9 },
];

const RESTAURANT_ID = 'r1';

export default function MenuScreen() {
  const [selectedCat, setSelectedCat] = useState('all');
  const [search, setSearch] = useState('');
  const cartCount = useCartStore((s) => s.count());
  const cartTotal = useCartStore((s) => s.total());

  const filtered = ITEMS.filter((i) => {
    const matchCat = selectedCat === 'all' || i.categoryId === selectedCat;
    const matchSearch = !search || i.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

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
        data={CATEGORIES}
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
            compareAtPrice={(item as { compareAtPrice?: number }).compareAtPrice}
            prepTime={item.prepTime}
            isFeatured={item.isFeatured}
            isActive={item.isActive}
            restaurantId={RESTAURANT_ID}
          />
        )}
        contentContainerStyle={styles.itemList}
        showsVerticalScrollIndicator={false}
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
