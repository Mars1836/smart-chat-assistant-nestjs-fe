"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/stores/auth-store";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { llmModelsApi, paymentsApi, usersApi } from "@/lib/api";
import { Loader2, Users, CreditCard, Bot, ShieldCheck, Coins, BookOpen, LogOut } from "lucide-react";

function formatVnd(value: string | number): string {
  const n = typeof value === "string" ? parseFloat(value) : value;
  if (Number.isNaN(n)) return "0";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(n);
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, isSystemAdmin, logout } = useAuth();
  const [statsLoading, setStatsLoading] = useState(true);
  const [overview, setOverview] = useState<{
    usersTotal: number;
    newUsers7d: number;
    newUsers30d: number;
    usersByRole: { admin: number; user: number; no_role: number };
    paymentsTotal: number;
    paymentsSuccessAmount: string;
    paymentsByStatus: { pending: number; success: number; failed: number };
    success7d: number;
    success30d: number;
    modelsTotal: number;
  } | null>(null);

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      router.replace("/auth/login?redirect=/admin");
      return;
    }

    if (!isSystemAdmin) {
      // Không phải system admin: đưa về trang chính
      router.replace("/");
    }
  }, [isAuthenticated, isLoading, isSystemAdmin, router]);

  useEffect(() => {
    if (!isAuthenticated || !isSystemAdmin) return;

    setStatsLoading(true);
    Promise.all([
      usersApi.getStatsSummary(),
      paymentsApi.getStatsSummary(),
      llmModelsApi.list({ page: 1, limit: 1, sortBy: "created_at", sortOrder: "ASC" }),
    ])
      .then(([users, payments, models]) => {
        setOverview({
          usersTotal: users.total ?? 0,
          newUsers7d: users.new_last_7_days ?? 0,
          newUsers30d: users.new_last_30_days ?? 0,
          usersByRole: {
            admin: users.by_role?.admin ?? 0,
            user: users.by_role?.user ?? 0,
            no_role: users.by_role?.no_role ?? 0,
          },
          paymentsTotal: payments.total_count ?? 0,
          paymentsSuccessAmount: payments.total_amount_success ?? "0",
          paymentsByStatus: {
            pending: payments.by_status?.pending ?? 0,
            success: payments.by_status?.success ?? 0,
            failed: payments.by_status?.failed ?? 0,
          },
          success7d: payments.success_last_7_days ?? 0,
          success30d: payments.success_last_30_days ?? 0,
          modelsTotal: models?.meta?.total ?? 0,
        });
      })
      .catch(() => {
        setOverview(null);
      })
      .finally(() => setStatsLoading(false));
  }, [isAuthenticated, isSystemAdmin]);

  const paymentSuccessRate = useMemo(() => {
    if (!overview || overview.paymentsTotal <= 0) return 0;
    return Math.round((overview.paymentsByStatus.success / overview.paymentsTotal) * 100);
  }, [overview]);

  if (isLoading || !isAuthenticated || !isSystemAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Admin dashboard dùng layout riêng (không phụ thuộc workspace)
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex items-start justify-between gap-4">
          <div>
          <h1 className="text-3xl font-bold text-foreground">System Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Quản lý toàn bộ hệ thống: user, workspace, giao dịch billing, chatbot,...
          </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => router.push("/admin/payments/stats")}>
              Xem báo cáo giao dịch
            </Button>
            <Button variant="destructive" onClick={logout} className="gap-2">
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>
        </div>

        {/* KPI */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Tổng người dùng</CardDescription>
              <CardTitle className="text-2xl">
                {statsLoading ? "..." : (overview?.usersTotal ?? 0)}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">
              7 ngày: {overview?.newUsers7d ?? 0} · 30 ngày: {overview?.newUsers30d ?? 0}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Tổng giao dịch</CardDescription>
              <CardTitle className="text-2xl">
                {statsLoading ? "..." : (overview?.paymentsTotal ?? 0)}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">
              Tỉ lệ thành công: {paymentSuccessRate}%
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Tổng tiền thành công</CardDescription>
              <CardTitle className="text-2xl">
                {statsLoading ? "..." : formatVnd(overview?.paymentsSuccessAmount ?? "0")}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">
              7 ngày: {overview?.success7d ?? 0} · 30 ngày: {overview?.success30d ?? 0}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>LLM Models</CardDescription>
              <CardTitle className="text-2xl">
                {statsLoading ? "..." : (overview?.modelsTotal ?? 0)}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">
              Số model đang cấu hình giá token
            </CardContent>
          </Card>
        </div>

        {/* Health / snapshot */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Snapshot người dùng</CardTitle>
              <CardDescription>Phân bổ vai trò hệ thống</CardDescription>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <div className="flex justify-between"><span>Admin</span><span>{overview?.usersByRole.admin ?? 0}</span></div>
              <div className="flex justify-between"><span>User</span><span>{overview?.usersByRole.user ?? 0}</span></div>
              <div className="flex justify-between"><span>Chưa gán role</span><span>{overview?.usersByRole.no_role ?? 0}</span></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Snapshot giao dịch</CardTitle>
              <CardDescription>Chất lượng xử lý thanh toán</CardDescription>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <div className="flex justify-between"><span>Success</span><span>{overview?.paymentsByStatus.success ?? 0}</span></div>
              <div className="flex justify-between"><span>Pending</span><span>{overview?.paymentsByStatus.pending ?? 0}</span></div>
              <div className="flex justify-between"><span>Failed</span><span>{overview?.paymentsByStatus.failed ?? 0}</span></div>
            </CardContent>
          </Card>
        </div>

        {/* Modules */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push("/admin/users")}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="w-5 h-5 text-primary" />
                Users
              </CardTitle>
              <CardDescription>Danh sách, thống kê & trạng thái toàn bộ user</CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push("/admin/workspaces/stats")}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Bot className="w-5 h-5 text-primary" />
                Workspaces & Chatbots
              </CardTitle>
              <CardDescription>Thống kê workspace, chatbot mới tạo</CardDescription>
            </CardHeader>
          </Card>


          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push("/admin/payments")}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <CreditCard className="w-5 h-5 text-primary" />
                Giao dịch
              </CardTitle>
              <CardDescription>Danh sách & thống kê giao dịch thanh toán</CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push("/admin/knowledge/stats")}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <BookOpen className="w-5 h-5 text-primary" />
                Knowledge Base
              </CardTitle>
              <CardDescription>Tổng quan knowledge bases &amp; documents</CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push("/admin/llm-models")}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Coins className="w-5 h-5 text-primary" />
                Models & Giá
              </CardTitle>
              <CardDescription>Quản lý model LLM và giá token (input/output per 1K)</CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-default">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ShieldCheck className="w-5 h-5 text-primary" />
                System Settings
              </CardTitle>
              <CardDescription>Cấu hình global, provider keys, v.v.</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    </div>
  );
}

