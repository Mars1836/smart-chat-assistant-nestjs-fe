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
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
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
  Edit2,
  Filter,
  ArrowUpDown,
  Upload,
  BookOpen,
} from "lucide-react";
import { useWorkspace } from "@/lib/stores/workspace-store";
import {
  workspaceToolsApi,
  type Plugin,
} from "@/lib/api";
import { OAuthConnectDialog } from "@/components/oauth-connect-dialog";
import { ApiKeyConfigDialog } from "@/components/api-key-config-dialog";
import { PluginActionsDialog } from "@/components/plugin-actions-dialog";
import { CreateToolDialog } from "@/components/create-tool-dialog";
import { ImportPluginDialog } from "@/components/import-plugin-dialog";
import { ToolActionsManager } from "@/components/tool-actions-manager";
import {
  translateTemplate,
  useLanguage,
} from "@/components/providers/language-provider";

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
const getAuthBadge = (
  plugin: Plugin,
  t: (key: string, fallback?: string) => string
) => {
  const authType = plugin.auth_config?.type || "none";

  switch (authType) {
    case "none":
      return null;
    case "oauth2":
      return (
        <Badge variant="secondary" className="gap-1 font-normal">
          <User className="w-3 h-3" />
          {t("plugins.userAuth", "User Auth")}
        </Badge>
      );
    case "api_key":
      // Hide badge if system set
      if (plugin.auth_config?.api_key?.is_set) return null;
      
      return (
        <Badge variant="outline" className="gap-1 font-normal">
          <Key className="w-3 h-3" />
          {t("plugins.adminConfig", "Admin Config")}
        </Badge>
      );
    default:
      return null;
  }
};

