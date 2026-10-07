# Báo cáo kế hoạch backend và tổng quan dự án Vegetarian Support

Ngày lập: 30/09/2026. Phạm vi thay đổi của đợt này: **backend** cho Moderation, khung Gemini và AiChat; không sửa frontend.

## 1. Hiện trạng trước đợt triển khai

Vegetarian Support là monorepo gồm React/TypeScript ở `frontend/` và ASP.NET Core .NET 10 ở `backend/`. Backend có bốn project `Api`, `Application`, `Domain`, `Infrastructure` theo Clean Architecture. Khung API đã bật OpenAPI trong Development, EF Core SQL Server đã được khai báo và `AppDbContext` còn rỗng. Tại thời điểm khảo sát đầu đợt, chưa có controller nghiệp vụ, bảng/migration nghiệp vụ, xác thực người dùng hoặc tích hợp Gemini thật. Frontend là khung ứng dụng trắng. `contracts/README.md` mới nêu quy tắc hợp đồng, chưa có endpoint nghiệp vụ.

Nguồn phạm vi: `docs/mvp.md`; quy tắc phân tầng và phân việc: `AGENTS.md`, `STRUCTURE.md`; cách chạy: `README.md` và `backend/README.md`. Khi tài liệu mâu thuẫn, áp dụng thứ tự ưu tiên ghi trong `AGENTS.md`.

## 2. Mục tiêu backend của đợt này

| Hạng mục | Kết quả cần có | Ranh giới hiện tại |
|---|---|---|
| Trạng thái kiểm duyệt | Hai enum độc lập: AI `NotSubmitted`, `Checking`, `Passed`, `Flagged`, `Partial`, `Failed`; Admin `Draft`, `Submitted`, `PendingAdminReview`, `Published`, `RevisionRequested`, `Rejected`, `Removed`. | AI không được tự xuất bản; lỗi AI không được hiểu là đạt. |
| Moderation | Use case nhận bài viết/video gửi duyệt, lưu tham chiếu nội dung và trạng thái ban đầu; có đường ghi nhận kết quả AI để chuyển sang chờ Admin. | Đây là nền quy trình, chưa phải hệ quản lý phiên bản bài viết/video và màn hình Admin hoàn chỉnh. |
| Gemini | Interface ở `Application` và khung adapter ở `Infrastructure/AI/Gemini`; thiết kế đầu vào/đầu ra đủ tách AI Flag Check và chat. | Chưa khẳng định AI thật hoạt động nếu chưa có cấu hình, credential và kiểm thử. |
| AiChat User | Tạo conversation, lưu message và truy xuất lịch sử theo tài khoản; kiểm tra chủ sở hữu ở backend. | Phụ thuộc cơ chế Auth/Identity và lược đồ dữ liệu được tích hợp thực tế. |
| AiChat Guest | Nếu triển khai trong đợt: đếm lượt thành công theo session và giới hạn thử ở backend. | Guest không có tài khoản/lịch sử cá nhân; mức 3 lượt/phiên trong MVP là mặc định thiết kế, chưa là quyết định kinh doanh cuối cùng. |

Trong MVP, bài viết và video phải qua AI Flag Check rồi Admin duyệt. Cờ AI là bằng chứng hỗ trợ quyết định, không thay quyết định của Admin. `Checking` diễn tả đang chờ/đang chạy AI; `PendingAdminReview` diễn tả hàng đợi Admin. Hai trục trạng thái cần lưu riêng, kể cả khi AI trả `Partial` hoặc `Failed`. Nội dung chưa được Admin duyệt phải không công khai. Việc sửa bài đã xuất bản về sau cần phiên bản duyệt mới và giữ phiên bản công khai cũ cho đến khi được duyệt.

## 3. Phân tầng và hợp đồng

- `Domain`: enum, entity và quy tắc chuyển trạng thái không phụ thuộc framework.
- `Application/Features/Moderation` và `Application/Features/AiChat`: use case, DTO nội bộ và interface lưu trữ/AI; kiểm tra đầu vào, quyền sở hữu và điều phối.
- `Infrastructure/Persistence`: EF Core, cấu hình entity, repository và migration khi có lưu DB. `Infrastructure/AI/Gemini`: adapter dịch vụ ngoài, không chứa controller.
- `Api`: endpoint, xác thực/phân quyền, mapping HTTP và mã lỗi; không đặt quy tắc duyệt hay prompt tại đây.

