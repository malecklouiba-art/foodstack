import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';

export type UserRole = 'super_admin' | 'restaurant_owner' | 'staff' | 'driver' | 'customer';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  restaurantIds?: string[];
  loyaltyPoints?: number;
}

interface AuthStore {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  setUser: (user: User, token: string) => void;
  clearAuth: () => void;
  updateUser: (partial: Partial<User>) => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthStore>()(
  devtools(
    persist(
      (set) => ({
        user: null,
        accessToken: null,
        isAuthenticated: false,
        isLoading: false,

        setUser: (user, token) =>
          set({ user, accessToken: token, isAuthenticated: true }),

        clearAuth: () =>
          set({ user: null, accessToken: null, isAuthenticated: false }),

        updateUser: (partial) =>
          set((state) => ({
            user: state.user ? { ...state.user, ...partial } : null,
          })),

        setLoading: (loading) => set({ isLoading: loading }),
      }),
      { name: 'foodstack-auth', partialize: (s) => ({ user: s.user, accessToken: s.accessToken, isAuthenticated: s.isAuthenticated }) }
    ),
    { name: 'AuthStore' }
  )
);
