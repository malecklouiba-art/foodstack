'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Edit2, Trash2, Users, QrCode,
  CheckCircle, Clock, X, Utensils, LayoutGrid,
  LayoutList, AlertCircle, Download, Move,
  Sparkles, ClipboardList, CalendarClock, Brush,
  Circle, Square as SquareIcon, Layers, Pencil,
  ChevronRight, PaintBucket, Grid3X3,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { QRCodeSVG } from 'qrcode.react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { useRestaurantId } from '@/contexts/restaurant-context';

// ── Constants ─────────────────────────────────────────────────────────────────

const GRID = 40; // snap grid size in px

function snap(v: number) {
  return Math.round(v / GRID) * GRID;
}

// ── Types ─────────────────────────────────────────────────────────────────────

type TableStatus = 'free' | 'occupied' | 'reserved' | 'cleaning';
type TableShape = 'rect' | 'circle';
type PageTab = 'floor' | 'editor' | 'list';

interface RestaurantTable {
  id: string;
  number: number;
  capacity: number;
  status: TableStatus;
  zoneId: string;
  shape: TableShape;
  x: number;
  y: number;
  currentOrderId?: string;
  reservedAt?: string;
  reservedBy?: string;
  occupiedSince?: string;
}

interface Zone {
  id: string;
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
  color: string; // hex color for zone background
}

// ── Static data ────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<TableStatus, {
  label: string;
  text: string;
  bg: string;
  ring: string;
  dot: string;
  fill: string;
  border: string;
}> = {
  free:     { label: 'Libre',     text: 'text-green-700',  bg: 'bg-green-50',  ring: 'ring-green-300',  dot: 'bg-green-500',  fill: 'bg-green-100',  border: 'border-green-400' },
  occupied: { label: 'Occupée',   text: 'text-red-700',    bg: 'bg-red-50',    ring: 'ring-red-300',    dot: 'bg-red-500',    fill: 'bg-red-100',    border: 'border-red-400' },
  reserved: { label: 'Réservée',  text: 'text-yellow-700', bg: 'bg-yellow-50', ring: 'ring-yellow-300', dot: 'bg-yellow-500', fill: 'bg-yellow-100', border: 'border-yellow-400' },
  cleaning: { label: 'Nettoyage', text: 'text-gray-700',   bg: 'bg-gray-100',  ring: 'ring-gray-300',   dot: 'bg-gray-500',   fill: 'bg-gray-200',   border: 'border-gray-400' },
};

