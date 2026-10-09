# Phân công 3 Backend cân bằng theo phần việc còn lại

Cập nhật 08/10/2026 theo yêu cầu chia đều công việc. Mốc rà soát: LTramCam tại 169874a. Bản này thay thế phân công trước; không đổi cấu trúc thư mục hoặc mở rộng MVP. API ghi là đề xuất phải chốt contract trước khi triển khai. Trạng thái dựa trên source, chưa xác nhận toàn bộ luồng end-to-end.

## 1. Phân chia tổng thể

| Người | Phạm vi | Điểm tương đối |
|---|---|---:|
| BE 1 | Auth, profile, members, dashboard, articles, comments/like/vote | 30 |
| BE 2 | Categories, ingredients, recipes, restaurants, favorites, pantry, meal plans/shopping/PDF | 32 |
| BE 3 | Videos/storage, moderation, AI chat, scan/OCR/history/Gemini | 29 |

Điểm là ước lượng lập kế hoạch cho phần còn lại, không phải giờ/ngày hoặc năng suất đã đo. Bao gồm API, DB, contract, tích hợp và test. BE 2 có nhiều module hơn vì core data đã có nền; BE 3 ít module nhưng AI/video/OCR phức tạp và bất định hơn. Rà lại điểm sau đợt đầu.

| Task | Điểm | Task | Điểm | Task | Điểm |
|---|---:|---|---:|---|---:|
| BE1-01 Auth | 3 | BE2-01 Recipes public | 3 | BE3-01 Videos/storage | 8 |
| BE1-02 Reset password | 5 | BE2-02 Categories | 2 | BE3-02 Moderation | 8 |
| BE1-03 Profile | 3 | BE2-03 Ingredients | 3 | BE3-03 AI chat | 5 |
| BE1-04 Members | 3 | BE2-04 Recipes Admin | 3 | BE3-04 Scan/OCR/history | 8 |
| BE1-05 Dashboard | 3 | BE2-05 Restaurants | 5 | | |
| BE1-06 Articles | 8 | BE2-06 Favorites/Home | 3 | | |
| BE1-07 Comments/interactions | 5 | BE2-07 Seed/tích hợp DB | 2 | | |
| | | BE2-08 Pantry | 3 | | |
| | | BE2-09 Meal plans/PDF | 8 | | |

## 2. BE 1 — Tài khoản và cộng đồng
### BE1-01. Hoàn thiện Auth và phiên đăng nhập

- Đã có đăng ký, đăng nhập, lấy tài khoản hiện tại, đăng xuất, JWT, hash mật khẩu, thu hồi token và kiểm tra tài khoản khóa.
- Rà request/response với FE: họ tên, email, xác nhận mật khẩu, role, thời hạn token, lỗi validation.
- Hoàn thiện hành vi ghi nhớ đăng nhập và hết phiên; không mặc định phải thêm refresh token nếu thiết kế phiên hiện tại đã đáp ứng.
- Kiểm thử token hết hạn, bị thu hồi, sai role, tài khoản khóa; không cho FE tự cấp quyền.
- API hiện có: `POST /api/auth/register`, `/login`, `/logout`; `GET /api/auth/me`.
- Nghiệm thu: đăng ký → đăng nhập → tải lại trang → truy cập tài nguyên → đăng xuất; token cũ không còn dùng được sau khi thu hồi.

### BE1-02. Quên và đặt lại mật khẩu qua email

- Hiện FE chỉ trả thành công giả; chưa có API/email backend.
- Làm yêu cầu khôi phục, token có hạn dùng và dùng một lần, gửi link email, xác nhận mật khẩu mới.
- Phản hồi yêu cầu không tiết lộ email có tồn tại; giới hạn yêu cầu; không ghi token/mật khẩu vào log.
- Chốt cách vô hiệu hóa phiên cũ sau reset và kiểm thử.
- API đề xuất: `POST /api/auth/forgot-password`, `POST /api/auth/reset-password`.
- FE 1 cần bổ sung trang nhập mật khẩu mới và thay thông báo giả bằng kết quả API.
- Nghiệm thu: nhận email thử nghiệm thật, reset được; link hết hạn/đã dùng bị từ chối.

### BE1-03. Hồ sơ và chỉ số cơ thể

