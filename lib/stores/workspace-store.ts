"use client";

import { create } from "zustand";
import { workspacesApi, type WorkspaceResponseDto } from "@/lib/api";

interface WorkspaceState {
  selectedWorkspace: WorkspaceResponseDto | null;
  isLoading: boolean;
  workspaces: WorkspaceResponseDto[];
  permissions: string[];
  isLoadingPermissions: boolean;
  selectWorkspace: (workspace: WorkspaceResponseDto) => void;
  clearWorkspace: () => void;
  loadWorkspaces: () => Promise<void>;
  loadPermissions: (workspaceId: string) => Promise<void>;
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  selectedWorkspace: null,
  isLoading: true,
  workspaces: [],
  permissions: [],
  isLoadingPermissions: false,

  loadWorkspaces: async () => {
    try {
      set({ isLoading: true });
      const response = await workspacesApi.list();
      set({ workspaces: response.data, isLoading: false });

      // Load selected workspace from localStorage
      if (typeof window !== "undefined") {
        const savedWorkspaceId = localStorage.getItem("selectedWorkspaceId");
        if (savedWorkspaceId) {
          const workspace = response.data.find(
            (w) => w.id === savedWorkspaceId
          );
          if (workspace) {
            set({ selectedWorkspace: workspace });
            // Automatically load permissions for selected workspace
            get().loadPermissions(workspace.id);
          } else {
            // If saved workspace not found in list, try to load it directly
            try {
              const savedWorkspace = await workspacesApi.get(savedWorkspaceId);
              set({ selectedWorkspace: savedWorkspace });
              get().loadPermissions(savedWorkspace.id);
            } catch (err) {
              console.error("Error loading saved workspace:", err);
              localStorage.removeItem("selectedWorkspaceId");
            }
          }
        }
      }
    } catch (err) {
      console.error("Error loading workspaces:", err);
      set({ isLoading: false });
    }
  },

  selectWorkspace: (workspace: WorkspaceResponseDto) => {
    set({ selectedWorkspace: workspace });
    if (typeof window !== "undefined") {
      localStorage.setItem("selectedWorkspaceId", workspace.id);
      // Load permissions for the selected workspace
      get().loadPermissions(workspace.id);
      // Redirect to chat after selecting workspace
      window.location.href = "/chat";
    }
  },

  clearWorkspace: () => {
    set({ selectedWorkspace: null, permissions: [] });
    if (typeof window !== "undefined") {
      localStorage.removeItem("selectedWorkspaceId");
    }
  },

  loadPermissions: async (workspaceId: string) => {
    try {
      set({ isLoadingPermissions: true });
      const permissions = await workspacesApi.getUserPermissions(workspaceId);
      set({ permissions, isLoadingPermissions: false });
      console.log("Loaded permissions for workspace:", workspaceId, permissions);
    } catch (err) {
      console.error("Error loading permissions:", err);
      set({ permissions: [], isLoadingPermissions: false });
    }
  },

  hasPermission: (permission: string) => {
    return get().permissions.includes(permission);
  },

  hasAnyPermission: (permissions: string[]) => {
    const userPermissions = get().permissions;
    return permissions.some((p) => userPermissions.includes(p));
  },

  hasAllPermissions: (permissions: string[]) => {
    const userPermissions = get().permissions;
    return permissions.every((p) => userPermissions.includes(p));
  },
}));

// Hook tương thích với useWorkspace cũ
export function useWorkspace() {
  return useWorkspaceStore();
}
