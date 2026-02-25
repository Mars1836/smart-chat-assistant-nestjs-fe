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
import { useState, useEffect, useRef } from "react";
import { useWorkspace } from "@/lib/stores/workspace-store";
import { toast } from "sonner";
import {
  workspacesApi,
  type WorkspaceWallet,
  type WorkspaceVietQRTopup,
} from "@/lib/api";
import { API_BASE_URL } from "@/lib/constants";
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

  // Billing / Wallet state
  const [wallet, setWallet] = useState<WorkspaceWallet | null>(null);
  const [walletLoading, setWalletLoading] = useState(false);
  const [vietQRLoading, setVietQRLoading] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(100000);
  const [customAmount, setCustomAmount] = useState("");
  const [vietQRData, setVietQRData] = useState<WorkspaceVietQRTopup | null>(null);
  const [lastWalletBalance, setLastWalletBalance] = useState<number | null>(null);
  const [topupSuccess, setTopupSuccess] = useState(false);
  const topupSessionRef = useRef(false);
  const lastToastBalanceRef = useRef<number | null>(null);

  useEffect(() => {
    if (selectedWorkspace) {
      setFormData({
        name: selectedWorkspace.name,
        description: selectedWorkspace.description || "",
      });
    }
  }, [selectedWorkspace]);

  // Load wallet info for this workspace
  useEffect(() => {
    const fetchWallet = async () => {
      if (!selectedWorkspace) {
        setWallet(null);
        setLastWalletBalance(null);
        return;
      }
      try {
        setWalletLoading(true);
        const data = await workspacesApi.getWallet(selectedWorkspace.id);
        setWallet(data);
        setLastWalletBalance(data.balance);
      } catch (error) {
        setWallet(null);
        setLastWalletBalance(null);
      } finally {
        setWalletLoading(false);
      }
    };

    fetchWallet();
  }, [selectedWorkspace]);

  // Subscribe to wallet SSE stream while on settings page (billing/topup)
  useEffect(() => {
    if (!selectedWorkspace) {
      return;
    }

    const url = `${API_BASE_URL}/workspaces/${selectedWorkspace.id}/billing/wallet/stream`;
    const es = new EventSource(url);

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as WorkspaceWallet;
        setWallet(data);

        // Detect topup success: balance tăng lên so với trước
        setLastWalletBalance((prev) => {
          if (prev !== null && data.balance > prev) {
            // Chỉ thông báo khi đang trong phiên topup (vừa tạo QR)
            // và chưa thông báo cho balance này trước đó
            if (topupSessionRef.current && lastToastBalanceRef.current !== data.balance) {
              setTopupSuccess(true);
              lastToastBalanceRef.current = data.balance;
              topupSessionRef.current = false;

              toast.success("Nạp tiền thành công", {
                description: `Số dư mới: ${data.balance.toLocaleString(
                  "vi-VN"
                )} CREDITS`,
              });
            }
          }
          return data.balance;
        });
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("Wallet SSE parse error:", err);
      }
    };

    es.onerror = (err) => {
      // eslint-disable-next-line no-console
      console.error("Wallet SSE error:", err);
      es.close();
    };

    return () => {
      es.close();
    };
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

  const presetAmounts = [50000, 100000, 200000];

  const resolveAmount = (): number | null => {
    if (customAmount.trim()) {
      const value = parseInt(customAmount.trim(), 10);
      if (Number.isNaN(value) || value <= 0) {
        return null;
      }
      return value;
    }
    return selectedAmount;
  };

  const handleCreateVietQR = async () => {
    if (!selectedWorkspace) return;

    const amount = resolveAmount();
    if (!amount || amount <= 0) {
      toast.error("Vui lòng nhập số tiền hợp lệ (VND)");
      return;
    }

    try {
      setVietQRLoading(true);
      setTopupSuccess(false);
      topupSessionRef.current = true;
      lastToastBalanceRef.current = null;
      const data = await workspacesApi.createVietQRTopup(
        selectedWorkspace.id,
        amount
      );
      setVietQRData(data);
      toast.success("Đã tạo QR nạp tiền");
    } catch (error: any) {
      console.error("Create VietQR error:", error);
      toast.error(
        error?.response?.data?.message || "Không tạo được QR nạp tiền"
      );
    } finally {
      setVietQRLoading(false);
    }
  };

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

        {/* Billing / Credits */}
        <Card>
          <CardHeader>
            <CardTitle>Billing & Credits</CardTitle>
            <CardDescription>
              Nạp credit cho workspace này qua VietQR
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1 text-sm">
              <p className="font-medium text-foreground">
                Số dư hiện tại
              </p>
              <p className="text-muted-foreground">
                {walletLoading
                  ? "Đang tải..."
                  : wallet
                  ? `${new Intl.NumberFormat("vi-VN", {
                      style: "currency",
                      currency: "VND",
                      minimumFractionDigits: 0,
                    }).format(wallet.balance)} CREDITS`
                  : "Không có dữ liệu ví"}
              </p>
              {wallet && (
                <p className="text-xs mt-1">
                  Trạng thái ví:{" "}
                  <span
                    className={
                      wallet.status === "active"
                        ? "text-green-600 dark:text-green-400"
                        : "text-destructive"
                    }
                  >
                    {wallet.status}
                  </span>
                </p>
              )}
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">
                Chọn số tiền nạp (VND)
              </p>
              <div className="flex flex-wrap gap-2">
                {presetAmounts.map((amt) => (
                  <Button
                    key={amt}
                    type="button"
                    variant={selectedAmount === amt && !customAmount ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setSelectedAmount(amt);
                      setCustomAmount("");
                    }}
                  >
                    {amt.toLocaleString("vi-VN")} đ
                  </Button>
                ))}
              </div>
              <div className="space-y-1">
                <label className="text-sm text-foreground">
                  Hoặc nhập số tiền khác
                </label>
                <Input
                  type="number"
                  min={10000}
                  step={1000}
                  value={customAmount}
                  onChange={(e) => {
                    setCustomAmount(e.target.value);
                    if (e.target.value) {
                      setSelectedAmount(null);
                    }
                  }}
                  className="h-9 max-w-xs"
                  placeholder="Ví dụ: 150000"
                />
                <p className="text-xs text-muted-foreground">
                  Đơn vị VND. Khuyến nghị &gt;= 50.000đ.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                type="button"
                onClick={handleCreateVietQR}
                disabled={vietQRLoading}
                className="bg-primary hover:bg-primary/90"
              >
                {vietQRLoading && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                Tạo QR nạp tiền
              </Button>
              {topupSuccess && (
                <span className="text-xs text-green-600 dark:text-green-400">
                  Đã nhận thanh toán, số dư đã được cập nhật.
                </span>
              )}
            </div>

            {vietQRData && (
              <div className="mt-4 grid gap-4 md:grid-cols-[auto,1fr] items-start">
                <div className="border rounded-lg p-3 bg-muted flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={vietQRData.qr_image_url}
                    alt="QR nạp tiền"
                    className="w-40 h-40 object-contain"
                  />
                </div>
                <div className="space-y-2 text-sm">
                  <p>
                    <span className="font-medium">Số tiền:</span>{" "}
                    {vietQRData.amount.toLocaleString("vi-VN")}{" "}
                    {vietQRData.currency}
                  </p>
                  <p>
                    <span className="font-medium">Ngân hàng:</span>{" "}
                    {vietQRData.bank.bank_id} - {vietQRData.bank.account_no}{" "}
                    {vietQRData.bank.account_name
                      ? `(${vietQRData.bank.account_name})`
                      : ""}
                  </p>
                  <p>
                    <span className="font-medium">
                      Nội dung chuyển khoản / mã tham chiếu:
                    </span>{" "}
                    <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">
                      {vietQRData.reference}
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Vui lòng giữ nguyên mã tham chiếu{" "}
                    <span className="font-mono">{vietQRData.reference}</span>{" "}
                    để hệ thống có thể đối soát giao dịch chính xác.
                  </p>
                </div>
              </div>
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
