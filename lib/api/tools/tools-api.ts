/**
 * Tools API Functions
 * Based on PLUGIN-UI-SPECIFICATION.md
 */
import client from "../client";
import {
  toolsEndpoints,
  workspaceToolsEndpoints,
  chatbotToolsEndpoints,
} from "./endpoints";

// =============================================================================
// Types based on PLUGIN-UI-SPECIFICATION.md
// =============================================================================

/**
 * Authentication types for plugins
 */
export type PluginAuthType = "none" | "oauth2" | "api_key";

/**
 * OAuth configuration
 */
export interface OAuthConfig {
  scopes: string[];
  provider?: string;
}

/**
 * API Key configuration
 */
export interface ApiKeyConfig {
  param_name: string;
  header_name?: string;
  value?: string;
  is_set?: boolean;
}

/**
 * Plugin authentication configuration
 */
export interface PluginAuthConfig {
  type: PluginAuthType;
  oauth?: OAuthConfig;
  api_key?: ApiKeyConfig;
}

/**
 * User's OAuth connection status
 */
export interface UserAuthStatus {
  connected: boolean;
  profile: {
    email: string;
    name: string;
    picture?: string;
  } | null;
  connected_at?: string;
}

/**
 * Workspace tool configuration
 */
export interface WorkspaceToolConfig {
  is_enabled: boolean;
  config_override: Record<string, unknown>;
  added_at?: string;
  api_key_configured?: boolean;
}

/**
 * Tool action parameter schema (matching Gemini function declaration format)
 */
export interface ToolParameterSchema {
  type: "OBJECT" | "STRING" | "NUMBER" | "BOOLEAN" | "ARRAY";
  properties?: Record<
    string,
    {
      type: string;
      description?: string;
      enum?: string[];
      items?: { type: string };
    }
  >;
  required?: string[];
}

/**
 * Plugin action with enable status
 */
export interface PluginAction {
  id: string;
  name: string;
  display_name: string;
  description: string;
  parameters?: ToolParameterSchema;
  is_enabled: boolean;
}

/**
 * Tool category
 */
export type ToolCategory = "builtin" | "custom" | "community";

/**
 * Tool executor type
 */
export type ToolExecutorType =
  | "rag"
  | "http"
  | "code"
  | "email"
  | "calendar"
  | "datetime"
  | "gmail"
  | "slack"
  | "weather";

/**
 * Full plugin definition (as returned from workspace tools endpoint)
 */
export interface Plugin {
  id: string;
  name: string;
  display_name: string;
  description: string;
  category: ToolCategory;
  is_enabled: boolean;
  auth_config: PluginAuthConfig;
  actions: PluginAction[];
  executor_type?: ToolExecutorType;
  workspace_tool: WorkspaceToolConfig | null;
  user_auth_status: UserAuthStatus | null;
  created_at?: string;
  updated_at?: string;
}

/**
 * Simple Tool type (for global tools list)
 */
export interface Tool {
  id: string;
  name: string;
  display_name: string;
  description: string;
  category: ToolCategory;
  is_enabled: boolean;
  auth_config: PluginAuthConfig;
  actions: PluginAction[];
  executor_type?: ToolExecutorType;
  created_at?: string;
  updated_at?: string;
}

/**
 * Chatbot tool with action-level control
 */
export interface ChatbotTool extends Plugin {
  chatbot_tool?: {
    is_enabled: boolean;
    enabled_actions?: string[];
    config_override?: Record<string, unknown>;
  };
}

/**
 * DTO for adding plugin to workspace
 */
export interface AddWorkspaceToolDto {
  tool_id: string;
  is_enabled?: boolean;
  config_override?: Record<string, unknown>;
}

/**
 * DTO for updating workspace plugin config
 */
export interface UpdateWorkspaceToolDto {
  is_enabled?: boolean;
  config_override?: Record<string, unknown>;
}

