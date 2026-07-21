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

const LOCAL_USER_KEY = "melo.demo.user";

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
        const raw = window.localStorage.getItem(LOCAL_USER_KEY);
        if (raw) setUser(JSON.parse(raw) as AuthResult["user"]);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback(async (identifier: string, password: string) => {
    try {
      const result = await apiLogin({ identifier, password });
      setUser(result.user);
    } catch (error) {
      if (isNetworkError(error)) {
        const demoUser = {
          id: "demo-local-user",
          displayName: identifier.split("@")[0] || "Melo 创作者",
          email: identifier,
          role: "USER",
          avatarKey: null,
        };
        window.localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(demoUser));
        setUser(demoUser);
        return;
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
        const demoUser = {
          id: "demo-local-user",
          displayName,
          email,
          role: "USER",
          avatarKey: null,
        };
        window.localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(demoUser));
        setUser(demoUser);
        return;
      }
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    let unexpectedError: unknown;
    await apiLogout().catch((error) => {
      if (!isNetworkError(error)) unexpectedError = error;
    });
    setUser(null);
    setApiToken(null);
    window.localStorage.removeItem(LOCAL_USER_KEY);
    if (unexpectedError) throw unexpectedError;
  }, []);

  return <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
