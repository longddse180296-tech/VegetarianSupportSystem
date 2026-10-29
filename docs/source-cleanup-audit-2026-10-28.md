# Rà soát file và thư mục trước buổi demo — 28/10/2026

## Kết quả thực hiện sau khi được người dùng đồng ý

- Bỏ 55 tệp frontend được xác nhận ngoài đường import và không có frontend test tham chiếu: 32 TS/TSX, 23 CSS. Source trước dọn được sao lưu trong `.local/source-before-cleanup-*.zip`.
- Bỏ frontend/pnpm-lock.yaml, giữ package-lock.json và thêm ignore .pnpm-store. Chuyển cache pnpm (292 tệp tracked) ra khỏi cây source vào `.local/cleanup-archive-20261028/pnpm-store`; Git thể hiện xóa khỏi vị trí cũ, chưa commit.
- Bỏ 59 .gitkeep và 22 thư mục rỗng sau khi dọn. Cập nhật STRUCTURE.md/AGENTS.md theo cây thực tế.
- Chuyển bốn thư mục probe và các log/ảnh cũ vào vùng lưu trữ `.local/cleanup-archive-20261028`. Hai log đang được tiến trình giữ được để nguyên, không dừng dịch vụ chỉ để dọn log.
- Chuyển 7 báo cáo lịch sử sang docs/archive, sửa liên kết Markdown; cập nhật README gốc/frontend/backend và backend/CORE_DATA.md theo trạng thái hiện tại.
- Giữ nguyên SQL/database, backup/recovery, secrets, upload, migrations, bộ kiểm thử, FFprobe đang dùng, node_modules và đầu ra build phục vụ demo. Chưa dọn các gói FFmpeg tải xuống hoặc tài sản thiết kế vì không cần cho bước làm gọn source này.
- Sau dọn: lint frontend đạt, 66 kiểm thử frontend đạt, build FE/BE đạt, 180 kiểm thử backend đạt. Sau bỏ TS/TSX cũ, Tailwind loại thêm CSS chỉ phục vụ các file đó; CSS build giảm khoảng 3 KB. Chưa đối chiếu trực quan toàn bộ màn hình trong trình duyệt, nên kết quả build/test không thay cho kiểm tra giao diện thủ công trước demo.

Các mục phía dưới là ảnh chụp kết quả rà soát trước khi dọn, giữ để đối chiếu lịch sử; không hiểu danh sách này là các file vẫn còn tồn tại.

## Kết luận và phạm vi

Chỉ kiểm tra và lập danh sách; chưa xóa, di chuyển, sửa source, đổi cấu hình hoặc đụng vào database. Đọc cấu hình npm/Vite/TypeScript, solution/project .NET, router, đường import/export, các chỗ tham chiếu và Git tracking. Không chạy script seed hoặc gọi Gemini.

Phân tích từ `frontend/src/main.tsx` tìm thấy 286 tệp TS/TSX/CSS, 231 tệp nằm trong đồ thị import và **55 tệp ngoài đồ thị: 32 TS/TSX, 23 CSS**. Đây là danh sách ứng viên dọn ở nhánh hiện tại, không phải kết luận mọi tệp đều được xóa ngay. Re-export qua index có thể làm một tệp được đánh dấu đang dùng dù export cụ thể không được giao diện sử dụng; test, công cụ ngoài ứng dụng và các nhánh Git khác cũng cần được xét khi dọn thực tế.

## 1. Ưu tiên bỏ khỏi bộ source hoặc lưu trữ riêng

