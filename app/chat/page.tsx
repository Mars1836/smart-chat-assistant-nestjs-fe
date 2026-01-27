"use client";

import { AppLayout } from "@/components/app-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, Send, Loader2, Bot, ChevronDown, Check } from "lucide-react";
import { useState, useEffect } from "react";
import {
  chatbotsApi,
  workspacesApi,
  conversationsApi,
  chatsApi,
  messagesApi,
  type WorkspaceResponseDto,
  type Chatbot,
  type ConversationResponseDto,
  type MessageResponseDto,
  type ChatFile,
} from "@/lib/api";
import { API_BASE_URL } from "@/lib/constants";
import { FileIcon, Download } from "lucide-react";
import { toast } from "sonner";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  files?: ChatFile[];
}

export default function ChatPage() {
  const [workspaces, setWorkspaces] = useState<WorkspaceResponseDto[]>([]);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(
    null
  );
  const [conversations, setConversations] = useState<ConversationResponseDto[]>(
    []
  );
  const [chatbots, setChatbots] = useState<Chatbot[]>([]);
  const [currentChatbot, setCurrentChatbot] = useState<Chatbot | null>(null);
  const [currentConversation, setCurrentConversation] =
    useState<ConversationResponseDto | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [selectedConversationId, setSelectedConversationId] = useState<
    string | null
  >(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [loadingChatbot, setLoadingChatbot] = useState(false);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const getFileUrl = (url: string) => {
    if (url.startsWith("http")) return url;
    return `${API_BASE_URL}${url}`;
  };

  // Load workspaces on mount
  useEffect(() => {
    loadWorkspaces();
  }, []);

  const loadWorkspaces = async () => {
    try {
      setLoading(true);
      const response = await workspacesApi.list();
      setWorkspaces(response.data);
      if (response.data.length > 0) {
        setSelectedWorkspaceId(response.data[0].id);
        await loadChatbots(response.data[0].id);
      }
    } catch (err) {
      const message = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message;
      setError(message || "Failed to load workspaces");
      console.error("Error loading workspaces:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadChatbots = async (workspaceId: string) => {
    try {
      const response = await chatbotsApi.list(workspaceId, {
        page: 1,
        limit: 100,
      });
      setChatbots(response.data);
      // Select first chatbot if available
      if (response.data.length > 0) {
        await switchChatbot(workspaceId, response.data[0].id);
      }
    } catch (err) {
      console.error("Error loading chatbots:", err);
      toast.error("Lỗi tải danh sách chatbot", {
        description: "Không thể tải danh sách chatbot",
      });
    }
  };

  const loadConversations = async (workspaceId: string) => {
    try {
      setLoadingConversations(true);
      const response = await conversationsApi.listByWorkspace(workspaceId, {
        page: 1,
        limit: 100,
        sortBy: "created_at",
        sortOrder: "DESC",
      });
      setConversations(response.data);
    } catch (err) {
      console.error("Error loading conversations:", err);
      toast.error("Lỗi tải danh sách cuộc hội thoại", {
        description: "Không thể tải danh sách cuộc hội thoại",
      });
    } finally {
      setLoadingConversations(false);
    }
  };

  const switchChatbot = async (workspaceId: string, chatbotId: string) => {
    try {
      setLoadingChatbot(true);
      const bot = await chatbotsApi.get(workspaceId, chatbotId);
      setCurrentChatbot(bot);
      // Load conversations for this workspace
      await loadConversations(workspaceId);
      // Reset selected conversation and messages
      setSelectedConversationId(null);
      setCurrentConversation(null);
      setMessages([
        {
          id: "welcome",
          role: "assistant",
          content: bot.greeting_message || "Hello! How can I help you?",
          timestamp: new Date(),
        },
      ]);
    } catch (err) {
      console.error("Error loading chatbot:", err);
      toast.error("Lỗi tải chatbot", {
        description: "Không thể tải thông tin chatbot",
      });
    } finally {
      setLoadingChatbot(false);
    }
  };

  const loadMessages = async (conversationId: string): Promise<Message[]> => {
    try {
      setLoadingMessages(true);
      const response = await messagesApi.listByConversation(conversationId, {
        page: 1,
        limit: 100,
        sortBy: "created_at",
        sortOrder: "ASC",
      });

      // Convert MessageResponseDto to Message format
      return response.data.map((msg: MessageResponseDto) => ({
        id: msg.id,
        role: msg.sender_type === "user" ? "user" : "assistant" as const,
        content: msg.content,
        timestamp: new Date(msg.created_at),
        files: msg.attachments,
      }));
    } catch (err) {
      console.error("Error loading messages:", err);
      toast.error("Lỗi tải tin nhắn", {
        description: "Không thể tải lịch sử tin nhắn",
      });
      return [];
    } finally {
      setLoadingMessages(false);
    }
  };

  const switchConversation = async (conversationId: string) => {
    try {
      // Load conversation detail from API
      const conversation = await conversationsApi.get(conversationId);
      if (!conversation || !currentChatbot) return;

      setSelectedConversationId(conversationId);
      setCurrentConversation(conversation);

      // Load messages from API
      const historyMessages = await loadMessages(conversationId);

      if (historyMessages.length > 0) {
        // Show history messages
        setMessages(historyMessages);
      } else {
        // No history, show greeting message
        setMessages([
          {
            id: "welcome",
            role: "assistant",
            content:
              currentChatbot.greeting_message || "Hello! How can I help you?",
            timestamp: new Date(conversation.started_at),
          },
        ]);
      }
    } catch (err) {
      console.error("Error loading conversation:", err);
      toast.error("Lỗi tải cuộc hội thoại", {
        description: "Không thể tải thông tin cuộc hội thoại",
      });
    }
  };

  const handleCreateConversation = async () => {
    if (!selectedWorkspaceId || !currentChatbot) {
      toast.error("Vui lòng chọn chatbot");
      return;
    }

    try {
      const newConversation = await conversationsApi.create({
        workspace_id: selectedWorkspaceId,
        chatbot_id: currentChatbot.id,
      });

      // Reload conversations
      await loadConversations(selectedWorkspaceId);

      // Switch to new conversation
      await switchConversation(newConversation.id);

      toast.success("Đã tạo cuộc hội thoại mới");
    } catch (err: any) {
      console.error("Error creating conversation:", err);
      toast.error("Lỗi tạo cuộc hội thoại", {
        description:
          err?.response?.data?.message || "Không thể tạo cuộc hội thoại mới",
      });
    }
  };

  const handleSendMessage = async () => {
    if (
      !inputValue.trim() ||
      !selectedWorkspaceId ||
      !currentChatbot ||
      sending
    )
      return;

    // Create conversation if not exists
    let conversationId = selectedConversationId;
    if (!conversationId) {
      try {
        const newConversation = await conversationsApi.create({
          workspace_id: selectedWorkspaceId,
          chatbot_id: currentChatbot.id,
        });
        conversationId = newConversation.id;
        setSelectedConversationId(newConversation.id);
        setCurrentConversation(newConversation);
        // Reload conversations
        await loadConversations(selectedWorkspaceId);
      } catch (err: any) {
        toast.error("Lỗi tạo cuộc hội thoại", {
          description:
            err?.response?.data?.message || "Không thể tạo cuộc hội thoại",
        });
        return;
      }
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: inputValue,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    const messageText = inputValue;
    setInputValue("");
    setSending(true);

    try {
      // Use chatsApi with conversation context
      const response = await chatsApi.sendMessageWithConversation(
        selectedWorkspaceId,
        currentChatbot.id,
        conversationId,
        messageText
      );

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response.response,
        timestamp: new Date(),
        files: response.files,
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (err) {
      console.error("Error sending message:", err);
      const errObj = err as { response?: { data?: { message?: string } } };
      const message =
        errObj?.response?.data?.message || "Failed to send message";
      setError(message);
      toast.error("Lỗi gửi tin nhắn", {
        description: message,
      });
      // Remove the user message on error
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <AppLayout activeModule="chat">
        <div className="flex items-center justify-center h-full">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout activeModule="chat">
      <div className="flex h-full">
        {/* Conversations Sidebar */}
        <div className="w-64 border-r border-border bg-card flex flex-col">
          <div className="p-4 border-b border-border">
            <Button
              onClick={handleCreateConversation}
              className="w-full gap-2 bg-primary hover:bg-primary/90"
              disabled={!currentChatbot}
            >
              <Plus className="w-4 h-4" />
              Cuộc hội thoại mới
            </Button>
          </div>

          <div className="flex-1 overflow-auto p-2 space-y-2">
            {loadingConversations ? (
              <div className="p-4 text-center">
                <Loader2 className="w-5 h-5 animate-spin text-primary mx-auto" />
              </div>
            ) : !currentChatbot ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                Chưa có chatbot nào. Hãy tạo chatbot mới trong trang quản lý.
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                Chưa có cuộc hội thoại nào. Hãy tạo cuộc hội thoại mới.
              </div>
            ) : (
              conversations.map((conv) => {
                const convDate = new Date(conv.created_at);
                const isActive = selectedConversationId === conv.id;
                return (
                  <div
                    key={conv.id}
                    onClick={() => switchConversation(conv.id)}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      isActive
                        ? "bg-primary/10 border border-primary/20"
                        : "hover:bg-muted"
                    }`}
                  >
                    <p className="font-medium text-sm text-foreground truncate">
                      Cuộc hội thoại {conv.id.slice(0, 8)}
                    </p>
                    <p className="text-xs text-muted-foreground truncate mt-1">
                      {convDate.toLocaleDateString("vi-VN", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Chatbot Info Header */}
          {currentChatbot && (
            <div className="border-b border-border bg-card p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Bot className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">
                      {currentChatbot.name}
                    </h3>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                      <span>{currentChatbot.llm_model}</span>
                      <span>•</span>
                      <span
                        className={
                          currentChatbot.enabled
                            ? "text-green-600 dark:text-green-400"
                            : "text-red-600 dark:text-red-400"
                        }
                      >
                        {currentChatbot.enabled ? "Đang hoạt động" : "Đã tắt"}
                      </span>
                      {currentChatbot.language && (
                        <>
                          <span>•</span>
                          <span>{currentChatbot.language.toUpperCase()}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Chatbot Switcher */}
                {chatbots.length > 1 && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        disabled={loadingChatbot}
                      >
                        <Bot className="w-4 h-4" />
                        Chuyển chatbot
                        <ChevronDown className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      {chatbots.map((bot) => (
                        <DropdownMenuItem
                          key={bot.id}
                          onClick={() => {
                            if (
                              selectedWorkspaceId &&
                              bot.id !== currentChatbot?.id
                            ) {
                              switchChatbot(selectedWorkspaceId, bot.id);
                            }
                          }}
                          className={
                            currentChatbot?.id === bot.id ? "bg-primary/10" : ""
                          }
                        >
                          <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <Bot className="w-4 h-4 shrink-0" />
                              <span className="truncate">{bot.name}</span>
                            </div>
                            {currentChatbot.id === bot.id && (
                              <Check className="w-4 h-4 text-primary shrink-0" />
                            )}
                          </div>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-auto p-6 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <Card
                  className={`max-w-md px-4 py-3 group ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground border-0"
                      : "bg-muted text-foreground"
                  }`}
                >
                  <p className="text-sm decoration-slice whitespace-pre-wrap">{message.content}</p>
                  
                  {message.files && message.files.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {message.files.map((file, index) => {
                        if (file.type === "image") {
                          return (
                            <div key={index} className="rounded-lg overflow-hidden border bg-background/50">
                              <img 
                                src={getFileUrl(file.url)} 
                                alt={file.filename}
                                className="w-full h-auto max-h-[300px] object-contain"
                              />
                            </div>
                          );
                        }
                        return (
                          <div key={index} className="flex items-center gap-3 p-3 rounded-lg border bg-background/50 hover:bg-background transition-colors">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                              <FileIcon className="w-5 h-5 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate text-sm">{file.filename}</p>
                              <p className="text-xs text-muted-foreground">
                                {file.size ? `${(file.size / 1024).toFixed(1)} KB` : "Unknown size"}
                              </p>
                            </div>
                            <a 
                              href={getFileUrl(file.url)} 
                              download={file.filename}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
                            >
                              <Download className="w-4 h-4 text-muted-foreground" />
                            </a>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  <p className={`text-[10px] mt-1 text-right opacity-0 group-hover:opacity-100 transition-opacity ${
                    message.role === "user" ? "text-primary-foreground/70" : "text-muted-foreground"
                  }`}>
                    {message.timestamp.toLocaleTimeString("vi-VN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </Card>
              </div>
            ))}
          </div>

          {/* Input Area */}
          <div className="border-t border-border p-4 bg-card">
            {currentChatbot && !currentChatbot.enabled && (
              <div className="mb-3 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-sm text-yellow-700 dark:text-yellow-400">
                ⚠️ Chatbot này đang bị tắt. Vui lòng bật chatbot để sử dụng.
              </div>
            )}
            <div className="flex gap-2">
              <Input
                placeholder={
                  currentChatbot?.enabled
                    ? "Type your message..."
                    : "Chatbot đang tắt..."
                }
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) =>
                  e.key === "Enter" && !sending && handleSendMessage()
                }
                className="flex-1 h-10"
                disabled={sending || !currentChatbot?.enabled}
              />
              <Button
                onClick={handleSendMessage}
                className="bg-primary hover:bg-primary/90 gap-2"
                disabled={
                  sending || !inputValue.trim() || !currentChatbot?.enabled
                }
              >
                {sending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
            {error && (
              <div className="mt-2 text-sm text-destructive">{error}</div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
