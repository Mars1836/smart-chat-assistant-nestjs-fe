/**
 * Workspace Invitations API Functions
 */
import client from "../client";
import { workspaceInvitationsEndpoints } from "./endpoints";

// Types
export interface AcceptInvitationDto {
  token: string;
}

export interface AcceptInvitationResponseDto {
  message: string;
  workspace: {
    id: string;
    name: string;
  };
  role: string;
}

export interface WorkspaceInvitation {
  id: string;
  workspace_id: string;
  email: string;
  workspace_role_id: string;
  invited_by: string;
  token: string;
  expires_at: string;
  status: string;
  created_at: string;
  updated_at: string;
  workspaceRole: {
    id: string;
    name: string;
    description: string;
  };
  invitedByUser: {
    id: string;
    email: string;
    full_name: string;
  };
}

// API Functions
export const workspaceInvitationsApi = {
  /**
   * Accept workspace invitation
   */
  accept: async (
    data: AcceptInvitationDto
  ): Promise<AcceptInvitationResponseDto> => {
    const response = await client.post<AcceptInvitationResponseDto>(
      workspaceInvitationsEndpoints.accept(),
      data
    );
    return response.data;
  },

  /**
   * Get all pending invitations for a workspace
   */
  list: async (workspaceId: string): Promise<WorkspaceInvitation[]> => {
    const response = await client.get<WorkspaceInvitation[]>(
      workspaceInvitationsEndpoints.list(workspaceId)
    );
    return response.data;
  },
};
