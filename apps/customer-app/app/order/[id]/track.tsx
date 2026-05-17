import { useRef, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, Circle, PROVIDER_DEFAULT } from 'react-native-maps';
import { useLocalSearchParams, router } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { useTrackOrder } from '@/hooks/useTrackOrder';
import { useApi } from '@/hooks/useApi';

type StepStatus = 'done' | 'active' | 'pending';

const STEPS = [
  { key: 'confirmed',  label: 'Commande confirmée',    emoji: '✅' },
  { key: 'preparing',  label: 'En préparation',        emoji: '👨‍🍳' },
  { key: 'ready',      label: 'Prête pour livraison',  emoji: '🔔' },
  { key: 'delivering', label: 'En cours de livraison', emoji: '🛵' },
  { key: 'delivered',  label: 'Livrée !',              emoji: '🎉' },
];

const STATUS_LABEL: Partial<Record<string, string>> = {
  confirmed:  'Commande confirmée',
  preparing:  'En préparation',
  ready:      'Recherche d\'un livreur…',
  delivering: 'En route vers vous',
  delivered:  'Livrée ! Bon appétit 🎉',
};

function stepStatus(stepKey: string, currentStep: string): StepStatus {
  const stepIdx    = STEPS.findIndex((s) => s.key === stepKey);
  const currentIdx = STEPS.findIndex((s) => s.key === currentStep);
  if (stepIdx < currentIdx) return 'done';
  if (stepIdx === currentIdx) return 'active';
  return 'pending';
}

interface Coordinates {
  latitude: number;
  longitude: number;
}

interface OrderDetail {
  status?: string;
  deliveryAddress?: {
    lat?: number;
    lng?: number;
    latitude?: number;
    longitude?: number;
    address?: string;
  };
  // Some APIs embed coords directly
  lat?: number;
  lng?: number;
}

// Fallback destination if order data doesn't have coords
const FALLBACK_DEST: Coordinates = { latitude: 48.8566, longitude: 2.3522 };

