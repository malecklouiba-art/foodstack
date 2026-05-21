'use client';

import { MapContainer, TileLayer, Circle, Popup, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// ── Fix default Leaflet icon broken in webpack/Next.js ────────────────────────
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// ── Restaurant marker icon ────────────────────────────────────────────────────

const restaurantIcon = L.divIcon({
  className: '',
  html: `
    <div style="
      background:#1EFF6A;
      border:3px solid #00cc52;
      border-radius:50%;
      width:28px;
      height:28px;
      display:flex;
      align-items:center;
      justify-content:center;
      box-shadow:0 2px 8px rgba(0,0,0,0.35);
      font-size:14px;
    ">🍽️</div>
  `,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  popupAnchor: [0, -18],
});

// ── Zone config ───────────────────────────────────────────────────────────────

interface ZoneConfig {
  name: string;
  radiusM: number;
  color: string;
  fillOpacity: number;
  fee: string;
  deliveryTime: string;
}

const ZONES: ZoneConfig[] = [
  {
    name: 'Zone Centre',
    radiusM: 2000,
    color: '#1EFF6A',
    fillOpacity: 0.1,
    fee: 'Offert',
    deliveryTime: '15–25 min',
  },
  {
    name: 'Zone Proche',
    radiusM: 4000,
    color: '#00cc52',
    fillOpacity: 0.07,
    fee: '1,99 €',
    deliveryTime: '25–35 min',
  },
  {
    name: 'Zone Étendue',
    radiusM: 6000,
    color: '#009940',
    fillOpacity: 0.05,
    fee: '2,99 €',
    deliveryTime: '35–45 min',
  },
  {
    name: 'Zone Périphérie',
    radiusM: 8000,
    color: '#007a32',
    fillOpacity: 0.04,
    fee: '3,99 €',
    deliveryTime: '45–60 min',
  },
];

// Restaurant location: Paris 16ème
const RESTAURANT: [number, number] = [48.8654, 2.2945];

// ── Component ─────────────────────────────────────────────────────────────────

export default function ZonesMap() {
  return (
    <MapContainer
      center={RESTAURANT}
      zoom={13}
      style={{ height: '100%', width: '100%' }}
      scrollWheelZoom={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Render outermost zone first so inner zones paint on top */}
      {[...ZONES].reverse().map((zone) => (
        <Circle
          key={zone.name}
          center={RESTAURANT}
          radius={zone.radiusM}
          pathOptions={{
            color: zone.color,
            fillColor: zone.color,
            fillOpacity: zone.fillOpacity,
            weight: 1.5,
            opacity: 0.6,
          }}
        >
          <Popup>
            <div className="min-w-[150px]">
              <p className="font-bold text-sm text-gray-900 mb-1">{zone.name}</p>
              <p className="text-xs text-gray-500 mb-0.5">
                Rayon: <span className="font-semibold text-gray-700">{zone.radiusM / 1000} km</span>
              </p>
              <p className="text-xs text-gray-500 mb-0.5">
                Frais: <span className="font-semibold text-gray-700">{zone.fee}</span>
              </p>
              <p className="text-xs text-gray-500">
                Délai: <span className="font-semibold text-gray-700">{zone.deliveryTime}</span>
              </p>
            </div>
          </Popup>
        </Circle>
      ))}

      {/* Restaurant marker */}
      <Marker position={RESTAURANT} icon={restaurantIcon}>
        <Popup>
          <div className="min-w-[130px]">
            <p className="font-bold text-sm text-gray-900">Votre restaurant</p>
            <p className="text-xs text-gray-500 mt-0.5">Paris 16ème</p>
          </div>
        </Popup>
      </Marker>
    </MapContainer>
  );
}
