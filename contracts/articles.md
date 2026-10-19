# BE1-06 — Bài viết

JSON dùng camelCase, enum trả tên chuỗi. `id` là UUID. API public không cần JWT; `/api/me/articles*` cần JWT role `User` hoặc `Admin`, xác định chủ từ claim `sub`. Bài viết của người khác trả 404 để không lộ sự tồn tại.

## Endpoint

| Method | Path | Chức năng |
|---|---|---|
| GET | `/api/articles?search=&category=&dietaryType=&page=1&pageSize=20` | Danh sách bản đang công khai; tìm trong tiêu đề/nội dung, lọc danh mục và kiểu ăn chay, phân trang. |
| GET | `/api/articles/{id}` | Chi tiết bản đang công khai và tối đa 4 bài liên quan cùng danh mục. |
| GET | `/api/me/articles?status=&aiStatus=&page=1&pageSize=20` | Bài của tôi, lọc theo trạng thái Admin/AI của bản gửi gần nhất. `Draft` chỉ gồm bản chưa gửi lần nào. |
| GET | `/api/me/articles/{id}` | Bản nháp hiện tại, lịch sử phiên bản, trạng thái AI/Admin, phản hồi Admin, bản đang công khai. |
| POST | `/api/me/articles` | Tạo nháp, trả 201 và `Location` trỏ tới chi tiết của tôi. |
| PUT | `/api/me/articles/{id}` | Sửa nháp của chính mình khi không đang AI/Admin xử lý. |
| DELETE | `/api/me/articles/{id}` | Xóa nháp chưa từng gửi, trả 204. |
| POST | `/api/me/articles/{id}/submit` | Gửi bản nháp vào Moderation; tạo snapshot phiên bản, trả chi tiết của tôi. |

`page` dương, `pageSize` 1–100. Danh sách trả `{ items, totalCount, page, pageSize }`. `search` và `category` tối đa 120 ký tự. Danh mục bài viết thuộc riêng bài viết; `Category` của Core Data chỉ dùng cho Recipe và không được tái sử dụng ở đây. Query `category` khớp bất kỳ danh mục nào của bài viết.

## Dữ liệu

Request tạo/sửa: `{ "title": "...", "content": "...", "categories": ["Dinh dưỡng", "Sức khỏe"], "dietaryType": "Vegan", "coverImageUrl": "https://..." }`. Tiêu đề, nội dung và ít nhất một danh mục là bắt buộc; tiêu đề tối đa 200, nội dung tối đa 50.000, có tối đa 8 danh mục, mỗi danh mục tối đa 120 ký tự. `dietaryType` là một giá trị tùy chọn trong `Vegan`, `LactoVegetarian`, `OvoVegetarian`, `LactoOvoVegetarian`; bài viết chỉ được chọn tối đa một chế độ ăn. `category` và `dietaryTypes` cũ vẫn được backend đọc để tương thích, nhưng không được gửi kèm danh sách nhiều chế độ ăn. Ảnh đại diện dùng URL HTTP/HTTPS tối đa 2.000 ký tự trả từ `POST /api/me/images`; endpoint bài viết không nhận binary. URL gửi vào `mediaReference` của submission.

Public list item: `{ id, title, category, categories, dietaryTypes, dietaryType, coverImageUrl, authorId, version, publishedAt }`, trong đó `category` là danh mục đầu tiên để tương thích UI cũ và `categories` là danh sách đầy đủ. Chi tiết thêm `content` và `relatedArticles`. `dietaryType` trong query nhận một trong bốn enum trên; bài chưa phân loại không khớp bộ lọc. Chỉ bản có `adminReviewStatus=Published` và `isCurrentPublished=true` ở Moderation được trả. Một bản sửa đang kiểm tra không đổi bản công khai.

Chi tiết của tôi: `{ id, title, content, category, categories, dietaryTypes, dietaryType, coverImageUrl, createdAt, updatedAt, status, publishedVersion, versions }`. Mỗi `versions` có `{ version, submissionId, aiStatus, adminStatus, aiSummary, adminFeedback, submittedAt }`; `adminFeedback` là lý do quyết định mới nhất của Admin trên phiên bản đó. `publishedVersion` null khi chưa có bản đang công khai. `status` là trạng thái Admin của phiên bản gần nhất hoặc `Draft` trước lần gửi đầu tiên. AI và Admin là hai trạng thái độc lập.

Gửi duyệt dùng `ModerationService.SubmitAsync` với `contentType=Article`. Sau gửi, AI `Checking`, Admin `Submitted`. Khi AI trả `Passed`, `Flagged`, `Partial` hoặc `Failed`, bản gửi vào hàng đợi Admin; với `Failed`, Admin phải xem trực tiếp toàn bộ nội dung vì AI chưa có kết luận. BE3 xử lý AI và quyết định qua `/api/moderation/submissions` và `/api/admin/moderation/submissions`; không có endpoint xuất bản trực tiếp ở Articles. Khi Admin duyệt, phiên bản được công khai; khi yêu cầu sửa/từ chối, tác giả có thể sửa và gửi lại; khi sửa bản đã xuất bản, bản cũ vẫn công khai đến lúc bản mới được duyệt. Bản đang chờ xử lý không được sửa/gửi lại; bản đã gỡ không được sửa/gửi lại. Chỉ xóa được nháp chưa gửi.

`Article.id` là ID bài viết dùng trên FE; `ModerationSubmission.contentId` là ID chuỗi kiểm duyệt và được lưu riêng trong Article sau lần gửi đầu tiên. `versions[].submissionId` là ID để mở kết quả/nhật ký kiểm duyệt. BE3 cần dùng đúng submission/version khi xử lý AI và quyết định; không lấy bản nháp hiện tại làm dữ liệu quyết định.

Lỗi: 400 dữ liệu/phân trang không hợp lệ, 401 chưa xác thực, 403 role không phù hợp, 404 không tồn tại hoặc không thuộc chủ, 409 trạng thái hoặc phiên bản xung đột. Lỗi nghiệp vụ trả `ProblemDetails` với `detail` cho FE hiển thị.
