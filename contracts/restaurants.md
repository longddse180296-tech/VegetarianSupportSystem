# Hợp đồng API — Nhà hàng

OpenAPI runtime tại `/openapi/v1.json` là schema máy đọc được. Tài liệu này chốt hành vi nghiệp vụ cho FE/BE; JSON camelCase, ID là UUID.

## Phạm vi và quyền

- Guest/User/Admin xem danh sách và chi tiết nhà hàng đang hoạt động.
- Chỉ Admin tạo, sửa, xem cả bản ghi đã ngừng sử dụng và ngừng sử dụng nhà hàng.
- Nhà hàng chỉ thể hiện chế độ ăn do nguồn dữ liệu khai báo. Không dùng nhãn này để chứng nhận món ăn thực tế hoặc bảo đảm dị ứng.
- Không có đặt bàn, đặt món, thanh toán hay đánh giá nhà hàng trong MVP.

## Endpoints

| Method | Path | Quyền | Kết quả |
|---|---|---|---|
| GET | `/api/restaurants` | Công khai | 200, danh sách đang hoạt động |
| GET | `/api/restaurants/{id}` | Công khai | 200 chi tiết đang hoạt động; 404 nếu không có/ngừng dùng |
| GET | `/api/admin/restaurants` | Admin | 200, bao gồm bản ghi ngừng sử dụng |
| GET | `/api/admin/restaurants/{id}` | Admin | 200, bao gồm bản ghi ngừng sử dụng |
| POST | `/api/admin/restaurants` | Admin | 201, Location và DTO chi tiết |
| PUT | `/api/admin/restaurants/{id}` | Admin | 200, thay toàn bộ dữ liệu nhập |
| POST | `/api/admin/restaurants/{id}/deactivate` | Admin | 204; gọi lại vẫn 204 |
| POST | `/api/admin/restaurants/{id}/activate` | Admin | 204, lưu trạng thái hoạt động và hiển thị lại ở public; gọi lại vẫn 204 |

Không xóa vật lý. Bản ghi ngừng sử dụng không còn nằm trong API public, nhưng Admin vẫn xem được. Khi ngừng sử dụng, hệ thống xóa các favorite đang trỏ đến nhà hàng đó để không giữ liên kết đã bị ẩn.
Kích hoạt lại chỉ đổi `isActive` và `updatedAt`, không yêu cầu nhập lại nội dung và không khôi phục favorite đã xóa. FE Admin phải chờ API thành công trước khi đổi trạng thái/báo mở khóa; 401/403/404 hoặc lỗi mạng giữ trạng thái cũ và hiển thị lỗi.

## List và vị trí

Danh sách nhận `pageNumber=1`, `pageSize=20` (1–100), `search`, `district`, `dietaryType`, `latitude`, `longitude`, `maxDistanceKm`.

- `search` tìm tên, địa chỉ hoặc khu vực; `district` lọc khu vực; các filter kết hợp AND. Tìm khu vực không phân biệt hoa/thường, dấu tiếng Việt hoặc dạng viết tắt phổ biến như `Quận 3`, `Quan 3`, `Q.3`.
- `dietaryType`: `1` Vegan, `2` LactoVegetarian, `3` OvoVegetarian, `4` LactoOvoVegetarian.
- `latitude` và `longitude` phải cùng có hoặc cùng không có. Latitude từ -90 đến 90, longitude từ -180 đến 180, tối đa 6 chữ số lẻ.
- Khi có tọa độ, API tính `distanceKm` theo công thức Haversine và sắp xếp theo khoảng cách rồi tên. Không có tọa độ, sắp xếp theo tên rồi ID.
- Cập nhật 27/10/2026: FE gửi tọa độ GPS hoặc tâm khu vực người dùng chọn, giữ thứ tự gần nhất của API và hiển thị khoảng cách đường chim bay. Chọn khu vực là chọn mốc tính khoảng cách, không tự lọc theo chuỗi `district` để tránh loại bỏ quán gần ở khu vực giáp ranh. Không tự gán vị trí TP.HCM khi chưa có lựa chọn.
- Summary trả thêm `latitude`, `longitude` nullable để bản đồ dùng tọa độ thực. Nhà hàng thiếu tọa độ nằm cuối khi sắp gần nhất, hiện chưa xác định khoảng cách; không tạo marker hoặc tọa độ giả.
- Nhập thủ công theo danh mục hiện hành: tỉnh/thành phố → phường/xã, đổi tỉnh thì xóa lựa chọn phường/xã cũ. Tâm khu vực chỉ là mốc tham khảo, không thay cho vị trí GPS chính xác. Danh mục tham chiếu lưu cùng FE, không truyền vị trí GPS đến dịch vụ tra cứu khu vực bên ngoài.
- `maxDistanceKm` từ 0 đến 1000, tối đa 3 chữ số lẻ, chỉ dùng khi đã gửi đủ tọa độ. Nhà hàng không có tọa độ không khớp filter khoảng cách.
- Response có dạng `{ items, pageNumber, pageSize, totalCount }`; `distanceKm` null nếu client không gửi tọa độ hoặc nhà hàng chưa có tọa độ.

