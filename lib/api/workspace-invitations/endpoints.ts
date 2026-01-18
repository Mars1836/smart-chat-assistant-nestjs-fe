/**
 * Workspace Invitations API Endpoints
 */
const INVITATIONS_BASE = "/workspace-invitations";

export const workspaceInvitationsEndpoints = {
  accept: () => `${INVITATIONS_BASE}/accept`,
  list: (workspaceId: string) => `${INVITATIONS_BASE}/workspaces/${workspaceId}`,
};