| Đường dẫn | Kết quả kiểm tra | Đề xuất |
|---|---|---|
| `.pnpm-store/` | 292 tệp đang được Git theo dõi, khoảng 4,12 MB; chứa cache SQLite và bản sao frontend cũ dưới `v11/projects/…`. Không thuộc entrypoint/build hiện tại. `.gitignore` chưa bỏ qua thư mục này. | Ưu tiên bỏ khỏi Git khi được yêu cầu dọn; thêm ignore. Đây không phải source chính. |
| `frontend/pnpm-lock.yaml` | Dự án hướng dẫn dùng npm, có package-lock.json. Lock pnpm không có các dependency SignalR/Leaflet đang có trong package.json. | Nếu nhóm thống nhất npm thì bỏ lock pnpm, giữ package-lock.json. Không giữ hai lock lệch nhau. |
| `.local/ArticleKeyProbe/`, `.local/ModerationProbe/`, `.local/CoreDataChecks/`, `.local/ReviewNotes/` | Các project/đầu ra thử nghiệm cục bộ; khoảng 96 MB tổng cộng. Project production không tham chiếu. | Có thể lưu trữ hoặc dọn sau khi giữ các bằng chứng kiểm thử cần cho bảo vệ. |
| `.local/*.log`, `.local/run-logs/`, ảnh chụp kiểm tra cũ, script kiểm tra một lần | Không tham gia build ứng dụng. | Giữ log gần nhất cần chẩn đoán, lưu trữ/xóa phần cũ khi được yêu cầu. Không xóa cả `.local/`. |
| `.local/tools/ffmpeg-essentials.zip`, `.local/tools/ffmpeg-essentials.zip.sha256`, `.local/tools/ffmpeg/` | Gói tải xuống và bản giải nén khoảng 423 MB; ffprobe trong bản giải nén có cùng SHA-256 với bản đang dùng. Cấu hình hiện tại trỏ vào `.local/tools/ffprobe.exe`. | Có thể dọn bộ tải/giải nén sau khi giữ giấy phép cần thiết và bản executable đang dùng. **Giữ `.local/tools/ffprobe.exe`.** |
| `frontend/src/assets/LOGO_ORIGINAL.png` | Khoảng 0,93 MB; không có import hoặc tham chiếu trong source hiện tại. LOGO.png và LOGO_ICON.png đang dùng. | Có thể chuyển bản thiết kế gốc sang thư mục tài liệu thiết kế. |
| `outputs/Vinh_Total_Project_Tracking.xlsx` | Bảng quản lý công việc, đang được Git theo dõi; không được build/runtime dùng. | Có thể đưa vào tài liệu quản lý/đính kèm riêng khi nộp. Không coi là dữ liệu rác cần xóa. |

## 2. Đầu ra sinh lại được, không phải source thừa

| Đường dẫn | Vai trò và giới hạn khi dọn |
|---|---|
| `frontend/node_modules/` — khoảng 163 MB | Dependency đang dùng để chạy/build. Không đưa vào gói source; có thể tạo lại bằng npm ci. Nên giữ trên máy demo để không phải tải lại trước buổi trình bày. |
| `frontend/dist/` — khoảng 3,29 MB | Đầu ra build; không cần cho Vite dev nhưng cần khi chạy preview/triển khai bản build. |
| `backend/**/bin/`, `backend/**/obj/` | Đầu ra .NET; tạo lại bằng restore/build. Không xóa trong khi API đang chạy hoặc trước demo nếu chưa build lại. |
| `.tsbuildinfo` trong node_modules/.tmp | Cache TypeScript, tự sinh lại. |

Các thư mục trên đã được ignore. Không cần xóa khỏi máy chỉ để cây source trông gọn.

## 3. Thư mục khung và .gitkeep

Có 59 tệp `.gitkeep` bên ngoài cache/build; 49 nằm trong thư mục đã có code/tài liệu nên không còn cần để giữ thư mục trong Git. Các thư mục sau hiện rỗng hoặc chỉ chứa `.gitkeep`:

