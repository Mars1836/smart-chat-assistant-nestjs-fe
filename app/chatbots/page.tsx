"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AppLayout } from "@/components/app-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  Book, // Added
} from "lucide-react";
import { useWorkspace } from "@/lib/stores/workspace-store";
import {
  chatbotsApi,
  type Chatbot,
  type ConversationStarter,
  type CreateChatbotDto,
  type UpdateChatbotDto,
  type PaginatedResponse,
} from "@/lib/api";
import { ChatbotToolsDialog } from "@/components/chatbot-tools-dialog";
import { ChatbotChatDialog } from "@/components/chatbot-chat-dialog";
import { ChatbotKnowledgeDialog } from "@/components/chatbot-knowledge-dialog"; // Added
import {
  translateTemplate,
  useLanguage,
} from "@/components/providers/language-provider";

export default function ChatbotsPage() {
  const createEmptyStarter = (): ConversationStarter => ({
    label: "",
    message: "",
  });

  const router = useRouter();
  const { selectedWorkspace, hasPermission } = useWorkspace();
  const { t } = useLanguage();
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

  // Knowledge dialog state
  const [knowledgeDialogOpen, setKnowledgeDialogOpen] = useState(false);
  const [selectedChatbotForKnowledge, setSelectedChatbotForKnowledge] = useState<Chatbot | null>(null);

  // Chat dialog state
  const [chatDialogOpen, setChatDialogOpen] = useState(false);
  const [selectedChatbotForChat, setSelectedChatbotForChat] = useState<Chatbot | null>(null);
  const canCreateChatbot = hasPermission("chatbot.create");
  const canUpdateChatbot = hasPermission("chatbot.update");
  const canDeleteChatbot = hasPermission("chatbot.delete");
  const canAssignKnowledge = hasPermission("knowledge.assign_chatbot");
  const canManagePlugins = hasPermission("workspace.manage_plugins");

  // Form state
  const [formData, setFormData] = useState<CreateChatbotDto>({
    name: "",
    language: "vi",
    personality: "",
    greeting_message: "",
    fallback_message: "",
    confidence_threshold: 0.7,
    max_context_turns: 5,
    llm_provider: "google-ai-studio",
    llm_model: "gemini-2.0-flash-lite",
    temperature: 0.7,
    max_tokens: 1000,
    conversation_starters: [],
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
      llm_provider: "google-ai-studio",
      llm_model: "gemini-2.0-flash-lite",
      temperature: 0.7,
      max_tokens: 1000,
      conversation_starters: [],
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
      llm_provider: chatbot.llm_provider,
      llm_model: chatbot.llm_model,
      temperature: chatbot.temperature,
      max_tokens: chatbot.max_tokens,
      conversation_starters: chatbot.conversation_starters ?? [],
    });
    setShowForm(true);
  };

  const updateStarter = (
    index: number,
    field: keyof ConversationStarter,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      conversation_starters: (prev.conversation_starters ?? []).map(
        (starter, starterIndex) =>
          starterIndex === index ? { ...starter, [field]: value } : starter
      ),
    }));
  };

  const addStarter = () => {
    setFormData((prev) => ({
      ...prev,
      conversation_starters: [
        ...(prev.conversation_starters ?? []),
        createEmptyStarter(),
      ],
    }));
  };

  const removeStarter = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      conversation_starters: (prev.conversation_starters ?? []).filter(
        (_, starterIndex) => starterIndex !== index
      ),
    }));
  };

  const handleOpenTools = (chatbot: Chatbot) => {
    setSelectedChatbotForTools(chatbot);
    setToolsDialogOpen(true);
  };

  const handleOpenKnowledge = (chatbot: Chatbot) => {
    setSelectedChatbotForKnowledge(chatbot);
    setKnowledgeDialogOpen(true);
  };

  const handleChat = (chatbot: Chatbot) => {
    setSelectedChatbotForChat(chatbot);
    setChatDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!selectedWorkspace || !formData.name.trim()) {
      toast.error(t("chatbots.nameRequired"));
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      const basePayload = {
        ...formData,
        conversation_starters: (formData.conversation_starters ?? [])
          .map((starter) => ({
            label: starter.label.trim(),
            message: starter.message.trim(),
          }))
          .filter((starter) => starter.label && starter.message),
      };

      const payload = editingChatbot
        ? basePayload
        : (() => {
            const { llm_provider, ...createPayload } = basePayload;
            return createPayload;
          })();

      const promise = editingChatbot
        ? chatbotsApi.update(
            selectedWorkspace.id,
            editingChatbot.id,
            payload as UpdateChatbotDto
          )
        : chatbotsApi.create(selectedWorkspace.id, payload);

      const result = await promise;

      toast.success(
        editingChatbot
          ? t("chatbots.updateSuccess")
          : t("chatbots.createSuccess"),
        {
          description: translateTemplate(
            editingChatbot
              ? t("chatbots.updateSuccessDescription")
              : t("chatbots.createSuccessDescription"),
            { name: formData.name }
          ),
        }
      );

      setShowForm(false);
      setEditingChatbot(null);
      await loadChatbots();

      // If created new chatbot, open tools dialog to assign plugins
      if (!editingChatbot) {
         // Show success message with hint
        toast.message(t("chatbots.plugins"), {
          description: t("chatbots.nextPluginsDescription"),
        });
        
        setSelectedChatbotForTools(result);
        setToolsDialogOpen(true);
      }
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        `Failed to ${editingChatbot ? "update" : "create"} chatbot`;
      setError(message);
      toast.error(
        editingChatbot ? t("chatbots.updateError") : t("chatbots.createError"),
        {
          description: message,
        }
      );
      console.error("Error submitting form:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (chatbot: Chatbot) => {
    if (!selectedWorkspace) return;

    // Confirm before deleting
    const confirmed = window.confirm(
      translateTemplate(t("chatbots.deleteConfirm"), { name: chatbot.name })
    );

    if (!confirmed) return;

    const toastId = toast.loading(t("chatbots.deleting"), {
      id: `delete-${chatbot.id}`,
    });

    try {
      await chatbotsApi.delete(selectedWorkspace.id, chatbot.id);
      toast.success(t("chatbots.deleteSuccess"), {
        id: toastId,
        description: translateTemplate(t("chatbots.deleteSuccessDescription"), {
          name: chatbot.name,
        }),
      });
      await loadChatbots();
    } catch (err: any) {
      const message =
        err?.response?.data?.message || "Failed to delete chatbot";
      setError(message);
      toast.error(t("chatbots.deleteError"), {
        id: toastId,
        description: message,
      });
      console.error("Error deleting chatbot:", err);
    }
  };

  const handleTestConnection = async () => {
    if (!selectedWorkspace) return;

    const toastId = toast.loading(t("chatbots.testConnectionLoading"));

    try {
      await chatbotsApi.testConnection(selectedWorkspace.id);
      toast.success(t("chatbots.testConnectionSuccess"), {
        id: toastId,
        description: t("chatbots.testConnectionSuccessDescription"),
      });
    } catch (err: any) {
      toast.error(t("chatbots.testConnectionFailed"), {
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
              {t("chatbots.title")}
            </h1>
            <p className="text-muted-foreground mt-1">
              {t("chatbots.description")}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleTestConnection}
              className="gap-2"
            >
              <AlertCircle className="w-4 h-4" />
              {t("chatbots.testConnection")}
            </Button>
            {canCreateChatbot && (
              <Button
                onClick={handleCreate}
                className="gap-2 bg-primary hover:bg-primary/90"
              >
                <Plus className="w-4 h-4" />
                {t("chatbots.create")}
              </Button>
            )}
          </div>
        </div>

        {!canCreateChatbot && (
          <div className="bg-muted text-muted-foreground px-4 py-3 rounded-lg text-sm">
            {t("chatbots.forbiddenCreate")}
          </div>
        )}

        {error && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Create/Edit Form */}
        {showForm && canCreateChatbot && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>
                  {editingChatbot
                    ? t("chatbots.edit")
                    : t("chatbots.createNew")}
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
                    {t("chatbots.name")} <span className="text-destructive">*</span>
                  </label>
                  <Input
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder={t("chatbots.placeholder.name")}
                    maxLength={100}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">{t("chatbots.language")}</label>
                  <Input
                    value={formData.language}
                    onChange={(e) =>
                      setFormData({ ...formData, language: e.target.value })
                    }
                    placeholder="vi"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium">{t("chatbots.personality")}</label>
                  <Input
                    value={formData.personality}
                    onChange={(e) =>
                      setFormData({ ...formData, personality: e.target.value })
                    }
                    placeholder={t("chatbots.placeholder.personality")}
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium">{t("chatbots.greeting")}</label>
                  <Input
                    value={formData.greeting_message}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        greeting_message: e.target.value,
                      })
                    }
                    placeholder={t("chatbots.placeholder.greeting")}
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium">
                    {t("chatbots.fallback")}
                  </label>
                  <Input
                    value={formData.fallback_message}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        fallback_message: e.target.value,
                      })
                    }
                    placeholder={t("chatbots.placeholder.fallback")}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    {t("chatbots.maxContextTurns")}
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
                  <label className="text-sm font-medium">{t("chatbots.llmProvider")}</label>
                  <Input
                    value={formData.llm_provider}
                    onChange={(e) =>
                      setFormData({ ...formData, llm_provider: e.target.value })
                    }
                    placeholder="google-ai-studio"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">{t("chatbots.llmModel")}</label>
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
                  <label className="text-sm font-medium">{t("chatbots.maxTokens")}</label>
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

                <div className="space-y-3 md:col-span-2">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <label className="text-sm font-medium">
                        {t("chatbots.starters")}
                      </label>
                      <p className="text-xs text-muted-foreground mt-1">
                        {t("chatbots.startersDescription")}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addStarter}
                      className="gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      {t("chatbots.addStarter")}
                    </Button>
                  </div>

                  {(formData.conversation_starters ?? []).length > 0 ? (
                    <div className="space-y-3">
                      {(formData.conversation_starters ?? []).map(
                        (starter, index) => (
                          <div
                            key={index}
                            className="rounded-lg border border-border p-4 space-y-3"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <p className="text-sm font-medium">
                                {translateTemplate(t("chatbots.starterNumber"), {
                                  number: index + 1,
                                })}
                              </p>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeStarter(index)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>

                            <div className="space-y-2">
                              <label className="text-sm font-medium">
                                {t("chatbots.label")}
                              </label>
                              <Input
                                value={starter.label}
                                onChange={(e) =>
                                  updateStarter(index, "label", e.target.value)
                                }
                                placeholder={t("chatbots.placeholder.label")}
                                maxLength={100}
                              />
                            </div>

                            <div className="space-y-2">
                              <label className="text-sm font-medium">
                                {t("chatbots.message")}
                              </label>
                              <Textarea
                                value={starter.message}
                                onChange={(e) =>
                                  updateStarter(
                                    index,
                                    "message",
                                    e.target.value
                                  )
                                }
                                placeholder={t("chatbots.placeholder.message")}
                                rows={3}
                              />
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  ) : (
                    <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
                      {t("chatbots.noStarters")}
                    </div>
                  )}
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
                  {t("common.cancel")}
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={submitting || !formData.name.trim()}
                  className="bg-primary hover:bg-primary/90 gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {t("common.loading")}
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      {editingChatbot ? t("common.save") : t("common.create")}
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
            placeholder={t("chatbots.search")}
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
                            {t("chatbots.tryChat")}
                          </DropdownMenuItem>
                          {canUpdateChatbot && (
                            <>
                              <DropdownMenuItem onClick={() => router.push(`/chatbots/${chatbot.id}/settings`)}>
                                <Settings className="w-4 h-4 mr-2" />
                                {t("chatbots.settings")}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEdit(chatbot)}>
                                <Edit className="w-4 h-4 mr-2" />
                                {t("chatbots.edit")}
                              </DropdownMenuItem>
                            </>
                          )}
                          {canManagePlugins && (
                            <DropdownMenuItem onClick={() => handleOpenTools(chatbot)}>
                              <Plug className="w-4 h-4 mr-2" />
                              {t("chatbots.plugins")}
                            </DropdownMenuItem>
                          )}
                          {canAssignKnowledge && (
                            <DropdownMenuItem onClick={() => handleOpenKnowledge(chatbot)}>
                              <Book className="w-4 h-4 mr-2" />
                              {t("chatbots.knowledge")}
                            </DropdownMenuItem>
                          )}
                          {canDeleteChatbot && (
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleDelete(chatbot)}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              {t("chatbots.delete")}
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {chatbot.greeting_message && (
                        <div>
                          <p className="text-xs text-muted-foreground">
                            {t("chatbots.greetingLabel")}
                          </p>
                          <p className="text-sm text-foreground line-clamp-2">
                            {chatbot.greeting_message}
                          </p>
                        </div>
                      )}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>{t("chatbots.enabled")}: {chatbot.enabled ? "✓" : "✗"}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {t("chatbots.created")}:{" "}
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
                  {translateTemplate(t("chatbots.pagination"), {
                    page: chatbots.meta.page,
                    totalPages: chatbots.meta.totalPages,
                    total: chatbots.meta.total,
                  })}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={!chatbots.meta.hasPreviousPage}
                  >
                    <ChevronLeft className="w-4 h-4" />
                    {t("billing.previous")}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setPage((p) => Math.min(chatbots.meta.totalPages, p + 1))
                    }
                    disabled={!chatbots.meta.hasNextPage}
                  >
                    {t("billing.next")}
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
                  ? t("chatbots.emptySearch")
                  : t("chatbots.emptyDefault")}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Tools Dialog */}
        {selectedChatbotForTools && selectedWorkspace && canManagePlugins && (
          <ChatbotToolsDialog
            open={toolsDialogOpen}
            onOpenChange={setToolsDialogOpen}
            workspaceId={selectedWorkspace.id}
            chatbotId={selectedChatbotForTools.id}
            chatbotName={selectedChatbotForTools.name}
          />
        )}

        {/* Knowledge Dialog */}
        {selectedChatbotForKnowledge && selectedWorkspace && (
          <ChatbotKnowledgeDialog
            open={knowledgeDialogOpen}
            onOpenChange={setKnowledgeDialogOpen}
            workspaceId={selectedWorkspace.id}
            chatbotId={selectedChatbotForKnowledge.id}
            chatbotName={selectedChatbotForKnowledge.name}
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
