# Vị trí và khoảng cách nhà hàng — 27/10/2026

Người dùng chọn GPS hoặc vị trí thủ công. Danh mục hiện hành theo lựa chọn của nhóm: tỉnh/thành phố → phường/xã. Đổi tỉnh xóa phường/xã trước; bỏ chọn tỉnh xóa mốc tọa độ; callback GPS đến muộn không ghi đè lựa chọn thủ công.

## Luồng dữ liệu

- FE gửi đủ latitude/longitude đã chọn tới `GET /api/restaurants`. Không gán mặc định TP.HCM và không tự lọc `district` khi người dùng chỉ chọn mốc tìm gần nhất.
- Backend dùng Haversine, sắp gần nhất trên toàn bộ kết quả trước phân trang. Nhà hàng thiếu tọa độ xếp sau các mục tính được, khoảng cách null. FE giữ thứ tự này và phân biệt 0 m với không xác định.
- Thẻ và popup bản đồ hiển thị “Cách khoảng … km”, không dùng dấu xấp xỉ theo yêu cầu mới nhất; ghi rõ đường chim bay. Với lựa chọn thủ công, điểm gốc là tâm khu vực tham khảo, không phải địa chỉ chính xác của người dùng.
- Chưa có vị trí: khóa các bán kính 1/3/5/10 km và hướng dẫn chọn vị trí; không gọi API bằng vị trí giả. Đặt lại bộ lọc giữ mốc đang chọn để kết quả vẫn được xếp gần nhất.
- Summary trả thêm latitude/longitude đã lưu. Bản đồ chỉ đặt marker ở tọa độ nhà hàng thật, bỏ cách dùng tâm quận và offset giả. Có ghi công OpenStreetMap; escape nội dung popup từ database.
- Danh mục tham chiếu lưu tại `features/restaurants/data`, tải riêng khi cần, kèm giấy phép và thông tin nguồn trong README của thư mục. Không thêm dịch vụ geocoding hoặc lưu lịch sử vị trí người dùng.

## Rà soát dữ liệu local

Hai nhà hàng có địa chỉ cụ thể đã được bổ sung tọa độ sau khi sao lưu database. Chỉ cập nhật Latitude/Longitude/UpdatedAt khi hai trường tọa độ còn null và ID/tên/địa chỉ khớp, không thay dữ liệu nội dung hoặc trạng thái hoạt động:

- Ẩm Thực Chay Tuệ, 162 Trần Hưng Đạo: `10.763796, 106.691367`, đối chiếu [PasGo — chi nhánh Trần Hưng Đạo](https://www.pasgo.vn/nha-hang/am-thuc-chay-tue-tran-hung-dao-4900), liên kết bản đồ tại đúng trang chi nhánh. Không dùng tọa độ chi nhánh Mai Thị Lựu từ link chung của thương hiệu.
- Nhà hàng chay Phương Mai, 86F Võ Thị Sáu: `10.789209, 106.692023`, đối chiếu địa chỉ và metadata tọa độ trên [Foody — Nhà hàng chay Phương Mai](https://www.foody.vn/ho-chi-minh/nha-hang-chay-phuong-mai).

Mục có địa chỉ chưa đầy đủ không được gán tọa độ suy đoán. Đây là sửa dữ liệu local đã đối chiếu, không đưa bản ghi nhà hàng thật hoặc lệnh seed vào production source/migration. Bản sao lưu tại `.local/db-backups/VegetarianSupport_before_restaurant_coordinates_20261027.bak`. Máy khác cần nhập tọa độ nhà hàng thực qua Admin.

## Xác minh

Kiểm thử backend bao gồm sắp xếp trước phân trang, đổi điểm gốc, 0 km, null cuối danh sách, không có vị trí và lọc bán kính. Kiểm thử FE kiểm tra không dùng vị trí mặc định, giữ thứ tự server, không đổi null thành 0, định dạng km và quan hệ danh mục tỉnh/phường.

Browser xác minh tỉnh đầu tiên mới cho chọn phường, phường thuộc đúng tỉnh, đổi tỉnh xóa phường cũ và khoảng cách/thứ tự thay đổi. GPS được kiểm tra bằng tọa độ thử riêng; không tự chấp nhận quyền vị trí thật hoặc tạo dữ liệu nhà hàng mẫu trong database ứng dụng.

## Sửa mở khóa nhà hàng

FE trước đây chỉ đặt `isActive=true` trong state của bảng Admin, không gọi server. Backend bổ sung `POST /api/admin/restaurants/{id}/activate`, chỉ Admin được gọi, idempotent và lưu DB trước khi trả 204. FE chờ request thành công rồi cập nhật/tải lại bảng; lỗi giữ trạng thái cũ. Danh sách public và chi tiết đọc ngay trạng thái đã lưu. Khi người dùng quay lại tab, FE tự tải lại danh sách, giữ vị trí và bộ lọc.

Kiểm tra tích hợp bao gồm Guest 401, User 403, ID thiếu 404, Admin 204, dữ liệu SQL đã active, public list/detail thấy lại, gọi lặp và không tự tạo lại favorite đã bị gỡ. Không tự mở khóa các bản ghi khác trong database người dùng.