// Zone palette for quick color picks
const ZONE_COLORS = [
  '#e0f2fe', // sky
  '#fef9c3', // yellow
  '#f0fdf4', // green
  '#fdf2f8', // pink
  '#f5f3ff', // purple
  '#fff7ed', // orange
  '#f0fdfa', // teal
  '#fefce8', // amber
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function tableSize(t: RestaurantTable): { w: number; h: number } {
  if (t.shape === 'circle') {
    const d = t.capacity <= 2 ? 72 : t.capacity <= 4 ? 88 : 104;
    return { w: d, h: d };
  }
  if (t.capacity <= 2) return { w: 80, h: 64 };
  if (t.capacity <= 4) return { w: 112, h: 80 };
  if (t.capacity <= 6) return { w: 144, h: 88 };
  return { w: 176, h: 96 };
}

// ── Add/Edit Table Modal ───────────────────────────────────────────────────────

interface TableForm {
  number: string;
  capacity: string;
  zoneId: string;
  shape: TableShape;
}

function emptyTableForm(zones: Zone[]): TableForm {
  return { number: '', capacity: '4', zoneId: zones[0]?.id ?? '', shape: 'rect' };
}

function TableModal({
  table,
  zones,
  onClose,
  onSave,
}: {
  table?: RestaurantTable;
  zones: Zone[];
  onClose: () => void;
  onSave: (data: TableForm) => void;
}) {
  const [form, setForm] = useState<TableForm>(
    table
      ? { number: String(table.number), capacity: String(table.capacity), zoneId: table.zoneId, shape: table.shape }
      : emptyTableForm(zones)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
      >
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">{table ? 'Modifier la table' : 'Ajouter une table'}</h3>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Numéro de table</label>
            <input
              type="number"
              min="1"
              value={form.number}
              onChange={(e) => setForm(f => ({ ...f, number: e.target.value }))}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              placeholder="1"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Forme</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setForm(f => ({ ...f, shape: 'rect' }))}
                className={`flex items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-medium transition-all ${
                  form.shape === 'rect'
                    ? 'border-brand-500 bg-brand-500/10 text-brand-700'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                <SquareIcon className="h-4 w-4" />
                Rectangle
              </button>
              <button
                onClick={() => setForm(f => ({ ...f, shape: 'circle' }))}
                className={`flex items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-medium transition-all ${
                  form.shape === 'circle'
                    ? 'border-brand-500 bg-brand-500/10 text-brand-700'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                <Circle className="h-4 w-4" />
                Ronde
              </button>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Capacité (couverts)</label>
            <div className="grid grid-cols-4 gap-2">
              {[2, 4, 6, 8].map(cap => (
                <button
                  key={cap}
                  onClick={() => setForm(f => ({ ...f, capacity: String(cap) }))}
                  className={`flex flex-col items-center gap-1 rounded-xl border py-2.5 text-sm font-medium transition-all ${
                    form.capacity === String(cap)
                      ? 'border-brand-500 bg-brand-500/10 text-brand-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <Users className="h-4 w-4" />
                  {cap}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Zone</label>
            <select
              value={form.zoneId}
              onChange={(e) => setForm(f => ({ ...f, zoneId: e.target.value }))}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none"
            >
              {zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
            </select>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={onClose}>Annuler</Button>
          <Button
            className="flex-1"
            onClick={() => onSave(form)}
            disabled={!form.number || !form.capacity}
          >
            {table ? 'Enregistrer' : 'Ajouter'}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Zone Modal (add/edit zone) ─────────────────────────────────────────────────

interface ZoneForm {
  name: string;
  color: string;
}

function ZoneModal({
  zone,
  onClose,
  onSave,
}: {
  zone?: Zone;
  onClose: () => void;
  onSave: (data: ZoneForm) => void;
}) {
  const [form, setForm] = useState<ZoneForm>(
    zone ? { name: zone.name, color: zone.color } : { name: '', color: ZONE_COLORS[0] }
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
      >
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">{zone ? 'Modifier la zone' : 'Ajouter une zone'}</h3>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Nom de la zone</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              placeholder="Ex: Salle principale"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Couleur de fond</label>
            <div className="flex flex-wrap gap-2">
              {ZONE_COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => setForm(f => ({ ...f, color: c }))}
                  className={`h-8 w-8 rounded-lg border-2 transition-all ${
                    form.color === c ? 'border-gray-800 scale-110' : 'border-transparent hover:border-gray-300'
                  }`}
                  style={{ backgroundColor: c }}
                  title={c}
                />
              ))}
              {/* Custom color */}
              <label className="relative flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-gray-300 hover:border-gray-400" title="Couleur personnalisée">
                <PaintBucket className="h-3.5 w-3.5 text-gray-400" />
                <input
                  type="color"
                  value={form.color}
                  onChange={(e) => setForm(f => ({ ...f, color: e.target.value }))}
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                />
              </label>
            </div>
            <div className="mt-2 flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2">
              <div className="h-5 w-5 rounded-md border border-gray-200" style={{ backgroundColor: form.color }} />
              <span className="text-sm text-gray-600">{form.color}</span>
            </div>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={onClose}>Annuler</Button>
          <Button
            className="flex-1"
            onClick={() => onSave(form)}
            disabled={!form.name.trim()}
          >
            {zone ? 'Enregistrer' : 'Ajouter'}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

// ── QR Modal ──────────────────────────────────────────────────────────────────

function QRModal({ table, zones, onClose }: { table: RestaurantTable; zones: Zone[]; onClose: () => void }) {
  const url = `${typeof window !== 'undefined' ? window.location.origin : 'https://foodstack.app'}/menu?table=${table.number}`;
  const zoneName = zones.find(z => z.id === table.zoneId)?.name ?? table.zoneId;

  function download() {
    const svg = document.getElementById(`qr-table-${table.id}`);
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([svgData], { type: 'image/svg+xml' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `table-${table.number}-qr.svg`;
    a.click();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-xs rounded-2xl bg-white p-6 shadow-xl text-center"
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">QR — Table {table.number}</h3>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100">
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="mb-4 text-xs text-gray-500">{zoneName} · {table.capacity} couverts</p>
        <div className="flex justify-center rounded-xl border border-gray-100 bg-gray-50 p-4">
          <QRCodeSVG id={`qr-table-${table.id}`} value={url} size={160} level="M" />
        </div>
        <p className="mt-3 break-all text-xs text-gray-400">{url}</p>
        <Button className="mt-4 w-full" onClick={download} icon={<Download className="h-4 w-4" />}>
          Télécharger SVG
        </Button>
      </motion.div>
    </div>
  );
}

// ── Action menu ───────────────────────────────────────────────────────────────

interface ActionMenuProps {
  table: RestaurantTable;
  zones: Zone[];
  position: { x: number; y: number };
  onClose: () => void;
  onChangeStatus: (status: TableStatus) => void;
  onAssignOrder: () => void;
  onEdit: () => void;
  onQr: () => void;
  onDelete: () => void;
}

function ActionMenu({
  table, zones, position, onClose, onChangeStatus, onAssignOrder, onEdit, onQr, onDelete,
}: ActionMenuProps) {
  const zoneName = zones.find(z => z.id === table.zoneId)?.name ?? table.zoneId;

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: -4 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="fixed z-50 w-60 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl"
        style={{ left: position.x, top: position.y }}
      >
        <div className="border-b border-gray-100 px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold text-gray-900">Table {table.number}</p>
              <p className="text-xs text-gray-500">{zoneName} · {table.capacity} couverts</p>
            </div>
            <div className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_CONFIG[table.status].bg} ${STATUS_CONFIG[table.status].text}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${STATUS_CONFIG[table.status].dot}`} />
              {STATUS_CONFIG[table.status].label}
            </div>
          </div>
        </div>

        <div className="py-1.5">
          <button onClick={onAssignOrder} className="flex w-full items-center gap-2.5 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50">
            <ClipboardList className="h-4 w-4 text-gray-500" />
            Assigner une commande
          </button>
          <button onClick={() => onChangeStatus('reserved')} className="flex w-full items-center gap-2.5 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50">
            <CalendarClock className="h-4 w-4 text-yellow-500" />
            Réserver
          </button>
          <button onClick={() => onChangeStatus('cleaning')} className="flex w-full items-center gap-2.5 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50">
            <Brush className="h-4 w-4 text-gray-500" />
            Marquer en nettoyage
          </button>
          <button onClick={() => onChangeStatus('free')} className="flex w-full items-center gap-2.5 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50">
            <CheckCircle className="h-4 w-4 text-green-500" />
            Libérer la table
          </button>
        </div>

        <div className="border-t border-gray-100 py-1.5">
          <button onClick={onQr} className="flex w-full items-center gap-2.5 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50">
            <QrCode className="h-4 w-4 text-gray-500" />
            QR Code
          </button>
          <button onClick={onEdit} className="flex w-full items-center gap-2.5 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50">
            <Edit2 className="h-4 w-4 text-gray-500" />
            Modifier
          </button>
          <button onClick={onDelete} className="flex w-full items-center gap-2.5 px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50">
            <Trash2 className="h-4 w-4" />
            Supprimer
          </button>
        </div>
      </motion.div>
    </>
  );
}

// ── Floor plan canvas (shared between floor view and editor) ──────────────────

interface FloorCanvasProps {
  tables: RestaurantTable[];
  zones: Zone[];
  editorMode?: boolean;
  selectedTableId?: string | null;
  onMove: (id: string, x: number, y: number) => void;
  onClickTable: (table: RestaurantTable, screenX: number, screenY: number) => void;
  onSelectTable?: (id: string | null) => void;
  onMoveZone?: (id: string, x: number, y: number) => void;
  onResizeZone?: (id: string, x: number, y: number, w: number, h: number) => void;
}

type ResizeHandle = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';

function FloorCanvas({
  tables,
  zones,
  editorMode = false,
  selectedTableId,
  onMove,
  onClickTable,
  onSelectTable,
  onMoveZone,
  onResizeZone,
}: FloorCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    id: string;
    offsetX: number;
    offsetY: number;
    moved: boolean;
    startX: number;
    startY: number;
  } | null>(null);

  // Zone drag/resize state
  const zoneDragRef = useRef<{
    id: string;
    kind: 'move' | ResizeHandle;
    startMouseX: number;
    startMouseY: number;
    startZoneX: number;
    startZoneY: number;
    startZoneW: number;
    startZoneH: number;
  } | null>(null);

  const handleZonePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>, zone: Zone, kind: 'move' | ResizeHandle) => {
      if (!editorMode) return;
      e.stopPropagation();
      e.currentTarget.setPointerCapture(e.pointerId);
      zoneDragRef.current = {
        id: zone.id,
        kind,
        startMouseX: e.clientX,
        startMouseY: e.clientY,
        startZoneX: zone.x,
        startZoneY: zone.y,
        startZoneW: zone.w,
        startZoneH: zone.h,
      };
    },
    [editorMode],
  );

  const handleZonePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const d = zoneDragRef.current;
      if (!d) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const dx = e.clientX - d.startMouseX;
      const dy = e.clientY - d.startMouseY;

      if (d.kind === 'move') {
        const nx = Math.max(0, snap(d.startZoneX + dx));
        const ny = Math.max(0, snap(d.startZoneY + dy));
        onMoveZone?.(d.id, nx, ny);
      } else {
        let { startZoneX: x, startZoneY: y, startZoneW: w, startZoneH: h } = d;
        const MIN = GRID * 2;
        if (d.kind.includes('e')) w = Math.max(MIN, snap(w + dx));
        if (d.kind.includes('s')) h = Math.max(MIN, snap(h + dy));
        if (d.kind.includes('w')) {
          const newW = Math.max(MIN, snap(w - dx));
          x = snap(x + (w - newW));
          w = newW;
        }
        if (d.kind.includes('n')) {
          const newH = Math.max(MIN, snap(h - dy));
          y = snap(y + (h - newH));
          h = newH;
        }
        onResizeZone?.(d.id, x, y, w, h);
      }
    },
    [onMoveZone, onResizeZone],
  );

  const handleZonePointerUp = useCallback(() => {
    zoneDragRef.current = null;
  }, []);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>, table: RestaurantTable) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      e.stopPropagation();
      const canvasRect = canvas.getBoundingClientRect();
      e.currentTarget.setPointerCapture(e.pointerId);
      dragRef.current = {
        id: table.id,
        offsetX: e.clientX - (canvasRect.left + table.x),
        offsetY: e.clientY - (canvasRect.top + table.y),
        moved: false,
        startX: e.clientX,
        startY: e.clientY,
      };
    },
    []
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const drag = dragRef.current;
      if (!drag) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const dx = Math.abs(e.clientX - drag.startX);
      const dy = Math.abs(e.clientY - drag.startY);
      if (!drag.moved && dx < 4 && dy < 4) return;
      drag.moved = true;

      const canvasRect = canvas.getBoundingClientRect();
      const rawX = e.clientX - canvasRect.left - drag.offsetX;
      const rawY = e.clientY - canvasRect.top - drag.offsetY;
      const newX = Math.max(0, editorMode ? snap(rawX) : rawX);
      const newY = Math.max(0, editorMode ? snap(rawY) : rawY);
      onMove(drag.id, newX, newY);
    },
    [onMove, editorMode]
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>, table: RestaurantTable) => {
      const drag = dragRef.current;
      if (drag && drag.id === table.id) {
        if (!drag.moved) {
          if (editorMode && onSelectTable) {
            onSelectTable(table.id === selectedTableId ? null : table.id);
          } else {
            onClickTable(table, e.clientX, e.clientY);
          }
        }
      }
      dragRef.current = null;
    },
    [onClickTable, editorMode, onSelectTable, selectedTableId]
  );

  return (
    <div className="overflow-auto rounded-2xl border border-gray-200 bg-white">
      <div
        ref={canvasRef}
        className="relative h-[520px] w-[960px] select-none"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(15,23,42,0.04) 1px, transparent 1px),' +
            'linear-gradient(to bottom, rgba(15,23,42,0.04) 1px, transparent 1px)',
          backgroundSize: `${GRID}px ${GRID}px`,
        }}
        onClick={() => editorMode && onSelectTable?.(null)}
      >
        {/* Zone backgrounds */}
        {zones.map(zone => {
          const borderColor = zone.color === '#eff6ff' ? '#93c5fd' : adjustColorBorder(zone.color);
          return (
            <div
              key={zone.id}
              className="absolute rounded-2xl border-2 border-dashed"
              style={{
                left: zone.x,
                top: zone.y,
                width: zone.w,
                height: zone.h,
                backgroundColor: zone.color,
                borderColor,
                cursor: editorMode ? 'move' : 'default',
              }}
              onPointerDown={editorMode ? (e) => handleZonePointerDown(e, zone, 'move') : undefined}
              onPointerMove={editorMode ? handleZonePointerMove : undefined}
              onPointerUp={editorMode ? handleZonePointerUp : undefined}
            >
              <span className="absolute left-3 top-2 inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-gray-600 shadow-sm select-none">
                {zone.name}
              </span>

              {/* Resize handles — only in editor mode */}
              {editorMode && (
                <>
                  {(
                    [
                      { h: 'nw', style: { top: -5, left: -5, cursor: 'nw-resize' } },
                      { h: 'n',  style: { top: -5, left: '50%', transform: 'translateX(-50%)', cursor: 'n-resize' } },
                      { h: 'ne', style: { top: -5, right: -5, cursor: 'ne-resize' } },
                      { h: 'e',  style: { top: '50%', right: -5, transform: 'translateY(-50%)', cursor: 'e-resize' } },
                      { h: 'se', style: { bottom: -5, right: -5, cursor: 'se-resize' } },
                      { h: 's',  style: { bottom: -5, left: '50%', transform: 'translateX(-50%)', cursor: 's-resize' } },
                      { h: 'sw', style: { bottom: -5, left: -5, cursor: 'sw-resize' } },
                      { h: 'w',  style: { top: '50%', left: -5, transform: 'translateY(-50%)', cursor: 'w-resize' } },
                    ] as { h: ResizeHandle; style: React.CSSProperties }[]
                  ).map(({ h, style }) => (
                    <div
                      key={h}
                      className="absolute h-3 w-3 rounded-sm bg-white shadow ring-1 ring-indigo-400"
                      style={{ ...style, zIndex: 20 }}
                      onPointerDown={(e) => { e.stopPropagation(); handleZonePointerDown(e, zone, h); }}
                      onPointerMove={handleZonePointerMove}
                      onPointerUp={handleZonePointerUp}
                    />
                  ))}
                </>
              )}
            </div>
          );
        })}

        {/* Tables */}
        {tables.map(table => {
          const cfg = STATUS_CONFIG[table.status];
          const { w, h } = tableSize(table);
          const isCircle = table.shape === 'circle';
          const isSelected = editorMode && selectedTableId === table.id;
          return (
            <div
              key={table.id}
              onPointerDown={(e) => handlePointerDown(e, table)}
              onPointerMove={handlePointerMove}
              onPointerUp={(e) => handlePointerUp(e, table)}
              className={`absolute flex cursor-grab touch-none flex-col items-center justify-center border-2 shadow-sm transition-shadow hover:shadow-md active:cursor-grabbing ${cfg.fill} ${cfg.border} ${isCircle ? 'rounded-full' : 'rounded-2xl'}`}
              style={{
                left: table.x,
                top: table.y,
                width: w,
                height: h,
                outline: isSelected ? '3px solid #6366f1' : undefined,
                outlineOffset: isSelected ? '3px' : undefined,
                zIndex: isSelected ? 10 : undefined,
              }}
              title={`Table ${table.number} — ${cfg.label}`}
            >
              {/* Status dot */}
              <span className={`absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full ring-2 ring-white ${cfg.dot}`} />
              {/* Cleaning pulse */}
              {table.status === 'cleaning' && (
                <span className="absolute inset-0 rounded-[inherit] animate-pulse ring-2 ring-yellow-400/60 pointer-events-none" />
              )}
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-extrabold text-gray-900 leading-none">{table.number}</span>
              </div>
              <div className="mt-0.5 flex items-center gap-1 text-[10px] font-medium text-gray-600">
                <Users className="h-2.5 w-2.5" />
                {table.capacity}
              </div>
              {table.status === 'occupied' && table.occupiedSince && (
                <div className="mt-0.5 text-[9px] font-medium text-red-600">{table.occupiedSince}</div>
              )}
              {table.status === 'reserved' && table.reservedAt && (
                <div className="mt-0.5 text-[9px] font-medium text-yellow-700">{table.reservedAt}</div>
              )}
            </div>
          );
        })}

        {/* Editor grid overlay hint */}
        {editorMode && (
          <div className="pointer-events-none absolute bottom-3 right-3 flex items-center gap-1.5 rounded-lg bg-white/80 px-2.5 py-1.5 text-[10px] font-medium text-gray-500 shadow-sm backdrop-blur-sm">
            <Grid3X3 className="h-3 w-3" />
            Grille 40 px · clic pour sélectionner · glisser pour déplacer
          </div>
        )}
      </div>
    </div>
  );
}

