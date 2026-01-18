/**
 * Messages API Endpoints
 */
const MESSAGES_BASE = "/messages";

export const messagesEndpoints = {
  listByConversation: (conversationId: string) =>
    `${MESSAGES_BASE}/conversations/${conversationId}`,
};
