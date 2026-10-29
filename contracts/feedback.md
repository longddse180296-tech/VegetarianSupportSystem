# Góp ý gửi Admin

- Guest/User/Admin gửi từ trang Liên hệ. Góp ý được lưu trong database, chỉ Admin xem; không gửi GitHub hay email tự động.
- `POST /api/feedback`: `{ name, email, subject, message }`. Tên 1–100, email hợp lệ tối đa 254, tiêu đề 1–150, nội dung 1–4000 ký tự sau trim. `201`: `{ id, createdAt }`. `400` với ProblemDetails khi sai dữ liệu; `413` nếu request > 32 KB; `429` nếu vượt 5 lần/15 phút theo IP. Thành công chỉ sau khi ghi DB.
- `GET /api/admin/feedback?page=1&pageSize=10&isRead=false`: Admin, `200`: `{ items: [{ id, name, email, subject, message, createdAt, readAt }], total, page, pageSize }`. Mới nhất trước, page >= 1, pageSize 1–50; bỏ isRead để xem tất cả. Không có API công khai đọc góp ý.
- `POST /api/admin/feedback/{id}/read`: Admin, đánh dấu đã đọc idempotent; `204` thành công, `404` nếu không tồn tại.
- Hai API Admin trả `401` khi chưa đăng nhập và `403` nếu không có quyền Admin. Backend kiểm tra quyền.
- Nội dung là plain text, không nhận file đính kèm. Form nhắc không gửi mật khẩu, mã đăng nhập hoặc dữ liệu sức khỏe nhạy cảm.
- Migration: `AddContactFeedback`; áp dụng migration trước khi dùng.
