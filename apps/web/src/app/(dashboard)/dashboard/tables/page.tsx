'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Edit2, Trash2, Users, QrCode,
  CheckCircle, Clock, X, Utensils, LayoutGrid,
  LayoutList, AlertCircle, Download, Move,
  Sparkles, ClipboardList, CalendarClock, Brush,
  Circle, Square as SquareIcon,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { QRCodeSVG } from 'qrcode.react';

// ── Types ─────────────────────────────────────────────────────────────────────

type TableStatus = 'free' | 'occupied' | 'reserved' | 'cleaning';
type TableShape = 'rect' | 'circle';

interface RestaurantTable {
  id: string;
  number: number;
  capacity: number;
  status: TableStatus;
  section: string;
  shape: TableShape;
  x: number; // canvas coordinates, in px
  y: number;
  currentOrderId?: string;
  reservedAt?: string;
  reservedBy?: string;
  occupiedSince?: string;
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

const SECTIONS = ['Salle principale', 'Terrasse', 'Bar', 'VIP'];

interface SectionZone {
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
}

const SECTION_ZONES: SectionZone[] = [
  { name: 'Salle principale', x: 40,  y: 60,  w: 520, h: 380, color: 'bg-brand-500/[0.04] border-brand-500/30' },
  { name: 'Terrasse',         x: 580, y: 60,  w: 320, h: 230, color: 'bg-amber-50/60 border-amber-300/60' },
  { name: 'Bar',              x: 580, y: 310, w: 150, h: 130, color: 'bg-purple-50/60 border-purple-300/60' },
  { name: 'VIP',              x: 750, y: 310, w: 150, h: 130, color: 'bg-pink-50/60 border-pink-300/60' },
];

const INIT_TABLES: RestaurantTable[] = [
  { id: 't1',  number: 1,  capacity: 2, status: 'occupied', section: 'Salle principale', shape: 'circle', x:  90, y: 120, currentOrderId: 'ORD-8821', occupiedSince: '12:30' },
  { id: 't2',  number: 2,  capacity: 4, status: 'free',     section: 'Salle principale', shape: 'rect',   x: 210, y: 110 },
  { id: 't3',  number: 3,  capacity: 4, status: 'reserved', section: 'Salle principale', shape: 'rect',   x: 350, y: 110, reservedAt: '14:00', reservedBy: 'Martin P.' },
  { id: 't4',  number: 4,  capacity: 6, status: 'occupied', section: 'Salle principale', shape: 'rect',   x: 470, y: 110, currentOrderId: 'ORD-8819', occupiedSince: '12:00' },
  { id: 't5',  number: 5,  capacity: 2, status: 'cleaning', section: 'Salle principale', shape: 'circle', x:  90, y: 260 },
  { id: 't6',  number: 6,  capacity: 4, status: 'free',     section: 'Salle principale', shape: 'rect',   x: 210, y: 260 },
  { id: 't7',  number: 7,  capacity: 8, status: 'free',     section: 'Salle principale', shape: 'rect',   x: 360, y: 360 },
  { id: 't8',  number: 8,  capacity: 4, status: 'occupied', section: 'Salle principale', shape: 'rect',   x: 470, y: 260, currentOrderId: 'ORD-8820', occupiedSince: '13:15' },
  { id: 't9',  number: 9,  capacity: 2, status: 'free',     section: 'Terrasse',         shape: 'circle', x: 620, y: 120 },
  { id: 't10', number: 10, capacity: 4, status: 'free',     section: 'Terrasse',         shape: 'rect',   x: 740, y: 110 },
  { id: 't11', number: 11, capacity: 6, status: 'occupied', section: 'Terrasse',         shape: 'rect',   x: 830, y: 200, currentOrderId: 'ORD-8817', occupiedSince: '12:45' },
  { id: 't12', number: 12, capacity: 2, status: 'reserved', section: 'Terrasse',         shape: 'circle', x: 620, y: 220, reservedAt: '15:00', reservedBy: 'Dubois L.' },
  { id: 't13', number: 13, capacity: 6, status: 'free',     section: 'Bar',              shape: 'rect',   x: 620, y: 360 },
  { id: 't14', number: 14, capacity: 4, status: 'free',     section: 'VIP',              shape: 'rect',   x: 790, y: 360 },
  { id: 't15', number: 15, capacity: 8, status: 'reserved', section: 'VIP',              shape: 'rect',   x: 820, y: 380, reservedAt: '20:00', reservedBy: 'Leclerc A.' },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function tableSize(t: RestaurantTable): { w: number; h: number } {
  if (t.shape === 'circle') {
    const d = t.capacity <= 2 ? 70 : t.capacity <= 4 ? 86 : 100;
    return { w: d, h: d };
  }
  // rectangle: width scales with capacity
  if (t.capacity <= 2) return { w: 84, h: 64 };
  if (t.capacity <= 4) return { w: 110, h: 78 };
  if (t.capacity <= 6) return { w: 140, h: 86 };
  return { w: 170, h: 96 };
}

// ── Add/Edit Modal ────────────────────────────────────────────────────────────

interface TableForm {
  number: string;
  capacity: string;
  section: string;
  shape: TableShape;
}

function emptyForm(): TableForm {
  return { number: '', capacity: '4', section: 'Salle principale', shape: 'rect' };
}

function TableModal({
  table,
  onClose,
  onSave,
}: {
  table?: RestaurantTable;
  onClose: () => void;
  onSave: (data: TableForm) => void;
}) {
  const [form, setForm] = useState<TableForm>(
    table
      ? { number: String(table.number), capacity: String(table.capacity), section: table.section, shape: table.shape }
      : emptyForm()
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
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Section</label>
            <select
              value={form.section}
              onChange={(e) => setForm(f => ({ ...f, section: e.target.value }))}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none"
            >
              {SECTIONS.map(s => <option key={s}>{s}</option>)}
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

// ── QR Modal ──────────────────────────────────────────────────────────────────

function QRModal({ table, onClose }: { table: RestaurantTable; onClose: () => void }) {
  const url = `${typeof window !== 'undefined' ? window.location.origin : 'https://foodstack.app'}/menu?table=${table.number}`;

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
        <p className="mb-4 text-xs text-gray-500">{table.section} · {table.capacity} couverts</p>
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
  position: { x: number; y: number };
  onClose: () => void;
  onChangeStatus: (status: TableStatus) => void;
  onAssignOrder: () => void;
  onEdit: () => void;
  onQr: () => void;
  onDelete: () => void;
}

function ActionMenu({
  table, position, onClose, onChangeStatus, onAssignOrder, onEdit, onQr, onDelete,
}: ActionMenuProps) {
  // Close on escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

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
              <p className="text-xs text-gray-500">{table.section} · {table.capacity} couverts</p>
            </div>
            <div className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_CONFIG[table.status].bg} ${STATUS_CONFIG[table.status].text}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${STATUS_CONFIG[table.status].dot}`} />
              {STATUS_CONFIG[table.status].label}
            </div>
          </div>
        </div>

        <div className="py-1.5">
          <button
            onClick={onAssignOrder}
            className="flex w-full items-center gap-2.5 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
          >
            <ClipboardList className="h-4 w-4 text-gray-500" />
            Assigner une commande
          </button>
          <button
            onClick={() => onChangeStatus('reserved')}
            className="flex w-full items-center gap-2.5 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
          >
            <CalendarClock className="h-4 w-4 text-yellow-500" />
            Réserver
          </button>
          <button
            onClick={() => onChangeStatus('cleaning')}
            className="flex w-full items-center gap-2.5 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
          >
            <Brush className="h-4 w-4 text-gray-500" />
            Marquer en nettoyage
          </button>
          <button
            onClick={() => onChangeStatus('free')}
            className="flex w-full items-center gap-2.5 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
          >
            <CheckCircle className="h-4 w-4 text-green-500" />
            Libérer la table
          </button>
          {table.status === 'cleaning' && (
            <button
              onClick={() => onChangeStatus('free')}
              className="flex w-full items-center gap-2.5 bg-green-50 px-4 py-2 text-left text-sm font-medium text-green-700 hover:bg-green-100"
            >
              <CheckCircle className="h-4 w-4 text-green-600" />
              Nettoyage terminé → Libérer
            </button>
          )}
        </div>

        <div className="border-t border-gray-100 py-1.5">
          <button
            onClick={onQr}
            className="flex w-full items-center gap-2.5 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
          >
            <QrCode className="h-4 w-4 text-gray-500" />
            QR Code
          </button>
          <button
            onClick={onEdit}
            className="flex w-full items-center gap-2.5 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
          >
            <Edit2 className="h-4 w-4 text-gray-500" />
            Modifier
          </button>
          <button
            onClick={onDelete}
            className="flex w-full items-center gap-2.5 px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
            Supprimer
          </button>
        </div>
      </motion.div>
    </>
  );
}

// ── Floor plan canvas ─────────────────────────────────────────────────────────

interface FloorCanvasProps {
  tables: RestaurantTable[];
  onMove: (id: string, x: number, y: number) => void;
  onClickTable: (table: RestaurantTable, screenX: number, screenY: number) => void;
}

function FloorCanvas({ tables, onMove, onClickTable }: FloorCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    id: string;
    offsetX: number;
    offsetY: number;
    moved: boolean;
    startX: number;
    startY: number;
  } | null>(null);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>, table: RestaurantTable) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
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
      const newX = Math.max(0, e.clientX - canvasRect.left - drag.offsetX);
      const newY = Math.max(0, e.clientY - canvasRect.top - drag.offsetY);
      onMove(drag.id, newX, newY);
    },
    [onMove]
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>, table: RestaurantTable) => {
      const drag = dragRef.current;
      if (drag && drag.id === table.id && !drag.moved) {
        onClickTable(table, e.clientX, e.clientY);
      }
      dragRef.current = null;
    },
    [onClickTable]
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
          backgroundSize: '24px 24px',
        }}
      >
        {/* Section zones */}
        {SECTION_ZONES.map(zone => (
          <div
            key={zone.name}
            className={`absolute rounded-2xl border-2 border-dashed ${zone.color}`}
            style={{ left: zone.x, top: zone.y, width: zone.w, height: zone.h }}
          >
            <span className="absolute left-3 top-2 inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-gray-600 shadow-sm">
              {zone.name}
            </span>
          </div>
        ))}

        {/* Tables */}
        {tables.map(table => {
          const cfg = STATUS_CONFIG[table.status];
          const { w, h } = tableSize(table);
          const isCircle = table.shape === 'circle';
          return (
            <div
              key={table.id}
              onPointerDown={(e) => handlePointerDown(e, table)}
              onPointerMove={handlePointerMove}
              onPointerUp={(e) => handlePointerUp(e, table)}
              className={`absolute flex cursor-grab touch-none flex-col items-center justify-center border-2 shadow-sm transition-shadow hover:shadow-md active:cursor-grabbing ${cfg.fill} ${cfg.border} ${isCircle ? 'rounded-full' : 'rounded-2xl'}`}
              style={{ left: table.x, top: table.y, width: w, height: h }}
              title={`Table ${table.number} — ${cfg.label}`}
            >
              {/* Status dot */}
              <span className={`absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full ring-2 ring-white ${cfg.dot}`} />
              {/* Cleaning pulse ring */}
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
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function TablesPage() {
  const [tables, setTables] = useState<RestaurantTable[]>(INIT_TABLES);
  const [viewMode, setViewMode] = useState<'floor' | 'list'>('floor');
  const [sectionFilter, setSectionFilter] = useState<string>('Tous');
  const [statusFilter, setStatusFilter] = useState<TableStatus | 'all'>('all');
  const [editingTable, setEditingTable] = useState<RestaurantTable | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [qrTable, setQrTable] = useState<RestaurantTable | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [actionMenu, setActionMenu] = useState<{ table: RestaurantTable; x: number; y: number } | null>(null);
  const [assignOrderFor, setAssignOrderFor] = useState<RestaurantTable | null>(null);
  const [toasts, setToasts] = useState<{ id: number; message: string }[]>([]);

  const sections = ['Tous', ...SECTIONS.filter(s => tables.some(t => t.section === s))];

  const filtered = tables.filter(t => {
    if (sectionFilter !== 'Tous' && t.section !== sectionFilter) return false;
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

  function openAdd() {
    setEditingTable(null);
    setShowModal(true);
  }

  function openEdit(table: RestaurantTable) {
    setEditingTable(table);
    setShowModal(true);
  }

  function handleSave(form: TableForm) {
    if (editingTable) {
      setTables(prev => prev.map(t =>
        t.id === editingTable.id
          ? {
              ...t,
              number: Number(form.number),
              capacity: Number(form.capacity),
              section: form.section,
              shape: form.shape,
            }
          : t
      ));
    } else {
      setTables(prev => [...prev, {
        id: `t${Date.now()}`,
        number: Number(form.number),
        capacity: Number(form.capacity),
        section: form.section,
        shape: form.shape,
        status: 'free',
        x: 60 + (prev.length % 6) * 130,
        y: 80 + Math.floor(prev.length / 6) * 130,
      }]);
    }
    setShowModal(false);
  }

  function moveTable(id: string, x: number, y: number) {
    setTables(prev => prev.map(t => t.id === id ? { ...t, x, y } : t));
  }

  function changeStatus(id: string, status: TableStatus) {
    setTables(prev => prev.map(t => {
      if (t.id !== id) return t;
      // When a customer leaves (occupied/reserved → free), require cleaning first
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

  function addToast(message: string) {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000);
  }

  function confirmDelete(id: string) { setDeleteId(id); }
  function doDelete() {
    if (deleteId) setTables(prev => prev.filter(t => t.id !== deleteId));
    setDeleteId(null);
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
    // Keep within viewport
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

      {/* IA Nettoyage banner */}
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
          <div className="hidden items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-500 sm:flex">
            <Move className="h-3.5 w-3.5" />
            Glissez pour déplacer · cliquez pour les actions
          </div>
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

      {/* Filters + view toggle */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Section tabs */}
        <div className="flex gap-1 rounded-xl border border-gray-200 bg-white p-1">
          {sections.map(s => (
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

        {/* Status filter */}
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

        <div className="ml-auto flex gap-1 rounded-xl border border-gray-200 bg-white p-1">
          <button
            onClick={() => setViewMode('floor')}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium transition-all ${viewMode === 'floor' ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
            title="Plan de salle"
          >
            <LayoutGrid className="h-4 w-4" />
            Plan
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium transition-all ${viewMode === 'list' ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
            title="Liste"
          >
            <LayoutList className="h-4 w-4" />
            Liste
          </button>
        </div>
      </div>

      {/* Main view */}
      {viewMode === 'floor' ? (
        <div className="space-y-3">
          <FloorCanvas
            tables={filtered}
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
      ) : (
        /* List view */
        <Card padding="none">
          <div className="divide-y divide-gray-100">
            {filtered.map(table => {
              const cfg = STATUS_CONFIG[table.status];
              return (
                <div key={table.id} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gray-100 font-bold text-gray-900">
                    {table.number}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">Table {table.number}</span>
                      <span className="text-gray-400">·</span>
                      <span className="text-sm text-gray-500">{table.section}</span>
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
                        title="Nettoyage terminé"
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
                      <Clock className="h-4 w-4" />
                    </button>
                    <button onClick={() => setQrTable(table)} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600" title="QR Code">
                      <QrCode className="h-4 w-4" />
                    </button>
                    <button onClick={() => openEdit(table)} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600" title="Modifier">
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button onClick={() => confirmDelete(table.id)} className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500" title="Supprimer">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Action menu */}
      <AnimatePresence>
        {actionMenu && (
          <ActionMenu
            table={actionMenu.table}
            position={{ x: actionMenu.x, y: actionMenu.y }}
            onClose={() => setActionMenu(null)}
            onChangeStatus={(s) => { changeStatus(actionMenu.table.id, s); setActionMenu(null); }}
            onAssignOrder={() => { setAssignOrderFor(actionMenu.table); setActionMenu(null); }}
            onEdit={() => { openEdit(actionMenu.table); setActionMenu(null); }}
            onQr={() => { setQrTable(actionMenu.table); setActionMenu(null); }}
            onDelete={() => { confirmDelete(actionMenu.table.id); setActionMenu(null); }}
          />
        )}
      </AnimatePresence>

      {/* Modals */}
      <AnimatePresence>
        {showModal && (
          <TableModal
            table={editingTable || undefined}
            onClose={() => setShowModal(false)}
            onSave={handleSave}
          />
        )}
        {qrTable && <QRModal table={qrTable} onClose={() => setQrTable(null)} />}
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
                <Button variant="danger" className="flex-1" onClick={doDelete}>Supprimer</Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
