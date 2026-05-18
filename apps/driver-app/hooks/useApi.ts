import { useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000';
const STORAGE_KEY = 'driver-auth';

async function getToken(): Promise<string | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { token?: string };
    return parsed.token ?? null;
  } catch {
    return null;
  }
}

async function buildHeaders(): Promise<Record<string, string>> {
  const token = await getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export function useApi() {
  const get = useCallback(async <T>(path: string): Promise<T> => {
    const headers = await buildHeaders();
    const response = await fetch(`${API_URL}${path}`, { headers });
    if (!response.ok) {
      throw new Error(`GET ${path} failed with status ${response.status}`);
    }
    return response.json() as Promise<T>;
  }, []);

  const post = useCallback(async <T>(path: string, body: unknown): Promise<T> => {
    const headers = await buildHeaders();
    const response = await fetch(`${API_URL}${path}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      throw new Error(`POST ${path} failed with status ${response.status}`);
    }
    return response.json() as Promise<T>;
  }, []);

  const patch = useCallback(async <T>(path: string, body: unknown): Promise<T> => {
    const headers = await buildHeaders();
    const response = await fetch(`${API_URL}${path}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      throw new Error(`PATCH ${path} failed with status ${response.status}`);
    }
    return response.json() as Promise<T>;
  }, []);

  return { get, post, patch };
}
