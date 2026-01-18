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
  inviteMember: (id: string) => `${WORKSPACES_BASE}/${id}/members/invite`,
  getMembers: (id: string) => `${WORKSPACES_BASE}/${id}/members`,
  updateMemberRole: (workspaceId: string, memberId: string) =>
    `${WORKSPACES_BASE}/${workspaceId}/members/${memberId}`,
  getUserPermissions: (id: string) => `/workspace-permissions/workspaces/${id}/user`,
};
