# Backend

Thư mục ASP.NET Core Web API, C#, .NET 10 của Vegetarian Support; cơ sở dữ liệu SQL Server, tích hợp Gemini API từ backend. Hiện chỉ có cây thư mục, chưa có solution/project .NET hoặc mã nguồn.

Các lớp dự kiến: `VegetarianSupport.Api`, `VegetarianSupport.Application`, `VegetarianSupport.Domain`, `VegetarianSupport.Infrastructure`. Đây đang là thư mục, chưa phải project có thể build.

Phân chia trách nhiệm đề xuất cho 3 thành viên:

1. Tài khoản, phân quyền, hồ sơ, dữ liệu công thức/nguyên liệu/nhà hàng.
2. Bài viết, video, bình luận, vòng đời phiên bản và Admin duyệt.
3. Chat AI, scan, AI Flag Check, thực đơn và xử lý nền liên quan.

Các thành viên review chéo; người làm AI Flag Check phối hợp người làm kiểm duyệt. Bắt đầu bằng các module trong một backend; chưa tạo microservice riêng nếu chưa có nhu cầu vận hành cụ thể.

Backend chịu trách nhiệm kiểm tra quyền, điều kiện ăn chay/dị ứng, trạng thái kiểm duyệt và tính tổng dinh dưỡng; không tin dữ liệu do frontend tự xác nhận.
