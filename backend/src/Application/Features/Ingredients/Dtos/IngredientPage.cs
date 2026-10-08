namespace Application.Features.Ingredients;

public sealed record IngredientPage(IReadOnlyList<IngredientResponse> Items, int PageNumber, int PageSize, int TotalCount);
