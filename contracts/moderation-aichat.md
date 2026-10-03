# Hợp đồng API — Moderation và AiChat

Ngày cập nhật: 02/10/2026. JSON dùng `camelCase`; enum được serialize bằng **tên string**. API base là `/api`. Lược đồ máy đọc được sinh tại `/openapi/v1.json` khi chạy Development.

## Xác thực và quyền

- Guest là người chưa đăng nhập, không có user ID trong DB. Hai endpoint `/ai-chat/guest/*` dùng cookie session phía server và trả `403` cho người đã đăng nhập.
- Endpoint tài khoản cần Bearer JWT hợp lệ với claim `sub` và `role` là `User` hoặc `Admin`; endpoint `/admin/moderation/*` cần `role=Admin`. User ID và role của các endpoint nghiệp vụ không nhận từ request body.
- API kiểm tra issuer, audience, hạn token, chữ ký và đối chiếu `sub`/`role` với tài khoản đang hoạt động trong DB. Cấu hình qua `Authentication__Jwt__Issuer`, `Authentication__Jwt__Audience`, `Authentication__Jwt__SigningKey` (ít nhất 32 byte UTF-8), đặt trong môi trường hoặc secret store. Token thật lấy tại `/api/auth/register` hoặc `/api/auth/login`; xem [auth.md](auth.md).
- Thiếu token/token không hợp lệ: `401`; role sai: `403`. Cả hai mã được khai báo trong OpenAPI cho endpoint cần quyền. Danh tính hợp lệ là tiền đề để dùng các endpoint cần DB.
- **Chỉ trong Development**, `POST /api/dev-auth/token` nhận ID và role của tài khoản có thật để thử endpoint; token trả về phải khớp tài khoản trong DB khi sử dụng. Token hết hạn sau 1 giờ; nếu không cấu hình signing key cố định thì token cũ hết hiệu lực mỗi lần restart backend. Endpoint này không được ánh xạ ngoài Development và không thay cho đăng nhập thật.

## Moderation

`contentType`: `Article` hoặc `Video`. Hai trạng thái độc lập:

- `aiFlagStatus`: `NotSubmitted`, `Checking`, `Passed`, `Flagged`, `Partial`, `Failed`.
- `adminReviewStatus`: `Draft`, `Submitted`, `PendingAdminReview`, `Published`, `RevisionRequested`, `Rejected`, `Removed`.

| Method và đường dẫn | Quyền | Mô tả |
|---|---|---|
| `POST /moderation/submissions` | User/Admin | Gửi bản nội dung vào kiểm duyệt; trả `201`. |
| `GET /moderation/submissions?contentType=&page=1&pageSize=20` | User/Admin | Danh sách phiên bản của chính mình, mới nhất trước. |
| `GET /moderation/submissions/{id}` | Chủ nội dung | Chi tiết bản gửi. Người khác nhận `404`. |
| `POST /moderation/submissions/{id}/retry-ai` | Chủ nội dung | Đưa bản có AI `Failed` về `Checking`; trả `200`. |
| `GET /admin/moderation/submissions?contentType=&aiStatus=&adminStatus=&page=1&pageSize=20` | Admin | Tìm/lọc các bản gửi. |
| `GET /admin/moderation/submissions/queue?contentType=&aiStatus=&page=1&pageSize=20` | Admin | Lấy hàng đợi `PendingAdminReview`. |
| `GET /admin/moderation/submissions/{id}` | Admin | Chi tiết và nhật ký quyết định. |
| `POST /admin/moderation/submissions/{id}/decisions` | Admin | Quyết định; trả `200`. |
| `POST /admin/moderation/submissions/{id}/mock-ai-result` | Admin, chỉ Development | Ghi kết quả AI mẫu để thử luồng; ngoài Development trả `404`. |

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

