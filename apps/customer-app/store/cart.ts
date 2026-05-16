import { create } from 'zustand';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

interface CartStore {
  items: CartItem[];
  restaurantId: string | null;
  add: (item: Omit<CartItem, 'quantity'>, restaurantId: string) => void;
  remove: (id: string) => void;
  increment: (id: string) => void;
  decrement: (id: string) => void;
  clear: () => void;
  total: () => number;
  count: () => number;
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  restaurantId: null,

  add: (item, restaurantId) => {
    set((state) => {
      // Clear cart if switching restaurant
      const currentItems = state.restaurantId && state.restaurantId !== restaurantId ? [] : state.items;
      const existing = currentItems.find((i) => i.id === item.id);
      return {
        restaurantId,
        items: existing
          ? currentItems.map((i) => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i)
          : [...currentItems, { ...item, quantity: 1 }],
      };
    });
  },

  remove: (id) => set((state) => ({ items: state.items.filter((i) => i.id !== id) })),

  increment: (id) =>
    set((state) => ({
      items: state.items.map((i) => i.id === id ? { ...i, quantity: i.quantity + 1 } : i),
    })),

  decrement: (id) =>
    set((state) => ({
      items: state.items
        .map((i) => i.id === id ? { ...i, quantity: i.quantity - 1 } : i)
        .filter((i) => i.quantity > 0),
    })),

  clear: () => set({ items: [], restaurantId: null }),

  total: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),

  count: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
}));
