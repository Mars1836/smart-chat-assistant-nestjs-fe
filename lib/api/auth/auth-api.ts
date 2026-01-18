/**
 * Authentication API Functions
 */
import client from "../client";
import { authEndpoints } from "./endpoints";

// Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  language?: string;
  avatar_url?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
}

export interface ProfileResponse {
  id: string;
  email: string;
  name: string;
}

export interface RefreshDto {
  refreshToken: string;
}

export interface RefreshResponse {
  accessToken: string;
}

// API Functions
export const authApi = {
  /**
   * Login user
   */
  login: async (credentials: LoginRequest): Promise<AuthResponse> => {
    const response = await client.post<AuthResponse>(
      authEndpoints.login(),
      credentials
    );
    return response.data;
  },

  /**
   * Register new user
   */
  register: async (userData: RegisterRequest): Promise<AuthResponse> => {
    const response = await client.post<AuthResponse>(
      authEndpoints.register(),
      userData
    );
    return response.data;
  },

  /**
   * Logout user
   */
  logout: async (): Promise<void> => {
    await client.post(authEndpoints.logout());
  },

  /**
   * Get current user profile
   */
  getProfile: async (): Promise<ProfileResponse> => {
    const response = await client.get<ProfileResponse>(authEndpoints.profile());
    return response.data;
  },

  /**
   * Refresh access token
   */
  refreshToken: async (refreshToken: string): Promise<string> => {
    const response = await client.post<RefreshResponse>(
      authEndpoints.refresh(),
      {
        refreshToken,
      }
    );
    return response.data.accessToken;
  },
};

// Re-export types for convenience (already exported above)
