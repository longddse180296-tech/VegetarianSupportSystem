# Hợp đồng API — Moderation và AiChat

Ngày cập nhật: 02/10/2026. JSON dùng `camelCase`; enum được serialize bằng **tên string**. API base là `/api`. Lược đồ máy đọc được sinh tại `/openapi/v1.json` khi chạy Development.

## Xác thực và quyền

- Guest là người chưa đăng nhập, không có user ID trong DB. Hai endpoint `/ai-chat/guest/*` dùng cookie session phía server và trả `403` cho người đã đăng nhập.
- Endpoint tài khoản cần Bearer JWT hợp lệ với claim `sub` và `role` là `User` hoặc `Admin`; endpoint `/admin/moderation/*` cần `role=Admin`. User ID và role của các endpoint nghiệp vụ không nhận từ request body.
- API kiểm tra issuer, audience, hạn token và chữ ký. Cấu hình qua `Authentication__Jwt__Issuer`, `Authentication__Jwt__Audience`, `Authentication__Jwt__SigningKey` (ít nhất 32 byte UTF-8), đặt trong môi trường hoặc secret store. Chưa có endpoint đăng ký/đăng nhập để phát token trong đợt này.
- Thiếu token/token không hợp lệ: `401`; role sai: `403`. Cả hai mã được khai báo trong OpenAPI cho endpoint cần quyền. Danh tính hợp lệ là tiền đề để dùng các endpoint cần DB.
- Khi chưa có đăng nhập của BE 1, **chỉ trong Development**, `POST /api/dev-auth/token` nhận `{ "userId": "local-user", "role": "User" }` hoặc role `Admin`, trả `accessToken`, `tokenType`, `role`, `userId`, `expiresAtUtc`. Dán riêng giá trị `accessToken` vào nút **Authorize** của Swagger UI. Token hết hạn sau 1 giờ; nếu không cấu hình signing key cố định thì token cũ hết hiệu lực mỗi lần restart backend. Endpoint này không được ánh xạ ngoài Development và không thay cho đăng nhập thật.

## Moderation

`contentType`: `Article` hoặc `Video`. Hai trạng thái độc lập:

- `aiFlagStatus`: `NotSubmitted`, `Checking`, `Passed`, `Flagged`, `Partial`, `Failed`.
- `adminReviewStatus`: `Draft`, `Submitted`, `PendingAdminReview`, `Published`, `RevisionRequested`, `Rejected`, `Removed`.

| Method và đường dẫn | Quyền | Mô tả |
|---|---|---|
| `POST /moderation/submissions` | User/Admin | Gửi bản nội dung vào kiểm duyệt; trả `201`. |
| `GET /moderation/submissions?contentType=&page=1&pageSize=20` | User/Admin | Danh sách phiên bản của chính mình, mới nhất trước. |
| `GET /moderation/submissions/{id}` | Chủ nội dung | Chi tiết bản gửi. Người khác nhận `404`. |
| `POST /moderation/submissions/{id}/retry-ai` | Chủ nội dung | Chỉ dùng để khôi phục bản bài viết cũ còn `Failed` + `Submitted`; bản đã vào hàng đợi Admin trả `409`, video trả `409`. |
| `GET /admin/moderation/submissions?contentType=&aiStatus=&adminStatus=&page=1&pageSize=20` | Admin | Tìm/lọc các bản gửi. |
| `GET /admin/moderation/submissions/queue?contentType=&aiStatus=&page=1&pageSize=20` | Admin | Lấy hàng đợi `PendingAdminReview`. |
| `GET /admin/moderation/submissions/{id}` | Admin | Chi tiết và nhật ký quyết định. |
| `POST /admin/moderation/submissions/{id}/decisions` | Admin | Quyết định; trả `200`. |

Ví dụ tạo bản đầu:

```json
{
  "contentId": null,
  "contentType": "Article",
  "title": "Bài viết về ăn chay",
  "textContent": "Nội dung cần duyệt",
  "mediaReference": null
}
```

Để gửi phiên bản mới, truyền `contentId` đã có. Chỉ được gửi khi phiên bản mới nhất có trạng thái `RevisionRequested`, `Rejected` hoặc `Published`; `contentType` và chủ sở hữu không đổi. Video gửi qua endpoint riêng `/api/me/videos/{id}/submit` sau khi upload media. Tiêu đề tối đa 200 ký tự, nội dung tối đa 50.000 ký tự, media reference tối đa 2.000 ký tự. Bài viết bắt đầu `aiFlagStatus=Checking`, `adminReviewStatus=Submitted`; video bắt đầu `aiFlagStatus=NotSubmitted`, `adminReviewStatus=PendingAdminReview`. Cả hai đều `isCurrentPublished=false` cho đến quyết định Admin. Nội dung mới không thay thế bản đang công khai khi chưa được Admin duyệt.

