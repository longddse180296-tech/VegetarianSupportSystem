using System.ComponentModel.DataAnnotations;

namespace Application.Features.Pantry;

public sealed class PantryRecipeSuggestionQuery
{
    [Range(1, 50)]
    public int Limit { get; init; } = 20;
}
