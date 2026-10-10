# Bình luận và tương tác (BE1-07)

Các ID là GUID; thời gian UTC theo ISO 8601. `targetType` nhận `Article` hoặc `Video`; `targetId` là ID trong URL chi tiết. Bài viết chỉ tương tác khi có phiên bản đang xuất bản; video chỉ khi bản kiểm duyệt hiện tại đang xuất bản. Guest xem danh sách bình luận của nội dung công khai, User/Admin được tạo và tương tác. Nội dung không công khai trả 404.

## Bình luận

- `GET /api/comments?targetType=Article&targetId={id}&page=1&pageSize=20`: danh sách phẳng theo thời gian, trả `{items,totalCount,page,pageSize}`. Mỗi item có `id,targetType,targetId,parentId,authorId,body,status,createdAt,updatedAt,likeCount`. `parentId` giữ quan hệ phản hồi. Bình luận `Hidden`/`Removed` có `body:null`, vẫn hiển thị như mốc quan hệ nếu có phản hồi công khai.
- `GET /api/comments/{id}`: chi tiết bình luận còn hiện trên nội dung công khai.
- `POST /api/comments` (User/Admin): `{targetType,targetId,parentId?,body}`. Phản hồi chỉ được gắn vào bình luận cùng nội dung, còn hiện và ở cấp gốc. Trả 201 cùng item.
- `PUT /api/comments/{id}` (owner): `{body}`. Chỉ sửa bình luận `Visible`; trả item.
- `DELETE /api/comments/{id}` (owner): chuyển sang `Removed`, trả 204. Không xóa vật lý để giữ phản hồi.
- `GET /api/me/comments?page=1&pageSize=20`: danh sách của mình, kể cả đã ẩn/gỡ, có nội dung gốc để chủ tài khoản xem.
- `GET /api/admin/comments?search=&status=&targetType=&page=1&pageSize=20` (Admin): tìm/lọc; `GET /api/admin/comments/{id}` xem chi tiết. Admin thấy nội dung gốc.
- `POST /api/admin/comments/{id}/hide` hoặc `/remove` (Admin): `{reason}` bắt buộc, chuyển `Visible -> Hidden` hoặc `Visible/Hidden -> Removed`; trả item. Không yêu cầu AI.

`status` gồm `Visible`, `Hidden`, `Removed`. Body từ 1 đến 2.000 ký tự sau trim; lý do Admin từ 1 đến 1.000 ký tự. `page` từ 1, `pageSize` từ 1 đến 100. 400 dữ liệu sai; 401 chưa đăng nhập; 403 sai quyền; 404 nội dung/bình luận không tồn tại hoặc không xem được; 409 trạng thái không cho phép thao tác.

## Vote/like

- `PUT /api/articles/{id}/helpful` và `DELETE /api/articles/{id}/helpful` (User/Admin): đánh giá hữu ích bài viết.
- `PUT /api/videos/{id}/like` và `DELETE /api/videos/{id}/like` (User/Admin): thích video.
- `PUT /api/comments/{id}/like` và `DELETE /api/comments/{id}/like` (User/Admin): thích bình luận còn hiện.
- `GET /api/articles/{id}/helpful`, `GET /api/videos/{id}/like`, `GET /api/comments/{id}/like`: số liệu thực `{count,reactedByMe}`; Guest nhận `reactedByMe:false`.

PUT/DELETE idempotent, cùng user chỉ có một bản ghi trên một mục; response `{count,reactedByMe}` được tính lại từ dữ liệu đã lưu. Nội dung không công khai hoặc bình luận đã ẩn/gỡ trả 404. Chia sẻ video dùng URL hiện có, không có endpoint gửi tin nhắn/email. Favorite do BE 2 quản lý riêng.
