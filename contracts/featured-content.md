# Nội dung nổi bật

Admin ghim/bỏ ghim nội dung để xuất hiện trên trang chủ. Trạng thái được lưu trong bảng `FeaturedContent` của database hiện hành; không seed hoặc sao chép dữ liệu nội dung. JSON dùng camelCase, `contentType` bắt buộc là tên chuỗi chính xác `Restaurant`, `Video` hoặc `Article`.

| Method | Endpoint | Quyền và kết quả |
|---|---|---|
| GET | `/api/admin/featured-content?contentType=Article&search=&page=1&pageSize=6` | Admin đang hoạt động; danh sách ứng viên đang công khai/hợp lệ, kèm trạng thái ghim. |
| GET | `/api/featured-content?contentType=Article&page=1&pageSize=100` | Guest/User/Admin; chỉ nội dung đã ghim và vẫn công khai/hợp lệ. |
| PUT | `/api/admin/featured-content/{contentType}/{id}` | Admin đang hoạt động; body `{ "isPinned": true }` hoặc `{ "isPinned": false }`; thành công trả `204`, không có response body. |

Danh sách trả `{ items, totalCount, page, pageSize }`. `page` từ 1, `pageSize` 1–100, `search` của Admin tối đa 120 ký tự và tìm trong tiêu đề/tên công khai. Mặc định `page=1`, `pageSize=6`. Không nhận `userId` từ client; người ghim lấy từ claim `sub` đã xác thực.

Mỗi item có:

```json
{
  "id": "<Article.Id | Video.Id | Restaurant.Id>",
  "contentType": "Article",
  "title": "Tiêu đề đang công khai",
  "description": null,
  "imageUrl": "https://example.com/cover.jpg",
  "isPinned": true,
  "authorName": "Tên tác giả hoặc null",
  "publishedAt": "2026-10-17T08:00:00Z",
  "viewCount": null,
  "address": null,
  "dietaryTypes": ["Vegan"]
}
```

- Nhà hàng: chỉ `IsActive=true`; tên/mô tả/ảnh/địa chỉ/chế độ ăn lấy từ bản ghi nhà hàng. `publishedAt`, `viewCount`, `authorName` null.
- Bài viết: chỉ `ArticleVersion` có submission `Published` và `IsCurrentPublished=true`; tiêu đề, ảnh và chế độ ăn lấy từ phiên bản đã duyệt, không lấy bản nháp hoặc phiên bản đang chờ. `id` là `Article.Id` dùng cho liên kết public, `description` và `viewCount` null. `publishedAt` là thời điểm quyết định duyệt của phiên bản đó, dự phòng thời điểm gửi nếu lịch sử cũ thiếu quyết định.
- Video: chỉ phiên bản `Published`, `IsCurrentPublished=true` và khớp `Video.PublishedSubmissionId`; tiêu đề/mô tả lấy từ submission công khai, thumbnail dùng `PublishedThumbnailKey` qua `/api/videos/{id}/thumbnail`, không trả storage key hay metadata nháp. `viewCount` là số lưu thật; `dietaryTypes=[]`.
- `authorName` có thể null khi tài khoản tác giả không còn; API không trả email hoặc thông tin riêng tư. Không trả nội dung nháp, tệp riêng tư hay số liệu giả.
- Public luôn kiểm tra lại eligibility khi đọc; nội dung bị gỡ hoặc nhà hàng ngừng sử dụng lập tức biến mất khỏi danh sách nổi bật mà không cần xóa bản ghim. Khi công khai lại, bản ghim còn tồn tại sẽ hiển thị lại.
- Sắp xếp: đã ghim trước, `pinnedAt` giảm dần rồi ID tăng dần; ứng viên chưa ghim theo ID. Lặp PUT cùng trạng thái không tạo bản ghi trùng và không đổi thời điểm ghim hiện có. Bỏ ghim rồi ghim lại tạo thời điểm ghim mới.
- Bỏ ghim vẫn được phép khi nội dung đã không còn hợp lệ hoặc đã bị xóa nhưng còn bản ghim. Nội dung tồn tại nhưng chưa ghim cũng trả `204`; ID không tồn tại và không có bản ghim trả `404`.

Lỗi: `400` thiếu/sai loại nội dung, phân trang, từ khóa hoặc body; `401` Guest gọi endpoint Admin; `403` User/sai quyền; `404` ID không tồn tại; `409` ghim nội dung chưa công khai, đã gỡ hoặc không hoạt động. Lỗi nghiệp vụ dùng `ProblemDetails`, có thông điệp cho FE. Mọi kiểm tra quyền và điều kiện ghim thực hiện ở backend.
