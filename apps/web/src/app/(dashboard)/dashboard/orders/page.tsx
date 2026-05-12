'use client';

import { useState } from 'react';
import {
  Search,
  Filter,
  RefreshCw,
  Eye,
  Clock,
  ChevronDown,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';

type OrderStatus = 'confirmed' | 'preparing' | 'ready' | 'delivering' | 'delivered' | 'cancelled';

interface Order {
  id: string;
  customer: string;
  email: string;
  phone: string;
  items: { name: string; quantity: number; price: number }[];
  total: number;
  status: OrderStatus;
  type: 'delivery' | 'pickup' | 'dine_in';
  address?: string;
  createdAt: string;
  driver?: string;
}

const STATUS_CONFIG: Record<OrderStatus, { label: string; variant: 'info' | 'warning' | 'brand' | 'success' | 'danger' | 'default' }> = {
  confirmed: { label: 'Confirmée', variant: 'info' },
  preparing: { label: 'En préparation', variant: 'warning' },
  ready: { label: 'Prête', variant: 'brand' },
  delivering: { label: 'En livraison', variant: 'info' },
  delivered: { label: 'Livrée', variant: 'success' },
  cancelled: { label: 'Annulée', variant: 'danger' },
};

const ORDERS: Order[] = [
  { id: 'ORD-8821', customer: 'Marie Laurent', email: 'marie@email.fr', phone: '06 12 34 56 78', items: [{ name: 'Classic Burger', quantity: 2, price: 14.90 }, { name: 'Frites', quantity: 2, price: 4.50 }], total: 42.50, status: 'preparing', type: 'delivery', address: '12 rue de la Paix, 75001 Paris', createdAt: '14:23', driver: undefined },
  { id: 'ORD-8820', customer: 'Pierre Dubois', email: 'pierre@email.fr', phone: '06 98 76 54 32', items: [{ name: 'Truffle Burger', quantity: 1, price: 22.50 }, { name: 'Limonade', quantity: 2, price: 4.90 }], total: 32.30, status: 'delivering', type: 'delivery', address: '45 avenue Montaigne, 75008 Paris', createdAt: '14:05', driver: 'Karim A.' },
  { id: 'ORD-8819', customer: 'Sophie Martin', email: 'sophie@email.fr', phone: '07 23 45 67 89', items: [{ name: 'Salade César', quantity: 2, price: 12.50 }, { name: 'Margherita', quantity: 1, price: 13.90 }, { name: 'Tiramisu', quantity: 2, price: 7.50 }], total: 53.90, status: 'ready', type: 'pickup', createdAt: '13:58' },
  { id: 'ORD-8818', customer: 'Julien Klein', email: 'julien@email.fr', phone: '06 45 67 89 01', items: [{ name: 'Diavola', quantity: 1, price: 16.50 }], total: 19.45, status: 'confirmed', type: 'dine_in', createdAt: '14:30' },
  { id: 'ORD-8817', customer: 'Alice Bonnet', email: 'alice@email.fr', phone: '07 89 01 23 45', items: [{ name: 'Chicken Burger', quantity: 3, price: 12.90 }], total: 42.17, status: 'delivered', type: 'delivery', address: '8 rue Lepic, 75018 Paris', createdAt: '13:12', driver: 'Tom B.' },
  { id: 'ORD-8816', customer: 'Bob Méric', email: 'bob@email.fr', phone: '06 67 89 01 23', items: [{ name: 'Fondant Choco', quantity: 2, price: 8.00 }], total: 17.60, status: 'cancelled', type: 'delivery', address: '3 bd Haussmann, 75009 Paris', createdAt: '12:45' },
];

const TYPE_LABELS = { delivery: '🛵 Livraison', pickup: '🏪 À emporter', dine_in: '🪑 Sur place' };

export default function OrdersPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const filtered = ORDERS.filter((o) => {
    const matchSearch = !search || o.id.includes(search) || o.customer.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const nextStatus: Partial<Record<OrderStatus, OrderStatus>> = {
    confirmed: 'preparing',
    preparing: 'ready',
    ready: 'delivering',
    delivering: 'delivered',
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Commandes</h1>
          <p className="mt-1 text-sm text-surface-500">{ORDERS.length} commandes aujourd'hui</p>
        </div>
        <Button variant="ghost" size="sm" icon={<RefreshCw className="h-4 w-4" />}>
          Actualiser
        </Button>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap gap-3">
        <div className="w-64">
          <Input
            placeholder="Rechercher..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="h-4 w-4" />}
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {(['all', ...Object.keys(STATUS_CONFIG)] as Array<'all' | OrderStatus>).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`rounded-xl border px-3 py-2 text-sm font-medium transition-colors ${
                statusFilter === status
                  ? 'border-brand-500 bg-brand-50 text-brand-700'
                  : 'border-surface-200 bg-white text-surface-600 hover:border-surface-300'
              }`}
            >
              {status === 'all' ? 'Toutes' : STATUS_CONFIG[status as OrderStatus].label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-surface-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-surface-100 bg-surface-50">
                {['Commande', 'Client', 'Type', 'Articles', 'Total', 'Statut', 'Heure', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-surface-400">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {filtered.map((order, i) => {
                const status = STATUS_CONFIG[order.status];
                const next = nextStatus[order.status];
                return (
                  <motion.tr
                    key={order.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="hover:bg-surface-50"
                  >
                    <td className="px-4 py-3.5 text-sm font-semibold text-surface-900">{order.id}</td>
                    <td className="px-4 py-3.5">
                      <p className="text-sm font-medium text-surface-900">{order.customer}</p>
                      <p className="text-xs text-surface-400">{order.phone}</p>
                    </td>
                    <td className="px-4 py-3.5 text-sm text-surface-600">{TYPE_LABELS[order.type]}</td>
                    <td className="px-4 py-3.5 text-sm text-surface-600">{order.items.length} article{order.items.length !== 1 ? 's' : ''}</td>
                    <td className="px-4 py-3.5 text-sm font-semibold text-surface-900">{order.total.toFixed(2)}€</td>
                    <td className="px-4 py-3.5">
                      <Badge variant={status.variant} dot>{status.label}</Badge>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1 text-xs text-surface-400">
                        <Clock className="h-3 w-3" />
                        {order.createdAt}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="rounded-lg p-1.5 text-surface-400 hover:bg-surface-100 hover:text-surface-700"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {next && (
                          <Button size="sm" variant="ghost">
                            {STATUS_CONFIG[next].label}
                          </Button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order detail modal */}
      {selectedOrder && (
        <Modal
          open={!!selectedOrder}
          onClose={() => setSelectedOrder(null)}
          title={`Commande ${selectedOrder.id}`}
          description={`${selectedOrder.customer} · ${TYPE_LABELS[selectedOrder.type]}`}
          size="lg"
        >
          <div className="space-y-4">
            <div>
              <h4 className="mb-2 text-sm font-semibold text-surface-700">Articles</h4>
              <div className="space-y-2 rounded-xl border border-surface-100 p-3">
                {selectedOrder.items.map((item) => (
                  <div key={item.name} className="flex items-center justify-between text-sm">
                    <span className="text-surface-700">{item.quantity}x {item.name}</span>
                    <span className="font-medium text-surface-900">{(item.price * item.quantity).toFixed(2)}€</span>
                  </div>
                ))}
                <div className="border-t border-surface-100 pt-2 flex justify-between font-bold">
                  <span>Total</span>
                  <span>{selectedOrder.total.toFixed(2)}€</span>
                </div>
              </div>
            </div>
            {selectedOrder.address && (
              <div>
                <h4 className="mb-1 text-sm font-semibold text-surface-700">Adresse</h4>
                <p className="text-sm text-surface-600">{selectedOrder.address}</p>
              </div>
            )}
            {selectedOrder.driver && (
              <div>
                <h4 className="mb-1 text-sm font-semibold text-surface-700">Livreur</h4>
                <p className="text-sm text-surface-600">{selectedOrder.driver}</p>
              </div>
            )}
            <div className="flex items-center justify-between rounded-xl bg-surface-50 p-3">
              <span className="text-sm text-surface-600">Statut</span>
              <Badge variant={STATUS_CONFIG[selectedOrder.status].variant}>
                {STATUS_CONFIG[selectedOrder.status].label}
              </Badge>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
