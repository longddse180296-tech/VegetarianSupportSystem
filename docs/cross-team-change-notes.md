# Ghi chú thay đổi liên module — 16/10/2026

Các thay đổi này thực hiện theo đánh giá dự án: loại ăn chay phải nhất quán giữa nội dung, công thức, nhà hàng, hồ sơ, AI và scan.

| Phạm vi chủ sở hữu | Thay đổi cần review |
| --- | --- |
| FE 1 / BE 1 — Articles | Bài viết có `dietaryTypes`, người viết chọn được nhiều kiểu ăn chay, public list/detail hiển thị và lọc được. Migration `20261016143000_AddArticleDietaryTypes` tạo bảng liên kết cho nháp và phiên bản đã gửi. |
| BE 3 — AI chat | Context gửi cho Gemini bổ sung thực phẩm cần tránh đã khai báo, bên cạnh chế độ ăn và dị ứng. |
| FE 1 — Profile | Nhãn `Khu vực ẩm thực` đổi thành `Khu vực tìm nhà hàng`; dữ liệu vẫn dùng trường API `restaurantArea`. |
| FE 2 / BE 2 — Restaurants | Adapter public nhận enum kiểu ăn chay dạng chuỗi từ backend, không còn quy về nhãn sai. Vị trí trình duyệt gửi đủ tọa độ khi lọc khoảng cách. |
| FE 2 / BE 3 — Food scan | Bước xác nhận nêu rõ AI/OCR chỉ gợi ý và người dùng có thể sửa, xóa, thêm hoặc xác nhận nguyên liệu trước khi đánh giá. |
| FE 1 — Admin | Menu gọi rõ `Danh mục công thức`; Category Core Data chỉ dùng phân loại công thức như món chính, món nước, thức uống, tráng miệng. |

Không thay đổi role, không thêm chức năng ngoài MVP. Sau khi merge, áp dụng migration trước khi deploy API mới.

## Phase 1 — dữ liệu thật và nền tảng UI

- FE1 + FE2/shared: một font qua `--font-sans`, token control/card/modal, shared controls; sửa header mobile gây tràn ngang ở FE2. Xem `docs/ui-foundation.md`.
- FE2/Recipes + Videos: xóa mảng mock/fallback, ảnh/tác giả/dinh dưỡng/thời lượng giả; không tự suy luận Vegan từ tên; API list lỗi được trả về cho UI hiển thị.
- FE2/Pantry: bỏ lưu/xóa/thay thế thành công giả khi API lỗi, bỏ phân loại và nguyên liệu thay thế tự sinh ở FE; dùng compatibility và substitution candidates của backend. Macro thiếu giữ trạng thái chưa có.
- FE1/Admin + Meal Plans: xóa biểu đồ và dashboard cũ chứa số liệu cứng; ShoppingListModal không còn nguyên liệu mặc định giả.
- BE3: bỏ MockAiChatAnswerService, cấu hình chọn mock và endpoint ghi mock-ai-result; cập nhật contract. Không thay luồng kiểm duyệt thật.
- BE2: chuyển CoreData/Demo seed từ Infrastructure sang `backend/tests/IntegrationTests/Fixtures`; API từ chối lệnh seed cũ. Fixture chỉ thuộc assembly kiểm thử; InitialAdmin vẫn giữ nguyên.
- DB local VegetarianSupport: đã backup trước khi chuyển IsActive=false cho đúng namespace seed `20000000-*` đồng thời có nhãn `[Demo]`: 32 recipes, 36 ingredients, 8 categories. Không xóa snapshot của người dùng; 21 MealPlanMeals tham chiếu recipe demo còn được giữ để chủ dữ liệu quyết định xử lý. Dữ liệu thật ngoài bộ seed không bị thay đổi.

Migration dietary types của Articles là diff từ trước Phase 1, đã compile nhưng chưa áp dụng vào DB thật trong lượt này; phải nghiệm thu ở Phase 3.

## Bổ sung Phase 1 sau review của người dùng

- FE1 + FE2: thống nhất khung nội dung `ui-page-container` (1240px, padding 24px desktop / 16px mobile), gồm các màn hình danh sách, chi tiết, editor, profile, thực đơn, pantry, home và vỏ auth. Footer dùng cùng token; header giữ nguyên theo yêu cầu mới nhất. AI/Scan chỉ đổi class khung nội dung, không đổi luồng hay gọi Gemini. Admin giữ layout chung riêng có sidebar.
- FE1/Meal Plans: thêm breadcrumb chung cho khám phá, thực đơn đã lưu, tạo và chi tiết; giữ breadcrumb trong trạng thái loading. FE2/Videos: bỏ nhãn Vegan mặc định tại trang chi tiết khi API thiếu `dietType`.

- FE1/Articles: sửa crash khi response API cũ không có `dietaryTypes` hoặc `relatedArticles`; giữ tương thích API đang chạy, không yêu cầu migration để chỉ xem bài viết cũ.
- FE1 + FE2/shared: bổ sung PageHeading/Breadcrumb/Badge, đồng bộ cỡ chữ và độ đậm tiêu đề/header/card các trang public chính; theo lựa chọn cuối của người dùng dùng sans-serif FE1 và tiêu đề đậm, không dùng serif.
- AI/Scan: chỉ thay markup header bằng component chung; không thay state, handlers, request, provider hoặc luồng nghiệp vụ trong lượt bổ sung này. Người dùng yêu cầu tạm hoãn luồng AI/Scan đến khi có Gemini key.
