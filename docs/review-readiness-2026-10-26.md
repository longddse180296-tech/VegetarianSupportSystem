# Rà soát chuẩn bị review ngày 26/10/2026

Hoàn tất lượt kiểm tra tiếp theo ngày 27/10/2026.

## Phạm vi và cách đọc source

Đợt này rà soát code trong `frontend/src` và `backend/src`, tập trung vào các nhánh lỗi dùng chung, thông báo người dùng, dữ liệu chưa xác định và chú giải tiếng Việt. Các thay đổi có sẵn trong workspace được giữ nguyên, không commit hoặc ghi đè bằng bản trên Git.

- 592 tệp `.ts`, `.tsx`, `.cs`, `.css` có ghi chú vai trò ở đầu file. Các khối hàm, kiểu dữ liệu, trạng thái, effect, truy vấn và thao tác nghiệp vụ được bổ sung chú giải theo cấu trúc code. Các phép tính và nhánh quan trọng được giải thích riêng.
- Các migration và snapshot do EF Core sinh chỉ được ghi chú vai trò, không sửa nội dung nâng cấp/hạ cấp.
- Bốn `.csproj` có chú thích về trách nhiệm từng tầng. JSON không hỗ trợ comment nên được giải thích trong tài liệu này; ảnh và tệp cấu hình nhạy cảm không được chèn chú giải vào nội dung.
- Chú giải phục vụ đọc code, không thay thế API contract hoặc bài kiểm thử. Khi chỉnh sửa nghiệp vụ cần cập nhật chú giải cùng lúc.

| Chức năng | Vị trí cần xem khi giải thích với giảng viên |
|---|---|
| Đăng nhập và lỗi phiên | `frontend/src/shared/api/apiClient.ts`, `frontend/src/features/auth/context/AuthContext.tsx`, `backend/src/Api/Authorization` |
| Lỗi render toàn trang | `frontend/src/shared/components/ErrorBoundary.tsx` |
| BMI và năng lượng/ngày | `backend/src/Domain/Rules/ProfileNutritionEstimate.cs` |
| Tổng dinh dưỡng công thức | `backend/src/Application/Features/Recipes/RecipeNutritionService.cs`, `backend/src/Domain/Rules/RecipeNutritionRules.cs` |
| SignalR tính dinh dưỡng | `backend/src/Api/Hubs/RecipeNutritionHub.cs`, `frontend/src/features/admin/recipes/hooks/useRecipeNutrition.ts` |
| Bốn loại ăn chay và thông tin chưa đủ | `backend/src/Domain/Rules/DietaryRules.cs` |
| Bài viết và phiên bản | `backend/src/Application/Features/Articles`, `backend/src/Domain/Entities/Article.cs` |
| AI kiểm tra bài viết | `backend/src/Infrastructure/BackgroundJobs/ModerationAiWorker.cs`, `backend/src/Infrastructure/AI/Gemini/GeminiService.cs` |
| Quyết định duyệt | `backend/src/Domain/Entities/ModerationSubmission.cs`, `backend/src/Application/Features/Moderation` |
| Video nháp và thử lại tải lên | `frontend/src/features/videos/pages/VideoCreatePage.tsx`, `backend/src/Application/Features/Videos` |
| Bình luận, báo cáo và góp ý | `frontend/src/features/admin/comments`, `frontend/src/features/admin/reports`, `frontend/src/features/admin/dashboard/pages/AdminFeedbackPage.tsx` |
| Thực đơn và dữ liệu hồ sơ tại lúc tạo | `backend/src/Application/Features/MealPlans`, `frontend/src/features/meal-plans` |
| Tủ bếp và gợi ý thay thế | `backend/src/Application/Features/Pantry`, `frontend/src/features/pantry` |
| Quét ảnh và xác nhận nguyên liệu | `backend/src/Application/Features/FoodScanning`, `frontend/src/features/food-scan` |
| Nhà hàng, danh mục và yêu thích | Các thư mục `Restaurants`, `Categories`, `Favorites` trong Application và feature frontend tương ứng |

## Các trường hợp đã sửa

