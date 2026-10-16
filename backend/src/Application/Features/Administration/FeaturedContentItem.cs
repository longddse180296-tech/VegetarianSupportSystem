namespace Application.Features.Administration;

public sealed record FeaturedContentItem(Guid Id, string ContentType, string Title,
    string? Description, string? ImageUrl, bool IsPinned, string? AuthorName,
    DateTimeOffset? PublishedAt, long? ViewCount, string? Address, IReadOnlyList<string> DietaryTypes);
