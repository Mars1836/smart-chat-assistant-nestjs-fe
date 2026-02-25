"use client";

import { useState, useRef } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Upload, FileJson, ClipboardPaste, AlertCircle } from "lucide-react";
import {
  workspaceToolsApi,
  toolActionsApi,
  type CreateCustomToolDto,
  type CreateToolActionDto,
} from "@/lib/api";

/** Shape of plugin JSON that user can import (file or paste) */
export interface ImportPluginJson {
  name: string;
  display_name: string;
  description?: string;
  category?: string;
  is_enabled?: boolean;
  executor_type?: string;
  executor_config?: {
    base_url?: string;
  };
  auth_config?: {
    type?: "none" | "api_key" | "oauth2";
    api_key?: {
      header_name?: string;
      param_name?: string;
      value?: string;
    };
  };
  actions?: ImportPluginAction[];
}

export interface ImportPluginAction {
  name: string;
  display_name: string;
  description?: string;
  parameters?: Record<string, unknown>;
  executor_config?: {
    method?: string;
    endpoint?: string;
    params?: Record<string, unknown>;
  };
  sort_order?: number;
  is_enabled?: boolean;
  card_config?: {
    enabled?: boolean;
    list_path?: string;
    field_mapping?: {
      title?: string;
      url?: string;
      imageUrl?: string;
      description?: string;
    };
  } | null;
}

interface ImportPluginDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
  onImported: () => void;
}

function parseImportJson(raw: string): ImportPluginJson | null {
  try {
    const parsed = JSON.parse(raw) as ImportPluginJson;
    if (!parsed.name || typeof parsed.name !== "string") return null;
    if (!parsed.display_name || typeof parsed.display_name !== "string") return null;
    const baseUrl = parsed.executor_config?.base_url;
    if (typeof baseUrl !== "string" || !baseUrl.trim()) return null;
    return parsed;
  } catch {
    return null;
  }
}

function mapImportToCreateCustomDto(json: ImportPluginJson): CreateCustomToolDto {
  const executorType =
    json.executor_type === "generic_api" || json.executor_type === "http_api"
      ? "http_api"
      : "http_api";
  const baseUrl = json.executor_config?.base_url ?? "";

  let auth_config: CreateCustomToolDto["auth_config"] = undefined;
  if (json.auth_config?.type === "api_key" && json.auth_config?.api_key) {
    auth_config = {
      type: "api_key",
      api_key: {
        header_name: json.auth_config.api_key.header_name ?? "X-API-Key",
        value: json.auth_config.api_key.value,
      },
    };
  }

  return {
    name: json.name.trim(),
    display_name: json.display_name.trim(),
    description: json.description?.trim() ?? "",
    executor_type: executorType as "http_api",
    executor_config: { base_url: baseUrl },
    auth_config,
  };
}

function mapImportActionToDto(
  a: ImportPluginAction
): CreateToolActionDto {
  const dto: CreateToolActionDto = {
    name: a.name,
    display_name: a.display_name,
    description: a.description ?? "",
    parameters: a.parameters as CreateToolActionDto["parameters"],
    executor_config: a.executor_config
      ? {
          method: (a.executor_config.method ?? "GET") as "GET" | "POST" | "PUT" | "DELETE" | "PATCH",
          endpoint: a.executor_config.endpoint ?? "",
          params: a.executor_config.params,
        }
      : undefined,
    sort_order: a.sort_order ?? 0,
    is_enabled: a.is_enabled !== false,
  };

  // Gửi card_config rõ ràng để backend lưu (object sạch, bỏ undefined)
  if (a.card_config != null && a.card_config.enabled !== false) {
    const fm = a.card_config.field_mapping;
    const hasFieldMapping =
      fm && typeof fm === "object" && Object.keys(fm).length > 0;
    const cardConfig: NonNullable<CreateToolActionDto["card_config"]> = {
      enabled: true,
    };
    const listPath = a.card_config.list_path?.trim();
    if (listPath) cardConfig.list_path = listPath;
    if (hasFieldMapping && fm) cardConfig.field_mapping = { ...fm };
    dto.card_config = cardConfig;
  }

  return dto;
}

