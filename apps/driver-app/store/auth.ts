import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'driver-auth';
const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001';

export interface Driver {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  driver: Driver | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthActions {
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
  loadStoredAuth: () => Promise<void>;
}

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>((set, get) => ({
  token: null,
  refreshToken: null,
  driver: null,
  isLoading: false,
  isAuthenticated: false,

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const response = await fetch(`${API_URL}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        const message: string =
          typeof errorBody === 'object' && errorBody !== null && 'message' in errorBody
            ? String((errorBody as { message: unknown }).message)
            : 'Identifiants incorrects';
        throw new Error(message);
      }

      const data = (await response.json()) as {
        accessToken: string;
        refreshToken: string;
        user: Driver;
      };

      const stored = JSON.stringify({
        token: data.accessToken,
        refreshToken: data.refreshToken,
        driver: data.user,
      });
      await AsyncStorage.setItem(STORAGE_KEY, stored);

      set({
        token: data.accessToken,
        refreshToken: data.refreshToken,
        driver: data.user,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  logout: async () => {
    await AsyncStorage.removeItem(STORAGE_KEY);
    set({
      token: null,
      refreshToken: null,
      driver: null,
      isAuthenticated: false,
    });
  },

  refreshAuth: async () => {
    const { refreshToken } = get();
    if (!refreshToken) return;

    try {
      const response = await fetch(`${API_URL}/api/v1/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        await get().logout();
        return;
      }

      const data = (await response.json()) as {
        accessToken: string;
        refreshToken: string;
      };

      const stored = JSON.stringify({
        token: data.accessToken,
        refreshToken: data.refreshToken,
        driver: get().driver,
      });
      await AsyncStorage.setItem(STORAGE_KEY, stored);

      set({ token: data.accessToken, refreshToken: data.refreshToken });
    } catch {
      await get().logout();
    }
  },

  loadStoredAuth: async () => {
    set({ isLoading: true });
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (!raw) {
        set({ isLoading: false, isAuthenticated: false });
        return;
      }

      const parsed = JSON.parse(raw) as {
        token: string;
        refreshToken: string;
        driver: Driver;
      };

      let meResponse: Response;
      try {
        // Verify the stored token is still valid
        meResponse = await fetch(`${API_URL}/api/v1/auth/me`, {
          headers: { Authorization: `Bearer ${parsed.token}` },
        });
      } catch {
        // Network unavailable — keep stored token and work offline
        set({
          token: parsed.token,
          refreshToken: parsed.refreshToken,
          driver: parsed.driver,
          isAuthenticated: true,
          isLoading: false,
        });
        return;
      }

      if (meResponse.ok) {
        const user = (await meResponse.json()) as Driver;
        set({
          token: parsed.token,
          refreshToken: parsed.refreshToken,
          driver: user,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        // Token may be expired — try refresh
        set({ token: parsed.token, refreshToken: parsed.refreshToken, driver: parsed.driver });
        await get().refreshAuth();
        set({ isLoading: false });
      }
    } catch {
      set({ isLoading: false, isAuthenticated: false });
    }
  },
}));
