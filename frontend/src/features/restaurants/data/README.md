# Dữ liệu tham chiếu vị trí Việt Nam

`vietnamLocations.json` phục vụ chọn tỉnh/thành phố → phường/xã theo địa giới hiện hành, gồm 34 tỉnh/thành và 3.321 phường/xã/đặc khu. Đây là danh mục tham chiếu UI, không phải dữ liệu nhà hàng mẫu hoặc lệnh seed database.

Nguồn: [Vietnam Administrative Divisions — Open Admin Data](https://github.com/open-admin-data/vietnam-administrative-divisions). Tác giả: jakkrapongt / Open Admin Data, copyright 2026. Giấy phép [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/), bản sao tại `LICENSE-open-admin-data.txt`.

Dữ liệu lấy ngày 27/10/2026 từ `https://api.openadmindata.org/api/v1/vn/province.json` và `https://api.openadmindata.org/api/v1/vn/ward.json`. So với nguồn, bản trong dự án bỏ các trường tiếng Anh/slug, đổi tên trường tọa độ, nhóm phường/xã vào tỉnh trực thuộc và sắp xếp tên tiếng Việt. Giữ nguyên mã và tọa độ nguồn; không suy đoán tọa độ nhà hàng từ danh mục này.

Tọa độ khu vực là mốc tham khảo để tính khoảng cách đường chim bay, không xác định chính xác người dùng đang ở đâu trong khu vực. Danh mục tải riêng khi mở chọn thủ công, không làm tăng bundle ban đầu và không gửi vị trí GPS của người dùng cho nguồn dữ liệu.

Khi cập nhật dữ liệu, kiểm tra mã phường/xã không trùng, quan hệ tỉnh trực thuộc, tọa độ hữu hạn/đúng miền giá trị và cập nhật ngày/nguồn cùng các kiểm thử liên quan. JSON không có comment; mô tả và giấy phép được ghi trong tài liệu này.