- Đã có API hồ sơ, thông tin cá nhân, chế độ ăn, body, dị ứng và thực phẩm tránh; FE vẫn dùng localStorage/mock.
- Chốt mapping model FE/BE: tên, thông tin liên hệ, khu vực, tuổi/giới tính dùng cho tính toán, chiều cao, cân nặng, vận động, mục tiêu, chế độ ăn.
- CRUD từng dị ứng/thực phẩm tránh; validation dữ liệu và quyền sở hữu.
- BMI/TDEE tính ở backend theo công thức/ngưỡng thống nhất; FE hiển thị kết quả và ghi rõ ước tính tham khảo.
- Cung cấp DTO đọc hồ sơ cho chat, scan, thực đơn, tủ bếp; BE 3 lưu snapshot scan; BE 2 lưu snapshot thực đơn.
- API hiện có: `GET/PUT /api/profile/me`, `PUT .../personal`, `.../body`, `.../diet`; `POST/PUT/DELETE .../allergies`, `.../avoided-foods` theo controller hiện hành.
- Thống kê bài viết/tương tác trên profile do BE 1 cung cấp; BE 3 cung cấp thống kê video, FE 1 tích hợp; không tự tạo số liệu.
- Nghiệm thu: sửa hồ sơ → đăng nhập lại vẫn giữ; tài khoản A không đọc/sửa hồ sơ B; FE và BE không dùng hai công thức khác nhau.

### BE1-04. Admin thành viên

- Hoàn thiện API hiện có: list/filter/phân trang, chi tiết, khóa/mở khóa có lý do, lịch sử người thực hiện và thời gian.
- Rà thao tác đồng thời, trạng thái không hợp lệ và bảo vệ tài khoản quản trị theo quy tắc đã chốt.
- Chi tiết nội dung thành viên: BE 1 cung cấp bài viết; BE 3 cung cấp video của thành viên để BE 1 tích hợp.
- API hiện có: `/api/admin/members`, `/{id}`, `/{id}/status-history`, `POST /{id}/lock`, `POST /{id}/unlock`.
- Nghiệm thu: User bị chặn API Admin; khóa xong token của tài khoản bị khóa không truy cập được tài nguyên bảo vệ; có lịch sử thật.

### BE1-05. Dashboard và tích hợp quyền

- Dashboard hiện mới dùng số liệu thành viên thật. Bổ sung số liệu nội dung, hàng đợi duyệt và hoạt động gần đây theo dữ liệu thực có.
- BE 2 cung cấp số liệu core data; BE 3 cung cấp video/kiểm duyệt; bài viết/bình luận thuộc BE 1. BE 1 sở hữu DTO và endpoint tổng hợp trong Administration.
- API đề xuất: `GET /api/admin/dashboard` với khoảng thời gian nếu biểu đồ thật cần dùng.
- Không trả phần trăm tăng trưởng, trạng thái hệ thống hoặc biểu đồ giả khi chưa có nguồn đo.
- Chủ trì helper/policy lấy user ID, role, ownership; BE 2/3 vẫn tự áp dụng kiểm tra ở từng endpoint của mình.
- Nghiệm thu: thêm dữ liệu thật làm số đếm thay đổi; không trả dữ liệu dashboard cho Guest/User.

### BE1-06. Bài viết public và bài viết của tôi

- Làm entity/API lưu nháp, sửa, xóa theo trạng thái/quyền, danh mục, tiêu đề, nội dung, ảnh và gửi duyệt.
- Public: list/search/filter/phân trang, chi tiết, bài liên quan; chỉ trả phiên bản Published.
- Owner: list/filter trạng thái, chi tiết, phản hồi Admin, sửa/gửi lại; phiên bản đang công khai giữ nguyên khi bản sửa chưa được duyệt.
- API đề xuất: `/api/articles`, `/api/articles/{id}`, `/api/me/articles`; các thao tác nháp và gửi duyệt chốt cùng module Moderation.
- FE articles và Admin articles hiện mock; thay bằng dữ liệu và trạng thái thực, không cho nút xuất bản bỏ qua kiểm duyệt.
- Nghiệm thu: nháp → gửi → AI → Admin duyệt → public; tác giả khác không sửa/xóa được.

### BE1-07. Bình luận và tương tác

