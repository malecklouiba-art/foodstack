'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Wifi, WifiOff, LayoutGrid, Table2, ChefHat, Volume2, VolumeX, Eye } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { OrderCard, type KanbanOrder, type OrderStatus } from '@/components/dashboard/orders/OrderCard';
import { useRealtimeOrders, type OrderEvent } from '@/hooks/useRealtimeOrders';
import { getSocket } from '@/lib/socket';

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

// ── Initial mock data ────────────────────────────────────────────────────────

const now = new Date();
const minsAgo = (m: number) => new Date(now.getTime() - m * 60000);

const INITIAL_ORDERS: KanbanOrder[] = [
  { id: 'ORD-8821', customer: 'Marie Laurent', phone: '06 12 34 56 78', items: [{ name: 'Classic Burger', quantity: 2, price: 14.90 }, { name: 'Frites', quantity: 2, price: 4.50 }], total: 42.50, status: 'preparing', type: 'delivery', address: '12 rue de la Paix, Paris', createdAt: minsAgo(8) },
  { id: 'ORD-8820', customer: 'Pierre Dubois',  phone: '06 98 76 54 32', items: [{ name: 'Truffle Burger', quantity: 1, price: 22.50 }, { name: 'Limonade', quantity: 2, price: 4.90 }], total: 32.30, status: 'delivering', type: 'delivery', address: '45 av. Montaigne, Paris', driver: 'Karim A.', createdAt: minsAgo(18) },
  { id: 'ORD-8819', customer: 'Sophie Martin',  phone: '07 23 45 67 89', items: [{ name: 'Salade César', quantity: 2, price: 12.50 }, { name: 'Margherita', quantity: 1, price: 13.90 }], total: 38.90, status: 'ready', type: 'pickup', createdAt: minsAgo(5) },
  { id: 'ORD-8818', customer: 'Julien Klein',   phone: '06 45 67 89 01', items: [{ name: 'Diavola', quantity: 1, price: 16.50 }], total: 19.45, status: 'confirmed', type: 'dine_in', createdAt: minsAgo(2) },
  { id: 'ORD-8815', customer: 'Alice Bonnet',   phone: '07 89 01 23 45', items: [{ name: 'Chicken Burger', quantity: 3, price: 12.90 }], total: 42.17, status: 'delivered', type: 'delivery', driver: 'Tom B.', createdAt: minsAgo(45) },
];

// ── Column config ─────────────────────────────────────────────────────────

const COLUMNS: { status: OrderStatus; label: string; emoji: string; color: string; bg: string }[] = [
  { status: 'confirmed',  label: 'Confirmées',    emoji: '🔔', color: 'text-blue-700 dark:text-blue-400',   bg: 'bg-blue-50 dark:bg-blue-900/20' },
  { status: 'preparing',  label: 'En préparation',emoji: '👨‍🍳', color: 'text-amber-700 dark:text-amber-400',  bg: 'bg-amber-50 dark:bg-amber-900/20' },
  { status: 'ready',      label: 'Prêtes',        emoji: '✅', color: 'text-green-700 dark:text-green-400',  bg: 'bg-green-50 dark:bg-green-900/20' },
  { status: 'delivering', label: 'En livraison',  emoji: '🛵', color: 'text-purple-700 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-900/20' },
];

const STATUS_CONFIG: Record<OrderStatus, { label: string; variant: 'info' | 'warning' | 'brand' | 'success' | 'danger' | 'default' }> = {
  confirmed:  { label: 'Confirmée',      variant: 'info' },
  preparing:  { label: 'En préparation', variant: 'warning' },
  ready:      { label: 'Prête',          variant: 'brand' },
  delivering: { label: 'En livraison',   variant: 'info' },
  delivered:  { label: 'Livrée',         variant: 'success' },
  cancelled:  { label: 'Annulée',        variant: 'danger' },
};

// ── Page ──────────────────────────────────────────────────────────────────

