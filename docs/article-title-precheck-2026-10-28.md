# Tiền kiểm tiêu đề bài viết — 28/10/2026

Theo yêu cầu nhóm, chỉ đối chiếu với bài khác đã được Admin duyệt và đang công khai tại thời điểm gửi. Bản nháp/chờ duyệt/từ chối/đã gỡ không giữ chỗ tiêu đề; sửa cùng bài không tự trùng với bản công khai của chính nó. Chuẩn hóa Unicode Form C, hoa/thường và khoảng trắng; giữ dấu tiếng Việt/dấu câu.

Luồng: lưu nháp → gửi bài → kiểm tra trùng → nếu trùng, lưu phiên bản Rejected + AiStatus NotSubmitted + SystemRejectionReason; nếu không trùng, AI kiểm tra văn bản/ảnh → Admin quyết định. Phiên bản từ chối vẫn nằm trong danh sách quản lý của User/Admin, có cảnh báo đỏ và lý do riêng; không tạo kết quả AI hoặc quyết định Admin giả, không tiêu thụ quota Gemini. Tác giả đổi tiêu đề và gửi phiên bản mới được; lịch sử cũ giữ nguyên. Hai bài chưa công khai cùng tiêu đề đều được qua bước tiền kiểm theo phạm vi nhóm chốt.

Domain: `ArticleTitleRules` và `ModerationSubmission.RejectDuplicateTitle`. Application: `ArticleService.SubmitAsync` điều phối kiểm tra trong transaction; `ToMine` trả lý do mới. Infrastructure: `ArticleRepository` chỉ đọc chuỗi tiêu đề của bản công khai, không tải nội dung/ảnh; migration `20261027170327_AddArticleSystemRejectionReason` thêm cột nullable, không sửa lịch sử. API DTO moderation và ArticleVersionInfo thêm trường `systemRejectionReason`. FE: ArticleEditorPage không hiện thông báo gửi thành công/chờ AI khi đã tự từ chối; MyArticlesPage và AiReview hiển thị lý do đỏ. Contract: `contracts/articles.md`.

Đã đạt 36 kiểm tra HTTP/SQL/worker trong database kiểm thử riêng: trùng chuẩn hóa với bài đã duyệt, bài chờ duyệt không chặn tên, giữ lý do trong danh sách User/Admin, không gọi AI khi trùng, không duyệt thẳng bản bị từ chối, đổi tên gửi lại, giữ tên khi sửa cùng bài, nháp không giữ chỗ và gửi đồng thời. Provider đếm trong test chứng minh số lượt AI; không gọi Gemini thật cho kiểm thử tiền kiểm. Database kiểm thử được dọn sau chạy. Backend 169 unit tests, frontend 52 tests và lint/build đạt.

Database ứng dụng đã được sao lưu COPY_ONLY/CHECKSUM trước migration ở `.local/db-backups/VegetarianSupport_before_title_precheck_20261028.bak`. Không tạo bài mẫu, không thay kết quả hoặc trạng thái bài thật.
