import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';

export interface CartItem {
  id: string;
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  modifiers?: CartModifier[];
  notes?: string;
  restaurantId: string;
}

interface CartModifier {
  id: string;
  name: string;
  price: number;
}

interface CartStore {
  items: CartItem[];
  restaurantId: string | null;
  promoCode: string | null;
  promoDiscount: number;

  addItem: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  applyPromoCode: (code: string, discount: number) => void;
  removePromoCode: () => void;

  subtotal: () => number;
  deliveryFee: () => number;
  tax: () => number;
  total: () => number;
}

export const useCartStore = create<CartStore>()(
  devtools(
    persist(
      (set, get) => ({
        items: [],
        restaurantId: null,
        promoCode: null,
        promoDiscount: 0,

        addItem: (item) => {
          const { items, restaurantId } = get();

          if (restaurantId && restaurantId !== item.restaurantId) {
            if (!confirm('Votre panier contient des articles d\'un autre restaurant. Vider le panier?')) {
              return;
            }
            set({ items: [], restaurantId: item.restaurantId });
          }

          const existing = items.find(
            (i) =>
              i.menuItemId === item.menuItemId &&
              JSON.stringify(i.modifiers) === JSON.stringify(item.modifiers)
          );

          if (existing) {
            set({
              items: items.map((i) =>
                i.id === existing.id
                  ? { ...i, quantity: i.quantity + (item.quantity ?? 1) }
                  : i
              ),
            });
          } else {
            set({
              items: [...items, { ...item, quantity: item.quantity ?? 1 }],
              restaurantId: item.restaurantId,
            });
          }
        },

        removeItem: (id) => {
          set((state) => ({
            items: state.items.filter((i) => i.id !== id),
            restaurantId: state.items.length === 1 ? null : state.restaurantId,
          }));
        },

        updateQuantity: (id, quantity) => {
          if (quantity <= 0) {
            get().removeItem(id);
            return;
          }
          set((state) => ({
            items: state.items.map((i) => (i.id === id ? { ...i, quantity } : i)),
          }));
        },

        clearCart: () => set({ items: [], restaurantId: null, promoCode: null, promoDiscount: 0 }),

        applyPromoCode: (code, discount) => set({ promoCode: code, promoDiscount: discount }),

        removePromoCode: () => set({ promoCode: null, promoDiscount: 0 }),

        subtotal: () => {
          const { items } = get();
          return items.reduce((acc, item) => {
            const modifiersTotal = item.modifiers?.reduce((m, mod) => m + mod.price, 0) ?? 0;
            return acc + (item.price + modifiersTotal) * item.quantity;
          }, 0);
        },

        deliveryFee: () => {
          const subtotal = get().subtotal();
          return subtotal >= 30 ? 0 : 2.99;
        },

        tax: () => {
          return get().subtotal() * 0.1;
        },

        total: () => {
          const { subtotal, deliveryFee, tax, promoDiscount } = get();
          return subtotal() + deliveryFee() + tax() - promoDiscount;
        },
      }),
      { name: 'foodstack-cart' }
    ),
    { name: 'CartStore' }
  )
);
