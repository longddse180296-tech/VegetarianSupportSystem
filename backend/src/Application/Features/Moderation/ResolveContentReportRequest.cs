using Domain.Enums;

namespace Application.Features.Moderation;

public sealed record ResolveContentReportRequest(ContentReportStatus Status, string? Note);
