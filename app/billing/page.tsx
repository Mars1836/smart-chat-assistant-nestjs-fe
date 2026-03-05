"use client";

import { AppLayout } from "@/components/app-layout";
import { Button } from "@/components/ui/button";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useWorkspace } from "@/lib/stores/workspace-store";
import {
  workspacesApi,
  type BillingTransaction,
} from "@/lib/api";
import { toast } from "sonner";

function formatAmount(amount: string): string {
  const n = parseFloat(amount);
  if (Number.isNaN(n)) return amount;
  const formatted = new Intl.NumberFormat("vi-VN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(n);
  return n >= 0 ? `+${formatted}` : formatted;
}

function typeLabel(type: string): string {
  const map: Record<string, string> = {
    topup: "Nạp tiền",
    usage: "Dùng token",
    refund: "Hoàn tiền",
    adjustment: "Điều chỉnh",
  };
  return map[type] ?? type;
}

export default function BillingPage() {
  const { selectedWorkspace } = useWorkspace();
  const [transactions, setTransactions] = useState<BillingTransaction[]>([]);
  const [meta, setMeta] = useState<{
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [typeFilter, setTypeFilter] = useState<string>("");

  const canView =
    selectedWorkspace?.user_role === "Owner" ||
    selectedWorkspace?.user_role === "Admin";

  useEffect(() => {
    if (!selectedWorkspace) return;
    if (!canView) {
      setLoading(false);
      setForbidden(true);
      setTransactions([]);
      setMeta(null);
      return;
    }
    setForbidden(false);
    setLoading(true);
    workspacesApi
      .getBillingTransactions(selectedWorkspace.id, {
        page,
        limit,
        sortBy: "created_at",
        sortOrder: "DESC",
        ...(typeFilter && {
          type: typeFilter as BillingTransaction["type"],
        }),
      })
      .then((res) => {
        setTransactions(Array.isArray(res?.data) ? res.data : []);
        setMeta(res?.meta ?? null);
      })
      .catch((err: { response?: { status?: number } }) => {
        if (err?.response?.status === 403) {
          setForbidden(true);
          setTransactions([]);
          setMeta(null);
        } else {
          toast.error("Không tải được lịch sử giao dịch");
          setTransactions([]);
          setMeta(null);
        }
      })
      .finally(() => setLoading(false));
  }, [selectedWorkspace, canView, page, limit, typeFilter]);

  return (
    <AppLayout activeModule="billing">
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Lịch sử giao dịch & Token
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Giao dịch ví workspace và lịch sử sử dụng token (chỉ Owner & Admin).
          </p>
        </div>

        {!canView && (
          <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-800">
            <CardContent className="pt-6">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                Chỉ Owner và Admin workspace mới xem được trang này.
              </p>
            </CardContent>
          </Card>
        )}

        {canView && forbidden && (
          <Card className="border-destructive/50 bg-destructive/5">
            <CardContent className="pt-6">
              <p className="text-sm text-destructive">
                Bạn không có quyền xem lịch sử giao dịch (403). Chỉ Owner và Admin workspace mới được cấp quyền.
              </p>
            </CardContent>
          </Card>
        )}

        {canView && !forbidden && (
          <Card>
            <CardHeader>
              <CardTitle>Giao dịch</CardTitle>
              <CardDescription>
                Nạp tiền, dùng token, hoàn tiền, điều chỉnh
              </CardDescription>
              <div className="pt-2">
                <Select
                  value={typeFilter || "all"}
                  onValueChange={(v) => {
                    setTypeFilter(v === "all" ? "" : v);
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Loại giao dịch" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả</SelectItem>
                    <SelectItem value="topup">Nạp tiền</SelectItem>
                    <SelectItem value="usage">Dùng token</SelectItem>
                    <SelectItem value="refund">Hoàn tiền</SelectItem>
                    <SelectItem value="adjustment">Điều chỉnh</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Thời gian</TableHead>
                        <TableHead>Thành viên</TableHead>
                        <TableHead>Loại</TableHead>
                        <TableHead className="text-right">Credit</TableHead>
                        <TableHead>Mô tả</TableHead>
                        <TableHead className="text-right">Input tokens</TableHead>
                        <TableHead className="text-right">Output tokens</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={7}
                            className="text-center text-muted-foreground py-8"
                          >
                            Chưa có giao dịch nào
                          </TableCell>
                        </TableRow>
                      ) : (
                        transactions.map((tx) => (
                          <TableRow key={tx.id}>
                            <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                              {new Date(tx.created_at).toLocaleString("vi-VN")}
                            </TableCell>
                            <TableCell className="text-sm">
                              {tx.user
                                ? tx.user.name || tx.user.email || "—"
                                : "Khách"}
                            </TableCell>
                            <TableCell>{typeLabel(tx.type)}</TableCell>
                            <TableCell
                              className={`text-right font-mono ${
                                parseFloat(tx.amount) >= 0
                                  ? "text-green-600 dark:text-green-400"
                                  : "text-red-600 dark:text-red-400"
                              }`}
                            >
                              {formatAmount(tx.amount)}
                            </TableCell>
                            <TableCell className="max-w-[280px] truncate text-sm">
                              {tx.description || "—"}
                            </TableCell>
                            <TableCell className="text-right text-muted-foreground">
                              {tx.input_tokens != null ? tx.input_tokens : "—"}
                            </TableCell>
                            <TableCell className="text-right text-muted-foreground">
                              {tx.output_tokens != null ? tx.output_tokens : "—"}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                  {meta && meta.totalPages > 1 && (
                    <div className="flex items-center justify-between mt-4">
                      <p className="text-sm text-muted-foreground">
                        Trang {meta.page} / {meta.totalPages} (tổng {meta.total}{" "}
                        giao dịch)
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
        )}
      </div>
    </AppLayout>
  );
}
