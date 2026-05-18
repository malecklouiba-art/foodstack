import { useState, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Linking, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, Polyline, PROVIDER_DEFAULT } from 'react-native-maps';
import { router } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { useDriverStore, DeliveryStatus } from '@/store/driver';
import { useAuthStore } from '@/store/auth';
import { useLocationTracking, DriverCoords } from '@/hooks/useLocationTracking';
import { useApi } from '@/hooks/useApi';
import { getSocket } from '@/lib/socket';

// ─── Step definitions ─────────────────────────────────────────────────────────

interface StepDef {
  status: DeliveryStatus;
  label: string;
  shortLabel: string;
  emoji: string;
  action: string;
  apiStatus: string;
}

const STEPS: StepDef[] = [
  {
    status: 'heading_to_restaurant',
    label: 'En route vers le restaurant',
    shortLabel: 'En route',
    emoji: '🛵',
    action: 'Je suis arrivé au restaurant',
    apiStatus: 'picked_up',
  },
  {
    status: 'picked_up',
    label: 'Récupération',
    shortLabel: 'Récupération',
    emoji: '📦',
    action: 'Commande récupérée, en route',
    apiStatus: 'delivering',
  },
  {
    status: 'delivering',
    label: 'En route vers le client',
    shortLabel: 'Livraison',
    emoji: '🚀',
    action: 'Marquer comme livré',
    apiStatus: 'delivered',
  },
  {
    status: 'delivered',
    label: 'Livré',
    shortLabel: 'Livré',
    emoji: '🎉',
    action: '',
    apiStatus: 'delivered',
  },
];

// Step labels shown at the top indicator (excluding "delivered" = final state)
const INDICATOR_STEPS: StepDef[] = STEPS.slice(0, -1);

