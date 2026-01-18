/**
 * Authentication API Endpoints
 */
const AUTH_BASE = "/auth";

export const authEndpoints = {
  register: () => `${AUTH_BASE}/register`,
  login: () => `${AUTH_BASE}/login`,
  refresh: () => `${AUTH_BASE}/refresh`,
  profile: () => `${AUTH_BASE}/profile`,
  logout: () => `${AUTH_BASE}/logout`,
};