1. Đăng nhập sai: giữ biểu mẫu và thông báo, không chuyển sang một URL đăng nhập khác hoặc xóa phiên vì yêu cầu đăng nhập công khai bị từ chối.
2. Phiên hết hạn: xóa thông tin xác thực, đồng bộ AuthProvider, chuyển đúng hash route và giữ đường dẫn quay lại sau khi đăng nhập.
3. Hủy yêu cầu khi đổi trang/bộ lọc: giữ `AbortError`, không báo thành lỗi mất kết nối.
4. Mất mạng, 403, 404, xung đột trạng thái 409, tệp quá lớn 413, sai định dạng 415, thao tác quá nhanh 429, hết thời gian và lỗi máy chủ: có hướng dẫn phù hợp; không đưa chi tiết ngoại lệ 5xx lên giao diện.
5. Phản hồi không phải JSON: báo dữ liệu chưa hợp lệ thay vì âm thầm trả `undefined` và gây lỗi màn hình ở bước sau.
6. Validation: thông báo bắt buộc/khoảng giá trị mặc định được chuyển sang tiếng Việt; bỏ tên tham số kỹ thuật ở cuối thông báo. Đã Việt hóa các thông báo nghiệp vụ chính của bài viết, video, thực đơn, yêu thích, kiểm duyệt, bình luận và tủ bếp.
7. Lỗi render: có màn hình khôi phục với tải lại/về trang chủ thay cho trang trắng.
8. Upload video lỗi sau khi tạo nháp: giữ ID bản nháp để thử lại không tạo thêm video trùng; kiểm tra định dạng và dung lượng trước khi tạo; chặn thao tác lưu khi đang xử lý.
9. AI cắt kết quả: kiểm duyệt JSON trên Gemini 2.5 Flash tắt ngân sách suy luận để tránh hết token; nhận diện `MAX_TOKENS` thành mã `OutputTokenLimit`. Worker ghi mã lỗi vào log, không ghi nội dung bài hoặc API key. Không tự đổi kết quả thất bại cũ thành đạt.
10. Hộp thoại dùng chung: có tên/mô tả truy cập, focus vào khi mở, vòng Tab ở trong, Escape đóng, trả focus và trạng thái cuộn khi đóng.
11. Khóa/mở khóa thành viên: không đóng biểu mẫu hoặc thay lý do trong lúc đang gửi quyết định.
12. Dữ liệu chưa biết: bỏ thời lượng video giả, tác giả/đầu bếp/số theo dõi/huy hiệu xác minh giả, khoảng cách nhà hàng mặc định; video thiếu khai báo chế độ ăn không bị tự coi là thuần chay.
13. Nội dung giao diện: bỏ cam kết gửi thông báo xuất bản, số lượng công thức cố định, tư vấn chuyên gia và đảm bảo cân bằng dinh dưỡng khi chưa có chức năng/dữ liệu chứng minh; sửa liên kết footer bị trỏ đến route không tồn tại.
14. Tủ bếp: lỗi đọc danh sách không bị biến thành dữ liệu trống; lưu/xóa/thay nguyên liệu chỉ cập nhật giao diện sau khi API thành công. Bỏ bản ghi cục bộ giả thành công, giữ biểu mẫu khi lưu lỗi và có thông báo thử lại.
15. Đánh giá tủ bếp: dùng kết quả backend thay cho suy luận lại từ tên. Giữ trạng thái chưa đủ thông tin, cảnh báo dị ứng và thực phẩm cần tránh; hồ sơ thay đổi thì lấy lại đánh giá từ máy chủ.
16. Dinh dưỡng gợi ý tủ bếp: bỏ calo mặc định 350 và các số đạm/carb/béo tự dựng từ tỷ lệ calo. Thiếu dữ liệu hiển thị dấu gạch; số 0 được giữ khi có dữ liệu. Định lượng chưa khai báo giữ null, không tự coi là 1 gram.

## Cấu hình không chèn comment trực tiếp

