/**
 * API Module - Main Export
 * Central export for all API functions and utilities
 */

// Core utilities
export { default as client } from "./client";
export { tokenStorage } from "./token-storage";

// Auth API
export {
  authApi,
  type LoginRequest,
  type RegisterRequest,
  type AuthResponse,
  type User,
  type ProfileResponse,
  type RefreshDto,
  type RefreshResponse,
} from "./auth/auth-api";
export { authEndpoints } from "./auth/endpoints";

// Workspaces API
export {
  workspacesApi,
  type CreateWorkspaceDto,
  type UpdateWorkspaceDto,
  type WorkspaceResponseDto,
  type WorkspaceChatbot,
  type PaginatedResponse,
  type ListWorkspacesParams,
} from "./workspaces/workspaces-api";
export { workspacesEndpoints } from "./workspaces/endpoints";

// Chatbots API
export {
  chatbotsApi,
  type CreateChatbotDto,
  type UpdateChatbotDto,
  type Chatbot,
  type ChatDto,
  type ChatResponseDto,
  type ListChatbotsParams,
} from "./chatbots/chatbots-api";
export { chatbotsEndpoints } from "./chatbots/endpoints";

// Conversations API
export {
  conversationsApi,
  type CreateConversationDto,
  type UpdateConversationDto,
  type ConversationResponseDto,
  type ListConversationsParams,
} from "./conversations/conversations-api";
export { conversationsEndpoints } from "./conversations/endpoints";

// Chats API
export { chatsApi } from "./chats/chats-api";
export { chatsEndpoints } from "./chats/endpoints";
// ChatDto and ChatResponseDto are exported from chatbots-api above

// System Roles API
export {
  systemRolesApi,
  type SystemRole,
} from "./system-roles/system-roles-api";
export { systemRolesEndpoints } from "./system-roles/endpoints";

// Messages API
export {
  messagesApi,
  type MessageResponseDto,
  type ListMessagesParams,
} from "./messages/messages-api";
export { messagesEndpoints } from "./messages/endpoints";

// Documents API
export {
  documentsApi,
  type DocumentResponseDto,
  type UpdateDocumentDto,
  type ListDocumentsParams,
} from "./documents/documents-api";
export { documentsEndpoints } from "./documents/endpoints";

// Workspace Invitations API
export {
  workspaceInvitationsApi,
  type AcceptInvitationDto,
  type AcceptInvitationResponseDto,
  type WorkspaceInvitation,
} from "./workspace-invitations/workspace-invitations-api";
export { workspaceInvitationsEndpoints } from "./workspace-invitations/endpoints";
