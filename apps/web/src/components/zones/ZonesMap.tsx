'use client';

import 'leaflet/dist/leaflet.css';
import { useEffect, useRef } from 'react';
import type { Map as LeafletMap } from 'leaflet';

interface Zone {
  id: string;
  name: string;
  radiusKm: number;
  feeEuros: number;
  deliveryTimeMin: number;
  deliveryTimeMax: number;
  active: boolean;
}

interface ZonesMapProps {
  zones: Zone[];
  center?: [number, number];
}

const ZONE_COLORS = ['#1EFF6A', '#10d45a', '#0ab84e', '#059c42'];

export default function ZonesMap({ zones, center = [48.8566, 2.3522] }: ZonesMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  // Keep stable refs so mount effect can read latest values without being re-dep'd
  const zonesRef = useRef(zones);
  const centerRef = useRef(center);
  zonesRef.current = zones;
  centerRef.current = center;

  useEffect(() => {
    if (!containerRef.current) return;

    const c = centerRef.current;
    const z = zonesRef.current;

    import('leaflet').then((L) => {
      if (mapRef.current) return; // already initialized

      // Fix default marker icon paths in Next.js
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      const map = L.map(containerRef.current!, {
        center: c,
        zoom: 12,
        zoomControl: true,
        scrollWheelZoom: true,
      });
      mapRef.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      // Draw outermost first so inner circles paint on top
      [...z].reverse().forEach((zone, revIdx) => {
        if (!zone.active) return;
        const idx = z.length - 1 - revIdx;
        const color = ZONE_COLORS[idx] ?? ZONE_COLORS[3];
        L.circle(c, {
          radius: zone.radiusKm * 1000,
          color,
          weight: 2,
          opacity: 0.9,
          fillColor: color,
          fillOpacity: 0.06 + (z.length - idx) * 0.025,
        })
          .bindPopup(
            `<strong>${zone.name}</strong><br/>` +
            `Rayon : ${zone.radiusKm} km<br/>` +
            `Frais : ${zone.feeEuros === 0 ? 'Offert' : zone.feeEuros.toFixed(2) + '€'}<br/>` +
            `Délai : ${zone.deliveryTimeMin}–${zone.deliveryTimeMax} min`
          )
          .addTo(map);
      });

      // Centre restaurant marker
      L.marker(c, {
        icon: L.divIcon({
          html: `<div style="background:#1EFF6A;width:14px;height:14px;border-radius:50%;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.5)"></div>`,
          className: '',
          iconSize: [14, 14],
          iconAnchor: [7, 7],
        }),
      })
        .bindPopup('<strong>🍽 Restaurant</strong>')
        .addTo(map);
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []); // mount once; reads latest zones/center from refs

  return <div ref={containerRef} className="h-full w-full min-h-[340px] rounded-xl" />;
}
