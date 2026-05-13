import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/auth';

interface Restaurant {
  id: string;
  name: string;
  cuisine: string;
  rating: number;
  deliveryTime: string;
  deliveryFee: string;
}

interface RecentOrder {
  id: string;
  restaurantName: string;
  items: string;
  total: string;
  date: string;
  status: 'delivered' | 'cancelled';
}

const MOCK_RESTAURANTS: Restaurant[] = [
  {
    id: '1',
    name: 'Burger Palace',
    cuisine: 'Américain • Burgers',
    rating: 4.7,
    deliveryTime: '20-30 min',
    deliveryFee: '1,99 €',
  },
  {
    id: '2',
    name: 'Sakura Sushi',
    cuisine: 'Japonais • Sushis',
    rating: 4.9,
    deliveryTime: '30-45 min',
    deliveryFee: '2,49 €',
  },
  {
    id: '3',
    name: 'La Pizza Nostra',
    cuisine: 'Italien • Pizzas',
    rating: 4.5,
    deliveryTime: '25-35 min',
    deliveryFee: 'Gratuit',
  },
];

const MOCK_ORDERS: RecentOrder[] = [
  {
    id: 'ORD-8421',
    restaurantName: 'Burger Palace',
    items: 'Classic Burger, Frites, Cola',
    total: '18,50 €',
    date: 'Hier à 19h30',
    status: 'delivered',
  },
  {
    id: 'ORD-8318',
    restaurantName: 'La Pizza Nostra',
    items: 'Margherita x2, Tiramisu',
    total: '31,00 €',
    date: 'Il y a 3 jours',
    status: 'delivered',
  },
];

function RestaurantCard({ restaurant }: { restaurant: Restaurant }) {
  return (
    <TouchableOpacity style={styles.restaurantCard} activeOpacity={0.8}>
      <View style={styles.restaurantImagePlaceholder}>
        <Text style={styles.restaurantEmoji}>🍽️</Text>
      </View>
      <View style={styles.restaurantInfo}>
        <Text style={styles.restaurantName}>{restaurant.name}</Text>
        <Text style={styles.restaurantCuisine}>{restaurant.cuisine}</Text>
        <View style={styles.restaurantMeta}>
          <View style={styles.ratingBadge}>
            <Ionicons name="star" size={12} color="#fbbf24" />
            <Text style={styles.ratingText}>{restaurant.rating}</Text>
          </View>
          <Text style={styles.metaDot}>•</Text>
          <Text style={styles.metaText}>{restaurant.deliveryTime}</Text>
          <Text style={styles.metaDot}>•</Text>
          <Text style={styles.metaText}>{restaurant.deliveryFee}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function OrderCard({ order }: { order: RecentOrder }) {
  return (
    <TouchableOpacity style={styles.orderCard} activeOpacity={0.8}>
      <View style={styles.orderHeader}>
        <Text style={styles.orderRestaurant}>{order.restaurantName}</Text>
        <View style={[styles.statusBadge, order.status === 'delivered' && styles.statusDelivered]}>
          <Text style={styles.statusText}>
            {order.status === 'delivered' ? 'Livré' : 'Annulé'}
          </Text>
        </View>
      </View>
      <Text style={styles.orderItems} numberOfLines={1}>{order.items}</Text>
      <View style={styles.orderFooter}>
        <Text style={styles.orderDate}>{order.date}</Text>
        <Text style={styles.orderTotal}>{order.total}</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function HomeScreen() {
  const { user } = useAuthStore();
  const firstName = user?.firstName ?? 'vous';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Bonjour, {firstName} 👋</Text>
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={14} color="#f97316" />
              <Text style={styles.locationText}>Paris, France</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.notifButton}>
            <Ionicons name="notifications-outline" size={22} color="#f1f5f9" />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={18} color="#64748b" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher un restaurant ou un plat..."
            placeholderTextColor="#64748b"
            editable={false}
          />
        </View>

        {/* Promo Banner */}
        <View style={styles.promoBanner}>
          <View>
            <Text style={styles.promoTitle}>Livraison offerte</Text>
            <Text style={styles.promoSubtitle}>Sur votre première commande !</Text>
          </View>
          <Text style={styles.promoEmoji}>🎉</Text>
        </View>

        {/* Restaurants Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Restaurants près de vous</Text>
            <TouchableOpacity>
              <Text style={styles.seeAll}>Voir tout</Text>
            </TouchableOpacity>
          </View>
          {MOCK_RESTAURANTS.map((restaurant) => (
            <RestaurantCard key={restaurant.id} restaurant={restaurant} />
          ))}
        </View>

        {/* Recent Orders Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Commandes récentes</Text>
            <TouchableOpacity>
              <Text style={styles.seeAll}>Voir tout</Text>
            </TouchableOpacity>
          </View>
          {MOCK_ORDERS.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  greeting: {
    fontSize: 22,
    fontWeight: '700',
    color: '#f1f5f9',
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: 13,
    color: '#94a3b8',
  },
  notifButton: {
    backgroundColor: '#1e293b',
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    marginHorizontal: 20,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#f1f5f9',
  },
  promoBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1c4532',
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 18,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#166534',
  },
  promoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4ade80',
    marginBottom: 2,
  },
  promoSubtitle: {
    fontSize: 13,
    color: '#86efac',
  },
  promoEmoji: {
    fontSize: 32,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f1f5f9',
  },
  seeAll: {
    fontSize: 13,
    color: '#f97316',
    fontWeight: '600',
  },
  restaurantCard: {
    flexDirection: 'row',
    backgroundColor: '#1e293b',
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  restaurantImagePlaceholder: {
    width: 64,
    height: 64,
    backgroundColor: '#334155',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  restaurantEmoji: {
    fontSize: 28,
  },
  restaurantInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  restaurantName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f1f5f9',
    marginBottom: 2,
  },
  restaurantCuisine: {
    fontSize: 13,
    color: '#94a3b8',
    marginBottom: 6,
  },
  restaurantMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  ratingText: {
    fontSize: 12,
    color: '#fbbf24',
    fontWeight: '600',
  },
  metaDot: {
    color: '#475569',
    fontSize: 12,
  },
  metaText: {
    fontSize: 12,
    color: '#94a3b8',
  },
  orderCard: {
    backgroundColor: '#1e293b',
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  orderRestaurant: {
    fontSize: 15,
    fontWeight: '700',
    color: '#f1f5f9',
  },
  statusBadge: {
    backgroundColor: '#1e3a5f',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  statusDelivered: {
    backgroundColor: '#14532d',
  },
  statusText: {
    fontSize: 11,
    color: '#4ade80',
    fontWeight: '600',
  },
  orderItems: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 8,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderDate: {
    fontSize: 12,
    color: '#475569',
  },
  orderTotal: {
    fontSize: 14,
    fontWeight: '700',
    color: '#f97316',
  },
  bottomPadding: {
    height: 20,
  },
});
