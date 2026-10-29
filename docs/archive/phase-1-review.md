# Phase 1 — báo cáo tự kiểm tra và bàn giao

Ngày: 16/10/2026. Phạm vi: nền tảng UI dùng chung FE1/FE2 và loại dữ liệu giả khi chạy app. Dừng chờ người dùng xác nhận; chưa bắt đầu Phase 2.

## Thay đổi đã kiểm tra

- Recipes/Videos: xóa mảng mock và fallback, ảnh stock gán cho bản ghi, tác giả/thời lượng/dinh dưỡng tự tạo. Danh sách API lỗi trả về error state; API rỗng không sinh card giả.
- Chế độ ăn chưa có đánh giá giữ trạng thái chưa đủ thông tin; bỏ suy luận Vegan từ tên công thức/video.
- Restaurants: xóa thông tin liên hệ/giá/ảnh/đánh giá và bản đồ SVG giả. Hiện địa chỉ API, liên kết chỉ đường thật; chỉ hiển thị bản đồ vị trí tìm kiếm khi có tọa độ trình duyệt. Bỏ form đánh giá ngoài MVP.
- Pantry: bỏ lưu/xóa/thay thế thành công ở local khi API thất bại; compatibility và substitution candidates lấy từ backend. Bỏ gợi ý thay thế cố định, macro tự tính và thông báo lưu thực đơn giả. Lỗi API được hiển thị.
- Home: bỏ hội thoại AI và trạng thái provider hoạt động giả; giữ các câu hỏi gợi ý để điều hướng vào chat thật. Ảnh minh họa marketing không gắn với bản ghi vẫn được giữ.
- Admin: xóa ChartPlaceholder và AdminDashboardOverview cũ chứa số liệu cứng. Dashboard đang dùng API thật; thiết kế lại dashboard thuộc Phase 4.
- Meal Plan: ShoppingListModal nhận danh sách qua props, không có danh sách mua sắm mẫu mặc định.
- Profile: bỏ ảnh chân dung stock mặc định, dùng ký tự đầu tên khi không có avatar.
- Shared UI: font Segoe UI/Arial qua một token, đồng bộ màu/bo góc/viền control/card/modal; loại font override riêng từng feature. Đã sửa tràn ngang của header FE2 và thanh filter công thức trên mobile. Chi tiết trong `docs/ui-foundation.md`.
- Backend: luôn dùng Gemini provider, xóa mock answer service và endpoint mock AI; các catalog/seeder chỉ được biên dịch trong test project. Không thay Auth hoặc quy trình duyệt thật.

## Kiểm tra đã chạy

| Kiểm tra | Kết quả / phạm vi |
|---|---|
| `npm run lint` | Đạt; không còn lint warning sau lượt sửa cuối |
| `npm run build` | Đạt TypeScript + Vite; còn cảnh báo kích thước bundle của Vite |
| `git diff --check` | Đạt; Git chỉ nhắc chuyển LF/CRLF ở một số file |
| Backend solution build | Đạt, 0 warning / 0 error với `dotnet build backend/Backend.sln -c Release --no-restore -m:1 -p:MSBuildEnableWorkloadResolver=false` |
| Domain tests hiện có | 79 passed, 0 failed; chạy ngoài sandbox để testhost kết nối loopback |
| Browser regression bổ sung | 39/39 đạt qua `.local/phase1-browser-check.mjs`; gồm fixture UI riêng, 21 route ở 390/1366/1920px và mở danh sách/chi tiết bài viết bằng API thật, không ghi DB |
| API local sau ngừng seed | PublicRecipes=1, PublicCategories=1; không còn Demo trong hai danh sách public |

Browser regression kiểm tra Recipe/Video/Restaurant/Article ở 1366px và 390px: API trống/lỗi, không sinh card giả, cùng font và không tràn ngang. Có kiểm tra thiếu dietary assessment/dinh dưỡng, thiếu ảnh/liên hệ, Home không còn chat minh họa, lỗi Pantry, font Admin và không còn biểu đồ tăng trưởng giả. Không có lỗi JavaScript chưa được xử lý trong các tình huống này. Đây là kiểm thử UI có kiểm soát, không thay cho nghiệm thu luồng ghi dữ liệu thật ở các phase tiếp theo.

Sau review của người dùng, Phase 1 được mở lại để sửa crash bài viết do API cũ thiếu `dietaryTypes`/`relatedArticles`. Đã kiểm tra cả response cũ có bài viết lẫn danh sách và chi tiết thật từ backend local; không chỉ kiểm tra danh sách rỗng như lượt đầu. Dùng font sans-serif FE1 cho tiêu đề, weight 800; card title 18px/700, breadcrumb 13px/500, badge 12px/600. Component PageHeading/Breadcrumb/Badge và shared Input/Select thay phần markup riêng ở các trang public chính; kiểm tra computed styles/card có dữ liệu ở cả desktop/mobile. Typography của AI/Scan chỉ đổi giao diện header, giữ nguyên state và request; luồng AI/Scan đang tạm hoãn theo người dùng.

