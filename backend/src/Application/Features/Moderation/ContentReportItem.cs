using Domain.Enums;

namespace Application.Features.Moderation;

public sealed record ContentReportItem(Guid Id, ModeratedContentType TargetType, Guid TargetId,
    Guid SubmissionId, string ContentTitle, int ContentVersion, string ReporterId,
    ContentReportReason Reason, string? Details, ContentReportStatus Status, DateTimeOffset CreatedAt,
    DateTimeOffset? ResolvedAt, string? ResolvedBy, string? ResolutionNote, int PendingReporterCount);
