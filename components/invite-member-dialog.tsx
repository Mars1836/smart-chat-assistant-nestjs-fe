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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { workspacesApi, type WorkspaceRole } from "@/lib/api/workspaces/workspaces-api";
import { toast } from "sonner";

interface InviteMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
}

export function InviteMemberDialog({
  open,
  onOpenChange,
  workspaceId,
}: InviteMemberDialogProps) {
  const [email, setEmail] = useState("");
  const [selectedRoleId, setSelectedRoleId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  // Backend roles based on API documentation
  const roles = [
    { id: "Admin", name: "Admin", description: "Tất cả trừ xóa workspace" },
    { id: "Editor", name: "Editor", description: "Quản lý chatbot & documents" },
    { id: "Viewer", name: "Viewer", description: "Chỉ xem" }
  ];

  const handleInvite = async () => {
    if (!email || !selectedRoleId) {
      toast.error("Vui lòng điền đầy đủ thông tin");
      return;
    }

    if (!workspaceId) {
      toast.error("Workspace ID is missing");
      return;
    }

    setIsLoading(true);
    try {
      console.log("Sending invite request...", {
        email,
        role_name: selectedRoleId,
      });
      await workspacesApi.inviteMember(workspaceId, {
        email,
        role_name: selectedRoleId,
      });
      toast.success("Đã gửi lời mời thành công");
      onOpenChange(false);
      setEmail("");
      setSelectedRoleId("");
    } catch (error: any) {
      console.error("Invite error:", error);
      if (error.response?.status === 409) {
        toast.error("Người dùng đã là thành viên của workspace");
      } else if (error.response?.status === 403) {
        toast.error("Bạn không có quyền mời thành viên");
      } else {
        toast.error("Có lỗi xảy ra khi gửi lời mời");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Mời Thành Viên</DialogTitle>
          <DialogDescription>
            Gửi lời mời tham gia workspace qua email
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="example@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="role">Vai trò</Label>
            <Select
              value={selectedRoleId}
              onValueChange={setSelectedRoleId}
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
          <Button type="button" onClick={handleInvite} disabled={isLoading}>
            {isLoading ? "Đang gửi..." : "Gửi lời mời"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
