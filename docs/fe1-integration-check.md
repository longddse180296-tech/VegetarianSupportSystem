# Tích hợp FE1 — Vân Quang Duy

Cập nhật: 11/10/2026. Báo cáo mô tả tích hợp frontend với backend hiện có, không thay đổi phân công hoặc contract API.

## Phạm vi

- Theo mục 5 `AGENTS.md`: FE1 phụ trách Auth, Profile, Articles, toàn bộ Admin và Meal Plans.
- `docs/work-assignment.md` và mục 6 `docs/backend-work-assignment.md` xác nhận Admin Categories/Ingredients/Recipes/Restaurants thuộc FE1. Restaurants, Recipes và Videos phía người dùng thuộc FE2.
- Chỉ sửa frontend thuộc FE1 và layout/router liên quan. Không sửa source backend, migrations, contracts, frontend công khai Recipes/Restaurants/Videos, Pantry, AI chat hoặc Food Scan. Không thay đổi database `VegetarianSupport` đang dùng.
- Giữ màu xanh/trắng, sidebar, thẻ bo góc và các component chung hiện tại. Gỡ dữ liệu, trạng thái và thao tác mẫu không có API tương ứng.

## Những luồng đã nối

| Phần FE1 | Endpoint chính | Cách hiển thị và xử lý |
|---|---|---|
| Auth | `/api/auth/register`, `/login`, `/me`, `/logout`, `/forgot-password`, `/reset-password` | Dùng phiên thật, ghi nhớ quyết định sessionStorage/localStorage; không tin user cache khi xác thực lỗi. Reset đọc token từ URL email; lỗi SMTP không báo thành công giả. |
| Profile | `/api/profile/me`, `/body/estimate`, `/allergies`, `/avoided-foods` | Lưu trường hồ sơ được hỗ trợ, BMI/TDEE từ BE, CRUD dị ứng và thực phẩm cần tránh. Loại trùng tên không phân biệt hoa thường; kiểm tra giới hạn 150 ký tự trước khi lưu. |
| Thống kê hồ sơ | `/api/me/articles`, `/api/me/comments`, `/api/me/videos` | Lấy số đếm và bài gần đây thật. Một API nội dung lỗi không chặn hồ sơ; số đếm chưa tải được hiện `—`. Bỏ tùy chọn chỉ lưu local và phần tự sinh lời tư vấn mang nhãn AI. |
| Bài viết công khai | `/api/articles`, `/{id}`, `/{id}/helpful` | Danh sách/tìm kiếm/lọc/phân trang, chi tiết và bài liên quan; hữu ích có trạng thái và số đếm thật. Không dựng lượt xem, tên tác giả, bookmark hoặc số tương tác chưa được BE cung cấp. |
| Bài viết của tôi | `/api/me/articles`, `/{id}`, `/{id}/submit` | Tạo/sửa nháp, gửi phiên bản, xem phản hồi và trạng thái riêng của AI/Admin. Xóa chỉ với nháp chưa gửi; giữ ID đã tạo khi bước gửi duyệt lỗi. Bản sửa chưa duyệt không thay bản đã xuất bản. |
| Kết quả kiểm tra bài viết | `/api/moderation/submissions/{id}`, `/{id}/retry-ai` | Xem loại cờ, mức ưu tiên, lý do, bằng chứng, phạm vi đã/chưa kiểm tra; thử lại khi thất bại. Không gọi `mock-ai-result`. |
| Bình luận cá nhân/công khai | `/api/comments`, `/{id}`, `/{id}/like`, `/api/me/comments` | Bình luận, phản hồi, sửa/gỡ của chủ sở hữu và thích thật. Mục của tôi có tìm kiếm/lọc Article hoặc Video và phân trang. |
| Admin Dashboard | `/api/admin/dashboard` | Đủ số đếm thành viên, bài viết/video/bình luận, Categories/Ingredients/Recipes/Restaurants; queue và hoạt động gần đây. Bỏ chart, tăng trưởng và danh sách mẫu. |
| Admin Categories/Ingredients | `/api/admin/categories`, `/api/admin/ingredients` | CRUD/phân trang/tìm kiếm và ngừng sử dụng đúng method BE. Nguyên liệu giữ trạng thái bằng chứng `true/false/null`, enum, dị nguyên và dinh dưỡng. |
| Admin Recipes | `/api/admin/recipes` | Danh sách/chi tiết/tạo/sửa/ngừng sử dụng. Form có danh mục, nguyên liệu thật, lượng/đơn vị, khẩu phần, hướng dẫn, thời gian, URL ảnh và dinh dưỡng nullable. Nhãn chế độ ăn lấy từ đánh giá BE; không gán thủ công. |
| Admin Restaurants | `/api/admin/restaurants` | Danh sách/chi tiết/tạo/sửa/ngừng sử dụng. Có địa chỉ/khu vực, tọa độ, liên hệ, giá, chế độ ăn khai báo, tiện ích, nguồn và công thức liên quan. Bỏ verify/xóa vật lý không có contract. |
| Admin Articles/Videos | `/api/admin/moderation/submissions`, `/queue`, `/{id}`, `/{id}/decisions` | Kiểm duyệt riêng trong trang Bài viết và Video; request danh sách luôn có `contentType=Article` hoặc `Video`. Bỏ menu/trang kiểm duyệt chung; URL cũ `/admin/moderation` chuyển về Bài viết. Dashboard có hai lối vào hàng đợi riêng. Đủ Approve/RequestRevision/Reject/Remove; lưu và hiển thị lịch sử actor/thời gian/lý do/version. Không tạo endpoint `/pending`, `/approve`, `/revision`, `/reject` trùng. |
| Admin Videos | `/api/videos/{contentId}/media?submissionId=...` | Tải media riêng tư bằng Bearer, phát bằng blob URL; Admin xem và quyết định thủ công, không gọi AI. Có tải tệp nếu trình duyệt không hỗ trợ codec. Không sửa màn hình video thuộc FE2. |
| Admin Comments | `/api/admin/comments`, `/{id}`, `/{id}/hide`, `/{id}/remove` | Danh sách/lọc/phân trang, chi tiết, ẩn/gỡ có lý do và thông tin người xử lý. Không có nút khôi phục khi BE chưa hỗ trợ. |
| Admin Members | `/api/admin/members`, `/{id}`, `/status-history`, `/lock`, `/unlock` | Giữ tích hợp thật hiện có; kiểm tra lại tìm kiếm, chi tiết, khóa/mở khóa, lịch sử và JWT bị khóa. |
| Meal Plans | `/api/meal-plans`, `/generate`, `/{id}`, `/meals/{day}/{slot}`, `/regenerate`, `/apply-to-week`, `/shopping-list`, `/pdf` | Giữ luồng 7 ngày/21 bữa đã nối; đủ đổi món/khẩu phần, tổng dinh dưỡng, mua sắm và PDF thật. Bỏ API mock cũ và các mẫu có calo/rating giả. Trang khách giữ banner và hướng dẫn, đăng nhập quay lại setup. |

