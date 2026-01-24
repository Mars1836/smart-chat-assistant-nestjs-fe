"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AppLayout } from "@/components/app-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  Loader2,
  MoreVertical,
  Edit,
  Trash2,
  Bot,
  Search,
  ChevronLeft,
  ChevronRight,
  X,
  Check,
  AlertCircle,
  Plug,
  Settings,
  MessageSquare,
} from "lucide-react";
import { useWorkspace } from "@/lib/stores/workspace-store";
import {
  chatbotsApi,
  type Chatbot,
  type CreateChatbotDto,
  type UpdateChatbotDto,
  type PaginatedResponse,
} from "@/lib/api";
import { ChatbotToolsDialog } from "@/components/chatbot-tools-dialog";
import { ChatbotChatDialog } from "@/components/chatbot-chat-dialog";

export default function ChatbotsPage() {
  const router = useRouter(); // Need to add import { useRouter } from "next/navigation" if not present, but wait, it is imported in line 19? No.
  const { selectedWorkspace } = useWorkspace();
  const [chatbots, setChatbots] = useState<PaginatedResponse<Chatbot> | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [showForm, setShowForm] = useState(false);
  const [editingChatbot, setEditingChatbot] = useState<Chatbot | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  
  // Tools dialog state
  const [toolsDialogOpen, setToolsDialogOpen] = useState(false);
  const [selectedChatbotForTools, setSelectedChatbotForTools] = useState<Chatbot | null>(null);

  // Chat dialog state
  const [chatDialogOpen, setChatDialogOpen] = useState(false);
  const [selectedChatbotForChat, setSelectedChatbotForChat] = useState<Chatbot | null>(null);

  // Form state
  const [formData, setFormData] = useState<CreateChatbotDto>({
    name: "",
    language: "vi",
    personality: "",
    greeting_message: "",
    fallback_message: "",
    confidence_threshold: 0.7,
    max_context_turns: 5,
    enable_learning: true,
    llm_provider: "google-ai-studio",
    llm_model: "gemini-2.0-flash-lite",
    temperature: 0.7,
    max_tokens: 1000,
  });

  useEffect(() => {
    if (selectedWorkspace) {
      loadChatbots();
      loadModels();
    }
  }, [selectedWorkspace, page, limit]);

  const loadChatbots = async () => {
    if (!selectedWorkspace) return;
    try {
      setLoading(true);
      setError("");
      const response = await chatbotsApi.list(selectedWorkspace.id, {
        page,
        limit,
        sortBy: "created_at",
        sortOrder: "DESC",
      });
      setChatbots(response);
    } catch (err: any) {
      const message = err?.response?.data?.message || "Failed to load chatbots";
      setError(message);
      toast.error("Lỗi tải danh sách", {
        description: message,
      });
      console.error("Error loading chatbots:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadModels = async () => {
    if (!selectedWorkspace) return;
    try {
      const models = await chatbotsApi.listModels(selectedWorkspace.id);
      setAvailableModels(models);
    } catch (err) {
      console.error("Error loading models:", err);
    }
  };

  const handleCreate = () => {
    setEditingChatbot(null);
    setFormData({
      name: "",
      language: "vi",
      personality: "",
      greeting_message: "",
      fallback_message: "",
      confidence_threshold: 0.7,
      max_context_turns: 5,
      enable_learning: true,
      llm_provider: "google-ai-studio",
      llm_model: "gemini-2.0-flash-lite",
      temperature: 0.7,
      max_tokens: 1000,
    });
    setShowForm(true);
  };

  const handleEdit = (chatbot: Chatbot) => {
    setEditingChatbot(chatbot);
    setFormData({
      name: chatbot.name,
      language: chatbot.language,
      personality: chatbot.personality || "",
      greeting_message: chatbot.greeting_message || "",
      fallback_message: chatbot.fallback_message || "",
      confidence_threshold: chatbot.confidence_threshold,
      max_context_turns: chatbot.max_context_turns,
      enable_learning: chatbot.enable_learning,
      llm_provider: chatbot.llm_provider,
      llm_model: chatbot.llm_model,
      temperature: chatbot.temperature,
      max_tokens: chatbot.max_tokens,
    });
    setShowForm(true);
  };

  const handleOpenTools = (chatbot: Chatbot) => {
    setSelectedChatbotForTools(chatbot);
    setToolsDialogOpen(true);
  };

  const handleChat = (chatbot: Chatbot) => {
    setSelectedChatbotForChat(chatbot);
    setChatDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!selectedWorkspace || !formData.name.trim()) {
      toast.error("Vui lòng nhập tên chatbot");
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      const promise = editingChatbot
        ? chatbotsApi.update(
            selectedWorkspace.id,
            editingChatbot.id,
            formData as UpdateChatbotDto
          )
        : chatbotsApi.create(selectedWorkspace.id, formData);

      const result = await promise;

      toast.success(
        editingChatbot
          ? "Cập nhật chatbot thành công"
          : "Tạo chatbot thành công",
        {
          description: `Chatbot "${formData.name}" đã được ${
            editingChatbot ? "cập nhật" : "tạo"
          }`,
        }
      );

      setShowForm(false);
      setEditingChatbot(null);
      await loadChatbots();

      // If created new chatbot, open tools dialog to assign plugins
      if (!editingChatbot) {
         // Show success message with hint
        toast.message("Tiếp theo: Gán Plugins", {
          description: "Hãy chọn các công cụ/plugins cho chatbot này.",
        });
        
        setSelectedChatbotForTools(result);
        setToolsDialogOpen(true);
      }
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        `Failed to ${editingChatbot ? "update" : "create"} chatbot`;
      setError(message);
      toast.error(editingChatbot ? "Lỗi cập nhật chatbot" : "Lỗi tạo chatbot", {
        description: message,
      });
      console.error("Error submitting form:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (chatbot: Chatbot) => {
    if (!selectedWorkspace) return;

    // Confirm before deleting
    const confirmed = window.confirm(
      `Bạn có chắc chắn muốn xóa chatbot "${chatbot.name}"? Hành động này không thể hoàn tác.`
    );

    if (!confirmed) return;

    const toastId = toast.loading("Đang xóa chatbot...", {
      id: `delete-${chatbot.id}`,
    });

    try {
      await chatbotsApi.delete(selectedWorkspace.id, chatbot.id);
      toast.success("Xóa chatbot thành công", {
        id: toastId,
        description: `Chatbot "${chatbot.name}" đã được xóa`,
      });
      await loadChatbots();
    } catch (err: any) {
      const message =
        err?.response?.data?.message || "Failed to delete chatbot";
      setError(message);
      toast.error("Lỗi xóa chatbot", {
        id: toastId,
        description: message,
      });
      console.error("Error deleting chatbot:", err);
    }
  };

  const handleTestConnection = async () => {
    if (!selectedWorkspace) return;

    const toastId = toast.loading("Đang kiểm tra kết nối...");

    try {
      await chatbotsApi.testConnection(selectedWorkspace.id);
      toast.success("Kiểm tra kết nối thành công", {
        id: toastId,
        description: "Kết nối với AI Studio hoạt động bình thường",
      });
    } catch (err: any) {
      toast.error("Kiểm tra kết nối thất bại", {
        id: toastId,
        description: err?.response?.data?.message || "Unknown error",
      });
    }
  };

  const filteredChatbots = chatbots?.data.filter((bot) =>
    bot.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading && !chatbots) {
    return (
      <AppLayout activeModule="chatbots">
        <div className="flex items-center justify-center h-full">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout activeModule="chatbots">
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Quản lý Chatbot
            </h1>
            <p className="text-muted-foreground mt-1">
              Tạo và quản lý các chatbot của bạn
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleTestConnection}
              className="gap-2"
            >
              <AlertCircle className="w-4 h-4" />
              Test Connection
            </Button>
            <Button
              onClick={handleCreate}
              className="gap-2 bg-primary hover:bg-primary/90"
            >
              <Plus className="w-4 h-4" />
              Tạo Chatbot
            </Button>
          </div>
        </div>

        {error && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Create/Edit Form */}
        {showForm && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>
                  {editingChatbot ? "Chỉnh sửa Chatbot" : "Tạo Chatbot mới"}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowForm(false);
                    setEditingChatbot(null);
                    setError("");
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Tên chatbot <span className="text-destructive">*</span>
                  </label>
                  <Input
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="My Assistant Bot"
                    maxLength={100}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Ngôn ngữ</label>
                  <Input
                    value={formData.language}
                    onChange={(e) =>
                      setFormData({ ...formData, language: e.target.value })
                    }
                    placeholder="vi"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium">Tính cách</label>
                  <Input
                    value={formData.personality}
                    onChange={(e) =>
                      setFormData({ ...formData, personality: e.target.value })
                    }
                    placeholder="Bạn là trợ lý thông minh, nhiệt tình và chuyên nghiệp"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium">Tin nhắn chào</label>
                  <Input
                    value={formData.greeting_message}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        greeting_message: e.target.value,
                      })
                    }
                    placeholder="Xin chào! Tôi có thể giúp gì cho bạn?"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium">
                    Tin nhắn khi không hiểu
                  </label>
                  <Input
                    value={formData.fallback_message}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        fallback_message: e.target.value,
                      })
                    }
                    placeholder="Xin lỗi, tôi chưa hiểu. Bạn có thể nói rõ hơn?"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Confidence Threshold (0-1)
                  </label>
                  <Input
                    type="number"
                    min="0"
                    max="1"
                    step="0.1"
                    value={formData.confidence_threshold}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        confidence_threshold: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Max Context Turns
                  </label>
                  <Input
                    type="number"
                    min="1"
                    value={formData.max_context_turns}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        max_context_turns: parseInt(e.target.value) || 5,
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">LLM Provider</label>
                  <Input
                    value={formData.llm_provider}
                    onChange={(e) =>
                      setFormData({ ...formData, llm_provider: e.target.value })
                    }
                    placeholder="google-ai-studio"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">LLM Model</label>
                  <select
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    value={formData.llm_model}
                    onChange={(e) =>
                      setFormData({ ...formData, llm_model: e.target.value })
                    }
                  >
                    {availableModels.length > 0 ? (
                      availableModels.map((model) => (
                        <option key={model} value={model}>
                          {model}
                        </option>
                      ))
                    ) : (
                      <option value={formData.llm_model}>
                        {formData.llm_model}
                      </option>
                    )}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Temperature (0-1)
                  </label>
                  <Input
                    type="number"
                    min="0"
                    max="1"
                    step="0.1"
                    value={formData.temperature}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        temperature: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Max Tokens</label>
                  <Input
                    type="number"
                    min="1"
                    value={formData.max_tokens}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        max_tokens: parseInt(e.target.value) || 1000,
                      })
                    }
                  />
                </div>

                <div className="flex items-center gap-2 md:col-span-2">
                  <input
                    type="checkbox"
                    id="enable_learning"
                    checked={formData.enable_learning}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        enable_learning: e.target.checked,
                      })
                    }
                    className="w-4 h-4 rounded border-input"
                  />
                  <label
                    htmlFor="enable_learning"
                    className="text-sm font-medium"
                  >
                    Cho phép học từ feedback
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowForm(false);
                    setEditingChatbot(null);
                    setError("");
                  }}
                  disabled={submitting}
                >
                  Hủy
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={submitting || !formData.name.trim()}
                  className="bg-primary hover:bg-primary/90 gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Đang xử lý...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      {editingChatbot ? "Cập nhật" : "Tạo"}
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm chatbot..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-10"
          />
        </div>

        {/* Chatbots List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredChatbots && filteredChatbots.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredChatbots.map((chatbot) => (
                <Card
                  key={chatbot.id}
                  className="hover:shadow-lg transition-shadow"
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center relative group cursor-pointer" onClick={() => handleChat(chatbot)}>
                          <Bot className="w-5 h-5 text-primary group-hover:opacity-0 transition-opacity absolute" />
                          <MessageSquare className="w-5 h-5 text-primary opacity-0 group-hover:opacity-100 transition-opacity absolute" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">
                            {chatbot.name}
                          </CardTitle>
                          <p className="text-xs text-muted-foreground mt-1">
                            {chatbot.language} • {chatbot.llm_model}
                          </p>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleChat(chatbot)}>
                            <MessageSquare className="w-4 h-4 mr-2" />
                            Chat thử
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => router.push(`/chatbots/${chatbot.id}/settings`)}>
                            <Settings className="w-4 h-4 mr-2" />
                            Cài đặt
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEdit(chatbot)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Chỉnh sửa
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleOpenTools(chatbot)}>
                            <Plug className="w-4 h-4 mr-2" />
                            Plugins
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleDelete(chatbot)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Xoa
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {chatbot.greeting_message && (
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Lời chào:
                          </p>
                          <p className="text-sm text-foreground line-clamp-2">
                            {chatbot.greeting_message}
                          </p>
                        </div>
                      )}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>Enabled: {chatbot.enabled ? "✓" : "✗"}</span>
                        <span>
                          Learning: {chatbot.enable_learning ? "✓" : "✗"}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Created:{" "}
                        {new Date(chatbot.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {chatbots && chatbots.meta.totalPages > 1 && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Hiển thị {chatbots.meta.page} / {chatbots.meta.totalPages}{" "}
                  trang (Tổng: {chatbots.meta.total} chatbots)
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={!chatbots.meta.hasPreviousPage}
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Trước
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setPage((p) => Math.min(chatbots.meta.totalPages, p + 1))
                    }
                    disabled={!chatbots.meta.hasNextPage}
                  >
                    Sau
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <Bot className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {searchQuery
                  ? "Không tìm thấy chatbot nào"
                  : "Chưa có chatbot nào. Hãy tạo chatbot đầu tiên của bạn!"}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Tools Dialog */}
        {selectedChatbotForTools && selectedWorkspace && (
          <ChatbotToolsDialog
            open={toolsDialogOpen}
            onOpenChange={setToolsDialogOpen}
            workspaceId={selectedWorkspace.id}
            chatbotId={selectedChatbotForTools.id}
            chatbotName={selectedChatbotForTools.name}
          />
        )}

        {/* Chat Dialog */}
        {selectedChatbotForChat && selectedWorkspace && (
          <ChatbotChatDialog
            open={chatDialogOpen}
            onOpenChange={setChatDialogOpen}
            workspaceId={selectedWorkspace.id}
            chatbotId={selectedChatbotForChat.id}
            chatbotName={selectedChatbotForChat.name}
          />
        )}
      </div>
    </AppLayout>
  );
}
