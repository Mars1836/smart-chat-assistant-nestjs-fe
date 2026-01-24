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
import { Loader2, Send, Bot, User, FileIcon, Download } from "lucide-react";
import {
  chatsApi,
  conversationsApi,
  messagesApi,
  type ChatFile,
} from "@/lib/api";
import { API_BASE_URL } from "@/lib/constants";

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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const getFileUrl = (url: string) => {
    if (url.startsWith("http")) return url;
    return `${API_BASE_URL}${url}`;
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
  }, [open, chatbotId]);

  const loadHistory = async () => {
    try {
      // 1. Find existing conversation
      const convs = await conversationsApi.listByChatbot(chatbotId, {
        limit: 1,
        sortBy: "created_at",
        sortOrder: "DESC",
      });

      if (convs.data.length > 0) {
        const lastConv = convs.data[0];
        setConversationId(lastConv.id);

        // 2. Load messages
        const history = await messagesApi.listByConversation(lastConv.id, {
          limit: 100,
          sortBy: "created_at",
          sortOrder: "ASC",
        });

        const mappedMessages: Message[] = history.data.map((msg) => ({
          id: msg.id,
          role: msg.sender_type === "bot" ? "assistant" : "user",
          content: msg.content,
          timestamp: new Date(msg.created_at),
          files: msg.attachments, // Map attachments to files
        }));

        setMessages(mappedMessages);
      } else {
        setMessages([]);
        setConversationId(null);
      }
    } catch (err) {
      console.error("Error loading history:", err);
      toast.error("Failed to load chat history");
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || sending) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setSending(true);

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

      // Send message with conversation ID
      const response = await chatsApi.sendMessageWithConversation(
        workspaceId,
        chatbotId,
        currentConversationId,
        userMessage.content
      );

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response.response,
        timestamp: new Date(),
        files: response.files,
      };

      setMessages((prev) => [...prev, aiMessage]);
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
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-4">
              <Bot className="w-12 h-12 mb-3 opacity-20" />
              <p className="text-sm font-medium">Bắt đầu trò chuyện với {chatbotName}</p>
              <p className="text-xs mt-1">Chatbot có thể sử dụng các plugin đã được kích hoạt.</p>
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
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-none"
                      : message.isError 
                        ? "bg-destructive/10 text-destructive border border-destructive/20 rounded-bl-none"
                        : "bg-card border shadow-sm rounded-bl-none"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                  
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
              <div className="bg-card border shadow-sm rounded-2xl rounded-bl-none px-4 py-2 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                <span className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                <span className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce"></span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-3 border-t bg-background">
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              placeholder="Nhập tin nhắn..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) =>
                e.key === "Enter" && !e.shiftKey && handleSendMessage()
              }
              disabled={sending}
              className="flex-1"
              autoComplete="off"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || sending}
              size="icon"
              className={sending ? "opacity-50" : ""}
            >
              {sending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