- `.github/workflows/` — chưa có workflow CI thực tế.
- `backend/src/Infrastructure/AI/Gemini/Prompts/` — prompt hiện nằm trong các file client/service, không đọc từ thư mục này.
- `backend/src/Infrastructure/Persistence/Seeding/` — fixture đã chuyển sang tests.
- `backend/tests/UnitTests/` — kiểm thử thực tế nằm trong Domain.Tests và IntegrationTests.
- `docs/api/`, `docs/architecture/`, `docs/requirements/` — thư mục khung; contract/tài liệu đang nằm ở nơi khác.
- `frontend/public/` — không có tài nguyên được phục vụ từ đây.
- `frontend/src/app/providers/` — provider hiện được cài ở các module thực tế.
- `frontend/src/features/comments/` — thư mục khung, không đồng nghĩa chức năng bình luận bị thiếu; bình luận đang tích hợp trong các màn hình và module khác.

Có thể bỏ các marker/thư mục khung khi dọn. Nếu đổi cấu trúc thực tế cần cập nhật STRUCTURE.md/AGENTS.md, không đổi riêng cây thư mục mà để tài liệu cũ.

## 4. Công cụ cũ cần tách khỏi luồng demo

`backend/tests/Be3Fixtures/seed_be3.py` đặt mặc định `DB_NAME = "VegetarianSupport"` và có INSERT vào database này. Nó không được app production gọi, nhưng không có cơ chế database ngẫu nhiên/tự dọn như IntegrationTests hiện tại. Không chạy công cụ này để chuẩn bị demo trên database đang sử dụng. Nên lưu trữ bộ Be3Fixtures cũ hoặc sửa thành công cụ chỉ dùng database kiểm thử riêng; đồng bộ `docs/be3-fixture-test-guide-2026-10-10.md` khi thay đổi.

Không đề xuất bỏ `backend/tests/Domain.Tests`, `backend/tests/IntegrationTests` hoặc fixtures đang được các bài kiểm tra này sử dụng.

## 5. Tài liệu cần cập nhật, không nên xóa

- README.md còn mô tả frontend trắng/backend bài viết chưa có/không cần SQL, không phản ánh hệ thống hiện tại.
- frontend/README.md còn mô tả app để trắng.
- backend/README.md còn ghi chưa xác nhận migration và solution bốn project; thực tế có thêm launcher và hai project test.
- STRUCTURE.md còn các mô tả scaffold, thư mục khung và Seeding cũ.
- Các báo cáo tháng 10 như fe-completion-plan, phase-1-review, phase-2-review, be3-report, be3-tracking-audit là lịch sử công việc. Có thể gom vào tài liệu lưu trữ, không dùng như mô tả trạng thái hiện tại.

## 6. Những phần phải giữ

- `.git/`, solution/csproj, global.json, cấu hình Vite/TypeScript, package.json và package-lock.json theo npm.
- Migrations, model snapshot, EF configurations, controllers và đăng ký DI. Nhiều file được framework nạp qua reflection; không thể kết luận thừa chỉ vì không thấy import trực tiếp.
- `.env` cục bộ và dữ liệu upload đang sử dụng: cần cho demo, không đưa bí mật/file người dùng vào Git hoặc gói source chia sẻ.
- `.local/db-backups/`, `.local/db-recovery/`, bản sao lưu registry LocalDB: lưu trữ phục hồi, không xóa cùng log tạm.
- `.local/tools/ffprobe.exe`: đang được cấu hình đọc thời lượng/âm thanh video.
- Bộ kiểm thử, contracts, docs/mvp.md, AGENTS.md và tài liệu phụ thuộc/giấy phép. LICENSE-open-admin-data.txt không được code import nhưng cần giữ cho dữ liệu địa giới.
- Backend.csproj và backend/Program.cs: launcher thật cho lệnh `cd backend; dotnet run`, có trong solution và README; không phải startup bị trùng có thể xóa tùy ý.

## 7. Danh sách frontend ngoài đồ thị import hiện tại

