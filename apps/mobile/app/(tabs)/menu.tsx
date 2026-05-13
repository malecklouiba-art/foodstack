import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCartStore } from '@/store/cart';

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  emoji: string;
}

interface Restaurant {
  id: string;
  name: string;
  cuisine: string;
  rating: number;
  deliveryTime: string;
  emoji: string;
  items: MenuItem[];
}

const RESTAURANTS: Restaurant[] = [
  {
    id: 'rest-1',
    name: 'Burger Palace',
    cuisine: 'Américain • Burgers',
    rating: 4.7,
    deliveryTime: '20-30 min',
    emoji: '🍔',
    items: [
      { id: 'bp-1', name: 'Classic Burger', description: 'Steak haché, cheddar, salade, tomate, oignons', price: 9.9, category: 'Burgers', emoji: '🍔' },
      { id: 'bp-2', name: 'Double Bacon', description: 'Double steak, bacon croustillant, sauce BBQ', price: 13.5, category: 'Burgers', emoji: '🥓' },
      { id: 'bp-3', name: 'Veggie Burger', description: 'Galette de légumes, avocat, pesto', price: 10.5, category: 'Burgers', emoji: '🥑' },
      { id: 'bp-4', name: 'Frites Maison', description: 'Frites fraîches, sel, ketchup', price: 3.9, category: 'Accompagnements', emoji: '🍟' },
      { id: 'bp-5', name: 'Milkshake Vanille', description: 'Crème glacée, lait, extrait de vanille', price: 5.5, category: 'Boissons', emoji: '🥛' },
    ],
  },
  {
    id: 'rest-2',
    name: 'Sakura Sushi',
    cuisine: 'Japonais • Sushis',
    rating: 4.9,
    deliveryTime: '30-45 min',
    emoji: '🍣',
    items: [
      { id: 'ss-1', name: 'California Roll (8 pcs)', description: 'Surimi, avocat, concombre', price: 8.9, category: 'Makis', emoji: '🍣' },
      { id: 'ss-2', name: 'Saumon Avocat (8 pcs)', description: 'Saumon frais, avocat, wasabi', price: 10.9, category: 'Makis', emoji: '🍱' },
      { id: 'ss-3', name: 'Plateau Sushi 16 pcs', description: 'Sélection du chef : saumon, thon, crevette', price: 19.9, category: 'Plateaux', emoji: '🎌' },
      { id: 'ss-4', name: 'Edamame', description: 'Fèves de soja vapeur, fleur de sel', price: 4.5, category: 'Entrées', emoji: '🫘' },
      { id: 'ss-5', name: 'Soupe Miso', description: 'Bouillon dashi, tofu, wakamé', price: 3.9, category: 'Entrées', emoji: '🍵' },
    ],
  },
  {
    id: 'rest-3',
    name: 'La Pizza Nostra',
    cuisine: 'Italien • Pizzas',
    rating: 4.5,
    deliveryTime: '25-35 min',
    emoji: '🍕',
    items: [
      { id: 'pn-1', name: 'Margherita', description: 'Tomate, mozzarella fior di latte, basilic', price: 11.0, category: 'Pizzas', emoji: '🍕' },
      { id: 'pn-2', name: 'Quattro Formaggi', description: 'Gorgonzola, mozzarella, parmesan, chèvre', price: 13.5, category: 'Pizzas', emoji: '🧀' },
      { id: 'pn-3', name: 'Diavola', description: 'Tomate, mozzarella, salami piquant, piment', price: 13.0, category: 'Pizzas', emoji: '🌶️' },
      { id: 'pn-4', name: 'Tiramisu', description: 'Mascarpone, café, biscuits, cacao', price: 6.5, category: 'Desserts', emoji: '🍮' },
      { id: 'pn-5', name: 'Eau Pétillante 50cl', description: 'San Pellegrino', price: 2.5, category: 'Boissons', emoji: '💧' },
    ],
  },
];

