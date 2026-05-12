'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin,
  Plus,
  Trash2,
  Pencil,
  Check,
  X,
  CircleDot,
} from 'lucide-react';
import { APIProvider, Map, Marker, useMap } from '@vis.gl/react-google-maps';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

const MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';

// Restaurant location (Paris – used as the map center)
const RESTAURANT_LAT = 48.8698;
const RESTAURANT_LNG = 2.3309;

export interface DeliveryZone {
  id: string;
  name: string;
  radiusKm: number;
  deliveryFee: number;
  minOrder: number;
  centerLat: number;
  centerLng: number;
}

const ZONE_COLORS: Record<number, { fill: string; stroke: string }> = {
  0: { fill: '#22c55e', stroke: '#16a34a' },   // green  – zone 1
  1: { fill: '#f97316', stroke: '#ea580c' },   // orange – zone 2
  2: { fill: '#ef4444', stroke: '#dc2626' },   // red    – zone 3
};

function colorForIndex(index: number) {
  return ZONE_COLORS[index] ?? ZONE_COLORS[2];
}

const DEFAULT_ZONES: DeliveryZone[] = [
  { id: '1', name: 'Zone 1', radiusKm: 2,  deliveryFee: 2.99, minOrder: 15, centerLat: RESTAURANT_LAT, centerLng: RESTAURANT_LNG },
  { id: '2', name: 'Zone 2', radiusKm: 5,  deliveryFee: 4.99, minOrder: 20, centerLat: RESTAURANT_LAT, centerLng: RESTAURANT_LNG },
  { id: '3', name: 'Zone 3', radiusKm: 10, deliveryFee: 7.99, minOrder: 30, centerLat: RESTAURANT_LAT, centerLng: RESTAURANT_LNG },
];

// ---------------------------------------------------------------------------
// ZoneCircles – imperatively draws google.maps.Circle objects on the map
// ---------------------------------------------------------------------------
interface ZoneCirclesProps {
  zones: DeliveryZone[];
  selectedId: string | null;
}

function ZoneCircles({ zones, selectedId }: ZoneCirclesProps) {
  const map = useMap();
  const circlesRef = useRef<google.maps.Circle[]>([]);

  useEffect(() => {
    if (!map) return;

    // Remove all existing circles
    circlesRef.current.forEach((c) => c.setMap(null));
    circlesRef.current = [];

    zones.forEach((zone, index) => {
      const color = colorForIndex(index);
      const isSelected = zone.id === selectedId;

      const circle = new google.maps.Circle({
        map,
        center: { lat: zone.centerLat, lng: zone.centerLng },
        radius: zone.radiusKm * 1000,
        fillColor: color.fill,
        fillOpacity: 0.1,
        strokeColor: color.stroke,
        strokeOpacity: 0.6,
        strokeWeight: isSelected ? 3 : 1.5,
        zIndex: isSelected ? 10 : index,
      });

      circlesRef.current.push(circle);
    });

    return () => {
      circlesRef.current.forEach((c) => c.setMap(null));
      circlesRef.current = [];
    };
  }, [map, zones, selectedId]);

  return null;
}

// ---------------------------------------------------------------------------
// ZoneListItem – inline-editable row
// ---------------------------------------------------------------------------
interface ZoneListItemProps {
  zone: DeliveryZone;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onSave: (updated: DeliveryZone) => void;
}

