import { createContext, PropsWithChildren, useContext, useMemo, useState } from 'react';
import { api } from '../api/client';
import { AuthResponse, Role } from '../types';

interface AuthState {
  user: AuthResponse | null;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: { fullName: string; email: string; password: string; role: Role }) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<AuthResponse | null>(() => {
    const raw = localStorage.getItem('securewatch_user');
    return raw ? JSON.parse(raw) : null;
  });

  const persist = (auth: AuthResponse) => {
    localStorage.setItem('securewatch_token', auth.token);
    localStorage.setItem('securewatch_refresh_token', auth.refreshToken);
    localStorage.setItem('securewatch_user', JSON.stringify(auth));
    setUser(auth);
  };

  const value = useMemo<AuthState>(() => ({
    user,
    async login(email, password) {
      const { data } = await api.post<AuthResponse>('/auth/login', { email, password });
      persist(data);
    },
    async register(payload) {
      const { data } = await api.post<AuthResponse>('/auth/register', payload);
      persist(data);
    },
    logout() {
      api.post('/auth/logout').catch(() => undefined);
      localStorage.removeItem('securewatch_token');
      localStorage.removeItem('securewatch_refresh_token');
      localStorage.removeItem('securewatch_user');
      setUser(null);
    },
  }), [user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }

  return context;
}