// Derive a darker border color from the zone fill hex
function adjustColorBorder(hex: string): string {
  // Simple darkening by reducing each channel by 20%
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const darken = (c: number) => Math.max(0, Math.round(c * 0.7));
  return `rgb(${darken(r)}, ${darken(g)}, ${darken(b)})`;
}

// ── Editor right panel ────────────────────────────────────────────────────────

interface EditorPanelProps {
  selectedTable: RestaurantTable | null;
  zones: Zone[];
  onUpdateTable: (id: string, patch: Partial<RestaurantTable>) => void;
  onDeleteTable: (id: string) => void;
  onDeselectTable: () => void;
  onEditZone: (zone: Zone) => void;
  onDeleteZone: (id: string) => void;
  onAddZone: () => void;
}

function EditorPanel({
  selectedTable,
  zones,
  onUpdateTable,
  onDeleteTable,
  onDeselectTable,
  onEditZone,
  onDeleteZone,
  onAddZone,
}: EditorPanelProps) {
  return (
    <div className="flex h-full flex-col gap-4">
      {/* Table properties */}
      <div className="rounded-2xl border border-gray-200 bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">Propriétés de la table</h3>
          {selectedTable && (
            <button onClick={onDeselectTable} className="rounded-md p-1 text-gray-400 hover:bg-gray-100">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {!selectedTable ? (
          <p className="text-center text-xs text-gray-400 py-4">
            Cliquez sur une table dans le plan pour la sélectionner
          </p>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2 rounded-xl bg-gray-50 px-3 py-2">
              <span className="text-sm font-bold text-gray-900">Table {selectedTable.number}</span>
              <span className={`ml-auto inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_CONFIG[selectedTable.status].bg} ${STATUS_CONFIG[selectedTable.status].text}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${STATUS_CONFIG[selectedTable.status].dot}`} />
                {STATUS_CONFIG[selectedTable.status].label}
              </span>
            </div>

            {/* Shape toggle */}
            <div>
              <p className="mb-1.5 text-xs font-medium text-gray-600">Forme</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => onUpdateTable(selectedTable.id, { shape: 'rect' })}
                  className={`flex items-center justify-center gap-1.5 rounded-xl border py-2 text-xs font-medium transition-all ${
                    selectedTable.shape === 'rect'
                      ? 'border-indigo-400 bg-indigo-50 text-indigo-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <SquareIcon className="h-3.5 w-3.5" /> Rectangle
                </button>
                <button
                  onClick={() => onUpdateTable(selectedTable.id, { shape: 'circle' })}
                  className={`flex items-center justify-center gap-1.5 rounded-xl border py-2 text-xs font-medium transition-all ${
                    selectedTable.shape === 'circle'
                      ? 'border-indigo-400 bg-indigo-50 text-indigo-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <Circle className="h-3.5 w-3.5" /> Ronde
                </button>
              </div>
            </div>

            {/* Capacity */}
            <div>
              <p className="mb-1.5 text-xs font-medium text-gray-600">Capacité</p>
              <div className="grid grid-cols-4 gap-1.5">
                {[2, 4, 6, 8].map(cap => (
                  <button
                    key={cap}
                    onClick={() => onUpdateTable(selectedTable.id, { capacity: cap })}
                    className={`flex items-center justify-center rounded-xl border py-1.5 text-xs font-semibold transition-all ${
                      selectedTable.capacity === cap
                        ? 'border-indigo-400 bg-indigo-50 text-indigo-700'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    {cap}
                  </button>
                ))}
              </div>
            </div>

            {/* Zone */}
            <div>
              <p className="mb-1.5 text-xs font-medium text-gray-600">Zone</p>
              <select
                value={selectedTable.zoneId}
                onChange={(e) => onUpdateTable(selectedTable.id, { zoneId: e.target.value })}
                className="w-full rounded-xl border border-gray-200 px-2.5 py-2 text-xs focus:border-indigo-400 focus:outline-none"
              >
                {zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
              </select>
            </div>

            {/* Position */}
            <div>
              <p className="mb-1.5 text-xs font-medium text-gray-600">Position (grille)</p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-gray-500">X</label>
                  <input
                    type="number"
                    step={GRID}
                    value={selectedTable.x}
                    onChange={(e) => onUpdateTable(selectedTable.id, { x: snap(Number(e.target.value)) })}
                    className="w-full rounded-lg border border-gray-200 px-2 py-1 text-xs focus:border-indigo-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-500">Y</label>
                  <input
                    type="number"
                    step={GRID}
                    value={selectedTable.y}
                    onChange={(e) => onUpdateTable(selectedTable.id, { y: snap(Number(e.target.value)) })}
                    className="w-full rounded-lg border border-gray-200 px-2 py-1 text-xs focus:border-indigo-400 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <button
              onClick={() => onDeleteTable(selectedTable.id)}
              className="mt-1 flex w-full items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-red-50 py-2 text-xs font-medium text-red-600 hover:bg-red-100"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Supprimer cette table
            </button>
          </div>
        )}
      </div>

      {/* Zones manager */}
      <div className="rounded-2xl border border-gray-200 bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">Zones</h3>
          <button
            onClick={onAddZone}
            className="flex items-center gap-1 rounded-lg bg-gray-900 px-2.5 py-1 text-xs font-medium text-white hover:bg-gray-700"
          >
            <Plus className="h-3 w-3" />
            Ajouter
          </button>
        </div>
        <div className="space-y-1.5">
          {zones.map(zone => (
            <div key={zone.id} className="flex items-center gap-2 rounded-xl border border-gray-100 px-3 py-2 hover:bg-gray-50">
              <div
                className="h-4 w-4 flex-shrink-0 rounded-md border border-gray-200"
                style={{ backgroundColor: zone.color }}
              />
              <span className="flex-1 truncate text-xs font-medium text-gray-700">{zone.name}</span>
              <button onClick={() => onEditZone(zone)} className="rounded p-0.5 text-gray-400 hover:text-gray-600">
                <Pencil className="h-3 w-3" />
              </button>
              <button onClick={() => onDeleteZone(zone.id)} className="rounded p-0.5 text-gray-400 hover:text-red-500">
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function TablesPage() {
  const ctxId = useRestaurantId();
  const authId = useAuthStore((s) => s.user?.restaurantIds?.[0] ?? '');
  const restaurantId = ctxId || authId;
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [tab, setTab] = useState<PageTab>('floor');

  useEffect(() => {
    if (!restaurantId) return;
    (api.get(`/tables?restaurantId=${restaurantId}`) as Promise<{ id: string; number: number; capacity: number; section?: string; status?: string }[]>)
      .then((data) => {
        if (!Array.isArray(data) || data.length === 0) return;
        const zoneMap = new Map<string, string>();
        let zIdx = 0;
        setTables(data.map((t, i) => {
          const section = t.section ?? 'Salle principale';
          if (!zoneMap.has(section)) {
            zoneMap.set(section, `z${++zIdx}`);
          }
          return {
            id: t.id,
            number: t.number,
            capacity: t.capacity,
            status: (t.status ?? 'free') as TableStatus,
            zoneId: zoneMap.get(section)!,
            shape: t.capacity <= 2 ? 'circle' : 'rect',
            x: snap(60 + (i % 6) * 130),
            y: snap(80 + Math.floor(i / 6) * 130),
          };
        }));
        // Build zones from sections
        const entries = Array.from(zoneMap.entries());
        if (entries.length > 0) {
          setZones(entries.map(([name, id], idx) => ({
            id,
            name,
            x: 40 + idx * 320,
            y: 60,
            w: 300,
            h: 380,
            color: ['#eff6ff', '#fefce8', '#faf5ff', '#fdf2f8'][idx % 4],
          })));
        }
      })
      .catch(() => {});
  }, [restaurantId]);
  const [sectionFilter, setSectionFilter] = useState<string>('Tous');
  const [statusFilter, setStatusFilter] = useState<TableStatus | 'all'>('all');

  // Modals
  const [editingTable, setEditingTable] = useState<RestaurantTable | null>(null);
  const [showTableModal, setShowTableModal] = useState(false);
  const [editingZone, setEditingZone] = useState<Zone | null>(null);
  const [showZoneModal, setShowZoneModal] = useState(false);
  const [qrTable, setQrTable] = useState<RestaurantTable | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [actionMenu, setActionMenu] = useState<{ table: RestaurantTable; x: number; y: number } | null>(null);
  const [assignOrderFor, setAssignOrderFor] = useState<RestaurantTable | null>(null);
  const [toasts, setToasts] = useState<{ id: number; message: string }[]>([]);

  // Editor
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);

  const zoneNames = ['Tous', ...zones.map(z => z.name)];
  const selectedTable = tables.find(t => t.id === selectedTableId) ?? null;

  const filtered = tables.filter(t => {
    const zoneName = zones.find(z => z.id === t.zoneId)?.name ?? '';
    if (sectionFilter !== 'Tous' && zoneName !== sectionFilter) return false;
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;
    return true;
  });

  const stats = {
    total: tables.length,
    free: tables.filter(t => t.status === 'free').length,
    occupied: tables.filter(t => t.status === 'occupied').length,
    reserved: tables.filter(t => t.status === 'reserved').length,
    cleaning: tables.filter(t => t.status === 'cleaning').length,
    covers: tables.filter(t => t.status === 'occupied').reduce((s, t) => s + t.capacity, 0),
  };

  // ── Table CRUD ───────────────────────────────────────────────────────────────

  function openAdd() {
    setEditingTable(null);
    setShowTableModal(true);
  }

  function openEdit(table: RestaurantTable) {
    setEditingTable(table);
    setShowTableModal(true);
  }

  function handleSaveTable(form: { number: string; capacity: string; zoneId: string; shape: TableShape }) {
    if (editingTable) {
      const patch = { number: Number(form.number), capacity: Number(form.capacity), zoneId: form.zoneId, shape: form.shape };
      setTables(prev => prev.map(t => t.id === editingTable.id ? { ...t, ...patch } : t));
      (api.patch(`/tables/${editingTable.id}`, patch) as Promise<unknown>).catch(() => {});
    } else {
      const tempId = `t${Date.now()}`;
      const zone = zones.find(z => z.id === form.zoneId);
      const newTable = {
        id: tempId,
        number: Number(form.number),
        capacity: Number(form.capacity),
        zoneId: form.zoneId,
        shape: form.shape as TableShape,
        status: 'free' as TableStatus,
        x: snap(60 + (tables.length % 6) * 130),
        y: snap(80 + Math.floor(tables.length / 6) * 130),
      };
      setTables(prev => [...prev, newTable]);
      if (restaurantId) {
        (api.post('/tables', {
          restaurantId,
          number: Number(form.number),
          capacity: Number(form.capacity),
          section: zone?.name ?? 'Salle principale',
        }) as Promise<{ id: string }>)
          .then((created) => setTables(prev => prev.map(t => t.id === tempId ? { ...t, id: created.id } : t)))
          .catch(() => {});
      }
    }
    setShowTableModal(false);
  }

  function updateTable(id: string, patch: Partial<RestaurantTable>) {
    setTables(prev => prev.map(t => t.id === id ? { ...t, ...patch } : t));
    if (patch.status) {
      (api.patch(`/tables/${id}/status`, { status: patch.status }) as Promise<unknown>).catch(() => {});
    }
  }

  function moveTable(id: string, x: number, y: number) {
    setTables(prev => prev.map(t => t.id === id ? { ...t, x, y } : t));
  }

  function moveZone(id: string, x: number, y: number) {
    setZones(prev => prev.map(z => z.id === id ? { ...z, x, y } : z));
  }

  function resizeZone(id: string, x: number, y: number, w: number, h: number) {
    setZones(prev => prev.map(z => z.id === id ? { ...z, x, y, w, h } : z));
  }

  function deleteTable(id: string) {
    setTables(prev => prev.filter(t => t.id !== id));
    if (selectedTableId === id) setSelectedTableId(null);
    setDeleteId(null);
    (api.delete(`/tables/${id}`) as Promise<unknown>).catch(() => {});
  }

  function changeStatus(id: string, status: TableStatus) {
    setTables(prev => prev.map(t => {
      if (t.id !== id) return t;
      if (status === 'free' && (t.status === 'occupied' || t.status === 'reserved')) {
        addToast(`🧹 Table ${t.number} — nettoyage requis avant de l'attribuer`);
        return { ...t, status: 'cleaning', currentOrderId: undefined, occupiedSince: undefined, reservedAt: undefined, reservedBy: undefined };
      }
      if (status === 'free') {
        return { ...t, status, currentOrderId: undefined, occupiedSince: undefined, reservedAt: undefined, reservedBy: undefined };
      }
      return { ...t, status };
    }));
  }

  // ── Zone CRUD ────────────────────────────────────────────────────────────────

  function openAddZone() {
    setEditingZone(null);
    setShowZoneModal(true);
  }

  function openEditZone(zone: Zone) {
    setEditingZone(zone);
    setShowZoneModal(true);
  }

  function handleSaveZone(form: ZoneForm) {
    if (editingZone) {
      setZones(prev => prev.map(z => z.id === editingZone.id ? { ...z, ...form } : z));
    } else {
      const id = `z${Date.now()}`;
      // Place new zone at a free area
      const offsetIdx = zones.length;
      setZones(prev => [...prev, {
        id,
        name: form.name,
        color: form.color,
        x: 40 + (offsetIdx % 3) * 340,
        y: 460,
        w: 280,
        h: 120,
      }]);
    }
    setShowZoneModal(false);
  }

  function deleteZone(id: string) {
    setZones(prev => prev.filter(z => z.id !== id));
    // Reassign tables from that zone to first remaining zone
    const fallbackId = zones.find(z => z.id !== id)?.id ?? '';
    setTables(prev => prev.map(t => t.zoneId === id ? { ...t, zoneId: fallbackId } : t));
  }

  // ── Misc ─────────────────────────────────────────────────────────────────────

  function addToast(message: string) {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000);
  }

  function handleAssignOrder(table: RestaurantTable) {
    const ord = `ORD-${Math.floor(8800 + Math.random() * 200)}`;
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    setTables(prev => prev.map(t => t.id === table.id
      ? { ...t, status: 'occupied', currentOrderId: ord, occupiedSince: `${hh}:${mm}` }
      : t));
    setAssignOrderFor(null);
  }

  function openActionMenu(table: RestaurantTable, screenX: number, screenY: number) {
    const x = Math.min(screenX, window.innerWidth - 256);
    const y = Math.min(screenY, window.innerHeight - 360);
    setActionMenu({ table, x, y });
  }

  return (
    <div className="space-y-6 bg-white p-6">
      {/* Toast notifications */}
      <div className="fixed bottom-4 right-4 z-[60] flex flex-col gap-2">
        <AnimatePresence>
          {toasts.map(toast => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 16, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.95 }}
              className="flex items-center gap-3 rounded-2xl border border-yellow-200 bg-yellow-50 px-4 py-3 shadow-lg"
            >
              <span className="text-sm font-medium text-yellow-900">{toast.message}</span>
              <button onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))} className="ml-1 text-yellow-500 hover:text-yellow-700">
                <X className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* IA nettoyage banner */}
      {stats.cleaning > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 rounded-2xl border border-yellow-200 bg-yellow-50 px-4 py-3"
        >
          <span className="text-xl">🤖</span>
          <p className="flex-1 text-sm font-medium text-yellow-900">
            IA Suggestion&nbsp;: <span className="font-bold">{stats.cleaning} table{stats.cleaning > 1 ? 's' : ''}</span> nécessite{stats.cleaning > 1 ? 'nt' : ''} nettoyage
          </p>
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-yellow-400 text-xs font-bold text-white">
            {stats.cleaning}
          </span>
        </motion.div>
      )}

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Plan de salle</h1>
          <p className="mt-1 text-sm text-gray-500">
            {tables.length} tables · {stats.occupied} occupées · {stats.free} libres · {stats.reserved} réservées
          </p>
        </div>
        <div className="flex items-center gap-2">
          {tab !== 'editor' && (
            <div className="hidden items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-500 sm:flex">
              <Move className="h-3.5 w-3.5" />
              Glissez pour déplacer · cliquez pour les actions
            </div>
          )}
          <Button onClick={openAdd} icon={<Plus className="h-4 w-4" />}>
            Ajouter une table
          </Button>
        </div>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Tables libres',   value: stats.free,     icon: CheckCircle, color: 'text-green-600',  bg: 'bg-green-50' },
          { label: 'Occupées',         value: stats.occupied, icon: Utensils,    color: 'text-red-600',    bg: 'bg-red-50' },
          { label: 'Réservées',        value: stats.reserved, icon: Clock,       color: 'text-yellow-600', bg: 'bg-yellow-50' },
          { label: 'Couverts servis',  value: stats.covers,   icon: Users,       color: 'text-purple-600', bg: 'bg-purple-50' },
        ].map(s => {
          const Icon = s.icon;
          return (
            <Card key={s.label} padding="md" className="flex items-center gap-3">
              <div className={`rounded-xl p-2.5 ${s.bg}`}>
                <Icon className={`h-5 w-5 ${s.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                <p className="text-xs text-gray-500">{s.label}</p>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Tab bar */}
      <div className="flex items-center gap-1 rounded-xl border border-gray-200 bg-white p-1 w-fit">
        <button
          onClick={() => setTab('floor')}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${tab === 'floor' ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
        >
          <LayoutGrid className="h-4 w-4" />
          Plan de salle
        </button>
        <button
          onClick={() => setTab('editor')}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${tab === 'editor' ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
        >
          <Layers className="h-4 w-4" />
          Éditeur de plan
        </button>
        <button
          onClick={() => setTab('list')}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${tab === 'list' ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
        >
          <LayoutList className="h-4 w-4" />
          Liste
        </button>
      </div>

      {/* ── FLOOR VIEW ─────────────────────────────────────────────────────────── */}
      {tab === 'floor' && (
        <div className="space-y-3">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex gap-1 rounded-xl border border-gray-200 bg-white p-1">
              {zoneNames.map(s => (
                <button
                  key={s}
                  onClick={() => setSectionFilter(s)}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
                    sectionFilter === s ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
            <div className="flex gap-1 rounded-xl border border-gray-200 bg-white p-1">
              <button
                onClick={() => setStatusFilter('all')}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${statusFilter === 'all' ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                Toutes
              </button>
              {(Object.keys(STATUS_CONFIG) as TableStatus[]).map(s => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${statusFilter === s ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${STATUS_CONFIG[s].dot}`} />
                  {STATUS_CONFIG[s].label}
                </button>
              ))}
            </div>
          </div>

          <FloorCanvas
            tables={filtered}
            zones={zones}
            editorMode={false}
            onMove={moveTable}
            onClickTable={openActionMenu}
          />

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-4 rounded-xl border border-gray-100 bg-gray-50 px-4 py-2.5 text-xs">
            <div className="flex items-center gap-2 font-medium text-gray-700">
              <Sparkles className="h-3.5 w-3.5 text-brand-500" />
              Légende
            </div>
            {(Object.keys(STATUS_CONFIG) as TableStatus[]).map(s => (
              <div key={s} className="flex items-center gap-1.5 text-gray-600">
                <span className={`h-2 w-2 rounded-full ${STATUS_CONFIG[s].dot}`} />
                {STATUS_CONFIG[s].label}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── EDITOR TAB ──────────────────────────────────────────────────────────── */}
      {tab === 'editor' && (
        <div className="space-y-3">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Outils</span>
            <div className="h-4 w-px bg-gray-200" />
            <button
              onClick={openAdd}
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:border-gray-300 hover:bg-gray-50 active:bg-gray-100"
            >
              <Plus className="h-3.5 w-3.5" />
              Table
            </button>
            <button
              onClick={openAddZone}
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:border-gray-300 hover:bg-gray-50 active:bg-gray-100"
            >
              <Layers className="h-3.5 w-3.5" />
              Zone
            </button>
            {selectedTableId && (
              <>
                <div className="h-4 w-px bg-gray-200" />
                <button
                  onClick={() => setDeleteId(selectedTableId)}
                  className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Supprimer table
                </button>
              </>
            )}
            <div className="ml-auto flex items-center gap-1.5 text-xs text-gray-400">
              <Grid3X3 className="h-3.5 w-3.5" />
              Grille 40 px
            </div>
          </div>

          {/* Canvas + Panel */}
          <div className="flex gap-4 items-start">
            <div className="flex-1 min-w-0">
              <FloorCanvas
                tables={tables}
                zones={zones}
                editorMode={true}
                selectedTableId={selectedTableId}
                onMove={moveTable}
                onClickTable={() => {/* editor mode handles selection instead */}}
                onSelectTable={setSelectedTableId}
                onMoveZone={moveZone}
                onResizeZone={resizeZone}
              />
            </div>

            {/* Right panel */}
            <div className="w-64 flex-shrink-0">
              <EditorPanel
                selectedTable={selectedTable}
                zones={zones}
                onUpdateTable={updateTable}
                onDeleteTable={(id) => setDeleteId(id)}
                onDeselectTable={() => setSelectedTableId(null)}
                onEditZone={openEditZone}
                onDeleteZone={deleteZone}
                onAddZone={openAddZone}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── LIST VIEW ──────────────────────────────────────────────────────────── */}
      {tab === 'list' && (
        <div className="space-y-3">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex gap-1 rounded-xl border border-gray-200 bg-white p-1">
              {zoneNames.map(s => (
                <button
                  key={s}
                  onClick={() => setSectionFilter(s)}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
                    sectionFilter === s ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
            <div className="flex gap-1 rounded-xl border border-gray-200 bg-white p-1">
              <button
                onClick={() => setStatusFilter('all')}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${statusFilter === 'all' ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                Toutes
              </button>
              {(Object.keys(STATUS_CONFIG) as TableStatus[]).map(s => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${statusFilter === s ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${STATUS_CONFIG[s].dot}`} />
                  {STATUS_CONFIG[s].label}
                </button>
              ))}
            </div>
          </div>

          <Card padding="none">
            <div className="divide-y divide-gray-100">
              {filtered.map(table => {
                const cfg = STATUS_CONFIG[table.status];
                const zoneName = zones.find(z => z.id === table.zoneId)?.name ?? table.zoneId;
                return (
                  <div key={table.id} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gray-100 font-bold text-gray-900">
                      {table.number}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">Table {table.number}</span>
                        <span className="text-gray-400">·</span>
                        <span className="text-sm text-gray-500">{zoneName}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Users className="h-3.5 w-3.5" />
                        {table.capacity} couverts
                        {table.status === 'occupied' && table.currentOrderId && (
                          <span className="text-red-600">· {table.currentOrderId}</span>
                        )}
                        {table.status === 'reserved' && (
                          <span className="text-yellow-700">· {table.reservedAt} — {table.reservedBy}</span>
                        )}
                      </div>
                    </div>
                    <div className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${cfg.bg} ${cfg.text}`}>
                      <div className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
                      {cfg.label}
                    </div>
                    <div className="flex items-center gap-1">
                      {table.status === 'cleaning' && (
                        <button
                          onClick={() => changeStatus(table.id, 'free')}
                          className="flex items-center gap-1 rounded-lg bg-green-50 px-2 py-1 text-xs font-medium text-green-700 hover:bg-green-100"
                        >
                          <CheckCircle className="h-3.5 w-3.5" />
                          Libérer
                        </button>
                      )}
                      <button
                        onClick={(e) => openActionMenu(table, e.clientX, e.clientY)}
                        className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                        title="Actions"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                      <button onClick={() => setQrTable(table)} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600" title="QR Code">
                        <QrCode className="h-4 w-4" />
                      </button>
                      <button onClick={() => openEdit(table)} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600" title="Modifier">
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button onClick={() => setDeleteId(table.id)} className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500" title="Supprimer">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      )}

      {/* ── Action menu ──────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {actionMenu && (
          <ActionMenu
            table={actionMenu.table}
            zones={zones}
            position={{ x: actionMenu.x, y: actionMenu.y }}
            onClose={() => setActionMenu(null)}
            onChangeStatus={(s) => { changeStatus(actionMenu.table.id, s); setActionMenu(null); }}
            onAssignOrder={() => { setAssignOrderFor(actionMenu.table); setActionMenu(null); }}
            onEdit={() => { openEdit(actionMenu.table); setActionMenu(null); }}
            onQr={() => { setQrTable(actionMenu.table); setActionMenu(null); }}
            onDelete={() => { setDeleteId(actionMenu.table.id); setActionMenu(null); }}
          />
        )}
      </AnimatePresence>

      {/* ── Modals ───────────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showTableModal && (
          <TableModal
            table={editingTable || undefined}
            zones={zones}
            onClose={() => setShowTableModal(false)}
            onSave={handleSaveTable}
          />
        )}

        {showZoneModal && (
          <ZoneModal
            zone={editingZone || undefined}
            onClose={() => setShowZoneModal(false)}
            onSave={handleSaveZone}
          />
        )}

        {qrTable && <QRModal table={qrTable} zones={zones} onClose={() => setQrTable(null)} />}

        {assignOrderFor && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
            >
              <div className="mb-4 flex items-start gap-3">
                <div className="rounded-xl bg-brand-500/10 p-2.5">
                  <ClipboardList className="h-5 w-5 text-brand-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Assigner une commande</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Démarrer une nouvelle commande sur la table {assignOrderFor.number} ?
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <Button variant="secondary" className="flex-1" onClick={() => setAssignOrderFor(null)}>Annuler</Button>
                <Button className="flex-1" onClick={() => handleAssignOrder(assignOrderFor)}>Confirmer</Button>
              </div>
            </motion.div>
          </div>
        )}

        {deleteId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
            >
              <div className="mb-4 flex items-start gap-3">
                <div className="rounded-xl bg-red-50 p-2.5">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Supprimer cette table ?</h3>
                  <p className="mt-1 text-sm text-gray-500">Cette action est irréversible.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Button variant="secondary" className="flex-1" onClick={() => setDeleteId(null)}>Annuler</Button>
                <Button variant="danger" className="flex-1" onClick={() => deleteTable(deleteId)}>Supprimer</Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