- Bình luận/phản hồi, sửa/xóa của mình, danh sách của tôi, phân trang; chỉ gắn vào nội dung hợp lệ và xem được.
- Hữu ích/like theo đúng MVP từng loại nội dung; chống đếm trùng cho cùng user, bỏ vote cập nhật số đếm.
- Admin tìm/lọc/xem/ẩn hoặc gỡ theo trạng thái đã chốt; không bắt buộc AI cho bình luận.
- API đề xuất: `/api/comments`, `/api/comments/{id}`, `/api/me/comments`, `/api/admin/comments`; contract riêng cho vote/like và nội dung cha.
- Chia sẻ dùng URL, không cần endpoint gửi tin nhắn/email. Favorite video thuộc BE 2.
- Nghiệm thu: quyền owner/Admin đúng; phản hồi giữ quan hệ khi bình luận cha bị gỡ; số liệu thay đổi thật sau tương tác.


## 3. BE 2 — Dữ liệu thực phẩm và kế hoạch ăn uống

### BE2-01. Chốt contract và nối công thức public

- Backend đã có list/detail, tìm kiếm, lọc, phân trang; frontend đang trộn gọi API và mock fallback.
- Sửa thống nhất phân trang: BE trả `pageNumber/pageSize/totalCount`, FE đang chờ `pagination`.
- Thống nhất `categoryName/categoryId`, `dietaryAssessments`, enum chế độ ăn, dinh dưỡng/khẩu phần và dữ liệu thiếu.
- Chốt filter tên/nguyên liệu, danh mục, chế độ ăn, thời gian, calo, sắp xếp; FE mapping query theo contract.
- Chi tiết gồm nguyên liệu/định lượng, khẩu phần, cách nấu, thời gian, ảnh, dinh dưỡng; liên kết bài viết phối hợp BE 1, video phối hợp BE 3, nhà hàng do BE 2.
- API hiện có: `GET /api/recipes`, `GET /api/recipes/{id}`.
- Nghiệm thu: dữ liệu Admin tạo xuất hiện ở public khi hoạt động; tìm/lọc/phân trang chạy trên DB; lỗi API không bị che bằng dữ liệu demo.

### BE2-02. Danh mục Admin

- Hoàn thiện list/detail/create/update/deactivate đang có, phạm vi áp dụng danh mục và nội dung liên kết.
- Phối hợp BE 1 chốt danh mục bài viết và BE 3 chốt danh mục video; không mặc định mọi loại nội dung dùng cùng một danh mục.
- Giữ dữ liệu đang được tham chiếu, không xóa cứng gây hỏng nội dung/kế hoạch.
- API hiện có: `/api/categories`, `/api/admin/categories`; ngừng sử dụng bằng `PATCH /api/admin/categories/{id}/deactivate`.
- FE Admin categories đang mock: bàn giao DTO và cùng FE 1 thay mock.
- Nghiệm thu: tạo/sửa/ngừng dùng lưu DB; quan hệ tham chiếu vẫn hợp lệ.

### BE2-03. Nguyên liệu Admin

- Hoàn thiện tên/aliases, nguồn gốc thực vật/động vật/chưa rõ, trứng/sữa/mật ong/thành phần động vật khác, dị nguyên, đơn vị, dinh dưỡng, nguồn dữ liệu.
- Chốt cách biểu diễn dị nguyên và tên tương đương để khớp hồ sơ BE 1 và quy tắc BE 3; tránh chỉ đối chiếu chuỗi tùy ý.
- Phân loại chế độ ăn bằng Domain rule và bằng chứng; không lấy nhãn safe/danger demo của FE làm kết luận sức khỏe.
- API hiện có: `/api/ingredients`, `/api/admin/ingredients`, `POST /api/admin/ingredients/{id}/deactivate`.
- FE hiện bảng mock, form chỉ console.log; API helper DELETE không khớp thao tác deactivate hiện có.
- Nghiệm thu: cập nhật bằng chứng nguyên liệu làm phân loại công thức thay đổi đúng; chưa rõ nguồn gốc vẫn giữ chưa đủ thông tin.

### BE2-04. Công thức Admin và ảnh

