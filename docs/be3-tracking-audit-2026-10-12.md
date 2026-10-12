# Đối chiếu tracking BE 3 — Phạm Quang Đức — 12/10/2026

Đối chiếu bảng tracking người dùng gửi với source tại HEAD `c692400`, hợp đồng API, phân công và báo cáo kiểm thử trong repository. Đây là rà soát triển khai; không xác nhận nghiệm thu toàn hệ thống hoặc chất lượng Gemini thực tế. Trong bảng dưới, `Updated` nghĩa là đã có implementation và cần sửa tracking cũ. Chỉ đổi sang `Done` sau khi nhóm xác nhận nghiệm thu tương ứng.

## 1. Những dòng cũ cần sửa

| Dòng | Trạng thái đề xuất | Nội dung để thay vào Update Details |
|---|---|---|
| 51 — Nền tảng AI & Moderation Base | Updated | Đã có entity, enum AI/Admin riêng, repository EF, migrations, submission theo phiên bản, queue và nhật ký quyết định. Đã có báo cáo kiểm tra LocalDB; cần xác nhận schema database tích hợp hiện dùng. Không còn chỉ là khung service. |
| 52 — Gemini Adapter & Prompt | Updated | Đã gọi Gemini từ backend cho chat, ảnh món, OCR nhãn và AI kiểm tra bài viết; có timeout, retry HTTP 502/503/504, kiểm tra JSON và bằng chứng. Không dùng AI duyệt video. Chưa có bằng chứng mới trong lượt rà soát này xác nhận tất cả ca Gemini thật thành công. |
| 53 — Guest Limiter | Updated | Đã quản lý session phía server, 3 lượt trả lời thành công, session idle 30 phút. Hết lượt trả 429; AI lỗi trả 503 và không trừ lượt. Guest không có hồ sơ/lịch sử tài khoản; session đang dùng memory cache, không cần ghi Guest vào SQL Server. |
| 54 — User AI Chat API | Updated | Đã có tạo/list/detail conversation, lưu tin nhắn SQL Server, phân trang và kiểm tra owner qua JWT; đã tham chiếu chế độ ăn/dị ứng và trả recipe ID thật. Không còn phải chờ Auth để viết API. FE chat vẫn còn lỗi tích hợp. |
| 55 — Luồng Gửi & Duyệt | Updated | Video upload thật rồi gửi vào queue Admin. Bài viết thật đã nối qua POST /api/me/articles/{id}/submit vào ModerationService và worker. Đã có 4 quyết định, bảo vệ version và bản Published. POST /api/moderation/submissions với Article vẫn trả 503: cần chốt lại đường gửi/contract. |
| 56 — OCR & Food Scan API | Updated | Đã có dish-image, label-image, evaluate lưu DB, history/detail theo owner, profile snapshot và phiên bản đánh giá lại; rule 4 chế độ/3 kết quả, dị ứng riêng, đối chiếu ingredient catalog. Còn cần nghiệm thu ảnh/Gemini thật. |
| 57 — Pantry & Meal Plans API | Chuyển BE 2 | Pantry, meal plans, shopping list và PDF thuộc BE 2 theo phân công hiện hành. Không tính vào phần BE 3 còn thiếu. Đổi tên nhóm V thành BACKEND 3 (Video, Moderation, AI Chat, Food Scan). |

## 2. Chi tiết đã làm nhưng tracking chưa có dòng riêng

Các dòng này là phần tách nhỏ của 51–56 hoặc bổ sung phần bị bỏ sót. Không cộng hai lần khối lượng khi giữ cả dòng tổng và dòng chi tiết. Cột In Charge có thể ghi `Phạm Quang Đức` cho toàn bộ dòng backend dưới đây.

