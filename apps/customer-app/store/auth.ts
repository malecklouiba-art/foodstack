import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001';

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
  loadStoredAuth: () => Promise<void>;
}

async function persistAuth(token: string, refreshToken: string, user: User) {
  await AsyncStorage.multiSet([
    ['auth_token', token],
    ['auth_refresh_token', refreshToken],
    ['auth_user', JSON.stringify(user)],
  ]);
}

async function clearPersistedAuth() {
  await AsyncStorage.multiRemove(['auth_token', 'auth_refresh_token', 'auth_user']);
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

      const data = (await response.json()) as { accessToken: string; refreshToken: string; user: User };
      await persistAuth(data.accessToken, data.refreshToken, data.user);
      set({
        user: data.user,
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

      const data = (await response.json()) as { accessToken: string; refreshToken: string; user: User };
      await persistAuth(data.accessToken, data.refreshToken, data.user);
      set({
        user: data.user,
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

  loadStoredAuth: async () => {
    set({ isLoading: true });
    try {
      const results = await AsyncStorage.multiGet(['auth_token', 'auth_refresh_token', 'auth_user']);
      const token = results[0][1];
      const refreshToken = results[1][1];
      const userRaw = results[2][1];

      if (token && refreshToken && userRaw) {
        const user = JSON.parse(userRaw) as User;
        set({ user, token, refreshToken, isAuthenticated: true, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },
}));