Bổ sung theo review về độ rộng: nội dung bên dưới header dùng chung `ui-page-container`, tối đa 1240px, padding 24px desktop / 16px mobile; gồm home, list/detail, editor, profile, pantry, thực đơn và vỏ trang auth. Giữ nguyên thanh header trong lượt sửa độ rộng này. Admin giữ layout chung riêng có sidebar. Breadcrumb “Trang chủ › Thực đơn” có ở trang khám phá, thực đơn đã lưu và trang tạo/chi tiết; nút Trang chủ điều hướng về home. Chi tiết video không còn tự gán Vegan khi thiếu dữ liệu chế độ ăn.

Lượt kiểm tra cuối: 63 lần mở trang (21 route × 3 cỡ màn hình) xác nhận chiều rộng/lề bằng computed styles, không tràn ngang; kiểm tra click breadcrumb thực đơn về home. Đã xem ảnh chụp desktop/mobile để review bố cục. Lint, build FE và `git diff --check` đều đạt sau chỉnh sửa cuối; Vite còn cảnh báo bundle lớn hơn 500 kB. Những kiểm tra này xác nhận nền tảng giao diện, chưa nghiệm thu CRUD, upload, favorite, PDF hay luồng AI/Scan của các phase sau.

Lệnh backend mặc định bị lỗi ở bước restore/build song song trong môi trường hiện tại. Lệnh một worker dùng package đã restore ở trên đã biên dịch thành công toàn solution; không chỉnh SDK trên máy.

## Dữ liệu DB được bảo toàn

Đã backup `VegetarianSupport` tại `.local/db-backups/VegetarianSupport_phase1_A78CD1E7-7D15-4BCD-BB05-8DB491D9D003.bak` trước khi thay đổi.

Chỉ chuyển `IsActive=false` cho bản ghi thỏa cả namespace seed `20000000-*` và nhãn `[Demo]`: 32 recipes, 36 ingredients, 8 categories. Đã xác minh số Demo active của ba bảng đều bằng 0. Nhà hàng và bản ghi thật không bị thay đổi.

**Chưa xóa vật lý các seed này:** có 21 MealPlanMeals trong thực đơn đã lưu đang tham chiếu recipe demo. Giữ lịch sử/snapshot, không tự xóa thực đơn của tài khoản. Phải có quyết định của người dùng nếu muốn xóa cả lịch sử này; không đổi tên seed thành dữ liệu thật.

## Audit và việc để đúng phase

| Module | Trạng thái sau Phase 1 | Phần còn lại |
|---|---|---|
| Auth | Chỉ đồng bộ class vỏ layout, giữ nguyên form và logic | Smoke test thật cuối dự án, theo yêu cầu không làm lại |
| Profile / AI / Scan | Có API; giữ các diff từ lượt trước | Phase 2: xác minh dữ liệu profile, key/provider, OCR và sửa nguyên liệu rồi đánh giá lại |
| Recipes | Hết mock fallback; đã kiểm tra UI trống/lỗi | Phase 3: lọc/paging từ API, nhiều dietary assessments, favorite thật |
| Articles | Có diff dietary types từ trước Phase 1 | Phase 3: review contract, migration, lưu/lọc và phiên bản duyệt |
| Videos | Hết mock và suy đoán diet từ tên | Phase 3: dietary types backend còn thiếu, upload, gửi duyệt và trạng thái |
| Restaurants | Dữ liệu public từ API, không có ghim/thông tin giả | Phase 3: kiểm tra thực tế khoảng cách, profile region, nhiều diet và trạng thái favorite |
| Pantry / Meal Plan / Favorites | Đã bỏ fallback giả phát hiện trong audit | Phase 4: CRUD thật, substitution, shopping list/PDF, đồng bộ favorite và xử lý dữ liệu lịch sử seed |
| Admin / Comments | Trang hiện hành dùng API; xóa dashboard demo cũ | Phase 4: dashboard UI/UX, đồng bộ table/form/modal, làm rõ danh mục |
| Shared UI | Đã đặt token/font và shared components | Phase 4: áp dụng thống nhất toàn bộ page layout, card và CSS cũ |

Migration Articles `20261016143000_AddArticleDietaryTypes` là thay đổi có trước lượt này, đã compile nhưng chưa áp dụng DB thật và chưa nghiệm thu nghiệp vụ. Không đánh dấu các diff đó là đã hoàn tất. Backend đang chạy có thể vẫn dùng binary cũ; cần review/apply migration tương ứng trước khi thay phiên bản API ở Phase 3.

Không commit trong lượt này. Ghi chú ownership nằm trong `docs/cross-team-change-notes.md`. Phase 2 chỉ bắt đầu khi người dùng xác nhận.
