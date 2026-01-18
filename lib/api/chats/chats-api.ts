/**
 * Chats API Functions
 * API for sending messages and managing chat interactions
 */
import client from "../client";
import { chatsEndpoints } from "./endpoints";
import type { ChatDto, ChatResponseDto } from "../chatbots/chatbots-api";

// API Functions
export const chatsApi = {
  /**
   * Send a chat message to chatbot
   * This endpoint sends a message to the chatbot and returns the response
   */
  sendMessage: async (
    workspaceId: string,
    chatbotId: string,
    message: string
  ): Promise<ChatResponseDto> => {
    const response = await client.post<ChatResponseDto>(
      chatsEndpoints.sendMessage(workspaceId, chatbotId),
      { message }
    );
    return response.data;
  },

  /**
   * Send a chat message with conversation ID
   * Wrapper method that includes conversation context if available
   */
  sendMessageWithConversation: async (
    workspaceId: string,
    chatbotId: string,
    conversationId: string | null,
    message: string
  ): Promise<ChatResponseDto> => {
    const payload: ChatDto & { conversation_id?: string } = { message };
    if (conversationId) {
      payload.conversation_id = conversationId;
    }

    const response = await client.post<ChatResponseDto>(
      chatsEndpoints.sendMessage(workspaceId, chatbotId),
      payload
    );
    return response.data;
  },
};
