"use client";

import { useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Plus, Globe } from "lucide-react";
import { workspaceToolsApi, type CreateCustomToolDto } from "@/lib/api";

interface CreateToolDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
  onToolCreated: () => void;
}

export function CreateToolDialog({
  open,
  onOpenChange,
  workspaceId,
  onToolCreated,
}: CreateToolDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateCustomToolDto>({
    name: "",
    display_name: "",
    description: "",
    executor_type: "http_api",
    executor_config: {
      method: "GET",
      endpoint: "",
    },
    auth_config: {
      type: "api_key",
      api_key: {
        header_name: "X-API-Key",
        value: "",
      },
    },
  });

  const [authType, setAuthType] = useState<"none" | "api_key">("none");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.display_name || !formData.executor_config.endpoint) {
      toast.error("Vui lòng điền đầy đủ thông tin bắt buộc");
      return;
    }

    // Validate name format (only lowercase letters, numbers, and underscores)
    if (!/^[a-z0-9_]+$/.test(formData.name)) {
      toast.error("Mã định danh chỉ được chứa chữ thường, số và dấu gạch dưới");
      return;
    }

    try {
      setLoading(true);

      // Prepare payload
      const payload: CreateCustomToolDto = {
        ...formData,
        auth_config: authType === "api_key" ? formData.auth_config : undefined,
      };

      await workspaceToolsApi.createCustom(workspaceId, payload);
      
      toast.success("Tạo tool thành công");
      onOpenChange(false);
      onToolCreated();
      
      // Reset form
      setFormData({
        name: "",
        display_name: "",
        description: "",
        executor_type: "http_api",
        executor_config: {
          method: "GET",
          endpoint: "",
        },
        auth_config: {
          type: "api_key",
          api_key: {
            header_name: "X-API-Key",
            value: "",
          },
        },
      });
      setAuthType("none");
    } catch (err: any) {
      console.error("Error creating tool:", err);
      toast.error("Lỗi tạo tool", {
        description: err?.response?.data?.message || "Unknown error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Tạo Custom Tool
          </DialogTitle>
          <DialogDescription>
            Tạo công cụ mới kết nối đến API bên ngoài.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="display_name">Tên hiển thị <span className="text-destructive">*</span></Label>
                <Input
                  id="display_name"
                  placeholder="Ví dụ: Tra cứu thời tiết"
                  value={formData.display_name}
                  onChange={(e) => {
                    const displayName = e.target.value;
                    // Auto-generate name from display name if name is empty
                    const name = !formData.name 
                      ? displayName.toLowerCase().replace(/[^a-z0-9]/g, "_").replace(/_+/g, "_")
                      : formData.name;
                    
                    setFormData({ ...formData, display_name: displayName, name });
                  }}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Mã định danh (System Name) <span className="text-destructive">*</span></Label>
                <Input
                  id="name"
                  placeholder="my_weather_tool"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
                <p className="text-[10px] text-muted-foreground">Chỉ dùng chữ thường, số và gạch dưới.</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Mô tả</Label>
              <Textarea
                id="description"
                placeholder="Mô tả chức năng của tool này..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>Cấu hình API Endpoint</Label>
              <div className="flex gap-2">
                <Select
                  value={formData.executor_config.method}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      executor_config: { ...formData.executor_config, method: value as any },
                    })
                  }
                >
                  <SelectTrigger className="w-[100px]">
                    <SelectValue placeholder="Method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GET">GET</SelectItem>
                    <SelectItem value="POST">POST</SelectItem>
                    <SelectItem value="PUT">PUT</SelectItem>
                    <SelectItem value="DELETE">DELETE</SelectItem>
                    <SelectItem value="PATCH">PATCH</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  placeholder="https://api.example.com/v1/resource"
                  value={formData.executor_config.endpoint}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      executor_config: { ...formData.executor_config, endpoint: e.target.value },
                    })
                  }
                  required
                  className="flex-1 font-mono text-sm"
                />
              </div>
            </div>

            <div className="space-y-4 border rounded-lg p-4 bg-muted/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-muted-foreground" />
                  <Label>Xác thực</Label>
                </div>
                <Select
                  value={authType}
                  onValueChange={(value) => setAuthType(value as any)}
                >
                  <SelectTrigger className="w-[150px] h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Không xác thực</SelectItem>
                    <SelectItem value="api_key">API Key</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {authType === "api_key" && formData.auth_config?.api_key && (
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="space-y-2">
                    <Label className="text-xs">Header Name</Label>
                    <Input
                      value={formData.auth_config.api_key.header_name}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          auth_config: {
                            ...formData.auth_config!,
                            api_key: {
                              ...formData.auth_config!.api_key,
                              header_name: e.target.value,
                            },
                          },
                        })
                      }
                      placeholder="X-API-Key"
                      className="h-8 text-xs font-mono"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Default Value (Optional)</Label>
                    <Input
                      type="password"
                      value={formData.auth_config.api_key.value || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          auth_config: {
                            ...formData.auth_config!,
                            api_key: {
                              ...formData.auth_config!.api_key,
                              value: e.target.value,
                            },
                          },
                        })
                      }
                      placeholder="sk_..."
                      className="h-8 text-xs font-mono"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Đang tạo...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Tạo Tool
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
