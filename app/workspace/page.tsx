"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, Loader2, Check } from "lucide-react";
import { useWorkspace } from "@/lib/stores/workspace-store";

export default function WorkspaceSelectionPage() {
  const {
    selectedWorkspace,
    isLoading,
    selectWorkspace,
    workspaces,
    loadWorkspaces,
  } = useWorkspace();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  // Remove auto redirect - let user choose workspace
  // useEffect(() => {
  //   if (!isLoading && selectedWorkspace) {
  //     router.push("/chat");
  //   }
  // }, [selectedWorkspace, isLoading, router]);

  useEffect(() => {
    loadWorkspaces();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreateWorkspace = async () => {
    if (!newWorkspaceName.trim()) return;

    try {
      setCreating(true);
      setError("");
      const workspacesApi = (await import("@/lib/api")).workspacesApi;
      const newWorkspace = await workspacesApi.create({
        name: newWorkspaceName,
        description: "New workspace",
        is_personal: true,
      });
      selectWorkspace(newWorkspace);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to create workspace");
      console.error("Error creating workspace:", err);
    } finally {
      setCreating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Select Workspace
          </h1>
          <p className="text-muted-foreground">
            Choose a workspace to get started or create a new one
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}

        {selectedWorkspace && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-md text-sm">
            Current workspace: <strong>{selectedWorkspace.name}</strong>
          </div>
        )}

        {showCreateForm && (
          <Card className="mb-6 border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle>Create new workspace</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="Workspace name"
                value={newWorkspaceName}
                onChange={(e) => setNewWorkspaceName(e.target.value)}
                className="h-10"
              />
              <div className="flex gap-2">
                <Button
                  onClick={handleCreateWorkspace}
                  className="bg-primary hover:bg-primary/90"
                  disabled={creating}
                >
                  {creating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create"
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCreateForm(false);
                    setNewWorkspaceName("");
                  }}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {!showCreateForm && (
            <Card
              className="border-2 border-dashed border-border hover:border-primary/50 cursor-pointer transition-colors"
              onClick={() => setShowCreateForm(true)}
            >
              <CardContent className="flex items-center justify-center h-40">
                <div className="text-center">
                  <Plus className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm font-medium text-muted-foreground">
                    Create workspace
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {workspaces.map((workspace) => (
            <Card
              key={workspace.id}
              className="hover:shadow-lg transition-shadow cursor-pointer hover:border-primary/50 relative"
              onClick={() => selectWorkspace(workspace)}
            >
              <CardHeader>
                <CardTitle className="text-lg">{workspace.name}</CardTitle>
                <CardDescription>{workspace.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {workspace.is_personal ? "Personal" : "Team workspace"}
                </p>
              </CardContent>
              {selectedWorkspace?.id === workspace.id && (
                <div className="absolute top-4 right-4">
                  <div className="bg-primary text-primary-foreground rounded-full p-1">
                    <Check className="w-4 h-4" />
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
