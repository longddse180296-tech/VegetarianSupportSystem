# Auth và phân quyền cơ bản

Guest là request chưa đăng nhập, không có hàng tài khoản hoặc role trong DB. Tài khoản chỉ có `User` hoặc `Admin`. Backend kiểm tra JWT và đối chiếu `sub`, `role`, trạng thái khóa với bảng `Users` ở mỗi request cần quyền. Token cho tài khoản đã xóa/khóa hoặc role đã đổi trả `401`; thiếu token/token sai trả `401`; role không đủ quyền trả `403`.

## Đăng ký

`POST /api/auth/register` (Guest). Body:

```json
{ "fullName": "Nguyen Van A", "email": "a@example.com", "password": "password-from-client", "confirmPassword": "password-from-client" }
```

`fullName` 1–150 ký tự, `email` hợp lệ tối đa 254 ký tự, mật khẩu 6–128 ký tự bất kỳ không chứa khoảng trắng và phải khớp xác nhận. Request không có trường `role`; trường không khai báo (kể cả `role`) bị từ chối `400`. Email được cắt khoảng trắng đầu/cuối, lưu bản chuẩn hóa để so trùng không phân biệt chữ hoa/thường; email trùng trả `409`. Đăng ký luôn tạo role `User` và hồ sơ rỗng ban đầu, lưu hash PBKDF2-SHA256 với salt riêng, không lưu mật khẩu thô. Thành công `201` với response như bên dưới.

## Đăng nhập

`POST /api/auth/login` (Guest). Body: `{ "email": "a@example.com", "password": "..." }`. Email và mật khẩu bắt buộc; email sai định dạng hoặc quá 254 ký tự trả `400` với lỗi theo trường. Trường ngoài hợp đồng (kể cả `role` và `rememberMe`) cũng bị từ chối `400`; FE không gửi quyền hoặc lựa chọn lưu phiên trong body. Sai thông tin hoặc tài khoản khóa trả `401` cùng thông báo chung. Thành công `200`:

```json
{
  "accessToken": "<JWT>",
  "tokenType": "Bearer",
  "expiresAtUtc": "2026-10-03T08:00:00Z",
  "user": { "id": "<Users.Id>", "fullName": "Nguyen Van A", "email": "a@example.com", "role": "User", "isLocked": false }
}
```

JWT hết hạn sau 1 giờ, có `sub=Users.Id`, `role=User|Admin` và `jti` riêng cho từng token; không lấy các giá trị này từ request. API dùng `Authorization: Bearer <accessToken>`. FE chỉ dùng role để trình bày giao diện; API quyết định quyền truy cập.

## Phiên đăng nhập và tích hợp FE

`expiresAtUtc` là thời điểm hết hạn tuyệt đối theo UTC của access token, áp dụng cả khi chọn “Ghi nhớ đăng nhập”. Không có endpoint refresh token. FE 1 lưu token theo lựa chọn của người dùng: `localStorage` khi ghi nhớ, `sessionStorage` khi chỉ dùng trong tab/phiên trình duyệt. Sau tải lại trang, FE kiểm tra hạn token và gọi `/api/auth/me` trước khi coi người dùng đã đăng nhập. Không dùng user cache hoặc role cache làm bằng chứng xác thực khi `/me` lỗi. Token hết hạn hoặc `/me` trả `401` thì xóa phiên và yêu cầu đăng nhập lại; sự cố mạng có thể hiển thị lỗi kết nối nhưng không cấp quyền từ cache. Khi logout, FE gọi API với token hiện tại rồi xóa dữ liệu phiên ở cả hai kho; nếu request lỗi mạng, FE vẫn xóa phiên cục bộ nhưng không được tuyên bố token phía server đã thu hồi. BE không kéo dài hạn token theo lựa chọn ghi nhớ.

## Tài khoản hiện tại và đăng xuất

`GET /api/auth/me` yêu cầu Bearer token hợp lệ. Backend lấy `sub`, tra tài khoản trong DB và trả `{ "id", "fullName", "email", "role", "isLocked" }`; không trả password hash. Token không hợp lệ, đã thu hồi hoặc tài khoản bị khóa trả `401`.

`POST /api/auth/logout` yêu cầu Bearer token hợp lệ, không cần body; thành công trả `204`. Backend lưu `jti` đã thu hồi đến thời điểm token hết hạn. Mọi request sau đó dùng chính token này trả `401`, kể cả khi FE vẫn giữ token. Token khác của cùng tài khoản vẫn có hiệu lực. Hiện chưa phát refresh token, nên không có refresh token cần thu hồi; bảng token thu hồi xóa các hàng đã hết hạn khi có lần logout tiếp theo.

