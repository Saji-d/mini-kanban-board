'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { apiClient } from './api-client';
import type { AuthResponse, User } from '@/types/api';

const STORAGE_KEY = 'kanban_auth';

interface StoredAuth {
  token: string;
  user: User;
}

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function readStoredAuth(): StoredAuth | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredAuth) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = readStoredAuth();
    if (stored) {
      setUser(stored.user);
      setToken(stored.token);
    }
    setIsLoading(false);
  }, []);

  const persist = useCallback((auth: AuthResponse) => {
    setUser(auth.user);
    setToken(auth.accessToken);
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ token: auth.accessToken, user: auth.user }),
    );
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const auth = await apiClient.post<AuthResponse>('/auth/login', { email, password });
      persist(auth);
    },
    [persist],
  );

  const register = useCallback(
    async (email: string, password: string, name: string) => {
      const auth = await apiClient.post<AuthResponse>('/auth/register', { email, password, name });
      persist(auth);
    },
    [persist],
  );

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    window.localStorage.removeItem(STORAGE_KEY);
  }, []);

  const value = useMemo(
    () => ({ user, token, isLoading, login, register, logout }),
    [user, token, isLoading, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
