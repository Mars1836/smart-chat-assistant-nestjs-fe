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
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { 
  Loader2, 
  Plug, 
  Settings2, 
  Code, 
  FileSearch, 
  Calendar, 
  Clock, 
  Mail, 
  Globe,
  ChevronDown,
  ChevronRight,
  Check
} from "lucide-react";
import {
  toolsApi,
  chatbotToolsApi,
  type Tool,
  type ChatbotTool,
  type PluginAction,
} from "@/lib/api";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface ChatbotToolsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
  chatbotId: string;
  chatbotName: string;
}

// Icon mapping for tool executor types
const getToolIcon = (executorType: string) => {
  switch (executorType) {
    case "rag":
      return FileSearch;
    case "calendar":
      return Calendar;
    case "datetime":
      return Clock;
    case "email":
    case "gmail":
      return Mail;
    case "http":
      return Globe;
    case "code":
      return Code;
    default:
      return Plug;
  }
};

// Category badge color mapping
const getCategoryColor = (category: string) => {
  switch (category) {
    case "builtin":
      return "default";
    case "custom":
      return "secondary";
    case "community":
      return "outline";
    default:
      return "default";
  }
};

export function ChatbotToolsDialog({
  open,
  onOpenChange,
  workspaceId,
  chatbotId,
  chatbotName,
}: ChatbotToolsDialogProps) {
  const [allTools, setAllTools] = useState<Tool[]>([]);
  const [chatbotTools, setChatbotTools] = useState<ChatbotTool[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [expandedTools, setExpandedTools] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (open) {
      loadTools();
    }
  }, [open, workspaceId, chatbotId]);

  const loadTools = async () => {
    try {
      setLoading(true);
      
      // Load both global tools and chatbot-specific tools in parallel
      const [globalTools, enabledTools] = await Promise.all([
        toolsApi.list(),
        chatbotToolsApi.list(workspaceId, chatbotId),
      ]);

      setAllTools(globalTools);
      setChatbotTools(enabledTools);
    } catch (err: any) {
      console.error("Error loading tools:", err);
      toast.error("Khong the tai danh sach tools", {
        description: err?.response?.data?.message || "Unknown error",
      });
    } finally {
      setLoading(false);
    }
  };

  const getChatbotTool = (toolId: string) => {
    return chatbotTools.find((t) => t.id === toolId);
  };

  const isToolEnabled = (toolId: string): boolean => {
    const chatbotTool = getChatbotTool(toolId);
    return chatbotTool?.chatbot_tool?.is_enabled ?? false;
  };

  const isActionEnabled = (toolId: string, actionId: string): boolean => {
    const chatbotTool = getChatbotTool(toolId);
    if (!chatbotTool || !chatbotTool.chatbot_tool?.is_enabled) return false;
    
    // If enabled_actions is undefined, assume all are enabled (backward compatibility)
    // If it is defined, check if actionId is in the list
    const enabledActions = chatbotTool.chatbot_tool.enabled_actions;
    if (enabledActions === undefined) return true;
    
    return enabledActions.includes(actionId);
  };

  const handleToggleTool = async (tool: Tool, enabled: boolean) => {
    try {
      setUpdating(tool.id);

      await chatbotToolsApi.update(workspaceId, chatbotId, tool.id, {
        is_enabled: enabled,
      });

      // Update local state
      if (enabled) {
        // Add to enabled tools
        const updatedTool: ChatbotTool = {
          ...tool,
          workspace_tool: null,
          user_auth_status: null,
          chatbot_tool: {
            is_enabled: true,
            // When enabling tool, enable all actions by default or as per API response
            // For now, we'll assume the API handles default actions
          },
        };
        setChatbotTools((prev) => [...prev.filter(t => t.id !== tool.id), updatedTool]);
        // Expand to show actions
        setExpandedTools(prev => ({ ...prev, [tool.id]: true }));
      } else {
        // Update the tool's enabled state
        setChatbotTools((prev) =>
          prev.map((t) =>
            t.id === tool.id
              ? { ...t, chatbot_tool: { ...t.chatbot_tool, is_enabled: false } }
              : t
          )
        );
        // Collapse
        setExpandedTools(prev => ({ ...prev, [tool.id]: false }));
      }

      toast.success(
        enabled ? `Da bat ${tool.display_name}` : `Da tat ${tool.display_name}`
      );
    } catch (err: any) {
      console.error("Error toggling tool:", err);
      toast.error("Khong the cap nhat tool", {
        description: err?.response?.data?.message || "Unknown error",
      });
    } finally {
      setUpdating(null);
    }
  };

  const handleToggleAction = async (tool: Tool, actionId: string, enabled: boolean) => {
    try {
      // Don't set updating for the whole tool to avoid disabling the switch
      // But maybe we should show some loading indicator for the action
      
      await chatbotToolsApi.updateAction(workspaceId, chatbotId, tool.id, actionId, {
        is_enabled: enabled,
      });

      // Update local state
      setChatbotTools((prev) => 
        prev.map((t) => {
          if (t.id !== tool.id) return t;
          
          const currentEnabledActions = t.chatbot_tool?.enabled_actions || tool.actions.map(a => a.name);
          let newEnabledActions;
          
          if (enabled) {
            newEnabledActions = [...currentEnabledActions, actionId];
          } else {
            newEnabledActions = currentEnabledActions.filter(a => a !== actionId);
          }
          
          return {
            ...t,
            chatbot_tool: {
              ...t.chatbot_tool,
              is_enabled: true, // Should still be enabled if we are toggling actions
              enabled_actions: newEnabledActions
            }
          };
        })
      );
      
    } catch (err: any) {
      console.error("Error toggling action:", err);
      toast.error("Khong the cap nhat action");
    }
  };

  const toggleExpand = (toolId: string) => {
    setExpandedTools(prev => ({ ...prev, [toolId]: !prev[toolId] }));
  };

  const enabledCount = chatbotTools.filter(
    (t) => t.chatbot_tool?.is_enabled
  ).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plug className="w-5 h-5" />
            Plugins / Tools
          </DialogTitle>
          <DialogDescription>
            Quan ly cac plugin cho chatbot "{chatbotName}".{" "}
            {enabledCount > 0 && (
              <span className="text-primary font-medium">
                ({enabledCount} plugin dang bat)
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4 px-1">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : allTools.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Plug className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Chua co plugin nao duoc cau hinh.</p>
              <p className="text-sm mt-2">
                Lien he admin de them plugin moi.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {allTools.map((tool) => {
                const Icon = getToolIcon(tool.executor_type || "");
                const isEnabled = isToolEnabled(tool.id);
                const isUpdating = updating === tool.id;
                const isExpanded = expandedTools[tool.id];
                const hasActions = tool.actions && tool.actions.length > 0;

                return (
                  <Collapsible 
                    key={tool.id} 
                    open={isExpanded} 
                    onOpenChange={() => toggleExpand(tool.id)}
                    className={`rounded-lg border transition-all ${
                      isEnabled
                        ? "bg-primary/5 border-primary/20"
                        : "bg-background border-border hover:border-primary/20"
                    }`}
                  >
                    <div className="flex items-start gap-4 p-4">
                      {hasActions && isEnabled ? (
                        <CollapsibleTrigger asChild>
                          <Button variant="ghost" size="sm" className="p-0 h-auto mt-1 hover:bg-transparent">
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-muted-foreground" />
                            )}
                          </Button>
                        </CollapsibleTrigger>
                      ) : (
                        <div className="w-4" /> // Spacer
                      )}

                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          isEnabled ? "bg-primary/10" : "bg-muted"
                        }`}
                      >
                        <Icon
                          className={`w-5 h-5 ${
                            isEnabled ? "text-primary" : "text-muted-foreground"
                          }`}
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-foreground">
                            {tool.display_name}
                          </h4>
                          <Badge variant={getCategoryColor(tool.category || "builtin") as any}>
                            {tool.category}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {tool.description}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {isUpdating && (
                          <Loader2 className="w-4 h-4 animate-spin text-primary" />
                        )}
                        <Switch
                          checked={isEnabled}
                          onCheckedChange={(checked) =>
                            handleToggleTool(tool, checked)
                          }
                          disabled={isUpdating || !tool.is_enabled}
                        />
                      </div>
                    </div>

                    <CollapsibleContent>
                      <div className="pl-20 pr-4 pb-4 space-y-2">
                        <p className="text-xs font-medium text-muted-foreground mb-2">ACTIONS</p>
                        {tool.actions.map((action) => {
                          // Note: action.id might not exist in global tool response, use name as fallback
                          // The API spec says actions have IDs, but frontend code defined PluginAction with id.
                          // Let's assume action.name is unique per tool if id is missing.
                          const actionId = (action as any).id || action.name;
                          const actionEnabled = isActionEnabled(tool.id, actionId);
                          
                          return (
                            <div key={actionId} className="flex items-start gap-3 text-sm">
                              <Checkbox 
                                id={`action-${tool.id}-${actionId}`}
                                checked={actionEnabled}
                                onCheckedChange={(checked) => handleToggleAction(tool, actionId, checked as boolean)}
                                disabled={!isEnabled}
                              />
                              <div className="grid gap-1.5 leading-none">
                                <label
                                  htmlFor={`action-${tool.id}-${actionId}`}
                                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                  {action.display_name || action.name}
                                </label>
                                <p className="text-xs text-muted-foreground">
                                  {action.description}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex justify-between items-center pt-4 border-t">
          <p className="text-sm text-muted-foreground">
            {allTools.length} plugin co san
          </p>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Dong
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
