// Định nghĩa dữ liệu về thông tin nội dung đích cần đối chiếu trước khi nhận báo cáo để các bước xử lý dùng chung.
namespace Application.Features.Moderation;

// ReportableContent: định nghĩa dữ liệu trao đổi của tính năng.
public sealed record ReportableContent(Guid SubmissionId, string Title, int Version);
