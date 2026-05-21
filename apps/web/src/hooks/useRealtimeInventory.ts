'use client';

import { useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { getSocket } from '@/lib/socket';

export interface InventoryEvent {
  itemId: string;
  name: string;
  restaurantId: string;
  currentStock: number;
  minStock: number;
}

interface UseRealtimeInventoryOptions {
  restaurantId: string | null;
  onLowStock?: (event: InventoryEvent) => void;
  onUpdated?: (event: InventoryEvent) => void;
  showToasts?: boolean;
}

export function useRealtimeInventory({
  restaurantId,
  onLowStock,
  onUpdated,
  showToasts = true,
}: UseRealtimeInventoryOptions) {
  const connect = useCallback(() => {
    if (!restaurantId) return;

    const socket = getSocket();
    if (!socket.connected) socket.connect();

    socket.emit('restaurant:join', restaurantId);

    socket.on('inventory:low_stock', (event: InventoryEvent) => {
      if (showToasts) {
        toast.error(
          `⚠️ Stock bas : ${event.name} (${event.currentStock} restant, min ${event.minStock})`,
          { duration: 8000 },
        );
      }
      onLowStock?.(event);
    });

    socket.on('inventory:updated', (event: InventoryEvent) => {
      onUpdated?.(event);
    });

    return () => {
      socket.off('inventory:low_stock');
      socket.off('inventory:updated');
    };
  }, [restaurantId, onLowStock, onUpdated, showToasts]);

  useEffect(() => {
    const cleanup = connect();
    return cleanup;
  }, [connect]);
}
