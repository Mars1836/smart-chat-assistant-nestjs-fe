"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/stores/auth-store";
import { paymentsApi, type Payment } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, ChevronLeft, BarChart3, Eye, Filter } from "lucide-react";

function formatVnd(value: string | number): string {
  const n = typeof value === "string" ? parseFloat(value) : value;
  if (Number.isNaN(n)) return "—";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(n);
}

function StatusBadge({ status }: { status: Payment["status"] }) {
  if (status === "success") {
    return (
      <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/20">
        Thành công
      </Badge>
    );
  }
  if (status === "pending") {
    return (
      <Badge className="bg-amber-500/15 text-amber-600 border-amber-500/30 hover:bg-amber-500/20">
        Chờ xử lý
      </Badge>
    );
  }
  return (
    <Badge className="bg-rose-500/15 text-rose-600 border-rose-500/30 hover:bg-rose-500/20">
      Thất bại
    </Badge>
  );
}

export default function AdminPaymentsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, isSystemAdmin } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [meta, setMeta] = useState<{
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [status, setStatus] = useState<string>("");
  // Default provider = sepay; "all" means no provider filter sent
  const [provider, setProvider] = useState<string>("sepay");
  const [userId, setUserId] = useState("");
  const [detailOpen, setDetailOpen] = useState(false);
  const [detail, setDetail] = useState<Payment | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      router.replace("/auth/login?redirect=/admin/payments");
      return;
    }
    if (!isSystemAdmin) {
      router.replace("/");
      return;
    }
  }, [isAuthenticated, authLoading, isSystemAdmin, router]);

  useEffect(() => {
    if (!isSystemAdmin) return;
    setLoading(true);
    paymentsApi
      .list({
        page,
        limit,
        sortBy: "created_at",
        sortOrder: "DESC",
        ...(status && { status: status as Payment["status"] }),
        ...(provider !== "all" && provider && { provider }),
        ...(userId.trim() && { user_id: userId.trim() }),
      })
      .then((res) => {
        setPayments(Array.isArray(res?.data) ? res.data : []);
        setMeta(res?.meta ?? null);
      })
      .catch(() => {
        setPayments([]);
        setMeta(null);
      })
      .finally(() => setLoading(false));
  }, [isSystemAdmin, page, limit, status, provider, userId]);

  const loadDetail = (id: string) => {
    setDetailOpen(true);
    setDetail(null);
    setDetailLoading(true);
    paymentsApi
      .get(id)
      .then((d) => setDetail(d))
      .catch(() => setDetail(null))
      .finally(() => setDetailLoading(false));
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
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/admin">
                <ChevronLeft className="w-5 h-5" />
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Quản lý giao dịch
              </h1>
              <p className="text-muted-foreground text-sm">
                Giao dịch nạp tiền qua SePay – toàn hệ thống
              </p>
            </div>
          </div>
          <Button variant="outline" asChild>
            <Link href="/admin/payments/stats" className="gap-2 flex items-center">
              <BarChart3 className="w-4 h-4" />
              Thống kê
            </Link>
          </Button>
        </div>

        {/* Table card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Danh sách giao dịch</CardTitle>
                <CardDescription>
                  Lọc theo trạng thái; admin có thể nhập User ID để lọc theo người dùng cụ thể
                </CardDescription>
              </div>
              <Filter className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="flex flex-wrap items-center gap-2 pt-2">
              {/* Status filter */}
              <Select
                value={status || "all"}
                onValueChange={(v) => { setPage(1); setStatus(v === "all" ? "" : v); }}
              >
                <SelectTrigger className="w-[155px]">
                  <SelectValue placeholder="Trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả trạng thái</SelectItem>
                  <SelectItem value="success">Thành công</SelectItem>
                  <SelectItem value="pending">Chờ xử lý</SelectItem>
                  <SelectItem value="failed">Thất bại</SelectItem>
                </SelectContent>
              </Select>

              {/* Provider filter – SePay default */}
              <Select
                value={provider}
                onValueChange={(v) => { setPage(1); setProvider(v); }}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Kênh" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả kênh</SelectItem>
                  <SelectItem value="sepay">SePay</SelectItem>
                </SelectContent>
              </Select>

              {/* User ID filter (admin only) */}
              <Input
                placeholder="User ID (tùy chọn)"
                className="w-[220px]"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && setPage(1)}
              />

              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setPage(1);
                  setStatus("");
                  setProvider("sepay");
                  setUserId("");
                }}
              >
                Xóa lọc
              </Button>
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
                      <TableHead>Mã GD (SePay)</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Số tiền</TableHead>
                      <TableHead>Mô tả</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead>Ngày tạo</TableHead>
                      <TableHead className="w-[60px]" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={7}
                          className="text-center text-muted-foreground py-12"
                        >
                          Không có giao dịch nào
                        </TableCell>
                      </TableRow>
                    ) : (
                      payments.map((p) => (
                        <TableRow key={p.id} className="group">
                          <TableCell className="font-mono text-xs text-muted-foreground">
                            {p.transaction_id || p.id.slice(0, 8)}
                          </TableCell>
                          <TableCell className="text-sm">
                            {p.user ? (
                              <div>
                                <p className="font-medium">{p.user.name || "—"}</p>
                                <p className="text-muted-foreground text-xs">{p.user.email}</p>
                              </div>
                            ) : (
                              "—"
                            )}
                          </TableCell>
                          <TableCell className="font-semibold">
                            {formatVnd(p.amount)}
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate text-muted-foreground text-sm">
                            {p.description || "—"}
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={p.status} />
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                            {new Date(p.created_at).toLocaleString("vi-VN")}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => loadDetail(p.id)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>

                {/* Pagination */}
                {meta && meta.totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <p className="text-sm text-muted-foreground">
                      Trang {meta.page} / {meta.totalPages} &nbsp;·&nbsp; Tổng{" "}
                      <strong>{meta.total}</strong> giao dịch
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={page <= 1}
                        onClick={() => setPage((p) => p - 1)}
                      >
                        ← Trước
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={page >= meta.totalPages}
                        onClick={() => setPage((p) => p + 1)}
                      >
                        Sau →
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Chi tiết giao dịch</DialogTitle>
          </DialogHeader>
          {detailLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : detail ? (
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
              <dt className="text-muted-foreground font-medium">ID</dt>
              <dd className="font-mono text-xs break-all">{detail.id}</dd>

              <dt className="text-muted-foreground font-medium">Mã GD (SePay)</dt>
              <dd className="font-mono">{detail.transaction_id || "—"}</dd>

              <dt className="text-muted-foreground font-medium">Số tiền</dt>
              <dd className="font-semibold">{formatVnd(detail.amount)}</dd>

              <dt className="text-muted-foreground font-medium">Mô tả</dt>
              <dd>{detail.description || "—"}</dd>

              <dt className="text-muted-foreground font-medium">Kênh</dt>
              <dd>
                <Badge variant="outline">
                  {detail.provider?.toUpperCase() || "SEPAY"}
                </Badge>
              </dd>

              <dt className="text-muted-foreground font-medium">Trạng thái</dt>
              <dd>
                <StatusBadge status={detail.status} />
              </dd>

              <dt className="text-muted-foreground font-medium">Tạo lúc</dt>
              <dd>{new Date(detail.created_at).toLocaleString("vi-VN")}</dd>

              <dt className="text-muted-foreground font-medium">Cập nhật</dt>
              <dd>{new Date(detail.updated_at).toLocaleString("vi-VN")}</dd>

              {detail.user && (
                <>
                  <dt className="text-muted-foreground font-medium">User</dt>
                  <dd>
                    <p className="font-medium">{detail.user.name || "—"}</p>
                    <p className="text-muted-foreground text-xs">
                      {detail.user.email}
                    </p>
                  </dd>
                </>
              )}
            </dl>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-6">
              Không tải được chi tiết giao dịch
            </p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
