"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import {
  setAccessToken as setApiToken,
  login as apiLogin,
  register as apiRegister,
  logout as apiLogout,
  refreshToken,
  type AuthResult,
} from "@/lib/api/client";
import { isNetworkError } from "@/lib/fallback/catalog";

interface AuthState {
  user: AuthResult["user"] | null;
  isLoading: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState>({
  user: null,
  isLoading: true,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthResult["user"] | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    refreshToken()
      .then((result) => setUser(result.user))
      .catch(() => {
        setApiToken(null);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback(async (identifier: string, password: string) => {
    try {
      const result = await apiLogin({ identifier, password });
      setUser(result.user);
    } catch (error) {
      if (isNetworkError(error)) {
        throw new Error("\u767b\u5f55\u670d\u52a1\u6682\u65f6\u4e0d\u53ef\u7528\uff0c\u8bf7\u7a0d\u540e\u518d\u8bd5\u3002");
      }
      throw error;
    }
  }, []);

  const register = useCallback(async (email: string, password: string, displayName: string) => {
    try {
      const result = await apiRegister({ email, password, displayName });
      setUser(result.user);
    } catch (error) {
      if (isNetworkError(error)) {
        throw new Error("\u6ce8\u518c\u670d\u52a1\u6682\u65f6\u4e0d\u53ef\u7528\uff0c\u8bf7\u7a0d\u540e\u518d\u8bd5\u3002");
      }
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    await apiLogout().catch((error) => {
      if (!isNetworkError(error)) throw error;
    });
    setUser(null);
    setApiToken(null);
  }, []);

  return <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
