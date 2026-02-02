"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Loader2,
  Plus,
  Trash2,
  Zap,
  Edit2,
  ChevronDown,
  ChevronRight,
  X,
} from "lucide-react";
import {
  toolActionsApi,
  type ToolAction,
  type CreateToolActionDto,
  type Plugin,
} from "@/lib/api";
import { ToolActionForm, type ActionFormState } from "@/components/tool-action-form";

interface ToolActionsManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tool: Plugin | null;
  onActionsChanged?: () => void;
}

const defaultActionForm: ActionFormState = {
  name: "",
  display_name: "",
  description: "",
  method: "GET",
  endpoint: "",
  parameters_json: JSON.stringify(
    {
      type: "OBJECT",
      properties: {},
      required: [],
    },
    null,
    2
  ),
  params_mapping_json: JSON.stringify({}, null, 2),
  sort_order: 0,
  is_enabled: true,
};

export function ToolActionsManager({
  open,
  onOpenChange,
  tool,
  onActionsChanged,
}: ToolActionsManagerProps) {
  const [actions, setActions] = useState<ToolAction[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Collapsible states
  const [expandedActions, setExpandedActions] = useState<Record<string, boolean>>({});

  // Render states
  const [showNewActionForm, setShowNewActionForm] = useState(false);
  const [editingActionId, setEditingActionId] = useState<string | null>(null);

  useEffect(() => {
    if (open && tool) {
      loadActions();
    }
  }, [open, tool]);

  const loadActions = async () => {
    if (!tool) return;

    try {
      setLoading(true);
      const data = await toolActionsApi.list(tool.id);
      setActions(data);
    } catch (err: any) {
      console.error("Error loading actions:", err);
      toast.error("Không thể tải danh sách actions");
    } finally {
      setLoading(false);
    }
  };

  const toggleExpanded = (actionId: string) => {
    setExpandedActions((prev) => ({
      ...prev,
      [actionId]: !prev[actionId],
    }));
  };

  const mapActionToFormState = (action: ToolAction): ActionFormState => {
    return {
      name: action.name,
      display_name: action.display_name,
      description: action.description,
      method: (action.executor_config?.method as any) || "GET",
      endpoint: action.executor_config?.endpoint || "",
      parameters_json: JSON.stringify(action.parameters || { type: "OBJECT", properties: {}, required: [] }, null, 2),
      params_mapping_json: JSON.stringify(action.executor_config?.params || {}, null, 2),
      sort_order: action.sort_order,
      is_enabled: action.is_enabled,
    };
  };

  const handleCreateAction = async (formData: ActionFormState) => {
    if (!tool) return;

    if (!formData.name || !formData.display_name || !formData.endpoint) {
      toast.error("Vui lòng điền đầy đủ thông tin bắt buộc");
      return;
    }

     // Validate name
    if (!/^[a-z0-9_]+$/.test(formData.name)) {
      toast.error("Mã định danh chỉ được chứa chữ thường, số và dấu gạch dưới");
      return;
    }

    // Parse JSONs
    let parameters, paramsMapping;
    try {
      parameters = JSON.parse(formData.parameters_json);
      paramsMapping = JSON.parse(formData.params_mapping_json);
    } catch {
      toast.error("JSON không hợp lệ");
      return;
    }

    try {
      setSaving(true);
      const payload: CreateToolActionDto = {
        name: formData.name,
        display_name: formData.display_name,
        description: formData.description,
        parameters,
        executor_config: {
          method: formData.method,
          endpoint: formData.endpoint,
          params: paramsMapping,
        },
        sort_order: formData.sort_order,
        is_enabled: formData.is_enabled,
      };

      await toolActionsApi.create(tool.id, payload);

      toast.success("Tạo action thành công");
      setShowNewActionForm(false);
      loadActions();
      onActionsChanged?.();
    } catch (err: any) {
      console.error("Error creating action:", err);
      toast.error("Lỗi tạo action", {
        description: err?.response?.data?.message || "Unknown error",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateAction = async (actionId: string, formData: ActionFormState) => {
    if (!tool) return;

    // Parse JSONs
    let parameters, paramsMapping;
    try {
      parameters = JSON.parse(formData.parameters_json);
      paramsMapping = JSON.parse(formData.params_mapping_json);
    } catch {
      toast.error("JSON không hợp lệ");
      return;
    }

    try {
      setSaving(true);
      await toolActionsApi.update(tool.id, actionId, {
        name: formData.name,
        display_name: formData.display_name,
        description: formData.description,
        parameters,
        executor_config: {
          method: formData.method,
          endpoint: formData.endpoint,
          params: paramsMapping,
        },
        sort_order: formData.sort_order,
        is_enabled: formData.is_enabled,
      });

      toast.success("Cập nhật action thành công");
      setEditingActionId(null);
      loadActions();
      onActionsChanged?.();
    } catch (err: any) {
      console.error("Error updating action:", err);
      toast.error("Lỗi cập nhật action", {
        description: err?.response?.data?.message || "Unknown error",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAction = async (actionId: string) => {
    if (!tool) return;
    if (!window.confirm("Bạn có chắc muốn xoá action này?")) return;

    try {
      setDeleting(actionId);
      await toolActionsApi.delete(tool.id, actionId);
      toast.success("Đã xoá action");
      loadActions();
      onActionsChanged?.();
    } catch (err: any) {
      toast.error("Lỗi xoá action");
    } finally {
      setDeleting(null);
    }
  };

  if (!tool) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Quản lý Actions - {tool.display_name}
          </DialogTitle>
          <DialogDescription>
            Thêm và chỉnh sửa các actions cho tool này.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              {/* List Actions */}
              {actions.length > 0 && (
                <div className="space-y-2">
                  {actions.map((action) => (
                    <Collapsible
                      key={action.id}
                      open={expandedActions[action.id] || editingActionId === action.id}
                      onOpenChange={() => toggleExpanded(action.id)}
                      className="border rounded-lg"
                    >
                      <CollapsibleTrigger asChild>
                        <button className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors">
                          <div className="flex items-center gap-2 text-left">
                            {expandedActions[action.id] ? (
                              <ChevronDown className="w-4 h-4 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-muted-foreground" />
                            )}
                            <Badge variant={action.is_enabled ? "default" : "secondary"}>
                              {action.executor_config?.method || "GET"}
                            </Badge>
                            <span className="font-medium">{action.display_name}</span>
                            <span className="text-xs text-muted-foreground">({action.name})</span>
                          </div>
                        </button>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        {editingActionId === action.id ? (
                          <div className="p-4 border-t bg-muted/20">
                             <ToolActionForm 
                                initialData={mapActionToFormState(action)}
                                onSubmit={(data) => handleUpdateAction(action.id, data)}
                                onCancel={() => setEditingActionId(null)}
                                isSubmitting={saving}
                                submitLabel="Cập nhật Action"
                             />
                          </div>
                        ) : (
                          <div className="space-y-3 p-4 border-t">
                            <p className="text-sm text-muted-foreground">{action.description || "Không có mô tả"}</p>
                            <div className="flex items-center gap-2 text-xs font-mono bg-muted px-2 py-1 rounded w-fit">
                              <Badge variant="outline" className="font-mono">
                                {action.executor_config?.method || "GET"}
                              </Badge>
                              {action.executor_config?.endpoint}
                            </div>
                            <div className="flex justify-end gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                   setEditingActionId(action.id);
                                   setExpandedActions((prev) => ({ ...prev, [action.id]: true }));
                                }}
                              >
                                <Edit2 className="w-4 h-4 mr-1" />
                                Sửa
                              </Button>
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDeleteAction(action.id)}
                                disabled={deleting === action.id}
                              >
                                {deleting === action.id ? (
                                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                                ) : (
                                  <Trash2 className="w-4 h-4 mr-1" />
                                )}
                                Xoá
                              </Button>
                            </div>
                          </div>
                        )}
                      </CollapsibleContent>
                    </Collapsible>
                  ))}
                </div>
              )}

              {actions.length === 0 && !showNewActionForm && (
                <div className="text-center py-8 text-muted-foreground">
                  <Zap className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Chưa có action nào.</p>
                </div>
              )}

              {/* New Action Form */}
              {showNewActionForm && (
                <div className="border rounded-lg p-4 bg-primary/5 border-primary/20">
                   <div className="flex justify-between items-center mb-4">
                      <h4 className="font-medium flex items-center gap-2">
                        <Plus className="w-4 h-4" />
                        Thêm Action Mới
                      </h4>
                      <Button variant="ghost" size="icon" onClick={() => setShowNewActionForm(false)}>
                         <X className="w-4 h-4" />
                      </Button>
                   </div>
                   <ToolActionForm 
                      initialData={defaultActionForm}
                      onSubmit={handleCreateAction}
                      onCancel={() => setShowNewActionForm(false)}
                      isSubmitting={saving}
                      submitLabel="Tạo Action"
                   />
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter className="border-t pt-4">
          {!showNewActionForm && (
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowNewActionForm(true)}
              disabled={loading}
            >
              <Plus className="w-4 h-4 mr-2" />
              Thêm Action
            </Button>
          )}
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
