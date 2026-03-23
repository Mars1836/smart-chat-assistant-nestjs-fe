"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  ChevronDown,
  ChevronRight,
  Edit2,
  Loader2,
  Plus,
  Trash2,
  X,
  Zap,
} from "lucide-react";
import {
  toolActionsApi,
  type CardConfig,
  type CreateToolActionDto,
  type Plugin,
  type ToolAction,
} from "@/lib/api";
import {
  translateTemplate,
  useLanguage,
} from "@/components/providers/language-provider";
import { useWorkspace } from "@/lib/stores/workspace-store";
import {
  ToolActionForm,
  type ActionFormState,
} from "@/components/tool-action-form";

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
  card_enabled: false,
};

export function ToolActionsManager({
  open,
  onOpenChange,
  tool,
  onActionsChanged,
}: ToolActionsManagerProps) {
  const { hasPermission } = useWorkspace();
  const { t } = useLanguage();
  const [actions, setActions] = useState<ToolAction[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [expandedActions, setExpandedActions] = useState<Record<string, boolean>>({});
  const [showNewActionForm, setShowNewActionForm] = useState(false);
  const [editingActionId, setEditingActionId] = useState<string | null>(null);
  const canManagePlugins = hasPermission("workspace.manage_plugins");

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
      toast.error(t("toolActions.loadFailed"));
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
    const cardConfig = action.card_config;

    return {
      name: action.name,
      display_name: action.display_name,
      description: action.description,
      method: (action.executor_config?.method as ActionFormState["method"]) || "GET",
      endpoint: action.executor_config?.endpoint || "",
      parameters_json: JSON.stringify(
        action.parameters || { type: "OBJECT", properties: {}, required: [] },
        null,
        2
      ),
      params_mapping_json: JSON.stringify(
        action.executor_config?.params || {},
        null,
        2
      ),
      sort_order: action.sort_order,
      is_enabled: action.is_enabled,
      card_enabled: cardConfig?.enabled !== false && !!cardConfig,
      card_list_path: cardConfig?.list_path,
      card_field_title: cardConfig?.field_mapping?.title,
      card_field_url: cardConfig?.field_mapping?.url,
      card_field_imageUrl: cardConfig?.field_mapping?.imageUrl,
      card_field_description: cardConfig?.field_mapping?.description,
    };
  };

  const buildCardConfig = (
    form: ActionFormState
  ): CardConfig | null | undefined => {
    if (!form.card_enabled) return null;

    const fieldMapping: CardConfig["field_mapping"] = {};
    if (form.card_field_title?.trim()) fieldMapping.title = form.card_field_title.trim();
    if (form.card_field_url?.trim()) fieldMapping.url = form.card_field_url.trim();
    if (form.card_field_imageUrl?.trim()) {
      fieldMapping.imageUrl = form.card_field_imageUrl.trim();
    }
    if (form.card_field_description?.trim()) {
      fieldMapping.description = form.card_field_description.trim();
    }

    return {
      enabled: true,
      list_path: form.card_list_path?.trim() || undefined,
      field_mapping: Object.keys(fieldMapping).length > 0 ? fieldMapping : undefined,
    };
  };

  const handleCreateAction = async (formData: ActionFormState) => {
    if (!tool) return;

    if (!canManagePlugins) {
      toast.error(t("toolActions.permissionDenied"));
      return;
    }

    if (!formData.name || !formData.display_name || !formData.endpoint) {
      toast.error(t("toolActions.requiredFields"));
      return;
    }

    if (!/^[a-z0-9_]+$/.test(formData.name)) {
      toast.error(t("toolActions.invalidName"));
      return;
    }

    let parameters;
    let paramsMapping;

    try {
      parameters = JSON.parse(formData.parameters_json);
      paramsMapping = JSON.parse(formData.params_mapping_json);
    } catch {
      toast.error(t("toolActions.invalidJson"));
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
        card_config: buildCardConfig(formData),
      };

      await toolActionsApi.create(tool.id, payload);

      toast.success(t("toolActions.createSuccess"));
      setShowNewActionForm(false);
      await loadActions();
      onActionsChanged?.();
    } catch (err: any) {
      console.error("Error creating action:", err);
      toast.error(t("toolActions.createFailed"), {
        description: err?.response?.data?.message || "Unknown error",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateAction = async (
    actionId: string,
    formData: ActionFormState
  ) => {
    if (!tool) return;

    if (!canManagePlugins) {
      toast.error(t("toolActions.permissionDenied"));
      return;
    }

    let parameters;
    let paramsMapping;

    try {
      parameters = JSON.parse(formData.parameters_json);
      paramsMapping = JSON.parse(formData.params_mapping_json);
    } catch {
      toast.error(t("toolActions.invalidJson"));
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
        card_config: buildCardConfig(formData),
      });

      toast.success(t("toolActions.updateSuccess"));
      setEditingActionId(null);
      await loadActions();
      onActionsChanged?.();
    } catch (err: any) {
      console.error("Error updating action:", err);
      toast.error(t("toolActions.updateFailed"), {
        description: err?.response?.data?.message || "Unknown error",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAction = async (actionId: string) => {
    if (!tool) return;

    if (!canManagePlugins) {
      toast.error(t("toolActions.permissionDenied"));
      return;
    }

    if (!window.confirm(t("toolActions.deleteConfirm"))) return;

    try {
      setDeleting(actionId);
      await toolActionsApi.delete(tool.id, actionId);
      toast.success(t("toolActions.deleteSuccess"));
      await loadActions();
      onActionsChanged?.();
    } catch (err) {
      toast.error(t("toolActions.deleteFailed"));
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
            {translateTemplate(t("toolActions.title"), {
              name: tool.display_name,
            })}
          </DialogTitle>
          <DialogDescription>{t("toolActions.description")}</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          {!canManagePlugins ? (
            <div className="text-center py-8 text-muted-foreground">
              <Zap className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>{t("toolActions.permissionDenied")}</p>
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              {actions.length > 0 && (
                <div className="space-y-2">
                  {actions.map((action) => (
                    <Collapsible
                      key={action.id}
                      open={
                        expandedActions[action.id] || editingActionId === action.id
                      }
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
                            <span className="text-xs text-muted-foreground">
                              ({action.name})
                            </span>
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
                              submitLabel={t("toolActions.update")}
                            />
                          </div>
                        ) : (
                          <div className="space-y-3 p-4 border-t">
                            <p className="text-sm text-muted-foreground">
                              {action.description || t("toolActions.noDescription")}
                            </p>
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
                                  setExpandedActions((prev) => ({
                                    ...prev,
                                    [action.id]: true,
                                  }));
                                }}
                              >
                                <Edit2 className="w-4 h-4 mr-1" />
                                {t("common.edit")}
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
                                {t("common.delete")}
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
                  <p>{t("toolActions.empty")}</p>
                </div>
              )}

              {showNewActionForm && (
                <div className="border rounded-lg p-4 bg-primary/5 border-primary/20">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-medium flex items-center gap-2">
                      <Plus className="w-4 h-4" />
                      {t("toolActions.new")}
                    </h4>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowNewActionForm(false)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  <ToolActionForm
                    initialData={defaultActionForm}
                    onSubmit={handleCreateAction}
                    onCancel={() => setShowNewActionForm(false)}
                    isSubmitting={saving}
                    submitLabel={t("toolActions.create")}
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
              disabled={loading || !canManagePlugins}
            >
              <Plus className="w-4 h-4 mr-2" />
              {t("toolActions.add")}
            </Button>
          )}
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
            {t("common.close")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
