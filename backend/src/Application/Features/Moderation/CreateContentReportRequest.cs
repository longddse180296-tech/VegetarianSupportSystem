using Domain.Enums;

namespace Application.Features.Moderation;

public sealed record CreateContentReportRequest(ModeratedContentType TargetType, Guid TargetId,
    ContentReportReason Reason, string? Details);
