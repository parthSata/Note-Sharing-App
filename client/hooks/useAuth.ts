import { api } from '@/lib/api';

interface User {
  id: string;
  email: string;
}

interface AuthResponse {
  success: boolean;
  token: string;
  user: User;
}

interface MeResponse {
  success: boolean;
  user: User;
}

export function useAuth() {
  const login = async (email: string, password: string): Promise<User> => {
    const data = await api.post<AuthResponse>('/auth/login', {
      email,
      password,
    });
    localStorage.setItem('auth_token', data.token);
    localStorage.setItem('auth_user', JSON.stringify(data.user));
    return data.user;
  };

  const register = async (email: string, password: string): Promise<User> => {
    const data = await api.post<AuthResponse>('/auth/register', {
      email,
      password,
    });
    localStorage.setItem('auth_token', data.token);
    localStorage.setItem('auth_user', JSON.stringify(data.user));
    return data.user;
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {}
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
  };

  const getUser = (): User | null => {
    if (typeof window === 'undefined') return null;
    const raw = localStorage.getItem('auth_user');
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  };

  const isLoggedIn = (): boolean => {
    if (typeof window === 'undefined') return false;
    return !!localStorage.getItem('auth_token');
  };

  const me = async (): Promise<User> => {
    const data = await api.get<MeResponse>('/auth/me');
    return data.user;
  };

  return { login, register, logout, getUser, isLoggedIn, me };
}
