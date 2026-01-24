
import axiosInstance from "./client";

export interface KnowledgeBase {
  id: string;
  name: string;
  description: string;
  icon: string;
  status: "active" | "inactive" | "archived";
  document_count: number;
  total_chunks: number;
  total_size: number;
  created_by_id: string;
  created_at: string;
  updated_at: string;
  documents?: Document[];
}

export interface Document {
  id: string;
  knowledge_id: string;
  file_name: string;
  file_url?: string;
  type: string;
  size: number;
  chunk_count: number;
  status: "pending" | "processing" | "indexed" | "failed";
  processing_progress: number;
  uploaded_at: string;
  user?: {
    email: string;
  };
}

export interface CreateKnowledgeDto {
  name: string;
  description: string;
  icon: string;
}

export interface UpdateKnowledgeDto {
  name?: string;
  description?: string;
  icon?: string;
  status?: string;
}

export interface ChatbotKnowledge {
  knowledge: {
    id: string;
    name: string;
    icon: string;
    document_count: number;
    total_chunks: number;
  };
  is_enabled: boolean;
  priority: number;
}

export interface AddKnowledgeToChatbotDto {
  knowledge_id: string;
  priority?: number;
  is_enabled?: boolean;
}

export interface UpdateChatbotKnowledgeDto {
  is_enabled?: boolean;
  priority?: number;
}

export interface BatchUpdateChatbotKnowledgeDto {
  items: {
    knowledge_id: string;
    is_enabled?: boolean;
    priority?: number;
  }[];
}

export const knowledgeApi = {
  // Knowledge Bases
  list: async (workspaceId: string) => {
    const res = await axiosInstance.get<KnowledgeBase[]>(`/workspaces/${workspaceId}/knowledge`);
    return res.data;
  },

  get: async (workspaceId: string, knowledgeId: string) => {
    const res = await axiosInstance.get<KnowledgeBase>(`/workspaces/${workspaceId}/knowledge/${knowledgeId}`);
    return res.data;
  },

  create: async (workspaceId: string, data: CreateKnowledgeDto) => {
    const res = await axiosInstance.post<KnowledgeBase>(`/workspaces/${workspaceId}/knowledge`, data);
    return res.data;
  },

  update: async (workspaceId: string, knowledgeId: string, data: UpdateKnowledgeDto) => {
    const res = await axiosInstance.put<KnowledgeBase>(`/workspaces/${workspaceId}/knowledge/${knowledgeId}`, data);
    return res.data;
  },

  delete: async (workspaceId: string, knowledgeId: string) => {
    await axiosInstance.delete(`/workspaces/${workspaceId}/knowledge/${knowledgeId}`);
  },

  // Documents (Assuming these endpoints exist as per previous context, though not in latest snippet)
  upload: async (workspaceId: string, formData: FormData) => {
    const res = await axiosInstance.post<Document>(`/workspaces/${workspaceId}/documents`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  },

  deleteDocument: async (workspaceId: string, documentId: string) => {
     await axiosInstance.delete(`/workspaces/${workspaceId}/documents/${documentId}`);
  },

  // Chatbot Knowledge
  getChatbotKnowledge: async (workspaceId: string, chatbotId: string) => {
    const res = await axiosInstance.get<ChatbotKnowledge[]>(`/workspaces/${workspaceId}/chatbots/${chatbotId}/knowledge`);
    return res.data;
  },

  addChatbotKnowledge: async (workspaceId: string, chatbotId: string, data: AddKnowledgeToChatbotDto) => {
    const res = await axiosInstance.post(`/workspaces/${workspaceId}/chatbots/${chatbotId}/knowledge`, data);
    return res.data;
  },

  updateChatbotKnowledge: async (workspaceId: string, chatbotId: string, knowledgeId: string, data: UpdateChatbotKnowledgeDto) => {
    const res = await axiosInstance.put(`/workspaces/${workspaceId}/chatbots/${chatbotId}/knowledge/${knowledgeId}`, data);
    return res.data;
  },

  removeChatbotKnowledge: async (workspaceId: string, chatbotId: string, knowledgeId: string) => {
    await axiosInstance.delete(`/workspaces/${workspaceId}/chatbots/${chatbotId}/knowledge/${knowledgeId}`);
  },
  
  batchUpdateChatbotKnowledge: async (workspaceId: string, chatbotId: string, data: BatchUpdateChatbotKnowledgeDto) => {
    const res = await axiosInstance.post(`/workspaces/${workspaceId}/chatbots/${chatbotId}/knowledge/batch`, data);
    return res.data;
  },

  // Document Progress (SSE)
  getUploadProgressUrl: (workspaceId: string, documentId: string) => {
    // Default to localhost:4000 without /api/v1 as per user feedback
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
    return `${baseUrl}/workspaces/${workspaceId}/documents/${documentId}/progress`;
  },

  // Secure Document Access
  getAccessToken: async (workspaceId: string, documentId: string) => {
    const res = await axiosInstance.get<{ token: string }>(`/workspaces/${workspaceId}/documents/${documentId}/access-token`);
    return res.data;
  }
};

