import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000';

async function getToken(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem('auth_token');
  } catch {
    return null;
  }
}

async function getRefreshToken(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem('auth_refresh_token');
  } catch {
    return null;
  }
}

async function clearSession(): Promise<void> {
  await Promise.all(['auth_token', 'auth_refresh_token', 'auth_user'].map((k) => AsyncStorage.removeItem(k))).catch(() => {});
  router.replace('/(auth)/login');
}

/**
 * Attempt to refresh the access token using the stored refresh token.
 * Returns the new access token on success, or null on failure.
 */
async function tryRefresh(): Promise<string | null> {
  try {
    const refreshToken = await getRefreshToken();
    if (!refreshToken) return null;

    const response = await fetch(`${API_URL}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) return null;

    const data = (await response.json()) as { token?: string; accessToken?: string };
    const newToken = data.token ?? data.accessToken ?? null;

    if (newToken) {
      await AsyncStorage.setItem('auth_token', newToken).catch(() => {});
    }

    return newToken;
  } catch {
    return null;
  }
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
    const newToken = await tryRefresh();
    if (newToken) {
      // Retry the original request with the refreshed token
      const retryHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${newToken}`,
      };
      const retryResponse = await fetch(`${API_URL}${path}`, {
        method,
        headers: retryHeaders,
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });

      if (retryResponse.status === 401) {
        await clearSession();
        throw new Error('Session expirée. Veuillez vous reconnecter.');
      }

      if (!retryResponse.ok) {
        const errorData = (await retryResponse.json().catch(() => ({}))) as { message?: string };
        throw new Error(errorData.message ?? `Erreur ${retryResponse.status}`);
      }

      return retryResponse.json() as Promise<T>;
    } else {
      await clearSession();
      throw new Error('Session expirée. Veuillez vous reconnecter.');
    }
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
