# Phiên tài khoản và gia hạn access token

Yêu cầu ngày 28/10/2026: access token hết hạn không tự đăng xuất khi phiên còn hợp lệ; một tài khoản chỉ có một phiên trình duyệt.

## Luồng xử lý

- `AccountSessionService` cấp bí mật cookie ngẫu nhiên và phiên 7 ngày. `AccountSessionRepository` cập nhật nguyên tử phiên trong Users, chỉ nhận khi tài khoản còn hoạt động, mật khẩu và vai trò chưa thay đổi. Login tăng phiên bản token để JWT đời cũ không có sid không thể sống lại sau khi logout.
- `JwtAccessTokenIssuer` gắn sid. `AccountTokenValidator` đối chiếu sid ở backend; đăng nhập ở trình duyệt mới làm JWT/cookie cũ mất hiệu lực. Hub dinh dưỡng kiểm tra lại mỗi lần gọi.
- `AuthController` giữ bí mật trong cookie HttpOnly, chỉ JSON hóa access token và thông tin tài khoản. Gia hạn/đăng xuất bằng cookie yêu cầu header riêng, SameSite Strict; ngoài Development bắt buộc cookie Secure.
- `apiClient` gom request gia hạn đồng thời, thử lại request một lần. Không tự xóa phiên khi lỗi mạng/5xx; không để phản hồi gia hạn đến muộn khôi phục phiên sau logout hoặc ghi đè lần login mới.
- `AuthContext` kiểm tra mỗi 30 giây khi trang hiển thị và khi quay lại tab. `LoginForm` hiển thị lý do phiên kết thúc. Nhiều tab dùng chung cookie, không giới hạn một tab.
- Logout thu hồi đúng sessionId, kể cả access token hết hạn. Khóa tài khoản/đổi mật khẩu xóa phiên; mở khóa không phục hồi phiên cũ.

## Giới hạn và vận hành

- Phiên tối đa 7 ngày, không gia hạn vô hạn. Bí mật refresh giữ nguyên trong phiên, thay khi đăng nhập lại và thu hồi khi kết thúc phiên; chỉ hash được lưu trong DB.
- Đây là một phiên được cấp cho mỗi tài khoản, không phải nhận diện phần cứng hoặc phòng chống sao chép token/cookie.
- Token cũ không có cookie cần đăng nhập lại một lần. Không cần xóa tài khoản hay dữ liệu nghiệp vụ.
- Migration AddAccountBrowserSession chỉ thêm ba cột nullable và index, không thay dữ liệu cũ.
- Thử nghiệm bằng `dotnet run --project backend/tests/IntegrationTests -c Release -- --auth-sessions-only` trên database ngẫu nhiên tự dọn, hai cookie jar độc lập và JWT thật. Kiểm thử frontend kiểm tra gia hạn, request đồng thời, lỗi dịch vụ, phiên bị thay thế và phản hồi đến muộn.

Hợp đồng chi tiết tại [auth.md](../contracts/auth.md). Không ghi token, cookie hoặc mật khẩu vào log.

Kiểm tra hoàn tất: 24 kiểm tra phiên qua HTTP/JWT thật, 268 kiểm tra Core Data/SignalR, 66 kiểm thử frontend; lint và build FE/BE đạt. Database thật được sao lưu COPY_ONLY/CHECKSUM và kiểm tra bản sao trước khi áp dụng migration; số lượng tài khoản, công thức, nguyên liệu giữ nguyên. Chưa kiểm tra giao diện bằng trình duyệt vì công cụ trình duyệt đang bị tắt.
