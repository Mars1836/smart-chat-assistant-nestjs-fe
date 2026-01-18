/**
 * Documents API Functions
 * API for managing documents in workspaces
 */
import client from "../client";
import { documentsEndpoints } from "./endpoints";
import type { PaginatedResponse } from "../workspaces/workspaces-api";

// Types
export interface DocumentResponseDto {
  id: string;
  workspace_id: string;
  user_id: string;
  file_name: string;
  file_url: string;
  type: string;
  size?: number;
  vector_id?: string;
  uploaded_at: string;
  created_at: string;
  updated_at: string;
}

export interface UpdateDocumentDto {
  file_name?: string;
}

export interface ListDocumentsParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
}

// API Functions
export const documentsApi = {
  /**
   * Get all documents of a workspace with pagination
   */
  list: async (
    workspaceId: string,
    params?: ListDocumentsParams
  ): Promise<PaginatedResponse<DocumentResponseDto>> => {
    const response = await client.get<PaginatedResponse<DocumentResponseDto>>(
      documentsEndpoints.list(workspaceId),
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
   * Upload new document to workspace
   * @param workspaceId - Workspace ID
   * @param file - File to upload
   * @param fileName - Optional custom file name
   * @param type - Optional file type (auto-detected if not provided)
   */
  create: async (
    workspaceId: string,
    file: File,
    fileName?: string,
    type?: string
  ): Promise<DocumentResponseDto> => {
    const formData = new FormData();
    formData.append("file", file);
    if (fileName) {
      formData.append("file_name", fileName);
    }
    if (type) {
      formData.append("type", type);
    }

    const response = await client.post<DocumentResponseDto>(
      documentsEndpoints.create(workspaceId),
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  },

  /**
   * Get document details by ID
   */
  get: async (
    workspaceId: string,
    id: string
  ): Promise<DocumentResponseDto> => {
    const response = await client.get<DocumentResponseDto>(
      documentsEndpoints.get(workspaceId, id)
    );
    return response.data;
  },

  /**
   * Update document information
   */
  update: async (
    workspaceId: string,
    id: string,
    data: UpdateDocumentDto
  ): Promise<DocumentResponseDto> => {
    const response = await client.patch<DocumentResponseDto>(
      documentsEndpoints.update(workspaceId, id),
      data
    );
    return response.data;
  },

  /**
   * Delete document
   */
  delete: async (workspaceId: string, id: string): Promise<void> => {
    await client.delete(documentsEndpoints.delete(workspaceId, id));
  },
};
