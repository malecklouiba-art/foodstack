import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000';
const STORAGE_KEY = 'driver-auth';

async function getAuthToken(): Promise<string | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return (JSON.parse(raw) as { token?: string }).token ?? null;
  } catch {
    return null;
  }
}

async function apiPatch(path: string, body: unknown): Promise<void> {
  const token = await getAuthToken();
  await fetch(`${API_URL}/api/v1${path}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
}

export type DeliveryStatus = 'idle' | 'heading_to_restaurant' | 'picked_up' | 'delivering' | 'delivered';

export interface ActiveDelivery {
  orderId: string;
  orderNumber: string;
  restaurantId: string;
  restaurantName: string;
  restaurantAddress: string;
  restaurantLat: number;
  restaurantLng: number;
  customerName?: string;
  customerPhone?: string;
  customerAddress: string;
  customerLat: number;
  customerLng: number;
  items: { name: string; qty: number }[];
  earnings: number;
  distanceKm: number;
  estimatedMinutes: number;
  status: DeliveryStatus;
}

interface DriverStore {
  isOnline: boolean;
  activeDelivery: ActiveDelivery | null;
  todayEarnings: number;
  todayDeliveries: number;
  rating: number;

  setOnline: (v: boolean) => void;
  acceptDelivery: (delivery: Omit<ActiveDelivery, 'status'>) => void;
  updateDeliveryStatus: (status: DeliveryStatus) => void;
  completeDelivery: () => void;
  setDriverStats: (stats: { rating?: number; todayEarnings?: number; todayDeliveries?: number }) => void;
}

export const useDriverStore = create<DriverStore>((set) => ({
  isOnline: false,
  activeDelivery: null,
  todayEarnings: 0,
  todayDeliveries: 0,
  rating: 0,

  setOnline: (v) => {
    set({ isOnline: v });
    apiPatch('/drivers/me/online', { online: v }).catch(() => { /* best-effort */ });
    if (v) {
      apiPatch('/drivers/me/availability', { available: true }).catch(() => { /* best-effort */ });
    }
  },

  acceptDelivery: (delivery) =>
    set({ activeDelivery: { ...delivery, status: 'heading_to_restaurant' } }),

  updateDeliveryStatus: (status) =>
    set((s) =>
      s.activeDelivery ? { activeDelivery: { ...s.activeDelivery, status } } : s
    ),

  completeDelivery: () =>
    set((s) => ({
      activeDelivery: null,
      todayEarnings: s.todayEarnings + (s.activeDelivery?.earnings ?? 0),
      todayDeliveries: s.todayDeliveries + 1,
    })),

  setDriverStats: (stats) =>
    set((s) => ({
      rating: stats.rating ?? s.rating,
      todayEarnings: stats.todayEarnings ?? s.todayEarnings,
      todayDeliveries: stats.todayDeliveries ?? s.todayDeliveries,
    })),
}));