Hợp đồng FE/BE cần ghi rõ method, endpoint, request/response DTO, phân trang lịch sử/hàng đợi, mã lỗi, quyền và hai trạng thái riêng trước khi FE tích hợp. OpenAPI Development là nguồn sinh từ code; mọi thay đổi request/response phải cập nhật `contracts/README.md` hoặc hợp đồng riêng trong `contracts/`. Chỉ có ba role `Guest`, `User`, `Admin`; quyền được kiểm tra lại ở backend.

## 4. Điều kiện nghiệm thu đợt này

1. Gửi bài viết/video vào duyệt tạo bản ghi và trạng thái AI/Admin rõ ràng. Khi hoàn thiện vòng đời nội dung, mỗi lần gửi lại phải có phiên bản/bằng chứng riêng.
2. Không có đường code tự chuyển `Published` từ kết quả Gemini; AI `Failed` và `Partial` không bị coi là `Passed`.
3. Interface Gemini có thể thay adapter thật mà không sửa Domain/Application; không đưa API key vào source, frontend hoặc báo cáo.
4. User chỉ đọc/ghi conversation của mình; message được lưu bền vững nếu cơ sở dữ liệu của đợt này đã được nối. Nếu Auth chưa có, báo rõ phần nhận diện tài khoản chưa thể kiểm chứng end-to-end.
5. Guest, nếu đã triển khai, dùng session riêng và giới hạn lượt ở backend; không hiển thị như lịch sử User.
6. `dotnet build backend/Backend.sln -c Release` thành công. Trước commit của cả nhóm, chạy thêm `npm run lint` và `npm run build` trong `frontend/` theo `AGENTS.md`, dù đợt này không sửa FE.

## 5. Lộ trình tổng thể MVP

| Chặng | Phạm vi | Phụ thuộc chính |
|---|---|---|
| 1. Nền tảng | Auth/Identity, phân quyền, hồ sơ, migration đầu tiên, chuẩn lỗi và API contract. | Chốt danh tính User và quy tắc dữ liệu cá nhân. |
| 2. Dữ liệu nội dung | Admin quản lý nguyên liệu, danh mục, công thức, nhà hàng; User tạo bài viết/video và tương tác. | Kho dữ liệu và storage tệp/ảnh/video. |
| 3. Kiểm duyệt và AI chat | Hoàn thiện phiên bản bài/video, AI Flag Check có bằng chứng, hàng đợi/quyết định Admin, Gemini thật, chat User/Guest. | Chặng 1–2; chính sách retry, quota, chi phí và lưu lịch sử. |
| 4. Cá nhân hóa | Tủ bếp, scan có xác nhận/OCR, thực đơn 7 ngày × 3 bữa, danh sách đi chợ và PDF. | Hồ sơ, nguyên liệu/công thức tin cậy, dữ liệu dinh dưỡng và rule dị ứng/chế độ ăn. |
| 5. Tích hợp và nghiệm thu | FE/BE theo contract, kiểm thử quyền và luồng lỗi, dữ liệu thật, deploy/CI. | Các chặng trên và cấu hình môi trường triển khai. |

Phạm vi sản phẩm vẫn theo `docs/mvp.md`: Guest chat thử, User chat có lịch sử, scan chỉ sau đăng nhập, AI không kết luận thành phần ẩn từ ảnh, cảnh báo dị ứng tách khỏi kết luận ăn chay. Không thêm thông báo, payment, barcode, đặt bàn, đánh giá nhà hàng hoặc role mới.

## 6. Phối hợp nhóm 5 người

| Vai trò | Module chính | Điểm cần phối hợp |
|---|---|---|
| FE 1 | Auth, profile, articles, admin, meal-plans. | Contract đăng nhập, gửi duyệt, trạng thái, quyết định Admin và thực đơn. |
| FE 2 | Recipes, videos, ai-chat, food-scan, pantry, restaurants. | Contract chat, upload và scan. |
| BE 1 | Auth, profile, member/role, `Infrastructure/Identity`. | Cung cấp identity và policy cho Moderation/AiChat. |
| BE 2 | Recipes, ingredients, restaurants, categories, favorites. | Cung cấp kho công thức/nguyên liệu cho các use case cá nhân hóa. |
| BE 3 | Articles, videos, comments, moderation, AI chat, food scan, meal plans, pantry, Gemini. | Chốt contract với FE 1/FE 2 và dùng identity của BE 1. |

