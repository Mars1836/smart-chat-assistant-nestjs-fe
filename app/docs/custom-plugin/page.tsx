"use client";

import Link from "next/link";
import { AppLayout } from "@/components/app-layout";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useLanguage } from "@/components/providers/language-provider";

function DocTable({
  headers,
  rows,
}: {
  headers: string[];
  rows: string[][];
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border my-4">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-muted/50">
            {headers.map((h) => (
              <th
                key={h}
                className="text-left font-semibold p-3 border-b border-border"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-border last:border-0">
              {row.map((cell, j) => (
                <td key={j} className="p-3 align-top text-muted-foreground">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function CustomPluginDocsPage() {
  const { t } = useLanguage();

  return (
    <AppLayout activeModule="plugins">
      <div className="p-6 pb-16 max-w-4xl mx-auto">
        <div className="mb-8">
          <Button variant="ghost" size="sm" className="gap-2 -ml-2 mb-4" asChild>
            <Link href="/plugins">
              <ArrowLeft className="w-4 h-4" />
              {t("docs.customPlugin.backToPlugins")}
            </Link>
          </Button>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">
            {t("docs.customPlugin.title")}
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">
            {t("docs.customPlugin.subtitle")}
          </p>
        </div>

        <article className="space-y-10 text-sm leading-relaxed text-foreground">
          <section className="space-y-3">
            <h2 className="text-lg font-semibold">1. Giới thiệu</h2>
            <p>
              <strong>Custom plugin</strong> là một Tool trong workspace,{" "}
              <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                executor_type: generic_api
              </code>
              , gọi HTTP tới API của bạn theo cấu hình JSON.
            </p>
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
              <li>
                <strong className="text-foreground">Mục đích:</strong> Cho phép
                chatbot gọi REST (GET/POST/…) mà không cần code backend mới trong
                Nest — chỉ cần API bên ngoài + payload JSON đúng schema.
              </li>
              <li>
                <strong className="text-foreground">Đối tượng:</strong> Người cấu
                hình workspace (có quyền quản lý plugin), dev tích hợp API.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">2. Điều kiện & API tạo plugin</h2>
            <DocTable
              headers={["Nội dung", "Chi tiết"]}
              rows={[
                [
                  "Endpoint",
                  "POST /workspaces/:workspaceId/tools/custom",
                ],
                [
                  "Auth",
                  "Header Authorization: Bearer <JWT>",
                ],
                [
                  "Quyền",
                  "WORKSPACE_MANAGE_PLUGINS (trong code: workspace.manage_plugins) — thường Owner / Admin workspace",
                ],
                [
                  "Body",
                  "Một object JSON đúng CreateToolDto (xem mục 4)",
                ],
                [
                  "Tham chiếu code",
                  "create-tool.dto.ts, generic-api-executor.ts, WorkspaceToolsController",
                ],
              ]}
            />
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">3. Luồng tổng quan</h2>
            <ol className="list-decimal pl-5 space-y-2 text-muted-foreground">
              <li>
                Chuẩn bị API bên ngoài (base URL, từng endpoint, method,
                query/body).
              </li>
              <li>
                Viết file JSON (payload) mô tả tool + danh sách actions (mỗi action
                = một “hàm” LLM có thể gọi).
              </li>
              <li>
                Gửi <code className="rounded bg-muted px-1.5 py-0.5 text-xs">POST .../tools/custom</code> với body = payload.
              </li>
              <li>
                Trong UI chatbot, bật tool cho chatbot và (nếu cần) gán plugin đó
                cho workspace.
              </li>
              <li>
                (Tùy chọn) Action trả mảng → cấu hình{" "}
                <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                  card_config
                </code>{" "}
                để hiển thị thẻ trong chat.
              </li>
            </ol>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">4. Cấu trúc payload (tool — cấp root)</h2>
            <DocTable
              headers={["Field", "Bắt buộc", "Kiểu / Gợi ý"]}
              rows={[
                [
                  "name",
                  "Có",
                  "snake_case, duy nhất trong hệ thống tool (vd: restaurant_next_demo)",
                ],
                ["display_name", "Có", "Tên hiển thị cho admin"],
                [
                  "description",
                  "Có",
                  "Quan trọng cho LLM: tool dùng để làm gì, khi nào nên gọi",
                ],
                ["category", "Không", "Thường \"custom\""],
                ["is_enabled", "Không", "true"],
                [
                  "executor_type",
                  "Có",
                  "Với REST tự viết: \"generic_api\"",
                ],
                [
                  "executor_config",
                  "Có (với generic_api)",
                  "Tối thiểu: { \"base_url\": \"https://api-cua-ban.com\" } — mọi endpoint tương đối nối sau base_url",
                ],
                [
                  "auth_config",
                  "Không",
                  "{ \"type\": \"none\" } nếu public; hoặc api_key / bearer / oauth (xem mục 8)",
                ],
                [
                  "actions",
                  "Không nhưng nên có",
                  "Mảng các action (mục 5)",
                ],
              ]}
            />
            <p className="text-muted-foreground">
              <strong className="text-foreground">Lưu ý:</strong> endpoint có thể
              là URL tuyệt đối (https://...) — khi đó executor không ghép{" "}
              <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                base_url
              </code>{" "}
              (theo generic-api-executor).
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">5. Cấu trúc từng action</h2>
            <DocTable
              headers={["Field", "Bắt buộc", "Mô tả"]}
              rows={[
                ["name", "Có", "snake_case, vd: get_hot_dishes"],
                ["display_name", "Có", "Tên hiển thị"],
                [
                  "description",
                  "Có",
                  "Quan trọng cho LLM: khi nào gọi action này, tham số cần gì",
                ],
                [
                  "parameters",
                  "Có",
                  "JSON Schema kiểu OBJECT: type, properties, required — map sang tham số tool của model",
                ],
                ["executor_config", "Có", "Cấu hình HTTP (mục 6)"],
                ["sort_order", "Không", "Thứ tự hiển thị / ưu tiên gợi ý"],
                ["is_enabled", "Không", "true"],
                [
                  "card_config",
                  "Không",
                  "Nếu response là danh sách cần hiện card (mục 7)",
                ],
              ]}
            />
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">6. executor_config của action (Generic API)</h2>
            <p className="text-muted-foreground">
              Theo generic-api-executor.ts:
            </p>
            <DocTable
              headers={["Field", "Mô tả"]}
              rows={[
                ["method", "GET | POST | PUT | PATCH | DELETE"],
                ["endpoint", "Path, vd /api/menu/hot hoặc /api/menu/{{slug}}"],
                [
                  "content_type",
                  "Tùy chọn, mặc định JSON cho body",
                ],
                [
                  "params.path",
                  "Map placeholder path (ít dùng nếu đã nhúng {{slug}} trực tiếp trong endpoint)",
                ],
                [
                  "params.query",
                  "Query string: value có thể là \"{{ten_tham_so}}\" — trùng tên với parameters.properties",
                ],
                ["params.headers", "Header tĩnh hoặc template"],
                [
                  "params.body",
                  "Object/array cho POST/PUT/PATCH — hỗ trợ {{param}} lồng nhau",
                ],
                [
                  "pre_process",
                  "Tên bước xử lý đặc biệt (vd Gmail) — phần lớn plugin custom không cần",
                ],
                [
                  "response_transform",
                  "Biến đổi response (dot path đơn giản)",
                ],
                ["success_message", "Template thông báo thành công"],
              ]}
            />
            <p className="text-muted-foreground">
              <strong className="text-foreground">Placeholder:</strong> Dùng{" "}
              <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                {`{{ten_param}}`}
              </code>{" "}
              trong endpoint, params.query, params.body — trùng key trong parameters.
            </p>
            <p className="text-muted-foreground">
              <strong className="text-foreground">Query:</strong> Giá trị rỗng sau
              substitute thường không append (tránh gửi search= thừa).
            </p>
            <p className="text-muted-foreground">
              Ví dụ trong repo:{" "}
              <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                dongho_project/data/shop-watch-plugin.payload.json
              </code>
              ,{" "}
              <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                nhahang_project/data/restaurant-next-plugin.payload.json
              </code>
              .
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">7. Hiển thị card (danh sách)</h2>
            <p className="text-muted-foreground">
              Khi action trả về mảng (hoặc object có data / items / results / list —
              backend tự thử), có thể bật:
            </p>
            <pre className="rounded-lg border border-border bg-muted/40 p-4 overflow-x-auto text-xs">
              <code>{`"card_config": {
  "enabled": true,
  "list_path": "data.items",
  "field_mapping": {
    "title": "name",
    "url": "url",
    "imageUrl": "imageUrl",
    "description": "description"
  }
}`}</code>
            </pre>
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
              <li>
                <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                  list_path
                </code>
                : Chỉ cần nếu mảng nằm sâu (vd data.items). Response là mảng trực
                tiếp → có thể bỏ.
              </li>
              <li>
                <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                  field_mapping
                </code>
                : Map tên field trên card → tên field trong JSON từng phần tử API.
              </li>
            </ul>
            <p className="text-muted-foreground">
              Code tham chiếu: card-mappers.ts (mapGenericListToCards,
              buildCardsFromToolResults).
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">8. Xác thực API (auth_config)</h2>
            <p className="text-muted-foreground">
              Tool-level: merge vào executor (tool-executor.service).
            </p>
            <DocTable
              headers={["auth_config.type", "Gợi ý cấu hình"]}
              rows={[
                ["none", "{ \"type\": \"none\" }"],
                [
                  "api_key",
                  "Cần khớp cấu trúc api_key trong config (header hoặc query) — xem generic-api-executor",
                ],
                ["bearer", "Token bearer trong config / override"],
                [
                  "oauth2",
                  "Cần user liên kết tài khoản qua OAuth của hệ thống",
                ],
              ]}
            />
            <p className="text-muted-foreground">
              Chi tiết từng key nên trích từ generic-api-executor + ví dụ seed
              tools.seed.ts nếu có.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">9. Yêu cầu phía API bên ngoài (best practice)</h2>
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
              <li>HTTPS, JSON rõ ràng cho GET/POST.</li>
              <li>
                <strong className="text-foreground">CORS:</strong> Request đi từ
                server NestJS (generic API executor), không phải trình duyệt user —
                chỉ cần API cho phép server của bạn (IP/allowlist) nếu có firewall.
              </li>
              <li>
                <strong className="text-foreground">SSRF:</strong> Executor dùng
                safeFetchWithSsrfProtection — URL phải nằm trong phạm vi cho phép
                (nếu có cấu hình).
              </li>
              <li>
                Trả về field đủ cho card: name, url, imageUrl, description nếu dùng
                field_mapping tương ứng.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">10. Ví dụ tối thiểu (copy-paste)</h2>
            <pre className="rounded-lg border border-border bg-muted/40 p-4 overflow-x-auto text-xs">
              <code>{`{
  "name": "demo_restaurant",
  "display_name": "Demo Restaurant API",
  "description": "Gọi API menu công khai của nhà hàng.",
  "category": "custom",
  "is_enabled": true,
  "executor_type": "generic_api",
  "executor_config": {
    "base_url": "https://api.example.com"
  },
  "auth_config": { "type": "none" },
  "actions": [
    {
      "name": "get_hot_dishes",
      "display_name": "Món hot",
      "description": "Khi user hỏi món bán chạy hoặc gợi ý món, gọi action này.",
      "parameters": {
        "type": "object",
        "properties": {},
        "required": []
      },
      "executor_config": {
        "method": "GET",
        "endpoint": "/api/menu/hot"
      }
    }
  ]
}`}</code>
            </pre>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">11. Gắn tool vào chatbot</h2>
            <ol className="list-decimal pl-5 space-y-2 text-muted-foreground">
              <li>
                Tool đã tạo xuất hiện trong danh sách workspace tools (Plugins).
              </li>
              <li>
                Vào cấu hình chatbot → bật tool / plugin tương ứng cho chatbot.
              </li>
              <li>
                Thử trong chat: hỏi câu kích hoạt mô tả trong{" "}
                <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                  description
                </code>{" "}
                của action.
              </li>
            </ol>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">12. Troubleshooting (FAQ)</h2>
            <DocTable
              headers={["Hiện tượng", "Hướng xử lý"]}
              rows={[
                [
                  "LLM không gọi tool",
                  "Viết lại description tool/action rõ điều kiện; kiểm tra tool đã bật trên chatbot",
                ],
                [
                  "4xx/5xx khi gọi API",
                  "Kiểm tra base_url, path, method, query/body; so khớp với Postman",
                ],
                [
                  "Card không hiện",
                  "card_config.enabled, response phải là mảng (hoặc đúng list_path), field mapping khớp JSON",
                ],
                [
                  "Tham số null/empty",
                  "Tránh bắt model điền query không cần thiết; mô tả default trong description",
                ],
              ]}
            />
          </section>
        </article>
      </div>
    </AppLayout>
  );
}