- `backend/src/Api/appsettings.json`: cấu hình mặc định cho SQL Server, log và tên model Gemini. Không đặt khóa thật vào file được commit. Model văn bản/ảnh mặc định đồng bộ về `gemini-2.5-flash`.
- `backend/src/Api/appsettings.Development.json`: phần ghi đè chỉ dành cho môi trường phát triển.
- `backend/src/Api/Properties/launchSettings.json`: profile HTTP/HTTPS, URL và môi trường khi chạy local.
- Cấu hình thật trong biến môi trường hoặc tệp local nhạy cảm được giữ nguyên; không đưa vào báo cáo.

## Bằng chứng kiểm tra

| Kiểm tra | Kết quả |
|---|---|
| Build backend Release | Đạt |
| Unit test backend | 130 đạt, gồm 3 kiểm tra hồi quy Gemini mới |
| Kiểm tra API/SQL tích hợp tổng | 298 đạt; database riêng được xóa sau chạy |
| Kiểm tra báo cáo và tên tài khoản | 32 đạt |
| Kiểm tra profile, BMI/TDEE và dữ liệu gửi AI | 19 đạt |
| Kiểm tra client HTTP frontend | 19 đạt |
| Kiểm tra adapter và nhánh lỗi tủ bếp | 9 đạt |
| Lint/build frontend | Đạt; lint không còn cảnh báo, build còn cảnh báo kích thước bundle |
| Giao diện đăng nhập lỗi | Giữ route, giữ biểu mẫu, hiện thông báo và cho thử lại |
| Hộp thoại | Tab/Shift+Tab, Escape, trả focus đạt; kiểm tra ở 390px không tràn ngang |

Test host tích hợp trước đó thiếu policy rate limit của endpoint khôi phục mật khẩu, làm test nhận 500 trước khi vào nghiệp vụ. Đã bổ sung đúng tên và hạn mức như API thật; kiểm tra tổng sau đó đạt 298 trường hợp.

## Những giới hạn cần giải thích đúng khi review

- Các kiểm tra tự động và kiểm tra giao diện nêu trên không chứng minh mọi tổ hợp thao tác trên mọi thiết bị đều không còn lỗi. Đây là bằng chứng theo phạm vi đã chạy.
- AI bài viết hiện kiểm tra văn bản. Ảnh đính kèm được ghi nhận chưa kiểm tra; quyết định cuối thuộc Admin. Video không qua AI.
- TDEE là ước tính/ngày theo Mifflin–St Jeor, chưa phải thực đơn đã tối ưu để đạt mục tiêu calo/vi chất; không đổi công thức sang Harris–Benedict trong đợt này.
- Thiếu mốc quy đổi ml/số lượng sang gram thì không tự suy đoán. Tổng dinh dưỡng công thức không được coi là hoàn chỉnh nếu thiếu dữ liệu bắt buộc.
- Build backend hiện còn cảnh báo NuGet cho `System.Security.Cryptography.Pkcs 9.0.4`; frontend còn cảnh báo kích thước bundle. Không ghi nhận hai nhóm cảnh báo này là đã khắc phục. Các cảnh báo lint hiệu ứng cập nhật trạng thái và React Compiler đã được xử lý trong lượt tiếp theo.
- Không gửi thử thư thật, công khai bài/video, hoặc tạo dữ liệu demo trong database đang sử dụng để chứng minh kiểm thử. Luồng upload lỗi từng bước nên được trình diễn bằng tệp thử do nhóm chuẩn bị.

## Kịch bản trình diễn với giảng viên

1. Đăng nhập sai rồi đúng; kiểm tra tài khoản User không truy cập được Admin.
2. Lưu hồ sơ và tạo thực đơn, kiểm tra tự dùng chế độ ăn đã lưu.
3. Tạo nguyên liệu, thử trùng tên/thiếu dinh dưỡng; chọn nguyên liệu trong công thức, thay lượng/khẩu phần để xem SignalR tính lại.
4. Lưu bài/video nháp, gửi duyệt và xem trạng thái; mô tả rõ AI lỗi và ảnh chưa được kiểm tra, Admin đọc trước quyết định.
5. Báo cáo nội dung, gửi góp ý; Admin xem tên người gửi và nhập lý do xử lý.
6. Thử tìm không có kết quả, xóa bộ lọc, tải lại khi lỗi, mở/đóng hộp thoại bằng bàn phím và trên điện thoại.