Các picker danh mục/nguyên liệu/công thức có tìm kiếm và phân trang; không giả định toàn bộ dữ liệu nằm ở trang đầu. API lỗi hiển thị lỗi, không đổi thành dữ liệu mẫu hoặc thông báo lưu thành công.

## Kiểm thử hoàn tất

- `npm run lint`: đạt, không có cảnh báo lint.
- `npm run build`: TypeScript và Vite đạt. Bundle JS khoảng 902 kB; còn cảnh báo Vite vượt 500 kB.
- `dotnet build backend/Backend.sln -c Release --no-restore -m:1 -p:UseSharedCompilation=false`: đạt, 0 warning/error. Không sửa BE.
- `dotnet test backend/tests/Domain.Tests/Domain.Tests.csproj -c Release --no-build`: 75/75 đạt. Testhost cần chạy ngoài sandbox trên máy này.
- Chrome headless + API thực + SQL Server LocalDB, database mới có tên `Fe1Browser_<GUID>`: **40 nhóm kiểm tra đạt** (17 nhóm luồng cũ + 23 nhóm tích hợp mới), không có lỗi runtime FE.
- Kiểm tra bố cục desktop 1440 px và mobile 390 px, không tràn ngang toàn trang; bảng dữ liệu cuộn trong khung.
- Đã kiểm tra lỗi lưu công thức/Meal Plan, rollback checkbox mua sắm khi API lỗi, `/me` lỗi không dùng cache, và hồ sơ vẫn dùng được khi API video lỗi.
- Đã kiểm tra đủ bốn quyết định kiểm duyệt, giữ bản công khai khi có sửa đổi/từ chối, comment like/helpful, phản hồi, lịch sử ẩn/gỡ và khóa/mở khóa thành viên.
- Database và tiến trình test đã dọn sau chạy. Không migration/seed/xóa dữ liệu trong database của thành viên. Bộ chạy và ảnh kiểm tra cục bộ nằm trong `.local/`, được Git bỏ qua, không thêm dependency vào project.

