"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Loader2, 
  Book, 
  FileText, 
  Database,
  ArrowUp
} from "lucide-react";
import {
  knowledgeApi,
  type KnowledgeBase,
  type ChatbotKnowledge,
} from "@/lib/api/knowledge";

interface ChatbotKnowledgeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
  chatbotId: string;
  chatbotName: string;
}

export function ChatbotKnowledgeDialog({
  open,
  onOpenChange,
  workspaceId,
  chatbotId,
  chatbotName,
}: ChatbotKnowledgeDialogProps) {
  const [allKnowledge, setAllKnowledge] = useState<KnowledgeBase[]>([]);
  const [chatbotKnowledge, setChatbotKnowledge] = useState<ChatbotKnowledge[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open, workspaceId, chatbotId]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const [allKb, connectedKb] = await Promise.all([
        knowledgeApi.list(workspaceId),
        knowledgeApi.getChatbotKnowledge(workspaceId, chatbotId),
      ]);

      setAllKnowledge(allKb);
      setChatbotKnowledge(connectedKb);
    } catch (err: any) {
      console.error("Error loading knowledge data:", err);
      toast.error("Không thể tải danh sách Knowledge Base", {
        description: err?.response?.data?.message || "Unknown error",
      });
    } finally {
      setLoading(false);
    }
  };

  const getConnectedKb = (kbId: string) => {
    return chatbotKnowledge.find((k) => k.knowledge.id === kbId);
  };

  const isKbEnabled = (kbId: string): boolean => {
    const connected = getConnectedKb(kbId);
    return connected?.is_enabled ?? false;
  };

  const getKbPriority = (kbId: string): number => {
    const connected = getConnectedKb(kbId);
    return connected?.priority ?? 10;
  };

  const handleToggleKb = async (kb: KnowledgeBase, enabled: boolean) => {
    try {
      setUpdating(kb.id);

      const connected = getConnectedKb(kb.id);

      if (enabled) {
        // If enabling, check if it was already connected (and disabled) or if it's new
        if (connected) {
           await knowledgeApi.updateChatbotKnowledge(workspaceId, chatbotId, kb.id, {
            is_enabled: true,
          });
        } else {
          // Add new connection
           await knowledgeApi.addChatbotKnowledge(workspaceId, chatbotId, {
            knowledge_id: kb.id,
            is_enabled: true,
            priority: 10,
          });
        }
      } else {
        // Disable
        if (connected) {
           await knowledgeApi.updateChatbotKnowledge(workspaceId, chatbotId, kb.id, {
            is_enabled: false,
          });
        }
      }

      // Reload to get fresh state (simplest way to sync)
      // Or update local state optimistically
      const updatedConnectedKbs = await knowledgeApi.getChatbotKnowledge(workspaceId, chatbotId);
      setChatbotKnowledge(updatedConnectedKbs);

      toast.success(
        enabled ? `Đã bật ${kb.name}` : `Đã tắt ${kb.name}`
      );
    } catch (err: any) {
      console.error("Error toggling knowledge base:", err);
      toast.error("Không thể cập nhật Knowledge Base", {
        description: err?.response?.data?.message || "Unknown error",
      });
    } finally {
      setUpdating(null);
    }
  };

  const handleUpdatePriority = async (kbId: string, priority: number) => {
    try {
      if (isNaN(priority) || priority < 0) return;
      
      const connected = getConnectedKb(kbId);
      if (!connected) return;

      await knowledgeApi.updateChatbotKnowledge(workspaceId, chatbotId, kbId, {
        priority,
      });

      // Update local state
      setChatbotKnowledge(prev => prev.map(item => 
        item.knowledge.id === kbId ? { ...item, priority } : item
      ));

      toast.success("Đã cập nhật độ ưu tiên");
    } catch (err: any) {
      console.error("Error updating priority:", err);
      toast.error("Không thể cập nhật độ ưu tiên");
    }
  };

  const enabledCount = chatbotKnowledge.filter((k) => k.is_enabled).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Book className="w-5 h-5" />
            Knowledge Base
          </DialogTitle>
          <DialogDescription>
            Quản lý dữ liệu kiến thức cho chatbot "{chatbotName}".{" "}
            {enabledCount > 0 && (
              <span className="text-primary font-medium">
                ({enabledCount} kiến thức đang bật)
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4 px-1">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : allKnowledge.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Database className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Chưa có Knowledge Base nào trong workspace.</p>
              <p className="text-sm mt-2">
                Hãy tạo Knowledge Base trong phần Knowledge trước.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {allKnowledge.map((kb) => {
                const isEnabled = isKbEnabled(kb.id);
                const isUpdating = updating === kb.id;
                const connected = getConnectedKb(kb.id);

                return (
                  <div
                    key={kb.id}
                    className={`rounded-lg border p-4 transition-colors ${
                      isEnabled
                        ? "bg-primary/5 border-primary/20"
                        : "bg-background border-border hover:border-primary/20"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          isEnabled ? "bg-primary/10" : "bg-muted"
                        }`}
                      >
                        <Database
                          className={`w-5 h-5 ${
                            isEnabled ? "text-primary" : "text-muted-foreground"
                          }`}
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-foreground">
                            {kb.name}
                          </h4>
                          <Badge variant="outline" className="text-xs font-normal">
                            {kb.document_count} tài liệu
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {kb.description || "Không có mô tả"}
                        </p>
                      </div>

                      {isEnabled && connected && (
                        <div className="flex items-center gap-2 mr-2">
                          <span className="text-xs text-muted-foreground">Priority:</span>
                          <Input 
                             type="number"
                             min="0"
                             className="w-16 h-8 text-xs"
                             defaultValue={connected.priority}
                             onBlur={(e) => handleUpdatePriority(kb.id, parseInt(e.target.value))}
                          />
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        {isUpdating && (
                          <Loader2 className="w-4 h-4 animate-spin text-primary" />
                        )}
                        <Switch
                          checked={isEnabled}
                          onCheckedChange={(checked) =>
                            handleToggleKb(kb, checked)
                          }
                          disabled={isUpdating}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex justify-between items-center pt-4 border-t">
          <p className="text-sm text-muted-foreground">
            {allKnowledge.length} knowledge base có sẵn
          </p>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Đóng
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
