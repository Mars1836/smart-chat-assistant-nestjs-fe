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
import { toast } from "sonner";
import { useWorkspace } from "@/lib/stores/workspace-store";
import { workspacesApi, type WorkspaceMember } from "@/lib/api/workspaces/workspaces-api";
import {
  workspaceInvitationsApi,
  type WorkspaceInvitation,
} from "@/lib/api/workspace-invitations/workspace-invitations-api";

export default function TeamPage() {
  const { selectedWorkspace, hasPermission } = useWorkspace();
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [invitations, setInvitations] = useState<WorkspaceInvitation[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [showInviteDialog, setShowInviteDialog] = useState(false);
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
      toast.error("Failed to load team data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveMember = async (id: string, name: string) => {
    // TODO: Implement remove member API
    toast.error("Removing member is not implemented yet");
  };

  // Permission checks
  const canInviteMembers = hasPermission("member.invite");
  const canRemoveMembers = hasPermission("member.remove");
  const canUpdateRole = hasPermission("member.update_role");

  return (
    <AppLayout activeModule="team">
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-foreground">Team</h1>
          {canInviteMembers && (
            <Button
              onClick={() => setShowInviteDialog(true)}
              className="gap-2 bg-primary hover:bg-primary/90"
            >
              <Plus className="w-4 h-4" />
              Invite member
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
              <CardTitle>Active Members ({members.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {members.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No active members found.
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
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()}
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
                          Active
                        </Badge>
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
                            {canUpdateRole && (
                              <DropdownMenuItem>
                                <Shield className="w-4 h-4 mr-2" />
                                Change role
                              </DropdownMenuItem>
                            )}
                            {canRemoveMembers && (
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => handleRemoveMember(member.id, member.user.full_name)}
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Remove
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
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
              <CardTitle>Pending Invitations ({invitations.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {invitations.map((invitation) => (
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
                          Invited by {invitation.invitedByUser.full_name}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Badge className="bg-secondary/10 text-secondary">
                        {invitation.workspaceRole.name}
                      </Badge>
                      <Badge className="bg-yellow-100 text-yellow-800">
                        Pending
                      </Badge>
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
                          <DropdownMenuItem>
                            <Mail className="w-4 h-4 mr-2" />
                            Resend invite
                          </DropdownMenuItem>
                          {canRemoveMembers && (
                            <DropdownMenuItem className="text-destructive">
                              <Trash2 className="w-4 h-4 mr-2" />
                              Cancel invite
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Team Settings - Only for users with workspace.settings permission */}
        {hasPermission("workspace.settings") && (
          <Card>
            <CardHeader>
              <CardTitle>Team settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Workspace name
                </label>
                <Input defaultValue={selectedWorkspace?.name || ""} className="h-10" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Workspace description
                </label>
                <Input defaultValue={selectedWorkspace?.description || ""} className="h-10" />
              </div>
              <Button className="bg-primary hover:bg-primary/90">
                Save changes
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
        />
      </div>
    </AppLayout>
  );
}