function ZoneListItem({ zone, index, isSelected, onSelect, onDelete, onSave }: ZoneListItemProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<DeliveryZone>(zone);
  const color = colorForIndex(index);

  function handleEdit(e: React.MouseEvent) {
    e.stopPropagation();
    setDraft(zone);
    setEditing(true);
  }

  function handleCancel(e: React.MouseEvent) {
    e.stopPropagation();
    setEditing(false);
    setDraft(zone);
  }

  function handleSave(e: React.MouseEvent) {
    e.stopPropagation();
    onSave(draft);
    setEditing(false);
  }

  function handleDelete(e: React.MouseEvent) {
    e.stopPropagation();
    onDelete();
  }

  if (editing) {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-brand-500/40 bg-surface-50 dark:bg-surface-800 p-3 space-y-2 shadow-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 mb-1">
          <span
            className="h-3 w-3 rounded-full flex-shrink-0"
            style={{ background: color.fill, border: `2px solid ${color.stroke}` }}
          />
          <span className="text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wide">
            Editing
          </span>
        </div>

        <Input
          label="Name"
          value={draft.name}
          onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
        />
        <div className="grid grid-cols-3 gap-2">
          <Input
            label="Radius (km)"
            type="number"
            min={0.1}
            step={0.1}
            value={draft.radiusKm}
            onChange={(e) => setDraft((d) => ({ ...d, radiusKm: parseFloat(e.target.value) || 0 }))}
          />
          <Input
            label="Fee (€)"
            type="number"
            min={0}
            step={0.01}
            value={draft.deliveryFee}
            onChange={(e) => setDraft((d) => ({ ...d, deliveryFee: parseFloat(e.target.value) || 0 }))}
          />
          <Input
            label="Min (€)"
            type="number"
            min={0}
            step={1}
            value={draft.minOrder}
            onChange={(e) => setDraft((d) => ({ ...d, minOrder: parseFloat(e.target.value) || 0 }))}
          />
        </div>

        <div className="flex gap-2 pt-1">
          <Button size="sm" variant="primary" icon={<Check className="h-3.5 w-3.5" />} onClick={handleSave}>
            Save
          </Button>
          <Button size="sm" variant="ghost" icon={<X className="h-3.5 w-3.5" />} onClick={handleCancel}>
            Cancel
          </Button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -8 }}
      onClick={onSelect}
      className={`group cursor-pointer rounded-xl border p-3 transition-all duration-200 ${
        isSelected
          ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20 shadow-sm'
          : 'border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 hover:border-surface-300 dark:hover:border-surface-600'
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Color dot */}
        <span
          className="mt-0.5 h-3 w-3 rounded-full flex-shrink-0"
          style={{ background: color.fill, border: `2px solid ${color.stroke}` }}
        />

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-surface-900 dark:text-surface-50 truncate">{zone.name}</p>
          <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-surface-500 dark:text-surface-400">
            <span className="flex items-center gap-1">
              <CircleDot className="h-3 w-3" />
              {zone.radiusKm} km
            </span>
            <span>€{zone.deliveryFee.toFixed(2)} fee</span>
            <span>min €{zone.minOrder}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={handleEdit}
            className="rounded-lg p-1.5 text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-700 hover:text-surface-700 dark:hover:text-surface-200 transition-colors"
            title="Edit zone"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={handleDelete}
            className="rounded-lg p-1.5 text-surface-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 transition-colors"
            title="Delete zone"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// AddZoneModal – shown when user clicks the map
// ---------------------------------------------------------------------------
interface PendingZone {
  lat: number;
  lng: number;
}

interface AddZoneModalProps {
  pending: PendingZone;
  onConfirm: (zone: DeliveryZone) => void;
  onCancel: () => void;
}

function AddZoneModal({ pending, onConfirm, onCancel }: AddZoneModalProps) {
  const [name, setName] = useState('New Zone');
  const [radiusKm, setRadiusKm] = useState(3);
  const [deliveryFee, setDeliveryFee] = useState(3.99);
  const [minOrder, setMinOrder] = useState(20);

  function handleConfirm() {
    onConfirm({
      id: crypto.randomUUID(),
      name,
      radiusKm,
      deliveryFee,
      minOrder,
      centerLat: pending.lat,
      centerLng: pending.lng,
    });
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onCancel}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 8 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 8 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-2xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 p-6 shadow-xl"
      >
        <div className="flex items-center gap-3 mb-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-100 dark:bg-brand-900/30">
            <MapPin className="h-5 w-5 text-brand-600 dark:text-brand-400" />
          </div>
          <div>
            <h2 className="text-base font-bold text-surface-900 dark:text-surface-50">Add Delivery Zone</h2>
            <p className="text-xs text-surface-500 dark:text-surface-400">
              {pending.lat.toFixed(4)}, {pending.lng.toFixed(4)}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <Input
            label="Zone name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <div className="grid grid-cols-3 gap-2">
            <Input
              label="Radius (km)"
              type="number"
              min={0.1}
              step={0.1}
              value={radiusKm}
              onChange={(e) => setRadiusKm(parseFloat(e.target.value) || 1)}
            />
            <Input
              label="Fee (€)"
              type="number"
              min={0}
              step={0.01}
              value={deliveryFee}
              onChange={(e) => setDeliveryFee(parseFloat(e.target.value) || 0)}
            />
            <Input
              label="Min (€)"
              type="number"
              min={0}
              step={1}
              value={minOrder}
              onChange={(e) => setMinOrder(parseFloat(e.target.value) || 0)}
            />
          </div>
        </div>

        <div className="mt-5 flex gap-2">
          <Button fullWidth variant="primary" icon={<Plus className="h-4 w-4" />} onClick={handleConfirm}>
            Add Zone
          </Button>
          <Button fullWidth variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// MapClickHandler – sits inside APIProvider to attach map click listener
// ---------------------------------------------------------------------------
interface MapClickHandlerProps {
  onMapClick: (lat: number, lng: number) => void;
}

function MapClickHandler({ onMapClick }: MapClickHandlerProps) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    const listener = map.addListener('click', (e: google.maps.MapMouseEvent) => {
      if (e.latLng) {
        onMapClick(e.latLng.lat(), e.latLng.lng());
      }
    });

    return () => google.maps.event.removeListener(listener);
  }, [map, onMapClick]);

  return null;
}

// ---------------------------------------------------------------------------
// Placeholder – shown when no Maps API key is configured
// ---------------------------------------------------------------------------
function MapPlaceholder({ onAddZone }: { onAddZone: () => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800/50 p-8 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-100 dark:bg-surface-700">
        <MapPin className="h-7 w-7 text-surface-400 dark:text-surface-500" />
      </div>
      <div>
        <p className="font-semibold text-surface-700 dark:text-surface-300">Google Maps not configured</p>
        <p className="mt-1 text-sm text-surface-400 dark:text-surface-500">
          Set <code className="rounded bg-surface-200 dark:bg-surface-700 px-1 py-0.5 text-xs font-mono">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> to enable the map.
        </p>
      </div>
      <Button
        variant="ghost"
        size="sm"
        icon={<Plus className="h-4 w-4" />}
        onClick={onAddZone}
      >
        Add zone manually
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
export default function DeliveryZonesPage() {
  const [zones, setZones] = useState<DeliveryZone[]>(DEFAULT_ZONES);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pendingZone, setPendingZone] = useState<PendingZone | null>(null);

  const hasMapsKey = Boolean(MAPS_API_KEY && MAPS_API_KEY !== 'your-google-maps-key');

  // When map is clicked, open the add-zone modal
  function handleMapClick(lat: number, lng: number) {
    setPendingZone({ lat, lng });
  }

  // Manual "add zone" button (no-key fallback or from sidebar)
  function handleAddZoneClick() {
    setPendingZone({ lat: RESTAURANT_LAT, lng: RESTAURANT_LNG });
  }

  function handleConfirmNewZone(zone: DeliveryZone) {
    setZones((prev) => [...prev, zone]);
    setSelectedId(zone.id);
    setPendingZone(null);
  }

  function handleDeleteZone(id: string) {
    setZones((prev) => prev.filter((z) => z.id !== id));
    if (selectedId === id) setSelectedId(null);
  }

  function handleSaveZone(updated: DeliveryZone) {
    setZones((prev) => prev.map((z) => (z.id === updated.id ? updated : z)));
  }

  const restaurantPos = { lat: RESTAURANT_LAT, lng: RESTAURANT_LNG };

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden bg-surface-50 dark:bg-surface-950">
      {/* ------------------------------------------------------------------ */}
      {/* Left panel – zone list                                              */}
      {/* ------------------------------------------------------------------ */}
      <aside className="flex w-80 flex-shrink-0 flex-col border-r border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-surface-200 dark:border-surface-700 px-4 py-4">
          <div>
            <h1 className="text-base font-bold text-surface-900 dark:text-surface-50">Delivery Zones</h1>
            <p className="text-xs text-surface-500 dark:text-surface-400">
              {zones.length} zone{zones.length !== 1 ? 's' : ''} configured
            </p>
          </div>
          <Button
            size="sm"
            variant="primary"
            icon={<Plus className="h-3.5 w-3.5" />}
            onClick={handleAddZoneClick}
          >
            Add
          </Button>
        </div>

        {/* Zone list */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
          <AnimatePresence initial={false}>
            {zones.length === 0 && (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center gap-2 py-12 text-center"
              >
                <MapPin className="h-8 w-8 text-surface-300 dark:text-surface-600" />
                <p className="text-sm text-surface-400 dark:text-surface-500">
                  No zones yet.{' '}
                  {hasMapsKey ? 'Click the map or press Add.' : 'Press Add to create one.'}
                </p>
              </motion.div>
            )}

            {zones.map((zone, index) => (
              <ZoneListItem
                key={zone.id}
                zone={zone}
                index={index}
                isSelected={selectedId === zone.id}
                onSelect={() => setSelectedId((prev) => (prev === zone.id ? null : zone.id))}
                onDelete={() => handleDeleteZone(zone.id)}
                onSave={handleSaveZone}
              />
            ))}
          </AnimatePresence>
        </div>

        {/* Footer info */}
        <div className="border-t border-surface-200 dark:border-surface-700 px-4 py-3">
          <p className="text-xs text-surface-400 dark:text-surface-500">
            {hasMapsKey
              ? 'Click anywhere on the map to place a new zone.'
              : 'Configure NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to enable the map.'}
          </p>
        </div>
      </aside>

      {/* ------------------------------------------------------------------ */}
      {/* Right panel – map                                                   */}
      {/* ------------------------------------------------------------------ */}
      <main className="relative flex-1 overflow-hidden">
        {hasMapsKey ? (
          <APIProvider apiKey={MAPS_API_KEY}>
            <Map
              defaultCenter={restaurantPos}
              defaultZoom={12}
              gestureHandling="greedy"
              disableDefaultUI={false}
              mapId="foodstack-zones"
              className="w-full h-full"
            >
              {/* Restaurant marker */}
              <Marker
                position={restaurantPos}
                title="Restaurant"
                icon={{
                  url:
                    'data:image/svg+xml;charset=UTF-8,' +
                    encodeURIComponent(`
                      <svg xmlns="http://www.w3.org/2000/svg" width="38" height="38" viewBox="0 0 38 38">
                        <circle cx="19" cy="19" r="17" fill="#1e293b" stroke="white" stroke-width="2"/>
                        <text x="19" y="24" font-size="14" text-anchor="middle" fill="white">🍴</text>
                      </svg>
                    `),
                  scaledSize: { width: 38, height: 38 } as google.maps.Size,
                }}
              />

              {/* Zone circles */}
              <ZoneCircles zones={zones} selectedId={selectedId} />

              {/* Click handler */}
              <MapClickHandler onMapClick={handleMapClick} />
            </Map>

            {/* Map hint overlay */}
            <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2">
              <div className="rounded-full bg-surface-900/70 px-4 py-2 text-xs text-white backdrop-blur-sm shadow-lg">
                Click anywhere on the map to add a delivery zone
              </div>
            </div>
          </APIProvider>
        ) : (
          <div className="flex h-full items-stretch p-6">
            <MapPlaceholder onAddZone={handleAddZoneClick} />
          </div>
        )}
      </main>

      {/* ------------------------------------------------------------------ */}
      {/* Add-zone modal                                                      */}
      {/* ------------------------------------------------------------------ */}
      <AnimatePresence>
        {pendingZone && (
          <AddZoneModal
            pending={pendingZone}
            onConfirm={handleConfirmNewZone}
            onCancel={() => setPendingZone(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
