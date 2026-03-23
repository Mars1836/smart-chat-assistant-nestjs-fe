"use client";

import { AppLayout } from "@/components/app-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Plus, MoreVertical, Mail, Trash2, Shield, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { InviteMemberDialog } from "@/components/invite-member-dialog";
import { ChangeRoleDialog } from "@/components/change-role-dialog";
import { ManagePermissionsDialog } from "@/components/manage-permissions-dialog";
import { toast } from "sonner";
import { useWorkspace } from "@/lib/stores/workspace-store";
import { workspacesApi, type WorkspaceMember } from "@/lib/api/workspaces/workspaces-api";
import {
  workspaceInvitationsApi,
  type WorkspaceInvitation,
} from "@/lib/api/workspace-invitations/workspace-invitations-api";
import {
  translateTemplate,
  useLanguage,
} from "@/components/providers/language-provider";

export default function TeamPage() {
  const { selectedWorkspace, hasPermission } = useWorkspace();
  const { t } = useLanguage();
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [invitations, setInvitations] = useState<WorkspaceInvitation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [editingMember, setEditingMember] = useState<WorkspaceMember | null>(null);
  const [managingPermissionsMember, setManagingPermissionsMember] = useState<WorkspaceMember | null>(null);
  const workspaceId = selectedWorkspace?.id;

  useEffect(() => {
    if (workspaceId) {
      loadData();
    }
  }, [workspaceId]);

  const loadData = async () => {
    if (!workspaceId) return;
    
    setIsLoading(true);
    try {
      const [membersData, invitationsData] = await Promise.all([
        workspacesApi.getMembers(workspaceId),
        workspaceInvitationsApi.list(workspaceId),
      ]);
      setMembers(membersData);
      setInvitations(invitationsData);
    } catch (error) {
      console.error("Error loading team data:", error);
      toast.error(t("team.loadFailed"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveMember = async (id: string, name: string) => {
    // TODO: Implement remove member API
    toast.error(t("team.removeNotImplemented"));
  };

  // Handle resend invitation
  const handleResendInvite = async (invitationId: string) => {
    if (!workspaceId) return;

    console.log("🔄 Resending invitation:", invitationId);
    setProcessingIds((prev) => new Set(prev).add(invitationId));

    try {
      console.log("📤 Calling resend API...");
      const result = await workspaceInvitationsApi.resend(workspaceId, invitationId);
      console.log("✅ Resend successful:", result);
      toast.success(t("team.resendSuccess"));
    } catch (error: any) {
      console.error("❌ Failed to resend invitation:", error);
      console.error("Error details:", {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
      toast.error(error.response?.data?.message || t("team.resendFailed"));
    } finally {
      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(invitationId);
        return next;
      });
    }
  };

  // Handle cancel invitation
  const handleCancelInvite = async (invitationId: string) => {
    if (!confirm(t("team.cancelInviteConfirm"))) {
      return;
    }

    if (!workspaceId) return;

    console.log("🗑️ Canceling invitation:", invitationId);
    setProcessingIds((prev) => new Set(prev).add(invitationId));

    try {
      console.log("📤 Calling cancel API...");
      await workspaceInvitationsApi.cancel(workspaceId, invitationId);
      console.log("✅ Cancel successful");
      toast.success(t("team.cancelSuccess"));
      // Remove from list
      setInvitations((prev) => prev.filter((inv) => inv.id !== invitationId));
    } catch (error: any) {
      console.error("❌ Failed to cancel invitation:", error);
      console.error("Error details:", {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
      toast.error(error.response?.data?.message || t("team.cancelFailed"));
    } finally {
      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(invitationId);
        return next;
      });
    }
  };

  // Permission checks
  const canInviteMembers = hasPermission("member.invite");
  const canRemoveMembers = hasPermission("member.remove");
  const canUpdateRole = hasPermission("member.update_role");
  const canViewMembers = hasPermission("member.view");
  const canViewSettings = hasPermission("workspace.view_settings");

  if (!canViewMembers) {
    return (
      <AppLayout activeModule="team">
        <div className="p-6 text-center text-muted-foreground">
          {t("billing.forbidden")}
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout activeModule="team">
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-foreground">{t("team.title")}</h1>
          {canInviteMembers && (
            <Button
              onClick={() => setShowInviteDialog(true)}
              className="gap-2 bg-primary hover:bg-primary/90"
            >
              <Plus className="w-4 h-4" />
              {t("team.inviteMember")}
            </Button>
          )}
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center p-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}

        {/* Team Members List */}
        {!isLoading && (
          <Card>
            <CardHeader>
              <CardTitle>{translateTemplate(t("team.activeMembers"), { count: members.length })}</CardTitle>
            </CardHeader>
            <CardContent>
              {members.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {t("team.noMembers")}
                </div>
              ) : (
                <div className="space-y-3">
                  {members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-4 hover:bg-muted rounded-lg transition-colors group"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-bold text-primary">
                            {member.user.full_name
                              ? member.user.full_name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")
                                  .toUpperCase()
                              : member.user.email?.[0]?.toUpperCase() || "U"}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground">
                            {member.user.full_name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {member.user.email}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <Badge className="bg-primary/10 text-primary">
                          {member.workspaceRole.name}
                        </Badge>
                        <Badge className="bg-green-100 text-green-800">
                          {t("team.active")}
                        </Badge>
                        
                        {(() => {
                           const currentUserRole = selectedWorkspace?.user_role;
                           // Check Edit Permission
                           const canEdit = canUpdateRole && (() => {
                             if (member.workspaceRole.name === "Owner") return false;
                             if (currentUserRole === "Admin" && member.workspaceRole.name === "Admin") return false;
                             return true;
                           })();

                           // Check Remove Permission (Nobody removes Owner)
                           const canRemove = canRemoveMembers && member.workspaceRole.name !== "Owner";

                           const hasActions = canEdit || canRemove;

                           if (!hasActions) {
                             return (
                               <Button
                                 variant="ghost"
                                 size="sm"
                                 className="opacity-0 pointer-events-none"
                               >
                                 <MoreVertical className="w-4 h-4" />
                               </Button>
                             );
                           }

                           return (
                             <DropdownMenu>
                               <DropdownMenuTrigger asChild>
                                 <Button
                                   variant="ghost"
                                   size="sm"
                                   className="opacity-0 group-hover:opacity-100"
                                 >
                                   <MoreVertical className="w-4 h-4" />
                                 </Button>
                               </DropdownMenuTrigger>
                               <DropdownMenuContent align="end">
                                 {canEdit && (
                                   <>
                                     <DropdownMenuItem
                                       onClick={() => setEditingMember(member)}
                                     >
                                       <Shield className="w-4 h-4 mr-2" />
                                       {t("team.changeRole")}
                                     </DropdownMenuItem>
                                     <DropdownMenuItem
                                       onClick={() => setManagingPermissionsMember(member)}
                                     >
                                       <Shield className="w-4 h-4 mr-2 text-blue-500" />
                                       {t("team.managePermissions")}
                                     </DropdownMenuItem>
                                   </>
                                 )}
                                 {canRemove && (
                                   <DropdownMenuItem
                                     className="text-destructive"
                                     onClick={() => handleRemoveMember(member.id, member.user.full_name)}
                                   >
                                     <Trash2 className="w-4 h-4 mr-2" />
                                     {t("team.remove")}
                                   </DropdownMenuItem>
                                 )}
                               </DropdownMenuContent>
                             </DropdownMenu>
                           );
                        })()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}



        {/* Pending Invitations List */}
        {!isLoading && invitations.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>{translateTemplate(t("team.pendingInvitations"), { count: invitations.length })}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {invitations.map((invitation) => {
                  const isProcessing = processingIds.has(invitation.id);
                  const canResend = canInviteMembers; // Only those who can invite can resend
                  const canCancel = canRemoveMembers; // Only those who can remove members can cancel invites
                  const hasActions = canResend || canCancel;
                  
                  return (
                    <div
                      key={invitation.id}
                      className="flex items-center justify-between p-4 hover:bg-muted rounded-lg transition-colors group"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <Mail className="w-5 h-5 text-yellow-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground">
                            {invitation.email}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {translateTemplate(t("team.invitedBy"), {
                              name: invitation.invitedByUser.full_name,
                            })}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <Badge className="bg-secondary/10 text-secondary">
                          {invitation.workspaceRole.name}
                        </Badge>
                        <Badge className="bg-yellow-100 text-yellow-800">
                          {t("team.pending")}
                        </Badge>
                        {hasActions && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="opacity-0 group-hover:opacity-100"
                                disabled={isProcessing}
                              >
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {canResend && (
                                <DropdownMenuItem
                                  onClick={() => handleResendInvite(invitation.id)}
                                  disabled={isProcessing}
                                >
                                  <Mail className="w-4 h-4 mr-2" />
                                  {t("team.resendInvite")}
                                </DropdownMenuItem>
                              )}
                              {canCancel && (
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => handleCancelInvite(invitation.id)}
                                  disabled={isProcessing}
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  {t("team.cancelInvite")}
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Team Settings - Only for users with workspace.settings permission */}
        {canViewSettings && (
          <Card>
            <CardHeader>
              <CardTitle>{t("team.settings")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  {t("team.workspaceName")}
                </label>
                <Input defaultValue={selectedWorkspace?.name || ""} className="h-10" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  {t("team.workspaceDescription")}
                </label>
                <Input defaultValue={selectedWorkspace?.description || ""} className="h-10" />
              </div>
              <Button className="bg-primary hover:bg-primary/90">
                {t("team.saveChanges")}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Invite Member Dialog */}
        <InviteMemberDialog
          open={showInviteDialog}
          onOpenChange={(open) => {
            setShowInviteDialog(open);
            if (!open) loadData(); // Reload data when dialog closes (in case of new invite)
          }}
          workspaceId={workspaceId || ""}
          onSuccess={loadData}
        />

        {/* Change Role Dialog */}
        {editingMember && (
          <ChangeRoleDialog
            open={!!editingMember}
            onOpenChange={(open) => {
              if (!open) setEditingMember(null);
            }}
            workspaceId={workspaceId || ""}
            memberId={editingMember.id}
            memberName={editingMember.user.full_name}
            currentRole={editingMember.workspaceRole.name}
            currentUserRole={selectedWorkspace?.user_role || "Viewer"}
            onSuccess={loadData}
          />
        )}

        {/* Manage Permissions Dialog */}
        {managingPermissionsMember && (
          <ManagePermissionsDialog
            open={!!managingPermissionsMember}
            onOpenChange={(open) => {
              if (!open) setManagingPermissionsMember(null);
            }}
            workspaceId={workspaceId || ""}
            memberId={managingPermissionsMember.id}
            memberName={managingPermissionsMember.user.full_name}
            memberRole={managingPermissionsMember.workspaceRole.name}
          />
        )}
      </div>
    </AppLayout>
  );
}
