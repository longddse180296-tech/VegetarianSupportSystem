namespace Application.Features.Categories;

public sealed record CategoryPage(IReadOnlyList<CategoryResponse> Items, int PageNumber, int PageSize, int TotalCount);
