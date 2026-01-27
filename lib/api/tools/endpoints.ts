/**
 * Tools API Endpoints
 * Based on PLUGIN-UI-SPECIFICATION.md
 */

// Global tools
const TOOLS_BASE = "/tools";

export const toolsEndpoints = {
  list: () => TOOLS_BASE,
  get: (id: string) => `${TOOLS_BASE}/${id}`,
};

// Workspace tools
const WORKSPACE_TOOLS_BASE = (workspaceId: string) =>
  `/workspaces/${workspaceId}/tools`;

export const workspaceToolsEndpoints = {
  // List all available plugins (builtin + custom) for browsing and adding to workspace
  list: (workspaceId: string) => WORKSPACE_TOOLS_BASE(workspaceId),

  // List installed plugins in workspace (with auth info)
  installed: (workspaceId: string) => `${WORKSPACE_TOOLS_BASE(workspaceId)}/installed`,

  // Add plugin to workspace
  add: (workspaceId: string) => WORKSPACE_TOOLS_BASE(workspaceId),

  // Create custom tool in workspace
  custom: (workspaceId: string) => `${WORKSPACE_TOOLS_BASE(workspaceId)}/custom`,

  // Get single plugin details
  get: (workspaceId: string, toolId: string) =>
    `${WORKSPACE_TOOLS_BASE(workspaceId)}/${toolId}`,

  // Update plugin config
  update: (workspaceId: string, toolId: string) =>
    `${WORKSPACE_TOOLS_BASE(workspaceId)}/${toolId}`,

  // Remove plugin from workspace
  remove: (workspaceId: string, toolId: string) =>
    `${WORKSPACE_TOOLS_BASE(workspaceId)}/${toolId}`,

  // OAuth endpoints
  oauthAuthorize: (workspaceId: string, toolId: string) =>
    `${WORKSPACE_TOOLS_BASE(workspaceId)}/${toolId}/oauth/authorize`,

  oauthStatus: (workspaceId: string, toolId: string) =>
    `${WORKSPACE_TOOLS_BASE(workspaceId)}/${toolId}/oauth/status`,

  oauthDisconnect: (workspaceId: string, toolId: string) =>
    `${WORKSPACE_TOOLS_BASE(workspaceId)}/${toolId}/oauth/disconnect`,
};

// Chatbot-specific tools endpoints
const CHATBOT_TOOLS_BASE = (workspaceId: string, chatbotId: string) =>
  `/workspaces/${workspaceId}/chatbots/${chatbotId}/tools`;

export const chatbotToolsEndpoints = {
  // List tools enabled for a chatbot (with action-level status)
  list: (workspaceId: string, chatbotId: string) =>
    CHATBOT_TOOLS_BASE(workspaceId, chatbotId),

  // Enable/disable/configure a tool for chatbot
  update: (workspaceId: string, chatbotId: string, toolId: string) =>
    `${CHATBOT_TOOLS_BASE(workspaceId, chatbotId)}/${toolId}`,

  // Remove/disable a tool for chatbot
  delete: (workspaceId: string, chatbotId: string, toolId: string) =>
    `${CHATBOT_TOOLS_BASE(workspaceId, chatbotId)}/${toolId}`,

  // Toggle specific action
  updateAction: (
    workspaceId: string,
    chatbotId: string,
    toolId: string,
    actionId: string
  ) =>
    `${CHATBOT_TOOLS_BASE(workspaceId, chatbotId)}/${toolId}/actions/${actionId}`,

  // Batch toggle actions
  batchActions: (workspaceId: string, chatbotId: string, toolId: string) =>
    `${CHATBOT_TOOLS_BASE(workspaceId, chatbotId)}/${toolId}/actions/batch`,

  // Get LLM-formatted schema (for debugging)
  llmSchema: (workspaceId: string, chatbotId: string) =>
    `${CHATBOT_TOOLS_BASE(workspaceId, chatbotId)}/_/llm-schema`,

  // Execute a tool directly (optional)
  execute: (workspaceId: string, chatbotId: string) =>
    `${CHATBOT_TOOLS_BASE(workspaceId, chatbotId)}/execute`,
};
