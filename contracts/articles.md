# BE1-06 — Bài viết

JSON dùng camelCase, enum trả tên chuỗi. `id` là UUID. API public không cần JWT; `/api/me/articles*` cần JWT role `User` hoặc `Admin`, xác định chủ từ claim `sub`. Bài viết của người khác trả 404 để không lộ sự tồn tại.

## Endpoint

| Method | Path | Chức năng |
|---|---|---|
| GET | `/api/articles?search=&category=&page=1&pageSize=20` | Danh sách bản đang công khai; tìm trong tiêu đề/nội dung, lọc danh mục, phân trang. |
| GET | `/api/articles/{id}` | Chi tiết bản đang công khai và tối đa 4 bài liên quan cùng danh mục. |
| GET | `/api/me/articles?status=&aiStatus=&page=1&pageSize=20` | Bài của tôi, lọc theo trạng thái Admin/AI của bản gửi gần nhất. `Draft` chỉ gồm bản chưa gửi lần nào. |
| GET | `/api/me/articles/{id}` | Bản nháp hiện tại, lịch sử phiên bản, trạng thái AI/Admin, phản hồi Admin, bản đang công khai. |
| POST | `/api/me/articles` | Tạo nháp, trả 201 và `Location` trỏ tới chi tiết của tôi. |
| PUT | `/api/me/articles/{id}` | Sửa nháp của chính mình khi không đang AI/Admin xử lý. |
| DELETE | `/api/me/articles/{id}` | Xóa nháp chưa từng gửi, trả 204. |
| POST | `/api/me/articles/{id}/submit` | Gửi bản nháp vào Moderation; tạo snapshot phiên bản, trả chi tiết của tôi. |

`page` dương, `pageSize` 1–100. Danh sách trả `{ items, totalCount, page, pageSize }`. `search` và `category` tối đa 120 ký tự. Danh mục bài viết là chuỗi tối đa 120 ký tự thuộc riêng bài viết; `Category` của Core Data chỉ dùng cho Recipe và không được tái sử dụng ở đây.

## Dữ liệu

Request tạo/sửa: `{ "title": "...", "content": "...", "category": "Dinh dưỡng", "coverImageUrl": "https://..." }`. Ba trường đầu bắt buộc; tiêu đề tối đa 200, nội dung tối đa 50.000, danh mục tối đa 120 ký tự. Ảnh đại diện là URL HTTP/HTTPS tùy chọn tối đa 2.000 ký tự; upload/storage do module media dùng chung quản lý, API này không nhận binary. URL gửi vào `mediaReference` của submission; việc xác minh tệp thuộc người gửi và kiểm tra ảnh thật phụ thuộc tích hợp BE3.

Public list item: `{ id, title, category, coverImageUrl, authorId, version, publishedAt }`. Chi tiết thêm `content` và `relatedArticles`. Chỉ bản có `adminReviewStatus=Published` và `isCurrentPublished=true` ở Moderation được trả. Một bản sửa đang kiểm tra không đổi bản công khai.

Chi tiết của tôi: `{ id, title, content, category, coverImageUrl, createdAt, updatedAt, status, publishedVersion, versions }`. Mỗi `versions` có `{ version, submissionId, aiStatus, adminStatus, aiSummary, adminFeedback, submittedAt }`; `adminFeedback` là lý do quyết định mới nhất của Admin trên phiên bản đó. `publishedVersion` null khi chưa có bản đang công khai. `status` là trạng thái Admin của phiên bản gần nhất hoặc `Draft` trước lần gửi đầu tiên. AI và Admin là hai trạng thái độc lập.

Gửi duyệt dùng `ModerationService.SubmitAsync` với `contentType=Article`. Sau gửi, AI `Checking`, Admin `Submitted`. BE3 xử lý AI, retry và quyết định qua `/api/moderation/submissions` và `/api/admin/moderation/submissions`; không có endpoint xuất bản trực tiếp ở Articles. Khi Admin duyệt, phiên bản được công khai; khi yêu cầu sửa/từ chối, tác giả có thể sửa và gửi lại; khi sửa bản đã xuất bản, bản cũ vẫn công khai đến lúc bản mới được duyệt. Bản đang chờ xử lý không được sửa/gửi lại; bản đã gỡ không được sửa/gửi lại. Chỉ xóa được nháp chưa gửi.

`Article.id` là ID bài viết dùng trên FE; `ModerationSubmission.contentId` là ID chuỗi kiểm duyệt và được lưu riêng trong Article sau lần gửi đầu tiên. `versions[].submissionId` là ID để mở kết quả/nhật ký kiểm duyệt. BE3 cần dùng đúng submission/version khi xử lý AI và quyết định; không lấy bản nháp hiện tại làm dữ liệu quyết định.

Lỗi: 400 dữ liệu/phân trang không hợp lệ, 401 chưa xác thực, 403 role không phù hợp, 404 không tồn tại hoặc không thuộc chủ, 409 trạng thái hoặc phiên bản xung đột. Lỗi nghiệp vụ trả `ProblemDetails` với `detail` cho FE hiển thị.
