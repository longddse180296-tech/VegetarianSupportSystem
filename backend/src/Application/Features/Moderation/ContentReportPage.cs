namespace Application.Features.Moderation;

public sealed record ContentReportPage(IReadOnlyList<ContentReportItem> Items, int Total, int Page, int PageSize);
