/**
 * Workspace Tools API Functions
 * Manage plugins at workspace level
 */
import client from "../client";
import { workspaceToolsEndpoints } from "./endpoints";
import type { Tool } from "./tools-api";

// =============================================================================
// Types
// =============================================================================

/**
 * Tool as returned when querying workspace's enabled tools
 * Includes additional info from WorkspaceTool relation
 */
export interface WorkspaceTool {
  id: string;
  name: string;
  display_name: string;
  description: string;
  category: "builtin" | "custom" | "community";
  is_enabled: boolean;
  actions: Array<{
    name: string;
    description: string;
    parameters: any;
  }>;
  executor_type: string;
  executor_config?: Record<string, unknown>;
  auth_config?: {
    type: "none" | "service_account" | "oauth2" | "api_key";
    oauth?: {
      scopes: string[];
      token_url: string;
      authorization_url: string;
      client_id?: string;
    };
  };
  config?: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
  workspace_tool?: {
    is_enabled: boolean;
    config_override?: Record<string, unknown>;
    added_at?: string;
    added_by?: string;
  };
  // OAuth connection status (only present when auth_config.type = "oauth2")
  user_auth_status?: {
    connected: boolean;
    profile?: {
      email: string;
      name: string;
      picture?: string;
    };
    connected_at?: string;
  };
}

/**
 * DTO for adding a tool to workspace
 */
export interface AddWorkspaceToolDto {
  tool_id: string;
  is_enabled?: boolean;
  config_override?: Record<string, unknown>;
}

/**
 * DTO for updating workspace tool settings
 */
export interface UpdateWorkspaceToolDto {
  is_enabled?: boolean;
  config_override?: Record<string, unknown>;
}

// =============================================================================
// API Functions
// =============================================================================

export const workspaceToolsApi = {
  /**
   * Get all available plugins (builtin + custom) for browsing and adding
   * Returns all tools in the system
   */
  list: async (workspaceId: string): Promise<WorkspaceTool[]> => {
    const response = await client.get<WorkspaceTool[]>(
      workspaceToolsEndpoints.list(workspaceId)
    );
    return response.data;
  },

  /**
   * Get installed plugins in workspace with auth info
   */
  installed: async (workspaceId: string): Promise<WorkspaceTool[]> => {
    const response = await client.get<WorkspaceTool[]>(
      workspaceToolsEndpoints.installed(workspaceId)
    );
    return response.data;
  },

  /**
   * Add a tool to the workspace
   */
  add: async (
    workspaceId: string,
    data: AddWorkspaceToolDto
  ): Promise<WorkspaceTool> => {
    const response = await client.post<WorkspaceTool>(
      workspaceToolsEndpoints.add(workspaceId),
      data
    );
    return response.data;
  },

  /**
   * Update workspace tool configuration
   */
  update: async (
    workspaceId: string,
    toolId: string,
    data: UpdateWorkspaceToolDto
  ): Promise<WorkspaceTool> => {
    const response = await client.put<WorkspaceTool>(
      workspaceToolsEndpoints.update(workspaceId, toolId),
      data
    );
    return response.data;
  },

  /**
   * Remove a tool from the workspace
   */
  remove: async (workspaceId: string, toolId: string): Promise<void> => {
    await client.delete(workspaceToolsEndpoints.remove(workspaceId, toolId));
  },

  /**
   * Get OAuth authorization URL for a tool
   */
  getOAuthUrl: async (
    workspaceId: string,
    toolId: string
  ): Promise<{ url: string; state: string }> => {
    const response = await client.get<{ url: string; state: string }>(
      workspaceToolsEndpoints.oauthAuthorize(workspaceId, toolId)
    );
    return response.data;
  },

  /**
   * Get OAuth connection status for current user
   */
  getOAuthStatus: async (
    workspaceId: string,
    toolId: string
  ): Promise<{
    connected: boolean;
    profile?: { email: string; name: string; picture?: string };
    connected_at?: string;
  }> => {
    const response = await client.get(
      workspaceToolsEndpoints.oauthStatus(workspaceId, toolId)
    );
    return response.data;
  },

  /**
   * Disconnect OAuth for current user
   */
  disconnectOAuth: async (
    workspaceId: string,
    toolId: string
  ): Promise<void> => {
    await client.delete(
      workspaceToolsEndpoints.oauthDisconnect(workspaceId, toolId)
    );
  },
};
