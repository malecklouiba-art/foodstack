'use client';

import { useEffect, useCallback } from 'react';
import { getSocket } from '@/lib/socket';

export interface OrderStatusEvent {
  orderId: string;
  restaurantId: string;
  status: string;
  updatedAt: string;
}

export interface NewOrderEvent {
  id: string;
  orderNumber: string;
  restaurantId: string;
  [key: string]: unknown;
}

interface UseOrderSocketOptions {
  restaurantId?: string;
  orderId?: string;
  onOrderStatus?: (event: OrderStatusEvent) => void;
  onNewOrder?: (event: NewOrderEvent) => void;
}

export function useOrderSocket({ restaurantId, orderId, onOrderStatus, onNewOrder }: UseOrderSocketOptions) {
  const connect = useCallback(() => {
    const socket = getSocket();
    if (!socket.connected) socket.connect();

    if (restaurantId) {
      socket.emit('join:restaurant', restaurantId);
    }
    if (orderId) {
      socket.emit('join:order', orderId);
    }

    if (onOrderStatus) socket.on('order:status', onOrderStatus);
    if (onNewOrder) socket.on('order:new', onNewOrder);

    return socket;
  }, [restaurantId, orderId, onOrderStatus, onNewOrder]);

  useEffect(() => {
    const socket = connect();

    return () => {
      if (onOrderStatus) socket.off('order:status', onOrderStatus);
      if (onNewOrder) socket.off('order:new', onNewOrder);
      if (restaurantId) socket.emit('leave:restaurant', restaurantId);
    };
  }, [connect, onOrderStatus, onNewOrder, restaurantId]);
}
