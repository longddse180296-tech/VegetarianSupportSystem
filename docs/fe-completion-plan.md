# Kế hoạch hoàn thiện FE theo 5 phase

Mục tiêu: hoàn thiện toàn bộ phạm vi FE 1 và FE 2 trước ngày 17/10/2026. Không làm lại module đã đạt; Auth chỉ smoke test cuối. Backend chỉ thay đổi khi thiếu dữ liệu, contract hoặc migration cần thiết để FE chạy đúng API thật.

Quy trình bắt buộc theo xác nhận của người dùng: chỉ làm một phase tại một thời điểm; tự test và review cuối phase, báo cáo rồi dừng chờ xác nhận trước phase kế tiếp. Không coi việc xác nhận phase trước là cho phép tự chạy tất cả các phase còn lại.

Trạng thái ngày 16/10/2026: Phase 1 đã hoàn tất phần source và kiểm tra, chờ người dùng xác nhận; báo cáo trong `docs/phase-1-review.md` ghi rõ dữ liệu lịch sử seed còn được giữ. Phase 2–5 chưa bắt đầu. Một số diff Articles/Profile/AI/Scan có sẵn từ lượt làm cũ; cần review ở đúng phase, không tính là đã nghiệm thu.

Đã hoàn tất bổ sung Phase 1 theo review: sửa trắng trang bài viết, font sans-serif FE1/tiêu đề đậm, khung nội dung chung bên dưới header và breadcrumb thực đơn. Header giữ nguyên trong lượt căn độ rộng. Kiểm tra cuối: lint/build FE đạt, 39/39 browser checks đạt, gồm 21 route ở 3 cỡ màn hình. Luồng AI/Scan tiếp tục tạm hoãn do chưa có Gemini key.

## Phase 1 — Nền tảng dữ liệu thật và UI chung

- Lập bảng audit từng màn hình: đạt, còn mock, lỗi contract, lỗi UI hoặc thiếu API.
- Xóa mock/fallback có thể hiển thị cho người dùng ở FE; thay bằng loading, empty và error state.
- Tắt/bỏ đường chạy demo hoặc phản hồi AI mock của runtime backend; fixture test không dùng ở runtime được giữ riêng.
- Chuẩn hóa font tiếng Việt, typography, màu, spacing, radius, shadow, focus state và shared components.
- Không sửa Auth ngoài kiểm tra cuối.

**Gate:** `npm run lint`, `npm run build` đạt; không màn hình public nào tự hiển thị công thức/video/nhà hàng giả khi API rỗng hoặc lỗi.

## Phase 2 — Hồ sơ, AI Chat và Food Scan

Điều chỉnh theo người dùng: chưa có Gemini key nên tạm hoãn thay đổi luồng AI Chat và Food Scan. Chỉ tiếp tục khi có yêu cầu xác nhận mới. Các thay đổi typography/header thuần giao diện không làm thay đổi luồng AI/Scan.

- Profile dùng nhãn “Khu vực tìm nhà hàng”, lưu và đọc profile thật.
- Chuẩn hóa nhãn bốn chế độ ăn: Vegan, LactoVegetarian, OvoVegetarian, LactoOvoVegetarian.
- AI Chat hiển thị và gửi đúng profile; không suy diễn chế độ ăn, BMI, dị ứng hoặc mục tiêu chưa khai báo.
- Food Scan cho người dùng sửa OCR, thêm/xóa/sửa nguyên liệu và chọn lại phân loại trước khi đánh giá.
- Backend chỉ bổ sung profile context hoặc endpoint xác nhận scan nếu audit chứng minh còn thiếu.

**Gate:** một User cập nhật profile, mở AI Chat và scan món; kết quả phản ánh thông tin đã lưu/xác nhận.

## Phase 3 — Nội dung, công thức, video và nhà hàng

- Recipes: filter/detail/favorite lấy dietary assessments thật, không gán Vegan mặc định.
- Articles: form chọn nhiều chế độ ăn, lưu/lọc/hiển thị badge; migration/API chỉ bổ sung phần dietary types còn thiếu.
- Videos: bỏ mock video, hoàn thiện upload/list/detail/trạng thái duyệt; thêm dietary types xuyên suốt nếu backend chưa lưu/trả dữ liệu này.
- Restaurants: lọc và badge đọc `dietaryTypes` từ API, dùng vị trí thật, chỉ hiện thông tin có trong DB.
- Admin Categories: làm rõ loại danh mục như món ăn, thức uống, tráng miệng khi contract có dữ liệu; bổ sung tối thiểu backend nếu thiếu trường phân loại.

**Gate:** tạo hoặc sửa dữ liệu thật qua Admin, dữ liệu xuất hiện đúng ở public list/detail/filter sau khi tải lại.

## Phase 4 — Pantry, Meal Plan, Favorites và Admin

- Pantry/Meal Plan chỉ dùng recipe/ingredient thật, xử lý danh sách trống, thay món, shopping list và PDF theo API.
- Favorites đồng bộ recipe/video/restaurant bằng API thật.
- Đồng bộ UI toàn bộ FE1/FE2 bằng shared components đã chốt ở Phase 1.
- Nâng cấp Admin Dashboard: KPI, hàng chờ, hoạt động gần đây, bảng và biểu đồ lấy số liệu API; không có số liệu minh họa.
- Hoàn thiện các trang quản trị recipe, ingredient, category, restaurant, article, video và comment theo quyền Admin.

**Gate:** User và Admin hoàn tất các luồng chính mà không có localStorage/mock ID/dữ liệu giả.

## Phase 5 — Tích hợp, kiểm thử và bàn giao

- Smoke test Guest/User/Admin, 401/403, loading/empty/error, upload, filter, phân trang và refresh dữ liệu.
- Rà soát bốn loại ăn chay ở Profile, AI, Scan, Recipes, Articles, Videos, Restaurants, Pantry và Meal Plan.
- Chạy `npm run lint`, `npm run build`; chạy backend build/migration khi SDK môi trường hoạt động.
- Cập nhật contract/migration chỉ cho BE gap thực tế và ghi ownership trong `docs/cross-team-change-notes.md`.
- Ghi checklist các lỗi môi trường không thuộc source, nếu có.

**Gate:** không còn mock runtime; mọi trang cần dữ liệu có API thật hoặc trạng thái trống/lỗi rõ ràng; toàn bộ build bắt buộc đạt.
