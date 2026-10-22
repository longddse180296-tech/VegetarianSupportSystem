namespace Application.Features.Administration;

public sealed record FeedbackPage(IReadOnlyList<FeedbackItem> Items, int Total, int Page, int PageSize);