Các danh sách dưới đây được sinh từ kiểm tra static entrypoint. Các file API video cũ có chú thích phục vụ tương thích nhánh release, cần đối chiếu nhánh của nhóm trước khi bỏ. Các index/barrel có thể được công cụ hoặc test sử dụng khi thay đổi về sau. Việc dọn thật cần lint/build và kiểm tra giao diện sau thay đổi.

### TS/TSX — 32 tệp

- `frontend/src/app/index.ts`
- `frontend/src/app/layouts/index.ts`
- `frontend/src/app/layouts/UserLayout.tsx`
- `frontend/src/app/router/uiScope.ts`
- `frontend/src/features/admin/articles/types/adminArticles.types.ts`
- `frontend/src/features/admin/comments/components/CommentDetailModal.tsx`
- `frontend/src/features/admin/members/components/LockMemberModal.tsx`
- `frontend/src/features/admin/members/components/MemberDetailView.tsx`
- `frontend/src/features/admin/members/index.ts`
- `frontend/src/features/admin/members/types/index.ts`
- `frontend/src/features/admin/recipes/types/adminRecipes.types.ts`
- `frontend/src/features/admin/restaurants/types/adminRestaurants.types.ts`
- `frontend/src/features/admin/videos/components/VideoModal.tsx`
- `frontend/src/features/ai-chat/components/ChatInput.tsx`
- `frontend/src/features/ai-chat/components/ChatMessage.tsx`
- `frontend/src/features/ai-chat/components/SuggestionCard.tsx`
- `frontend/src/features/ai-chat/index.ts`
- `frontend/src/features/home/index.ts`
- `frontend/src/features/pantry/components/AddIngredientModal.tsx`
- `frontend/src/features/pantry/components/PantryItemList.tsx`
- `frontend/src/features/pantry/components/RecipeMatchList.tsx`
- `frontend/src/features/recipes/index.ts`
- `frontend/src/features/recipes/pages/RecipesPage.tsx`
- `frontend/src/features/restaurants/pages/RestaurantList.tsx`
- `frontend/src/features/videos/api/videos.api.ts`
- `frontend/src/features/videos/types/index.ts`
- `frontend/src/features/videos/videos.api.ts`
- `frontend/src/shared/api/index.ts`
- `frontend/src/shared/hooks/index.ts`
- `frontend/src/shared/index.ts`
- `frontend/src/shared/types/index.ts`
- `frontend/src/shared/utils/index.ts`

### CSS — 23 tệp

- `frontend/src/features/admin/components/AdminForm.css`
- `frontend/src/features/ai-chat/AiChatShell.css`
- `frontend/src/features/home/components/ArticleCard.css`
- `frontend/src/features/home/components/HeroBanner.css`
- `frontend/src/features/home/components/HomeAssistantPanel.css`
- `frontend/src/features/home/components/MealShortcuts.css`
- `frontend/src/features/home/components/RecipeMiniCard.css`
- `frontend/src/features/home/components/RestaurantCard.css`
- `frontend/src/features/home/components/RestaurantsAndMapPreview.css`
- `frontend/src/features/home/components/VideoCard.css`
- `frontend/src/features/home/pages/HomePage.css`
- `frontend/src/features/pantry/pages/PantryPage.css`
- `frontend/src/features/recipes/components/RecipeCard.css`
- `frontend/src/features/recipes/pages/RecipeDetail.css`
- `frontend/src/features/recipes/pages/RecipeList.css`
- `frontend/src/features/restaurants/components/RestaurantCard.css`
- `frontend/src/features/restaurants/pages/RestaurantDetail.css`
- `frontend/src/features/restaurants/pages/RestaurantList.css`
- `frontend/src/features/videos/components/VideoCard.css`
- `frontend/src/features/videos/pages/VideoDetail.css`
- `frontend/src/features/videos/pages/VideoList.css`
- `frontend/src/shared/components/EmptyState.css`
- `frontend/src/shared/components/SkeletonLoader.css`
