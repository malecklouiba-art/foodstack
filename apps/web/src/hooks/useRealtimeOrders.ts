'use client';

import { useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { getSocket } from '@/lib/socket';

export interface OrderEvent {
  orderId: string;
  orderNumber: string;
  restaurantId: string;
  status: string;
  customerId?: string;
  total?: number;
  itemCount?: number;
}

interface UseRealtimeOrdersOptions {
  restaurantId: string | null;
  onOrderCreated?: (event: OrderEvent) => void;
  onStatusUpdated?: (event: OrderEvent) => void;
  showToasts?: boolean;
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'En attente',
  confirmed: 'Confirmée',
  preparing: 'En préparation',
  ready: 'Prête à récupérer',
  delivering: 'En livraison',
  delivered: 'Livrée',
  cancelled: 'Annulée',
};

export function useRealtimeOrders({
  restaurantId,
  onOrderCreated,
  onStatusUpdated,
  showToasts = true,
}: UseRealtimeOrdersOptions) {
  const connect = useCallback(() => {
    if (!restaurantId) return;

    const socket = getSocket();

    if (!socket.connected) {
      socket.connect();
    }

    socket.emit('restaurant:join', restaurantId);

    socket.on('order:created', (event: OrderEvent) => {
      if (showToasts) {
        toast.success(
          `🛎 Nouvelle commande ${event.orderNumber} · ${event.itemCount} article${(event.itemCount ?? 0) > 1 ? 's' : ''} · ${event.total?.toFixed(2)}€`,
          { duration: 6000 },
        );
      }
      onOrderCreated?.(event);
    });

    socket.on('order:status_updated', (event: OrderEvent) => {
      const label = STATUS_LABELS[event.status] ?? event.status;
      if (showToasts) {
        toast(`📦 ${event.orderNumber} → ${label}`, { duration: 4000 });
      }
      onStatusUpdated?.(event);
    });

    return () => {
      socket.emit('restaurant:leave', restaurantId);
      socket.off('order:created');
      socket.off('order:status_updated');
    };
  }, [restaurantId, onOrderCreated, onStatusUpdated, showToasts]);

  useEffect(() => {
    const cleanup = connect();
    return cleanup;
  }, [connect]);
}