## Request Admin

`name`, `address`, ít nhất một chế độ ăn và `featuredDishes` là bắt buộc. Từ 28/10/2026, Admin gửi `dietaryTypes`: danh sách từ 1 đến 4 giá trị enum JSON không trùng: `"Vegan"`, `"LactoVegetarian"`, `"OvoVegetarian"`, `"LactoOvoVegetarian"`. PUT thay toàn bộ danh sách; bỏ chọn loại nào thì loại đó không còn được hiển thị hoặc khớp bộ lọc. Backend chỉ lưu các loại được khai báo, không tự suy diễn loại tương thích. Client cũ vẫn có thể gửi `dietaryType` đơn lẻ; nếu gửi cả hai thì giá trị đơn phải thuộc danh sách. `amenities` là danh sách tùy chọn, không trùng, mỗi mục tối đa 120 ký tự. `featuredDishes` phải có đúng 3 món, mỗi món nhập tên riêng, không trùng và ảnh món ăn đã tải từ thiết bị. Các món này là thực đơn nổi bật của nhà hàng, không liên kết với kho công thức hệ thống.

```json
{
  "name": "Nhà hàng Chay Mộc",
  "description": "Không gian chay với thực đơn theo mùa.",
  "address": "12 Đường Mẫu, Quận 1, TP. Hồ Chí Minh",
  "district": "Quận 1",
  "latitude": 10.776889,
  "longitude": 106.700806,
  "contactPhone": "028 1234 5678",
  "websiteUrl": "https://example.com/nha-hang-chay-moc",
  "openingHours": "Hằng ngày 08:00 - 21:30",
  "priceFromVnd": 50000,
  "priceToVnd": 180000,
  "imageUrl": "https://images.example.com/chay-moc.jpg",
  "source": "Thông tin do Admin cập nhật",
  "dietaryTypes": ["Vegan", "LactoVegetarian"],
  "amenities": ["Wi-Fi", "Chỗ đỗ xe"],
  "featuredDishes": [
    { "name": "Cơm niêu nấm", "imageUrl": "https://app.example/api/public-images/abc" },
    { "name": "Lẩu nấm chay", "imageUrl": "https://app.example/api/public-images/def" },
    { "name": "Gỏi cuốn rau củ", "imageUrl": "https://app.example/api/public-images/ghi" }
  ]
}
```

`priceFromVnd`/`priceToVnd` là giá tham khảo bằng VND, không âm; nếu có cả hai thì giá trên không nhỏ hơn giá dưới. `imageUrl`/`websiteUrl` chỉ nhận http/https. Ảnh đại diện và ảnh từng món được tải trước qua `POST /api/me/images`; endpoint nhà hàng chỉ nhận URL ảnh do storage trả về.

Chi tiết trả địa chỉ/liên hệ/giờ mở cửa/khoảng giá/tiện ích/chế độ ăn khai báo, nguồn, `dataUpdatedAt` và `featuredDishes` theo thứ tự `displayOrder`. Response `dietaryTypes` chứa toàn bộ loại đã chọn, `dietaryType` chỉ có giá trị khi bản ghi có đúng một loại, còn lại là null để tương thích client cũ. Bộ lọc `dietaryType` khớp khi loại cần tìm nằm trong danh sách khai báo. Trường `isActive` có trong cả list Admin và chi tiết để Admin nhận biết trạng thái. Cấu trúc bảng liên kết đã hỗ trợ nhiều loại nên không cần migration hoặc sửa dữ liệu hiện có.

## Lỗi

- 400: phân trang, filter/tọa độ không hợp lệ, dữ liệu request sai, thiếu/không đúng 3 món nổi bật, tên món trùng hoặc ảnh món không hợp lệ.
- 401: chưa đăng nhập ở Admin endpoint; 403: không có role Admin.
- 404: nhà hàng không tồn tại hoặc đã ngừng dùng ở public endpoint.
- 409: tên nhà hàng hoặc tiện ích bị trùng trong cùng nhà hàng.

FE không tự coi `distanceKm`, giờ mở cửa hoặc nhãn chế độ ăn là bảo đảm an toàn/dị ứng. Link chỉ đường do FE tạo từ tọa độ/địa chỉ được trả về; API không gọi dịch vụ bản đồ bên thứ ba.