Sau khi bỏ trang kiểm duyệt chung, đã chạy lại lint/build FE và 7 kiểm tra UI bằng Chrome với HTTP fixture: hai lối vào hàng đợi riêng, bài viết chỉ gọi `contentType=Article`, lọc trạng thái/AI giữ đúng loại, xem phạm vi `Partial` và gửi quyết định theo contract, URL cũ chuyển về Bài viết, trang Video giữ riêng và không có bộ lọc AI, bố cục mobile và lỗi 500 không bị biến thành danh sách rỗng. Đây là kiểm tra giao diện, không xác nhận API trên database hiện tại đã hết lỗi; không kiểm tra lại xử lý media video và không gọi BE hoặc sửa database trong đợt này.

### Đồng bộ giao diện FE1 với kiểu dùng ở FE2 (12/10/2026)

- Dùng `var(--font-sans)` hiện có: Inter và font hệ thống dự phòng. Nội dung/ô nhập/nút 14px, chữ phụ 12–13px; tiêu đề chính 28–36px, tiêu đề Admin 24–30px theo màn hình. Không thêm dependency hoặc tải font ngoài.
- Nút hành động dùng cùng màu với shared `Button` mà FE2 đang dùng: xanh `#2E7D32`, hover `#1B5E20`; nút viền đổi viền/chữ xanh; nút nguy hiểm đỏ. Nút chính cao 40px, bo 10px, chữ 14px/600, chuyển trạng thái 150ms; có active, focus bàn phím, disabled và giảm chuyển động.
- Style mới ở `frontend/src/styles/fe1.css`, được giới hạn bằng `fe1-ui` tại App và `app/router/uiScope.ts`. Áp dụng Auth, Profile, Articles, Admin và Meal Plans; loại trừ `/profile/my-videos` và `/my-videos` của FE2. Các component/nút trong những module FE1 được gắn class phù hợp, giữ nguyên handler và request API.
- CSS Thành viên được giới hạn bởi `fe1-members`, bỏ quy tắc font `:root` và selector không có phạm vi đang ảnh hưởng trang khác. Header công khai trên trang FE1 chuyển menu sang hàng có thể cuộn ở mobile, giữ nút đăng nhập/đăng ký trong màn hình.
- Không sửa source backend, public Recipes/Videos/Restaurants/Pantry/AI Chat/Food Scan hoặc component dùng chung của FE2.
- Chrome headless: **12 nhóm kiểm tra UI đạt**, kiểm tra computed font/cỡ chữ, màu thường/hover, focus bàn phím, disabled, modal, nút nguy hiểm Thành viên, giảm chuyển động, bố cục 1440px/390px, và FE2 giữ nguyên style sau khi chuyển qua FE1. Không có lỗi runtime. Toàn bộ API được chặn bằng HTTP fixture; lượt này không gọi BE hoặc ghi database, không thay thế kết quả kiểm thử API thật ở mục trên.
- `npm run lint` và `npm run build` chạy lại sau thay đổi UI: đều đạt. Vite còn cảnh báo chunk JS khoảng 905 kB vượt 500 kB. Bộ kiểm tra và ảnh cục bộ ở `.local/fe1-typography-check.mjs`, `.local/fe1-ui-*.png`, không commit `.local/`.

### Giới hạn của kiểm thử dịch vụ ngoài