Response bản gửi gồm `id`, `contentId`, `version`, `contentType`, `ownerUserId`, `title`, `textContent`, `mediaReference`, `aiFlagStatus`, `adminReviewStatus`, `aiSummary`, `aiFlagReason`, `aiCheckedScope`, `aiUncheckedScope`, `aiCheckedAt`, `submittedAt`, `createdAtUtc`, `updatedAtUtc`, `isCurrentPublished`, `decisions[]`. `aiFlagReason` bắt buộc khi AI `Flagged`, có thể có khi `Partial`; luôn `null` khi `Passed`/`Failed`. Mỗi quyết định có `id`, `version`, `decision`, `adminUserId`, `reason`, `decidedAt`. Danh sách có `{ "items": [], "totalCount": 0, "page": 1, "pageSize": 20 }`; `page` >= 1, `pageSize` 1–100.

Kết quả AI được ghi qua `ModerationService.RecordAiResultAsync` bởi backend worker. Không cung cấp endpoint ghi kết quả AI giả.

`status` chỉ nhận `Passed`, `Flagged`, `Partial`, `Failed` cho bài viết. `summary` bắt buộc, tối đa 2.000 ký tự. `Flagged` cần `flagReason`; `Partial` cần `uncheckedScope`; `Passed`/`Flagged` không được khai còn phạm vi chưa kiểm tra. Chuyển trạng thái sai trả `409`, dữ liệu sai trả `400`. Cả bốn kết quả bài viết, kể cả `Failed`, đều chuyển bản gửi sang `PendingAdminReview`. `Failed` là lỗi xử lý, không phải bằng chứng nội dung đạt; Admin phải xem trực tiếp toàn bộ bài viết trước quyết định và ghi lý do. Video không gọi AI và đi thẳng vào hàng đợi Admin. AI không tự chuyển bản gửi sang `Published`.

Request Admin quyết định:

```json
{
  "decision": "Approve",
  "reason": "Đã xem trực tiếp nội dung"
}
```

`decision`: `Approve`, `RequestRevision`, `Reject`, `Remove`; `reason` bắt buộc, tối đa 2.000 ký tự. Ba quyết định đầu áp dụng khi `PendingAdminReview`: bài viết sau khi AI có kết quả hoặc thất bại, video ngay sau submit. Với bài viết `Failed`, Admin xem trước tiêu đề, ảnh đại diện và toàn bộ nội dung của đúng phiên bản đã gửi từ moderation submission trước khi quyết định; không lấy nội dung từ API bài viết công khai vì bản này chưa được xuất bản. `Remove` chỉ áp dụng cho phiên bản đang được công khai. Mỗi quyết định lưu Admin ID, thời gian, version và lý do. Chỉ một phiên bản của cùng `contentId` được đánh dấu đang công khai.

Lỗi validation trả `400` kèm `ProblemDetails`; bản không tồn tại `404`; chuyển trạng thái sai/xung đột version `409`. Khung này chưa nối Article/Video repository, storage hoặc AI worker. `mediaReference` chưa được xác minh là tệp thuộc người gửi; module nội dung cần ràng buộc trước khi dùng để xuất bản thật.

## AiChat

| Method và đường dẫn | Quyền | Mô tả |
|---|---|---|
| `POST /ai-chat/conversations` | Đăng nhập | Tạo conversation rỗng, trả `201` và `{id, createdAtUtc, updatedAtUtc}`. |
| `GET /ai-chat/conversations?page=1&pageSize=20` | Đăng nhập | Lịch sử conversation của chính mình. |
| `GET /ai-chat/conversations/{conversationId}` | Chủ hội thoại | Lấy một conversation; người khác nhận `404`. |
| `GET /ai-chat/conversations/{conversationId}/messages?page=1&pageSize=20` | Chủ hội thoại | Lịch sử message theo thứ tự cũ đến mới. |
| `POST /ai-chat/conversations/{conversationId}/messages` | Chủ hội thoại | Lưu câu hỏi User và tạo câu trả lời nếu AI sẵn sàng. |
| `GET /ai-chat/guest/session` | Guest | `{questionLimit, remainingQuestions}` của cookie session. |
| `POST /ai-chat/guest/messages` | Guest | Hỏi thử trong hạn mức session. |

Request gửi message (User/Guest):

```json
{ "content": "Có thể thay sữa bò bằng gì?" }
```

`content` sau trim dài 1–4.000 ký tự. Sai dữ liệu hoặc phân trang trả `400` với validation message. User gửi message nhận `200` gồm `userMessage`, `assistantMessage` (null khi chưa có) và `answerStatus` (`Answered` hoặc `Unavailable`). Câu hỏi User được lưu vào SQL Server ngay cả khi Gemini chưa hoạt động; không tạo assistant message giả. `GET messages` trả `{items, totalCount, page, pageSize}`. `page` >= 1, `pageSize` 1–100.

Guest giữ tối đa 3 lượt **có câu trả lời thành công** trong session 30 phút; không lưu DB/hồ sơ tài khoản. Trả `200` với `{status:"Answered", answer, remainingQuestions}` khi thành công; `503` với `status:"Unavailable"` và không trừ lượt khi adapter AI chưa có; `429` với `status:"LimitReached"` khi hết lượt. Cookie session có `HttpOnly`, `SameSite=Lax`; mức này không phải cơ chế chống lạm dụng tuyệt đối.

