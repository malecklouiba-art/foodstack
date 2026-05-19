import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  loyaltyPoints?: number;
  loyaltyTier?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, phone?: string) => Promise<void>;
  logout: () => void;
  refreshAuth: () => Promise<void>;
  loadStoredAuth: () => Promise<void>;
}

async function persistAuth(token: string, refreshToken: string, user: User) {
  await AsyncStorage.setItem('auth_token', token);
  await AsyncStorage.setItem('auth_refresh_token', refreshToken);
  await AsyncStorage.setItem('auth_user', JSON.stringify(user));
}

async function clearPersistedAuth() {
  await AsyncStorage.removeItem('auth_token');
  await AsyncStorage.removeItem('auth_refresh_token');
  await AsyncStorage.removeItem('auth_user');
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  refreshToken: null,
  isLoading: false,
  isAuthenticated: false,

  login: async (email: string, password: string) => {
    set({ isLoading: true });
    try {
      const response = await fetch(`${API_URL}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = (await response.json().catch(() => ({}))) as { message?: string };
        throw new Error(errorData.message ?? 'Identifiants incorrects.');
      }

      const data = (await response.json()) as { accessToken: string; refreshToken: string; user: any };
      const user: User = {
        id: data.user.id,
        email: data.user.email,
        name: data.user.name ?? [data.user.firstName, data.user.lastName].filter(Boolean).join(' ') || data.user.email,
        role: data.user.role,
        loyaltyPoints: data.user.loyaltyPoints,
        loyaltyTier: data.user.loyaltyTier,
      };
      await persistAuth(data.accessToken, data.refreshToken, user);
      set({
        user,
        token: data.accessToken,
        refreshToken: data.refreshToken,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  register: async (name: string, email: string, password: string, phone?: string) => {
    set({ isLoading: true });
    try {
      const body: { name: string; email: string; password: string; role: string; phone?: string } = {
        name,
        email,
        password,
        role: 'customer',
      };
      if (phone) body.phone = phone;

      const response = await fetch(`${API_URL}/api/v1/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = (await response.json().catch(() => ({}))) as { message?: string };
        throw new Error(errorData.message ?? 'Erreur lors de la création du compte.');
      }

      const data = (await response.json()) as { accessToken: string; refreshToken: string; user: any };
      const user: User = {
        id: data.user.id,
        email: data.user.email,
        name: data.user.name ?? [data.user.firstName, data.user.lastName].filter(Boolean).join(' ') || data.user.email,
        role: data.user.role,
        loyaltyPoints: data.user.loyaltyPoints,
        loyaltyTier: data.user.loyaltyTier,
      };
      await persistAuth(data.accessToken, data.refreshToken, user);
      set({
        user,
        token: data.accessToken,
        refreshToken: data.refreshToken,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: () => {
    clearPersistedAuth().catch(() => {});
    set({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
    });
  },

  refreshAuth: async () => {
    const { refreshToken, logout } = useAuthStore.getState();
    if (!refreshToken) {
      logout();
      return;
    }
    try {
      const response = await fetch(`${API_URL}/api/v1/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      if (!response.ok) {
        logout();
        return;
      }
      const data = (await response.json()) as { accessToken: string; refreshToken: string; user: User };
      await persistAuth(data.accessToken, data.refreshToken, data.user);
      set({
        user: data.user,
        token: data.accessToken,
        refreshToken: data.refreshToken,
        isAuthenticated: true,
      });
    } catch {
      logout();
    }
  },

  loadStoredAuth: async () => {
    set({ isLoading: true });
    try {
      const token = await AsyncStorage.getItem('auth_token');
      const refreshToken = await AsyncStorage.getItem('auth_refresh_token');
      const userRaw = await AsyncStorage.getItem('auth_user');

      if (token && refreshToken && userRaw) {
        const user = JSON.parse(userRaw) as User;
        // Restore state optimistically so the app is usable immediately
        set({ user, token, refreshToken, isAuthenticated: true, isLoading: false });

        // Validate token against server
        try {
          const res = await fetch(`${API_URL}/api/v1/auth/me`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!res.ok) {
            // Token invalid — attempt refresh before forcing logout
            await useAuthStore.getState().refreshAuth();
          }
        } catch {
          // Network unavailable — keep stored session, app will work offline
        }
      } else {
        set({ isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },
}));
