# Code-first tài khoản và hồ sơ

Nguồn nghiệp vụ: `docs/mvp.md` mục 2, 3, 8 và 9. Figma hiện không đọc trực tiếp được do hết lượt MCP Starter; repository chưa có file ERD để đối chiếu. Thiết kế này có thể điều chỉnh nếu ERD đã chốt khác về khóa hoặc danh mục dữ liệu.

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
- `BirthDate` giúp tuổi không bị lỗi thời; `SexForEnergyEstimate` là lựa chọn tùy ý phục vụ công thức năng lượng, không phải role. Công thức BMI/TDEE và ngưỡng vẫn cần chốt trước khi tính toán. Kết quả scan/thực đơn cần lưu snapshot hồ sơ khi các module đó được triển khai.
- `PasswordHash` chỉ chứa kết quả băm do tầng Auth tạo; entity không tự băm hay xác thực mật khẩu. Không lưu mật khẩu thô.
- `IsLocked`, `LockReason`, `LockedAtUtc` phục vụ quản lý thành viên; đăng nhập và xác thực JWT đều đối chiếu trạng thái khóa tài khoản.

Migration `UserAccountsAndProfiles` đã được tạo nhưng chưa áp dụng trên SQL Server. Vì model Moderation hiện hành có ba cột chưa nằm trong migration đầu tiên, migration này cũng bổ sung `AiFlagReason`, `CreatedAtUtc` và `UpdatedAtUtc` cho `ModerationSubmissions` để snapshot EF khớp model hiện hành.