function PluginsContent() {
  const { selectedWorkspace, hasPermission } = useWorkspace();
  const { t } = useLanguage();
  const [allPlugins, setAllPlugins] = useState<Plugin[]>([]);
  const [workspacePlugins, setWorkspacePlugins] = useState<Plugin[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filter States
  const [activeTab, setActiveTab] = useState("workspace");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState<"all" | "builtin" | "custom" | "community">("all");
  const [sortBy, setSortBy] = useState<"name" | "category" | "created_at">("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [updatingPlugin, setUpdatingPlugin] = useState<string | null>(null);
  const [addingPlugin, setAddingPlugin] = useState<string | null>(null);
  const [deletingCustom, setDeletingCustom] = useState<string | null>(null);
  
  const searchParams = useSearchParams();

  // Dialog states
  const [oauthDialogOpen, setOAuthDialogOpen] = useState(false);
  const [apiKeyDialogOpen, setApiKeyDialogOpen] = useState(false);
  const [actionsDialogOpen, setActionsDialogOpen] = useState(false);
  const [createToolDialogOpen, setCreateToolDialogOpen] = useState(false);
  const [importPluginDialogOpen, setImportPluginDialogOpen] = useState(false);
  const [manageActionsDialogOpen, setManageActionsDialogOpen] = useState(false);

  const [selectedPlugin, setSelectedPlugin] = useState<Plugin | null>(null);

  const canManagePlugins = hasPermission("workspace.manage_plugins");

  // Handle OAuth callback success
  useEffect(() => {
    const connected = searchParams.get("connected");
    const email = searchParams.get("email");

    if (connected === "true") {
      toast.success(
        email
          ? translateTemplate(t("plugins.connectedAs"), { email })
          : t("plugins.connectedSuccess")
      );
      
      const newUrl = window.location.pathname;
      window.history.replaceState({}, "", newUrl);
      
      if (selectedWorkspace) {
        loadPlugins();
      }
    }
  }, [searchParams, selectedWorkspace]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Load plugins when filters change
  useEffect(() => {
    if (selectedWorkspace) {
      loadPlugins();
    }
  }, [selectedWorkspace, debouncedSearch, filterCategory, sortBy, sortOrder]);

  const loadPlugins = async (background = false) => {
    if (!selectedWorkspace) return;

    try {
      if (!background) setLoading(true);

      const params: any = {
        search: debouncedSearch || undefined,
        sortBy,
        sortOrder,
      };

      if (filterCategory !== "all") {
        params.category = filterCategory;
      }

      // Load both all available plugins and installed workspace plugins
      // Ideally we should load only active tab content, but currently UI structure requires both lists?
      // Actually TabsContent mounts lazily, but let's keep loading both for valid counts in TabsTrigger badges
      const [globalData, workspaceData] = await Promise.all([
        workspaceToolsApi.list(selectedWorkspace.id, params),
        workspaceToolsApi.installed(selectedWorkspace.id, params),
      ]);
      setAllPlugins(globalData);
      setWorkspacePlugins(workspaceData);
    } catch (err: any) {
      console.error("Error loading plugins:", err);
      toast.error(t("plugins.loadFailed"), {
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
      
      toast.success(
        translateTemplate(t("plugins.addSuccess"), { name: plugin.display_name })
      );
      loadPlugins(true);
    } catch (err: any) {
      console.error("Error adding plugin:", err);
      toast.error(t("plugins.addFailed"), {
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

      toast.success(
        translateTemplate(
          enabled ? t("plugins.enableSuccess") : t("plugins.disableSuccess"),
          { name: plugin.display_name }
        )
      );
    } catch (err: any) {
      console.error("Error toggling plugin:", err);
      toast.error(t("plugins.updateFailed"), {
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
      toast.success(
        translateTemplate(t("plugins.removeSuccess"), { name: plugin.display_name })
      );
      loadPlugins(true);
    } catch (err: any) {
      console.error("Error removing plugin:", err);
      toast.error(t("plugins.removeFailed"), {
        description: err?.response?.data?.message || "Unknown error",
      });
    }
  };

  const handleDeleteCustomTool = async (plugin: Plugin) => {
    if (!selectedWorkspace) return;

    // Confirm before permanently deleting
    const confirmed = window.confirm(
      translateTemplate(t("plugins.deleteConfirm"), {
        name: plugin.display_name,
      })
    );
    if (!confirmed) return;

    try {
      setDeletingCustom(plugin.id);
      await workspaceToolsApi.deleteCustom(selectedWorkspace.id, plugin.id);
      toast.success(
        translateTemplate(t("plugins.deleteSuccess"), { name: plugin.display_name })
      );
      loadPlugins(true);
    } catch (err: any) {
      console.error("Error deleting custom plugin:", err);
      const status = err?.response?.status;
      let message = err?.response?.data?.message || "Unknown error";
      
      if (status === 403) {
        message = t("plugins.deleteForbidden");
      } else if (status === 400) {
        message = t("plugins.deleteInUse");
      }
      
      toast.error(t("plugins.deleteFailed"), { description: message });
    } finally {
      setDeletingCustom(null);
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

  // Client-side filtering is removed in favor of Server-side filtering
  // Just use the lists directly
  const filteredAllPlugins = allPlugins;
  const filteredWorkspacePlugins = workspacePlugins;

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
            {t("plugins.description")}
          </p>
        </div>

        {/* Create Tool & Import Plugin */}
        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="outline" className="gap-2" asChild>
            <Link href="/docs/custom-plugin">
              <BookOpen className="w-4 h-4" />
              {t("plugins.customPluginDocs")}
            </Link>
          </Button>
          <Button
            variant="outline"
            onClick={() => setImportPluginDialogOpen(true)}
            className="gap-2"
          >
            <Upload className="w-4 h-4" />
            {t("plugins.import")}
          </Button>
          <Button
            onClick={() => setCreateToolDialogOpen(true)}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            {t("plugins.createTool")}
          </Button>
        </div>

        {/* Filters & Search */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              name="search_p_q"
              autoComplete="new-password"
              autoCorrect="off"
              spellCheck={false}
              readOnly={!isSearchFocused}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              placeholder={t("plugins.search")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10"
            />
          </div>
          
          <div className="flex gap-2">
            <Select 
              value={filterCategory} 
              onValueChange={(v: any) => setFilterCategory(v)}
            >
              <SelectTrigger className="w-[140px]">
                 <Filter className="w-3 h-3 mr-2" />
                 <SelectValue placeholder={t("plugins.category")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("plugins.allTypes")}</SelectItem>
                <SelectItem value="builtin">{t("plugins.builtin")}</SelectItem>
                <SelectItem value="custom">{t("plugins.custom")}</SelectItem>
                <SelectItem value="community">{t("plugins.community")}</SelectItem>
              </SelectContent>
            </Select>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-[140px] justify-between">
                  <span className="flex items-center gap-2">
                    <ArrowUpDown className="w-3 h-3" />
                    {t("plugins.sort")}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>{t("plugins.sortBy")}</DropdownMenuLabel>
                <DropdownMenuRadioGroup value={sortBy} onValueChange={(v:any) => setSortBy(v)}>
                  <DropdownMenuRadioItem value="name">{t("plugins.sort.name")}</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="category">{t("plugins.sort.category")}</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="created_at">{t("plugins.sort.createdAt")}</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>{t("plugins.order")}</DropdownMenuLabel>
                <DropdownMenuRadioGroup value={sortOrder} onValueChange={(v:any) => setSortOrder(v)}>
                  <DropdownMenuRadioItem value="asc">{t("plugins.order.asc")}</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="desc">{t("plugins.order.desc")}</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="workspace" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="workspace" className="gap-2">
              <Plug className="w-4 h-4" />
              {t("plugins.workspaceTab")}
              <Badge variant="secondary" className="ml-1">{workspacePlugins.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="all" className="gap-2">
              <Globe className="w-4 h-4" />
              {t("plugins.allTab")}
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
                    {t("plugins.emptyAll")}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredAllPlugins.map((tool) => {
                  const Icon = getToolIcon(tool.name, tool.executor_type);
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
                              {getAuthBadge(tool, t)}
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
                                {t("plugins.added", "Added")}
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
                                {t("plugins.add", "Add")}
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
                    {t("plugins.emptyWorkspace")}
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    {t("plugins.emptyWorkspaceHint")}
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
                              {getAuthBadge(plugin, t)}
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
                                      {translateTemplate(t("plugins.connectedAs"), {
                                        email:
                                          plugin.user_auth_status.profile?.email || "",
                                      })}
                                    </span>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleConnect(plugin)}
                                      className="h-6 px-2 text-muted-foreground hover:text-destructive hover:bg-transparent text-xs"
                                    >
                                      {t("plugins.disconnect")}
                                    </Button>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2 text-sm">
                                    <AlertCircle className="w-4 h-4 text-orange-500" />
                                    <span className="text-orange-600 font-medium">{t("plugins.notConnected")}</span>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleConnect(plugin)}
                                      className="h-7 text-xs"
                                    >
                                      {t("plugins.connectAccount")}
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
                                    <span className="text-green-600 font-medium">{t("plugins.apiKeyConfigured")}</span>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleConfigureApiKey(plugin)}
                                      className="h-6 px-2 text-muted-foreground text-xs"
                                    >
                                      {t("plugins.editKey")}
                                    </Button>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2 text-sm">
                                    <XCircle className="w-4 h-4 text-red-500" />
                                    <span className="text-red-600 font-medium">{t("plugins.apiKeyMissing")}</span>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleConfigureApiKey(plugin)}
                                      className="h-7 text-xs"
                                    >
                                      {t("plugins.setApiKey")}
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
                                <Button variant="ghost" size="icon" disabled={deletingCustom === plugin.id}>
                                  {deletingCustom === plugin.id ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <MoreVertical className="w-4 h-4" />
                                  )}
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleShowActions(plugin)}>
                                  <Zap className="w-4 h-4 mr-2" />
                                  {t("plugins.viewActions")}
                                </DropdownMenuItem>
                                {/* Show Manage Actions option only for custom plugins */}
                                {plugin.category === "custom" && (
                                  <DropdownMenuItem onClick={() => {
                                    setSelectedPlugin(plugin);
                                    setManageActionsDialogOpen(true);
                                  }}>
                                    <Edit2 className="w-4 h-4 mr-2" />
                                    {t("plugins.manageActions")}
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onClick={() => handleRemoveFromWorkspace(plugin)}
                                  className="text-destructive focus:text-destructive focus:bg-destructive/10"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  {t("plugins.removeFromWorkspace")}
                                </DropdownMenuItem>
                                {/* Show Delete Permanently option only for custom private plugins */}
                                {plugin.category === "custom" && !(plugin as any).is_public && (
                                  <DropdownMenuItem 
                                    onClick={() => handleDeleteCustomTool(plugin)}
                                    className="text-destructive focus:text-destructive focus:bg-destructive/10 font-medium"
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    {t("plugins.deletePermanently")}
                                  </DropdownMenuItem>
                                )}
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

        {/* Import Plugin Dialog */}
        {selectedWorkspace && (
          <ImportPluginDialog
            open={importPluginDialogOpen}
            onOpenChange={setImportPluginDialogOpen}
            workspaceId={selectedWorkspace.id}
            onImported={handleToolCreated}
          />
        )}

        {/* Manage Actions Dialog */}
        {selectedWorkspace && selectedPlugin && (
          <ToolActionsManager
            open={manageActionsDialogOpen}
            onOpenChange={setManageActionsDialogOpen}
            tool={selectedPlugin}
            onActionsChanged={() => loadPlugins(true)}
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
