/**
 * Messages API Functions
 * API for fetching message history of conversations
 */
import client from "../client";
import { messagesEndpoints } from "./endpoints";
import type { PaginatedResponse } from "../workspaces/workspaces-api";
import type { ChatFile } from "../chatbots/chatbots-api";

// Types
export interface MessageResponseDto {
  id: string;
  conversation_id: string;
  sender_type: "user" | "bot";
  sender_id: string | null;
  content: string;
  intent_id: string | null;
  created_at: string;
  updated_at: string;
  attachments?: ChatFile[];
}

export interface ListMessagesParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
}

// API Functions
export const messagesApi = {
  /**
   * Get all messages of a conversation with pagination
   * @param conversationId - ID of the conversation
   * @param params - Pagination parameters
   * @returns Paginated list of messages
   */
  listByConversation: async (
    conversationId: string,
    params?: ListMessagesParams
  ): Promise<PaginatedResponse<MessageResponseDto>> => {
    const response = await client.get<PaginatedResponse<MessageResponseDto>>(
      messagesEndpoints.listByConversation(conversationId),
      {
        params: {
          page: params?.page ?? 1,
          limit: params?.limit ?? 50,
          sortBy: params?.sortBy,
          sortOrder: params?.sortOrder ?? "ASC",
        },
      }
    );
    return response.data;
  },
};