Mỗi tính năng cần thống nhất contract trước khi hai phía code; PR nên nhỏ theo module. Khi sửa lược đồ chung, các BE cần thống nhất migration và review chéo để tránh xung đột `AppDbContext`.

## 7. Khoảng trống và quyết định tiếp theo

- **Auth/Identity:** chưa có trong khung đầu đợt; phải nối identity đáng tin cậy trước khi xác nhận quyền sở hữu chat hoặc người gửi bài.
- **Dữ liệu và migration:** kiểm tra entity/configuration/migration cuối đợt, tạo và áp dụng migration trên SQL Server thử nghiệm trước khi kết luận lưu bền vững.
- **Gemini thật:** chọn model, giới hạn chi phí, timeout, retry, phạm vi kiểm tra video và cách hiển thị bằng chứng/`Partial`; không đưa secret vào Git.
- **Vận hành chat Guest:** chốt hạn mức sản phẩm, thời gian sống session và biện pháp chống lạm dụng; giới hạn theo session đơn thuần không phải bảo vệ tuyệt đối.
- **Chính sách dữ liệu:** chốt thời gian lưu/xóa ảnh, video, hội thoại và dữ liệu hồ sơ sức khỏe; dùng dữ liệu giả khi test.
- **Đồng bộ FE/BE:** rà soát OpenAPI và cập nhật contract trước khi FE dùng; đợt này không sửa giao diện.

## 8. Kết quả triển khai và kiểm chứng

| Hạng mục | Đã làm | Kiểm chứng / giới hạn |
|---|---|---|
| Moderation và hai enum | `Domain/Enums/AiFlagStatus.cs`, `AdminReviewStatus.cs`; snapshot có version, hai trạng thái riêng, lý do cờ AI, created/updated time, retry khi AI lỗi, hàng đợi Admin và nhật ký quyết định. Application service và API ở `Features/Moderation`, `Api/Controllers/ModerationController.cs`. Development có endpoint Admin ghi kết quả AI mock. | Unit test xác nhận AI `Passed` không tự xuất bản, `Failed` không thể duyệt, `Partial` phải ghi phạm vi chưa kiểm tra, `Flagged` cần lý do. Chưa có Article/Video repository và AI worker; bản gửi hiện chỉ lưu snapshot/media reference. |
| Gemini interface/adapter | `Application/Abstractions/AI/IGeminiService.cs`, `Infrastructure/AI/Gemini/`; adapter gọi `generateContent` từ backend cho chat và tạo kết quả kiểm duyệt JSON. Cấu hình local có thể chọn Gemini thay câu trả lời mock. | Chat Gemini đã smoke test thành công một lần. Moderation chưa được gọi bởi worker; key/model lấy từ cấu hình server, không gửi xuống frontend. |
| AiChat User/Guest | Conversation và message User lưu qua EF Core, kiểm tra quyền sở hữu bằng claim token; Guest có 3 lượt trả lời thành công/session phía server, không ghi DB. | Development bật câu trả lời mẫu và trừ lượt Guest khi trả lời; khi tắt mock và Gemini chưa sẵn sàng, trả `503` và không trừ lượt. Chưa thử đường User có token + SQL Server do Auth/Identity và DB thử nghiệm chưa sẵn sàng. |
| DB migration/contract | Migration `InitialModerationAiChat` tạo 4 bảng và index; API contract tại `contracts/moderation-aichat.md`. JWT Bearer xác minh `sub`/`role`; Development có endpoint cấp token thử và Swagger khai báo Bearer/401/403. | Delta `AiFlagReason`, `CreatedAtUtc`, `UpdatedAtUtc` đã ghi ở `docs/be2-migration-handoff.md` để BE 2 gom migration; **chưa áp dụng lên SQL Server**. Cần BE 1 nối Auth/Identity thật. |
| Build và test | `dotnet build backend/Backend.sln -c Release`, `dotnet test backend/Backend.sln -c Release`. | Build 0 warning/0 error; 5/5 unit test đạt. Không sửa FE; chưa thực hiện commit. |

Tiếp theo: nối Auth/Identity và DB thử nghiệm, ràng buộc submission với bài viết/video và quyền sở hữu media, triển khai AI worker/Gemini thật với bằng chứng và retry, sau đó kiểm thử toàn bộ luồng User → AI → Admin → công khai. Không dùng trạng thái `Published` của khung Moderation làm nguồn nội dung công khai cho đến khi module Article/Video thực thi việc này.
