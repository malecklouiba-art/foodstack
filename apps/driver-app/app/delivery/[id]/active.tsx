import { useState, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, Polyline, PROVIDER_DEFAULT } from 'react-native-maps';
import { router } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { useDriverStore, DeliveryStatus } from '@/store/driver';
import { useAuthStore } from '@/store/auth';
import { useLocationTracking, DriverCoords } from '@/hooks/useLocationTracking';
import { getSocket } from '@/lib/socket';

const STEPS: { status: DeliveryStatus; label: string; emoji: string; action: string }[] = [
  { status: 'heading_to_restaurant', label: 'En route vers le restaurant', emoji: '🛵', action: 'Je suis arrivé au restaurant' },
  { status: 'picked_up',             label: 'Commande récupérée',          emoji: '📦', action: 'Commande récupérée, en route' },
  { status: 'delivering',            label: 'En livraison',                emoji: '🚀', action: 'Commande livrée !' },
  { status: 'delivered',             label: 'Livraison terminée',          emoji: '🎉', action: '' },
];

const NEXT_STATUS: Partial<Record<DeliveryStatus, DeliveryStatus>> = {
  heading_to_restaurant: 'picked_up',
  picked_up:             'delivering',
  delivering:            'delivered',
};

export default function ActiveDeliveryScreen() {
  const { activeDelivery, updateDeliveryStatus, completeDelivery } = useDriverStore();
  const driverId = useAuthStore((s) => s.driver?.id ?? '');
  const mapRef = useRef<MapView>(null);
  const [driverCoords, setDriverCoords] = useState<DriverCoords | null>(null);

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

  const emitStatusUpdate = (status: string) => {
    const socket = getSocket();
    if (!socket.connected) socket.connect();
    socket.emit('delivery:status_update', {
      orderId: activeDelivery.orderId,
      orderNumber: activeDelivery.orderNumber,
      restaurantId: activeDelivery.restaurantId,
      driverId,
      status,
    });
  };

  const handleNextStep = () => {
    if (activeDelivery.status === 'delivering') {
      Alert.alert('Confirmer la livraison', 'La commande a bien été remise au client ?', [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Oui, livrée !',
          onPress: () => {
            updateDeliveryStatus('delivered');
            emitStatusUpdate('delivered');
            setTimeout(() => {
              completeDelivery();
              router.replace('/(tabs)');
            }, 2000);
          },
        },
      ]);
    } else if (nextStatus) {
      updateDeliveryStatus(nextStatus);
      emitStatusUpdate(nextStatus);
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

  // Initial region centered between pickup and dropoff
  const midLat = (activeDelivery.restaurantLat + activeDelivery.customerLat) / 2;
  const midLng = (activeDelivery.restaurantLng + activeDelivery.customerLng) / 2;
  const latDelta = Math.abs(activeDelivery.restaurantLat - activeDelivery.customerLat) * 2.5 + 0.01;
  const lngDelta = Math.abs(activeDelivery.restaurantLng - activeDelivery.customerLng) * 2.5 + 0.01;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Map */}
      <MapView
        ref={mapRef}
        provider={PROVIDER_DEFAULT}
        style={styles.map}
        initialRegion={{ latitude: midLat, longitude: midLng, latitudeDelta: latDelta, longitudeDelta: lngDelta }}
        showsUserLocation={false}
        showsMyLocationButton={false}
      >
        {/* Restaurant marker */}
        <Marker coordinate={restaurantCoord} title={activeDelivery.restaurantName} pinColor="#ef4444" />

        {/* Customer marker */}
        <Marker coordinate={customerCoord} title="Client" pinColor={Colors.brand[500]} />

        {/* Driver position */}
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

        {/* Route line */}
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

      {/* Bottom sheet */}
      <View style={styles.sheet}>
        <View style={styles.sheetHandle} />

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.sheetContent}>
          {/* Status banner */}
          <View style={styles.statusBanner}>
            <Text style={styles.statusEmoji}>{currentStep?.emoji}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.statusLabel}>{currentStep?.label}</Text>
              <Text style={styles.orderNum}>Commande {activeDelivery.orderNumber}</Text>
            </View>
            <Text style={styles.earnings}>{activeDelivery.earnings.toFixed(2)}€</Text>
          </View>

          {/* Addresses */}
          <View style={styles.addresses}>
            <TouchableOpacity style={styles.addressCard} onPress={() => openMaps(activeDelivery.restaurantAddress)} activeOpacity={0.8}>
              <View style={[styles.addressDot, { backgroundColor: '#ef4444' }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.addressTitle}>{activeDelivery.restaurantName}</Text>
                <Text style={styles.addressText} numberOfLines={1}>{activeDelivery.restaurantAddress}</Text>
              </View>
              <Text style={styles.navIcon}>↗</Text>
            </TouchableOpacity>
            <View style={styles.routeLine} />
            <TouchableOpacity style={styles.addressCard} onPress={() => openMaps(activeDelivery.customerAddress)} activeOpacity={0.8}>
              <View style={[styles.addressDot, { backgroundColor: Colors.brand[500] }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.addressTitle}>Client</Text>
                <Text style={styles.addressText} numberOfLines={1}>{activeDelivery.customerAddress}</Text>
              </View>
              <Text style={styles.navIcon}>↗</Text>
            </TouchableOpacity>
          </View>

          {/* Items */}
          {activeDelivery.items.length > 0 && (
            <View style={styles.itemsCard}>
              <Text style={styles.itemsTitle}>Articles</Text>
              {activeDelivery.items.map((item, idx) => (
                <Text key={idx} style={styles.itemRow}>{item.qty}× {item.name}</Text>
              ))}
            </View>
          )}

          {/* Progress stepper */}
          <View style={styles.progress}>
            {STEPS.slice(0, -1).map((step, idx) => {
              const done = idx < currentStepIdx;
              const active = idx === currentStepIdx;
              return (
                <View key={step.status} style={styles.progressRow}>
                  <View style={[styles.progressDot, done && styles.progressDotDone, active && styles.progressDotActive]}>
                    {done && <Text style={styles.progressCheck}>✓</Text>}
                    {active && <View style={styles.progressInner} />}
                  </View>
                  {idx < STEPS.length - 2 && (
                    <View style={[styles.progressLine, done && styles.progressLineDone]} />
                  )}
                  <Text style={[styles.progressLabel, done && styles.progressLabelDone, active && styles.progressLabelActive]}>
                    {step.label}
                  </Text>
                </View>
              );
            })}
          </View>
        </ScrollView>

        {/* CTA */}
        {activeDelivery.status !== 'delivered' && (
          <View style={styles.footer}>
            <TouchableOpacity style={styles.ctaBtn} onPress={handleNextStep} activeOpacity={0.88}>
              <Text style={styles.ctaBtnText}>{currentStep?.action}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelBtn}
              activeOpacity={0.7}
              onPress={() =>
                Alert.alert('Signaler un problème', 'Annuler cette livraison ?', [
                  { text: 'Non', style: 'cancel' },
                  { text: 'Oui', style: 'destructive', onPress: () => { completeDelivery(); router.replace('/(tabs)'); } },
                ])
              }
            >
              <Text style={styles.cancelBtnText}>Signaler un problème</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#e5e7eb' },
  map:  { flex: 1 },

  driverMarker:     { backgroundColor: '#fff', borderRadius: 20, padding: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 4 },
  driverMarkerText: { fontSize: 22 },

  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    maxHeight: '65%',
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 16, elevation: 10,
  },
  sheetHandle:  { width: 36, height: 4, backgroundColor: Colors.surface[200], borderRadius: 2, alignSelf: 'center', marginTop: 10 },
  sheetContent: { padding: 16, paddingBottom: 8 },

  statusBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: Colors.brand[50], borderRadius: 14, padding: 12, marginBottom: 14 },
  statusEmoji:  { fontSize: 26 },
  statusLabel:  { fontSize: 14, fontWeight: '700', color: Colors.brand[700] },
  orderNum:     { fontSize: 12, color: Colors.brand[500], marginTop: 2 },
  earnings:     { fontSize: 20, fontWeight: '900', color: Colors.brand[600] },

  addresses:    { marginBottom: 12 },
  addressCard:  { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: Colors.surface[50], borderRadius: 12, padding: 12 },
  addressDot:   { width: 12, height: 12, borderRadius: 6 },
  addressTitle: { fontSize: 13, fontWeight: '700', color: Colors.surface[900], marginBottom: 1 },
  addressText:  { fontSize: 12, color: Colors.surface[500] },
  navIcon:      { fontSize: 18, color: Colors.brand[500], fontWeight: '700' },
  routeLine:    { width: 2, height: 8, backgroundColor: Colors.surface[200], marginLeft: 21 },

  itemsCard:  { backgroundColor: Colors.surface[50], borderRadius: 12, padding: 12, marginBottom: 12 },
  itemsTitle: { fontSize: 13, fontWeight: '700', color: Colors.surface[900], marginBottom: 6 },
  itemRow:    { fontSize: 13, color: Colors.surface[600], marginBottom: 3 },

  progress:          { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 4, marginBottom: 8 },
  progressRow:       { flex: 1, alignItems: 'center' },
  progressDot:       { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: Colors.surface[200], backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  progressDotDone:   { backgroundColor: Colors.brand[500], borderColor: Colors.brand[500] },
  progressDotActive: { borderColor: Colors.brand[500], borderWidth: 2.5 },
  progressInner:     { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.brand[500] },
  progressCheck:     { color: '#fff', fontSize: 11, fontWeight: '800' },
  progressLine:      { position: 'absolute', top: 10, left: '60%', right: '-60%', height: 2, backgroundColor: Colors.surface[200] },
  progressLineDone:  { backgroundColor: Colors.brand[400] },
  progressLabel:     { fontSize: 10, color: Colors.surface[400], textAlign: 'center', fontWeight: '500' },
  progressLabelDone: { color: Colors.brand[600] },
  progressLabelActive: { color: Colors.brand[600], fontWeight: '700' },

  footer:       { padding: 16, paddingBottom: 32, gap: 8 },
  ctaBtn:       { backgroundColor: Colors.brand[500], borderRadius: 16, paddingVertical: 15, alignItems: 'center', shadowColor: Colors.brand[600], shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  ctaBtnText:   { color: '#fff', fontSize: 16, fontWeight: '800' },
  cancelBtn:    { paddingVertical: 10, alignItems: 'center' },
  cancelBtnText:{ fontSize: 13, color: Colors.surface[400], fontWeight: '600' },
});
