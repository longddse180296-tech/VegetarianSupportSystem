# Auth và phân quyền cơ bản

Guest là request chưa đăng nhập, không có hàng tài khoản hoặc role trong DB. Tài khoản chỉ có `User` hoặc `Admin`. Backend kiểm tra JWT và đối chiếu `sub`, `role`, trạng thái khóa với bảng `Users` ở mỗi request cần quyền. Token cho tài khoản đã xóa/khóa hoặc role đã đổi trả `401`; thiếu token/token sai trả `401`; role không đủ quyền trả `403`.

## Đăng ký

`POST /api/auth/register` (Guest). Body:

```json
{ "fullName": "Nguyen Van A", "email": "a@example.com", "password": "password-from-client", "confirmPassword": "password-from-client" }
```

`fullName` 1–150 ký tự, `email` hợp lệ tối đa 254 ký tự, mật khẩu 8–128 ký tự và phải khớp xác nhận. Request không có trường `role`; trường không khai báo (kể cả `role`) bị từ chối `400`. Email không phân biệt chữ hoa/thường; email trùng trả `409`. Đăng ký luôn tạo role `User`, lưu hash PBKDF2-SHA256 với salt riêng, không lưu mật khẩu thô. Thành công `201` với response như bên dưới.

## Đăng nhập

`POST /api/auth/login` (Guest). Body: `{ "email": "a@example.com", "password": "..." }`. Sai thông tin hoặc tài khoản khóa trả `401` cùng thông báo chung. Thành công `200`:

```json
{
  "accessToken": "<JWT>",
  "tokenType": "Bearer",
  "expiresAtUtc": "2026-10-03T08:00:00Z",
  "user": { "id": "<Users.Id>", "fullName": "Nguyen Van A", "email": "a@example.com", "role": "User" }
}
```

JWT hết hạn sau 1 giờ, có `sub=Users.Id` và `role=User|Admin`; không lấy hai giá trị này từ request. API dùng `Authorization: Bearer <accessToken>`. FE chỉ dùng role để trình bày giao diện; API quyết định quyền truy cập.

## Admin ban đầu

Sau khi áp dụng migration, người vận hành bật `InitialAdmin__Enabled=true` cho **một lần chạy** và cung cấp `InitialAdmin__FullName`, `InitialAdmin__Email`, `InitialAdmin__Password` (12–128 ký tự) bằng biến môi trường hoặc secret store. Backend chỉ tạo Admin nếu DB chưa có Admin; email trùng tài khoản khác khiến startup báo lỗi, không tự nâng quyền tài khoản cũ. Tắt cấu hình seed và xóa secret khỏi môi trường sau khi tạo. Không đặt password hoặc JWT signing key trong repo. Sử dụng `Authentication__Jwt__Issuer`, `Authentication__Jwt__Audience`, `Authentication__Jwt__SigningKey` (ít nhất 32 byte UTF-8) cho môi trường ngoài Development.

`POST /api/dev-auth/token` chỉ tồn tại trong Development để kiểm thử; không phải đăng nhập thật. Token dev cũng phải khớp ID và role của tài khoản hiện có khi gọi endpoint có quyền.
