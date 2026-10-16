# BE 2 — Core Data tuần 1

## Trạng thái và phạm vi

- Đã có Category, Ingredient, Recipe, RecipeIngredient và enum nguồn gốc/chế độ ăn.
- Một recipe có một category; chưa cần RecipeCategory. Dinh dưỡng lưu trực tiếp theo 100 g ingredient và mỗi khẩu phần recipe; chưa cần NutritionInfo riêng.
- Có tạo/sửa/danh sách/chi tiết/ngừng sử dụng; DTO tách khỏi entity.
- Có filter category/chế độ ăn/thời gian nấu/calo, tìm tên recipe hoặc tên/aliases ingredient.
- Phân loại tính từ ingredient hiện tại, trả kết quả riêng cho bốn chế độ và giữ trạng thái chưa rõ.
- Seed kiểm thử: 3 category, 7 ingredient, 6 recipe có nhãn [Mẫu]. Seed demo riêng: 8 category, 36 ingredient, 32 recipe, 12 restaurant có nhãn [Demo]. Dinh dưỡng chỉ để minh họa/kiểm thử.
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
| Dữ liệu và seed demo | Infrastructure/Persistence/Seeding/DemoDataCatalog.cs, DemoDataSeeder.cs |
| Dữ liệu nhà hàng demo | Infrastructure/Persistence/Seeding/DemoRestaurantCatalog.cs |
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

### Bộ dữ liệu demo danh mục, nguyên liệu và công thức

Sau khi áp dụng migration, chạy từ repository root:

```powershell
dotnet run --project backend/src/Api --launch-profile http -- --seed-demo-data
```

Lệnh này chỉ thêm dữ liệu còn thiếu, không tạo tài khoản, không tạo thực đơn và không thay đổi hồ sơ. Chỉ chạy ở Development; chạy xong thoát. Không cần API key Gemini. Dùng cùng connection string local với API đang chạy. Bộ `[Mẫu]` cũ được giữ nguyên; `[Demo]` dùng namespace ID riêng `20000000-0000-0000-0000-*`. Có thể chạy lại sau khi Admin sửa tên, hướng dẫn, dinh dưỡng hoặc ngừng sử dụng; dữ liệu đã có giữ nguyên.

| Dữ liệu | Tổng | Đang hoạt động | Nội dung demo |
|---|---:|---:|---|
| Danh mục | 8 | 7 | Bữa sáng, cơm/bún, canh/súp, salad/rau củ, món nhẹ, đồ uống, món trứng/sữa, danh mục đã ngừng |
| Nguyên liệu | 36 | 35 | Rau củ, ngũ cốc, đậu/hạt, trứng, sữa, mật ong, gia vị chưa xác minh, nước mắm cá, bột mì đã ngừng |
| Công thức | 32 | 31 | 21 món Vegan đang hoạt động, món Ovo/Lacto/Lacto-ovo, món chưa đủ bằng chứng, món có cá và món đã ngừng |
| Nhà hàng | 12 | 11 | TP.HCM, Hà Nội, Đà Nẵng; bốn chế độ ăn khai báo, tiện ích, món liên quan, nhà hàng thiếu tọa độ và nhà hàng đã ngừng |

Mỗi công thức có hướng dẫn, thời gian, 2 khẩu phần và định lượng nguyên liệu. Các số dinh dưỡng giả lập được ghi rõ trong nguồn nguyên liệu/mô tả công thức; món gia vị chưa xác minh giữ dinh dưỡng `null`. Dị nguyên có tên tiếng Việt/alias tiếng Anh để demo tìm kiếm và đối chiếu. Không có cam kết an toàn dị ứng.

Gợi ý demo:

1. Admin mở danh mục/nguyên liệu/công thức, tìm `[Demo]`, thử sửa và ngừng sử dụng. Bản ghi đã ngừng chỉ xuất hiện phía Admin; công thức cũ vẫn giữ tham chiếu.
2. Guest tìm `tofu`, `oats`, `đậu gà`; lọc danh mục, thời gian nấu, calo và bốn chế độ ăn. Với `search=[Demo]`, trang công thức công khai có 31 món nên kiểm tra được phân trang mặc định 20 món/trang.
3. So sánh trứng hấp nấm (Ovo), súp bí đỏ sữa (Lacto), bánh mì trứng sữa (Lacto-ovo), gia vị cần xác minh (Unknown), nước mắm cá (Incompatible cả bốn chế độ).
4. Nhà hàng: tìm `[Demo]`, lọc `district=Hà Nội` hoặc chế độ ăn. Thử khoảng cách với `latitude=10.776889&longitude=106.700806&maxDistanceKm=5`; nhà hàng chưa có tọa độ không khớp bộ lọc này. Mở chi tiết để xem giờ, giá, tiện ích và công thức liên quan. Admin xem được nhà hàng đã ngừng. Tất cả tên/địa chỉ/tọa độ/giá/giờ chỉ là giả lập; không có số điện thoại hoặc website thật.

Kiểm thử SQL/API của bộ demo nằm trong `tests/IntegrationTests/DemoSeedChecks.cs`, chạy cùng lệnh kiểm thử Core Data dưới đây. Để chỉ kiểm tra bộ demo trên database tạm riêng: `dotnet run --project backend/tests/IntegrationTests -c Release -- --demo-seed-only`.

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
