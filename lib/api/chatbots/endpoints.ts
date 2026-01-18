/**
 * Chatbots API Endpoints
 */
const CHATBOTS_BASE = (workspaceId: string) =>
  `/workspaces/${workspaceId}/chatbots`;

export const chatbotsEndpoints = {
  list: (workspaceId: string) => CHATBOTS_BASE(workspaceId),
  create: (workspaceId: string) => CHATBOTS_BASE(workspaceId),
  get: (workspaceId: string, id: string) =>
    `${CHATBOTS_BASE(workspaceId)}/${id}`,
  update: (workspaceId: string, id: string) =>
    `${CHATBOTS_BASE(workspaceId)}/${id}`,
  delete: (workspaceId: string, id: string) =>
    `${CHATBOTS_BASE(workspaceId)}/${id}`,
  chat: (workspaceId: string, id: string) =>
    `${CHATBOTS_BASE(workspaceId)}/${id}/chat`,
  listModels: (workspaceId: string) => `${CHATBOTS_BASE(workspaceId)}/_/models`,
  testConnection: (workspaceId: string) =>
    `${CHATBOTS_BASE(workspaceId)}/_/test`,
};