- Hoàn thiện tạo/sửa/xem/ngừng sử dụng, liên kết ingredient ID và định lượng, khẩu phần, thời gian, cách nấu, dinh dưỡng.
- BE 2 thống nhất quy đổi đơn vị và cơ sở dinh dưỡng mỗi khẩu phần trong Recipes/MealPlans để tính thực đơn/danh sách mua sắm nhất quán.
- Bổ sung lưu ảnh nếu chưa có, dùng storage adapter chung do BE 3 chủ trì; BE 2 sở hữu endpoint/ràng buộc ảnh công thức.
- API hiện có: `/api/admin/recipes`, `POST /api/admin/recipes/{id}/deactivate`.
- Không dùng `/publish` hoặc DELETE từ helper FE khi BE chưa có contract tương ứng; công thức Admin không tự bị đưa vào workflow bài viết/video.
- Nghiệm thu: lưu từ form thật → đọc lại đủ dữ liệu; công thức ngừng dùng không được chọn mới cho thực đơn.

### BE2-05. Nhà hàng public/Admin — làm mới

- Entity, migration, repository và API: tên, địa chỉ/khu vực, tọa độ, liên hệ, giờ mở cửa, khoảng giá, tiện ích, chế độ ăn khai báo, ảnh, món liên quan, trạng thái, nguồn/thời điểm cập nhật.
- Public: tìm tên/khu vực, lọc chế độ ăn, tìm theo tọa độ/khoảng cách, sắp xếp/phân trang, chi tiết.
- FE xin quyền vị trí; BE nhận tọa độ khi được cung cấp và trả khoảng cách theo quy ước đã chốt.
- Admin: list/detail/create/update/deactivate. Dữ liệu tọa độ phục vụ bản đồ và link chỉ đường; không thêm đặt bàn/thanh toán/đánh giá.
- API đề xuất: `GET /api/restaurants`, `GET /api/restaurants/{id}`; CRUD/ngừng dùng dưới `/api/admin/restaurants`.
- Nghiệm thu: tìm/lọc dữ liệu thật; nhà hàng ngừng dùng không xuất hiện ở public; không xem nhãn chế độ ăn là bảo đảm mọi món.

### BE2-06. Yêu thích và dữ liệu trang chủ

- Lưu/bỏ lưu/list cho công thức, video, nhà hàng; kiểm tra tài nguyên tồn tại và khả năng hiển thị, quyền sở hữu, chống lưu trùng.
- Video do BE 3 cung cấp thông tin; lưu yêu thích do BE 2 sở hữu. Like/vote không phải favorite.
- API đề xuất: `GET/POST /api/favorites`, `DELETE /api/favorites/{id}`; chốt targetType/targetId và trạng thái đã lưu trong DTO.
- Cấp dữ liệu công thức/nhà hàng cho trang chủ từ API thật; BE 1 cấp bài viết, BE 3 cấp video. Không cần thêm Home API nếu các list hiện có đã đủ.
- Nghiệm thu: hai tài khoản có danh sách riêng; lưu/bỏ lưu tải lại vẫn đúng; không làm lộ nội dung chưa xuất bản.

### BE2-07. Dữ liệu dùng chung và migration

- Cung cấp query công thức đang hoạt động, thành phần, dị nguyên, dinh dưỡng, đơn vị cho chat/scan BE 3 và pantry/meal plan BE 2; không để meal plan lấy mock ID.
- Seed mẫu có nhãn, đủ tình huống đủ món/thiếu món, nguyên liệu chưa rõ, trứng/sữa, dị nguyên; không giả dữ liệu vận hành.
- Mỗi BE tự làm migration, model/config và test của module mình. BE 2 chỉ điều phối merge snapshot và kiểm tra DB tích hợp.
- Kiểm thử DB mới và nâng cấp DB cũ; chạy chương trình IntegrationTests theo CORE_DATA.md, không coi `dotnet test` đã chạy bộ SQL này.

### BE2-08. Tủ bếp

