/**
 * Workspace Invitations API Endpoints
 */
const INVITATIONS_BASE = "/workspace-invitations";

export const workspaceInvitationsEndpoints = {
  accept: () => `${INVITATIONS_BASE}/accept`,
  list: (workspaceId: string) => `${INVITATIONS_BASE}/workspaces/${workspaceId}`,
  resend: (workspaceId: string, invitationId: string) => `${INVITATIONS_BASE}/workspaces/${workspaceId}/${invitationId}/resend`,
  cancel: (workspaceId: string, invitationId: string) => `${INVITATIONS_BASE}/workspaces/${workspaceId}/${invitationId}`,
};
