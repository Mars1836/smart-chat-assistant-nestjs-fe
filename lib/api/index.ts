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
  type WorkspaceWallet,
  type WorkspaceVietQRTopup,
  type BillingTransaction,
  type BillingTransactionUser,
  type ListBillingTransactionsParams,
} from "./workspaces/workspaces-api";
export { workspacesEndpoints } from "./workspaces/endpoints";

// Chatbots API
export {
  chatbotsApi,
  type ConversationStarter,
  type CreateChatbotDto,
  type UpdateChatbotDto,
  type Chatbot,
  type ChatDto,
  type ChatResponseDto,
  type ChatFile,
  type ChatCard,
  type UploadedImage,
  type ListChatbotsParams,
  type WidgetConfig,
  type WidgetConfigApiDto,
  type WidgetPublicConfig,
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
export { chatsApi, type ChatProcessingEvent } from "./chats/chats-api";
export { chatsEndpoints } from "./chats/endpoints";
// ChatDto and ChatResponseDto are exported from chatbots-api above

// Users API
export {
  usersApi,
  type UserProfileDto,
  type CreateUserDto,
  type UpdateUserDto,
  type ListUsersParams,
  type UserStatsSummary,
  type UserStatsByDateItem,
  type ListUserStatsByDateParams,
} from "./users/users-api";
export { usersEndpoints } from "./users/endpoints";

// Payments API
export {
  paymentsApi,
  type Payment,
  type PaymentUser,
  type ListPaymentsParams,
  type PaymentStatsSummary,
  type PaymentStatsSummaryParams,
  type PaymentStatsByDateItem,
  type ListPaymentStatsByDateParams,
} from "./payments/payments-api";
export { paymentsEndpoints } from "./payments/endpoints";

// LLM Models API
export {
  llmModelsApi,
  type LlmModelPricingItem,
  type LlmModel,
  type CreateLlmModelDto,
  type UpdateLlmModelDto,
  type ListLlmModelsParams,
} from "./llm-models/llm-models-api";
export { llmModelsEndpoints } from "./llm-models/endpoints";

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
  type MessageTokenUsage,
  type MessageToolUsed,
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

// Tools API
export {
  toolsApi,
  toolActionsApi,
  workspaceToolsApi,
  chatbotToolsApi,
  type Plugin,
  type Tool,
  type PluginAction,
  type PluginAuthType,
  type PluginAuthConfig,
  type UserAuthStatus,
  type WorkspaceToolConfig,
  type ChatbotTool,
  type ToolCategory,
  type ToolExecutorType,
  type CreateToolDto,
  type UpdateToolDto,
  type CreateToolActionDto,
  type UpdateToolActionDto,
  type ToolAction,
  type CardConfig,
  type AddWorkspaceToolDto,
  type UpdateWorkspaceToolDto,
  type ListPluginsParams,
  type UpdateChatbotToolDto,
  type UpdateActionDto,
  type BatchActionsDto,
  type OAuthAuthorizeResponse,
  type OAuthStatusResponse,
  type LLMFunctionDeclaration,
  type ExecuteToolDto,
  type ExecuteToolResponseDto,
  type ListToolsParams,
  type CreateCustomToolDto,
} from "./tools/tools-api";
export {
  toolsEndpoints,
  toolActionsEndpoints,
  workspaceToolsEndpoints,
  chatbotToolsEndpoints,
} from "./tools/endpoints";

// Admin Workspaces Stats API
export {
  adminWorkspacesApi,
  type WorkspaceChatbotStatsSummary,
} from "./admin-workspaces/admin-workspaces-api";
export { adminWorkspacesEndpoints } from "./admin-workspaces/endpoints";

// Admin Knowledge Stats API
export {
  adminKnowledgeApi,
  type KnowledgeStatsSummary,
} from "./admin-knowledge/admin-knowledge-api";
export { adminKnowledgeEndpoints } from "./admin-knowledge/endpoints";
