"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { InviteMemberDialog } from "@/components/invite-member-dialog";
import { UserPlus, Mail } from "lucide-react";

export default function WorkspaceMembersPage() {
  const params = useParams();
  const workspaceId = params?.id as string;
  const [showInviteDialog, setShowInviteDialog] = useState(false);

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Workspace Members
            </h1>
            <p className="text-muted-foreground">
              Manage members and invite new people to your workspace
            </p>
          </div>
          <Button
            onClick={() => setShowInviteDialog(true)}
            className="bg-primary hover:bg-primary/90"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Invite Member
          </Button>
        </div>

        <div className="grid gap-6">
          {/* Current Members Section */}
          <Card>
            <CardHeader>
              <CardTitle>Current Members</CardTitle>
              <CardDescription>
                People who have access to this workspace
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                Member list will be displayed here...
              </div>
            </CardContent>
          </Card>

          {/* Pending Invitations Section */}
          <Card>
            <CardHeader>
              <CardTitle>Pending Invitations</CardTitle>
              <CardDescription>
                Invitations that haven't been accepted yet
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center py-8 text-center">
                <div>
                  <Mail className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">
                    No pending invitations
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Invite Member Dialog */}
        <InviteMemberDialog
          open={showInviteDialog}
          onOpenChange={setShowInviteDialog}
          workspaceId={workspaceId}
        />
      </div>
    </div>
  );
}
