# Hợp đồng API

FE và BE thống nhất endpoint, request/response, mã lỗi, phân trang, trạng thái xử lý và ví dụ trước khi triển khai một tính năng.

Khi triển khai ASP.NET Core .NET 10, chọn một nguồn đặc tả OpenAPI chính thức: sinh từ backend hoặc quản lý tại đây. Không duy trì hai bản thủ công cạnh tranh nhau. Hiện chưa tạo đặc tả endpoint.

Phân biệt bắt buộc:

- Role: Guest (chưa đăng nhập), User, Admin.
- Trạng thái AI kiểm tra và trạng thái Admin duyệt là hai trường riêng.
- Scan: phù hợp theo dữ liệu cung cấp, không phù hợp, chưa đủ thông tin; lỗi xử lý là trạng thái riêng.
- Kết quả phân loại chế độ ăn không phải bảo đảm an toàn dị ứng.

Thay đổi hợp đồng API cần FE và BE cùng xem xét. FE có thể dùng mock khớp hợp đồng trong khi BE đang triển khai.
