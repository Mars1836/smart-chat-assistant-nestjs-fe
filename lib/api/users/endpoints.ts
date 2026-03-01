/**
 * Users API Endpoints
 */
const USERS_BASE = "/users";

export const usersEndpoints = {
  profile: () => `${USERS_BASE}/profile`,
  list: () => USERS_BASE,
  get: (id: string) => `${USERS_BASE}/${id}`,
  create: () => USERS_BASE,
  updateProfile: () => `${USERS_BASE}/profile`,
  update: (id: string) => `${USERS_BASE}/${id}`,
  delete: (id: string) => `${USERS_BASE}/${id}`,
  statsSummary: () => `${USERS_BASE}/stats/summary`,
  statsByDate: () => `${USERS_BASE}/stats/by-date`,
};
