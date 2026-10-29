# Hợp đồng video BE 3

## Metadata thời lượng và âm thanh (27/10/2026)

`VideoDetails` trả thêm `durationSeconds: number | null` (giây, có thể có phần thập phân), `hasAudio: boolean | null`, `metadataStatus: "Processing" | "Ready" | "Unavailable"`.
`Ready` khi đọc được thời lượng; `Processing` khi đã có tệp nhưng chưa đọc metadata; `Unavailable` khi chưa có tệp hoặc không đọc được. `hasAudio=false` nghĩa là không có luồng âm thanh, không đánh giá nội dung giọng nói. Tệp có luồng audio vẫn có thể chứa đoạn im lặng.

- FE đọc metadata tệp đã chọn để xem trước, có timeout và hủy khi đổi tệp; không gửi thời lượng tự khai báo.
- Upload video: server dùng FFprobe đọc video stream, thời lượng và sự tồn tại audio stream trước khi chuyển sang Ready. Giữ nguyên tệp và âm thanh; không transcoding hoặc tạo voice.
- Tệp có chữ ký MP4/WEBM nhưng không đọc được video/thời lượng trả 400; công cụ/storage tạm thời không khả dụng trả 503, bản nháp được giữ để thử lại.
- Metadata lưu riêng trong `VideoMediaMetadata` theo khóa tệp. Public đọc metadata của media trong phiên bản Published; owner đọc media hiện tại. Thay tệp nháp không sửa thời lượng bản Published.
- Worker bổ sung cả media cũ và các phiên bản đã gửi, tối đa 10 tệp/lượt mỗi phút. Tệp thiếu/hỏng lưu null, thử lại sau một giờ. Không ghi thời lượng mặc định hoặc tạo dữ liệu mẫu.
- FE hiển thị `m:ss` hoặc `h:mm:ss`, “Đang xử lý” trong lúc chờ, ẩn nhãn khi không xác định. Trình phát có controls và không mặc định muted; người xem tự điều chỉnh âm lượng.

Cài FFprobe trên máy chạy API (trong PATH) hoặc cấu hình `VideoMetadata:FfprobePath`/biến môi trường `VideoMetadata__FfprobePath` trỏ đến executable. Mỗi lượt probe có timeout 20 giây, tối đa hai tiến trình đồng thời, không chạy shell hoặc truy cập URL tùy ý. Xem hướng dẫn trong `docs/video-metadata.md`.

JSON dùng camelCase; enum moderation là tên string. Các endpoint ghi cần JWT role User/Admin, trừ danh sách/chi tiết/media công khai. ID do server tạo; không dùng URL media do client cung cấp.

| Method | Endpoint | Mô tả |
|---|---|---|
| GET | `/api/videos?page=1&pageSize=20` | Chỉ video có phiên bản đang Published; `VideoPage`. |
| GET | `/api/videos/{id}` | Chi tiết bản Published, 404 nếu chưa duyệt/gỡ. |
| POST | `/api/videos/{id}/views` | Ghi lượt bắt đầu phát của video công khai. |
| GET | `/api/videos/{id}/media`, `/thumbnail` | Đọc media qua kiểm tra quyền. Guest chỉ đọc bản Published; owner/Admin đọc bản nháp. Hỗ trợ HTTP Range. |
| GET | `/api/me/videos?page=1&pageSize=20`, `/api/me/videos/{id}` | Danh sách/chi tiết của owner. Người khác nhận 404. |
| POST | `/api/me/videos` | Tạo nháp `{title,description,categoryId?}`. |
| PUT | `/api/me/videos/{id}` | Sửa metadata nháp. |
| POST | `/api/me/videos/{id}/media` | `multipart/form-data`, field `file`, MP4/WEBM tối đa 200 MB. |
| POST | `/api/me/videos/{id}/thumbnail` | `multipart/form-data`, field `file`, JPG/PNG/WEBP tối đa 10 MB. |
| POST | `/api/me/videos/{id}/submit` | Tạo submission cho đúng video/owner/phiên bản; vào hàng đợi Admin ngay, không gọi AI. |

`VideoDetails` gồm `id,title,description,categoryId,uploadStatus,aiFlagStatus,adminReviewStatus,version,aiSummary,aiUncheckedScope,adminReason,mediaUrl,thumbnailUrl,viewCount,favoriteCount,createdAtUtc,authorName`. `authorName` là họ tên hiện tại của người đăng, `null` nếu tài khoản không còn; không trả email. `uploadStatus`: `AwaitingUpload`, `Processing`, `Ready`, `Failed`. `favoriteCount` đếm bản lưu thực trong Favorites; lượt thích thuộc BE 1 và chưa có trong contract này. Upload đồng bộ kiểm tra chữ ký tệp và ghi file vào `Storage:PrivateRoot` (mặc định `.local/media` phía server), không phục vụ static file. Sau lỗi hoặc trạng thái Processing bị ngắt có thể tải lại. Không có transcoding ở MVP này; Ready chỉ xác nhận tệp đã được lưu, không xác nhận codec có phát được trên mọi trình duyệt. `POST /views` đếm một lần trong session server khi trình phát bắt đầu chạy.

Với video, `aiFlagStatus=NotSubmitted`, các trường kết quả AI là `null`, `adminReviewStatus=PendingAdminReview` ngay sau submit. Admin xem trực tiếp media và dùng `POST /api/admin/moderation/submissions/{submissionId}/decisions` để `Approve`, `RequestRevision` hoặc `Reject`, có lý do. Video chưa duyệt không xuất hiện ở API công khai; owner/Admin vẫn xem được media riêng tư. Các video đã gửi theo luồng cũ được chuyển sang hàng đợi Admin bằng migration `VideoAdminOnlyModeration`. Bài viết vẫn giữ luồng AI riêng.

Lỗi: 400 dữ liệu/tệp sai, 401 thiếu token, 403 sai role, 404 không thuộc owner/chưa công khai, 409 đang chờ duyệt hoặc trạng thái không cho phép, 503 storage không khả dụng. Ảnh/video riêng tư không đọc được chỉ bằng media URL. Bản Published cũ vẫn được phục vụ khi bản sửa đang chờ duyệt.
