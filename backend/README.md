# Backend

ASP.NET Core Web API, C#, .NET 10 của Vegetarian Support. Nền Moderation và AiChat đã có entity, repository, controller và migration ban đầu. Chat luôn gọi Gemini từ backend; thiếu key hoặc lỗi provider trả trạng thái Unavailable, không tạo câu trả lời giả.

Solution `Backend.sln` gồm bốn project production Clean Architecture: `Api`, `Application`, `Domain`, `Infrastructure`, hai project kiểm thử Domain.Tests/IntegrationTests và launcher Backend. Api tham chiếu Application/Infrastructure; Infrastructure tham chiếu Application; Application tham chiếu Domain. File `Backend.csproj` ở thư mục này là launcher phát triển, để chạy API bằng lệnh ngắn `dotnet run` mà không sao chép startup code.

Từ thư mục backend: `dotnet build Backend.sln -c Release`, rồi `dotnet run`. Lệnh này chuyển tiếp tới `src/Api/Api.csproj`; có thể dùng `dotnet run --project src/Api --launch-profile http` khi cần chạy trực tiếp project API. API chạy tại http://localhost:5080. Swagger UI ở `/swagger` và OpenAPI JSON ở `/openapi/v1.json`, chỉ bật trong Development; `/` chuyển tới Swagger UI trong môi trường này. Xem hợp đồng Moderation/AiChat ở `../contracts/moderation-aichat.md` và phần migration BE 2 ở `../docs/be2-migration-handoff.md`.

Package SQL hiện có:

- `Microsoft.EntityFrameworkCore.SqlServer` trong `Infrastructure`.
- `Microsoft.EntityFrameworkCore.Tools` trong `Infrastructure`.
- `Microsoft.EntityFrameworkCore.Design` trong `Api`.

Connection string phát triển mặc định nằm trong `src/Api/appsettings.json`; có thể ghi đè bằng biến môi trường hoặc backend/.env trong Development. Không commit secret. Trên máy mới phải áp dụng migration vào đúng database; tài khoản thực được đăng ký/đăng nhập qua API. JWT tự gia hạn bằng cookie phiên; đăng nhập trình duyệt mới kết thúc phiên cũ, xem [hợp đồng xác thực](../contracts/auth.md).

## Quên mật khẩu qua email

Backend đã có `POST /api/auth/forgot-password` để nhận email và gửi liên kết đặt lại mật khẩu, cùng `POST /api/auth/reset-password` để đổi mật khẩu bằng token trong liên kết. Hợp đồng request/response và giới hạn gửi nằm ở [`contracts/auth.md`](../contracts/auth.md). Áp dụng migration của backend lên SQL Server trước khi thử với tài khoản đã đăng ký.

Trong môi trường Development, sao chép `.env.example` thành `.env` ở thư mục `backend`, rồi điền SMTP host, port, địa chỉ From và thông tin đăng nhập nếu máy chủ yêu cầu. `.env` đã được Git bỏ qua; không đưa mật khẩu SMTP vào source hoặc frontend. `PasswordReset__ResetPageUrl` phải trỏ tới trang đặt lại mật khẩu của frontend; khi triển khai thật dùng URL HTTPS. SMTP từ xa cần STARTTLS (`PasswordReset__Smtp__EnableSsl=true`); chỉ tắt SSL để thử với SMTP chạy trên loopback. Khởi động lại API sau khi đổi cấu hình.

Với Gmail, mẫu đã dùng `smtp.gmail.com:587` và STARTTLS. Điền cùng địa chỉ Gmail vào `PasswordReset__Smtp__From` và `PasswordReset__Smtp__Username`, điền **mật khẩu ứng dụng** vào `PasswordReset__Smtp__Password` (không dùng mật khẩu đăng nhập Gmail). Google yêu cầu bật xác minh 2 bước để tạo mật khẩu ứng dụng; một số tài khoản tổ chức có thể không có tùy chọn này. Xem [hướng dẫn Gmail SMTP](https://support.google.com/a/answer/176600) và [mật khẩu ứng dụng](https://support.google.com/accounts/answer/185833) của Google.

Nếu thiếu cấu hình SMTP, endpoint quên mật khẩu trả `503`; khi đã cấu hình, email hợp lệ trả `202` với cùng thông báo cho cả địa chỉ có và không có tài khoản. Việc nhận `202` không xác nhận máy chủ thư đã phát thư đến hộp thư. Cần thử bằng một tài khoản test và hộp thư test trên SMTP của môi trường triển khai.

Để thử API có quyền, đăng nhập tài khoản thực bằng POST /api/auth/login rồi dán accessToken vào Authorize của Swagger. Endpoint dev-auth chỉ dành cho Development và phải khớp tài khoản hiện có; không dùng để thay luồng đăng nhập demo.

Gemini đọc key/model từ cấu hình backend; cấu hình chung dùng Gemini__ApiKey/Gemini__Model, kiểm duyệt có Gemini__ModerationApiKey/Gemini__ModerationModel riêng. Không đưa key vào frontend. Gọi thật có thể dùng quota và phụ thuộc model được cấp quyền. Metadata video cần FFprobe theo [hướng dẫn video](../docs/video-metadata.md).

HTTP local giúp chạy profile phát triển không cần cài chứng chỉ. Môi trường ngoài Development bật chuyển hướng HTTPS; cần cấu hình HTTPS trên host triển khai.

Phân chia trách nhiệm đề xuất cho 3 thành viên:

1. Tài khoản, phân quyền, hồ sơ, dữ liệu công thức/nguyên liệu/nhà hàng.
2. Bài viết, video, bình luận, vòng đời phiên bản và Admin duyệt.
3. Chat AI, scan, AI Flag Check, thực đơn và xử lý nền liên quan.

Các thành viên review chéo; người làm AI Flag Check phối hợp người làm kiểm duyệt. Bắt đầu bằng các module trong một backend; chưa tạo microservice riêng nếu chưa có nhu cầu vận hành cụ thể.

Backend chịu trách nhiệm kiểm tra quyền, điều kiện ăn chay/dị ứng, trạng thái kiểm duyệt và tính tổng dinh dưỡng; không tin dữ liệu do frontend tự xác nhận.
 luôn phải kiểm tra đã pull code mới về chưa
