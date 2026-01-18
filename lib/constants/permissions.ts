// Permission constants for easy reference across the app
export const PERMISSIONS = {
  // Calendar permissions
  CALENDAR_CREATE: "calendar.create",
  CALENDAR_DELETE: "calendar.delete",
  CALENDAR_VIEW: "calendar.view",
  CALENDAR_EDIT: "calendar.edit",

  // Chat permissions
  CHAT_SEND: "chat.send",
  CHAT_DELETE: "chat.delete",
  CHAT_VIEW_HISTORY: "chat.view_history",

  // Chatbot permissions
  CHATBOT_CHAT: "chatbot.chat",
  CHATBOT_CREATE: "chatbot.create",
  CHATBOT_DELETE: "chatbot.delete",
  CHATBOT_DELETE_DATA: "chatbot.delete_data",
  CHATBOT_TRAIN: "chatbot.train",
  CHATBOT_VIEW_LOGS: "chatbot.view_logs",
  CHATBOT_ENABLE: "chatbot.enable",
  CHATBOT_CONFIGURE: "chatbot.configure",
  CHATBOT_UPDATE: "chatbot.update",
  CHATBOT_VIEW: "chatbot.view",

  // Document permissions
  DOCUMENT_UPLOAD: "document.upload",
  DOCUMENT_DELETE: "document.delete",
  DOCUMENT_VIEW: "document.view",
  DOCUMENT_UPDATE: "document.update",

  // Email permissions
  EMAIL_SEND_WORKSPACE: "email.send_workspace",
  EMAIL_SEND: "email.send",
  EMAIL_VIEW_HISTORY: "email.view_history",
  EMAIL_CONFIGURE: "email.configure",

  // Member permissions
  MEMBER_INVITE: "member.invite",
  MEMBER_REMOVE: "member.remove",
  MEMBER_VIEW: "member.view",
  MEMBER_ROLE: "member.role",
  MEMBER_UPDATE_ROLE: "member.update_role",

  // Workspace permissions
  WORKSPACE_DELETE: "workspace.delete",
  WORKSPACE_SETTINGS: "workspace.settings",
  WORKSPACE_UPDATE: "workspace.update",
  WORKSPACE_VIEW_SETTINGS: "workspace.view_settings",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];
