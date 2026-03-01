"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/stores/auth-store";
import {
  llmModelsApi,
  type LlmModel,
  type CreateLlmModelDto,
  type UpdateLlmModelDto,
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2, ChevronLeft, Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

const defaultCreateForm: CreateLlmModelDto = {
  provider: "",
  model: "",
  price_per_1k_input_tokens: 0,
  price_per_1k_output_tokens: 0,
  display_name: "",
};

export default function AdminLlmModelsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, isSystemAdmin } = useAuth();
  const [models, setModels] = useState<LlmModel[]>([]);
  const [meta, setMeta] = useState<{
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [targetModel, setTargetModel] = useState<LlmModel | null>(null);
  const [saving, setSaving] = useState(false);
  const [createForm, setCreateForm] = useState<CreateLlmModelDto>(defaultCreateForm);
  const [editForm, setEditForm] = useState<UpdateLlmModelDto>({
    price_per_1k_input_tokens: undefined,
    price_per_1k_output_tokens: undefined,
    display_name: undefined,
  });

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      router.replace("/auth/login?redirect=/admin/llm-models");
      return;
    }
    if (!isSystemAdmin) {
      router.replace("/");
      return;
    }
  }, [isAuthenticated, authLoading, isSystemAdmin, router]);

  useEffect(() => {
    if (!isSystemAdmin) return;
    loadModels();
  }, [isSystemAdmin, page, limit]);

  const loadModels = () => {
    setLoading(true);
    llmModelsApi
      .list({ page, limit, sortBy: "created_at", sortOrder: "ASC" })
      .then((res) => {
        setModels(Array.isArray(res?.data) ? res.data : []);
        setMeta(res?.meta ?? null);
      })
      .catch(() => {
        setModels([]);
        setMeta(null);
      })
      .finally(() => setLoading(false));
  };

  const openEdit = (m: LlmModel) => {
    setTargetModel(m);
    setEditForm({
      price_per_1k_input_tokens: parseFloat(m.price_per_1k_input_tokens) || 0,
      price_per_1k_output_tokens: parseFloat(m.price_per_1k_output_tokens) || 0,
      display_name: m.display_name ?? undefined,
    });
    setEditOpen(true);
  };

  const openDelete = (m: LlmModel) => {
    setTargetModel(m);
    setDeleteOpen(true);
  };

  const handleCreate = async () => {
    if (
      !createForm.provider?.trim() ||
      !createForm.model?.trim() ||
      createForm.price_per_1k_input_tokens == null ||
      createForm.price_per_1k_output_tokens == null
    ) {
      toast.error("Vui lòng nhập đủ provider, model và hai giá");
      return;
    }
    setSaving(true);
    try {
      await llmModelsApi.create({
        ...createForm,
        provider: createForm.provider.trim(),
        model: createForm.model.trim(),
        price_per_1k_input_tokens: Number(createForm.price_per_1k_input_tokens),
        price_per_1k_output_tokens: Number(createForm.price_per_1k_output_tokens),
        display_name: createForm.display_name?.trim() || undefined,
      });
      toast.success("Đã thêm model");
      setCreateOpen(false);
      setCreateForm(defaultCreateForm);
      loadModels();
    } catch (e: unknown) {
      const err = e as { response?: { status?: number; data?: { message?: string } } };
      if (err?.response?.status === 409) {
        toast.error("Cặp provider + model đã tồn tại");
      } else {
        toast.error(err?.response?.data?.message || "Không thể tạo model");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!targetModel) return;
    setSaving(true);
    try {
      await llmModelsApi.update(targetModel.id, {
        price_per_1k_input_tokens:
          editForm.price_per_1k_input_tokens != null
            ? Number(editForm.price_per_1k_input_tokens)
            : undefined,
        price_per_1k_output_tokens:
          editForm.price_per_1k_output_tokens != null
            ? Number(editForm.price_per_1k_output_tokens)
            : undefined,
        display_name: editForm.display_name ?? undefined,
      });
      toast.success("Đã cập nhật");
      setEditOpen(false);
      setTargetModel(null);
      loadModels();
    } catch (e: unknown) {
      toast.error("Không thể cập nhật");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!targetModel) return;
    setSaving(true);
    try {
      await llmModelsApi.delete(targetModel.id);
      toast.success("Đã xóa model");
      setDeleteOpen(false);
      setTargetModel(null);
      loadModels();
    } catch {
      toast.error("Không thể xóa");
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
              <h1 className="text-2xl font-bold text-foreground">
                Models & Giá token
              </h1>
              <p className="text-muted-foreground text-sm">
                Quản lý model LLM và giá input/output per 1K tokens (chỉ admin)
              </p>
            </div>
          </div>
          <Button onClick={() => setCreateOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Thêm model
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Danh sách model</CardTitle>
            <CardDescription>
              Sửa giá, tên hiển thị hoặc xóa
            </CardDescription>
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
                      <TableHead>Model</TableHead>
                      <TableHead>Provider</TableHead>
                      <TableHead className="text-right">Giá input/1K</TableHead>
                      <TableHead className="text-right">Giá output/1K</TableHead>
                      <TableHead className="w-[120px]">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {models.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="text-center text-muted-foreground py-8"
                        >
                          Chưa có model nào
                        </TableCell>
                      </TableRow>
                    ) : (
                      models.map((m) => (
                        <TableRow key={m.id}>
                          <TableCell className="font-medium">
                            {m.display_name || m.model}
                          </TableCell>
                          <TableCell>{m.provider}</TableCell>
                          <TableCell className="text-right font-mono text-sm">
                            {m.price_per_1k_input_tokens}
                          </TableCell>
                          <TableCell className="text-right font-mono text-sm">
                            {m.price_per_1k_output_tokens}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEdit(m)}
                              >
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:text-destructive"
                                onClick={() => openDelete(m)}
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
                      Trang {meta.page} / {meta.totalPages} (tổng {meta.total})
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

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Thêm model</DialogTitle>
            <DialogDescription>
              Nhập provider, model và giá per 1K tokens (credits)
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Provider</Label>
              <Input
                value={createForm.provider}
                onChange={(e) =>
                  setCreateForm((f) => ({ ...f, provider: e.target.value }))
                }
                placeholder="vd: gemini, openai"
              />
            </div>
            <div className="grid gap-2">
              <Label>Model</Label>
              <Input
                value={createForm.model}
                onChange={(e) =>
                  setCreateForm((f) => ({ ...f, model: e.target.value }))
                }
                placeholder="vd: gemini-2.0-flash-lite"
              />
            </div>
            <div className="grid gap-2">
              <Label>Tên hiển thị (tùy chọn)</Label>
              <Input
                value={createForm.display_name ?? ""}
                onChange={(e) =>
                  setCreateForm((f) => ({ ...f, display_name: e.target.value }))
                }
                placeholder="vd: Gemini 2.0 Flash Lite"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Giá input / 1K tokens</Label>
                <Input
                  type="number"
                  min={0}
                  step="any"
                  value={createForm.price_per_1k_input_tokens ?? ""}
                  onChange={(e) =>
                    setCreateForm((f) => ({
                      ...f,
                      price_per_1k_input_tokens: e.target.value === "" ? 0 : parseFloat(e.target.value),
                    }))
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label>Giá output / 1K tokens</Label>
                <Input
                  type="number"
                  min={0}
                  step="any"
                  value={createForm.price_per_1k_output_tokens ?? ""}
                  onChange={(e) =>
                    setCreateForm((f) => ({
                      ...f,
                      price_per_1k_output_tokens: e.target.value === "" ? 0 : parseFloat(e.target.value),
                    }))
                  }
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleCreate} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Thêm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sửa giá / tên hiển thị</DialogTitle>
            <DialogDescription>
              {targetModel && `${targetModel.provider} / ${targetModel.model}`}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Tên hiển thị (tùy chọn)</Label>
              <Input
                value={editForm.display_name ?? ""}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, display_name: e.target.value || undefined }))
                }
                placeholder="Để trống hoặc null"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Giá input / 1K tokens</Label>
                <Input
                  type="number"
                  min={0}
                  step="any"
                  value={editForm.price_per_1k_input_tokens ?? ""}
                  onChange={(e) =>
                    setEditForm((f) => ({
                      ...f,
                      price_per_1k_input_tokens:
                        e.target.value === "" ? undefined : parseFloat(e.target.value),
                    }))
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label>Giá output / 1K tokens</Label>
                <Input
                  type="number"
                  min={0}
                  step="any"
                  value={editForm.price_per_1k_output_tokens ?? ""}
                  onChange={(e) =>
                    setEditForm((f) => ({
                      ...f,
                      price_per_1k_output_tokens:
                        e.target.value === "" ? undefined : parseFloat(e.target.value),
                    }))
                  }
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
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
            <AlertDialogTitle>Xóa model?</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc muốn xóa{" "}
              {targetModel ? targetModel.display_name || targetModel.model : ""}? Hành động không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={saving}
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
