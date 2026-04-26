"use client";

import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Send, Bot, User, FileIcon, Download, ImagePlus, X, ChevronDown, ChevronUp, Mic, Square } from "lucide-react";
import {
  chatsApi,
  chatbotsApi,
  conversationsApi,
  type ChatFile,
  type ChatCard,
  type UploadedImage,
  type MessageTokenUsage,
  type MessageToolUsed,
  type ChatProcessingEvent,
} from "@/lib/api";
import { API_BASE_URL } from "@/lib/constants";
import { MarkdownContent } from "@/components/markdown-content";

interface ChatbotChatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
  chatbotId: string;
  chatbotName: string;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  isError?: boolean;
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
    <div className="rounded border border-border bg-background/50 p-2 space-y-1 text-xs">
      <p className="font-medium">{tool.tool_name}</p>
      <p className="text-muted-foreground">
        <span className="opacity-80">Args:</span>{" "}
        <code className="text-[10px] break-all">{JSON.stringify(tool.args, null, 2)}</code>
      </p>
      <div>
        <span className="text-muted-foreground opacity-80">Result:</span>{" "}
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

export function ChatbotChatDialog({
  open,
  onOpenChange,
  workspaceId,
  chatbotId,
  chatbotName,
}: ChatbotChatDialogProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [sending, setSending] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [openDetailsId, setOpenDetailsId] = useState<string | null>(null);
  const [processingEvents, setProcessingEvents] = useState<ChatProcessingEvent[]>([]);
  const [processingStatus, setProcessingStatus] = useState("");
  const [starterButtons, setStarterButtons] = useState<
    Array<{ label: string; message: string }>
  >([]);
  const [greetingMessage, setGreetingMessage] = useState<string>("");
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingChunksRef = useRef<Blob[]>([]);
  const recordingStreamRef = useRef<MediaStream | null>(null);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const MAX_IMAGES = 5;
  const MAX_SIZE = 10 * 1024 * 1024; // 10MB

  const formatRecordingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const secs = (seconds % 60).toString().padStart(2, "0");
    return `${mins}:${secs}`;
  };

  const clearRecordingTimer = () => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
  };

  const stopRecordingTracks = () => {
    if (recordingStreamRef.current) {
      recordingStreamRef.current.getTracks().forEach((track) => track.stop());
      recordingStreamRef.current = null;
    }
  };

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
    // Generate previews using Blob URLs
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
    e.target.value = ""; // Reset input
  };

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      imagePreviews.forEach((url) => URL.revokeObjectURL(url));
      clearRecordingTimer();
      stopRecordingTracks();
    };
  }, [imagePreviews]);

  const transcribeAudio = async (audioBlob: Blob) => {
    setIsTranscribing(true);
    try {
      const sttResponse = await chatbotsApi.speechToText(
        workspaceId,
        chatbotId,
        audioBlob
      );
      const text = sttResponse.text?.trim();

      if (!text) {
        toast.error("Không nhận diện được nội dung giọng nói");
        return;
      }

      setInputValue(text);
      await handleSendMessage(text);
    } catch (err: any) {
      console.error("Error transcribing audio:", err);
      toast.error("Không thể chuyển giọng nói thành văn bản", {
        description: err?.response?.data?.message || "Unknown error",
      });
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleStartRecording = async () => {
    if (sending || isTranscribing || isRecording) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      recordingStreamRef.current = stream;
      mediaRecorderRef.current = recorder;
      recordingChunksRef.current = [];
      setRecordingSeconds(0);
      setIsRecording(true);

      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);

      recorder.ondataavailable = (event: BlobEvent) => {
        if (event.data && event.data.size > 0) {
          recordingChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        clearRecordingTimer();
        stopRecordingTracks();
        setIsRecording(false);

        const audioBlob = new Blob(recordingChunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });
        recordingChunksRef.current = [];

        if (!audioBlob.size) {
          toast.error("Không nhận diện được nội dung giọng nói");
          return;
        }

        await transcribeAudio(audioBlob);
      };

      recorder.start();
    } catch (err) {
      console.error("Error starting recording:", err);
      toast.error("Không thể truy cập micro. Vui lòng kiểm tra quyền truy cập.");
      clearRecordingTimer();
      stopRecordingTracks();
      setIsRecording(false);
    }
  };

  const handleStopRecording = () => {
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      recorder.stop();
    }
  };

  const getFileUrl = (url: string) => {
    if (url.startsWith("http")) return url;
    return `${API_BASE_URL}${url}`;
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

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load history on open
  useEffect(() => {
    if (open) {
      loadHistory();
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open, chatbotId, workspaceId]);

  const loadHistory = async () => {
    // Chat thử: luôn bắt đầu cuộc hội thoại mới, không load conversation cũ
    try {
      const bot = await chatbotsApi.get(workspaceId, chatbotId);
      setStarterButtons(bot.conversation_starters ?? []);
      setGreetingMessage(bot.greeting_message || "");
    } catch (err) {
      console.error("Error loading chatbot detail:", err);
      setStarterButtons([]);
      setGreetingMessage("");
    }
    setMessages([]);
    setConversationId(null);
  };

  const handleSendMessage = async (starterMessage?: string) => {
    const outgoingMessage = starterMessage ?? inputValue.trim();
    if ((!outgoingMessage && selectedImages.length === 0) || sending || isTranscribing) return;

    // Store current images for the message
    const useSelectedImages = typeof starterMessage !== "string";
    const currentImages = useSelectedImages ? [...selectedImages] : [];
    const currentPreviews = useSelectedImages ? [...imagePreviews] : [];

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: outgoingMessage,
      timestamp: new Date(),
      // Store preview URLs for display
      userImages: currentPreviews.map((preview, index) => ({
        id: `temp-${index}`,
        url: preview,
        filename: currentImages[index]?.name || `image-${index}`,
        mime_type: currentImages[index]?.type || "image/jpeg",
        size: currentImages[index]?.size || 0,
      })),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setSelectedImages([]);
    setImagePreviews([]);
    setSending(true);
    setProcessingEvents([]);
    setProcessingStatus("Đang xử lý...");

    try {
      let currentConversationId = conversationId;

      // Explicitly create conversation if it doesn't exist
      if (!currentConversationId) {
        const newConversation = await conversationsApi.create({
          workspace_id: workspaceId,
          chatbot_id: chatbotId,
        });
        currentConversationId = newConversation.id;
        setConversationId(newConversation.id);
      }

      const streamController = new AbortController();
      const streamPromise = chatsApi
        .streamConversationEvents(
          workspaceId,
          currentConversationId,
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
          workspaceId,
          chatbotId,
          currentConversationId,
          userMessage.content,
          currentImages
        );
      } else {
        response = await chatsApi.sendMessageWithConversation(
          workspaceId,
          chatbotId,
          currentConversationId,
          userMessage.content
        );
      }

      if (response.conversation_id && response.conversation_id !== currentConversationId) {
        setConversationId(response.conversation_id);
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
    } catch (err: any) {
      console.error("Error sending message:", err);
      const errorMessage =
        err?.response?.data?.message || "Failed to send message";

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: `Error: ${errorMessage}`,
          timestamp: new Date(),
          isError: true,
        },
      ]);
    } finally {
      setSending(false);
      setProcessingStatus("");
      setProcessingEvents([]);
      // Keep focus on input
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };



  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md h-[600px] flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-4 py-3 border-b flex flex-row items-center justify-between space-y-0">
          <DialogTitle className="flex items-center gap-2 text-base">
            <Bot className="w-5 h-5 text-primary" />
            Chat với {chatbotName}
          </DialogTitle>

        </DialogHeader>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/20">
          {messages.length === 0 ? (
            <div className="flex flex-col h-full text-muted-foreground p-2">
              <div className="flex-1 flex flex-col items-center justify-center text-center px-2">
                <Bot className="w-12 h-12 mb-3 opacity-20" />
                <p className="text-sm font-medium">
                {greetingMessage || `Bắt đầu trò chuyện với ${chatbotName}`}
                </p>
              </div>
              {starterButtons.length > 0 && (
                <div className="w-full flex justify-end">
                  <div className="w-full max-w-md flex flex-wrap justify-end gap-2.5">
                    {starterButtons.map((starter, index) => (
                      <Button
                        key={`${starter.label}-${index}`}
                        type="button"
                        variant="outline"
                        className="h-auto min-h-12 max-w-[260px] justify-start whitespace-normal text-left px-4 py-2.5 text-sm font-medium leading-snug rounded-2xl border-border/70 bg-background/70 text-foreground hover:bg-muted/70 hover:border-border hover:text-foreground"
                        onClick={() => handleSendMessage(starter.message)}
                        disabled={sending || isTranscribing || isRecording}
                      >
                        {starter.label}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-2 ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {message.role === "assistant" && (
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center mt-1 shrink-0">
                    <Bot className="w-3 h-3 text-primary" />
                  </div>
                )}
                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm group ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-none"
                      : message.isError 
                        ? "bg-destructive/10 text-destructive border border-destructive/20 rounded-bl-none"
                        : "bg-card border shadow-sm rounded-bl-none"
                  }`}
                >
                  {message.role === "assistant" ? (
                    <MarkdownContent content={message.content} />
                  ) : (
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  )}
                  
                  {/* Display user uploaded images */}
                  {message.userImages && message.userImages.length > 0 && (
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      {message.userImages.map((img, index) => (
                        <div key={index} className="rounded-lg overflow-hidden border">
                          <img
                            src={img.url}
                            alt={img.filename}
                            className="w-full h-auto max-h-[150px] object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {message.files && message.files.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {message.files.map((file, index) => {
                        if (file.type === "image") {
                          return (
                            <div key={index} className="rounded-lg overflow-hidden border">
                              <img 
                                src={getFileUrl(file.url)} 
                                alt={file.filename}
                                className="w-full h-auto max-h-[300px] object-contain bg-background"
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
                  {message.cards && message.cards.length > 0 && (
                    <div className="mt-3 grid grid-cols-1 gap-2">
                      {message.cards.map((card, index) => (
                        <a
                          key={index}
                          href={card.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`flex gap-3 rounded-lg border bg-background/80 hover:bg-background hover:border-primary/30 transition-colors overflow-hidden text-left ${
                            card.type === "product" ? "border-amber-200/50" : card.type === "article" ? "border-blue-200/50" : ""
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
                            <p className="font-medium text-sm line-clamp-1">{card.title || card.name || ""}</p>
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
                  {/* Nút Chi tiết (token & tools) cho tin nhắn bot */}
                  {message.role === "assistant" && !message.isError && (
                    <div className="mt-1.5">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-muted-foreground">
                        <span>
                          {(message.token_usage?.input_tokens ?? 0) + (message.token_usage?.output_tokens ?? 0)} tokens
                        </span>
                        <span>{message.tools_used?.length ?? 0} tool(s)</span>
                        <button
                          type="button"
                          className="text-primary hover:underline inline-flex items-center gap-0.5 font-medium"
                          onClick={() => setOpenDetailsId((id) => (id === message.id ? null : message.id))}
                        >
                          {openDetailsId === message.id ? (
                            <>Thu gọn <ChevronUp className="w-3 h-3" /></>
                          ) : (
                            <>Chi tiết <ChevronDown className="w-3 h-3" /></>
                          )}
                        </button>
                      </div>
                      {openDetailsId === message.id && (
                        <div className="mt-2 rounded-lg border bg-muted/50 p-2.5 text-xs space-y-2">
                          <div>
                            <p className="font-medium mb-1">Token usage</p>
                            <div className="font-mono text-muted-foreground space-y-0.5">
                              <p>Input: {message.token_usage?.input_tokens ?? 0}</p>
                              <p>Output: {message.token_usage?.output_tokens ?? 0}</p>
                              <p className="border-t border-border pt-1 mt-1">
                                Total: {(message.token_usage?.input_tokens ?? 0) + (message.token_usage?.output_tokens ?? 0)}
                              </p>
                            </div>
                          </div>
                          <div>
                            <p className="font-medium mb-1">Tools used ({message.tools_used?.length ?? 0})</p>
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
                  <p className="text-[10px] text-right mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {message.timestamp.toLocaleTimeString("vi-VN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                {message.role === "user" && (
                  <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center mt-1 shrink-0">
                    <User className="w-3 h-3 text-muted-foreground" />
                  </div>
                )}
              </div>
            ))
          )}
          {sending && (
            <div className="flex justify-start gap-2">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center mt-1 shrink-0">
                <Bot className="w-3 h-3 text-primary" />
              </div>
              <div className="bg-card border shadow-sm rounded-2xl rounded-bl-none px-4 py-2">
                <p className="text-xs text-foreground font-medium">
                  {processingStatus || "Đang xử lý..."}
                </p>
                {processingEvents.length > 0 && (
                  <div className="mt-1 space-y-0.5">
                    {processingEvents.slice(-3).map((event, idx) => (
                      <p
                        key={`${event.timestamp ?? idx}-${event.type}-${idx}`}
                        className="text-[10px] text-muted-foreground"
                      >
                        {mapEventToStatus(event)}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-3 border-t bg-background">
          {/* Image Previews */}
          {imagePreviews.length > 0 && (
            <div className="flex gap-2 mb-2 flex-wrap">
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
              disabled={sending || isTranscribing || isRecording || selectedImages.length >= MAX_IMAGES}
              title="Đính kèm ảnh (hoặc paste Ctrl+V)"
            >
              <ImagePlus className="w-4 h-4" />
            </Button>
            <Button
              variant={isRecording ? "destructive" : "outline"}
              size="icon"
              onClick={isRecording ? handleStopRecording : handleStartRecording}
              disabled={sending || isTranscribing}
              title={isRecording ? "Dừng ghi âm" : "Ghi âm"}
            >
              {isRecording ? <Square className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </Button>
            <Input
              ref={inputRef}
              placeholder="Nhập tin nhắn..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) =>
                e.key === "Enter" && !e.shiftKey && handleSendMessage()
              }
              onPaste={handlePaste}
              disabled={sending || isTranscribing}
              className="flex-1"
              autoComplete="off"
            />
            <Button
              onClick={() => handleSendMessage()}
              disabled={(!inputValue.trim() && selectedImages.length === 0) || sending || isTranscribing}
              size="icon"
              className={sending || isTranscribing ? "opacity-50" : ""}
            >
              {sending || isTranscribing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
          {(isRecording || isTranscribing) && (
            <div className="mt-2 text-xs text-muted-foreground">
              {isRecording
                ? `Đang ghi âm: ${formatRecordingTime(recordingSeconds)}`
                : "Đang nhận diện giọng nói..."}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