- Làm entity/API CRUD nguyên liệu của User, lượng/đơn vị nếu biết; dùng danh mục nguyên liệu BE 2 khi khớp, giữ trạng thái chưa xác định khi chưa khớp.
- Đánh giá phù hợp chế độ ăn, cảnh báo dị nguyên riêng, gợi ý thay thế; chỉ thay khi User chọn.
- Gợi ý công thức đang hoạt động, trả phần có sẵn/cần mua, cách tính độ khớp theo dữ liệu và đơn vị quy đổi đã chốt.
- API đề xuất: `/api/pantry/items`, `/api/pantry/recipe-suggestions`, endpoint gợi ý thay thế chốt trong contract.
- Nghiệm thu: dữ liệu tách theo tài khoản; thay lượng cập nhật gợi ý; không đánh giá độ tươi/an toàn từ ảnh.

### BE2-09. Thực đơn và danh sách mua sắm/PDF

- Bao phủ các trang FE: GeneralMealPlanPage, RecommendedMealPlanPage, PersonalizationSetupPage, MyMealPlanPage, MealPlanDetailPage.
- Nhận hồ sơ/body từ BE 1, chế độ ăn/dị ứng/thực phẩm tránh, mục tiêu, thời gian nấu, sở thích, pantry.
- Lập 7 ngày × 3 bữa chính = 21 vị trí; chỉ dùng recipe ID đang hoạt động của BE 2.
- Lọc điều kiện bắt buộc trước khi xếp hạng; thiếu dữ liệu/món phù hợp phải báo rõ, không nới dị ứng/chế độ ăn để đủ bữa.
- Xem theo ngày/tuần, chi tiết, đổi món, tạo lại, lưu, danh sách kế hoạch đã lưu, áp dụng tuần mới.
- Quy định khẩu phần và tính lại calo/protein/carbs/fat từ cùng dữ liệu; lưu snapshot hồ sơ và dữ liệu cần tái hiện kế hoạch cũ.
- Tổng hợp nguyên liệu theo đơn vị tương thích; đánh dấu đã có/đã mua; đổi món cập nhật shopping list.
- Xuất PDF thực đơn/danh sách mua sắm thành file thật, không chỉ trả tên file giả như FE hiện tại.
- API đề xuất: `POST /api/meal-plans/generate`, `GET/POST /api/meal-plans`, `GET /api/meal-plans/{id}`; các thao tác đổi món/tạo lại/áp dụng/shopping-list/PDF chốt theo resource trong contract.
- Guest chỉ xem phần giới thiệu/mẫu ghi rõ, muốn tạo/lưu cá nhân phải đăng nhập; không thêm bữa phụ, nhắc ăn hoặc gửi Zalo.
- Nghiệm thu: đủ 21 vị trí khi dữ liệu cho phép; kiểm tra mọi món với điều kiện bắt buộc; đổi món cập nhật tổng và mua sắm; PDF tải được/mở được; không đọc kế hoạch người khác.


## 4. BE 3 — Video, kiểm duyệt và AI

### BE3-01. Video và storage

- Làm danh sách/chi tiết public; upload, nháp, sửa metadata, ảnh đại diện, danh mục, gửi duyệt, video của tôi, thống kê view/tương tác thực.
- Quản lý trạng thái upload/xử lý/lỗi/thử lại; kiểm soát loại tệp, dung lượng, đường dẫn và quyền đọc nội dung riêng tư.
- Chủ trì storage abstraction/implementation tại Infrastructure/Storage; BE 1 hỗ trợ quyền, BE 2 tái sử dụng cho ảnh công thức/nhà hàng.
- API đề xuất: `/api/videos`, `/api/videos/{id}`, `/api/me/videos`, endpoint upload được chốt riêng theo lưu trữ đã chọn.
- Không thêm theo dõi kênh hay chức năng tóm tắt video thành công thức.
- Nghiệm thu: video chưa duyệt không truy cập công khai qua URL media; upload lỗi không tạo bản Published; có luồng xem lại của owner.

### BE3-02. Kiểm duyệt bài viết/video

