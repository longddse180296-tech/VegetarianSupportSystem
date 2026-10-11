# Admin Dashboard

`GET /api/admin/dashboard` yêu cầu JWT Bearer của `Admin` đang hoạt động. Guest nhận `401`; `User` nhận `403`. Response dùng JSON `camelCase`. Không có tham số thời gian vì endpoint hiện chưa trả biểu đồ.

```json
{
  "members": { "registered": 4, "active": 3, "locked": 1 },
  "coreData": {
    "categories": { "total": 2, "active": 2 },
    "ingredients": { "total": 5, "active": 4 },
    "recipes": { "total": 3, "active": 2 },
    "restaurants": { "total": 1, "active": 1 }
  },
  "content": { "publishedArticles": 1, "publishedVideos": 0, "comments": 0 },
  "pendingAdminReview": { "articles": 1, "videos": 0, "total": 1 },
  "recentActivity": [
    {
      "type": "ArticleSubmitted",
      "entityId": "<ModerationSubmissions.Id>",
      "title": "Bài viết về ăn chay",
      "actorUserId": "<Users.Id>",
      "actorName": "Nguyen Van A",
      "occurredAtUtc": "2026-10-10T08:00:00Z"
    }
  ]
}
```

- `members` đếm tất cả hàng `Users`, gồm `User` và `Admin`. `active` nghĩa là tài khoản chưa khóa, không phải số người đang trực tuyến.
- `coreData` đếm các bản ghi Categories, Ingredients, Recipes, Restaurants; `active` dựa trên `IsActive`. Các số liệu này phản ánh bảng do BE 2 quản lý.
- `publishedArticles` và `publishedVideos` đếm phiên bản `ModerationSubmissions` có `IsCurrentPublished=true`, phân theo `ContentType`. Đây là số bản nội dung công khai trong hệ thống kiểm duyệt hiện có. Khi Article/Video có bảng nội dung đã tích hợp đầy đủ, BE 1/3 cần đối chiếu nguồn trước khi đổi ý nghĩa của số liệu.
- `pendingAdminReview` chỉ đếm bản có `AdminReviewStatus=PendingAdminReview`, cùng phạm vi với hàng đợi kiểm duyệt Admin. Bản AI còn kiểm tra hoặc lỗi không nằm trong hàng đợi này.
- `comments` đếm bình luận trạng thái `Visible` từ bảng `Comments`; tạo/ẩn/gỡ bình luận cập nhật số liệu thật.
- `recentActivity` gồm tối đa 10 sự kiện mới nhất có dấu thời gian lưu trong DB: đăng ký thành viên, khóa/mở khóa, gửi bài viết/video kiểm duyệt và quyết định kiểm duyệt. Mỗi mục có `type`, ID của bản ghi sự kiện, tiêu đề/đối tượng, người thực hiện nếu có và thời gian UTC. Các loại hiện có: `MemberRegistered`, `MemberLocked`, `MemberUnlocked`, `ArticleSubmitted`, `VideoSubmitted`, và `<Article|Video><Approve|RequestRevision|Reject|Remove>`.

Endpoint không trả phần trăm tăng trưởng, biểu đồ hoặc trạng thái hệ thống khi chưa có nguồn đo.
