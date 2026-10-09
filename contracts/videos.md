# Hợp đồng video BE 3

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
| POST | `/api/me/videos/{id}/submit` | Tạo moderation submission cho đúng video/owner/phiên bản. |

`VideoDetails` gồm `id,title,description,categoryId,uploadStatus,aiFlagStatus,adminReviewStatus,version,aiSummary,aiUncheckedScope,adminReason,mediaUrl,thumbnailUrl,viewCount,favoriteCount,createdAtUtc`. `uploadStatus`: `AwaitingUpload`, `Processing`, `Ready`, `Failed`. `favoriteCount` đếm bản lưu thực trong Favorites; lượt thích thuộc BE 1 và chưa có trong contract này. Upload đồng bộ kiểm tra chữ ký tệp và ghi file vào `Storage:PrivateRoot` (mặc định `.local/media` phía server), không phục vụ static file. Sau lỗi hoặc trạng thái Processing bị ngắt có thể tải lại. Không có transcoding ở MVP này; Ready chỉ xác nhận tệp đã được lưu, không xác nhận codec có phát được trên mọi trình duyệt. `POST /views` đếm một lần trong session server khi trình phát bắt đầu chạy.

Lỗi: 400 dữ liệu/tệp sai, 401 thiếu token, 403 sai role, 404 không thuộc owner/chưa công khai, 409 đang chờ duyệt hoặc trạng thái không cho phép, 503 storage không khả dụng. Ảnh/video riêng tư không đọc được chỉ bằng media URL. Bản Published cũ vẫn được phục vụ khi bản sửa đang chờ duyệt.
