# Rà soát thông báo quản trị ngày 28/10/2026

## Phạm vi

- Việt hóa lỗi trùng tên, dữ liệu không tồn tại, danh mục/nguyên liệu đã ngừng sử dụng, chế độ ăn không phù hợp, tọa độ, mức giá và thông tin nhà hàng.
- Việt hóa lỗi xung đột cập nhật bài viết/bình luận, dữ liệu video và quy tắc gửi kiểm duyệt.
- Việt hóa phản hồi thiếu quyền, giới hạn tệp tải lên và phân trang kiểm duyệt.
- Thống nhất nhãn vai trò, hàng chờ duyệt, người xử lý báo cáo và lý do khóa tài khoản bằng tiếng Việt.
- Bổ sung chuyển đổi lỗi kiểm tra dữ liệu mặc định của ASP.NET: bắt buộc, khoảng giá trị, độ dài, email, lựa chọn và dữ liệu sai định dạng. Lỗi kết nối quản trị có hướng dẫn thử lại.

Các mã trạng thái, role/enum trao đổi với backend, dữ liệu do người dùng nhập, bằng chứng trích nguyên văn và log kỹ thuật không thay đổi. Không sửa dữ liệu thật hoặc tạo migration.

## Kiểm tra

- 60 kiểm thử frontend đạt, bao gồm các dạng lỗi mặc định và việc giữ nguyên thông báo nghiệp vụ tiếng Việt.
- Lint và build frontend đạt; build backend đạt, 179 kiểm thử backend đạt.
- 255 kiểm tra API Core Data và SignalR đạt trên database kiểm thử riêng; database đã được tự dọn sau khi chạy.

Build còn cảnh báo thư viện System.Security.Cryptography.Pkcs 9.0.4 và kích thước bundle đã có trước đợt sửa thông báo này.

Trình duyệt tích hợp hiện bị tắt trong cài đặt nên chưa đối chiếu trực tiếp từng màn hình bằng ảnh chụp.
