# Xác minh AI kiểm tra bài viết — 27/10/2026

## Bổ sung kiểm tra ảnh đại diện cùng ngày

Kiểm tra key riêng đã hoàn tất bằng hai yêu cầu tổng hợp trên adapter thật với 3.1 Flash-Lite: ảnh hướng dẫn luộc rau nhận Passed, ảnh chứa tuyên bố ngừng thuốc nhận Flagged; cả hai ghi nhận phạm vi văn bản và ảnh. Không dùng bài/ảnh thật trong database ứng dụng để kiểm tra key mới.

Cấu hình kiểm duyệt được tách riêng bằng `Gemini__ModerationApiKey` và `Gemini__ModerationModel`. Chat/scan/OCR vẫn dùng key/model chung. Key riêng được lưu trong `.env` local bị Git bỏ qua, không đưa vào tài liệu hoặc source. Key mới nhận HTTP 404 khi gọi 2.5 Flash, provider báo model không còn khả dụng cho người dùng mới và gợi ý 3.8 Flash. Thử 3.8 Flash với low bị timeout 60 giây. Đã lấy danh sách model mà key truy cập được, kiểm tra thật `gemini-3.1-flash-lite` với văn bản và ảnh tổng hợp nhận Passed, phạm vi ghi rõ cả văn bản/ảnh; cấu hình local riêng cho bài viết chốt model này. Các chức năng khác giữ nguyên. Theo [tài liệu thinking của Google](https://ai.google.dev/gemini-api/docs/thinking/), nếu chọn model 3.8 thì không dùng minimal; adapter hỗ trợ low riêng cho 3.8. Kiểm thử HTTP giả lập xác minh đúng key/model cho bốn luồng và giữ key riêng khi fallback văn bản; không tự dùng key chung khi key kiểm duyệt gặp lỗi. 164 kiểm thử backend đạt.

Đối chiếu log sau khi người dùng gửi ảnh món ăn: ba bản gửi kiểm tra lúc 23:40:02, 23:40:47 và 23:41:47 đều nhận `ProviderHttp429` (giới hạn lượt gọi/quota), khác safety block trước đó. Đã tách thông báo qua `ModerationFailureMessage` để kết quả Failed nêu đúng lý do hạn mức. Chưa có thông tin đủ để phân biệt quota phút hay ngày; không gọi lặp hoặc chuyển model/key để né quota. Kiểm thử hồi quy xác minh 429 không bị mô tả thành lỗi bộ lọc ảnh.

Cập nhật sau phản hồi bài mới bị safety block: không gộp cả lần kiểm tra thành Failed nếu vẫn có thể kiểm tra riêng văn bản. Yêu cầu có ảnh bị chặn sẽ được kiểm tra văn bản độc lập một lần, không gửi lại ảnh/đổi bộ lọc; khi thành công ghi Partial, giữ các cờ văn bản và nêu rõ ảnh chưa được kiểm tra. Nếu bước văn bản cũng thất bại, giữ Failed. Hai kiểm thử hồi quy xác minh nhánh văn bản đạt và nhánh văn bản có cờ đều không mất phạm vi/bằng chứng, không ghi Passed khi ảnh còn chưa kiểm tra.

Luồng mới gửi cả văn bản và byte ảnh đại diện đã upload qua `/api/me/images` sang Gemini bằng `inline_data`, dùng `Gemini:ImageModel`. Backend đọc trực tiếp kho `IPublicImageStore`, kiểm tra khóa GUID, chữ ký ảnh và giới hạn 10 MB; không tải URL tùy ý. Ảnh tham chiếu bên ngoài, thiếu, không đọc được hoặc ngoài phạm vi hỗ trợ giữ `Partial`, nêu rõ phần chưa kiểm tra. Đây là thay đổi thay thế giới hạn chỉ đọc văn bản trong báo cáo ban đầu bên dưới.

Schema nội bộ thêm `evidenceSource` (Text/Image/null), cho phép loại cờ `InappropriateImage`. Bằng chứng văn bản vẫn phải trích đúng nội dung; bằng chứng từ ảnh chỉ được nhận khi thực sự gửi byte ảnh, được lưu vào `aiEvidence` với tiền tố “Ảnh đại diện:”. Giữ nguyên DTO công khai và các trạng thái Domain, không cần migration. Nếu Gemini chặn yêu cầu theo bộ lọc an toàn, ghi `Failed` và thông báo cần Admin xem trực tiếp; không hạ bộ lọc hoặc coi ảnh đã đạt.

FE hiển thị cảnh báo đỏ ở danh sách/chi tiết Admin và kết quả User, bao gồm trạng thái Flagged, Partial, Failed với thông điệp riêng, không đồng nhất lỗi xử lý với vi phạm. User đang mở trang bài viết được tự đọc lại kết quả mỗi 5 giây khi phiên bản mới nhất đang Checking (tối đa 30 lần, dừng khi hoàn tất/lỗi/rời trang); việc đọc trạng thái không gọi Gemini lại.

Đã chạy 44 kiểm tra thật trên database ngẫu nhiên: upload hai PNG tổng hợp qua HTTP; ảnh hướng dẫn nấu ăn nhận Passed, ảnh có khuyến cáo ngừng thuốc trong khi văn bản bình thường nhận Flagged và bằng chứng từ ảnh lưu đúng vào SQL. Các kiểm tra bài không ảnh/ảnh không đọc được và quyết định Admin vẫn đạt. Database/kho ảnh kiểm thử được dọn riêng sau chạy, không sửa bài thật hoặc tự chạy lại bài lịch sử. Kiểm tra HTTP giả lập bao phủ gửi byte ảnh, từ chối bằng chứng ảnh khi không có byte, URL tùy ý, stream quá lớn/tệp sai và provider safety block.

Nguồn: [Google — Image understanding](https://ai.google.dev/gemini-api/docs/generate-content/image-understanding), [GenerateContent](https://ai.google.dev/api/generate-content).

Kiểm tra hoàn tất sau bổ sung: build Release BE và build/lint FE đạt; 159 kiểm thử BE, 51 kiểm thử FE đạt. Giao diện component thật đã được xem trong trình duyệt với dữ liệu tổng hợp: khối cảnh báo đỏ, nhãn tiếng Việt, lý do và bằng chứng từ ảnh hiển thị đầy đủ. Không chạy lại AI trên ảnh thật của người dùng để phục vụ kiểm thử.

Kết luận: Gemini có gọi và trả kết quả thật; giữ chức năng theo yêu cầu nhóm, sửa hợp đồng đầu ra thay vì bỏ AI.

## Nguyên nhân và sửa lỗi

Trước sửa, 3 nội dung tổng hợp gửi trực tiếp qua `GeminiService.CheckContentAsync` đều bị từ chối: `InvalidModerationStatus` hoặc `InvalidModerationResponse`. Một phản hồi thật dùng `status=NotFlagged`, `checkedScope` dạng mảng; backend yêu cầu Passed/Flagged/Partial và chuỗi. Prompt cũ chỉ nêu tên thuộc tính, không định nghĩa đầy đủ kiểu và giá trị.

Đã thêm `ModerationOutputSchema` trong `Infrastructure/AI/Gemini/Contracts`, ràng buộc enum và kiểu trường bằng `generationConfig.responseSchema` cho generateContent của model đang cấu hình. Schema chỉ áp dụng kiểm duyệt, không ảnh hưởng chat/scan. Prompt định nghĩa trạng thái, giới hạn độ dài, yêu cầu bằng chứng nguyên văn và xem nội dung bài là dữ liệu không đáng tin cậy. Server vẫn kiểm tra trạng thái, kiểu, độ dài, trích đoạn và tính nhất quán trước khi lưu; đầu ra sai không được đổi thành Passed.

Ngân sách đầu ra kiểm duyệt là 2048 token, tắt thinking với Gemini 2.5 JSON như cấu hình hiện hành. Không đổi model hoặc in khóa API. Tài liệu tham khảo: [Google — GenerationConfig/responseSchema](https://ai.google.dev/api/generate-content#v1beta.GenerationConfig).

Endpoint tương thích `POST /api/moderation/submissions` không hỗ trợ tạo submission bài viết rời khỏi bản nháp; đã thay 503 “chưa tích hợp” thành 400 hướng dẫn đúng luồng `/api/me/articles/{id}/submit`.

## Kết quả thật

Model đang dùng: `gemini-2.5-flash`. Ba bài tổng hợp không chứa dữ liệu riêng tư:

- Hướng dẫn luộc rau: Passed.
- Tuyên bố ăn chay chữa khỏi mọi bệnh và khuyên bỏ thuốc: Flagged, HealthClaim, High, có trích đoạn đúng văn bản.
- Bài luộc rau có ảnh tham chiếu: Partial; nêu rõ ảnh chưa được phân tích, không giả đã xem ảnh.

Cả ba kết quả qua được validation Domain. Kiểm thử end-to-end trên database SQL riêng chạy 25 kiểm tra với worker/Gemini thật: tạo nháp qua HTTP → gửi bài → worker ghi kết quả SQL → owner/Admin đọc đúng trạng thái → chỉ sau quyết định Admin mới xuất bản. Database kiểm thử được xóa khi kết thúc; không tạo bài mẫu trong database ứng dụng và không sửa trạng thái lịch sử của bài thật.

Kiểm tra hồi quy: build Release thành công, 150 unit tests và 339 kiểm tra tích hợp qua. Kiểm thử HTTP giả lập còn kiểm tra schema gửi đi, status lạ, phạm vi dạng mảng, kết quả mâu thuẫn và bằng chứng không có thật đều bị từ chối.

## Giới hạn và chạy lại

AI chỉ đọc tiêu đề/nội dung văn bản trong luồng này. Ảnh được ghi nhận chưa kiểm tra, Admin xem trực tiếp. Passed không phải tự duyệt hoặc chứng nhận nội dung an toàn. Khi provider/network/schema lỗi, giữ Failed và cho Admin kiểm tra trực tiếp theo nghiệp vụ hiện hành.

Các bản cũ Failed đã được Admin xuất bản/gỡ vẫn giữ lịch sử thực tế, không tự đổi trạng thái hoặc gửi lại nội dung riêng tư. Bài gửi mới dùng hợp đồng đã sửa.

Kiểm tra unit và build: `dotnet test backend/Backend.sln -c Release`, `dotnet build backend/Backend.sln -c Release`. Live test chỉ chạy khi chủ động gọi `dotnet run --project backend/tests/IntegrationTests -c Release -- --moderation-live-only`, với `Gemini__ApiKey` cấu hình qua môi trường. Chế độ này gọi Gemini thật, có dùng quota, chỉ tạo nội dung tổng hợp trong database ngẫu nhiên. Không đưa khóa vào tham số command line hoặc log.
