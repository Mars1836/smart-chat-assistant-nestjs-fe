"use client";

import { useEffect, useState } from "react";
import { useWorkspace } from "@/lib/stores/workspace-store";
import { chatbotsApi, type Chatbot, type WidgetConfig } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  const widgetUrl = process.env.NEXT_PUBLIC_WIDGET_URL || "http://localhost:3000";
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

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
    script.setAttribute('data-widget-origin', widgetUrl);
    script.setAttribute('data-api-base', apiUrl);
    script.setAttribute('data-position', config.position);
    script.setAttribute('data-color', config.primaryColor);
    script.setAttribute('data-lang', config.lang);
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
        setConfig(data.widget_config);
      } else {
        // Use greeting_message as default if widget greeting is empty
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
      await chatbotsApi.update(selectedWorkspace.id, chatbotId, {
        widget_config: config,
      });
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

  const getScriptSnippet = () => {
    return `<script
  src="${widgetUrl}/widget.js"
  data-chatbot-id="${chatbotId}"
  data-widget-origin="${widgetUrl}"
  data-api-base="${apiUrl}"
  data-position="${config.position}"
  data-color="${config.primaryColor}"
  data-lang="${config.lang}"
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
    script.setAttribute('data-widget-origin', '${widgetUrl}');
    script.setAttribute('data-api-base', '${apiUrl}');
    script.setAttribute('data-position', '${config.position}');
    script.setAttribute('data-color', '${config.primaryColor}');
    script.setAttribute('data-lang', '${config.lang}');
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
  scriptEl.setAttribute('data-widget-origin', '${widgetUrl}');
  scriptEl.setAttribute('data-api-base', '${apiUrl}');
  scriptEl.setAttribute('data-position', '${config.position}');
  scriptEl.setAttribute('data-color', '${config.primaryColor}');
  scriptEl.setAttribute('data-lang', '${config.lang}');
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
    this.scriptEl.setAttribute('data-widget-origin', '${widgetUrl}');
    this.scriptEl.setAttribute('data-api-base', '${apiUrl}');
    this.scriptEl.setAttribute('data-position', '${config.position}');
    this.scriptEl.setAttribute('data-color', '${config.primaryColor}');
    this.scriptEl.setAttribute('data-lang', '${config.lang}');
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
                Mỗi domain trên một dòng. Để trống cho phép tất cả domain.
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
