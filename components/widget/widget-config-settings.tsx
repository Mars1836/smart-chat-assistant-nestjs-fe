"use client";

import { useEffect, useState } from "react";
import { useWorkspace } from "@/lib/stores/workspace-store";
import {
  chatbotsApi,
  type Chatbot,
  type WidgetConfig,
  type WidgetConfigApiDto,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Save, Copy, Check, Code, Eye } from "lucide-react";
import { toast } from "sonner";

interface WidgetConfigSettingsProps {
  chatbotId: string;
}

const DEFAULT_WIDGET_CONFIG: WidgetConfig = {
  enabled: false,
  position: "bottom-right",
  primaryColor: "#4f46e5",
  title: "Hỗ trợ khách hàng",
  greeting: "",
  allowedOrigins: [],
  allowedIps: [],
  publicApiKey: "",
  rateLimitWindowSec: 60,
  rateLimitMaxRequests: 30,
  lang: "vi",
};

export function WidgetConfigSettings({ chatbotId }: WidgetConfigSettingsProps) {
  const { selectedWorkspace } = useWorkspace();
  const [chatbot, setChatbot] = useState<Chatbot | null>(null);
  const [config, setConfig] = useState<WidgetConfig>(DEFAULT_WIDGET_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Environment URLs
  const browserOrigin =
    typeof window !== "undefined" ? window.location.origin : "";
  const widgetUrl =
    process.env.NEXT_PUBLIC_WIDGET_URL ||
    browserOrigin ||
    "http://localhost:3000";
  const apiUrl =
    process.env.NEXT_PUBLIC_API_URL ||
    (process.env.NODE_ENV === "development"
      ? "http://localhost:4000"
      : browserOrigin);

  useEffect(() => {
    if (selectedWorkspace && chatbotId) {
      loadChatbot();
    }
  }, [selectedWorkspace, chatbotId]);

  // Inject real widget.js when preview is enabled
  useEffect(() => {
    if (!showPreview) {
      // Remove widget when preview is disabled
      const existingScript = document.getElementById('scw-preview-script');
      const existingContainer = document.querySelector('.scw-widget-container');
      if (existingScript) existingScript.remove();
      if (existingContainer) existingContainer.remove();
      (window as any).__SmartChatWidget = false;
      return;
    }

    // Add widget script
    const script = document.createElement('script');
    script.id = 'scw-preview-script';
    script.src = `${widgetUrl}/widget.js`;
    script.setAttribute('data-chatbot-id', chatbotId);
    script.setAttribute('data-api-base', apiUrl);
    script.setAttribute('data-position', config.position);
    script.setAttribute('data-color', config.primaryColor);
    script.setAttribute('data-lang', config.lang);
    if (config.publicApiKey) {
      script.setAttribute('data-widget-key', config.publicApiKey);
    }
    document.body.appendChild(script);

    return () => {
      const existingScript = document.getElementById('scw-preview-script');
      const existingContainer = document.querySelector('.scw-widget-container');
      if (existingScript) existingScript.remove();
      if (existingContainer) existingContainer.remove();
      (window as any).__SmartChatWidget = false;
    };
  }, [showPreview, config.position, config.primaryColor, config.lang, widgetUrl, apiUrl, chatbotId]);

  const loadChatbot = async () => {
    if (!selectedWorkspace) return;
    try {
      setLoading(true);
      const data = await chatbotsApi.get(selectedWorkspace.id, chatbotId);
      setChatbot(data);
      if (data.widget_config) {
        const raw = data.widget_config as any;
        const ui = raw.ui || {};
        const sec = raw.security || {};

        // Ưu tiên dùng cấu trúc ui/security mới; fallback về field cũ nếu còn tồn tại
        setConfig({
          enabled:
            ui.enabled ??
            raw.enabled ??
            DEFAULT_WIDGET_CONFIG.enabled,
          position:
            ui.position ??
            raw.position ??
            DEFAULT_WIDGET_CONFIG.position,
          primaryColor:
            ui.primaryColor ??
            raw.primaryColor ??
            DEFAULT_WIDGET_CONFIG.primaryColor,
          title:
            ui.title ??
            raw.title ??
            DEFAULT_WIDGET_CONFIG.title,
          greeting:
            (ui.greeting ??
              raw.greeting ??
              (data.greeting_message || DEFAULT_WIDGET_CONFIG.greeting)),
          lang:
            ui.lang ??
            raw.lang ??
            DEFAULT_WIDGET_CONFIG.lang,
          allowedOrigins:
            sec.allowed_origins ??
            raw.allowedOrigins ??
            DEFAULT_WIDGET_CONFIG.allowedOrigins,
          allowedIps:
            sec.allowed_ips ??
            raw.allowedIps ??
            DEFAULT_WIDGET_CONFIG.allowedIps,
          publicApiKey:
            sec.public_api_key ??
            raw.publicApiKey ??
            DEFAULT_WIDGET_CONFIG.publicApiKey,
          rateLimitWindowSec:
            sec.rate_limit_window_sec ??
            raw.rateLimitWindowSec ??
            DEFAULT_WIDGET_CONFIG.rateLimitWindowSec,
          rateLimitMaxRequests:
            sec.rate_limit_max_requests ??
            raw.rateLimitMaxRequests ??
            DEFAULT_WIDGET_CONFIG.rateLimitMaxRequests,
        });
      } else {
        // Use greeting_message as default nếu chưa có widget_config
        setConfig({
          ...DEFAULT_WIDGET_CONFIG,
          greeting: data.greeting_message || "",
        });
      }
    } catch (error) {
      console.error(error);
      toast.error("Không thể tải cấu hình widget");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!selectedWorkspace || !chatbot) return;
    try {
      setSaving(true);
      const body: WidgetConfigApiDto = {
        ui: {
          enabled: config.enabled,
          position: config.position,
          primaryColor: config.primaryColor,
          title: config.title,
          greeting: config.greeting,
          lang: config.lang,
        },
        security: {
          enabled: config.enabled,
          allowed_origins: config.allowedOrigins,
          allowed_ips: config.allowedIps || [],
          public_api_key: config.publicApiKey ?? null,
          rate_limit_window_sec: config.rateLimitWindowSec ?? null,
          rate_limit_max_requests: config.rateLimitMaxRequests ?? null,
        },
      };

      await chatbotsApi.updateWidgetConfig(
        selectedWorkspace.id,
        chatbotId,
        body
      );
      toast.success("Lưu cấu hình widget thành công");
    } catch (error) {
      console.error(error);
      toast.error("Không thể lưu cấu hình widget");
    } finally {
      setSaving(false);
    }
  };

  const handleOriginsChange = (value: string) => {
    const origins = value
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
    setConfig({ ...config, allowedOrigins: origins });
  };

  const handleIpsChange = (value: string) => {
    const ips = value
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
    setConfig({ ...config, allowedIps: ips });
  };

  const getScriptSnippet = () => {
    return `<script
  src="${widgetUrl}/widget.js"
  data-chatbot-id="${chatbotId}"
  data-api-base="${apiUrl}"
  data-position="${config.position}"
  data-color="${config.primaryColor}"
  data-lang="${config.lang}"${
    config.publicApiKey ? `\n  data-widget-key="${config.publicApiKey}"` : ""
  }
></script>`;
  };

  // Framework code snippets
  type FrameworkType = 'html' | 'react' | 'vue' | 'angular';
  const [selectedFramework, setSelectedFramework] = useState<FrameworkType>('html');

  const getReactSnippet = () => {
    return `import { useEffect } from 'react';

function App() {
  useEffect(() => {
    const script = document.createElement('script');
    script.src = '${widgetUrl}/widget.js';
    script.setAttribute('data-chatbot-id', '${chatbotId}');
    script.setAttribute('data-api-base', '${apiUrl}');
    script.setAttribute('data-position', '${config.position}');
    script.setAttribute('data-color', '${config.primaryColor}');
    script.setAttribute('data-lang', '${config.lang}');
    ${config.publicApiKey ? "script.setAttribute('data-widget-key', '" + config.publicApiKey + "');" : ""}
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
      window.__SmartChatWidget = false;
    };
  }, []);

  return <div>Your app content</div>;
}`;
  };

  const getVueSnippet = () => {
    return `<script setup>
import { onMounted, onUnmounted } from 'vue';

let scriptEl = null;

onMounted(() => {
  scriptEl = document.createElement('script');
  scriptEl.src = '${widgetUrl}/widget.js';
  scriptEl.setAttribute('data-chatbot-id', '${chatbotId}');
  scriptEl.setAttribute('data-api-base', '${apiUrl}');
  scriptEl.setAttribute('data-position', '${config.position}');
  scriptEl.setAttribute('data-color', '${config.primaryColor}');
  scriptEl.setAttribute('data-lang', '${config.lang}');
  ${config.publicApiKey ? "scriptEl.setAttribute('data-widget-key', '" + config.publicApiKey + "');" : ""}
  document.body.appendChild(scriptEl);
});

onUnmounted(() => {
  if (scriptEl) document.body.removeChild(scriptEl);
  window.__SmartChatWidget = false;
});
</script>`;
  };

  const getAngularSnippet = () => {
    return `import { Component, OnInit, OnDestroy, Renderer2, Inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';

@Component({
  selector: 'app-root',
  template: '<router-outlet></router-outlet>'
})
export class AppComponent implements OnInit, OnDestroy {
  private scriptEl: HTMLScriptElement | null = null;

  constructor(
    private renderer: Renderer2,
    @Inject(DOCUMENT) private document: Document
  ) {}

  ngOnInit() {
    this.scriptEl = this.renderer.createElement('script');
    this.scriptEl.src = '${widgetUrl}/widget.js';
    this.scriptEl.setAttribute('data-chatbot-id', '${chatbotId}');
    this.scriptEl.setAttribute('data-api-base', '${apiUrl}');
    this.scriptEl.setAttribute('data-position', '${config.position}');
    this.scriptEl.setAttribute('data-color', '${config.primaryColor}');
    this.scriptEl.setAttribute('data-lang', '${config.lang}');
    ${config.publicApiKey ? "this.scriptEl.setAttribute('data-widget-key', '" + config.publicApiKey + "');" : ""}
    this.renderer.appendChild(this.document.body, this.scriptEl);
  }

  ngOnDestroy() {
    if (this.scriptEl) {
      this.renderer.removeChild(this.document.body, this.scriptEl);
    }
    (window as any).__SmartChatWidget = false;
  }
}`;
  };

  const getApiCurlSnippet = () => {
    const endpoint = `${apiUrl}/public/widget/${chatbotId}/chat`;
    const hasKey = !!config.publicApiKey;
    const keyLine = hasKey
      ? `  -H "X-Widget-Key: ${config.publicApiKey}" \\\n`
      : "";

    return `curl -X POST "${endpoint}" \\
  -H "Content-Type: application/json" \\
${keyLine}  -d '{
    "message": "Xin chào, cho tôi hỏi...",
    "conversation_id": null,
    "visitorId": "user-123"
  }'`;
  };

  const getCurrentSnippet = () => {
    switch (selectedFramework) {
      case 'react': return getReactSnippet();
      case 'vue': return getVueSnippet();
      case 'angular': return getAngularSnippet();
      default: return getScriptSnippet();
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(getCurrentSnippet());
      setCopied(true);
      toast.success("Đã copy mã nhúng");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("Không thể copy");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Widget cho Website</h3>
          <p className="text-sm text-muted-foreground">
            Cấu hình widget chat để nhúng vào website khách hàng
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          <Save className="w-4 h-4 mr-2" />
          Lưu cấu hình
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configuration Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Cấu hình Widget</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Enable Toggle */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Bật widget cho chatbot này</Label>
                <p className="text-sm text-muted-foreground">
                  Cho phép nhúng widget vào website ngoài
                </p>
              </div>
              <Switch
                checked={config.enabled}
                onCheckedChange={(checked) =>
                  setConfig({ ...config, enabled: checked })
                }
              />
            </div>

            {/* Widget Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Tên widget</Label>
              <Input
                id="title"
                value={config.title}
                onChange={(e) =>
                  setConfig({ ...config, title: e.target.value })
                }
                placeholder="Hỗ trợ khách hàng"
              />
              <p className="text-xs text-muted-foreground">
                Hiển thị trong header của widget
              </p>
            </div>

            {/* Position */}
            <div className="space-y-2">
              <Label>Vị trí nút chat</Label>
              <Select
                value={config.position}
                onValueChange={(value: "bottom-right" | "bottom-left") =>
                  setConfig({ ...config, position: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bottom-right">Góc phải dưới</SelectItem>
                  <SelectItem value="bottom-left">Góc trái dưới</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Primary Color */}
            <div className="space-y-2">
              <Label htmlFor="color">Màu chủ đạo</Label>
              <div className="flex gap-2">
                <Input
                  id="color"
                  type="color"
                  value={config.primaryColor}
                  onChange={(e) =>
                    setConfig({ ...config, primaryColor: e.target.value })
                  }
                  className="w-14 h-10 p-1 cursor-pointer"
                />
                <Input
                  value={config.primaryColor}
                  onChange={(e) =>
                    setConfig({ ...config, primaryColor: e.target.value })
                  }
                  placeholder="#4f46e5"
                  className="flex-1"
                />
              </div>
            </div>

            {/* Greeting Message */}
            <div className="space-y-2">
              <Label htmlFor="greeting">Tin nhắn chào trong widget</Label>
              <Textarea
                id="greeting"
                value={config.greeting}
                onChange={(e) =>
                  setConfig({ ...config, greeting: e.target.value })
                }
                placeholder="Xin chào, tôi có thể giúp gì?"
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                Để trống sẽ dùng tin nhắn chào mặc định của chatbot
              </p>
            </div>

            {/* Language */}
            <div className="space-y-2">
              <Label>Ngôn ngữ giao diện widget</Label>
              <Select
                value={config.lang}
                onValueChange={(value: "vi" | "en") =>
                  setConfig({ ...config, lang: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vi">Tiếng Việt</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Allowed Origins */}
            <div className="space-y-2">
              <Label htmlFor="origins">Danh sách domain được phép nhúng</Label>
              <Textarea
                id="origins"
                value={config.allowedOrigins.join("\n")}
                onChange={(e) => handleOriginsChange(e.target.value)}
                placeholder="https://example.com&#10;https://shop.mydomain.com"
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                Mỗi domain trên một dòng. Backend sẽ kiểm tra origin thực tế của website theo whitelist này.
              </p>
            </div>

            {/* Allowed IPs */}
            <div className="space-y-2">
              <Label htmlFor="ips">Danh sách IP được phép gọi (tùy chọn)</Label>
              <Textarea
                id="ips"
                value={(config.allowedIps || []).join("\n")}
                onChange={(e) => handleIpsChange(e.target.value)}
                placeholder="1.2.3.4&#10;5.6.7.8"
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                Mỗi IP trên một dòng. Để trống cho phép mọi IP (sẽ vẫn kiểm tra domain nếu bạn cấu hình).
              </p>
            </div>

            {/* Public API key */}
            <div className="space-y-2">
              <Label htmlFor="api-key">Public API key cho widget (X-Widget-Key)</Label>
              <Input
                id="api-key"
                value={config.publicApiKey || ""}
                onChange={(e) =>
                  setConfig({ ...config, publicApiKey: e.target.value })
                }
                placeholder="pub_widget_xxx"
              />
              <p className="text-xs text-muted-foreground">
                Tùy chọn bổ sung nếu backend của bạn đang bật kiểm tra <code>X-Widget-Key</code>.
              </p>
            </div>

            {/* Rate limit (theo IP, backend mặc định) */}
            <div className="space-y-3">
              <Label>Rate limit (theo IP)</Label>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="rl-window" className="text-xs">
                    Cửa sổ (giây)
                  </Label>
                  <Input
                    id="rl-window"
                    type="number"
                    min={1}
                    value={config.rateLimitWindowSec ?? ""}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        rateLimitWindowSec:
                          e.target.value === "" ? null : Number(e.target.value),
                      })
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="rl-max" className="text-xs">
                    Số request tối đa
                  </Label>
                  <Input
                    id="rl-max"
                    type="number"
                    min={1}
                    value={config.rateLimitMaxRequests ?? ""}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        rateLimitMaxRequests:
                          e.target.value === "" ? null : Number(e.target.value),
                      })
                    }
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Backend mặc định giới hạn theo IP (HTTP 429 khi vượt quá).
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Script Snippet and Preview */}
        <div className="space-y-6">
          {/* Script Snippet */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Code className="w-4 h-4" />
                  Mã nhúng
                </CardTitle>
                <Button variant="outline" size="sm" onClick={handleCopy}>
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Đã copy
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-2" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Framework Tabs */}
              <div className="flex gap-1 p-1 bg-muted rounded-lg">
                {[
                  { id: 'html' as FrameworkType, label: 'HTML', icon: '🌐' },
                  { id: 'react' as FrameworkType, label: 'React', icon: '⚛️' },
                  { id: 'vue' as FrameworkType, label: 'Vue', icon: '💚' },
                  { id: 'angular' as FrameworkType, label: 'Angular', icon: '🅰️' },
                ].map((fw) => (
                  <button
                    key={fw.id}
                    onClick={() => setSelectedFramework(fw.id)}
                    className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-all ${
                      selectedFramework === fw.id
                        ? 'bg-background shadow-sm text-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <span className="mr-1">{fw.icon}</span>
                    {fw.label}
                  </button>
                ))}
              </div>

              {/* Description */}
              <p className="text-sm text-muted-foreground">
                {selectedFramework === 'html' && (
                  <>Thêm đoạn mã sau vào website của bạn, trước thẻ <code className="bg-muted px-1 rounded">&lt;/body&gt;</code></>
                )}
                {selectedFramework === 'react' && (
                  <>Thêm đoạn mã sau vào component chính của ứng dụng React</>
                )}
                {selectedFramework === 'vue' && (
                  <>Thêm đoạn mã sau vào App.vue hoặc layout component</>
                )}
                {selectedFramework === 'angular' && (
                  <>Thêm đoạn mã sau vào app.component.ts</>
                )}
              </p>

              {/* Code Snippet */}
              <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto max-h-80">
                <code>{getCurrentSnippet()}</code>
              </pre>
            </CardContent>
          </Card>

          {/* Live Preview */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  Preview trực tiếp
                </CardTitle>
                <Button
                  variant={showPreview ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowPreview(!showPreview)}
                >
                  {showPreview ? "Tắt Preview" : "Bật Preview"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {showPreview ? (
                <div className="bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 px-4 py-3 rounded-lg text-sm">
                  ✅ Widget đang hiển thị ở góc {config.position === "bottom-right" ? "phải" : "trái"} dưới màn hình.
                  Click vào nút chat để thử nghiệm!
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Bật Preview để xem widget thực tế xuất hiện ở góc màn hình như khi nhúng vào website.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Public API integration guide for developers */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">API tích hợp chatbot vào website khác</CardTitle>
              <CardDescription>
                Chia sẻ thông tin dưới đây cho developer để gọi chatbot này từ hệ thống khác.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1 text-sm">
                <p className="font-medium">Widget config API</p>
                <code className="px-2 py-1 rounded bg-muted text-xs block">
                  GET {apiUrl}/public/widget/config/{chatbotId}
                </code>
              </div>

              <div className="space-y-1 text-sm">
                <p className="font-medium">Public chat API</p>
                <code className="px-2 py-1 rounded bg-muted text-xs block">
                  POST {apiUrl}/public/widget/{chatbotId}/chat
                </code>
              </div>

              <div className="space-y-2 text-sm">
                <p className="font-medium">Integration info</p>
                <ul className="text-xs text-muted-foreground space-y-1 list-disc pl-4">
                  <li>
                    <span className="font-medium text-foreground">Backend URL:</span>{" "}
                    {apiUrl}
                  </li>
                  <li>
                    <span className="font-medium text-foreground">Chatbot ID:</span>{" "}
                    {chatbot?.id}
                  </li>
                  <li>
                    <span className="font-medium text-foreground">Widget API Key:</span>{" "}
                    {config.publicApiKey ? config.publicApiKey : "Not enabled"}
                  </li>
                  <li>
                    <span className="font-medium text-foreground">Allowed origins:</span>{" "}
                    {config.allowedOrigins.length > 0
                      ? config.allowedOrigins.join(", ")
                      : "No whitelist configured"}
                  </li>
                </ul>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Request example (cURL)</p>
                <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto max-h-80">
                  <code>{getApiCurlSnippet()}</code>
                </pre>
              </div>

              <p className="text-xs text-muted-foreground">
                Backend checks the real website origin and IP against <code>allowed_origins</code> and <code>allowed_ips</code>.
                Because chatbot ID is now in the URL, the backend can resolve CORS and security rules per chatbot during preflight.
                If your backend still uses an API key, the widget can also send <code>X-Widget-Key</code>. Store <code>conversation_id</code>
                to keep visitor chat context.
              </p>
            </CardContent>
          </Card>

          {/* Status Info */}
          {!config.enabled && (
            <div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-600 dark:text-yellow-400 px-4 py-3 rounded-lg text-sm">
              ⚠️ Widget đang tắt. Bật widget để cho phép nhúng vào website.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}



