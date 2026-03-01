"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/stores/auth-store";
import { paymentsApi, type Payment } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Loader2, ChevronLeft, BarChart3, Eye } from "lucide-react";

function formatVnd(value: string | number): string {
  const n = typeof value === "string" ? parseFloat(value) : value;
  if (Number.isNaN(n)) return "—";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(n);
}

function statusLabel(s: string): string {
  const map: Record<string, string> = {
    pending: "Chờ xử lý",
    success: "Thành công",
    failed: "Thất bại",
  };
  return map[s] ?? s;
}

function providerLabel(p: string): string {
  const map: Record<string, string> = {
    zalopay: "ZaloPay",
    momo: "MoMo",
    bank: "Ngân hàng",
  };
  return map[p] ?? p;
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
  const [provider, setProvider] = useState<string>("");
  const [userId, setUserId] = useState("");
  const [detailId, setDetailId] = useState<string | null>(null);
  const [detail, setDetail] = useState<Payment | null>(null);

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
        ...(provider && { provider: provider as Payment["provider"] }),
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
    setDetailId(id);
    setDetail(null);
    paymentsApi
      .get(id)
      .then(setDetail)
      .catch(() => setDetail(null));
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
                Danh sách thanh toán (admin: có thể lọc theo user)
              </p>
            </div>
          </div>
          <Button variant="outline" asChild>
            <Link href="/admin/payments/stats" className="gap-2">
              <BarChart3 className="w-4 h-4" />
              Thống kê
            </Link>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Danh sách giao dịch</CardTitle>
            <CardDescription>
              Lọc theo trạng thái, kênh; admin có thể nhập User ID để lọc
            </CardDescription>
            <div className="flex flex-wrap items-center gap-2 pt-2">
              <Select value={status || "all"} onValueChange={(v) => setStatus(v === "all" ? "" : v)}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả trạng thái</SelectItem>
                  <SelectItem value="pending">Chờ xử lý</SelectItem>
                  <SelectItem value="success">Thành công</SelectItem>
                  <SelectItem value="failed">Thất bại</SelectItem>
                </SelectContent>
              </Select>
              <Select value={provider || "all"} onValueChange={(v) => setProvider(v === "all" ? "" : v)}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Kênh" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả kênh</SelectItem>
                  <SelectItem value="zalopay">ZaloPay</SelectItem>
                  <SelectItem value="momo">MoMo</SelectItem>
                  <SelectItem value="bank">Ngân hàng</SelectItem>
                </SelectContent>
              </Select>
              <Input
                placeholder="User ID (admin)"
                className="w-[220px]"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
              />
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setPage(1);
                  setStatus("");
                  setProvider("");
                  setUserId("");
                }}
              >
                Xóa lọc
              </Button>
            </div>
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
                      <TableHead>Mã GD</TableHead>
                      <TableHead>Số tiền</TableHead>
                      <TableHead>Mô tả</TableHead>
                      <TableHead>Kênh</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Ngày tạo</TableHead>
                      <TableHead className="w-[80px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={8}
                          className="text-center text-muted-foreground py-8"
                        >
                          Không có giao dịch nào
                        </TableCell>
                      </TableRow>
                    ) : (
                      payments.map((p) => (
                        <TableRow key={p.id}>
                          <TableCell className="font-mono text-xs">
                            {p.transaction_id || p.id.slice(0, 8)}
                          </TableCell>
                          <TableCell className="font-medium">
                            {formatVnd(p.amount)}
                          </TableCell>
                          <TableCell className="max-w-[160px] truncate text-muted-foreground">
                            {p.description || "—"}
                          </TableCell>
                          <TableCell>{providerLabel(p.provider)}</TableCell>
                          <TableCell>{statusLabel(p.status)}</TableCell>
                          <TableCell className="text-sm">
                            {p.user ? (
                              <span title={p.user.email}>
                                {p.user.name || p.user.email}
                              </span>
                            ) : (
                              "—"
                            )}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {new Date(p.created_at).toLocaleString("vi-VN")}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
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

        {/* Detail popover / modal - simple dialog-style card below or we could use Dialog */}
        {detailId && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Chi tiết giao dịch</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setDetailId(null)}>
                Đóng
              </Button>
            </CardHeader>
            <CardContent>
              {detail ? (
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                  <dt className="text-muted-foreground">ID</dt>
                  <dd className="font-mono">{detail.id}</dd>
                  <dt className="text-muted-foreground">Số tiền</dt>
                  <dd>{formatVnd(detail.amount)}</dd>
                  <dt className="text-muted-foreground">Mô tả</dt>
                  <dd>{detail.description || "—"}</dd>
                  <dt className="text-muted-foreground">Kênh</dt>
                  <dd>{providerLabel(detail.provider)}</dd>
                  <dt className="text-muted-foreground">Mã giao dịch</dt>
                  <dd className="font-mono">{detail.transaction_id}</dd>
                  <dt className="text-muted-foreground">Trạng thái</dt>
                  <dd>{statusLabel(detail.status)}</dd>
                  <dt className="text-muted-foreground">Tạo lúc</dt>
                  <dd>
                    {new Date(detail.created_at).toLocaleString("vi-VN")}
                  </dd>
                  <dt className="text-muted-foreground">Cập nhật</dt>
                  <dd>
                    {new Date(detail.updated_at).toLocaleString("vi-VN")}
                  </dd>
                  {detail.user && (
                    <>
                      <dt className="text-muted-foreground">User</dt>
                      <dd>
                        {detail.user.name} ({detail.user.email})
                      </dd>
                    </>
                  )}
                </dl>
              ) : (
                <div className="flex justify-center py-4">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
