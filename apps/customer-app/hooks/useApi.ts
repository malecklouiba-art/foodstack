import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001';

async function getToken(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem('auth_token');
  } catch {
    return null;
  }
}

function handleUnauthorized() {
  AsyncStorage.multiRemove(['auth_token', 'auth_refresh_token', 'auth_user']).catch(() => {});
  router.replace('/(auth)/login');
}

async function request<T>(
  method: 'GET' | 'POST' | 'PATCH',
  path: string,
  body?: unknown,
): Promise<T> {
  const token = await getToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (response.status === 401) {
    handleUnauthorized();
    throw new Error('Session expirée. Veuillez vous reconnecter.');
  }

  if (!response.ok) {
    const errorData = (await response.json().catch(() => ({}))) as { message?: string };
    throw new Error(errorData.message ?? `Erreur ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export function useApi() {
  return {
    get: <T>(url: string) => request<T>('GET', url),
    post: <T>(url: string, body: unknown) => request<T>('POST', url, body),
    patch: <T>(url: string, body: unknown) => request<T>('PATCH', url, body),
  };
}
