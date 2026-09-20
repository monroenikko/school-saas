'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthUser, LoginResponse } from '@school-saas/shared';
import { api } from '@/lib/api';
import { useAppDispatch } from '@/lib/redux';
import {
  setCredentials as setReduxCredentials,
  clearCredentials as clearReduxCredentials,
  setLoading as setReduxLoading,
} from '@/lib/redux/slices/auth-slice';

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, pass: string, tenantSlug?: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();
  const dispatch = useAppDispatch();

  const refreshProfile = async () => {
    try {
      const res = await api.get<AuthUser & { permissions: string[] }>('/api/auth/me');
      if (res.success && res.data) {
        setUser(res.data);
        dispatch(setReduxCredentials({ user: res.data }));
      } else {
        setUser(null);
        dispatch(clearReduxCredentials());
      }
    } catch {
      setUser(null);
      dispatch(clearReduxCredentials());
      api.setToken(null);
    } finally {
      setIsLoading(false);
      dispatch(setReduxLoading(false));
    }
  };

  useEffect(() => {
    const token = api.getToken();
    if (token) {
      refreshProfile();
    } else {
      setIsLoading(false);
      dispatch(setReduxLoading(false));
    }
  }, []);

  const login = async (email: string, pass: string, tenantSlug?: string) => {
    const res = await api.post<LoginResponse>('/api/auth/login', {
      email,
      password: pass,
      tenantSlug: tenantSlug || undefined,
    });

    if (res.success && res.data) {
      api.setToken(res.data.tokens.accessToken);
      setUser(res.data.user);
      dispatch(
        setReduxCredentials({
          user: res.data.user,
          token: res.data.tokens.accessToken,
        }),
      );
      router.push('/dashboard');
    }
  };

  const register = async (formData: any) => {
    const res = await api.post<LoginResponse>('/api/auth/register', formData);

    if (res.success && res.data) {
      api.setToken(res.data.tokens.accessToken);
      setUser(res.data.user);
      dispatch(
        setReduxCredentials({
          user: res.data.user,
          token: res.data.tokens.accessToken,
        }),
      );
      router.push('/dashboard');
    }
  };

  const logout = async () => {
    try {
      await api.post('/api/auth/logout');
    } catch {
      // Ignore failure on logout endpoint
    } finally {
      api.setToken(null);
      setUser(null);
      dispatch(clearReduxCredentials());
      router.push('/login');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        register,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