const NEXT_STATUS: Partial<Record<DeliveryStatus, DeliveryStatus>> = {
  heading_to_restaurant: 'picked_up',
  picked_up:             'delivering',
  delivering:            'delivered',
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function ActiveDeliveryScreen() {
  const { activeDelivery, updateDeliveryStatus, completeDelivery } = useDriverStore();
  const driverId = useAuthStore((s) => s.driver?.id ?? '');
  const { patch } = useApi();
  const mapRef = useRef<MapView>(null);
  const [driverCoords, setDriverCoords] = useState<DriverCoords | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);

  const isActive = !!activeDelivery && activeDelivery.status !== 'delivered';

  const handleLocation = useCallback((coords: DriverCoords) => {
    setDriverCoords(coords);
    mapRef.current?.animateCamera(
      { center: { latitude: coords.lat, longitude: coords.lng }, zoom: 16 },
      { duration: 800 },
    );
  }, []);

  useLocationTracking({
    driverId,
    orderId: activeDelivery?.orderId ?? null,
    active: isActive,
    onLocation: handleLocation,
  });

  if (!activeDelivery) {
    router.replace('/(tabs)');
    return null;
  }

  const currentStepIdx = STEPS.findIndex((s) => s.status === activeDelivery.status);
  const currentStep = STEPS[currentStepIdx];
  const nextStatus = NEXT_STATUS[activeDelivery.status];

  const openMaps = (address: string) =>
    Linking.openURL(`https://maps.google.com/?q=${encodeURIComponent(address)}`);

  const callCustomer = () => {
    const phone = activeDelivery.customerPhone;
    if (!phone) {
      Alert.alert('Numéro indisponible', 'Le numéro du client n\'est pas disponible.');
      return;
    }
    Linking.openURL(`tel:${phone}`).catch(() =>
      Alert.alert('Erreur', 'Impossible d\'ouvrir le composeur téléphonique.')
    );
  };

  const emitStatusUpdate = (status: string) => {
    try {
      const socket = getSocket();
      if (!socket.connected) socket.connect();
      socket.emit('delivery:status_update', {
        orderId: activeDelivery.orderId,
        orderNumber: activeDelivery.orderNumber,
        restaurantId: activeDelivery.restaurantId,
        driverId,
        status,
      });
    } catch {
      // Socket failure is non-fatal — API call is the source of truth
    }
  };

  const updateStatusOnApi = async (newStatus: string) => {
    try {
      await patch(`/api/v1/deliveries/${activeDelivery.orderId}/status`, { status: newStatus });
    } catch {
      // Non-blocking — local state and socket already updated
    }
  };

  const handleNextStep = () => {
    if (activeDelivery.status === 'delivering') {
      Alert.alert('Confirmer la livraison', 'La commande a bien été remise au client ?', [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Oui, livrée !',
          onPress: async () => {
            setStatusLoading(true);
            updateDeliveryStatus('delivered');
            emitStatusUpdate('delivered');
            await updateStatusOnApi('delivered');
            setStatusLoading(false);
            setTimeout(() => {
              completeDelivery();
              router.replace('/(tabs)');
            }, 1800);
          },
        },
      ]);
    } else if (nextStatus) {
      setStatusLoading(true);
      updateDeliveryStatus(nextStatus);
      emitStatusUpdate(nextStatus);
      void updateStatusOnApi(nextStatus).finally(() => setStatusLoading(false));
    }
  };

  const restaurantCoord = {
    latitude: activeDelivery.restaurantLat,
    longitude: activeDelivery.restaurantLng,
  };
  const customerCoord = {
    latitude: activeDelivery.customerLat,
    longitude: activeDelivery.customerLng,
  };

  const midLat = (activeDelivery.restaurantLat + activeDelivery.customerLat) / 2;
  const midLng = (activeDelivery.restaurantLng + activeDelivery.customerLng) / 2;
  const latDelta = Math.abs(activeDelivery.restaurantLat - activeDelivery.customerLat) * 2.5 + 0.01;
  const lngDelta = Math.abs(activeDelivery.restaurantLng - activeDelivery.customerLng) * 2.5 + 0.01;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* ── Top step indicator ─────────────────────────────────────────────── */}
      <View style={styles.stepIndicator}>
        {INDICATOR_STEPS.map((step, idx) => {
          const isDone   = idx < currentStepIdx;
          const isActive = idx === currentStepIdx;
          return (
            <View key={step.status} style={styles.stepCell}>
              <View style={styles.stepDotRow}>
                {/* Connector line before */}
                {idx > 0 && (
                  <View style={[styles.connector, idx <= currentStepIdx && styles.connectorDone]} />
                )}
                <View
                  style={[
                    styles.stepDot,
                    isDone   && styles.stepDotDone,
                    isActive && styles.stepDotActive,
                  ]}
                >
                  {isDone   ? <Text style={styles.stepCheck}>✓</Text> : null}
                  {isActive ? <View style={styles.stepDotInner} /> : null}
                </View>
                {/* Connector line after */}
                {idx < INDICATOR_STEPS.length - 1 && (
                  <View style={[styles.connector, idx < currentStepIdx && styles.connectorDone]} />
                )}
              </View>
              <Text
                style={[
                  styles.stepLabel,
                  isDone   && styles.stepLabelDone,
                  isActive && styles.stepLabelActive,
                ]}
                numberOfLines={2}
              >
                {step.shortLabel}
              </Text>
            </View>
          );
        })}
      </View>

      {/* ── Map ────────────────────────────────────────────────────────────── */}
      <MapView
        ref={mapRef}
        provider={PROVIDER_DEFAULT}
        style={styles.map}
        initialRegion={{ latitude: midLat, longitude: midLng, latitudeDelta: latDelta, longitudeDelta: lngDelta }}
        showsUserLocation={false}
        showsMyLocationButton={false}
      >
        <Marker coordinate={restaurantCoord} title={activeDelivery.restaurantName} pinColor="#ef4444" />
        <Marker coordinate={customerCoord} title={activeDelivery.customerName ?? 'Client'} pinColor={Colors.brand[500]} />

        {driverCoords && (
          <Marker
            coordinate={{ latitude: driverCoords.lat, longitude: driverCoords.lng }}
            title="Vous"
            rotation={driverCoords.heading ?? 0}
          >
            <View style={styles.driverMarker}>
              <Text style={styles.driverMarkerText}>🛵</Text>
            </View>
          </Marker>
        )}

        <Polyline
          coordinates={[
            restaurantCoord,
            ...(driverCoords ? [{ latitude: driverCoords.lat, longitude: driverCoords.lng }] : []),
            customerCoord,
          ]}
          strokeColor={Colors.brand[500]}
          strokeWidth={3}
          lineDashPattern={[8, 4]}
        />
      </MapView>

      {/* ── Bottom sheet ───────────────────────────────────────────────────── */}
      <View style={styles.sheet}>
        <View style={styles.sheetHandle} />

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.sheetContent}>
          {/* Status + earnings banner */}
          <View style={styles.statusBanner}>
            <Text style={styles.statusEmoji}>{currentStep?.emoji}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.statusLabel}>{currentStep?.label}</Text>
              <Text style={styles.orderNum}>Commande {activeDelivery.orderNumber}</Text>
            </View>
            <View style={styles.earningsBox}>
              <Text style={styles.earningsAmount}>{activeDelivery.earnings.toFixed(2)}€</Text>
              <Text style={styles.earningsLabel}>Gains</Text>
            </View>
          </View>

          {/* Route summary card */}
          <View style={styles.routeCard}>
            <Text style={styles.routeCardTitle}>Résumé de la livraison</Text>

            {/* Restaurant row */}
            <TouchableOpacity
              style={styles.routeRow}
              onPress={() => openMaps(activeDelivery.restaurantAddress)}
              activeOpacity={0.8}
            >
              <View style={[styles.routeDot, { backgroundColor: '#ef4444' }]} />
              <View style={styles.routeInfo}>
                <Text style={styles.routeName}>{activeDelivery.restaurantName}</Text>
                <Text style={styles.routeAddr} numberOfLines={1}>{activeDelivery.restaurantAddress}</Text>
              </View>
              <Text style={styles.navIcon}>↗</Text>
            </TouchableOpacity>

            <View style={styles.routeDivider} />

            {/* Customer row */}
            <TouchableOpacity
              style={styles.routeRow}
              onPress={() => openMaps(activeDelivery.customerAddress)}
              activeOpacity={0.8}
            >
              <View style={[styles.routeDot, { backgroundColor: Colors.brand[500] }]} />
              <View style={styles.routeInfo}>
                <Text style={styles.routeName}>{activeDelivery.customerName ?? 'Client'}</Text>
                <Text style={styles.routeAddr} numberOfLines={1}>{activeDelivery.customerAddress}</Text>
              </View>
              <Text style={styles.navIcon}>↗</Text>
            </TouchableOpacity>

            {/* Estimated time + distance */}
            <View style={styles.routeMeta}>
              <View style={styles.routeMetaItem}>
                <Text style={styles.routeMetaEmoji}>⏱</Text>
                <Text style={styles.routeMetaText}>~{activeDelivery.estimatedMinutes} min</Text>
              </View>
              <View style={styles.routeMetaDivider} />
              <View style={styles.routeMetaItem}>
                <Text style={styles.routeMetaEmoji}>📍</Text>
                <Text style={styles.routeMetaText}>{activeDelivery.distanceKm} km</Text>
              </View>
            </View>
          </View>

          {/* Items */}
          {activeDelivery.items.length > 0 && (
            <View style={styles.itemsCard}>
              <Text style={styles.itemsTitle}>Articles ({activeDelivery.items.length})</Text>
              {activeDelivery.items.map((item, idx) => (
                <Text key={idx} style={styles.itemRow}>• {item.qty}× {item.name}</Text>
              ))}
            </View>
          )}
        </ScrollView>

        {/* Footer: CTA + Contact + Problem */}
        {activeDelivery.status !== 'delivered' && (
          <View style={styles.footer}>
            {/* Main action button */}
            <TouchableOpacity
              style={[styles.ctaBtn, statusLoading && styles.ctaBtnDisabled]}
              onPress={handleNextStep}
              activeOpacity={0.88}
              disabled={statusLoading}
            >
              {statusLoading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.ctaBtnText}>{currentStep?.action}</Text>
              )}
            </TouchableOpacity>

            {/* Contact + Problem row */}
            <View style={styles.secondaryRow}>
              <TouchableOpacity
                style={styles.contactBtn}
                onPress={callCustomer}
                activeOpacity={0.8}
              >
                <Text style={styles.contactBtnEmoji}>📞</Text>
                <Text style={styles.contactBtnText}>Contacter le client</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.problemBtn}
                activeOpacity={0.7}
                onPress={() =>
                  Alert.alert('Signaler un problème', 'Annuler cette livraison ?', [
                    { text: 'Non', style: 'cancel' },
                    {
                      text: 'Oui',
                      style: 'destructive',
                      onPress: () => { completeDelivery(); router.replace('/(tabs)'); },
                    },
                  ])
                }
              >
                <Text style={styles.problemBtnText}>⚠️ Problème</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#e5e7eb' },

  // ── Step indicator at the top
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surface[100],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 3,
  },
  stepCell: {
    flex: 1,
    alignItems: 'center',
  },
  stepDotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    justifyContent: 'center',
    marginBottom: 4,
  },
  connector: {
    flex: 1,
    height: 2,
    backgroundColor: Colors.surface[200],
  },
  connectorDone: {
    backgroundColor: Colors.brand[400],
  },
  stepDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Colors.surface[300],
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotDone: {
    backgroundColor: Colors.brand[500],
    borderColor: Colors.brand[500],
  },
  stepDotActive: {
    borderColor: Colors.brand[500],
    borderWidth: 2.5,
  },
  stepDotInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.brand[500],
  },
  stepCheck: { color: '#fff', fontSize: 11, fontWeight: '800' },
  stepLabel: {
    fontSize: 9,
    color: Colors.surface[400],
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: 13,
  },
  stepLabelDone:   { color: Colors.brand[500] },
  stepLabelActive: { color: Colors.brand[600], fontWeight: '700' },

  // ── Map
  map: { flex: 1 },

  driverMarker: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  driverMarkerText: { fontSize: 22 },

  // ── Bottom sheet
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '60%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 10,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    backgroundColor: Colors.surface[200],
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 10,
  },
  sheetContent: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 8 },

  // ── Status banner
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.brand[50],
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
  },
  statusEmoji: { fontSize: 26 },
  statusLabel: { fontSize: 14, fontWeight: '700', color: Colors.brand[700] },
  orderNum:    { fontSize: 12, color: Colors.brand[500], marginTop: 2 },
  earningsBox: { alignItems: 'flex-end' },
  earningsAmount: { fontSize: 20, fontWeight: '900', color: Colors.brand[600] },
  earningsLabel:  { fontSize: 10, color: Colors.brand[400], fontWeight: '600' },

  // ── Route summary card
  routeCard: {
    backgroundColor: Colors.surface[50],
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  routeCardTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.surface[400],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  routeDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  routeInfo: { flex: 1 },
  routeName: { fontSize: 13, fontWeight: '700', color: Colors.surface[900], marginBottom: 1 },
  routeAddr: { fontSize: 12, color: Colors.surface[500] },
  navIcon:   { fontSize: 18, color: Colors.brand[500], fontWeight: '700' },
  routeDivider: {
    width: 2,
    height: 10,
    backgroundColor: Colors.surface[200],
    marginLeft: 5,
    marginVertical: 3,
  },
  routeMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingVertical: 8,
    gap: 0,
  },
  routeMetaItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  routeMetaEmoji: { fontSize: 14 },
  routeMetaText:  { fontSize: 13, fontWeight: '600', color: Colors.surface[700] },
  routeMetaDivider: {
    width: 1,
    height: 20,
    backgroundColor: Colors.surface[200],
  },

  // ── Items card
  itemsCard: {
    backgroundColor: Colors.surface[50],
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  itemsTitle: { fontSize: 13, fontWeight: '700', color: Colors.surface[900], marginBottom: 6 },
  itemRow:    { fontSize: 13, color: Colors.surface[600], marginBottom: 3 },

  // ── Footer
  footer: {
    padding: 14,
    paddingBottom: 28,
    gap: 10,
  },
  ctaBtn: {
    backgroundColor: Colors.brand[500],
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: 'center',
    shadowColor: Colors.brand[600],
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  ctaBtnDisabled: {
    opacity: 0.65,
  },
  ctaBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },

  secondaryRow: {
    flexDirection: 'row',
    gap: 8,
  },
  contactBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.surface[50],
    borderRadius: 12,
    paddingVertical: 11,
    borderWidth: 1,
    borderColor: Colors.surface[200],
  },
  contactBtnEmoji: { fontSize: 16 },
  contactBtnText:  { fontSize: 13, fontWeight: '700', color: Colors.surface[700] },

  problemBtn: {
    paddingVertical: 11,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  problemBtnText: { fontSize: 13, color: Colors.surface[400], fontWeight: '600' },
});
