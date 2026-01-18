"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { workspacesApi, type PermissionName, type PermissionAction, type EffectivePermission } from "@/lib/api/workspaces/workspaces-api";
import { Loader2, Check, Ban, RotateCcw, Shield,  UserCog} from "lucide-react";

interface ManagePermissionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
  memberId: string;
  memberName: string;
  memberRole: string; // To hint default values (optional enhancement)
}

type PermissionCategory = "Workspace" | "Member" | "Chatbot" | "Document";

interface PermissionItem {
  name: PermissionName;
  label: string;
  description: string;
}

const PERMISSIONS: Record<PermissionCategory, PermissionItem[]> = {
  Workspace: [
    { name: "workspace.update", label: "Update Workspace", description: "Edit name, description, settings" },
    { name: "workspace.view_settings", label: "View Settings", description: "Access workspace settings page" },
    { name: "workspace.delete", label: "Delete Workspace", description: "Permanently delete workspace" },
  ],
  Member: [
    { name: "member.view", label: "View Members", description: "See member list" },
    { name: "member.invite", label: "Invite Members", description: "Invite new users" },
    { name: "member.update_role", label: "Update Role", description: "Change member roles" },
    { name: "member.remove", label: "Remove Members", description: "Remove users from workspace" },
  ],
  Chatbot: [
    { name: "chatbot.view", label: "View Chatbots", description: "See list of chatbots" },
    { name: "chatbot.create", label: "Create Chatbot", description: "Create new bots" },
    { name: "chatbot.update", label: "Update Chatbot", description: "Edit bot configurations" },
    { name: "chatbot.chat", label: "Chat with Bot", description: "Send messages to bot" },
    { name: "chatbot.view_logs", label: "View Logs", description: "Access conversation history" },
    { name: "chatbot.delete", label: "Delete Chatbot", description: "Remove bots" },
  ],
  Document: [
    { name: "document.view", label: "View Documents", description: "See knowledge base" },
    { name: "document.upload", label: "Upload Documents", description: "Add new files/urls" },
    { name: "document.update", label: "Update Documents", description: "Re-train or edit docs" },
    { name: "document.delete", label: "Delete Documents", description: "Remove documents" },
  ],
};

