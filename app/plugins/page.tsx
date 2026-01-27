"use client";

import { useState, useEffect, Suspense } from "react";
import { toast } from "sonner";
import { AppLayout } from "@/components/app-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Loader2,
  Plus,
  Search,
  MoreVertical,
  Plug,
  FileSearch,
  Mail,
  Zap,
  Trash2,
  Calendar,
  Clock,
  Globe,
  Code,
  Key,
  User,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Check,
} from "lucide-react";
import { useWorkspace } from "@/lib/stores/workspace-store";
import {
  workspaceToolsApi,
  type Plugin,
} from "@/lib/api";
import { OAuthConnectDialog } from "@/components/oauth-connect-dialog";
import { ApiKeyConfigDialog } from "@/components/api-key-config-dialog";
import { PluginActionsDialog } from "@/components/plugin-actions-dialog";
import { CreateToolDialog } from "@/components/create-tool-dialog"; // Added

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

// Auth type badge
const getAuthBadge = (plugin: Plugin) => {
  const authType = plugin.auth_config?.type || "none";

  switch (authType) {
    case "none":
      return null;
    case "oauth2":
      return (
        <Badge variant="secondary" className="gap-1 font-normal">
          <User className="w-3 h-3" />
          User Auth
        </Badge>
      );
    case "api_key":
      // Hide badge if system set
      if (plugin.auth_config?.api_key?.is_set) return null;
      
      return (
        <Badge variant="outline" className="gap-1 font-normal">
          <Key className="w-3 h-3" />
          Admin Config
        </Badge>
      );
    default:
      return null;
  }
};

