/**
 * System Roles API Endpoints
 */
const SYSTEM_ROLES_BASE = "/system-roles";

export const systemRolesEndpoints = {
  list: () => SYSTEM_ROLES_BASE,
  get: (id: string) => `${SYSTEM_ROLES_BASE}/${id}`,
};
