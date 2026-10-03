# BE 2 — Core Data tuần 1

## Trạng thái và phạm vi

- Đã có Category, Ingredient, Recipe, RecipeIngredient và enum nguồn gốc/chế độ ăn.
- Một recipe có một category; chưa cần RecipeCategory. Dinh dưỡng lưu trực tiếp theo 100 g ingredient và mỗi khẩu phần recipe; chưa cần NutritionInfo riêng.
- Có tạo/sửa/danh sách/chi tiết/ngừng sử dụng; DTO tách khỏi entity.
- Có filter category/chế độ ăn/thời gian nấu/calo, tìm tên recipe hoặc tên/aliases ingredient.
- Phân loại tính từ ingredient hiện tại, trả kết quả riêng cho bốn chế độ và giữ trạng thái chưa rõ.
- Seed: 3 category, 7 ingredient, 6 recipe mẫu. Tên có nhãn [Mẫu], dinh dưỡng chỉ để kiểm thử.
- Migration hiện có bao phủ toàn bộ entity hiện diện trong repository. Chưa có entity/config BE 1 hoặc BE 3 để ghép; không coi đây là xác nhận hoàn tất tích hợp toàn nhóm.
- API Admin chờ xác thực thật của BE 1; kiểm tra quyền không có đường bypass trong API.

## Tìm code để sửa

| Cần thay đổi | Vị trí |
|---|---|
| Request/response/phân trang/filter | Application/Features/{Categories,Ingredients,Recipes}/Dtos |
| Điều phối tạo/sửa/ngừng sử dụng | Mỗi feature: *Service.cs |
| Validation recipe/ingredient | Mỗi feature: *Validation.cs; constraint đơn giản nằm trên DTO |
| Chuyển entity thành DTO | Mỗi feature: *Mapping.cs |
| Interface truy cập DB | Mỗi feature: I*Repository.cs |
| Quy tắc phân loại | Domain/Rules/DietaryRules.cs |
| Entity, enum, kết quả phân loại | Domain/Entities, Domain/Enums, Domain/ValueObjects |
| Query SQL và lưu DB | Infrastructure/Persistence/Repositories |
| Khóa/quan hệ/kiểu cột | Infrastructure/Persistence/Configurations |
| Seed mẫu | Infrastructure/Persistence/Seeding/CoreDataSeeder.cs |
| HTTP endpoint | Api/Controllers/{Categories,Ingredients,Recipes}Controller.cs |
| Kiểm tra quyền Admin | Api/Authorization/CoreDataAdminAttribute.cs |
| Chuyển lỗi HTTP dùng chung | Api/Controllers/CoreDataControllerBase.cs |
| Kiểm thử | tests/IntegrationTests |

Mỗi DTO nằm trong file riêng; không gom request, response, mapping và exception vào một file Contracts. Không dùng generic repository hoặc base service để che logic feature. Chỉ dùng chung validation số thập phân, lỗi conflict và chuyển lỗi HTTP có hành vi giống nhau.

File shared đã thay đổi: Application/DependencyInjection và Infrastructure/DependencyInjection đăng ký service/repository; AppDbContext nạp entity config; Program nhận lệnh seed Development; Backend.sln thêm chương trình kiểm thử. Application/Common chứa các tiện ích validation và exception dùng chung cho ba feature.

## Chạy database và seed

Tại repository root, cấu hình connection string local qua user secrets hoặc biến môi trường `ConnectionStrings__DefaultConnection`; không ghi secrets vào source. Sau đó:

```powershell
dotnet ef database update --project backend/src/Infrastructure --startup-project backend/src/Api
dotnet run --project backend/src/Api --launch-profile http -- --seed-core-data
```

Seed chỉ chấp nhận môi trường Development, chạy xong thoát. Seed không chạy migration tự động. ID cố định, chạy lại không nhân đôi/ghi đè dữ liệu Admin đã sửa; toàn bộ thao tác trong transaction. Nếu gặp xung đột tên do bản ghi khác dùng cùng tên mẫu, transaction thất bại và cần xử lý dữ liệu xung đột trước khi chạy lại.

## Quy trình migration chung

1. Nhận/merge entity và config từ BE 1/BE 3; không tự thiết kế module của họ.
2. Build và rà model snapshot. BE 2 là người generate migration trên nhánh đã hợp nhất.
3. Giữ migration đã chia sẻ/áp dụng. Không xóa lịch sử để làm file trông gọn hơn.
4. Chạy migration trên DB kiểm thử mới và kiểm tra nâng cấp DB đang ở migration trước.
5. Khi có conflict snapshot, hợp nhất entity/config trước; chỉ regenerate migration chưa chia sẻ/chưa áp dụng. Không chỉ chọn một phía của snapshot.

Hai migration hiện có: InitialCoreData và IngredientDietaryEvidence (thêm bằng chứng thành phần động vật khác; bản ghi cũ giữ null/chưa xác minh).

```powershell
dotnet ef migrations has-pending-model-changes --project backend/src/Infrastructure --startup-project backend/src/Api
dotnet build backend/Backend.sln -c Release
dotnet run --project backend/tests/IntegrationTests -c Release
```

Kiểm thử là chương trình console chạy HTTP thật trên loopback và SQL Server thật, exit khác 0 khi có assertion thất bại. Đây không phải project chạy bằng dotnet test. Mặc định dùng LocalDB; máy khác đặt CORE_DATA_TEST_CONNECTION tới SQL Server thử nghiệm. Chương trình luôn thay tên database bằng tên riêng ngẫu nhiên, tạo rồi xóa database đó trong finally. Danh tính giả lập chỉ nằm trong test host, không nằm trong API thật.

Kiểm thử chia thành: CoreDataApiChecks (CRUD/quyền/validation), DietaryChecks (bảng quy tắc Domain), SeedFilterChecks (seed, filter SQL, cập nhật ingredient). Chưa kiểm thử token thật/FE hay chịu tải.
