"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/stores/auth-store";
import {
  usersApi,
  type UserStatsSummary,
  type UserStatsByDateItem,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
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
import { Loader2, ChevronLeft, Users, UserPlus, Shield, UserCog } from "lucide-react";
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

export default function AdminUsersStatsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, isSystemAdmin } = useAuth();
  const [summary, setSummary] = useState<UserStatsSummary | null>(null);
  const [byDate, setByDate] = useState<UserStatsByDateItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [groupBy, setGroupBy] = useState<"day" | "week" | "month">("day");
  const [rangeDays, setRangeDays] = useState(DEFAULT_DAYS);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      router.replace("/auth/login?redirect=/admin/users/stats");
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
    Promise.all([
      usersApi.getStatsSummary(),
      usersApi.getStatsByDate({
        from: format(subDays(new Date(), rangeDays), "yyyy-MM-dd"),
        to: format(new Date(), "yyyy-MM-dd"),
        groupBy,
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
  }, [isSystemAdmin, rangeDays, groupBy]);

  const refetchChart = () => {
    if (!isSystemAdmin) return;
    usersApi
      .getStatsByDate({
        from: format(subDays(new Date(), rangeDays), "yyyy-MM-dd"),
        to: format(new Date(), "yyyy-MM-dd"),
        groupBy,
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
            <Link href="/admin/users">
              <ChevronLeft className="w-5 h-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Thống kê user
            </h1>
            <p className="text-sm text-muted-foreground">
              Tổng quan và biểu đồ user mới theo thời gian
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Summary cards */}
            {summary && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Tổng user
                    </CardTitle>
                    <Users className="w-4 h-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{summary.total}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Admin
                    </CardTitle>
                    <Shield className="w-4 h-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">
                      {summary.by_role?.admin ?? 0}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      User thường
                    </CardTitle>
                    <UserCog className="w-4 h-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">
                      {summary.by_role?.user ?? 0}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Chưa gán vai trò
                    </CardTitle>
                    <Users className="w-4 h-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">
                      {summary.by_role?.no_role ?? 0}
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* New users in period */}
            {summary && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      User mới (7 ngày qua)
                    </CardTitle>
                    <UserPlus className="w-4 h-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">
                      {summary.new_last_7_days ?? 0}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      User mới (30 ngày qua)
                    </CardTitle>
                    <UserPlus className="w-4 h-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">
                      {summary.new_last_30_days ?? 0}
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Chart */}
            <Card>
              <CardHeader>
                <CardTitle>User mới theo thời gian</CardTitle>
                <CardDescription>
                  Số user đăng ký theo từng kỳ (ngày/tuần/tháng)
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
                          formatter={(value: number) => [value, "Số user"]}
                          labelFormatter={(label) => `Kỳ: ${label}`}
                        />
                        <Bar
                          dataKey="count"
                          fill="hsl(var(--primary))"
                          radius={[4, 4, 0, 0]}
                          name="Số user"
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
