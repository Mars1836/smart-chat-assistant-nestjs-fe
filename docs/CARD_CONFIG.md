# Hướng dẫn Card config (Hiển thị dạng card trong chat)

Khi thêm hoặc sửa **action** của custom plugin, bạn có thể bật **Hiển thị dạng card trong chat** để kết quả trả về từ action được hiển thị dạng card (sản phẩm, bài viết, link) trong tin nhắn chatbot.

## Khi nào nên bật

- **Nên bật** cho action trả về **một danh sách** (list) mà bạn muốn hiển thị dạng card — ví dụ: danh sách sản phẩm, bài viết, link.
- **Không cần bật** (hoặc để tắt) cho action trả về **một object** chi tiết (ví dụ: chi tiết 1 sản phẩm).

## Các trường cấu hình

### Bật hiển thị card

- Bật toggle **"Bật hiển thị kết quả dạng card"** trong block **Hiển thị dạng card trong chat** của từng action.

### Đường dẫn tới mảng (list_path)

- **Ý nghĩa:** Đường dẫn trong **response JSON** của API tới **mảng** cần hiển thị card.
- **Ví dụ:**
  - API trả về `{ "data": [ ... ] }` → điền `data`.
  - API trả về `{ "response": { "items": [ ... ] } }` → điền `response.items`.
- **Để trống:** Backend sẽ thử lần lượt: `data`, `items`, `results`, `organic_results`, `list`.

### Map field API → card (field_mapping)

Card chuẩn cần 4 field: **title**, **url**, **imageUrl**, **description**. Bạn map tên field **trong API** sang từng field chuẩn:

| Field card   | Ý nghĩa        | Ví dụ tên field API (điền nếu API dùng tên khác) |
|-------------|----------------|---------------------------------------------------|
| **Title**   | Tiêu đề card   | `title` hoặc `name`                               |
| **URL**     | Link khi bấm   | `url` hoặc `link`                                 |
| **Image URL** | Ảnh thumbnail | `imageUrl` hoặc `thumbnail`                       |
| **Description** | Mô tả ngắn  | `description` hoặc `snippet`                     |

- Chỉ cần điền các ô khi API dùng **tên field khác** với tên chuẩn. Để trống = dùng đúng tên chuẩn.

## Nơi cấu hình trong FE

1. **Quản lý Actions (sửa plugin):** Trang **Plugins** → chọn plugin custom → **Manage Actions** → Thêm action mới hoặc **Sửa** action có sẵn → mở block **Hiển thị dạng card trong chat** và điền list_path, field_mapping.
2. **Import plugin:** Trong JSON import, mỗi action có thể có `card_config` (xem spec API). Khi import, FE sẽ gửi `card_config` lên server.

## API

- **Tạo/cập nhật action:** Body gửi lên có thể chứa `card_config`: `{ enabled, list_path, field_mapping }`.
- Nếu không gửi `card_config` hoặc `enabled: false` → backend không tạo card từ action đó.
