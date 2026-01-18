/**
 * Chats API Endpoints
 * API for managing chat messages and interactions
 */
const CHATS_BASE = (workspaceId: string, chatbotId: string) =>
  `/workspaces/${workspaceId}/chatbots/${chatbotId}`;

export const chatsEndpoints = {
  /**
   * Send a chat message to chatbot
   */
  sendMessage: (workspaceId: string, chatbotId: string) =>
    `${CHATS_BASE(workspaceId, chatbotId)}/chat`,
};
