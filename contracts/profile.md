# Hồ sơ cá nhân

Các endpoint dưới đây yêu cầu Bearer token của tài khoản `User` hoặc `Admin` còn hoạt động. Backend lấy `Users.Id` từ claim `sub`; request không nhận user ID để đọc hoặc sửa hồ sơ người khác. Guest nhận `401`. Token hợp lệ nhưng tài khoản bị khóa/xóa cũng nhận `401` theo cơ chế Auth chung.

## Xem hồ sơ

`GET /api/profile/me` trả `200` với hồ sơ của tài khoản hiện tại. Hồ sơ mới đăng ký có các trường dinh dưỡng là `null`, hai danh sách rỗng. Ví dụ:

```json
{
  "userId": "<Users.Id>",
  "fullName": "Nguyen Van A",
  "email": "a@example.com",
  "phoneNumber": "+84 912 345 678",
  "memberSinceUtc": "2026-10-03T00:00:00Z",
  "diet": "LactoOvo",
  "birthDate": "2000-01-01",
  "sexForEnergyEstimate": "Female",
  "heightCm": 165.5,
  "weightKg": 60.2,
  "bmi": 22.0,
  "adultBmiCategory": "HealthyWeight",
  "estimatedTdeeKcal": 2085,
  "activityLevel": "ModeratelyActive",
  "weightGoal": "Maintain",
  "restaurantArea": "Quận 1",
  "allergies": [{ "id": "<guid>", "name": "Đậu phộng" }],
  "avoidedFoods": [{ "id": "<guid>", "name": "Nấm" }],
  "updatedAtUtc": "2026-10-03T08:00:00Z"
}
```

Không trả `passwordHash`, trạng thái khóa hoặc dữ liệu tài khoản khác. Tài khoản/hồ sơ không tồn tại trả `404`.

`memberSinceUtc` lấy từ `Users.CreatedAtUtc` để màn hình tài khoản hiển thị tháng/năm tham gia. Các số bài viết, bình luận, video và danh sách bài viết gần đây trong thiết kế là dữ liệu của module nội dung; endpoint profile không trả số giả khi các module này chưa có dữ liệu.

## Cập nhật thông tin chính

`PUT /api/profile/me` thay toàn bộ các trường thông tin chính. `fullName` bắt buộc; các trường còn lại có thể là `null` để xóa giá trị. Dị ứng và thực phẩm cần tránh được quản lý riêng, không bị thay bởi request này. Thành công trả `200` với cùng cấu trúc như `GET`. Email chỉ đọc và không được nhận trong request.

```json
{
  "fullName": "Nguyen Van A",
  "phoneNumber": "+84 912 345 678",
  "diet": "LactoOvo",
  "birthDate": "2000-01-01",
  "sexForEnergyEstimate": "Female",
  "heightCm": 165.5,
  "weightKg": 60.2,
  "activityLevel": "ModeratelyActive",
  "weightGoal": "Maintain",
  "restaurantArea": "Quận 1"
}
```

- `diet`: `Vegan`, `Lacto`, `Ovo`, `LactoOvo`.
- `sexForEnergyEstimate`: `Female`, `Male`; đây là dữ liệu tùy chọn cho phép tính năng lượng.
- `activityLevel`: `Sedentary`, `LightlyActive`, `ModeratelyActive`, `VeryActive`, `ExtraActive`.
- `weightGoal`: `Lose`, `Maintain`, `Gain`.
- `birthDate` không được ở tương lai; `heightCm` lớn hơn 0 và tối đa 300; `weightKg` lớn hơn 0 và tối đa 1000; DB lưu tối đa hai chữ số thập phân cho chiều cao/cân nặng.
- `fullName` dài 1–150 ký tự, `restaurantArea` tối đa 200 ký tự. Chuỗi được cắt khoảng trắng đầu/cuối. Email trong response lấy từ tài khoản Auth; backend profile hiện không có luồng đổi/xác thực email.
- `phoneNumber` tùy chọn, tối đa 30 ký tự và 7–15 chữ số; có thể dùng `+`, dấu cách, `-`, `.`, `(`, `)` để định dạng. `null` hoặc chuỗi rỗng xóa số điện thoại. Không có trạng thái xác thực số điện thoại.
- Enum không hợp lệ, trường thừa hoặc dữ liệu không hợp lệ trả `400` kèm thông báo validation để FE hiển thị.

### BMI và năng lượng ước tính

