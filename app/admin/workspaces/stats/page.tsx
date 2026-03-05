"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/stores/auth-store";
import { adminWorkspacesApi, type WorkspaceChatbotStatsSummary } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  ChevronLeft,
  LayoutGrid,
  Bot,
  TrendingUp,
  Layers,
} from "lucide-react";

export default function AdminWorkspacesStatsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, isSystemAdmin } = useAuth();
  const [stats, setStats] = useState<WorkspaceChatbotStatsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      router.replace("/auth/login?redirect=/admin/workspaces/stats");
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
    setError(false);
    adminWorkspacesApi
      .getStatsSummary()
      .then(setStats)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [isSystemAdmin]);

  if (authLoading || !isAuthenticated || !isSystemAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin">
              <ChevronLeft className="w-5 h-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Thống kê Workspaces & Chatbots
            </h1>
            <p className="text-sm text-muted-foreground">
              Tổng quan toàn hệ thống
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : error || !stats ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground text-sm">
              Không tải được dữ liệu thống kê.{" "}
              <button
                className="underline text-primary"
                onClick={() => {
                  setLoading(true);
                  setError(false);
                  adminWorkspacesApi
                    .getStatsSummary()
                    .then(setStats)
                    .catch(() => setError(true))
                    .finally(() => setLoading(false));
                }}
              >
                Thử lại
              </button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* ── Top-level counts ─────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Tổng Workspaces</CardTitle>
                  <LayoutGrid className="w-4 h-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{stats.total_workspaces}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Tổng Chatbots</CardTitle>
                  <Bot className="w-4 h-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{stats.total_chatbots}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Trung bình Chatbot/Workspace</CardTitle>
                  <Layers className="w-4 h-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">
                    {stats.avg_chatbots_per_workspace?.toFixed(2) ?? "—"}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* ── Recent activity ───────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Workspaces */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <LayoutGrid className="w-4 h-4 text-primary" />
                    Workspaces mới tạo
                  </CardTitle>
                  <CardDescription>Trong 7 và 30 ngày gần đây</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-emerald-500" />
                      <span className="text-sm text-muted-foreground">7 ngày qua</span>
                    </div>
                    <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30 text-base px-3 py-0.5">
                      +{stats.workspaces_last_7_days}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-blue-500" />
                      <span className="text-sm text-muted-foreground">30 ngày qua</span>
                    </div>
                    <Badge className="bg-blue-500/15 text-blue-600 border-blue-500/30 text-base px-3 py-0.5">
                      +{stats.workspaces_last_30_days}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Chatbots */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Bot className="w-4 h-4 text-primary" />
                    Chatbots mới tạo
                  </CardTitle>
                  <CardDescription>Trong 7 và 30 ngày gần đây</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-emerald-500" />
                      <span className="text-sm text-muted-foreground">7 ngày qua</span>
                    </div>
                    <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30 text-base px-3 py-0.5">
                      +{stats.chatbots_last_7_days}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-blue-500" />
                      <span className="text-sm text-muted-foreground">30 ngày qua</span>
                    </div>
                    <Badge className="bg-blue-500/15 text-blue-600 border-blue-500/30 text-base px-3 py-0.5">
                      +{stats.chatbots_last_30_days}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