- Đã có submission/version, trạng thái AI/Admin, queue, decisions và repository; chưa có pipeline AI hoàn chỉnh để nối toàn luồng.
- Nối bài viết/video thật vào submission; tự chạy AI sau gửi duyệt, có retry và xử lý thất bại, tránh xử lý nhầm phiên bản cũ.
- Trả loại cờ, mức ưu tiên, lý do, bằng chứng và phạm vi đã phân tích. Video phải ghi rõ phần âm thanh/khung hình chưa kiểm tra.
- Admin duyệt, yêu cầu sửa, từ chối, gỡ; lưu actor/thời gian/lý do/phiên bản. AI không tự quyết định xuất bản.
- Giữ API hiện có: `/api/moderation/submissions`, `/{id}/retry-ai`; `/api/admin/moderation/submissions/queue`, `/{id}/decisions`.
- Helper FE `/pending`, `/approve`, `/revision`, `/reject` cần sửa theo contract; không thêm endpoint trùng chỉ để khớp mock.
- Nghiệm thu: AI lỗi không thành Passed; kết quả Partial hiển thị phạm vi; bản sửa chưa duyệt không thay bản Published; không dùng mock-ai-result trong luồng thật.

### BE3-03. Chat AI Guest/User

- Nối FE chat với API conversation/message đang có; loại bỏ hồ sơ/lịch sử/câu trả lời tĩnh khỏi luồng thật.
- Guest có phiên, số lượt còn lại, kiểm soát hạn mức phía server; hết lượt dẫn đăng nhập.
- User tạo hội thoại, list/history/phân trang và quyền sở hữu; tham chiếu hồ sơ từ BE 1 theo phạm vi đã công bố.
- Gợi ý công thức dùng ID thật từ BE 2; chuyển sang meal plan khi muốn lập kế hoạch, không coi câu trả lời chat là thực đơn đã lưu.
- Xử lý timeout, quota, lỗi Gemini, giới hạn đầu vào và log không chứa dữ liệu nhạy cảm không cần thiết.
- API hiện có: `/api/ai-chat/guest/session`, `/guest/messages`, `/conversations`, `/conversations/{id}/messages`.
- Nghiệm thu: Guest/User có hành vi khác nhau; không đọc lịch sử người khác; Gemini gọi từ BE; không hiện dữ liệu hồ sơ giả cho Guest.

### BE3-04. Scan món ăn và nhãn thành phần

- Đã có `POST /api/food-scans/dish-image` và `/evaluate`; hoàn thiện lưu kết quả, ownership, hồ sơ tham chiếu và lịch sử.
- Ảnh món: gợi ý nguyên liệu nhìn thấy → User sửa/xác nhận → câu hỏi nước dùng/gia vị có lựa chọn Không biết → đánh giá.
- Làm mới OCR nhãn, đánh dấu mờ/thiếu, cho User sửa text trước đánh giá. Chốt endpoint OCR/history trong contract trước khi code.
- Dùng rule/ingredient evidence BE 2; phân loại 4 chế độ với ba kết quả: phù hợp theo dữ liệu, không phù hợp, chưa đủ thông tin.
- Dị ứng là cảnh báo riêng; lưu nguồn dữ kiện, câu trả lời chưa rõ, thời điểm, phiên bản và snapshot hồ sơ.
- Tệp JPG/PNG/WEBP tối đa 10 MB theo MVP; Guest không upload/xử lý; không tự khẳng định thành phần ẩn từ ảnh.
- FE runScan hiện chỉ dùng timer; thay bằng kết quả API thật và các bước xác nhận.
- Nghiệm thu: nước dùng chưa rõ → chưa đủ thông tin; nước mắm cá được xác nhận → không phù hợp; OCR mờ không tự coi là nguyên liệu thực vật; lịch sử không đổi khi sửa profile.

## 5. Ranh giới sở hữu và folder

- BE 1: Application/Features/Auth, Profiles, Administration, Articles, Comments; Infrastructure/Identity và Email.
- BE 2: Application/Features/Categories, Ingredients, Recipes, Restaurants, Favorites, Pantry, MealPlans; Infrastructure/Documents.
- BE 3: Application/Features/Videos, Moderation, AiChat, FoodScanning; Infrastructure/AI/Gemini, Storage, BackgroundJobs khi có xử lý thật.
- BE 1 sở hữu article draft/public/version. BE 3 sở hữu AI flag/quyết định Admin. Hai bên chốt interface content ID/version → submission → quyết định, cập nhật đúng phiên bản và không áp dụng lại quyết định cũ.
- Like/vote thuộc BE 1; favorites recipe/video/restaurant thuộc BE 2; BE 3 cung cấp điều kiện hiển thị/tương tác video. Không tạo hai bảng cùng mục đích.
- BE 3 làm storage adapter chung; mỗi BE tự làm endpoint/quyền/validation media của module mình.
- BE 3 làm Gemini client chung. BE 2 tự làm thuật toán thực đơn và lọc điều kiện bắt buộc; nếu cần giải thích AI thì gọi interface Application, không chuyển cả MealPlans sang BE 3.
- BE 1 cung cấp profile/BMI/TDEE. BE 2 lưu snapshot kế hoạch; BE 3 lưu snapshot scan. Mỗi BE tự kiểm tra quyền endpoint mình.
- Mỗi BE làm controller/service/repository/entity/config/contract/migration/tests của module mình. Chốt thứ tự merge các file DI, AppDbContext và snapshot; không đẩy toàn bộ việc DB cho BE 2.

