/**
 * LLM Models API – bảng giá (client) + CRUD (admin)
 */
import client from "../client";
import { llmModelsEndpoints } from "./endpoints";
import type { PaginatedResponse } from "../workspaces/workspaces-api";

/** Item trả về từ GET /llm-models/pricing (client) */
export interface LlmModelPricingItem {
  id: string;
  provider: string;
  model: string;
  display_name: string | null;
  price_per_1k_input_tokens: string;
  price_per_1k_output_tokens: string;
  created_at: string;
  updated_at: string;
}

/** Item đầy đủ cho admin (list/detail/create/update) */
export interface LlmModel {
  id: string;
  provider: string;
  model: string;
  display_name: string | null;
  price_per_1k_input_tokens: string;
  price_per_1k_output_tokens: string;
  created_at: string;
  updated_at: string;
  created_by_id: string | null;
}

export interface CreateLlmModelDto {
  provider: string;
  model: string;
  price_per_1k_input_tokens: number;
  price_per_1k_output_tokens: number;
  display_name?: string;
}

export interface UpdateLlmModelDto {
  price_per_1k_input_tokens?: number;
  price_per_1k_output_tokens?: number;
  display_name?: string | null;
}

export interface ListLlmModelsParams {
  page?: number;
  limit?: number;
  sortBy?: "provider" | "model" | "price_per_1k_input_tokens" | "price_per_1k_output_tokens" | "created_at" | "updated_at";
  sortOrder?: "ASC" | "DESC";
}

export const llmModelsApi = {
  /** GET /llm-models/pricing – bảng giá (mọi user đã đăng nhập) */
  getPricing: async (): Promise<LlmModelPricingItem[]> => {
    const response = await client.get<LlmModelPricingItem[]>(
      llmModelsEndpoints.pricing()
    );
    const data = response.data;
    return Array.isArray(data) ? data : [];
  },

  /** GET /llm-models – danh sách có phân trang (chỉ admin) */
  list: async (
    params?: ListLlmModelsParams
  ): Promise<PaginatedResponse<LlmModel>> => {
    const response = await client.get<PaginatedResponse<LlmModel>>(
      llmModelsEndpoints.list(),
      {
        params: {
          page: params?.page ?? 1,
          limit: params?.limit ?? 10,
          sortBy: params?.sortBy ?? "created_at",
          sortOrder: params?.sortOrder ?? "ASC",
        },
      }
    );
    return response.data;
  },

  /** GET /llm-models/:id – chi tiết (chỉ admin) */
  get: async (id: string): Promise<LlmModel> => {
    const response = await client.get<LlmModel>(llmModelsEndpoints.get(id));
    return response.data;
  },

  /** POST /llm-models – tạo mới (chỉ admin) */
  create: async (data: CreateLlmModelDto): Promise<LlmModel> => {
    const response = await client.post<LlmModel>(
      llmModelsEndpoints.create(),
      data
    );
    return response.data;
  },

  /** PATCH /llm-models/:id – cập nhật (chỉ admin) */
  update: async (id: string, data: UpdateLlmModelDto): Promise<LlmModel> => {
    const response = await client.patch<LlmModel>(
      llmModelsEndpoints.update(id),
      data
    );
    return response.data;
  },

  /** DELETE /llm-models/:id – xóa (chỉ admin) */
  delete: async (id: string): Promise<void> => {
    await client.delete(llmModelsEndpoints.delete(id));
  },
};
