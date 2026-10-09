# Hợp đồng API

FE và BE thống nhất endpoint, request/response, mã lỗi, phân trang, trạng thái xử lý và ví dụ trước khi triển khai một tính năng.

Nguồn OpenAPI chính hiện được sinh từ backend trong môi trường Development tại `/openapi/v1.json`. Hợp đồng nghiệp vụ và giới hạn hiện hành cho Moderation/AiChat ở [moderation-aichat.md](moderation-aichat.md).

Hợp đồng backend nhận ảnh món ăn và đánh giá sau khi User xác nhận nguyên liệu ở [food-scanning.md](food-scanning.md).

Hợp đồng đăng ký, đăng nhập, JWT và Admin seed ở [auth.md](auth.md).

Hợp đồng nhà hàng public/Admin, lọc theo khu vực/chế độ ăn/khoảng cách và trạng thái dữ liệu ở [restaurants.md](restaurants.md).

Hợp đồng Pantry: kho nguyên liệu theo tài khoản, đối chiếu profile, gợi ý công thức và danh sách thay thế ở [pantry.md](pantry.md).

Hợp đồng lưu yêu thích cho công thức, video và nhà hàng ở [favorites.md](favorites.md).

Hợp đồng thực đơn 7 ngày, thay món, danh sách đi chợ, áp dụng tuần mới và PDF ở [meal-plans.md](meal-plans.md).

Hợp đồng xem/cập nhật hồ sơ cá nhân, dị ứng và thực phẩm cần tránh ở [profile.md](profile.md).

Hợp đồng danh sách, chi tiết và khóa/mở khóa thành viên Admin ở [admin-members.md](admin-members.md).

Quy ước nghiệp vụ và tích hợp của Categories, Ingredients, Recipes được ghi tại [Core Data tuần 1](core-data.md). Không duy trì thêm một bản OpenAPI thủ công cạnh tranh trong thư mục này.

Phân biệt bắt buộc:

- Role: Guest (chưa đăng nhập), User, Admin.
- Trạng thái AI kiểm tra và trạng thái Admin duyệt là hai trường riêng.
- Scan: phù hợp theo dữ liệu cung cấp, không phù hợp, chưa đủ thông tin; lỗi xử lý là trạng thái riêng.
- Kết quả phân loại chế độ ăn không phải bảo đảm an toàn dị ứng.

Thay đổi hợp đồng API cần FE và BE cùng xem xét. FE có thể dùng mock khớp hợp đồng trong khi BE đang triển khai.
