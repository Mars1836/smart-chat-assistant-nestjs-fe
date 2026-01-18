/**
 * Conversations API Functions
 */
import client from "../client";
import { conversationsEndpoints } from "./endpoints";
import type { PaginatedResponse } from "../workspaces/workspaces-api";

// Types
export interface CreateConversationDto {
  workspace_id: string;
  chatbot_id: string;
}

export interface UpdateConversationDto {
  ended_at?: string | null;
}

export interface ConversationResponseDto {
  id: string;
  workspace_id: string;
  user_id: string;
  chatbot_id: string;
  started_at: string;
  ended_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ListConversationsParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
}

// API Functions
export const conversationsApi = {
  /**
   * Get all conversations with pagination
   */
  list: async (
    params?: ListConversationsParams
  ): Promise<PaginatedResponse<ConversationResponseDto>> => {
    const response = await client.get<PaginatedResponse<ConversationResponseDto>>(
      conversationsEndpoints.list(),
      {
        params: {
          page: params?.page ?? 1,
          limit: params?.limit ?? 10,
          sortBy: params?.sortBy,
          sortOrder: params?.sortOrder ?? "DESC",
        },
      }
    );
    return response.data;
  },

  /**
   * Create new conversation
   */
  create: async (
    data: CreateConversationDto
  ): Promise<ConversationResponseDto> => {
    const response = await client.post<ConversationResponseDto>(
      conversationsEndpoints.create(),
      data
    );
    return response.data;
  },

  /**
   * Get conversation by ID
   */
  get: async (id: string): Promise<ConversationResponseDto> => {
    const response = await client.get<ConversationResponseDto>(
      conversationsEndpoints.get(id)
    );
    return response.data;
  },

  /**
   * Update conversation
   */
  update: async (
    id: string,
    data: UpdateConversationDto
  ): Promise<ConversationResponseDto> => {
    const response = await client.patch<ConversationResponseDto>(
      conversationsEndpoints.update(id),
      data
    );
    return response.data;
  },

  /**
   * Delete conversation
   */
  delete: async (id: string): Promise<void> => {
    await client.delete(conversationsEndpoints.delete(id));
  },

  /**
   * Get all conversations by workspace with pagination
   */
  listByWorkspace: async (
    workspaceId: string,
    params?: ListConversationsParams
  ): Promise<PaginatedResponse<ConversationResponseDto>> => {
    const response = await client.get<PaginatedResponse<ConversationResponseDto>>(
      conversationsEndpoints.listByWorkspace(workspaceId),
      {
        params: {
          page: params?.page ?? 1,
          limit: params?.limit ?? 10,
          sortBy: params?.sortBy,
          sortOrder: params?.sortOrder ?? "DESC",
        },
      }
    );
    return response.data;
  },

  /**
   * Get all conversations by chatbot with pagination
   */
  listByChatbot: async (
    chatbotId: string,
    params?: ListConversationsParams
  ): Promise<PaginatedResponse<ConversationResponseDto>> => {
    const response = await client.get<PaginatedResponse<ConversationResponseDto>>(
      conversationsEndpoints.listByChatbot(chatbotId),
      {
        params: {
          page: params?.page ?? 1,
          limit: params?.limit ?? 10,
          sortBy: params?.sortBy,
          sortOrder: params?.sortOrder ?? "DESC",
        },
      }
    );
    return response.data;
  },
};

// Types are already exported individually above

