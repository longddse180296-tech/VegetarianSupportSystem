namespace Application.Features.Favorites;

public sealed record FavoritePage(
    IReadOnlyList<FavoriteResponse> Items,
    int TotalCount,
    int PageNumber,
    int PageSize);
