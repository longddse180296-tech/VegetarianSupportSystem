using Domain.Enums;

namespace Domain.Entities;

public sealed class ContentReport
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public ModeratedContentType TargetType { get; set; }
    public Guid TargetId { get; set; }
    public Guid SubmissionId { get; set; }
    public string ContentTitle { get; set; } = string.Empty;
    public int ContentVersion { get; set; }
    public string ReporterId { get; set; } = string.Empty;
    public ContentReportReason Reason { get; set; }
    public string? Details { get; set; }
    public ContentReportStatus Status { get; private set; } = ContentReportStatus.Pending;
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset? ResolvedAt { get; private set; }
    public string? ResolvedBy { get; private set; }
    public string? ResolutionNote { get; private set; }
    public byte[] RowVersion { get; private set; } = [];

    public void Resolve(ContentReportStatus status, string adminId, string note, DateTimeOffset now)
    {
        if (Status != ContentReportStatus.Pending)
            throw new InvalidOperationException("Báo cáo đã được xử lý.");
        if (status is not (ContentReportStatus.Resolved or ContentReportStatus.Dismissed) ||
            string.IsNullOrWhiteSpace(adminId) || string.IsNullOrWhiteSpace(note) || note.Trim().Length > 2000)
            throw new ArgumentException("Cần chọn kết quả và nhập ghi chú xử lý từ 1 đến 2000 ký tự.");
        Status = status;
        ResolvedBy = adminId;
        ResolutionNote = note.Trim();
        ResolvedAt = now;
    }
}