/**
 * DTO for enabling/configuring a tool for a chatbot
 */
export interface UpdateChatbotToolDto {
  is_enabled: boolean;
  config_override?: Record<string, unknown>;
}

/**
 * DTO for toggling action
 */
export interface UpdateActionDto {
  is_enabled: boolean;
}

/**
 * DTO for batch toggling actions
 */
export interface BatchActionsDto {
  actions: Array<{
    action_id: string;
    is_enabled: boolean;
  }>;
}

/**
 * OAuth authorization response
 */
export interface OAuthAuthorizeResponse {
  url: string;
  state: string;
}

/**
 * OAuth status response
 */
export interface OAuthStatusResponse {
  connected: boolean;
  profile: {
    email: string;
    name: string;
    picture?: string;
  } | null;
  connected_at?: string;
}

/**
 * LLM function declaration format (Gemini compatible)
 */
export interface LLMFunctionDeclaration {
  name: string;
  description: string;
  parameters: ToolParameterSchema;
}

/**
 * Tool execution request
 */
export interface ExecuteToolDto {
  tool_call: string;
  params: Record<string, unknown>;
  session_id?: string;
}

/**
 * Tool execution response
 */
export interface ExecuteToolResponseDto {
  success: boolean;
  result: unknown;
  execution_time_ms: number;
  error?: string;
}

/**
 * Query params for listing tools
 */
export interface ListToolsParams {
  category?: ToolCategory;
  enabled?: boolean;
}

// =============================================================================
// API Functions
// =============================================================================

/**
 * Global Tools API (all available tools)
 */
export const toolsApi = {
  /**
   * Get all available tools (global list)
   */
  list: async (params?: ListToolsParams): Promise<Tool[]> => {
    const response = await client.get<Tool[]>(toolsEndpoints.list(), {
      params,
    });
    return response.data;
  },

  /**
   * Get a single tool by ID
   */
  get: async (id: string): Promise<Tool> => {
    const response = await client.get<Tool>(toolsEndpoints.get(id));
    return response.data;
  },
};

/**
 * Workspace Tools API
 */
/**
 * DTO for creating custom tool
 */
export interface CreateCustomToolDto {
  name: string;
  display_name: string;
  description: string;
  executor_type: "http_api";
  executor_config: {
    method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
    endpoint: string;
  };
  auth_config?: {
    type: "api_key";
    api_key: {
      header_name: string;
      value?: string;
    }
  };
}

