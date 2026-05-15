'use client';

import { useState, useCallback, useRef, useEffect, useMemo, DragEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import clsx from 'clsx';
import {
  Wifi, WifiOff, LayoutGrid, Table2, ChefHat, Volume2, VolumeX,
  Download, FileSpreadsheet, FileText, Bike, ShoppingBag, Utensils,
  Clock, ChevronRight, Play, CheckCircle2, Truck, PackageCheck, XCircle,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { useRealtimeOrders, type OrderEvent } from '@/hooks/useRealtimeOrders';
import { getSocket } from '@/lib/socket';
import type { KanbanOrder, OrderStatus } from '@/components/dashboard/orders/OrderCard';
import type {} from 'jspdf-autotable';

// ── Sound alert (Web Audio API — no extra dep) ──────────────────────────────

function playNewOrderSound() {
  try {
    const ctx = new AudioContext();
    const times = [0, 0.15, 0.3];
    times.forEach((t) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.3, ctx.currentTime + t);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.12);
      osc.start(ctx.currentTime + t);
      osc.stop(ctx.currentTime + t + 0.12);
    });
  } catch (_) { /* AudioContext blocked — ignore */ }
}

// ── Status / Type config ────────────────────────────────────────────────────

type StatusConfig = {
  label: string;
  /** Solid background colour for chips/buttons */
  solid: string;
  /** Hover variant of the solid colour */
  solidHover: string;
  /** Soft tinted background for columns */
  soft: string;
  /** Text colour matching the solid */
  text: string;
  /** Border colour for cards */
  border: string;
  /** Ring colour for selection */
  ring: string;
  /** RGB tuple used in PDF generation */
  rgb: [number, number, number];
  icon: typeof Play;
};