export function ManagePermissionsDialog({
  open,
  onOpenChange,
  workspaceId,
  memberId,
  memberName,
  memberRole,
}: ManagePermissionsDialogProps) {
  const [loadingState, setLoadingState] = useState<{ permission: PermissionName; action: PermissionAction } | null>(null);
  const [effectivePermissions, setEffectivePermissions] = useState<Map<string, EffectivePermission>>(new Map());
  const [isLoadingPermissions, setIsLoadingPermissions] = useState(false);
  
  const [activeTab, setActiveTab] = useState<PermissionCategory>("Chatbot");
  const categories: PermissionCategory[] = ["Chatbot", "Document", "Member", "Workspace"];

  useEffect(() => {
    if (open && workspaceId && memberId) {
      fetchEffectivePermissions();
    }
  }, [open, workspaceId, memberId]);

  const fetchEffectivePermissions = async () => {
    setIsLoadingPermissions(true);
    try {
      const permissions = await workspacesApi.getEffectivePermissions(workspaceId, memberId);
      const permMap = new Map<string, EffectivePermission>();
      permissions.forEach(p => permMap.set(p.permission_name, p));
      setEffectivePermissions(permMap);
    } catch (error) {
      console.error("Failed to fetch permissions:", error);
      toast.error("Failed to load permissions");
    } finally {
      setIsLoadingPermissions(false);
    }
  };
  
  const handleUpdatePermission = async (permission: PermissionName, action: PermissionAction) => {
    setLoadingState({ permission, action });
    try {
      await workspacesApi.updateMemberPermissions(workspaceId, memberId, {
        permission_name: permission,
        action,
      });
      toast.success(`Successfully ${action}ed ${permission}`);
      // Refresh permissions to show updated state
      await fetchEffectivePermissions();
    } catch (error: any) {
      console.error("Update permission error:", error);
      toast.error("Failed to update permission");
    } finally {
      setLoadingState(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Manage Permissions</DialogTitle>
          <DialogDescription>
             Adjust granular permissions for <strong>{memberName}</strong> ({memberRole}).
             <br/>Inspect effective permissions and overrides.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col">
           {/* Custom Tabs List */}
          <div className="flex space-x-1 rounded-lg bg-muted p-1 mb-4">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setActiveTab(category)}
                className={`
                  flex-1 inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50
                  ${activeTab === category ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:bg-background/50"}
                `}
              >
                {category}
              </button>
            ))}
          </div>
          
          <div className="flex-1 overflow-y-auto pr-2">
            {isLoadingPermissions ? (
              <div className="flex justify-center p-8">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="space-y-3">
                {PERMISSIONS[activeTab].map((item) => {
                  const effective = effectivePermissions.get(item.name);
                  const isAllowed = effective?.is_allowed ?? false;
                  const source = effective?.source ?? "NONE";
                  const customType = effective?.custom_grant_type;

                  return (
                    <div key={item.name} className="flex items-center justify-between p-3 border rounded-lg bg-card/50">
                      <div className="space-y-1.5 flex-1 mr-4">
                        <div className="font-medium flex items-center gap-2 flex-wrap">
                          {item.label}
                          <code 
                            className="text-xs bg-muted px-1 py-0.5 rounded text-muted-foreground cursor-help"
                            title={`System ID: ${item.name}`}
                          >
                            {item.name}
                          </code>

                          {/* Status Badge */}
                          <Badge 
                            variant={isAllowed ? "default" : "destructive"} 
                            className={`h-5 px-1.5 text-[10px] ${isAllowed ? "bg-green-600 hover:bg-green-700" : "bg-red-500 hover:bg-red-600"}`}
                          >
                            {isAllowed ? <Check className="w-3 h-3 mr-1"/> : <Ban className="w-3 h-3 mr-1"/>}
                            {isAllowed ? "Allowed" : "Denied"}
                          </Badge>

                           {/* Source Badge */}
                           {source === "ROLE" && (
                              <Badge variant="outline" className="h-5 px-1.5 text-[10px] text-blue-600 border-blue-200 bg-blue-50">
                                <Shield className="w-3 h-3 mr-1"/> Role
                              </Badge>
                           )}
                           {source === "CUSTOM" && (
                              <Badge variant="outline" className="h-5 px-1.5 text-[10px] text-purple-600 border-purple-200 bg-purple-50">
                                <UserCog className="w-3 h-3 mr-1"/> Custom
                              </Badge>
                           )}

                           {/* Custom Action Detail */}
                           {customType === "grant" && (
                              <span className="text-[10px] text-green-600 font-medium ml-1 flex items-center">
                                (Explicitly Granted)
                              </span>
                           )}
                           {customType === "revoke" && (
                              <span className="text-[10px] text-red-600 font-medium ml-1 flex items-center">
                                (Explicitly Revoked)
                              </span>
                           )}
                        </div>
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant={customType === "grant" ? "default" : "outline"}
                          size="sm"
                          className={`h-8 gap-1.5 ${customType === "grant" ? "bg-green-600 hover:bg-green-700" : "hover:bg-green-50 hover:text-green-600 hover:border-green-200"}`}
                          onClick={() => handleUpdatePermission(item.name, "grant")}
                          disabled={!!loadingState} // Always allow explicitly granting to override
                        >
                            {loadingState?.permission === item.name && loadingState?.action === "grant" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                            Grant
                        </Button>
                        <Button
                          variant={customType === "revoke" ? "default" : "outline"}
                          size="sm" 
                          className={`h-8 gap-1.5 ${customType === "revoke" ? "bg-red-600 hover:bg-red-700" : "hover:bg-red-50 hover:text-red-600 hover:border-red-200"}`}
                          onClick={() => handleUpdatePermission(item.name, "revoke")}
                            disabled={!!loadingState}
                        >
                          {loadingState?.permission === item.name && loadingState?.action === "revoke" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Ban className="w-3.5 h-3.5" />}
                          Revoke
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
