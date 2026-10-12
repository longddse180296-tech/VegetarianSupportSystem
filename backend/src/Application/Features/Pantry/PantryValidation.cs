using System.ComponentModel.DataAnnotations;
using Application.Common.Validation;

namespace Application.Features.Pantry;

internal static class PantryValidation
{
    public static void Validate(PantryItemRequest request)
    {
        RequestValidation.Validate(request);
        var hasIngredient = request.IngredientId.HasValue && request.IngredientId.Value != Guid.Empty;
        var hasName = !string.IsNullOrWhiteSpace(request.Name);
        if (hasIngredient == hasName)
            Fail(nameof(request.IngredientId), "Provide exactly one catalog ingredient ID or an unmatched ingredient name.");
        if (request.IngredientId == Guid.Empty)
            Fail(nameof(request.IngredientId), "Ingredient ID must not be empty.");
        if (hasName && request.Name!.Trim().Length > 120)
            Fail(nameof(request.Name), "Ingredient name must be at most 120 characters.");
        if (request.Quantity.HasValue != !string.IsNullOrWhiteSpace(request.Unit))
            Fail(nameof(request.Quantity), "Quantity and unit must be supplied together.");
    }

    public static void Validate(PantryRecipeSuggestionQuery query) => RequestValidation.Validate(query);

    public static void Fail(string member, string message) =>
        throw new ValidationException(new ValidationResult(message, [member]), null, null);
}
