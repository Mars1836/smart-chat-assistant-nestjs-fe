"use client";

import { AppLayout } from "@/components/app-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useWorkspace } from "@/lib/stores/workspace-store";
import { toast } from "sonner";
import { workspacesApi } from "@/lib/api/workspaces/workspaces-api";
import { useRouter } from "next/navigation";

export default function WorkspaceSettingsPage() {
  const { selectedWorkspace, loadWorkspaces, hasPermission, isLoading } = useWorkspace();
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (selectedWorkspace) {
      setFormData({
        name: selectedWorkspace.name,
        description: selectedWorkspace.description || "",
      });
    }
  }, [selectedWorkspace]);

  const handleUpdate = async () => {
    if (!selectedWorkspace) return;
    if (!formData.name.trim()) {
      toast.error("Workspace name is required");
      return;
    }

    setIsSaving(true);
    try {
      await workspacesApi.update(selectedWorkspace.id, {
        name: formData.name,
        description: formData.description,
      });
      toast.success("Workspace updated successfully");
      loadWorkspaces(); // Reload to update sidebar/header
    } catch (error: any) {
      console.error("Update error:", error);
      toast.error(error.response?.data?.message || "Failed to update workspace");
    } finally {
      setIsSaving(false);
    }
  };

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");

  const handleDeleteClick = () => {
    setShowDeleteDialog(true);
    setDeleteConfirmation("");
  };

  const handleConfirmDelete = async () => {
    if (!selectedWorkspace) return;
    
    if (deleteConfirmation !== "delete") {
      return;
    }

    setIsDeleting(true);
    try {
      await workspacesApi.delete(selectedWorkspace.id);
      toast.success("Workspace deleted successfully");
      await loadWorkspaces();
      router.push("/workspace");
    } catch (error: any) {
      console.error("Delete error:", error);
      toast.error(error.response?.data?.message || "Failed to delete workspace");
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  // Permission checks
  const canUpdate = hasPermission("workspace.settings") || selectedWorkspace?.is_owner;
  const canDelete = selectedWorkspace?.is_owner; // Typically only owner can delete

  if (isLoading) {
    return (
      <AppLayout activeModule="settings">
        <div className="flex justify-center p-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (!selectedWorkspace) {
    return (
      <AppLayout activeModule="settings">
        <div className="p-6 text-center text-muted-foreground">
          No workspace selected.
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout activeModule="settings">
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Workspace Settings</h1>
          <p className="text-muted-foreground mt-2">
            Manage your workspace configuration
          </p>
        </div>

        {/* General Settings */}
        <Card>
          <CardHeader>
            <CardTitle>General</CardTitle>
            <CardDescription>
              Update your workspace details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Workspace Name
              </label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                disabled={!canUpdate || isSaving}
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Description
              </label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                disabled={!canUpdate || isSaving}
                className="h-10"
              />
            </div>
            {canUpdate && (
              <Button 
                onClick={handleUpdate} 
                disabled={isSaving}
                className="bg-primary hover:bg-primary/90"
              >
                {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save Changes
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Danger Zone - Only for Owner */}
        {canDelete && (
          <Card className="border-destructive/20 bg-destructive/5">
            <CardHeader>
              <CardTitle className="text-destructive">Danger Zone</CardTitle>
              <CardDescription>
                Irreversible actions for this workspace
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">Delete Workspace</p>
                  <p className="text-sm text-muted-foreground">
                    Permanently remove this workspace and all its data.
                  </p>
                </div>
                <Button
                  variant="outline"
                  className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                  onClick={handleDeleteClick}
                >
                  Delete Workspace
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Delete Confirmation Dialog */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Are you absolutely sure?</DialogTitle>
              <DialogDescription>
                This action cannot be undone. This will permanently delete the workspace
                <strong> {selectedWorkspace.name}</strong> and remove all associated data.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Type <strong>delete</strong> to confirm:
                </label>
                <Input
                  value={deleteConfirmation}
                  onChange={(e) => setDeleteConfirmation(e.target.value)}
                  placeholder="delete"
                  className="h-10"
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowDeleteDialog(false)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleConfirmDelete}
                disabled={deleteConfirmation !== "delete" || isDeleting}
              >
                {isDeleting ? "Deleting..." : "Delete Workspace"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
