/**
 * Chats API Functions
 * API for sending messages and managing chat interactions
 */
import client from "../client";
import { chatsEndpoints } from "./endpoints";
import type { ChatDto, ChatResponseDto } from "../chatbots/chatbots-api";
import { fetchEventSource } from "@microsoft/fetch-event-source";
import { tokenStorage } from "../token-storage";
import { API_BASE_URL } from "@/lib/constants";

export interface ChatProcessingEvent {
  type:
    | "chat_started"
    | "planning"
    | "routing"
    | "tool_started"
    | "tool_succeeded"
    | "tool_failed"
    | "assistant_responding"
    | "completed"
    | "failed";
  conversation_id: string;
  chatbot_id: string;
  tool_name?: string;
  step?: number;
  message?: string;
  timestamp?: string;
}

// API Functions
export const chatsApi = {
  streamConversationEvents: async (
    workspaceId: string,
    conversationId: string,
    signal: AbortSignal,
    onEvent: (event: ChatProcessingEvent) => void
  ): Promise<void> => {
    const token = tokenStorage.getAccessToken();
    if (!token) {
      throw new Error("Missing access token");
    }

    const url = `${API_BASE_URL}/workspaces/${workspaceId}/chatbots/conversations/${conversationId}/stream`;
    await fetchEventSource(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      signal,
      onmessage(event: { data: string }) {
        if (!event.data) return;
        try {
          const parsed = JSON.parse(event.data) as ChatProcessingEvent;
          if (parsed?.type) {
            onEvent(parsed);
          }
        } catch (error) {
          console.error("Failed to parse chat stream event", error);
        }
      },
      onerror(error: unknown) {
        if (signal.aborted) {
          return;
        }
        throw error;
      },
    });
  },
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
      { message },
      { timeout: 300000 } // 5 minutes
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
      payload,
      { timeout: 300000 } // 5 minutes
    );
    return response.data;
  },

  /**
   * Send a chat message with images
   * Uses FormData for multipart/form-data upload
   * @param images - Array of image files (max 5, each max 10MB)
   */
  sendMessageWithImages: async (
    workspaceId: string,
    chatbotId: string,
    conversationId: string | null,
    message: string,
    images: File[]
  ): Promise<ChatResponseDto> => {
    const formData = new FormData();
    formData.append("message", message);
    if (conversationId) {
      formData.append("conversation_id", conversationId);
    }

    // Append each image
    images.forEach((image) => {
      formData.append("images", image);
    });

    const response = await client.post<ChatResponseDto>(
      chatsEndpoints.sendMessage(workspaceId, chatbotId),
      formData,
      {
        timeout: 300000, // 5 minutes
        headers: {
          // Don't set Content-Type, browser will add boundary automatically
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  },
};
