import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

interface CreateOrderDto {
  restaurantId: string;
  customerId: string;
  items: { menuItemId: string; quantity: number; unitPrice: number }[];
  deliveryAddress?: string;
}

interface Order {
  id: string;
  status: string;
  [key: string]: unknown;
}

interface CartStore {
  items: CartItem[];
  restaurantId: string | null;
  deliveryFee: number;
  setDeliveryFee: (fee: number) => void;
  add: (item: Omit<CartItem, 'quantity'>, restaurantId: string) => void;
  remove: (id: string) => void;
  increment: (id: string) => void;
  decrement: (id: string) => void;
  clear: () => void;
  clearCart: () => void;
  total: () => number;
  count: () => number;
  checkout: (deliveryAddress?: string) => Promise<Order>;
}

async function getToken(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem('auth_token');
  } catch {
    return null;
  }
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  restaurantId: null,
  deliveryFee: 2.90,

  setDeliveryFee: (fee) => set({ deliveryFee: fee }),

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

  clear: () => set({ items: [], restaurantId: null, deliveryFee: 2.90 }),

  // Alias for clear — explicit name for checkout flows
  clearCart: () => set({ items: [], restaurantId: null, deliveryFee: 2.90 }),

  total: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),

  count: () => get().items.reduce((sum, i) => sum + i.quantity, 0),

  checkout: async (deliveryAddress?: string) => {
    const { items, restaurantId } = get();

    if (items.length === 0) throw new Error('Le panier est vide.');
    if (!restaurantId) throw new Error('Aucun restaurant sélectionné.');

    const token = await getToken();
    const userRaw = await AsyncStorage.getItem('auth_user');
    if (!userRaw) throw new Error('Utilisateur non connecté.');

    const user = JSON.parse(userRaw) as { id: string };

    const dto: CreateOrderDto = {
      restaurantId,
      customerId: user.id,
      items: items.map((i) => ({
        menuItemId: i.id,
        quantity: i.quantity,
        unitPrice: i.price,
      })),
    };
    if (deliveryAddress) dto.deliveryAddress = deliveryAddress;

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(`${API_URL}/api/v1/orders`, {
      method: 'POST',
      headers,
      body: JSON.stringify(dto),
    });

    if (!response.ok) {
      const errorData = (await response.json().catch(() => ({}))) as { message?: string };
      throw new Error(errorData.message ?? `Erreur ${response.status}`);
    }

    const order = (await response.json()) as Order;

    // Clear cart after successful checkout
    set({ items: [], restaurantId: null, deliveryFee: 2.90 });

    return order;
  },
}));
