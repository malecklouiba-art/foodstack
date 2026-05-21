import { useEffect, useState } from 'react';
import { getSocket } from '@/lib/socket';

export interface DriverLocation {
  lat: number;
  lng: number;
  heading?: number;
}

export interface OrderStatusEvent {
  orderId: string;
  status: string;
}

export function useTrackOrder(orderId: string | null) {
  const [status, setStatus] = useState<string | null>(null);
  const [driverLocation, setDriverLocation] = useState<DriverLocation | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!orderId) return;

    const socket = getSocket();
    if (!socket.connected) socket.connect();

    socket.emit('order:track', orderId);

    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);
    const onStatus = (e: OrderStatusEvent) => {
      if (e.orderId === orderId) setStatus(e.status);
    };
    const onLocation = (loc: DriverLocation) => setDriverLocation(loc);

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('order:status_updated', onStatus);
    socket.on('driver:location', onLocation);

    if (socket.connected) setConnected(true);

    return () => {
      socket.emit('order:untrack', orderId);
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('order:status_updated', onStatus);
      socket.off('driver:location', onLocation);
    };
  }, [orderId]);

  return { status, driverLocation, connected };
}
