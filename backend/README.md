# Backend

ASP.NET Core Web API, C#, .NET 10 của Vegetarian Support. Nền Moderation và AiChat đã có entity, repository, controller và migration ban đầu. Gemini thật chưa được cấu hình hoặc gọi; Development dùng câu trả lời chat mẫu từ backend.

Solution `Backend.sln` gồm bốn project Clean Architecture: `Api`, `Application`, `Domain`, `Infrastructure`. Api tham chiếu Application/Infrastructure; Infrastructure tham chiếu Application; Application tham chiếu Domain. File `Backend.csproj` ở thư mục này là launcher phát triển, để chạy API bằng lệnh ngắn `dotnet run` mà không sao chép startup code.

Từ thư mục backend: `dotnet build Backend.sln -c Release`, rồi `dotnet run`. Lệnh này chuyển tiếp tới `src/Api/Api.csproj`; có thể dùng `dotnet run --project src/Api --launch-profile http` khi cần chạy trực tiếp project API. API chạy tại http://localhost:5080. Swagger UI ở `/swagger` và OpenAPI JSON ở `/openapi/v1.json`, chỉ bật trong Development; `/` chuyển tới Swagger UI trong môi trường này. Xem hợp đồng Moderation/AiChat ở `../contracts/moderation-aichat.md` và phần migration BE 2 ở `../docs/be2-migration-handoff.md`.

Package SQL hiện có:

- `Microsoft.EntityFrameworkCore.SqlServer` trong `Infrastructure`.
- `Microsoft.EntityFrameworkCore.Tools` trong `Infrastructure`.
- `Microsoft.EntityFrameworkCore.Design` trong `Api`.

Connection string mẫu nằm trong `src/Api/appsettings.json`. Khi làm thật nên chuyển giá trị local vào `appsettings.Development.json` hoặc user secrets tùy cách nhóm thống nhất. Chưa xác nhận migration đã áp dụng trên SQL Server; endpoint User/Admin cần JWT từ BE 1 và DB phù hợp để chạy end-to-end.

Để thử API cần quyền trước khi BE 1 làm đăng nhập: trong Swagger UI gọi `POST /api/dev-auth/token` với body `{ "userId": "local-user", "role": "User" }` (hoặc `Admin`), sao chép `accessToken` rồi dán vào **Authorize**. Endpoint cấp token mẫu chỉ tồn tại trong Development, token sống 1 giờ và có thể hết hiệu lực khi restart backend. Các endpoint lưu dữ liệu vẫn cần SQL Server và migration phù hợp.

Gemini chat đọc `Gemini:ApiKey` và `Gemini:Model` từ cấu hình backend, gửi key trong header `x-goog-api-key` và dùng model `gemini-3.8-flash` mặc định. Để bật lời gọi thật ở máy local, cấu hình `Gemini` trong file bị ignore `src/Api/appsettings.Local.json` và đặt `AiChat:UseMockResponses` thành `false`; không đưa key vào frontend. Câu hỏi Guest/User khi đó sẽ gửi tới Gemini và có thể dùng quota của key.

HTTP local giúp chạy profile phát triển không cần cài chứng chỉ. Môi trường ngoài Development bật chuyển hướng HTTPS; cần cấu hình HTTPS trên host triển khai.

Phân chia trách nhiệm đề xuất cho 3 thành viên:

1. Tài khoản, phân quyền, hồ sơ, dữ liệu công thức/nguyên liệu/nhà hàng.
2. Bài viết, video, bình luận, vòng đời phiên bản và Admin duyệt.
3. Chat AI, scan, AI Flag Check, thực đơn và xử lý nền liên quan.

Các thành viên review chéo; người làm AI Flag Check phối hợp người làm kiểm duyệt. Bắt đầu bằng các module trong một backend; chưa tạo microservice riêng nếu chưa có nhu cầu vận hành cụ thể.

Backend chịu trách nhiệm kiểm tra quyền, điều kiện ăn chay/dị ứng, trạng thái kiểm duyệt và tính tổng dinh dưỡng; không tin dữ liệu do frontend tự xác nhận.
 luôn phải kiểm tra đã pull code mới về chưa