`GeminiService` gọi Gemini `generateContent` từ backend. Cấu hình `Gemini:ApiKey` và tùy chọn `Gemini:Model` (mặc định `gemini-3.8-flash`); key được gửi trong header `x-goog-api-key`. Chat Guest/User luôn dùng Gemini ở backend; không có chế độ trả lời giả. Khi provider lỗi, timeout hoặc phản hồi không hợp lệ, Guest nhận `503 Unavailable` và không bị trừ lượt; User nhận `200` cùng `answerStatus=Unavailable`, câu hỏi đã được lưu, assistant message chưa được tạo. Khi thành công, Guest trừ một lượt và User lưu cả câu hỏi/câu trả lời trong DB. Chat User hiện đọc hồ sơ qua `IProfileContextReader`; xem bổ sung Phase 2 bên dưới. Moderation service có prompt JSON nhưng chưa được gọi bởi background worker. Trước khi tích hợp FE, cần nối Auth/Identity và áp dụng migration `InitialModerationAiChat` cùng migration bổ sung các cột moderation mới lên SQL Server thử nghiệm.

## Tích hợp BE 3 (09/10/2026)

### Bổ sung Phase 2 (16/10/2026)

Mỗi câu hỏi User đọc lại hồ sơ theo ID đã xác thực qua `IProfileContextReader` và dùng cùng BMI/TDEE với Profile. Context JSON nội bộ gồm chế độ ăn, mục tiêu cân nặng, chiều cao/cân nặng, mức vận động, BMI/phân loại BMI người lớn, TDEE ước tính, khu vực tìm nhà hàng, dị ứng, thực phẩm cần tránh và thời điểm cập nhật. Không gửi ID tài khoản, email, số điện thoại hoặc ngày sinh đầy đủ trong context provider. Trường chưa khai báo/không tính được giữ `null`; danh sách rỗng chỉ có nghĩa chưa khai báo mục nào, không chứng minh không dị ứng. Không tự suy đoán chế độ ăn/mục tiêu/chỉ số còn thiếu.

FE dùng API Profile hiện có để hiển thị dữ liệu tham khảo trong sidebar, tách lỗi tải hồ sơ khỏi khung chat, có tải lại và cập nhật khi hồ sơ đổi. Guest không đọc hồ sơ tài khoản. Không thay request gửi câu hỏi, quota, cơ chế lưu/mở hội thoại, response hoặc provider Gemini. Không thêm endpoint hoặc migration. Thiếu key vẫn trả trạng thái Unavailable theo contract cũ. Test context có thể dùng provider chỉ dành cho test; câu trả lời thực tế của Gemini chưa được nghiệm thu trong Phase 2.

Sau khi có submission bài viết từ module nội dung, worker nền quét các bản Article `Checking` mới nhất từ DB, gọi Gemini ở backend và ghi kết quả. Lỗi provider/timeout/JSON không hợp lệ ghi `Failed` và đưa bản gửi vào hàng đợi Admin để xem trực tiếp toàn bộ nội dung. Các bản mới nhất có `Failed` + `Submitted` đã lưu trước thay đổi này được chuyển vào hàng đợi bằng migration; bản phiên bản cũ không được đưa lại vào queue. Worker bỏ qua phiên bản cũ. Admin không thể duyệt bản cũ khi đã có bản mới. Endpoint ghi kết quả AI giả đã được loại bỏ.

Trong trạng thái code ngày 09/10/2026, `POST /moderation/submissions` trả 503 cho Article vì BE 1 chưa có backend draft/version để xác minh contentId và owner; endpoint không tạo submission giả. Khi BE 1 hoàn tất, nối submit vào repository Article và mở lại đường này theo contract. Video gửi qua `/api/me/videos/{id}/submit`.

Video phải tạo/upload qua `/api/me/videos` trước; endpoint moderation chung từ chối `contentType=Video`. Từ quyết định mới ngày 10/10/2026, video không được kiểm tra bởi AI; `aiFlagStatus=NotSubmitted`, các trường AI là `null`. Admin phải xem trực tiếp media qua quyền Admin. `Approve`, `RequestRevision`, `Reject`, `Remove` vẫn dùng endpoint quyết định hiện có và lưu actor, thời điểm, lý do, phiên bản. Migration `VideoAdminOnlyModeration` chuyển các submission video cũ sang quy tắc này.

User chat gửi kèm vào Gemini phần hồ sơ **đã khai báo** gồm chế độ ăn và dị ứng. Guest không có phần này. Response gửi message User bổ sung `recipeSuggestions[]` gồm `id` và `name` từ các recipe active thật khi câu hỏi nhắc món/công thức/gợi ý; liên kết `/recipes/{id}`. Chat không tạo meal plan đã lưu. Cấu hình Development mặc định gọi Gemini thật khi có key; thiếu key trả Unavailable, không trả câu trả lời mẫu. Guest vẫn 3 lượt thành công trong session 30 phút phía server.
