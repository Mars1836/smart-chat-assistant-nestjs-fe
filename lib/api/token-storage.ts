/**
 * Token Storage Management
 * Handles storing and retrieving authentication tokens
 */

export const tokenStorage = {
  getAccessToken: (): string | null => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("accessToken");
  },

  setAccessToken: (token: string): void => {
    if (typeof window === "undefined") return;
    localStorage.setItem("accessToken", token);
  },

  getRefreshToken: (): string | null => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("refreshToken");
  },

  setRefreshToken: (token: string): void => {
    if (typeof window === "undefined") return;
    localStorage.setItem("refreshToken", token);
  },

  clearTokens: (): void => {
    if (typeof window === "undefined") return;
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
  },

  hasTokens: (): boolean => {
    return !!tokenStorage.getAccessToken() && !!tokenStorage.getRefreshToken();
  },
};
