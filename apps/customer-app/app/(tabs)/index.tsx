import { ScrollView, View, Text, TouchableOpacity, StyleSheet, ImageBackground } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';

const CATEGORIES = [
  { id: 'cat-1', name: 'Burgers', emoji: '🍔', count: 8 },
  { id: 'cat-2', name: 'Pizzas', emoji: '🍕', count: 6 },
  { id: 'cat-3', name: 'Salades', emoji: '🥗', count: 4 },
  { id: 'cat-4', name: 'Desserts', emoji: '🍰', count: 5 },
  { id: 'cat-5', name: 'Boissons', emoji: '🥤', count: 9 },
];

const FEATURED = [
  { id: 'i-1', name: 'Classic Burger', price: 14.90, emoji: '🍔', rating: 4.8, time: '12 min' },
  { id: 'i-2', name: 'Truffle Burger', price: 22.50, emoji: '🍔', rating: 4.9, time: '15 min' },
  { id: 'i-5', name: 'Margherita', price: 13.90, emoji: '🍕', rating: 4.7, time: '18 min' },
];

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

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
          {[['🛵', '20-35 min'], ['💳', 'Paiement sécurisé'], ['⭐', '4.8 / 5']].map(([icon, label]) => (
            <View key={label} style={styles.stripItem}>
              <Text style={styles.stripIcon}>{icon}</Text>
              <Text style={styles.stripLabel}>{label}</Text>
            </View>
          ))}
        </View>

        {/* Categories */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Catégories</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryList}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={styles.categoryCard}
                onPress={() => router.push('/(tabs)/menu')}
                activeOpacity={0.75}
              >
                <View style={styles.categoryEmoji}>
                  <Text style={{ fontSize: 28 }}>{cat.emoji}</Text>
                </View>
                <Text style={styles.categoryName}>{cat.name}</Text>
                <Text style={styles.categoryCount}>{cat.count} articles</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Featured */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>⭐ Populaires</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/menu')}>
              <Text style={styles.seeAll}>Tout voir</Text>
            </TouchableOpacity>
          </View>
          {FEATURED.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.featuredCard}
              onPress={() => router.push('/(tabs)/menu')}
              activeOpacity={0.85}
            >
              <View style={styles.featuredEmoji}>
                <Text style={{ fontSize: 36 }}>{item.emoji}</Text>
              </View>
              <View style={styles.featuredInfo}>
                <Text style={styles.featuredName}>{item.name}</Text>
                <View style={styles.featuredMeta}>
                  <Text style={styles.featuredRating}>⭐ {item.rating}</Text>
                  <Text style={styles.featuredTime}>🕐 {item.time}</Text>
                </View>
              </View>
              <Text style={styles.featuredPrice}>{item.price.toFixed(2)}€</Text>
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
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle:  { fontSize: 18, fontWeight: '800', color: Colors.surface[900] },
  seeAll:        { fontSize: 13, color: Colors.brand[500], fontWeight: '600' },
  categoryList:  { gap: 12, paddingBottom: 4 },

  categoryCard: {
    alignItems: 'center', gap: 4,
    backgroundColor: '#fff', borderRadius: 16,
    paddingVertical: 14, paddingHorizontal: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 1,
  },
  categoryEmoji:  { width: 52, height: 52, borderRadius: 14, backgroundColor: Colors.surface[50], alignItems: 'center', justifyContent: 'center' },
  categoryName:   { fontSize: 13, fontWeight: '700', color: Colors.surface[900] },
  categoryCount:  { fontSize: 11, color: Colors.surface[400] },

  featuredCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#fff', borderRadius: 16, padding: 14, marginBottom: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 1,
  },
  featuredEmoji: { width: 56, height: 56, borderRadius: 14, backgroundColor: Colors.surface[50], alignItems: 'center', justifyContent: 'center' },
  featuredInfo:  { flex: 1 },
  featuredName:  { fontSize: 15, fontWeight: '700', color: Colors.surface[900], marginBottom: 4 },
  featuredMeta:  { flexDirection: 'row', gap: 10 },
  featuredRating:{ fontSize: 12, color: Colors.surface[500] },
  featuredTime:  { fontSize: 12, color: Colors.surface[500] },
  featuredPrice: { fontSize: 17, fontWeight: '800', color: Colors.brand[600] },
});
