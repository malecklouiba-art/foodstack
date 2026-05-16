'use client';

import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useRef, useState } from 'react';

// ── Fix default Leaflet icon broken in webpack/Next.js ────────────────────────
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// ── Types ─────────────────────────────────────────────────────────────────────

type DriverStatus = 'online' | 'offline' | 'delivering';

export interface DriverPosition {
  id: string;
  name: string;
  phone: string;
  status: DriverStatus;
  activeOrder?: string;
  lat: number;
  lng: number;
}

interface DriversMapProps {
  drivers: DriverPosition[];
}

// ── Marker colors by status ───────────────────────────────────────────────────

const STATUS_COLORS: Record<DriverStatus, { bg: string; border: string; emoji: string }> = {
  delivering: { bg: '#22c55e', border: '#16a34a', emoji: '🚴' },
  online:     { bg: '#3b82f6', border: '#2563eb', emoji: '●' },
  offline:    { bg: '#94a3b8', border: '#64748b', emoji: '●' },
};

function createDriverIcon(status: DriverStatus): L.DivIcon {
  const cfg = STATUS_COLORS[status];
  return L.divIcon({
    className: '',
    html: `
      <div style="
        background:${cfg.bg};
        border:2px solid ${cfg.border};
        border-radius:50% 50% 50% 0;
        transform:rotate(-45deg);
        width:32px;
        height:32px;
        display:flex;
        align-items:center;
        justify-content:center;
        box-shadow:0 2px 6px rgba(0,0,0,0.3);
      ">
        <span style="transform:rotate(45deg);font-size:14px;line-height:1;">${cfg.emoji}</span>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -36],
  });
}

// ── Bounds fitter (runs once on mount) ───────────────────────────────────────

function BoundsFitter({ positions }: { positions: [number, number][] }) {
  const map = useMap();
  const fitted = useRef(false);
  useEffect(() => {
    if (!fitted.current && positions.length > 0) {
      fitted.current = true;
      map.fitBounds(positions, { padding: [40, 40] });
    }
  }, [map, positions]);
  return null;
}

// ── Main component ────────────────────────────────────────────────────────────

export default function DriversMap({ drivers }: DriversMapProps) {
  const [positions, setPositions] = useState<Record<string, { lat: number; lng: number }>>(
    () => Object.fromEntries(drivers.map((d) => [d.id, { lat: d.lat, lng: d.lng }]))
  );

  // Simulated GPS drift for active drivers
  useEffect(() => {
    const interval = setInterval(() => {
      setPositions((prev) => {
        const next = { ...prev };
        for (const driver of drivers) {
          if (driver.status === 'delivering' || driver.status === 'online') {
            const current = next[driver.id] ?? { lat: driver.lat, lng: driver.lng };
            next[driver.id] = {
              lat: current.lat + (Math.random() - 0.5) * 0.001,
              lng: current.lng + (Math.random() - 0.5) * 0.001,
            };
          }
        }
        return next;
      });
    }, 3000);
    return () => clearInterval(interval);
  }, [drivers]);

  const boundsPositions: [number, number][] = drivers.map((d) => {
    const pos = positions[d.id];
    return [pos?.lat ?? d.lat, pos?.lng ?? d.lng];
  });

  const statusLabel: Record<DriverStatus, string> = {
    delivering: 'En livraison',
    online: 'Disponible',
    offline: 'Hors ligne',
  };

  return (
    <MapContainer
      center={[48.8566, 2.3522]}
      zoom={13}
      style={{ height: '100%', width: '100%' }}
      scrollWheelZoom={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <BoundsFitter positions={boundsPositions} />
      {drivers.map((driver) => {
        const pos = positions[driver.id] ?? { lat: driver.lat, lng: driver.lng };
        return (
          <Marker
            key={driver.id}
            position={[pos.lat, pos.lng]}
            icon={createDriverIcon(driver.status)}
          >
            <Popup>
              <div className="min-w-[140px]">
                <p className="font-bold text-sm text-gray-900 mb-1">{driver.name}</p>
                <p className="text-xs text-gray-500 mb-0.5">
                  Statut: <span className="font-semibold text-gray-700">{statusLabel[driver.status]}</span>
                </p>
                {driver.activeOrder && (
                  <p className="text-xs text-gray-500 mb-0.5">
                    Commande: <span className="font-semibold text-blue-700">{driver.activeOrder}</span>
                  </p>
                )}
                <p className="text-xs text-gray-500">{driver.phone}</p>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
