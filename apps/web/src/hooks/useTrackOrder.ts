'use client';

import { useEffect, useState, useCallback } from 'react';
import { getSocket } from '@/lib/socket';
import type { OrderEvent } from './useRealtimeOrders';

export function useTrackOrder(orderId: string | null) {
  const [status, setStatus] = useState<string | null>(null);
  const [lastEvent, setLastEvent] = useState<OrderEvent | null>(null);

  const connect = useCallback(() => {
    if (!orderId) return;

    const socket = getSocket();
    if (!socket.connected) socket.connect();

    socket.emit('order:track', orderId);

    socket.on('order:status_updated', (event: OrderEvent) => {
      if (event.orderId === orderId) {
        setStatus(event.status);
        setLastEvent(event);
      }
    });

    return () => {
      socket.emit('order:untrack', orderId);
      socket.off('order:status_updated');
    };
  }, [orderId]);

  useEffect(() => {
    const cleanup = connect();
    return cleanup;
  }, [connect]);

  return { status, lastEvent };
}