## 6. Các đợt bàn giao song song

| Đợt | BE 1 | BE 2 | BE 3 |
|---|---|---|---|
| 1 — Contract/phần có sẵn | Auth/profile/members, reset email và article draft | Sửa recipe contract, core data Admin, đơn vị/dinh dưỡng | Chat integration; chốt storage/submission/scan contract |
| 2 — Module mới | Articles public/owner, comments/interactions | Restaurants/favorites, pantry | Video/upload, pipeline moderation/quyết định |
| 3 — Hoàn thiện MVP | Dashboard, reset email, article moderation | Meal plans 7×3, đổi/lưu/áp dụng, shopping/PDF | Scan/OCR/history, hồ sơ chat, retry/error AI |
| 4 — Nghiệm thu | Auth/quyền/article/comments | SQL/core data/pantry/meal plan/PDF | Media/moderation/Gemini/scan/chat |

Chốt interface profile, recipe query, moderation decision và storage ngay từ đầu để không phải đợi nhau. Tách PR theo luồng. Sau đợt đầu ước lượng lại phần còn lại; người nhẹ hơn nhận ticket hỗ trợ test/tích hợp có phạm vi rõ, chủ module vẫn duyệt.

## 7. Phối hợp Frontend

| Backend | FE 1 | FE 2 |
|---|---|---|
| BE 1 | Auth/profile/articles, Admin members/dashboard/articles/comments | Comment/like trong video |
| BE 2 | Admin categories/ingredients/recipes/restaurants; meal plans | Recipes/restaurants/favorites/pantry; dữ liệu trang chủ |
| BE 3 | Admin videos/moderation, trạng thái duyệt article | Videos/chat/scan; dữ liệu video trang chủ |

FE 1 giữ toàn bộ admin theo AGENTS.md. FE phụ trách thay mock, mapping DTO, nối lưu thật, xử lý loading/empty/error/401/403. API mock FE không tự trở thành contract chuẩn.

Không thêm thông báo, lịch ngày lễ, payment, đặt bàn, đánh giá nhà hàng, theo dõi kênh, barcode/mobile, newsletter. Không thêm article favorites chỉ vì mock có nút lưu. Không coi safe/danger là bảo đảm dị ứng hay verified là chứng nhận nhà hàng chay.

## 8. Điều kiện hoàn thành

1. Contract có endpoint/method, auth, request/response, status/error, validation và ví dụ; phân biệt API mới/hiện có.
2. Đúng MVP/Clean Architecture; chỉ Guest/User/Admin; response DTO; list phân trang khi cần.
3. DB lưu thật, migration nâng cấp được; seed có nhãn; không commit secrets/upload thật/build output.
4. Test role/ownership, thành công/lỗi/thiếu dữ liệu; FE gọi API thật, tải lại vẫn giữ dữ liệu.
5. Chạy dotnet build backend/Backend.sln -c Release; dotnet test backend/Backend.sln -c Release; npm run lint và npm run build trong frontend.
6. Chạy thêm SQL integration/migration, email, media, Gemini hoặc PDF theo module. Unit/domain test không thay thế các kiểm tra này.
7. PR ghi API/files/migration/config, bằng chứng kiểm tra và phần còn thiếu. Build xanh hoặc Swagger 200 chưa đủ để báo hoàn thành.

Checklist: BE 1 hoàn thành BE1-01 đến BE1-07; BE 2 hoàn thành BE2-01 đến BE2-09; BE 3 hoàn thành BE3-01 đến BE3-04.