| Screen/Function | Feature | Actor | Screen/Function Description | Complexity | Status | Update Details |
|---|---|---|---|---|---|---|
| Public Video List & Detail | Videos | Guest, User, Admin | Danh sách/chi tiết video công khai, phân trang | Medium | Updated | GET /api/videos và /{id} chỉ đọc phiên bản Published; bản chưa duyệt/gỡ không public. |
| Video Draft & My Videos | Videos | User, Admin | Tạo nháp, sửa metadata, danh mục và xem nội dung của mình | Complex | Updated | POST/PUT/GET /api/me/videos; xác minh category active và owner, trả trạng thái và phản hồi Admin. |
| Video & Thumbnail Upload | Videos / Storage | User, Admin | Upload video và ảnh đại diện, xử lý lỗi và tải lại | Complex | Updated | MP4/WEBM tối đa 200 MB; JPG/PNG/WEBP tối đa 10 MB; kiểm tra chữ ký, AwaitingUpload/Processing/Ready/Failed; lỗi storage trả 503. |
| Private Media Storage & Playback | Storage | Owner, Admin; Guest với bản Published | Lưu file riêng tư và đọc media qua kiểm quyền | Complex | Updated | IPrivateMediaStore và LocalPrivateMediaStore; key server sinh, kiểm tra đường dẫn; endpoint media hỗ trợ HTTP Range, owner/Admin xem riêng tư. |
| Video Views & Favorites Count | Videos | Guest, User, Admin | Ghi lượt phát và số lượt lưu thực | Medium | Updated | POST /api/videos/{id}/views đếm theo session; favoriteCount lấy từ Favorites. Like/comments dùng module BE 1, không nhận toàn bộ phần tương tác là BE 3 tự làm. |
| Video Submission & Published Version | Videos / Moderation | User, Admin | Gửi phiên bản và giữ bản đã duyệt trong lúc sửa | Complex | Updated | Chỉ submit khi media Ready; video vào PendingAdminReview, AI NotSubmitted. Bản sửa chờ duyệt giữ media/metadata public đã duyệt. |
| Article AI Background Worker | Moderation | System | Tự kiểm tra bài viết sau gửi duyệt | Complex | Updated | Worker quét Article Checking mỗi 5 giây, bỏ phiên bản cũ, gọi Gemini thật theo cấu hình backend; không dùng mock-ai-result trong worker. Submit bài viết nối từ module BE 1. |
| AI Flags, Evidence & Scope | Moderation | Owner, Admin | Lưu và trả cờ, ưu tiên, lý do, bằng chứng, phạm vi | Complex | Updated | DTO có aiFlagType/aiPriority/aiEvidence, checked/unchecked scope. Bằng chứng văn bản được đối chiếu input; media bài viết chưa phân tích được ghi Partial. |
| Moderation Queue & Decision Audit | Moderation | Admin | Queue/lọc, duyệt, yêu cầu sửa, từ chối và gỡ | Complex | Updated | Endpoint /decisions lưu actor/time/reason/version; approve tránh version cũ và chỉ một bản hiện public. FE Admin hiện đã dùng contract /decisions. |
| Failed Article → Admin Review | Moderation | System, Admin | Cho Admin xem trực tiếp khi AI bài viết thất bại | Complex | Updated | Commit e3b6962: Failed vẫn vào PendingAdminReview, không biến thành Passed hoặc tự xuất bản; có migration và tests. retry-ai chỉ khôi phục bản Failed+Submitted cũ; bản đã vào queue trả 409. |
| User Chat Profile & Recipe Context | AI Chat | User, Admin | Cá nhân hóa prompt theo dữ liệu đã khai báo | Medium | Updated | Backend đọc chế độ ăn/dị ứng, lấy tối đa 3 recipe active với ID thật. Gợi ý hiện chưa lọc/xếp hạng theo diet/allergy; chat không lưu meal plan. |
| Dish Recognition & Confirmation API | Food Scan | User, Admin | Gợi ý nguyên liệu nhìn thấy và câu hỏi bổ sung | Complex | Updated | dish-image trả NeedsConfirmation, unknown factors và follow-up questions; AI gợi ý chưa trở thành xác nhận; ảnh đơn lẻ chưa kết luận phù hợp. |
| Ingredient Label OCR | Food Scan | User, Admin | Đọc nhãn, đánh dấu thiếu/mờ, nhận dữ liệu User sửa | Complex | Updated | POST /label-image trả extractedText/isIncomplete; evaluate nhận correctedLabelText và nguyên liệu được xác nhận; không tự coi phần thiếu là thực vật. |
| Dietary Rules & Allergy Evidence | Food Scan | User, Admin | Đánh giá 4 chế độ với 3 kết quả, cảnh báo dị ứng riêng | Complex | Updated | Unknown answers/nhãn thiếu giữ InsufficientInformation; động vật đã xác nhận ưu tiên Incompatible; snapshot catalog BE 2 không thay đổi theo catalog mới. |
| Scan History, Ownership & Profile Snapshot | Food Scan | User, Admin | Lưu kết quả cá nhân, phân trang, xem chi tiết và đánh giá lại | Complex | Updated | GET /history và /{id}; owner khác không đọc được; profile/input/result snapshots bất biến; previousScanId tạo phiên bản tiếp theo. |
| BE 3 Migrations & Test Handoff | BE 3 / Integration | Developer | Bàn giao schema, contract, test và fixture | Complex | Updated | Có migrations Videos/FoodScans, evidence, revisions, sửa cột moderation, video Admin-only, FailedArticleAdminReview; có test rules/services và hướng dẫn fixture. |

