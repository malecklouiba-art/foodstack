import { create } from 'zustand';

export type DeliveryStatus = 'idle' | 'heading_to_restaurant' | 'picked_up' | 'delivering' | 'delivered';

export interface ActiveDelivery {
  orderId: string;
  orderNumber: string;
  restaurantId: string;
  restaurantName: string;
  restaurantAddress: string;
  restaurantLat: number;
  restaurantLng: number;
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

  setOnline: (v) => set({ isOnline: v }),

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
