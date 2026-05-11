import { create } from 'zustand';
import type { Order, OrderStatus } from '@foodstack/shared';

interface OrdersStore {
  activeOrders: Order[];
  selectedOrder: Order | null;
  filters: {
    status: OrderStatus | 'all';
    dateRange: [Date | null, Date | null];
    restaurantId: string | null;
  };

  setActiveOrders: (orders: Order[]) => void;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  setSelectedOrder: (order: Order | null) => void;
  setFilters: (filters: Partial<OrdersStore['filters']>) => void;
  addOrder: (order: Order) => void;
}

export const useOrdersStore = create<OrdersStore>((set) => ({
  activeOrders: [],
  selectedOrder: null,
  filters: {
    status: 'all',
    dateRange: [null, null],
    restaurantId: null,
  },

  setActiveOrders: (orders) => set({ activeOrders: orders }),

  updateOrderStatus: (orderId, status) =>
    set((state) => ({
      activeOrders: state.activeOrders.map((o) =>
        o.id === orderId ? { ...o, status } : o
      ),
      selectedOrder:
        state.selectedOrder?.id === orderId
          ? { ...state.selectedOrder, status }
          : state.selectedOrder,
    })),

  setSelectedOrder: (order) => set({ selectedOrder: order }),

  setFilters: (filters) =>
    set((state) => ({ filters: { ...state.filters, ...filters } })),

  addOrder: (order) =>
    set((state) => ({ activeOrders: [order, ...state.activeOrders] })),
}));
