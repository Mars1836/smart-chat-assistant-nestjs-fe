"use client";

import { AppLayout } from "@/components/app-layout";
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
import { Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { llmModelsApi, type LlmModelPricingItem } from "@/lib/api";

function formatPrice(s: string): string {
  const n = parseFloat(s);
  if (Number.isNaN(n)) return s;
  return n.toLocaleString("vi-VN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 6,
  });
}

function providerLabel(p: string): string {
  const map: Record<string, string> = {
    gemini: "Gemini",
    openai: "OpenAI",
  };
  return map[p] ?? p;
}

export default function PricingPage() {
  const [items, setItems] = useState<LlmModelPricingItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    llmModelsApi
      .getPricing()
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  const byProvider = items.reduce<Record<string, LlmModelPricingItem[]>>(
    (acc, item) => {
      const p = item.provider || "other";
      if (!acc[p]) acc[p] = [];
      acc[p].push(item);
      return acc;
    },
    {}
  );
  const providerOrder = ["gemini", "openai", ...Object.keys(byProvider).filter((k) => !["gemini", "openai"].includes(k))];

  return (
    <AppLayout activeModule="pricing">
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Bảng giá token
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Giá tham khảo theo model (per 1K tokens). Input / Output.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : items.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Chưa có dữ liệu bảng giá.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {providerOrder.filter((p) => byProvider[p]?.length).map((provider) => (
              <Card key={provider}>
                <CardHeader>
                  <CardTitle>{providerLabel(provider)}</CardTitle>
                  <CardDescription>
                    Các model thuộc {providerLabel(provider)}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Model</TableHead>
                        <TableHead className="text-right">
                          Giá input (/1K token)
                        </TableHead>
                        <TableHead className="text-right">
                          Giá output (/1K token)
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {byProvider[provider].map((row) => (
                        <TableRow key={row.id}>
                          <TableCell className="font-medium">
                            {row.display_name || row.model}
                          </TableCell>
                          <TableCell className="text-right font-mono text-muted-foreground">
                            {formatPrice(row.price_per_1k_input_tokens)}
                          </TableCell>
                          <TableCell className="text-right font-mono text-muted-foreground">
                            {formatPrice(row.price_per_1k_output_tokens)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
