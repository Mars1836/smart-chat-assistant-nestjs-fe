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
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useWorkspace } from "@/lib/stores/workspace-store";
import { toast } from "sonner";
import {
  workspacesApi,
  tokenStorage,
  type WorkspaceWallet,
  type WorkspaceVietQRTopup,
} from "@/lib/api";
import { API_BASE_URL } from "@/lib/constants";
import { useRouter } from "next/navigation";
import {
  translateTemplate,
  useLanguage,
} from "@/components/providers/language-provider";

export default function WorkspaceSettingsPage() {
  const { selectedWorkspace, loadWorkspaces, hasPermission, isLoading } = useWorkspace();
  const router = useRouter();
  const { t, locale } = useLanguage();
  
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

  // Subscribe to wallet SSE — EventSource không gửi Authorization; backend nhận JWT qua ?access_token=
  useEffect(() => {
    if (!selectedWorkspace) {
      return;
    }

    const accessToken = tokenStorage.getAccessToken();
    if (!accessToken) {
      return;
    }

    const base = `${API_BASE_URL}/workspaces/${selectedWorkspace.id}/billing/wallet/stream`;
    const url = `${base}?access_token=${encodeURIComponent(accessToken)}`;
    const es = new EventSource(url);

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as WorkspaceWallet;
        setWallet(data);

        setLastWalletBalance((prev) => {
          if (prev !== null && data.balance > prev) {
            if (
              topupSessionRef.current &&
              lastToastBalanceRef.current !== data.balance
            ) {
              setTopupSuccess(true);
              lastToastBalanceRef.current = data.balance;
              topupSessionRef.current = false;

              toast.success(t("settings.paymentReceived"), {
                description: translateTemplate(
                  t("settings.topupSuccessDescription"),
                  {
                    balance: data.balance.toLocaleString(
                      locale === "vi" ? "vi-VN" : "en-US"
                    ),
                  }
                ),
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
  }, [selectedWorkspace, t, locale]);

  const handleUpdate = async () => {
    if (!selectedWorkspace) return;
    if (!formData.name.trim()) {
      toast.error(t("settings.workspaceNameRequired"));
      return;
    }

    setIsSaving(true);
    try {
      await workspacesApi.update(selectedWorkspace.id, {
        name: formData.name,
        description: formData.description,
      });
      toast.success(t("settings.workspaceUpdated"));
      loadWorkspaces(); // Reload to update sidebar/header
    } catch (error: any) {
      console.error("Update error:", error);
      toast.error(error.response?.data?.message || t("settings.workspaceUpdateFailed"));
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
      toast.success(t("settings.deleteSuccess"));
      await loadWorkspaces();
      router.push("/workspace");
    } catch (error: any) {
      console.error("Delete error:", error);
      toast.error(error.response?.data?.message || t("settings.deleteFailed"));
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  // Permission checks
  const canViewSettings = hasPermission("workspace.view_settings");
  const canUpdate = hasPermission("workspace.update");
  const canDelete = hasPermission("workspace.delete");
  const canViewBilling = hasPermission("billing.view_transactions");

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
      toast.error(t("settings.invalidAmount"));
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
      toast.success(t("settings.createQrSuccess"));
    } catch (error: any) {
      console.error("Create VietQR error:", error);
      toast.error(
        error?.response?.data?.message || t("settings.createQrFailed")
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
          {t("settings.noWorkspace")}
        </div>
      </AppLayout>
    );
  }

  if (!canViewSettings) {
    return (
      <AppLayout activeModule="settings">
        <div className="p-6 text-center text-muted-foreground">
          {t("billing.forbidden")}
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout activeModule="settings">
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t("settings.title")}</h1>
          <p className="text-muted-foreground mt-2">
            {t("settings.description")}
          </p>
        </div>

        {/* General Settings */}
        <Card>
          <CardHeader>
            <CardTitle>{t("settings.general")}</CardTitle>
            <CardDescription>
              {t("settings.generalDescription")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                {t("settings.workspaceName")}
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
                {t("settings.descriptionLabel")}
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
                {t("settings.saveChanges")}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Billing / Credits */}
        <Card>
          <CardHeader>
            <CardTitle>{t("settings.billingCredits")}</CardTitle>
            <CardDescription>
              {t("settings.billingDescription")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1 text-sm">
              <p className="font-medium text-foreground">
                {t("settings.currentBalance")}
              </p>
              <p className="text-muted-foreground">
                {walletLoading
                  ? t("common.loading")
                  : wallet
                  ? `${new Intl.NumberFormat(locale === "vi" ? "vi-VN" : "en-US", {
                      style: "currency",
                      currency: "VND",
                      minimumFractionDigits: 0,
                    }).format(wallet.balance)} CREDITS`
                  : t("settings.noWalletData")}
              </p>
              {wallet && (
                <p className="text-xs mt-1">
                  {t("settings.walletStatus")}:{" "}
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
              {canViewBilling && (
                <p className="mt-2">
                  <Link
                    href="/billing"
                    className="text-sm text-primary hover:underline"
                  >
                    {t("settings.viewTransactions")}
                  </Link>
                </p>
              )}
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">
                {t("settings.topupAmount")}
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
                    {amt.toLocaleString(locale === "vi" ? "vi-VN" : "en-US")} đ
                  </Button>
                ))}
              </div>
              <div className="space-y-1">
                <label className="text-sm text-foreground">
                  {t("settings.customAmount")}
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
                  placeholder={t("settings.customAmountPlaceholder")}
                />
                <p className="text-xs text-muted-foreground">
                  {t("settings.vndHint")}
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
                {t("settings.createQr")}
              </Button>
              {topupSuccess && (
                <span className="text-xs text-green-600 dark:text-green-400">
                  {t("settings.paymentReceived")}
                </span>
              )}
            </div>

            {vietQRData && (
              <div className="mt-4 grid gap-4 md:grid-cols-[auto,1fr] items-start">
                <div className="border rounded-lg p-3 bg-muted flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={vietQRData.qr_image_url}
                    alt={t("settings.qrAlt")}
                    className="w-40 h-40 object-contain"
                  />
                </div>
                <div className="space-y-2 text-sm">
                  <p>
                    <span className="font-medium">{t("settings.amount")}:</span>{" "}
                    {vietQRData.amount.toLocaleString(
                      locale === "vi" ? "vi-VN" : "en-US"
                    )}{" "}
                    {vietQRData.currency}
                  </p>
                  <p>
                    <span className="font-medium">{t("settings.bank")}:</span>{" "}
                    {vietQRData.bank.bank_id} - {vietQRData.bank.account_no}{" "}
                    {vietQRData.bank.account_name
                      ? `(${vietQRData.bank.account_name})`
                      : ""}
                  </p>
                  <p>
                    <span className="font-medium">
                      {t("settings.transferReference")}:
                    </span>{" "}
                    <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">
                      {vietQRData.reference}
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {translateTemplate(t("settings.transferHint"), {
                      reference: vietQRData.reference,
                    })}
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
              <CardTitle className="text-destructive">{t("settings.dangerZone")}</CardTitle>
              <CardDescription>
                {t("settings.dangerZoneDescription")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">{t("settings.deleteWorkspace")}</p>
                  <p className="text-sm text-muted-foreground">
                    {t("settings.deleteWorkspaceDescription")}
                  </p>
                </div>
                <Button
                  variant="outline"
                  className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                  onClick={handleDeleteClick}
                >
                  {t("settings.deleteWorkspace")}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Delete Confirmation Dialog */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("settings.deleteConfirmTitle")}</DialogTitle>
              <DialogDescription>
                {translateTemplate(t("settings.deleteConfirmDescription"), {
                  name: selectedWorkspace.name,
                })}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  {t("settings.typeDeleteConfirm")}
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
                {t("settings.cancel")}
              </Button>
              <Button
                variant="destructive"
                onClick={handleConfirmDelete}
                disabled={deleteConfirmation !== "delete" || isDeleting}
              >
                {isDeleting ? t("settings.deleting") : t("settings.deleteWorkspace")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
