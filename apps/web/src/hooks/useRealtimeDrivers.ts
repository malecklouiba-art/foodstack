'use client';

import { useEffect, useCallback, useState } from 'react';
import { getSocket } from '@/lib/socket';

export interface DriverLocationEvent {
  driverId: string;
  orderId: string | null;
  lat: number;
  lng: number;
}

export interface DriverStatusEvent {
  driverId: string;
  isOnline: boolean;
  name?: string;
}

export interface LiveDriver {
  driverId: string;
  name: string;
  isOnline: boolean;
  lastSeen: Date;
  activeOrderId: string | null;
  lat?: number;
  lng?: number;
}

interface UseRealtimeDriversOptions {
  restaurantId: string;
  onDriverOnline?: (e: DriverStatusEvent) => void;
  onDriverOffline?: (e: DriverStatusEvent) => void;
  onLocationUpdate?: (e: DriverLocationEvent) => void;
}

export function useRealtimeDrivers({
  restaurantId,
  onDriverOnline,
  onDriverOffline,
  onLocationUpdate,
}: UseRealtimeDriversOptions) {
  const [connected, setConnected] = useState(false);

  const connect = useCallback(() => {
    const socket = getSocket();
    if (!socket.connected) socket.connect();

    socket.emit('restaurant:join', restaurantId);

    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    if (socket.connected) setConnected(true);

    socket.on('driver:online', (e: DriverStatusEvent) => {
      onDriverOnline?.(e);
    });

    socket.on('driver:offline', (e: DriverStatusEvent) => {
      onDriverOffline?.(e);
    });

    socket.on('driver:location', (e: DriverLocationEvent) => {
      onLocationUpdate?.(e);
    });

    return () => {
      socket.emit('restaurant:leave', restaurantId);
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('driver:online');
      socket.off('driver:offline');
      socket.off('driver:location');
    };
  }, [restaurantId, onDriverOnline, onDriverOffline, onLocationUpdate]);

  useEffect(() => {
    const cleanup = connect();
    return cleanup;
  }, [connect]);

  return { connected };
}
