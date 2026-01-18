"use client";

import type React from "react";
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { workspacesApi } from "@/lib/api/workspaces/workspaces-api";
import { toast } from "sonner";

interface ChangeRoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
  memberId: string;
  memberName: string;
  currentRole: string; // "Admin" | "Editor" | "Viewer"
  currentUserRole: string; // "Owner" | "Admin" | "Editor" | "Viewer"
  onSuccess?: () => void;
}

export function ChangeRoleDialog({
  open,
  onOpenChange,
  workspaceId,
  memberId,
  memberName,
  currentRole,
  currentUserRole,
  onSuccess,
}: ChangeRoleDialogProps) {
  const [selectedRole, setSelectedRole] = useState<string>(currentRole);
  const [isLoading, setIsLoading] = useState(false);

  // Reset selected role when dialog opens or currentRole changes
  useEffect(() => {
    if (open) {
      setSelectedRole(currentRole);
    }
  }, [open, currentRole]);

  // Backend roles
  const allRoles = [
    { id: "Admin", name: "Admin", description: "Tất cả trừ xóa workspace" },
    { id: "Editor", name: "Editor", description: "Quản lý chatbot & documents" },
    { id: "Viewer", name: "Viewer", description: "Chỉ xem" },
  ];

  // Filter roles: Only Owner can assign Admin role
  const roles = allRoles.filter(role => {
    if (role.name === "Admin" && currentUserRole !== "Owner") {
      return false;
    }
    return true;
  });

  const handleSave = async () => {
    if (!selectedRole) return;
    if (selectedRole === currentRole) {
      onOpenChange(false);
      return;
    }

    if (!workspaceId || !memberId) {
      toast.error("Missing required information");
      return;
    }

    setIsLoading(true);
    try {
      console.log("Updating member role...", {
        workspaceId,
        memberId,
        role: selectedRole,
      });
      await workspacesApi.updateMemberRole(workspaceId, memberId, selectedRole);
      toast.success("Cập nhật vai trò thành công");
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      console.error("Update role error:", error);
      if (error.response?.status === 403) {
        toast.error("Bạn không có quyền thay đổi vai trò");
      } else {
        toast.error(error.response?.data?.message || "Có lỗi xảy ra khi cập nhật vai trò");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Thay đổi vai trò</DialogTitle>
          <DialogDescription>
            Thay đổi quyền hạn của thành viên <strong>{memberName}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="role">Vai trò</Label>
            <Select
              value={selectedRole}
              onValueChange={setSelectedRole}
              disabled={isLoading}
            >
              <SelectTrigger id="role">
                <SelectValue placeholder="Chọn vai trò" />
              </SelectTrigger>
              <SelectContent>
                {roles.map((role) => (
                  <SelectItem key={role.id} value={role.id}>
                    {role.name}
                    {role.description && (
                      <span className="text-xs text-muted-foreground ml-2">
                        - {role.description}
                      </span>
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Hủy
          </Button>
          <Button type="button" onClick={handleSave} disabled={isLoading}>
            {isLoading ? "Đang lưu..." : "Lưu thay đổi"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
