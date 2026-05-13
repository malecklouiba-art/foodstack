import { useEffect, useRef, useCallback } from 'react';
import * as Location from 'expo-location';
import { getSocket } from '@/lib/socket';

interface LocationPayload {
  driverId: string;
  orderId: string;
  lat: number;
  lng: number;
  heading?: number;
}

export function useLocationTracking(driverId: string, orderId: string | null, active: boolean) {
  const watchRef = useRef<Location.LocationSubscription | null>(null);

  const stopTracking = useCallback(() => {
    if (watchRef.current) {
      watchRef.current.remove();
      watchRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!active || !orderId) {
      stopTracking();
      return;
    }

    let cancelled = false;

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted' || cancelled) return;

      const socket = getSocket();
      if (!socket.connected) socket.connect();

      watchRef.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 3000,
          distanceInterval: 10,
        },
        (loc) => {
          const payload: LocationPayload = {
            driverId,
            orderId,
            lat: loc.coords.latitude,
            lng: loc.coords.longitude,
            heading: loc.coords.heading ?? undefined,
          };
          socket.emit('driver:location_update', payload);
        },
      );
    })();

    return () => {
      cancelled = true;
      stopTracking();
    };
  }, [active, orderId, driverId, stopTracking]);
}
