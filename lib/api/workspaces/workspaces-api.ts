/**
 * Workspaces API Functions
 */
import client from "../client";
import { workspacesEndpoints } from "./endpoints";

// Types
export interface CreateWorkspaceDto {
  name: string;
  description?: string;
  is_personal?: boolean;
  icon?: string;
  color?: string;
}

export interface UpdateWorkspaceDto {
  name?: string;
  description?: string;
  is_personal?: boolean;
  icon?: string;
  color?: string;
}

export interface WorkspaceResponseDto {
  id: string;
  name: string;
  description?: string;
  owner_id: string;
  is_personal: boolean;
  is_owner: boolean;
  user_role: string; // "Owner" | "Admin" | "Editor" | "Viewer"
  icon?: string;
  color?: string;
  created_at: string;
  updated_at: string;
  created_by_id?: string | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export interface WorkspaceChatbot {
  id: string;
  name: string;
  workspace_id: string;
  // Add more fields as needed
}

export interface ListWorkspacesParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
}

export interface WorkspaceMember {
  id: string;
  workspace_id: string;
  user_id: string;
  workspace_role_id: string;
  invited_by: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  user: {
    id: string;
    email: string;
    full_name: string;
    avatar: string | null;
  };
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

export interface InviteMemberDto {
  email: string;
  role_name: string;
}

export interface InvitationResponseDto {
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
}

export interface WorkspaceRole {
  id: string;
  name: string;
  description?: string;
  is_system_role: boolean;
  created_at: string;
  updated_at: string;
}

// API Functions
export const workspacesApi = {
  /**
   * Get all workspaces for current user
   */
  list: async (
    params?: ListWorkspacesParams
  ): Promise<PaginatedResponse<WorkspaceResponseDto>> => {
    const response = await client.get<PaginatedResponse<WorkspaceResponseDto>>(
      workspacesEndpoints.list(),
      {
        params: {
          page: params?.page ?? 1,
          limit: params?.limit ?? 10,
          sortBy: params?.sortBy ?? "created_at",
          sortOrder: params?.sortOrder ?? "DESC",
        },
      }
    );
    return response.data;
  },

  /**
   * Create new workspace
   */
  create: async (data: CreateWorkspaceDto): Promise<WorkspaceResponseDto> => {
    const response = await client.post<WorkspaceResponseDto>(
      workspacesEndpoints.create(),
      data
    );
    return response.data;
  },

  /**
   * Get workspace by ID
   */
  get: async (id: string): Promise<WorkspaceResponseDto> => {
    const response = await client.get<WorkspaceResponseDto>(
      workspacesEndpoints.get(id)
    );
    return response.data;
  },

  /**
   * Update workspace
   */
  update: async (
    id: string,
    data: UpdateWorkspaceDto
  ): Promise<WorkspaceResponseDto> => {
    const response = await client.patch<WorkspaceResponseDto>(
      workspacesEndpoints.update(id),
      data
    );
    return response.data;
  },

  /**
   * Delete workspace
   */
  delete: async (id: string): Promise<void> => {
    await client.delete(workspacesEndpoints.delete(id));
  },

  /**
   * Get chatbot for workspace
   */
  getChatbot: async (id: string): Promise<WorkspaceChatbot> => {
    const response = await client.get<WorkspaceChatbot>(
      workspacesEndpoints.getChatbot(id)
    );
    return response.data;
  },

  /**
   * Invite member to workspace
   */
  inviteMember: async (
    workspaceId: string,
    data: InviteMemberDto
  ): Promise<InvitationResponseDto> => {
    const response = await client.post<InvitationResponseDto>(
      workspacesEndpoints.inviteMember(workspaceId),
      data
    );
    return response.data;
  },

  /**
   * Get user permissions in workspace
   */
  getUserPermissions: async (workspaceId: string): Promise<string[]> => {
    const response = await client.get<{ permissions: string[] }>(
      workspacesEndpoints.getUserPermissions(workspaceId)
    );
    return response.data.permissions;
  },

  /**
   * Get all workspace members
   */
  getMembers: async (workspaceId: string): Promise<WorkspaceMember[]> => {
    const response = await client.get<WorkspaceMember[]>(
      workspacesEndpoints.getMembers(workspaceId)
    );
    return response.data;
  },

  /**
   * Update member role
   */
  updateMemberRole: async (
    workspaceId: string,
    memberId: string,
    roleName: string
  ): Promise<WorkspaceMember> => {
    const response = await client.patch<WorkspaceMember>(
      workspacesEndpoints.updateMemberRole(workspaceId, memberId),
      { role_name: roleName }
    );
    return response.data;
  },
};

// Types are already exported individually above
