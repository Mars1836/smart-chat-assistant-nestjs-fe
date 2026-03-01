/**
 * Payments API Endpoints
 */
const PAYMENTS_BASE = "/payments";

export const paymentsEndpoints = {
  list: () => PAYMENTS_BASE,
  get: (id: string) => `${PAYMENTS_BASE}/${id}`,
  statsSummary: () => `${PAYMENTS_BASE}/stats/summary`,
  statsByDate: () => `${PAYMENTS_BASE}/stats/by-date`,
};
