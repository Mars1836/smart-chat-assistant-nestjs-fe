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
  translateTemplate,
  useLanguage,
} from "@/components/providers/language-provider";
import {
  workspacesApi,
  type BillingTransaction,
} from "@/lib/api";
import { toast } from "sonner";

function formatAmount(amount: string, locale: "vi" | "en"): string {
  const n = parseFloat(amount);
  if (Number.isNaN(n)) return amount;
  const formatted = new Intl.NumberFormat(locale === "vi" ? "vi-VN" : "en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(n);
  return n >= 0 ? `+${formatted}` : formatted;
}

function typeLabel(type: string, t: (key: string) => string): string {
  const map: Record<string, string> = {
    topup: t("billing.type.topup"),
    usage: t("billing.type.usage"),
    refund: t("billing.type.refund"),
    adjustment: t("billing.type.adjustment"),
  };
  return map[type] ?? type;
}

export default function BillingPage() {
  const { selectedWorkspace } = useWorkspace();
  const { t, locale } = useLanguage();
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
          toast.error(t("billing.loadError"));
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
            {t("billing.title")}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {t("billing.description")}
          </p>
        </div>

        {!canView && (
          <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-800">
            <CardContent className="pt-6">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                {t("billing.ownerOnly")}
              </p>
            </CardContent>
          </Card>
        )}

        {canView && forbidden && (
          <Card className="border-destructive/50 bg-destructive/5">
            <CardContent className="pt-6">
              <p className="text-sm text-destructive">
                {t("billing.forbidden")}
              </p>
            </CardContent>
          </Card>
        )}

        {canView && !forbidden && (
          <Card>
            <CardHeader>
              <CardTitle>{t("billing.transactions")}</CardTitle>
              <CardDescription>
                {t("billing.transactionTypes")}
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
                    <SelectValue placeholder={t("billing.typePlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("billing.all")}</SelectItem>
                    <SelectItem value="topup">{t("billing.type.topup")}</SelectItem>
                    <SelectItem value="usage">{t("billing.type.usage")}</SelectItem>
                    <SelectItem value="refund">{t("billing.type.refund")}</SelectItem>
                    <SelectItem value="adjustment">{t("billing.type.adjustment")}</SelectItem>
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
                        <TableHead>{t("billing.time")}</TableHead>
                        <TableHead>{t("billing.member")}</TableHead>
                        <TableHead>{t("billing.type")}</TableHead>
                        <TableHead className="text-right">{t("billing.credit")}</TableHead>
                        <TableHead>{t("billing.descriptionCol")}</TableHead>
                        <TableHead className="text-right">{t("billing.inputTokens")}</TableHead>
                        <TableHead className="text-right">{t("billing.outputTokens")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={7}
                            className="text-center text-muted-foreground py-8"
                          >
                            {t("billing.noTransactions")}
                          </TableCell>
                        </TableRow>
                      ) : (
                        transactions.map((tx) => (
                          <TableRow key={tx.id}>
                            <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                              {new Date(tx.created_at).toLocaleString(
                                locale === "vi" ? "vi-VN" : "en-US"
                              )}
                            </TableCell>
                            <TableCell className="text-sm">
                              {tx.user
                                ? tx.user.name || tx.user.email || "—"
                                : t("billing.guest")}
                            </TableCell>
                            <TableCell>{typeLabel(tx.type, t)}</TableCell>
                            <TableCell
                              className={`text-right font-mono ${
                                parseFloat(tx.amount) >= 0
                                  ? "text-green-600 dark:text-green-400"
                                  : "text-red-600 dark:text-red-400"
                              }`}
                            >
                              {formatAmount(tx.amount, locale)}
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
                        {translateTemplate(t("billing.pageInfo"), {
                          page: meta.page,
                          totalPages: meta.totalPages,
                          total: meta.total,
                        })}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={page <= 1}
                          onClick={() => setPage((p) => p - 1)}
                        >
                          {t("billing.previous")}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={page >= meta.totalPages}
                          onClick={() => setPage((p) => p + 1)}
                        >
                          {t("billing.next")}
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