export default function TrackOrderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const api = useApi();
  const { status, driverLocation, connected } = useTrackOrder(id ?? null);
  const mapRef = useRef<MapView>(null);

  const [dest, setDest] = useState<Coordinates | null>(null);
  const [orderStatus, setOrderStatus] = useState<string | null>(null);
  const [loadingOrder, setLoadingOrder] = useState(true);

  useEffect(() => {
    if (!id) return;

    let cancelled = false;
    api.get<OrderDetail>(`/api/v1/orders/${id}`)
      .then((order) => {
        if (cancelled) return;
        // Extract delivery coordinates
        const da = order.deliveryAddress;
        const lat = da?.lat ?? da?.latitude ?? order.lat;
        const lng = da?.lng ?? da?.longitude ?? order.lng;
        if (lat != null && lng != null) {
          setDest({ latitude: lat, longitude: lng });
        } else {
          setDest(FALLBACK_DEST);
        }
        if (order.status) setOrderStatus(order.status);
      })
      .catch(() => {
        if (!cancelled) setDest(FALLBACK_DEST);
      })
      .finally(() => {
        if (!cancelled) setLoadingOrder(false);
      });

    return () => { cancelled = true; };
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Prefer real-time status from socket, fall back to REST response
  const currentStep = status ?? orderStatus ?? 'delivering';
  const currentStepData = STEPS.find((s) => s.key === currentStep) ?? STEPS[3];

  const driverCoord = driverLocation
    ? { latitude: driverLocation.lat, longitude: driverLocation.lng }
    : null;

  const handleMapReady = () => {
    if (driverCoord) {
      mapRef.current?.animateCamera({ center: driverCoord, zoom: 15 }, { duration: 600 });
    } else if (dest) {
      mapRef.current?.animateCamera({ center: dest, zoom: 15 }, { duration: 600 });
    }
  };

  const initialRegion = driverCoord
    ? { latitude: driverCoord.latitude, longitude: driverCoord.longitude, latitudeDelta: 0.02, longitudeDelta: 0.02 }
    : dest
    ? { latitude: dest.latitude, longitude: dest.longitude, latitudeDelta: 0.02, longitudeDelta: 0.02 }
    : { latitude: FALLBACK_DEST.latitude, longitude: FALLBACK_DEST.longitude, latitudeDelta: 0.02, longitudeDelta: 0.02 };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={styles.closeBtn}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Suivi de commande</Text>
        <View style={styles.headerRight}>
          <View style={[styles.connDot, { backgroundColor: connected ? '#22c55e' : Colors.surface[300] }]} />
          <Text style={styles.orderNum}>#{id}</Text>
        </View>
      </View>

      {/* Map */}
      {loadingOrder ? (
        <View style={[styles.map, styles.mapLoading]}>
          <ActivityIndicator size="large" color={Colors.brand[500]} />
        </View>
      ) : (
        <MapView
          ref={mapRef}
          provider={PROVIDER_DEFAULT}
          style={styles.map}
          initialRegion={initialRegion}
          onMapReady={handleMapReady}
          showsUserLocation={false}
          showsMyLocationButton={false}
        >
          {/* Destination (customer) */}
          {dest && (
            <>
              <Marker coordinate={dest} title="Votre adresse" pinColor={Colors.brand[500]} />
              <Circle
                center={dest}
                radius={60}
                fillColor={Colors.brand[500] + '20'}
                strokeColor={Colors.brand[500] + '60'}
                strokeWidth={1}
              />
            </>
          )}

          {/* Driver */}
          {driverCoord && (
            <Marker
              coordinate={driverCoord}
              title="Votre livreur"
              rotation={driverLocation?.heading ?? 0}
              anchor={{ x: 0.5, y: 0.5 }}
            >
              <View style={styles.driverMarker}>
                <Text style={styles.driverMarkerText}>🛵</Text>
              </View>
            </Marker>
          )}
        </MapView>
      )}

      {/* Bottom sheet */}
      <View style={styles.sheet}>
        <View style={styles.sheetHandle} />

        {/* Status card */}
        <View style={styles.statusCard}>
          <Text style={styles.statusEmoji}>{currentStepData.emoji}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.statusText}>{STATUS_LABEL[currentStep] ?? currentStep}</Text>
            {currentStep === 'delivering' && driverLocation && driverCoord && (
              <Text style={styles.statusSub}>
                📍 {(driverLocation.lat ?? driverLocation.latitude).toFixed(4)}, {(driverLocation.lng ?? driverLocation.longitude).toFixed(4)}
              </Text>
            )}
          </View>
        </View>

        {/* Timeline */}
        <ScrollView horizontal={false} showsVerticalScrollIndicator={false} style={styles.timeline}>
          {STEPS.map((step, idx) => {
            const s = stepStatus(step.key, currentStep);
            return (
              <View key={step.key} style={styles.timelineRow}>
                <View style={styles.timelineLeft}>
                  <View style={[styles.dot, s === 'done' && styles.dotDone, s === 'active' && styles.dotActive]}>
                    {s === 'active' && <View style={styles.dotInner} />}
                    {s === 'done'   && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                  {idx < STEPS.length - 1 && (
                    <View style={[styles.line, s === 'done' && styles.lineDone]} />
                  )}
                </View>
                <View style={[styles.stepContent, idx < STEPS.length - 1 && { marginBottom: 18 }]}>
                  <Text style={styles.stepEmoji}>{step.emoji}</Text>
                  <Text style={[styles.stepLabel, s === 'active' && styles.stepLabelActive, s === 'pending' && styles.stepLabelPending]}>
                    {step.label}
                  </Text>
                </View>
              </View>
            );
          })}
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.contactBtn} activeOpacity={0.85}>
            <Text style={styles.contactBtnText}>📞 Contacter le livreur</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.surface[50] },

  header:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: Colors.surface[100] },
  closeBtn:    { fontSize: 18, color: Colors.surface[400], fontWeight: '600', padding: 4, marginRight: 8 },
  headerTitle: { flex: 1, fontSize: 17, fontWeight: '800', color: Colors.surface[900] },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  connDot:     { width: 8, height: 8, borderRadius: 4 },
  orderNum:    { fontSize: 13, color: Colors.surface[400], fontWeight: '600' },

  map:        { height: 260 },
  mapLoading: { alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.surface[100] },

  driverMarker:     { backgroundColor: '#fff', borderRadius: 20, padding: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 5 },
  driverMarkerText: { fontSize: 22 },

  sheet: { flex: 1, backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, marginTop: -16, shadowColor: '#000', shadowOffset: { width: 0, height: -3 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 8 },
  sheetHandle: { width: 36, height: 4, backgroundColor: Colors.surface[200], borderRadius: 2, alignSelf: 'center', marginTop: 10, marginBottom: 12 },

  statusCard:  { flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 16, backgroundColor: Colors.brand[500], borderRadius: 14, padding: 14, marginBottom: 16 },
  statusEmoji: { fontSize: 26 },
  statusText:  { color: '#fff', fontSize: 15, fontWeight: '700' },
  statusSub:   { color: 'rgba(255,255,255,0.75)', fontSize: 11, marginTop: 3 },

  timeline:     { paddingHorizontal: 20, flex: 1 },
  timelineRow:  { flexDirection: 'row' },
  timelineLeft: { alignItems: 'center', width: 28, marginRight: 12 },

  dot:       { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: Colors.surface[200], backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  dotDone:   { backgroundColor: Colors.brand[500], borderColor: Colors.brand[500] },
  dotActive: { borderColor: Colors.brand[500], borderWidth: 2.5 },
  dotInner:  { width: 9, height: 9, borderRadius: 5, backgroundColor: Colors.brand[500] },
  checkmark: { color: '#fff', fontSize: 11, fontWeight: '800' },
  line:      { width: 2, flex: 1, backgroundColor: Colors.surface[100], marginVertical: 2 },
  lineDone:  { backgroundColor: Colors.brand[300] },

  stepContent:      { flexDirection: 'row', alignItems: 'center', gap: 8, paddingBottom: 4 },
  stepEmoji:        { fontSize: 16, width: 22, textAlign: 'center' },
  stepLabel:        { fontSize: 14, fontWeight: '600', color: Colors.surface[900] },
  stepLabelActive:  { color: Colors.brand[600] },
  stepLabelPending: { color: Colors.surface[400], fontWeight: '500' },

  footer:         { padding: 16, paddingBottom: 28 },
  contactBtn:     { backgroundColor: Colors.surface[100], borderRadius: 14, paddingVertical: 13, alignItems: 'center' },
  contactBtnText: { fontSize: 14, fontWeight: '700', color: Colors.surface[700] },
});
