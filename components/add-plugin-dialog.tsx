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
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Search,
  Plus,
  Plug,
  FileSearch,
  Mail,
  Calendar,
  Clock,
  Globe,
  Code,
  Key,
  User,
} from "lucide-react";
import {
  toolsApi,
  workspaceToolsApi,
  type Plugin,
  type ToolCategory,
} from "@/lib/api";

interface AddPluginDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
  existingPluginIds: string[];
  onPluginAdded: () => void;
}

// Icon mapping for tool types
const getToolIcon = (name: string, executorType?: string) => {
  const iconMap: Record<string, React.ElementType> = {
    rag: FileSearch,
    gmail: Mail,
    email: Mail,
    calendar: Calendar,
    datetime: Clock,
    weather: Globe,
    http: Globe,
    code: Code,
  };
  return iconMap[name] || iconMap[executorType || ""] || Plug;
};

const getAuthBadge = (authType: string) => {
  switch (authType) {
    case "oauth2":
      return (
        <Badge variant="secondary" className="gap-1 font-normal text-xs">
          <User className="w-3 h-3" />
          User Auth
        </Badge>
      );
    case "api_key":
      return (
        <Badge variant="outline" className="gap-1 font-normal text-xs">
          <Key className="w-3 h-3" />
          Admin Config
        </Badge>
      );
    default:
      return null;
  }
};

export function AddPluginDialog({
  open,
  onOpenChange,
  workspaceId,
  existingPluginIds,
  onPluginAdded,
}: AddPluginDialogProps) {
  const [tools, setTools] = useState<Plugin[]>([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (open) {
      loadTools();
    }
  }, [open]);

  const loadTools = async () => {
    try {
      setLoading(true);
      // We use the global tools list API, but cast to Plugin[] as the structure is compatible
      // Note: toolsApi.list returns Tool[], but Plugin extends Tool with extra fields
      // which are optional or null in this context
      const data = (await toolsApi.list()) as unknown as Plugin[];
      setTools(data);
    } catch (err: any) {
      console.error("Error loading tools:", err);
      toast.error("Khong the tai danh sach plugin");
    } finally {
      setLoading(false);
    }
  };

  const handleAddPlugin = async (tool: Plugin) => {
    try {
      setAdding(tool.id);
      
      await workspaceToolsApi.add(workspaceId, {
        tool_id: tool.id,
        is_enabled: true,
      });

      toast.success(`Da them plugin ${tool.display_name}`);
      onPluginAdded();
    } catch (err: any) {
      console.error("Error adding plugin:", err);
      toast.error("Khong the them plugin", {
        description: err?.response?.data?.message || "Unknown error",
      });
    } finally {
      setAdding(null);
    }
  };

  // Filter tools: search query AND not already added
  const filteredTools = tools.filter((tool) => {
    const isAdded = existingPluginIds.includes(tool.id);
    const matchesSearch =
      tool.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    return !isAdded && matchesSearch;
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Add Plugin to Workspace</DialogTitle>
          <DialogDescription>
            Search and add plugins to extend your workspace capabilities.
          </DialogDescription>
        </DialogHeader>

        <div className="relative my-2">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search plugins..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex-1 overflow-y-auto pr-2 -mr-2">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : filteredTools.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Plug className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No new plugins found.</p>
              {searchQuery && <p className="text-sm mt-1">Try a different search query.</p>}
              {!searchQuery && existingPluginIds.length > 0 && (
                <p className="text-sm mt-1">You have added all available plugins.</p>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4">
              {filteredTools.map((tool) => {
                const Icon = getToolIcon(tool.name, tool.executor_type);
                const authType = tool.auth_config?.type || "none";
                const isAdding = adding === tool.id;

                return (
                  <div
                    key={tool.id}
                    className="flex flex-col border rounded-lg p-4 hover:border-primary/50 transition-colors bg-card"
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                        <Icon className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-sm truncate">
                            {tool.display_name}
                          </h4>
                          {getAuthBadge(authType)}
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {tool.description}
                        </p>
                      </div>
                    </div>

                    <div className="mt-auto pt-2">
                      <Button
                        size="sm"
                        className="w-full gap-2"
                        onClick={() => handleAddPlugin(tool)}
                        disabled={isAdding}
                      >
                        {isAdding ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Plus className="w-4 h-4" />
                        )}
                        Add Plugin
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
