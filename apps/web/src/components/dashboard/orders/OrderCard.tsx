'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, MapPin, ShoppingBag, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';

export type OrderStatus = 'confirmed' | 'preparing' | 'ready' | 'delivering' | 'delivered' | 'cancelled';

export interface KanbanOrder {
  id: string;
  customer: string;
  phone: string;
  items: { name: string; quantity: number; price: number }[];
  total: number;
  status: OrderStatus;
  type: 'delivery' | 'pickup' | 'dine_in';
  address?: string;
  driver?: string;
  createdAt: Date;
  isNew?: boolean;
}

const TYPE_CONFIG = {
  delivery: { label: '🛵 Livraison', color: 'bg-blue-50 text-blue-700' },
  pickup:   { label: '🏪 À emporter', color: 'bg-purple-50 text-purple-700' },
  dine_in:  { label: '🪑 Sur place', color: 'bg-orange-50 text-orange-700' },
};

const NEXT_STATUS: Partial<Record<OrderStatus, { label: string; status: OrderStatus }>> = {
  confirmed: { label: 'Démarrer', status: 'preparing' },
  preparing: { label: 'Prête', status: 'ready' },
  ready:     { label: 'En livraison', status: 'delivering' },
  delivering:{ label: 'Livrée', status: 'delivered' },
};

function useOrderAge(createdAt: Date) {
  const [minutes, setMinutes] = useState(() => Math.floor((Date.now() - createdAt.getTime()) / 60000));

  useEffect(() => {
    const id = setInterval(() => {
      setMinutes(Math.floor((Date.now() - createdAt.getTime()) / 60000));
    }, 30000);
    return () => clearInterval(id);
  }, [createdAt]);

  const color = minutes < 5 ? 'text-green-600' : minutes < 15 ? 'text-amber-600' : 'text-red-600';
  const label = minutes < 1 ? 'À l\'instant' : `${minutes} min`;
  return { label, color, urgent: minutes >= 15 };
}

interface OrderCardProps {
  order: KanbanOrder;
  onAdvance: (orderId: string, nextStatus: OrderStatus) => void;
  onSelect: (order: KanbanOrder) => void;
  kitchen?: boolean;
}

export function OrderCard({ order, onAdvance, onSelect, kitchen }: OrderCardProps) {
  const age = useOrderAge(order.createdAt);
  const next = NEXT_STATUS[order.status];
  const typeConf = TYPE_CONFIG[order.type];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95, y: -8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={`relative rounded-2xl border bg-white p-4 shadow-sm transition-shadow hover:shadow-md ${
        order.isNew ? 'ring-2 ring-brand-400 ring-offset-1' : 'border-surface-200'
      } ${age.urgent ? 'border-red-200' : ''} ${kitchen ? 'p-5' : ''}`}
    >
      {order.isNew && (
        <span className="absolute -top-2 right-3 rounded-full bg-brand-500 px-2 py-0.5 text-xs font-bold text-white">
          Nouveau
        </span>
      )}

      {/* Header */}
      <div className="mb-3 flex items-start justify-between">
        <div>
          <p className={`font-bold text-surface-900 ${kitchen ? 'text-lg' : 'text-sm'}`}>{order.id}</p>
          <p className={`text-surface-500 ${kitchen ? 'text-base' : 'text-xs'}`}>{order.customer}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className={`flex items-center gap-1 font-semibold ${age.color} ${kitchen ? 'text-base' : 'text-xs'}`}>
            <Clock className={kitchen ? 'h-4 w-4' : 'h-3 w-3'} />
            {age.label}
          </span>
          <span className={`rounded-lg px-2 py-0.5 text-xs font-medium ${typeConf.color}`}>
            {typeConf.label}
          </span>
        </div>
      </div>

      {/* Items */}
      <div className={`mb-3 space-y-1 ${kitchen ? '' : ''}`}>
        {order.items.slice(0, kitchen ? 10 : 3).map((item) => (
          <div key={item.name} className={`flex justify-between text-surface-700 ${kitchen ? 'text-base' : 'text-xs'}`}>
            <span className="font-medium">{item.quantity}× {item.name}</span>
            <span className="text-surface-400">{(item.price * item.quantity).toFixed(2)}€</span>
          </div>
        ))}
        {!kitchen && order.items.length > 3 && (
          <p className="text-xs text-surface-400">+{order.items.length - 3} autre{order.items.length - 3 > 1 ? 's' : ''}</p>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-surface-100 pt-3">
        <span className={`font-bold text-surface-900 ${kitchen ? 'text-xl' : 'text-sm'}`}>
          {order.total.toFixed(2)}€
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onSelect(order)}
            className="rounded-lg p-1.5 text-surface-400 hover:bg-surface-100 hover:text-surface-700"
          >
            <ChevronRight className={kitchen ? 'h-5 w-5' : 'h-4 w-4'} />
          </button>
          {next && (
            <button
              onClick={() => onAdvance(order.id, next.status)}
              className={`rounded-xl font-semibold transition-colors ${
                kitchen
                  ? 'bg-brand-500 px-5 py-2.5 text-base text-white hover:bg-brand-600 active:bg-brand-700'
                  : 'bg-brand-50 px-3 py-1.5 text-xs text-brand-700 hover:bg-brand-100'
              }`}
            >
              {next.label}
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
