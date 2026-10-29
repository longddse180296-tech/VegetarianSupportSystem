# Rà soát khóa danh mục và nguyên liệu

- Khóa chỉ đổi IsActive, không xóa bản ghi hoặc liên kết công thức đã có.
- Công thức cũ vẫn đọc được tên danh mục, thành phần và dữ liệu nguyên liệu; sửa công thức được giữ liên kết đã có dù mục đó bị khóa.
- Không được thêm một nguyên liệu/danh mục đã khóa vào công thức mới. Backend kiểm tra lại, kể cả khi client gửi ID trực tiếp hoặc danh sách trên màn hình chưa cập nhật.
- FE chọn nguyên liệu từ API công khai chỉ có mục đang hoạt động. RecordPicker danh mục lọc các mục đã khóa, chỉ giữ mục đã chọn của công thức đang sửa.
- Danh mục bài viết là nhãn riêng (ArticleCategories/ArticleVersionCategories), không tham chiếu Categories của kho công thức; trạng thái khóa trong quản trị danh mục không áp dụng lên nhãn bài viết.

Kiểm thử CoreDataApiChecks xác nhận đọc công thức cũ, sửa giữ tham chiếu cũ, chặn tạo mới bằng mục khóa, danh sách chọn không chứa mục khóa và giữ tên danh mục của công thức công khai.

Theo yêu cầu dọn dữ liệu cùng ngày, database thật đã được sao lưu COPY_ONLY/CHECKSUM, kiểm tra bản sao, sau đó xóa bài viết/bình luận trong transaction: 14 bài viết, 14 phiên bản, 4 bình luận, 14 hồ sơ kiểm duyệt, 5 quyết định duyệt, 1 lượt lưu bài viết và 1 tương tác bài viết. Các bảng con của phiên bản/bài viết được dọn theo FK cascade. Không bổ sung tính năng xóa trên giao diện hoặc endpoint production.

Sau dọn: bài viết/bình luận bằng 0. Tài khoản, video, công thức, nguyên liệu, danh mục, nhà hàng và dữ liệu thuộc video được đối chiếu không thay đổi. Tệp ảnh dùng chung không xóa theo suy đoán để tránh mất tài nguyên đang được nội dung khác tham chiếu.