export default function MenuScreen() {
  const router = useRouter();
  const { addItem, itemCount } = useCartStore();
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);

  const handleAddToCart = (item: MenuItem, restaurant: Restaurant) => {
    addItem({
      menuItemId: item.id,
      name: item.name,
      price: item.price,
      restaurantId: restaurant.id,
      restaurantName: restaurant.name,
    });
    Alert.alert('', `${item.name} ajouté au panier`, [{ text: 'OK', style: 'default' }], { cancelable: true });
  };

  if (selectedRestaurant) {
    const categories = [...new Set(selectedRestaurant.items.map((i) => i.category))];
    return (
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.detailHeader}>
          <TouchableOpacity onPress={() => setSelectedRestaurant(null)} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color="#f1f5f9" />
          </TouchableOpacity>
          <View style={styles.detailHeaderInfo}>
            <Text style={styles.detailRestaurantName}>{selectedRestaurant.name}</Text>
            <Text style={styles.detailMeta}>
              ⭐ {selectedRestaurant.rating} • {selectedRestaurant.deliveryTime}
            </Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/(tabs)/cart' as never)} style={styles.cartBtn}>
            <Ionicons name="cart-outline" size={24} color="#f97316" />
            {itemCount() > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{itemCount()}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {categories.map((category) => (
            <View key={category} style={styles.categorySection}>
              <Text style={styles.categoryTitle}>{category}</Text>
              {selectedRestaurant.items
                .filter((i) => i.category === category)
                .map((item) => (
                  <View key={item.id} style={styles.menuItem}>
                    <View style={styles.menuItemImagePlaceholder}>
                      <Text style={styles.menuItemEmoji}>{item.emoji}</Text>
                    </View>
                    <View style={styles.menuItemInfo}>
                      <Text style={styles.menuItemName}>{item.name}</Text>
                      <Text style={styles.menuItemDesc} numberOfLines={2}>{item.description}</Text>
                      <View style={styles.menuItemFooter}>
                        <Text style={styles.menuItemPrice}>{item.price.toFixed(2)} €</Text>
                        <TouchableOpacity
                          style={styles.addBtn}
                          onPress={() => handleAddToCart(item, selectedRestaurant)}
                          activeOpacity={0.8}
                        >
                          <Ionicons name="add" size={18} color="#fff" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                ))}
            </View>
          ))}
          <View style={styles.bottomPadding} />
        </ScrollView>

        {itemCount() > 0 && (
          <TouchableOpacity
            style={styles.floatingCartBtn}
            onPress={() => router.push('/(tabs)/cart' as never)}
            activeOpacity={0.9}
          >
            <View style={styles.floatingCartCount}>
              <Text style={styles.floatingCartCountText}>{itemCount()}</Text>
            </View>
            <Text style={styles.floatingCartLabel}>Voir le panier</Text>
            <Text style={styles.floatingCartPrice}>
              {useCartStore.getState().total().toFixed(2)} €
            </Text>
          </TouchableOpacity>
        )}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Restaurants</Text>
        <TouchableOpacity onPress={() => router.push('/(tabs)/cart' as never)} style={styles.cartBtn}>
          <Ionicons name="cart-outline" size={24} color="#f97316" />
          {itemCount() > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{itemCount()}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.subtitle}>Choisissez votre restaurant</Text>
        {RESTAURANTS.map((restaurant) => (
          <TouchableOpacity
            key={restaurant.id}
            style={styles.restaurantCard}
            onPress={() => setSelectedRestaurant(restaurant)}
            activeOpacity={0.8}
          >
            <View style={styles.restaurantImage}>
              <Text style={styles.restaurantEmoji}>{restaurant.emoji}</Text>
            </View>
            <View style={styles.restaurantInfo}>
              <Text style={styles.restaurantName}>{restaurant.name}</Text>
              <Text style={styles.restaurantCuisine}>{restaurant.cuisine}</Text>
              <View style={styles.restaurantMeta}>
                <Ionicons name="star" size={12} color="#fbbf24" />
                <Text style={styles.ratingText}>{restaurant.rating}</Text>
                <Text style={styles.metaDot}>•</Text>
                <Ionicons name="time-outline" size={12} color="#94a3b8" />
                <Text style={styles.metaText}>{restaurant.deliveryTime}</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#475569" />
          </TouchableOpacity>
        ))}
        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#f1f5f9' },

  subtitle: {
    fontSize: 14,
    color: '#94a3b8',
    paddingHorizontal: 20,
    marginBottom: 16,
  },

  cartBtn: { position: 'relative', padding: 4 },
  cartBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#f97316',
    borderRadius: 8,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBadgeText: { fontSize: 10, color: '#fff', fontWeight: '700' },

  restaurantCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  restaurantImage: {
    width: 60,
    height: 60,
    backgroundColor: '#334155',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  restaurantEmoji: { fontSize: 28 },
  restaurantInfo: { flex: 1 },
  restaurantName: { fontSize: 16, fontWeight: '700', color: '#f1f5f9', marginBottom: 2 },
  restaurantCuisine: { fontSize: 13, color: '#94a3b8', marginBottom: 6 },
  restaurantMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingText: { fontSize: 12, color: '#fbbf24', fontWeight: '600' },
  metaDot: { color: '#475569', fontSize: 12 },
  metaText: { fontSize: 12, color: '#94a3b8' },

  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    gap: 12,
  },
  backBtn: {
    backgroundColor: '#1e293b',
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailHeaderInfo: { flex: 1 },
  detailRestaurantName: { fontSize: 18, fontWeight: '700', color: '#f1f5f9' },
  detailMeta: { fontSize: 13, color: '#94a3b8', marginTop: 2 },

  categorySection: { marginBottom: 8 },
  categoryTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#f97316',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#0f172a',
  },
  menuItem: {
    flexDirection: 'row',
    backgroundColor: '#1e293b',
    marginHorizontal: 20,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  menuItemImagePlaceholder: {
    width: 72,
    height: 72,
    backgroundColor: '#334155',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  menuItemEmoji: { fontSize: 30 },
  menuItemInfo: { flex: 1 },
  menuItemName: { fontSize: 15, fontWeight: '700', color: '#f1f5f9', marginBottom: 4 },
  menuItemDesc: { fontSize: 12, color: '#64748b', lineHeight: 17, marginBottom: 10 },
  menuItemFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  menuItemPrice: { fontSize: 16, fontWeight: '700', color: '#f97316' },
  addBtn: {
    backgroundColor: '#f97316',
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },

  floatingCartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f97316',
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 16,
    padding: 16,
    gap: 8,
  },
  floatingCartCount: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 8,
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  floatingCartCountText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  floatingCartLabel: { flex: 1, fontSize: 15, fontWeight: '700', color: '#fff' },
  floatingCartPrice: { fontSize: 15, fontWeight: '700', color: '#fff' },

  bottomPadding: { height: 20 },
});