const STATUS_CONFIG: Record<OrderStatus, StatusConfig> = {
  // pending is not in the type but spec asks for yellow — we map "confirmed" → pending colour
  confirmed:  { label: 'En attente',     solid: 'bg-yellow-500', solidHover: 'hover:bg-yellow-600', soft: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-300', ring: 'ring-yellow-300', rgb: [234, 179, 8],   icon: Clock },
  preparing:  { label: 'En préparation', solid: 'bg-orange-500', solidHover: 'hover:bg-orange-600', soft: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-300', ring: 'ring-orange-300', rgb: [249, 115, 22], icon: ChefHat },
  ready:      { label: 'Prête',          solid: 'bg-blue-500',   solidHover: 'hover:bg-blue-600',   soft: 'bg-blue-50',   text: 'text-blue-700',   border: 'border-blue-300',   ring: 'ring-blue-300',   rgb: [59, 130, 246], icon: CheckCircle2 },
  delivering: { label: 'En livraison',   solid: 'bg-purple-500', solidHover: 'hover:bg-purple-600', soft: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-300', ring: 'ring-purple-300', rgb: [168, 85, 247], icon: Truck },
  delivered:  { label: 'Livrée',         solid: 'bg-green-500',  solidHover: 'hover:bg-green-600',  soft: 'bg-green-50',  text: 'text-green-700',  border: 'border-green-300',  ring: 'ring-green-300',  rgb: [34, 197, 94],  icon: PackageCheck },
  cancelled:  { label: 'Annulée',        solid: 'bg-red-500',    solidHover: 'hover:bg-red-600',    soft: 'bg-red-50',    text: 'text-red-700',    border: 'border-red-300',    ring: 'ring-red-300',    rgb: [239, 68, 68],  icon: XCircle },
};

const NEXT_STATUS: Partial<Record<OrderStatus, { label: string; status: OrderStatus }>> = {
  confirmed:  { label: 'Démarrer',     status: 'preparing' },
  preparing:  { label: 'Prête',        status: 'ready' },
  ready:      { label: 'En livraison', status: 'delivering' },
  delivering: { label: 'Livré',        status: 'delivered' },
};

type OrderType = KanbanOrder['type'];
const TYPE_CONFIG: Record<OrderType, { label: string; bg: string; text: string; ring: string; icon: typeof Bike }> = {
  delivery: { label: 'Livraison',   bg: 'bg-blue-500',   text: 'text-white', ring: 'ring-blue-200',   icon: Bike },
  pickup:   { label: 'À emporter',  bg: 'bg-purple-500', text: 'text-white', ring: 'ring-purple-200', icon: ShoppingBag },
  dine_in:  { label: 'Sur place',   bg: 'bg-brand-500',  text: 'text-black', ring: 'ring-brand-200',  icon: Utensils },
};

// ── Time filter ─────────────────────────────────────────────────────────────

type TimeRange = 'today' | 'week' | 'month' | 'year';

const TIME_RANGES: { key: TimeRange; label: string }[] = [
  { key: 'today', label: "Aujourd'hui" },
  { key: 'week',  label: 'Semaine' },
  { key: 'month', label: 'Mois' },
  { key: 'year',  label: 'Année' },
];

function isWithinRange(date: Date, range: TimeRange): boolean {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const day = 24 * 60 * 60 * 1000;
  if (range === 'today') {
    return date.toDateString() === now.toDateString();
  }
  if (range === 'week')  return diffMs <= 7 * day;
  if (range === 'month') return diffMs <= 31 * day;
  if (range === 'year')  return diffMs <= 365 * day;
  return true;
}

// ── Initial mock data ───────────────────────────────────────────────────────

const now = new Date();
const minsAgo = (m: number) => new Date(now.getTime() - m * 60000);

const INITIAL_ORDERS: KanbanOrder[] = [
  { id: 'ORD-8821', customer: 'Marie Laurent', phone: '06 12 34 56 78', items: [{ name: 'Classic Burger', quantity: 2, price: 14.90 }, { name: 'Frites', quantity: 2, price: 4.50 }], total: 42.50, status: 'preparing', type: 'delivery', address: '12 rue de la Paix, Paris', createdAt: minsAgo(8) },
  { id: 'ORD-8820', customer: 'Pierre Dubois',  phone: '06 98 76 54 32', items: [{ name: 'Truffle Burger', quantity: 1, price: 22.50 }, { name: 'Limonade', quantity: 2, price: 4.90 }], total: 32.30, status: 'delivering', type: 'delivery', address: '45 av. Montaigne, Paris', driver: 'Karim A.', createdAt: minsAgo(18) },
  { id: 'ORD-8819', customer: 'Sophie Martin',  phone: '07 23 45 67 89', items: [{ name: 'Salade César', quantity: 2, price: 12.50 }, { name: 'Margherita', quantity: 1, price: 13.90 }], total: 38.90, status: 'ready', type: 'pickup', createdAt: minsAgo(5) },
  { id: 'ORD-8818', customer: 'Julien Klein',   phone: '06 45 67 89 01', items: [{ name: 'Diavola', quantity: 1, price: 16.50 }], total: 19.45, status: 'confirmed', type: 'dine_in', createdAt: minsAgo(2) },
  { id: 'ORD-8815', customer: 'Alice Bonnet',   phone: '07 89 01 23 45', items: [{ name: 'Chicken Burger', quantity: 3, price: 12.90 }], total: 42.17, status: 'delivered', type: 'delivery', driver: 'Tom B.', createdAt: minsAgo(45) },
];

// ── Column config ───────────────────────────────────────────────────────────

const COLUMNS: { status: OrderStatus }[] = [
  { status: 'confirmed' },
  { status: 'preparing' },
  { status: 'ready' },
  { status: 'delivering' },
  { status: 'delivered' },
];

// ── Order card ──────────────────────────────────────────────────────────────

function useOrderAge(createdAt: Date) {
  const [minutes, setMinutes] = useState(() => Math.floor((Date.now() - createdAt.getTime()) / 60000));
  useEffect(() => {
    const id = setInterval(() => {
      setMinutes(Math.floor((Date.now() - createdAt.getTime()) / 60000));
    }, 30000);
    return () => clearInterval(id);
  }, [createdAt]);
  const color = minutes < 5 ? 'text-green-600' : minutes < 15 ? 'text-amber-600' : 'text-red-600';
  const label = minutes < 1 ? "À l'instant" : `${minutes} min`;
  return { label, color, urgent: minutes >= 15 };
}

interface BigOrderCardProps {
  order: KanbanOrder;
  onAdvance: (orderId: string, nextStatus: OrderStatus) => void;
  onCancel: (orderId: string) => void;
  onSelect: (order: KanbanOrder) => void;
  onDragStart: (e: DragEvent<HTMLDivElement>, orderId: string) => void;
  kitchen?: boolean;
}

function BigOrderCard({ order, onAdvance, onCancel, onSelect, onDragStart, kitchen }: BigOrderCardProps) {
  const age = useOrderAge(order.createdAt);
  const next = NEXT_STATUS[order.status];
  const statusConf = STATUS_CONFIG[order.status];
  const typeConf = TYPE_CONFIG[order.type];
  const TypeIcon = typeConf.icon;
  const StatusIcon = statusConf.icon;

  return (
    <motion.div
      layout
      draggable
      onDragStart={(e) => onDragStart(e as unknown as DragEvent<HTMLDivElement>, order.id)}
      initial={{ opacity: 0, scale: 0.95, y: -8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={clsx(
        'group relative cursor-grab rounded-2xl border-2 bg-white p-4 shadow-sm transition-all hover:shadow-lg active:cursor-grabbing',
        statusConf.border,
        order.isNew && 'ring-2 ring-brand-400 ring-offset-2',
        age.urgent && order.status !== 'delivered' && 'ring-2 ring-red-300 ring-offset-1',
        kitchen && 'p-5',
      )}
    >
      {order.isNew && (
        <span className="absolute -top-2 right-3 z-10 rounded-full bg-brand-500 px-2 py-0.5 text-xs font-bold text-black shadow">
          NOUVEAU
        </span>
      )}

      {/* TYPE CHIP — large, prominent, top of card */}
      <div className={clsx(
        'mb-3 flex items-center gap-2 rounded-xl px-3 py-2 ring-2',
        typeConf.bg, typeConf.text, typeConf.ring,
      )}>
        <TypeIcon className="h-5 w-5" />
        <span className="text-sm font-bold uppercase tracking-wide">{typeConf.label}</span>
      </div>

      {/* Header */}
      <div className="mb-3 flex items-start justify-between">
        <div>
          <p className={clsx('font-bold text-surface-900', kitchen ? 'text-lg' : 'text-base')}>{order.id}</p>
          <p className={clsx('text-surface-500', kitchen ? 'text-base' : 'text-xs')}>{order.customer}</p>
        </div>
        <span className={clsx('flex items-center gap-1 font-semibold', age.color, kitchen ? 'text-base' : 'text-xs')}>
          <Clock className={kitchen ? 'h-4 w-4' : 'h-3 w-3'} />
          {age.label}
        </span>
      </div>

      {/* Items */}
      <div className="mb-3 space-y-1">
        {order.items.slice(0, kitchen ? 10 : 3).map((item) => (
          <div key={item.name} className={clsx('flex justify-between text-surface-700', kitchen ? 'text-base' : 'text-xs')}>
            <span className="font-medium">{item.quantity}× {item.name}</span>
            <span className="text-surface-400">{(item.price * item.quantity).toFixed(2)}€</span>
          </div>
        ))}
        {!kitchen && order.items.length > 3 && (
          <p className="text-xs text-surface-400">+{order.items.length - 3} autre{order.items.length - 3 > 1 ? 's' : ''}</p>
        )}
      </div>

      {/* Status badge inline */}
      <div className={clsx(
        'mb-3 inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold',
        statusConf.soft, statusConf.text,
      )}>
        <StatusIcon className="h-3.5 w-3.5" />
        {statusConf.label.toUpperCase()}
      </div>

      <div className="flex items-center justify-between border-t border-surface-100 pt-3">
        <span className={clsx('font-bold text-surface-900', kitchen ? 'text-xl' : 'text-base')}>
          {order.total.toFixed(2)}€
        </span>
        <button
          onClick={() => onSelect(order)}
          className="rounded-lg p-1.5 text-surface-400 hover:bg-surface-100 hover:text-surface-700"
          title="Voir le détail"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* LARGE STATUS BUTTON — impossible to miss */}
      {next && order.status !== 'delivered' && order.status !== 'cancelled' && (
        <button
          onClick={() => onAdvance(order.id, next.status)}
          className={clsx(
            'mt-3 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-base font-bold text-white shadow-md transition-all hover:shadow-lg active:scale-[0.98]',
            STATUS_CONFIG[next.status].solid,
            STATUS_CONFIG[next.status].solidHover,
          )}
        >
          {next.label}
          <ChevronRight className="h-5 w-5" />
        </button>
      )}

      {order.status !== 'delivered' && order.status !== 'cancelled' && (
        <button
          onClick={() => onCancel(order.id)}
          className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-white py-1.5 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50"
        >
          <XCircle className="h-3.5 w-3.5" />
          Annuler
        </button>
      )}
    </motion.div>
  );
}

// ── Page ────────────────────────────────────────────────────────────────────

type ViewMode = 'kanban' | 'kitchen' | 'list';

export default function OrdersPage() {
  const [orders, setOrders] = useState<KanbanOrder[]>(INITIAL_ORDERS);
  const [view, setView] = useState<ViewMode>('kanban');
  const [timeRange, setTimeRange] = useState<TimeRange>('today');
  const [sound, setSound] = useState(true);
  const [connected, setConnected] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<KanbanOrder | null>(null);
  const [liveCount, setLiveCount] = useState(0);
  const [dragOverStatus, setDragOverStatus] = useState<OrderStatus | null>(null);
  const draggedOrderRef = useRef<string | null>(null);
  const soundRef = useRef(sound);
  soundRef.current = sound;

  useEffect(() => {
    const socket = getSocket();
    const onConnect    = () => setConnected(true);
    const onDisconnect = () => setConnected(false);
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    if (socket.connected) setConnected(true);
    return () => { socket.off('connect', onConnect); socket.off('disconnect', onDisconnect); };
  }, []);

  const handleOrderCreated = useCallback((event: OrderEvent) => {
    if (soundRef.current) playNewOrderSound();
    setLiveCount((c) => c + 1);
    const newOrder: KanbanOrder = {
      id: event.orderNumber,
      customer: 'Nouveau client',
      phone: '',
      items: Array.from({ length: event.itemCount ?? 1 }, (_, i) => ({
        name: `Article ${i + 1}`, quantity: 1, price: (event.total ?? 0) / (event.itemCount ?? 1),
      })),
      total: event.total ?? 0,
      status: 'confirmed',
      type: 'delivery',
      createdAt: new Date(),
      isNew: true,
    };
    setOrders((prev) => [newOrder, ...prev]);
    setTimeout(() => {
      setOrders((prev) => prev.map((o) => o.id === newOrder.id ? { ...o, isNew: false } : o));
    }, 8000);
  }, []);

  const handleStatusUpdated = useCallback((event: OrderEvent) => {
    setOrders((prev) =>
      prev.map((o) => o.id === event.orderNumber ? { ...o, status: event.status as OrderStatus } : o)
    );
  }, []);

  useRealtimeOrders({
    restaurantId: 'r1',
    onOrderCreated: handleOrderCreated,
    onStatusUpdated: handleStatusUpdated,
    showToasts: true,
  });

  const emitStatus = useCallback((orderId: string, nextStatus: OrderStatus) => {
    const socket = getSocket();
    socket.emit('delivery:status_update', {
      orderId, orderNumber: orderId, restaurantId: 'r1', driverId: '', status: nextStatus,
    });
  }, []);

  const advanceOrder = useCallback((orderId: string, nextStatus: OrderStatus) => {
    setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status: nextStatus } : o));
    emitStatus(orderId, nextStatus);
  }, [emitStatus]);

  const cancelOrder = useCallback((orderId: string) => {
    setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status: 'cancelled' } : o));
    emitStatus(orderId, 'cancelled');
  }, [emitStatus]);

  // ── Drag & drop ───────────────────────────────────────────────────────────
  const handleDragStart = useCallback((e: DragEvent<HTMLDivElement>, orderId: string) => {
    draggedOrderRef.current = orderId;
    e.dataTransfer.effectAllowed = 'move';
    try { e.dataTransfer.setData('text/plain', orderId); } catch (_) { /* ignore */ }
  }, []);

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>, status: OrderStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverStatus(status);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOverStatus(null);
  }, []);

  const handleDrop = useCallback((e: DragEvent<HTMLDivElement>, status: OrderStatus) => {
    e.preventDefault();
    const orderId = draggedOrderRef.current || e.dataTransfer.getData('text/plain');
    setDragOverStatus(null);
    draggedOrderRef.current = null;
    if (!orderId) return;
    setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status } : o));
    emitStatus(orderId, status);
  }, [emitStatus]);

  // ── Filters ───────────────────────────────────────────────────────────────
  const filteredOrders = useMemo(
    () => orders.filter((o) => isWithinRange(o.createdAt, timeRange)),
    [orders, timeRange],
  );

  const activeOrders = filteredOrders.filter((o) => !['delivered', 'cancelled'].includes(o.status));
  const deliveredOrders = filteredOrders.filter((o) => o.status === 'delivered');

  const kitchen = view === 'kitchen';

  // ── Export helpers ────────────────────────────────────────────────────────

  function formatItems(order: KanbanOrder): string {
    return order.items.map((i) => `${i.quantity}× ${i.name}`).join(', ');
  }

  function formatDate(d: Date): string {
    return d.toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  const handleExportCSV = () => {
    const headers = ['N° commande', 'Client', 'Téléphone', 'Type', 'Articles', 'Total (€)', 'Statut', 'Date'];
    const rows = filteredOrders.map((o) => [
      o.id,
      o.customer,
      o.phone,
      TYPE_CONFIG[o.type].label,
      formatItems(o),
      o.total.toFixed(2),
      STATUS_CONFIG[o.status].label,
      formatDate(o.createdAt),
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `commandes-foodstack-${timeRange}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportPDF = async () => {
    const { default: jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('FoodStack — Commandes', 14, 20);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100);
    const rangeLabel = TIME_RANGES.find((r) => r.key === timeRange)?.label ?? '';
    doc.text(`Période : ${rangeLabel} · Exporté le ${new Date().toLocaleDateString('fr-FR')}`, 14, 28);
    doc.setTextColor(0);

    autoTable(doc, {
      startY: 36,
      head: [['N° commande', 'Client', 'Type', 'Articles', 'Total', 'Statut', 'Date']],
      body: filteredOrders.map((o) => [
        o.id,
        o.customer,
        TYPE_CONFIG[o.type].label,
        formatItems(o),
        `${o.total.toFixed(2)}€`,
        STATUS_CONFIG[o.status].label,
        formatDate(o.createdAt),
      ]),
      styles: { fontSize: 9, cellPadding: 4 },
      headStyles: { fillColor: [30, 255, 106], textColor: [0, 0, 0], fontStyle: 'bold' },
      columnStyles: { 3: { cellWidth: 50 } },
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index === 5) {
          const statusLabel = data.cell.raw as string;
          const orderStatus = (Object.keys(STATUS_CONFIG) as OrderStatus[]).find(
            (k) => STATUS_CONFIG[k].label === statusLabel
          );
          if (orderStatus) {
            const [r, g, b] = STATUS_CONFIG[orderStatus].rgb;
            data.cell.styles.textColor = [r, g, b];
            data.cell.styles.fontStyle = 'bold';
          }
        }
      },
    });

    doc.save(`commandes-foodstack-${timeRange}.pdf`);
  };

  async function downloadInvoice(order: KanbanOrder) {
    const { default: jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');

    const doc = new jsPDF();
    const pageW = doc.internal.pageSize.getWidth();

    doc.setFontSize(26);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(20, 20, 20);
    doc.text('FoodStack', 14, 22);

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    doc.text('Le Bistrot Parisien', 14, 30);
    doc.text("42 avenue de l'Opéra, 75002 Paris", 14, 36);
    doc.text('support@foodstack.app', 14, 42);

    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(20, 20, 20);
    doc.text('FACTURE', pageW - 14, 22, { align: 'right' });
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    doc.text(`N° FAC-${order.id}`, pageW - 14, 30, { align: 'right' });
    doc.text(`Date : ${formatDate(order.createdAt)}`, pageW - 14, 36, { align: 'right' });

    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.line(14, 50, pageW - 14, 50);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(120, 120, 120);
    doc.text('FACTURÉ À', 14, 60);

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(20, 20, 20);
    doc.text(order.customer, 14, 68);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    if (order.address) doc.text(order.address, 14, 74);
    if (order.phone) doc.text(`Tél : ${order.phone}`, 14, 80);

    const subtotalItems = order.items.reduce((s, i) => s + i.price * i.quantity, 0);
    const tva = subtotalItems * 0.10;
    const delivery = order.type === 'delivery' ? 2.99 : 0;
    const totalTTC = subtotalItems + tva + delivery;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    autoTable(doc as any, {
      startY: 92,
      head: [['Article', 'Qté', 'Prix unit.', 'Total']],
      body: order.items.map((item) => [
        item.name,
        item.quantity.toString(),
        `${item.price.toFixed(2)} €`,
        `${(item.price * item.quantity).toFixed(2)} €`,
      ]),
      styles: { fontSize: 10, cellPadding: 5 },
      headStyles: { fillColor: [30, 30, 30], textColor: [255, 255, 255], fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 'auto' },
        1: { cellWidth: 20, halign: 'center' },
        2: { cellWidth: 35, halign: 'right' },
        3: { cellWidth: 35, halign: 'right' },
      },
      margin: { left: 14, right: 14 },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const finalY: number = (doc as any).lastAutoTable?.finalY ?? 130;
    const totalsX = pageW - 14;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);

    let ty = finalY + 10;
    doc.text('Sous-total HT :', totalsX - 60, ty);
    doc.text(`${subtotalItems.toFixed(2)} €`, totalsX, ty, { align: 'right' });
    ty += 7;
    doc.text('TVA (10%) :', totalsX - 60, ty);
    doc.text(`${tva.toFixed(2)} €`, totalsX, ty, { align: 'right' });
    ty += 7;
    doc.text('Livraison :', totalsX - 60, ty);
    doc.text(delivery > 0 ? `${delivery.toFixed(2)} €` : 'Offerte', totalsX, ty, { align: 'right' });
    ty += 3;
    doc.setDrawColor(30, 30, 30);
    doc.setLineWidth(0.5);
    doc.line(totalsX - 70, ty, totalsX, ty);
    ty += 7;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(20, 20, 20);
    doc.text('Total TTC :', totalsX - 60, ty);
    doc.text(`${totalTTC.toFixed(2)} €`, totalsX, ty, { align: 'right' });

    const pageH = doc.internal.pageSize.getHeight();
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.4);
    doc.line(14, pageH - 22, pageW - 14, pageH - 22);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(140, 140, 140);
    doc.text(
      'Merci de votre commande · FoodStack Platform · support@foodstack.app',
      pageW / 2, pageH - 14, { align: 'center' }
    );

    doc.save(`facture-${order.id}.pdf`);
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className={clsx('flex h-full flex-col', kitchen ? 'bg-surface-900 text-white' : 'bg-white')}>
      {/* Header */}
      <div className={clsx(
        'flex flex-wrap items-center justify-between gap-4 border-b px-6 py-4',
        kitchen ? 'border-surface-700 bg-surface-900' : 'border-surface-200 bg-white',
      )}>
        <div className="flex items-center gap-4">
          <div>
            <h1 className={clsx('text-xl font-bold', kitchen ? 'text-white' : 'text-surface-900')}>
              {kitchen ? 'Mode cuisine' : 'Commandes en direct'}
            </h1>
            <p className={clsx('text-sm', kitchen ? 'text-surface-400' : 'text-surface-500')}>
              {activeOrders.length} active{activeOrders.length !== 1 ? 's' : ''} · {deliveredOrders.length} livrée{deliveredOrders.length !== 1 ? 's' : ''}
            </p>
          </div>

          <div className={clsx(
            'flex items-center gap-2 rounded-xl px-3 py-1.5',
            connected ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20',
          )}>
            {connected
              ? <Wifi className="h-3.5 w-3.5 text-green-500" />
              : <WifiOff className="h-3.5 w-3.5 text-red-500" />}
            <span className={clsx(
              'text-xs font-semibold',
              connected ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400',
            )}>
              {connected ? 'Connecté' : 'Déconnecté'}
            </span>
            {liveCount > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-500 text-xs font-bold text-black">
                {liveCount > 9 ? '9+' : liveCount}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Export */}
          <button
            onClick={handleExportCSV}
            title="Exporter CSV"
            className={clsx(
              'flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-sm font-medium transition-colors',
              kitchen ? 'border-surface-700 text-surface-300 hover:bg-surface-700' : 'border-surface-200 bg-white text-surface-600 hover:bg-surface-50',
            )}
          >
            <FileSpreadsheet className="h-3.5 w-3.5" /> Export CSV
          </button>
          <button
            onClick={handleExportPDF}
            title="Exporter PDF"
            className={clsx(
              'flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-sm font-medium transition-colors',
              kitchen ? 'border-surface-700 text-surface-300 hover:bg-surface-700' : 'border-surface-200 bg-white text-surface-600 hover:bg-surface-50',
            )}
          >
            <Download className="h-3.5 w-3.5" /> Export PDF
          </button>

          <button
            onClick={() => setSound((s) => !s)}
            title={sound ? 'Couper le son' : 'Activer le son'}
            className={clsx('rounded-xl p-2 transition-colors', kitchen ? 'hover:bg-surface-700' : 'hover:bg-surface-100')}
          >
            {sound
              ? <Volume2 className={clsx('h-4 w-4', kitchen ? 'text-surface-300' : 'text-surface-600')} />
              : <VolumeX className="h-4 w-4 text-surface-400" />}
          </button>

          {/* View switcher */}
          <div className={clsx('flex rounded-xl border p-0.5', kitchen ? 'border-surface-700 bg-surface-800' : 'border-surface-200 bg-surface-50')}>
            <button
              onClick={() => setView('kanban')}
              className={clsx(
                'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors',
                view === 'kanban'
                  ? 'bg-white text-surface-900 shadow-sm'
                  : kitchen ? 'text-surface-400 hover:text-surface-200' : 'text-surface-500 hover:text-surface-700',
              )}
            >
              <LayoutGrid className="h-3.5 w-3.5" /> Kanban
            </button>
            <button
              onClick={() => setView('list')}
              className={clsx(
                'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors',
                view === 'list'
                  ? 'bg-white text-surface-900 shadow-sm'
                  : kitchen ? 'text-surface-400 hover:text-surface-200' : 'text-surface-500 hover:text-surface-700',
              )}
            >
              <Table2 className="h-3.5 w-3.5" /> Liste
            </button>
            <button
              onClick={() => setView('kitchen')}
              className={clsx(
                'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors',
                view === 'kitchen'
                  ? 'bg-surface-700 text-white shadow-sm'
                  : 'text-surface-500 hover:text-surface-700',
              )}
            >
              <ChefHat className="h-3.5 w-3.5" /> Cuisine
            </button>
          </div>
        </div>
      </div>

      {/* Time range tabs */}
      <div className={clsx(
        'flex items-center gap-2 border-b px-6 py-3',
        kitchen ? 'border-surface-700 bg-surface-900' : 'border-surface-200 bg-white',
      )}>
        {TIME_RANGES.map((r) => (
          <button
            key={r.key}
            onClick={() => setTimeRange(r.key)}
            className={clsx(
              'rounded-xl px-4 py-2 text-sm font-bold transition-colors',
              timeRange === r.key
                ? 'bg-brand-500 text-black shadow-sm'
                : kitchen
                  ? 'text-surface-400 hover:bg-surface-800 hover:text-white'
                  : 'text-surface-500 hover:bg-surface-100 hover:text-surface-900',
            )}
          >
            {r.label}
          </button>
        ))}
        <span className={clsx('ml-auto text-sm font-medium', kitchen ? 'text-surface-400' : 'text-surface-500')}>
          {filteredOrders.length} commande{filteredOrders.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Body */}
      {view === 'list' ? (
        <div className={clsx('flex-1 overflow-auto p-6', kitchen ? 'bg-surface-900' : 'bg-surface-50')}>
          <div className="overflow-hidden rounded-2xl border border-surface-200 bg-white shadow-sm">
            <table className="w-full">
              <thead className="bg-surface-50">
                <tr className="text-left text-xs font-bold uppercase tracking-wide text-surface-500">
                  <th className="px-4 py-3">N°</th>
                  <th className="px-4 py-3">Client</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Articles</th>
                  <th className="px-4 py-3 text-right">Total</th>
                  <th className="px-4 py-3">Statut</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((o) => {
                  const sc = STATUS_CONFIG[o.status];
                  const tc = TYPE_CONFIG[o.type];
                  const TIcon = tc.icon;
                  const next = NEXT_STATUS[o.status];
                  return (
                    <tr key={o.id} className="border-t border-surface-100 hover:bg-surface-50">
                      <td className="px-4 py-3 text-sm font-bold text-surface-900">{o.id}</td>
                      <td className="px-4 py-3 text-sm text-surface-700">{o.customer}</td>
                      <td className="px-4 py-3">
                        <span className={clsx('inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold', tc.bg, tc.text)}>
                          <TIcon className="h-3.5 w-3.5" />
                          {tc.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-surface-600">{formatItems(o)}</td>
                      <td className="px-4 py-3 text-right text-sm font-bold text-surface-900">{o.total.toFixed(2)}€</td>
                      <td className="px-4 py-3">
                        <span className={clsx('inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold text-white', sc.solid)}>
                          {sc.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-surface-500">{formatDate(o.createdAt)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {next && (
                            <button
                              onClick={() => advanceOrder(o.id, next.status)}
                              className={clsx(
                                'rounded-lg px-3 py-1.5 text-xs font-bold text-white transition-colors',
                                STATUS_CONFIG[next.status].solid,
                                STATUS_CONFIG[next.status].solidHover,
                              )}
                            >
                              {next.label}
                            </button>
                          )}
                          <button
                            onClick={() => setSelectedOrder(o)}
                            className="rounded-lg p-1.5 text-surface-400 hover:bg-surface-100 hover:text-surface-700"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredOrders.length === 0 && (
                  <tr><td colSpan={8} className="px-4 py-12 text-center text-sm text-surface-400">Aucune commande sur cette période</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className={clsx('flex-1 overflow-x-auto p-6', kitchen ? 'bg-surface-900' : 'bg-surface-50')}>
          <div className={clsx('flex gap-5', kitchen && 'h-full')} style={{ minWidth: '1100px' }}>
            {COLUMNS.map((col) => {
              const sc = STATUS_CONFIG[col.status];
              const colOrders = filteredOrders.filter((o) => o.status === col.status);
              const isOver = dragOverStatus === col.status;
              const SIcon = sc.icon;
              return (
                <div
                  key={col.status}
                  className="flex w-72 shrink-0 flex-col gap-3"
                  onDragOver={(e) => handleDragOver(e, col.status)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, col.status)}
                >
                  {/* Strong colour-coded column header */}
                  <div className={clsx(
                    'flex items-center justify-between rounded-xl px-3 py-2.5 ring-2',
                    kitchen ? 'bg-surface-800 ring-surface-700' : clsx(sc.soft, sc.ring),
                  )}>
                    <div className="flex items-center gap-2">
                      <div className={clsx('flex h-7 w-7 items-center justify-center rounded-lg text-white shadow', sc.solid)}>
                        <SIcon className="h-4 w-4" />
                      </div>
                      <span className={clsx('font-bold uppercase tracking-wide', kitchen ? 'text-surface-200' : sc.text)}>
                        {sc.label}
                      </span>
                    </div>
                    <span className={clsx(
                      'flex h-7 min-w-7 items-center justify-center rounded-full px-2 text-sm font-bold',
                      colOrders.length > 0
                        ? clsx(sc.solid, 'text-white shadow-sm')
                        : kitchen ? 'bg-surface-700 text-surface-400' : 'bg-white text-surface-400',
                    )}>
                      {colOrders.length}
                    </span>
                  </div>

                  {/* Drop zone / Cards */}
                  <div className={clsx(
                    'flex min-h-[140px] flex-1 flex-col gap-3 overflow-y-auto rounded-2xl p-2 pb-4 transition-all',
                    isOver && 'bg-brand-50 ring-2 ring-brand-400 ring-offset-2',
                  )}>
                    <AnimatePresence mode="popLayout">
                      {colOrders.map((order) => (
                        <BigOrderCard
                          key={order.id}
                          order={order}
                          onAdvance={advanceOrder}
                          onCancel={cancelOrder}
                          onSelect={setSelectedOrder}
                          onDragStart={handleDragStart}
                          kitchen={kitchen}
                        />
                      ))}
                      {colOrders.length === 0 && (
                        <motion.div
                          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                          className={clsx(
                            'rounded-2xl border-2 border-dashed p-6 text-center',
                            kitchen ? 'border-surface-700 text-surface-600' : 'border-surface-200 text-surface-400',
                          )}
                        >
                          <p className="text-sm font-medium">Glissez ici</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Order detail modal */}
      {selectedOrder && (() => {
        const sc = STATUS_CONFIG[selectedOrder.status];
        const tc = TYPE_CONFIG[selectedOrder.type];
        const TIcon = tc.icon;
        const next = NEXT_STATUS[selectedOrder.status];
        return (
          <Modal
            open={!!selectedOrder}
            onClose={() => setSelectedOrder(null)}
            title={`Commande ${selectedOrder.id}`}
            description={selectedOrder.customer}
            size="lg"
          >
            <div className="space-y-4">
              {/* Type chip */}
              <div className={clsx('flex items-center gap-3 rounded-2xl px-4 py-3 ring-2', tc.bg, tc.text, tc.ring)}>
                <TIcon className="h-6 w-6" />
                <span className="text-base font-bold uppercase tracking-wide">{tc.label}</span>
              </div>

              {/* Current status + Invoice */}
              <div className="flex items-center justify-between gap-3">
                <div className={clsx('flex items-center gap-2 rounded-xl px-3 py-2 ring-2', sc.soft, sc.text, sc.ring)}>
                  <span className="text-xs font-bold uppercase">Statut</span>
                  <span className={clsx('rounded-lg px-2 py-1 text-xs font-bold text-white', sc.solid)}>
                    {sc.label}
                  </span>
                </div>
                <button
                  onClick={() => downloadInvoice(selectedOrder)}
                  className="flex items-center gap-1.5 rounded-xl border border-surface-200 bg-white px-3 py-2.5 text-sm font-medium text-surface-700 shadow-sm transition-colors hover:bg-surface-50"
                >
                  <FileText className="h-4 w-4 text-surface-500" />
                  Facture PDF
                </button>
              </div>

              {/* Large status switch buttons */}
              {next && (
                <button
                  onClick={() => {
                    advanceOrder(selectedOrder.id, next.status);
                    setSelectedOrder({ ...selectedOrder, status: next.status });
                  }}
                  className={clsx(
                    'flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-base font-bold text-white shadow-md transition-all hover:shadow-lg active:scale-[0.99]',
                    STATUS_CONFIG[next.status].solid,
                    STATUS_CONFIG[next.status].solidHover,
                  )}
                >
                  Passer à : {next.label}
                  <ChevronRight className="h-5 w-5" />
                </button>
              )}

              <div>
                <h4 className="mb-2 text-sm font-semibold text-surface-700">Articles</h4>
                <div className="space-y-2 rounded-xl border border-surface-100 p-3">
                  {selectedOrder.items.map((item) => (
                    <div key={item.name} className="flex items-center justify-between text-sm">
                      <span className="text-surface-700">{item.quantity}× {item.name}</span>
                      <span className="font-medium text-surface-900">{(item.price * item.quantity).toFixed(2)}€</span>
                    </div>
                  ))}
                  <div className="flex justify-between border-t border-surface-100 pt-2 text-sm font-bold">
                    <span>Total</span>
                    <span>{selectedOrder.total.toFixed(2)}€</span>
                  </div>
                </div>
              </div>
              {selectedOrder.phone && (
                <div className="flex justify-between text-sm">
                  <span className="text-surface-500">Téléphone</span>
                  <span className="font-medium text-surface-900">{selectedOrder.phone}</span>
                </div>
              )}
              {selectedOrder.address && (
                <div className="flex justify-between text-sm">
                  <span className="text-surface-500">Adresse</span>
                  <span className="max-w-xs text-right font-medium text-surface-900">{selectedOrder.address}</span>
                </div>
              )}
              {selectedOrder.driver && (
                <div className="flex justify-between text-sm">
                  <span className="text-surface-500">Livreur</span>
                  <span className="font-medium text-surface-900">{selectedOrder.driver}</span>
                </div>
              )}
            </div>
          </Modal>
        );
      })()}
    </div>
  );
}
