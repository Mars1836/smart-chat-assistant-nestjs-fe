"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/stores/auth-store";
import {
  usersApi,
  systemRolesApi,
  type UserProfileDto,
  type CreateUserDto,
  type UpdateUserDto,
  type SystemRole,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2, ChevronLeft, Plus, Pencil, Trash2, BarChart3 } from "lucide-react";
import { toast } from "sonner";

export default function AdminUsersPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, isSystemAdmin, user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserProfileDto[]>([]);
  const [meta, setMeta] = useState<{ total: number; page: number; limit: number; totalPages: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [systemRoles, setSystemRoles] = useState<SystemRole[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [targetUser, setTargetUser] = useState<UserProfileDto | null>(null);
  const [saving, setSaving] = useState(false);
  const [createForm, setCreateForm] = useState<CreateUserDto>({
    name: "",
    email: "",
    password: "",
    language: "vi",
  });
  const [editForm, setEditForm] = useState<UpdateUserDto>({ name: "", email: "", language: "vi" });

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      router.replace("/auth/login?redirect=/admin/users");
      return;
    }
    if (!isSystemAdmin) {
      router.replace("/");
      return;
    }
  }, [isAuthenticated, authLoading, isSystemAdmin, router]);

  useEffect(() => {
    if (!isSystemAdmin) return;
    loadUsers();
  }, [isSystemAdmin, page, limit]);

  useEffect(() => {
    if (!isSystemAdmin) return;
    systemRolesApi
      .list()
      .then((res) => {
        const list: SystemRole[] = Array.isArray(res)
          ? res
          : (res && typeof res === "object" && "data" in res && Array.isArray((res as { data: SystemRole[] }).data)
            ? (res as { data: SystemRole[] }).data
            : []);
        setSystemRoles(list);
      })
      .catch(() => setSystemRoles([]));
  }, [isSystemAdmin]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const res = await usersApi.list({ page, limit, sortBy: "created_at", sortOrder: "DESC" });
      setUsers(res.data);
      setMeta(res.meta);
    } catch (err: unknown) {
      const e = err as { response?: { status?: number } };
      if (e?.response?.status === 403) {
        toast.error("Bạn không có quyền xem danh sách user");
        router.replace("/admin");
      } else {
        toast.error("Không tải được danh sách user");
      }
      setUsers([]);
      setMeta(null);
    } finally {
      setLoading(false);
    }
  };

  const roleName = (systemRoleId: string | null) => {
    if (!systemRoleId) return "—";
    if (!Array.isArray(systemRoles)) return systemRoleId;
    const r = systemRoles.find((x) => x.id === systemRoleId);
    return r?.name ?? systemRoleId;
  };

  const handleCreate = async () => {
    if (!createForm.name?.trim() || !createForm.email?.trim()) {
      toast.error("Nhập tên và email");
      return;
    }
    if (!createForm.password?.trim()) {
      toast.error("Nhập mật khẩu cho user mới");
      return;
    }
    try {
      setSaving(true);
      await usersApi.create(createForm);
      toast.success("Đã tạo user");
      setCreateOpen(false);
      setCreateForm({ name: "", email: "", password: "", language: "vi" });
      loadUsers();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string }; status?: number } };
      const msg = e?.response?.data?.message ?? "Không tạo được user";
      if (e?.response?.status === 409) toast.error("Email đã tồn tại");
      else toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (u: UserProfileDto) => {
    setTargetUser(u);
    setEditForm({
      name: u.name,
      email: u.email,
      language: u.language || "vi",
      system_role_id: u.system_role_id ?? undefined,
    });
    setEditOpen(true);
  };

  const handleUpdate = async () => {
    if (!targetUser) return;
    try {
      setSaving(true);
      await usersApi.update(targetUser.id, editForm);
      toast.success("Đã cập nhật user");
      setEditOpen(false);
      setTargetUser(null);
      loadUsers();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string }; status?: number } };
      const msg = e?.response?.data?.message ?? "Không cập nhật được";
      if (e?.response?.status === 409) toast.error("Email đã được user khác dùng");
      else toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const openDelete = (u: UserProfileDto) => {
    setTargetUser(u);
    setDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (!targetUser) return;
    if (currentUser?.id === targetUser.id) {
      toast.error("Không thể xóa chính mình");
      return;
    }
    try {
      setSaving(true);
      await usersApi.delete(targetUser.id);
      toast.success("Đã xóa user");
      setDeleteOpen(false);
      setTargetUser(null);
      loadUsers();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string }; status?: number } };
      if (e?.response?.status === 403) toast.error("Không thể xóa chính mình hoặc không đủ quyền");
      else toast.error(e?.response?.data?.message ?? "Không xóa được user");
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || !isAuthenticated || !isSystemAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/admin">
                <ChevronLeft className="w-5 h-5" />
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Quản lý User</h1>
              <p className="text-muted-foreground text-sm">Danh sách user hệ thống (chỉ admin)</p>
            </div>
          </div>
          <Button variant="outline" asChild>
            <Link href="/admin/users/stats" className="gap-2">
              <BarChart3 className="w-4 h-4" />
              Thống kê
            </Link>
          </Button>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Danh sách user</CardTitle>
              <CardDescription>Phân trang, sửa / xóa (admin)</CardDescription>
            </div>
            <Button onClick={() => setCreateOpen(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Tạo user
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tên</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Ngôn ngữ</TableHead>
                      <TableHead>Vai trò</TableHead>
                      <TableHead>Ngày tạo</TableHead>
                      <TableHead className="w-[120px]">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                          Chưa có user nào
                        </TableCell>
                      </TableRow>
                    ) : (
                      users.map((u) => (
                        <TableRow key={u.id}>
                          <TableCell className="font-medium">{u.name}</TableCell>
                          <TableCell>{u.email}</TableCell>
                          <TableCell>{u.language || "—"}</TableCell>
                          <TableCell>{roleName(u.system_role_id)}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {new Date(u.created_at).toLocaleDateString("vi-VN")}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button variant="ghost" size="sm" onClick={() => openEdit(u)}>
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:text-destructive"
                                onClick={() => openDelete(u)}
                                disabled={currentUser?.id === u.id}
                                title={currentUser?.id === u.id ? "Không xóa chính mình" : "Xóa"}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
                {meta && meta.totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <p className="text-sm text-muted-foreground">
                      Trang {meta.page} / {meta.totalPages} (tổng {meta.total} user)
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={page <= 1}
                        onClick={() => setPage((p) => p - 1)}
                      >
                        Trước
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={page >= meta.totalPages}
                        onClick={() => setPage((p) => p + 1)}
                      >
                        Sau
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create user dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tạo user mới</DialogTitle>
            <DialogDescription>Chỉ admin. Nhập tên, email và mật khẩu.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Tên</Label>
              <Input
                value={createForm.name}
                onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Nguyễn Văn A"
              />
            </div>
            <div className="grid gap-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={createForm.email}
                onChange={(e) => setCreateForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="user@example.com"
              />
            </div>
            <div className="grid gap-2">
              <Label>Mật khẩu (tối thiểu 6 ký tự)</Label>
              <Input
                type="password"
                value={createForm.password ?? ""}
                onChange={(e) => setCreateForm((f) => ({ ...f, password: e.target.value }))}
                placeholder="********"
              />
            </div>
            <div className="grid gap-2">
              <Label>Ngôn ngữ</Label>
              <Select
                value={createForm.language ?? "vi"}
                onValueChange={(v) => setCreateForm((f) => ({ ...f, language: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vi">Tiếng Việt</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {systemRoles.length > 0 && (
              <div className="grid gap-2">
                <Label>Vai trò hệ thống</Label>
                <Select
                  value={createForm.system_role_id ?? ""}
                  onValueChange={(v) => setCreateForm((f) => ({ ...f, system_role_id: v || undefined }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Không chọn" />
                  </SelectTrigger>
                  <SelectContent>
                    {systemRoles.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)} disabled={saving}>
              Hủy
            </Button>
            <Button onClick={handleCreate} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Tạo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit user dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chỉnh sửa user</DialogTitle>
            <DialogDescription>Cập nhật thông tin. Admin có thể đổi vai trò.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Tên</Label>
              <Input
                value={editForm.name ?? ""}
                onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Tên hiển thị"
              />
            </div>
            <div className="grid gap-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={editForm.email ?? ""}
                onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="email@example.com"
              />
            </div>
            <div className="grid gap-2">
              <Label>Mật khẩu mới (để trống nếu không đổi)</Label>
              <Input
                type="password"
                placeholder="********"
                onChange={(e) => setEditForm((f) => ({ ...f, password: e.target.value || undefined }))}
              />
            </div>
            <div className="grid gap-2">
              <Label>Ngôn ngữ</Label>
              <Select
                value={editForm.language ?? "vi"}
                onValueChange={(v) => setEditForm((f) => ({ ...f, language: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vi">Tiếng Việt</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {systemRoles.length > 0 && (
              <div className="grid gap-2">
                <Label>Vai trò hệ thống</Label>
                <Select
                  value={editForm.system_role_id ?? ""}
                  onValueChange={(v) =>
                    setEditForm((f) => ({ ...f, system_role_id: v || null }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Không chọn" />
                  </SelectTrigger>
                  <SelectContent>
                    {systemRoles.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)} disabled={saving}>
              Hủy
            </Button>
            <Button onClick={handleUpdate} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Lưu"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa user?</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc muốn xóa user &quot;{targetUser?.name}&quot; ({targetUser?.email})? Không thể xóa chính mình.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={saving || currentUser?.id === targetUser?.id}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Xóa"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
