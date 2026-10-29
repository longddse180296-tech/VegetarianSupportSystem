# BE 2 — Core Data tuần 1

Cập nhật 27/10/2026: Favorites lưu thêm `SavedFrom` cho công thức (`Recipe`/`Pantry`, nullable cho dữ liệu cũ), migration `20261027075305_AddFavoriteSaveSource`. Chi tiết contract và kiểm tra ở [Lưu công thức vào Profile](../docs/recipe-saves-2026-10-27.md).

## Trạng thái và phạm vi

- Đã có Category, Ingredient, Recipe, RecipeIngredient và enum nguồn gốc/chế độ ăn.
- Một recipe có một category; chưa cần RecipeCategory. Dinh dưỡng lưu theo mốc đơn vị của ingredient và mỗi khẩu phần recipe; chưa cần NutritionInfo riêng.
- Có tạo/sửa/danh sách/chi tiết/ngừng sử dụng; DTO tách khỏi entity.
- Có filter category/chế độ ăn/thời gian nấu/calo, tìm tên recipe hoặc tên/aliases ingredient.
- Dinh dưỡng công thức tự tính bởi `RecipeNutritionService`, quy đổi thuần ở `Domain/Rules/RecipeNutritionRules`; xem trước realtime qua `Api/Hubs/RecipeNutritionHub`. Lưu luôn tính lại từ DB, không tin tổng do FE gửi. Không tự đổi ml/số lượng sang g, dữ liệu thiếu chặn lưu kèm lý do. Cần proxy WebSocket `/api` cho SignalR.
- Nguyên liệu lưu dinh dưỡng kèm `NutritionBasisQuantity`/`NutritionBasisUnit` (100 g, 1 kg, 100 ml hoặc 1 đơn vị đếm). Các property dinh dưỡng Domain dùng tên tổng quát; cột SQL `*Per100Gram` cũ được giữ nguyên để bảo toàn dữ liệu. Migration `IngredientNutritionBasis` gán mốc 100 g cho bản ghi cũ, không suy ra mốc từ `DefaultUnit`. POST/PUT bắt buộc đơn vị và đủ bốn chỉ số; response vẫn giữ trường per-100g tương thích cho mốc g/kg.
- Phân loại tính từ ingredient hiện tại, trả kết quả riêng cho bốn chế độ và giữ trạng thái chưa rõ.
- Seed kiểm thử: 3 category, 7 ingredient, 6 recipe có nhãn [Mẫu]. Seed demo riêng: 8 category, 36 ingredient, 32 recipe, 12 restaurant có nhãn [Demo]. Dinh dưỡng chỉ để minh họa/kiểm thử.
- Migration hiện có bao phủ các entity đã tích hợp; giữ lịch sử và model snapshot, không xóa để làm gọn source.
- API Admin dùng xác thực thật và kiểm tra phiên/quyền tại backend.

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
| Seed mẫu | tests/IntegrationTests/Fixtures/CoreDataSeeder.cs |
| Dữ liệu và seed demo | tests/IntegrationTests/Fixtures/DemoDataCatalog.cs, DemoDataSeeder.cs |
| Dữ liệu nhà hàng demo | tests/IntegrationTests/Fixtures/DemoRestaurantCatalog.cs |
| HTTP endpoint | Api/Controllers/{Categories,Ingredients,Recipes}Controller.cs |
| Kiểm tra quyền Admin | Api/Authorization/CoreDataAdminAttribute.cs |
| Chuyển lỗi HTTP dùng chung | Api/Controllers/CoreDataControllerBase.cs |
| Kiểm thử | tests/IntegrationTests |

Mỗi DTO nằm trong file riêng; không gom request, response, mapping và exception vào một file Contracts. Không dùng generic repository hoặc base service để che logic feature. Chỉ dùng chung validation số thập phân, lỗi conflict và chuyển lỗi HTTP có hành vi giống nhau.

File shared đã thay đổi: Application/DependencyInjection và Infrastructure/DependencyInjection đăng ký service/repository; AppDbContext nạp entity config; API không nhận lệnh seed mẫu/demo; Backend.sln thêm chương trình kiểm thử. Application/Common chứa các tiện ích validation và exception dùng chung cho ba feature.

## Database và dữ liệu kiểm thử

Áp dụng migration bằng `dotnet ef database update --project backend/src/Infrastructure --startup-project backend/src/Api`.
Dữ liệu thật được nhập qua Admin. API không còn hỗ trợ `--seed-core-data` hoặc `--seed-demo-data`.

Các catalog và seeder mẫu/demo đã chuyển sang `tests/IntegrationTests/Fixtures/`, chỉ được biên dịch vào project kiểm thử. Chạy `dotnet run --project backend/tests/IntegrationTests -c Release` trên database thử nghiệm riêng. Test host tự tạo database ngẫu nhiên và xóa sau khi kiểm tra, không seed vào database vận hành.

## Quy trình migration chung

1. Nhận/merge entity và config từ BE 1/BE 3; không tự thiết kế module của họ.
2. Build và rà model snapshot. BE 2 là người generate migration trên nhánh đã hợp nhất.
3. Giữ migration đã chia sẻ/áp dụng. Không xóa lịch sử để làm file trông gọn hơn.
4. Chạy migration trên DB kiểm thử mới và kiểm tra nâng cấp DB đang ở migration trước.
5. Khi có conflict snapshot, hợp nhất entity/config trước; chỉ regenerate migration chưa chia sẻ/chưa áp dụng. Không chỉ chọn một phía của snapshot.

Danh sách migration hiện hành nằm trong Infrastructure/Persistence/Migrations; kiểm tra bằng dotnet ef migrations list thay vì dựa vào số lượng trong báo cáo cũ.

```powershell
dotnet ef migrations has-pending-model-changes --project backend/src/Infrastructure --startup-project backend/src/Api
dotnet build backend/Backend.sln -c Release
dotnet run --project backend/tests/IntegrationTests -c Release
```

Chạy riêng kiểm thử Core Data (CRUD, đơn vị định lượng, phân loại/tìm kiếm, filter khai báo và tương thích): `dotnet run --project backend/tests/IntegrationTests -c Release -- --core-only`. Vẫn dùng database kiểm thử riêng ngẫu nhiên và xóa sau khi chạy; không chạy nhóm Auth/SMTP.

Kiểm thử là chương trình console chạy HTTP thật trên loopback và SQL Server thật, exit khác 0 khi có assertion thất bại. Đây không phải project chạy bằng dotnet test. Mặc định dùng LocalDB; máy khác đặt CORE_DATA_TEST_CONNECTION tới SQL Server thử nghiệm. Chương trình luôn thay tên database bằng tên riêng ngẫu nhiên, tạo rồi xóa database đó trong finally. Danh tính giả lập chỉ nằm trong test host, không nằm trong API thật.

Kiểm thử chia thành: CoreDataApiChecks (CRUD/quyền/validation), DietaryChecks (bảng quy tắc Domain), SeedFilterChecks (seed, filter SQL, cập nhật ingredient). Chưa kiểm thử token thật/FE hay chịu tải.
