# Code-first tài khoản và hồ sơ

Nguồn nghiệp vụ: `docs/mvp.md` mục 2, 3, 8 và 9. ERD được người dùng gửi ngày 2026-10-03 dưới dạng `.drawio` đã được đối chiếu cho phần `User`/`UserProfile`. Figma hiện không đọc trực tiếp được do hết lượt MCP Starter.

## Đối chiếu ERD được gửi

ERD thể hiện quan hệ `User`–`UserProfile` 1–1. Các trường profile trong ERD là `gender`, `birthDate`, `height`, `weight`, `bmi`, `healthGoal`, `allergies`, `LevelNutrition` và `address`. Bảng `User` còn có `phone`, `avatarUrl` và khóa `UserProfileID`; `phone` đã được bổ sung sau khi đối chiếu ảnh màn hình thông tin tài khoản. `avatarUrl` và việc đổi khóa vẫn ngoài phạm vi triển khai hiện tại.

| ERD | Model hiện có | Quyết định trong phạm vi backend profile |
|---|---|---|
| `UserProfileID: int`, `User.userId: int` | `UserProfiles.UserId` dùng chung ID chuỗi của `Users` | Giữ khóa đã dùng bởi Auth/JWT và các bảng backend khác; quan hệ 1–1 vẫn được bảo đảm bằng PK/FK. Đổi toàn bộ kiểu khóa cần migration xuyên nhiều module. |
| `gender` | `SexForEnergyEstimate` | Giữ trường tùy chọn phục vụ ước tính năng lượng theo `docs/mvp.md`. |
| `birthDate`, `height`, `weight` | `BirthDate`, `HeightCm`, `WeightKg` | Đã lưu trong `UserProfiles` với đơn vị cụ thể và validation. |
| `healthGoal` | `WeightGoal` | Hiện hỗ trợ `Lose`, `Maintain`, `Gain` theo phạm vi mục tiêu cân nặng. |
| `allergies: nvarchar` | `UserAllergies` (1–n) | Giữ bảng riêng để thêm/sửa/xóa từng dị ứng, tránh phải phân tích chuỗi tự do. `UserAvoidedFoods` là danh sách riêng vì ý nghĩa khác dị ứng. |
| `address` | `RestaurantArea` | Giữ khu vực tìm nhà hàng theo MVP, không thu thập địa chỉ đầy đủ khi không cần. |
| `User.phone` | `Users.PhoneNumber` | Lưu số điện thoại liên hệ tùy chọn; API không tuyên bố số điện thoại đã xác thực. |
| `bmi` | Tính trong `ProfileNutritionEstimator` | Không lưu BMI dẫn xuất để tránh sai lệch khi chiều cao/cân nặng thay đổi. `GET/PUT /api/profile/me` trả BMI và TDEE ước tính theo [contract profile](../../contracts/profile.md). |
| `LevelNutrition: INT` | `ActivityLevel` dạng enum chuỗi | ERD không giải thích nghĩa `LevelNutrition`; mức vận động được lưu riêng theo yêu cầu người dùng. |

ERD chưa có trường chế độ ăn hoặc thực phẩm cần tránh; hai dữ liệu này vẫn cần cho MVP và yêu cầu profile hiện tại. `UserProfileCategory` trong ERD liên kết đến `Category` tổng quát, nhưng chưa có quy định `categoryType` nào đại diện cho bốn chế độ ăn đã chốt, nên hiện lưu `Diet` dạng enum.

## Quan hệ

```text
Users (1) ── (0..1) UserProfiles
                   ├── (0..n) UserAllergies
                   └── (0..n) UserAvoidedFoods
```

- `Users.Id` là `nvarchar(450)` để cùng kiểu với `OwnerUserId`, `AdminUserId` và `AiChatConversations.UserId` hiện có. ID mới là chuỗi GUID; các bảng cũ chưa được thêm foreign key vì token phát triển đang cho phép ID giả.
- `Users.Role` lưu chuỗi `User` hoặc `Admin` và có check constraint. `Guest` chỉ là yêu cầu chưa xác thực, không có hàng trong `Users` hay bảng role.
- `UserProfiles.UserId` vừa là primary key vừa là foreign key đến `Users.Id`. Một tài khoản đăng ký qua `User.Register` có hồ sơ rỗng ngay từ đầu; các trường dinh dưỡng được khai báo dần.
- `UserAllergies` và `UserAvoidedFoods` là danh sách riêng. Cùng một thực phẩm có thể xuất hiện ở cả hai vì dị ứng và chủ động tránh có ý nghĩa khác nhau. Mỗi danh sách có unique index trên `(UserId, NormalizedName)`.
- Tên dị ứng/thực phẩm tránh tạm lưu văn bản do người dùng nhập. Chưa liên kết với bảng nguyên liệu Admin vì danh mục đó chưa có; việc chuẩn hóa tên để so khớp nguyên liệu cần làm ở use case scan/thực đơn.
- `BirthDate` giúp tuổi không bị lỗi thời; `SexForEnergyEstimate` là lựa chọn tùy ý phục vụ công thức năng lượng, không phải role. Công thức BMI/TDEE và ngưỡng đã được ghi trong contract profile; chúng chỉ là ước tính tham khảo. Kết quả scan/thực đơn cần lưu snapshot hồ sơ khi các module đó được triển khai.
- `PasswordHash` chỉ chứa kết quả băm do tầng Auth tạo; entity không tự băm hay xác thực mật khẩu. Không lưu mật khẩu thô.
- `IsLocked`, `LockReason`, `LockedAtUtc` phục vụ quản lý thành viên; Auth hiện kiểm tra trạng thái khóa khi đăng nhập và xác thực JWT.

Entity, `DbSet` và EF configuration đã sẵn sàng cho code-first. Migration `20261003073849_UserAccountsAndProfiles` và `20261003091438_UserContactPhone` đã được tạo trong repo; chưa có xác nhận migration đã áp dụng trên SQL Server của nhóm. Migration số điện thoại chỉ sửa bảng `Users`. Ba cột Moderation vẫn chờ migration riêng của module Moderation và không được ghép vào migration profile.