## 3. Phần chưa hoàn thiện hoặc chưa nghiệm thu

| Việc cần thêm vào tracking | Status | Phụ trách | Căn cứ và việc còn lại |
|---|---|---|---|
| Thống nhất endpoint gửi duyệt Article | Doing | BE 3 + BE 1 | ArticleService.SubmitAsync đã nối thật; ModerationController.Submit vẫn chặn Article bằng 503 và thông báo “chưa tích hợp”. Chốt một đường gửi có kiểm tra article/owner/version, cập nhật contract và test; không tạo endpoint trùng chỉ để khớp mock. |
| Đồng bộ Guest quota FE với server | Doing | FE 2 + BE 3 hỗ trợ | AiChatPage khởi tạo 3 lượt và trừ trước request; lỗi AI vẫn mất lượt trên UI, không lấy remainingQuestions làm nguồn trạng thái. Dùng session/response thật, hiển thị 429/503 đúng. Backend limiter đã có. |
| Giữ conversation và mở lịch sử chat thật | Doing | FE 2 + BE 3 hỗ trợ | AiChatPage luôn gọi sendMessageToAi với conversationId=null; mỗi lần gửi User có thể tạo conversation mới. Nhấn lịch sử hiện gửi tiêu đề thành câu hỏi. Cần giữ ID, tải messages và điều khiển phân trang thật. |
| Bỏ hồ sơ/lịch sử mẫu và hiển thị gợi ý recipe thật | Doing | FE 2 + BE 3 hỗ trợ | aiChatApi còn fallback BMI 22.0/21.5, history mẫu và số message cố định. Mapper gửi tin chưa dùng recipeSuggestions từ BE; cần dùng ID thật và chuyển sang meal-plan khi yêu cầu tạo kế hoạch. |
| Nghiệm thu Gemini thật: chat, article AI, ảnh món/OCR | Doing | BE 3 + FE | Source đã có adapter, timeout và retry. Báo cáo FE1 dùng fixture cho Passed/Partial; cần lưu kết quả test provider thật, lỗi/quota, ảnh nhãn mờ và các ca rule. Không coi fixture là chứng cứ chất lượng AI. |
| Kiểm tra/apply migration database tích hợp | Doing | BE 3 + người tích hợp DB | Báo cáo BE3 cũ ghi đã apply LocalDB; báo cáo FE1 mới ghi database đang dùng thiếu Videos/cột moderation. Chưa truy vấn DB trong lượt rà soát này. Xác minh instance/database/schema và áp dụng migration thiếu trước E2E. |
| Chuẩn bị storage/session cho môi trường deploy | To Do | BE 3 + nhóm deploy | Implementation hiện local private storage và session memory. Cần cấu hình persistent volume, chốt chính sách lưu/xóa media và history; nếu chạy nhiều instance cần thống nhất storage/session. Không mặc định phải thêm transcoding vì contract MVP hiện không yêu cầu. |
| Cập nhật tài liệu BE 3 cũ | To Do | BE 3, phối hợp BE 1 | README/báo cáo/contract còn đoạn “chưa có Article”, “chat chưa tham chiếu profile”, “chưa có worker”, “like chưa có”. Phản ánh code mới, đường submit và quy tắc Failed vào Admin queue để FE không tích hợp sai. |

