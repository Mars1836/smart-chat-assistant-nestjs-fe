"use client";

import { create } from "zustand";
import { useEffect } from "react";
import { tokenStorage } from "../api/token-storage";
import { authApi, type AuthResponse, type ProfileResponse } from "../api/auth/auth-api";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  system_role: string | null;
}

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  /** system_role === "admin" – quản trị toàn hệ thống */
  isSystemAdmin: boolean;
  /** Thông tin user từ login/profile (id, name, email, system_role) */
  user: AuthUser | null;
  /** Cập nhật state từ response login/register (có system_role) – dùng cho signup hoặc khi đã có token */
  setFromAuthResponse: (response: AuthResponse) => void;
  login: (email: string, password: string, redirectUrl?: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  isLoading: true,
  isSystemAdmin: false,
  user: null,

  setFromAuthResponse: (response: AuthResponse) => {
    const isSystemAdmin = response.system_role === "admin";
    set({
      isAuthenticated: true,
      isLoading: false,
      isSystemAdmin,
      user: {
        id: response.id,
        name: response.name,
        email: response.email,
        system_role: response.system_role,
      },
    });
  },

  checkAuth: async () => {
    try {
      if (!tokenStorage.hasTokens()) {
        const accessToken = await authApi.refreshToken();
        tokenStorage.setAccessToken(accessToken);
      }

      const profile: ProfileResponse = await authApi.getProfile();
      const isSystemAdmin = profile.system_role === "admin";
      set({
        isAuthenticated: true,
        isLoading: false,
        isSystemAdmin,
        user: { id: profile.id, name: profile.name, email: profile.email, system_role: profile.system_role },
      });
    } catch {
      tokenStorage.clearTokens();
      set({ isAuthenticated: false, isLoading: false, isSystemAdmin: false, user: null });
    }
  },

  login: async (email: string, password: string, redirectUrl?: string) => {
    try {
      const response = await authApi.login({ email, password });

      tokenStorage.setAccessToken(response.accessToken);

      // BE trả luôn id, name, email, system_role trong response login – không cần gọi GET /profile
      const isSystemAdmin = response.system_role === "admin";
      const user: AuthUser = {
        id: response.id,
        name: response.name,
        email: response.email,
        system_role: response.system_role,
      };
      set({ isAuthenticated: true, isLoading: false, isSystemAdmin, user });

      // Chuyển trang theo system_role (theo mô tả BE)
      if (typeof window !== "undefined") {
        if (redirectUrl) {
          window.location.href = redirectUrl;
        } else if (isSystemAdmin) {
          window.location.href = "/admin";
        } else {
          window.location.href = "/workspace";
        }
      }
    } catch (error) {
      // Re-throw error so it can be caught by the login page
      throw error;
    }
  },

  logout: () => {
    void authApi.logout().catch(() => undefined);
    tokenStorage.clearTokens();
    set({ isAuthenticated: false, isSystemAdmin: false, user: null });

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
      void store.checkAuth();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return store;
}
