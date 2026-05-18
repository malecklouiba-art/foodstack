import { View, Text, StyleSheet, Switch, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { useApi } from '@/hooks/useApi';
import { useDriverStore } from '@/store/driver';
import { useAuthStore } from '@/store/auth';
import { useAvailableOrders } from '@/hooks/useAvailableOrders';

export default function HomeScreen() {
  const { isOnline, setOnline, activeDelivery, todayEarnings, todayDeliveries, rating } = useDriverStore();
  const driver = useAuthStore((s) => s.driver);
  const driverId = driver?.id ?? '';
  const { orders: liveOrders, connected, removeOrder } = useAvailableOrders(driverId);
  const { patch } = useApi();

  // Stats strip items — response rate only shown when online
  const stats = [
    { label: "Gains aujourd'hui", value: `${todayEarnings.toFixed(2)}€`, emoji: '💰', onPress: undefined as (() => void) | undefined },
    { label: 'Livraisons', value: String(todayDeliveries), emoji: '📦', onPress: () => router.push('/(tabs)/orders') },
    { label: 'Note', value: `${rating}/5`, emoji: '⭐', onPress: undefined as (() => void) | undefined },
    ...(isOnline ? [{ label: 'Réponses', value: '94%', emoji: '📡', onPress: undefined as (() => void) | undefined }] : []),
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Bonjour 👋</Text>
            <Text style={styles.name}>{driver?.name ?? ''}</Text>
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
          {stats.map((s) => {
            const inner = (
              <View key={s.label} style={styles.statItem}>
                <Text style={styles.statEmoji}>{s.emoji}</Text>
                <Text style={styles.statValue}>{s.value}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            );
            if (s.onPress) {
              return (
                <TouchableOpacity key={s.label} onPress={s.onPress} activeOpacity={0.75} style={styles.statItem}>
                  <Text style={styles.statEmoji}>{s.emoji}</Text>
                  <Text style={styles.statValue}>{s.value}</Text>
                  <Text style={styles.statLabel}>{s.label}</Text>
                </TouchableOpacity>
              );
            }
            return inner;
          })}
        </LinearGradient>

        {/* Active delivery card — replaces available orders section */}
        {activeDelivery ? (
          <View style={styles.activeSection}>
            <LinearGradient
              colors={[Colors.brand[600], Colors.brand[500]]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={styles.activeCard}
            >
              <View style={styles.activeCardHeader}>
                <Text style={styles.activeCardBadge}>🛵 En livraison</Text>
                <Text style={styles.activeCardOrderNum}>{activeDelivery.orderNumber}</Text>
              </View>

              <View style={styles.activeCardBody}>
                <View style={styles.activeCardRow}>
                  <Text style={styles.activeCardIcon}>🍽</Text>
                  <View style={styles.activeCardTextBlock}>
                    <Text style={styles.activeCardRowLabel}>Restaurant</Text>
                    <Text style={styles.activeCardRowValue} numberOfLines={1}>
                      {activeDelivery.restaurantName}
                    </Text>
                  </View>
                </View>
                <View style={styles.activeCardDivider} />
                <View style={styles.activeCardRow}>
                  <Text style={styles.activeCardIcon}>📍</Text>
                  <View style={styles.activeCardTextBlock}>
                    <Text style={styles.activeCardRowLabel}>Adresse client</Text>
                    <Text style={styles.activeCardRowValue} numberOfLines={2}>
                      {activeDelivery.customerAddress}
                    </Text>
                  </View>
                </View>
              </View>

              <TouchableOpacity
                style={styles.activeCardBtn}
                activeOpacity={0.85}
                onPress={() => router.push(`/delivery/${activeDelivery.orderId}/active`)}
              >
                <Text style={styles.activeCardBtnText}>Voir la livraison →</Text>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        ) : (
          <>
            {/* Available orders */}
            {isOnline && (
              <View style={styles.section}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionTitle}>Commandes disponibles</Text>
                  <View style={[styles.connBadge, { backgroundColor: connected ? Colors.brand[50] : Colors.surface[100] }]}>
                    <View style={[styles.connDot, { backgroundColor: connected ? Colors.brand[500] : Colors.surface[400] }]} />
                    <Text style={[styles.connText, { color: connected ? Colors.brand[600] : Colors.surface[400] }]}>
                      {connected ? 'Connecté' : 'Hors ligne'}
                    </Text>
                  </View>
                </View>
                {liveOrders.length === 0 && (
                  <View style={styles.waitingState}>
                    <Text style={styles.waitingEmoji}>⏳</Text>
                    <Text style={styles.waitingText}>En attente de commandes…</Text>
                  </View>
                )}
                {liveOrders.map((order) => (
                  <View key={order.orderId} style={styles.orderCard}>
                    <View style={styles.orderCardTop}>
                      <View style={styles.orderInfo}>
                        <Text style={styles.orderNum}>{order.orderNumber}</Text>
                        <Text style={styles.restaurantName}>{order.restaurantName ?? 'Restaurant'}</Text>
                        <Text style={styles.orderItems} numberOfLines={1}>
                          {order.itemCount ? `${order.itemCount} articles` : ''}
                        </Text>
                      </View>
                      <View style={styles.orderMeta}>
                        <Text style={styles.earnings}>{(order.earnings ?? (order.total ? order.total * 0.15 : 5)).toFixed(2)}€</Text>
                        {order.distanceKm && <Text style={styles.metaSmall}>{order.distanceKm} km</Text>}
                        {order.estimatedMinutes && <Text style={styles.metaSmall}>~{order.estimatedMinutes} min</Text>}
                      </View>
                    </View>
                    {(order.restaurantAddress || order.customerAddress) && (
                      <View style={styles.orderAddresses}>
                        {order.restaurantAddress && (
                          <View style={styles.addressRow}>
                            <Text style={styles.addressDot}>🔴</Text>
                            <Text style={styles.addressText} numberOfLines={1}>{order.restaurantAddress}</Text>
                          </View>
                        )}
                        {order.customerAddress && (
                          <View style={[styles.addressRow, { marginTop: 4 }]}>
                            <Text style={styles.addressDot}>🟢</Text>
                            <Text style={styles.addressText} numberOfLines={1}>{order.customerAddress}</Text>
                          </View>
                        )}
                      </View>
                    )}
                    <TouchableOpacity
                      style={styles.acceptBtn}
                      activeOpacity={0.85}
                      onPress={() => {
                        useDriverStore.getState().acceptDelivery({
                          orderId: order.orderId,
                          orderNumber: order.orderNumber,
                          restaurantId: order.restaurantId ?? '',
                          restaurantName: order.restaurantName ?? 'Restaurant',
                          restaurantAddress: order.restaurantAddress ?? '',
                          restaurantLat: order.restaurantLat ?? 48.8566,
                          restaurantLng: order.restaurantLng ?? 2.3522,
                          customerAddress: order.customerAddress ?? '',
                          customerLat: order.customerLat ?? 48.8566,
                          customerLng: order.customerLng ?? 2.3522,
                          items: [],
                          earnings: order.earnings ?? 5,
                          distanceKm: order.distanceKm ?? 1.5,
                          estimatedMinutes: order.estimatedMinutes ?? 10,
                        });
                        removeOrder(order.orderId);
                        // Assign this driver to the order on the server
                        if (driverId) {
                          patch(`/api/v1/orders/${order.orderId}/assign-driver`, { driverId })
                            .catch(() => { /* best-effort — delivery proceeds regardless */ });
                        }
                        router.push(`/delivery/${order.orderId}/active`);
                      }}
                    >
                      <Text style={styles.acceptBtnText}>Accepter la livraison</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {/* Offline state */}
            {!isOnline && (
              <View style={styles.offlineState}>
                <Text style={styles.offlineEmoji}>😴</Text>
                <Text style={styles.offlineTitle}>Vous êtes hors ligne</Text>
                <Text style={styles.offlineText}>Passez en ligne pour recevoir des commandes</Text>
                <TouchableOpacity
                  style={styles.goOnlineBtn}
                  activeOpacity={0.85}
                  onPress={() => setOnline(true)}
                >
                  <Text style={styles.goOnlineBtnText}>Passer en ligne</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
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

  // Active delivery card
  activeSection: { paddingHorizontal: 16, marginBottom: 16 },
  activeCard: { borderRadius: 20, padding: 18, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 5 },
  activeCardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  activeCardBadge: { fontSize: 15, fontWeight: '800', color: '#fff' },
  activeCardOrderNum: { fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.85)', backgroundColor: 'rgba(0,0,0,0.15)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  activeCardBody: { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 14, padding: 14, marginBottom: 16 },
  activeCardRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  activeCardIcon: { fontSize: 18, marginTop: 1 },
  activeCardTextBlock: { flex: 1 },
  activeCardRowLabel: { fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: '600', marginBottom: 2 },
  activeCardRowValue: { fontSize: 14, fontWeight: '700', color: '#fff' },
  activeCardDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginVertical: 10 },
  activeCardBtn: { backgroundColor: '#fff', borderRadius: 12, paddingVertical: 13, alignItems: 'center' },
  activeCardBtnText: { color: Colors.brand[600], fontWeight: '800', fontSize: 15 },

  section:         { paddingHorizontal: 16 },
  sectionHeaderRow:{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  sectionTitle:    { fontSize: 17, fontWeight: '800', color: Colors.surface[900] },
  connBadge:       { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4 },
  connDot:         { width: 7, height: 7, borderRadius: 4 },
  connText:        { fontSize: 11, fontWeight: '600' },
  waitingState:    { alignItems: 'center', paddingVertical: 32, gap: 8 },
  waitingEmoji:    { fontSize: 36 },
  waitingText:     { fontSize: 14, color: Colors.surface[400] },

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
  goOnlineBtn:  { marginTop: 16, backgroundColor: Colors.brand[500], borderRadius: 14, paddingHorizontal: 28, paddingVertical: 13 },
  goOnlineBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
});
