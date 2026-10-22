# Báo cáo bài viết và video

Theo yêu cầu bổ sung ngày 22/10/2026: User/Admin báo cáo nội dung công khai; Guest cần đăng nhập. Báo cáo riêng tư chỉ Admin đọc. Không tự động gỡ nội dung hay gọi AI.

## Gửi báo cáo

`POST /api/content-reports` — User/Admin, JSON:
`{ targetType: "Article" | "Video", targetId: "guid", reason: "Spam" | "Inappropriate" | "Misleading" | "Copyright" | "Other", details?: "..." }`.

Nội dung phải đang công khai. Details tối đa 2000 ký tự sau trim, bắt buộc khi reason=Other. Backend lấy reporterId từ token và lưu ID phiên bản công khai, tiêu đề tại thời điểm báo cáo; không nhận thông tin này từ client.

`201`: `{ id, status: "Pending" }`. `400`: dữ liệu sai; `401`: chưa đăng nhập; `404`: nội dung không tồn tại/không công khai; `409`: tài khoản đã có báo cáo Pending cho cùng targetType + targetId. Unique filtered index chống gửi trùng đồng thời. `429`: quá 10 lượt/15 phút theo IP; request tối đa 16 KB.

## Admin

- `GET /api/admin/content-reports?status=Pending&targetType=Article&page=1&pageSize=10`: bộ lọc tùy chọn; page >= 1, pageSize 1–50. `200`: `{ items, total, page, pageSize }`, mới nhất trước.
- Item: `{ id, targetType, targetId, submissionId, contentTitle, contentVersion, reporterId, reason, details, status, createdAt, resolvedAt, resolvedBy, resolutionNote, pendingReporterCount }`. `pendingReporterCount` là số người có báo cáo Pending cho cùng `targetType` + `targetId` trên toàn bộ dữ liệu, không chỉ trang hiện tại; các báo cáo đã xử lý không được tính.
- `POST /api/admin/content-reports/{id}/resolve`: `{ status: "Resolved" | "Dismissed", note: "..." }`. Note bắt buộc 1–2000 ký tự. `204` thành công; `400` dữ liệu sai; `404` không tồn tại; `409` đã được xử lý hoặc bị cập nhật đồng thời.
- `401` nếu chưa đăng nhập, `403` nếu không phải Admin. Không có API công khai danh sách báo cáo.
- `GET /api/admin/moderation/submissions` và `GET /api/admin/moderation/submissions/{id}` trả thêm `pendingReporterCount` cho từng nội dung để hiện huy hiệu tại màn duyệt bài viết/video. Số đếm theo nội dung, không phụ thuộc phiên bản.

Resolved = Admin đã xử lý; Dismissed = Admin không chấp nhận báo cáo, cả hai phải có ghi chú. Việc gỡ nội dung dùng quy trình kiểm duyệt hiện có, lưu quyết định riêng. Báo cáo giữ dấu vết phiên bản bị báo cáo ngay cả khi nội dung có bản sửa mới.

Migration: `AddContentReports`. FE: `features/reports` (form dùng chung), `features/admin/reports` (hàng đợi).