type ViewMode = 'kanban' | 'kitchen';

export default function OrdersPage() {
  const [orders, setOrders] = useState<KanbanOrder[]>(INITIAL_ORDERS);
  const [view, setView] = useState<ViewMode>('kanban');
  const [sound, setSound] = useState(true);
  const [connected, setConnected] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<KanbanOrder | null>(null);
  const [liveCount, setLiveCount] = useState(0);
  const soundRef = useRef(sound);
  soundRef.current = sound;

  // Track socket connection state
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
    // Clear "new" badge after 8s
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

  const advanceOrder = useCallback((orderId: string, nextStatus: OrderStatus) => {
    setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status: nextStatus } : o));
    // Emit to API so Socket.io propagates to customer/driver
    const socket = getSocket();
    socket.emit('delivery:status_update', {
      orderId,
      orderNumber: orderId,
      restaurantId: 'r1',
      driverId: '',
      status: nextStatus,
    });
  }, []);

  const activeOrders = orders.filter((o) => !['delivered', 'cancelled'].includes(o.status));
  const deliveredOrders = orders.filter((o) => o.status === 'delivered');

  const kitchen = view === 'kitchen';

  return (
    <div className={`flex h-full flex-col ${kitchen ? 'bg-surface-900 text-white' : ''}`}>
      {/* Header */}
      <div className={`flex items-center justify-between border-b px-6 py-4 ${kitchen ? 'border-surface-700 bg-surface-900' : 'border-surface-200 bg-white'}`}>
        <div className="flex items-center gap-4">
          <div>
            <h1 className={`text-xl font-bold ${kitchen ? 'text-white' : 'text-surface-900'}`}>
              {kitchen ? '🍽️ Mode cuisine' : 'Commandes en direct'}
            </h1>
            <p className={`text-sm ${kitchen ? 'text-surface-400' : 'text-surface-500'}`}>
              {activeOrders.length} active{activeOrders.length !== 1 ? 's' : ''} · {deliveredOrders.length} livrée{deliveredOrders.length !== 1 ? 's' : ''} aujourd&apos;hui
            </p>
          </div>

          {/* Live indicator */}
          <div className={`flex items-center gap-2 rounded-xl px-3 py-1.5 ${connected ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
            {connected
              ? <Wifi className="h-3.5 w-3.5 text-green-500" />
              : <WifiOff className="h-3.5 w-3.5 text-red-500" />}
            <span className={`text-xs font-semibold ${connected ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
              {connected ? 'Connecté' : 'Déconnecté'}
            </span>
            {liveCount > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-500 text-xs font-bold text-white">
                {liveCount > 9 ? '9+' : liveCount}
              </span>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSound((s) => !s)}
            title={sound ? 'Couper le son' : 'Activer le son'}
            className={`rounded-xl p-2 transition-colors ${kitchen ? 'hover:bg-surface-700' : 'hover:bg-surface-100'}`}
          >
            {sound
              ? <Volume2 className={`h-4 w-4 ${kitchen ? 'text-surface-300' : 'text-surface-600'}`} />
              : <VolumeX className="h-4 w-4 text-surface-400" />}
          </button>

          <div className={`flex rounded-xl border p-0.5 ${kitchen ? 'border-surface-700 bg-surface-800' : 'border-surface-200 bg-surface-50'}`}>
            <button
              onClick={() => setView('kanban')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                view === 'kanban'
                  ? 'bg-white text-surface-900 shadow-sm'
                  : kitchen ? 'text-surface-400 hover:text-surface-200' : 'text-surface-500 hover:text-surface-700'
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" /> Kanban
            </button>
            <button
              onClick={() => setView('kitchen')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                view === 'kitchen'
                  ? 'bg-surface-700 text-white shadow-sm'
                  : 'text-surface-500 hover:text-surface-700'
              }`}
            >
              <ChefHat className="h-3.5 w-3.5" /> Cuisine
            </button>
          </div>
        </div>
      </div>

      {/* Kanban board */}
      <div className={`flex-1 overflow-x-auto p-6 ${kitchen ? 'bg-surface-900' : 'bg-surface-50'}`}>
        <div className={`flex gap-5 ${kitchen ? 'h-full' : ''}`} style={{ minWidth: kitchen ? undefined : '900px' }}>
          {COLUMNS.map((col) => {
            const colOrders = orders.filter((o) => o.status === col.status);
            return (
              <div key={col.status} className="flex w-72 shrink-0 flex-col gap-3">
                {/* Column header */}
                <div className={`flex items-center justify-between rounded-xl px-3 py-2 ${kitchen ? 'bg-surface-800' : col.bg}`}>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{col.emoji}</span>
                    <span className={`font-semibold ${kitchen ? 'text-surface-200' : col.color}`}>{col.label}</span>
                  </div>
                  <span className={`flex h-6 min-w-6 items-center justify-center rounded-full text-xs font-bold ${
                    colOrders.length > 0
                      ? kitchen ? 'bg-brand-500 text-white' : `bg-white ${col.color} shadow-sm`
                      : kitchen ? 'bg-surface-700 text-surface-400' : 'bg-white text-surface-400'
                  }`}>
                    {colOrders.length}
                  </span>
                </div>

                {/* Cards */}
                <div className="flex flex-col gap-3 overflow-y-auto pb-4">
                  <AnimatePresence mode="popLayout">
                    {colOrders.map((order) => (
                      <OrderCard
                        key={order.id}
                        order={order}
                        onAdvance={advanceOrder}
                        onSelect={setSelectedOrder}
                        kitchen={kitchen}
                      />
                    ))}
                    {colOrders.length === 0 && (
                      <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className={`rounded-2xl border-2 border-dashed p-6 text-center ${kitchen ? 'border-surface-700 text-surface-600' : 'border-surface-200 text-surface-400'}`}
                      >
                        <p className="text-sm font-medium">Aucune commande</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            );
          })}

          {/* Delivered column — collapsed summary */}
          {!kitchen && (
            <div className="flex w-64 shrink-0 flex-col gap-3">
              <div className="flex items-center justify-between rounded-xl bg-surface-100 px-3 py-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🎉</span>
                  <span className="font-semibold text-surface-500">Livrées</span>
                </div>
                <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-white text-xs font-bold text-surface-500 shadow-sm">
                  {deliveredOrders.length}
                </span>
              </div>
              <div className="rounded-2xl border border-surface-200 bg-white p-4">
                {deliveredOrders.slice(0, 5).map((o) => (
                  <div key={o.id} className="flex items-center justify-between border-b border-surface-50 py-2 last:border-0">
                    <div>
                      <p className="text-xs font-semibold text-surface-700">{o.id}</p>
                      <p className="text-xs text-surface-400">{o.customer}</p>
                    </div>
                    <span className="text-xs font-bold text-surface-500">{o.total.toFixed(2)}€</span>
                  </div>
                ))}
                {deliveredOrders.length === 0 && (
                  <p className="text-center text-xs text-surface-400">Aucune</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Order detail modal */}
      {selectedOrder && (
        <Modal
          open={!!selectedOrder}
          onClose={() => setSelectedOrder(null)}
          title={`Commande ${selectedOrder.id}`}
          description={`${selectedOrder.customer} · ${selectedOrder.type === 'delivery' ? '🛵 Livraison' : selectedOrder.type === 'pickup' ? '🏪 À emporter' : '🪑 Sur place'}`}
          size="lg"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-xl bg-surface-50 p-3">
              <span className="text-sm text-surface-500">Statut</span>
              <Badge variant={STATUS_CONFIG[selectedOrder.status].variant}>
                {STATUS_CONFIG[selectedOrder.status].label}
              </Badge>
            </div>
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
                <span className="font-medium text-surface-900 text-right max-w-xs">{selectedOrder.address}</span>
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
      )}
    </div>
  );
}