function PluginsContent() {
  const { selectedWorkspace, hasPermission } = useWorkspace();
  const [allPlugins, setAllPlugins] = useState<Plugin[]>([]);
  const [workspacePlugins, setWorkspacePlugins] = useState<Plugin[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [updatingPlugin, setUpdatingPlugin] = useState<string | null>(null);
  const [addingPlugin, setAddingPlugin] = useState<string | null>(null);
  
  const searchParams = useSearchParams();
  const router = useRouter();

  // Dialog states
  const [oauthDialogOpen, setOAuthDialogOpen] = useState(false);
  const [apiKeyDialogOpen, setApiKeyDialogOpen] = useState(false);
  const [actionsDialogOpen, setActionsDialogOpen] = useState(false);
  const [createToolDialogOpen, setCreateToolDialogOpen] = useState(false);

  const [selectedPlugin, setSelectedPlugin] = useState<Plugin | null>(null);

  const canManagePlugins = hasPermission("chatbot.update") || true;

  // Handle OAuth callback success
  useEffect(() => {
    const connected = searchParams.get("connected");
    const email = searchParams.get("email");

    if (connected === "true") {
      toast.success(
        email ? `Kết nối thành công: ${email}` : "Kết nối thành công"
      );
      
      const newUrl = window.location.pathname;
      window.history.replaceState({}, "", newUrl);
      
      if (selectedWorkspace) {
        loadPlugins();
      }
    }
  }, [searchParams, selectedWorkspace]);

  useEffect(() => {
    if (selectedWorkspace) {
      loadPlugins();
    }
  }, [selectedWorkspace]);

  const loadPlugins = async (background = false) => {
    if (!selectedWorkspace) return;

    try {
      if (!background) setLoading(true);
      // Load both all available plugins and installed workspace plugins
      const [globalData, workspaceData] = await Promise.all([
        workspaceToolsApi.list(selectedWorkspace.id),
        workspaceToolsApi.installed(selectedWorkspace.id),
      ]);
      setAllPlugins(globalData);
      setWorkspacePlugins(workspaceData);
    } catch (err: any) {
      console.error("Error loading plugins:", err);
      toast.error("Không thể tải danh sách plugin", {
        description: err?.response?.data?.message || "Unknown error",
      });
    } finally {
      if (!background) setLoading(false);
    }
  };

  const handleAddToWorkspace = async (plugin: Plugin) => {
    if (!selectedWorkspace) return;

    try {
      setAddingPlugin(plugin.id);
      await workspaceToolsApi.add(selectedWorkspace.id, {
        tool_id: plugin.id,
        is_enabled: true,
      });
      
      toast.success(`Đã thêm ${plugin.display_name} vào workspace`);
      loadPlugins(true);
    } catch (err: any) {
      console.error("Error adding plugin:", err);
      toast.error("Không thể thêm plugin", {
        description: err?.response?.data?.message || "Unknown error",
      });
    } finally {
      setAddingPlugin(null);
    }
  };

  const handleTogglePlugin = async (plugin: Plugin, enabled: boolean) => {
    if (!selectedWorkspace) return;

    try {
      setUpdatingPlugin(plugin.id);
      await workspaceToolsApi.update(selectedWorkspace.id, plugin.id, {
        is_enabled: enabled,
      });
      
      setWorkspacePlugins((prev) =>
        prev.map((p) =>
          p.id === plugin.id
            ? {
                ...p,
                workspace_tool: {
                  ...p.workspace_tool!,
                  is_enabled: enabled,
                  config_override: p.workspace_tool?.config_override || {}
                },
              }
            : p
        )
      );

      toast.success(enabled ? `Đã bật ${plugin.display_name}` : `Đã tắt ${plugin.display_name}`);
    } catch (err: any) {
      console.error("Error toggling plugin:", err);
      toast.error("Không thể cập nhật plugin", {
        description: err?.response?.data?.message || "Unknown error",
      });
    } finally {
      setUpdatingPlugin(null);
    }
  };

  const handleConnect = (plugin: Plugin) => {
    setSelectedPlugin(plugin);
    setOAuthDialogOpen(true);
  };

  const handleConfigureApiKey = (plugin: Plugin) => {
    setSelectedPlugin(plugin);
    setApiKeyDialogOpen(true);
  };

  const handleShowActions = (plugin: Plugin) => {
    setSelectedPlugin(plugin);
    setActionsDialogOpen(true);
  };

  const handleRemoveFromWorkspace = async (plugin: Plugin) => {
    if (!selectedWorkspace) return;

    try {
      await workspaceToolsApi.remove(selectedWorkspace.id, plugin.id);
      toast.success(`Đã xóa ${plugin.display_name} khỏi workspace`);
      loadPlugins(true);
    } catch (err: any) {
      console.error("Error removing plugin:", err);
      toast.error("Không thể xóa plugin", {
        description: err?.response?.data?.message || "Unknown error",
      });
    }
  };

  const handleOAuthConnected = () => {
    loadPlugins(true);
    setOAuthDialogOpen(false);
  };

  const handleApiKeyConfigured = () => {
    loadPlugins(true);
    setApiKeyDialogOpen(false);
  };

  const handleToolCreated = () => {
    loadPlugins(true);
  };

  // Get workspace plugin IDs for checking if a global plugin is already added
  const workspacePluginIds = new Set(workspacePlugins.map(p => p.id));

  // Filter for search
  const filteredAllPlugins = allPlugins.filter(
    (p) =>
      p.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredWorkspacePlugins = workspacePlugins.filter(
    (p) =>
      p.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isApiKeyConfigured = (plugin: Plugin) => {
    // Check if there's a default/system-provided key or it's marked as set by backend
    if (plugin.auth_config?.api_key?.value || plugin.auth_config?.api_key?.is_set) return true;

    // Check if there's a user override
    if (!plugin.workspace_tool?.config_override) return false;
    const paramName = plugin.auth_config?.api_key?.param_name || plugin.auth_config?.api_key?.header_name;
    if (!paramName) return false;
    return !!plugin.workspace_tool.config_override[paramName];
  };

  if (loading) {
    return (
      <AppLayout activeModule="plugins">
        <div className="flex items-center justify-center h-full">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout activeModule="plugins">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Plugins
          </h1>
          <p className="text-muted-foreground mt-1">
            Quản lý các plugin cho workspace của bạn
          </p>
        </div>

        {/* Create Tool - Added */}
        <div className="flex justify-end">
          <Button 
            onClick={() => setCreateToolDialogOpen(true)}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Tool
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            name="search_p_q"
            autoComplete="new-password"
            autoCorrect="off"
            spellCheck={false}
            readOnly={!isSearchFocused}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
            placeholder="Tìm kiếm plugin..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-10"
          />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="workspace" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="workspace" className="gap-2">
              <Plug className="w-4 h-4" />
              Workspace
              <Badge variant="secondary" className="ml-1">{workspacePlugins.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="all" className="gap-2">
              <Globe className="w-4 h-4" />
              All Plugins
              <Badge variant="secondary" className="ml-1">{allPlugins.length}</Badge>
            </TabsTrigger>
          </TabsList>

          {/* All Plugins Tab */}
          <TabsContent value="all" className="mt-6">
            {filteredAllPlugins.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Plug className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    Không tìm thấy plugin nào.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredAllPlugins.map((tool) => {
                  const Icon = getToolIcon(tool.name, tool.executor_type);
                  const authType = tool.auth_config?.type || "none";
                  const isAdded = workspacePluginIds.has(tool.id);
                  const isAdding = addingPlugin === tool.id;

                  return (
                    <Card
                      key={tool.id}
                      className={`transition-colors ${
                        isAdded ? "border-green-500/30 bg-green-500/5" : "hover:border-primary/50"
                      }`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          {/* Icon */}
                          <div
                            className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                              isAdded ? "bg-green-500/10" : "bg-muted"
                            }`}
                          >
                            <Icon
                              className={`w-6 h-6 ${
                                isAdded ? "text-green-600" : "text-muted-foreground"
                              }`}
                            />
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <h3 className="font-semibold text-foreground">
                                {tool.display_name}
                              </h3>
                              <Badge variant="outline">{tool.category}</Badge>
                              {getAuthBadge(tool)}
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {tool.description}
                            </p>
                          </div>

                          {/* Action */}
                          <div className="shrink-0">
                            {isAdded ? (
                              <Badge className="gap-1 bg-green-600 hover:bg-green-600">
                                <Check className="w-3 h-3" />
                                Added
                              </Badge>
                            ) : (
                              <Button
                                size="sm"
                                onClick={() => handleAddToWorkspace(tool)}
                                disabled={isAdding || !canManagePlugins}
                                className="gap-1"
                              >
                                {isAdding ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Plus className="w-4 h-4" />
                                )}
                                Add
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Workspace Plugins Tab */}
          <TabsContent value="workspace" className="mt-6">
            {filteredWorkspacePlugins.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Plug className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    Chưa có plugin nào trong workspace.
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Chuyển sang tab "All Plugins" để thêm plugin.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredWorkspacePlugins.map((plugin) => {
                  const Icon = getToolIcon(plugin.name, plugin.executor_type);
                  const isEnabled = plugin.workspace_tool?.is_enabled ?? false;
                  const isUpdating = updatingPlugin === plugin.id;
                  const authType = plugin.auth_config?.type || "none";

                  return (
                    <Card
                      key={plugin.id}
                      className={`transition-colors ${
                        isEnabled ? "border-primary/20 bg-primary/5" : ""
                      }`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          {/* Icon */}
                          <div
                            className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                              isEnabled ? "bg-primary/10" : "bg-muted"
                            }`}
                          >
                            <Icon
                              className={`w-6 h-6 ${
                                isEnabled ? "text-primary" : "text-muted-foreground"
                              }`}
                            />
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-foreground">
                                {plugin.display_name}
                              </h3>
                              <Badge variant="outline">{plugin.category}</Badge>
                              {getAuthBadge(plugin)}
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {plugin.description}
                            </p>

                            {/* Auth Status */}
                            {authType === "oauth2" && (
                              <div className="mt-3">
                                {plugin.user_auth_status?.connected ? (
                                  <div className="flex items-center gap-2 text-sm">
                                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                                    <span className="text-green-600 font-medium">
                                      Connected as {plugin.user_auth_status.profile?.email}
                                    </span>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleConnect(plugin)}
                                      className="h-6 px-2 text-muted-foreground hover:text-destructive hover:bg-transparent text-xs"
                                    >
                                      Disconnect
                                    </Button>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2 text-sm">
                                    <AlertCircle className="w-4 h-4 text-orange-500" />
                                    <span className="text-orange-600 font-medium">Not connected</span>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleConnect(plugin)}
                                      className="h-7 text-xs"
                                    >
                                      Connect Account
                                    </Button>
                                  </div>
                                )}
                              </div>
                            )}

                            {authType === "api_key" && !plugin.auth_config?.api_key?.is_set && (
                              <div className="mt-3">
                                {isApiKeyConfigured(plugin) ? (
                                  <div className="flex items-center gap-2 text-sm">
                                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                                    <span className="text-green-600 font-medium">API Key configured</span>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleConfigureApiKey(plugin)}
                                      className="h-6 px-2 text-muted-foreground text-xs"
                                    >
                                      Edit Key
                                    </Button>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2 text-sm">
                                    <XCircle className="w-4 h-4 text-red-500" />
                                    <span className="text-red-600 font-medium">API Key not configured</span>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleConfigureApiKey(plugin)}
                                      className="h-7 text-xs"
                                    >
                                      Set API Key
                                    </Button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-3">
                            {isUpdating && (
                              <Loader2 className="w-4 h-4 animate-spin text-primary" />
                            )}
                            <Switch
                              checked={isEnabled}
                              onCheckedChange={(checked) =>
                                handleTogglePlugin(plugin, checked)
                              }
                              disabled={isUpdating || !canManagePlugins}
                            />
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleShowActions(plugin)}>
                                  <Zap className="w-4 h-4 mr-2" />
                                  View Actions
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onClick={() => handleRemoveFromWorkspace(plugin)}
                                  className="text-destructive focus:text-destructive focus:bg-destructive/10"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Remove from Workspace
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Dialogs */}
        {selectedWorkspace && selectedPlugin && (
          <>
            <OAuthConnectDialog
              open={oauthDialogOpen}
              onOpenChange={setOAuthDialogOpen}
              workspaceId={selectedWorkspace.id}
              plugin={selectedPlugin}
              onConnected={handleOAuthConnected}
            />

            <ApiKeyConfigDialog
              open={apiKeyDialogOpen}
              onOpenChange={setApiKeyDialogOpen}
              workspaceId={selectedWorkspace.id}
              plugin={selectedPlugin}
              onConfigured={handleApiKeyConfigured}
            />

            <PluginActionsDialog
              open={actionsDialogOpen}
              onOpenChange={setActionsDialogOpen}
              plugin={selectedPlugin}
            />

          </>
        )}

        {/* Create Tool Dialog */}
        {selectedWorkspace && (
          <CreateToolDialog
            open={createToolDialogOpen}
            onOpenChange={setCreateToolDialogOpen}
            workspaceId={selectedWorkspace.id}
            onToolCreated={handleToolCreated}
          />
        )}
      </div>
    </AppLayout>
  );
}

export default function PluginsPage() {
  return (
    <Suspense fallback={
      <AppLayout activeModule="plugins">
        <div className="flex items-center justify-center h-full">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    }>
      <PluginsContent />
    </Suspense>
  );
}
