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

Không xóa vật lý. Bản ghi ngừng sử dụng không còn nằm trong API public, nhưng Admin vẫn xem được để giữ lịch sử favorite/liên kết cũ.

## List và vị trí

Danh sách nhận `pageNumber=1`, `pageSize=20` (1–100), `search`, `district`, `dietaryType`, `latitude`, `longitude`, `maxDistanceKm`.

- `search` tìm tên, địa chỉ hoặc khu vực; `district` lọc khu vực; các filter kết hợp AND.
- `dietaryType`: `1` Vegan, `2` LactoVegetarian, `3` OvoVegetarian, `4` LactoOvoVegetarian.
- `latitude` và `longitude` phải cùng có hoặc cùng không có. Latitude từ -90 đến 90, longitude từ -180 đến 180, tối đa 6 chữ số lẻ.
- Khi có tọa độ, API tính `distanceKm` theo công thức Haversine và sắp xếp theo khoảng cách rồi tên. Không có tọa độ, sắp xếp theo tên rồi ID.
- `maxDistanceKm` từ 0 đến 1000, tối đa 3 chữ số lẻ, chỉ dùng khi đã gửi đủ tọa độ. Nhà hàng không có tọa độ không khớp filter khoảng cách.
- Response có dạng `{ items, pageNumber, pageSize, totalCount }`; `distanceKm` null nếu client không gửi tọa độ hoặc nhà hàng chưa có tọa độ.

## Request Admin

`name`, `address` và ít nhất một `dietaryTypes` là bắt buộc. `dietaryTypes` không trùng. `amenities` là danh sách tùy chọn, không trùng, mỗi mục tối đa 120 ký tự. `relatedRecipeIds` là danh sách công thức đang hoạt động, không trùng; dùng để hiển thị món/công thức liên quan.

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
  "dietaryTypes": [1, 4],
  "amenities": ["Wi-Fi", "Chỗ đỗ xe"],
  "relatedRecipeIds": []
}
```

`priceFromVnd`/`priceToVnd` là giá tham khảo bằng VND, không âm; nếu có cả hai thì giá trên không nhỏ hơn giá dưới. `imageUrl`/`websiteUrl` chỉ nhận http/https. Không upload file qua endpoint này; xử lý storage riêng khi được triển khai.

Chi tiết trả địa chỉ/liên hệ/giờ mở cửa/khoảng giá/tiện ích/chế độ ăn khai báo, nguồn và `dataUpdatedAt`; `relatedRecipes` chỉ trả công thức đang hoạt động ở API public. Trường `isActive` có trong cả list Admin và chi tiết để Admin nhận biết trạng thái.

## Lỗi

- 400: phân trang, filter/tọa độ không hợp lệ, dữ liệu request sai, công thức liên quan không tồn tại/đã ngừng dùng.
- 401: chưa đăng nhập ở Admin endpoint; 403: không có role Admin.
- 404: nhà hàng không tồn tại hoặc đã ngừng dùng ở public endpoint.
- 409: tên nhà hàng hoặc tiện ích bị trùng trong cùng nhà hàng.

FE không tự coi `distanceKm`, giờ mở cửa hoặc nhãn chế độ ăn là bảo đảm an toàn/dị ứng. Link chỉ đường do FE tạo từ tọa độ/địa chỉ được trả về; API không gọi dịch vụ bản đồ bên thứ ba.
