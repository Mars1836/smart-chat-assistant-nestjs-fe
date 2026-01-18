/**
 * Conversations API Endpoints
 */
const CONVERSATIONS_BASE = "/conversations";

export const conversationsEndpoints = {
  list: () => CONVERSATIONS_BASE,
  create: () => CONVERSATIONS_BASE,
  get: (id: string) => `${CONVERSATIONS_BASE}/${id}`,
  update: (id: string) => `${CONVERSATIONS_BASE}/${id}`,
  delete: (id: string) => `${CONVERSATIONS_BASE}/${id}`,
  listByWorkspace: (workspaceId: string) =>
    `${CONVERSATIONS_BASE}/workspaces/${workspaceId}`,
  listByChatbot: (chatbotId: string) =>
    `${CONVERSATIONS_BASE}/chatbots/${chatbotId}`,
};