export function ImportPluginDialog({
  open,
  onOpenChange,
  workspaceId,
  onImported,
}: ImportPluginDialogProps) {
  const [loading, setLoading] = useState(false);
  const [pasteValue, setPasteValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateAndGetJson = (): ImportPluginJson | null => {
    setError(null);
    const raw = pasteValue.trim();
    if (!raw) {
      setError("Vui lòng dán nội dung JSON hoặc chọn file.");
      return null;
    }
    const parsed = parseImportJson(raw);
    if (!parsed) {
      setError(
        "JSON không hợp lệ. Cần có name, display_name và executor_config.base_url."
      );
      return null;
    }
    if (!/^[a-z0-9_]+$/.test(parsed.name)) {
      setError("name chỉ được chứa chữ thường, số và dấu gạch dưới.");
      return null;
    }
    return parsed;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;
      setPasteValue(text);
      const parsed = parseImportJson(text);
      if (!parsed) {
        setError("File JSON không đúng định dạng. Cần name, display_name và executor_config.base_url.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleImport = async () => {
    const json = validateAndGetJson();
    if (!json) return;

    try {
      setLoading(true);
      setError(null);

      const toolPayload = mapImportToCreateCustomDto(json);
      const created = await workspaceToolsApi.createCustom(workspaceId, toolPayload);

      const actions = json.actions ?? [];
      const sorted = [...actions].sort(
        (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
      );
      for (const action of sorted) {
        const payload = mapImportActionToDto(action);
        const createdAction = await toolActionsApi.create(created.id, payload);
        // Một số backend chỉ lưu card_config khi PATCH; gửi lại card_config qua update
        if (payload.card_config != null) {
          try {
            await toolActionsApi.update(created.id, createdAction.id, {
              card_config: payload.card_config,
            });
          } catch (_) {
            // Bỏ qua nếu update thất bại (vd backend không hỗ trợ PATCH card_config)
          }
        }
      }

      toast.success(
        `Đã import plugin "${created.display_name}"${actions.length ? ` với ${actions.length} action(s).` : "."}`
      );
      onOpenChange(false);
      setPasteValue("");
      onImported();
    } catch (err: any) {
      console.error("Import plugin error:", err);
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Không thể import plugin.";
      setError(msg);
      toast.error("Lỗi import plugin", { description: msg });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      setPasteValue("");
      setError(null);
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[640px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Import Custom Plugin
          </DialogTitle>
          <DialogDescription>
            Import plugin từ file JSON hoặc dán nội dung JSON (có name, display_name, executor_config, actions).
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="paste" className="flex-1 min-h-0 flex flex-col">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="paste" className="gap-2">
              <ClipboardPaste className="w-4 h-4" />
              Dán JSON
            </TabsTrigger>
            <TabsTrigger value="file" className="gap-2">
              <FileJson className="w-4 h-4" />
              Chọn file
            </TabsTrigger>
          </TabsList>
          <TabsContent value="paste" className="mt-4 flex-1 min-h-0 flex flex-col">
            <Label className="text-muted-foreground text-sm">
              Dán nội dung JSON plugin (ví dụ: name, display_name, executor_config.base_url, actions)
            </Label>
            <Textarea
              placeholder='{"name": "shop_watch", "display_name": "Shop đồng hồ", "executor_config": {"base_url": "http://localhost:5000"}, "actions": [...]}'
              value={pasteValue}
              onChange={(e) => {
                setPasteValue(e.target.value);
                setError(null);
              }}
              className="mt-2 min-h-[240px] font-mono text-sm resize-y"
            />
          </TabsContent>
          <TabsContent value="file" className="mt-4 flex-1 min-h-0 flex flex-col">
            <Label className="text-muted-foreground text-sm">
              Chọn file .json chứa định nghĩa plugin
            </Label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleFileChange}
              className="mt-2 hidden"
            />
            <Button
              type="button"
              variant="outline"
              className="mt-2 gap-2"
              onClick={() => fileInputRef.current?.click()}
            >
              <FileJson className="w-4 h-4" />
              Chọn file JSON
            </Button>
            {pasteValue && (
              <Textarea
                readOnly
                value={pasteValue}
                className="mt-3 min-h-[180px] font-mono text-sm resize-y bg-muted/50"
              />
            )}
          </TabsContent>
        </Tabs>

        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleClose(false)}
            disabled={loading}
          >
            Hủy
          </Button>
          <Button onClick={handleImport} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Đang import...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Import
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