Không thêm task “AI kiểm duyệt video”: docs/mvp.md đã chốt ngày 10/10/2026 video do Admin xem trực tiếp, không chạy AI. Phạm vi âm thanh/khung hình trong mô tả cũ không còn là phần Gemini cần triển khai cho video.

## 4. Chứng cứ và giới hạn

- `git log` xác nhận các commit mang tác giả Phạm Quang Đức: `f7b5dc1` (30/09), `dc19577` (02/10), `0358733` (10/10), `5db4858` (11/10), `e3b6962` (12/10). `0358733` bổ sung phần lớn video/storage/scan/history/worker/context; `e3b6962` bổ sung FailedArticleAdminReview. Các thay đổi FE là công việc nhóm frontend, cần ghi đúng người thực hiện.
- Video/storage: `backend/src/Application/Features/Videos/VideoService.cs`, `backend/src/Api/Controllers/VideosController.cs`, `backend/src/Infrastructure/Storage/LocalPrivateMediaStore.cs`, `contracts/videos.md`.
- Moderation: `backend/src/Application/Features/Moderation/ModerationService.cs`, `backend/src/Infrastructure/BackgroundJobs/ModerationAiWorker.cs`, `backend/src/Api/Controllers/ModerationController.cs`, `backend/src/Application/Features/Articles/ArticleService.cs`.
- Chat: `backend/src/Application/Features/AiChat/`, `backend/src/Infrastructure/AI/Gemini/`, `backend/src/Infrastructure/Persistence/Repositories/AiChatContextRepository.cs`, `frontend/src/features/ai-chat/pages/AiChatPage.tsx`, `frontend/src/features/ai-chat/api/aiChatApi.ts`.
- Scan: `backend/src/Application/Features/FoodScanning/FoodScanningService.cs`, `backend/src/Infrastructure/Persistence/Repositories/FoodScanRepository.cs`, `contracts/food-scanning.md`, `frontend/src/features/food-scan/pages/FoodScanPage.tsx`.
- Frontend scan hiện đã gọi API phân tích/evaluate/history thật; FE Admin đã dùng /decisions. Không tiếp tục ghi “runScan chỉ timer” hoặc “cần thay helper /approve” như việc chưa làm chung cho source hiện tại.
- Báo cáo BE3 ghi 47/47 backend tests qua ngày 10/10; báo cáo FE1 ghi kiểm tra video upload/phát/duyệt/gỡ thật và dùng fixture DB cho AI Passed/Partial. Đây là báo cáo có sẵn, không phải kết quả chạy lại ngày 12/10.
- Đã thử `dotnet test backend/Backend.sln -c Release --no-restore` trong lượt rà soát, nhưng lệnh không hoàn tất bình thường/không trả báo cáo; đã dọn worker mồ côi của chính lệnh đó. Không công bố test hiện tại đạt. Không chạy script seed/verify có thao tác DB, không gọi Gemini thật, không áp dụng migration và không sửa code nghiệp vụ.

Gợi ý ghi tracking: giữ dòng tổng 51–56 ở Updated hoặc Doing nếu đó là trạng thái nghiệm thu chung; tách các phần backend đã triển khai và phần tích hợp còn thiếu thành dòng riêng. Đừng giữ “To Do” với API đã có, và đừng ghi “Done toàn luồng” chỉ vì đã có source.
