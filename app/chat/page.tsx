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
import { Plus, Send, Loader2, Bot, ChevronDown, Check, ImagePlus, X, ChevronUp } from "lucide-react";
import { useState, useEffect, useRef } from "react";
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
  type ChatCard,
  type UploadedImage,
  type MessageTokenUsage,
  type MessageToolUsed,
  type ChatProcessingEvent,
} from "@/lib/api";
import { API_BASE_URL } from "@/lib/constants";
import { FileIcon, Download } from "lucide-react";
import { toast } from "sonner";
import { ImageViewer } from "@/components/image-viewer";
import { MarkdownContent } from "@/components/markdown-content";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  files?: ChatFile[];
  userImages?: UploadedImage[];
  cards?: ChatCard[];
  token_usage?: MessageTokenUsage | null;
  tools_used?: MessageToolUsed[] | null;
}

function ToolUsedBlock({ tool }: { tool: MessageToolUsed }) {
  const [expandResult, setExpandResult] = useState(false);
  const resultStr =
    typeof tool.result === "string"
      ? tool.result
      : JSON.stringify(tool.result, null, 2);
  const isLong = resultStr.length > 200;
  return (
    <div className="rounded border border-border bg-background/50 p-2 space-y-1">
      <p className="font-medium text-foreground">{tool.tool_name}</p>
      <p className="text-muted-foreground">
        <span className="text-muted-foreground/80">Args:</span>{" "}
        <code className="text-[10px] break-all">
          {JSON.stringify(tool.args, null, 2)}
        </code>
      </p>
      <div>
        <span className="text-muted-foreground/80">Result:</span>{" "}
        {isLong && !expandResult ? (
          <>
            <code className="text-[10px] block mt-1 whitespace-pre-wrap break-all line-clamp-3">
              {resultStr.slice(0, 200)}…
            </code>
            <button
              type="button"
              className="text-primary hover:underline mt-1 text-[10px]"
              onClick={() => setExpandResult(true)}
            >
              Mở rộng
            </button>
          </>
        ) : (
          <code className="text-[10px] block mt-1 whitespace-pre-wrap break-all max-h-40 overflow-auto">
            {resultStr}
          </code>
        )}
        {isLong && expandResult && (
          <button
            type="button"
            className="text-primary hover:underline mt-1 text-[10px]"
            onClick={() => setExpandResult(false)}
          >
            Thu gọn
          </button>
        )}
      </div>
    </div>
  );
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
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [viewingImage, setViewingImage] = useState<string | null>(null);
  const [openDetailsId, setOpenDetailsId] = useState<string | null>(null);
  const [processingEvents, setProcessingEvents] = useState<ChatProcessingEvent[]>([]);
  const [processingStatus, setProcessingStatus] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const MAX_IMAGES = 5;
  const MAX_SIZE = 10 * 1024 * 1024; // 10MB

  const getFileUrl = (url: string) => {
    if (url.startsWith("http")) return url;
    return `${API_BASE_URL}${url}`;
  };

  const starterButtons = currentChatbot?.conversation_starters ?? [];
  const hasConversationMessages = messages.some(
    (message) => message.role === "user"
  );
  const shouldShowStarterButtons =
    !!currentChatbot &&
    starterButtons.length > 0 &&
    !hasConversationMessages &&
    !loadingMessages &&
    !sending;

  // Add images with validation
  const addImages = (files: File[]) => {
    const validFiles = files.filter((f) => {
      if (!f.type.startsWith("image/")) {
        toast.error(`${f.name} không phải là ảnh`);
        return false;
      }
      if (f.size > MAX_SIZE) {
        toast.error(`Ảnh ${f.name} vượt quá 10MB`);
        return false;
      }
      return true;
    });

    const total = selectedImages.length + validFiles.length;
    if (total > MAX_IMAGES) {
      toast.error(`Tối đa ${MAX_IMAGES} ảnh`);
      return;
    }

    setSelectedImages((prev) => [...prev, ...validFiles]);
    const newPreviews = validFiles.map((file) => URL.createObjectURL(file));
    setImagePreviews((prev) => [...prev, ...newPreviews]);
  };

  // Handle paste from clipboard
  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    const imageFiles: File[] = [];
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith("image/")) {
        const file = items[i].getAsFile();
        if (file) imageFiles.push(file);
      }
    }

    if (imageFiles.length > 0) {
      e.preventDefault();
      addImages(imageFiles);
    }
  };

  // Remove image from selection
  const removeImage = (index: number) => {
    URL.revokeObjectURL(imagePreviews[index]); // Cleanup memory
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    addImages(files);
    e.target.value = "";
  };

  // Note: We don't revoke blob URLs automatically because they are used in message history
  // They will be cleaned up when the page is navigated away

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

  const loadConversations = async (chatbotId: string) => {
    try {
      setLoadingConversations(true);
      const response = await conversationsApi.listByChatbot(chatbotId, {
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
      // Load conversations for the current chatbot only
      await loadConversations(chatbotId);
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
        token_usage: msg.token_usage ?? undefined,
        tools_used: msg.tools_used ?? undefined,
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
      await loadConversations(currentChatbot.id);

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

  const handleSendMessage = async (starterMessage?: string) => {
    const outgoingMessage = starterMessage ?? inputValue.trim();

    if (
      (!outgoingMessage && selectedImages.length === 0) ||
      !selectedWorkspaceId ||
      !currentChatbot ||
      sending
    )
      return;

    // Store current images for the message
    const useSelectedImages = typeof starterMessage !== "string";
    const currentImages = useSelectedImages ? [...selectedImages] : [];
    const currentPreviews = useSelectedImages ? [...imagePreviews] : [];

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
          await loadConversations(currentChatbot.id);
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
      content: outgoingMessage,
      timestamp: new Date(),
      userImages: currentPreviews.map((preview, index) => ({
        id: `temp-${index}`,
        url: preview,
        filename: currentImages[index]?.name || `image-${index}`,
        mime_type: currentImages[index]?.type || "image/jpeg",
        size: currentImages[index]?.size || 0,
      })),
    };
    setMessages((prev) => [...prev, userMessage]);
    const messageText = outgoingMessage;
    setInputValue("");
    setSelectedImages([]);
    setImagePreviews([]);
    setSending(true);
    setProcessingEvents([]);
    setProcessingStatus("Đang xử lý...");

    try {
      const streamController = new AbortController();
      const streamPromise = chatsApi
        .streamConversationEvents(
          selectedWorkspaceId,
          conversationId,
          streamController.signal,
          (event) => {
            setProcessingEvents((prev) => [...prev, event]);
            setProcessingStatus(mapEventToStatus(event));
            if (event.type === "completed" || event.type === "failed") {
              streamController.abort();
            }
          }
        )
        .catch((streamError) => {
          if (!streamController.signal.aborted) {
            console.error("Chat SSE stream error:", streamError);
          }
        });

      // Send message with or without images
      let response;
      if (currentImages.length > 0) {
        response = await chatsApi.sendMessageWithImages(
          selectedWorkspaceId,
          currentChatbot.id,
          conversationId,
          messageText,
          currentImages
        );
      } else {
        response = await chatsApi.sendMessageWithConversation(
          selectedWorkspaceId,
          currentChatbot.id,
          conversationId,
          messageText
        );
      }

      if (response.conversation_id && response.conversation_id !== conversationId) {
        setSelectedConversationId(response.conversation_id);
        try {
          const updatedConversation = await conversationsApi.get(
            response.conversation_id
          );
          setCurrentConversation(updatedConversation);
        } catch (err) {
          console.error("Error loading updated conversation:", err);
          setCurrentConversation(null);
        }
        await loadConversations(currentChatbot.id);
      }

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response.response,
        timestamp: new Date(),
        files: response.files,
        cards: response.cards && response.cards.length > 0 ? response.cards : undefined,
        token_usage: response.token_usage ?? undefined,
        tools_used: response.tools_used ?? undefined,
      };
      setMessages((prev) => [...prev, aiMessage]);
      streamController.abort();
      await streamPromise;
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
      setProcessingStatus("");
      setProcessingEvents([]);
    }
  };

  // Helper to render images grid
  const renderImages = (images: { url: string; name?: string }[]) => {
    if (!images.length) return null;
    
    return (
      <div className={`grid gap-1.5 mb-2 ${
        images.length === 1 ? 'grid-cols-1' : 
        images.length === 2 ? 'grid-cols-2' : 
        'grid-cols-2' // 3+ images
      }`}>
        {images.map((img, index) => (
          <div 
            key={index} 
            className={`relative overflow-hidden rounded-md cursor-zoom-in group/image bg-background/50 border ${
              images.length % 2 !== 0 && index === 0 && images.length > 1 ? 'col-span-2' : ''
            }`}
            onClick={() => setViewingImage(img.url)}
          >
            <img
              src={img.url}
              alt={img.name || "Attached image"}
              className="w-full h-auto object-cover max-h-[300px] hover:opacity-95 transition-opacity duration-200"
            />
          </div>
        ))}
      </div>
    );
  };

  const humanizeToolName = (toolName?: string) => {
    if (!toolName) return "tool";
    return (
      toolName
        .split("__")
        .pop()
        ?.replace(/_/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase()) ?? toolName
    );
  };

  const mapEventToStatus = (event: ChatProcessingEvent) => {
    switch (event.type) {
      case "chat_started":
      case "planning":
      case "routing":
        return "Đang xử lý...";
      case "tool_started":
        return `Đang chạy ${humanizeToolName(event.tool_name)}...`;
      case "tool_succeeded":
        return `${humanizeToolName(event.tool_name)} đã hoàn thành`;
      case "tool_failed":
        return `${humanizeToolName(event.tool_name)} thất bại`;
      case "assistant_responding":
        return "Đang tạo câu trả lời...";
      case "completed":
        return "Đã hoàn thành";
      case "failed":
        return "Có lỗi khi xử lý";
      default:
        return "Đang xử lý...";
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
            {messages.map((message) => {
              // Collect all images for this message
              const displayImages: { url: string; name?: string }[] = [];
              
              // 1. User uploaded images (optimistic)
              if (message.userImages) {
                message.userImages.forEach(img => displayImages.push({ url: img.url, name: img.filename }));
              }
              
              // 2. Server files that are images
              if (message.files) {
                message.files.forEach(file => {
                  if (file.type === "image") {
                    displayImages.push({ url: getFileUrl(file.url), name: file.filename });
                  }
                });
              }

              // Filter out files that are NOT images for the separate list
              const otherFiles = message.files?.filter(f => f.type !== "image") || [];

              return (
                <div
                  key={message.id}
                  className={`flex ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div className={`flex flex-col max-w-md ${message.role === "user" ? "items-end" : "items-start"}`}>
                    {/* Render Images OUTSIDE the card (no blue background) */}
                    {displayImages.length > 0 && (
                      <div className={`grid gap-1.5 mb-1 w-full ${
                        displayImages.length === 1 ? 'grid-cols-1' : 
                        displayImages.length === 2 ? 'grid-cols-2' : 
                        'grid-cols-2'
                      }`}>
                        {displayImages.map((img, index) => (
                          <div 
                            key={index} 
                            className={`relative overflow-hidden rounded-lg cursor-zoom-in border border-border bg-muted ${
                              displayImages.length % 2 !== 0 && index === 0 && displayImages.length > 1 ? 'col-span-2' : ''
                            }`}
                            onClick={() => setViewingImage(img.url)}
                          >
                            <img
                              src={img.url}
                              alt={img.name || "Attached image"}
                              className="w-full h-auto object-cover max-h-[300px] hover:opacity-90 transition-opacity duration-200"
                            />
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Text content in Card */}
                    {(message.content || otherFiles.length > 0) && (
                      <Card
                        className={`px-4 py-3 group ${
                          message.role === "user"
                            ? "bg-primary text-primary-foreground border-0"
                            : "bg-muted text-foreground"
                        }`}
                      >
                        {/* Text Content */}
                        {message.content && (
                          message.role === "assistant" ? (
                            <MarkdownContent content={message.content} />
                          ) : (
                            <p className="text-sm box-decoration-slice whitespace-pre-wrap">{message.content}</p>
                          )
                        )}
                        
                        {/* Other Files */}
                        {otherFiles.length > 0 && (
                          <div className="mt-3 space-y-2">
                            {otherFiles.map((file, index) => (
                              <div key={index} className="flex items-center gap-3 p-3 rounded-lg border bg-background/50 hover:bg-background transition-colors">
                                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                  <FileIcon className="w-5 h-5 text-primary" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium truncate text-sm text-foreground">{file.filename}</p>
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
                            ))}
                          </div>
                        )}
                      </Card>
                    )}
                    {message.role === "assistant" && message.cards && message.cards.length > 0 && (
                      <div className="mt-2 grid grid-cols-1 gap-2 w-full max-w-md">
                        {message.cards.map((card, index) => (
                          <a
                            key={index}
                            href={card.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`flex gap-3 rounded-lg border bg-card hover:bg-muted/50 hover:border-primary/30 transition-colors overflow-hidden text-left ${
                              card.type === "product" ? "border-amber-200/50" : card.type === "article" ? "border-blue-200/50" : "border-border"
                            }`}
                          >
                            {card.imageUrl && (
                              <div className="w-20 h-20 shrink-0 bg-muted">
                                <img
                                  src={card.imageUrl}
                                  alt={card.title || card.name || ""}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            )}
                            <div className="flex-1 min-w-0 py-2 pr-2">
                              <p className="font-medium text-sm line-clamp-1 text-foreground">{card.title || card.name || ""}</p>
                              {(card.description || (card.type === "product" && (card.metadata?.brand ?? card.brand))) && (
                                <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                                  {card.description || (card.type === "product" ? (card.metadata?.brand ?? card.brand) : "")}
                                </p>
                              )}
                              {card.type === "product" && (card.metadata?.price != null || card.price != null) && (
                                <p className="text-xs font-medium text-amber-700 dark:text-amber-400 mt-1">
                                  {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format((card.metadata?.price ?? card.price)!)}
                                </p>
                              )}
                              {card.type === "article" && (card.metadata?.author || card.metadata?.publishedAt) && (
                                <p className="text-[10px] text-muted-foreground mt-1">
                                  {[card.metadata.author, card.metadata.publishedAt].filter(Boolean).join(" · ")}
                                </p>
                              )}
                              <p className="text-[10px] text-muted-foreground mt-1 truncate" title={card.url}>
                                {card.metadata?.displayLink ?? (() => {
                                  try { const u = new URL(card.url); return u.hostname + (u.pathname !== "/" ? u.pathname : ""); } catch { return card.url; }
                                })()}
                              </p>
                            </div>
                          </a>
                        ))}
                      </div>
                    )}
                    {/* Nút Chi tiết cho mọi tin nhắn bot → xem tokens & tools nếu có */}
                    {message.role === "assistant" && (
                      <div className="mt-1.5 w-full max-w-md">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-muted-foreground">
                          <span>
                            {(message.token_usage?.input_tokens ?? 0) +
                              (message.token_usage?.output_tokens ?? 0)}{" "}
                            tokens
                          </span>
                          <span>{message.tools_used?.length ?? 0} tool(s)</span>
                          <button
                            type="button"
                            className="text-primary hover:underline inline-flex items-center gap-0.5 font-medium"
                            onClick={() =>
                              setOpenDetailsId((id) =>
                                id === message.id ? null : message.id
                              )
                            }
                          >
                            {openDetailsId === message.id ? (
                              <>Thu gọn <ChevronUp className="w-3 h-3" /></>
                            ) : (
                              <>Chi tiết <ChevronDown className="w-3 h-3" /></>
                            )}
                          </button>
                        </div>
                        {openDetailsId === message.id && (
                          <div className="mt-2 rounded-lg border bg-muted/50 p-3 text-xs space-y-3">
                            <div>
                              <p className="font-medium text-foreground mb-1">
                                Token usage (lượt chat này)
                              </p>
                              <div className="font-mono text-muted-foreground space-y-0.5">
                                <p>Input: {message.token_usage?.input_tokens ?? 0}</p>
                                <p>Output: {message.token_usage?.output_tokens ?? 0}</p>
                                <p className="border-t border-border pt-1 mt-1">
                                  Total:{" "}
                                  {(message.token_usage?.input_tokens ?? 0) +
                                    (message.token_usage?.output_tokens ?? 0)}
                                </p>
                              </div>
                            </div>
                            <div>
                              <p className="font-medium text-foreground mb-1">
                                Tools used ({message.tools_used?.length ?? 0})
                              </p>
                              {(message.tools_used?.length ?? 0) > 0 && (
                                <div className="space-y-2">
                                  {message.tools_used!.map((tool, idx) => (
                                    <ToolUsedBlock key={idx} tool={tool} />
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    <p className={`text-[10px] mt-1 px-1 ${
                      message.role === "user" ? "text-muted-foreground text-right" : "text-muted-foreground"
                    }`}>
                      {message.timestamp.toLocaleTimeString("vi-VN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              );
            })}

            {shouldShowStarterButtons && (
              <div className="flex justify-start">
                <div className="w-full max-w-2xl">
                  <div className="flex flex-wrap gap-2.5">
                    {starterButtons.map((starter, index) => (
                      <Button
                        key={`${starter.label}-${index}`}
                        type="button"
                        variant="outline"
                        className="h-auto min-h-14 max-w-[280px] justify-start whitespace-normal text-left px-4 py-3 text-sm font-medium leading-snug rounded-2xl border-border/70 bg-background/70 text-foreground hover:bg-muted/70 hover:border-border hover:text-foreground"
                        onClick={() => handleSendMessage(starter.message)}
                        disabled={!currentChatbot?.enabled || sending}
                      >
                        {starter.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            )}
            {sending && (
              <div className="flex justify-start">
                <Card className="max-w-md px-4 py-3 bg-muted border border-border">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    <span>{processingStatus || "Đang xử lý..."}</span>
                  </div>
                  {processingEvents.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {processingEvents.slice(-4).map((event, idx) => (
                        <p
                          key={`${event.timestamp ?? idx}-${event.type}-${idx}`}
                          className="text-xs text-muted-foreground"
                        >
                          {mapEventToStatus(event)}
                        </p>
                      ))}
                    </div>
                  )}
                </Card>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="border-t border-border p-4 bg-card">
            {currentChatbot && !currentChatbot.enabled && (
              <div className="mb-3 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-sm text-yellow-700 dark:text-yellow-400">
                ⚠️ Chatbot này đang bị tắt. Vui lòng bật chatbot để sử dụng.
              </div>
            )}
            {/* Image Previews */}
            {imagePreviews.length > 0 && (
              <div className="flex gap-2 mb-3 flex-wrap">
                {imagePreviews.map((preview, index) => (
                  <div
                    key={index}
                    className="relative w-16 h-16 rounded-lg overflow-hidden border bg-muted"
                  >
                    <img
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() => removeImage(index)}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center shadow-sm hover:bg-destructive/90"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileChange}
                className="hidden"
              />
              {/* Attach button */}
              <Button
                variant="outline"
                size="icon"
                onClick={() => fileInputRef.current?.click()}
                disabled={sending || !currentChatbot?.enabled || selectedImages.length >= MAX_IMAGES}
                title="Đính kèm ảnh (hoặc paste Ctrl+V)"
              >
                <ImagePlus className="w-4 h-4" />
              </Button>
              <Input
                ref={inputRef}
                placeholder={
                  currentChatbot?.enabled
                    ? "Nhập tin nhắn..."
                    : "Chatbot đang tắt..."
                }
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) =>
                  e.key === "Enter" && !sending && handleSendMessage()
                }
                onPaste={handlePaste}
                className="flex-1 h-10"
                disabled={sending || !currentChatbot?.enabled}
              />
              <Button
                onClick={() => handleSendMessage()}
                className="bg-primary hover:bg-primary/90 gap-2"
                disabled={
                  sending || (!inputValue.trim() && selectedImages.length === 0) || !currentChatbot?.enabled
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
      <ImageViewer 
        isOpen={!!viewingImage} 
        onClose={() => setViewingImage(null)} 
        imageUrl={viewingImage || ""} 
      />
    </AppLayout>
  );
}
