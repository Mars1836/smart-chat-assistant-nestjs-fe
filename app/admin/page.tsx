"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/stores/auth-store";
import { AppLayout } from "@/components/app-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Users, CreditCard, Bot, ShieldCheck } from "lucide-react";

export default function AdminDashboardPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, isSystemAdmin } = useAuth();

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
        <div>
          <h1 className="text-3xl font-bold text-foreground">System Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Quản lý toàn bộ hệ thống: user, workspace, giao dịch billing, chatbot,...
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push("/admin/users")}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="w-5 h-5 text-primary" />
                Users
              </CardTitle>
              <CardDescription>Danh sách, thống kê & trạng thái toàn bộ user</CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-default">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Bot className="w-5 h-5 text-primary" />
                Workspaces & Chatbots
              </CardTitle>
              <CardDescription>Thống kê workspace, chatbot, usage</CardDescription>
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

        <Card>
          <CardHeader>
            <CardTitle>Coming soon</CardTitle>
            <CardDescription>
              Tại đây bạn sẽ thêm các màn hình chi tiết: danh sách user, chi tiết ví, log giao dịch, cấu hình hệ thống...
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Frontend hiện đã phân luồng: khi system admin đăng nhập sẽ tự chuyển vào /admin.
              Các user bình thường vẫn vào luồng workspace/chat như trước.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

