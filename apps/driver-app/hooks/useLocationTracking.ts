import { useEffect, useRef, useCallback } from 'react';
import * as Location from 'expo-location';
import { getSocket } from '@/lib/socket';

export interface DriverCoords {
  lat: number;
  lng: number;
  heading?: number;
}

interface Options {
  driverId: string;
  orderId: string | null;
  active: boolean;
  onLocation?: (coords: DriverCoords) => void;
}

export function useLocationTracking({ driverId, orderId, active, onLocation }: Options) {
  const watchRef = useRef<Location.LocationSubscription | null>(null);
  const onLocationRef = useRef(onLocation);
  onLocationRef.current = onLocation;

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
          const coords: DriverCoords = {
            lat: loc.coords.latitude,
            lng: loc.coords.longitude,
            heading: loc.coords.heading ?? undefined,
          };
          socket.emit('driver_location_update', {
            driverId,
            orderId,
            lat: coords.lat,
            lng: coords.lng,
            heading: coords.heading ?? null,
          });
          onLocationRef.current?.(coords);
        },
      );
    })();

    return () => {
      cancelled = true;
      stopTracking();
    };
  }, [active, orderId, driverId, stopTracking]);
}
