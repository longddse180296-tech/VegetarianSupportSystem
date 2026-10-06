namespace Application.Features.Categories;

public sealed record CategoryResponse(
    Guid Id,
    string Name,
    string? Description,
    bool IsActive, DateTimeOffset CreatedAt, DateTimeOffset? UpdatedAt);
