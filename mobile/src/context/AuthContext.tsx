import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiFetch, saveToken, getToken, clearToken } from '../lib/api';
import { isBiometricAvailable, authenticateWithBiometrics } from '../lib/biometrics';

const BIOMETRIC_KEY = 'cincailah_biometric_enabled';

interface User {
  id: string;
  email: string;
  displayName: string;
}

interface AuthContextValue {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ error?: string }>;
  register: (email: string, password: string, displayName: string) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // On mount, check stored token; optionally gate behind biometrics
  useEffect(() => {
    (async () => {
      try {
        const stored = await getToken();
        if (stored) {
          // Check if biometric lock is enabled
          const biometricOn = await AsyncStorage.getItem(BIOMETRIC_KEY);
          if (biometricOn === 'true') {
            const available = await isBiometricAvailable();
            if (available) {
              const result = await authenticateWithBiometrics('Unlock Cincailah');
              if (!result.success) {
                // Biometric failed — stay on auth screen
                setLoading(false);
                return;
              }
            }
          }

          const { data, ok } = await apiFetch<{ session?: User }>('/api/auth/session', { token: stored });
          if (ok && data.session) {
            setToken(stored);
            setUser(data.session as User);
          } else {
            await clearToken();
          }
        }
      } catch {
        // network error on startup — stay logged out
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const { data, ok } = await apiFetch<{ token?: string; error?: string; user?: User }>(
        '/api/auth/token',
        { method: 'POST', body: { email, password } }
      );
      if (!ok || !data.token) {
        return { error: (data as any).error || 'Login failed' };
      }
      await saveToken(data.token);
      setToken(data.token);
      // Fetch full session
      const sess = await apiFetch<{ session?: User }>('/api/auth/session', { token: data.token });
      if (sess.ok && sess.data.session) setUser(sess.data.session as User);
      return {};
    } catch {
      return { error: 'Network error. Check your connection.' };
    }
  }, []);

  const register = useCallback(async (email: string, password: string, displayName: string) => {
    try {
      const { data, ok } = await apiFetch<{ error?: string }>(
        '/api/auth/register',
        { method: 'POST', body: { email, password, displayName } }
      );
      if (!ok) return { error: (data as any).error || 'Registration failed' };
      // Auto-login after register
      return login(email, password);
    } catch {
      return { error: 'Network error. Check your connection.' };
    }
  }, [login]);

  const logout = useCallback(async () => {
    await clearToken();
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
