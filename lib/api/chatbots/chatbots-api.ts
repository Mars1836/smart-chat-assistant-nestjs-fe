/**
 * Chatbots API Functions
 */
import client from "../client";
import { chatbotsEndpoints } from "./endpoints";
import type { PaginatedResponse } from "../workspaces/workspaces-api";

// Types
export interface ConversationStarter {
  label: string;
  message: string;
}

export interface CreateChatbotDto {
  name: string;
  language?: string;
  personality?: string;
  greeting_message?: string;
  fallback_message?: string;
  confidence_threshold?: number;
  max_context_turns?: number;
  llm_provider?: string;
  llm_model?: string;
  temperature?: number;
  max_tokens?: number;
  conversation_starters?: ConversationStarter[];
}

export interface UpdateChatbotDto {
  name?: string;
  language?: string;
  personality?: string;
  greeting_message?: string;
  fallback_message?: string;
  confidence_threshold?: number;
  max_context_turns?: number;
  llm_provider?: string;
  llm_model?: string;
  temperature?: number;
  max_tokens?: number;
  widget_config?: WidgetConfig;
  conversation_starters?: ConversationStarter[];
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
  llm_provider: string;
  llm_model: string;
  temperature: number;
  max_tokens: number;
  created_at: string;
  updated_at: string;
  created_by_id: string | null;
  created_by?: any | null;
  workspace?: any;
  widget_config?: WidgetConfig | null;
  conversation_starters?: ConversationStarter[];
}

export interface WidgetConfig {
  enabled: boolean;
  position: "bottom-right" | "bottom-left";
  primaryColor: string;
  title: string;
  greeting: string;
  /** Danh sách domain được phép nhúng (whitelist) */
  allowedOrigins: string[];
  lang: "vi" | "en";
  /** Danh sách IP được phép, optional */
  allowedIps?: string[];
  /** Public API key cho widget (gửi qua X-Widget-Key), optional */
  publicApiKey?: string | null;
  /** Cửa sổ rate limit (giây), optional */
  rateLimitWindowSec?: number | null;
  /** Số request tối đa trong cửa sổ, optional */
  rateLimitMaxRequests?: number | null;
}

/** Shape config dùng cho API widget-config (ui + security) */
export interface WidgetUiConfig {
  enabled?: boolean;
  position?: "bottom-right" | "bottom-left";
  primaryColor?: string;
  title?: string;
  greeting?: string;
  lang?: "vi" | "en";
}

export interface WidgetSecurityConfig {
  enabled?: boolean;
  allowed_origins?: string[];
  allowed_ips?: string[];
  public_api_key?: string | null;
  rate_limit_window_sec?: number | null;
  rate_limit_max_requests?: number | null;
}

export interface WidgetConfigApiDto {
  ui?: WidgetUiConfig;
  security?: WidgetSecurityConfig;
}

export interface WidgetPublicConfig {
  chatbot_id: string;
  name: string;
  greeting_message: string | null;
  ui: Record<string, any> | null;
  conversation_starters: ConversationStarter[];
}

export interface ChatDto {
  message: string;
}

export interface ChatFile {
  type: "image" | "file";
  url: string;
  filename: string;
  mime_type?: string;
  size: number;
}

export interface UploadedImage {
  id: string;
  url: string;
  filename: string;
  mime_type: string;
  size: number;
}

/** Card từ response chat (sản phẩm, bài viết, link). API có thể gửi title hoặc name, price/brand trong metadata hoặc top-level. */
export interface ChatCard {
  type: "product" | "article" | "link";
  /** Tiêu đề (spec); API product có thể gửi name thay vì title */
  title?: string;
  name?: string;
  description?: string;
  imageUrl?: string | null;
  url: string;
  /** Product: có thể gửi price, brand ở top level */
  price?: number;
  brand?: string;
  metadata?: Record<string, unknown> & {
    price?: number;
    brand?: string;
    author?: string;
    publishedAt?: string;
    displayLink?: string;
    id?: number;
    slug?: string;
  };
}

/** Token usage returned from POST chat (same shape as message). */
export interface ChatResponseTokenUsage {
  input_tokens: number;
  output_tokens: number;
}

/** One tool used in the chat turn (same shape as message). */
export interface ChatResponseToolUsed {
  tool_name: string;
  args: Record<string, unknown>;
  result: unknown;
}

export interface ChatResponseDto {
  conversation_id?: string;
  response: string;
  model: string;
  processingTime: number;
  files?: ChatFile[];
  uploaded_images?: UploadedImage[];
  cards?: ChatCard[];
  /** Token usage for this turn (router + answer). */
  token_usage?: ChatResponseTokenUsage | null;
  /** Tools invoked in this turn. */
  tools_used?: ChatResponseToolUsed[] | null;
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
   * PATCH /workspaces/:workspaceId/chatbots/:chatbotId/widget-config
   * Cập nhật cấu hình widget (ui + security). Trả về Chatbot mới.
   */
  updateWidgetConfig: async (
    workspaceId: string,
    chatbotId: string,
    body: WidgetConfigApiDto
  ): Promise<Chatbot> => {
    const response = await client.patch<Chatbot>(
      chatbotsEndpoints.widgetConfig(workspaceId, chatbotId),
      body
    );
    return response.data;
  },

  /**
   * Get public widget config
   */
  getPublicWidgetConfig: async (
    chatbotId: string,
    publicApiKey?: string
  ): Promise<WidgetPublicConfig> => {
    const response = await client.get<WidgetPublicConfig>(
      chatbotsEndpoints.publicWidgetConfig(chatbotId),
      publicApiKey
        ? {
            headers: {
              "X-Widget-Key": publicApiKey,
            },
          }
        : undefined
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
