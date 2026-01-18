/**
 * Chatbots API Functions
 */
import client from "../client";
import { chatbotsEndpoints } from "./endpoints";
import type { PaginatedResponse } from "../workspaces/workspaces-api";

// Types
export interface CreateChatbotDto {
  name: string;
  language?: string;
  personality?: string;
  greeting_message?: string;
  fallback_message?: string;
  confidence_threshold?: number;
  max_context_turns?: number;
  enable_learning?: boolean;
  llm_provider?: string;
  llm_model?: string;
  temperature?: number;
  max_tokens?: number;
}

export interface UpdateChatbotDto {
  name?: string;
  language?: string;
  personality?: string;
  greeting_message?: string;
  fallback_message?: string;
  confidence_threshold?: number;
  max_context_turns?: number;
  enable_learning?: boolean;
  llm_provider?: string;
  llm_model?: string;
  temperature?: number;
  max_tokens?: number;
}

export interface Chatbot {
  id: string;
  workspace_id: string;
  name: string;
  language: string;
  personality: string | null;
  enabled: boolean;
  greeting_message: string | null;
  fallback_message: string | null;
  confidence_threshold: number;
  max_context_turns: number;
  enable_learning: boolean;
  llm_provider: string;
  llm_model: string;
  temperature: number;
  max_tokens: number;
  created_at: string;
  updated_at: string;
  created_by_id: string | null;
  created_by?: any | null;
  workspace?: any;
}

export interface ChatDto {
  message: string;
}

export interface ChatResponseDto {
  response: string;
  model: string;
  processingTime: number;
}

export interface ListChatbotsParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
}

// API Functions
export const chatbotsApi = {
  /**
   * Get all chatbots in workspace with pagination
   */
  list: async (
    workspaceId: string,
    params?: ListChatbotsParams
  ): Promise<PaginatedResponse<Chatbot>> => {
    const response = await client.get<PaginatedResponse<Chatbot>>(
      chatbotsEndpoints.list(workspaceId),
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
   * Create new chatbot in workspace
   */
  create: async (
    workspaceId: string,
    data: CreateChatbotDto
  ): Promise<Chatbot> => {
    const response = await client.post<Chatbot>(
      chatbotsEndpoints.create(workspaceId),
      data
    );
    return response.data;
  },

  /**
   * Get chatbot by ID
   */
  get: async (workspaceId: string, id: string): Promise<Chatbot> => {
    const response = await client.get<Chatbot>(
      chatbotsEndpoints.get(workspaceId, id)
    );
    return response.data;
  },

  /**
   * Update chatbot
   */
  update: async (
    workspaceId: string,
    id: string,
    data: UpdateChatbotDto
  ): Promise<Chatbot> => {
    const response = await client.patch<Chatbot>(
      chatbotsEndpoints.update(workspaceId, id),
      data
    );
    return response.data;
  },

  /**
   * Delete chatbot
   */
  delete: async (workspaceId: string, id: string): Promise<void> => {
    await client.delete(chatbotsEndpoints.delete(workspaceId, id));
  },

  /**
   * Chat with chatbot
   */
  chat: async (
    workspaceId: string,
    id: string,
    message: string
  ): Promise<ChatResponseDto> => {
    const response = await client.post<ChatResponseDto>(
      chatbotsEndpoints.chat(workspaceId, id),
      { message }
    );
    return response.data;
  },

  /**
   * List available AI models
   */
  listModels: async (workspaceId: string): Promise<string[]> => {
    const response = await client.get<string[]>(
      chatbotsEndpoints.listModels(workspaceId)
    );
    return response.data;
  },

  /**
   * Test AI Studio connection
   */
  testConnection: async (workspaceId: string): Promise<any> => {
    const response = await client.get(
      chatbotsEndpoints.testConnection(workspaceId)
    );
    return response.data;
  },
};

// Types are already exported individually above
