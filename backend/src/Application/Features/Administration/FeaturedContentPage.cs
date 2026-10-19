namespace Application.Features.Administration;

public sealed record FeaturedContentPage(IReadOnlyList<FeaturedContentItem> Items, int TotalCount, int Page, int PageSize);