Để gửi phiên bản mới, truyền `contentId` đã có. Chỉ được gửi khi phiên bản mới nhất có trạng thái `RevisionRequested`, `Rejected` hoặc `Published`; `contentType` và chủ sở hữu không đổi. `Video` cần `mediaReference` trỏ tới tệp đã được lưu bởi module video sau này. Tiêu đề tối đa 200 ký tự, nội dung tối đa 50.000 ký tự, media reference tối đa 2.000 ký tự. Mỗi lần gửi tạo snapshot và version mới, ban đầu `aiFlagStatus=Checking`, `adminReviewStatus=Submitted`, `isCurrentPublished=false`. Nội dung mới không thay thế bản đang công khai khi chưa được Admin duyệt.

Response bản gửi gồm `id`, `contentId`, `version`, `contentType`, `ownerUserId`, `title`, `textContent`, `mediaReference`, `aiFlagStatus`, `adminReviewStatus`, `aiSummary`, `aiFlagReason`, `aiCheckedScope`, `aiUncheckedScope`, `aiCheckedAt`, `submittedAt`, `createdAtUtc`, `updatedAtUtc`, `isCurrentPublished`, `decisions[]`. `aiFlagReason` bắt buộc khi AI `Flagged`, có thể có khi `Partial`; luôn `null` khi `Passed`/`Failed`. Mỗi quyết định có `id`, `version`, `decision`, `adminUserId`, `reason`, `decidedAt`. Danh sách có `{ "items": [], "totalCount": 0, "page": 1, "pageSize": 20 }`; `page` >= 1, `pageSize` 1–100.

Kết quả AI thật được ghi qua `ModerationService.RecordAiResultAsync` bởi backend worker đáng tin cậy. Để thử luồng khi chưa tích hợp Gemini, Admin có endpoint mock **chỉ trong Development**. Request ví dụ:

```json
{
  "status": "Flagged",
  "summary": "Có nội dung cần Admin xem lại",
  "checkedScope": "Tiêu đề và văn bản",
  "uncheckedScope": null,
  "flagReason": "Tuyên bố sức khỏe cần nguồn kiểm chứng"
}
```

`status` chỉ nhận `Passed`, `Flagged`, `Partial`, `Failed`. `summary` bắt buộc, tối đa 2.000 ký tự. `Flagged` cần `flagReason`; `Partial` cần `uncheckedScope`; `Passed`/`Flagged` không được khai còn phạm vi chưa kiểm tra. Chuyển trạng thái sai trả `409`, dữ liệu sai trả `400`. Khi kết quả là `Passed`, `Flagged` hoặc `Partial`, bản gửi chuyển sang `PendingAdminReview`; `Failed` vẫn ở `Submitted` và có thể thử lại. AI không tự chuyển bản gửi sang `Published`.

Request Admin quyết định:

```json
{
  "decision": "Approve",
  "reason": "Đã xem nội dung và phạm vi AI kiểm tra"
}
```

`decision`: `Approve`, `RequestRevision`, `Reject`, `Remove`; `reason` bắt buộc, tối đa 2.000 ký tự. Ba quyết định đầu chỉ áp dụng khi chờ Admin sau khi AI hoàn tất. `Remove` chỉ áp dụng cho phiên bản đang được công khai. Mỗi quyết định lưu Admin ID, thời gian, version và lý do. Chỉ một phiên bản của cùng `contentId` được đánh dấu đang công khai.

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

`GeminiService` gọi Gemini `generateContent` từ backend. Cấu hình `Gemini:ApiKey` và tùy chọn `Gemini:Model` (mặc định `gemini-3.8-flash`); key được gửi trong header `x-goog-api-key`. Trong cấu hình local của máy phát triển, đặt `AiChat:UseMockResponses=false` để chat Guest/User gọi Gemini. Khi provider lỗi, timeout hoặc phản hồi không hợp lệ, Guest nhận `503 Unavailable` và không bị trừ lượt; User nhận `200` cùng `answerStatus=Unavailable`, câu hỏi đã được lưu, assistant message chưa được tạo. Khi thành công, Guest trừ một lượt và User lưu cả câu hỏi/câu trả lời trong DB. Chat chưa tham chiếu hồ sơ User. Moderation service có prompt JSON nhưng chưa được gọi bởi background worker. Trước khi tích hợp FE, cần nối Auth/Identity và áp dụng migration `InitialModerationAiChat` cùng migration bổ sung các cột moderation mới lên SQL Server thử nghiệm.
