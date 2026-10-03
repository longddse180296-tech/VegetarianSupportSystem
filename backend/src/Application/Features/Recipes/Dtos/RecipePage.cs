namespace Application.Features.Recipes;

public sealed record RecipePage(IReadOnlyList<RecipeSummary> Items, int PageNumber, int PageSize, int TotalCount);
