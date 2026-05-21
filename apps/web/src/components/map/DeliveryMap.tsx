'use client';

import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet default icon issue in Next.js
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom emoji icons
const restaurantIcon = L.divIcon({
  className: 'custom-icon',
  html: '<div style="font-size:24px;line-height:1;filter:drop-shadow(0 1px 2px rgba(0,0,0,0.5))">🍽️</div>',
  iconSize: [30, 30],
  iconAnchor: [15, 30],
  popupAnchor: [0, -30],
});

const driverIcon = L.divIcon({
  className: 'custom-icon',
  html: '<div style="font-size:24px;line-height:1;filter:drop-shadow(0 1px 2px rgba(0,0,0,0.5))">🛵</div>',
  iconSize: [30, 30],
  iconAnchor: [15, 30],
  popupAnchor: [0, -30],
});

const customerIcon = L.divIcon({
  className: 'custom-icon',
  html: '<div style="font-size:24px;line-height:1;filter:drop-shadow(0 1px 2px rgba(0,0,0,0.5))">📍</div>',
  iconSize: [30, 30],
  iconAnchor: [15, 30],
  popupAnchor: [0, -30],
});

export interface DeliveryMapProps {
  restaurantPosition: [number, number];
  customerPosition: [number, number];
  driverPosition?: [number, number];
  status?: string;
}

/** Inner component: auto-fits the map bounds whenever positions change */
function FitBoundsController({
  positions,
}: {
  positions: [number, number][];
}) {
  const map = useMap();
  const prevPositions = useRef<string>('');

  useEffect(() => {
    const key = JSON.stringify(positions);
    if (key === prevPositions.current) return;
    prevPositions.current = key;

    if (positions.length === 0) return;
    const bounds = L.latLngBounds(positions.map(([lat, lng]) => L.latLng(lat, lng)));
    map.fitBounds(bounds, { padding: [48, 48], maxZoom: 15 });
  }, [map, positions]);

  return null;
}

export function DeliveryMap({
  restaurantPosition,
  customerPosition,
  driverPosition,
  status,
}: DeliveryMapProps) {
  // Build ordered list of waypoints for the route polyline
  const routePoints: [number, number][] = driverPosition
    ? [restaurantPosition, driverPosition, customerPosition]
    : [restaurantPosition, customerPosition];

  // All positions for fitBounds
  const allPositions: [number, number][] = [restaurantPosition, customerPosition];
  if (driverPosition) allPositions.push(driverPosition);

  // Default center: midpoint between restaurant and customer
  const defaultCenter: [number, number] = [
    (restaurantPosition[0] + customerPosition[0]) / 2,
    (restaurantPosition[1] + customerPosition[1]) / 2,
  ];

  return (
    <MapContainer
      center={defaultCenter}
      zoom={13}
      style={{ height: '100%', width: '100%', borderRadius: 'inherit' }}
      scrollWheelZoom={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Auto-zoom to fit all markers */}
      <FitBoundsController positions={allPositions} />

      {/* Dashed polyline route */}
      <Polyline
        positions={routePoints}
        pathOptions={{
          color: '#f97316',
          weight: 3,
          opacity: 0.7,
          dashArray: '8 6',
        }}
      />

      {/* Restaurant marker */}
      <Marker position={restaurantPosition} icon={restaurantIcon}>
        <Popup>
          <strong>Restaurant</strong>
        </Popup>
      </Marker>

      {/* Driver marker — visible when delivering */}
      {driverPosition && (
        <Marker position={driverPosition} icon={driverIcon}>
          <Popup>
            <strong>Livreur</strong>
            {status && <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{status}</div>}
          </Popup>
        </Marker>
      )}

      {/* Customer / destination marker */}
      <Marker position={customerPosition} icon={customerIcon}>
        <Popup>
          <strong>Votre adresse</strong>
        </Popup>
      </Marker>
    </MapContainer>
  );
}