`bmi`, `adultBmiCategory` và `estimatedTdeeKcal` là trường **chỉ đọc**, được tính khi trả response; request `PUT` không nhận các trường này. Không lưu BMI/TDEE vào DB để kết quả tự cập nhật khi hồ sơ đổi. Chúng là số tham khảo, không phải chẩn đoán hoặc chỉ tiêu calo cá nhân được xác nhận.

- `bmi = weightKg / (heightCm / 100)^2`, làm tròn một chữ số thập phân; thiếu chiều cao/cân nặng thì trả `null`. Công thức theo [CDC](https://www.cdc.gov/growth-chart-training/hcp/using-bmi/calculating-bmi.html).
- `adultBmiCategory` chỉ trả khi người dùng từ 20 tuổi trở lên: `Underweight` (<18.5), `HealthyWeight` (18.5–<25), `Overweight` (25–<30), `Obesity` (≥30), phân loại từ BMI chưa làm tròn. Người dưới 20 tuổi hoặc chưa khai báo ngày sinh nhận `null`; BMI trẻ em cần đánh giá theo tuổi và giới tính riêng. Đây là chỉ số sàng lọc theo [CDC](https://www.cdc.gov/bmi/adult-calculator/bmi-categories.html).
- `estimatedTdeeKcal` dùng phương trình nghỉ Mifflin–St Jeor (`10 × kg + 6.25 × cm − 5 × tuổi + 5` cho nam, `−161` cho nữ), nhân hệ số mức vận động `1.2`, `1.375`, `1.55`, `1.725`, `1.9` theo thứ tự enum và làm tròn kcal. Công thức nghỉ được công bố trên [PubMed](https://pubmed.ncbi.nlm.nih.gov/2305711/); bộ hệ số là phương pháp ước tính trong [nghiên cứu dinh dưỡng](https://pmc.ncbi.nlm.nih.gov/articles/PMC8862522/).
- Chỉ trả TDEE khi tuổi tính theo ngày sinh là 19–78, có chiều cao, cân nặng, `sexForEnergyEstimate`, `activityLevel`, và kết quả năng lượng nghỉ dương. Ngoài phạm vi hoặc thiếu dữ liệu thì trả `null`. `weightGoal` không tự trừ/cộng calo vào TDEE; mục tiêu ăn uống thuộc logic thực đơn.

Để chọn nhanh thẻ chế độ ăn như trên màn hình hồ sơ, `PUT /api/profile/me/diet` nhận `{ "diet": "Vegan" }` và trả `200` với hồ sơ mới. Chỉ cập nhật `diet`, giữ nguyên các trường khác. Có thể gửi `null` để bỏ lựa chọn. Enum sai trả `400`, tài khoản/hồ sơ không tồn tại trả `404`.

Khối “Thông tin tài khoản & liên hệ” dùng `PUT /api/profile/me/personal` với `{ "fullName": "Nguyen Van A", "phoneNumber": "0912 345 678", "restaurantArea": "Hà Nội" }`. Thành công trả `200` với hồ sơ mới; chỉ cập nhật ba trường này, giữ nguyên email, chế độ ăn, dị ứng và số đo cơ thể. Email hiển thị trên màn hình nhưng endpoint này không thay đổi hoặc tuyên bố email đã xác thực.

Khối “Chỉ số cơ thể & mục tiêu” dùng `PUT /api/profile/me/body` với `{ "birthDate": "2000-01-01", "sexForEnergyEstimate": "Female", "heightCm": 165.5, "weightKg": 60.2, "activityLevel": "ModeratelyActive", "weightGoal": "Maintain" }`. Endpoint thay toàn bộ sáu trường của khối này (`null` để xóa từng giá trị), giữ nguyên liên hệ, chế độ ăn, dị ứng và thực phẩm tránh; trả `200` với BMI/TDEE tính lại. Dữ liệu không hợp lệ trả `400`.

Khi chỉnh sửa nhưng chưa lưu, `POST /api/profile/me/body/estimate` nhận đúng sáu trường của `PUT .../body` và trả `200` với `{ "bmi": 22.0, "adultBmiCategory": "HealthyWeight", "estimatedTdeeKcal": 2085 }`. Endpoint dùng cùng validation và cùng `ProfileNutritionEstimator` với response hồ sơ; không ghi DB hoặc sửa hồ sơ hiện tại. Trường thiếu dữ liệu trả `null` theo quy tắc bên trên. Guest nhận `401`, tài khoản/hồ sơ không tồn tại nhận `404`, dữ liệu không hợp lệ nhận `400`. FE có thể gọi khi input thay đổi (nên debounce) và chỉ hiển thị kết quả khớp với bộ input hiện tại. Kết quả xem trước chỉ được lưu khi người dùng gọi endpoint cập nhật hồ sơ.

## Dị ứng và thực phẩm cần tránh

| Thao tác | Dị ứng | Thực phẩm cần tránh | Kết quả |
|---|---|---|---|
| Thêm | `POST /api/profile/me/allergies` | `POST /api/profile/me/avoided-foods` | `201` và `{id, name}` |
| Đổi tên | `PUT /api/profile/me/allergies/{id}` | `PUT /api/profile/me/avoided-foods/{id}` | `204` |
| Xóa | `DELETE /api/profile/me/allergies/{id}` | `DELETE /api/profile/me/avoided-foods/{id}` | `204` |

Body cho thêm/đổi tên: `{ "name": "Đậu phộng" }`. `name` dài 1–150 ký tự sau khi cắt khoảng trắng. Tên trùng trong cùng danh sách không phân biệt chữ hoa/thường trả `409`. Dị ứng và thực phẩm cần tránh là hai danh sách độc lập, nên cùng tên có thể nằm trong cả hai. ID không thuộc hồ sơ hiện tại trả `404`; tên không hợp lệ trả `400`. Không có kết luận an toàn dị ứng từ việc lưu danh sách này.

Schema gốc có trong migration `UserAccountsAndProfiles`: `Users` 1–1 `UserProfiles`, và `UserProfiles` 1–n `UserAllergies`/`UserAvoidedFoods`. Migration `UserContactPhone` thêm cột `Users.PhoneNumber` tùy chọn; cần áp dụng migration này trên DB triển khai.

## Mapping cho FE và các module backend

FE giữ giao diện/profile model hiện tại và dùng `profileApi` để ánh xạ response `GET /api/profile/me` vào các tên đang hiển thị: `userId → id`, `restaurantArea → preferredRegion`, `diet → dietaryType`, `birthDate → metrics.age`, `sexForEnergyEstimate → metrics.gender`, `activityLevel → metrics.activityLevel`, `weightGoal → metrics.goal`, `memberSinceUtc → createdAt`, `updatedAtUtc → updatedAt`. Trước khi `PUT`, adapter chuyển các trường này về enum/tên backend, chỉ gửi các trường thuộc hợp đồng. FE đang nhập **tuổi**, nên khi tuổi thay đổi adapter quy đổi thành ngày sinh theo ngày hiện tại trừ số tuổi; đây là ngày quy đổi để tính toán, không phải ngày sinh chính xác do người dùng xác nhận. Nếu tuổi không đổi, giữ `birthDate` gốc. `allergies` được đối chiếu theo tên và gọi CRUD từng mục; `avoidedFoods` hiện được đọc và giữ nguyên.

`bmi`, `adultBmiCategory` và `estimatedTdeeKcal` chỉ được đọc từ response backend. Khi chỉnh sửa số đo, giao diện cũ hiển thị kết quả xem trước từ `POST .../body/estimate`; sau `PUT` hiển thị kết quả hồ sơ đã lưu. FE dùng `0` nội bộ để biểu diễn kết quả `null` và hiển thị `—`/“Chưa đủ dữ liệu”, không dùng số mẫu. FE không tính BMR, TDEE, phân bổ đa lượng hoặc tự cộng/trừ calo theo mục tiêu. Nhãn BMI người lớn theo ngưỡng backend: 18.5, 25, 30. Luôn ghi rõ đây là ước tính tham khảo.

Ảnh đại diện, quy tắc nguyên liệu ẩn, nguồn protein ưa thích, BMR và phân bổ đa lượng chưa thuộc hợp đồng profile. FE giữ một số lựa chọn UI chưa có backend trong localStorage theo `userId`, nhưng không gửi chúng trong `PUT /api/profile/me` và không mô tả chúng là dữ liệu sức khỏe đã đồng bộ. Thống kê bài viết/bình luận/video phải lấy từ module nội dung tương ứng khi có dữ liệu thật, không nằm trong response profile hiện tại.

Trong backend, `Application.Features.Profiles.IProfileContextReader.GetContextAsync(userId, ct)` cung cấp `ProfileContext` chỉ đọc cho chat, scan, thực đơn và tủ bếp. DTO gồm chế độ ăn, dữ liệu cơ thể, mục tiêu, BMI/TDEE, khu vực, tên dị ứng/thực phẩm tránh và thời điểm cập nhật; không gồm email, số điện thoại hoặc mật khẩu. Module gọi truyền ID người dùng đã xác thực và tự lưu bản sao các trường cần thiết vào snapshot của mình. Việc cập nhật hồ sơ sau đó không làm thay đổi snapshot đã lưu.
