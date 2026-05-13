import { useEffect, useState, useCallback } from 'react';
import { getSocket } from '@/lib/socket';
import { useDriverStore } from '@/store/driver';

export interface AvailableOrder {
  orderId: string;
  orderNumber: string;
  restaurantId: string;
  restaurantName?: string;
  restaurantAddress?: string;
  restaurantLat?: number;
  restaurantLng?: number;
  customerAddress?: string;
  customerLat?: number;
  customerLng?: number;
  total?: number;
  itemCount?: number;
  earnings?: number;
  distanceKm?: number;
  estimatedMinutes?: number;
}

export function useAvailableOrders(driverId: string) {
  const [orders, setOrders] = useState<AvailableOrder[]>([]);
  const [connected, setConnected] = useState(false);
  const isOnline = useDriverStore((s) => s.isOnline);

  const connect = useCallback(() => {
    const socket = getSocket();
    if (!socket.connected) socket.connect();

    socket.emit('driver:join', driverId);

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('driver:join', driverId);
    });
    socket.on('disconnect', () => setConnected(false));

    socket.on('order:available', (order: AvailableOrder) => {
      setOrders((prev) => {
        if (prev.find((o) => o.orderId === order.orderId)) return prev;
        return [order, ...prev];
      });
    });

    return () => {
      socket.emit('driver:leave', driverId);
      socket.off('order:available');
      socket.off('connect');
      socket.off('disconnect');
    };
  }, [driverId]);

  useEffect(() => {
    if (!isOnline) {
      setOrders([]);
      const socket = getSocket();
      if (socket.connected) socket.emit('driver:leave', driverId);
      return;
    }
    return connect();
  }, [isOnline, connect, driverId]);

  const removeOrder = useCallback((orderId: string) => {
    setOrders((prev) => prev.filter((o) => o.orderId !== orderId));
  }, []);

  return { orders, connected, removeOrder };
}
