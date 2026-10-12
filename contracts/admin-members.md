# Admin Members

Chỉ role `Admin` được gọi các API sau bằng JWT Bearer. `401` nếu token thiếu, hết hạn hoặc tài khoản đã khóa; `403` nếu không phải Admin. Mọi ID thành viên và ID Admin là `Users.Id` (`string`, GUID dạng `N`). `Guest` không có hàng `Users`.

## Danh sách

`GET /api/admin/members?search=an&isLocked=false&page=1&pageSize=10`

- `search` tùy chọn, tìm không phân biệt hoa thường trong tên/email, tối đa 150 ký tự; `%` và `_` được hiểu là ký tự thường.
- `isLocked` tùy chọn: `true`, `false`, hoặc bỏ trống để lấy tất cả.
- Sắp xếp `JoinedAtUtc` mới nhất trước, rồi `Id` giảm dần. `page` bắt đầu từ 1, `pageSize` từ 1–100. Lọc, `COUNT`, `Skip` và `Take` thực hiện tại DB.
- `totalCount` là số hàng sau lọc; `activeCount`, `lockedCount` là tổng toàn hệ thống trước lọc để hiển thị thẻ thống kê. Gồm tài khoản `User` và `Admin`.

```json
{
  "items": [{ "id": "<Users.Id>", "fullName": "Nguyen Van A", "email": "a@example.com", "role": "User", "joinedAtUtc": "2026-10-03T08:00:00Z", "isLocked": false }],
  "page": 1, "pageSize": 10, "totalCount": 1, "activeCount": 1, "lockedCount": 0
}
```

## Chi tiết và lịch sử

`GET /api/admin/members/{id}` trả `id`, `fullName`, `email`, `role`, `joinedAtUtc`, `isLocked`, `currentLockReason`, `lockedAtUtc`. Không trả password hash, dữ liệu sức khỏe, hoặc nội dung riêng tư khác. ID không tồn tại trả `404`.

`GET /api/admin/members/{id}/status-history?page=1&pageSize=10` trả `{ items, page, pageSize, totalCount }`. Mỗi item: `{ id, isLocked, reason, adminId, adminName, occurredAtUtc }`; `isLocked=true` là khóa, `false` là mở khóa. Lịch sử mới nhất trước, phân trang tại DB. Lịch sử trước khi tính năng này được triển khai không thể suy ngược từ `Users.LockReason`.

## Khóa và mở khóa

`POST /api/admin/members/{id}/lock` hoặc `POST /api/admin/members/{id}/unlock`, body `{ "reason": "Lý do cụ thể" }`, 1–1000 ký tự sau trim. Thành công `204`. Thiếu lý do trả `400`; ID không tồn tại trả `404`; đã ở trạng thái đích, tự khóa Admin đang dùng, hoặc khóa Admin hoạt động cuối cùng trả `409` với `ProblemDetails.title`. Mỗi thay đổi ghi `AdminId`, lý do và thời điểm UTC trong `MemberStatusChanges` cùng transaction với trạng thái `Users`. Mở khóa cũng bắt buộc lý do. Trạng thái khóa được xác minh trong DB khi đăng nhập và ở mỗi request JWT; JWT còn hạn của tài khoản vừa khóa trả `401`.

## Điểm nối với BE nội dung

ERD liên kết `User` với `Blog`, `Video`, `Comment`. BE Đức dùng `Users.Id` làm `AuthorUserId`/`UserId` FK trong các bảng nội dung; không tạo bản sao `Users` hoặc bảng nội dung trong Members. Đề nghị contract nội dung Admin cung cấp `GET /api/admin/members/{id}/content-summary` cho `{ articleCount, videoCount, commentCount }` và các danh sách nội dung phân trang theo cùng ID. Chỉ hiển thị số liệu/tab khi API nội dung thật được thống nhất và triển khai. Members hiện không trả số liệu nội dung giả.
