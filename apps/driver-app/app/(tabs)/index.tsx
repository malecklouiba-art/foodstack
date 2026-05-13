import { View, Text, StyleSheet, Switch, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { useDriverStore } from '@/store/driver';

const MOCK_AVAILABLE = [
  {
    orderId: 'o-101', orderNumber: '#3012',
    restaurantName: 'FoodStack Paris 1',
    restaurantAddress: '12 rue de la Paix, Paris',
    restaurantLat: 48.8698, restaurantLng: 2.3310,
    customerAddress: '45 Bd Haussmann, Paris',
    customerLat: 48.8738, customerLng: 2.3320,
    items: [{ name: 'Classic Burger', qty: 2 }, { name: 'Tiramisu', qty: 1 }],
    earnings: 5.80, distanceKm: 1.4, estimatedMinutes: 8,
  },
  {
    orderId: 'o-102', orderNumber: '#3013',
    restaurantName: 'FoodStack Paris 2',
    restaurantAddress: '8 rue du Temple, Paris',
    restaurantLat: 48.8609, restaurantLng: 2.3533,
    customerAddress: '22 rue de Rivoli, Paris',
    customerLat: 48.8566, customerLng: 2.3522,
    items: [{ name: 'Margherita', qty: 1 }, { name: 'Diavola', qty: 1 }],
    earnings: 7.20, distanceKm: 2.1, estimatedMinutes: 13,
  },
];

export default function HomeScreen() {
  const { isOnline, setOnline, activeDelivery, todayEarnings, todayDeliveries, rating } = useDriverStore();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Bonjour 👋</Text>
            <Text style={styles.name}>Mohammed Alami</Text>
          </View>
          <View style={styles.onlineRow}>
            <Text style={[styles.onlineLabel, isOnline && styles.onlineLabelActive]}>
              {isOnline ? '🟢 En ligne' : '⚫ Hors ligne'}
            </Text>
            <Switch
              value={isOnline}
              onValueChange={(v) => {
                if (!v && activeDelivery) {
                  Alert.alert('Livraison en cours', 'Terminez la livraison avant de passer hors ligne.');
                  return;
                }
                setOnline(v);
              }}
              trackColor={{ false: Colors.surface[200], true: Colors.brand[400] }}
              thumbColor={isOnline ? Colors.brand[600] : '#fff'}
            />
          </View>
        </View>

        {/* Stats strip */}
        <LinearGradient
          colors={[Colors.brand[600], Colors.brand[500]]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={styles.statsCard}
        >
          {[
            { label: "Gains aujourd'hui", value: `${todayEarnings.toFixed(2)}€`, emoji: '💰' },
            { label: 'Livraisons', value: String(todayDeliveries), emoji: '📦' },
            { label: 'Note', value: `${rating}/5`, emoji: '⭐' },
          ].map((s) => (
            <View key={s.label} style={styles.statItem}>
              <Text style={styles.statEmoji}>{s.emoji}</Text>
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </LinearGradient>

        {/* Active delivery banner */}
        {activeDelivery && (
          <TouchableOpacity
            style={styles.activeBanner}
            onPress={() => router.push(`/delivery/${activeDelivery.orderId}/active`)}
            activeOpacity={0.88}
          >
            <View style={styles.activeBannerLeft}>
              <Text style={styles.activeBannerEmoji}>🛵</Text>
              <View>
                <Text style={styles.activeBannerTitle}>Livraison en cours — {activeDelivery.orderNumber}</Text>
                <Text style={styles.activeBannerSub}>{activeDelivery.customerAddress}</Text>
              </View>
            </View>
            <Text style={styles.activeBannerArrow}>›</Text>
          </TouchableOpacity>
        )}

        {/* Available orders */}
        {isOnline && !activeDelivery && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Commandes disponibles</Text>
            {MOCK_AVAILABLE.map((order) => (
              <View key={order.orderId} style={styles.orderCard}>
                <View style={styles.orderCardTop}>
                  <View style={styles.orderInfo}>
                    <Text style={styles.orderNum}>{order.orderNumber}</Text>
                    <Text style={styles.restaurantName}>{order.restaurantName}</Text>
                    <Text style={styles.orderItems} numberOfLines={1}>
                      {order.items.map((i) => `${i.qty}× ${i.name}`).join(', ')}
                    </Text>
                  </View>
                  <View style={styles.orderMeta}>
                    <Text style={styles.earnings}>{order.earnings.toFixed(2)}€</Text>
                    <Text style={styles.metaSmall}>{order.distanceKm} km</Text>
                    <Text style={styles.metaSmall}>~{order.estimatedMinutes} min</Text>
                  </View>
                </View>
                <View style={styles.orderAddresses}>
                  <View style={styles.addressRow}>
                    <Text style={styles.addressDot}>🔴</Text>
                    <Text style={styles.addressText} numberOfLines={1}>{order.restaurantAddress}</Text>
                  </View>
                  <View style={[styles.addressRow, { marginTop: 4 }]}>
                    <Text style={styles.addressDot}>🟢</Text>
                    <Text style={styles.addressText} numberOfLines={1}>{order.customerAddress}</Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.acceptBtn}
                  activeOpacity={0.85}
                  onPress={() => {
                    useDriverStore.getState().acceptDelivery(order);
                    router.push(`/delivery/${order.orderId}/active`);
                  }}
                >
                  <Text style={styles.acceptBtnText}>Accepter la livraison</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {!isOnline && (
          <View style={styles.offlineState}>
            <Text style={styles.offlineEmoji}>😴</Text>
            <Text style={styles.offlineTitle}>Vous êtes hors ligne</Text>
            <Text style={styles.offlineText}>Passez en ligne pour recevoir des commandes</Text>
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: Colors.surface[50] },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16 },
  greeting:{ fontSize: 13, color: Colors.surface[400], fontWeight: '500' },
  name:    { fontSize: 20, fontWeight: '800', color: Colors.surface[900] },
  onlineRow:{ flexDirection: 'row', alignItems: 'center', gap: 8 },
  onlineLabel:      { fontSize: 13, color: Colors.surface[400], fontWeight: '600' },
  onlineLabelActive:{ color: Colors.brand[600] },

  statsCard: { marginHorizontal: 16, borderRadius: 20, padding: 20, flexDirection: 'row', justifyContent: 'space-around', marginBottom: 16 },
  statItem:  { alignItems: 'center', gap: 3 },
  statEmoji: { fontSize: 20 },
  statValue: { fontSize: 20, fontWeight: '900', color: '#fff' },
  statLabel: { fontSize: 11, color: 'rgba(255,255,255,0.8)', textAlign: 'center' },

  activeBanner: {
    marginHorizontal: 16, marginBottom: 16,
    backgroundColor: Colors.brand[500], borderRadius: 16, padding: 14,
    flexDirection: 'row', alignItems: 'center',
  },
  activeBannerLeft:  { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  activeBannerEmoji: { fontSize: 26 },
  activeBannerTitle: { fontSize: 14, fontWeight: '700', color: '#fff' },
  activeBannerSub:   { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  activeBannerArrow: { fontSize: 22, color: '#fff', fontWeight: '600' },

  section:      { paddingHorizontal: 16 },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: Colors.surface[900], marginBottom: 12 },

  orderCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 14, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 2,
  },
  orderCardTop: { flexDirection: 'row', marginBottom: 12 },
  orderInfo:    { flex: 1 },
  orderNum:     { fontSize: 16, fontWeight: '800', color: Colors.surface[900], marginBottom: 2 },
  restaurantName:{ fontSize: 13, color: Colors.brand[600], fontWeight: '600', marginBottom: 3 },
  orderItems:   { fontSize: 13, color: Colors.surface[500] },
  orderMeta:    { alignItems: 'flex-end', gap: 3 },
  earnings:     { fontSize: 22, fontWeight: '900', color: Colors.brand[600] },
  metaSmall:    { fontSize: 12, color: Colors.surface[400] },

  orderAddresses: { backgroundColor: Colors.surface[50], borderRadius: 10, padding: 10, marginBottom: 12 },
  addressRow:  { flexDirection: 'row', alignItems: 'center', gap: 6 },
  addressDot:  { fontSize: 10 },
  addressText: { flex: 1, fontSize: 13, color: Colors.surface[600] },

  acceptBtn: {
    backgroundColor: Colors.brand[500], borderRadius: 12,
    paddingVertical: 12, alignItems: 'center',
  },
  acceptBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  offlineState: { alignItems: 'center', paddingTop: 60, gap: 8 },
  offlineEmoji: { fontSize: 56 },
  offlineTitle: { fontSize: 18, fontWeight: '700', color: Colors.surface[700] },
  offlineText:  { fontSize: 14, color: Colors.surface[400], textAlign: 'center', paddingHorizontal: 40 },
});
