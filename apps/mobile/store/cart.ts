import { create } from 'zustand';

export interface CartItem {
  menuItemId: string;
  name: string;
  price: number;
  qty: number;
  restaurantId: string;
  restaurantName: string;
}

interface CartState {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'qty'>) => void;
  removeItem: (menuItemId: string) => void;
  updateQty: (menuItemId: string, qty: number) => void;
  clearCart: () => void;
  total: () => number;
  itemCount: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],

  addItem: (item) => {
    const existing = get().items.find((i) => i.menuItemId === item.menuItemId);
    if (existing) {
      get().updateQty(item.menuItemId, existing.qty + 1);
    } else {
      set((s) => ({ items: [...s.items, { ...item, qty: 1 }] }));
    }
  },

  removeItem: (menuItemId) => {
    set((s) => ({ items: s.items.filter((i) => i.menuItemId !== menuItemId) }));
  },

  updateQty: (menuItemId, qty) => {
    if (qty <= 0) {
      get().removeItem(menuItemId);
      return;
    }
    set((s) => ({
      items: s.items.map((i) => (i.menuItemId === menuItemId ? { ...i, qty } : i)),
    }));
  },

  clearCart: () => set(() => ({ items: [] })),

  total: () => get().items.reduce((sum, i) => sum + i.price * i.qty, 0),

  itemCount: () => get().items.reduce((sum, i) => sum + i.qty, 0),
}));
