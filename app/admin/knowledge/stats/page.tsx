"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/stores/auth-store";
import { adminKnowledgeApi, type KnowledgeStatsSummary } from "@/lib/api";
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
  BookOpen,
  FileText,
  HardDrive,
  TrendingUp,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

function formatBytes(raw: string | number): string {
  const bytes = typeof raw === "string" ? parseInt(raw, 10) : raw;
  if (isNaN(bytes) || bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${units[i]}`;
}

interface DonutSlice {
  name: string;
  value: number;
  color: string;
}

function DonutChart({
  data,
  total,
}: {
  data: DonutSlice[];
  total: number;
}) {
  const filtered = data.filter((d) => d.value > 0);
  const display =
    filtered.length > 0
      ? filtered
      : [{ name: "Không có", value: 1, color: "#e2e8f0" }];

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative w-full" style={{ height: 180 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={display}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={78}
              paddingAngle={filtered.length > 1 ? 3 : 0}
              dataKey="value"
              strokeWidth={0}
            >
              {display.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(v: number, n: string) => [`${v}`, n]}
              contentStyle={{ borderRadius: "8px", fontSize: "12px", padding: "6px 10px" }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-2xl font-bold">{total}</span>
          <span className="text-xs text-muted-foreground">knowledge</span>
        </div>
      </div>
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

export default function AdminKnowledgeStatsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, isSystemAdmin } = useAuth();
  const [stats, setStats] = useState<KnowledgeStatsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      router.replace("/auth/login?redirect=/admin/knowledge/stats");
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
    adminKnowledgeApi
      .getStatsSummary()
      .then(setStats)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [isSystemAdmin]);

  const statusDonut: DonutSlice[] = stats
    ? [
        { name: "Đang hoạt động", value: stats.by_status?.active ?? 0, color: "#10b981" },
        { name: "Đang index", value: stats.by_status?.indexing ?? 0, color: "#f59e0b" },
        { name: "Lỗi", value: stats.by_status?.error ?? 0, color: "#ef4444" },
      ]
    : [];

  const retry = () => {
    setLoading(true);
    setError(false);
    adminKnowledgeApi
      .getStatsSummary()
      .then(setStats)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
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
              Thống kê Knowledge Base
            </h1>
            <p className="text-sm text-muted-foreground">
              Tổng quan knowledge và documents toàn hệ thống
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
              <button className="underline text-primary" onClick={retry}>
                Thử lại
              </button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* ── Top counts ──────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Tổng Knowledge Bases</CardTitle>
                  <BookOpen className="w-4 h-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{stats.total_knowledge_bases}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Tổng Documents</CardTitle>
                  <FileText className="w-4 h-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{stats.total_documents}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Tổng dung lượng</CardTitle>
                  <HardDrive className="w-4 h-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{formatBytes(stats.total_size)}</p>
                </CardContent>
              </Card>
            </div>

            {/* ── Status donut + Recent ──────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Phân bổ theo trạng thái</CardTitle>
                  <CardDescription>Knowledge Bases phân loại theo tình trạng hiện tại</CardDescription>
                </CardHeader>
                <CardContent>
                  <DonutChart data={statusDonut} total={stats.total_knowledge_bases} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <BookOpen className="w-4 h-4 text-primary" />
                    Knowledge Bases mới tạo
                  </CardTitle>
                  <CardDescription>Trong 7 và 30 ngày gần đây</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 pt-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-emerald-500" />
                      <span className="text-sm text-muted-foreground">7 ngày qua</span>
                    </div>
                    <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30 text-base px-3 py-0.5">
                      +{stats.knowledge_last_7_days}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-blue-500" />
                      <span className="text-sm text-muted-foreground">30 ngày qua</span>
                    </div>
                    <Badge className="bg-blue-500/15 text-blue-600 border-blue-500/30 text-base px-3 py-0.5">
                      +{stats.knowledge_last_30_days}
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
