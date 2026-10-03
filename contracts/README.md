# Hợp đồng API

FE và BE thống nhất endpoint, request/response, mã lỗi, phân trang, trạng thái xử lý và ví dụ trước khi triển khai một tính năng.

Nguồn OpenAPI chính được sinh từ backend trong môi trường Development tại `/openapi/v1.json`. Không duy trì thêm một bản OpenAPI thủ công cạnh tranh trong thư mục này. Quy ước nghiệp vụ và tích hợp của Categories, Ingredients, Recipes được ghi tại [Core Data tuần 1](core-data.md).

Phân biệt bắt buộc:

- Role: Guest (chưa đăng nhập), User, Admin.
- Trạng thái AI kiểm tra và trạng thái Admin duyệt là hai trường riêng.
- Scan: phù hợp theo dữ liệu cung cấp, không phù hợp, chưa đủ thông tin; lỗi xử lý là trạng thái riêng.
- Kết quả phân loại chế độ ăn không phải bảo đảm an toàn dị ứng.

Thay đổi hợp đồng API cần FE và BE cùng xem xét. FE có thể dùng mock khớp hợp đồng trong khi BE đang triển khai.
