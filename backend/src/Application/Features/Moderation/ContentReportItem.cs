// Chức năng: kiểm duyệt nội dung và kết quả kiểm tra AI. Tầng Application điều phối nghiệp vụ, kiểm tra dữ liệu và định nghĩa hợp đồng với hạ tầng.
using Domain.Enums;

namespace Application.Features.Moderation;

// ContentReportEntry: thông tin chi tiết một lượt báo cáo của người dùng trong nhóm nội dung.
public sealed record ContentReportEntry(Guid Id, Guid SubmissionId, int ContentVersion,
    string ReporterId, string? ReporterName, ContentReportReason Reason, string? Details,
    ContentReportStatus Status, DateTimeOffset CreatedAt, DateTimeOffset? ResolvedAt,
    string? ResolvedBy, string? ResolutionNote);

// ContentReportItem: định nghĩa dữ liệu trao đổi của tính năng.
public sealed record ContentReportItem(Guid Id, ModeratedContentType TargetType, Guid TargetId,
    Guid SubmissionId, string ContentTitle, int ContentVersion, string ReporterId,
    ContentReportReason Reason, string? Details, ContentReportStatus Status, DateTimeOffset CreatedAt,
    DateTimeOffset? ResolvedAt, string? ResolvedBy, string? ResolutionNote, int PendingReporterCount)
{
    public string? ReporterName { get; init; }
    public int TotalReportCount { get; init; } = 1;
    public IReadOnlyList<ContentReportEntry> Reports { get; init; } = [];
}
