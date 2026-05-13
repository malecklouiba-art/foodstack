import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'foodstack_token';
const USER_KEY = 'foodstack_user';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  setAuth: (user: User, token: string) => Promise<void>;
  logout: () => Promise<void>;
  loadFromStorage: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,

  setAuth: async (user: User, token: string) => {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
    set({ user, token });
  },

  logout: async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);
    set({ user: null, token: null });
  },

  loadFromStorage: async () => {
    const token = await SecureStore.getItemAsync(TOKEN_KEY);
    const userRaw = await SecureStore.getItemAsync(USER_KEY);
    if (token && userRaw) {
      const user = JSON.parse(userRaw) as User;
      set({ user, token });
    }
  },
}));