export const workspaceToolsApi = {
  /**
   * List all available plugins (builtin + custom) for browsing and adding
   */
  list: async (workspaceId: string): Promise<Plugin[]> => {
    const response = await client.get<Plugin[]>(
      workspaceToolsEndpoints.list(workspaceId)
    );
    return response.data;
  },

  /**
   * List installed plugins in workspace (with auth info)
   */
  installed: async (workspaceId: string): Promise<Plugin[]> => {
    const response = await client.get<Plugin[]>(
      workspaceToolsEndpoints.installed(workspaceId)
    );
    return response.data;
  },

  /**
   * Get single plugin details
   */
  get: async (workspaceId: string, toolId: string): Promise<Plugin> => {
    const response = await client.get<Plugin>(
      workspaceToolsEndpoints.get(workspaceId, toolId)
    );
    return response.data;
  },

  /**
   * Add plugin to workspace
   */
  add: async (
    workspaceId: string,
    data: AddWorkspaceToolDto
  ): Promise<Plugin> => {
    const response = await client.post<Plugin>(
      workspaceToolsEndpoints.add(workspaceId),
      data
    );
    return response.data;
  },

  /**
   * Create custom tool in workspace
   */
  createCustom: async (
    workspaceId: string,
    data: CreateCustomToolDto
  ): Promise<Plugin> => {
    const response = await client.post<Plugin>(
      workspaceToolsEndpoints.custom(workspaceId),
      data
    );
    return response.data;
  },

  /**
   * Update plugin config (including API key)
   */
  update: async (
    workspaceId: string,
    toolId: string,
    data: UpdateWorkspaceToolDto
  ): Promise<Plugin> => {
    const response = await client.put<Plugin>(
      workspaceToolsEndpoints.update(workspaceId, toolId),
      data
    );
    return response.data;
  },

  /**
   * Remove plugin from workspace
   */
  remove: async (workspaceId: string, toolId: string): Promise<void> => {
    await client.delete(workspaceToolsEndpoints.remove(workspaceId, toolId));
  },

  // OAuth methods
  /**
   * Get OAuth authorization URL
   */
  getOAuthUrl: async (
    workspaceId: string,
    toolId: string
  ): Promise<OAuthAuthorizeResponse> => {
    const response = await client.get<OAuthAuthorizeResponse>(
      workspaceToolsEndpoints.oauthAuthorize(workspaceId, toolId)
    );
    return response.data;
  },

  /**
   * Check OAuth connection status
   */
  getOAuthStatus: async (
    workspaceId: string,
    toolId: string
  ): Promise<OAuthStatusResponse> => {
    const response = await client.get<OAuthStatusResponse>(
      workspaceToolsEndpoints.oauthStatus(workspaceId, toolId)
    );
    return response.data;
  },

  /**
   * Disconnect OAuth
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

/**
 * Chatbot Tools API
 */
export const chatbotToolsApi = {
  /**
   * Get tools for chatbot (with action-level status)
   */
  list: async (
    workspaceId: string,
    chatbotId: string
  ): Promise<ChatbotTool[]> => {
    const response = await client.get<ChatbotTool[]>(
      chatbotToolsEndpoints.list(workspaceId, chatbotId)
    );
    return response.data;
  },

  /**
   * Enable/disable tool for chatbot
   */
  update: async (
    workspaceId: string,
    chatbotId: string,
    toolId: string,
    data: UpdateChatbotToolDto
  ): Promise<ChatbotTool> => {
    const response = await client.put<ChatbotTool>(
      chatbotToolsEndpoints.update(workspaceId, chatbotId, toolId),
      data
    );
    return response.data;
  },

  /**
   * Remove tool from chatbot
   */
  delete: async (
    workspaceId: string,
    chatbotId: string,
    toolId: string
  ): Promise<void> => {
    await client.delete(
      chatbotToolsEndpoints.delete(workspaceId, chatbotId, toolId)
    );
  },

  /**
   * Toggle specific action
   */
  updateAction: async (
    workspaceId: string,
    chatbotId: string,
    toolId: string,
    actionId: string,
    data: UpdateActionDto
  ): Promise<void> => {
    await client.put(
      chatbotToolsEndpoints.updateAction(
        workspaceId,
        chatbotId,
        toolId,
        actionId
      ),
      data
    );
  },

  /**
   * Batch toggle actions
   */
  batchActions: async (
    workspaceId: string,
    chatbotId: string,
    toolId: string,
    data: BatchActionsDto
  ): Promise<void> => {
    await client.post(
      chatbotToolsEndpoints.batchActions(workspaceId, chatbotId, toolId),
      data
    );
  },

  /**
   * Get LLM-formatted schema
   */
  getLLMSchema: async (
    workspaceId: string,
    chatbotId: string
  ): Promise<LLMFunctionDeclaration[]> => {
    const response = await client.get<LLMFunctionDeclaration[]>(
      chatbotToolsEndpoints.llmSchema(workspaceId, chatbotId)
    );
    return response.data;
  },

  /**
   * Execute a tool directly
   */
  execute: async (
    workspaceId: string,
    chatbotId: string,
    data: ExecuteToolDto
  ): Promise<ExecuteToolResponseDto> => {
    const response = await client.post<ExecuteToolResponseDto>(
      chatbotToolsEndpoints.execute(workspaceId, chatbotId),
      data
    );
    return response.data;
  },
};
