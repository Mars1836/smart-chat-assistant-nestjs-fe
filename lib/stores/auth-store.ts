"use client";

import { create } from "zustand";
import { useEffect } from "react";
import { tokenStorage } from "../api/token-storage";
import { authApi } from "../api/auth/auth-api";

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, redirectUrl?: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  isLoading: true,

  checkAuth: () => {
    const hasTokens = tokenStorage.hasTokens();
    set({ isAuthenticated: hasTokens, isLoading: false });
  },

  login: async (email: string, password: string, redirectUrl?: string) => {
    try {
      const response = await authApi.login({ email, password });

      // Store tokens
      tokenStorage.setAccessToken(response.accessToken);
      tokenStorage.setRefreshToken(response.refreshToken);

      set({ isAuthenticated: true });

      // Redirect to provided URL or default to workspace selection
      if (typeof window !== "undefined") {
        window.location.href = redirectUrl || "/workspace";
      }
    } catch (error) {
      // Re-throw error so it can be caught by the login page
      throw error;
    }
  },

  logout: () => {
    tokenStorage.clearTokens();
    set({ isAuthenticated: false });

    if (typeof window !== "undefined") {
      window.location.href = "/";
    }
  },
}));

// Hook để check auth khi component mount
export function useAuth() {
  const store = useAuthStore();

  useEffect(() => {
    if (store.isLoading) {
      store.checkAuth();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return store;
}
