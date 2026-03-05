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
  List,
} from "lucide-react";
import { format, subDays } from "date-fns";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
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

function formatVndShort(value: number): string {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B₫`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M₫`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K₫`;
  return `${value}₫`;
}

// ──────────────────────────────────────────────
// Donut chart with center label
// ──────────────────────────────────────────────
interface DonutSlice {
  name: string;
  value: number;
  color: string;
}

function DonutChart({
  data,
  total,
  label,
}: {
  data: DonutSlice[];
  total: number;
  label: string;
}) {
  // Filter out zero-value slices so the chart renders cleanly
  const filtered = data.filter((d) => d.value > 0);
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative w-full" style={{ height: 200 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={filtered.length > 0 ? filtered : [{ name: "Không có", value: 1, color: "#e2e8f0" }]}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={85}
              paddingAngle={filtered.length > 1 ? 3 : 0}
              dataKey="value"
              strokeWidth={0}
            >
              {(filtered.length > 0 ? filtered : [{ name: "Không có", value: 1, color: "#e2e8f0" }]).map(
                (entry, index) => (
                  <Cell key={index} fill={entry.color} />
                )
              )}
            </Pie>
            <Tooltip
              formatter={(value: number, name: string) => [`${value}`, name]}
              contentStyle={{ borderRadius: "8px", fontSize: "12px", padding: "6px 10px" }}
            />
          </PieChart>
        </ResponsiveContainer>
        {/* Centered total */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-2xl font-bold">{total}</span>
          <span className="text-xs text-muted-foreground">{label}</span>
        </div>
      </div>
      {/* Legend */}
      {filtered.length > 0 && (
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 text-sm">
          {data.map((d) => (
            <div key={d.name} className="flex items-center gap-1.5">
              <span
                className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: d.color }}
              />
              <span className="text-muted-foreground">{d.name}</span>
              <span className="font-semibold">{d.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────
// Page component
// ──────────────────────────────────────────────
export default function AdminPaymentsStatsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, isSystemAdmin } = useAuth();
  const [summary, setSummary] = useState<PaymentStatsSummary | null>(null);
  const [byDate, setByDate] = useState<PaymentStatsByDateItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [groupBy, setGroupBy] = useState<"day" | "week" | "month">("day");
  const [rangeDays, setRangeDays] = useState(DEFAULT_DAYS);
  const [userId, setUserId] = useState("");
  const [chartType, setChartType] = useState<"bar" | "line">("bar");
  const [metric, setMetric] = useState<"count" | "amount">("amount");

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

  // Donut data for by-status (SePay transactions are mostly 'success')
  const statusDonut: DonutSlice[] = summary
    ? [
        {
          name: "Thành công",
          value: summary.by_status?.success ?? 0,
          color: "#10b981",
        },
        {
          name: "Chờ xử lý",
          value: summary.by_status?.pending ?? 0,
          color: "#f59e0b",
        },
        {
          name: "Thất bại",
          value: summary.by_status?.failed ?? 0,
          color: "#ef4444",
        },
      ]
    : [];

  const statusTotal = statusDonut.reduce((s, d) => s + d.value, 0);

  // Chart data: convert amount string → number for recharts
  const chartData = byDate.map((d) => ({
    ...d,
    amountNum: parseFloat(d.amount) || 0,
  }));

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
              <Link href="/admin/payments">
                <ChevronLeft className="w-5 h-5" />
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Thống kê giao dịch SePay
              </h1>
              <p className="text-sm text-muted-foreground">
                Tổng quan nạp tiền và biểu đồ theo thời gian
              </p>
            </div>
          </div>
          <Button variant="outline" asChild>
            <Link href="/admin/payments" className="gap-2 flex items-center">
              <List className="w-4 h-4" />
              Danh sách
            </Link>
          </Button>
        </div>

        {/* User filter (admin) */}
        <div className="flex items-center gap-2">
          <Input
            placeholder="Lọc theo User ID (tùy chọn)"
            className="w-[280px]"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
          />
          {userId && (
            <Button variant="ghost" size="sm" onClick={() => setUserId("")}>
              Xóa
            </Button>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* ── Summary cards ─────────────────────── */}
            {summary && (
              <>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        Tổng giao dịch
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
                        Tổng tiền nạp thành công
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

                {/* ── By-status donut ──────────────────── */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Phân bổ theo trạng thái</CardTitle>
                    <CardDescription>
                      Giao dịch SePay topup chủ yếu có trạng thái Thành công (webhook tự xử lý)
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <DonutChart
                      data={statusDonut}
                      total={statusTotal}
                      label="giao dịch"
                    />
                  </CardContent>
                </Card>
              </>
            )}

            {/* ── Time-series chart ─────────────────── */}
            <Card>
              <CardHeader>
                <CardTitle>Giao dịch theo thời gian</CardTitle>
                <CardDescription>
                  Số giao dịch / tổng tiền nạp (thành công) theo kỳ
                </CardDescription>
                <div className="flex flex-wrap items-center gap-2 pt-2">
                  {/* Range */}
                  <Select
                    value={String(rangeDays)}
                    onValueChange={(v) => setRangeDays(Number(v))}
                  >
                    <SelectTrigger className="w-[130px]">
                      <SelectValue placeholder="Khoảng" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">7 ngày</SelectItem>
                      <SelectItem value="14">14 ngày</SelectItem>
                      <SelectItem value="30">30 ngày</SelectItem>
                      <SelectItem value="90">90 ngày</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* GroupBy */}
                  <Select
                    value={groupBy}
                    onValueChange={(v) => setGroupBy(v as "day" | "week" | "month")}
                  >
                    <SelectTrigger className="w-[130px]">
                      <SelectValue placeholder="Nhóm theo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="day">Theo ngày</SelectItem>
                      <SelectItem value="week">Theo tuần</SelectItem>
                      <SelectItem value="month">Theo tháng</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Metric */}
                  <Select
                    value={metric}
                    onValueChange={(v) => setMetric(v as "count" | "amount")}
                  >
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Chỉ số" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="amount">Tổng tiền</SelectItem>
                      <SelectItem value="count">Số giao dịch</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Chart type */}
                  <Select
                    value={chartType}
                    onValueChange={(v) => setChartType(v as "bar" | "line")}
                  >
                    <SelectTrigger className="w-[110px]">
                      <SelectValue placeholder="Loại biểu đồ" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bar">Cột</SelectItem>
                      <SelectItem value="line">Đường</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-[320px] w-full">
                  {chartData.length === 0 ? (
                    <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
                      Không có dữ liệu trong khoảng thời gian này
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      {chartType === "bar" ? (
                        <BarChart
                          data={chartData}
                          margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis
                            dataKey="date"
                            tick={{ fontSize: 12 }}
                            tickFormatter={(v: string) =>
                              v.length >= 10 ? v.slice(5, 10) : v
                            }
                          />
                          <YAxis
                            allowDecimals={false}
                            tick={{ fontSize: 12 }}
                            tickFormatter={
                              metric === "amount"
                                ? (v: number) => formatVndShort(v)
                                : undefined
                            }
                          />
                          <Tooltip
                            content={({ active, payload, label }) => {
                              if (!active || !payload?.length || !label) return null;
                              const item = chartData.find((d) => d.date === label);
                              return (
                                <div className="rounded-lg border bg-card px-3 py-2 text-sm shadow">
                                  <p className="font-medium mb-1">{label}</p>
                                  <p>Số giao dịch: {item?.count ?? 0}</p>
                                  <p>
                                    Tổng tiền:{" "}
                                    {item?.amount != null ? formatVnd(item.amount) : "—"}
                                  </p>
                                </div>
                              );
                            }}
                          />
                          <Bar
                            dataKey={metric === "count" ? "count" : "amountNum"}
                            fill="hsl(var(--primary))"
                            radius={[4, 4, 0, 0]}
                            name={metric === "count" ? "Số giao dịch" : "Tổng tiền"}
                          />
                        </BarChart>
                      ) : (
                        <LineChart
                          data={chartData}
                          margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis
                            dataKey="date"
                            tick={{ fontSize: 12 }}
                            tickFormatter={(v: string) =>
                              v.length >= 10 ? v.slice(5, 10) : v
                            }
                          />
                          <YAxis
                            allowDecimals={false}
                            tick={{ fontSize: 12 }}
                            tickFormatter={
                              metric === "amount"
                                ? (v: number) => formatVndShort(v)
                                : undefined
                            }
                          />
                          <Tooltip
                            content={({ active, payload, label }) => {
                              if (!active || !payload?.length || !label) return null;
                              const item = chartData.find((d) => d.date === label);
                              return (
                                <div className="rounded-lg border bg-card px-3 py-2 text-sm shadow">
                                  <p className="font-medium mb-1">{label}</p>
                                  <p>Số giao dịch: {item?.count ?? 0}</p>
                                  <p>
                                    Tổng tiền:{" "}
                                    {item?.amount != null ? formatVnd(item.amount) : "—"}
                                  </p>
                                </div>
                              );
                            }}
                          />
                          <Line
                            type="monotone"
                            dataKey={metric === "count" ? "count" : "amountNum"}
                            stroke="hsl(var(--primary))"
                            strokeWidth={2}
                            dot={{ r: 3 }}
                            activeDot={{ r: 5 }}
                            name={metric === "count" ? "Số giao dịch" : "Tổng tiền"}
                          />
                        </LineChart>
                      )}
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