- Bài viết gửi thật vào worker; thiếu key AI tạo `Failed` thật, thử lại bằng endpoint thật. Để kiểm tra Admin với `Partial`/`Passed`, chuẩn bị kết quả bằng SQL fixture **chỉ trong database test**; không dùng endpoint `mock-ai-result`, không xác nhận Gemini thật đã trả kết quả thành công.
- Reset thực sự gọi BE, đổi mật khẩu, vô hiệu JWT cũ và không dùng lại được token. Token test được chuẩn bị bằng SQL fixture đúng schema. SMTP bị tắt riêng trong môi trường test để xác minh FE hiển thị `503`; chưa xác nhận thư đến hộp thư thật.
- Video được tạo thành WebM có khung hình, upload bằng API thật, phát media riêng tư trong Chrome rồi Admin duyệt/gỡ. Không sử dụng AI cho video.

## Điểm BE/môi trường cần bàn giao

Kiểm tra chỉ đọc lần cuối cho thấy database `VegetarianSupport` hiện **chưa có bảng Videos** và thiếu các cột `AiFlagReason`, `AiFlagType`, `AiPriority`, `AiEvidence`, `CreatedAtUtc`, `UpdatedAtUtc` trong `ModerationSubmissions`. Đây là nguyên nhân môi trường có thể khiến API nội dung trả 500, dù FE đã map đúng. LocalDB bật chưa đồng nghĩa schema đã cập nhật.

Năm migration BE3 chưa được ghi trong `__EFMigrationsHistory` của database này:

- `20261009141232_Be3VideoAndFoodScan`
- `20261009142113_Be3ModerationEvidence`
- `20261009142346_Be3ScanRevisions`
- `20261009175534_RepairModerationSubmissionColumns`
- `20261009183225_VideoAdminOnlyModeration`

Nhờ BE/người quản lý database rà soát và áp dụng migration theo quy trình nhóm trước khi demo toàn bộ nội dung. Đợt FE này không tự áp dụng lên database đang dùng.

Các phần FE chưa thể bổ sung dữ liệu thật nếu BE chưa cung cấp:

- Tổng hợp bài viết/video/bình luận theo từng thành viên: `contracts/admin-members.md` mới đề nghị endpoint `content-summary`, backend hiện chưa triển khai. FE không dựng số liệu/tab giả.
- Tên/ảnh tác giả và lượt xem bài viết: DTO hiện trả ID tác giả, không trả các trường đó. FE hiển thị ID và những dữ liệu có thật.
- Avatar upload và tùy chọn dinh dưỡng riêng ngoài BMI/TDEE: API hồ sơ chưa có; không cho lưu các tùy chọn local như dữ liệu backend.
- Gửi email reset thật và AI kiểm tra bài viết thành công cần cấu hình SMTP/Gemini phía BE.
- Bộ IntegrationTests BE còn assertion `after.Content.Comments is null` tại `backend/tests/IntegrationTests/DashboardApiChecks.cs:97`, trái với số đếm hiện tại. Đây là điểm cần BE cập nhật; 75 tests đạt nêu trên là bộ Domain.Tests, không phải tuyên bố toàn bộ IntegrationTests đã đạt.

## Cách demo Meal Plans

1. Đăng nhập, lưu chế độ ăn/dị ứng/thực phẩm cần tránh trong Hồ sơ.
2. Chuẩn bị công thức active có nguyên liệu và bằng chứng phù hợp chế độ ăn. Có ít nhất hai món phù hợp để demo đổi tên món; không có công thức phù hợp thì BE có thể trả lỗi nghiệp vụ.
3. Vào Thực đơn → Tạo mới, chọn tên/ngày bắt đầu → Tạo và lưu 21 bữa.
4. Chọn ngày 1–7, đổi món và khẩu phần; xem dinh dưỡng do BE trả. Giá trị chưa biết hiện rõ, không thay bằng số giả.
5. Danh sách đi chợ → đánh dấu đã mua → tải lại trang để kiểm tra lưu thật.
6. Tạo lại dùng snapshot hồ sơ của kế hoạch; muốn dùng hồ sơ mới, tạo kế hoạch mới. Áp dụng sang tuần mới tạo bản sao và tính lại shopping list theo tủ bếp hiện tại.
7. Tải PDF bằng ID kế hoạch; tệp thực đã được kiểm tra header `%PDF-`.
