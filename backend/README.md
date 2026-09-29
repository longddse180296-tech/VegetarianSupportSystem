# Backend

ASP.NET Core Web API, C#, .NET 10 của Vegetarian Support. SQL Server đã có package EF Core và `AppDbContext` rỗng để sẵn sàng triển khai dữ liệu. Gemini là tích hợp dự kiến, chưa được cấu hình hoặc gọi trong khung hiện tại.

Solution `Backend.sln` gồm bốn project Clean Architecture: `Api`, `Application`, `Domain`, `Infrastructure`. Api tham chiếu Application/Infrastructure; Infrastructure tham chiếu Application; Application tham chiếu Domain.

Từ thư mục backend: `dotnet build Backend.sln -c Release`, rồi `dotnet run --project src/Api --launch-profile http`. API chạy tại http://localhost:5080; `/api/health` trả trạng thái tiến trình, không kiểm tra SQL Server/Gemini. `/openapi/v1.json` chỉ bật trong Development. Chưa có Swagger UI.

Package SQL hiện có:

- `Microsoft.EntityFrameworkCore.SqlServer` trong `Infrastructure`.
- `Microsoft.EntityFrameworkCore.Tools` trong `Infrastructure`.
- `Microsoft.EntityFrameworkCore.Design` trong `Api`.

Connection string mẫu nằm trong `src/Api/appsettings.json`. Khi làm thật nên chuyển giá trị local vào `appsettings.Development.json` hoặc user secrets tùy cách nhóm thống nhất.

HTTP local giúp chạy profile phát triển không cần cài chứng chỉ. Môi trường ngoài Development bật chuyển hướng HTTPS; cần cấu hình HTTPS trên host triển khai.

Phân chia trách nhiệm đề xuất cho 3 thành viên:

1. Tài khoản, phân quyền, hồ sơ, dữ liệu công thức/nguyên liệu/nhà hàng.
2. Bài viết, video, bình luận, vòng đời phiên bản và Admin duyệt.
3. Chat AI, scan, AI Flag Check, thực đơn và xử lý nền liên quan.

Các thành viên review chéo; người làm AI Flag Check phối hợp người làm kiểm duyệt. Bắt đầu bằng các module trong một backend; chưa tạo microservice riêng nếu chưa có nhu cầu vận hành cụ thể.

Backend chịu trách nhiệm kiểm tra quyền, điều kiện ăn chay/dị ứng, trạng thái kiểm duyệt và tính tổng dinh dưỡng; không tin dữ liệu do frontend tự xác nhận.
