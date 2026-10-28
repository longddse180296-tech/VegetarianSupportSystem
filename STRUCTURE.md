# Cấu trúc thư mục Vegetarian Support

Vị trí nhà hàng: FE chọn từng cấp tại `features/restaurants/components/RestaurantLocationPicker.tsx`, danh mục tham chiếu có giấy phép tại `features/restaurants/data`, định dạng khoảng cách tại `utils/restaurantLocation.ts`. Backend tính và sắp gần nhất trong `Application/Features/Restaurants/RestaurantService.cs`. Xem [luồng và nguồn dữ liệu](docs/restaurant-location.md).

Metadata video nằm tại `Application/Features/Videos`, `Domain/Entities/VideoMediaMetadata.cs`, `Infrastructure/Storage/FfprobeVideoMediaProbe.cs` và worker `Infrastructure/BackgroundJobs/VideoMetadataWorker.cs`; FE preview tại `features/videos/components/VideoFileMetadata.tsx`. Xem [cấu hình và luồng](docs/video-metadata.md).

Lưu công thức theo tài khoản dùng hook chung `frontend/src/features/favorites/hooks/useRecipeSaves.ts`; trang tủ bếp trong Profile nằm tại `frontend/src/features/pantry/pages/ProfilePantryPage.tsx`. Backend ghi nguồn lưu trong feature Favorites, theo [hợp đồng Favorites](contracts/favorites.md).

Phase 1 (16/10/2026): dữ liệu seed mẫu/demo chỉ còn tại `backend/tests/IntegrationTests/Fixtures/`, không được biên dịch trong Infrastructure hoặc gọi từ API. Runtime không cung cấp seed mẫu hay phản hồi AI giả.

Core Data BE 2 đã triển khai: mỗi feature Categories/Ingredients/Recipes có thư mục `Dtos/` và các file Service/Validation/Mapping/Repository interface riêng. Repository implementation nằm tại `Infrastructure/Persistence/Repositories/`; quy tắc phân loại ở `Domain/Rules/`; fixture ở `backend/tests/IntegrationTests/Fixtures/`. Kiểm thử nằm trong `backend/tests/IntegrationTests/`. Xem [bản đồ code và cách chạy](backend/CORE_DATA.md).

Khung hiện tại dùng monorepo với frontend và backend tách thư mục. Backend theo Clean Architecture, dùng tên project ngắn để dễ nhìn trong Visual Studio: `Api`, `Application`, `Domain`, `Infrastructure`.

Frontend có các màn hình Guest/User/Admin; backend cung cấp API SQL Server, xác thực, kiểm duyệt, dinh dưỡng, AI và media. Router ghép màn hình tại frontend/src/app/router/Router.tsx.


Cây thư mục chính sau dọn ngày 28/10/2026:

```text
VegetarianSupportSystem/
  .github/                 mẫu pull request
  backend/
    Backend.sln
    Backend.csproj        launcher, chạy dotnet run
    Program.cs
    src/
      Api/                Controllers, Authorization, Configuration, Hubs
      Application/        Features, Common, Abstractions/AI
      Domain/             Entities, Enums, Rules, ValueObjects
      Infrastructure/     AI, Persistence, Identity, Email, Storage, BackgroundJobs, Documents
    tests/
      Domain.Tests/
      IntegrationTests/   Fixtures chỉ dùng database kiểm thử
      Be3Fixtures/        công cụ lịch sử, không chạy seed lên database demo
  frontend/
    package.json
    package-lock.json     dùng npm
    src/
      main.tsx
      app/                App, router, layouts
      features/           auth, profile, articles, videos, recipes, pantry, meal-plans,
                          restaurants, ai-chat, food-scan, favorites, reports, home, admin
      shared/             api, components, constants
      assets/
      styles/
    tests/
  contracts/
  docs/
    archive/              báo cáo lịch sử
    database/
  outputs/                tài liệu theo dõi công việc
```

Không giữ thư mục rỗng bằng .gitkeep. Khi có triển khai thực tế, tạo thư mục đúng module theo AGENTS.md. Cache .pnpm-store và pnpm-lock đã bỏ; node_modules, bin, obj, dist là đầu ra cục bộ bị Git bỏ qua. Các probe/log cũ được lưu trong .local/cleanup-archive-20261028, backup SQL và FFprobe đang dùng vẫn được giữ.
