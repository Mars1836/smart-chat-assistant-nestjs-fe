/**
 * Workspaces API Endpoints
 */
const WORKSPACES_BASE = "/workspaces";

export const workspacesEndpoints = {
  list: () => WORKSPACES_BASE,
  create: () => WORKSPACES_BASE,
  get: (id: string) => `${WORKSPACES_BASE}/${id}`,
  update: (id: string) => `${WORKSPACES_BASE}/${id}`,
  delete: (id: string) => `${WORKSPACES_BASE}/${id}`,
  getChatbot: (id: string) => `${WORKSPACES_BASE}/${id}/chatbot`,
  wallet: (id: string) => `${WORKSPACES_BASE}/${id}/billing/wallet`,
  vietqr: (id: string) => `${WORKSPACES_BASE}/${id}/billing/vietqr`,
  inviteMember: (id: string) => `${WORKSPACES_BASE}/${id}/members/invite`,
  getMembers: (id: string) => `${WORKSPACES_BASE}/${id}/members`,
  updateMemberRole: (workspaceId: string, memberId: string) =>
    `${WORKSPACES_BASE}/${workspaceId}/members/${memberId}`,
  updateMemberPermissions: (workspaceId: string, memberId: string) =>
    `${WORKSPACES_BASE}/${workspaceId}/members/${memberId}/permissions`,
  getEffectivePermissions: (workspaceId: string, memberId: string) =>
    `${WORKSPACES_BASE}/${workspaceId}/members/${memberId}/permissions/effective-permissions`,
  getUserPermissions: (id: string) => `/workspace-permissions/workspaces/${id}/user`,
};
