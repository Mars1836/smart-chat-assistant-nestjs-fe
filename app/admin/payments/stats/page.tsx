"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/stores/auth-store";
import {
  paymentsApi,
  type PaymentStatsSummary,
  type PaymentStatsByDateItem,
} from "@/lib/api";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  ChevronLeft,
  CreditCard,
  Banknote,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { format, subDays } from "date-fns";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const DEFAULT_DAYS = 30;

function formatVnd(value: string | number): string {
  const n = typeof value === "string" ? parseFloat(value) : value;
  if (Number.isNaN(n)) return "—";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(n);
}

export default function AdminPaymentsStatsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, isSystemAdmin } = useAuth();
  const [summary, setSummary] = useState<PaymentStatsSummary | null>(null);
  const [byDate, setByDate] = useState<PaymentStatsByDateItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [groupBy, setGroupBy] = useState<"day" | "week" | "month">("day");
  const [rangeDays, setRangeDays] = useState(DEFAULT_DAYS);
  const [userId, setUserId] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      router.replace("/auth/login?redirect=/admin/payments/stats");
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
    const summaryParams = userId.trim() ? { user_id: userId.trim() } : undefined;
    const from = format(subDays(new Date(), rangeDays), "yyyy-MM-dd");
    const to = format(new Date(), "yyyy-MM-dd");
    Promise.all([
      paymentsApi.getStatsSummary(summaryParams),
      paymentsApi.getStatsByDate({
        from,
        to,
        groupBy,
        ...(userId.trim() && { user_id: userId.trim() }),
      }),
    ])
      .then(([sum, byDateRes]) => {
        setSummary(sum);
        setByDate(Array.isArray(byDateRes) ? byDateRes : []);
      })
      .catch(() => {
        setSummary(null);
        setByDate([]);
      })
      .finally(() => setLoading(false));
  }, [isSystemAdmin, rangeDays, groupBy, userId]);

  const refetchChart = () => {
    if (!isSystemAdmin) return;
    paymentsApi
      .getStatsByDate({
        from: format(subDays(new Date(), rangeDays), "yyyy-MM-dd"),
        to: format(new Date(), "yyyy-MM-dd"),
        groupBy,
        ...(userId.trim() && { user_id: userId.trim() }),
      })
      .then((res) => setByDate(Array.isArray(res) ? res : []));
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
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/payments">
              <ChevronLeft className="w-5 h-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Thống kê giao dịch
            </h1>
            <p className="text-sm text-muted-foreground">
              Tổng quan và biểu đồ theo thời gian (admin có thể lọc theo User ID)
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Input
            placeholder="User ID (admin, tùy chọn)"
            className="w-[240px]"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {summary && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        Tổng số giao dịch
                      </CardTitle>
                      <CreditCard className="w-4 h-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">
                        {summary.total_count ?? 0}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        Tổng tiền (đã thành công)
                      </CardTitle>
                      <Banknote className="w-4 h-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">
                        {formatVnd(summary.total_amount_success ?? "0")}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        Thành công (7 ngày)
                      </CardTitle>
                      <TrendingUp className="w-4 h-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">
                        {summary.success_last_7_days ?? 0}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        Thành công (30 ngày)
                      </CardTitle>
                      <Wallet className="w-4 h-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">
                        {summary.success_last_30_days ?? 0}
                      </p>
                    </CardContent>
                  </Card>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Theo trạng thái</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="text-sm space-y-1">
                        <li>
                          Chờ xử lý:{" "}
                          <strong>{summary.by_status?.pending ?? 0}</strong>
                        </li>
                        <li>
                          Thành công:{" "}
                          <strong>{summary.by_status?.success ?? 0}</strong>
                        </li>
                        <li>
                          Thất bại:{" "}
                          <strong>{summary.by_status?.failed ?? 0}</strong>
                        </li>
                      </ul>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Theo kênh</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="text-sm space-y-1">
                        <li>
                          ZaloPay:{" "}
                          <strong>{summary.by_provider?.zalopay ?? 0}</strong>
                        </li>
                        <li>
                          MoMo:{" "}
                          <strong>{summary.by_provider?.momo ?? 0}</strong>
                        </li>
                        <li>
                          Ngân hàng:{" "}
                          <strong>{summary.by_provider?.bank ?? 0}</strong>
                        </li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Giao dịch theo thời gian</CardTitle>
                <CardDescription>
                  Số giao dịch và tổng tiền (thành công) theo kỳ
                </CardDescription>
                <div className="flex flex-wrap items-center gap-2 pt-2">
                  <Select
                    value={String(rangeDays)}
                    onValueChange={(v) => setRangeDays(Number(v))}
                  >
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Khoảng thời gian" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">7 ngày</SelectItem>
                      <SelectItem value="14">14 ngày</SelectItem>
                      <SelectItem value="30">30 ngày</SelectItem>
                      <SelectItem value="90">90 ngày</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    value={groupBy}
                    onValueChange={(v) =>
                      setGroupBy(v as "day" | "week" | "month")
                    }
                  >
                    <SelectTrigger className="w-[120px]">
                      <SelectValue placeholder="Nhóm theo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="day">Theo ngày</SelectItem>
                      <SelectItem value="week">Theo tuần</SelectItem>
                      <SelectItem value="month">Theo tháng</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="sm" onClick={refetchChart}>
                    Làm mới
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-[320px] w-full">
                  {byDate.length === 0 ? (
                    <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
                      Không có dữ liệu trong khoảng thời gian này
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={byDate}
                        margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          className="stroke-muted"
                        />
                        <XAxis
                          dataKey="date"
                          tick={{ fontSize: 12 }}
                          tickFormatter={(v) =>
                            v.length >= 10 ? v.slice(0, 10) : v
                          }
                        />
                        <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                        <Tooltip
                          content={({ active, payload, label }) => {
                            if (!active || !payload?.length || !label) return null;
                            const item = byDate.find((d) => d.date === label);
                            return (
                              <div className="rounded-lg border bg-card px-3 py-2 text-sm shadow">
                                <p className="font-medium">Kỳ: {label}</p>
                                <p>Số giao dịch: {item?.count ?? 0}</p>
                                <p>
                                  Tổng tiền:{" "}
                                  {item?.amount != null
                                    ? formatVnd(item.amount)
                                    : "—"}
                                </p>
                              </div>
                            );
                          }}
                        />
                        <Bar
                          dataKey="count"
                          fill="hsl(var(--primary))"
                          radius={[4, 4, 0, 0]}
                          name="Số giao dịch"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
