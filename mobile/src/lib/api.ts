/**
 * Shared API client — points at the Cincailah web server.
 * Reads apiUrl from app.json extra (set per-environment in eas.json).
 */

import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

const BASE_URL: string =
  (Constants.expoConfig?.extra?.apiUrl as string | undefined) ||
  'https://cincailah.suntzutechnologies.com';

const TOKEN_KEY = 'cincailah_jwt';

export async function saveToken(token: string) {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function getToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function clearToken() {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

export type ApiResult<T = unknown> = {
  data: T;
  status: number;
  ok: boolean;
  networkError?: boolean;
};

type FetchOptions = {
  method?: string;
  body?: object;
  token?: string | null;
  timeoutMs?: number;
};

/**
 * Thin fetch wrapper.
 * - Attaches Bearer auth header automatically.
 * - Applies a configurable timeout (default 15 s).
 * - Returns `networkError: true` on fetch/timeout failures instead of throwing,
 *   so callers can show "no connection" UI without try/catch everywhere.
 */
export async function apiFetch<T = unknown>(
  path: string,
  options: FetchOptions = {}
): Promise<ApiResult<T>> {
  const { method = 'GET', body, timeoutMs = 15_000 } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  const storedToken = options.token !== undefined ? options.token : await getToken();
  if (storedToken) {
    headers['Authorization'] = `Bearer ${storedToken}`;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    let data: T;
    try {
      data = (await res.json()) as T;
    } catch {
      data = {} as T;
    }

    return { data, status: res.status, ok: res.ok };
  } catch {
    // AbortError = timeout; TypeError = no network
    return {
      data: {} as T,
      status: 0,
      ok: false,
      networkError: true,
    };
  } finally {
    clearTimeout(timer);
  }
}
