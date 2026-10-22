namespace Application.Features.Moderation;

public sealed record ReportableContent(Guid SubmissionId, string Title, int Version);
