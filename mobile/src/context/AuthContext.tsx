import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { apiFetch, saveToken, getToken, clearToken } from '../lib/api';
import { isBiometricAvailable, authenticateWithBiometrics } from '../lib/biometrics';
import { clearGuestDataAfterMigration, hasPendingGuestData, migrateGuestDataToServer } from '../lib/guestMigration';
import { GUEST_FLAG_KEY } from '../lib/guestStorage';

const BIOMETRIC_KEY = 'cincailah_biometric_enabled';

interface User {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string | null;
  emailVerified?: boolean;
}

interface AuthContextValue {
  user: User | null;
  token: string | null;
  mode: 'guest' | 'authed' | null;
  loading: boolean;
  continueAsGuest: () => Promise<void>;
  login: (email: string, password: string) => Promise<{ error?: string }>;
  register: (email: string, password: string, displayName: string) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [mode, setMode] = useState<'guest' | 'authed' | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const storedGuest = await AsyncStorage.getItem(GUEST_FLAG_KEY);
        const stored = await getToken();
        if (storedGuest === 'true' && !stored) {
          setMode('guest');
        }
        if (stored) {
          const biometricOn = await AsyncStorage.getItem(BIOMETRIC_KEY);
          if (biometricOn === 'true') {
            const available = await isBiometricAvailable();
            if (available) {
              const result = await authenticateWithBiometrics('Unlock Cincailah');
              if (!result.success) {
                setLoading(false);
                return;
              }
            }
          }

          const { data, ok } = await apiFetch<{ session?: User }>('/api/auth/session', { token: stored });
          if (ok && data.session) {
            setToken(stored);
            setUser(data.session as User);
            setMode('authed');
          } else {
            await clearToken();
          }
        }
      } catch {
        // stay on auth screen
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const continueAsGuest = useCallback(async () => {
    await AsyncStorage.setItem(GUEST_FLAG_KEY, 'true');
    setMode('guest');
  }, []);

  const maybePromptGuestMigration = useCallback(async () => {
    if (!(await hasPendingGuestData())) return;
    Alert.alert(
      'Upload guest data?',
      'Upload your saved favourites and spin history to your account?',
      [
        { text: 'Keep local only', style: 'cancel' },
        {
          text: 'Upload',
          onPress: async () => {
            try {
              await migrateGuestDataToServer();
              await clearGuestDataAfterMigration();
            } catch {
              // keep local data intact on failure
            }
          },
        },
      ]
    );
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const res = await apiFetch<{ token?: string; error?: string; user?: User }>('/api/auth/token', {
        method: 'POST',
        body: { email, password },
      });
      const { data, ok, status, networkError } = res;
      console.log('[auth/login] /api/auth/token', {
        ok,
        status,
        networkError: networkError ?? false,
        hasToken: Boolean((data as { token?: string }).token),
      });
      if (!ok || !data.token) {
        return { error: (data as { error?: string }).error || 'Login failed' };
      }
      await saveToken(data.token);
      setToken(data.token);

      const tokenPayload = data as {
        token: string;
        user?: { id: string; email: string; displayName: string; emailVerified?: boolean; avatarUrl?: string | null };
      };

      const sess = await apiFetch<{ session?: User }>('/api/auth/session', { token: data.token });
      console.log('[auth/login] /api/auth/session', {
        ok: sess.ok,
        status: sess.status,
        networkError: sess.networkError ?? false,
        hasSession: Boolean(sess.data.session),
      });

      // Prefer GET /api/auth/session (JWT-aware). Fall back to user embedded in POST /api/auth/token.
      const sessionUser =
        sess.ok && sess.data.session
          ? (sess.data.session as User)
          : tokenPayload.user
            ? ({
                id: tokenPayload.user.id,
                email: tokenPayload.user.email,
                displayName: tokenPayload.user.displayName,
                emailVerified: tokenPayload.user.emailVerified,
                avatarUrl: tokenPayload.user.avatarUrl ?? null,
              } satisfies User)
            : null;

      if (sessionUser) {
        setUser(sessionUser);
        setMode('authed');
        await AsyncStorage.removeItem(GUEST_FLAG_KEY);
        await maybePromptGuestMigration();
        return {};
      }

      await clearToken();
      setToken(null);
      return { error: 'Could not load your profile. Try again.' };
    } catch {
      return { error: 'Network error. Check your connection.' };
    }
  }, [maybePromptGuestMigration]);

  const register = useCallback(async (email: string, password: string, displayName: string) => {
    try {
      const { data, ok } = await apiFetch<{ error?: string }>('/api/auth/register', {
        method: 'POST',
        body: { email, password, displayName },
      });
      if (!ok) return { error: (data as any).error || 'Registration failed' };
      return login(email, password);
    } catch {
      return { error: 'Network error. Check your connection.' };
    }
  }, [login]);

  const logout = useCallback(async () => {
    await clearToken();
    setToken(null);
    setUser(null);
    setMode(null);
    await AsyncStorage.removeItem(GUEST_FLAG_KEY);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, mode, loading, continueAsGuest, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