## Admin ban đầu

Sau khi áp dụng migration, người vận hành bật `InitialAdmin__Enabled=true` cho **một lần chạy** và cung cấp `InitialAdmin__FullName`, `InitialAdmin__Email`, `InitialAdmin__Password` (6–128 ký tự bất kỳ không chứa khoảng trắng) bằng biến môi trường hoặc secret store. Backend chỉ tạo Admin nếu DB chưa có Admin; email trùng tài khoản khác khiến startup báo lỗi, không tự nâng quyền tài khoản cũ. Tắt cấu hình seed và xóa secret khỏi môi trường sau khi tạo. Không đặt password hoặc JWT signing key trong repo. Sử dụng `Authentication__Jwt__Issuer`, `Authentication__Jwt__Audience`, `Authentication__Jwt__SigningKey` (ít nhất 32 byte UTF-8) cho môi trường ngoài Development.

`POST /api/dev-auth/token` chỉ tồn tại trong Development để kiểm thử; không phải đăng nhập thật. Token dev cũng phải khớp ID và role của tài khoản hiện có khi gọi endpoint có quyền.

## Quên và đặt lại mật khẩu

`POST /api/auth/forgot-password` (Guest) nhận `{ "email": "a@example.com" }`. Email bắt buộc, hợp lệ và tối đa 254 ký tự; body có trường ngoài hợp đồng trả `400`. Khi SMTP đã cấu hình, mọi email hợp lệ đều nhận `202` và cùng response `{ "message": "Nếu email có tài khoản hợp lệ, hướng dẫn đặt lại mật khẩu sẽ được gửi." }`, kể cả email không tồn tại, tài khoản bị khóa, yêu cầu bị giới hạn theo tài khoản hoặc gửi email thất bại. Khi chưa cấu hình SMTP và URL đặt lại mật khẩu, endpoint trả `503` như nhau cho mọi email. Không gửi token hoặc trạng thái tài khoản trong response.

BE phát token ngẫu nhiên 32 byte, gửi trong link đến trang FE `/auth/reset-password?token=...` (hash router hiện tại đặt đường dẫn sau `#`), chỉ lưu SHA-256 hash trong DB. Token hết hạn sau 20 phút, chỉ dùng một lần; yêu cầu mới làm mất hiệu lực link cũ. Giới hạn theo tài khoản: tối thiểu 5 phút giữa các email và tối đa 5 yêu cầu trong 24 giờ. Giới hạn theo IP: tối đa 5 request quên mật khẩu và 10 request đặt lại trong mỗi 15 phút; vượt mức trả `429` không phụ thuộc email có tồn tại hay không.

`POST /api/auth/reset-password` (Guest) nhận:

```json
{ "token": "<token từ link>", "newPassword": "new-password", "confirmPassword": "new-password" }
```

Mật khẩu mới dài 6–128 ký tự, không chứa khoảng trắng và phải khớp xác nhận; sai dữ liệu trả `400` kèm lỗi theo trường. Link sai/hết hạn/đã dùng trả `400` với thông báo chung. Thành công trả `204`, lưu hash mật khẩu mới và tăng phiên bản phiên của tài khoản trong cùng transaction. Mọi JWT phát trước lần đổi mật khẩu đều trả `401` ở request kế tiếp; người dùng phải đăng nhập lại. Không có refresh token.

SMTP được cấu hình ngoài repo qua `PasswordReset__ResetPageUrl`, `PasswordReset__Smtp__Host`, `PasswordReset__Smtp__Port`, `PasswordReset__Smtp__From`, tùy chọn `PasswordReset__Smtp__Username`, `PasswordReset__Smtp__Password`, `PasswordReset__Smtp__EnableSsl`. Với SMTP từ xa, yêu cầu STARTTLS (`EnableSsl=true`, mặc định); chỉ SMTP loopback dành cho thử nghiệm mới được tắt SSL. URL FE phải dùng HTTPS, trừ localhost khi phát triển. Không ghi mật khẩu SMTP, token reset, URL chứa token hoặc mật khẩu mới vào log. FE 1 cần thay helper trả thành công giả và bổ sung trang nhập mật khẩu mới; sau khi đọc token từ URL nên xóa token khỏi thanh địa chỉ.
